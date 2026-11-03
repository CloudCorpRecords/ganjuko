# Ganjuko - Area Encounter Tables with Rarity System

Design document for the engine lane. Replaces the current per-map MZ troop
lists (which are thin, unthemed in later routes - Route 4 fields only two
species, one of them a final form) with themed, compartmentalized tables.

`speciesPos` = 1-based position in `GanjukoSpecies.json` (the positional
index `getSpecies()` uses - NOT the record `id` field; the two differ for
15 records). Names are included for human verification only.

## THE RARITY SYSTEM (global)

Encounters roll in TWO STAGES:

1. **Tier roll** - a 1,000-point roll per area (defaults below; an area may
   adjust a tier by a point or two, noted where used):
   | Tier | Points | Nominal | Effective* |
   |---|---|---|---|
   | Common | 600 | 60.0% | 61.9% |
   | Uncommon | 270 | 27.0% | 27.8% |
   | Rare | 99 | 9.9% | 10.2% |
   | Mythic | 1 | 0.1% (1-in-1,000) | 0.10% |
   | (quiet) | 30 | - re-roll - | - |

   *The remaining 30 points are "the wilds are quiet" and re-roll, so the
   effective shares are the nominal points normalized over 970. Every area
   has EXACTLY ONE Mythic species - its signature 1-in-1,000 sighting.
2. **Species roll** - within the rolled tier, species are picked by their
   per-area `weight`.

**Compartmentalization is the point**: a species' tier is a property of the
AREA, not the species. Pebblor is Common in the Cavern, Uncommon on Route 1,
Rare on Route 2. Embit is Common in its Scorched Pass home and a Rare stray
on Route 1. Home-biome species fade out entirely a few areas later.

**The Radiant Wanderer (global, 0.01% - 1-in-10,000)**: one ultra-rare
encounter above the tier system. **Solgoddess** (speciesPos 490, Astral,
"Radiant Empress of Dawn", BST 360, catchRate 3) - the only species whose
very name is radiance; the Astral legendary-adjacent with a dawn/appearance
theme rather than a final-boss theme (GenesisOmega is the Architect - that
is a story crown, not a wanderer; Chronos is time, Astralyn is a unicorn -
Solgoddess *appears*, which is what a wanderer does). Gates, all required:
4+ badges earned; rolled only inside its home biome (Route 8 - Astral
Plateau, Map023); level 40. Expected sightings: one per ~10,000 plateau
encounters - a career event, meant to be screenshot and told about, and its
catchRate of 3 means meeting it is only half the legend.

**Rarity != capture difficulty.** Encounter rarity (this system) decides
how often you MEET a species. Capture difficulty is the separate, existing
per-species `catchRate` (3-220 in the data) that decides whether the Orb
holds. A species can be common-but-slippery or rare-but-docile by design.
Where a Rare-tier species ALSO has catchRate <= 45, the two walls stack -
a deliberate "double wall". These are flagged per area and capped at ~1
per area (Route 1: Embit; Route 8: Celestiknight). Separately, three
Uncommon species carry very low catchRates (Titanite 35, Elderoak 20,
Pyrodra 20) - "catch-walls": findable, but keeping them is the challenge.
That is a different lever from rarity and is labeled as such.

**Sanity math** (per area, in the tables below): the effective chance of a
SPECIFIC Rare species per encounter = Rare tier share (10.2%) x its
within-tier weight share. Design target: a dedicated hunter meets a
specific Rare within roughly 30-60 encounters for the deepest Rare, and
~20-30 for the headline Rare. Early routes run slightly generous on
purpose.

## CHROMA (shiny system) - design note, build later

Rene greenlit exploring a color-filter variant system instead of alternate
art. Design, for the record:

- Each individual carries a hidden **Chroma flag**, rolled independently of
  species rarity at **1/1024** (default - the one number Rene still has to
  bless; 1/512 friendlier, 1/2048 harsher). At ~1/1024 a player sees a
  Chroma every few hundred encounters across a playthrough - special, not
  mythical (contrast the Wanderer at 1/10,000).
- Rendering: NO new art. The battler is drawn through a runtime
  color-matrix filter (hue rotation + partial inversion) so a Chroma reads
  instantly as "the same creature, impossibly colored". The follower/walk
  sprite approximates the same shift with a blend tint (MZ sprites cannot
  take the full matrix cheaply).
- Honesty note: pure inversion alone looks broken on some palettes
  (skin-tone-adjacent hues go corpse-blue; dark Umbra sprites go muddy).
  The filter recipe therefore needs a **per-type hue-offset table**
  (9 entries, one per type) tuned in the build lane against the real
  battler set - striking, not garish, is a tuning target, not a formula.
- Surfaces: a sparkle marker + "Chroma" tag in the Dex and on the
  creature's summary sheet (the tag is shown; the 1/1024 rate and the
  filter recipe are not player-facing numbers).
- The flag rides the SAME hidden individual seed as the IV/EV system
  (engine Section 18), so Chroma belongs to that build, not the encounter
  build. Encounter tables neither know nor care whether an individual is
  Chroma.

## AREA TABLES

JSON blocks are engine-consumable verbatim:
`mapId -> { tiers: { common: [...], uncommon: [...], rare: [...] }, mythic: {...} | null }`
(Levels are per entry; weights are within-tier.)

### Map003 - Route 1 - Kaze Trail
Biome: Meadow (Wind/Volt/Nature) | Story levels: 2-5 | Signatures: Bunspark + Galewing

Starter-family cameos: Embit is a Rare stray here (its Dex entry places it 'near volcanic springs' - it has wandered far from its Scorched Pass home, where it is Common). Tideclaw is a pond stray from the coast.
DOUBLE WALL: Embit (Rare, catchRate 45).
CATCH-WALL: Bubblix (Uncommon catch-wall, catchRate 45).
Rare math: Embit 5.1% (expect ~20 encounters); Tideclaw 5.1% (expect ~20 encounters). Mythic Raibunny: 0.10% (expect ~970 encounters).

```json
{
 "3": {
  "tiers": {
   "common": [
    {
     "speciesPos": 10,
     "name": "Bunspark",
     "weight": 30,
     "minLv": 2,
     "maxLv": 5
    },
    {
     "speciesPos": 14,
     "name": "Galewing",
     "weight": 30,
     "minLv": 2,
     "maxLv": 5
    },
    {
     "speciesPos": 7,
     "name": "Florabit",
     "weight": 20,
     "minLv": 2,
     "maxLv": 4
    },
    {
     "speciesPos": 12,
     "name": "Buzzvolt",
     "weight": 20,
     "minLv": 3,
     "maxLv": 5
    }
   ],
   "uncommon": [
    {
     "speciesPos": 16,
     "name": "Pebblor",
     "weight": 55,
     "minLv": 3,
     "maxLv": 5
    },
    {
     "speciesPos": 4,
     "name": "Bubblix",
     "weight": 45,
     "minLv": 3,
     "maxLv": 5
    }
   ],
   "rare": [
    {
     "speciesPos": 1,
     "name": "Embit",
     "weight": 50,
     "minLv": 3,
     "maxLv": 5
    },
    {
     "speciesPos": 19,
     "name": "Tideclaw",
     "weight": 50,
     "minLv": 4,
     "maxLv": 6
    }
   ]
  },
  "mythic": {
   "speciesPos": 11,
   "name": "Raibunny",
   "minLv": 6,
   "maxLv": 8
  }
 }
}
```

### Map007 - Route 2 - Zephyr Coast
Biome: Coast (Water/Wind) | Story levels: 4-8 | Signatures: Tideclaw + Serpente

Pebblor drops to Rare on the shore (out of its cave/meadow element) while it is Uncommon on Route 1 and Common in the Cavern - the compartmentalization principle in one species.
Rare math: Abysswingkit 5.6% (expect ~18 encounters); Pebblor 4.6% (expect ~22 encounters). Mythic Tidemaneius: 0.10% (expect ~970 encounters).

```json
{
 "7": {
  "tiers": {
   "common": [
    {
     "speciesPos": 19,
     "name": "Tideclaw",
     "weight": 30,
     "minLv": 4,
     "maxLv": 7
    },
    {
     "speciesPos": 21,
     "name": "Serpente",
     "weight": 25,
     "minLv": 5,
     "maxLv": 8
    },
    {
     "speciesPos": 14,
     "name": "Galewing",
     "weight": 25,
     "minLv": 4,
     "maxLv": 7
    },
    {
     "speciesPos": 10,
     "name": "Bunspark",
     "weight": 20,
     "minLv": 4,
     "maxLv": 6
    }
   ],
   "uncommon": [
    {
     "speciesPos": 12,
     "name": "Buzzvolt",
     "weight": 50,
     "minLv": 5,
     "maxLv": 8
    },
    {
     "speciesPos": 64,
     "name": "Tidemanekit",
     "weight": 50,
     "minLv": 5,
     "maxLv": 8
    }
   ],
   "rare": [
    {
     "speciesPos": 280,
     "name": "Abysswingkit",
     "weight": 55,
     "minLv": 6,
     "maxLv": 8
    },
    {
     "speciesPos": 16,
     "name": "Pebblor",
     "weight": 45,
     "minLv": 6,
     "maxLv": 8
    }
   ]
  },
  "mythic": {
   "speciesPos": 66,
   "name": "Tidemaneius",
   "minLv": 9,
   "maxLv": 11
  }
 }
}
```

### Map008 - Obsidian Cavern Mines
Biome: Cave (Earth/Umbra) | Story levels: 8-13 | Signatures: Pebblor + Shadowkit

Indoor map: no day/night variant; the Umbra share is constant. Titanite (Uncommon) has catchRate 35 - a deliberate catch-wall: easy to find, hard to keep.
CATCH-WALL: Titanite (Uncommon catch-wall, catchRate 35).
Rare math: Cryoblastkit 4.1% (expect ~24 encounters); Ursabrawl 3.1% (expect ~33 encounters); Lumihornkit 3.1% (expect ~33 encounters). Mythic Cryoblastex: 0.10% (expect ~970 encounters).

```json
{
 "8": {
  "tiers": {
   "common": [
    {
     "speciesPos": 16,
     "name": "Pebblor",
     "weight": 30,
     "minLv": 8,
     "maxLv": 11
    },
    {
     "speciesPos": 22,
     "name": "Shadowkit",
     "weight": 25,
     "minLv": 8,
     "maxLv": 11
    },
    {
     "speciesPos": 24,
     "name": "Spookid",
     "weight": 25,
     "minLv": 9,
     "maxLv": 12
    },
    {
     "speciesPos": 73,
     "name": "Boulderstridekit",
     "weight": 20,
     "minLv": 9,
     "maxLv": 12
    }
   ],
   "uncommon": [
    {
     "speciesPos": 17,
     "name": "Titanite",
     "weight": 55,
     "minLv": 10,
     "maxLv": 13
    },
    {
     "speciesPos": 106,
     "name": "Phantomhowlkit",
     "weight": 45,
     "minLv": 10,
     "maxLv": 13
    }
   ],
   "rare": [
    {
     "speciesPos": 235,
     "name": "Cryoblastkit",
     "weight": 40,
     "minLv": 11,
     "maxLv": 13
    },
    {
     "speciesPos": 28,
     "name": "Ursabrawl",
     "weight": 30,
     "minLv": 11,
     "maxLv": 13
    },
    {
     "speciesPos": 46,
     "name": "Lumihornkit",
     "weight": 30,
     "minLv": 11,
     "maxLv": 13
    }
   ]
  },
  "mythic": {
   "speciesPos": 237,
   "name": "Cryoblastex",
   "minLv": 13,
   "maxLv": 15
  }
 }
}
```

### Map011 - Route 3 - Thunder Meadow
Biome: Storm meadow (Volt/Wind) | Story levels: 10-15 | Signatures: Bunspark line + Buzzvolt

Bunspark is still Common here (same meadow belt as Route 1) but gone from later routes - home-range species fade as you leave their biome.
Rare math: Pyroclawkit 4.1% (expect ~24 encounters); Voltblastkit 3.6% (expect ~28 encounters); Graniteflightkit 2.6% (expect ~39 encounters). Mythic Pyroclaward: 0.10% (expect ~970 encounters).

```json
{
 "11": {
  "tiers": {
   "common": [
    {
     "speciesPos": 10,
     "name": "Bunspark",
     "weight": 30,
     "minLv": 10,
     "maxLv": 13
    },
    {
     "speciesPos": 12,
     "name": "Buzzvolt",
     "weight": 30,
     "minLv": 10,
     "maxLv": 13
    },
    {
     "speciesPos": 14,
     "name": "Galewing",
     "weight": 20,
     "minLv": 10,
     "maxLv": 13
    },
    {
     "speciesPos": 70,
     "name": "Sparkstridekit",
     "weight": 20,
     "minLv": 11,
     "maxLv": 14
    }
   ],
   "uncommon": [
    {
     "speciesPos": 43,
     "name": "Zephyrhornkit",
     "weight": 50,
     "minLv": 12,
     "maxLv": 15
    },
    {
     "speciesPos": 205,
     "name": "Stormmanekit",
     "weight": 50,
     "minLv": 12,
     "maxLv": 15
    }
   ],
   "rare": [
    {
     "speciesPos": 151,
     "name": "Pyroclawkit",
     "weight": 40,
     "minLv": 13,
     "maxLv": 15
    },
    {
     "speciesPos": 97,
     "name": "Voltblastkit",
     "weight": 35,
     "minLv": 13,
     "maxLv": 15
    },
    {
     "speciesPos": 124,
     "name": "Graniteflightkit",
     "weight": 25,
     "minLv": 13,
     "maxLv": 15
    }
   ]
  },
  "mythic": {
   "speciesPos": 153,
   "name": "Pyroclaward",
   "minLv": 15,
   "maxLv": 17
  }
 }
}
```

### Map015 - Route 4 - Verdant Canopy
Biome: Deep forest (Nature) | Story levels: 14-19 | Signatures: Florabit line + Elderoak

Elderoak (Uncommon, catchRate 20) is the canopy's catch-wall: the elder is findable but must be earned. Replaces the current troop table, which oddly fields Elderoak and a final form (Chronofinfang) as the route's only spawns.
CATCH-WALL: Elderoak (Uncommon catch-wall, catchRate 20).
Rare math: Phantomroarkit 4.1% (expect ~24 encounters); Solarwingkit 3.6% (expect ~28 encounters); Terrafangling 2.6% (expect ~39 encounters). Mythic Bramblemaneax: 0.10% (expect ~970 encounters).

```json
{
 "15": {
  "tiers": {
   "common": [
    {
     "speciesPos": 7,
     "name": "Florabit",
     "weight": 30,
     "minLv": 14,
     "maxLv": 17
    },
    {
     "speciesPos": 40,
     "name": "Titanscalekit",
     "weight": 25,
     "minLv": 14,
     "maxLv": 17
    },
    {
     "speciesPos": 202,
     "name": "Dawnbeakkit",
     "weight": 25,
     "minLv": 15,
     "maxLv": 18
    },
    {
     "speciesPos": 67,
     "name": "Bramblemanekit",
     "weight": 20,
     "minLv": 15,
     "maxLv": 18
    }
   ],
   "uncommon": [
    {
     "speciesPos": 8,
     "name": "Elderoak",
     "weight": 55,
     "minLv": 16,
     "maxLv": 19
    },
    {
     "speciesPos": 94,
     "name": "Sproutblastkit",
     "weight": 45,
     "minLv": 16,
     "maxLv": 19
    }
   ],
   "rare": [
    {
     "speciesPos": 256,
     "name": "Phantomroarkit",
     "weight": 40,
     "minLv": 17,
     "maxLv": 19
    },
    {
     "speciesPos": 283,
     "name": "Solarwingkit",
     "weight": 35,
     "minLv": 17,
     "maxLv": 19
    },
    {
     "speciesPos": 409,
     "name": "Terrafangling",
     "weight": 25,
     "minLv": 17,
     "maxLv": 19
    }
   ]
  },
  "mythic": {
   "speciesPos": 69,
   "name": "Bramblemaneax",
   "minLv": 19,
   "maxLv": 21
  }
 }
}
```

### Map017 - Route 5 - Scorched Pass
Biome: Volcanic pass (Fire/Earth) | Story levels: 18-24 | Signatures: Pyrodra + Embit line

Home biome of Embit (Common here, Rare on Route 1). Pyrodra (Uncommon, catchRate 20) is the pass's signature catch-wall.
CATCH-WALL: Pyrodra (Uncommon catch-wall, catchRate 20).
Rare math: Umbrafinkit 4.1% (expect ~24 encounters); Verdantwingkit 3.6% (expect ~28 encounters); Canyonhowlkit 2.6% (expect ~39 encounters). Mythic Surgeroarus: 0.10% (expect ~970 encounters).

```json
{
 "17": {
  "tiers": {
   "common": [
    {
     "speciesPos": 1,
     "name": "Embit",
     "weight": 25,
     "minLv": 18,
     "maxLv": 21
    },
    {
     "speciesPos": 34,
     "name": "Chronofinkit",
     "weight": 25,
     "minLv": 18,
     "maxLv": 21
    },
    {
     "speciesPos": 88,
     "name": "Moltenstrikekit",
     "weight": 25,
     "minLv": 19,
     "maxLv": 22
    },
    {
     "speciesPos": 223,
     "name": "Boulderprowlkit",
     "weight": 25,
     "minLv": 19,
     "maxLv": 22
    }
   ],
   "uncommon": [
    {
     "speciesPos": 2,
     "name": "Pyrodra",
     "weight": 50,
     "minLv": 20,
     "maxLv": 23
    },
    {
     "speciesPos": 115,
     "name": "Surgeroarkit",
     "weight": 50,
     "minLv": 20,
     "maxLv": 23
    }
   ],
   "rare": [
    {
     "speciesPos": 169,
     "name": "Umbrafinkit",
     "weight": 40,
     "minLv": 21,
     "maxLv": 24
    },
    {
     "speciesPos": 142,
     "name": "Verdantwingkit",
     "weight": 35,
     "minLv": 21,
     "maxLv": 24
    },
    {
     "speciesPos": 250,
     "name": "Canyonhowlkit",
     "weight": 25,
     "minLv": 21,
     "maxLv": 24
    }
   ]
  },
  "mythic": {
   "speciesPos": 117,
   "name": "Surgeroarus",
   "minLv": 24,
   "maxLv": 26
  }
 }
}
```

### Map019 - Route 6 - Skyward Ridge
Biome: High ridge (Wind) | Story levels: 22-28 | Signatures: Galewing line + Zephyrhawk

Late-game area: a final form (Zephyrhawk) is allowed in the Rare slot. Galewing remains Common across the whole wind belt (Routes 1-3 and here).
Rare math: Zephyrhawk 4.6% (expect ~22 encounters); Florafangkit 3.1% (expect ~33 encounters); Chronohornkit 2.6% (expect ~39 encounters). Mythic Galestrideite: 0.10% (expect ~970 encounters).

```json
{
 "19": {
  "tiers": {
   "common": [
    {
     "speciesPos": 14,
     "name": "Galewing",
     "weight": 30,
     "minLv": 22,
     "maxLv": 25
    },
    {
     "speciesPos": 76,
     "name": "Galestridekit",
     "weight": 25,
     "minLv": 22,
     "maxLv": 25
    },
    {
     "speciesPos": 265,
     "name": "Surgeflightkit",
     "weight": 25,
     "minLv": 23,
     "maxLv": 26
    },
    {
     "speciesPos": 103,
     "name": "Cyclonebloomkit",
     "weight": 20,
     "minLv": 23,
     "maxLv": 26
    }
   ],
   "uncommon": [
    {
     "speciesPos": 49,
     "name": "Duskcrestkit",
     "weight": 50,
     "minLv": 24,
     "maxLv": 27
    },
    {
     "speciesPos": 361,
     "name": "Torrentstrideling",
     "weight": 50,
     "minLv": 24,
     "maxLv": 27
    }
   ],
   "rare": [
    {
     "speciesPos": 15,
     "name": "Zephyrhawk",
     "weight": 45,
     "minLv": 25,
     "maxLv": 28
    },
    {
     "speciesPos": 157,
     "name": "Florafangkit",
     "weight": 30,
     "minLv": 25,
     "maxLv": 28
    },
    {
     "speciesPos": 184,
     "name": "Chronohornkit",
     "weight": 25,
     "minLv": 25,
     "maxLv": 28
    }
   ]
  },
  "mythic": {
   "speciesPos": 78,
   "name": "Galestrideite",
   "minLv": 28,
   "maxLv": 30
  }
 }
}
```

### Map021 - Route 7 - Gloom Mire
Biome: Swamp (Umbra/Water) | Story levels: 26-32 | Signatures: Shadowkit + Spookid lines

NIGHT VARIANT (the mire's Umbra residents are nocturnal in their Dex entries): at night, within-tier weights shift - Shadowkit 30->40, Spookid 25->35 in Common; Phantomhowlkit 40->50 in Rare. Day tables as listed.
Rare math: Phantomhowlkit 4.1% (expect ~24 encounters); Astrohornkit 3.6% (expect ~28 encounters); Shockfangkit 2.6% (expect ~39 encounters). Mythic Dawncrestard: 0.10% (expect ~970 encounters).

```json
{
 "21": {
  "tiers": {
   "common": [
    {
     "speciesPos": 22,
     "name": "Shadowkit",
     "weight": 30,
     "minLv": 26,
     "maxLv": 29
    },
    {
     "speciesPos": 24,
     "name": "Spookid",
     "weight": 25,
     "minLv": 26,
     "maxLv": 29
    },
    {
     "speciesPos": 214,
     "name": "Tidestridekit",
     "weight": 25,
     "minLv": 27,
     "maxLv": 30
    },
    {
     "speciesPos": 187,
     "name": "Venohornkit",
     "weight": 20,
     "minLv": 27,
     "maxLv": 30
    }
   ],
   "uncommon": [
    {
     "speciesPos": 52,
     "name": "Dawncrestkit",
     "weight": 50,
     "minLv": 28,
     "maxLv": 31
    },
    {
     "speciesPos": 160,
     "name": "Electrofangkit",
     "weight": 50,
     "minLv": 28,
     "maxLv": 31
    }
   ],
   "rare": [
    {
     "speciesPos": 106,
     "name": "Phantomhowlkit",
     "weight": 40,
     "minLv": 29,
     "maxLv": 32
    },
    {
     "speciesPos": 322,
     "name": "Astrohornkit",
     "weight": 35,
     "minLv": 29,
     "maxLv": 32
    },
    {
     "speciesPos": 295,
     "name": "Shockfangkit",
     "weight": 25,
     "minLv": 30,
     "maxLv": 32
    }
   ]
  },
  "mythic": {
   "speciesPos": 54,
   "name": "Dawncrestard",
   "minLv": 32,
   "maxLv": 34
  }
 }
}
```

### Map023 - Route 8 - Astral Plateau
Biome: Star plateau (Astral) | Story levels: 30-38 | Signatures: Astrakin

Celestiknight (Rare, final form, catchRate 40) is the plateau's double wall - rare to meet, hard to catch; the area's trophy. NIGHT NOTE: the plateau's Astral residents are star-themed; an optional night setting raises the Rare tier share from 9.9% to ~12% here (inside the adjustable band).
DOUBLE WALL: Celestiknight (Rare, catchRate 40).
Rare math: Cosmohowlkit 4.1% (expect ~24 encounters); Glaciohornkit 3.6% (expect ~28 encounters); Celestiknight 2.6% (expect ~39 encounters). Mythic Stormcresteon: 0.10% (expect ~970 encounters).

```json
{
 "23": {
  "tiers": {
   "common": [
    {
     "speciesPos": 26,
     "name": "Astrakin",
     "weight": 30,
     "minLv": 30,
     "maxLv": 34
    },
    {
     "speciesPos": 136,
     "name": "Flaresurgekit",
     "weight": 25,
     "minLv": 30,
     "maxLv": 34
    },
    {
     "speciesPos": 190,
     "name": "Titancrestkit",
     "weight": 25,
     "minLv": 31,
     "maxLv": 35
    },
    {
     "speciesPos": 244,
     "name": "Sproutbloomkit",
     "weight": 20,
     "minLv": 31,
     "maxLv": 35
    }
   ],
   "uncommon": [
    {
     "speciesPos": 163,
     "name": "Terratailkit",
     "weight": 50,
     "minLv": 33,
     "maxLv": 37
    },
    {
     "speciesPos": 55,
     "name": "Stormcrestkit",
     "weight": 50,
     "minLv": 33,
     "maxLv": 37
    }
   ],
   "rare": [
    {
     "speciesPos": 109,
     "name": "Cosmohowlkit",
     "weight": 40,
     "minLv": 35,
     "maxLv": 38
    },
    {
     "speciesPos": 325,
     "name": "Glaciohornkit",
     "weight": 35,
     "minLv": 35,
     "maxLv": 38
    },
    {
     "speciesPos": 27,
     "name": "Celestiknight",
     "weight": 25,
     "minLv": 36,
     "maxLv": 38
    }
   ]
  },
  "mythic": {
   "speciesPos": 57,
   "name": "Stormcresteon",
   "minLv": 38,
   "maxLv": 40
  }
 }
}
```

### Map025 - Victory Road Labyrinth
Biome: Elite gauntlet (mixed) | Story levels: 38-48 | Signatures: None - the gauntlet tests everything

The one area where mid/final forms are the Commons - by design, this is the final exam before the League.
DOUBLE WALL: Hydrofinis (Rare, catchRate 45); Astrofinoid (Rare, catchRate 45); Sparkprowlix (Rare, catchRate 45).
CATCH-WALL: Celestiknight (Uncommon catch-wall, catchRate 40).
Rare math: Hydrofinis 4.1% (expect ~24 encounters); Astrofinoid 3.6% (expect ~28 encounters); Sparkprowlix 2.6% (expect ~39 encounters). Mythic Terratailius: 0.10% (expect ~970 encounters).

```json
{
 "25": {
  "tiers": {
   "common": [
    {
     "speciesPos": 35,
     "name": "Chronofinfang",
     "weight": 25,
     "minLv": 38,
     "maxLv": 43
    },
    {
     "speciesPos": 32,
     "name": "Hydrofinfang",
     "weight": 25,
     "minLv": 38,
     "maxLv": 43
    },
    {
     "speciesPos": 17,
     "name": "Titanite",
     "weight": 25,
     "minLv": 39,
     "maxLv": 44
    },
    {
     "speciesPos": 8,
     "name": "Elderoak",
     "weight": 25,
     "minLv": 39,
     "maxLv": 44
    }
   ],
   "uncommon": [
    {
     "speciesPos": 15,
     "name": "Zephyrhawk",
     "weight": 50,
     "minLv": 41,
     "maxLv": 46
    },
    {
     "speciesPos": 27,
     "name": "Celestiknight",
     "weight": 50,
     "minLv": 41,
     "maxLv": 46
    }
   ],
   "rare": [
    {
     "speciesPos": 33,
     "name": "Hydrofinis",
     "weight": 40,
     "minLv": 43,
     "maxLv": 48
    },
    {
     "speciesPos": 174,
     "name": "Astrofinoid",
     "weight": 35,
     "minLv": 43,
     "maxLv": 48
    },
    {
     "speciesPos": 222,
     "name": "Sparkprowlix",
     "weight": 25,
     "minLv": 44,
     "maxLv": 48
    }
   ]
  },
  "mythic": {
   "speciesPos": 165,
   "name": "Terratailius",
   "minLv": 46,
   "maxLv": 50
  }
 }
}
```

## Radiant Wanderer - engine block

```json
"radiantWanderer": {
  "speciesPos": 490, "name": "Solgoddess", "probability": 0.0001,
  "homeMapId": 23, "minBadges": 4, "minLv": 40, "maxLv": 40,
  "note": "Rolled after the tier roll, only on Map023, only at 4+ badges. catchRate 3 is in the species data - meeting it is half the legend."
}
```

## Implementation notes for the engine lane

- Tables key on mapId; a map with no entry keeps the stock MZ troop
  behavior (towns/interiors have no wild encounters anyway).
- Time-of-day variants are specified only where noted (Route 7 night
  weight shifts; Route 8 optional night Rare-share raise). The Cavern is
  explicitly variant-free (indoor).
- Troop composition: these tables are single-species encounters, matching
  the game's current 1v1 wild battle shape.
- Weights inside a tier are relative; the engine should not need table
  edits to retune the tier shares - those live in the global tier roll.
