#!/usr/bin/env python3
"""Slicer v2: valley-cut grid detection + largest-component cleanup.

Grid lines are chosen at alpha-projection valleys near the nominal thirds
(AI characters nearly touch, so zero-gap band detection fails). Row count
(3 vs 4) is chosen by total cut cost. Each cell keeps only alpha components
>= 8% of its largest component (kills neighbor bleed slivers at the cuts).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

def clean_alpha_np(im, thresh=8):
    im = im.convert("RGBA")
    arr = np.array(im)
    arr[arr[..., 3] <= thresh] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")

def _smooth(v, k=21):
    ker = np.ones(k) / k
    return np.convolve(v, ker, mode="same")

def _valley_cut(sums, nominal, win):
    lo = max(1, int(nominal - win)); hi = min(len(sums) - 1, int(nominal + win))
    seg = sums[lo:hi]
    return lo + int(np.argmin(seg)), float(seg.min())

def grid_cuts(alpha, ncols=3):
    """Returns (col_cuts, row_cuts, layout, cost3, cost4). Cuts are interior
    boundary coordinates; full extent lists include 0 and size."""
    H, W = alpha.shape
    colsum = (alpha > 8).sum(axis=0).astype(float)
    rowsum = (alpha > 8).sum(axis=1).astype(float)
    cs = _smooth(colsum); rs = _smooth(rowsum)
    win_c = W * 0.10
    col_cuts = [0]
    for k in range(1, ncols):
        cut, _ = _valley_cut(cs, k * W / ncols, win_c)
        col_cuts.append(cut)
    col_cuts.append(W)
    def row_layout(nrows):
        cuts = [0]; cost = 0.0
        for k in range(1, nrows):
            cut, c = _valley_cut(rs, k * H / nrows, H * 0.10)
            cuts.append(cut); cost += c
        cuts.append(H)
        # normalize: cost per cut relative to mean in-character density
        return cuts, cost / max(1, (nrows - 1)) / max(1.0, float((alpha > 8).sum()) / H)
    cuts3, cost3 = row_layout(3)
    cuts4, cost4 = row_layout(4)
    if cost4 < cost3 * 0.6:
        return col_cuts, cuts4, "3x4", cost3, cost4
    return col_cuts, cuts3, "3x3", cost3, cost4

def largest_components(cell_im, keep_ratio=0.08):
    arr = np.array(cell_im)
    a = arr[..., 3] > 8
    if not a.any():
        return cell_im
    lab, n = ndimage.label(a)
    if n <= 1:
        return cell_im
    sizes = ndimage.sum(a, lab, range(1, n + 1))
    keep = set((np.where(sizes >= sizes.max() * keep_ratio)[0] + 1).tolist())
    keep.add(int(np.argmax(sizes)) + 1)
    mask = np.isin(lab, list(keep))
    arr[~mask] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")

def fit_frame(cell, size=48, fit=44, bottom=46):
    bbox = cell.getchannel("A").getbbox()
    frame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if not bbox:
        return frame
    crop = cell.crop(bbox)
    scale = min(fit / crop.width, fit / crop.height)
    nw, nh = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    frame.paste(crop, ((size - nw) // 2, bottom - nh), crop)
    return frame

def slice_raw2(raw_path):
    im = clean_alpha_np(Image.open(raw_path))
    a = np.array(im.getchannel("A"))
    col_cuts, row_cuts, layout, c3, c4 = grid_cuts(a)
    nrows = 4 if layout == "3x4" else 3
    rows_cells = []
    for r in range(nrows):
        row = []
        for c in range(3):
            cell = im.crop((col_cuts[c], row_cuts[r], col_cuts[c + 1], row_cuts[r + 1]))
            row.append(fit_frame(largest_components(cell)))
        rows_cells.append(row)
    if nrows == 4:
        order = rows_cells
    else:
        left = rows_cells[1]
        right = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in left]
        order = [rows_cells[0], left, right, rows_cells[2]]
    sheet = Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    for r, rowcells in enumerate(order):
        for c, fr in enumerate(rowcells):
            sheet.paste(fr, (c * 48, r * 48), fr)
    return sheet, {"layout": layout, "col_cuts": col_cuts, "row_cuts": row_cuts,
                   "cost3": round(c3, 3), "cost4": round(c4, 3)}

def grid_cuts2(alpha):
    """Choose column count (3 or 4) and row count (3 or 4) by valley cost."""
    H, W = alpha.shape
    colsum = _smooth((alpha > 8).sum(axis=0).astype(float))
    rowsum = _smooth((alpha > 8).sum(axis=1).astype(float))
    def cuts_for(sums, n, size):
        cuts = [0]; cost = 0.0
        for k in range(1, n):
            cut, c = _valley_cut(sums, k * size / n, size * 0.09)
            cuts.append(cut); cost += c
        cuts.append(size)
        return cuts, cost / (n - 1)
    cc3, cco3 = cuts_for(colsum, 3, W)
    cc4, cco4 = cuts_for(colsum, 4, W)
    rc3, rco3 = cuts_for(rowsum, 3, H)
    rc4, rco4 = cuts_for(rowsum, 4, H)
    density = max(1.0, float((alpha > 8).sum()) / H)
    ncols = 4 if cco4 / density < (cco3 / density) * 0.6 else 3
    nrows = 4 if rco4 / density < (rco3 / density) * 0.6 else 3
    return (cc4 if ncols == 4 else cc3), (rc4 if nrows == 4 else rc3), ncols, nrows

def slice_raw3(raw_path):
    """v3: detects 4-column raws. For 4-col x 3-row raws, uses columns 0..2
    with the standard 3x3 direction mapping (col 3 is a turnaround extra)."""
    im = clean_alpha_np(Image.open(raw_path))
    a = np.array(im.getchannel("A"))
    col_cuts, row_cuts, ncols, nrows = grid_cuts2(a)
    use_cols = [0, 1, 2] if ncols == 4 else [0, 1, 2]
    rows_cells = []
    for r in range(nrows):
        row = []
        for c in use_cols:
            cell = im.crop((col_cuts[c], row_cuts[r], col_cuts[c + 1], row_cuts[r + 1]))
            row.append(fit_frame(largest_components(cell)))
        rows_cells.append(row)
    if nrows == 4:
        order = rows_cells
        layout = f"{ncols}x4"
    else:
        left = rows_cells[1]
        right = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in left]
        order = [rows_cells[0], left, right, rows_cells[2]]
        layout = f"{ncols}x3"
    sheet = Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    for r, rowcells in enumerate(order):
        for c, fr in enumerate(rowcells):
            sheet.paste(fr, (c * 48, r * 48), fr)
    empty = sum(1 for r in range(4) for c in range(3)
                if sheet.crop((c * 48, r * 48, (c + 1) * 48, (r + 1) * 48)).getchannel("A").getbbox() is None)
    return sheet, {"layout": layout, "ncols": ncols, "nrows": nrows, "empty_frames": empty}

def _simple_bands(counts, thr=20, min_gap=12):
    out, on, s = [], False, 0
    for i, x in enumerate(counts):
        if x > thr and not on:
            s, on = i, True
        elif x <= thr and on:
            out.append([s, i]); on = False
    if on:
        out.append([s, len(counts)])
    merged = []
    for b in out:
        if merged and b[0] - merged[-1][1] < min_gap:
            merged[-1][1] = b[1]
        else:
            merged.append(b)
    return [tuple(b) for b in merged if b[1] - b[0] >= 40]

def slice_raw4(raw_path):
    """v4: prefer clean alpha bands for grid detection (catches 4-col raws);
    fall back to valley cuts. 4-col raws use cols 0..2."""
    im = clean_alpha_np(Image.open(raw_path))
    a = np.array(im.getchannel("A"))
    cb = _simple_bands((a > 8).sum(axis=0))
    rb = _simple_bands((a > 8).sum(axis=1))
    if len(cb) in (3, 4) and len(rb) in (3, 4):
        col_cuts = [0] + [(cb[i][1] + cb[i + 1][0]) // 2 for i in range(len(cb) - 1)] + [a.shape[1]]
        row_cuts = [0] + [(rb[i][1] + rb[i + 1][0]) // 2 for i in range(len(rb) - 1)] + [a.shape[0]]
        ncols, nrows, method = len(cb), len(rb), "bands"
    else:
        col_cuts, row_cuts, layout, _, _ = grid_cuts(a)
        ncols, nrows, method = 3, (4 if layout == "3x4" else 3), "valley"
    rows_cells = []
    for r in range(nrows):
        row = []
        for c in range(3):
            cell = im.crop((col_cuts[c], row_cuts[r], col_cuts[c + 1], row_cuts[r + 1]))
            row.append(fit_frame(largest_components(cell)))
        rows_cells.append(row)
    if nrows == 4:
        order = rows_cells
    else:
        left = rows_cells[1]
        right = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in left]
        order = [rows_cells[0], left, right, rows_cells[2]]
    sheet = Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    for r, rowcells in enumerate(order):
        for c, fr in enumerate(rowcells):
            sheet.paste(fr, (c * 48, r * 48), fr)
    empty = sum(1 for r in range(4) for c in range(3)
                if sheet.crop((c * 48, r * 48, (c + 1) * 48, (r + 1) * 48)).getchannel("A").getbbox() is None)
    return sheet, {"layout": f"{ncols}x{nrows}", "method": method, "empty_frames": empty,
                   "col_bands": len(cb), "row_bands": len(rb)}
