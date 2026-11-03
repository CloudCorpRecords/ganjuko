# GanjukoEngine — Competitive Upgrade Changelog (2026-11-01)

Deliverable: `work/GanjukoEngine.js` — a copy of `inspect/GanjukoEngine.js` with ONE
new section appended **inside** the IIFE, just before its closing `})();`
(original closing at line 3362; Section 16 starts at line 3363 and the IIFE now
closes at line ~4377). Sub-sections 16.1–16.7 match the brief items 1–7.
No other file was changed; `GanjukoSpecies.json` untouched.
Verified: `node --check` passes.

Conventions: every patch stores the original method and calls it unchanged for
non-Ganjuko cases; every patch is guarded (`typeof` checks) so it no-ops if a
referenced class/method is absent.

## 16.1 Type chart override

- **New constant** `GANJUKO_TYPE_CHART` (attacker element → defender type →
  multiplier, unlisted = 1.0), transcribed from `work/TYPE-CHART.md` **v1.1**:
  Water→Nature is **1.0** (the v1 0.5 resist was removed per the balance audit;
  Water was 32.2% overall in the Lv50 sim). No other chart edits.
- `GanjukoEngine.typeEffectiveness(moveElementId, defenderSpecies)` — accepts a
  species object or a battler (unwraps `ganjukoSpecies()`); multiplies in
  `type2` when a species ever has one distinct from `type1`.
- `window.GanjukoCompetitive = { chart, effectiveness }` exposed for tests.
- **Patch point:** `Game_Action.prototype.calcElementRate` (wrapped). When the
  subject or target is a Ganjuko battler and the action is a skill with
  `damage.elementId >= 1`, the rate comes from the chart instead of stock
  trait-based element rates. This also feeds section 5's existing
  `result.elementRate` display and the stock `makeDamageValue`, which calls
  `calcElementRate` internally — the chart is applied exactly once.

## 16.2 Damage feel

- **Patch point:** `Game_Action.prototype.makeDamageValue` (wrapped on top of
  section 5's wrapper). **Exact STAB composition math:** section 5 already
  multiplies by **1.25** when its STAB predicate holds (move element ==
  subject type AND `elementId > 1`). This wrapper multiplies by an additional
  **1.5 / 1.25 = 1.2** in exactly that case → **1.25 × 1.2 = 1.5 total**. For
  `elementId == 1` (NORMAL), where section 5's `> 1` predicate applied
  nothing, the wrapper multiplies by **1.5** directly → also **1.5 total** for
  every type.
- **Critical hits:** `Game_Action.prototype.applyCritical` (wrapped) — RMMZ's
  stock version returns `damage * 3`; for Ganjuko subjects it returns
  `damage * 1.5`. Non-Ganjuko subjects get the stock ×3.
- **Damage roll:** HP-damage skills (damage.type 1) by Ganjuko subjects are
  multiplied by `0.85 + Math.random() * 0.15` (0.85–1.00).
- **Immunity correction:** when the chart rate vs the target species is 0,
  the wrapper returns 0 (section 5 floors its own result at 1, which would
  otherwise make immune matchups deal 1 damage).

## 16.3 Battler art — hue resolver (scope corrected by audit)

**Change of rationale (balance audit, verified from data):** no species is
invisible — every `battlerName` resolves to an existing file. The real issue
is sharing: 482 species reuse 101 stock sprites (471/504 share a file with at
least one other species). The earlier type/stage sprite-pool substitution was
therefore **removed** and the resolver kept small:

- `GanjukoEngine.resolveBattlerName(species)` — passes the species'
  `battlerName` through **unchanged**, custom (`Ganjuko_`-prefixed) or stock.
- `GanjukoEngine.resolveBattlerHue(species)` — custom art keeps its data hue;
  stock art gets a deterministic hue from the fixed palette
  `[20,45,70,95,120,145,190,215,240,265,290,315]` indexed by species id, so
  species sharing one stock sprite read as distinct colour variants. The
  palette deliberately excludes 160 (the shiny hue).
- **Wiring (via wrappers + a hue-swap helper `_s16_withResolvedBattler`, which
  temporarily sets `species.battlerHue` during the synchronous original call
  and restores it in `finally`):**
  - `Game_Actor.prototype.setGanjukoSpecies` (wrapped) — re-applies
    `setBattlerImage(resolveBattlerName(sp))` after the original.
  - `Game_Enemy.prototype.battlerName` / `battlerHue` (wrapped) — the battle
    enemy sprite path (`Sprite_Enemy` reads both). Shiny enemies keep hue
    160 — the shiny check runs before the palette hue.
  - `Sprite_PlayerGanjuko.prototype.update` (wrapped) — hue-swap around the
    original, plus a guarded reload of the bitmap via
    `ImageManager.loadEnemy(name, hue)` when the resolved name/hue changes.
  - `Window_GanjukoDexDetail.prototype.refresh` and
    `Window_GanjukoSummary.prototype.refresh` (wrapped) — hue-swap around the
    original, then the window sprite's bitmap is reloaded with the hue.
  - `Scene_GanjukoEvolution.prototype.createBattlerSprite` and `.update`
    (wrapped) — hue-swap on the old/new species; the evolution call sites
    already pass `battlerHue` to `loadEnemy`, so the palette hue flows
    through natively there.
- Hue reaches exactly the call sites that support `battlerHue`
  (enemy battler, evolution, and the two window sprites via reload). The
  actor `setBattlerImage` path has no hue parameter in RMMZ, so actors get
  name passthrough only.
- Future generated art installs under `Ganjuko_<Name>` names via a
  `GanjukoSpecies.json` battlerName rewrite — outside this plugin's scope;
  prefixed names already pass through with their data hue.

## 16.4 Smart enemy AI

- `GanjukoEngine.scoreEnemyAction(enemy, actionItem, targetActor)` — accepts
  a skill object, skill id, action pattern (`{skillId}`), or `Game_Action`.
  Damaging: sanitized formula estimate × chart effectiveness × STAB 1.5 ×
  successRate, ×1.5 finisher bonus when the estimate KOs; effectiveness 0
  scores exactly **0**. Heals (damage.type 3) score high only when the
  enemy's HP < 45%; status riders (effect code 21) score only when the
  target does not already carry that state; buff riders (code 31) score a
  small setup value.
- Formula estimation (`_s16_evalFormula`): `a.xxx`/`b.xxx` tokens are
  substituted with numbers from the battlers' params first; the result is
  evaluated only if it matches `/^[\d\s+\-*/().]+$/`, otherwise a constant
  10 is used. No unsanitized `eval` of data strings.
- **Patch point:** `Game_Enemy.prototype.makeActions` (wrapped; original runs
  first). Candidates = the enemy row's valid action patterns + the runtime
  pool list stored by 16.5 (`_ganjukoPoolSkills`) + the originally chosen
  skills. Enemies have no `_skills` list — their printed moves are fixed by
  the Enemies.json row — so pool variety enters by **substituting the chosen
  action's skill** (`action.setSkill(bestId)`, target re-set for opponent
  skills) when the scored best beats the original pick.
- Difficulty: `$gameTemp._ganjukoDifficulty` `"gym"`/`"stadium"` → best move
  with 95% probability; trainer battles (`$gameTemp._isTrainerBattle`) → 80%;
  wild → 40% (otherwise the stock pick stands).
- **Safety substitution at any tier:** if the stock pick is an immune
  damaging move vs the player's lead and a non-immune candidate scores > 0,
  it is substituted regardless of the probability roll.

## 16.5 Move pools — best-4, not more-4

The engine enforces a strict 4-move limit (`enforceFourMoveLimit` slices
`_skills` to the last 4 on every `learnSkill`), so pools **choose the best
4** instead of expanding the list.

- `GANJUKO_MOVE_POOLS` — per type `{early, mid, late, statusOrHeal}`, built
  **only** from real `Skills.json` ids (verified: every id exists, every
  early/mid/late entry is damage.type 1), listed in ascending strength order.
  Tier gates: early Lv 1, mid Lv 10, late Lv 22, statusOrHeal Lv 6.
- `GANJUKO_COVERAGE` — fixed coverage skill per type (all verified damaging,
  all of a **different element** than the species' own type, none inside the
  type's STAB pool), unlocked at Lv 8.
- `GanjukoEngine.augmentSkills(battler)` slot plan (ascending order,
  strongest last so the slicer keeps the premium move):
  **[status/utility or best learned, coverage, second STAB, strongest STAB]**,
  backfilled strongest-first from learned + pool when short.
  - **Audit guarantee 1:** coverage + two STAB slots are all damaging → the
    best-4 always fields **≥ 3 damaging moves** when the pool can supply
    them (fixes the 24 heal/status-heavy fully-evolved templates). Every
    type's pool has ≥ 4 damaging moves (Wind fewest, with exactly 4).
  - **Audit guarantee 2:** every species — Normal species above all, whose
    data learnsets are Normal-damage-only — gets a non-own-type damaging
    coverage move from Lv 8, hence always by Lv 25.
  - **Audit guarantee 3 (dedupe):** selection dedupes **by skillId**
    everywhere (learned set is a `Set`; the push helper refuses repeats), so
    the 20 species with learnset `[3,1,2,3]` (Tackle/Tackle/Brace/Tackle)
    collapse to distinct skills and the freed slot is backfilled with
    coverage/STAB.
- **Hooks used:** `Game_Actor.prototype.setGanjukoSpecies` (wrapped — covers
  `giveGanjuko`) and `Game_Actor.prototype.changeLevel` (wrapped) call
  `augmentSkills` for actors. For enemies, `augmentSkills` stores
  `_ganjukoPoolSkills` instead (no `_skills` exists); hooked from
  `Game_Enemy.prototype.setupGanjukoEnemy` (wrapped). That stored list is
  the candidate source the 16.4 AI substitutes from.

## 16.6 Ganjuko Stadium

- `GanjukoEngine.startStadium()` — no-op with a `$gameMessage` explanation
  when the party is empty or a run is already active. Snapshots the party,
  scales every member to Lv 50 (`changeLevel(50, false)` + `recoverAll`),
  then runs 5 rounds.
- **Rounds:** `startStadiumRound(n)` generates a 3-species opponent team via
  `generateStadiumTeam` (highest-BST species by `stadiumSpeciesBST` = sum of
  `baseStats` excluding mp, type-diverse greedy pick, escalating BST floor
  per round: 230/260/290/320/345 with relaxation) at Lv 50, and starts it
  through the existing `startTrainerBattle` machinery.
  `$gameTemp._ganjukoDifficulty` per round: trainer, trainer, gym, gym,
  stadium (drives the 16.4 AI tiers).
- **Stadium stat normalization (audit fix 7) — exact hook:**
  `Game_BattlerBase.prototype.param` (wrapped) — the one param pipeline
  shared by `Game_Actor` and `Game_Enemy`, so scaling is symmetric. Active
  only while `$gameTemp._stadiumActive`. BST = the battler's **unscaled**
  effective stat sum MHP+ATK+DEF+MAT+MDF+AGI (param ids 0,2,3,4,5,6;
  MMP/LUK excluded) at battle level, matching the audit's BST definition
  (Lv50 stat sums ~1634–3730, band 3000 — the raw species `baseStats` sum
  of ~115–408 is **not** used, as it would clamp every factor to the cap).
  ATK/DEF/MAT/MDF/AGI are multiplied by `clamp(3000/BST, 0.80, 1.25)`; MHP
  by `clamp(3000/BST, 0.90, 1.10)`. Current HP is not rescaled. BST is
  computed by calling the **original** param method directly (no recursion
  through the wrapper). Also exposed as `GanjukoEngine.stadiumScaleFor(bst)`
  for tests. No species data was nerfed.
- **Bag lock (3 layers):** (1) `Window_ActorCommand.prototype.makeCommandList`
  (wrapped) sets the `item` command's `enabled = false` while
  `$gameTemp._stadiumActive`; (2) `Scene_Battle.prototype.commandItem`
  (wrapped) buzzers and reactivates the command window; (3)
  `Game_Action.prototype.apply` (wrapped) no-ops item actions by player
  actors while the flag is set.
- **Round chaining:** the engine's own `BattleManager.updateBattleEnd`
  override never invokes `BattleManager`'s event callback, so
  `setEventCallback` chaining is unavailable. Instead
  `BattleManager.updateBattleEnd` is **wrapped**: on a stadium battle end it
  determines win/loss, and on a win the party is healed
  (`GanjukoEngine.healAllParty`) and the next round starts from a deferred
  after-battle step; on the 5th win it awards prize gold
  `1500 + roundsWon × 500` (= 4000G for a full clear).
- **Restore guarantees:** the snapshot records every party member's level,
  EXP (`currentExp()`), HP and MP before scaling. On **defeat**, the
  snapshot is restored *inside the wrapper before the original
  `updateBattleEnd` runs* — restoring HP first means the engine's
  blackout/teleport branch (party-all-dead) cannot fire for a stadium loss.
  On **final victory**, the snapshot is restored in the after-battle step.
  Either way: levels return via `changeLevel`, intra-level EXP is topped
  back up with `gainExp(diff)`, HP/MP are set back to the snapshot values,
  `$gameTemp._stadiumActive` / `_ganjukoDifficulty` / `_isTrainerBattle`
  are cleared, and the run object is deactivated. Run statistics
  (`runs`, `wins`, `bestRoundsWon`, `lastRoundsWon`) persist on
  `$gameSystem._ganjukoStadium` (initialized in a wrapped
  `Game_System.prototype.initialize`, lazily created for old saves), so they
  survive save/load.
- **Entry points:** plugin command `StartStadium` via
  `PluginManager.registerCommand("GanjukoEngine", "StartStadium", …)`, and a
  **STADIUM** main-menu command added next to the GanjukoDex/Box entries
  (`Window_MenuCommand.prototype.addOriginalCommands` wrapped;
  `Scene_Menu.prototype.createCommandWindow` wrapped to set the handler,
  which returns to the map scene before starting, since battle entry expects
  the map underneath).

## 16.7 Capture fix

- **Patch point:** `Game_Action.prototype.applyGanjukoOrb` — **replaced**
  with a full copy of section 5's original logic (the probability is
  computed inline, so it cannot be composed by wrapping) with exactly one
  change: the floor `Math.max(0.12, rawScore)` becomes
  `Math.max(0.015, rawScore)`. The 0.95 cap, the Master Orb
  (`orbMultiplier >= 100`) guaranteed catch, the trainer block + orb refund,
  and the wobble behaviour (3 on catch, 1–2 on break) are preserved exactly.
  A catchRate-3 legendary at full HP with a basic orb is now ~1.5% instead
  of 12%. One defensive deviation: a missing `catchRate` falls back to 45
  instead of throwing.

## UNVERIFIED / flagged hooks

- **UNVERIFIED — Stadium round chaining:** the `BattleManager.updateBattleEnd`
  wrapper + 400 ms deferred after-battle step is the seam used because the
  engine's own override drops the event callback. Win/loss is inferred from
  `$gameParty.isAllDead()` at battle end. This needs a live RMMZ playtest
  (rounds 1→5, a mid-run defeat, and a blackout outside the stadium) to
  confirm no double-advance or missed restore.
- **UNVERIFIED — Stadium stat normalization in battle:** the
  `Game_BattlerBase.param` hook is a clean shared hook and no-ops outside
  the stadium, but its interaction with the enemy `paramBase` override and
  actor class params has only been syntax/factor checked headlessly
  (`stadiumScaleFor`: BST 3730 → ×0.804/×0.90, BST 3000 → ×1.0/×1.0,
  BST 1634 → ×1.25/×1.10). Needs a live stadium battle read-back.
- **UNVERIFIED — plugin command editor listing:** `registerCommand` makes
  `StartStadium` callable at runtime, but RPG Maker MZ's editor dropdown
  only lists commands declared with an `@command` annotation in the plugin
  header comment (outside Section 16, not edited). Event authors can still
  select the plugin + command name manually if the editor allows it.
- **UNVERIFIED — STADIUM menu entry:** the menu handler returns to
  `Scene_Map` and starts the run 100 ms later; battle entry from the menu
  has not been playtested.
- **Note — enemy printed moves:** substitution in 16.4 changes the chosen
  action's skill but keeps the stock action's targeting; in 1v1 battles the
  target is unambiguous. Multi-enemy troops (not used by this engine's
  battles) would need a targeting re-check.
- **Note — `learnSkill` during stadium scaling:** `changeLevel(50)` triggers
  stock class learnings whose `learnSkill` calls slice `_skills` to the last
  4; the wrapped `changeLevel` re-runs `augmentSkills` afterwards, so the
  best-4 is restored before battle.

---

# Section 17 — Visual Depth Pack (2026-11-01)

Appended to the same deliverable, **inside** the IIFE immediately after
Section 16 (lines 4377–4990; IIFE now closes at line 4991, file total
5,463 lines). Pure additions again: **614 lines added, 0 deleted** (diff
vs the Section-16 copy). `node --check` passes. Full write-up:
`work/VISUAL-PACK.md`. All depth is runtime sprite overlays — the tilesets
are stock RTP and no map/tileset data was touched.

- **Config + safety:** `GANJUKO_VISUAL_CONFIG` (per-feature booleans +
  strengths) at the top of the section; mirrored to
  `GanjukoEngine.visualConfig`; debug handle `window.GanjukoVisuals`
  (`config` / `status()` / `features()`), plus
  `GanjukoEngine.visualStatus()`. Every install is `typeof`-guarded and
  try/catch wrapped; every per-frame updater is try/catch wrapped; the
  first runtime error disables the whole pack (`_s17_fail` hides/detaches
  every overlay) so a cosmetic bug can never break gameplay.
- **17.1 Character shadows:** wrapped `Spriteset_Map.createCharacters` +
  `Spriteset_Map.update`. One shared radial-gradient blob Bitmap; shadow
  sprites live in the Tilemap at z = character z − 1 (above the z=0 ground
  layer, below the z=4 star layer for normal characters). Sun profile from
  the engine's own `GanjukoEngine.getTimeOfDay()`: DAY short/dark (0.38),
  MORNING −15px ×1.38 stretch (0.27), DUSK mirrored, NIGHT faint (0.15);
  indoors (the day/night code's own signal, `tilesetId() === 1`) a neutral
  lamplight shadow. Skipped for tile-graphic/no-graphic events and
  vehicles; hidden when transparent, unloaded, or "above player" priority;
  jump height is added back so the shadow stays grounded and shrinks.
- **17.2 Battler shadows:** wrapped `Spriteset_Battle.update`; lazy shadow
  inserted as the battler sprite's previous sibling in the battle field.
  Covers `_enemySprites`, `_actorSprites`, and the custom
  `_playerGanjukoSprite`. X follows the battler (Section 7 lunges ride
  free); Y pinned to `_homeY` / `_baseY` ground point so hover never lifts
  it. Hidden on invisible/dead.
- **17.3 Cloud shadows:** wrapped `Spriteset_Map.createLowerLayer` +
  the shared map update wrap. 4 (config 1–6) huge soft multi-blob sprites
  (shared 512×256 bitmap, ×2.3 scale, 0.13 default opacity) inserted
  directly below the Weather layer; slow rightward drift with wrap.
- **17.4 Vignette + sky light:** wrapped `Spriteset_Base.createUpperLayer`
  (covers map + battle + base-spriteset custom scenes). One bitmap per
  Graphics box size: warm top gradient (0.075), cool bottom shade (0.13),
  corner-only radial vignette (0.30 at the extreme corner, transparent
  through the middle 72%). Inserted directly **below the picture
  container** — under pictures, timer, fades and all windows.
- **17.5 Fog band:** pale 120px top gradient, gated and layered with the
  clouds; default effective peak ≈ 0.10.
- **Indoor/outdoor gating:** shadows reuse the day/night system's own
  `tilesetId() === 1` = indoor signal; clouds/fog additionally require the
  tileset **name** to match `/outside|overworld|field/i` (so Dungeon maps
  stay clear), falling back to the tilesetId rule when a name is absent.
- **Verification:** stub-RMMZ Node harness over the extracted section —
  35/35 assertions (attach/skip/hide rules, z math, sun offsets, lunge
  ground-pinning, layer ordering, Dungeon gating, kill switch) plus a
  no-RMMZ-classes no-op install run. **UNVERIFIED:** all pixel-level
  appearance, z-order against real star-tile overhangs, capture-wobble and
  death-collapse interplay, looping-map wrap frames, and on-Razer
  performance — all await the live playtest (details in VISUAL-PACK.md).

---

# Fix Round 1 — Playtest Defect Fixes (2026-11-01)

Source of work: `playtest/PLAYTEST-REPORT.md` (5 defects). Full record:
`playtest/FIX-ROUND-1-REPORT.md`. Engine synced to the Razer, md5
`dd42eb33ecf02be4d91f4941964f4e6d` (pre-fix backup on the Razer at
`scratch/backup-fix-round1/`, md5 `a5de09b3f7ff0b0b49a0565be87f5ce8`).
Regression suite added: `work/engine/tests/` (stub RMMZ harness) —
10/10 pass. All edits are inside `GanjukoEngine.js` and carry
"Fix Round 1" comments.

## The two-numberings rule (root cause of Defects #1 and #2)

Species have TWO numbers: the **positional id** (1-based index into
`$dataGanjukoSpecies`; the engine-wide convention — Dex, registries,
`giveGanjuko`, breeding, battle setup all use it) and the **record `id`
field** (= dexNo). They differ for exactly 15 records (positions 3–17,
the hand-authored starter families). `evolveTo` values are record-id
references; cry-map keys are record ids; everything else is positional.
New sanctioned bridges next to `getSpecies`: `getSpeciesByRecordId`,
`speciesIdOfRecordId`, `speciesIdOfRecord`, `evolutionTargetId`.
Any future code must state which numbering it speaks.

## Defect #1 — Capture granted the wrong species (15 species)

Both `applyGanjukoOrb` copies (Section 5 + the live 16.7 override)
stored the record `id` in `$gameTemp._capturedSpeciesId`, which
`processGanjukoCapture` resolves positionally (Bunspark, pos 10 / id 7,
granted Florabit, pos 7). Fix: store `target.ganjukoSpeciesId()`.
Same-family leaks fixed in the same pass: battle HUD `[CAUGHT]` badge
(`isSpeciesCaught(sp.id)` → the enemy's positional id),
`generateStadiumTeam` (returned `speciesId: sp.id` → positional), and
`playGanjukoCry` (translates positional → record id before the cryMap
lookup; all its callers pass positional). The Section 16.3 hue palette's
use of `sp.id` is a hash seed, not a lookup — audited, left unchanged.
Verified live: caught Bunspark reads back species 10,
`isSpeciesCaught(10)=true`, `isSpeciesCaught(7)=false`.

## Defect #2 — Evolution targeted the wrong species (same 15)

`_pendingEvolution = sp.evolveTo` fed a record-id into positional
`getSpecies` (level-up path and evolution-item path), and the evolution
scene's completion applied `setGanjukoSpecies(this._newSp.id)` — a
second wrong hop (Bubblix displayed "evolved into Bubblix" but became
Pyroclysm). Fix: `_pendingEvolution` now stores the positional target
via `evolutionTargetId(sp)` at both trigger sites; the scene captures
`_newSpeciesPosId` at `create()` and completion applies/registers that
id. "Evolves into" texts (Dex detail, Summary) resolve via
`getSpeciesByRecordId`. Verified live: Bunspark→Raibunny,
Pyrodra→Pyroclysm, Bubblix→Leviatide.

## Defect #4 (report #3) — Victory rewards paid twice with a pending evolution

MZ's scene stack stores scene classes: popping `Scene_GanjukoEvolution`
builds a NEW `Scene_Battle` whose `start()` re-runs
`BattleManager.startBattle()`; `checkBattleEnd` then re-invokes
`processVictory` against the all-dead troop (Marina: 2500G, then 5000G
after the pop). Fix: `BattleManager.processVictory` is idempotent per
battle — first call pays normally and sets
`_ganjukoVictoryProcessed`; re-entry skips rewards and calls
`endBattle(0)` with the event callback temporarily suppressed. A
`BattleManager.setup` wrapper re-arms the flag per battle. Verified:
unit test (pay once, clean re-entry, re-arm) + live (gold read exactly
2500 with the evolution scene up; EXP not doubled).

## Defect #5 (report #4) — Stadium foes on a different stat model

Player creatures use authored class param curves
(`$dataClasses[pos]`); enemies used `base × (0.55 + lv×0.14/0.16)`
(Lv50: HP 705–884). Fix: appended wrapper on
`Game_Enemy.prototype.paramBase` — while `$gameTemp._stadiumActive`, a
Ganjuko enemy's params come from the same class curve a player actor of
its species uses, at its battle level; the 16.6 BST normalization clamp
is unchanged and now operates on like-for-like stats. Non-Stadium
battles are byte-for-byte untouched (wild/trainer foes keep the
original formula by design). Verified live: Stadium Cyclonestrikeus foe
MHP 175 / ATK 145 = class-curve values (was 866 HP); player lead of the
same species in the same format also reads MHP 175. Snapshot restore
verified exact per member after completed runs. Note (NOT fixed here,
flagged in the fix report): at Lv50 the skill damage formulas
(editor-owned `data/Skills.json`) one-shot symmetrically for both sides
(~500–900 per STAB power hit vs ~130–190 HP), so slow parties can be
swept by fast foes on turn order — a balance-design question for Rene,
not part of this defect.

## Defect #3 (report #5) — Stadium "freeze" in start phase: NOT an engine defect

No engine change. Isolation (transition logger + the playtest's exact
party/foe): the battle waits at MZ's standard message pause
(`$gameMessage.isBusy()` during `start`) for an OK press; the playtest
rig's instant CDP key down/up pairs fall between `Input.update()` polls
at SwiftShader frame rates and never register, while held presses
(≥300 ms) dismiss the messages and the battle flows start → input →
action. The reported "2 party members died during start" was a
measurement artifact: in battle, `$gameParty.members()` returns
`battleMembers()` — the lead only, by this game's 1v1 design;
`_actors` never changed. Rig guidance recorded in the fix report:
CDP drivers must hold keys, must not hold OK during the input phase,
and `Game_Action.setItem` takes an item ID, not an object.
