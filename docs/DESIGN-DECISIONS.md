# Ganjuko design decisions — approved by Rene, 2026-11-01 11:14 PT ("Approved for all")

All recommended defaults in MULTIPLAYER-AND-DEPTH-DESIGN.md and
TRUST-RELEASE-AND-FLAVOR-DESIGN.md are APPROVED:

1. Arena service: ship self-hostable with online play (Phase B); Rene stands
   up the official instance on Fly.io when Ranked goes live (Phase C), so
   Season 1 has a front door. Razer = staging + hot standby, never the
   public front door.
2. Personality traits: FLAVOR-ONLY. The bond endure (bond >= 230, once per
   battle, survive a KO at 1 HP) is the single sanctioned hidden-depth
   mechanic.
3. Ranked rating: the NUMBER is shown (tiers + rating). Ratings are the
   player's ladder record, not a creature secret.
4. Season rewards: flow into the main save, modest and tier-scaled
   (AP + items like Rare Candy / evolution items / gold), capped so they
   cannot trivialize the story economy.
5. Flavor profiles: species role line appears BOTH in the Dex (describes the
   kind) and on the individual Character Sheet (describes THIS one).
6. License model: MIT for all code (game, relay, tools), CC-BY 4.0 for
   generated art + the asset library, BRAND.md reserving the Ganjuko name,
   logo, and official-service identity. No copyleft (console-build risk),
   no source-available (against the stated ethos).

Build consequence: Section 18 (level 100 + hidden IV/EV + breeding +
Character Sheet + Judge API) proceeds on these decisions as soon as the
16/17 playtest clears. Sections 19 (Arena offline) and 20 (online client +
relay) follow in order.
