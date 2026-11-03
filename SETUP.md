# Setup — building Ganjuko from this repository

## You need a licensed copy of RPG Maker MZ

This repository deliberately does **not** contain the RPG Maker MZ runtime
or any Kadokawa stock (RTP) assets, because their license does not allow
redistribution. Everything here is an **overlay** on top of a fresh
RPG Maker MZ project, which supplies the runtime and the stock files this
game still references.

## Steps

1. **Create a new project** in RPG Maker MZ (any name/location). This gives
   you `js/rmmz_*.js`, `js/libs/`, `js/main.js`, `index.html`,
   `game.rmmzproject`, the stock `img/`, `audio/`, `effects/`, and `fonts/`
   from MZ's `newdata` template.
2. **Copy this repository's files over the new project**, preserving paths
   (`data/`, `js/`, `img/`, `audio/`). Overwrite when asked. Key arrivals:
   - `js/plugins/GanjukoEngine.js` + `js/plugins.js` (the engine and its
     plugin configuration)
   - `data/` — all game data, including `data/GanjukoSpecies.json`
   - `img/` — all original art (see coverage below)
   - `audio/` — the 101 original music/sound files, at the same filenames
     the data references
3. **Add the official MZ plugins** listed in `js/plugins.js` from your MZ
   installation's plugin folder (`dlc/BasicResources/plugins/launch/` in a
   Steam install): `OptionEx.js`, `HDLayout.js`, `ActorPictures.js`,
   `AltMenuScreen.js`, `AltSaveScreen.js`, `ButtonPicture.js`,
   `TextPicture.js`. They are part of RPG Maker MZ and are not
   redistributed here. (Their authors: nz_prism and Yoji Ojima.)
4. **Open the project** in RPG Maker MZ and press Play, or deploy from the
   editor (Windows / Mac / Web) as usual. `js/ota.js` is only used by the
   official mobile builds and is inert on desktop/web.

## What the overlay replaces (and what it doesn't)

Replaced with original files in this repo:

- **Battlers**: all 504 species (`img/enemies/Ganjuko_*.png`) + 3 stock-named
  slots the game overwrote with its own art (`Goddess_of_death.png`,
  `SF_Phoenix.png`, `Salamander.png` — byte copies of Ganjuko battlers).
- **Walk sheets**: all 504 species + the 15-character named cast + 22 NPC
  sheets (`img/characters/`), plus original object sheets `!Chest.png`,
  `!Crystal.png`, `!Other1.png`.
- **Tilesets**: the 11 sheets whose tiles the maps use (`Outside_*`,
  `Inside_*`, `Dungeon_*`). In these sheets every *used* tile is original
  art and every unused slot is transparent — see the tileset notes in
  `docs/PROVENANCE.md`. Sheets no map uses are not included.
- **System art**: `Window.png`, `Balloon.png`, `ButtonSet.png`,
  `GameOver.png`, and a **fully original `IconSet.png`** (all 320 cells
  redrawn; the data uses 100 of them).
- **Title art**: `img/titles1/Universe.png` (the engine loads it directly).
- **One battleback**: `img/battlebacks2/Sand.png` — an original generated
  backdrop. (The stock RTP has no file by this name; Fix Round 2 created it
  because Route 2's battles specify it.)
- **Audio**: exactly the 101 files the data references, all original.

Still supplied by your MZ installation (stock RTP, not redistributed):

- Five database files that are **byte-identical to the MZ `newdata`
  template** in the shipped game — `data/Animations.json`,
  `data/Armors.json`, `data/CommonEvents.json`, `data/Tilesets.json`,
  `data/Weapons.json` — are not duplicated in this repo; the new project
  you create in step 1 already contains them verbatim. (Ganjuko's real
  equipment/skill design lives in `Items.json`, `Skills.json`, and the
  engine, which are all included.)

- Battlebacks other than the one above, parallaxes, face sheets
  (`img/faces/` — Ganjuko's dialogue is faceless by design; faces appear
  only in a few stock menus), side-view battler sheets (`img/sv_*`),
  the remaining tileset sheets and their `.txt` name files, `img/system/`
  files not listed above (`States.png`, `Weapons*.png`, shadows, splash),
  Effekseer animation files (`effects/*.efkefc`), the M+ fonts
  (`fonts/`), the game icon, and all stock-named character sheets the
  default actor database still lists (`Actor1-3`, `People1-4`, … — the
  Ganjuko party system doesn't use them, but the editor database does).

## Testing your build

`tools/rig2/` is the headless test rig used to develop the game
(Chrome/CDP-driven playtests + unit suites):

```sh
cd tools/rig2
node run.js smoke        # boot / save / battle smoke tests against a served copy
node run.js shipgate     # the full pre-publish gate
```

See `docs/TESTING.md` for the playbook, and `tools/sim/` for the balance
simulator (`node tools/sim/simulate.mjs`).
