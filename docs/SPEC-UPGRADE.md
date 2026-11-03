# Ganjuko — Competitive Upgrade Spec (2026-11-01)

Source of truth: the author's Razer laptop (local project path omitted)
RPG Maker MZ project. Custom engine: `js/plugins/GanjukoEngine.js` (3,834 lines).
Custom data: `data/GanjukoSpecies.json` (504 species).

## What the game already is (verified from disk)
- 1v1 monster-catching RPG: 504 species, 9 types (Normal/Fire/Water/Nature/Volt/
  Earth/Wind/Umbra/Astral), ~55 species per type, 280 evolve, starters + Professor
  intro, 26 maps (Wakaba Town, Prof. Kusu's Lab, Route 1, Kurogane Town/Gym, ...),
  8-badge Trainer Card, GanjukoDex, PC Box (6-party), capture Orbs (3 tiers),
  Rare Candy + evolution items, EXP share, Mach Bike, day/night tint, Town Map
  fast travel, breeding (line ~3809), cinematic evolution scene, battle HUD with
  type badges/status pills, facing battlers + attack lunges (added 2026-11-01 AM).

## Gaps that keep it from "Pokemon-like + good competition"
1. **Only 22/504 species have unique art.** Every species' battlerName
   resolves to an existing file (verified 2026-11-01 — an earlier draft of
   this spec wrongly claimed invisible battlers), but 482 species share 101
   stock RTP battlers (one sprite reused up to 25x), and only 8/504 species
   have walk sheets. Stock art also cannot ship in an open-source repo.
   FIX (Rene's call, 2026-11-01): generate original art for every species
   (OpenAI API via the Mac Xod key, $50 credit budget) — battlers named
   `Ganjuko_<Name>` installed in `img/enemies/`, walk sheets generated +
   programmatically re-gridded to 144x192 in `img/characters/`, and
   `GanjukoSpecies.json` battler/character names rewritten to match (custom
   file, editor-safe). Engine-side interim: per-species hue variants so
   species sharing a stock sprite read as distinct until their art lands.
2. **No explicit type chart in the engine.** Effectiveness currently rides on
   stock RMMZ class/enemy traits (opaque, unauditable). FIX: implement the full
   9x9 chart in code (see `tools/type-chart.md`), applied in damage calc for
   Ganjuko battles, dual-defender ready (species are single-type today).
3. **Stock damage feel.** RMMZ crit x3, STAB only 1.25. FIX: crit x1.5,
   STAB x1.5, damage roll 0.85-1.00 — the modern competitive standard.
4. **Dumb enemy AI.** Stock RMMZ rating-random move picks. FIX: scored AI —
   evaluate every usable move by expected damage (power x accuracy x type
   effectiveness x STAB), value status/setup/healing contextually, finish off
   low-HP targets, avoid immune moves. Difficulty tiers: Wild (mostly random,
   35% best-move), Trainer (75% best-move), Gym/Stadium (95% best-move +
   switch-out logic when a queued teammate hard-counters the player's lead).
5. **Thin movesets.** Only 60 distinct skills appear in learnsets, ~4 per
   species. FIX: runtime move pools per type (level-gated physical/special/
   status mix from the game's own Skills data) merged into learnsets, so every
   species reaches battle with a STAB move, a coverage move, and a status/
   utility move by mid levels. No Skills.json edits (editor-owned file).
6. **No competitive mode.** FIX: **Ganjuko Stadium** — menu/plugin-command
   gauntlet: 5 rounds, all battlers scaled to Lv 50, Bag disabled, heal
   between rounds, escalating AI (Trainer -> Gym -> Champion), generated
   opponent teams from high-BST species with type-diverse parties, win
   streak + prize gold, rank titles. This is the "good competition" yardstick.
7. **Data bugs.** Duplicate species names (Solaris, Terramonarch appear twice);
   catch floor 0.12 makes even catchRate-3 legends a 12% full-HP catch with a
   basic orb. FIX: floor scales with catchRate (min 1.5%); rename duplicates
   in GanjukoSpecies.json (custom file, not editor-owned — safe).
8. **Balance audit.** Simulator (Node, headless): Lv 50 round-robin sample,
   type-vs-type win matrix, BST/outlier report, move-coverage report. Ship
   the simulator in the repo under `tools/` so anyone can re-run it.

## Hard constraints
- Do NOT edit editor-owned data files on the Razer while RPGMZ.exe has the
  project open (Actors/Classes/Enemies/Skills/Maps/System...). All battle
  upgrades live in `GanjukoEngine.js` runtime code + the custom
  `GanjukoSpecies.json`. Editor-owned files are only *read* for the audit.
- Security Ship Gate: no secrets in repo (scan before push), no live server,
  no write endpoints. GitHub repo = static source only.
- Open-source boundary: RMMZ runtime + RTP stock assets are Kadokawa-licensed
  and are NOT redistributed. The repo ships Rene's original code + data +
  custom art (the 22 Ganjuko_ battlers) + tools + docs, with a SETUP guide
  ("open with a licensed RPG Maker MZ, copy these files over a new project").
  MIT for code; game data/art under the same MIT unless noted.

## Test bar (all must pass, read back from the test output itself)
- Headless-Chrome boot test: 0 runtime exceptions (existing scratch harness
  pattern, ported to the VM's Chromium).
- Battle test: forced wild + trainer battles complete, AI picks a
  super-effective move when one exists (assert from battle state), Stadium
  round 1 starts at Lv 50 with Bag locked.
- Fallback test: species #100 (no custom art) resolves a non-empty battler
  name that exists in img/enemies, and species #1 keeps its custom art.
- Simulator: full type matrix printed, no type wins >65% or loses >65% of
  neutral matchups at equal BST after balance data fixes.
- Repo read-back: GitHub API shows the repo public, README rendered, file
  count + latest commit verified at the destination.
