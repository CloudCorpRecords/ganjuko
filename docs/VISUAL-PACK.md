# GanjukoEngine — Section 17: Visual Depth Pack (2026-11-01)

Deliverable: `work/GanjukoEngine.js` lines 4377–4990 — one new section
appended **inside** the IIFE, immediately after Section 16 and just before
its closing `})();` (now at line 4991). Pure additions: **614 lines added,
0 lines deleted or modified** (verified by diff against the pre-edit copy).
`node --check` passes.

Purpose: give the flat 2D presentation a 2.5D read using **only runtime
plugin code**. No map edits, no tileset edits — the tilesets are stock RTP
(Outside/Inside/Dungeon), so all depth comes from light and shadow overlays
drawn by the sprite layer.

Safety contract (Section 16 discipline, stricter): every install is
feature-tested (`typeof` guards) and try/catch wrapped; every wrapper calls
the stored original first and does visual work afterwards inside a guard;
every per-frame updater is try/catch wrapped. The **first** runtime error
anywhere in the pack disables the whole pack (`_s17_fail`): all overlay
sprites are hidden and detached, updates go inert, and gameplay code never
sees an exception from this section. Verified headlessly (see Verification).

Config: `GANJUKO_VISUAL_CONFIG` at the top of the section — one boolean per
feature plus `shadowStrength`, `cloudOpacity`, `cloudCount`, `cloudSpeed`,
`vignetteStrength`, `fogOpacity`. Also reachable live as
`GanjukoEngine.visualConfig`, with `GanjukoEngine.visualStatus()` and
`window.GanjukoVisuals = { config, status(), features() }` for debugging.

## 17.1 Character ground shadows (overworld)

- **Hook:** `Spriteset_Map.prototype.createCharacters` (wrapped) attaches
  one shadow `Sprite` per character sprite; `Spriteset_Map.prototype.update`
  (wrapped) syncs them after the stock update, so positions are this frame's.
- **Rendering:** a soft elliptical blob drawn once into a shared 128×64
  `Bitmap` (radial gradient, alpha 0.62 → 0), reused by every shadow in the
  game (map and battle). The shadow is a child of the same `Tilemap` as the
  characters. MZ's `Tilemap._compareChildOrder` sorts children by
  (z, y, spriteId) and a character's z is `priorityType * 2 + 1`
  (1 below / 3 normal / 5 above), so the shadow is pinned at **z − 1**:
  above the z=0 ground layer, and for normal characters below the z=4 upper
  ("star") tile layer — shadows slide correctly under roofs and canopies.
- **Sun model:** keyed to the engine's existing day/night clock,
  `GanjukoEngine.getTimeOfDay()` (MORNING 5–10, DAY 10–17, DUSK 17–20,
  NIGHT otherwise), cached for 30 frames. DAY: short, dark (0.38), nearly
  straight down. MORNING: thrown 15px west, stretched ×1.38, lighter (0.27).
  DUSK: mirrored east. NIGHT: faint (0.15). Indoors (see gating below): a
  short neutral lamplight shadow (0.30) so characters still read grounded.
  `shadowStrength` multiplies all of it.
- **Eligibility / hiding (documented choices):**
  - Skipped entirely for tile-graphic events (`tileId > 0`) and events with
    no character graphic (`characterName` empty) — there is nothing to ground.
  - Skipped for vehicles: the boat/ship sit on water and the airship already
    has MZ's own altitude shadow (`Spriteset_Map.createShadow`); a second
    blob would double-draw.
  - Hidden while the character is transparent/erased (`isTransparent()`),
    while its sprite bitmap hasn't loaded, and for **"above player"**
    priority events (priorityType 2 — signs, floating markers) where a
    ground blob would look wrong.
  - Shadow opacity follows the character sprite's own opacity (fades,
    bush transparency ride along for free).
- **Jump handling:** `Game_CharacterBase.screenY()` already subtracts
  `jumpHeight()`, so the shadow adds it back to stay on the ground and
  shrinks/fades with altitude (factor clamped at 0.5).

## 17.2 Battle battler shadows

- **Hook:** `Spriteset_Battle.prototype.update` (wrapped); shadows are
  created lazily on first sync and inserted into the battler sprite's own
  parent (the battle field) as its **previous sibling**, so each shadow
  renders directly behind its battler and above the battleback.
- **Coverage:** every sprite in `_enemySprites` and `_actorSprites`, plus
  the engine's custom `_playerGanjukoSprite`.
- **Motion:** the shadow's x copies the battler sprite's x every frame,
  which carries Section 7's attack lunges (and the player sprite's damage
  shake) for free. Its y is **pinned to the ground point captured once**:
  `_homeY` for stock battler sprites, `_baseY` (500) for the player sprite —
  so idle hover/breathing (±5px) never lifts the shadow. Width follows the
  battler bitmap's width × |scale.x|, clamped 56–250px. Hidden when the
  battler sprite is invisible, fully transparent, or dead.

## 17.3 Drifting cloud shadows (overworld)

- **Hook:** created in a wrapped `Spriteset_Map.prototype.createLowerLayer`,
  moved in the same `Spriteset_Map.update` wrap as 17.1.
- **Rendering:** 4 (config 1–6) screen-space sprites sharing one 512×256
  bitmap of eight overlapping soft radial blobs, scaled ×2.3 (each covers
  most of the screen), peak opacity 0.13 by default. They are inserted
  **directly below the Weather layer** in the spriteset: above the whole
  tilemap — cloud shade falls on characters too, which is what sells the
  effect — and below weather, pictures, timer and every window.
- **Motion:** slow rightward drift (0.22 px/frame base, per-cloud variance,
  gentle sine bob); a cloud that fully exits right re-enters at the left on
  a different height band.

## 17.4 Depth vignette + sky light (map and battle)

- **Hook:** `Spriteset_Base.prototype.createUpperLayer` (wrapped) — one
  install covers `Spriteset_Map`, `Spriteset_Battle`, and the custom
  Ganjuko scenes built on base spritesets. A wrapped `Spriteset_Base.update`
  rebuilds the bitmap only if the Graphics box size changed.
- **Rendering:** one full-screen bitmap, drawn once per resolution: a faint
  warm sky-light gradient from the top (0.075 peak), a faint cool ground
  shade rising from the bottom (0.13 peak), and a radial vignette that is
  fully transparent through the middle 72% of the frame and darkens only
  toward the corners (0.30 peak at the extreme corner). All scaled by
  `vignetteStrength`; deliberately biased weak so it can never read as dirt.
- **Placement:** inserted **directly below the picture container** — above
  the world and weather, below pictures, the timer, fade/flash sprites, and
  (because scene windows live above the spriteset) below every menu and
  message window. It is a plain sprite: no input handling, no hit area.

## 17.5 Map-edge fog band (optional feature, included)

- A 120px pale gradient (rgba(228,238,246), 0.55 → 0 baked, sprite opacity
  set from `fogOpacity`, default effective peak ≈ 0.10) pinned to the top
  of the screen, created and gated with the cloud layer (below Weather).
  It reads as distance haze over the far edge of outdoor maps. It did not
  fight the other overlays in layer order, so it shipped — `fogBand: false`
  in config removes it.

## Indoor / outdoor gating (the documented choice)

Two different signals, because the features need different things:

- **Shadows + sun profile** reuse the engine's own day/night convention
  from `Scene_Map.updateDayNightTint`: **`$gameMap.tilesetId() === 1` means
  indoor**. The visual pack can therefore never disagree with the tint
  system about whether the sun is up. Indoors the sun profile is replaced
  by the neutral lamplight profile (shadows stay, directionality goes).
- **Clouds + fog** additionally require the tileset to actually be an
  outdoor set, because the tilesetId rule alone would put cloud shadows
  over Dungeon maps (any non-1 tileset reads "outdoor" to the tint code).
  Gate: `$dataTilesets[tilesetId].name` must match `/outside|overworld|field/i`
  ("Outside" in this project). If the tileset has no name, it falls back to
  the tilesetId rule (not-1 = outdoor).

## Verification (headless, from the test output itself)

- `node --check` on the final file: PASS.
- Additions-only accounting vs the pre-edit copy: 614 added, 0 deleted.
- A stub-RMMZ harness (Node) eval'd the extracted Section 17 against fake
  `Spriteset_Map` / `Spriteset_Battle` / `Spriteset_Base` / `Sprite` /
  `Bitmap` classes: **35/35 assertions passed**, covering install + exports,
  shadow attach/skip rules (tile events get none), tilemap parenting,
  MORNING offset (x −15) and z (charZ − 1), hide-on-transparent,
  hide-on-above-priority, jump ground-pinning + shrink, cloud/fog creation,
  below-weather ordering, drift, Dungeon-name gating off, battler shadow
  previous-sibling placement, ground-y pinning under lunge/hover, player
  shadow at `_baseY`, hide-on-death, vignette placement directly below the
  picture container, the kill switch (a throwing character getter disables
  the pack without the error escaping `update()`), and inert post-disable
  updates.
- A second harness run with **no RMMZ classes defined at all**: the section
  installs as a complete no-op, reports all features off, throws nothing.

## UNVERIFIED — needs the live playtest

Pixel-level look cannot be verified without rendering the game. All of the
following are **UNVERIFIED** until the headless-Chrome / in-game playtest:

- **UNVERIFIED — actual appearance** of every overlay: blob softness at
  48px tile scale, whether MORN/DUSK offsets read as sunlight rather than
  drift, cloud opacity 0.13 tastefulness over bright RTP grass, vignette
  corner darkness over the battleback, fog band believability. Values were
  chosen conservatively; expect one tuning pass after screenshots.
- **UNVERIFIED — z-order against star tiles in real maps:** the z−1 math is
  proven against MZ's sorter code, but MZ also renders A5/upper tiles and
  the airship shadow inside the tilemap; a map with heavy overhang (forest
  canopy, bridges) should be eyeballed.
- **UNVERIFIED — battle field ordering with Section 7's HUD:** battler
  shadows are previous siblings inside `_battleField`; the custom HUD
  sprite is a spriteset child and unaffected, but the enemy shadow under
  the Section 7 *facing* (scale.x = −1) sprite and during the capture-orb
  wobble animation has not been seen live.
- **UNVERIFIED — performance:** worst case is one extra sprite per map
  character + per battler, all sharing two cached bitmaps; negligible on
  paper, unmeasured on the Razer.
- **UNVERIFIED — looping maps:** shadow positions copy the character
  sprite's screen x/y, which already accounts for loop scrolling, but a
  wrap-edge frame has not been observed.
- **Note — status() semantics:** `cloudShadows` / `fogBand` in
  `GanjukoVisuals.status()` flip true only once a map spriteset has been
  created (their `active` flags are set at atmosphere attach time);
  the other three features report at install. This is reporting only.
- **Note — shared bitmap lifetime:** shadow sprites share the pack's cached
  bitmaps (never assigned to `ImageManager`), following the same pattern as
  MZ's own shared character bitmaps; if a future MZ version destroys sprite
  textures aggressively on scene exit, shadows would need per-scene bitmaps.
- **Known limitation — battler shadow during entrance/death animations:**
  the shadow pins to the home ground point and hides on death; MZ's enemy
  collapse (opacity fade + sink) is followed via sprite opacity, but the
  shadow does not shrink during the collapse — it fades with it. Acceptable
  at 0.30 peak opacity; noted, not hidden.
- **Known limitation — sun direction is bucketed, not continuous:** the
  engine's clock has four buckets, so shadow direction steps at 10:00 /
  17:00 / 20:00 / 05:00 rather than sweeping. Matches the tint steps the
  game already makes at the same boundaries.
