# Ganjuko Battle Arena — Relay Protocol v1

Normative spec for the versus relay (`ganjuko-versus-relay`). The design
authority is `work/MULTIPLAYER-AND-DEPTH-DESIGN.md` §A and
`work/TRUST-RELEASE-AND-FLAVOR-DESIGN.md` §§2–3; where the shipped
Section 19 client later refined the design (doubles as an Arena format,
Champions clocks), this protocol follows the shipped game. The relay
implements this document; the engine integration lane implements the
client half from `CLIENT-INTEGRATION.md`.

Transport: WebSocket (TLS in production) at path `/arena`, JSON
messages, one object per frame. HTTP exists only for `/` (the privacy
promise), `/health`, and the token-gated `/admin/*` surface.

---

## 1. The three hard rules, as protocol

1. **No importing, ever.** There is no team export/import message type.
   A team packet exists only inside a live queue join and a live match;
   it is never written to anyone's save by the relay, never returned to
   a third party, and dies with the match (the replay is the audit
   copy, retained per §10).
2. **Natural levels.** No message scales a creature. Fairness is
   matchmaking bands (§5), not arithmetic.
3. **Final stats, never genetics.** Team packets carry species, level,
   nickname, trait word, moves, and the 7 FINAL params. IVs, EVs, bond,
   and seeds have no wire representation. A client that sends fields
   beyond the packet schema has them ignored; a client that persists
   them server-side will find the server never reads them.

## 2. Identity (TRUST §3.1)

- The client generates an Ed25519 keypair locally on first Arena use.
- **Player ID** = first 16 hex chars of SHA-256 over the raw 32-byte
  public key.
- Handshake: on connect the relay sends `HELLO`; the client replies
  `IDENT` (signed). Later protocol messages listed in §4 are signed.
- **Signature canonical form.** For a message of type `T` with body `B`
  (the message object minus `type` and `sig`):
  ```
  payload  = "ganjuko-sign-v1|" + T + "|" + (matchId or "-") + "|" +
             (turn or "-") + "|" + sha256hex(canonicalJSON(B))
  sig      = base64( Ed25519_sign(payload) )
  ```
  `canonicalJSON` = JSON with object keys sorted recursively, no
  whitespace. `matchId`/`turn` are the message's own fields when
  present, else `-`; they are also part of `B` when present.
- Display names: 1–12 visible characters, no control characters. Not
  unique, carry no authority.
- A banned player ID is refused at `IDENT` (`IDENT_REJECTED`,
  code `banned`). Losing the key file = losing the identity; there is
  no recovery, by design.

## 3. Connection lifecycle

```
client connects WS /arena
relay  -> HELLO        { nonce, serverVersion, season, contentHashExpected }
client -> IDENT        { pubkey, displayName, contentHash, sig }
relay  -> IDENT_OK     { playerId, displayName, rating, tier, season, record }
       or IDENT_REJECTED { code: bad_signature | bad_display_name |
                                 banned | content_mismatch }
```

`contentHash` is the Layer-2 consistency gate (TRUST §3.2): SHA-256
over the canonical species/move tables + engine build id (see
CLIENT-INTEGRATION.md §3 for the exact input set). If the relay is
configured with an allowlist and the presented hash is not on it, the
connection is refused with `content_mismatch` and the polite copy the
design specifies. If no allowlist is configured, any hash is accepted
and recorded on the player record (`lastContentHash`).

## 4. Message catalogue

Client → relay (`*` = signed):

| Type | Fields | Meaning |
|---|---|---|
| `IDENT` | pubkey, displayName, contentHash, sig | §3 handshake |
| `QUEUE_JOIN`* | mode, format, team | Enter matchmaking with a team packet (§5) |
| `QUEUE_LEAVE` | — | Leave the queue |
| `QUEUE_ACCEPT` | — | Casual: accept a found match |
| `QUEUE_DECLINE` | — | Casual: decline (drops the pairing, not your rating) |
| `PICK`* | matchId, picks[] | Chosen battle team indices (3 singles / 4 doubles) |
| `ACTION`* | matchId, turn, actions[] | This turn's actions, one per active slot (§6) |
| `HASH`* | matchId, turn, hash, prngCalls | Post-resolution state hash (§7) |
| `SNAPSHOT`* | matchId, turn, state | Leader's canonical state string (desync recovery, §7) |
| `SNAPSHOT_ACK`* | matchId, turn | Follower adopted the snapshot |
| `BATTLE_END`* | matchId, winner, finalHash | Claim: battle over (`winner`: P1/P2/draw — sides, not player IDs) |
| `TIME_RESULT`* | matchId, standing | Mirrored standing report at TIME_UP (§8) |
| `REJOIN`* | matchId | Reattach to a live match after reconnect (§9) |
| `PING` | — | Liveness; relay answers `PONG` |

Relay → client:

| Type | Fields | Meaning |
|---|---|---|
| `HELLO` | nonce, serverVersion, season, contentHashExpected | §3 |
| `IDENT_OK` / `IDENT_REJECTED` | §3 | Handshake result |
| `QUEUED` | mode, format, band, widenAfterMs | You are in the queue |
| `QUEUE_ERROR` | code, errors[] | Join refused (team_invalid — with reasons —, team_too_small, …) |
| `QUEUE_WIDENED` | band | Search widened ±1 band (never silent, A.3) |
| `QUEUE_LEFT` | — | Queue leave confirmed |
| `MATCH_FOUND` | matchId, mode, format, band, youAre, opponent{…team…}, acceptRequired, acceptMs | Pairing formed |
| `PICK_OPEN` | matchId, pickCount, pickMs, yourTeam, opponentTeam | Pick phase open |
| `MATCH_START` | matchId, seed, youAre, yourTeam, opponentTeam, clocks | Battle begins; teams here are the PICKED subsets |
| `TURN_OPEN` | matchId, turn, clocks | Decision phase for `turn` |
| `EXCHANGE` | matchId, turn, actions{P1,P2} | Both actions in — resolve locally now |
| `DESYNC` | matchId, turn, attempt | Hash mismatch (§7) |
| `SNAPSHOT_REQUEST` | matchId, turn | To the leader (P1): send your state |
| `SNAPSHOT` | matchId, turn, state | To the follower: adopt this state |
| `RESYNCED` | matchId, turn | Recovery complete; next turn opens |
| `TIME_UP` | matchId, turn | Total clock expired; send TIME_RESULT |
| `OPPONENT_DISCONNECTED` | matchId, graceMs | Opponent dropped; grace running |
| `OPPONENT_RECONNECTED` | matchId | Opponent is back |
| `MATCH_RESUME` | §9 | Rejoin state + obligations + rebuild trail |
| `MATCH_ABORTED` | matchId, reason | Pairing dissolved before battle (decline/timeout/leave) |
| `MATCH_END` | matchId, youAre, result, winner, reason, rating | Terminal; `result` is win/loss/draw/void for YOU; `rating` = {before, after, delta} ranked only |
| `ERROR` | code, detail? | Protocol error (wrong_turn, bad_actions, bad_signature, rate_limited, …) |
| `PONG` | at | PING answer |

`MATCH_END.reason` values: `battle`, `time`, `forfeit_strikes`,
`time_bank`, `forfeit_disconnect`, `forfeit_abandoned`, and the void
family `void_desync`, `void_desync_unresolved`,
`void_result_disagreement`, `void_result_unclaimed`,
`void_time_disagreement`, `void_time_unresolved`. Void = no rating
change, no W/L recorded, replay retained and marked.

## 5. Teams, bands, matchmaking

**Team packet** (in QUEUE_JOIN): an array of 3–6 members (a queue join
must field at least the format's pick count):
```json
{ "speciesId": 4, "nickname": null, "level": 50,
  "params": [239, 111, 98, 88, 121, 96, 104],
  "moves": [10, 11, 12], "trait": "Stoic" }
```
`params` order: [mhp, mmp, atk, def, mat, mdf, agi] — FINAL stats.

**Validation at the door** (rejects the join, `team_invalid`):
species exists; level integer 1–100; params 7 integers, each inside
the legal envelope for (species, level):
`[unified(base with IV0/EV0), unified(base with IV31/EV252)]` under the
engine's unified stat model (mult = 0.30 + 0.034·L; HP also +L+5;
others +5; genetics adds floor(31L/100)+floor(63L/100) at most, MP
excluded) with a ±2 slack for the repo's two base-stat spellings.
Moves: 1–4 ids, each a known skill. Ranked adds the **species clause**
(no duplicate species). Move *learnset* membership is NOT a rejection:
the engine's 16.5 coverage pools legitimately grant moves outside the
learnset, and those pool tables are not relay data; outsiders are
flagged on the replay for review instead. Envelope-edge teams (≥3
stats at ceiling on a member) are likewise flagged, not refused —
in-envelope forgery is undetectable by design (A.6) and the protocol
says so rather than pretending otherwise.

**Bands** (by highest-level member): Sprout 1–20 · Bronze 21–40 ·
Silver 41–60 · Gold 61–80 · Masters 81–100. Queue key = (mode, format,
band). After 30 s the search widens ±1 band; the widened player is
told (`QUEUE_WIDENED`), and a casual player may decline the widened
match at MATCH_FOUND. Ranked pairs prefer the closest rating in-band.
A pairing's band is the higher of the two team bands.

**Accept phase (casual only).** Both sides get MATCH_FOUND with
`acceptRequired: true` and 20 s to QUEUE_ACCEPT. A decline, a timeout,
or a disconnect dissolves the pairing (`MATCH_ABORTED`); the player who
accepted returns to the queue with their original wait intact. Ranked
has no accept phase — no dodging.

**Pick phase.** `PICK_OPEN`, 30 s, picks = exactly 3 (singles) or 4
(doubles) distinct indices into the registered team. No pick in time →
the first N are auto-picked. MATCH_START then carries only the picked
subsets, in pick order (slot order = pick order).

## 6. Turn lockstep

- `MATCH_START.seed` is a uint32 chosen by the relay. Both clients seed
  mulberry32 (§7) from it. P1/P2 are assigned by the relay (coin flip
  at pairing).
- Each turn: `TURN_OPEN` → each client sends `ACTION` for the turn →
  when both are in, the relay broadcasts `EXCHANGE` → both clients
  resolve the SAME actions in the SAME order with the shared stream →
  each sends `HASH` → hashes agree → next `TURN_OPEN`. A duplicate or
  stale action is refused (`wrong_turn`); the first valid action for a
  side is final.
- `actions[]` has exactly one entry per active slot (1 singles, 2
  doubles):
  ```json
  { "slot": 0, "kind": "fight",  "skillId": 12, "target": {"side":"opp","slot":0} }
  { "slot": 1, "kind": "switch", "toIndex": 3 }
  ```
  (`toIndex` = index into the picked battle team.) The relay checks
  shape only — legality of the choice is the shared battle code's job,
  executed identically on both clients.
- **Clocks (Champions, mirroring the shipped S19 machine).** Per-turn
  decision cap 45 s; per-player decision bank 7:00 consumed only while
  that player owes an action (a lapse costs the full window); total
  match clock 20:00. A player who lets the turn cap lapse is
  auto-played by the relay ("act on instinct": each active fights with
  its first listed move at the first opposing slot) and takes a strike;
  **3 consecutive strikes = forfeit**. Any on-time action resets the
  strike count. Bank exhaustion = loss on time (`time_bank`). Total
  expiry → §8.
- Battle end: when a client's resolution ends the battle it sends
  `HASH` for the final turn and then `BATTLE_END`. The relay settles
  only when both claims agree on the winner; a lone claim within the
  claim window (10 s) that the other side never matches, or two claims
  that disagree, voids the match (`void_result_*`). A claim about a
  match the relay didn't witness is meaningless — results exist only
  inside witnessed matches (TRUST §3.4).

## 7. Determinism, the state hash, desync recovery

**PRNG.** mulberry32, exactly as the engine's Section 18 generator:
```js
let a = seed >>> 0;
next() {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```
While an online battle runs, every battle-path random call in the
engine routes through this stream (CLIENT-INTEGRATION.md §4). Any roll
outside the stream is a determinism bug by definition.

**Canonical state string** (the hash input; version tag `g1`):
```
g1|t=<turn>|a1=<P1 active team-indices, dot-joined>|a2=<P2 actives>|
m=<member>;<member>;...|rng=<prng call count>
member = <side>:<speciesId>,<level>,<hp>,<mp>,<status ids, +-joined>,<alive 0|1>
```
Members are listed P1's picked team in pick order, then P2's. `rng` is
the shared stream's total call count since MATCH_START — it catches
"same state, different future" drift one turn before the state itself
diverges. **Hash = FNV-1a 32-bit over the UTF-8 string, 8 lowercase
hex chars.**

**Desync.** On a hash mismatch the relay broadcasts `DESYNC`, asks P1
(the designated leader) for a `SNAPSHOT` (the full canonical state
string for the mismatching turn), forwards it to P2, and waits for
`SNAPSHOT_ACK`. P2 rebuilds its battlers from the snapshot (static
facts — params, moves — come from the team packets it already holds;
dynamic facts — HP/MP/status/alive/actives/PRNG position — from the
string) and play resumes at the next turn (`RESYNCED`). A snapshot not
answered within 30 s, or a SECOND mismatch in the same match, voids
the match (`void_desync*`): no rating change, no AP penalty, both
clients show the void copy. Desyncs are recorded on the replay;
clustering is a review signal (TRUST §3.4).

## 8. Time-up decision

At total-clock expiry the relay sends `TIME_UP`. Each client replies
`TIME_RESULT` with a MIRRORED standing report — both sides, from its
own resolution:
```json
{ "standing": { "self":     { "alive": 2, "hpPctSum": 231 },
                "opponent": { "alive": 2, "hpPctSum": 187 } } }
```
`hpPctSum` = sum over ALL picked members (standing or not — a fainted
member contributes 0) of floor(100 · hp / maxHp). If the two reports
do not mirror, the match is void (`void_time_disagreement`). Decision
rule (the S19 rule): more creatures standing wins; tie → higher
hpPctSum wins; exact tie → draw.

## 9. Disconnects, grace, rejoin

- A dropped socket mid-match: the opponent gets
  `OPPONENT_DISCONNECTED` with `graceMs` = 30,000. Clocks keep running
  (a disconnected player's decision deadline can lapse into instinct
  play and strikes — leaving is never a pause button).
- Reconnect = a fresh connection + `IDENT` (same keypair) + `REJOIN`
  {matchId}. The relay answers `MATCH_RESUME`:
  ```json
  { matchId, phase, youAre, turn, seed, yourTeam, opponentTeam,
    owesAction, owesHash, owesPick, clocks,
    resumeFrom: { turns: [{turn, actions{P1,P2}}...], lastAgreedHash } }
  ```
  The rejoining client rebuilds deterministically: re-seed, replay
  every completed turn's exchanged actions. Debts are explicit: if
  `owesAction`, send this turn's ACTION; if `owesHash`, the last
  history entry is the in-flight turn — resolve it and send its HASH
  (plus BATTLE_END if it ended the battle); if `owesPick`, send PICK.
  A rejoined client that still doesn't pay its debt within one fresh
  decision window forfeits (`forfeit_abandoned`).
- Grace expiry = forfeit (`forfeit_disconnect`); in ranked that is a
  loss for the disconnecter, full stop. A stale socket closing after a
  successful rejoin is ignored — the seat is occupied by the new
  session.

## 10. Ratings, seasons, records (TRUST §§3.4, A.7)

- Ratings live ONLY on the relay. Start 1500. Elo K=32; a player's
  first 5 ranked matches of a season use K=64 (placement). When a
  widened match crosses bands, the EXPECTATION (never a stored rating)
  is adjusted by 40 points per band of difference.
- Tiers: Rookie <1200 · Ganjuko ≥1200 · Great ≥1500 · Ultra ≥1800 ·
  Master ≥2100.
- Seasons: 8 weeks from a fixed epoch (Season 1 opens 2026-11-02T00:00Z
  in the reference config; pre-epoch ranked is shadow mode, season 0).
  Rollover is lazy and deterministic: at first touch in a new season
  the old season archives to the record's history and the rating moves
  halfway toward 1500; season W/L/D and placement counts reset.
- Stored per player, the complete inventory (TRUST §2.1): display name,
  public key, player ID, rating + tier data + season history, W/L/D,
  ban flag, review flags, last content hash. Plus, transiently: live
  match state (memory only) and replays — ranked until season close +
  30 days, casual 7 days — and a connection log (IP, timestamps, join
  events) rotated at 72 hours. Nothing else exists to leak.
- Arena Points are NOT a relay concern: AP is settled client-side by
  the game's own Arena economy (S19), exactly as in offline play.

## 11. Limits (TRUST §3.4, load-bearing)

- Messages: ≤4/second per connection (token bucket, burst 8), ≤4 KB
  per message (SNAPSHOT ≤16 KB); violations warn, then disconnect.
- Queue joins: ≤6/minute per player ID and per IP.
- Concurrent matches per player ID: 1.
- Display name ≤12 chars; team packet bounds per §5.
- HTTP admin routes require `Authorization: Bearer <ADMIN_TOKEN>`;
  with no token configured they do not exist (404). Admin surface:
  `GET /admin/stats`, `GET /admin/flags`, `GET /admin/replay/<id>`,
  `POST /admin/ban`, `POST /admin/unban`.

## 12. Versioning

The `g1` tag in the canonical string and the `ganjuko-sign-v1` tag in
the signature form are the version points. A breaking change to
either ships as `g2`/`v2` with a relay that speaks both for one
season, or not at all.
