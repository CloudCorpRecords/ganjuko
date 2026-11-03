# Ganjuko — Trust, Release & Flavor: Design Amendment

Status: DESIGN ONLY (2026-11-01). Amends
`MULTIPLAYER-AND-DEPTH-DESIGN.md` (the "main design"). Where this
document and the main design disagree, this document wins; every such
place is flagged **[supersedes]**.
Sources of direction: Rene 2026-11-01 11:06 PT (open source + paid
Steam/console release later, one shared multiplayer for everyone,
money never gates play, the server-download worry, Fly.io + Razer
hosting) and Rene 2026-11-01 11:07 PT (stats and flavors of character
matter for the update too).

**What this amendment decides, in one breath:** the official Arena
service is a thing we *operate*, not a thing we *ship*; identity is a
keypair, not an account; verification is layered and honest about its
ceiling; the game ships open with the brand and the service as the
moat; and a creature's stat identity + personality get a named,
generated "flavor profile" that stands beside its hidden depth.

---

## 1. The worry, answered precisely

Rene's question: *if the server is open source, can people download
the server that's hosting everyone's data?*

**No — and the reason is that three different things are being called
"the server":**

1. **The code** — a recipe. A text file anyone can read, copy, and run
   *on their own machine, with their own empty database.* This is
   what open source publishes.
2. **The running service** — our instance of that recipe, executing
   on Fly.io (§4), holding live matches in memory. Nobody downloads a
   running process; they can only talk to it through the protocol,
   like any player.
3. **The data** — the ratings store and match records, which exist
   only as files on the host, behind the host's own access controls.
   They are not in the repo, not in the client, not in any download.
   §5 lists what never ships; the database is at the top of the list.

Publishing the recipe does not publish the kitchen, and it does not
publish what's cooking. A self-hoster who runs the code gets *their
own* ladder with *their own* players (main design A.8: separate
instances are separate ladders) and learns nothing about ours.

**The design rule that follows — assume the attacker has the source.**
Because the recipe *is* public, no part of the Arena's safety may
depend on secrecy: no hidden endpoints, no "the client wouldn't send
that," no secret fields in the protocol whose discovery breaks
anything. Every protection in §3 works with the attacker's full
knowledge of how it works. Anything in the main design that quietly
relied on obscurity is redesigned here; in review, exactly one
candidate was found (the session model) and it is replaced in §3.1.

**The real residual risks — named honestly, each with its handler:**

| Risk | Why source access doesn't create it, and where it's handled |
|---|---|
| Forged / tampered clients (stat forgery, fake actions) | Exists for *any* networked game, closed or open. Handled by the legal-envelope validation (main design A.5) + server-side authority (§3.3). Source access changes nothing: the envelope is computed from species data the attacker already has from their own copy of the game. |
| Impersonation (playing as someone else, faking their results) | Handled by signed actions under a per-install keypair (§3.1). Knowing the protocol doesn't yield anyone's private key. |
| Rating manipulation (win-trading, self-pairing across two installs, disconnect abuse) | Handled server-side: the service owns ratings (§3.3), adjudicates forfeits (main design A.5), retains replays, and flags anomalies for review (§3.4). |
| Protocol abuse / DoS (queue spam, oversized messages, connection floods) | Handled at the service edge: rate limits, message size caps, join throttles (already in the main design E.1 ship-gate note; §3.3 makes them load-bearing and specific). Fly.io's edge absorbs the crude end of it (§4). |
| Data breach of the official instance | Bounded by §2: the service holds almost nothing worth stealing — no emails, no passwords, no payment data, no saves, no genetics. The realistic worst case is a leaked ratings file: display names + public IDs + numbers. We design so that even success is boring. |
| Ban evasion (a banned player returns under a fresh identity) | Cannot be fully prevented without accounts/hardware ID, which we refuse to collect (§2). Mitigated by cost: a fresh key starts at zero — no rating, no tier, no history (§3.4). Named as an accepted limit, not solved with surveillance. |

**Bottom line for Rene:** the worry is understandable and, in its
specific form, unfounded — nobody can download the live service or
its data. The risks that *are* real are the ordinary risks of any
online game, and they are handled by validation and server authority,
not by hiding the code. Open source costs us secrecy we were never
actually using; it does not cost us control.

---

## 2. Data inventory + privacy

### 2.1 What the official service stores — the complete list

| Data | Form | Retention | Why it exists |
|---|---|---|---|
| Display name | Player-chosen string, ≤12 chars | Life of the rating record | Shown on VS screens (main design D.5). |
| Public player ID | Truncated hash of the player's public key (§3.1) | Life of the rating record | Identity without accounts. Not reversible to any personal info — there is none to reverse to. |
| Rating record | Current rating, tier, season history (per-season best + W/L) | Across seasons (soft-reset per main design A.7) | The ladder. Owned and mutated **only** by the service. |
| Match state | Teams-as-sent (final stats only), actions, turn hashes | Memory only; dies when the match ends | The lockstep protocol (main design A.5). |
| Audit replays | The action stream + team packets of completed matches | Ranked: until the season closes + 30 days. Casual: 7 days. Then deleted. | Dispute review and anomaly detection (§3.4). A replay contains nothing the two players didn't already see in the battle. |
| Connection logs | IP address, timestamps, join/queue events | 72 hours, then rotated out | Rate limiting and DoS response (§3.3). Never joined to the rating record except during an active abuse review. |
| Region code | Coarse region derived at connect time (e.g. `us-west`) for matchmaking latency | Session only | Pairing nearby players. Not a location record; the derived code is all that exists. |

### 2.2 What the service NEVER holds

- **No email address. No password. No account of any kind.**
- **No payment data** — Steam and the console stores sell the packaged
  game and keep every byte of that themselves.
- **No save files, no party/Box contents** beyond the six-creature
  match packet of a live match (above).
- **No IVs, EVs, bond, or any genetics** — the wire carries final
  stats only (main design hard rule 3, A.5). The service *cannot*
  leak what it never receives.
- **No real name, no birthdate, no contacts, no telemetry about the
  single-player game.** What a player does offline is invisible to
  the service by construction — it only exists while they're in the
  Arena queue or a match.

### 2.3 The privacy promise (publishable, in Rene's voice)

> Ganjuko is made by one person, with AI help, and we say so out
> loud. The Arena server keeps only what it needs to run your
> matches: the display name you pick, your public player ID, your
> rating, and replays of matches so results can be checked. It never
> asks for your email, a password, or payment details, and your save
> file never leaves your computer. We don't sell data — there's
> barely any data to sell. If this ever changes, we'll change this
> page first, in plain words, before it happens.

This paragraph goes on the repo README, the Steam page, and the
service's own landing response. It is a commitment the architecture
makes cheap to keep: you cannot accidentally leak what you never
collect.

---

## 3. Identity + client verification

Four layers. Each catches what the layer below cannot; none of them
gates *play* behind money, a store purchase, or an account.

### 3.1 Layer 1 — Per-install keypair identity **[supersedes A.5's session model]**

The main design's "display name + random session id" is replaced:

- On first Arena use, the client generates a keypair locally
  (Ed25519; generation and storage are the client's local concern,
  file in the game's user directory next to the saves).
- **Player ID = the first 16 hex chars of the SHA-256 of the public
  key.** This ID is the persistent identity: rating record, season
  history, Trial recruitment standing, and any ban all hang off it.
- Every `ACTION`, `BATTLE_END` claim, and queue join is **signed**
  with the private key; the service verifies against the public key
  presented at connect. Impersonation now requires stealing a file
  off the victim's own machine — the protocol's openness is
  irrelevant to that.
- Display names are *not* unique and carry no authority (two players
  may both be "Rene"); the player ID is the identity, the name is a
  label. VS screens may show a short ID suffix on hover/detail if
  name collisions ever confuse anyone — a display detail, not a
  security feature.
- Losing the key file = losing the ladder identity (start over at
  1500, Rookie). This is stated plainly in the Arena copy. It is the
  deliberate price of having no accounts and no recovery emails —
  we would rather lose a rating than hold everyone's email address.

### 3.2 Layer 2 — Content-manifest check (version gate)

- At queue join, the client presents a **content hash**: SHA-256 over
  the canonical species table, move/pool tables (main design A.5's
  validation data), and the engine build id.
- The service keeps an **allowlist** of content hashes (current
  release + the previous one during update windows). Mismatch =
  polite refusal: "This build's data doesn't match the Arena —
  update to play online." Single-player is never affected.
- What this layer actually does: **stops stale builds** (the top
  cause of honest desyncs), **stops lazy tampering** (edited species
  data changes the hash), and gives the service a clean lever when a
  balance patch lands (old hash retires, everyone updates).
- What it does not do (said plainly): a determined attacker can read
  the expected hash out of a legitimate client and present it from a
  modified one. The manifest is a *consistency* gate, not a *trust*
  gate. Trust lives in Layer 4.

### 3.3 Layer 3 — Store-build attestation (signal, never a gate)

- Steam builds can present a Steamworks identity ticket; console
  builds present the platform's session token. The service verifies
  these server-side when offered and records a boolean:
  `packagedBuild: true/false` on the player record.
- Uses: support triage ("is this report from the Steam build?"),
  aggregate stats, eligibility for any future cosmetic thank-you for
  supporters. **Never** uses: queue access, matchmaking priority,
  rating treatment. An open-source build and a console build are
  identical citizens in the Arena — that is Rene's rule (money never
  gates play), enforced here as protocol, not as a promise.
- Open-source builds simply never present a token. Absence is normal,
  expected, and unremarkable — it must never render differently to
  opponents.

### 3.4 Layer 4 — Server-side authority (the real wall)

Everything that matters is decided by the service, not believed from
the client:

- **Ratings move only server-side.** Clients report match *actions*;
  the service already knows the result from the agreed hashes
  (main design A.5). A client claiming "I won" about a match the
  service didn't witness has no effect — Ranked only exists inside
  witnessed matches.
- **Envelope validation before pairing completes** (main design A.5,
  unchanged): stats must lie inside the legal [IV0/EV0 … IV31/EV252]
  envelope for that species and level, moves must be legal for the
  species. Beyond-envelope forgery dies at the door. In-envelope
  forgery (perfect IVs via save editing) remains **undetectable by
  design** — restated from A.6 because it is the honest ceiling, and
  the reason season rewards stay modest (A.7).
- **Forfeits, timers, and disconnects are adjudicated by the
  service** (main design A.5 rules), so a tampered client cannot
  grief its way out of losses — leaving *is* losing.
- **Rate limits, made specific:** queue joins ≤ 6/minute per player
  ID and per IP; messages ≤ 4/second, ≤ 4 KB each; concurrent matches
  per ID = 1. Violations throttle, then disconnect. These numbers are
  config on the service, tunable without a client update.
- **Replay audit + anomaly flags:** because the service witnesses
  every action, it can flag patterns no legit client produces —
  envelope-edge teams winning at rates the envelope-max legal field
  shouldn't sustain, hash-mismatch clustering, win-trade signatures
  (two IDs repeatedly pairing with one-sided instant forfeits).
  Flags go to a review queue (at this scale: Rene, or a future
  moderator, reading flagged replays — §2.1's retention exists for
  exactly this). Sanction = **player-ID ban** from the official
  service. Self-hosts moderate themselves; a ban is per-instance.
- **Ban evasion, honestly:** a banned player can generate a fresh
  keypair and return as a nobody — 1500 rating, Rookie tier, no
  history, no recruited standing. We accept this. The alternative
  (hardware IDs, accounts, phone numbers) costs more privacy than
  the cheating costs glory, and §2 is the priority.

### 3.5 What cannot be done — the plain statement

**An open-source client can never be proven unmodified.** Any check
the client performs on itself can be patched out by the person who
owns the machine and the source; this is also true, with more
effort, of closed clients, and only consoles raise the bar
meaningfully (signed builds, platform enforcement). So the design
goal is not "prove the client is clean." It is: **a modified client
gains nothing the game doesn't already allow.** Stats are capped by
the envelope. Actions are bounded by the rules both clients execute
and the service witnesses. Ratings are the service's, not the
client's. Identity can't be borrowed. What remains to a cheater is
playing with a legally-maxed team they didn't raise — visible,
unglamorous, worth modest rewards, and one flag away from a ban.
That is the ceiling of honest design here, and we say so rather than
sell Rene a verification feature that cannot exist.

### 3.6 Console cross-play notes

- **The protocol is platform-agnostic from day one**: WebSocket +
  JSON + final-stats team packets. Nothing in Sections A.5/§3 knows
  or cares what hardware a client runs on; the official instance is
  the shared meeting place for source, Steam, and console builds —
  one ladder, one Season 1.
- **The friction is policy, not tech.** Each console platform
  certifies cross-network play separately (Sony and Nintendo
  historically gate cross-play with other platforms behind approval;
  Xbox is comparatively open). This is a per-platform application
  and certification task at packaging time, not an architecture
  change — the design needs nothing added later to support it.
- **Fallback if a platform says no at launch:** that console build
  queues in a platform-only pool *on the same service* (a queue-key
  flag, §3.3's attestation tells the service which builds are
  console builds). Same ratings code, same seasons, smaller pond —
  and it merges into the full pool the day approval lands, with no
  player action required.
- Console builds *do* strengthen Layer 3 for their own population
  (signed builds raise tampering cost) — a nice property of their
  users, never a reason to treat source-build users as suspects.

---

## 4. Hosting topology

### 4.1 Fly.io — the official production instance

- **What runs there:** exactly the main design's A.5 service — one
  small Node process (queue + pairing + relay + file-backed ratings),
  now plus §3's signature checks, allowlist, and rate limits. It is
  deliberately the smallest thing that can be an official service.
- **Shape:** one always-on small Fly Machine to start (the queue
  must exist before anyone connects, so scale-to-zero is wrong for
  the *first* machine; additional regions/machines are a
  traffic-driven later step). WebSocket traffic terminates at Fly's
  edge with TLS — the service never sees a raw socket from the
  internet. Pick the initial region by where players are (start:
  one US region; add EU when the ladder asks for it — region choice
  is config, and §2.1's region code pairs players within reach).
- **Data on Fly:** the ratings JSON lives on a Fly Volume attached
  to the service machine, with **scheduled snapshots** (daily copy
  off-volume; seasons bound the value of history anyway). The
  catastrophic case is "the ladder resets," never "user data leaks"
  — §2's minimal inventory is what makes that sentence true.
- **Cost:** the workload is a matchmaking trickle for an indie
  player base — one small always-on machine plus trivial bandwidth.
  Rene's Fly.io account holds a **$500 credit (confirmed
  2026-10-28)**, which at this scale plausibly covers the official
  service's entire first year and beyond; the design's job is to
  keep the service small enough that this stays true.
- **Operations:** deploys are `fly deploy` of the repo's
  `tools/versus-relay/` with a production config that is **not in
  the repo** (§5). Uptime duties at this scale: restart on crash
  (Fly restarts machines automatically), read the flag queue (§3.4),
  post season calendars. This is an evening-a-week operation, sized
  for a 1-person company — stated so Rene can plan, not as a
  warning.

### 4.2 The Razer — staging, standby, and the test bench (not production)

Roles the Razer is genuinely good at:

- **Staging instance**: a private, always-available copy of the
  service for testing new builds, balance patches (hash allowlist
  rehearsals, §3.2), and the two-client CDP test gate (main design
  E.2.5) before anything touches production.
- **Hot standby / backup relay**: a pre-configured instance that
  can be promoted manually (DNS/config flip) if Fly has a bad day
  mid-season. "Hot" here means *ready to start with the ratings
  snapshot restored*, not live-replicated — at this scale, a
  manual failover with a slightly stale ladder beats building
  replication.
- **Dev sparring partner**: the second client in local match tests.

**The honest caveats — why the Razer is not the production host:**
it sits on a home connection. Serving public traffic from it
publishes the household's IP address to every player and every
griefer (the §1 DoS row lands on Rene's home internet, not a
datacenter's), uptime depends on the laptop being awake and the
ISP behaving, and residential terms of service are not written
for game servers. If a day ever comes where the Razer must face
the public directly, it goes behind a tunnel that terminates
elsewhere (e.g. a Cloudflare Tunnel or a Fly-hosted proxy) so
the home IP never appears — but the default, and the
recommendation, is: **Fly serves the public; the Razer serves
Rene.**

### 4.3 Self-hosters and the shape of the whole

```
        ┌──────────────────────────────┐
        │  OFFICIAL INSTANCE (Fly.io)  │  ← source builds, Steam,
        │  one ladder · one Season 1   │    consoles all meet here
        └──────────────▲───────────────┘
                       │ same protocol (A.5 + §3)
   ┌───────────┬───────┴───────┬────────────────┐
 source build  Steam build   console build   Razer (staging/
 (any machine) (packaged)    (packaged)      standby only)

   Self-host instances (anyone's own Fly box / spare PC / Razer-class
   laptop): same code, own data, own ladder, own moderation.
   No data flows between instances. Ever.
```

The official instance's data is never distributed, mirrored to
players, or shipped anywhere — §1's three-things distinction, as a
deployment diagram.

---

## 5. Release + license model

### 5.1 What ships vs what never ships

| Ships in the repos (public) | Never ships (operational only) |
|---|---|
| Game source (plugin engine incl. Sections 18–20 client code, custom data incl. `GanjukoSpecies.json`, tools/simulator) | Production service config (Fly app name, region choices, allowlist *values* are fine — they're hashes of public data — but deploy tokens and env are not) |
| Generated art (species, tilesets, characters, asset library) | Fly.io credentials / deploy tokens; any platform (Steam/console) keys, signing certs, SDK material (also license-barred by the platforms themselves) |
| The relay service source (`tools/versus-relay/`) with a self-host README | **The live ratings database and every replay archive** — operational data, backed up privately, never committed |
| Asset library + this design documentation | Player connection logs (operational, §2.1) |
| A `SECURITY.md` stating the §3 model in brief + a reports address | The private keypairs of anything official (service has none by design; store-signing keys live with the stores) |

Mechanics: production values live in Fly secrets / local env, the
repo carries `.env.example` with placeholders, and `.gitignore`
covers data files the service writes. One pre-publish secret scan
(the standing Security Ship Gate) covers the repos before they go
public — the same gate the main repo plan already requires.

**Kadokawa boundary (unchanged, restated because this section is
about releases):** the RPG Maker MZ runtime and RTP stock assets
never redistribute (main repo plan). The open-source release is
Rene's code + Rene's data + generated art over a licensed MZ install;
the Steam/console packaged builds license MZ properly for
distribution — packaging is where that paperwork lives, and it does
not change what the repos contain.

### 5.2 License options for the GAME repo, weighed

| Option | What it means | Fit with the plan |
|---|---|---|
| **MIT everything** (code + art + name) | Anyone may fork, sell, and rebrand-freely — including selling *Ganjuko itself* under its own name. | Maximum openness, but invites a same-name clone on a storefront the week the Steam build lands, and trademark confusion lands on Rene's support door. The openness is real; so is the nuisance. |
| **Copyleft (GPL) for game code** | Derivatives must stay open-source. Blocks closed commercial clones. | Conflicts with the console plan: platform SDKs and their NDAs sit badly with GPL distribution obligations for a packaged console build. A license that endangers the console release fails its main test. |
| **Source-available custom license** (readable, not OSI-open) | Keeps control, breaks the promise. | Rene's stated position is *open source, free for those who can't afford it, no limitations on builders*. A not-really-open license contradicts the founder's own pitch and would be read as such. Rejected on ethos, not law. |
| **Code MIT + art CC-BY + brand reserved (recommended)** | Engine/tools/relay code: MIT. Generated art + asset library: CC-BY 4.0 (already the library's draft license). The name **Ganjuko**, the logo, and the official service's identity: reserved via a short `BRAND.md` — forks are welcome and must not call themselves Ganjuko or imply they're the official build/service. | See §5.3. |

(The asset library already sits at "art CC-BY 4.0 / tooling MIT,
DRAFT pending Rene's confirmation" from its own lane — this
recommendation aligns the game repo to the same split, so the whole
project carries one license story.)

### 5.3 Recommendation — and where the moat actually is

**Adopt: MIT for all code (game + relay + tools), CC-BY 4.0 for
all generated art and the asset library, `BRAND.md` reserving the
Ganjuko name/logo/official-service identity.** Decision stays
Rene's; this is the lane's clear recommendation, for these reasons:

- **The business was never secrecy.** Rene's model is: free for
  everyone, paid by those who want to support it, packaged for
  convenience. That model is *helped* by permissive code — every
  fork, port, and fan tool grows the audience the official service
  and the Steam page serve.
- **The moat is three things no license needs to protect because
  they can't be forked:** (1) the **official Arena service** — one
  ladder everyone agreed to meet on (§4); a fork can run a server,
  it cannot run *the* server with the players on it; (2) **store
  presence** — the Steam/console listings, reviews, and update
  channel under the real name; (3) **the name itself** — which is
  why `BRAND.md` exists: the one thing a clone actually needs to
  confuse buyers is the name, and that is the one thing not given
  away.
- **Console math kills copyleft** (§5.2) and the founder's own
  words kill source-available. MIT + CC-BY + brand is the only
  option that survives both the ethos and the business plan.
- **Supporter framing for the Steam page** (draft copy, Rene's
  voice, honest about the 1-person + AI company): *"Ganjuko is
  free and open source — the full game, the art, even the
  multiplayer server. This Steam version is the same game,
  packaged and kept up to date. Buying it doesn't unlock anything;
  it supports the one person (and the AI) who make it, so it
  keeps getting made. Thank you."* — "doesn't unlock anything" is
  the §3.3 rule stated as marketing: true, checkable, and the
  strongest possible pitch to exactly the audience that pays for
  open source.

---

## 6. Stats & flavor addendum (amending main design C + D)

Rene (11:07 PT): "stats and flavors of character matter for the
update too." This section makes that structural. It amends the main
design in two places: C.7's feel surfaces gain a **species stat-
identity pass** underneath them, and D.6's Character Sheet gains a
generated **flavor profile line**. Nothing here touches a hidden
number (hard rule 3 and the C.6 checklist apply verbatim).

### 6.1 Stat identity — species must *read* as somebody

The balance audit (BALANCE-AUDIT-V2) proves the stat landscape
already has the raw material of identity — huge spread, real
archetypes — and also shows where identity is currently
*accidental* rather than designed:

- BST runs from ~1,634 (unevolved kits) through a ~2,700 field mean
  to cannon-class finals; final forms average 72.5% RR wins vs
  31.9% for unevolved — stage is the loudest identity axis and
  should be *embraced*, not flattened.
- Speed is destiny in a one-shot meta: Water's sampled finals
  (mean AGI 330 vs 347–370 for every other type, mean BST 2,822 —
  the lightest cohort) lose before they fire (§4 of the audit),
  while the game's fastest class (Stormcresteon's AGI band) sits
  at a 95.8% RR record. AGI spread is identity, and it is
  currently unexamined.
- The cannon tier is real identity too: Oblivion Descend-class
  hitting power (best-hit 2,300–3,388 vs Normal's 1,977 ceiling)
  is what Earth/Umbra finals *are* — the audit's instruction is
  to watch them in Stadium, not to nerf them into the field.

**The stat-identity pass** (a design checklist run over
`baseStats` before Section 18 ships; output is a *report* with
recommended changes — species stats live in editor-owned data, so
the pass proposes, Rene disposes, exactly as with the chart fix):

1. **Assign every species a role from its numbers** (taxonomy in
   §6.2) computed from its Lv50 effective stat shares. If the
   numbers say "wall" and the name/desc say "swift hunter," one
   of them is lying — flag it. Target: zero unexplained
   mismatches across 504 species.
2. **Per-type diversity quota:** each of the 9 types must field
   at least 3 distinct roles among its final forms, including at
   least one speedster and one wall/bulwark. A type whose finals
   are all the same shape has no meta of its own.
3. **AGI honesty check:** any species in the bottom AGI quartile
   of its stage band must carry compensating bulk or power
   (top-half HP+DEF+MDF or a best-hit in its type's top third) —
   slow *and* frail *and* weak is not an identity, it's a defect
   (the audit's Crushcean profile — BST 2,290, AGI 217 — is the
   type specimen to review first).
4. **Glass must be glass:** cannon-tier offence (best-hit in the
   game's top decile) should pair with below-median defences for
   its stage. Earth/Umbra finals keep their cannons; the pass
   checks their fragility is real, so the identity is "terrifying
   and breakable," not "terrifying and inevitable."
5. **Stage bands stay wide:** do not compress the BST range to
   make audits prettier. Unevolved ≈1,600–2,100 and legendary
   finals ≈3,300+ is the correct shape; Stadium normalization
   (16.6) is where fairness lives, species data is where
   character lives.
6. **IV/EV compounding (already designed, restated as identity):**
   the species supplies the *shape*; the individual's hidden
   IVs tilt it ±(up to ~10% per stat, C.3) and EVs let a raised
   creature lean further into its shape — a wall Embit-line
   creature trained on walls becomes *more itself*. The pass
   verifies no species' shape is so extreme that IV variance
   becomes invisible on it (a stat at the floor can't tilt).

### 6.2 The flavor profile — one line that says who this creature is

**Generation rule (the whole rule, in one line):** *profile =
"a/an" + trait word + role noun*, where the **role noun** comes
from the species' stat identity (§6.1 taxonomy, computed from
stat shares) and the **trait word** is the individual's C.7
personality trait, lower-cased — species supplies the role, the
individual supplies the adjective, so two members of a species
share a silhouette and never a description.

**Role taxonomy** (from Lv50 effective stat shares; first
matching rule wins):

| Role noun | Stat shape |
|---|---|
| speedster | AGI share highest, ≥1.25× the even share |
| glass cannon | ATK or MAT in top share; HP+DEF+MDF share bottom-third |
| wall | HP+DEF+MDF share dominant; offence share bottom-third |
| bulwark | DEF or MDF highest, HP share above median (a wall that hits back a little) |
| bruiser | ATK highest, HP share above median |
| duelist | ATK + AGI both in top two shares |
| arcanist | MAT highest, MDF share above median |
| all-rounder | no share deviates >15% from even |

**Examples** (species role from the audit's stat landscape;
traits illustrative — an individual's actual trait comes from
its own C.7 roll):

| Creature | Profile | Why |
|---|---|---|
| Stormcresteon (Wind) | **a proud speedster** | The game's fastest class (95.8% RR); AGI *is* its identity. |
| Terratailius (Astral) | **a stoic glass cannon** | The last perfect record (100% RR) — cannon-tier output, final-form fragility is the price the pass protects. |
| An Umbra final form | **a fierce glass cannon** | Oblivion Descend is the largest cannon in the game (audit §3); Umbra finals are power wearing a shadow. |
| An Earth final form | **a stubborn bruiser** | Earth finals tilt the final tier (61.0% segment mean) on Earthquake/Continental Rift *and* bulk — bruiser, not glass. |
| Elderoak (Nature) | **a gentle wall** | Nature's shape is endurance; the wall role with the Gentle trait is the archetype the whole system exists to produce. |
| Marina's Crushcean (Water) | **a dreamy all-rounder** | Modest across the board (BST 2,290) — the profile honestly says "no sharp edges," and its individuality must come from trait + bond. (Also §6.1 check 3's review case.) |
| Embit (Fire, unevolved) | **a mischievous all-rounder** | Starter shape is deliberately even; the trait word does the work until evolution gives it a silhouette. |
| Zephyrhawk (Wind) | **a loyal duelist** | Strike + speed in the top shares — the duelist is the speedster's grounded sibling. |

**Where it appears:** as the Character Sheet's profile line,
directly under the temperament prose (D.6 amendment below), and
nowhere it could be mistaken for a stat — it is two words of
prose, C.6-clean by construction (role nouns describe the
*species'* public shape; the trait is already a legal word;
neither touches the individual's hidden numbers).

### 6.3 Flavor weight — equal billing, and variety with teeth

- **Layout (reinforcing D.6, not redesigning it):** on the
  Character Sheet, the prose block — species line, **flavor
  profile**, temperament line, relationship line — sits above the
  stat bars and is set in the larger text; the stat block stays
  last and quietest (D.6's rule). Registration (D.2) may show the
  profile line as the tiebreaker hint alongside the bond hearts:
  two creatures, same species, and the sheet can now say *how*
  they differ in words — "the stubborn wall" vs "the gentle
  wall" — without a single forbidden number. Flavor is not
  garnish on the sheet; it is the sheet's headline, stats are
  the footnote. That ordering is now a stated requirement for
  Section 18's build, not a suggestion.
- **Temperament variety requirements** (tightening C.7): the
  generated temperament line takes **four** inputs, not three —
  (1) highest-IV stat (inclination), (2) **second-highest-IV
  stat** (a modifier clause — "…and quicker than it looks" for
  an AGI second), (3) trait (manner), (4) bond band
  (relationship) — plus a stage frame (unevolved lines read
  younger; final forms read seasoned). Each inclination slot
  ships with **≥2 phrasing variants**. The combinatorics
  (6 inclinations × 5 seconds × 12 traits × 3 bond bands × 2
  variants) make an exact repeat across a player's own party
  vanishingly rare; two wild-caught members of the same species
  sharing a sentence should be a coincidence a player notices
  *because* it's rare. A line that reads identically for every
  member of a species is a build defect under this amendment —
  the Section 18 harness (E.2.2) gains an assertion: generate
  200 profiles for one species, require ≥95% unique temperament
  lines.
- **Species prose vs individual prose stay separate jobs:**
  species `desc` describes the *kind* (written once, in the data);
  temperament + profile describe *this one* (generated, never
  stored as text — recomputed from the profile, so it can never
  disagree with the creature).

### 6.4 Open question (one, per instructions)

**Do stat-identity prose lines also appear in the Dex species
entry (species-level), or only on individuals?**
*Default: **both, with separate jobs.*** The Dex gains a
species-level role line derived from §6.2's taxonomy alone
("Stormcresteon — a speedster kind: first to move, gone if
caught") so a player browsing the Dex learns the *kind's*
character; the individual profile line ("a proud speedster")
stays on the Character Sheet, where it describes *this one*.
Species line in the Dex, personal line on the sheet — the same
division C.7 already draws between species `desc` and
temperament, extended to stat identity. Rene can veto the Dex
half without touching the rest of §6.

---

## Cross-reference index (what this amendment changes in the main design)

| Main design | Amendment |
|---|---|
| A.5 session model ("display name + random session id") | **Superseded** by §3.1 keypair identity |
| A.5 envelope validation, lockstep, desync, forfeits | Unchanged; §3.4 makes the service's authority over them explicit |
| A.6 anti-cheat honesty | Extended by §1 (risk table) + §3.4–3.5 (flags, bans, the plain ceiling) |
| A.7 ranked seasons/rewards | Unchanged; rewards' modesty is load-bearing for §3.5 |
| C.6 never-display checklist | Unchanged; §6.2's profile line is verified against it |
| C.7 feel surfaces | Extended by §6.2 (flavor profile) + §6.3 (variety requirements + harness assertion) |
| D.2 Registration | §6.3 adds the profile line as a legal tiebreaker hint |
| D.6 Character Sheet | Reinforced by §6.3 (prose-above-stats is now a requirement) |
| E.1 ship-gate note (service is an opt-in tool) | Extended by §4–§5: the *official instance* is operated, not shipped; production config/data never enter the repos |
| E.2 test plan | §6.3 adds the 200-profile uniqueness assertion to E.2.2 |
| F Question 1 (official instance?) | **Answered by Rene's direction**: yes — an official instance is the plan (§4.1, Fly.io); self-hosting remains fully supported (§4.3) |
| F Questions 2–4 | Untouched (defaults stand as written there) |

*End of amendment.*
