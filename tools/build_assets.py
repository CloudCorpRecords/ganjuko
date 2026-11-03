"""Provenance sweep: original replacement assets for the starter areas.

Builds drop-in replacements (same filename, same dimensions/geometry) for
the stock MZ RTP files that are VISIBLE in Wakaba Town / Lab / Route 1:
  Window.png, GameOver.png, Balloon.png, ButtonSet.png (system),
  !Crystal.png, !Chest.png, !Other1.png (character object sheets),
  IconSet.png (only the cells the starter areas can display are redrawn),
  Goddess_of_death.png (byte copy of our own Ganjuko_Grimmorth battler).

All art is drawn procedurally here (PIL) - original pixels, no stock data.
IconSet is the one exception: it is loaded so untouched cells pass through
(they are not visible in the starter areas; see the sweep report).

Usage: python3 build_assets.py <outdir> [target ...]
"""
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/prov-out"
TARGETS = sys.argv[2:] or ["all"]
os.makedirs(OUT, exist_ok=True)
random.seed(20261102)

FONT_CANDIDATES = {
    "bold": ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "C:\\Windows\\Fonts\\arialbd.ttf"],
    "serif": ["/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
              "C:\\Windows\\Fonts\\georgiab.ttf"],
}


def font(kind, size):
    for path in FONT_CANDIDATES[kind]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(size, top, bottom):
    w, h = size
    im = Image.new("RGB", size)
    d = ImageDraw.Draw(im)
    for y in range(h):
        d.line([(0, y), (w, y)], fill=lerp(top, bottom, y / max(1, h - 1)))
    return im


def stars(d, box, n, seed=7, maxr=2):
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    for _ in range(n):
        x = rnd.uniform(x0, x1)
        y = rnd.uniform(y0, y1)
        r = rnd.uniform(0.5, maxr)
        b = rnd.randint(120, 255)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(b, b, min(255, b + 20)))
        if r > 1.4:
            d.line([(x - r * 2.4, y), (x + r * 2.4, y)], fill=(90, 90, 130))
            d.line([(x, y - r * 2.4), (x, y + r * 2.4)], fill=(90, 90, 130))


# ---------------------------------------------------------------- Window.png
def build_window():
    im = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # background tile (0,0,96,96): deep indigo gradient + faint stars
    bg = vgrad((96, 96), (18, 18, 46), (26, 24, 66)).convert("RGBA")
    im.paste(bg, (0, 0))
    stars(d, (2, 2, 94, 94), 26, seed=11, maxr=1.1)
    # frame region (96,0,96,96): double-rule border, amber outer / ice inner
    def frame_ring(x0, y0, x1, y1):
        d.rectangle([x0 + 1, y0 + 1, x1 - 2, y1 - 2], outline=(224, 168, 74, 255), width=3)
        d.rectangle([x0 + 7, y0 + 7, x1 - 8, y1 - 8], outline=(150, 168, 232, 255), width=2)
    frame_ring(96, 0, 192, 96)
    # corner diamonds (inside the 24x24 corner cells)
    for cx, cy in [(108, 12), (180, 12), (108, 84), (180, 84)]:
        d.polygon([(cx, cy - 6), (cx + 6, cy), (cx, cy + 6), (cx - 6, cy)], fill=(240, 196, 96, 255))
        d.polygon([(cx, cy - 2.5), (cx + 2.5, cy), (cx, cy + 2.5), (cx - 2.5, cy)], fill=(255, 240, 200, 255))
    # scroll arrows: up (132,24,24,12), down (132,60,24,12)
    d.polygon([(144, 26), (154, 34), (134, 34)], fill=(235, 225, 200, 255))
    d.polygon([(144, 70), (154, 62), (134, 62)], fill=(235, 225, 200, 255))
    # cursor (96,96,48,48): soft fill + amber ring
    cur = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cur)
    cd.rounded_rectangle([1, 1, 46, 46], radius=7, fill=(190, 200, 255, 46))
    cd.rounded_rectangle([1, 1, 46, 46], radius=7, outline=(255, 208, 110, 255), width=3)
    cd.rounded_rectangle([4, 4, 43, 43], radius=5, outline=(255, 244, 214, 160), width=1)
    im.paste(cur, (96, 96), cur)
    # pause sign (144,96): 2x2 frames of 24x24, chevron bouncing down
    for i, (ox, oy) in enumerate([(144, 96), (168, 96), (144, 120), (168, 120)]):
        dy = [0, 1, 2, 1][i]
        d.polygon([(ox + 5, oy + 8 + dy), (ox + 12, oy + 15 + dy), (ox + 19, oy + 8 + dy),
                   (ox + 19, oy + 12 + dy), (ox + 12, oy + 19 + dy), (ox + 5, oy + 12 + dy)],
                  fill=(240, 196, 96, 255))
    # text-palette block (96,144,96,48): MZ ColorManager samples the CENTER of
    # each 12x12 cell -> index n at (96+(n%8)*12, 144+(n//8)*12). FR3/D10: the
    # original generator never drew this region, so every palette color sampled
    # transparent and all default text rendered #000000. Solid designed colors,
    # WCAG-checked against the dark indigo skin (see fix3/RECON.md).
    PALETTE = ["#FFFFFF","#8FCBFF","#FF9A9A","#9AFFB0","#7AE0FF","#D8B4FF","#FFE89A","#C9CED6",
               "#FF8585","#6BFF8F","#FFB26B","#6BE8FF","#FF8AE2","#C48FFF","#FFD24A","#FFFFFF",
               "#FFC46B","#FF9A5C","#FF7A7A","#6A707E","#7DFF6B","#D2FF6B","#6BB8FF","#6BE8FF",
               "#FF7AA8","#FFB26B","#C3C9D6","#FFF2B0","#B0FFD8","#6BFF8F","#B0D8FF","#FFB0E8"]
    for n, h in enumerate(PALETTE):
        rgb = tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)
        cx, cy = 96 + (n % 8) * 12, 144 + (n // 8) * 12
        d.rectangle([cx, cy, cx + 11, cy + 11], fill=rgb)
    im.save(os.path.join(OUT, "Window.png"))


# --------------------------------------------------------------- GameOver.png
def build_gameover():
    W, H = 816, 624
    im = vgrad((W, H), (5, 5, 16), (10, 8, 30)).convert("RGBA")
    d = ImageDraw.Draw(im)
    stars(d, (0, 0, W, H), 210, seed=23, maxr=1.7)
    # soft central glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W / 2 - 330, H / 2 - 90, W / 2 + 330, H / 2 + 90], fill=(70, 60, 140, 90))
    im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(60)))
    d = ImageDraw.Draw(im)
    # luminous band across the middle
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    for y in range(H // 2 - 52, H // 2 + 52):
        t = 1 - abs(y - H / 2) / 52.0
        bd.line([(0, y), (W, y)], fill=(46, 52, 120, int(150 * t)))
    im = Image.alpha_composite(im, band.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(im)
    # a thin amber rule above and below the text
    d.line([(120, H / 2 - 58), (W - 120, H / 2 - 58)], fill=(224, 168, 74, 200), width=2)
    d.line([(120, H / 2 + 58), (W - 120, H / 2 + 58)], fill=(224, 168, 74, 200), width=2)
    # text
    f = font("serif", 64)
    txt = "G A M E   O V E R"
    tw = d.textlength(txt, font=f)
    d.text(((W - tw) / 2 + 2, H / 2 - 34 + 2), txt, font=f, fill=(0, 0, 0, 160))
    d.text(((W - tw) / 2, H / 2 - 34), txt, font=f, fill=(238, 232, 255, 255))
    # a few ember motes drifting
    rnd = random.Random(5)
    for _ in range(26):
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        r = rnd.uniform(0.6, 1.8)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(240, 190, 100, rnd.randint(70, 160)))
    im.convert("RGB").save(os.path.join(OUT, "GameOver.png"))


# ---------------------------------------------------------------- Balloon.png
def bubble(draw, cx, cy, scale, body=(250, 250, 252, 255), edge=(120, 124, 160, 255)):
    w, h = 40 * scale, 32 * scale
    draw.rounded_rectangle([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], radius=9 * scale,
                           fill=body, outline=edge, width=max(1, int(2 * scale)))
    # little tail at the bottom
    tx = cx
    draw.polygon([(tx - 4 * scale, cy + h / 2 - 1), (tx + 4 * scale, cy + h / 2 - 1),
                  (tx, cy + h / 2 + 5 * scale)], fill=body, outline=edge)


def glyph(draw, kind, cx, cy, s):
    """Draw one balloon glyph centered at (cx, cy); s = nominal size in px."""
    if kind == "!":
        f = font("bold", int(s * 1.5))
        draw.text((cx, cy), "!", font=f, fill=(230, 80, 60, 255), anchor="mm")
    elif kind == "?":
        f = font("bold", int(s * 1.4))
        draw.text((cx, cy), "?", font=f, fill=(70, 110, 220, 255), anchor="mm")
    elif kind in ("note", "note2"):
        c = (150, 70, 200, 255)
        # hand-drawn eighth note(s): ellipse head + stem + flag
        def one_note(ox, head_y):
            draw.ellipse([cx + ox - s * 0.30, head_y - s * 0.16, cx + ox + s * 0.08, head_y + s * 0.16], fill=c)
            draw.line([(cx + ox + s * 0.06, head_y - s * 0.02), (cx + ox + s * 0.06, head_y - s * 0.62)],
                      fill=c, width=max(2, int(s * 0.14)))
            draw.polygon([(cx + ox + s * 0.06, head_y - s * 0.62), (cx + ox + s * 0.34, head_y - s * 0.48),
                          (cx + ox + s * 0.06, head_y - s * 0.34)], fill=c)
        if kind == "note":
            one_note(0, cy + s * 0.36)
        else:
            one_note(-s * 0.30, cy + s * 0.40)
            one_note(s * 0.30, cy + s * 0.22)
    elif kind == "heart":
        r = s * 0.52
        draw.polygon([(cx, cy + r), (cx - r, cy - r * 0.25), (cx - r * 0.45, cy - r),
                      (cx, cy - r * 0.35), (cx + r * 0.45, cy - r), (cx + r, cy - r * 0.25)],
                     fill=(235, 70, 100, 255))
    elif kind == "anger":
        c = (225, 60, 40, 255)
        for dx, dy in [(-0.4, -0.4), (0.4, -0.4), (-0.4, 0.4), (0.4, 0.4)]:
            ex, ey = cx + dx * s, cy + dy * s
            draw.line([(cx, cy), (ex, ey)], fill=c, width=max(2, int(s * 0.22)))
            draw.line([(ex - s * 0.16, ey), (ex + s * 0.16, ey)], fill=c, width=max(2, int(s * 0.18)))
            draw.line([(ex, ey - s * 0.16), (ex, ey + s * 0.16)], fill=c, width=max(2, int(s * 0.18)))
    elif kind == "sweat":
        draw.polygon([(cx, cy - s * 0.7), (cx + s * 0.42, cy + s * 0.15), (cx + s * 0.3, cy + s * 0.55),
                      (cx, cy + s * 0.7), (cx - s * 0.3, cy + s * 0.55), (cx - s * 0.42, cy + s * 0.15)],
                     fill=(90, 170, 240, 255))
        draw.arc([cx - s * 0.95, cy - s * 0.5, cx - s * 0.35, cy + s * 0.3], 300, 60, fill=(90, 170, 240, 255), width=2)
    elif kind == "spiral":
        for i in range(26):
            t = i / 25.0 * math.pi * 5
            r = s * 0.62 * (i / 25.0)
            x, y = cx + r * math.cos(t), cy + r * math.sin(t)
            draw.ellipse([x - 1.6, y - 1.6, x + 1.6, y + 1.6], fill=(110, 110, 190, 255))
    elif kind == "silence":
        f = font("bold", int(s * 1.1))
        draw.text((cx, cy - s * 0.2), ". . .", font=f, fill=(110, 116, 150, 255), anchor="mm")
    elif kind == "bulb":
        draw.ellipse([cx - s * 0.42, cy - s * 0.62, cx + s * 0.42, cy + s * 0.22], fill=(250, 205, 70, 255),
                     outline=(200, 150, 40, 255), width=2)
        draw.rectangle([cx - s * 0.18, cy + s * 0.26, cx + s * 0.18, cy + s * 0.5], fill=(140, 140, 150, 255))
        for a in range(0, 360, 45):
            x1 = cx + math.cos(math.radians(a)) * s * 0.58
            y1 = cy - s * 0.2 + math.sin(math.radians(a)) * s * 0.58
            x2 = cx + math.cos(math.radians(a)) * s * 0.78
            y2 = cy - s * 0.2 + math.sin(math.radians(a)) * s * 0.78
            draw.line([(x1, y1), (x2, y2)], fill=(250, 190, 60, 255), width=2)
    elif kind == "zzz":
        f = font("bold", int(s * 0.95))
        draw.text((cx - s * 0.25, cy + s * 0.25), "Z", font=f, fill=(90, 120, 200, 255), anchor="mm")
        f2 = font("bold", int(s * 0.65))
        draw.text((cx + s * 0.3, cy - s * 0.35), "z", font=f2, fill=(120, 150, 220, 255), anchor="mm")
    elif kind in ("star", "sparkle"):
        c = (245, 180, 60, 255) if kind == "star" else (120, 210, 235, 255)
        pts = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            r = s * (0.75 if i % 2 == 0 else 0.32)
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
        draw.polygon(pts, fill=c)
    elif kind == "!!":
        f = font("bold", int(s * 1.4))
        draw.text((cx, cy), "!!", font=f, fill=(230, 80, 60, 255), anchor="mm")
    elif kind == "moon":
        draw.pieslice([cx - s * 0.6, cy - s * 0.6, cx + s * 0.6, cy + s * 0.6], 100, 260, fill=(240, 220, 130, 255))
        draw.pieslice([cx - s * 0.25, cy - s * 0.62, cx + s * 0.85, cy + s * 0.58], 100, 260, fill=(250, 250, 252, 255))


def build_balloon():
    kinds = ["!", "?", "note", "heart", "anger", "sweat", "spiral", "silence",
             "bulb", "zzz", "star", "note2", "sparkle", "!!", "moon"]
    im = Image.new("RGBA", (384, 720), (0, 0, 0, 0))
    env = [0.55, 0.75, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0]
    for row, kind in enumerate(kinds):
        for fr in range(8):
            cell = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
            cd = ImageDraw.Draw(cell)
            sc = env[fr]
            bubble(cd, 24, 22, sc)
            glyph(cd, kind, 24, 21, 15 * sc)
            im.paste(cell, (fr * 48, row * 48), cell)
    im.save(os.path.join(OUT, "Balloon.png"))


# -------------------------------------------------------------- ButtonSet.png
def build_buttonset():
    # 11 blocks of 48px; cold row y=0, hot row y=48.
    im = Image.new("RGBA", (528, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def button(x_blocks, w_blocks, label, kind, hot):
        x = x_blocks * 48
        w = w_blocks * 48
        y = 48 if hot else 0
        body = (86, 96, 140, 255) if not hot else (196, 140, 52, 255)
        edge = (30, 34, 58, 255) if not hot else (120, 78, 26, 255)
        face = Image.new("RGBA", (w - 4, 44), (0, 0, 0, 0))
        fd = ImageDraw.Draw(face)
        fd.rounded_rectangle([0, 0, w - 5, 43], radius=10, fill=body, outline=edge, width=2)
        fd.rounded_rectangle([2, 2, w - 7, 20], radius=8, fill=(255, 255, 255, 28))
        im.paste(face, (x + 2, y + 2), face)
        cx, cy = x + w / 2, y + 24
        g = (240, 242, 250, 255)
        if kind == "x":
            d.line([(cx - 8, cy - 8), (cx + 8, cy + 8)], fill=g, width=5)
            d.line([(cx + 8, cy - 8), (cx - 8, cy + 8)], fill=g, width=5)
        elif kind == "check":
            d.line([(cx - 11, cy + 1), (cx - 3, cy + 9)], fill=g, width=5)
            d.line([(cx - 3, cy + 9), (cx + 12, cy - 9)], fill=g, width=5)
        elif kind == "menu":
            for dy in (-8, 0, 8):
                d.line([(cx - 11, cy + dy), (cx + 11, cy + dy)], fill=g, width=4)
        elif kind in ("up", "down", "up2", "down2", "pageup", "pagedown"):
            # point_up=True -> apex at top (centroid bottom-heavy); False -> apex at bottom.
            point_up = kind.startswith("up") or kind == "pageup"
            double = kind.endswith("2") or kind.startswith("page")
            rows = 2 if double else 1
            half = 9 if double else 10
            for i in range(rows):
                yy = cy + (i - (rows - 1) / 2) * 11
                if point_up:
                    d.polygon([(cx, yy - 6), (cx - half, yy + 5), (cx + half, yy + 5)], fill=g)
                else:
                    d.polygon([(cx, yy + 6), (cx - half, yy - 5), (cx + half, yy - 5)], fill=g)

    layout = [(0, 2, "x"), (2, 1, "pageup"), (3, 1, "pagedown"), (4, 1, "down"),
              (5, 1, "up"), (6, 1, "down2"), (7, 1, "up2"), (8, 2, "check"), (10, 1, "menu")]
    for hot in (False, True):
        for x, w, kind in layout:
            button(x, w, "", kind, hot)
    im.save(os.path.join(OUT, "ButtonSet.png"))


if __name__ == "__main__":
    pass  # dispatch lives at end of file; builders are defined below  # real dispatch is at the end of the file (builders defined below)


# ------------------------------------------------------------- gem drawing
def draw_gem(cell, cx, base_y, w, h, colors, sparkle_phase=0):
    """Faceted upright crystal: pointed top, widest at 40% height, tapered base.
    colors = (dark, mid, light). Drawn into PIL Image `cell` (RGBA)."""
    d = ImageDraw.Draw(cell)
    top = (cx, base_y - h)
    ul = (cx - w / 2, base_y - h * 0.62)
    ur = (cx + w / 2, base_y - h * 0.62)
    bl = (cx - w * 0.30, base_y)
    br = (cx + w * 0.30, base_y)
    mid = (cx, base_y - h * 0.62)
    # shadow
    d.ellipse([cx - w * 0.46, base_y - 4, cx + w * 0.46, base_y + 5], fill=(0, 0, 0, 70))
    # facets
    d.polygon([top, ul, mid], fill=colors[1] + (255,))
    d.polygon([top, mid, ur], fill=colors[2] + (255,))
    d.polygon([ul, bl, mid], fill=colors[0] + (255,))
    d.polygon([mid, bl, br], fill=colors[1] + (255,))
    d.polygon([mid, br, ur], fill=colors[0] + (255,))
    d.line([top, mid], fill=(255, 255, 255, 110), width=1)
    d.line([ul, ur], fill=(255, 255, 255, 90), width=1)
    # sparkle
    if sparkle_phase is not None:
        sx, sy = cx + w * 0.22, base_y - h * 0.78
        r = 4 + (sparkle_phase % 2)
        d.line([(sx - r, sy), (sx + r, sy)], fill=(255, 255, 255, 220), width=1)
        d.line([(sx, sy - r), (sx, sy + r)], fill=(255, 255, 255, 220), width=1)


GEM_COLORS = [
    ((150, 30, 40), (215, 55, 70), (250, 130, 140)),      # 0 ruby
    ((170, 80, 20), (230, 130, 40), (255, 190, 100)),     # 1 amber
    ((170, 130, 20), (235, 185, 55), (255, 225, 140)),    # 2 gold
    ((25, 120, 70), (50, 180, 105), (140, 240, 180)),     # 3 emerald
    ((95, 45, 150), (140, 80, 205), (200, 150, 250)),     # 4 violet
    ((150, 165, 185), (205, 220, 235), (245, 250, 255)),  # 5 ice/clear
    ((20, 130, 150), (45, 185, 205), (150, 235, 245)),    # 6 cyan
    ((30, 65, 165), (55, 105, 220), (145, 180, 255)),     # 7 sapphire
]


def build_crystal():
    # 576x768; frames 48x96; block of index n at x=(n%4)*144, y=(n//4)*384.
    im = Image.new("RGBA", (576, 768), (0, 0, 0, 0))
    for n in range(8):
        bx, by = (n % 4) * 144, (n // 4) * 384
        for pat in range(3):
            for row in range(4):
                cell = Image.new("RGBA", (48, 96), (0, 0, 0, 0))
                draw_gem(cell, 24, 88, 30, 76, GEM_COLORS[n],
                         sparkle_phase=(pat + row) if pat != 1 else None)
                im.paste(cell, (bx + pat * 48, by + row * 96), cell)
    im.save(os.path.join(OUT, "!Crystal.png"))


# --------------------------------------------------------------- chest sheet
def draw_chest(cell, palette, open_state):
    """48x48 chest. open_state 0=closed 1=ajar 2=half 3=open."""
    d = ImageDraw.Draw(cell)
    wood, wood_d, metal, metal_l = palette
    d.ellipse([6, 40, 42, 46], fill=(0, 0, 0, 70))
    # body
    d.rectangle([7, 26, 41, 42], fill=wood + (255,))
    d.rectangle([7, 26, 41, 29], fill=wood_d + (255,))
    for x in (12, 24, 36):
        d.line([(x, 27), (x, 41)], fill=wood_d + (160,), width=1)
    # interior glow when open
    if open_state >= 2:
        d.rectangle([10, 20, 38, 27], fill=(60, 40, 16, 255))
        d.rectangle([12, 21, 36, 26], fill=(255, 190, 80, 255) if open_state == 3 else (210, 140, 60, 255))
    # lid
    if open_state == 0:
        d.pieslice([7, 8, 41, 30], 180, 360, fill=wood + (255,))
        d.rectangle([7, 19, 41, 27], fill=wood + (255,))
        d.arc([7, 8, 41, 30], 180, 360, fill=wood_d + (255,), width=2)
    elif open_state == 1:
        d.pieslice([7, 4, 41, 24], 180, 360, fill=wood + (255,))
        d.rectangle([7, 15, 41, 22], fill=wood + (255,))
        d.rectangle([9, 22, 39, 27], fill=(40, 26, 12, 255))
    else:
        # lid swung up behind
        d.pieslice([8, -6, 40, 14], 180, 360, fill=wood_d + (255,))
        d.rectangle([8, 3, 40, 9], fill=wood_d + (255,))
    # metal bands + lock
    for x in (8, 37):
        d.rectangle([x, 12 if open_state == 0 else 24, x + 3, 42], fill=metal + (255,))
    d.rectangle([21, 24, 27, 31], fill=metal_l + (255,), outline=metal + (255,))
    d.ellipse([23, 27, 25, 29], fill=(40, 30, 10, 255))


CHEST_PALETTES = [
    ((146, 96, 52), (110, 68, 34), (120, 60, 60), (200, 120, 120)),
    ((150, 102, 56), (112, 72, 36), (150, 116, 40), (240, 200, 90)),   # 1 gold-trim (Route 1 capsule)
    ((120, 96, 60), (88, 68, 40), (70, 130, 80), (150, 220, 160)),
    ((120, 96, 60), (88, 68, 40), (70, 100, 170), (150, 190, 240)),
    ((110, 110, 118), (78, 78, 86), (70, 70, 80), (190, 190, 200)),
    ((160, 118, 70), (124, 88, 48), (110, 110, 118), (200, 200, 210)),
    ((96, 66, 40), (66, 44, 26), (90, 90, 100), (170, 170, 185)),
    ((196, 178, 150), (160, 142, 112), (170, 130, 50), (250, 215, 120)),
]


def build_chest():
    # 576x384; blocks 144x192; rows = direction (open progression), cols = pattern.
    im = Image.new("RGBA", (576, 384), (0, 0, 0, 0))
    for n in range(8):
        bx, by = (n % 4) * 144, (n // 4) * 192
        for pat in range(3):
            for row in range(4):
                cell = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
                draw_chest(cell, CHEST_PALETTES[n], row)
                im.paste(cell, (bx + pat * 48, by + row * 48), cell)
    im.save(os.path.join(OUT, "!Chest.png"))


# --------------------------------------------------------------- other sheet
def draw_boulders(cell, base, dark, light):
    d = ImageDraw.Draw(cell)
    d.ellipse([5, 39, 43, 45], fill=(0, 0, 0, 60))
    for (x, y, r) in [(15, 30, 11), (30, 32, 9), (23, 24, 8)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=base + (255,), outline=dark + (255,), width=2)
        d.arc([x - r + 2, y - r + 2, x + r - 3, y + r - 4], 200, 300, fill=light + (220,), width=2)


def draw_stones(cell, shade):
    d = ImageDraw.Draw(cell)
    d.ellipse([8, 38, 40, 44], fill=(0, 0, 0, 60))
    d.ellipse([10, 16, 38, 40], fill=shade + (255,), outline=(60, 60, 70, 255), width=2)
    d.arc([14, 20, 34, 34], 200, 290, fill=(255, 255, 255, 160), width=2)


def draw_pedestal_orb(cell, orb_colors):
    d = ImageDraw.Draw(cell)
    d.polygon([(16, 44), (32, 44), (29, 30), (19, 30)], fill=(105, 100, 115, 255), outline=(60, 58, 70, 255))
    d.rectangle([15, 27, 33, 31], fill=(130, 124, 140, 255))
    draw_gem(cell, 24, 27, 17, 21, orb_colors, sparkle_phase=None)
    d.ellipse([18, 8, 24, 14], fill=(255, 255, 255, 120))


def draw_spikes(cell):
    d = ImageDraw.Draw(cell)
    d.ellipse([6, 40, 42, 45], fill=(0, 0, 0, 60))
    for x, h in [(12, 20), (20, 28), (28, 24), (35, 17)]:
        d.polygon([(x - 4, 42), (x, 42 - h), (x + 4, 42)], fill=(88, 88, 100, 255), outline=(40, 40, 50, 255))
        d.line([(x, 42 - h), (x + 1, 42 - 4)], fill=(170, 170, 185, 200), width=1)


def draw_puff(cell, phase):
    d = ImageDraw.Draw(cell)
    for i, (x, y, r) in enumerate([(16, 30, 7), (26, 24, 9), (33, 31, 6)]):
        a = 150 - i * 25 + phase * 8
        d.ellipse([x - r, y - r, x + r, y + r], outline=(210, 215, 225, max(40, a)), width=2)


def build_other1():
    im = Image.new("RGBA", (576, 384), (0, 0, 0, 0))
    stone_shades = [(196, 198, 205), (150, 152, 160), (96, 98, 108), (226, 228, 232)]
    for n in range(8):
        bx, by = (n % 4) * 144, (n // 4) * 192
        for pat in range(3):
            for row in range(4):
                cell = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
                if n == 0:
                    draw_boulders(cell, (146, 108, 70), (100, 72, 44), (196, 158, 110))
                elif n == 1:
                    draw_boulders(cell, (105, 105, 115), (66, 66, 76), (160, 160, 172))
                elif n == 2:
                    draw_stones(cell, stone_shades[row])
                elif n == 3:
                    draw_pedestal_orb(cell, GEM_COLORS[0])
                elif n == 4:
                    draw_spikes(cell)
                elif n == 5:
                    draw_puff(cell, row)
                elif n == 6:
                    draw_pedestal_orb(cell, GEM_COLORS[7])
                else:
                    draw_pedestal_orb(cell, GEM_COLORS[4])
                im.paste(cell, (bx + pat * 48, by + row * 48), cell)
    im.save(os.path.join(OUT, "!Other1.png"))


# ------------------------------------------------------------------ IconSet
def icon_cell(draw, idx, painter):
    x, y = (idx % 16) * 32, (idx // 16) * 32
    # clear the cell first
    draw.rectangle([x, y, x + 31, y + 31], fill=(0, 0, 0, 0))
    painter(draw, x, y)


def build_iconset(src_path):
    im = Image.open(src_path).convert("RGBA")
    d = ImageDraw.Draw(im)

    def skill_bg(x, y, color):
        d.rounded_rectangle([x + 1, y + 1, x + 30, y + 30], radius=6, fill=color + (255,))

    def p_fire(dr, x, y):
        skill_bg(x, y, (196, 74, 40))
        dr.polygon([(x + 16, y + 5), (x + 23, y + 17), (x + 20, y + 25), (x + 16, y + 28),
                    (x + 12, y + 25), (x + 9, y + 17)], fill=(250, 130, 40, 255))
        dr.polygon([(x + 16, y + 13), (x + 20, y + 20), (x + 16, y + 26), (x + 12, y + 20)],
                   fill=(255, 205, 90, 255))

    def p_volt(dr, x, y):
        skill_bg(x, y, (206, 160, 32))
        dr.polygon([(x + 18, y + 4), (x + 10, y + 18), (x + 15, y + 18), (x + 13, y + 28),
                    (x + 23, y + 13), (x + 17, y + 13)], fill=(255, 240, 150, 255),
                   outline=(120, 84, 10, 255))

    def p_water(dr, x, y):
        skill_bg(x, y, (52, 110, 200))
        dr.polygon([(x + 16, y + 5), (x + 23, y + 18), (x + 21, y + 25), (x + 16, y + 28),
                    (x + 11, y + 25), (x + 9, y + 18)], fill=(140, 205, 250, 255))
        dr.ellipse([x + 12, y + 18, x + 17, y + 24], fill=(230, 248, 255, 200))

    def p_wind(dr, x, y):
        skill_bg(x, y, (64, 168, 158))
        for i, yy in enumerate([11, 17, 23]):
            dr.arc([x + 6 + i * 2, y + yy - 5, x + 26, y + yy + 5], 300, 130,
                   fill=(235, 255, 250, 255), width=3)

    def p_nature(dr, x, y):
        skill_bg(x, y, (84, 158, 62))
        dr.polygon([(x + 16, y + 6), (x + 24, y + 12), (x + 23, y + 22), (x + 16, y + 27),
                    (x + 9, y + 22), (x + 8, y + 12)], fill=(170, 230, 130, 255))
        dr.line([(x + 16, y + 8), (x + 16, y + 25)], fill=(60, 110, 40, 255), width=2)

    def p_heal(dr, x, y):
        skill_bg(x, y, (96, 178, 120))
        dr.rectangle([x + 13, y + 8, x + 19, y + 24], fill=(240, 255, 244, 255))
        dr.rectangle([x + 8, y + 13, x + 24, y + 19], fill=(240, 255, 244, 255))
        dr.polygon([(x + 25, y + 6), (x + 27, y + 10), (x + 25, y + 14), (x + 23, y + 10)],
                   fill=(255, 240, 170, 255))

    def p_impact(dr, x, y):
        skill_bg(x, y, (146, 140, 152))
        pts = []
        for i in range(16):
            ang = i * math.pi / 8
            r = 11 if i % 2 == 0 else 5
            pts.append((x + 16 + r * math.cos(ang), y + 16 + r * math.sin(ang)))
        dr.polygon(pts, fill=(255, 214, 110, 255))

    def p_claw(dr, x, y):
        skill_bg(x, y, (168, 120, 74))
        for i, dx in enumerate([0, 7, 14]):
            dr.arc([x + 6 + dx, y + 6, x + 16 + dx, y + 24], 250, 60, fill=(250, 246, 235, 255), width=3)

    def orb(dr, x, y, top_color, band_color):
        dr.ellipse([x + 5, y + 5, x + 27, y + 27], fill=(238, 240, 244, 255), outline=(52, 54, 70, 255), width=2)
        dr.pieslice([x + 5, y + 5, x + 27, y + 27], 180, 360, fill=top_color + (255,))
        dr.rectangle([x + 5, y + 14, x + 27, y + 18], fill=band_color + (255,))
        dr.ellipse([x + 13, y + 13, x + 19, y + 19], fill=(250, 250, 252, 255), outline=(52, 54, 70, 255), width=1)
        dr.ellipse([x + 9, y + 8, x + 13, y + 12], fill=(255, 255, 255, 130))

    def p_orb(dr, x, y):
        orb(dr, x, y, (205, 52, 58), (70, 72, 88))

    def p_great_orb(dr, x, y):
        orb(dr, x, y, (52, 96, 205), (178, 184, 198))

    def p_berry(dr, x, y):
        dr.ellipse([x + 7, y + 10, x + 26, y + 29], fill=(70, 110, 205, 255), outline=(36, 58, 120, 255), width=2)
        dr.polygon([(x + 16, y + 10), (x + 22, y + 4), (x + 26, y + 8), (x + 19, y + 12)],
                   fill=(96, 178, 92, 255))
        dr.ellipse([x + 11, y + 14, x + 16, y + 19], fill=(200, 225, 255, 190))

    painters = {64: p_fire, 66: p_volt, 67: p_water, 68: p_wind, 69: p_nature,
                72: p_heal, 76: p_impact, 77: p_claw, 176: p_orb, 177: p_great_orb, 180: p_berry}
    for idx, p in painters.items():
        icon_cell(d, idx, p)
    im.save(os.path.join(OUT, "IconSet.png"))


if __name__ == "__main__":
    if "all" in TARGETS or "window" in TARGETS:
        build_window()
    if "all" in TARGETS or "gameover" in TARGETS:
        build_gameover()
    if "all" in TARGETS or "balloon" in TARGETS:
        build_balloon()
    if "all" in TARGETS or "buttonset" in TARGETS:
        build_buttonset()
    if "all" in TARGETS or "crystal" in TARGETS:
        build_crystal()
    if "all" in TARGETS or "chest" in TARGETS:
        build_chest()
    if "all" in TARGETS or "other1" in TARGETS:
        build_other1()
    if "iconset" in TARGETS:
        src = os.environ["PROV_ICONSET_SRC"]
        build_iconset(src)
    print("built:", sorted(os.listdir(OUT)))
