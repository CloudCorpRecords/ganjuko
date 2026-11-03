# Ganjuko — Battle Arena, Level 100 & Hidden Depth: Design

Status: DESIGN ONLY (2026-11-01). No code in this document is built yet.
Sources of direction: Rene 2026-11-01 10:58 PT (multiplayer, level cap 100,
hidden EV/IV, characters must feel special, strong interface design) and
Rene 2026-11-01 11:00 PT (**Champions model — no team importing, ever**).
Engine facts are cited from `work/GanjukoEngine.js` as it stands after
Sections 16 (competitive) and 17 (visual depth).

---

## The three hard rules (everything below obeys them)

1. **NO IMPORTING. The only creatures a player can bring are the ones on
   their own save.** There is no team export, no team code, no share string,
   no import screen — anywhere, in any phase. This surface does not exist,
   so it cannot be abused. (Battle *match data* sent between two clients
   during a live online battle is not an import: it is ephemeral, lives
   only in `$gameTemp`, is wiped at battle end, can never be captured,
   kept, or written to a save. See A.5.)
2. **NATURAL LEVELS.** Multiplayer battles run at the levels the player
   actually earned. No auto-scaling, no set-to-50. The game-wide level cap
   is **100**, and 100 is the ceiling a creature can be raised to — in the
   story, in the Arena, everywhere. Fairness comes from matchmaking
   *bands*, not from rewriting anyone's team.
3. **IVs AND EVs EXIST AND ARE NEVER DISPLAYED.** No number, bar, delta,
   icon, or line of copy anywhere in any interface may show or decompose an
   individual's IVs, EVs, or bond value. Hidden depth surfaces only as
   *feel*: prose, qualitative judgement, behaviour. Final stats are simply
   the creature's stats. (Enforcement checklist: C.6.)

---

## A. The Battle Arena (Pokémon Champions model)

Champions' insight is the one we adopt wholesale: **the collection lives in
the main game; the Arena is where you bring it.** Ganjuko's save file is
the HOME analog. The Arena adds three things the main game doesn't have:
registration, rentals, and ranked competition.

### A.1 Registration — your team is your creatures

- Entry points: a **BATTLE ARENA** main-menu command (registered exactly
  like STADIUM in 16.6, via the `Window_MenuCommand.addOriginalCommands`
  wrap at engine line ~2251) and an Arena Desk in Kurogane City for
  in-world flavour. Both open the same scene.
- Registration flow: the player picks **up to 6** creatures from their
  party + PC Box (`$gameSystem.ganjukoBox()` actor-id list — the Box scene
  already implements the two-pane pick pattern we reuse). Order matters:
  slot 1 is the lead.
- Registration **persists** on `$gameSystem._ganjukoArena` (the same
  persistence pattern as `$gameSystem._ganjukoStadium` in 16.6): an array
  of actor ids, plus AP balance, rating, season record, rental state.
  It survives save/load and sessions; re-registering is free and instant,
  at the desk, between battles — never mid-match.
- Registration stores **references, not copies**. An Arena battle fields
  the player's actual actors, so level, hidden IVs/EVs, personality and
  bond are the real ones — that is the entire point. Battles run under a
  Stadium-style snapshot/restore: HP/PP/status are restored after every
  Arena battle (win or lose), so Arena fighting never wounds the story
  playthrough, and a creature that levels up in the story simply *is* its
  new level next time it enters the Arena.
- Validation at registration (local, instant): team size 1–6, no duplicate
  species restriction in Casual; **Ranked adds a species clause** (no two
  of the same species) — announced in the Ranked door copy, checked at
  registration-for-ranked time.
- The registration screen always shows the team's **level band**, computed
  from its highest-level member (see A.3). Bands are public information by
  Rene's rule — levels are never hidden.

### A.2 Modes

| Mode | Opponent | Stakes | Notes |
|---|---|---|---|
| **Sparring** | AI pilots (offline) | Small AP | Phase A. Uses 16.4 AI tiers with named Arena personas (e.g. an 80%-tier "Arena Trainer", a 95%-tier "Arena Ace"). Opponent teams are generated: high-BST diverse teams per 16.6's `generateStadiumTeam`, or Trial builds (A.4). |
| **Casual** | Online matchmaking | AP | Phase B. Accept/decline on the Match Found screen. |
| **Ranked** | Online matchmaking | AP + rating | Phase C live (tech in B). Auto-accept (no dodging), species clause, seasons. |

Battle format for all modes: the engine's existing party battle — lead
creature out, GANJUKO command to switch, 6v6 roster. **Bag is sealed and
Orbs are disabled** in every Arena battle (the 16.6 three-layer Bag lock
is the precedent; capture is meaningless against another trainer's team
and against Trial builds). **Arena battles grant no EXP and no EVs**
(A.6) — they are sanctioned exhibitions. Bond still grows (C.5).

Doubles: roadmap only. The engine's battles are 1v1-with-switching;
a 2v2 mode is a battle-system project of its own and is explicitly
out of scope for Sections 18–20.

### A.3 Matchmaking bands — how natural levels stay fair

Natural levels without bands would feed Lv20 teams to Lv100 teams. Bands
solve it without touching anyone's levels:

- **Band is set by the team's highest-level member:**
  Sprout 1–20 · Bronze 21–40 · Silver 41–60 · Gold 61–80 · Masters 81–100.
- Queue key = (mode, band). Ranked adds rating proximity inside the band.
- If no opponent is found within ~30 s, the search **widens ±1 band**,
  and the queue screen says so ("Search widened — you may meet a stronger
  band"). Widening never happens silently, and Casual players can decline
  a widened match on the Match Found screen.
- **A brand-new player still finds games on day one** because Trial
  Partners (A.4) are level-banded: rent a Sprout-band team, queue in
  Sprout, play real matches at real (rented) levels while your own
  creatures are still growing. The on-ramp is a feature, not a crutch:
  Trial builds are deliberately mid — see the prestige argument in A.4.

### A.4 Trial Partners — the rental/recruitment pillar

Standard-built creatures rented with **Arena Points (AP)**, Champions'
VP analog. Earned from Arena battles (Sparring small, Casual more,
Ranked most; first-win-of-the-day bonus). AP is an Arena-side currency on
`$gameSystem._ganjukoArena`; it is not story gold and never converts to
gold (one-way door, keeps the story economy clean; season *rewards* are
the sanctioned flow back — A.7).

- **The catalogue**: for each band, a curated roster of builds. A build =
  species + fixed level inside the band + the best-4 moves the 16.5 pool
  system would choose + a personality trait + a **fixed, honest genetics
  profile: every IV = 16 (exactly median), EVs = 0, bond = 0.** Trial
  builds are defined as data tables inside the plugin (Section 19),
  generated locally at rental time through the normal `giveGanjuko`
  path with the Section 18 genetics hand-off — never from network data.
- **Rental terms**: renting a partner holds it for a *set* — until the
  player changes their registered team or completes 10 Arena battles
  with it, whichever comes first. Cost is per partner per set
  (recommended: 50 AP; a full 6-rental team = 300 AP ≈ 3–5 casual wins —
  cheap enough to experiment, real enough to mean something).
- **Recruitment**: rent the same build in **5 separate sets** and it can
  be **recruited permanently** for a one-time AP cost (recommended
  500 AP): a creature of that build joins the player's Box for good,
  generated locally from the build table with the standard fixed profile.
  From then on it is a normal creature — it can gain EVs and bond in the
  main game like any other. Its IVs stay median forever.
- **Why your own creatures stay the prestige path** (design intent, say
  it in the Arena copy): a Trial Partner is *reliable*; a raised creature
  can be *exceptional*. Hidden IVs mean a wild-caught or bred favourite
  can quietly out-stat its Trial twin, bond gives it the look-back
  moments rentals never get (rentals start at bond 0 and Arena battles
  are bond-slow), and only your own creatures can be bred. Rentals let
  anyone compete today; raising is how you become dangerous.

### A.5 Online battles — matchmaking service + lockstep protocol (Phase B tech)

Champions needs an always-on service; room codes don't fit matchmaking.
We spec the minimum honest thing:

**The service** — `tools/versus-relay/`, a single small Node process
(WebSocket via `ws`, no database): queue + pairing + in-match relay +
a file-backed ratings store (one JSON file on the host, rewritten
atomically; seasons reset it anyway, which bounds the blast radius of
any failure). It ships in the repo, self-hostable by anyone; separate
instances are separate ladders. Running one *official* public instance
is an ops decision for Rene (Open Question 1). The service holds **no
accounts and no PII**: a session is a display name (player-chosen,
max 12 chars, profanity-filtered client-side) + a random session id.

**What crosses the wire at match start** (each client sends its team
once, to the service, which forwards it):

```
{ speciesId, nickname (optional), level,            // public by rule 2
  params: [mhp, mmp, atk, def, mat, mdf, agi],      // FINAL stats
  moves: [skillId x4],                              // public in battle anyway
  trait: "Mischievous" }                            // flavour word, shown on VS screen
```

**Final params, never genetics.** Battle resolution needs the stats
themselves; their decomposition (how much is IV, how much is EV) never
leaves the owner's machine, so an opponent running a modified client
learns nothing the damage numbers wouldn't eventually tell them.
The service **validates plausibility** before pairing completes:
species id exists; level 1–100; moves are legal for that species
(learnset ∪ 16.5 pool/coverage — the service ships the same species
data + pool tables from the repo); each param lies inside the legal
envelope for that species at that level — `[floor(base with IV 0/EV 0),
ceil(base with IV 31/EV 252)]` computed by the Section 18 formulas.
9999-ATK forgeries die here. IV-perfect forgeries *inside* the envelope
are undetectable — see anti-cheat honesty, A.6.

**Turn flow (lockstep)** — Ganjuko battles are turn-based with both
sides acting per turn, so lockstep is natural:

```
MATCH_START   service -> both: { matchId, seed, youAre: P1|P2,
                                 opponent team (as above), band, mode }
              (P1/P2 assignment is by the service, coin-flip)
ACTION        each client -> service: { turn, kind: fight|switch,
                                 skillId | actorIndex }
              (60-second turn timer, service-enforced; see forfeits)
EXCHANGE      when both actions are in, service -> both: { turn,
                                 actions: {P1: ..., P2: ...} }
RESOLVE       both clients run the SAME battle code locally with the
              match seed driving every random call (see below)
HASH          each client -> service: { turn, hash }
              service compares. Match -> next turn.
              Mismatch -> desync recovery (below).
BATTLE_END    both clients -> service: { result hash, winner claim }
              service records the result both agree on; disagreement
              after a completed battle = void (A.6).
```

**Determinism** is the load-bearing wall. RMMZ + this engine roll
`Math.random()` in damage (the 16.2 roll is literally
`0.85 + Math.random()*0.15`), crits, accuracy, capture (disabled here),
and AI (no AI in PvP). Section 20 therefore installs a **seeded PRNG
swap**: while `$gameTemp._arenaBattle` is set, the engine's battle-path
random calls route through `GanjukoEngine.arenaRandom()` (mulberry32 —
the same generator the balance simulator uses — seeded from MATCH_START,
advanced identically on both clients because both execute the same
actions in the same order). Any code path that rolls outside the swap is
a determinism bug; the test plan (E) includes a hash-equality soak test
to catch them.

**State hash**: after each turn's resolution, hash a canonical string —
turn number, both sides' per-member (speciesId, level, currentHP,
currentMP, status ids, alive flag), active member indices, and the PRNG
call count — FNV-1a or SHA-256-truncated; the PRNG count is what catches
"same state, different future" drift early.

**Desync recovery**: on a hash mismatch the service asks P1 (designated
leader at pairing) for a **state snapshot** (the same canonical state,
full form). P2's client rebuilds its battlers from the snapshot
(species/level/params are all in the match data; HP/status/active come
from the snapshot) and play continues from the next turn. If P1 is the
divergent side, or a second mismatch occurs in the same match, the
match is **voided**: no rating change, no AP penalty, both clients show
"the connection lost the thread — match voided." Three voids in a day
from the same session pattern flags the account-free session for a
queue cooldown (abuse brake, deliberately weak — see A.6).

**Disconnects & forfeits**: turn timer 60 s. First timeout: the service
auto-submits "fight with first listed move" for the silent side.
Second consecutive timeout: same. Third: **forfeit** — opponent wins.
A dropped socket gets a 30-second reconnect grace (match pauses; the
connected client sees "opponent reconnecting…"); expiry = forfeit.
Ranked treats a post-grace disconnect as a loss for the disconnecter.
If the *service* drops the match, it's void for both — no rating change,
and the client says so plainly.

### A.6 Anti-cheat honesty (read this before promising anything)

- There is **deliberately no import surface** (rule 1), so the classic
  "forged team code" attack does not exist.
- Save editing is the known, accepted limit. A player can edit their own
  save and field a Lv100 team with perfect hidden IVs. The envelope
  validation in A.5 stops stat forgery beyond what the game itself
  allows; IV forgery *within* the envelope is **undetectable by design**
  — IVs are hidden from everyone, including the server. Ranked is
  therefore for glory and modest rewards, never for anything of real
  value, and the season rewards (A.7) are sized accordingly.
- The social contract layer is real: Casual shows the opponent's full
  team (species + levels) on the Match Found screen *before* you accept;
  Ranked shows the same preview on the VS screen (you can't decline —
  that's what ranked means — but nothing about levels is ever a
  surprise, per rule 2).
- **Arena battles grant no EXP and no EVs** (decided, not a bug): EVs
  are earned in the wild and the story, never by farming exhibitions,
  and Arena grinding cannot inflate a story team. Bond may grow in the
  Arena (C.5) — it's a feel system, and feeling attached to your team
  is the point of bringing *your* creatures.

### A.7 Ranked seasons (Phase C)

- **Rating**: one number per player, stored by the service (A.5).
  Simple Elo, K = 32, start 1500, with a per-band expectation adjustment:
  expected score is computed from rating difference *and* band
  difference when a widened match crosses bands (beating a higher-band
  team pays more; losing to one costs less). Show the player their
  number — rating is the player's own competitive record, not a
  creature secret (rule 3 doesn't cover it).
- **Tiers** (display crests, thresholds on rating): Rookie <1200 ·
  Ganjuko ≥1200 · Great ≥1500 · Ultra ≥1800 · Master ≥2100. (Named for
  the game's own Orbs — Ganjuko Orb, Great Orb… the capture items the
  player already knows.)
- **Seasons**: 8 weeks. Soft reset at season start: rating moves
  halfway toward 1500. Placement: first 5 ranked matches of a season
  count double K (settles returning players fast without a placement
  grind).
- **Rewards**, claimed at the Arena Desk after season end, written into
  the main save ($gameParty gold / items — earnings flowing *into* the
  story is the Champions HOME loop and is intended): per-tier AP bonus
  + an item bundle (top tier: 2 Rare Candies + 1 evolution item of
  choice + gold; lower tiers scale down). Amounts are deliberately
  modest (A.6) — a season of ranked should feel like a bonus chapter,
  not a second job or an economy exploit.
- **Records**: best rating, per-season tier history, and W/L live on
  `$gameSystem._ganjukoArena.history` client-side (display only; the
  service's current rating is authoritative for matchmaking).

### A.8 Phasing

- **Phase A — Arena offline (Section 19)**: Arena scene + registration
  + Trial Partner catalogue/rental/recruitment + AP wallet + Sparring
  vs AI pilots. Everything provable with zero network. Ships value even
  if online never launches.
- **Phase B — Online (Section 20 + `tools/versus-relay/`)**: the
  service, Casual matchmaking, the lockstep protocol, seeded-RNG swap,
  desync/forfeit machinery. Ranked *matches* run on the same rails in
  shadow mode (rating tracked, no seasons yet) for one tuning cycle.
- **Phase C — Ranked live**: seasons switched on (calendar, soft reset,
  rewards claim), species clause enforced, ladder display in the Season
  screen. Roadmap beyond: rematch offers, spectating a friend's match
  (the relay already sees every action — spectate is a read-only
  subscription), doubles feasibility study.

---

## B. Level 100 — the cap raise (part of Section 18)

Today the effective cap is 99 in three places. All fixes live in the
plugin (Classes.json / Actors.json are editor-owned and must not be
edited); the pattern throughout is "wrap, don't edit," as in Sections
16–17.

### B.1 The three seams

1. **`Game_Actor.prototype.maxLevel`** — stock MZ returns the actor
   template's `maxLevel` (Actors.json, 99). **Wrap it**: Ganjuko actors
   (any actor with a `ganjukoSpeciesId`) return **100**; non-Ganjuko
   actors keep stock behaviour. `isMaxLevel()`, `changeLevel()`'s clamp,
   and the EXP-share wrapper (engine line ~984) all read through this —
   one seam moves them all.
2. **The Rare Candy gate** — `Game_Action.prototype.applyItemEffect`,
   the `<RareCandy>` branch, tests `target.level < 99`. That constant is
   *inside* an existing override, so a wrapper can't reach it. Follow
   the 16.7 precedent (16.7 replaced `applyGanjukoOrb` wholesale for a
   one-number change): Section 18 wraps `applyItemEffect` with a
   **pre-branch** — if the item is a Rare Candy and the target is a
   Lv 99 Ganjuko actor, perform exactly the original lines
   (changeLevel +1, recoverAll, evolution check, success flag) and skip
   the original for that effect only. Smallest surface, no full copy.
3. **Class param tables end at 99** — the dangerous one. Actor stats come
   from `currentClass().params[paramId][level]`, and MZ class param
   arrays carry indices 0–99. At level 100 the lookup returns
   `undefined` and every param becomes `NaN` — a Lv100 creature with
   NaN stats would poison battles, the Dex, Stadium BST math, and Arena
   envelope validation alike. **Fix at boot**: after data load, for every
   class in `$dataClasses`, if a param array has length exactly 100,
   append index 100 as `v[99] + max(1, v[99] − v[98])` (last-step linear
   growth, per param, per class). Runtime-only mutation of loaded data —
   the file on disk is untouched. Guarded and idempotent; if a future
   editor export ever ships longer arrays, the guard skips them.

### B.2 What does *not* need changing

- **EXP curve**: MZ's `expForLevel` is formula-driven (basis/extra/
  acceleration params in the class data), defined for any level —
  EXP-to-100 computes natively once `maxLevel` allows it. Grind sanity:
  enemy EXP yield is `round((baseHP+baseATK+baseDEF+baseMAT) × lv / 7)`
  (engine line ~1284), so late-game yields scale with enemy level and
  the 90s stay reachable; Stadium prize gold → Rare Candy remains the
  pressure valve it already is.
- **Enemies**: `Game_Enemy.prototype.paramBase` is a closed formula —
  `base × (0.55 + lv × 0.14)`, HP `base × (0.55 + lv × 0.16)`, LUK
  `10 + lv`. It is linear and total at any level; wild/trainer content
  may now *use* levels up to 100 via `setupGanjukoEnemy(speciesId,
  level)` with no engine change. Content-side ranges are data, not code.
- **Move pools (16.5)**: tier gates top out at "late, Lv 22" — pools are
  fully online long before 100. `augmentSkills` re-runs on the wrapped
  `changeLevel`, including the change to 100.
- **Evolution**: `evolveLv` values sit far below 100; nothing interacts.

### B.3 Stadium interaction — deliberately none

Stadium keeps doing what it does: snapshot, scale to Lv 50, normalize
BST toward the 3000 band, restore. A Lv100 creature enters Stadium
exactly like a Lv40 one does. **The contrast is the design**: Stadium is
the equal-footing skill yardstick; the Arena is your raised team as-is.
Cap 100 widens the Arena's Masters band; it changes nothing about
Stadium. (Snapshot/restore already round-trips level + intra-level EXP
via `currentExp()`/`gainExp(diff)` — a Lv100 snapshot restores
identically.)

### B.4 Balance risk at Lv100 — flagged, with a decision procedure

RMMZ skill formulas in this game are **subtractive**
(e.g. `14 + a.mat × 2.4 − b.mdf × 0.8`). Subtractive defense loses value
as absolute numbers grow, and both sides' multipliers grow linearly
(stats ×14.55 at Lv100 vs ×7.55 at Lv50 on the enemy formula; HP grows
slightly faster, ×16.55 vs ×8.55, which claws back ~14%). Expectation:
Lv100 play is *faster* — glass cannons threaten 1–2-hit KOs, AGI (who
moves first) appreciates, and the Lv50 sim's healthy bands do not
automatically transfer.

Decision procedure (in the test plan, E): re-run the simulator at Lv100
before Section 18 ships. Gate: **if average turns-to-KO in equal-level
neutral matchups is ≥ 2.5, ship as-is** (fast but playable). If it
collapses below that, the sanctioned lever is an **Arena-and-Stadium-
only damage dampener** (a flat multiplier on damage in flagged battles —
natural levels and stats stay exactly as earned; only the exhibition
formats slow the fight down). Story mode is never dampened: one-shotting
a wild Lv90 with your raised Lv100 partner is the power fantasy the cap
raise exists for. The dampener decision is Rene's, made on sim numbers,
not vibes (Open Question process, F note).

---

## C. Hidden IVs & EVs (the rest of Section 18)

### C.1 Data model — three lines

- Every battler instance carries `battler._ganjukoGenetics =
  { ivs:{hp,atk,def,mat,mdf,agi} (0–31 each), evs:{…} (0–252 each,
  ≤510 total), trait: traitId, bond: 0–255, seed: uint32 }` — rolled
  once, at first encounter or creation, never re-rolled.
- Actors are `Game_Actor` instances persisted by the save system
  (party, Box, and daycare all reference the same actors), so genetics
  persist everywhere **for free**; wild enemies carry the record on the
  `Game_Enemy` for the duration of the encounter.
- Pre-Section-18 saves: an accessor (`GanjukoEngine.geneticsOf(battler)`)
  lazily creates the record on first touch — for legacy creatures the
  IVs are derived deterministically from a hash of (actorId, speciesId)
  the first time, then stored, so a beloved old partner's hidden profile
  is stable forever and never visibly changes under the player.

### C.2 Where genetics are born

| Moment | Mechanism |
|---|---|
| **Wild encounter** | Rolled in the `setupGanjukoEnemy` wrap (16.5 already wraps this seam): uniform 0–31 per stat, standard RNG. The creature you are fighting *already is* somebody. |
| **Capture** | `BattleManager.processGanjukoCapture` passes the defeated enemy's record into the creation path (`giveGanjuko` gains an optional genetics hand-off, the same `$gameTemp` hand-off pattern breeding uses, C.4). **The creature you fought is the creature you caught** — capture changes nothing about it. |
| **Starters / gifts / trades-in-story** | Rolled in the `setGanjukoSpecies` first-time path (16.5 wraps this seam too): a fresh record when an actor first becomes a Ganjuko. |
| **Eggs** | Inherited per C.4, applied via the pending-genetics hand-off at hatch. |
| **Trial Partners** | Not rolled — the fixed profile (all IVs 16, EVs 0) from the build table (A.4). |
| **Trainer/gym/Stadium enemies** | Rolled by tier, as a hidden difficulty dial consistent with 16.4's AI tiers: wild = uniform; trainer = uniform floored at 12; gym = floored at 24; Stadium/Champion = all 31. Never displayed, never announced — gym leaders' creatures simply *are* superbly raised. |

Distribution honesty: pure uniform means a perfect 31 is 1/32 per stat;
three or more perfect stats ≈ 0.1% of wild encounters. Rare enough to be
special, certain enough to happen to a dedicated catcher. No pity
timers, no rigged floors for wild spawns — the Judge (C.5) exists so
that when it *does* happen, the game can quietly know.

### C.3 Param integration — stats simply ARE the stats

One seam, shared by actors and enemies, placed so that **every**
consumer (battle damage, 16.4 AI scoring, Stadium's BST normalization,
the Dex, the Character Sheet, Arena envelope validation) sees the same
final numbers, because they all read `param()`:

- Wrap `Game_Actor.prototype.paramBase` **and**
  `Game_Enemy.prototype.paramBase` (the enemy override lives at engine
  line ~1266): compute the stock result, then add the genetics
  contribution for that param:
  `floor(iv × level / 100) + floor(floor(ev / 4) × level / 100)`,
  using the battler's own level (`ganjukoLevel()` for enemies). HP and
  MP: HP uses its own iv/ev pair; **MP has no genetics** (no mp stat in
  the IV/EV set — MP stays species-pure, say so in code comments).
- Magnitude check (Pokémon-standard caps, Ganjuko's linear growth):
  a maxed stat gains +31 (IV) and +63 (EV) at Lv100, +15/+31 at Lv50 —
  roughly a 6–10% swing on a typical stat. That is the intended size:
  a *feel* difference between two otherwise-identical creatures, never
  a different game. Two Embits are not equal; neither is a fraud.
- **Stadium interaction, stated plainly**: 16.6's normalization wraps
  `Game_BattlerBase.param` — *downstream* of `paramBase` — so a
  creature's IV/EV-inclusive BST is what gets measured and scaled.
  In Stadium, hidden depth is mostly (not entirely) washed out by
  design; in the story and the Arena it counts in full. That tension is
  correct and we keep it.
- Evolution: `setGanjukoSpecies` changes the species; the genetics
  record is untouched. It was never the species' record — it's the
  individual's.

### C.4 EVs — earning, yield, caps

- **Earning follows EXP exactly.** The engine already wraps
  `Game_Actor.prototype.gainExp` for EXP Share (line ~984); Section 18
  hooks the same defeat→EXP flow: when an enemy faints, every party
  member who receives EXP from that knockout also receives the defeated
  species' EV yield. (Chosen over "KO-scorer only": it matches how the
  game already shares EXP, rewards keeping a whole team, and removes
  switch-training tedium. Saturation speed is controlled by the caps.)
  Arena battles are the exception — no EVs there (A.6).
- **Yield is derived from species data we already have** —
  `GanjukoSpecies.json` has no yield field, so derive it: a species'
  *stage* comes from the `evolveTo` graph (stage 1 = evolves and is
  nobody's target… precisely: stage = 1 + number of times it is reached
  by walking evolution edges backwards; final stage = `evolveTo == 0`
  and is a target). Yield total = stage (1 / 2 / 3 points). Points go to
  the species' dominant base stats from `baseStats`, in order: stage 1 →
  1 pt to the highest stat; stage 2 → 1 pt each to the top two; stage 3
  → 2 pts to the highest, 1 pt to the second. Ties break in fixed order
  hp > atk > def > mat > mdf > agi. Deterministic, auditable from the
  shipped data, no editor file touched.
- **Caps (Ganjuko numbers)**: 252 per stat, 510 total — the genre
  standard, sized in C.3 to stay a feel-difference. When a cap binds,
  excess yield is simply lost (no redistribution — redistribution would
  make training outcomes unpredictable in a system the player can't
  see; lost points are the honest behaviour).

### C.5 Breeding inheritance (existing daycare)

The daycare (`$gameSystem._daycare`, engine ~line 5414+) currently
stores only `{id, name, level}` per slot and produces an egg after 120
steps with both slots filled. Section 18 extends the *plugin's own*
structures (no data files):

- `depositDaycare` additionally snapshots each depositor's **genetics
  record** into the slot entry. A snapshot, not a live reference: what
  the parents were when deposited is what the egg inherits.
- Egg generation (in `checkDaycareEgg`'s flow): child species = the
  earliest-stage ancestor of slot 1's species (walk `evolveTo` edges
  backwards to the root of that line). Child genetics:
  - **Exactly 3 of the 6 IV stats are inherited** — choose 3 distinct
    stats at random; each takes one parent's value (coin-flip parent
    per stat). The other 3 stats roll fresh uniform.
  - **Trait**: 50% inherit a parent's trait (coin-flip which), else
    roll from the full trait list.
  - EVs 0, bond 0. Seed fresh.
- Hatching routes through `giveGanjuko` with
  `$gameTemp._ganjukoPendingGenetics` set; the creation-path hook
  consumes it instead of rolling. This is the same hand-off capture
  uses (C.2) — one mechanism, two callers.
- Breeding is the *only* way to deliberately stack the deck toward an
  exceptional individual, and even it is a lottery the player can feel
  (through the Judge) but never read. That is the intended prestige
  loop behind A.4's "raised beats rented."

### C.6 The NEVER-DISPLAY rule — enforcement checklist

Rule 3 is a build-time discipline, not a hope. Every future UI change
checks against this list (it goes in the Section 18 header comment too):

1. No window, scene, message, or tooltip may render an IV value, an EV
   value, a bond value, or any arithmetic involving them ("+15",
   "nearly perfect", per-stat letter grades — all banned).
2. Stat displays show **final params only**, as bars and/or plain
   numbers (D.4). A final number is the creature's stat; its
   decomposition does not exist as far as the UI is concerned.
3. Bond may be shown **only** as 0–5 hearts (coarse bands of a
   relationship, D.4) and through behaviour (C.7). Never as a number.
4. Personality is a **word**, chosen from the trait list (C.7). Words
   are allowed; numbers are not.
5. `window.GanjukoCompetitive` (16.1's test surface) must never gain a
   genetics field. Any debug accessor
   (`GanjukoEngine.debugGenetics()`) is gated behind a plugin parameter
   defaulting to **off**, and the repo build notes call for stripping
   it from release builds.
6. Lint step in the build checklist: grep all UI strings for `IV`,
   `EV`, "effort", "individual value", "potential: <number>" patterns.
   (The Judge's *qualitative* bands in C.7 are reviewed copy, exempt by
   being words.)
7. Save editors will find the fields. Accepted for single-player; the
   Arena consequence is handled honestly in A.6.

### C.7 Feel-special surfaces — how hidden depth becomes *felt*

**Personality traits (12, flavour-only).** Brave · Gentle · Curious ·
Stubborn · Playful · Stoic · Proud · Shy · Mischievous · Loyal ·
Dreamy · Fierce. Rolled at creation, fixed for life, shown as a word on
the Character Sheet. **Decision: no stat micro-effects.** A hidden
modifier stacked on hidden IVs would make a creature's feel unreadable
and the balance sim unfalsifiable; flavour is what traits are *for*.
(The one sanctioned mechanical exception in this whole section is
bond's endure moment, below — and it is announced by its own text
every time it fires.)

**Temperament prose** (Character Sheet + Dex detail): one generated
line per individual, assembled from three slots, all qualitative:
- *Inclination* — from the individual's **highest-IV stat**:
  HP "Sturdy as old roots — slow to tire, quick to forgive." ·
  ATK "Hits first and apologises never." ·
  DEF "A wall that decided to be a friend." ·
  MAT "Dreams in colour and fights in poetry." ·
  MDF "Unshakeable; weather passes through and it remains." ·
  AGI "Born to run — always first to the horizon."
- *Manner* — from the trait ("…and gets there mischievously.")
- *Relationship* — from bond band: new ("Still deciding about you.")
  / trusted ("Travels like it chose this.") / inseparable
  ("You don't walk together. You walk as one.")
Species `desc` (already in the data) stays the species-level prose;
temperament is the individual's line beneath it.

**The Judge — "the Listener."** A late-game NPC (post-8th-badge,
placed at the Arena desk town), speaking only in verdicts. Flow in
D.5; the pattern is: choose a party member → two lines — (1) the
individual's strongest gift, named by stat-in-words ("This one's gift
is its speed — it was born swift."), (2) an overall band from the IV
total, in words only: <90 "An honest, ordinary heart — and nothing
wrong with that." · 90–119 "Something about this one glitters." ·
120–149 "A rare light in this one. Raise it well." · ≥150 "Once in a
generation. I have nothing to teach it." The Judge never gives a
second stat, never compares two creatures numerically, and refuses
politely if asked twice in a row about the same creature ("I've said
what there is to say.").

**The capture tell (deniable by design).** When a wild creature's
profile is exceptional (≥2 stats at IV 31, or IV total ≥150), the
capture sequence's second Orb wobble carries a faint extra golden
shimmer (a Section 17-style overlay hook on the capture animation).
No text, no sound change, no Dex note. Players may never notice;
players may swear it means something. Both are correct. **No official
text anywhere ever confirms this.** It is the game's one true secret.

**Bond — hidden growth, visible behaviour.** Bond (0–255) grows:
+1 when the creature participates in a won battle (story or Arena),
+1 per 256 steps walked with it in the party (the engine already
counts map steps for the daycare), +2 per level gained, +5 when a gym
badge is earned with it in the party. It never decays — bond never
punishes. It is expressed only as:
- **The look-back**: at bond ≥180, when the creature lands a critical
  hit or is brought to ≤10% HP, the battle log occasionally adds
  "*<Name> looked back at you — and held on!*" At the top band
  (bond ≥230) the look-back carries the system's **one real effect**:
  once per battle, a creature that would faint instead endures at
  1 HP, announced by that same line. It exists to manufacture the
  stories this whole design is for.
- **The hop**: at high bond, the lead creature's overworld follower
  sprite (Section 17's shadow system already grounds it) occasionally
  hops on entering a new map. Pure joy, no function.
- **Hearts** on the Character Sheet (D.4).
- **History counters** on the Character Sheet: "Battles together: N ·
  Walked together since <town>" — participation memory, not genetics;
  allowed under C.6 because they describe the *shared past*, not the
  hidden profile.

---

## D. Interface design

### D.0 Visual language (applies to every screen below)

- **Palette** (the engine's own): deep slate panels `#1E293B`, gold
  `#FFD700` for headers and anything earned, teal `#00FFCC` for
  interactive accents and "online/live" states, sky `#38BDF8` for
  information, soft red `#F87171` for warnings/forfeit states. Type
  colours always come from `getTypeInfo` (the battle HUD's type badges
  and status pills are the reference components — reuse their drawing
  code, don't reinvent it).
- **Depth motifs** (Section 17): custom scenes inherit the vignette +
  sky-light overlay for free (17.4 wraps `Spriteset_Base`), and every
  creature sprite on an Arena/Sheet screen stands on the shared soft
  blob-shadow bitmap from 17.1 — creatures are *grounded* in the UI,
  never floating stickers.
- **Scene patterns** (reuse, from the existing custom scenes):
  `Scene_MenuBase` subclasses; `Window_Selectable` lists with a detail
  pane (Dex pattern); the Box's two-pane party/storage layout
  (Registration, Trial Counter); the menu-command registration wrap
  (Arena command beside STADIUM); persistence on `$gameSystem`
  (`_ganjukoArena` beside `_ganjukoStadium`); message copy uses the
  engine's `\C[14]` gold inline colour for names and rewards.
- **Copy tone**: warm stadium-announcer for the Arena (short lines,
  second person, no jargon); quiet and plain for the Character Sheet
  (it is a portrait, not a spreadsheet); the Judge speaks like weather.
  **No screen ever uses the words IV, EV, effort, or "potential" with a
  number** (C.6).

### D.1 Screen 1 — The Arena (hub)

Purpose: one door into everything competitive; readable at a glance —
where do I stand, what can I do, what's live.

```
┌────────────────────────────────────────────────────────────────┐
│ BATTLE ARENA                                    ☀ Season 3     │
│ "Your creatures. Your levels. No shortcuts."    AP ◉ 1,240     │
├──────────────────────────────┬─────────────────────────────────┤
│  ► REGISTER TEAM             │  YOUR TEAM        Band: MASTERS │
│    Your six, chosen from     │  [Embit  Lv100] [Pyrodra Lv97]  │
│    your own party & box      │  [Leviatide Lv95] [Bunspark 88] │
│                              │  [Elderoak Lv92] [Zephyrhawk 90]│
│    CASUAL BATTLE        ●    │                                 │
│    Find a trainer at         │  RANK  ◆ GREAT · 1,642          │
│    your level                │  ▓▓▓▓▓▓▓░░░ next: Ultra        │
│                              │                                 │
│    RANKED BATTLE        ●    │  TRIAL PARTNERS on set: 2       │
│    Seasons · rating · glory  │  (Marina's Crushcean, +1 more)  │
│                              │                                 │
│    TRIAL PARTNERS            │  SPARRING last result: W vs     │
│    Rent a partner · recruit  │  Arena Ace (Sparring is below)  │
│                              │                                 │
│    SPARRING                  │                                 │
│    Practice vs Arena pilots  │                                 │
│                              │                                 │
│    SEASON & REWARDS     →    │                                 │
├──────────────────────────────┴─────────────────────────────────┤
│  A: Choose   B: Back to game        ● = online service reached │
└────────────────────────────────────────────────────────────────┘
```

Hierarchy: registration first (nothing works without a team), ranked
given the gold treatment, season state always visible top-right, the
offline truth told honestly — if the service is unreachable, Casual/
Ranked grey out with "Arena service unreachable — Sparring still open"
and nothing pretends otherwise.

### D.2 Screen 2 — Registration

**(There is no Screen 2 "Team Share." It was deleted by Rene's
direction and does not exist in this design — no export, no import, no
codes, in any phase.)**

Purpose: choose the six (or fewer) who represent you — from *your*
save only.

```
┌────────────────────────────────────────────────────────────────┐
│ REGISTER TEAM — pick up to 6        Team Band: MASTERS (81–100)│
├────────────────────────────┬───────────────────────────────────┤
│ PARTY & BOX (yours)        │  ARENA TEAM                       │
│ ▸ Embit        Lv100  ♥♥♥♥ │  1. Embit        Lv100  (lead)    │
│   Pyrodra      Lv 97  ♥♥♥○ │  2. Pyrodra      Lv 97            │
│   Leviatide    Lv 95  ♥♥♥○ │  3. Leviatide    Lv 95            │
│   Bunspark     Lv 88  ♥♥○○ │  4. —                             │
│   Elderoak     Lv 92  ♥♥♥♥ │  5. —                             │
│   Zephyrhawk   Lv 90  ♥♥○○ │  6. —                             │
│   ... (box continues)      │                                   │
│                            │  Band is set by your highest-     │
│                            │  level partner. Ranked: no two    │
│                            │  of the same species.             │
├────────────────────────────┴───────────────────────────────────┤
│ A: Add/Remove  X: Lead first  Y: Done   B: Cancel              │
└────────────────────────────────────────────────────────────────┘
```

Built on the Box scene's two-pane code. Hearts here are the bond
display (C.6-legal — relationship, not genetics) and double as a
tiebreaker hint when choosing between two similar creatures: the one
who trusts you more gets picked. That is the hidden systems *doing UI
work* without ever being numbers.

### D.3 Screen 2b — Trial Partner Counter

Purpose: rent reliability; dream about recruiting it.

```
┌────────────────────────────────────────────────────────────────┐
│ TRIAL PARTNERS — MASTERS BAND        AP ◉ 1,240   Desk: "Ren"  │
│ "Borrow a seasoned partner. Earn one, and it's yours to keep." │
├────────────────────────────────────────────────────────────────┤
│ [sprite] CRUSHCEAN  Lv95 · Water      Moves: Hydro Pump · ...  │
│          Stoic · a steady, finished creature — what you see    │
│          is exactly what you get.        Rent: 50 AP per set   │
│          Recruit progress ●●●○○ (3 of 5 sets)  [RENT]          │
├────────────────────────────────────────────────────────────────┤
│ [sprite] STORMCRESTEON  Lv98 · Wind   Moves: ...               │
│          Proud · ...                     Rent: 50 AP per set   │
│          Recruit progress ○○○○○          [RENT]                │
├────────────────────────────────────────────────────────────────┤
│  ... one card per build in this band; band tabs at top ...     │
│  Rented partners join your Arena team only. Win battles to    │
│  earn AP. Recruit in 5 sets → joins your Box for good.        │
└────────────────────────────────────────────────────────────────┘
```

Card contents are all public-by-design information (species, level,
moves, trait word). There is deliberately **no stat line and no
"strength" rating** on a card — the fixed-profile promise is made in
copy ("exactly what you get"), not in numbers.

### D.4 Screen 2c — Season & Rank

Purpose: where you stand, what's at stake, what last season meant.

```
┌────────────────────────────────────────────────────────────────┐
│ SEASON 3 — "Longest Days"        ends in 23 days               │
├──────────────────────────────┬─────────────────────────────────┤
│        ◆ GREAT               │  SEASON REWARDS (at your tier)  │
│        1,642                 │  ◉ 800 AP                       │
│  ▓▓▓▓▓▓▓▓░░  158 to ULTRA    │  1× Rare Candy                  │
│                              │  1× Evolution item (your pick)  │
│  Rookie → Ganjuko → GREAT →  │  2,000 G into your purse        │
│  Ultra → Master              │                                 │
│                              │  Claim at this desk when the    │
│  This season: 14 W · 9 L     │  season closes. Rewards go to   │
│  Best ever:  MASTER (S2)     │  your main adventure.           │
│  New seasons pull ratings    │                                 │
│  halfway back to 1,500.      │                                 │
├──────────────────────────────┴─────────────────────────────────┤
│  B: Back                                                       │
└────────────────────────────────────────────────────────────────┘
```

### D.5 Screen 3 — Queue & Match Found

Purpose: honest waiting, then a fair, unsurprising meeting (rule 2).

```
QUEUE                          MATCH FOUND (Ranked)
┌──────────────────────┐       ┌──────────────────────────────────┐
│ RANKED · MASTERS     │       │  RENE            vs    ASHA      │
│ Searching… 0:42      │       │  [6 sprites]        [6 sprites]  │
│ Band: Masters        │       │  Lv 88–100          Lv 85–100    │
│ (widened to Gold at  │       │                                  │
│  0:30 — shown here)  │       │  First move is yours.            │
│                      │       │  Battle begins in 3… 2… 1…       │
│ B: leave queue       │       │  (Ranked starts automatically;   │
└──────────────────────┘       │   Casual shows [ACCEPT] [DECLINE])│
                               └──────────────────────────────────┘
```

Opponent preview = sprites + levels + level range only. Never moves
(those reveal themselves in battle), never trait words on the ranked
screen (flavour belongs to your own creatures' pages; the VS screen is
about levels, honestly shown). Connection quality shown as a simple
three-bar icon through the match; a dropped opponent shows the
reconnect grace state from A.5.

### D.6 Screen 4 — Creature Character Sheet (the anti-spreadsheet)

Purpose: this is where a creature becomes *someone*. Evolution of the
existing `Scene_GanjukoSummary` — same menu entry ("Ganjuko Team"),
rebuilt presentation.

```
┌────────────────────────────────────────────────────────────────┐
│ EMBIT — "Ember"                              Lv 100            │
│ Flame Newt Ganjuko · FIRE                      ♥♥♥♥♥          │
│ ┌───────────────┐  "A spirited fire lizard whose tail flame    │
│ │               │   burns brighter when it trusts its          │
│ │   [battler    │   Trainer."            — species (Dex)       │
│ │    sprite on  │                                              │
│ │  blob shadow] │  Born to run — always first to the horizon,  │
│ │               │  and gets there mischievously.               │
│ │  [walk inset] │  You don't walk together. You walk as one.   │
│ └───────────────┘                          — temperament       │
│  Personality: MISCHIEVOUS                                      │
│  Battles together: 212 · With you since Wakaba Town            │
├────────────────────────────────────────────────────────────────┤
│  HP  ████████████████░░░░  412    ATK ██████████░░░░░░  238    │
│  DEF █████████░░░░░░░░░░  201    MAT █████████████░░░  296    │
│  MDF ██████████░░░░░░░░  219    AGI ████████████████  341    │
│        (bars scale to what this species can be at Lv 100;      │
│         the number is the creature's stat — there is no        │
│         breakdown, and there never will be)                    │
├────────────────────────────────────────────────────────────────┤
│  MOVES  Ember · Flame Charge · Will-O-Wisp · Coverage: Rock…   │
│  ←/→: next partner   X: nickname   B: back                     │
└────────────────────────────────────────────────────────────────┘
```

Design rules for this screen: the sprite gets the biggest area on any
menu screen in the game; prose outranks numbers (species line,
temperament line, relationship line, in that order); hearts sit beside
the name, not in a stats block; the stat block is last and quietest.
Everything the hidden systems are allowed to say is said here — and
nothing they aren't.

### D.7 Screen 5 — The Judge (dialogue pattern, not a scene)

The Listener is an NPC (Arena desk town, post-8th-badge), so the
"interface" is a dialogue tree over the standard message system +
party-pick window:

```
Listener: "I don't read numbers, child. I listen to what a
           creature is. …Shall I listen to one of yours?"
           → [Choose a partner] (party window, Box pattern)
Listener: (pause) "…This one's gift is its speed. It was born
           swift — the horizon insults it."
           "And the whole of it? A rare light. Raise it well,
           and it will remember you in every battle."
           → (same creature again) "I've said what there is
             to say."
```

Rules baked into the copy pattern (C.7): one gift, one band, no
numbers, no comparisons, no repeats. The verdict *function*
(`GanjukoEngine.judgeVerdict(actor)`) returns {giftStat, band} so
events/NPCs anywhere can use the pattern — the Listener is just its
first speaker.

---

## E. Build order & test plan

### E.1 Sections (all inside `GanjukoEngine.js`, Sections 16/17 pattern)

| Section | Contents | Depends on |
|---|---|---|
| **18 — Hidden Depth** | Level 100 (B.1 seams), IV/EV core (C.1–C.4: genetics accessor, paramBase wraps, yield derivation, daycare inheritance), Character Sheet (D.6), Judge verdict API | Playtest of 16/17 green (below) |
| **19 — Arena Offline** | Arena scene + hub (D.1), Registration (D.2), Trial Partner tables/rental/recruitment + AP (A.4), Sparring pilots (A.2), Season screen shell (D.4, records local) | 18 (recruitment + trial profiles ride the genetics hand-off) |
| **20 — Arena Online** | Client matchmaking + lockstep + seeded-RNG swap + hash/desync/forfeit (A.5); `tools/versus-relay/` service ships alongside | 19; service repo rules (below) |
| **Phase C switch-on** | Seasons live: calendar + soft reset + rewards claim (A.7) — config on the service + claim flow in 19's desk | 20 shadow-ranked tuning cycle |

**Dependency on the current playtest — explicit**: the Razer install +
playtest of Sections 16/17 must finish first, for two reasons: the
engine file is frozen while that lane works, and Section 18 wraps
`paramBase` directly underneath 16.6's `Game_BattlerBase.param` wrap —
the wrap *order* and Stadium's BST behaviour with genetics folded in
(C.3) can only be verified against a Stadium that is proven to chain
rounds and restore snapshots in live play. If the playtest finds
Stadium defects, they are fixed before 18 is written, not around.

**Ship-gate note for the service**: the relay is a live network surface,
unlike everything else in the repo. It ships as a tool with its own
README (bind address, no auth by design, rate limits on queue joins,
message size caps, the C.6-style review applied to *its* strings too),
and the Security Ship Gate's "no live server" rule for the *game repo*
is satisfied by the service being a separate, opt-in tool — the game
client contains no listener, only an outbound WebSocket to an address
the player (or the public instance) provides.

### E.2 Test plan

1. **Lv100 simulator re-run** (extends the existing Lv50 sim): stat
   model at Lv100 for both actor (extended class tables) and enemy
   (formula) paths; type band report + **turns-to-KO distribution**;
   the B.4 dampener gate (≥2.5 avg TTK = ship as-is) is decided from
   this output.
2. **Section 18 unit harness** (Node stub-RMMZ pattern from 17's
   35-assertion harness): IV distribution over 10,000 rolls
   (uniformity eyeball + min/max); capture-transfer identity (enemy
   record === caught actor record); breeding inheritance over 1,000
   eggs (exactly 3 stats inherited, each traceable to a parent);
   legacy lazy-seed stability (same actor → same profile across
   save/load cycles); EV cap behaviour (252/510 binding, yield lost
   not redistributed); paramBase wrap composition with 16.6 Stadium
   normalization (normalization sees genetics-inclusive BST).
3. **Never-display lint**: automated grep over all scene/window string
   literals for the C.6 banned patterns + a manual copy read of the
   five D screens. This test runs on every future UI change.
4. **Arena offline playtest** (headless harness): register from
   party+box → sparring match completes → AP accrues → rent a Trial
   Partner → 5-set recruitment → recruited actor appears in Box with
   the fixed profile (checked via test-only hook, not UI).
5. **Two-client online test** (Phase B gate): two headless Chrome
   clients (the SPEC's CDP harness pattern) + a local relay on the VM:
   a full scripted 6v6 match asserts **identical state hashes on every
   turn**; a tampered client (HP altered mid-match) triggers the
   snapshot recovery and the match completes; a hard disconnect past
   grace resolves as forfeit; a widened-band pairing forms correctly;
   envelope validation rejects a forged 9999-ATK team and accepts a
   legal perfect-IV team (the honest limit, A.6, demonstrated not
   hidden).
6. **Legacy save test**: a pre-Section-18 save loads, plays, and its
   party's genetics are stable across two save/load cycles.

---

## F. Open questions for Rene (recommended defaults stated)

1. **The public Arena service**: self-host-only at launch, or do you
   run one official instance? *Recommended default*: ship the
   self-hostable service with Phase B; **you** stand up the official
   instance at Phase C so Season 1 launches with a front door. It is
   one small Node process; the cost is a tiny VPS-class box and
   occasional restarts, and self-hosts remain separate ladders for
   anyone who prefers their own.
2. **Personality traits — flavour-only, or small stat nudges?**
   *Recommended default*: **flavour-only** (C.7). Hidden numbers on top
   of hidden numbers would make your creatures' feel impossible to
   trust or balance; bond's look-back endure is the single sanctioned
   mechanic because it announces itself.
3. **Ranked rating — show the number, or tiers only?**
   *Recommended default*: **show it** (D.4). It's your competitive
   record, not your creature's secret; rule 3 protects the creatures,
   not the ladder.
4. **Season rewards flowing into the main save** (gold, Rare Candy,
   evolution items)? *Recommended default*: **yes, modest and
   tier-scaled** (A.7). That flow *is* the Champions loop — the Arena
   should feed the adventure that feeds the Arena — and the amounts
   are capped so it can never trivialize the story economy.

*(Not an open question: the Lv100 damage-dampener call in B.4 is gated
on the simulator's turns-to-KO number, per the procedure there — it
comes back to Rene as a decision with data attached, not a guess.)*
