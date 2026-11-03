# Client Integration Spec — Engine Lane (OTA v13)

Cold-executable spec for wiring the shipped Section 19 Arena client to
the versus relay (`PROTOCOL.md` is the wire authority; this document is
the engine-side checklist). Everything here is additive: the relay is a
second transport behind the Arena's existing Link Cable / Online split;
no offline path changes behavior.

Reference relay: `wss://ganjuko-arena-relay.fly.dev/arena`
(config: `S19.VERSUS_RELAY_URL`, overridable for self-hosted relays).

---

## 1. What already exists (S19 surfaces — hook, don't rebuild)

From `playtest/SECTION-19-REPORT.md`, verified on the shipped build:

| Surface | Where | Use online |
|---|---|---|
| `S19.registeredTeam()` | Section 19 | Source of the queue-join team packet (§3) |
| `S19.exportSnapshot()` / `S19.importSnapshot()` | Section 19 | The state serializer the desync SNAPSHOT reuses (§6) |
| `$gameTemp._arenaBattle` | Section 19 arena flag | Online battles also set it: AP settlement, persistent-roster bypass, `arenaSafeRestore`, tension suppression all key off it |
| Champions clock state machine | Section 19 (`arena.clocks`: 1,200,000 / 420,000 / 45,000 ms defaults) | Same constants drive the online UI; the relay is the authority, the local machine renders (§5) |
| Pre-battle pick-3 / pick-4 UI | Section 19 / Section 17 F2 scope trail | Reused for online PICK; choices go to the relay instead of local state |
| `S18.mulberry32` | Section 18 | The match PRNG (§4) — already byte-identical to the relay's |
| Arena rank ladder visuals | Section 19 | Ranked results render from MATCH_END's `rating` block + IDENT_OK's tier |

## 2. Identity (first Online visit)

1. On first Online entry, generate an Ed25519 keypair **in the client**
   (WebCrypto `sign`/`verify` Ed25519, or a bundled pure-JS impl —
   RPG Maker MZ's NW.js Chromium supports WebCrypto Ed25519 in recent
   builds; verify at integration time, fallback to bundled).
2. Persist the PRIVATE key in the Arena save partition only (never a
   global save export, never synced). The public key is not secret.
3. Player ID = `sha256(rawPublicKey).hex.slice(0, 16)` — compute
   locally for display; the relay recomputes it and is authoritative.
4. Signature form (PROTOCOL §2): every signed message carries `sig` =
   base64 Ed25519 over
   `ganjuko-sign-v1|<TYPE>|<matchId or "-">|<turn or "-">|<sha256hex(canonicalJSON(body))>`
   where body = the message minus `type`/`sig`, canonicalJSON = sorted
   keys recursively. Implement ONE helper `versusSign(msg)` and route
   IDENT, QUEUE_JOIN, PICK, ACTION, HASH, SNAPSHOT, SNAPSHOT_ACK,
   BATTLE_END, TIME_RESULT, REJOIN through it.
5. Display name comes from the S19 registration; enforce ≤12 visible
   chars client-side too.

## 3. Team packet (the registration export — and what NEVER leaves)

Build the QUEUE_JOIN team from `S19.registeredTeam()` mapped to:

```js
{ speciesId, nickname, level,
  params: [mhp, mmp, atk, def, mat, mdf, agi],  // FINAL params only
  moves: [skillId...],                          // the registered 4 (or fewer)
  trait }                                        // S11 trait word
```

- **Never send:** IVs, EVs, bond, personality seed, capture data, AP
  balance, save contents, email, device identifiers. The packet above
  is the complete list; if a field isn't in it, it doesn't cross.
- Content hash (Layer 2): at build time the v13 client computes
  `contentHash` = SHA-256 over the canonical JSON of
  `{ species: <GanjukoSpecies rows, id-sorted, only stat/move-relevant
  fields>, skills: <Skills rows likewise>, engine: <build id string> }`.
  The exact field set must match the relay's generator
  (`section20/tools/gen-data.mjs` is the reference implementation —
  its output for the current data is
  `318a293a3d2694e19a5fa80da3f17a2e00724e8fce9e9a906dc9068f0a9c7708`).
  Send it in IDENT. On IDENT_REJECTED `content_mismatch`, show the
  design copy ("Your game data doesn't match the Arena's… update via
  the game's update channel") — the OTA manifest is the remediation.

## 4. Battle determinism (the one hard rule)

While an online battle runs:

1. On MATCH_START, seed a match-scoped mulberry32 with `seed` and swap
   it in as THE battle random source: every battle-path roll in the
   engine (damage variance, accuracy, crit, AI choice, tiebreaks,
   add-on proc rolls) must call it. The cleanest hook is the same one
   S18 uses for seeded runs: a `$gameTemp._versusRng` consulted by the
   battle RNG shim whenever `$gameTemp._arenaBattle` is set by an
   online match. Offline Arena and wild battles keep their existing
   sources.
2. Resolution order is fixed by the protocol: on EXCHANGE, apply P1's
   actions then P2's, each in slot order, through the normal S19
   battle resolution. Nothing about the local sim differs from offline
   doubles/singles except the action source (network instead of AI).
3. After each turn's resolution completes (post-resolution hook — the
   same point S19's snapshot uses), compute the canonical state string
   (PROTOCOL §7; `g1` format) from live battler state and the match
   RNG's call count, FNV-1a-32 it, send HASH. If the battle ended this
   turn, also send BATTLE_END with the winner side.
4. PRNG call count must be tracked by the shim (increment on every
   `next()`); it is part of the hash precisely to catch silent drift.

## 5. Clocks and timers (relay-authoritative, locally rendered)

- TURN_OPEN and MATCH_START carry `clocks {turnEndsInMs, yourBankMs,
  oppBankMs, totalEndsInMs}` — server truth. Render the S19 Champions
  clocks from these values, re-syncing on every TURN_OPEN (do not free
  run a local clock across turns; drift is a trust bug here).
- On local turn-cap lapse with no action chosen, the relay auto-plays
  (instinct) — the client will simply receive EXCHANGE containing its
  own auto-action. The UI should show the S19 "acted on instinct"
  beat; no client-side auto-pick is needed or wanted (two choosers =
  desync).
- TIME_UP: freeze input, compute the standing report from local state
  (alive count + HP% sum over the picked team, both sides), send
  TIME_RESULT mirrored as PROTOCOL §8. The relay's MATCH_END is the
  result; the local sim's own time-up path must NOT also settle the
  battle (suppress the S19 local settlement when online).

## 6. Desync, disconnect, rejoin (client duties)

- On DESYNC: if you are P1, answer SNAPSHOT_REQUEST with SNAPSHOT whose
  `state` is your canonical string for that turn (the same string you
  hashed) — build it via `S19.exportSnapshot()` adapted to the `g1`
  field set. If you are P2, on SNAPSHOT: rebuild dynamic battler state
  from the string (HP/MP/status/alive/actives/RNG position; static
  facts from the MATCH_START team packets), restore via the
  `S19.importSnapshot()` path, send SNAPSHOT_ACK, await RESYNCED.
- On socket drop mid-match: keep the battle scene alive (frozen input)
  for the 30 s grace; reconnect, IDENT, REJOIN; on MATCH_RESUME:
  rebuild from scratch — fresh battlers from the team packets, re-seed,
  replay `resumeFrom.turns` through normal resolution, then pay the
  stated debts: `owesAction` → send ACTION for `turn`; `owesHash` →
  the last resume turn is in-flight: send its HASH (+BATTLE_END if it
  ended); `owesPick` → send PICK. Past grace the relay ends the match;
  show the forfeit result screen from MATCH_END.
- Never offer "resume vs a different opponent" or any local substitute
  battle: a match exists only against its witnessed opponent
  (PROTOCOL §6).

## 7. Results and economy

- MATCH_END carries `result` (win/loss/draw/void for you) and, ranked
  only, `rating {before, after, delta}`. Render tier from the
  thresholds in PROTOCOL §10. Ratings are displayed from relay data
  only — the client stores NO rating of its own (a save edit must not
  be able to fake one; there is nothing to edit).
- Arena Points: settle locally through the existing S19 AP economy
  using `result` exactly as an offline Arena result (void = no AP
  either way). The relay never sees AP.
- Replays: the relay retains them; the client needs no replay storage
  for v1 (relay-side review only).

## 8. Acceptance tests for the integration lane

1. Two real clients (two machines or two game instances) complete a
   ranked singles and a ranked doubles match against the deployed
   relay; ratings move per PROTOCOL §10; replay visible via admin.
2. Content-hash gate: a client with a deliberately altered species row
   is refused with `content_mismatch` when the relay allowlist is on.
3. Hash honesty: force a one-HP divergence on one client mid-match
   (debug hook) → DESYNC → snapshot recovery → match completes; force
   a second → void, ratings unmoved.
4. Timer truth: idle client is instinct-played at 45 s, strikes accrue,
   third consecutive lapse forfeits; bank exhaustion loses on time.
5. Rejoin: kill one client's network mid-turn, restore inside 30 s →
   deterministic rebuild, debts paid, match completes; restore after
   grace → forfeit recorded.
6. Privacy audit: capture the full session's frames (both directions)
   and diff every key against the PROTOCOL allowlist — no genetics, no
   save data, no identifiers beyond §2's inventory.
7. Offline regression: full S19 battery unchanged (the online path must
   be inert when unused).
