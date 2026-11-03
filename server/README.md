# ganjuko-versus-relay

The official Battle Arena relay for Ganjuko: identity, matchmaking,
ratings, and replays for online versus. Design authority:
`../work/MULTIPLAYER-AND-DEPTH-DESIGN.md` §A and
`../work/TRUST-RELEASE-AND-FLAVOR-DESIGN.md` §§2–4. Wire authority:
`PROTOCOL.md`. Engine wiring: `CLIENT-INTEGRATION.md`.

## What it is, in one paragraph

A single small Node process (one dependency: `ws`). Players identify
with an Ed25519 keypair generated in the game client; the public
player ID is a hash of the public key. Matches run turn-lockstep over
a shared seeded PRNG with a canonical state hash exchanged every turn;
the server witnesses, sequences, validates teams against the legal
stat envelope, keeps Elo ratings and seasons, and retains replays.
The server never receives — and has no field for — email, passwords,
save files, or creature genetics (PROTOCOL §1, §10).

## Run

```sh
npm ci
npm start            # binds 0.0.0.0:$PORT (default 8787)
```

Production (Fly.io): `fly.toml` + `Dockerfile` in this directory; one
always-on shared-cpu-1x machine, data volume at `/data`.

## Configuration (environment only; no config files, no secrets in repo)

| Var | Meaning | Default |
|---|---|---|
| `PORT` | listen port | 8787 |
| `DATA_DIR` | players/replays/log store (owner-only) | `./var` |
| `ADMIN_TOKEN` | Bearer token for `/admin/*`; unset = admin surface does not exist | — |
| `CANARY_TOKEN` | decoy token planted in honeypot responses; unset = honeypots serve generic decoys | — |
| `CONTENT_HASH_ALLOWLIST` | comma-separated content hashes accepted at IDENT; unset = accept + record | — |
| `SEASON_EPOCH_ISO` | season 1 start (8-week seasons) | 2026-11-02T00:00:00Z |
| `RELAY_JOINS_PER_MIN` | queue-join rate limit per ID and per IP | 6 |
| `ALLOW_TEST_CLOCKS` + `RELAY_CLOCKS_JSON` | test-only clock overrides; ignored unless ALLOW_TEST_CLOCKS=1. **Never set in production.** | — |

## HTTP surface

- `GET /` — the privacy promise players read (TRUST §2.3), verbatim.
- `GET /health` — `{ ok, uptimeSec, players, queued, matches, season }`.
- `GET /admin/stats`, `GET /admin/flags`, `GET /admin/replay/<id>`,
  `POST /admin/ban`, `POST /admin/unban` — Bearer `ADMIN_TOKEN`.
- Everything else 404s. Decoy routes (`/.env`, `/wp-login.php`, …)
  exist as canary traps; hits are logged to `DATA_DIR/canary-hits.jsonl`.
- WebSocket: `/arena` (PROTOCOL.md).

## Data inventory (the complete list)

`DATA_DIR/players.json` (mode 0600): display name, public key, player
ID, rating/tier/season history, W/L/D, ban flag, review flags, last
content hash. `DATA_DIR/replays/*.json`: full match transcript
(ranked: season + 30 days; casual: 7 days). `DATA_DIR/connections.log`:
IP/timestamp/join events, pruned at 72 h. Live match state is memory
only. That is all that exists.

## Tests

```sh
npm test             # unit (20) + protocol/match integration (10)
npm run test:load    # 20 concurrent doubles matches vs a spawned server
node scripts/smoke-deployed.mjs wss://<host>/arena   # two-client match vs a live deploy
```

Game data (`data/game-data.json`) is generated from the game's own
tables: `npm run gen-data` (see `tools/gen-data.mjs`); the content
hash it reports is the Layer-2 fingerprint the client presents at
IDENT.

---
*Repo layout note: in this repository the design documents referenced
above live under `../docs/` (`MULTIPLAYER-AND-DEPTH-DESIGN.md` and
`TRUST-RELEASE-AND-FLAVOR-DESIGN.md`).*
