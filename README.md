# Ganjuko

A monster-catching RPG built on RPG Maker MZ: 504 species to find, catch,
raise, breed, and battle — with a full competitive layer (hidden genetics,
breeding inheritance, an offline Battle Arena, and an online Arena service
whose design ships in `docs/`).

You play as Hiro in Wakaba Town: pick a starter from Professor Kusu's lab,
earn 8 badges, and take on the Champions Hall. Every creature, tile, song,
and sound in this repository is original work made for this game.

## What's in this repository

| Path | Contents | License |
|---|---|---|
| `js/plugins/GanjukoEngine.js` | The custom engine: battles, capture, Dex, PC Box, breeding, Arena, hidden genetics | MIT |
| `js/plugins.js`, `js/ota.js` | Plugin configuration as shipped; the mobile OTA update client | MIT |
| `data/` | The game's data as shipped (maps, skills, items, the 504-species `GanjukoSpecies.json`, …; five template-identical database files come from MZ itself — see SETUP.md) | MIT |
| `img/` | Original art: 504 species battlers + walk sheets, the named cast, tilesets, title art, a fully original icon set | CC-BY 4.0 |
| `audio/` | 101 original procedural chiptune files (BGM/BGS/ME/SE) | CC-BY 4.0 |
| `tools/` | Test Rig v2 (headless playtest runner), the sprite slicer, the balance simulator, the asset generator | MIT |
| `docs/` | Design documents: type chart, encounter design, multiplayer + Arena design, trust/release model | MIT |
| `server/` | The official Battle Arena relay (Node, single `ws` dependency): Ed25519 identity, matchmaking, ratings, replays; wire protocol in `server/PROTOCOL.md` | MIT |

## What is NOT in this repository

The **RPG Maker MZ runtime** (`js/rmmz_*.js`, `js/libs/`, `js/main.js`,
`index.html`) and all **Kadokawa stock (RTP) assets** are *not*
redistributed — they are licensed by Kadokawa and ship with RPG Maker MZ
itself. This repository is an overlay: you need a licensed copy of
RPG Maker MZ, and `SETUP.md` walks you through combining the two.

Also excluded, by design: the third-party MZ plugins the game loads
(`OptionEx`, `HDLayout`, `ActorPictures`, `AltMenuScreen`, `AltSaveScreen`,
`ButtonPicture`, `TextPicture` — by nz_prism and Yoji Ojima) are part of
RPG Maker MZ's official plugin set and come with your MZ installation;
`js/plugins.js` here carries their configuration. Stock RTP files the game
still references (most battlebacks, parallaxes, face sheets, Effekseer
effects, the M+ fonts) likewise come from your MZ installation's `newdata`
template — the overlay replaces everything the project has original art
for, and SETUP.md lists exactly which slots those are.

## Playing / building

See **SETUP.md**. Short version: create a new RPG Maker MZ project, copy
this repository's files over it, open, play.

## The game design, briefly

- **9 types**, a fully documented chart (`docs/TYPE-CHART.md`) balanced by
  round-robin simulation (every type lands in a 44–54% band).
- **Natural levels, cap 100, no scaling in multiplayer** — the creature you
  raised is the creature you bring.
- **Hidden genetics**: IVs/EVs exist and are inherited through breeding,
  but no screen ever shows the numbers. The game talks about its creatures
  in words — traits, personalities, a Judge called the Listener — never
  in stats. (Design rationale: `docs/TRUST-RELEASE-AND-FLAVOR-DESIGN.md`.)
- **No team importing, ever.** Arena rosters come only from your own save.
- **Chroma** variants at 1/1024, marked by a gold star, never announced
  by odds anywhere in the game.

## Credits

Game, engine, design, and all art/audio direction: **Rene Turcios**.
Art generated with OpenAI's image models under the author's direction and
finished programmatically (see `docs/PROVENANCE.md`); music and sound are
original procedural chiptune rendered for this game.

Ganjuko players on the official build cross-play the same Arena service as
everyone else — money is not a blocker to play. The name and official
service stay with the author: see **BRAND.md**.
