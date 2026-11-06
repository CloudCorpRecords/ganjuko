/*:
 * @target MZ
 * @plugindesc [v1.0.0] Ganjuko - Classic 1v1 Monster-Catching RPG Engine
 * @author Antigravity
 *
 * @help
 * ============================================================================
 * GanjukoEngine.js
 * ============================================================================
 * Transforms RPG Maker MZ into a classic 1v1 Monster-Catching RPG ("Ganjuko"):
 *
 * Features:
 *  - 1v1 Monster Battles (Active lead Ganjuko vs Wild/Trainer Ganjuko)
 *  - Custom Dual Battle HUD (Enemy top-left card, Player bottom-right card)
 *  - Player Active Ganjuko Battler Sprite rendered on the bottom-left platform
 *  - 4-Command Battle Menu: FIGHT / GANJUKO (Switch) / BAG / RUN
 *  - Type Effectiveness Multiplier + STAB + "Super Effective!" Battle Log
 *  - Ganjuko Orb Capture System (Ganjuko Orb, Great Orb, Master Orb)
 *  - 6-Slot Active Ganjuko Party + PC Storage Box (Scene_GanjukoBox)
 *  - GanjukoDex Encyclopedia Scene (Scene_GanjukoDex) in the Main Menu
 *  - Level-Up Evolution System (Starters evolve at Lv 10, wilds at Lv 11-12)
 *  - Trainer Multi-Ganjuko Wave Battles & Wild Level Scaling
 *  - Overworld Trainer Sprite + Following Lead Ganjuko Partner
 * ============================================================================
 */

(() => {
    "use strict";

    // Auto-load 504 species database
    DataManager._databaseFiles.push({ name: "$dataGanjukoSpecies", src: "GanjukoSpecies.json" });


    // =========================================================================
    // 1. GANJUKO SPECIES DEX & TYPE DEFINITIONS
    // =========================================================================

    const GANJUKO_TYPES = {
        1: { name: "NORMAL", color: "#A8A77A", textColor: "#FFFFFF" },
        2: { name: "FIRE",   color: "#EE8130", textColor: "#FFFFFF" },
        3: { name: "WATER",  color: "#6390F0", textColor: "#FFFFFF" },
        4: { name: "NATURE", color: "#7AC74C", textColor: "#FFFFFF" },
        5: { name: "VOLT",   color: "#F7D02C", textColor: "#222222" },
        6: { name: "EARTH",  color: "#E2BF65", textColor: "#222222" },
        7: { name: "WIND",   color: "#A98FF3", textColor: "#FFFFFF" },
        8: { name: "UMBRA",  color: "#705746", textColor: "#FFFFFF" },
        9: { name: "ASTRAL", color: "#6F35FC", textColor: "#FFFFFF" }
    };

    const GANJUKO_SPECIES = {
    "1": {
        "id": 1,
        "dexNo": "001",
        "name": "Embit",
        "title": "Flame Newt Ganjuko",
        "type1": 2,
        "battlerName": "Salamander",
        "characterName": "Monster",
        "characterIndex": 2,
        "catchRate": 45,
        "evolveTo": 2,
        "evolveLv": 10,
        "baseStats": {
            "hp": 48,
            "mp": 30,
            "atk": 16,
            "def": 12,
            "mat": 18,
            "mdf": 13,
            "agi": 16
        },
        "desc": "A spirited fire lizard whose tail flame burns brighter when it trusts its Trainer. Found rarely near volcanic springs."
    },
    "2": {
        "id": 2,
        "dexNo": "002",
        "name": "Pyrodra",
        "title": "Inferno Dragon Ganjuko",
        "type1": 2,
        "battlerName": "Dragon",
        "characterName": "$BigMonster1",
        "characterIndex": 0,
        "catchRate": 20,
        "evolveTo": 13,
        "evolveLv": 22,
        "baseStats": {
            "hp": 74,
            "mp": 45,
            "atk": 25,
            "def": 20,
            "mat": 28,
            "mdf": 22,
            "agi": 24
        },
        "desc": "Wings of molten flame carry Pyrodra across mountain peaks. Its searing breath can melt solid granite boulders."
    },
    "3": {
        "id": 3,
        "dexNo": "004",
        "name": "Bubblix",
        "title": "Tide Shell Ganjuko",
        "type1": 3,
        "battlerName": "SF_Kappa",
        "characterName": "Monster",
        "characterIndex": 5,
        "catchRate": 45,
        "evolveTo": 4,
        "evolveLv": 10,
        "baseStats": {
            "hp": 52,
            "mp": 32,
            "atk": 13,
            "def": 17,
            "mat": 16,
            "mdf": 17,
            "agi": 13
        },
        "desc": "An amphibious water Ganjuko that stores pressurized spring water inside its shell to jet across rivers."
    },
    "4": {
        "id": 4,
        "dexNo": "005",
        "name": "Leviatide",
        "title": "Abyssal Whale Ganjuko",
        "type1": 3,
        "battlerName": "Ketos",
        "characterName": "Monster",
        "characterIndex": 6,
        "catchRate": 20,
        "evolveTo": 14,
        "evolveLv": 22,
        "baseStats": {
            "hp": 82,
            "mp": 50,
            "atk": 21,
            "def": 27,
            "mat": 26,
            "mdf": 26,
            "agi": 19
        },
        "desc": "Ruler of deep ocean currents. A single sweep of Leviatide's massive tailfin summons crashing tidal waves."
    },
    "5": {
        "id": 5,
        "dexNo": "007",
        "name": "Florabit",
        "title": "Spore Sprite Ganjuko",
        "type1": 4,
        "battlerName": "Matango",
        "characterName": "Nature",
        "characterIndex": 3,
        "catchRate": 45,
        "evolveTo": 6,
        "evolveLv": 10,
        "baseStats": {
            "hp": 50,
            "mp": 35,
            "atk": 14,
            "def": 15,
            "mat": 17,
            "mdf": 18,
            "agi": 14
        },
        "desc": "Born from ancient forest seeds, Florabit absorbs sunlight through its cap to release soothing healing spores."
    },
    "6": {
        "id": 6,
        "dexNo": "008",
        "name": "Elderoak",
        "title": "Guardian Treant Ganjuko",
        "type1": 4,
        "battlerName": "Treant",
        "characterName": "Monster",
        "characterIndex": 7,
        "catchRate": 20,
        "evolveTo": 15,
        "evolveLv": 22,
        "baseStats": {
            "hp": 80,
            "mp": 50,
            "atk": 25,
            "def": 26,
            "mat": 25,
            "mdf": 28,
            "agi": 17
        },
        "desc": "An ancient forest guardian whose bark is harder than forged iron. Whole woodland ecosystems shelter in its boughs."
    },
    "7": {
        "id": 7,
        "dexNo": "010",
        "name": "Bunspark",
        "title": "Volt Rabbit Ganjuko",
        "type1": 5,
        "battlerName": "Tigerbunny",
        "characterName": "Nature",
        "characterIndex": 2,
        "catchRate": 190,
        "evolveTo": 16,
        "evolveLv": 14,
        "baseStats": {
            "hp": 45,
            "mp": 35,
            "atk": 15,
            "def": 11,
            "mat": 19,
            "mdf": 13,
            "agi": 24
        },
        "desc": "Static electricity crackles in its striped fur as it bounds at lightning speed through Kaze Trail's meadows."
    },
    "8": {
        "id": 8,
        "dexNo": "014",
        "name": "Galewing",
        "title": "Breeze Corvid Ganjuko",
        "type1": 7,
        "battlerName": "Crow",
        "characterName": "Nature",
        "characterIndex": 4,
        "catchRate": 220,
        "evolveTo": 9,
        "evolveLv": 11,
        "baseStats": {
            "hp": 42,
            "mp": 28,
            "atk": 16,
            "def": 11,
            "mat": 13,
            "mdf": 11,
            "agi": 22
        },
        "desc": "A sharp-eyed sky Ganjuko that rides warm thermals above Wakaba Town searching for shiny pebbles."
    },
    "9": {
        "id": 9,
        "dexNo": "015",
        "name": "Zephyrhawk",
        "title": "Storm Raptor Ganjuko",
        "type1": 7,
        "battlerName": "Birdman",
        "characterName": "Monster",
        "characterIndex": 3,
        "catchRate": 60,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 74,
            "mp": 45,
            "atk": 28,
            "def": 20,
            "mat": 23,
            "mdf": 20,
            "agi": 33
        },
        "desc": "Master of the upper winds. Zephyrhawk dives at supersonic speeds to strike before foes can even blink."
    },
    "10": {
        "id": 10,
        "dexNo": "012",
        "name": "Buzzvolt",
        "title": "Dynamo Hornet Ganjuko",
        "type1": 5,
        "battlerName": "Machinerybee",
        "characterName": "Nature",
        "characterIndex": 5,
        "catchRate": 160,
        "evolveTo": 17,
        "evolveLv": 15,
        "baseStats": {
            "hp": 46,
            "mp": 34,
            "atk": 17,
            "def": 14,
            "mat": 17,
            "mdf": 14,
            "agi": 21
        },
        "desc": "Its metallic wings hum at a resonant frequency that discharges paralyzing bio-electric jolts."
    },
    "11": {
        "id": 11,
        "dexNo": "016",
        "name": "Pebblor",
        "title": "Ore Golem Ganjuko",
        "type1": 6,
        "battlerName": "Gnome",
        "characterName": "Monster",
        "characterIndex": 4,
        "catchRate": 150,
        "evolveTo": 12,
        "evolveLv": 12,
        "baseStats": {
            "hp": 58,
            "mp": 24,
            "atk": 18,
            "def": 24,
            "mat": 10,
            "mdf": 15,
            "agi": 9
        },
        "desc": "A sturdy mineral Ganjuko that snacks on iron ore around Kurogane Town to reinforce its rocky shell."
    },
    "12": {
        "id": 12,
        "dexNo": "017",
        "name": "Titanite",
        "title": "Obsidian Colossus Ganjuko",
        "type1": 6,
        "battlerName": "Stoneknight",
        "characterName": "$BigMonster2",
        "characterIndex": 1,
        "catchRate": 35,
        "evolveTo": 18,
        "evolveLv": 24,
        "baseStats": {
            "hp": 86,
            "mp": 38,
            "atk": 29,
            "def": 33,
            "mat": 16,
            "mdf": 24,
            "agi": 13
        },
        "desc": "Forged under deep tectonic pressure, Titanite's seismic slams can split a mountain ridge in two."
    },
    "13": {
        "id": 13,
        "dexNo": "003",
        "name": "Pyroclysm",
        "title": "Calamity Wyrm Ganjuko",
        "type1": 2,
        "battlerName": "Hydra",
        "characterName": "$BigMonster1",
        "characterIndex": 0,
        "catchRate": 10,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 98,
            "mp": 65,
            "atk": 35,
            "def": 28,
            "mat": 39,
            "mdf": 30,
            "agi": 31
        },
        "desc": "The final form of Embit. Pyroclysm commands atmospheric heatwaves capable of vaporizing incoming storm clouds."
    },
    "14": {
        "id": 14,
        "dexNo": "006",
        "name": "Oceanlord",
        "title": "Trench Sovereign Ganjuko",
        "type1": 3,
        "battlerName": "Kraken",
        "characterName": "$BigMonster2",
        "characterIndex": 0,
        "catchRate": 10,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 105,
            "mp": 65,
            "atk": 28,
            "def": 36,
            "mat": 36,
            "mdf": 36,
            "agi": 24
        },
        "desc": "The towering monarch of the deepest abyss. Oceanlord manipulates vortexes and ocean trenches with godlike ease."
    },
    "15": {
        "id": 15,
        "dexNo": "009",
        "name": "Yggdrasylph",
        "title": "World Tree Ganjuko",
        "type1": 4,
        "battlerName": "Sylph",
        "characterName": "People1",
        "characterIndex": 6,
        "catchRate": 10,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 102,
            "mp": 70,
            "atk": 31,
            "def": 34,
            "mat": 35,
            "mdf": 38,
            "agi": 26
        },
        "desc": "Revered as an earthly avatar of life. Its blossoming petals restore vitality to blighted forests wherever it walks."
    },
    "16": {
        "id": 16,
        "dexNo": "011",
        "name": "Raibunny",
        "title": "Thunderstrike Hare Ganjuko",
        "type1": 5,
        "battlerName": "Caitsith",
        "characterName": "Monster",
        "characterIndex": 0,
        "catchRate": 75,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 72,
            "mp": 50,
            "atk": 26,
            "def": 19,
            "mat": 31,
            "mdf": 22,
            "agi": 38
        },
        "desc": "Lightning discharges from its ears with thunderous cracks. It outruns squalls effortlessly across open plains."
    },
    "17": {
        "id": 17,
        "dexNo": "013",
        "name": "Megavolt",
        "title": "Plasma Stinger Ganjuko",
        "type1": 5,
        "battlerName": "Plasma",
        "characterName": "Monster",
        "characterIndex": 4,
        "catchRate": 65,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 70,
            "mp": 52,
            "atk": 30,
            "def": 23,
            "mat": 28,
            "mdf": 22,
            "agi": 33
        },
        "desc": "Fitted with twin tungsten stingers that deliver 50,000 volts in a split second. A terrifically aggressive fighter."
    },
    "18": {
        "id": 18,
        "dexNo": "018",
        "name": "Geocore",
        "title": "Mantle Titan Ganjuko",
        "type1": 6,
        "battlerName": "Blackknight",
        "characterName": "$BigMonster2",
        "characterIndex": 1,
        "catchRate": 15,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 110,
            "mp": 50,
            "atk": 37,
            "def": 42,
            "mat": 20,
            "mdf": 30,
            "agi": 16
        },
        "desc": "Said to dwell near the planet's molten core. Its footsteps cause minor tremors felt miles away."
    },
    "19": {
        "id": 19,
        "dexNo": "019",
        "name": "Tideclaw",
        "title": "Coral Crab Ganjuko",
        "type1": 3,
        "battlerName": "Crab",
        "characterName": "Monster",
        "characterIndex": 1,
        "catchRate": 180,
        "evolveTo": 20,
        "evolveLv": 15,
        "baseStats": {
            "hp": 54,
            "mp": 26,
            "atk": 20,
            "def": 26,
            "mat": 12,
            "mdf": 16,
            "agi": 12
        },
        "desc": "Inhabits the shallow reefs of Zephyr Coast. Its heavy pincers can snap thick fishing line effortlessly."
    },
    "20": {
        "id": 20,
        "dexNo": "020",
        "name": "Crushcean",
        "title": "Iron Pincer Ganjuko",
        "type1": 3,
        "battlerName": "Mechascorpion",
        "characterName": "Monster",
        "characterIndex": 1,
        "catchRate": 70,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 78,
            "mp": 38,
            "atk": 33,
            "def": 38,
            "mat": 18,
            "mdf": 24,
            "agi": 18
        },
        "desc": "Encased in an iron-hard carapace that reflects incoming physical blows. A relentless shoreline guardian."
    },
    "21": {
        "id": 21,
        "dexNo": "021",
        "name": "Serpente",
        "title": "Tide Viper Ganjuko",
        "type1": 3,
        "battlerName": "SF_Anaconda",
        "characterName": "Nature",
        "characterIndex": 0,
        "catchRate": 110,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 65,
            "mp": 40,
            "atk": 25,
            "def": 18,
            "mat": 23,
            "mdf": 20,
            "agi": 27
        },
        "desc": "Glides smoothly across coastal shoals. Its fangs drip with sea venom that slows prey down."
    },
    "22": {
        "id": 22,
        "dexNo": "022",
        "name": "Shadowkit",
        "title": "Dusk Feline Ganjuko",
        "type1": 8,
        "battlerName": "SF_Shadow",
        "characterName": "Monster",
        "characterIndex": 2,
        "catchRate": 170,
        "evolveTo": 23,
        "evolveLv": 14,
        "baseStats": {
            "hp": 44,
            "mp": 36,
            "atk": 18,
            "def": 12,
            "mat": 19,
            "mdf": 14,
            "agi": 25
        },
        "desc": "Stealthily navigates shadows in Obsidian Caverns. Its luminous eyes can see in total pitch black."
    },
    "23": {
        "id": 23,
        "dexNo": "023",
        "name": "Grimmfang",
        "title": "Nether Panther Ganjuko",
        "type1": 8,
        "battlerName": "SF_Wolf",
        "characterName": "Monster",
        "characterIndex": 2,
        "catchRate": 65,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 72,
            "mp": 50,
            "atk": 32,
            "def": 20,
            "mat": 30,
            "mdf": 22,
            "agi": 36
        },
        "desc": "Strikes like a phantom from the pitch black. Opponents only notice Grimmfang after they have been struck."
    },
    "24": {
        "id": 24,
        "dexNo": "024",
        "name": "Spookid",
        "title": "Lantern Imp Ganjuko",
        "type1": 8,
        "battlerName": "Petitdevil",
        "characterName": "Monster",
        "characterIndex": 3,
        "catchRate": 150,
        "evolveTo": 25,
        "evolveLv": 16,
        "baseStats": {
            "hp": 46,
            "mp": 44,
            "atk": 14,
            "def": 14,
            "mat": 23,
            "mdf": 22,
            "agi": 20
        },
        "desc": "Lures lost travelers deeper into the Obsidian Mines with a swaying hypnotic blue flame."
    },
    "25": {
        "id": 25,
        "dexNo": "025",
        "name": "Spectrolord",
        "title": "Abyssal Wraith Ganjuko",
        "type1": 8,
        "battlerName": "Wraith",
        "characterName": "Monster",
        "characterIndex": 3,
        "catchRate": 50,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 70,
            "mp": 65,
            "atk": 20,
            "def": 22,
            "mat": 37,
            "mdf": 34,
            "agi": 28
        },
        "desc": "A spectral sovereign cloaked in midnight mist. It feeds on negative emotions and drains life essence."
    },
    "26": {
        "id": 26,
        "dexNo": "026",
        "name": "Astrakin",
        "title": "Star Fawn Ganjuko",
        "type1": 9,
        "battlerName": "Unicorn",
        "characterName": "Nature",
        "characterIndex": 1,
        "catchRate": 100,
        "evolveTo": 27,
        "evolveLv": 18,
        "baseStats": {
            "hp": 55,
            "mp": 48,
            "atk": 16,
            "def": 16,
            "mat": 24,
            "mdf": 24,
            "agi": 23
        },
        "desc": "Revered in ancient mythology. Starlight gathers on its spiraled horn to unleash radiant bursts of astral energy."
    },
    "27": {
        "id": 27,
        "dexNo": "027",
        "name": "Celestiknight",
        "title": "Astral Pegasus Ganjuko",
        "type1": 9,
        "battlerName": "Highking",
        "characterName": "Actor3",
        "characterIndex": 2,
        "catchRate": 40,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 84,
            "mp": 68,
            "atk": 27,
            "def": 26,
            "mat": 36,
            "mdf": 34,
            "agi": 32
        },
        "desc": "Wings woven from stellar dust allow Celestiknight to soar through the night stratosphere with magnificent grace."
    },
    "28": {
        "id": 28,
        "dexNo": "028",
        "name": "Ursabrawl",
        "title": "Brawler Bear Ganjuko",
        "type1": 1,
        "battlerName": "SF_Brownbear",
        "characterName": "Monster",
        "characterIndex": 0,
        "catchRate": 85,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 92,
            "mp": 32,
            "atk": 34,
            "def": 27,
            "mat": 14,
            "mdf": 19,
            "agi": 17
        },
        "desc": "Possesses devastating physical punching strength. It snaps sturdy trees with one swing to mark its territory."
    },
    "29": {
        "id": 29,
        "dexNo": "029",
        "name": "Solaris",
        "title": "Sunflare Phoenix (Legendary)",
        "type1": 2,
        "battlerName": "SF_Phoenix",
        "characterName": "$BigMonster1",
        "characterIndex": 0,
        "catchRate": 3,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 110,
            "mp": 85,
            "atk": 38,
            "def": 30,
            "mat": 45,
            "mdf": 35,
            "agi": 40
        },
        "desc": "The mythical solar guardian said to have brought light to the world. A solitary creature of immense grace and heat."
    },
    "30": {
        "id": 30,
        "dexNo": "030",
        "name": "Terramonarch",
        "title": "Colossus Sovereign (Legendary)",
        "type1": 6,
        "battlerName": "Evilgod",
        "characterName": "$BigMonster2",
        "characterIndex": 0,
        "catchRate": 3,
        "evolveTo": 0,
        "evolveLv": 0,
        "baseStats": {
            "hp": 125,
            "mp": 75,
            "atk": 44,
            "def": 46,
            "mat": 28,
            "mdf": 38,
            "agi": 20
        },
        "desc": "The ancient subterranean king sleeping beneath Kurogane Mountain. Its awakening shifts regional coastlines."
    }
};

    window.GanjukoEngine = {
        TYPES: GANJUKO_TYPES,
        SPECIES: GANJUKO_SPECIES,

        getSpecies(speciesId) {
            const id = Number(speciesId);
            if (window.$dataGanjukoSpecies && window.$dataGanjukoSpecies[id - 1]) {
                return window.$dataGanjukoSpecies[id - 1];
            }
            return GANJUKO_SPECIES[id] || GANJUKO_SPECIES[1];
        },

        // --- Fix Round 1 (2026-11-01): positional vs record-id resolution ---
        // The engine-wide speciesId convention is POSITIONAL (1-based index
        // into $dataGanjukoSpecies, as getSpecies above). The data's record
        // `id` field (== dexNo) is a DIFFERENT numbering for 15 records
        // (positions 3-17, the starter-line families), and `evolveTo` values
        // are record-id references. These helpers are the only sanctioned
        // bridge between the two numberings.
        getSpeciesByRecordId(recordId) {
            const rid = Number(recordId);
            if (window.$dataGanjukoSpecies) {
                for (let i = 0; i < window.$dataGanjukoSpecies.length; i++) {
                    const rec = window.$dataGanjukoSpecies[i];
                    if (rec && Number(rec.id) === rid) return rec;
                }
            }
            return GANJUKO_SPECIES[rid] || null;
        },

        // Positional species id of the record whose `id` field is recordId.
        speciesIdOfRecordId(recordId) {
            const rid = Number(recordId);
            if (window.$dataGanjukoSpecies) {
                for (let i = 0; i < window.$dataGanjukoSpecies.length; i++) {
                    const rec = window.$dataGanjukoSpecies[i];
                    if (rec && Number(rec.id) === rid) return i + 1;
                }
                return 0;
            }
            // Fallback table is keyed by record id, and getSpecies treats its
            // key as the species id there, so the two numberings coincide.
            return GANJUKO_SPECIES[rid] ? rid : 0;
        },

        // Positional species id of a species record object.
        speciesIdOfRecord(record) {
            if (!record) return 0;
            return this.speciesIdOfRecordId(record.id);
        },

        // Positional species id of a species record's evolution target
        // (record.evolveTo is a record-id reference), or 0 if none/unresolved.
        evolutionTargetId(sp) {
            if (!sp || !sp.evolveTo) return 0;
            return this.speciesIdOfRecordId(sp.evolveTo);
        },

        getTypeInfo(typeId) {
            return GANJUKO_TYPES[typeId] || GANJUKO_TYPES[1];
        },

        // Gives a Ganjuko to the player (Starter, Gift, or Capture)
        giveGanjuko(speciesId, level = 5, nickname = "") {
            const sp = this.getSpecies(speciesId);
            $gameSystem.registerSeen(speciesId);
            $gameSystem.registerCaught(speciesId);

            // Create or initialize an Actor instance for this species
            const actorId = this.allocateActorForSpecies(speciesId);
            const actor = $gameActors.actor(actorId);
            actor.setup(actorId);
            actor.setGanjukoSpecies(speciesId);
            if (nickname) {
                actor.setName(nickname);
            }
            actor.changeLevel(level, false);
            actor.recoverAll();

            if ($gameParty.allMembers().length < 6) {
                $gameParty.addActor(actorId);
                return { inParty: true, actor };
            } else {
                $gameSystem.addToGanjukoBox(actorId);
                return { inParty: false, actor };
            }
        },

        allocateActorForSpecies(speciesId) {
            // Actors 1..12 are base templates for Species 1..12.
            // If that actorId is already in party or box, clone a new $dataActors entry!
            const inUse = new Set([
                ...$gameParty._actors,
                ...$gameSystem.ganjukoBox()
            ]);
            if (!inUse.has(speciesId) && $dataActors[speciesId]) {
                return speciesId;
            }
            const baseData = $dataActors[speciesId] || $dataActors[1];
            const newId = $dataActors.length;
            const cloned = JsonEx.makeDeepCopy(baseData);
            cloned.id = newId;
            $dataActors[newId] = cloned;
            return newId;
        },

        // Starts a wild encounter with a specific species and level
        startWildBattle(speciesId, level, canEscape = true) {
            $gameTemp._isTrainerBattle = false;
            $gameTemp._trainerName = "";
            $gameTemp._trainerQueue = [];
            $gameTemp._wildSpeciesId = speciesId;
            $gameTemp._wildLevel = level;
            $gameTemp._ganjukoCaptured = false;

            // Troop 1..12 correspond to single-enemy troops for Species 1..12
            const troopId = Math.min(Math.max(speciesId, 1), 30);
            BattleManager.setup(troopId, canEscape, true);
            $gamePlayer.makeEncounterCount();
            SceneManager.push(Scene_Battle);
        },

        // Starts a Trainer battle with 1 or more Ganjuko: party = [{speciesId, level}, ...]
        startTrainerBattle(trainerName, trainerParty, rewardGold = 300, bgmName = "Battle2", winSwitchId = 0) {
            if (!trainerParty || trainerParty.length === 0) return;
            const first = trainerParty[0];
            $gameTemp._isTrainerBattle = true;
            $gameTemp._trainerName = trainerName;
            $gameTemp._trainerRewardGold = rewardGold;
            $gameTemp._trainerQueue = trainerParty.slice(1);
            $gameTemp._wildSpeciesId = first.speciesId;
            $gameTemp._wildLevel = first.level;
            $gameTemp._ganjukoCaptured = false;

            const troopId = Math.min(Math.max(first.speciesId, 1), 30);
            BattleManager.setup(troopId, false, true);
            if (winSwitchId > 0) {
                BattleManager.setEventCallback(n => {
                    if (n === 0) {
                        $gameSwitches.setValue(winSwitchId, true);
                    }
                });
            }
            if (bgmName) {
                AudioManager.playBgm({ name: bgmName, volume: 90, pitch: 100, pan: 0 });
            }
            SceneManager.push(Scene_Battle);
        },

        playGanjukoCry(speciesId) {
            const cryMap = {
                1: { name: "Monster1", pitch: 120 }, // Embit
                2: { name: "Monster3", pitch: 100 }, // Pyrodra
                13: { name: "Growl", pitch: 80 },    // Pyroclysm
                3: { name: "Frog", pitch: 110 },     // Bubblix
                4: { name: "Monster2", pitch: 85 },  // Leviatide
                14: { name: "Monster10", pitch: 70 },// Oceanlord
                5: { name: "Cry1", pitch: 130 },     // Florabit
                6: { name: "Monster4", pitch: 80 },  // Elderoak
                15: { name: "Saint1", pitch: 110 },  // Yggdrasylph
                7: { name: "Cry2", pitch: 140 },     // Bunspark
                16: { name: "Monster7", pitch: 120 },// Raibunny
                10: { name: "Monster5", pitch: 135 },// Buzzvolt
                17: { name: "Monster6", pitch: 125 },// Megavolt
                8: { name: "Crow", pitch: 110 },     // Galewing
                9: { name: "Monster8", pitch: 110 }, // Zephyrhawk
                11: { name: "Monster9", pitch: 95 }, // Pebblor
                12: { name: "Growl", pitch: 90 },    // Titanite
                18: { name: "Collapse1", pitch: 80 },// Geocore
                19: { name: "Bite", pitch: 110 },    // Tideclaw
                20: { name: "Monster10", pitch: 90 },// Crushcean
                21: { name: "Cry1", pitch: 90 },     // Serpente
                22: { name: "Cat", pitch: 120 },     // Shadowkit
                23: { name: "Wolf", pitch: 95 },     // Grimmfang
                24: { name: "Devil1", pitch: 130 },  // Spookid
                25: { name: "Monster8", pitch: 75 }, // Spectrolord
                26: { name: "Saint2", pitch: 120 },  // Astrakin
                27: { name: "Saint3", pitch: 100 },  // Celestiknight
                28: { name: "Growl", pitch: 105 },   // Ursabrawl
                29: { name: "Saint4", pitch: 100 },  // Solaris
                30: { name: "Growl", pitch: 65 }     // Terramonarch
            };
            // Fix Round 1: cryMap is keyed by RECORD id (see the name comments
            // above), but callers pass the engine-wide POSITIONAL species id;
            // translate before lookup so the 15 shuffled species cry correctly.
            const cryRecord = this.getSpecies(speciesId);
            const cryKey = cryRecord ? cryRecord.id : speciesId;
            let sound = cryMap[cryKey];
            if (!sound) {
                const sp = this.getSpecies(speciesId);
                const t = (sp && (sp.type || sp.type1)) || 1;
                const pool = {
                    1: "Attack1", 2: "Fire1", 3: "Water1", 4: "Wind1",
                    5: "Thunder9", 6: "Earth3", 7: "Wind3", 8: "Darkness1", 9: "Saint1"
                };
                sound = { name: pool[t] || "Monster1", pitch: 70 + ((Number(speciesId) * 17) % 75) };
            }
            AudioManager.playSe({ name: sound.name, volume: 85, pitch: sound.pitch, pan: 0 });
        },

        healAllParty() {
            for (const actor of $gameParty.allMembers()) {
                actor.recoverAll();
            }
        }
    };

    // =========================================================================
    // 2. GAME_SYSTEM: GANJUKODEX, STORAGE BOX, BADGES
    // =========================================================================

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._ganjukoSeen = {};
        this._ganjukoCaught = {};
        this._ganjukoBox = [];
        this._ganjukoBadges = [];
    };

    Game_System.prototype.ensureGanjukoData = function() {
        if (!this._ganjukoSeen) this._ganjukoSeen = {};
        if (!this._ganjukoCaught) this._ganjukoCaught = {};
        if (!this._ganjukoBox) this._ganjukoBox = [];
        if (!this._ganjukoBadges) this._ganjukoBadges = [];
    };

    Game_System.prototype.registerSeen = function(speciesId) {
        this.ensureGanjukoData();
        this._ganjukoSeen[speciesId] = true;
    };

    Game_System.prototype.registerCaught = function(speciesId) {
        this.ensureGanjukoData();
        this._ganjukoSeen[speciesId] = true;
        this._ganjukoCaught[speciesId] = true;
    };

    Game_System.prototype.isSpeciesSeen = function(speciesId) {
        this.ensureGanjukoData();
        return !!this._ganjukoSeen[speciesId];
    };

    Game_System.prototype.isSpeciesCaught = function(speciesId) {
        this.ensureGanjukoData();
        return !!this._ganjukoCaught[speciesId];
    };

    Game_System.prototype.seenCount = function() {
        this.ensureGanjukoData();
        return Object.keys(this._ganjukoSeen).length;
    };

    Game_System.prototype.caughtCount = function() {
        this.ensureGanjukoData();
        return Object.keys(this._ganjukoCaught).length;
    };

    Game_System.prototype.ganjukoBox = function() {
        this.ensureGanjukoData();
        return this._ganjukoBox;
    };

    Game_System.prototype.addToGanjukoBox = function(actorId) {
        this.ensureGanjukoData();
        if (!this._ganjukoBox.includes(actorId)) {
            this._ganjukoBox.push(actorId);
        }
    };

    Game_System.prototype.removeFromGanjukoBox = function(actorId) {
        this.ensureGanjukoData();
        this._ganjukoBox = this._ganjukoBox.filter(id => id !== actorId);
    };

    Game_System.prototype.awardBadge = function(badgeName) {
        this.ensureGanjukoData();
        if (!this._ganjukoBadges.includes(badgeName)) {
            this._ganjukoBadges.push(badgeName);
        }
    };

    Game_System.prototype.badges = function() {
        this.ensureGanjukoData();
        return this._ganjukoBadges;
    };

    // =========================================================================
    // 3. GAME_PARTY & GAME_PLAYER: 1v1 ACTIVE BATTLER + HERO OVERWORLD SPRITE
    // =========================================================================

    // Classic 1v1 Monster Battles: Only the lead Ganjuko (index 0) is active in battle!
    const _Game_Actor_gainExp = Game_Actor.prototype.gainExp;
    Game_Actor.prototype.gainExp = function(exp) {
        _Game_Actor_gainExp.call(this, exp);
        // Distribute 50% EXP share to other alive party members!
        if (this === $gameParty.allMembers()[0] && !this._inExpShareLoop) {
            this._inExpShareLoop = true;
            const shared = Math.max(1, Math.round(exp * 0.5));
            const others = $gameParty.allMembers().slice(1);
            for (const member of others) {
                if (member.isAlive()) {
                    member.gainExp(shared);
                }
            }
            this._inExpShareLoop = false;
        }
    };

    Game_Party.prototype.maxBattleMembers = function() {
        return 1;
    };

    // Ensure party name is Player's Trainer title
    Game_Party.prototype.name = function() {
        const leader = this.battleMembers()[0];
        return leader ? leader.name() : "Trainer";
    };

    
    // Overworld Following Partner Ganjuko System
    Game_Followers.prototype.setup = function() {
        this._data = [];
        this._data.push(new Game_Follower(1)); // Dedicated Partner Ganjuko follower!
    };

    Game_Follower.prototype.actor = function() {
        return $gameParty.allMembers()[0] || null;
    };

    const _Game_Follower_refresh = Game_Follower.prototype.refresh;
    Game_Follower.prototype.refresh = function() {
        const actor = this.actor();
        if (actor) {
            const charName = actor.characterName() || "$Ganjuko_Embit_Walk";
            const charIndex = actor.characterIndex() || 0;
            this.setImage(charName, charIndex);
        } else {
            this.setImage("", 0);
        }
    };

    Game_System.prototype.trainerAvatar = function() {
        return this._trainerAvatar || "$Trainer_Boy";
    };

    Game_System.prototype.setTrainerAvatar = function(avatar) {
        this._trainerAvatar = avatar;
    };

    Game_System.prototype.trainerName = function() {
        return this._trainerName || "Hiro";
    };

    Game_System.prototype.setTrainerName = function(name) {
        this._trainerName = name;
    };

    // Ensure player retains their chosen Trainer Avatar (never turning into their monster!)
    Game_Player.prototype.refresh = function() {
        const avatar = ($gameSystem && $gameSystem.trainerAvatar) ? $gameSystem.trainerAvatar() : "$Trainer_Boy";
        this.setImage(avatar, 0);
        this._followers.refresh();
    };

    // Action button interaction with your following partner Ganjuko
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (_Game_Player_triggerButtonAction.call(this)) {
            return true;
        }
        if (Input.isTriggered("ok") && !$gameMessage.isBusy()) {
            const targetX = $gameMap.roundXWithDirection(this.x, this.direction);
            const targetY = $gameMap.roundYWithDirection(this.y, this.direction);
            const follower = this._followers.follower(0);
            if (follower && follower.isVisible && follower.isVisible() && follower.x === targetX && follower.y === targetY) {
                GanjukoEngine.interactWithPartner(follower);
                return true;
            }
        }
        return false;
    };

    // Interactive Partner Responses
    GanjukoEngine.interactWithPartner = function(follower) {
        const partner = $gameParty.allMembers()[0];
        if (!partner) return;

        follower.turnTowardPlayer();
        const spId = partner.ganjukoSpeciesId();
        const name = partner.name();
        const hpRate = partner.hpRate();
        const level = partner.level;

        // Contextual Balloon & Cry
        if (hpRate < 0.3) {
            $gameTemp.requestBalloon(follower, 5); // Sweat
            AudioManager.playSe({ name: "Groan", volume: 80, pitch: 100, pan: 0 });
            $gameMessage.add("\C[14]" + name + "\C[0] is breathing heavily and looks tired from battle.");
            $gameMessage.add("A visit to the Ganjuko Center or a Potion would cheer it up!");
        } else if ($gameMap.isBush($gamePlayer.x, $gamePlayer.y) || $gameMap.mapId() === 8 || $gameMap.mapId() === 25) {
            $gameTemp.requestBalloon(follower, 1); // Exclamation
            GanjukoEngine.playGanjukoCry(spId);
            $gameMessage.add("\C[14]" + name + "\C[0] is alert, scanning the tall grass and shadows for wild foes!");
        } else if (level >= 30) {
            $gameTemp.requestBalloon(follower, 9); // Happy
            GanjukoEngine.playGanjukoCry(spId);
            $gameMessage.add("\C[14]" + name + "\C[0] stands tall with immense confidence and deep trust in you!");
        } else {
            $gameTemp.requestBalloon(follower, 4); // Heart
            GanjukoEngine.playGanjukoCry(spId);
            const happyMessages = [
                "\C[14]" + name + "\C[0] nudged your leg affectionately with a bright smile!",
                "\C[14]" + name + "\C[0] is hopping excitedly, eager for the next route!",
                "\C[14]" + name + "\C[0] leaned against you happily. The bond between you is glowing!"
            ];
            const msg = happyMessages[Math.floor(Math.random() * happyMessages.length)];
            $gameMessage.add(msg);
        }
    };


    // Wild encounters ONLY trigger in Tall Grass (Bush tiles or Region 1), just like Pokémon!
    const _Game_Player_canEncounter = Game_Player.prototype.canEncounter;
    Game_Player.prototype.canEncounter = function() {
        if (!_Game_Player_canEncounter.call(this)) return false;
        return $gameMap.isBush(this.x, this.y) || $gameMap.regionId(this.x, this.y) === 1;
    };

    // Wild encounter randomization on maps with encounterList
    const _Scene_Map_updateEncounter = Scene_Map.prototype.updateEncounter;
    Scene_Map.prototype.updateEncounter = function() {
        if ($gamePlayer.executeEncounter()) {
            const troopId = $gamePlayer.makeEncounterTroopId();
            const speciesId = Math.min(Math.max(troopId, 1), 12);
            // Determine wild level based on map
            let minLv = 2, maxLv = 5;
            if ($gameMap.mapId() === 3) {
                minLv = 3;
                maxLv = 6;
            }
            const level = minLv + Math.randomInt(maxLv - minLv + 1);
            GanjukoEngine.startWildBattle(speciesId, level, true);
        }
    };

    // =========================================================================
    // 4. GAME_ACTOR & GAME_ENEMY: SPECIES, MOVES, LEVEL SCALING & EVOLUTION
    // =========================================================================

    const _Game_Actor_setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        _Game_Actor_setup.call(this, actorId);
        const baseSpecies = Math.min(Math.max(actorId, 1), 30);
        this._ganjukoSpeciesId = this.actor().note.match(/<SpeciesId:\s*(\d+)>/i)
            ? Number(RegExp.$1)
            : baseSpecies;
        this.enforceFourMoveLimit();
    };

    Game_Actor.prototype.ganjukoSpeciesId = function() {
        if (!this._ganjukoSpeciesId) {
            this._ganjukoSpeciesId = Math.min(Math.max(this.actorId(), 1), 30);
        }
        return this._ganjukoSpeciesId;
    };

    Game_Actor.prototype.ganjukoSpecies = function() {
        return GanjukoEngine.getSpecies(this.ganjukoSpeciesId());
    };

    Game_Actor.prototype.setGanjukoSpecies = function(speciesId) {
        const sp = GanjukoEngine.getSpecies(speciesId);
        this._ganjukoSpeciesId = speciesId;
        this.setName(sp.name);
        this.setNickname(sp.title);
        this.setCharacterImage(sp.characterName, sp.characterIndex);
        this.setBattlerImage(sp.battlerName);
        if ($dataClasses[speciesId]) {
            this.changeClass(speciesId, true);
        }
        // Learn skills for current level
        for (const learning of this.currentClass().learnings) {
            if (learning.level <= this._level) {
                this.learnSkill(learning.skillId);
            }
        }
        this.enforceFourMoveLimit();
    };

    Game_Actor.prototype.ganjukoType = function() {
        return this.ganjukoSpecies().type1;
    };

    // Keep at most 4 moves (like Pokémon); newest moves replace oldest if > 4
    const _Game_Actor_learnSkill = Game_Actor.prototype.learnSkill;
    Game_Actor.prototype.learnSkill = function(skillId) {
        _Game_Actor_learnSkill.call(this, skillId);
        this.enforceFourMoveLimit();
    };

    Game_Actor.prototype.enforceFourMoveLimit = function() {
        if (this._skills && this._skills.length > 4) {
            this._skills = this._skills.slice(this._skills.length - 4);
        }
    };

    // Check evolution when leveling up
    const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
    Game_Actor.prototype.levelUp = function() {
        _Game_Actor_levelUp.call(this);
        const sp = this.ganjukoSpecies();
        if (sp.evolveTo && sp.evolveLv > 0 && this._level >= sp.evolveLv) {
            // Fix Round 1: evolveTo is a record-id reference; _pendingEvolution
            // must hold the POSITIONAL species id (see evolutionTargetId).
            this._pendingEvolution = GanjukoEngine.evolutionTargetId(sp);
        }
    };

    Game_Actor.prototype.checkAndPerformEvolution = function() {
        if (!this._pendingEvolution) return false;
        const oldSpeciesId = this.ganjukoSpeciesId();
        const newSpeciesId = this._pendingEvolution;
        this._pendingEvolution = 0;

        Scene_GanjukoEvolution.setup(this, oldSpeciesId, newSpeciesId);
        SceneManager.push(Scene_GanjukoEvolution);
        return true;
    };

    // Enemy Ganjuko Level & Dynamic Stat Scaling
    const _Game_Enemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y) {
        _Game_Enemy_setup.call(this, enemyId, x, y);
        const spId = $gameTemp._wildSpeciesId || Math.min(Math.max(enemyId, 1), 30);
        const lv = $gameTemp._wildLevel || 3;
        this.setupGanjukoEnemy(spId, lv);
    };

    Game_Enemy.prototype.setupGanjukoEnemy = function(speciesId, level) {
        const shinyRate = ($gameParty && $gameParty.hasItem($dataItems[28])) ? 0.12 : 0.04;
        this._isShiny = !$gameTemp._isTrainerBattle && (Math.random() < shinyRate); // 4% Shiny chance in wild!
        if (this._isShiny) {
            this._battlerHue = 160; // Distinctive shiny coloration!
        }
        this._ganjukoSpeciesId = speciesId;
        this._ganjukoLevel = Math.max(1, level);
        if (this._enemyId !== speciesId && $dataEnemies[speciesId]) {
            this.transform(speciesId);
        }
        this.recoverAll();
        $gameSystem.registerSeen(speciesId);
    };

    Game_Enemy.prototype.ganjukoSpeciesId = function() {
        return this._ganjukoSpeciesId || Math.min(Math.max(this.enemyId(), 1), 30);
    };

    Game_Enemy.prototype.ganjukoSpecies = function() {
        return GanjukoEngine.getSpecies(this.ganjukoSpeciesId());
    };

    Game_Enemy.prototype.ganjukoLevel = function() {
        return this._ganjukoLevel || 3;
    };

    Game_Enemy.prototype.ganjukoType = function() {
        return this.ganjukoSpecies().type1;
    };

    Game_Enemy.prototype.name = function() {
        const sp = this.ganjukoSpecies();
        return sp ? sp.name : this.originalName();
    };

    // Scale enemy stats by its level based on species baseStats
    Game_Enemy.prototype.paramBase = function(paramId) {
        const sp = this.ganjukoSpecies();
        const lv = this.ganjukoLevel();
        const bs = sp.baseStats;
        switch (paramId) {
            case 0: return Math.round(bs.hp * (0.55 + lv * 0.16)); // Max HP
            case 1: return Math.round(bs.mp * (0.60 + lv * 0.12)); // Max MP
            case 2: return Math.round(bs.atk * (0.55 + lv * 0.14)); // ATK
            case 3: return Math.round(bs.def * (0.55 + lv * 0.14)); // DEF
            case 4: return Math.round(bs.mat * (0.55 + lv * 0.14)); // MAT
            case 5: return Math.round(bs.mdf * (0.55 + lv * 0.14)); // MDF
            case 6: return Math.round(bs.agi * (0.55 + lv * 0.14)); // AGI
            case 7: return 10 + lv;
            default: return 10;
        }
    };

    Game_Enemy.prototype.exp = function() {
        const sp = this.ganjukoSpecies();
        const lv = this.ganjukoLevel();
        const bst = sp.baseStats.hp + sp.baseStats.atk + sp.baseStats.def + sp.baseStats.mat;
        return Math.round((bst * lv) / 7);
    };

    Game_Enemy.prototype.gold = function() {
        if ($gameTemp._isTrainerBattle) {
            return $gameTemp._trainerRewardGold || 250;
        }
        return this.ganjukoLevel() * 15;
    };

    // Position the single Enemy Ganjuko neatly on the upper-right battle platform
    Game_Enemy.prototype.screenX = function() {
        return 890;
    };

    Game_Enemy.prototype.screenY = function() {
        return 330;
    };

    // =========================================================================
    // 5. TYPE EFFECTIVENESS, STAB & GANJUKO ORB CAPTURE LOGIC
    // =========================================================================

    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        let value = _Game_Action_makeDamageValue.call(this, target, critical);
        const item = this.item();
        const rate = this.calcElementRate(target);
        target.result().elementRate = rate;

        // Apply 1.25x Same-Type Attack Bonus (STAB) if move matches user's Ganjuko type
        const subject = this.subject();
        const moveType = item.damage ? item.damage.elementId : 0;
        if (moveType > 1 && subject.ganjukoType && subject.ganjukoType() === moveType) {
            value = Math.round(value * 1.25);
        }
        return Math.max(1, value);
    };

    // Intercept Ganjuko Orb items in Game_Action.prototype.apply
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        const item = this.item();
        if (DataManager.isItem(item) && item.note && /<GanjukoOrb:\s*([\d.]+)>/i.test(item.note)) {
            const orbRate = parseFloat(RegExp.$1);
            this.applyGanjukoOrb(target, item, orbRate);
            return;
        }
        _Game_Action_apply.call(this, target);
    };

    const _Game_Action_applyItemEffect = Game_Action.prototype.applyItemEffect;
    Game_Action.prototype.applyItemEffect = function(target, effect) {
        _Game_Action_applyItemEffect.call(this, target, effect);
        const item = this.item();
        if (DataManager.isItem(item) && item.note && /<RareCandy:\s*(\d+)>/i.test(item.note)) {
            if (target.isActor && target.isActor() && target.level < 99) {
                target.changeLevel(target.level + 1, true);
                target.recoverAll();
                target.checkAndPerformEvolution();
                target.result().success = true;
            }
        }
        if (DataManager.isItem(item) && item.note && /<EvolutionItem:\s*"([^"]+)">/i.test(item.note)) {
            if (target.isActor && target.isActor()) {
                const reqType = RegExp.$1.trim();
                const sp = target.ganjukoSpecies();
                const typeInfo = GanjukoEngine.getTypeInfo(sp.type1 || sp.type);
                const type2Info = sp.type2 ? GanjukoEngine.getTypeInfo(sp.type2) : null;
                // Fix Round 2 (QA-D05): the old clause ended in
                // "|| sp.evolveTo > 0", which made EVERY stone work on ANY
                // species that has an evolution. The stone's type must match
                // one of the species' own types ("Normal"/"Omni" stones stay
                // universal by design).
                const matches = (reqType === "Normal" || reqType === "Omni" || reqType.toUpperCase() === typeInfo.name.toUpperCase() || (type2Info && reqType.toUpperCase() === type2Info.name.toUpperCase()));
                
                if (sp.evolveTo > 0 && matches) {
                    // Fix Round 1: resolve the record-id evolveTo to the
                    // positional species id before queueing the evolution.
                    target._pendingEvolution = GanjukoEngine.evolutionTargetId(sp);
                    target.checkAndPerformEvolution();
                    target.result().success = true;
                } else {
                    AudioManager.playSe({ name: "Buzzer1", volume: 75, pitch: 100, pan: 0 });
                    $gameMessage.add("It won't have any effect on " + target.name() + ".");
                }
            }
        }
    };

    Game_Action.prototype.applyGanjukoOrb = function(target, item, orbMultiplier) {
        const result = target.result();
        this.subject().clearResult();
        result.clear();
        result.used = true;
        result.ganjukoOrbAttempt = true;
        result.orbName = item.name;

        // Cannot capture a Trainer's Ganjuko!
        if ($gameTemp._isTrainerBattle) {
            result.orbBlockedByTrainer = true;
            // Refund the orb
            $gameParty.gainItem(item, 1);
            return;
        }

        const sp = target.ganjukoSpecies();
        const maxHp = Math.max(1, target.mhp);
        const curHp = Math.max(1, target.hp);
        const hpFactor = (3 * maxHp - 2 * curHp) / (3 * maxHp); // 0.33 at full HP -> 1.0 at 1 HP
        const statusBonus = target.states().length > 0 ? 1.5 : 1.0;

        // Catch probability formula (0.0 to 1.0)
        const rawScore = (sp.catchRate / 180) * hpFactor * orbMultiplier * statusBonus;
        const catchProb = orbMultiplier >= 100 ? 1.0 : Math.min(0.95, Math.max(0.12, rawScore));

        if (Math.random() < catchProb) {
            result.ganjukoCaught = true;
            result.wobbles = 3;
            $gameTemp._ganjukoCaptured = true;
            // Fix Round 1: store the enemy's POSITIONAL species id, not the
            // record `id` field (they differ for 15 starter-line species, and
            // processGanjukoCapture resolves this value positionally).
            $gameTemp._capturedSpeciesId = target.ganjukoSpeciesId();
            $gameTemp._capturedLevel = target.ganjukoLevel();
        } else {
            result.ganjukoCaught = false;
            result.wobbles = 1 + Math.randomInt(2);
        }
    };

    // Display Type Effectiveness & Orb Capture results in Window_BattleLog
    const _Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        const result = target.result();
        if (result.ganjukoOrbAttempt) {
            this.push("pushBaseLine");
            this.push("addText", "Trainer threw a \\C[14]" + result.orbName + "\\C[0]!");
            this.push("waitForEffect");
            if (result.orbBlockedByTrainer) {
                AudioManager.playSe({ name: "Buzzer1", volume: 90, pitch: 100, pan: 0 });
                this.push("addText", "\\C[18]The Trainer blocked the Orb! Don't be a thief!\\C[0]");
            } else {
                for (let i = 1; i <= result.wobbles; i++) {
                    this.push("addText", "*wobble*... ".repeat(i));
                }
                if (result.ganjukoCaught) {
                    this.push("addText", "\\C[11]Gotcha! Wild " + target.name() + " was caught!\\C[0]");
                } else {
                    AudioManager.playSe({ name: "Break", volume: 85, pitch: 120, pan: 0 });
                    this.push("addText", "\\C[18]Oh no! The wild " + target.name() + " broke free!\\C[0]");
                }
            }
            this.push("waitForNewLine");
            this.push("popBaseLine");
            return;
        }

        _Window_BattleLog_displayActionResults.call(this, subject, target);
    };

    const _Window_BattleLog_displayDamage = Window_BattleLog.prototype.displayDamage;
    Window_BattleLog.prototype.displayDamage = function(target) {
        const result = target.result();
        if (!result.missed && !result.evaded && result.hpAffected && result.hpDamage > 0) {
            if (result.elementRate > 1.1) {
                $gameTemp._battleBanner = { text: "★ SUPER EFFECTIVE! ★", color: "#FBBF24", duration: 80 };
            } else if (result.elementRate > 0 && result.elementRate < 0.9) {
                $gameTemp._battleBanner = { text: "IT'S NOT VERY EFFECTIVE...", color: "#94A3B8", duration: 80 };
            } else if (result.elementRate === 0) {
                $gameTemp._battleBanner = { text: "IT HAD NO EFFECT!", color: "#F87171", duration: 80 };
            }
            if (result.critical) {
                $gameTemp._battleBanner = { text: "⚡ CRITICAL HIT! ⚡", color: "#EF4444", duration: 80 };
            }

            if (result.elementRate > 1.1) {
                this.push("addText", "\\C[14]It's super effective!\\C[0]");
            } else if (result.elementRate > 0 && result.elementRate < 0.9) {
                this.push("addText", "\\C[7]It's not very effective...\\C[0]");
            }
        }
        _Window_BattleLog_displayDamage.call(this, target);
    };

    // =========================================================================
    // 6. BATTLEMANAGER: EMERGE MESSAGE, FAINT SWITCH, TRAINER WAVES & CAPTURE
    // =========================================================================

    BattleManager.displayStartMessages = function() {
        const enemy = $gameTroop.members()[0];
        if (enemy) {
            GanjukoEngine.playGanjukoCry(enemy.ganjukoSpeciesId());
        }
        const enemyTitle = enemy ? enemy.name() + " (Lv " + enemy.ganjukoLevel() + ")" : "Ganjuko";
        if ($gameTemp._isTrainerBattle) {
            $gameMessage.add("\\C[14]" + ($gameTemp._trainerName || "Trainer") + " wants to battle!\\C[0]");
            $gameMessage.add(($gameTemp._trainerName || "Trainer") + " sent out \\C[14]" + enemyTitle + "\\C[0]!");
        } else {
            $gameMessage.add("A wild \\C[14]" + enemyTitle + "\\C[0] appeared!");
        }
        const lead = $gameParty.battleMembers()[0];
        if (lead) {
            $gameMessage.add("Go! \\C[11]" + lead.name() + "\\C[0]!");
        }
    };

    const _BattleManager_checkBattleEnd = BattleManager.checkBattleEnd;
    BattleManager.checkBattleEnd = function() {
        if (this._phase) {
            // 1. Check if Wild Ganjuko was captured by an Orb!
            if ($gameTemp._ganjukoCaptured) {
                $gameTemp._ganjukoCaptured = false;
                this.processGanjukoCapture();
                return true;
            }

            // 2. If active player Ganjuko fainted, check if another party Ganjuko is alive!
            const activeLead = $gameParty.allMembers()[0];
            if (activeLead && activeLead.isDead()) {
                const nextAliveIdx = $gameParty.allMembers().findIndex(m => m.isAlive());
                if (nextAliveIdx > 0) {
                    const faintedName = activeLead.name();
                    $gameParty.swapOrder(0, nextAliveIdx);
                    const nextLead = $gameParty.allMembers()[0];
                    AudioManager.playSe({ name: "Raise1", volume: 90, pitch: 100, pan: 0 });
                    if (this._logWindow) {
                        this._logWindow.push("addText", "\\C[18]" + faintedName + " fainted!\\C[0]");
                        this._logWindow.push("addText", "\\C[11]Go! " + nextLead.name() + "!\\C[0]");
                    }
                    if (SceneManager._scene && SceneManager._scene.refreshGanjukoBattleHud) {
                        SceneManager._scene.refreshGanjukoBattleHud();
                    }
                    return false;
                }
            }

            // 3. If Enemy Ganjuko fainted in a Multi-Ganjuko Trainer Battle, send out next!
            if ($gameTroop.isAllDead() && $gameTemp._isTrainerBattle && $gameTemp._trainerQueue && $gameTemp._trainerQueue.length > 0) {
                const nextEnemyData = $gameTemp._trainerQueue.shift();
                const enemy = $gameTroop.members()[0];
                const defeatedName = enemy.name();
                const expGain = enemy.exp();
                const lead = $gameParty.battleMembers()[0];
                if (lead && lead.isAlive()) {
                    lead.gainExp(expGain);
                }

                $gameTemp._wildSpeciesId = nextEnemyData.speciesId;
                $gameTemp._wildLevel = nextEnemyData.level;
                enemy.setupGanjukoEnemy(nextEnemyData.speciesId, nextEnemyData.level);

                AudioManager.playSe({ name: "Monster1", volume: 90, pitch: 110, pan: 0 });
                if (this._logWindow) {
                    this._logWindow.push("addText", defeatedName + " fainted! (+" + expGain + " EXP)");
                    this._logWindow.push(
                        "addText",
                        "\\C[14]" + ($gameTemp._trainerName || "Trainer") + " sent out " +
                        enemy.name() + " (Lv " + enemy.ganjukoLevel() + ")!\\C[0]"
                    );
                }
                if (SceneManager._scene && SceneManager._scene.refreshGanjukoBattleHud) {
                    SceneManager._scene.refreshGanjukoBattleHud();
                }
                return false;
            }
        }
        return _BattleManager_checkBattleEnd.call(this);
    };

    BattleManager.processGanjukoCapture = function() {
        $gameParty.removeBattleStates();
        this.playVictoryMe();
        this.replayBgmAndBgs();

        const spId = $gameTemp._capturedSpeciesId || 1;
        const lv = $gameTemp._capturedLevel || 3;
        const sp = GanjukoEngine.getSpecies(spId);
        const res = GanjukoEngine.giveGanjuko(spId, lv);

        // Also award EXP for catching!
        const enemy = $gameTroop.members()[0];
        const exp = enemy ? enemy.exp() : lv * 20;
        const lead = $gameParty.battleMembers()[0];
        $gameMessage.add("\\C[11]" + sp.name + " (Lv " + lv + ") data was added to the GanjukoDex!\\C[0]");
        if (res.inParty) {
            $gameMessage.add("\\C[14]" + sp.name + " joined your active Ganjuko Party!\\C[0]");
        } else {
            $gameMessage.add("\\C[14]Party is full (6/6)! " + sp.name + " was sent to the Storage PC!\\C[0]");
        }
        if (lead && lead.isAlive()) {
            lead.gainExp(exp);
            $gameMessage.add(lead.name() + " gained " + exp + " EXP!");
        }
        for (const member of $gameParty.allMembers()) {
            member.checkAndPerformEvolution();
        }
        this.endBattle(0);
    };

    const _BattleManager_processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        // Fix Round 1 (playtest Defect #3): victory must be processed ONCE.
        // This wrapper pushes Scene_GanjukoEvolution when a member has a
        // pending evolution. MZ's SceneManager stores only the scene CLASS on
        // its stack, so popping the evolution scene builds a BRAND-NEW
        // Scene_Battle whose start() re-runs BattleManager.startBattle();
        // checkBattleEnd then sees the all-dead troop and calls processVictory
        // a second time, paying gold and EXP twice. Guard: the first call
        // processes normally; any re-entry in the same battle just ends the
        // battle cleanly (with the event callback suppressed, since the real
        // endBattle already fired it). The flag resets in BattleManager.setup.
        if (this._ganjukoVictoryProcessed) {
            const cb = this._eventCallback;
            this._eventCallback = null;
            this.endBattle(0);
            this._eventCallback = cb;
            return;
        }
        this._ganjukoVictoryProcessed = true;
        _BattleManager_processVictory.call(this);
        for (const member of $gameParty.allMembers()) {
            member.checkAndPerformEvolution();
        }
    };

    const _BattleManager_setup_fr1 = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        this._ganjukoVictoryProcessed = false;
        _BattleManager_setup_fr1.call(this, troopId, canEscape, canLose);
    };

    // Blackout recovery instead of hard Game Over screen!
    BattleManager.updateBattleEnd = function() {
        if (this.isBattleTest()) {
            AudioManager.stopBgm();
            SceneManager.exit();
        } else if (!this._escaped && $gameParty.isAllDead()) {
            GanjukoEngine.healAllParty();
            SceneManager.pop();
            // Return player to Wakaba Lab or Kurogane Center if they blacked out on a wild route
            if (!this._canLose) {
                $gameMessage.add("\\C[18]All your Ganjuko fainted!\\C[0]");
                $gameMessage.add("You scurried back to safety and restored your team to full health.");
                const respawnMap = $gameSwitches.value(10) ? 5 : 2;
                const respawnX = $gameSwitches.value(10) ? 9 : 8;
                const respawnY = $gameSwitches.value(10) ? 6 : 6;
                $gamePlayer.reserveTransfer(respawnMap, respawnX, respawnY, 8, 0);
            }
        } else {
            SceneManager.pop();
        }
        this._phase = "";
    };

    // =========================================================================
    // 7. VISUAL 1v1 BATTLE SCENE: FACING BATTLERS, DYNAMIC HUD & ATTACK LUNGES
    // =========================================================================

    // Enemy Battler: Face LEFT toward Player, dynamic idle breathing/hovering and attack lunges!
    const _Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;
    Sprite_Enemy.prototype.initMembers = function() {
        _Sprite_Enemy_initMembers.call(this);
        this._lungeTimer = 0;
        this._breathTick = Math.floor(Math.random() * 60);
    };

    const _Sprite_Enemy_updatePosition = Sprite_Enemy.prototype.updatePosition;
    Sprite_Enemy.prototype.updatePosition = function() {
        _Sprite_Enemy_updatePosition.call(this);
        if (this._enemy && this._enemy.isAlive()) {
            this._breathTick = (this._breathTick || 0) + 1;
            const breath = Math.sin(this._breathTick * 0.05) * 0.02;
            const hover = Math.sin(this._breathTick * 0.06) * 5;

            // Attack lunge animation toward player (down-left)
            let lungeX = 0, lungeY = 0;
            if (this._lungeTimer > 0) {
                this._lungeTimer--;
                const p = Math.sin((16 - this._lungeTimer) / 16 * Math.PI);
                lungeX = -p * 60; // Lunge down-left toward player
                lungeY = p * 25;
            }

            // FR4 QA-D19: battler art natively faces LEFT (toward the
            // player); the old -1.0 mirror turned every profile battler
            // AWAY from the player. +1.0 = no mirror, so foes face the
            // player and the flipped ally faces them. The P2B art-fit
            // multiplies scale.x by a positive factor and its anchor
            // correction multiplies by scale.x, so it follows the sign.
            this.scale.x = 1.0;
            this.scale.y = 1.0 + breath;
            this.x += lungeX;
            this.y += hover + lungeY;
        }
    };

    function Sprite_PlayerGanjuko() {
        this.initialize(...arguments);
    }

    Sprite_PlayerGanjuko.prototype = Object.create(Sprite.prototype);
    Sprite_PlayerGanjuko.prototype.constructor = Sprite_PlayerGanjuko;

    Sprite_PlayerGanjuko.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.anchor.x = 0.5;
        this.anchor.y = 1.0;
        this._baseX = 330;
        this._baseY = 500;
        this.x = this._baseX;
        this.y = this._baseY;
        this.scale.x = -1.0; // Flip horizontally so Player Ganjuko faces RIGHT toward Enemy!
        this.scale.y = 1.0;
        this._currentBattlerName = "";
        this._breathTick = 0;
        this._hitFlash = 0;
        this._lungeTimer = 0;
    };

    Sprite_PlayerGanjuko.prototype.triggerLunge = function() {
        this._lungeTimer = 16;
    };

    Sprite_PlayerGanjuko.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const actor = $gameParty.battleMembers()[0];
        if (!actor) {
            this.visible = false;
            return;
        }
        this.visible = actor.isAlive();
        const bName = actor.ganjukoSpecies().battlerName;
        if (this._currentBattlerName !== bName) {
            this._currentBattlerName = bName;
            this.bitmap = ImageManager.loadEnemy(bName);
        }

        // Idle breathing animation
        this._breathTick = (this._breathTick + 1) % 120;
        const breath = Math.sin((this._breathTick / 120) * Math.PI * 2) * 0.025;

        // Attack lunge animation toward enemy (up-right)
        let lungeX = 0, lungeY = 0;
        if (this._lungeTimer > 0) {
            this._lungeTimer--;
            const p = Math.sin((16 - this._lungeTimer) / 16 * Math.PI);
            lungeX = p * 60; // Lunge up-right toward enemy
            lungeY = -p * 25;
        }

        this.scale.x = -1.0; // Facing RIGHT toward Enemy Ganjuko
        this.scale.y = 1.0 + breath;

        // Shake when taking damage and flash red
        if (actor.result() && actor.result().hpAffected && actor.result().hpDamage > 0 && this._hitFlash === 0) {
            this._hitFlash = 16;
        }
        if (this._hitFlash > 0) {
            this._hitFlash--;
            this.x = this._baseX + (this._hitFlash % 4 < 2 ? -8 : 8) + lungeX;
            this.y = this._baseY + lungeY;
            this.setBlendColor([255, 100, 100, 140]);
        } else {
            this.x = this._baseX + lungeX;
            this.y = this._baseY + lungeY;
            this.setBlendColor([0, 0, 0, 0]);
        }
    };

    // Fast and snappy battle action logs & triggers for lunges
    const _Window_BattleLog_performAction = Window_BattleLog.prototype.performAction;
    Window_BattleLog.prototype.performAction = function(subject, action) {
        _Window_BattleLog_performAction.call(this, subject, action);
        if (SceneManager._scene && SceneManager._scene._spriteset) {
            if (subject.isActor() && SceneManager._scene._spriteset._playerGanjukoSprite) {
                SceneManager._scene._spriteset._playerGanjukoSprite.triggerLunge();
            } else if (subject.isEnemy()) {
                const enemySprites = SceneManager._scene._spriteset._enemySprites;
                if (enemySprites && enemySprites[0]) {
                    enemySprites[0]._lungeTimer = 16;
                }
            }
        }
    };

    Window_BattleLog.prototype.messageSpeed = function() {
        return 12; // FR4 QA-D22 pacing: readable battle log pace (was 8, half of MZ stock)
    };

    // Position Help Window right above the bottom command area so the entire top battlefield and HP bars are never obstructed!
    Scene_Battle.prototype.helpAreaTop = function() {
        return Graphics.boxHeight - this.windowAreaHeight() - this.helpAreaHeight();
    };

    // Dual Pokémon-style HUD Overlay:
    // Left side: Player Ally Card (directly alongside Player Ganjuko)
    // Right side: Opponent Foe Card (directly above Opponent Ganjuko)
    function Sprite_GanjukoBattleHud() {
        this.initialize(...arguments);
    }

    Sprite_GanjukoBattleHud.prototype = Object.create(Sprite.prototype);
    Sprite_GanjukoBattleHud.prototype.constructor = Sprite_GanjukoBattleHud;

    Sprite_GanjukoBattleHud.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._enemyDispRate = null;
        this._playerDispRate = null;
        this._expDispRate = null;
        this._lastStateHash = "";
    };

    Sprite_GanjukoBattleHud.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const actor = $gameParty.battleMembers()[0];
        const enemy = $gameTroop.members()[0];

        const targetEnemyRate = (enemy && enemy.mhp > 0 && enemy.isAlive()) ? Math.max(0, Math.min(1, enemy.hp / enemy.mhp)) : 0;
        const targetPlayerRate = (actor && actor.mhp > 0 && actor.isAlive()) ? Math.max(0, Math.min(1, actor.hp / actor.mhp)) : 0;

        const nextExp = actor ? (actor.nextLevelExp() - actor.currentLevelExp()) : 1;
        const curExp = actor ? (actor.currentExp() - actor.currentLevelExp()) : 0;
        const targetExpRate = nextExp > 0 ? Math.max(0, Math.min(1, curExp / nextExp)) : 1;

        if (this._enemyDispRate === null) this._enemyDispRate = targetEnemyRate;
        if (this._playerDispRate === null) this._playerDispRate = targetPlayerRate;
        if (this._expDispRate === null) this._expDispRate = targetExpRate;

        let needsRedraw = false;
        const drainSpeed = 0.012; // FR4 QA-D22 pacing: full bar ~1.4s so damage registers (was 0.025)

        // Smoothly drain/fill Enemy HP
        if (Math.abs(this._enemyDispRate - targetEnemyRate) > 0.003) {
            if (this._enemyDispRate > targetEnemyRate) {
                this._enemyDispRate = Math.max(targetEnemyRate, this._enemyDispRate - drainSpeed);
            } else {
                this._enemyDispRate = Math.min(targetEnemyRate, this._enemyDispRate + drainSpeed);
            }
            needsRedraw = true;
        } else {
            this._enemyDispRate = targetEnemyRate;
        }

        // Smoothly drain/fill Player HP
        if (Math.abs(this._playerDispRate - targetPlayerRate) > 0.003) {
            if (this._playerDispRate > targetPlayerRate) {
                this._playerDispRate = Math.max(targetPlayerRate, this._playerDispRate - drainSpeed);
            } else {
                this._playerDispRate = Math.min(targetPlayerRate, this._playerDispRate + drainSpeed);
            }
            needsRedraw = true;
        } else {
            this._playerDispRate = targetPlayerRate;
        }

        // Smoothly fill EXP bar
        if (Math.abs(this._expDispRate - targetExpRate) > 0.003) {
            this._expDispRate += (targetExpRate - this._expDispRate) * 0.03; // FR4 QA-D22: ~1s victory fill (was 0.1)
            needsRedraw = true;
        } else {
            this._expDispRate = targetExpRate;
        }

        const hash = [
            actor ? `${actor.name()}_${actor.level}_${actor.hp}_${actor.mhp}_${actor.mp}_${actor.mmp}` : "none",
            enemy ? `${enemy.name()}_${enemy.ganjukoLevel()}_${enemy.hp}_${enemy.mhp}_${enemy.isAlive()}` : "none",
            $gameParty.allMembers().map(m => `${m.hp}`).join(",")
        ].join("|");

        // FR4 QA-D22 nit: while an effectiveness/crit banner is live, keep
        // redrawing so its duration ticks down in real time and it erases
        // itself; otherwise the last drawn frame (banner included) freezes
        // on the HUD bitmap over the victory message.
        if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._battleBanner && $gameTemp._battleBanner.duration > 0) {
            needsRedraw = true;
        }

        if (needsRedraw || hash !== this._lastStateHash) {
            this._lastStateHash = hash;
            this.redrawHud(actor, enemy, this._playerDispRate, this._enemyDispRate, this._expDispRate);
        }
    };

    Sprite_GanjukoBattleHud.prototype.redrawHud = function(actor, enemy, playerHpRate, enemyHpRate, expRate) {
        const bmp = this.bitmap;
        bmp.clear();

        // 1. OPPONENT / FOE CARD (Upper-Right directly above Opponent Ganjuko at x=890, y=330)
        if (enemy && enemy.isAlive()) {
            const ew = 410, eh = 106;
            const ex = Graphics.boxWidth - ew - 36; // 834
            const ey = 28;
            this.drawCardBox(bmp, ex, ey, ew, eh, "rgba(24, 20, 32, 0.94)", "#F87171");

            const sp = enemy.ganjukoSpecies();
            const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);

            // [FOE] Badge & Name
            bmp.fontSize = 20;
            bmp.textColor = "#F87171";
            bmp.drawText("⚔ [FOE]", ex + 16, ey + 10, 85, 28, "left");

            bmp.fontSize = 22;
            bmp.textColor = "#FFFFFF";
            bmp.drawText((enemy._isShiny ? "★ " : "") + enemy.name(), ex + 102, ey + 10, 155, 28, "left");

            // Caught indicator if species is already in Dex
            // Fix Round 1: the caught registry is keyed by POSITIONAL id.
            if ($gameSystem.isSpeciesCaught(enemy.ganjukoSpeciesId())) {
                bmp.fontSize = 14;
                bmp.textColor = "#38BDF8";
                bmp.drawText("[CAUGHT]", ex + 258, ey + 12, 70, 24, "left");
            }

            // Level on the right
            bmp.fontSize = 20;
            bmp.textColor = "#FACC15";
            bmp.drawText("Lv" + enemy.ganjukoLevel(), ex + ew - 86, ey + 10, 70, 28, "right");

            // Type Badge & Status Pill
            this.drawTypeBadge(bmp, typeInfo, ex + 265, ey + 10);
            this.drawStatusPill(bmp, enemy, ex + 195, ey + 11);

            // Animated HP Bar with distinct [HP] indicator
            const actualRate = (enemyHpRate !== undefined) ? enemyHpRate : Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.mhp)));
            this.drawHpBar(bmp, ex + 16, ey + 46, ew - 32, 20, actualRate);

            // HP percentage & remaining Trainer Orbs (v13: this legacy
            // redrawHud body is superseded by the P2B plate renderer, but
            // the raw-HP line is scrubbed regardless — HP rule, no
            // exceptions: bars + percentage only.)
            bmp.fontSize = 16;
            bmp.textColor = "#CBD5E1";
            bmp.drawText("HP " + GanjukoEngine.hpPercent(enemy.hp, enemy.mhp) + "%", ex + 16, ey + 72, 180, 24, "left");

            if ($gameTemp._isTrainerBattle && $gameTemp._trainerQueue) {
                const rem = 1 + $gameTemp._trainerQueue.length;
                bmp.textColor = "#F87171";
                bmp.drawText(`Trainer: ${"●".repeat(rem)}`, ex + 180, ey + 72, ew - 196, 24, "right");
            }
        }

        // 2. PLAYER / ALLY CARD (Mid-Left directly beside Player Ganjuko at x=330, y=500)
        if (actor) {
            const pw = 420, ph = 124;
            const px = 36;
            const py = 280;
            this.drawCardBox(bmp, px, py, pw, ph, "rgba(15, 23, 42, 0.94)", "#38BDF8");

            const sp = actor.ganjukoSpecies();
            const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);

            // [ALLY] Badge & Name
            bmp.fontSize = 20;
            bmp.textColor = "#38BDF8";
            bmp.drawText("★ [ALLY]", px + 16, py + 10, 88, 28, "left");

            bmp.fontSize = 22;
            bmp.textColor = "#FFFFFF";
            bmp.drawText(actor.name(), px + 108, py + 10, 155, 28, "left");

            // Level on the right
            bmp.fontSize = 20;
            bmp.textColor = "#FACC15";
            bmp.drawText("Lv" + actor.level, px + pw - 86, py + 10, 70, 28, "right");

            // Type Badge & Status Pill
            this.drawTypeBadge(bmp, typeInfo, px + 265, py + 10);
            this.drawStatusPill(bmp, actor, px + 195, py + 11);
            this.drawEffectivenessBanner(bmp);

            // Animated HP Bar with distinct [HP] indicator
            const actualPlayerRate = (playerHpRate !== undefined) ? playerHpRate : Math.max(0, Math.min(1, actor.hp / Math.max(1, actor.mhp)));
            this.drawHpBar(bmp, px + 16, py + 46, pw - 32, 20, actualPlayerRate);

            // Numeric HP & PP
            bmp.fontSize = 16;
            bmp.textColor = "#E2E8F0";
            bmp.drawText(`HP ${actor.hp}/${actor.mhp}`, px + 16, py + 72, 140, 24, "left");

            bmp.textColor = "#60A5FA";
            bmp.drawText(`PP ${actor.mp}/${actor.mmp}`, px + 155, py + 72, 130, 24, "left");

            // Party Balls indicator
            const partyOrbs = $gameParty.allMembers().map(m => (m.isAlive() ? "●" : "○")).join(" ");
            bmp.textColor = "#34D399";
            bmp.drawText(partyOrbs, px + 285, py + 72, pw - 300, 24, "right");

            // Animated EXP Bar
            const actualExpRate = (expRate !== undefined) ? expRate : 0;
            bmp.fillRect(px + 16, py + 102, pw - 32, 8, "#0F172A");
            bmp.fillRect(px + 17, py + 103, pw - 34, 6, "#1E293B");
            const expFillW = Math.round((pw - 34) * actualExpRate);
            if (expFillW > 0) {
                bmp.fillRect(px + 17, py + 103, expFillW, 6, "#38BDF8");
                bmp.fillRect(px + 17, py + 103, expFillW, 2, "rgba(255, 255, 255, 0.5)");
            }
            bmp.fontSize = 12;
            bmp.textColor = "#94A3B8";
            bmp.drawText("EXP", px + 16, py + 111, 40, 16, "left");
        }
    };

    Sprite_GanjukoBattleHud.prototype.drawStatusPill = function(bmp, battler, x, y) {
        if (!battler) return;
        // v13 (Champions v2 §2.8): correct state->chip mapping — the old
        // code read PAR from state 6 and SLP from state 5, both wrong.
        // Letters only, never numbers. Confusion rides as a small OUTLINED
        // CNF mini-chip beside the major pill (it is a volatile, not a
        // major status). Stage pips (v1 §2.5) draw under the pill.
        let text = "", color = "";
        if (battler.isStateAffected(11)) { text = "BRN"; color = "#EF4444"; } // Burn
        else if (battler.isStateAffected(31)) { text = "TOX"; color = "#7C3AED"; } // Badly Poisoned
        else if (battler.isStateAffected(4)) { text = "PSN"; color = "#A855F7"; } // Poison
        else if (battler.isStateAffected(12)) { text = "PAR"; color = "#F59E0B"; } // Paralysis
        else if (battler.isStateAffected(10)) { text = "SLP"; color = "#64748B"; } // Sleep
        else if (battler.isStateAffected(14)) { text = "FRZ"; color = "#06B6D4"; } // Freeze

        let pillW = 0;
        if (text) {
            bmp.fillRect(x, y, 54, 24, color);
            bmp.fontSize = 13;
            bmp.textColor = "#FFFFFF";
            bmp.drawText(text, x, y, 54, 24, "center");
            pillW = 54;
        }
        if (battler.isStateAffected(8)) { // Confusion — outlined mini-chip
            const cx = x + (pillW ? pillW + 4 : 0);
            bmp.fillRect(cx, y, 40, 24, "rgba(15, 23, 42, 0.85)");
            bmp.fillRect(cx, y, 40, 1, "#F59E0B");
            bmp.fillRect(cx, y + 23, 40, 1, "#F59E0B");
            bmp.fillRect(cx, y, 1, 24, "#F59E0B");
            bmp.fillRect(cx + 39, y, 1, 24, "#F59E0B");
            bmp.fontSize = 11;
            bmp.textColor = "#F59E0B";
            bmp.drawText("CNF", cx, y + 2, 40, 20, "center");
        }
        // Stage pips: one compact line, e.g. "ATK▲2 AGI▼1" — symbols and
        // stage counts only (stages are public battle information).
        try {
            const st = battler._ganjukoStages;
            if (st && window.GanjukoEngine && window.GanjukoEngine.S21) {
                const labels = window.GanjukoEngine.S21.STAGE_LABEL;
                const parts = [];
                for (const k of ["atk", "def", "mat", "mdf", "agi", "acc", "eva"]) {
                    const v = st[k] | 0;
                    if (v > 0) parts.push(labels[k] + "▲" + v);
                    else if (v < 0) parts.push(labels[k] + "▼" + (-v));
                }
                if (parts.length) {
                    bmp.fontSize = 11;
                    bmp.textColor = "#FDE68A";
                    bmp.drawText(parts.join(" "), x, y + 26, 300, 16, "left");
                }
            }
        } catch (e) {}
    };

    Sprite_GanjukoBattleHud.prototype.drawEffectivenessBanner = function(bmp) {
        if ($gameTemp._battleBanner && $gameTemp._battleBanner.duration > 0) {
            $gameTemp._battleBanner.duration--;
            const b = $gameTemp._battleBanner;
            const bw = 380;
            const bh = 42;
            const bx = Math.floor((Graphics.boxWidth - bw) / 2);
            const by = 210;

            bmp.gradientFillRect(bx, by, bw, bh, "rgba(20, 24, 45, 0.95)", "rgba(10, 15, 30, 0.95)", true);
            bmp.fillRect(bx, by, bw, 2, b.color);
            bmp.fillRect(bx, by + bh - 2, bw, 2, b.color);

            bmp.fontSize = 20;
            bmp.textColor = b.color;
            bmp.drawText(b.text, bx, by + 10, bw, 24, "center");
        }
    };

    // FR4 QA-D22 nit: no banner state may outlive its battle — a
    // killing-blow crit banner otherwise persists over the victory
    // message and leaks into the next battle's opening frames.
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.endBattle === "function") {
        const _fr4_BM_endBattle_banner = BattleManager.endBattle;
        BattleManager.endBattle = function(result) {
            try { if (typeof $gameTemp !== "undefined" && $gameTemp) $gameTemp._battleBanner = null; } catch (e) {}
            return _fr4_BM_endBattle_banner.call(this, result);
        };
    }

    Sprite_GanjukoBattleHud.prototype.drawCardBox = function(bmp, x, y, w, h, bgColor, borderColor) {
        bmp.fillRect(x, y, w, h, borderColor);
        bmp.fillRect(x + 3, y + 3, w - 6, h - 6, bgColor);
    };

    Sprite_GanjukoBattleHud.prototype.drawTypeBadge = function(bmp, typeInfo, x, y) {
        bmp.fillRect(x, y, 72, 26, typeInfo.color);
        bmp.fontSize = 15;
        bmp.textColor = typeInfo.textColor;
        bmp.drawText(typeInfo.name, x, y, 72, 26, "center");
    };

    Sprite_GanjukoBattleHud.prototype.drawHpBar = function(bmp, x, y, w, h, rate) {
        // Outer dark groove
        bmp.fillRect(x, y, w, h, "#0F172A");
        bmp.fillRect(x + 1, y + 1, w - 2, h - 2, "#1E293B");

        // Authentic Pokémon-style yellow HP badge
        const badgeW = 32;
        bmp.fillRect(x + 2, y + 2, badgeW, h - 4, "#F59E0B");
        bmp.fontSize = 13;
        bmp.textColor = "#1E293B";
        bmp.drawText("HP", x + 2, y + 2, badgeW, h - 4, "center");

        // Health fill
        const barX = x + badgeW + 4;
        const barMaxW = w - badgeW - 6;
        let color = "#22C55E"; // Green
        if (rate < 0.25) color = "#EF4444"; // Red
        else if (rate < 0.5) color = "#EAB308"; // Yellow

        const fillW = Math.round(barMaxW * rate);
        if (fillW > 0) {
            bmp.fillRect(barX, y + 2, fillW, h - 4, color);
            // Glossy highlight shine
            bmp.fillRect(barX, y + 2, fillW, 2, "rgba(255, 255, 255, 0.45)");
        }
    };

    // Add Player Ganjuko Sprite & HUD to Spriteset_Battle
    const _Spriteset_Battle_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer;
    Spriteset_Battle.prototype.createLowerLayer = function() {
        _Spriteset_Battle_createLowerLayer.call(this);
        this._playerGanjukoSprite = new Sprite_PlayerGanjuko();
        if (this._battleField) {
            this._battleField.addChild(this._playerGanjukoSprite);
        } else {
            this.addChild(this._playerGanjukoSprite);
        }
        this._ganjukoHudSprite = new Sprite_GanjukoBattleHud();
        this.addChild(this._ganjukoHudSprite);
    };

    // =========================================================================
    // 8. 4-BUTTON BATTLE COMMANDS & IN-BATTLE PARTY SWITCH WINDOW
    // =========================================================================

    // Skip PartyCommandWindow ("Fight / Escape") and go directly to the 4-button ActorCommandWindow!
    Scene_Battle.prototype.changeInputWindow = function() {
        this.hideSubInputWindows();
        if (BattleManager.isInputting()) {
            if (!BattleManager.actor()) {
                BattleManager.selectNextCommand();
            }
            if (BattleManager.actor()) {
                this.startActorCommandSelection();
            } else {
                this.endCommandSelection();
            }
        } else {
            this.endCommandSelection();
        }
    };

    // Hide the default bottom-right 4-actor status table since our custom 1v1 HUD shows everything cleanly!
    const _Scene_Battle_updateStatusWindowVisibility = Scene_Battle.prototype.updateStatusWindowVisibility;
    Scene_Battle.prototype.updateStatusWindowVisibility = function() {
        _Scene_Battle_updateStatusWindowVisibility.call(this);
        if (this._statusWindow) {
            this._statusWindow.visible = false;
        }
    };

    Scene_Battle.prototype.refreshGanjukoBattleHud = function() {
        if (this._spriteset && this._spriteset._ganjukoHudSprite) {
            this._spriteset._ganjukoHudSprite._lastStateHash = "";
        }
    };

    // Classic 4-Button Pokémon Command Menu: FIGHT, GANJUKO, BAG, RUN
    Window_ActorCommand.prototype.makeCommandList = function() {
        if (this._actor) {
            this.addCommand("FIGHT", "skill", true, 1);
            this.addCommand("GANJUKO", "switchGanjuko", $gameParty.allMembers().length > 1);
            this.addCommand("BAG", "item", true);
            this.addCommand("RUN", "escapeBattle", BattleManager.canEscape());
        }
    };

    Window_ActorCommand.prototype.maxCols = function() {
        return 2;
    };

    Scene_Battle.prototype.actorCommandWindowRect = function() {
        const ww = 420;
        const wh = this.calcWindowHeight(2, true);
        const wx = Graphics.boxWidth - ww - 40;
        const wy = Graphics.boxHeight - wh - 24;
        return new Rectangle(wx, wy, ww, wh);
    };

    // Show Move Type & Power right inside Window_BattleSkill!
    Window_BattleSkill.prototype.includes = function(item) {
        return !!item;
    };

    Window_BattleSkill.prototype.drawItem = function(index) {
        const skill = this.itemAt(index);
        if (skill) {
            const costWidth = this.costWidth();
            const rect = this.itemLineRect(index);
            this.changePaintOpacity(this.isEnabled(skill));
            const typeId = skill.damage ? skill.damage.elementId : 1;
            const typeInfo = GanjukoEngine.getTypeInfo(Math.max(1, typeId));
            const rightPad = 54; // Padding to avoid touch UI cancel button
            this.drawItemName(skill, rect.x, rect.y, rect.width - costWidth - rightPad - 80);
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(`[${typeInfo.name}]`, rect.x + rect.width - costWidth - rightPad - 80, rect.y, 80, "right");
            this.drawSkillCost(skill, rect.x, rect.y, rect.width - rightPad);
            this.changePaintOpacity(1);
        }
    };

    // In 1v1 combat, automatically select the single opponent or single active ally without extra click!
    Scene_Battle.prototype.onSelectAction = function() {
        const action = BattleManager.inputtingAction();
        this.hideSubInputWindows();
        if (action.isForOpponent()) {
            action.setTarget(0);
            this.selectNextCommand();
        } else if (action.isForUser() || !action.needsSelection()) {
            this.selectNextCommand();
        } else {
            action.setTarget(0);
            this.selectNextCommand();
        }
    };

    // In-Battle Ganjuko Party Switch Window
    function Window_BattleGanjukoSwitch() {
        this.initialize(...arguments);
    }

    Window_BattleGanjukoSwitch.prototype = Object.create(Window_Selectable.prototype);
    Window_BattleGanjukoSwitch.prototype.constructor = Window_BattleGanjukoSwitch;

    Window_BattleGanjukoSwitch.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this.hide();
    };

    Window_BattleGanjukoSwitch.prototype.maxCols = function() {
        return 2;
    };

    Window_BattleGanjukoSwitch.prototype.maxItems = function() {
        return $gameParty.allMembers().length;
    };

    Window_BattleGanjukoSwitch.prototype.isCurrentItemEnabled = function() {
        const idx = this.index();
        const member = $gameParty.allMembers()[idx];
        // Can only switch to an alive Ganjuko that is not already in slot 0
        return idx > 0 && member && member.isAlive();
    };

    Window_BattleGanjukoSwitch.prototype.drawItem = function(index) {
        const actor = $gameParty.allMembers()[index];
        if (!actor) return;
        const rect = this.itemLineRect(index);
        const sp = actor.ganjukoSpecies();
        const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);
        const enabled = index > 0 && actor.isAlive();
        this.changePaintOpacity(enabled);
        const tag = index === 0 ? "[ACTIVE] " : (actor.isDead() ? "[FAINTED] " : "");
        this.resetTextColor();
        this.drawText(`${tag}${actor.name()} Lv${actor.level}`, rect.x, rect.y, 240, "left");
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(`[${typeInfo.name}]`, rect.x + 245, rect.y, 90, "left");
        this.resetTextColor();
        // v13: the P2B patch replaces this drawItem at runtime with a
        // percentage version; the raw-HP original flagged by Champions v1
        // §7 is scrubbed here too so no code path can render raw HP.
        this.drawText("HP " + GanjukoEngine.hpPercent(actor.hp, actor.mhp) + "%", rect.x + 340, rect.y, rect.width - 345, "right");
        this.changePaintOpacity(1);
    };

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this._actorCommandWindow.setHandler("switchGanjuko", this.commandSwitchGanjuko.bind(this));
        this._actorCommandWindow.setHandler("escapeBattle", this.commandEscapeBattle.bind(this));

        const rect = this.skillWindowRect();
        this._ganjukoSwitchWindow = new Window_BattleGanjukoSwitch(rect);
        this._ganjukoSwitchWindow.setHandler("ok", this.onSwitchGanjukoOk.bind(this));
        this._ganjukoSwitchWindow.setHandler("cancel", this.onSwitchGanjukoCancel.bind(this));
        this.addWindow(this._ganjukoSwitchWindow);
    };

    const _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return (
            _Scene_Battle_isAnyInputWindowActive.call(this) ||
            (this._ganjukoSwitchWindow && this._ganjukoSwitchWindow.active)
        );
    };

    const _Scene_Battle_hideSubInputWindows = Scene_Battle.prototype.hideSubInputWindows;
    Scene_Battle.prototype.hideSubInputWindows = function() {
        _Scene_Battle_hideSubInputWindows.call(this);
        if (this._ganjukoSwitchWindow) {
            this._ganjukoSwitchWindow.deactivate();
            this._ganjukoSwitchWindow.hide();
        }
    };

    Scene_Battle.prototype.commandSwitchGanjuko = function() {
        this._ganjukoSwitchWindow.refresh();
        this._ganjukoSwitchWindow.select(0);
        this._ganjukoSwitchWindow.show();
        this._ganjukoSwitchWindow.activate();
        this._actorCommandWindow.hide();
    };

    Scene_Battle.prototype.onSwitchGanjukoOk = function() {
        const targetIdx = this._ganjukoSwitchWindow.index();
        const oldName = $gameParty.allMembers()[0].name();
        $gameParty.swapOrder(0, targetIdx);
        const newLead = $gameParty.allMembers()[0];
        AudioManager.playSe({ name: "Raise1", volume: 90, pitch: 100, pan: 0 });
        this._ganjukoSwitchWindow.hide();
        this._ganjukoSwitchWindow.deactivate();

        if (this._logWindow) {
            this._logWindow.push("addText", `Come back, ${oldName}! Go! \\C[11]${newLead.name()}\\C[0]!`);
        }
        this.refreshGanjukoBattleHud();

        // Switching uses the player's action for this turn
        const action = BattleManager.inputtingAction();
        if (action) {
            action.setGuard();
        }
        this.selectNextCommand();
    };

    Scene_Battle.prototype.onSwitchGanjukoCancel = function() {
        this._ganjukoSwitchWindow.hide();
        this._actorCommandWindow.show();
        this._actorCommandWindow.activate();
    };

    Scene_Battle.prototype.commandEscapeBattle = function() {
        if (!BattleManager.canEscape()) {
            SoundManager.playBuzzer();
            $gameMessage.add("\\C[18]No! There's no running from a Trainer battle!\\C[0]");
            this._actorCommandWindow.activate();
            return;
        }
        BattleManager.processEscape();
        this.changeInputWindow();
    };

    // =========================================================================
    // 9. GANJUKODEX SCENE & STORAGE BOX SCENE + PAUSE MENU COMMANDS
    // =========================================================================

    const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        this.addCommand("Ganjuko Team", "ganjukoSummary", $gameParty.allMembers().length > 0);
        this.addCommand("GanjukoDex", "ganjukoDex", true);
        this.addCommand("Trainer Card", "trainerCard", true);
        this.addCommand("Town Map / Fly", "townMap", true);
        this.addCommand("Ganjuko Box", "ganjukoBox", true);
    };

    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("ganjukoSummary", () => SceneManager.push(Scene_GanjukoSummary));
        this._commandWindow.setHandler("ganjukoDex", this.commandGanjukoDex.bind(this));
        this._commandWindow.setHandler("trainerCard", () => SceneManager.push(Scene_GanjukoTrainerCard));
        this._commandWindow.setHandler("townMap", () => SceneManager.push(Scene_GanjukoTownMap));
        this._commandWindow.setHandler("ganjukoBox", this.commandGanjukoBox.bind(this));
    };

    Scene_Menu.prototype.commandGanjukoDex = function() {
        SceneManager.push(Scene_GanjukoDex);
    };

    Scene_Menu.prototype.commandGanjukoBox = function() {
        SceneManager.push(Scene_GanjukoBox);
    };

    // --- SCENE_GANJUKODEX ---
    function Scene_GanjukoDex() {
        this.initialize(...arguments);
    }

    Scene_GanjukoDex.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_GanjukoDex.prototype.constructor = Scene_GanjukoDex;

    Scene_GanjukoDex.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const headerRect = new Rectangle(0, this.mainAreaTop(), Graphics.boxWidth, 64);
        this._headerWindow = new Window_Base(headerRect);
        this.addWindow(this._headerWindow);
        this.drawHeader();

        const listRect = new Rectangle(0, this.mainAreaTop() + 64, 420, this.mainAreaHeight() - 64);
        this._listWindow = new Window_GanjukoDexList(listRect);
        this._listWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._listWindow);

        const detailRect = new Rectangle(420, this.mainAreaTop() + 64, Graphics.boxWidth - 420, this.mainAreaHeight() - 64);
        this._detailWindow = new Window_GanjukoDexDetail(detailRect);
        this.addWindow(this._detailWindow);
        this._listWindow.setDetailWindow(this._detailWindow);
        this._listWindow.select(0);
        this._listWindow.activate();
    };

    Scene_GanjukoDex.prototype.drawHeader = function() {
        const w = this._headerWindow;
        w.contents.clear();
        const badges = $gameSystem.badges();
        const badgeText = badges.length > 0 ? badges.join(", ") : "None yet";
        // Fix Round 2 (QA-D03): denominator is the real roster size, not a
        // hardcoded /30 from the 30-species prototype era.
        const totalSpecies = (typeof $dataGanjukoSpecies !== "undefined" && $dataGanjukoSpecies && $dataGanjukoSpecies.length) ? $dataGanjukoSpecies.length : 504;
        w.drawText(
            `GANJUKODEX   |   Seen: ${$gameSystem.seenCount()}/${totalSpecies}   Caught: ${$gameSystem.caughtCount()}/${totalSpecies}   |   Badges: ${badgeText}`,
            8, 0, w.innerWidth - 16, "left"
        );
    };

    function Window_GanjukoDexList() {
        this.initialize(...arguments);
    }

    Window_GanjukoDexList.prototype = Object.create(Window_Selectable.prototype);
    Window_GanjukoDexList.prototype.constructor = Window_GanjukoDexList;

    Window_GanjukoDexList.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
    };

        Window_GanjukoDexList.prototype.maxItems = function() {
        return (window.$dataGanjukoSpecies && window.$dataGanjukoSpecies.length > 0) ? window.$dataGanjukoSpecies.length : 504;
    };

    Window_GanjukoDexList.prototype.setDetailWindow = function(detailWindow) {
        this._detailWindow = detailWindow;
        this.callUpdateHelp();
    };

    Window_GanjukoDexList.prototype.updateHelp = function() {
        if (this._detailWindow) {
            this._detailWindow.setSpeciesId(this.index() + 1);
        }
    };

    Window_GanjukoDexList.prototype.drawItem = function(index) {
        const speciesId = index + 1;
        const sp = GanjukoEngine.getSpecies(speciesId);
        const seen = $gameSystem.isSpeciesSeen(speciesId);
        const caught = $gameSystem.isSpeciesCaught(speciesId);
        const rect = this.itemLineRect(index);

        this.changePaintOpacity(seen);
        const statusIcon = caught ? "●" : (seen ? "○" : "-");
        const displayName = seen ? sp.name : "?????";
        const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);
        this.resetTextColor();
        this.drawText(`#${sp.dexNo} ${statusIcon} ${displayName}`, rect.x, rect.y, 260, "left");
        if (seen) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(`[${typeInfo.name}]`, rect.x + 260, rect.y, rect.width - 265, "right");
        }
        this.changePaintOpacity(1);
    };

    function Window_GanjukoDexDetail() {
        this.initialize(...arguments);
    }

    Window_GanjukoDexDetail.prototype = Object.create(Window_Base.prototype);
    Window_GanjukoDexDetail.prototype.constructor = Window_GanjukoDexDetail;

    Window_GanjukoDexDetail.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._speciesId = 1;
        this._sprite = new Sprite();
        this._sprite.anchor.x = 0.5;
        this._sprite.anchor.y = 0.5;
        this._sprite.x = rect.width - 170;
        this._sprite.y = 145;
        this.addChild(this._sprite);
    };

    Window_GanjukoDexDetail.prototype.setSpeciesId = function(speciesId) {
        if (this._speciesId !== speciesId) {
            this._speciesId = speciesId;
            this.refresh();
        } else {
            this.refresh();
        }
    };

    Window_GanjukoDexDetail.prototype.refresh = function() {
        this.contents.clear();
        const sp = GanjukoEngine.getSpecies(this._speciesId);
        const seen = $gameSystem.isSpeciesSeen(this._speciesId);
        const caught = $gameSystem.isSpeciesCaught(this._speciesId);

        if (!seen) {
            this._sprite.visible = false;
            this.drawText(`#${sp.dexNo}  ?????`, 16, 16, 400, "left");
            this.drawText("Encounter this Ganjuko in the wild or battle to unlock its data!", 16, 90, this.innerWidth - 32, "left");
            return;
        }

        this._sprite.visible = true;
        this._sprite.bitmap = ImageManager.loadEnemy(sp.battlerName);

        const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);
        this.resetTextColor();
        this.drawText(`#${sp.dexNo} ${sp.name} — ${sp.title}`, 16, 8, 520, "left");
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(`Element: ${typeInfo.name}   |   Status: ${caught ? "CAUGHT" : "SEEN"}`, 16, 46, 480, "left");

        // Fix Round 1: evolveTo is a record-id reference; resolve by record id.
        const evoTargetRec = sp.evolveTo ? (GanjukoEngine.getSpeciesByRecordId(sp.evolveTo) || GanjukoEngine.getSpecies(sp.evolveTo)) : null;
        const evoText = evoTargetRec
            ? `Evolves into ${evoTargetRec.name} at Lv ${sp.evolveLv}`
            : "Final Form (Does not evolve)";
        this.resetTextColor();
        this.drawText(evoText, 16, 84, 480, "left");

        // Ability line (v13, Section 21): the species' ability slots —
        // public info (names + the lead slot's one-liner), no numbers.
        try {
            const S21 = GanjukoEngine.S21;
            if (S21 && sp.abilities && S21.ABILITY_LIB) {
                const slotIds = [].concat(sp.abilities.regular || [],
                    sp.abilities.special ? [sp.abilities.special] : [],
                    sp.abilities.signature ? [sp.abilities.signature] : []);
                if (slotIds.length) {
                    const lead = S21.ABILITY_LIB[slotIds[0]];
                    let txt = "Ability: " + (lead ? lead.name : slotIds[0]) +
                        (lead && lead.desc ? " — " + lead.desc : "");
                    if (slotIds.length > 1) {
                        txt += "  ·  also: " + slotIds.slice(1).map(id => (S21.ABILITY_LIB[id] || {}).name || id).join(", ");
                    }
                    if (txt.length > 118) txt = txt.slice(0, 117) + "…";
                    this.contents.fontSize = 19;
                    this.changeTextColor(ColorManager.systemColor());
                    this.drawText(txt, 16, 104, this.innerWidth - 32, "left");
                    this.resetTextColor();
                    try { if (typeof this.resetFontSettings === "function") this.resetFontSettings(); } catch (e) {}
                }
            }
        } catch (e) {}

        // Base Stats
        const bs = sp.baseStats;
        const statsList = [
            ["HP", bs.hp],
            ["Attack", bs.atk],
            ["Defense", bs.def],
            ["Sp.Atk", bs.mat],
            ["Sp.Def", bs.mdf],
            ["Speed", bs.agi]
        ];
        let sy = 132;
        for (const [label, val] of statsList) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(label, 16, sy, 100, "left");
            this.resetTextColor();
            this.drawText(String(val), 110, sy, 50, "right");
            const barW = Math.min(260, Math.round((val / 100) * 260));
            this.contents.fillRect(175, sy + 10, 260, 14, "#1E293B");
            this.contents.fillRect(175, sy + 10, barW, 14, typeInfo.color);
            sy += 34;
        }

        // Lore Description
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("GanjukoDex Entry:", 16, sy + 12, 300, "left");
        this.resetTextColor();
        const words = sp.desc.split(" ");
        let line = "";
        let ly = sy + 46;
        for (const w of words) {
            if ((line + w).length > 62) {
                this.drawText(line, 16, ly, this.innerWidth - 32, "left");
                line = w + " ";
                ly += 32;
            } else {
                line += w + " ";
            }
        }
        if (line) {
            this.drawText(line, 16, ly, this.innerWidth - 32, "left");
        }
    };

    // --- SCENE_GANJUKOBOX (PARTY & PC STORAGE MANAGER) ---
    function Scene_GanjukoBox() {
        this.initialize(...arguments);
    }

    Scene_GanjukoBox.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_GanjukoBox.prototype.constructor = Scene_GanjukoBox;

    Scene_GanjukoBox.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const helpRect = new Rectangle(0, this.mainAreaTop(), Graphics.boxWidth, 64);
        this._helpBanner = new Window_Base(helpRect);
        this.addWindow(this._helpBanner);
        this._helpBanner.drawText(
            "GANJUKO TEAM & STORAGE BOX — Select a Party Ganjuko (Left) to Deposit, or Box Ganjuko (Right) to Withdraw!",
            8, 0, this._helpBanner.innerWidth - 16, "left"
        );

        const halfW = Math.floor(Graphics.boxWidth / 2);
        const partyRect = new Rectangle(0, this.mainAreaTop() + 64, halfW, this.mainAreaHeight() - 64);
        const boxRect = new Rectangle(halfW, this.mainAreaTop() + 64, Graphics.boxWidth - halfW, this.mainAreaHeight() - 64);

        this._partyWindow = new Window_GanjukoBoxList(partyRect, true);
        this._partyWindow.setHandler("ok", this.onPartyOk.bind(this));
        this._partyWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._partyWindow);

        this._boxWindow = new Window_GanjukoBoxList(boxRect, false);
        this._boxWindow.setHandler("ok", this.onBoxOk.bind(this));
        this._boxWindow.setHandler("cancel", this.onBoxCancel.bind(this));
        this.addWindow(this._boxWindow);

        this._partyWindow.select(0);
        this._partyWindow.activate();
    };

    Scene_GanjukoBox.prototype.onPartyOk = function() {
        const idx = this._partyWindow.index();
        const members = $gameParty.allMembers();
        if (idx >= members.length) {
            // Switch focus to Storage Box to withdraw!
            this._partyWindow.deactivate();
            this._boxWindow.select(0);
            this._boxWindow.activate();
            return;
        }
        if (members.length <= 1) {
            SoundManager.playBuzzer();
            this._partyWindow.activate();
            return;
        }
        const actor = members[idx];
        $gameParty.removeActor(actor.actorId());
        $gameSystem.addToGanjukoBox(actor.actorId());
        SoundManager.playEquip();
        this._partyWindow.refresh();
        this._boxWindow.refresh();
        this._partyWindow.select(Math.min(idx, $gameParty.allMembers().length));
        this._partyWindow.activate();
    };

    Scene_GanjukoBox.prototype.onBoxOk = function() {
        const idx = this._boxWindow.index();
        const boxIds = $gameSystem.ganjukoBox();
        if (idx < 0 || idx >= boxIds.length || $gameParty.allMembers().length >= 6) {
            SoundManager.playBuzzer();
            this._boxWindow.activate();
            return;
        }
        const actorId = boxIds[idx];
        $gameSystem.removeFromGanjukoBox(actorId);
        $gameParty.addActor(actorId);
        SoundManager.playEquip();
        this._partyWindow.refresh();
        this._boxWindow.refresh();
        this._boxWindow.select(Math.max(0, Math.min(idx, $gameSystem.ganjukoBox().length - 1)));
        this._boxWindow.activate();
    };

    Scene_GanjukoBox.prototype.onBoxCancel = function() {
        this._boxWindow.deactivate();
        this._boxWindow.deselect();
        this._partyWindow.activate();
    };

    function Window_GanjukoBoxList() {
        this.initialize(...arguments);
    }

    Window_GanjukoBoxList.prototype = Object.create(Window_Selectable.prototype);
    Window_GanjukoBoxList.prototype.constructor = Window_GanjukoBoxList;

    Window_GanjukoBoxList.prototype.initialize = function(rect, isParty) {
        this._isParty = isParty;
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
    };

    Window_GanjukoBoxList.prototype.maxItems = function() {
        if (this._isParty) {
            return $gameParty.allMembers().length + 1; // +1 for "-> Switch to PC Box"
        }
        return Math.max(1, $gameSystem.ganjukoBox().length);
    };

    Window_GanjukoBoxList.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        if (this._isParty) {
            const members = $gameParty.allMembers();
            if (index === members.length) {
                this.changeTextColor(ColorManager.systemColor());
                this.drawText("-> [Withdraw from Storage Box]", rect.x, rect.y, rect.width, "center");
                this.resetTextColor();
                return;
            }
            const actor = members[index];
            const typeInfo = GanjukoEngine.getTypeInfo(actor.ganjukoType());
            const leadTag = index === 0 ? "[LEAD] " : "";
            this.resetTextColor();
            this.drawText(`${leadTag}${actor.name()} Lv${actor.level}`, rect.x, rect.y, 260, "left");
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(`[${typeInfo.name}]`, rect.x + 265, rect.y, 95, "left");
            this.resetTextColor();
            this.drawText(`HP ${actor.hp}/${actor.mhp}`, rect.x + 360, rect.y, rect.width - 365, "right");
        } else {
            const boxIds = $gameSystem.ganjukoBox();
            if (boxIds.length === 0) {
                this.changePaintOpacity(false);
                this.drawText("(Storage Box is empty)", rect.x, rect.y, rect.width, "center");
                this.changePaintOpacity(true);
                return;
            }
            const actor = $gameActors.actor(boxIds[index]);
            if (!actor) return;
            const typeInfo = GanjukoEngine.getTypeInfo(actor.ganjukoType());
            this.resetTextColor();
            this.drawText(`[BOX] ${actor.name()} Lv${actor.level}`, rect.x, rect.y, 260, "left");
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(`[${typeInfo.name}]`, rect.x + 265, rect.y, 95, "left");
            this.resetTextColor();
            this.drawText(`HP ${actor.hp}/${actor.mhp}`, rect.x + 360, rect.y, rect.width - 365, "right");
        }
    };

    window.Scene_GanjukoDex = Scene_GanjukoDex;
    window.Scene_GanjukoBox = Scene_GanjukoBox;
    
    // =========================================================================
    // 10. GANJUKO DETAILED SUMMARY WINDOW
    // =========================================================================
    function Scene_GanjukoSummary() {
        this.initialize(...arguments);
    }
    Scene_GanjukoSummary.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_GanjukoSummary.prototype.constructor = Scene_GanjukoSummary;

    // Menu Area Rectangle Helper
    Scene_MenuBase.prototype.mainAreaRect = function() {
        return new Rectangle(0, this.mainAreaTop(), Graphics.boxWidth, this.mainAreaHeight());
    };

    Scene_GanjukoSummary.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const rect = this.mainAreaRect();
        this._summaryWindow = new Window_GanjukoSummary(rect);
        this._summaryWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._summaryWindow);
    };

    function Window_GanjukoSummary() {
        this.initialize(...arguments);
    }
    Window_GanjukoSummary.prototype = Object.create(Window_Selectable.prototype);
    Window_GanjukoSummary.prototype.constructor = Window_GanjukoSummary;

    Window_GanjukoSummary.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this._memberIndex = 0;
        this.refresh();
        this.activate();
    };

    Window_GanjukoSummary.prototype.maxItems = function() {
        return Math.max(1, $gameParty.allMembers().length);
    };

    Window_GanjukoSummary.prototype.cursorRight = function() {
        if ($gameParty.allMembers().length > 1) {
            this._memberIndex = (this._memberIndex + 1) % $gameParty.allMembers().length;
            SoundManager.playCursor();
            this.refresh();
        }
    };

    Window_GanjukoSummary.prototype.cursorLeft = function() {
        if ($gameParty.allMembers().length > 1) {
            this._memberIndex = (this._memberIndex - 1 + $gameParty.allMembers().length) % $gameParty.allMembers().length;
            SoundManager.playCursor();
            this.refresh();
        }
    };

    Window_GanjukoSummary.prototype.refresh = function() {
        this.contents.clear();
        const members = $gameParty.allMembers();
        if (members.length === 0) return;
        const actor = members[this._memberIndex];
        const sp = actor.ganjukoSpecies();
        const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);

        // Header
        this.drawText("GANJUKO SUMMARY  (" + (this._memberIndex + 1) + "/" + members.length + ")  [Left / Right: Switch Party Member]", 16, 8, this.innerWidth - 32, "left");

        // Sprite
        if (!this._battlerSprite) {
            this._battlerSprite = new Sprite();
            this._battlerSprite.anchor.x = 0.5;
            this._battlerSprite.anchor.y = 0.5;
            this.addChild(this._battlerSprite);
        }
        this._battlerSprite.x = 220;
        this._battlerSprite.y = 240;
        this._battlerSprite.bitmap = ImageManager.loadEnemy(sp.battlerName);

        // Name, Title, Type
        this.drawText(actor.name() + "  Lv" + actor.level, 420, 50, 300, "left");
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(sp.title, 420, 84, 300, "left");
        this.drawText("Type: [" + typeInfo.name + "]", 420, 118, 300, "left");
        this.resetTextColor();

        // HP & PP
        this.drawText("HP: " + actor.hp + " / " + actor.mhp, 420, 160, 260, "left");
        this.drawText("PP: " + actor.mp + " / " + actor.mmp, 420, 192, 260, "left");

        // Stats Box
        const stats = [
            ["Attack", actor.atk],
            ["Defense", actor.def],
            ["Sp.Atk", actor.mat],
            ["Sp.Def", actor.mdf],
            ["Speed", actor.agi]
        ];
        let sy = 240;
        for (const [sName, sVal] of stats) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(sName, 420, sy, 120, "left");
            this.resetTextColor();
            this.drawText(String(sVal), 560, sy, 60, "right");
            sy += 32;
        }

        // Current 4 Moves List
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("Learned Moves (Max 4):", 760, 50, 300, "left");
        this.resetTextColor();
        const moves = actor.skills();
        let my = 90;
        for (let i = 0; i < 4; i++) {
            const skill = moves[i];
            if (skill) {
                const elId = skill.damage ? skill.damage.elementId : 1;
                const elInfo = GanjukoEngine.getTypeInfo(Math.max(1, elId));
                this.drawText((i + 1) + ". " + skill.name, 760, my, 220, "left");
                this.changeTextColor(ColorManager.systemColor());
                this.drawText("[" + elInfo.name + "]", 990, my, 90, "left");
                this.resetTextColor();
                this.drawText("PP: " + skill.mpCost, 1090, my, 80, "right");
            } else {
                this.changePaintOpacity(false);
                this.drawText((i + 1) + ". (Empty Move Slot)", 760, my, 300, "left");
                this.changePaintOpacity(true);
            }
            my += 40;
        }

        // Evolution Preview
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("Evolution Status:", 760, 270, 300, "left");
        this.resetTextColor();
        if (sp.evolveTo > 0) {
            // Fix Round 1: evolveTo is a record-id reference; resolve by record id.
            const nextSp = GanjukoEngine.getSpeciesByRecordId(sp.evolveTo) || GanjukoEngine.getSpecies(sp.evolveTo);
            this.drawText("Evolves into " + nextSp.name + " at Level " + sp.evolveLv + " (Current: Lv " + actor.level + ")", 760, 304, 450, "left");
        } else {
            this.drawText("Final Form (Fully evolved)", 760, 304, 400, "left");
        }
    };
    window.Scene_GanjukoSummary = Scene_GanjukoSummary;
    
    // =========================================================================
    // 11. AAA PRESENTATION: CINEMATIC INTRO, TITLE & ENCOUNTER TRANSITIONS
    // =========================================================================

    // Universal Safety Safeguard: ensure _windowLayer always exists on any Scene before adding a window
    const _Scene_Base_addWindow = Scene_Base.prototype.addWindow;
    Scene_Base.prototype.addWindow = function(window) {
        if (!this._windowLayer) {
            this.createWindowLayer();
        }
        _Scene_Base_addWindow.call(this, window);
    };

    // Dynamic Title Screen Background with Solaris & Pyroclysm
    Scene_Title.prototype.createBackground = function() {
        this._backSprite1 = new Sprite(ImageManager.loadTitle1("Universe"));
        this._backSprite2 = new Sprite(ImageManager.loadTitle2(""));
        this.addChild(this._backSprite1);
        this.addChild(this._backSprite2);

        // Ambient Legendary Solaris Silhouette
        this._legendarySprite = new Sprite(ImageManager.loadEnemy("SF_Phoenix"));
        this._legendarySprite.anchor.x = 0.5;
        this._legendarySprite.anchor.y = 0.5;
        this._legendarySprite.x = Graphics.boxWidth * 0.72;
        this._legendarySprite.y = Graphics.boxHeight * 0.45;
        this._legendarySprite.opacity = 210;
        this._legendarySprite.scale.x = 1.3;
        this._legendarySprite.scale.y = 1.3;
        this.addChild(this._legendarySprite);

        // Partner Embit Silhouette
        this._starterSprite = new Sprite(ImageManager.loadEnemy("Salamander"));
        this._starterSprite.anchor.x = 0.5;
        this._starterSprite.anchor.y = 0.5;
        this._starterSprite.x = Graphics.boxWidth * 0.28;
        this._starterSprite.y = Graphics.boxHeight * 0.55;
        this._starterSprite.opacity = 230;
        this._starterSprite.scale.x = -1.1; // Facing right
        this._starterSprite.scale.y = 1.1;
        this.addChild(this._starterSprite);
    };

    const _Scene_Title_update = Scene_Title.prototype.update;
    Scene_Title.prototype.update = function() {
        _Scene_Title_update.call(this);
        if (this._legendarySprite) {
            this._titleTick = (this._titleTick || 0) + 1;
            this._legendarySprite.y = Graphics.boxHeight * 0.45 + Math.sin(this._titleTick * 0.04) * 12;
            this._starterSprite.y = Graphics.boxHeight * 0.55 + Math.cos(this._titleTick * 0.05) * 8;
        }
    };

    // Draw Sleek Modern Title Typography
    Scene_Title.prototype.drawGameTitle = function() {
        const x = 0;
        const y = 60;
        const maxWidth = Graphics.width;
        const bitmap = this._gameTitleSprite.bitmap;
        bitmap.fontFace = $gameSystem.mainFontFace();
        bitmap.fontSize = 68;
        bitmap.outlineColor = "rgba(10, 20, 40, 0.9)";
        bitmap.outlineWidth = 10;
        bitmap.textColor = "#38BDF8";
        bitmap.drawText("GANJUKO", x, y, maxWidth, 74, "center");

        bitmap.fontSize = 24;
        bitmap.outlineWidth = 6;
        bitmap.textColor = "#FACC15";
        bitmap.drawText("CHRONICLES OF ASTRAL & EARTH", x, y + 68, maxWidth, 32, "center");
    };

    // Cinematic Pokémon Professor Intro Cutscene for New Game
    Scene_Title.prototype.commandNewGame = function() {
        DataManager.setupNewGame();
        this._commandWindow.close();
        this.fadeOutAll();
        SceneManager.goto(Scene_GanjukoIntro);
    };

    
    // =========================================================================
    // CINEMATIC AAA EVOLUTION SCENE (Scene_GanjukoEvolution)
    // =========================================================================

    function Scene_GanjukoEvolution() {
        this.initialize(...arguments);
    }
    Scene_GanjukoEvolution.prototype = Object.create(Scene_Base.prototype);
    Scene_GanjukoEvolution.prototype.constructor = Scene_GanjukoEvolution;

    Scene_GanjukoEvolution.setup = function(actor, oldSpeciesId, newSpeciesId) {
        this._targetActor = actor;
        this._oldSpeciesId = oldSpeciesId;
        this._newSpeciesId = newSpeciesId;
    };

    Scene_GanjukoEvolution.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._actor = Scene_GanjukoEvolution._targetActor || $gameParty.leader();
        this._oldSp = GanjukoEngine.getSpecies(Scene_GanjukoEvolution._oldSpeciesId || 1);
        this._newSp = GanjukoEngine.getSpecies(Scene_GanjukoEvolution._newSpeciesId || 2);
        // Fix Round 1: keep the POSITIONAL id of the target species; the
        // record `id` field of _newSp is a different numbering for 15 species.
        this._newSpeciesPosId = Number(Scene_GanjukoEvolution._newSpeciesId) || 0;
        this._timer = 0;
        this._phase = 0; // 0: intro, 1: pulsing metamorphosis, 2: flash/evolve, 3: celebration, 4: done

        this.createBackground();
        this.createAuraParticles();
        this.createBattlerSprite();
        this.createFlashOverlay();
        this.createHeader();
        this.createWindowLayer();
        this.createMessageWindow();

        AudioManager.playBgm({ name: "Theme2", volume: 85, pitch: 105, pan: 0 });
    };

    Scene_GanjukoEvolution.prototype.createBackground = function() {
        this._bgSprite = new Sprite(ImageManager.loadTitle1("Universe"));
        this.addChild(this._bgSprite);

        // Dark dimming overlay
        const dimBmp = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        dimBmp.fillAll("rgba(5, 8, 22, 0.75)");
        this._dimSprite = new Sprite(dimBmp);
        this.addChild(this._dimSprite);
    };

    Scene_GanjukoEvolution.prototype.createAuraParticles = function() {
        this._particles = [];
        for (let i = 0; i < 24; i++) {
            const p = new Sprite();
            const bmp = new Bitmap(16, 16);
            bmp.drawCircle(8, 8, 7, "#60E0FF");
            p.bitmap = bmp;
            p.anchor.x = 0.5;
            p.anchor.y = 0.5;
            p.x = Graphics.boxWidth * 0.5;
            p.y = Graphics.boxHeight * 0.45;
            p.angleVal = (i / 24) * Math.PI * 2;
            p.distVal = 100 + Math.random() * 80;
            p.speedVal = 0.03 + Math.random() * 0.04;
            p.opacity = 0;
            this.addChild(p);
            this._particles.push(p);
        }
    };

    Scene_GanjukoEvolution.prototype.createBattlerSprite = function() {
        const battlerName = this._oldSp.battlerName || this._oldSp.battler;
        const battlerHue = this._oldSp.battlerHue || 0;
        this._battlerSprite = new Sprite(ImageManager.loadEnemy(battlerName, battlerHue));
        this._battlerSprite.anchor.x = 0.5;
        this._battlerSprite.anchor.y = 0.5;
        this._battlerSprite.x = Graphics.boxWidth * 0.5;
        this._battlerSprite.y = Graphics.boxHeight * 0.45;
        this._battlerSprite.scale.x = 1.0;
        this._battlerSprite.scale.y = 1.0;
        this.addChild(this._battlerSprite);
    };

    Scene_GanjukoEvolution.prototype.createFlashOverlay = function() {
        const flashBmp = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        flashBmp.fillAll("#FFFFFF");
        this._flashSprite = new Sprite(flashBmp);
        this._flashSprite.opacity = 0;
        this.addChild(this._flashSprite);
    };

    Scene_GanjukoEvolution.prototype.createHeader = function() {
        const headerBmp = new Bitmap(Graphics.boxWidth, 70);
        headerBmp.gradientFillRect(0, 0, Graphics.boxWidth, 70, "rgba(20, 24, 45, 0.9)", "rgba(10, 15, 30, 0.95)", true);
        headerBmp.textColor = "#FFD700";
        headerBmp.fontSize = 28;
        headerBmp.fontBold = true;
        headerBmp.drawText("✦ GANJUKO METAMORPHOSIS & EVOLUTION ✦", 0, 16, Graphics.boxWidth, 36, "center");
        this._headerSprite = new Sprite(headerBmp);
        this.addChild(this._headerSprite);
    };

    Scene_GanjukoEvolution.prototype.createMessageWindow = function() {
        const rect = new Rectangle(120, Graphics.boxHeight - 170, Graphics.boxWidth - 240, 140);
        this._msgWindow = new Window_Base(rect);
        this.addWindow(this._msgWindow);
        this.refreshMessage();
    };

    Scene_GanjukoEvolution.prototype.refreshMessage = function() {
        const w = this._msgWindow;
        w.contents.clear();
        if (this._phase < 2) {
            w.changeTextColor(ColorManager.systemColor());
            w.drawText("What?! " + this._actor.name() + " is beginning to evolve...!", 16, 20, w.innerWidth - 32, "center");
            w.resetTextColor();
            w.drawText("Concentrating immense evolutionary energy...", 16, 58, w.innerWidth - 32, "center");
        } else {
            w.changeTextColor("#FFD700");
            w.drawText("★ Congratulations! Your " + this._actor.name() + " evolved into " + this._newSp.name + "! ★", 16, 12, w.innerWidth - 32, "center");
            w.resetTextColor();
            const hpPlus = Math.floor(this._newSp.base.hp * 0.4);
            const atkPlus = Math.floor(this._newSp.base.atk * 0.35);
            const defPlus = Math.floor(this._newSp.base.def * 0.35);
            w.drawText("Stats Surged: HP +" + hpPlus + " | ATK +" + atkPlus + " | DEF +" + defPlus + " | SP.ATK +" + atkPlus, 16, 48, w.innerWidth - 32, "center");
            w.changeTextColor("#00FFCC");
            w.drawText("[Press Enter or Tap to Continue]", 16, 82, w.innerWidth - 32, "center");
        }
    };

    Scene_GanjukoEvolution.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        this._timer++;

        // Update Aura particles
        for (const p of this._particles) {
            p.angleVal += p.speedVal;
            p.distVal = Math.max(30, p.distVal - 0.4);
            p.x = Graphics.boxWidth * 0.5 + Math.cos(p.angleVal) * p.distVal;
            p.y = Graphics.boxHeight * 0.45 + Math.sin(p.angleVal) * p.distVal;
            p.opacity = Math.min(255, p.opacity + 6);
        }

        if (this._phase === 0) {
            if (this._timer > 60) {
                this._phase = 1;
            }
        } else if (this._phase === 1) {
            // Rapid pulsing and glowing
            const progress = (this._timer - 60) / 120; // 0 to 1
            const freq = 0.15 + progress * 0.35;
            const pulse = Math.sin(this._timer * freq);
            const scale = 1.0 + pulse * (0.15 + progress * 0.15);
            this._battlerSprite.scale.x = scale;
            this._battlerSprite.scale.y = scale;

            if (this._timer % 15 === 0) {
                AudioManager.playSe({ name: "Powerup", volume: 75, pitch: 100 + Math.floor(progress * 40), pan: 0 });
            }

            if (this._timer >= 180) {
                // Flash of Transformation!
                this._phase = 2;
                this._flashSprite.opacity = 255;
                AudioManager.playSe({ name: "Saint4", volume: 90, pitch: 100, pan: 0 });

                // Formally apply evolution
                // Fix Round 1: apply/register the POSITIONAL species id, not
                // the record `id` field (second positional hop of Defect #2).
                const newPosId = this._newSpeciesPosId || GanjukoEngine.speciesIdOfRecord(this._newSp);
                this._actor.setGanjukoSpecies(newPosId);
                this._actor.recoverAll();
                $gameSystem.registerSeen(newPosId);
                $gameSystem.registerCaught(newPosId);

                // Swap battler bitmap
                const newBattlerName = this._newSp.battlerName || this._newSp.battler;
                const newBattlerHue = this._newSp.battlerHue || 0;
                this._battlerSprite.bitmap = ImageManager.loadEnemy(newBattlerName, newBattlerHue);
                this._battlerSprite.scale.x = 1.0;
                this._battlerSprite.scale.y = 1.0;

                // Stop BGM, Play Cry and Victory Fanfare
                AudioManager.stopBgm();
                // Fix Round 1: playGanjukoCry takes the POSITIONAL species id.
                GanjukoEngine.playGanjukoCry(this._newSpeciesPosId || GanjukoEngine.speciesIdOfRecord(this._newSp));
                setTimeout(() => {
                    AudioManager.playMe({ name: "Fanfare2", volume: 95, pitch: 100, pan: 0 });
                }, 400);

                this.refreshMessage();
            }
        } else if (this._phase === 2) {
            // Fade out white flash
            if (this._flashSprite.opacity > 0) {
                this._flashSprite.opacity -= 10;
            } else {
                this._phase = 3;
            }
        } else if (this._phase === 3) {
            // Joyful bounce
            this._battlerSprite.y = Graphics.boxHeight * 0.45 + Math.sin(this._timer * 0.2) * 6;
            if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
                this.fadeOutAll();
                SceneManager.pop();
            }
        }
    };

    window.Scene_GanjukoEvolution = Scene_GanjukoEvolution;

        function Scene_GanjukoIntro() {
        this.initialize(...arguments);
    }
    Scene_GanjukoIntro.prototype = Object.create(Scene_Base.prototype);
    Scene_GanjukoIntro.prototype.constructor = Scene_GanjukoIntro;

    Scene_GanjukoIntro.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._step = 0;
        this._timer = 0;
        this._selectedGender = 0; // 0: Boy ($Trainer_Boy), 1: Girl ($Trainer_Girl)
        this._starters = [
            { id: 1, name: "Embit", type: "Fire", battler: "Ganjuko_Embit" },
            { id: 4, name: "Bubblix", type: "Water", battler: "Ganjuko_Bubblix" },
            { id: 7, name: "Florabit", type: "Nature", battler: "Ganjuko_Florabit" }
        ];

        this.createBackground();
        this.createCosmicLegends();
        this.createProfessorSprite();
        this.createStarterShowcase();
        this.createTrainerSelector();
        this.createWindowLayer();
        this.createDialogueWindow();
        this.startIntroScript();
    };

    Scene_GanjukoIntro.prototype.createBackground = function() {
        this._bgSprite = new Sprite(ImageManager.loadTitle1("Universe"));
        this.addChild(this._bgSprite);

        const dimBmp = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        dimBmp.fillAll("rgba(5, 8, 20, 0.6)");
        this._dimSprite = new Sprite(dimBmp);
        this.addChild(this._dimSprite);
    };

    Scene_GanjukoIntro.prototype.createCosmicLegends = function() {
        this._cosmicContainer = new Sprite();
        
        // Solaris Sun Deity silhouette
        this._solarisSprite = new Sprite(ImageManager.loadEnemy("SF_Phoenix"));
        this._solarisSprite.anchor.x = 0.5;
        this._solarisSprite.anchor.y = 0.5;
        this._solarisSprite.x = Graphics.boxWidth * 0.28;
        this._solarisSprite.y = Graphics.boxHeight * 0.38;
        this._solarisSprite.scale.x = 1.1;
        this._solarisSprite.scale.y = 1.1;
        this._solarisSprite.opacity = 0;
        this._cosmicContainer.addChild(this._solarisSprite);

        // Grimmorth Nether Deity silhouette
        this._grimmorthSprite = new Sprite(ImageManager.loadEnemy("Goddess_of_death"));
        this._grimmorthSprite.anchor.x = 0.5;
        this._grimmorthSprite.anchor.y = 0.5;
        this._grimmorthSprite.x = Graphics.boxWidth * 0.72;
        this._grimmorthSprite.y = Graphics.boxHeight * 0.38;
        this._grimmorthSprite.scale.x = 1.1;
        this._grimmorthSprite.scale.y = 1.1;
        this._grimmorthSprite.opacity = 0;
        this._cosmicContainer.addChild(this._grimmorthSprite);

        this.addChild(this._cosmicContainer);
    };

    Scene_GanjukoIntro.prototype.createProfessorSprite = function() {
        this._profSprite = new Sprite(ImageManager.loadPicture("People4_6"));
        this._profSprite.anchor.x = 0.5;
        this._profSprite.anchor.y = 1.0;
        this._profSprite.x = Graphics.boxWidth * 0.5;
        this._profSprite.y = Graphics.boxHeight - 140;
        this._profSprite.opacity = 0;
        this.addChild(this._profSprite);
    };

    Scene_GanjukoIntro.prototype.createStarterShowcase = function() {
        this._starterContainer = new Sprite();
        this._starterSprites = [];
        const positions = [
            Graphics.boxWidth * 0.25,
            Graphics.boxWidth * 0.50,
            Graphics.boxWidth * 0.75
        ];

        this._starters.forEach((st, idx) => {
            const spr = new Sprite(ImageManager.loadEnemy(st.battler));
            spr.anchor.x = 0.5;
            spr.anchor.y = 0.5;
            spr.x = positions[idx];
            spr.y = Graphics.boxHeight * 0.42;
            spr.scale.x = 0.75;
            spr.scale.y = 0.75;
            spr.opacity = 0;
            this._starterContainer.addChild(spr);
            this._starterSprites.push(spr);
        });

        this.addChild(this._starterContainer);
    };

    Scene_GanjukoIntro.prototype.createTrainerSelector = function() {
        this._trainerContainer = new Sprite();
        this._trainerContainer.visible = false;

        // Trainer Boy Sprite
        this._boySprite = new Sprite(ImageManager.loadCharacter("$Trainer_Boy"));
        this._boySprite.anchor.x = 0.5;
        this._boySprite.anchor.y = 0.5;
        this._boySprite.x = Graphics.boxWidth * 0.35;
        this._boySprite.y = Graphics.boxHeight * 0.42;
        this._boySprite.scale.x = 2.0;
        this._boySprite.scale.y = 2.0;
        // Show middle frame of down walk (48x48)
        this._boySprite.setFrame(48, 0, 48, 48);
        this._trainerContainer.addChild(this._boySprite);

        // Trainer Girl Sprite
        this._girlSprite = new Sprite(ImageManager.loadCharacter("$Trainer_Girl"));
        this._girlSprite.anchor.x = 0.5;
        this._girlSprite.anchor.y = 0.5;
        this._girlSprite.x = Graphics.boxWidth * 0.65;
        this._girlSprite.y = Graphics.boxHeight * 0.42;
        this._girlSprite.scale.x = 2.0;
        this._girlSprite.scale.y = 2.0;
        this._girlSprite.setFrame(48, 0, 48, 48);
        this._trainerContainer.addChild(this._girlSprite);

        this.addChild(this._trainerContainer);
    };

    Scene_GanjukoIntro.prototype.createDialogueWindow = function() {
        const rect = new Rectangle(100, Graphics.boxHeight - 190, Graphics.boxWidth - 200, 160);
        this._msgWindow = new Window_Base(rect);
        this.addWindow(this._msgWindow);
    };

    Scene_GanjukoIntro.prototype.startIntroScript = function() {
        AudioManager.playBgm({ name: "Theme1", volume: 85, pitch: 100, pan: 0 });
        this.updateStep();
    };

    Scene_GanjukoIntro.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        this._timer++;

        // Cosmic intro fade in
        if (this._step === 0 || this._step === 1) {
            if (this._solarisSprite.opacity < 240) this._solarisSprite.opacity += 4;
            if (this._grimmorthSprite.opacity < 240) this._grimmorthSprite.opacity += 4;
            this._solarisSprite.y = Graphics.boxHeight * 0.38 + Math.sin(this._timer * 0.05) * 8;
            this._grimmorthSprite.y = Graphics.boxHeight * 0.38 + Math.cos(this._timer * 0.05) * 8;
        } else {
            if (this._solarisSprite.opacity > 0) this._solarisSprite.opacity -= 15;
            if (this._grimmorthSprite.opacity > 0) this._grimmorthSprite.opacity -= 15;
        }

        // Professor fade
        if (this._step >= 2 && this._step <= 4) {
            if (this._profSprite.opacity < 255) this._profSprite.opacity += 12;
        } else {
            if (this._profSprite.opacity > 0) this._profSprite.opacity -= 15;
        }

        // Starters fade
        if (this._step === 4) {
            this._starterSprites.forEach((spr, i) => {
                if (spr.opacity < 255) spr.opacity += 10;
                spr.y = Graphics.boxHeight * 0.42 + Math.sin((this._timer + i * 20) * 0.08) * 6;
            });
        } else {
            this._starterSprites.forEach(spr => {
                if (spr.opacity > 0) spr.opacity -= 15;
            });
        }

        // Trainer Selection Controls
        if (this._step === 5) {
            this._trainerContainer.visible = true;
            if (Input.isTriggered("left")) {
                this._selectedGender = 0;
                AudioManager.playSe({ name: "Cursor1", volume: 80, pitch: 100, pan: 0 });
                this.updateStep();
            } else if (Input.isTriggered("right")) {
                this._selectedGender = 1;
                AudioManager.playSe({ name: "Cursor1", volume: 80, pitch: 100, pan: 0 });
                this.updateStep();
            }

            // Pulse selected trainer
            if (this._selectedGender === 0) {
                this._boySprite.scale.x = 2.2 + Math.sin(this._timer * 0.1) * 0.1;
                this._boySprite.scale.y = 2.2 + Math.sin(this._timer * 0.1) * 0.1;
                this._girlSprite.scale.x = 1.8;
                this._girlSprite.scale.y = 1.8;
            } else {
                this._girlSprite.scale.x = 2.2 + Math.sin(this._timer * 0.1) * 0.1;
                this._girlSprite.scale.y = 2.2 + Math.sin(this._timer * 0.1) * 0.1;
                this._boySprite.scale.x = 1.8;
                this._boySprite.scale.y = 1.8;
            }
        } else {
            this._trainerContainer.visible = false;
        }

        if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
            this._step++;
            this.updateStep();
        }
    };

    Scene_GanjukoIntro.prototype.updateStep = function() {
        const w = this._msgWindow;
        w.contents.clear();
        w.resetTextColor();

        switch (this._step) {
            case 0:
                w.changeTextColor("#FFD700");
                w.drawText("✦ PROLOGUE: THE DAWN OF GANJUKO ✦", 16, 10, w.innerWidth - 32, "center");
                w.resetTextColor();
                w.drawText("In the beginning, two primordial titans shaped this boundless continent:", 16, 44, w.innerWidth - 32, "center");
                w.drawText("Solaris, Sovereign of the Sun, and Grimmorth, Lord of the Twilight Nether.", 16, 76, w.innerWidth - 32, "center");
                w.changeTextColor("#00FFCC");
                w.drawText("[Press Enter or Tap to Continue]", 16, 110, w.innerWidth - 32, "center");
                break;
            case 1:
                w.drawText("From their celestial balance sprang over 500 extraordinary species of GANJUKO.", 16, 20, w.innerWidth - 32, "center");
                w.drawText("Living across lush forests, towering volcanos, tempest winds, and ocean depths.", 16, 56, w.innerWidth - 32, "center");
                w.changeTextColor("#00FFCC");
                w.drawText("[Press Enter or Tap to Continue]", 16, 110, w.innerWidth - 32, "center");
                break;
            case 2:
                AudioManager.playSe({ name: "Saint1", volume: 90, pitch: 100, pan: 0 });
                w.changeTextColor("#FFD700");
                w.drawText("Greetings, traveler! Welcome to the magnificent world of GANJUKO!", 16, 12, w.innerWidth - 32, "left");
                w.resetTextColor();
                w.drawText("My name is Professor Kusu, chief researcher of regional species.", 16, 48, w.innerWidth - 32, "left");
                w.drawText("Humans and Ganjuko live together, forge bonds, and test their strength in battle!", 16, 80, w.innerWidth - 32, "left");
                break;
            case 3:
                w.drawText("To become a recognized Ganjuko Trainer, you will travel across 8 Elemental Gyms,", 16, 18, w.innerWidth - 32, "left");
                w.drawText("conquer the Victory Road, and challenge the Grand Ganjuko League Champions!", 16, 52, w.innerWidth - 32, "left");
                w.changeTextColor("#00FFCC");
                w.drawText("[Press Enter to Continue]", 16, 110, w.innerWidth - 32, "center");
                break;
            case 4:
                AudioManager.playSe({ name: "Item1", volume: 85, pitch: 110, pan: 0 });
                w.changeTextColor("#FFD700");
                w.drawText("✦ MEET THE THREE REGIONAL STARTERS ✦", 16, 10, w.innerWidth - 32, "center");
                w.resetTextColor();
                w.drawText("Left: Embit (Fire)  |  Center: Bubblix (Water)  |  Right: Florabit (Nature)", 16, 44, w.innerWidth - 32, "center");
                w.drawText("One of these spirited partners will accompany you from the very start!", 16, 76, w.innerWidth - 32, "center");
                break;
            case 5:
                w.changeTextColor("#FFD700");
                w.drawText("✦ SELECT YOUR TRAINER AVATAR ✦", 16, 10, w.innerWidth - 32, "center");
                w.resetTextColor();
                const boyLabel = this._selectedGender === 0 ? "▶ [ BOY TRAINER: HIRO ] ◀" : "  [ BOY TRAINER: HIRO ]  ";
                const girlLabel = this._selectedGender === 1 ? "▶ [ GIRL TRAINER: AOI ] ◀" : "  [ GIRL TRAINER: AOI ]  ";
                w.drawText(boyLabel + "          " + girlLabel, 16, 52, w.innerWidth - 32, "center");
                w.changeTextColor("#00FFCC");
                w.drawText("Press LEFT / RIGHT arrow to choose avatar, then ENTER to confirm!", 16, 104, w.innerWidth - 32, "center");
                break;
            case 6:
                // Apply player avatar selection
                const charName = this._selectedGender === 0 ? "$Trainer_Boy" : "$Trainer_Girl";
                const trainerName = this._selectedGender === 0 ? "Hiro" : "Aoi";
                $gameSystem.setTrainerAvatar(charName);
                $gameSystem.setTrainerName(trainerName);
                $gamePlayer.setImage(charName, 0);
                $gamePlayer.refresh();

                AudioManager.playMe({ name: "Fanfare1", volume: 90, pitch: 100, pan: 0 });
                w.changeTextColor("#FFD700");
                w.drawText("Trainer " + trainerName + ", your destiny begins now!", 16, 18, w.innerWidth - 32, "center");
                w.resetTextColor();
                w.drawText("Awaken in Wakaba Town, visit my laboratory, and choose your starter!", 16, 56, w.innerWidth - 32, "center");
                w.changeTextColor("#00FFCC");
                w.drawText("[Press Enter to Begin Your Journey!]", 16, 104, w.innerWidth - 32, "center");
                break;
            default:
                this.fadeOutAll();
                SceneManager.goto(Scene_Map);
                break;
        }
    };
    window.Scene_GanjukoIntro = Scene_GanjukoIntro;

    // Cinematic Dynamic Encounter Effect (Flash, Triple Zoom Pulse & Shake)
    Scene_Map.prototype.startEncounterEffect = function() {
        this._spriteset.hideCharacters();
        this._encounterEffectSpeed = 50;
        this._encounterEffectDuration = 50;
        SoundManager.playBattleStart();
        $gameScreen.startShake(7, 8, 30);
    };

    Scene_Map.prototype.updateEncounterEffect = function() {
        if (this._encounterEffectDuration > 0) {
            this._encounterEffectDuration--;
            const speed = 50;
            const n = speed - this._encounterEffectDuration;
            const p = n / speed;
            const zoomX = $gamePlayer.screenX();
            const zoomY = $gamePlayer.screenY() - 24;

            if (n === 2) {
                $gameScreen.setZoom(zoomX, zoomY, 1);
                this.snapForBattleBackground();
                this.startFlashForEncounter(speed / 2);
            }
            // Double dynamic zoom pulse
            const pulse = 1.0 + Math.sin(p * Math.PI * 3) * 0.45;
            $gameScreen.setZoom(zoomX, zoomY, pulse);

            if (n === 15) {
                this.startFlashForEncounter(speed / 3);
            }
            if (n === 28) {
                BattleManager.playBattleBgm();
                this.startFadeOut(this.fadeSpeed());
            }
        }
    };



    // =========================================================================
    // 16. COMPETITIVE UPGRADE (2026-11-01): TYPE CHART, DAMAGE FEEL, BATTLER
    //     ART FALLBACK, SMART ENEMY AI, MOVE POOLS, GANJUKO STADIUM,
    //     CAPTURE FIX
    // =========================================================================
    // One self-contained section. Every patch below is defensive: it stores
    // the original method and calls it unchanged for non-Ganjuko cases, and
    // it no-ops safely when a referenced class/method is absent.

    // --- Shared helpers ------------------------------------------------------
    const _s16_isGanjukoBattler = function(battler) {
        if (!battler) return false;
        try {
            return typeof battler.ganjukoSpecies === "function" ||
                   typeof battler.ganjukoType === "function" ||
                   battler._ganjukoSpeciesId != null;
        } catch (e) { return false; }
    };
    const _s16_speciesOf = function(battler) {
        if (!battler) return null;
        try {
            if (typeof battler.ganjukoSpecies === "function") return battler.ganjukoSpecies();
            if (battler.type1 != null || battler.baseStats || battler.base) return battler; // a species object itself
        } catch (e) { /* fall through */ }
        return null;
    };
    const _s16_typeOf = function(battler) {
        const sp = _s16_speciesOf(battler);
        if (sp) return sp.type1 || sp.type || 1;
        try { if (battler && typeof battler.ganjukoType === "function") return battler.ganjukoType(); } catch (e) {}
        return 1;
    };
    const _s16_levelOf = function(battler) {
        if (!battler) return 1;
        try {
            if (typeof battler.ganjukoLevel === "function") return battler.ganjukoLevel();
            if (typeof battler.level === "number") return battler.level;
            if (typeof battler._level === "number") return battler._level;
        } catch (e) {}
        return 1;
    };
    // Safe stat read for formula estimation (RMMZ battlers expose atk/def/...
    // as getters; fall back to param()).
    const _s16_statOf = function(battler, key) {
        if (!battler) return 10;
        try {
            if (key === "level") return _s16_levelOf(battler);
            const v = battler[key];
            if (typeof v === "number" && isFinite(v)) return v;
            const paramIds = { mhp: 0, mmp: 1, atk: 2, def: 3, mat: 4, mdf: 5, agi: 6, luk: 7 };
            if (typeof battler.param === "function" && paramIds[key] != null) return battler.param(paramIds[key]);
        } catch (e) {}
        return 10;
    };
    // Lightweight, sanitized skill-formula evaluation for AI/augment ranking.
    // Tokens a.xxx / b.xxx are substituted with numbers first; the result is
    // evaluated only if it is pure arithmetic, otherwise a constant 10.
    const _s16_evalFormula = function(formula, a, b) {
        if (typeof formula !== "string" || !formula) return 10;
        let expr = formula.replace(/([ab])\.(\w+)/g, (m, side, key) => {
            const src = side === "a" ? a : b;
            return String(_s16_statOf(src, key));
        });
        expr = expr.replace(/\bv\[\d+\]/g, "0");
        if (!/^[\d\s+\-*/().]+$/.test(expr)) return 10;
        try {
            const val = Function("\"use strict\"; return (" + expr + ");")();
            return (typeof val === "number" && isFinite(val)) ? val : 10;
        } catch (e) { return 10; }
    };

    // =========================================================================
    // 16.1 TYPE CHART OVERRIDE
    // =========================================================================
    // Attacker element id -> { defender type id: multiplier }; unlisted = 1.0.
    // Authoritative source: work/TYPE-CHART.md v1.1 (9x9, single-type defenders,
    // dual-type ready: a type2 on the defender multiplies in).
    const GANJUKO_TYPE_CHART = {
        1: { 6: 0.5, 9: 0.5, 8: 0 },              // NORMAL
        2: { 4: 2, 8: 2, 2: 0.5, 3: 0.5, 6: 0.5 }, // FIRE
        3: { 2: 2, 6: 2, 3: 0.5 },                 // WATER (v1.1: Water->Nature = 1.0, removed)
        4: { 6: 2, 3: 2, 2: 0.5, 4: 0.5, 7: 0.5 }, // NATURE
        5: { 3: 2, 7: 2, 5: 0.5, 4: 0.5, 6: 0 },   // VOLT
        6: { 5: 2, 2: 2, 1: 2, 4: 0.5, 7: 0 },     // EARTH
        7: { 4: 2, 2: 2, 5: 0.5, 9: 0.5 },         // WIND
        8: { 9: 2, 4: 2, 8: 0.5, 2: 0.5, 1: 0 },   // UMBRA
        9: { 8: 2, 7: 2, 9: 2, 1: 0.5 }            // ASTRAL
    };

    GanjukoEngine.typeEffectiveness = function(moveElementId, defenderSpecies) {
        const atk = Number(moveElementId) || 0;
        if (atk < 1 || atk > 9) return 1;
        let sp = defenderSpecies;
        if (sp && typeof sp.ganjukoSpecies === "function") {
            try { sp = sp.ganjukoSpecies(); } catch (e) { sp = null; }
        }
        if (!sp) return 1;
        const row = GANJUKO_TYPE_CHART[atk] || {};
        const t1 = sp.type1 || sp.type || 0;
        let rate = row[t1] != null ? row[t1] : 1;
        const t2 = sp.type2 || 0;
        if (t2 && t2 !== t1) rate *= (row[t2] != null ? row[t2] : 1);
        return rate;
    };
    GanjukoEngine.typeChart = GANJUKO_TYPE_CHART;
    GanjukoEngine.GANJUKO_TYPE_CHART = GANJUKO_TYPE_CHART;
    window.GanjukoCompetitive = {
        chart: GANJUKO_TYPE_CHART,
        effectiveness: (moveElementId, defenderSpecies) => GanjukoEngine.typeEffectiveness(moveElementId, defenderSpecies)
    };

    if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.calcElementRate === "function") {
        const _s16_Game_Action_calcElementRate = Game_Action.prototype.calcElementRate;
        Game_Action.prototype.calcElementRate = function(target) {
            try {
                const item = this.item();
                if (item && item.damage && item.damage.elementId >= 1) {
                    const subject = typeof this.subject === "function" ? this.subject() : null;
                    if (_s16_isGanjukoBattler(subject) || _s16_isGanjukoBattler(target)) {
                        const sp = _s16_speciesOf(target);
                        if (sp) return GanjukoEngine.typeEffectiveness(item.damage.elementId, sp);
                    }
                }
            } catch (e) { /* fall through to stock */ }
            return _s16_Game_Action_calcElementRate.call(this, target);
        };
    }

    // =========================================================================
    // 16.2 DAMAGE FEEL: STAB 1.5 TOTAL, CRIT x1.5, ROLL 0.85-1.00
    // =========================================================================
    // STAB composition: section 5 already multiplies damage by 1.25 when its
    // STAB predicate holds (move element == subject type AND elementId > 1).
    // This wrapper composes on top of section 5's result:
    //   elementId > 1 and STAB: extra x(1.5 / 1.25) = x1.2  -> total exactly 1.5
    //   elementId == 1 (NORMAL) and STAB: section 5 applied nothing, so x1.5
    //   -> total exactly 1.5 for every type.
    // Critical: RMMZ Game_Action.applyCritical(damage) returns damage * 3 and
    // is called by the stock makeDamageValue; overriding it to x1.5 for
    // Ganjuko subjects yields exactly x1.5 with no composition needed.
    if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.applyCritical === "function") {
        const _s16_Game_Action_applyCritical = Game_Action.prototype.applyCritical;
        Game_Action.prototype.applyCritical = function(damage) {
            try {
                const subject = typeof this.subject === "function" ? this.subject() : null;
                if (_s16_isGanjukoBattler(subject)) return damage * 1.5;
            } catch (e) { /* fall through */ }
            return _s16_Game_Action_applyCritical.call(this, damage);
        };
    }

    if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.makeDamageValue === "function") {
        const _s16_Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
        Game_Action.prototype.makeDamageValue = function(target, critical) {
            let value = _s16_Game_Action_makeDamageValue.call(this, target, critical);
            try {
                const item = this.item();
                const subject = typeof this.subject === "function" ? this.subject() : null;
                if (!_s16_isGanjukoBattler(subject) || !item || !item.damage) return value;
                const isSkill = (typeof DataManager !== "undefined" && DataManager.isSkill) ? DataManager.isSkill(item) : !!item.damage.formula;
                if (!isSkill || item.damage.type !== 1) return value; // HP-damage skills only
                // Immunity must deal 0 (section 5 floors its result at 1).
                const sp = _s16_speciesOf(target);
                if (sp && GanjukoEngine.typeEffectiveness(item.damage.elementId, sp) === 0) return 0;
                const moveType = item.damage.elementId || 0;
                if (moveType >= 1 && _s16_typeOf(subject) === moveType) {
                    value *= (moveType > 1) ? (1.5 / 1.25) : 1.5;
                }
                value *= 0.85 + Math.random() * 0.15; // 0.85-1.00 roll
                return Math.max(1, Math.round(value));
            } catch (e) { return value; }
        };
    }

    // =========================================================================
    // 16.3 BATTLER ART FALLBACK
    // =========================================================================
    // Rationale (corrected by the 2026-11-01 balance audit): no species is
    // invisible — every battlerName in the data resolves to an existing file.
    // The real problem is sharing: 482 species reuse 101 stock sprites. So the
    // resolver is deliberately small: Ganjuko_-prefixed (custom) names pass
    // through unchanged with their data hue; stock names also pass through
    // unchanged, but gain a deterministic per-species hue from the palette
    // below so species sharing one stock sprite read as distinct colour
    // variants. (Future generated art installs under Ganjuko_<Name> names via
    // a GanjukoSpecies.json battlerName rewrite, outside this plugin.)
    const GANJUKO_HUE_PALETTE = [20, 45, 70, 95, 120, 145, 190, 215, 240, 265, 290, 315];

    GanjukoEngine.resolveBattlerName = function(species) {
        let sp = species;
        if (typeof sp === "number") sp = GanjukoEngine.getSpecies(sp);
        if (!sp) return "Salamander";
        return sp.battlerName || sp.battler || "Salamander"; // custom or stock: unchanged
    };
    GanjukoEngine.resolveBattlerHue = function(species) {
        let sp = species;
        if (typeof sp === "number") sp = GanjukoEngine.getSpecies(sp);
        if (!sp) return 0;
        const raw = sp.battlerName || sp.battler || "";
        if (raw.startsWith("Ganjuko_")) return sp.battlerHue || 0;
        return GANJUKO_HUE_PALETTE[Math.abs(Number(sp.id) || 1) % GANJUKO_HUE_PALETTE.length];
    };
    GanjukoEngine.isCustomBattler = function(species) {
        const sp = typeof species === "number" ? GanjukoEngine.getSpecies(species) : species;
        if (!sp) return false;
        return String(sp.battlerName || sp.battler || "").startsWith("Ganjuko_");
    };

    // Run fn() with the species' battler fields temporarily resolved, so the
    // engine's existing synchronous sprite loads pick the fallback art (and
    // the fallback hue, where the call site passes battlerHue). Restored in
    // finally; safe because all covered call sites load synchronously.
    const _s16_withResolvedBattler = function(species, fn) {
        if (!species || typeof fn !== "function") { if (typeof fn === "function") fn(); return; }
        const oldHue = species.battlerHue;
        species.battlerHue = GanjukoEngine.resolveBattlerHue(species);
        try { fn(); } finally { species.battlerHue = oldHue; }
    };

    // (a) Actor battler image (setGanjukoSpecies -> setBattlerImage path).
    if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.setGanjukoSpecies === "function") {
        const _s16_Game_Actor_setGanjukoSpecies_art = Game_Actor.prototype.setGanjukoSpecies;
        Game_Actor.prototype.setGanjukoSpecies = function(speciesId) {
            _s16_Game_Actor_setGanjukoSpecies_art.call(this, speciesId);
            try {
                const sp = GanjukoEngine.getSpecies(speciesId);
                if (sp && typeof this.setBattlerImage === "function") {
                    this.setBattlerImage(GanjukoEngine.resolveBattlerName(sp));
                }
            } catch (e) {}
        };
    }
    // (b) Battle enemy sprite: Sprite_Enemy reads battlerName()/battlerHue().
    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype) {
        if (typeof Game_Enemy.prototype.battlerName === "function") {
            const _s16_Game_Enemy_battlerName = Game_Enemy.prototype.battlerName;
            Game_Enemy.prototype.battlerName = function() {
                try {
                    const sp = _s16_speciesOf(this);
                    if (sp) return GanjukoEngine.resolveBattlerName(sp);
                } catch (e) {}
                return _s16_Game_Enemy_battlerName.call(this);
            };
        }
        if (typeof Game_Enemy.prototype.battlerHue === "function") {
            const _s16_Game_Enemy_battlerHue = Game_Enemy.prototype.battlerHue;
            Game_Enemy.prototype.battlerHue = function() {
                const orig = _s16_Game_Enemy_battlerHue.call(this);
                try {
                    if (this._isShiny) return orig; // shiny hue (160) wins
                    const sp = _s16_speciesOf(this);
                    if (sp && !GanjukoEngine.isCustomBattler(sp)) return GanjukoEngine.resolveBattlerHue(sp);
                } catch (e) {}
                return orig;
            };
        }
    }
    // (c) Follower / player-lead battle sprite (Sprite_PlayerGanjuko.update).
    if (typeof Sprite_PlayerGanjuko !== "undefined" && Sprite_PlayerGanjuko.prototype && typeof Sprite_PlayerGanjuko.prototype.update === "function") {
        const _s16_Sprite_PlayerGanjuko_update = Sprite_PlayerGanjuko.prototype.update;
        Sprite_PlayerGanjuko.prototype.update = function() {
            let actor = null;
            try { actor = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers()[0] : null; } catch (e) {}
            const sp = actor ? _s16_speciesOf(actor) : null;
            if (sp) {
                _s16_withResolvedBattler(sp, () => _s16_Sprite_PlayerGanjuko_update.call(this));
                // Re-apply with hue: the stock update loads with no hue arg.
                try {
                    const resolved = GanjukoEngine.resolveBattlerName(sp);
                    const hue = GanjukoEngine.resolveBattlerHue(sp);
                    const key = resolved + ":" + hue;
                    if (this._s16_hueKey !== key && typeof ImageManager !== "undefined") {
                        this._s16_hueKey = key;
                        this.bitmap = ImageManager.loadEnemy(resolved, hue);
                    }
                } catch (e) {}
            } else {
                _s16_Sprite_PlayerGanjuko_update.call(this);
            }
        };
    }
    // (d) Dex detail sprite (Window_GanjukoDexDetail.refresh).
    if (typeof Window_GanjukoDexDetail !== "undefined" && Window_GanjukoDexDetail.prototype && typeof Window_GanjukoDexDetail.prototype.refresh === "function") {
        const _s16_DexDetail_refresh = Window_GanjukoDexDetail.prototype.refresh;
        Window_GanjukoDexDetail.prototype.refresh = function() {
            let sp = null;
            try { sp = GanjukoEngine.getSpecies(this._speciesId); } catch (e) {}
            if (sp) _s16_withResolvedBattler(sp, () => _s16_DexDetail_refresh.call(this));
            else _s16_DexDetail_refresh.call(this);
            try {
                if (sp && this._sprite) {
                    this._sprite.bitmap = ImageManager.loadEnemy(
                        GanjukoEngine.resolveBattlerName(sp), GanjukoEngine.resolveBattlerHue(sp));
                }
            } catch (e) {}
        };
    }
    // (e) Summary window sprite (Window_GanjukoSummary.refresh).
    if (typeof Window_GanjukoSummary !== "undefined" && Window_GanjukoSummary.prototype && typeof Window_GanjukoSummary.prototype.refresh === "function") {
        const _s16_Summary_refresh = Window_GanjukoSummary.prototype.refresh;
        Window_GanjukoSummary.prototype.refresh = function() {
            let sp = null;
            try {
                const members = $gameParty.allMembers();
                const actor = members[this._memberIndex || 0];
                sp = actor ? _s16_speciesOf(actor) : null;
            } catch (e) {}
            if (sp) _s16_withResolvedBattler(sp, () => _s16_Summary_refresh.call(this));
            else _s16_Summary_refresh.call(this);
            try {
                if (sp && this._battlerSprite) {
                    this._battlerSprite.bitmap = ImageManager.loadEnemy(
                        GanjukoEngine.resolveBattlerName(sp), GanjukoEngine.resolveBattlerHue(sp));
                }
            } catch (e) {}
        };
    }
    // (f) Evolution scene sprites (createBattlerSprite + update swap).
    if (typeof Scene_GanjukoEvolution !== "undefined" && Scene_GanjukoEvolution.prototype) {
        if (typeof Scene_GanjukoEvolution.prototype.createBattlerSprite === "function") {
            const _s16_Evo_createBattlerSprite = Scene_GanjukoEvolution.prototype.createBattlerSprite;
            Scene_GanjukoEvolution.prototype.createBattlerSprite = function() {
                if (this._oldSp) _s16_withResolvedBattler(this._oldSp, () => _s16_Evo_createBattlerSprite.call(this));
                else _s16_Evo_createBattlerSprite.call(this);
            };
        }
        if (typeof Scene_GanjukoEvolution.prototype.update === "function") {
            const _s16_Evo_update = Scene_GanjukoEvolution.prototype.update;
            Scene_GanjukoEvolution.prototype.update = function() {
                const run = () => _s16_Evo_update.call(this);
                if (this._oldSp && this._newSp) {
                    _s16_withResolvedBattler(this._oldSp, () => _s16_withResolvedBattler(this._newSp, run));
                } else if (this._newSp) {
                    _s16_withResolvedBattler(this._newSp, run);
                } else if (this._oldSp) {
                    _s16_withResolvedBattler(this._oldSp, run);
                } else {
                    run();
                }
            };
        }
    }

    // =========================================================================
    // 16.4 SMART ENEMY AI
    // =========================================================================
    // Score a candidate skill for `enemy` against `targetActor` (higher is
    // better). Damaging: estimated formula damage x chart effectiveness x
    // STAB (1.5) x successRate; effectiveness 0 scores exactly 0. Healing is
    // valued only when the enemy is hurt (<45% HP); status (effect code 21)
    // is valued only when the target does not already carry that state.
    GanjukoEngine.scoreEnemyAction = function(enemy, actionItem, targetActor) {
        let skill = null;
        try {
            if (typeof actionItem === "number") skill = (typeof $dataSkills !== "undefined" && $dataSkills) ? $dataSkills[actionItem] : null;
            else if (actionItem && typeof actionItem === "object") {
                if (actionItem.damage) skill = actionItem;
                else if (typeof actionItem.item === "function") skill = actionItem.item();
                else if (actionItem.skillId != null && typeof $dataSkills !== "undefined" && $dataSkills) skill = $dataSkills[actionItem.skillId];
            }
        } catch (e) { skill = null; }
        if (!skill) return 0;
        const success = (typeof skill.successRate === "number" ? skill.successRate : 100) / 100;
        const target = targetActor || null;
        const dmgType = skill.damage ? skill.damage.type : 0;
        let score = 0;
        // Status rider (effect code 21 = Add State).
        let statusValue = 0;
        if (Array.isArray(skill.effects)) {
            for (const eff of skill.effects) {
                if (eff && eff.code === 21 && target) {
                    let already = false;
                    try {
                        already = (typeof target.isStateAffected === "function")
                            ? target.isStateAffected(eff.dataId)
                            : (typeof target.states === "function" && target.states().some(s => s && s.id === eff.dataId));
                    } catch (e) {}
                    if (!already) statusValue += 22 * (typeof eff.value1 === "number" ? Math.min(1, eff.value1) : 1);
                }
                if (eff && eff.code === 31) statusValue += 6; // buff rider: mild setup value
            }
        }
        if (dmgType === 3) { // HP recover / support
            let healEst = 0;
            try { healEst = Math.max(0, _s16_evalFormula(skill.damage.formula, enemy, enemy)); } catch (e) {}
            let hpRate = 1;
            try { hpRate = (typeof enemy.hpRate === "function") ? enemy.hpRate() : (enemy.hp / Math.max(1, enemy.mhp)); } catch (e) {}
            if (healEst > 0) score = (hpRate < 0.45) ? healEst * 1.2 : healEst * 0.05;
            else score = statusValue > 0 ? statusValue : 10; // pure buff (e.g. Bulk Up)
            return score * success;
        }
        if (dmgType === 1) {
            if (!target) return 1;
            const effRate = GanjukoEngine.typeEffectiveness(skill.damage.elementId, _s16_speciesOf(target));
            if (effRate === 0) return 0; // never value an immune damaging move
            const est = Math.max(0, _s16_evalFormula(skill.damage.formula, enemy, target));
            const stab = (_s16_typeOf(enemy) === (skill.damage.elementId || 0)) ? 1.5 : 1;
            score = est * effRate * stab * success;
            try { if (target.hp != null && est * effRate >= target.hp) score *= 1.5; } catch (e) {} // finisher bonus
            return score + statusValue * success;
        }
        // Non-damage, non-recover (pure status): value the status only.
        return statusValue * success;
    };

    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.makeActions === "function") {
        const _s16_Game_Enemy_makeActions = Game_Enemy.prototype.makeActions;
        Game_Enemy.prototype.makeActions = function() {
            _s16_Game_Enemy_makeActions.call(this);
            try {
                if (!_s16_isGanjukoBattler(this)) return;
                if (!this._actions || this._actions.length === 0) return;
                // Player lead = scoring target.
                let target = null;
                try {
                    const members = $gameParty.battleMembers().filter(m => m && m.isAlive());
                    target = members[0] || $gameParty.battleMembers()[0] || null;
                } catch (e) {}
                if (!target) return;
                // Candidate skills: the enemy row's action patterns PLUS the
                // runtime pool list stored by 16.5 (Enemies.json rows fix an
                // enemy's printed moves; pool variety enters by substitution
                // into the chosen action, below).
                const candidateIds = new Set();
                try {
                    const data = (typeof this.enemy === "function") ? this.enemy() : null;
                    if (data && Array.isArray(data.actions)) {
                        for (const pat of data.actions) {
                            if (pat && pat.skillId && (!pat.conditionType || (typeof this.isActionValid === "function" ? this.isActionValid(pat) : true))) {
                                candidateIds.add(pat.skillId);
                            }
                        }
                    }
                } catch (e) {}
                if (Array.isArray(this._ganjukoPoolSkills)) {
                    for (const id of this._ganjukoPoolSkills) candidateIds.add(id);
                }
                try { for (const act of this._actions) { const it = act && act.item(); if (it && it.id) candidateIds.add(it.id); } } catch (e) {}
                if (candidateIds.size === 0) return;
                let bestId = 0, bestScore = -1;
                for (const id of candidateIds) {
                    const skill = (typeof $dataSkills !== "undefined" && $dataSkills) ? $dataSkills[id] : null;
                    if (!skill) continue;
                    // Respect usability (MP cost etc.) when the API exists.
                    try { if (typeof this.canUse === "function" && !this.canUse(skill)) continue; } catch (e) {}
                    const s = GanjukoEngine.scoreEnemyAction(this, skill, target);
                    if (s > bestScore) { bestScore = s; bestId = id; }
                }
                if (!bestId) return;
                const current = this._actions[0];
                const currentItem = current && typeof current.item === "function" ? current.item() : null;
                const currentScore = currentItem ? GanjukoEngine.scoreEnemyAction(this, currentItem, target) : 0;
                const difficulty = (typeof $gameTemp !== "undefined" && $gameTemp) ? $gameTemp._ganjukoDifficulty : null;
                let pBest = 0.4; // wild
                if (difficulty === "gym" || difficulty === "stadium") pBest = 0.95;
                else if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._isTrainerBattle) pBest = 0.8;
                const rollBest = Math.random() < pBest;
                // Safety substitution: never leave an immune damaging move
                // chosen when a non-immune alternative exists, at any tier.
                const currentImmune = !!(currentItem && currentItem.damage && currentItem.damage.type === 1 &&
                    GanjukoEngine.typeEffectiveness(currentItem.damage.elementId, _s16_speciesOf(target)) === 0);
                if ((rollBest && bestScore > currentScore) || (currentImmune && bestScore > 0)) {
                    if (current && typeof current.setSkill === "function" && (!currentItem || currentItem.id !== bestId)) {
                        current.setSkill(bestId);
                        // Preserve 1v1 targeting for the substituted skill.
                        try {
                            if (current.isForOpponent && current.isForOpponent() && typeof target.index === "function") {
                                current.setTarget(target.index());
                            }
                        } catch (e) {}
                    }
                }
            } catch (e) { /* AI is best-effort; stock choice stands */ }
        };
    }

    // =========================================================================
    // 16.5 MOVE POOLS (best-4 for actors; pool candidates for enemies)
    // =========================================================================
    // Built ONLY from real Skills.json ids (1-72). Pools are listed in
    // ascending strength order inside each tier, so "strongest eligible" is
    // the last eligible entry. Tier level gates: early 1, mid 10, late 22,
    // statusOrHeal 6.
    // v13 pool repair (Champions v2 §1.5 + v1 §5.3): signatures (58-72) are
    // OUT of every pool; hard POW cap 100; tier gates re-read on v2 numbers
    // (early <= 60 @ Lv1, mid <= 75 @ Lv10, late <= 100 @ Lv26); the v13
    // stage kit joins statusOrHeal (81/73/74/79/80/82) and the damaging
    // tiers (75/76 mid, 78 mid, 77 late — its renormed POW 85 exceeds the
    // mid ceiling); Will-o-Wisp moves to Umbra's statusOrHeal now that it
    // is a pure status move; Static Web (83) and Slumber Spores (84) take
    // the Volt/Nature statusOrHeal slots. One named exception: Psybeam (47,
    // POW 65) stays in Astral's early tier — it is the type's weakest
    // damaging move and the renorm lifted it one step over the early gate;
    // the alternative is Astral with no early pool at all.
    const GANJUKO_MOVE_POOLS = {
        1: { early: [1, 3, 4, 5], mid: [51], late: [53], statusOrHeal: [2, 52, 81] },
        2: { early: [6, 7], mid: [8], late: [9, 27, 28], statusOrHeal: [55] },
        3: { early: [10, 38], mid: [40, 11, 12], late: [13, 30], statusOrHeal: [] },
        4: { early: [14], mid: [15, 78], late: [32], statusOrHeal: [16, 31, 84] },
        5: { early: [18], mid: [19, 35], late: [33], statusOrHeal: [83] },
        6: { early: [24], mid: [25], late: [63, 77, 26, 37, 36], statusOrHeal: [57, 79, 80] },
        7: { early: [21], mid: [22], late: [23], statusOrHeal: [74] },
        8: { early: [41], mid: [43], late: [42, 46, 44], statusOrHeal: [45, 82] },
        9: { early: [], mid: [47, 76, 48], late: [49], statusOrHeal: [73] }
    };
    const GANJUKO_POOL_TIER_LEVEL = { early: 1, mid: 10, late: 26, statusOrHeal: 6 };
    // Fixed coverage picks (skill id) per attacker type, unlocked at Lv 8.
    const GANJUKO_COVERAGE = { 1: 41, 2: 24, 3: 19, 4: 7, 5: 22, 6: 18, 7: 42, 8: 47, 9: 43 };
    GanjukoEngine.GANJUKO_MOVE_POOLS = GANJUKO_MOVE_POOLS;
    GanjukoEngine.GANJUKO_COVERAGE = GANJUKO_COVERAGE;

    const _s16_poolDamaging = function(typeId, level) {
        const pool = GANJUKO_MOVE_POOLS[typeId] || GANJUKO_MOVE_POOLS[1];
        const out = [];
        for (const tier of ["early", "mid", "late"]) {
            if (level >= GANJUKO_POOL_TIER_LEVEL[tier]) out.push(...(pool[tier] || []));
        }
        return out; // ascending strength
    };
    const _s16_poolStatusOrHeal = function(typeId, level) {
        if (level < GANJUKO_POOL_TIER_LEVEL.statusOrHeal) return [];
        const pool = GANJUKO_MOVE_POOLS[typeId] || GANJUKO_MOVE_POOLS[1];
        if (pool.statusOrHeal && pool.statusOrHeal.length) return pool.statusOrHeal.slice();
        return [2]; // Brace (NORMAL) as the universal utility fallback
    };
    const _s16_skillStrength = function(battler, skillId) {
        try {
            const skill = (typeof $dataSkills !== "undefined" && $dataSkills) ? $dataSkills[skillId] : null;
            if (!skill || !skill.damage) return 0;
            if (skill.damage.type === 3) return 15;
            const est = Math.max(0, _s16_evalFormula(skill.damage.formula, battler, battler));
            const stab = (_s16_typeOf(battler) === (skill.damage.elementId || 0)) ? 1.5 : 1;
            return est * stab;
        } catch (e) { return 0; }
    };

    GanjukoEngine.augmentSkills = function(battler) {
        if (!battler || !_s16_isGanjukoBattler(battler)) return;
        const typeId = _s16_typeOf(battler);
        const level = _s16_levelOf(battler);
        const poolDamaging = _s16_poolDamaging(typeId, level);
        // Enemies have no _skills list: stash pool candidates for 16.4.
        if (typeof battler.isEnemy === "function" && battler.isEnemy()) {
            const statusIds = _s16_poolStatusOrHeal(typeId, level);
            battler._ganjukoPoolSkills = Array.from(new Set([...poolDamaging, ...statusIds]));
            return;
        }
        if (!Array.isArray(battler._skills)) return;
        try {
            // Learned set: current skills + species learnings + class learnings.
            const learned = new Set(battler._skills.slice());
            const sp = _s16_speciesOf(battler);
            if (sp && Array.isArray(sp.learnings)) {
                for (const l of sp.learnings) { if (l && l.level <= level) learned.add(l.skillId); }
            }
            try {
                const cls = (typeof battler.currentClass === "function") ? battler.currentClass() : null;
                if (cls && Array.isArray(cls.learnings)) {
                    for (const l of cls.learnings) { if (l && l.level <= level) learned.add(l.skillId); }
                }
            } catch (e) {}
            const valid = id => (typeof $dataSkills !== "undefined" && $dataSkills && $dataSkills[id]);
            const chosen = [];
            const push = id => { if (id && valid(id) && !chosen.includes(id)) chosen.push(id); };
            // Slot plan (best 4, strongest LAST so the 4-move slicer and the
            // FIGHT menu keep the premium move):
            //   [status/utility or learned, coverage, second STAB, strongest STAB]
            const stabStrongest = poolDamaging.length ? poolDamaging[poolDamaging.length - 1] : 0;
            const stabSecond = poolDamaging.length > 1 ? poolDamaging[poolDamaging.length - 2] : 0;
            const coverageId = (level >= 8) ? (GANJUKO_COVERAGE[typeId] || 0) : 0;
            const statusIds = _s16_poolStatusOrHeal(typeId, level);
            const statusPick = statusIds.length ? statusIds[statusIds.length - 1] : 0;
            // Strongest remaining learned move (flavour / species identity).
            let learnedBest = 0, learnedBestScore = -1;
            for (const id of learned) {
                if (id === stabStrongest || id === stabSecond || id === coverageId || id === statusPick) continue;
                const s = _s16_skillStrength(battler, id);
                if (s > learnedBestScore) { learnedBestScore = s; learnedBest = id; }
            }
            // Guarantees (balance audit 2026-11-01): coverage + second STAB
            // + strongest STAB are all damaging, so the best-4 always fields
            // >= 3 damaging moves when the type pool can supply them (fixes
            // the 24 heal/status-heavy final forms); the coverage slot gives
            // EVERY species — Normal species above all, whose data learnsets
            // are Normal-damage-only — a non-own-type damaging move from
            // Lv 8 on, hence always by Lv 25. Dedupe is by skillId
            // throughout (learned is a Set and push() refuses repeats), so
            // the [3,1,2,3] Tackle/Tackle/Brace/Tackle learnsets collapse to
            // distinct skills and the freed slot is backfilled below.
            push(statusPick || learnedBest);
            push(coverageId);
            push(stabSecond);
            push(stabStrongest);
            // Backfill from learned/pool, strongest first, if still short.
            if (chosen.length < 4) {
                const rest = Array.from(new Set([...learned, ...poolDamaging]))
                    .filter(id => !chosen.includes(id) && valid(id))
                    .sort((x, y) => _s16_skillStrength(battler, y) - _s16_skillStrength(battler, x));
                for (const id of rest) { if (chosen.length >= 4) break; chosen.splice(Math.max(0, chosen.length - 1), 0, id); }
            }
            if (chosen.length) battler._skills = chosen.slice(-4);
        } catch (e) { /* keep the stock learnset on any failure */ }
    };

    // Actor hooks: species assignment (covers giveGanjuko) + level changes.
    if (typeof Game_Actor !== "undefined" && Game_Actor.prototype) {
        if (typeof Game_Actor.prototype.setGanjukoSpecies === "function") {
            const _s16_Game_Actor_setGanjukoSpecies_pool = Game_Actor.prototype.setGanjukoSpecies;
            Game_Actor.prototype.setGanjukoSpecies = function(speciesId) {
                _s16_Game_Actor_setGanjukoSpecies_pool.call(this, speciesId);
                try { GanjukoEngine.augmentSkills(this); } catch (e) {}
            };
        }
        if (typeof Game_Actor.prototype.changeLevel === "function") {
            const _s16_Game_Actor_changeLevel = Game_Actor.prototype.changeLevel;
            Game_Actor.prototype.changeLevel = function(level, show) {
                _s16_Game_Actor_changeLevel.call(this, level, show);
                try { if (_s16_isGanjukoBattler(this)) GanjukoEngine.augmentSkills(this); } catch (e) {}
            };
        }
    }
    // Enemy hook: pool candidates are stored at setup for the AI in 16.4.
    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.setupGanjukoEnemy === "function") {
        const _s16_Game_Enemy_setupGanjukoEnemy = Game_Enemy.prototype.setupGanjukoEnemy;
        Game_Enemy.prototype.setupGanjukoEnemy = function(speciesId, level) {
            _s16_Game_Enemy_setupGanjukoEnemy.call(this, speciesId, level);
            try { GanjukoEngine.augmentSkills(this); } catch (e) {}
        };
    }

    // =========================================================================
    // 16.6 GANJUKO STADIUM (competitive gauntlet)
    // =========================================================================
    // 5 rounds of trainer battles, party scaled to Lv 50, Bag disabled, heal
    // between rounds, escalating difficulty/AI tiers and opponent BST.
    // Restore guarantees: the run snapshots every party member's level, EXP,
    // HP and MP before scaling. On defeat the snapshot is restored BEFORE
    // BattleManager.updateBattleEnd's blackout branch can run (so no
    // blackout teleport fires); on final victory it is restored in the
    // after-battle step. Either way the run flags are cleared and the party
    // leaves the stadium exactly as it entered (level/EXP/HP/MP).
    GanjukoEngine.ensureStadiumStats = function() {
        try {
            if (typeof $gameSystem === "undefined" || !$gameSystem) return null;
            if (!$gameSystem._ganjukoStadium) {
                $gameSystem._ganjukoStadium = { runs: 0, wins: 0, bestRoundsWon: 0, lastRoundsWon: 0 };
            }
            return $gameSystem._ganjukoStadium;
        } catch (e) { return null; }
    };
    if (typeof Game_System !== "undefined" && Game_System.prototype && typeof Game_System.prototype.initialize === "function") {
        const _s16_Game_System_initialize = Game_System.prototype.initialize;
        Game_System.prototype.initialize = function() {
            _s16_Game_System_initialize.call(this);
            this._ganjukoStadium = { runs: 0, wins: 0, bestRoundsWon: 0, lastRoundsWon: 0 };
        };
    }

    GanjukoEngine._stadiumRun = null;

    // Stadium stat normalization (balance audit fix 7): inside Stadium
    // battles ONLY, each Ganjuko battler's effective stats are compressed
    // toward a 3000 BST band. Hook: Game_BattlerBase.prototype.param — the
    // one param pipeline shared by Game_Actor and Game_Enemy, so player and
    // opponent battlers are scaled symmetrically. BST here is the battler's
    // unscaled effective stat sum MHP+ATK+DEF+MAT+MDF+AGI (param ids
    // 0,2,3,4,5,6; MMP/LUK excluded) at its battle level (Lv 50 in Stadium),
    // matching the audit's BST definition (Lv50 stat sums, range ~1634-3730).
    // Factors: atk/def/mat/mdf/agi x clamp(3000/BST, 0.80, 1.25);
    // MHP (param 0) x clamp(3000/BST, 0.90, 1.10). Current HP is not
    // rescaled. The hook no-ops unless $gameTemp._stadiumActive is set and
    // the battler is a Ganjuko battler, and BST is computed by calling the
    // ORIGINAL param method directly (no recursion through this wrapper).
    GanjukoEngine.stadiumScaleFor = function(bst) {
        if (!bst || !isFinite(bst)) return { stat: 1, hp: 1 };
        const raw = 3000 / bst;
        return {
            stat: Math.min(1.25, Math.max(0.80, raw)),
            hp: Math.min(1.10, Math.max(0.90, raw))
        };
    };
    if (typeof Game_BattlerBase !== "undefined" && Game_BattlerBase.prototype && typeof Game_BattlerBase.prototype.param === "function") {
        const _s16_Game_BattlerBase_param = Game_BattlerBase.prototype.param;
        Game_BattlerBase.prototype.param = function(paramId) {
            const orig = _s16_Game_BattlerBase_param.call(this, paramId);
            try {
                if (paramId !== 0 && (paramId < 2 || paramId > 6)) return orig;
                if (typeof $gameTemp === "undefined" || !$gameTemp || !$gameTemp._stadiumActive) return orig;
                if (!_s16_isGanjukoBattler(this)) return orig;
                let bst = 0;
                for (const pid of [0, 2, 3, 4, 5, 6]) bst += _s16_Game_BattlerBase_param.call(this, pid);
                const factors = GanjukoEngine.stadiumScaleFor(bst);
                return Math.round(orig * (paramId === 0 ? factors.hp : factors.stat));
            } catch (e) { return orig; }
        };
    }


    GanjukoEngine._snapshotParty = function() {
        const snap = [];
        try {
            for (const actor of $gameParty.allMembers()) {
                snap.push({
                    actorId: actor.actorId(),
                    level: actor.level,
                    exp: (typeof actor.currentExp === "function") ? actor.currentExp() : 0,
                    hp: actor.hp, mp: actor.mp
                });
            }
        } catch (e) {}
        return snap;
    };

    GanjukoEngine._restoreStadiumParty = function() {
        const run = GanjukoEngine._stadiumRun;
        if (!run || !Array.isArray(run.snapshot) || run._restored) return;
        run._restored = true;
        try {
            for (const entry of run.snapshot) {
                const actor = (typeof $gameActors !== "undefined" && $gameActors) ? $gameActors.actor(entry.actorId) : null;
                if (!actor) continue;
                if (actor.level !== entry.level && typeof actor.changeLevel === "function") {
                    actor.changeLevel(entry.level, false);
                }
                try {
                    if (typeof actor.currentExp === "function" && typeof actor.gainExp === "function") {
                        const diff = entry.exp - actor.currentExp();
                        if (diff > 0) actor.gainExp(diff);
                    }
                } catch (e) {}
                try {
                    // P2B polish: the Stadium param factor (hp clamp floor
                    // 0.90) is still live while $gameTemp._stadiumActive is
                    // set, so mhp/mmp reads inside recoverAll/setHp bake
                    // that factor into the restored values — the party came
                    // back at exactly 90% HP after a run (Pass 2A.6). Clear
                    // the flag for these restore reads only, then put it
                    // back; the run-end hooks clear it for real right after.
                    const _p2bStadiumWasActive = (typeof $gameTemp !== "undefined" && $gameTemp) ? !!$gameTemp._stadiumActive : false;
                    if (_p2bStadiumWasActive) $gameTemp._stadiumActive = false;
                    if (typeof actor.recoverAll === "function") actor.recoverAll();
                    if (typeof actor.setHp === "function") actor.setHp(Math.min(entry.hp, actor.mhp));
                    if (typeof actor.setMp === "function") actor.setMp(Math.min(entry.mp, actor.mmp));
                    if (_p2bStadiumWasActive) $gameTemp._stadiumActive = true;
                } catch (e) {}
            }
        } catch (e) {}
    };

    GanjukoEngine._endStadiumRun = function() {
        const run = GanjukoEngine._stadiumRun;
        if (run) run.active = false;
        try {
            if (typeof $gameTemp !== "undefined" && $gameTemp) {
                $gameTemp._stadiumActive = false;
                $gameTemp._ganjukoDifficulty = null;
                $gameTemp._isTrainerBattle = false;
            }
        } catch (e) {}
    };

    GanjukoEngine.stadiumSpeciesBST = function(sp) {
        const bs = (sp && (sp.baseStats || sp.base)) || {};
        let total = 0;
        for (const key of Object.keys(bs)) { if (key !== "mp") total += Number(bs[key]) || 0; }
        return total;
    };

    GanjukoEngine.generateStadiumTeam = function(round) {
        // Fix Round 1: entries carry the POSITIONAL species id (the
        // engine-wide convention consumed by startTrainerBattle). Returning
        // the record `id` field here fielded the wrong species for the 15
        // shuffled starter-line records.
        let entries = [];
        try {
            if (typeof window !== "undefined" && window.$dataGanjukoSpecies && window.$dataGanjukoSpecies.length) {
                entries = window.$dataGanjukoSpecies.map((sp, i) => sp ? { sp: sp, pos: i + 1 } : null).filter(Boolean);
            } else {
                // Fallback table is keyed by record id and getSpecies treats
                // the key as the species id there, so pos == record id.
                entries = Object.values(GANJUKO_SPECIES).map(sp => ({ sp: sp, pos: sp.id }));
            }
        } catch (e) { entries = Object.values(GANJUKO_SPECIES).map(sp => ({ sp: sp, pos: sp.id })); }
        const thresholds = [230, 260, 290, 320, 345];
        let threshold = thresholds[Math.min(4, Math.max(0, (round || 1) - 1))];
        const bstOf = GanjukoEngine.stadiumSpeciesBST;
        let candidates = entries.filter(e => bstOf(e.sp) >= threshold);
        while (candidates.length < 3 && threshold > 100) {
            threshold -= 20;
            candidates = entries.filter(e => bstOf(e.sp) >= threshold);
        }
        if (candidates.length < 3) candidates = entries.slice().sort((x, y) => bstOf(y.sp) - bstOf(x.sp)).slice(0, Math.max(3, entries.length));
        // Shuffle, then pick greedily for type diversity.
        const shuffled = candidates.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
        }
        const team = [], usedTypes = new Set();
        for (const e of shuffled) {
            if (team.length >= 3) break;
            const t = e.sp.type1 || e.sp.type || 1;
            if (!usedTypes.has(t)) { usedTypes.add(t); team.push(e); }
        }
        for (const e of shuffled) {
            if (team.length >= 3) break;
            if (!team.includes(e)) team.push(e);
        }
        return team.map(e => ({ speciesId: e.pos, level: 50 }));
    };

    GanjukoEngine.startStadium = function() {
        try {
            if (typeof $gameParty === "undefined" || !$gameParty || $gameParty.allMembers().length === 0) {
                if (typeof $gameMessage !== "undefined" && $gameMessage) {
                    $gameMessage.add("You need at least one Ganjuko in your party to enter the Ganjuko Stadium!");
                }
                return false;
            }
            if (GanjukoEngine._stadiumRun && GanjukoEngine._stadiumRun.active) return false;
            const stats = GanjukoEngine.ensureStadiumStats();
            if (stats) stats.runs += 1;
            GanjukoEngine._stadiumRun = {
                active: true, round: 0, roundsWon: 0,
                snapshot: GanjukoEngine._snapshotParty(),
                _resolving: false, _restored: false
            };
            // Scale the whole party to Lv 50 for the run.
            for (const actor of $gameParty.allMembers()) {
                if (typeof actor.changeLevel === "function" && actor.level !== 50) actor.changeLevel(50, false);
                if (typeof actor.recoverAll === "function") actor.recoverAll();
            }
            if (typeof $gameMessage !== "undefined" && $gameMessage) {
                $gameMessage.add("\\C[14]Welcome to the GANJUKO STADIUM!\\C[0] 5 rounds, all Ganjuko scaled to Lv 50. The Bag is sealed!");
            }
            GanjukoEngine.startStadiumRound(1);
            return true;
        } catch (e) { return false; }
    };

    GanjukoEngine.startStadiumRound = function(round) {
        const run = GanjukoEngine._stadiumRun;
        if (!run || !run.active) return;
        run.round = round;
        run._resolving = false;
        const difficulties = ["trainer", "trainer", "gym", "gym", "stadium"];
        try {
            $gameTemp._ganjukoDifficulty = difficulties[Math.min(4, Math.max(0, round - 1))];
            $gameTemp._stadiumActive = true;
        } catch (e) {}
        const team = GanjukoEngine.generateStadiumTeam(round);
        GanjukoEngine.startTrainerBattle("Stadium Ace R" + round, team, 0, "Battle2", 0);
    };

    GanjukoEngine._stadiumAfterBattle = function(run, won) {
        if (!run || !run.active) return;
        const stats = GanjukoEngine.ensureStadiumStats();
        if (won) {
            run.roundsWon += 1;
            if (stats) {
                stats.lastRoundsWon = run.roundsWon;
                if (run.roundsWon > stats.bestRoundsWon) stats.bestRoundsWon = run.roundsWon;
            }
            if (run.round < 5) {
                try { GanjukoEngine.healAllParty(); } catch (e) {}
                GanjukoEngine.startStadiumRound(run.round + 1);
                return;
            }
            // Final victory: prize gold scales with rounds won (5 -> 4000).
            const prize = 1500 + run.roundsWon * 500;
            if (stats) stats.wins += 1;
            try { $gameParty.gainGold(prize); } catch (e) {}
            GanjukoEngine._restoreStadiumParty();
            GanjukoEngine._endStadiumRun();
            try {
                $gameMessage.add("\\C[11]STADIUM CHAMPION!\\C[0] You cleared all 5 rounds and won \\C[14]" + prize + "G\\C[0]!");
                $gameMessage.add("Your party has been restored to its pre-Stadium state.");
            } catch (e) {}
        } else {
            if (stats) stats.lastRoundsWon = run.roundsWon;
            // Party levels/HP/MP were already restored pre-updateBattleEnd.
            GanjukoEngine._endStadiumRun();
            try {
                $gameMessage.add("\\C[18]Your Stadium run ended in Round " + run.round + ".\\C[0]");
                $gameMessage.add("Your party has been restored to its pre-Stadium state. Train and try again!");
            } catch (e) {}
        }
    };

    // Chain rounds off the end of each battle. The engine's own
    // BattleManager.updateBattleEnd does not invoke BattleManager's event
    // callback, so setEventCallback chaining is unavailable; this wrapper is
    // the reliable seam. Defeat is detected and the snapshot restored BEFORE
    // the original runs, which keeps the blackout/teleport branch from
    // firing for stadium losses.
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.updateBattleEnd === "function") {
        const _s16_BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
        BattleManager.updateBattleEnd = function() {
            const run = GanjukoEngine._stadiumRun;
            let won = null;
            try {
                if (run && run.active && typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._stadiumActive && !run._resolving) {
                    run._resolving = true;
                    won = !(typeof $gameParty !== "undefined" && $gameParty && $gameParty.isAllDead());
                    if (!won) GanjukoEngine._restoreStadiumParty();
                }
            } catch (e) { won = null; }
            _s16_BattleManager_updateBattleEnd.call(this);
            if (won !== null) {
                const finishedRun = run, finishedWon = won;
                setTimeout(() => { try { GanjukoEngine._stadiumAfterBattle(finishedRun, finishedWon); } catch (e) {} }, 400);
            }
        };
    }

    // Bag lock (command level): disable the BAG command while a stadium
    // battle is active, buzzer the handler as a second line of defence, and
    // no-op item actions by player actors as a third.
    if (typeof Window_ActorCommand !== "undefined" && Window_ActorCommand.prototype && typeof Window_ActorCommand.prototype.makeCommandList === "function") {
        const _s16_Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
        Window_ActorCommand.prototype.makeCommandList = function() {
            _s16_Window_ActorCommand_makeCommandList.call(this);
            try {
                if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._stadiumActive && Array.isArray(this._list)) {
                    for (const cmd of this._list) { if (cmd && cmd.symbol === "item") cmd.enabled = false; }
                }
            } catch (e) {}
        };
    }
    if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype && typeof Scene_Battle.prototype.commandItem === "function") {
        const _s16_Scene_Battle_commandItem = Scene_Battle.prototype.commandItem;
        Scene_Battle.prototype.commandItem = function() {
            try {
                if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._stadiumActive) {
                    if (typeof SoundManager !== "undefined" && SoundManager.playBuzzer) SoundManager.playBuzzer();
                    if (this._actorCommandWindow) this._actorCommandWindow.activate();
                    return;
                }
            } catch (e) {}
            return _s16_Scene_Battle_commandItem.call(this);
        };
    }
    if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.apply === "function") {
        const _s16_Game_Action_apply_stadium = Game_Action.prototype.apply;
        Game_Action.prototype.apply = function(target) {
            try {
                if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._stadiumActive) {
                    const item = this.item();
                    const subject = typeof this.subject === "function" ? this.subject() : null;
                    if (item && typeof DataManager !== "undefined" && DataManager.isItem && DataManager.isItem(item) &&
                        subject && typeof subject.isActor === "function" && subject.isActor()) {
                        if (target && typeof target.result === "function") { const r = target.result(); r.clear(); r.used = true; }
                        return; // Bag is sealed in the Stadium.
                    }
                }
            } catch (e) {}
            return _s16_Game_Action_apply_stadium.call(this, target);
        };
    }

    // Main-menu STADIUM command (same pattern as the GanjukoDex/Box entries).
    if (typeof Window_MenuCommand !== "undefined" && Window_MenuCommand.prototype && typeof Window_MenuCommand.prototype.addOriginalCommands === "function") {
        const _s16_Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
        Window_MenuCommand.prototype.addOriginalCommands = function() {
            _s16_Window_MenuCommand_addOriginalCommands.call(this);
            try {
                this.addCommand("STADIUM", "ganjukoStadium",
                    typeof $gameParty !== "undefined" && $gameParty && $gameParty.allMembers().length > 0);
            } catch (e) {}
        };
    }
    if (typeof Scene_Menu !== "undefined" && Scene_Menu.prototype && typeof Scene_Menu.prototype.createCommandWindow === "function") {
        const _s16_Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
        Scene_Menu.prototype.createCommandWindow = function() {
            _s16_Scene_Menu_createCommandWindow.call(this);
            try {
                this._commandWindow.setHandler("ganjukoStadium", () => {
                    // Battle entry expects the map scene underneath.
                    if (typeof SceneManager !== "undefined" && SceneManager.goto) SceneManager.goto(Scene_Map);
                    setTimeout(() => { try { GanjukoEngine.startStadium(); } catch (e) {} }, 100);
                });
            } catch (e) {}
        };
    }
    // Plugin command: $gameTemp-independent entry for event authors.
    if (typeof PluginManager !== "undefined" && PluginManager && typeof PluginManager.registerCommand === "function") {
        try {
            PluginManager.registerCommand("GanjukoEngine", "StartStadium", () => { GanjukoEngine.startStadium(); });
        } catch (e) {}
    }

    // =========================================================================
    // 16.7 CAPTURE FIX: CATCH FLOOR 0.12 -> 0.015
    // =========================================================================
    // Full copy of section 5's applyGanjukoOrb with only the floor changed:
    // the 0.12 floor made even catchRate-3 legends a 12% full-HP catch with a
    // basic orb. Floor is now Math.max(0.015, rawScore); the 0.95 cap and the
    // Master Orb (orbMultiplier >= 100) guaranteed catch are preserved, as
    // are the trainer block/refund and the wobble behaviour.
    if (typeof Game_Action !== "undefined" && Game_Action.prototype) {
        Game_Action.prototype.applyGanjukoOrb = function(target, item, orbMultiplier) {
            const result = target.result();
            this.subject().clearResult();
            result.clear();
            result.used = true;
            result.ganjukoOrbAttempt = true;
            result.orbName = item.name;

            // Cannot capture a Trainer's Ganjuko!
            if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._isTrainerBattle) {
                result.orbBlockedByTrainer = true;
                // Refund the orb
                $gameParty.gainItem(item, 1);
                return;
            }

            const sp = target.ganjukoSpecies();
            const maxHp = Math.max(1, target.mhp);
            const curHp = Math.max(1, target.hp);
            const hpFactor = (3 * maxHp - 2 * curHp) / (3 * maxHp); // 0.33 at full HP -> 1.0 at 1 HP
            const statusBonus = target.states().length > 0 ? 1.5 : 1.0;

            // Catch probability formula (0.0 to 1.0) — floor fixed in 16.7.
            const catchRate = (sp && typeof sp.catchRate === "number") ? sp.catchRate : 45;
            const rawScore = (catchRate / 180) * hpFactor * orbMultiplier * statusBonus;
            const catchProb = orbMultiplier >= 100 ? 1.0 : Math.min(0.95, Math.max(0.015, rawScore));

            if (Math.random() < catchProb) {
                result.ganjukoCaught = true;
                result.wobbles = 3;
                $gameTemp._ganjukoCaptured = true;
                // Fix Round 1: POSITIONAL species id, not record `id`
                // (see section 5's copy of this function).
                $gameTemp._capturedSpeciesId = target.ganjukoSpeciesId();
                $gameTemp._capturedLevel = target.ganjukoLevel();
            } else {
                result.ganjukoCaught = false;
                result.wobbles = 1 + Math.randomInt(2);
            }
        };
    }


    // =========================================================================
    // 17. VISUAL DEPTH PACK (2026-11-01): CHARACTER GROUND SHADOWS, BATTLE
    //     BATTLER SHADOWS, DRIFTING CLOUD SHADOWS, DEPTH VIGNETTE + SKY
    //     LIGHT, MAP-EDGE FOG BAND
    // =========================================================================
    // Pure runtime cosmetics: no map data, no tileset data, no gameplay
    // state is touched. The tilesets are stock RTP, so the 2.5D read comes
    // from light and shadow overlays drawn by the sprite layer instead.
    //
    // Safety contract (same discipline as Section 16, stricter): every
    // install is feature-tested and try/catch guarded, every per-frame
    // updater is try/catch guarded, and the FIRST runtime error anywhere
    // in this pack disables the whole pack (all overlays hidden/removed)
    // instead of risking a broken frame loop. Nothing in here can throw
    // into gameplay code: wrappers always call the stored original first
    // and run visual work afterwards, inside the guard.

    // --- Config (Rene-tweakable; also live at GanjukoEngine.visualConfig) --
    const GANJUKO_VISUAL_CONFIG = {
        characterShadows: true,  // soft blob shadow under map characters
        battlerShadows: true,    // soft blob shadow under battle battlers
        cloudShadows: true,      // huge soft shadows drifting over outdoor maps
        vignette: true,          // corner vignette + top sky-light, map + battle
        fogBand: true,           // pale fog gradient at the top of outdoor maps
        shadowStrength: 1.0,     // global multiplier for shadow opacity
        cloudOpacity: 0.13,      // 0..1 peak opacity of a cloud shadow
        cloudCount: 4,           // 1..6 drifting cloud shadows
        cloudSpeed: 0.22,        // px per frame base drift (rightward)
        vignetteStrength: 1.0,   // multiplier for vignette/gradient opacity
        fogOpacity: 0.10         // 0..1 peak opacity of the fog band
    };

    // --- Pack state ----------------------------------------------------------
    const _s17 = {
        active: {
            characterShadows: false,
            battlerShadows: false,
            cloudShadows: false,
            vignette: false,
            fogBand: false
        },
        disabled: false,       // set on first runtime error: pack goes dark
        errors: 0,
        lastError: "",
        live: [],              // every overlay sprite created (for teardown)
        profile: null,         // cached sun profile for the current frame
        profileFrame: -999,
        blobBitmap: null,      // shared soft ellipse (characters + battlers)
        cloudBitmap: null,     // shared multi-blob cloud shadow
        vignetteBitmap: null,  // cached per Graphics box size
        vignetteKey: "",
        fogBitmap: null        // cached per Graphics box width
    };

    const _s17_clamp = function(v, lo, hi) {
        return v < lo ? lo : (v > hi ? hi : v);
    };

    // First failure anywhere: hide + detach every overlay and stop updating.
    // Deliberately boring: a cosmetic pack must fail invisible, never loud.
    const _s17_fail = function(err) {
        _s17.errors++;
        try { _s17.lastError = String(err && err.message ? err.message : err); } catch (e) {}
        if (_s17.disabled) return;
        _s17.disabled = true;
        for (const s of _s17.live) {
            try {
                s.visible = false;
                if (s.parent) s.parent.removeChild(s);
            } catch (e) { /* best effort only */ }
        }
        _s17.live.length = 0;
    };

    const _s17_track = function(sprite) {
        _s17.live.push(sprite);
        return sprite;
    };

    // Commit raw canvas drawing on an MZ Bitmap (same call core code uses).
    const _s17_commitBitmap = function(bmp) {
        try { bmp._baseTexture.update(); }
        catch (e) { try { bmp.baseTexture.update(); } catch (e2) { /* noop */ } }
    };

    // --- Shared soft ellipse (drawn once, reused by every shadow) -----------
    const _s17_getBlobBitmap = function() {
        if (_s17.blobBitmap) return _s17.blobBitmap;
        const bmp = new Bitmap(128, 64);
        const ctx = bmp.context;
        ctx.save();
        ctx.translate(64, 32);
        ctx.scale(1, 0.5);
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 62);
        grad.addColorStop(0.0, "rgba(12,10,24,0.62)");
        grad.addColorStop(0.55, "rgba(12,10,24,0.34)");
        grad.addColorStop(1.0, "rgba(12,10,24,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 62, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        _s17_commitBitmap(bmp);
        _s17.blobBitmap = bmp;
        return bmp;
    };

    // --- Cloud shadow bitmap: several overlapping soft blobs ----------------
    const _s17_getCloudBitmap = function() {
        if (_s17.cloudBitmap) return _s17.cloudBitmap;
        const bmp = new Bitmap(512, 256);
        const ctx = bmp.context;
        // Fixed layout (deterministic; no RNG at runtime): cx, cy, radius.
        const blobs = [
            [120, 118, 150], [252, 92, 185], [384, 138, 165], [182, 172, 145],
            [322, 182, 155], [66, 182, 112], [448, 76, 122], [262, 150, 120]
        ];
        for (const b of blobs) {
            const grad = ctx.createRadialGradient(b[0], b[1], 4, b[0], b[1], b[2]);
            grad.addColorStop(0.0, "rgba(10,12,26,0.50)");
            grad.addColorStop(0.6, "rgba(10,12,26,0.26)");
            grad.addColorStop(1.0, "rgba(10,12,26,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2);
            ctx.fill();
        }
        _s17_commitBitmap(bmp);
        _s17.cloudBitmap = bmp;
        return bmp;
    };

    // --- Vignette + sky-light bitmap (rebuilt only when the box resizes) ----
    const _s17_getVignetteBitmap = function(w, h) {
        const key = w + "x" + h;
        if (_s17.vignetteBitmap && _s17.vignetteKey === key) return _s17.vignetteBitmap;
        const strength = _s17_clamp(Number(GANJUKO_VISUAL_CONFIG.vignetteStrength) || 0, 0, 2);
        const bmp = new Bitmap(Math.max(2, w), Math.max(2, h));
        const ctx = bmp.context;
        // Sky light: faint warm light falling from the top of the frame.
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.42);
        sky.addColorStop(0.0, "rgba(255,244,214," + (0.075 * strength).toFixed(3) + ")");
        sky.addColorStop(1.0, "rgba(255,244,214,0)");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.42);
        // Ground shade: faint cool darkening rising from the bottom edge.
        const gnd = ctx.createLinearGradient(0, h * 0.72, 0, h);
        gnd.addColorStop(0.0, "rgba(6,8,18,0)");
        gnd.addColorStop(1.0, "rgba(6,8,18," + (0.13 * strength).toFixed(3) + ")");
        ctx.fillStyle = gnd;
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
        // Vignette: radial falloff, transparent through the middle of the
        // frame, gentle darkening only toward the corners/edges.
        const cx = w / 2, cy = h / 2;
        const radius = Math.sqrt(cx * cx + cy * cy);
        const vig = ctx.createRadialGradient(cx, cy, radius * 0.46, cx, cy, radius);
        vig.addColorStop(0.0, "rgba(5,6,15,0)");
        vig.addColorStop(0.72, "rgba(5,6,15,0)");
        vig.addColorStop(1.0, "rgba(5,6,15," + (0.30 * strength).toFixed(3) + ")");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);
        _s17_commitBitmap(bmp);
        _s17.vignetteBitmap = bmp;
        _s17.vignetteKey = key;
        return bmp;
    };

    // --- Fog band bitmap (pale gradient, rebuilt when the box width changes) -
    const _s17_getFogBitmap = function(w) {
        if (_s17.fogBitmap && _s17.fogBitmap.width === w) return _s17.fogBitmap;
        const bmp = new Bitmap(Math.max(2, w), 120);
        const ctx = bmp.context;
        const grad = ctx.createLinearGradient(0, 0, 0, 120);
        grad.addColorStop(0.0, "rgba(228,238,246,0.55)");
        grad.addColorStop(0.55, "rgba(228,238,246,0.18)");
        grad.addColorStop(1.0, "rgba(228,238,246,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, bmp.width, 120);
        _s17_commitBitmap(bmp);
        _s17.fogBitmap = bmp;
        return bmp;
    };

    // --- Map classification ---------------------------------------------------
    // Indoor signal #1 (for shadows/tint consistency): the engine's own
    // day/night code (Scene_Map.updateDayNightTint) treats the "Inside"
    // tileset as indoors and everything else as outdoors. Character shadows
    // reuse exactly that signal so the two systems never disagree.
    // Fix Round 2 (QA-D06): the indoor tileset id is 3 ("Inside"), not 1 —
    // tileset 1 ("Overworld") is used by zero maps, so every indoor rule in
    // the game was dead. All indoor checks now test tilesetId === 3.
    const _s17_isIndoorMap = function() {
        try {
            return typeof $gameMap !== "undefined" && $gameMap &&
                   typeof $gameMap.tilesetId === "function" && $gameMap.tilesetId() === 3;
        } catch (e) { return false; }
    };
    // Outdoor signal #2 (for clouds/fog, which must NOT appear in dungeons):
    // the tileset NAME must read as an outdoor set ("Outside" in this
    // project; Overworld/Field accepted for safety). If the name is
    // unavailable, fall back to signal #1 (not indoor = outdoor).
    const _s17_isOutdoorMap = function() {
        try {
            if (typeof $gameMap === "undefined" || !$gameMap) return false;
            const id = $gameMap.tilesetId();
            const ts = (typeof $dataTilesets !== "undefined" && $dataTilesets) ? $dataTilesets[id] : null;
            const name = ts && typeof ts.name === "string" ? ts.name : "";
            if (name) return /outside|overworld|field/i.test(name);
            return id !== 3; // Fix Round 2 (QA-D06): 3 is the "Inside" tileset
        } catch (e) { return false; }
    };

    // --- Sun profile from the engine's day/night clock -----------------------
    // getTimeOfDay() (defined by the day/night section) buckets the local
    // clock into MORNING / DAY / DUSK / NIGHT. Shadows key off the bucket:
    // midday = short, dark, straight down; morning/evening = long, light,
    // thrown sideways; night = faint. Indoors: a short neutral shadow so
    // characters still read as grounded under lamplight.
    const _s17_sunProfile = function() {
        const frame = (typeof Graphics !== "undefined" && Graphics) ? Graphics.frameCount : 0;
        if (_s17.profile && frame - _s17.profileFrame < 30) return _s17.profile;
        let phase = "DAY";
        try {
            if (typeof GanjukoEngine !== "undefined" && GanjukoEngine &&
                typeof GanjukoEngine.getTimeOfDay === "function") {
                const tod = GanjukoEngine.getTimeOfDay();
                if (tod && typeof tod.name === "string") phase = tod.name;
            }
        } catch (e) { phase = "DAY"; }
        let p;
        switch (phase) {
            case "MORNING": p = { offX: -15, offY: 2, opacity: 0.27, stretch: 1.38 }; break;
            case "DUSK":    p = { offX: 15,  offY: 2, opacity: 0.25, stretch: 1.38 }; break;
            case "NIGHT":   p = { offX: 2,   offY: 2, opacity: 0.15, stretch: 1.0 };  break;
            default:        p = { offX: 3,   offY: 3, opacity: 0.38, stretch: 1.0 };  phase = "DAY"; break;
        }
        if (_s17_isIndoorMap()) {
            p = { offX: 2, offY: 2, opacity: 0.30, stretch: 1.0 };
            phase = "INDOOR";
        }
        const strength = _s17_clamp(Number(GANJUKO_VISUAL_CONFIG.shadowStrength) || 0, 0, 2);
        p.opacity = _s17_clamp(p.opacity * strength, 0, 0.85);
        p.phase = phase;
        _s17.profile = p;
        _s17.profileFrame = frame;
        return p;
    };

    // =========================================================================
    // 17.1 CHARACTER GROUND SHADOWS (overworld)
    // =========================================================================
    // One shadow Sprite per character sprite, added to the same Tilemap as
    // the characters themselves. Tilemap sorts children by (z, y, spriteId)
    // and character z = priorityType * 2 + 1 (1 below / 3 normal / 5 above),
    // so a shadow pinned at (character z - 1) lands directly under its
    // character: above the z=0 ground layer, and -- for normal characters --
    // below the z=4 upper ("star") tile layer, so shadows correctly slide
    // under overhanging roofs and tree canopies.
    const _s17_charShadowEligible = function(character) {
        try {
            if (!character) return false;
            if (typeof character.isVehicle === "function" && character.isVehicle()) return false;
            const tileId = typeof character.tileId === "function" ? character.tileId() : (character._tileId || 0);
            if (tileId > 0) return false; // graphic is a tile, not a character
            const name = typeof character.characterName === "function" ? character.characterName() : character._characterName;
            return !!name;
        } catch (e) { return false; }
    };

    const _s17_attachCharacterShadows = function(spriteset) {
        if (!spriteset._tilemap || !spriteset._characterSprites) return;
        for (const sprite of spriteset._characterSprites) {
            try {
                if (!sprite || sprite._ganjukoShadow || !sprite._character) continue;
                if (!_s17_charShadowEligible(sprite._character)) continue;
                const shadow = _s17_track(new Sprite(_s17_getBlobBitmap()));
                shadow.anchor.set(0.5, 0.5);
                shadow.visible = false; // first update positions it
                spriteset._tilemap.addChild(shadow);
                sprite._ganjukoShadow = shadow;
            } catch (e) { _s17_fail(e); return; }
        }
    };

    const _s17_updateCharacterShadows = function(spriteset) {
        if (!spriteset._characterSprites) return;
        const profile = _s17_sunProfile();
        for (const sprite of spriteset._characterSprites) {
            const shadow = sprite ? sprite._ganjukoShadow : null;
            if (!shadow) continue;
            const ch = sprite._character;
            if (!ch || !_s17_charShadowEligible(ch)) { shadow.visible = false; continue; }
            // Hide with the character: erased/transparent, "above player"
            // priority (a shadow under a floating sign looks wrong), or a
            // character sprite whose bitmap never loaded (no graphic).
            let hide = false;
            try {
                if (typeof ch.isTransparent === "function" && ch.isTransparent()) hide = true;
                if (typeof ch.priorityType === "function" && ch.priorityType() === 2) hide = true;
                if (!sprite.bitmap || !sprite.bitmap.isReady || !sprite.bitmap.isReady()) hide = true;
            } catch (e) { hide = true; }
            if (hide) { shadow.visible = false; continue; }
            shadow.visible = true;
            // sprite.x / sprite.y are the character's screen position with
            // the anchor at its feet; screenY() already subtracts the jump
            // height, so add it back to keep the shadow on the ground and
            // shrink/fade it as the character rises.
            const jump = (typeof ch.jumpHeight === "function") ? ch.jumpHeight() : 0;
            const air = _s17_clamp(1 - jump / 110, 0.5, 1);
            const frameW = (typeof sprite.patternWidth === "function" && sprite.patternWidth() > 0)
                ? sprite.patternWidth() : 48;
            const w = frameW * 1.08 * profile.stretch * air;
            shadow.x = sprite.x + profile.offX * air;
            shadow.y = sprite.y + jump + 3;
            shadow.scale.x = w / 128;
            shadow.scale.y = (w * 0.44) / 64 * air;
            shadow.opacity = Math.round(255 * profile.opacity *
                (typeof sprite.opacity === "number" ? sprite.opacity / 255 : 1) * air);
            shadow.z = (typeof sprite.z === "number" ? sprite.z : 3) - 1;
        }
    };

    // =========================================================================
    // 17.2 BATTLE BATTLER SHADOWS
    // =========================================================================
    // One shadow per battler sprite, inserted into the battler's own parent
    // (the battle field) as its previous sibling, so it always renders
    // directly behind the battler and above the battleback. The shadow
    // follows the battler's x every frame -- which carries the Section 7
    // attack lunges for free -- but its y is pinned to the battler's home
    // ground point (_homeY for stock battler sprites, _baseY for the
    // custom player sprite), so idle hover/breathing does not lift it.
    const _s17_ensureBattlerShadow = function(battlerSprite) {
        if (battlerSprite._ganjukoShadow) return battlerSprite._ganjukoShadow;
        if (!battlerSprite.parent) return null;
        const shadow = _s17_track(new Sprite(_s17_getBlobBitmap()));
        shadow.anchor.set(0.5, 0.5);
        shadow.visible = false;
        const parent = battlerSprite.parent;
        parent.addChildAt(shadow, parent.getChildIndex(battlerSprite));
        battlerSprite._ganjukoShadow = shadow;
        return shadow;
    };

    const _s17_syncBattlerShadow = function(battlerSprite) {
        const shadow = _s17_ensureBattlerShadow(battlerSprite);
        if (!shadow) return;
        const battler = battlerSprite._battler || null;
        let dead = false;
        try { if (battler && typeof battler.isDead === "function") dead = battler.isDead(); } catch (e) {}
        if (!battlerSprite.visible || dead || battlerSprite.opacity <= 0) {
            shadow.visible = false;
            return;
        }
        if (shadow._groundY == null) {
            if (typeof battlerSprite._homeY === "number") shadow._groundY = battlerSprite._homeY;
            else if (typeof battlerSprite._baseY === "number") shadow._groundY = battlerSprite._baseY;
            else shadow._groundY = battlerSprite.y;
        }
        shadow.visible = true;
        shadow.x = battlerSprite.x;
        shadow.y = shadow._groundY + 5;
        let w = 128;
        try {
            if (battlerSprite.bitmap && battlerSprite.bitmap.isReady &&
                battlerSprite.bitmap.isReady() && battlerSprite.bitmap.width > 0) {
                w = battlerSprite.bitmap.width * Math.abs(battlerSprite.scale.x || 1);
            } else if (battlerSprite.width > 0) {
                w = battlerSprite.width;
            }
        } catch (e) { w = 128; }
        w = _s17_clamp(w * 0.84, 56, 250);
        shadow.scale.x = w / 128;
        shadow.scale.y = (w * 0.40) / 64;
        const strength = _s17_clamp(Number(GANJUKO_VISUAL_CONFIG.shadowStrength) || 0, 0, 2);
        shadow.opacity = Math.round(255 * 0.30 * strength * (battlerSprite.opacity / 255));
    };

    const _s17_updateBattlerShadows = function(spriteset) {
        if (spriteset._enemySprites) {
            for (const s of spriteset._enemySprites) if (s) _s17_syncBattlerShadow(s);
        }
        if (spriteset._actorSprites) {
            for (const s of spriteset._actorSprites) if (s) _s17_syncBattlerShadow(s);
        }
        if (spriteset._playerGanjukoSprite) _s17_syncBattlerShadow(spriteset._playerGanjukoSprite);
    };

    // =========================================================================
    // 17.3 DRIFTING CLOUD SHADOWS + MAP-EDGE FOG (outdoor maps only)
    // =========================================================================
    // Screen-space sprites on the Spriteset_Map itself, inserted directly
    // below the Weather layer: above the whole tilemap (cloud shade falls
    // on characters too, which is what sells it), below weather, pictures
    // and every window. Movement is a slow rightward drift with wrap.
    const _s17_attachAtmosphere = function(spriteset) {
        const boxW = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxWidth : 816;
        const boxH = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxHeight : 624;
        const insertBelowWeather = function(sprite) {
            const idx = spriteset._weather ? spriteset.children.indexOf(spriteset._weather) : -1;
            if (idx >= 0) spriteset.addChildAt(sprite, idx);
            else spriteset.addChild(sprite);
        };
        if (GANJUKO_VISUAL_CONFIG.cloudShadows) {
            const count = Math.round(_s17_clamp(Number(GANJUKO_VISUAL_CONFIG.cloudCount) || 4, 1, 6));
            spriteset._ganjukoClouds = [];
            for (let i = 0; i < count; i++) {
                const cloud = _s17_track(new Sprite(_s17_getCloudBitmap()));
                cloud.anchor.set(0.5, 0.5);
                cloud.scale.set(2.3, 2.3);
                cloud.x = boxW * (0.08 + 0.26 * i) + (i % 2) * 90;
                cloud.y = boxH * (0.16 + 0.19 * ((i * 2) % 4));
                cloud.opacity = Math.round(255 * _s17_clamp(Number(GANJUKO_VISUAL_CONFIG.cloudOpacity) || 0, 0, 0.4));
                cloud.visible = false;
                cloud._ganjukoSpeed = GANJUKO_VISUAL_CONFIG.cloudSpeed * (0.75 + 0.18 * i);
                cloud._ganjukoPhase = i * 1.7;
                insertBelowWeather(cloud);
                spriteset._ganjukoClouds.push(cloud);
            }
            _s17.active.cloudShadows = true;
        }
        if (GANJUKO_VISUAL_CONFIG.fogBand) {
            const fog = _s17_track(new Sprite(_s17_getFogBitmap(boxW)));
            fog.anchor.set(0, 0);
            fog.x = 0;
            fog.y = 0;
            fog.opacity = Math.round(255 * _s17_clamp(Number(GANJUKO_VISUAL_CONFIG.fogOpacity) || 0, 0, 0.5) * 2);
            fog.visible = false;
            insertBelowWeather(fog);
            spriteset._ganjukoFog = fog;
            _s17.active.fogBand = true;
        }
    };

    const _s17_updateAtmosphere = function(spriteset) {
        const outdoor = _s17_isOutdoorMap();
        const boxW = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxWidth : 816;
        const boxH = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxHeight : 624;
        const frame = (typeof Graphics !== "undefined" && Graphics) ? Graphics.frameCount : 0;
        if (spriteset._ganjukoClouds) {
            for (const cloud of spriteset._ganjukoClouds) {
                if (!outdoor || _s17.disabled) { cloud.visible = false; continue; }
                cloud.visible = true;
                cloud.x += cloud._ganjukoSpeed;
                cloud.y += Math.sin(frame * 0.004 + cloud._ganjukoPhase) * 0.05;
                const halfW = 512 * 2.3 / 2;
                if (cloud.x - halfW > boxW) {
                    cloud.x = -halfW + 4;
                    cloud.y = boxH * (0.12 + 0.22 * ((Math.floor(frame / 997) + cloud._ganjukoPhase) % 3));
                }
            }
        }
        if (spriteset._ganjukoFog) {
            const fog = spriteset._ganjukoFog;
            fog.visible = outdoor && !_s17.disabled;
            if (fog.visible && fog.bitmap && fog.bitmap.width !== boxW) {
                fog.bitmap = _s17_getFogBitmap(boxW); // box resized: rebuild
            }
        }
    };

    // =========================================================================
    // 17.4 DEPTH VIGNETTE + SKY LIGHT (map and battle)
    // =========================================================================
    // One sprite on the Spriteset_Base (shared by Spriteset_Map and
    // Spriteset_Battle), inserted directly BELOW the picture container:
    // above the world and weather, below pictures, the timer, fade/flash
    // sprites, and -- because scene windows live above the spriteset --
    // below every menu and message window. It never touches input.
    const _s17_attachVignette = function(spriteset) {
        const boxW = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxWidth : 816;
        const boxH = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxHeight : 624;
        const sprite = _s17_track(new Sprite(_s17_getVignetteBitmap(boxW, boxH)));
        sprite.anchor.set(0, 0);
        sprite.x = 0;
        sprite.y = 0;
        const pc = spriteset._pictureContainer;
        if (pc && pc.parent === spriteset) spriteset.addChildAt(sprite, spriteset.getChildIndex(pc));
        else spriteset.addChild(sprite);
        spriteset._ganjukoVignette = sprite;
        _s17.active.vignette = true;
    };

    const _s17_updateVignette = function(spriteset) {
        const sprite = spriteset._ganjukoVignette;
        if (!sprite) return;
        const boxW = Graphics.boxWidth, boxH = Graphics.boxHeight;
        if (!sprite.bitmap || sprite.bitmap.width !== boxW || sprite.bitmap.height !== boxH) {
            sprite.bitmap = _s17_getVignetteBitmap(boxW, boxH);
        }
    };

    // =========================================================================
    // 17.5 INSTALL (all guarded; a missing class disables only its feature)
    // =========================================================================
    try {
        if (typeof GanjukoEngine !== "undefined" && GanjukoEngine) {
            GanjukoEngine.visualConfig = GANJUKO_VISUAL_CONFIG;
            GanjukoEngine.visualStatus = function() { return _s17_status(); };
        }
    } catch (e) { /* export is nice-to-have; the pack still runs */ }

    const _s17_status = function() {
        let phase = "DAY";
        try { phase = _s17_sunProfile().phase || "DAY"; } catch (e) {}
        return {
            characterShadows: !!(_s17.active.characterShadows && GANJUKO_VISUAL_CONFIG.characterShadows && !_s17.disabled),
            battlerShadows: !!(_s17.active.battlerShadows && GANJUKO_VISUAL_CONFIG.battlerShadows && !_s17.disabled),
            cloudShadows: !!(_s17.active.cloudShadows && GANJUKO_VISUAL_CONFIG.cloudShadows && !_s17.disabled),
            vignette: !!(_s17.active.vignette && GANJUKO_VISUAL_CONFIG.vignette && !_s17.disabled),
            fogBand: !!(_s17.active.fogBand && GANJUKO_VISUAL_CONFIG.fogBand && !_s17.disabled),
            timePhase: phase,
            outdoorMap: _s17_isOutdoorMap(),
            disabled: _s17.disabled,
            errors: _s17.errors,
            lastError: _s17.lastError
        };
    };
    try {
        if (typeof window !== "undefined") {
            window.GanjukoVisuals = {
                config: GANJUKO_VISUAL_CONFIG,
                status: _s17_status,
                features: function() { return Object.assign({}, _s17.active); }
            };
        }
    } catch (e) { /* noop */ }

    // Spriteset_Map: character shadows (create + update) and atmosphere.
    try {
        if (GANJUKO_VISUAL_CONFIG.characterShadows &&
            typeof Spriteset_Map !== "undefined" && Spriteset_Map.prototype &&
            typeof Spriteset_Map.prototype.createCharacters === "function" &&
            typeof Sprite !== "undefined" && typeof Bitmap !== "undefined") {
            const _s17_Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
            Spriteset_Map.prototype.createCharacters = function() {
                _s17_Spriteset_Map_createCharacters.call(this);
                if (!_s17.disabled) {
                    try { _s17_attachCharacterShadows(this); } catch (e) { _s17_fail(e); }
                }
            };
            _s17.active.characterShadows = true;
        }
    } catch (e) { _s17_fail(e); }
    try {
        if (typeof Spriteset_Map !== "undefined" && Spriteset_Map.prototype &&
            typeof Spriteset_Map.prototype.update === "function") {
            const _s17_Spriteset_Map_update = Spriteset_Map.prototype.update;
            Spriteset_Map.prototype.update = function() {
                _s17_Spriteset_Map_update.call(this);
                if (_s17.disabled) return;
                try {
                    if (GANJUKO_VISUAL_CONFIG.characterShadows && _s17.active.characterShadows) {
                        _s17_updateCharacterShadows(this);
                    }
                    if (_s17.active.cloudShadows || _s17.active.fogBand) {
                        _s17_updateAtmosphere(this);
                    }
                } catch (e) { _s17_fail(e); }
            };
        }
    } catch (e) { _s17_fail(e); }
    try {
        if ((GANJUKO_VISUAL_CONFIG.cloudShadows || GANJUKO_VISUAL_CONFIG.fogBand) &&
            typeof Spriteset_Map !== "undefined" && Spriteset_Map.prototype &&
            typeof Spriteset_Map.prototype.createLowerLayer === "function") {
            const _s17_Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
            Spriteset_Map.prototype.createLowerLayer = function() {
                _s17_Spriteset_Map_createLowerLayer.call(this);
                if (!_s17.disabled) {
                    try { _s17_attachAtmosphere(this); } catch (e) { _s17_fail(e); }
                }
            };
        }
    } catch (e) { _s17_fail(e); }

    // Spriteset_Battle: battler shadows sync after the stock update, so the
    // battler sprites already carry this frame's lunge/hover offsets.
    try {
        if (GANJUKO_VISUAL_CONFIG.battlerShadows &&
            typeof Spriteset_Battle !== "undefined" && Spriteset_Battle.prototype &&
            typeof Spriteset_Battle.prototype.update === "function" &&
            typeof Sprite !== "undefined" && typeof Bitmap !== "undefined") {
            const _s17_Spriteset_Battle_update = Spriteset_Battle.prototype.update;
            Spriteset_Battle.prototype.update = function() {
                _s17_Spriteset_Battle_update.call(this);
                if (_s17.disabled) return;
                try { _s17_updateBattlerShadows(this); } catch (e) { _s17_fail(e); }
            };
            _s17.active.battlerShadows = true;
        }
    } catch (e) { _s17_fail(e); }

    // Spriteset_Base: vignette for every scene that uses a base spriteset
    // (map, battle, and the custom Ganjuko scenes built on menu bases).
    try {
        if (GANJUKO_VISUAL_CONFIG.vignette &&
            typeof Spriteset_Base !== "undefined" && Spriteset_Base.prototype &&
            typeof Spriteset_Base.prototype.createUpperLayer === "function" &&
            typeof Sprite !== "undefined" && typeof Bitmap !== "undefined") {
            const _s17_Spriteset_Base_createUpperLayer = Spriteset_Base.prototype.createUpperLayer;
            Spriteset_Base.prototype.createUpperLayer = function() {
                _s17_Spriteset_Base_createUpperLayer.call(this);
                if (!_s17.disabled) {
                    try { _s17_attachVignette(this); } catch (e) { _s17_fail(e); }
                }
            };
            const _s17_Spriteset_Base_update = Spriteset_Base.prototype.update;
            Spriteset_Base.prototype.update = function() {
                _s17_Spriteset_Base_update.call(this);
                if (_s17.disabled) return;
                try { if (this._ganjukoVignette) _s17_updateVignette(this); } catch (e) { _s17_fail(e); }
            };
            _s17.active.vignette = true;
        }
    } catch (e) { _s17_fail(e); }

})();


    // =========================================================================
    // OFFICIAL 8-BADGE TRAINER CARD SCENE (Scene_GanjukoTrainerCard)
    // =========================================================================

    function Scene_GanjukoTrainerCard() {
        this.initialize(...arguments);
    }
    Scene_GanjukoTrainerCard.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_GanjukoTrainerCard.prototype.constructor = Scene_GanjukoTrainerCard;

    Scene_GanjukoTrainerCard.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createCardWindow();
    };

    Scene_GanjukoTrainerCard.prototype.createCardWindow = function() {
        const rect = new Rectangle(140, 60, Graphics.boxWidth - 280, Graphics.boxHeight - 120);
        this._cardWindow = new Window_GanjukoTrainerCard(rect);
        this._cardWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._cardWindow);
    };

    function Window_GanjukoTrainerCard() {
        this.initialize(...arguments);
    }
    Window_GanjukoTrainerCard.prototype = Object.create(Window_Selectable.prototype);
    Window_GanjukoTrainerCard.prototype.constructor = Window_GanjukoTrainerCard;

    Window_GanjukoTrainerCard.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
        this.activate();
    };

    Window_GanjukoTrainerCard.prototype.refresh = function() {
        this.contents.clear();
        const w = this.innerWidth;
        const leader = $gameParty.leader();
        const trainerName = leader ? leader.name() : "Hiro";

        // Metallic Header
        this.contents.gradientFillRect(0, 0, w, 52, "rgba(25, 35, 65, 0.95)", "rgba(10, 18, 40, 0.95)", false);
        this.changeTextColor("#FFD700");
        this.contents.fontSize = 24;
        this.drawText("✦ GANJUKO REGIONAL LEAGUE PASSPORT ✦", 0, 10, w, "center");

        // Trainer Details Box
        this.contents.fontSize = 18;
        this.resetTextColor();
        const idNo = "ID No. 74829";
        const gold = "¥" + $gameParty.gold().toLocaleString();
        const seen = ($gameSystem._seenGanjuko ? $gameSystem._seenGanjuko.length : 1);
        const caught = ($gameSystem._caughtGanjuko ? $gameSystem._caughtGanjuko.length : 1);
        const playTime = $gameSystem.playtimeText();

        this.drawText("TRAINER: " + trainerName.toUpperCase(), 30, 72, 300, "left");
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(idNo, w - 240, 72, 200, "right");

        this.resetTextColor();
        this.drawText("MONEY:", 30, 110, 120, "left");
        this.changeTextColor("#FFD700");
        this.drawText(gold, 160, 110, 200, "left");

        this.resetTextColor();
        this.drawText("GANJUKODEX:", 30, 146, 140, "left");
        this.changeTextColor("#00FFCC");
        this.drawText("SEEN: " + seen + " / 504   CAUGHT: " + caught + " / 504", 160, 146, 350, "left");

        this.resetTextColor();
        this.drawText("PLAY TIME:", 30, 182, 120, "left");
        this.drawText(playTime, 160, 182, 200, "left");
        const tod = GanjukoEngine.getTimeOfDay();
        this.drawText("ENVIRONMENT:", w - 380, 182, 140, "left");
        this.changeTextColor("#F59E0B");
        this.drawText(tod.name + " (" + tod.resonance + ")", w - 240, 182, 220, "left");

        // Horizontal Badge Divider
        this.contents.fillRect(20, 226, w - 40, 2, "rgba(255, 215, 0, 0.5)");
        this.changeTextColor("#FFD700");
        this.contents.fontSize = 20;
        this.drawText("OFFICIAL GYM BADGE VAULT", 0, 238, w, "center");

        // The 8 Official Gym Badges
        const badges = [
            { id: 1, name: "Tectonic", leader: "Rokuro", sw: 11, color: "#E2BF65", icon: "⬡" },
            { id: 2, name: "Tidal",    leader: "Marina", sw: 16, color: "#6390F0", icon: "💧" },
            { id: 3, name: "Dynamo",   leader: "Volk",   sw: 21, color: "#F7D02C", icon: "⚡" },
            { id: 4, name: "Canopy",   leader: "Sylva",  sw: 26, color: "#7AC74C", icon: "☘" },
            { id: 5, name: "Inferno",  leader: "Ignacio",sw: 27, color: "#EE8130", icon: "🔥" },
            { id: 6, name: "Aero",     leader: "Zephyr", sw: 28, color: "#A98FF3", icon: "🪽" },
            { id: 7, name: "Eclipse",  leader: "Morbius",sw: 29, color: "#705746", icon: "🌙" },
            { id: 8, name: "Astral",   leader: "Astraea",sw: 30, color: "#6F35FC", icon: "★" }
        ];

        const startX = 30;
        const colWidth = Math.floor((w - 60) / 4);

        badges.forEach((b, i) => {
            const bx = startX + (i % 4) * colWidth;
            const by = 280 + Math.floor(i / 4) * 80;
            const unlocked = $gameSwitches.value(b.sw);

            // Badge Box
            this.contents.gradientFillRect(bx + 4, by, colWidth - 8, 70, unlocked ? "rgba(40, 50, 80, 0.9)" : "rgba(20, 20, 25, 0.7)", "rgba(15, 18, 30, 0.9)", true);

            if (unlocked) {
                this.changeTextColor(b.color);
                this.contents.fontSize = 22;
                this.drawText(b.icon + " " + b.name, bx + 8, by + 8, colWidth - 16, "center");
                this.contents.fontSize = 14;
                this.changeTextColor("#00FFCC");
                this.drawText("Ldr: " + b.leader, bx + 8, by + 38, colWidth - 16, "center");
            } else {
                this.changeTextColor("#555555");
                this.contents.fontSize = 18;
                this.drawText("[ LOCKED ]", bx + 8, by + 12, colWidth - 16, "center");
                this.contents.fontSize = 13;
                this.drawText("Badge #" + b.id, bx + 8, by + 38, colWidth - 16, "center");
            }
        });

        // Champion Crown if League beaten
        if ($gameSwitches.value(36)) {
            this.changeTextColor("#FFD700");
            this.contents.fontSize = 18;
            this.drawText("👑 REGIONAL GRAND CHAMPION 👑", 0, 450, w, "center");
        } else {
            this.changeTextColor("#888888");
            this.contents.fontSize = 14;
            this.drawText("[ Press Esc / X to return ]", 0, 452, w, "center");
        }
    };

    window.Scene_GanjukoTrainerCard = Scene_GanjukoTrainerCard;


    // Running Shoes & Mach Bike Speed Engine
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        let speed = _Game_Player_realMoveSpeed.call(this);
        if ($gameSystem._ridingBicycle) {
            return 5.25; // Mach Bike (FR3 D12: was 5.5 / 10.6 t/s — too fast)
        }
        // FR3 D12: Rene playtest — walking felt too fast. Baseline -0.5 at this
        // single seam: walk 4 -> 3.5 (2.65 t/s), dash 5 -> 4.5 (5.3 t/s),
        // dash + Running Shoes -> 5.0 (7.5 t/s). Event/NPC speeds untouched.
        speed -= 0.5;
        if (this.isDashing() && $gameParty.hasItem($dataItems[24])) {
            return speed + 0.5; // Running Shoes sprint boost!
        }
        return speed;
    };

    // Shortcut: Press B on map to toggle Mach Bike!
    const _Scene_Map_updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        _Scene_Map_updateScene.call(this);
        if (!SceneManager.isSceneChanging() && Input.isTriggered("bicycleKey")) {
            this.toggleMachBike();
        }
    };

    // Register Key B in Input.keyMapper
    Input.keyMapper[66] = "bicycleKey"; // Keycode 66 = 'B'

    Scene_Map.prototype.toggleMachBike = function() {
        if (!$gameParty.hasItem($dataItems[25])) {
            return;
        }
        // Only outdoors or on routes
        if ($gameMap.tilesetId() === 3) { // Inside tileset (Fix Round 2 / QA-D06: was === 1, a tileset no map uses)
            AudioManager.playSe({ name: "Buzzer1", volume: 75, pitch: 100, pan: 0 });
            $gameMessage.add("Prof. Kusu: There is a time and place for everything, but not indoors!");
            return;
        }

        $gameSystem._ridingBicycle = !$gameSystem._ridingBicycle;
        if ($gameSystem._ridingBicycle) {
            AudioManager.playSe({ name: "Bell1", volume: 90, pitch: 115, pan: 0 });
            $gameMessage.add("\C[14]Mounted the Mach Bike! Speed doubled!\C[0]");
        } else {
            AudioManager.playSe({ name: "Equip1", volume: 80, pitch: 100, pan: 0 });
            $gameMessage.add("Dismounted the Mach Bike.");
        }
    };


    // Move Relearner / Move Master System
    GanjukoEngine.openMoveRelearner = function() {
        const leader = $gameParty.allMembers()[0];
        if (!leader) {
            $gameMessage.add("You don't have any Ganjuko in your party!");
            return;
        }
        const sp = leader.ganjukoSpecies();
        const available = sp.learnings ? sp.learnings.filter(l => l.level <= leader.level) : [];
        if (available.length === 0) {
            $gameMessage.add("Your partner has already mastered all available moves for its level!");
            return;
        }

        const currentSkillIds = leader._skills || [];
        const candidateSkills = available
            .map(l => $dataSkills[l.skillId])
            .filter(s => s && !currentSkillIds.includes(s.id));

        if (candidateSkills.length === 0) {
            $gameMessage.add("Your " + leader.name() + " already knows all eligible moves from its species pool!");
            return;
        }

        const choices = candidateSkills.slice(0, 4).map(s => s.name);
        choices.push("Cancel");

        $gameMessage.add("Select a move for \C[14]" + leader.name() + "\C[0] to re-learn (Fee: ¥500):");
        $gameMessage.setChoices(choices, 0, choices.length - 1);
        $gameMessage.setChoiceCallback(n => {
            if (n >= 0 && n < candidateSkills.length) {
                if ($gameParty.gold() < 500) {
                    $gameMessage.add("You don't have enough money! (Requires ¥500)");
                    return;
                }
                $gameParty.loseGold(500);
                const chosenSkill = candidateSkills[n];
                leader.learnSkill(chosenSkill.id);
                AudioManager.playSe({ name: "Saint1", volume: 90, pitch: 110, pan: 0 });
                $gameMessage.add("\C[14]" + leader.name() + " learned " + chosenSkill.name + "!\C[0]");
            }
        });
    };


    // =========================================================================
    // DYNAMIC DAY / NIGHT LIGHTING & ECOLOGY ENGINE
    // =========================================================================

    GanjukoEngine.getTimeOfDay = function() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 10) return { name: "MORNING", tint: [-10, 0, 10, 0], resonance: "VOLT & WIND" };
        if (hour >= 10 && hour < 17) return { name: "DAY",     tint: [0, 0, 0, 0],     resonance: "NATURE & FIRE" };
        if (hour >= 17 && hour < 20) return { name: "DUSK",    tint: [25, -15, -20, 10], resonance: "WATER & ASTRAL" };
        return { name: "NIGHT", tint: [-48, -42, -10, 42], resonance: "UMBRA NOCTURNAL" };
    };

    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        this.updateDayNightTint();
    };

    Scene_Map.prototype.updateDayNightTint = function() {
        // Only outdoor maps (tilesetId 3 = "Inside"; Fix Round 2 / QA-D06)
        if ($gameMap.tilesetId() !== 3) {
            const tod = GanjukoEngine.getTimeOfDay();
            $gameScreen.startTint(tod.tint, 30);
        } else {
            $gameScreen.startTint([0, 0, 0, 0], 20); // Indoor warm neutral
        }
    };

    // Low HP Danger Heartbeat Alarm in Battle
    let _lowHpWarningTimer = 0;
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        const playerGanjuko = $gameParty.allMembers()[0];
        if (playerGanjuko && playerGanjuko.isAlive() && playerGanjuko.hpRate() < 0.25) {
            _lowHpWarningTimer = (_lowHpWarningTimer + 1) % 70;
            if (_lowHpWarningTimer === 1) {
                AudioManager.playSe({ name: "Buzzer1", volume: 45, pitch: 140, pan: 0 });
            }
        }
    };


    // =========================================================================
    // REGIONAL FAST-TRAVEL TOWN MAP (Scene_GanjukoTownMap)
    // =========================================================================

    function Scene_GanjukoTownMap() {
        this.initialize(...arguments);
    }
    Scene_GanjukoTownMap.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_GanjukoTownMap.prototype.constructor = Scene_GanjukoTownMap;

    Scene_GanjukoTownMap.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createMapWindow();
    };

    Scene_GanjukoTownMap.prototype.createMapWindow = function() {
        const rect = new Rectangle(80, 40, Graphics.boxWidth - 160, Graphics.boxHeight - 80);
        this._mapWindow = new Window_GanjukoTownMap(rect);
        this._mapWindow.setHandler("cancel", this.popScene.bind(this));
        this._mapWindow.setHandler("ok", this.onTownSelect.bind(this));
        this.addWindow(this._mapWindow);
    };

    Scene_GanjukoTownMap.prototype.onTownSelect = function() {
        const town = this._mapWindow.currentTown();
        if (!town || !town.unlocked) {
            AudioManager.playSe({ name: "Buzzer1", volume: 80, pitch: 100, pan: 0 });
            this._mapWindow.activate();
            return;
        }

        // Fast-Travel Flight Animation & Sound
        AudioManager.playSe({ name: "Wind3", volume: 90, pitch: 110, pan: 0 });
        $gameScreen.startFadeOut(25);
        setTimeout(() => {
            $gamePlayer.reserveTransfer(town.mapId, town.x, town.y, 2, 0);
            SceneManager.goto(Scene_Map);
        }, 400);
    };

    function Window_GanjukoTownMap() {
        this.initialize(...arguments);
    }
    Window_GanjukoTownMap.prototype = Object.create(Window_Selectable.prototype);
    Window_GanjukoTownMap.prototype.constructor = Window_GanjukoTownMap;

    Window_GanjukoTownMap.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this._towns = [
            { id: 1, name: "Wakaba Town", desc: "Your peaceful hometown & Prof. Kusu's laboratory.", mapId: 1, x: 12, y: 12, unlocked: true },
            { id: 2, name: "Kurogane Town", desc: "Historic hub city. Kurogane Gym & Move Master.", mapId: 4, x: 10, y: 15, unlocked: true },
            { id: 3, name: "Port Marine", desc: "Vibrant ocean port. Marine Gym & Ferry Docks.", mapId: 9, x: 12, y: 15, unlocked: $gameSwitches.value(11) },
            { id: 4, name: "Spark City", desc: "Electric neon metropolis. Dynamo Gym & Mega Mart.", mapId: 12, x: 10, y: 15, unlocked: $gameSwitches.value(16) },
            { id: 5, name: "Battle Tower", desc: "Endgame champion battle gauntlet.", mapId: 14, x: 10, y: 15, unlocked: $gameSwitches.value(21) },
            { id: 6, name: "Sylva Canopy", desc: "Deep forest sanctuary. Nature Canopy Gym.", mapId: 16, x: 8, y: 16, unlocked: $gameSwitches.value(21) },
            { id: 7, name: "Mt. Pyre Caldera", desc: "Volcanic summit. Fire Inferno Gym.", mapId: 18, x: 8, y: 16, unlocked: $gameSwitches.value(26) },
            { id: 8, name: "Cloudpeak Shrine", desc: "High-altitude mountain peak. Aero Wind Gym.", mapId: 20, x: 8, y: 16, unlocked: $gameSwitches.value(27) },
            { id: 9, name: "Gloom Hollow", desc: "Shadow-shrouded hollow. Eclipse Umbra Gym.", mapId: 22, x: 8, y: 16, unlocked: $gameSwitches.value(28) },
            { id: 10, name: "Starfall Citadel", desc: "Celestial summit. Astral 8th Gym.", mapId: 24, x: 8, y: 16, unlocked: $gameSwitches.value(29) },
            { id: 11, name: "Champions Hall", desc: "Ganjuko League Pinnacle & Hall of Fame.", mapId: 26, x: 12, y: 26, unlocked: $gameSwitches.value(30) }
        ];
        this.select(0);
        this.refresh();
        this.activate();
    };

    Window_GanjukoTownMap.prototype.maxItems = function() {
        return this._towns ? this._towns.length : 0;
    };

    Window_GanjukoTownMap.prototype.currentTown = function() {
        return this._towns[this.index()];
    };

    Window_GanjukoTownMap.prototype.drawItem = function(index) {
        const town = this._towns[index];
        const rect = this.itemLineRect(index);
        this.contents.fontSize = 18;

        if (town.unlocked) {
            this.changeTextColor(town.mapId === $gameMap.mapId() ? "#00FFCC" : "#FFFFFF");
            const mark = town.mapId === $gameMap.mapId() ? "▶ [CURRENT] " : "✦ ";
            this.drawText(mark + town.name, rect.x + 8, rect.y, 220, "left");
            this.changeTextColor("#94A3B8");
            this.contents.fontSize = 14;
            this.drawText(town.desc, rect.x + 230, rect.y, rect.width - 240, "left");
        } else {
            this.changeTextColor("#555555");
            this.drawText("??? [LOCKED LOCATION]", rect.x + 8, rect.y, 220, "left");
            this.contents.fontSize = 14;
            this.drawText("Defeat preceding Gym Leaders to unlock fast travel here.", rect.x + 230, rect.y, rect.width - 240, "left");
        }
    };

    window.Scene_GanjukoTownMap = Scene_GanjukoTownMap;

    // =========================================================================
    // OVERWORLD HM EXPLORATION (Cut, Rock Smash, Strength)
    // =========================================================================

    GanjukoEngine.interactCutTree = function(eventId, switchId) {
        $gameMessage.add("This thorny sapling looks like it can be \C[14]CUT\C[0] down!");
        $gameMessage.setChoices(["Use CUT", "Leave"], 0, 1);
        $gameMessage.setChoiceCallback(n => {
            if (n === 0) {
                AudioManager.playSe({ name: "Wind1", volume: 90, pitch: 120, pan: 0 });
                $gameScreen.startFlash([255, 255, 255, 180], 15);
                $gameSwitches.setValue(switchId, true);
                $gameMessage.add("Your partner cleared the thorny tree with a swift \C[14]CUT\C[0]!");
            }
        });
    };

    GanjukoEngine.interactRockSmash = function(eventId, switchId) {
        $gameMessage.add("This boulder is cracked and brittle. It can be \C[14]SMASHED\C[0]!");
        $gameMessage.setChoices(["Use ROCK SMASH", "Leave"], 0, 1);
        $gameMessage.setChoiceCallback(n => {
            if (n === 0) {
                AudioManager.playSe({ name: "Collapse1", volume: 90, pitch: 110, pan: 0 });
                $gameScreen.startShake(6, 6, 20);
                $gameSwitches.setValue(switchId, true);

                // 40% chance of discovering fossil or valuable ore
                const roll = Math.random();
                if (roll < 0.25) {
                    const oreItems = [
                        { id: 351, name: "Nugget" },
                        { id: 356, name: "Stardust" },
                        { id: 357, name: "Star Piece" },
                        { id: 371, name: "Helix Fossil" },
                        { id: 372, name: "Dome Fossil" },
                        { id: 373, name: "Old Amber" }
                    ];
                    const found = oreItems[Math.floor(Math.random() * oreItems.length)];
                    $gameParty.gainItem($dataItems[found.id], 1);
                    AudioManager.playSe({ name: "Item1", volume: 90, pitch: 100, pan: 0 });
                    $gameMessage.add("The shattered rock revealed a rare \C[14]" + found.name + "\C[0]!");
                } else {
                    $gameMessage.add("The rock was pulverized into gravel!");
                }
            }
        });
    };

    // =========================================================================
    // GANJUKO DAYCARE & EGG BREEDING ENGINE
    // =========================================================================

    GanjukoEngine.depositDaycare = function(slot) {
        if ($gameParty.allMembers().length <= 1) {
            $gameMessage.add("You must keep at least 1 Ganjuko in your party!");
            return;
        }
        $gameSystem._daycare = $gameSystem._daycare || { slot1: null, slot2: null, steps: 0, eggReady: false };
        const member = $gameParty.allMembers()[1]; // Deposit 2nd member
        if (slot === 1) $gameSystem._daycare.slot1 = { id: member.ganjukoSpeciesId(), name: member.name(), level: member.level };
        if (slot === 2) $gameSystem._daycare.slot2 = { id: member.ganjukoSpeciesId(), name: member.name(), level: member.level };
        // Fix Round 2 (QA-D04): a new deposit changes the pairing — drop the
        // cached compatibility verdict and restart the egg wait.
        $gameSystem._daycare.compatible = null;
        $gameSystem._daycare.steps = 0;
        $gameSystem._daycare.eggReady = false;
        $gameParty.removeActor(member.actorId());
        AudioManager.playSe({ name: "Saint1", volume: 85, pitch: 110, pan: 0 });
        $gameMessage.add("Deposited \C[14]" + member.name() + "\C[0] into the Daycare paddock!");
    };

    // Fix Round 2 (QA-D04): breeding compatibility + a real Egg step.
    // Two deposited Ganjuko are compatible when they are the same species,
    // belong to the same evolution family, or share at least one type.
    // Incompatible pairs never produce an Egg. (Stat/trait inheritance is
    // Section 18's design; until then the offspring is slot 1's species, as
    // before — but it now arrives as an Egg that hatches by walking.)
    GanjukoEngine.computeDaycareCompatible = function(posIdA, posIdB) {
        const a = GanjukoEngine.getSpecies(posIdA);
        const b = GanjukoEngine.getSpecies(posIdB);
        if (!a || !b) return false;
        if (posIdA === posIdB) return true;
        const typesOf = sp => [sp.type1 || sp.type, sp.type2 || 0].filter(t => t > 0);
        const ta = typesOf(a), tb = typesOf(b);
        if (ta.some(t => tb.includes(t))) return true;
        const rootOf = posId => {
            let cur = posId;
            const seen = new Set([cur]);
            const total = (typeof $dataGanjukoSpecies !== "undefined" && $dataGanjukoSpecies) ? $dataGanjukoSpecies.length : 504;
            for (let guard = 0; guard < 10; guard++) {
                let pred = 0;
                for (let i = 1; i <= total; i++) {
                    const cand = GanjukoEngine.getSpecies(i);
                    if (cand && GanjukoEngine.evolutionTargetId(cand) === cur && !seen.has(i)) { pred = i; break; }
                }
                if (!pred) break;
                cur = pred;
                seen.add(cur);
            }
            return cur;
        };
        return rootOf(posIdA) === rootOf(posIdB);
    };

    GanjukoEngine.daycareCompatible = function(d) {
        if (!d || !d.slot1 || !d.slot2) return false;
        if (d.compatible === null || d.compatible === undefined) {
            d.compatible = GanjukoEngine.computeDaycareCompatible(d.slot1.id, d.slot2.id);
        }
        return d.compatible;
    };

    GanjukoEngine.checkDaycareEgg = function() {
        $gameSystem._daycare = $gameSystem._daycare || { slot1: null, slot2: null, steps: 0, eggReady: false };
        const d = $gameSystem._daycare;
        if (d.eggReady) {
            $gameMessage.add("Daycare Man: \C[14]We found a mysterious Ganjuko Egg while caring for your partners!\C[0]");
            $gameMessage.setChoices(["Take the Egg", "Leave it"], 0, 1);
            $gameMessage.setChoiceCallback(n => {
                if (n === 0) {
                    if ($gameSystem._daycareEgg) {
                        $gameMessage.add("Daycare Man: You're already carrying an Egg! Hatch that one first - we'll keep this Egg safe here until you're ready.");
                        return;
                    }
                    d.eggReady = false;
                    const babySpecies = d.slot1 ? d.slot1.id : 1;
                    // Fix Round 2 (QA-D04): taking the Egg no longer grants
                    // an instant creature. The Egg is carried and hatches
                    // after 256 steps (see the step counter below) — which
                    // makes the attendant's promise below true at last.
                    $gameSystem._daycareEgg = { speciesId: babySpecies, stepsLeft: 256 };
                    AudioManager.playMe({ name: "Fanfare1", volume: 90, pitch: 100, pan: 0 });
                    $gameMessage.add("\C[14]You received the Ganjuko Egg! It will hatch as you walk!\C[0]");
                }
            });
        } else if (d.slot1 && d.slot2 && !GanjukoEngine.daycareCompatible(d)) {
            $gameMessage.add("Daycare Man: The two of them don't seem to get along... No Egg will come from this pairing. (Partners need a shared type or a shared family.)");
        } else if (d.slot1 && d.slot2) {
            $gameMessage.add("Your two Ganjuko are playing cheerfully together in the meadow paddock!");
        } else if (d.slot1 || d.slot2) {
            $gameMessage.add("Your Ganjuko is resting peacefully. Leave a second partner to begin breeding!");
        } else {
            $gameMessage.add("Welcome to the Ganjuko Daycare! Leave up to 2 Ganjuko to raise them and breed Eggs!");
        }
    };

    // Step counter increments Daycare steps
    const _Game_Party_increaseSteps = Game_Party.prototype.increaseSteps;
    Game_Party.prototype.increaseSteps = function() {
        _Game_Party_increaseSteps.call(this);
        if ($gameSystem._daycare && $gameSystem._daycare.slot1 && $gameSystem._daycare.slot2 && !$gameSystem._daycare.eggReady) {
            // Fix Round 2 (QA-D04): steps only count toward an Egg when the
            // deposited pair is actually compatible.
            if (GanjukoEngine.daycareCompatible($gameSystem._daycare)) {
                $gameSystem._daycare.steps = ($gameSystem._daycare.steps || 0) + 1;
                if ($gameSystem._daycare.steps >= 120) {
                    $gameSystem._daycare.steps = 0;
                    $gameSystem._daycare.eggReady = true;
                }
            }
        }
        // Fix Round 2 (QA-D04): a carried Egg counts down and hatches.
        if ($gameSystem._daycareEgg) {
            const egg = $gameSystem._daycareEgg;
            egg.stepsLeft = (egg.stepsLeft || 256) - 1;
            if (egg.stepsLeft <= 0) {
                $gameSystem._daycareEgg = null;
                const babySpecies = egg.speciesId;
                const babyName = GanjukoEngine.getSpecies(babySpecies).name;
                const res = GanjukoEngine.giveGanjuko(babySpecies, 1, "Baby " + babyName);
                AudioManager.playMe({ name: "Fanfare1", volume: 90, pitch: 100, pan: 0 });
                $gameMessage.add("\C[14]The Ganjuko Egg hatched into " + babyName + "!\C[0]" + (res && res.inParty === false ? " It was sent to your Ganjuko Box." : ""));
            }
        }
    };


    // =========================================================================
    // FIX ROUND 1 (2026-11-01): STADIUM FOE STAT MODEL
    // =========================================================================
    // Playtest Defect #4: Stadium foes were massively overtuned (~4-5x).
    // Game_Enemy.paramBase scales species baseStats by (0.55 + level * 0.14),
    // which at Lv 50 yields HP 705-884 / DEF 303-340, while player Ganjuko
    // derive their stats from their class param curves (HP ~122-175 at Lv 50).
    // The Section 16.6 BST normalization compresses both sides symmetrically
    // and cannot close a base-model gap that large.
    //
    // Fix: inside Stadium battles ONLY ($gameTemp._stadiumActive), a Ganjuko
    // enemy's paramBase reads the SAME class param curve a player actor of
    // its species uses ($dataClasses[positionalSpeciesId].params), at the
    // enemy's battle level — so a Stadium foe is exactly as strong as a
    // player-raised Ganjuko of the same species and level, before the 16.6
    // BST normalization (unchanged) is applied symmetrically on top.
    // Outside the Stadium the original species-formula model is untouched.
    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.paramBase === "function") {
        const _fr1_Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
        Game_Enemy.prototype.paramBase = function(paramId) {
            try {
                if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._stadiumActive &&
                    typeof this.ganjukoSpeciesId === "function" && typeof $dataClasses !== "undefined" && $dataClasses) {
                    const cls = $dataClasses[this.ganjukoSpeciesId()];
                    if (cls && Array.isArray(cls.params) && Array.isArray(cls.params[paramId])) {
                        const curve = cls.params[paramId];
                        const lv = Math.max(1, Math.min(
                            typeof this.ganjukoLevel === "function" ? this.ganjukoLevel() : 50,
                            curve.length - 1));
                        const v = curve[lv];
                        if (typeof v === "number" && isFinite(v)) return v;
                    }
                }
            } catch (e) {}
            return _fr1_Game_Enemy_paramBase.call(this, paramId);
        };
    }


    // =========================================================================
    // ENGINE PASS 2 — SECTION P2A: UNIFIED STAT MODEL + EXP PACING (2026-11-01)
    // =========================================================================
    // Rene's OTA v2 playtest verdict: a wild Lv6 Raibunny had 109 HP while
    // his Lv5 Leviatide had 23 (~4.7x at near-equal levels). Root cause: TWO
    // stat models. Player Ganjuko read MZ class param curves, while
    // Game_Enemy.paramBase scaled species baseStats by (0.55 + level*0.14),
    // a much hotter line (and the old Section 16.6 / Fix Round 1 history
    // shows the same split breaking the Stadium before the class-curve
    // patch was scoped there).
    //
    // P2A makes baseStats the single source of truth: ONE formula,
    // GanjukoEngine.unifiedParam, now computes stats for BOTH Game_Actor
    // and Game_Enemy battlers from their species' baseStats at their
    // level. A wild of species X at level L is now EXACTLY as strong as a
    // player-raised X at level L — by construction, not by tuning. The
    // formula (validated in work/sim/simulate3.mjs against the Section
    // 16.5 pools + chart v1.1): multiplier (0.30 + 0.034 * level); HP also
    // gains (+ level + 5); every other stat gains +5; LUK stays 10+level.
    // Species identity is preserved because baseStats encode stage/role;
    // the companion data pass band-normalized out-of-band baseStats in
    // data/GanjukoSpecies.json (evolution-chain species only).
    //
    // This section wraps OUTSIDE the Fix Round 1 Stadium wrapper: for
    // Ganjuko enemies its class-curve branch is superseded everywhere
    // (the unified formula IS the class-curve fix, generalized). The
    // Section 16.6 Stadium BST normalization still applies on top inside
    // Stadium battles, but its target band was calibrated for class-curve
    // Lv50 stat sums (~1634-3730, band 3000); unified Lv50 sums run
    // ~340-900, which would clamp every battler to identical factors and
    // silently disable the compression. stadiumScaleFor is therefore
    // recalibrated below to a 620 band (the unified model's median Lv50
    // sum) with the original clamp ranges preserved.
    //
    // QA-D07 (grindy EXP) is also closed here: enemy EXP yield changes
    // from (hp+atk+def+mat) * level / 7 (linear; ~15-20 equal-level wins
    // per level-up past Lv20 against the MZ class exp curve) to
    // (hp+atk+def+mat) * level^1.6 * 0.083, which tracks the exp curve's
    // superlinear gaps at ~3-4 equal-level wins per level-up all game
    // (calibration table in work/sim/simulate3.mjs EXP report).
    //
    // QA-D20 / FR4 Enemy Doctrine (2026-11-05): the flat 0.083 coefficient
    // still starved the OPENING, where the Lv5->6 curve gap (486 EXP) dwarfs
    // a ~50-85 EXP low-level win, so the player could not level on Route 1
    // at all (fix4/RECON.md Workstream B). The yield coefficient is now
    // tapered by FOE level via expCoefForLevel below: 0.16 for foe Lv <= 6,
    // 0.125 for Lv 7-10, and the original 0.083 above Lv 10 (STAT_MODEL
    // .expCoef keeps the >10 value). A Lv4 foe now pays ~139 EXP and Lv5->6
    // takes ~4 Route 1 wins; mid/late-game pacing is unchanged.
    GanjukoEngine.STAT_MODEL = { intercept: 0.30, perLevel: 0.034, expCoef: 0.083, expPow: 1.6, stadiumBand: 620 };

    // FR4 D20 EXP taper: coefficient by foe level (see note above).
    GanjukoEngine.expCoefForLevel = function(lv) {
        const L = Math.max(1, Math.floor(lv) || 1);
        if (L <= 6) return 0.16;
        if (L <= 10) return 0.125;
        return GanjukoEngine.STAT_MODEL.expCoef; // 0.083
    };

    GanjukoEngine.unifiedParam = function(bs, paramId, level) {
        if (!bs) return 10;
        const L = Math.max(1, Math.min(100, Math.floor(level) || 1));
        const mult = GanjukoEngine.STAT_MODEL.intercept + L * GanjukoEngine.STAT_MODEL.perLevel;
        switch (paramId) {
            case 0: return Math.max(1, Math.floor((bs.hp || 10) * mult) + L + 5);   // MHP
            case 1: return Math.max(0, Math.floor((bs.mp || 30) * mult) + 5);      // MMP
            case 2: return Math.max(1, Math.floor((bs.atk || 5) * mult) + 5);      // ATK
            case 3: return Math.max(1, Math.floor((bs.def || 5) * mult) + 5);      // DEF
            case 4: return Math.max(1, Math.floor((bs.mat || 5) * mult) + 5);      // MAT
            case 5: return Math.max(1, Math.floor((bs.mdf || 5) * mult) + 5);      // MDF
            case 6: return Math.max(1, Math.floor((bs.agi || 5) * mult) + 5);      // AGI
            case 7: return 10 + L;                                                 // LUK
            default: return 10;
        }
    };

    if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.paramBase === "function") {
        const _p2a_Game_Actor_paramBase = Game_Actor.prototype.paramBase;
        Game_Actor.prototype.paramBase = function(paramId) {
            try {
                if (typeof this.ganjukoSpecies === "function") {
                    const sp = this.ganjukoSpecies();
                    if (sp && sp.baseStats) {
                        return GanjukoEngine.unifiedParam(sp.baseStats, paramId, this.level || 1);
                    }
                }
            } catch (e) {}
            return _p2a_Game_Actor_paramBase.call(this, paramId);
        };
    }

    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.paramBase === "function") {
        const _p2a_Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
        Game_Enemy.prototype.paramBase = function(paramId) {
            try {
                if (typeof this.ganjukoSpecies === "function") {
                    const sp = this.ganjukoSpecies();
                    if (sp && sp.baseStats) {
                        const lv = (typeof this.ganjukoLevel === "function") ? this.ganjukoLevel() : 1;
                        return GanjukoEngine.unifiedParam(sp.baseStats, paramId, lv);
                    }
                }
            } catch (e) {}
            return _p2a_Game_Enemy_paramBase.call(this, paramId);
        };
    }

    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.exp === "function") {
        const _p2a_Game_Enemy_exp = Game_Enemy.prototype.exp;
        Game_Enemy.prototype.exp = function() {
            try {
                const sp = (typeof this.ganjukoSpecies === "function") ? this.ganjukoSpecies() : null;
                if (sp && sp.baseStats) {
                    const bs = sp.baseStats;
                    const bs4 = (bs.hp || 0) + (bs.atk || 0) + (bs.def || 0) + (bs.mat || 0);
                    const lv = (typeof this.ganjukoLevel === "function") ? this.ganjukoLevel() : 1;
                    // FR4 D20: tapered coefficient by foe level (expCoefForLevel).
                    return Math.max(1, Math.round(bs4 * Math.pow(Math.max(1, lv), GanjukoEngine.STAT_MODEL.expPow) * GanjukoEngine.expCoefForLevel(lv)));
                }
            } catch (e) {}
            return _p2a_Game_Enemy_exp.call(this);
        };
    }

    // Stadium normalization band recalibration (see header): same clamps,
    // band matched to unified-model Lv50 stat sums.
    GanjukoEngine.stadiumScaleFor = function(bst) {
        if (!bst || !isFinite(bst)) return { stat: 1, hp: 1 };
        const raw = GanjukoEngine.STAT_MODEL.stadiumBand / bst;
        return {
            stat: Math.min(1.25, Math.max(0.80, raw)),
            hp: Math.min(1.10, Math.max(0.90, raw))
        };
    };

    // =========================================================================
    // ENGINE PASS 2 — SECTION P2B: CHAMPIONS-STANDARD BATTLE UI, BATTLE FX,
    // CAMERA ZOOM (2026-11-02)
    // =========================================================================
    // Rene's OTA v2 playtest verdicts, addressed in order:
    //
    // 1. BATTLE LAYOUT. The Section 7 HUD cards were anchored "beside" the
    //    battlers, so the foe card covered the foe's ears and the ally card
    //    covered the ally's midsection (and clipped its own EXP label past
    //    the card's bottom edge). P2B moves to the Pokemon Champions plate
    //    standard: plates are STATIC (foe top-right, ally left), and the
    //    BATTLERS move into stage slots sized so no battler art can ever
    //    reach a plate. The guarantee is by construction, not by eyeball:
    //    every battler bitmap is measured once (opaque alpha bounding box,
    //    cached per file) and the sprite is fit-scaled so its ART — not
    //    its canvas — respects a per-slot height/width cap, with the art's
    //    feet planted exactly on the slot's ground point and the art
    //    centered on the slot's x. A live probe of this project's battle
    //    windows added one more constraint: MZ's help/skill/item/message
    //    windows are OPAQUE and full-width over the lower screen (topmost
    //    edge: the help window at H-296), so plates and battler art alike
    //    live entirely above that band — visible at every battle moment,
    //    not just at input. The doubles layout is planned in
    //    battleLayout().doubles for the Arena build.
    //
    // 2. HP DISPLAY RULE (Rene, locked). Both plates show bar + PERCENTAGE
    //    only. Raw HP numbers (the old "HP: 109 / 109" and "HP 20/23") are
    //    gone from the plates AND from the in-battle switch window — no
    //    raw HP counts anywhere in the battle UI. Bar and % both shift
    //    green -> yellow -> red as HP drops. (Damage popups still show
    //    damage amounts, as in Champions; those are not HP counts.)
    //
    // 3. BATTLE FX. Type-colored impact bursts on every damaging hit
    //    (bigger on a KO), a shake + red-flash hit reaction for the foe
    //    (the ally sprite already had one), damage popups for the player's
    //    battler (stock MZ never renders them in front view — the lead has
    //    no Sprite_Battler), and a sink-and-fade KO presentation for the
    //    player's battler instead of the old instant vanish. All of it
    //    composes with the Section 17 battler shadows, which keep reading
    //    the sprites' settled positions.
    //
    // 4. CAMERA ZOOM 1.5x on the overworld (Rene decision). Implemented as
    //    a transform on Spriteset_Map's _baseSprite — the world layer
    //    (tilemap, characters, their Section 17 shadows, the touch
    //    destination marker) — pivoting on the player's screen position so
    //    the player never moves on screen while the world magnifies around
    //    them. Screen-space layers (Section 17 vignette/fog/cloud shadows,
    //    weather, pictures, windows) are deliberately NOT zoomed. Touch
    //    input is corrected at the single seam MZ provides:
    //    Game_Map.canvasToMapX/Y pre-transform the canvas point through
    //    the inverse zoom before the stock conversion runs.
    //
    // The Section 7 classes (Sprite_GanjukoBattleHud, Sprite_PlayerGanjuko,
    // Window_BattleGanjukoSwitch) live inside the engine's IIFE and are not
    // reachable from this top-level section, so their P2B behavior is
    // installed by capturing their prototypes from live instances at
    // battle setup (Spriteset_Battle.createLowerLayer /
    // Scene_Battle.createAllWindows wrappers) — once per class, flagged in
    // GanjukoEngine.BATTLE_UI.status for verification probes.

    // ---------------------------------------------------------------------
    // P2B.0 Pure layout + display math (unit-tested in pass-2b.test.js)
    // ---------------------------------------------------------------------
    GanjukoEngine.battleLayout = function(boxW, boxH) {
        const W = boxW || 1280, H = boxH || 720;
        // The opaque-window band: MZ's battle windows are OPAQUE and sit
        // in the lower screen — help window top at H-296 (measured live:
        // y=416 at H=712), skill/item windows at H-200, message window
        // at H-176, all full width. Anything plate-or-battler below
        // H-296 gets covered while selecting a move or reading a battle
        // message, so P2B keeps EVERY plate and every battler's art
        // entirely above that line. (The battle log window is the one
        // exception by design: opacity 0 with a translucent gradient
        // behind left-aligned text at the top — it dims, never covers.)
        const bandTop = H - 296;
        return {
            // Singles plates — Champions anchors: foe top-right, ally
            // left, both fully above the window band, static for every
            // battle, turn and animation.
            foePlate: { x: W - 404 - 24, y: 24, w: 404, h: 112 },
            allyPlate: { x: 24, y: bandTop - 8 - 134, w: 404, h: 134 },
            // Singles stage slots: ground point (x, y) the battler's ART
            // feet land on, plus the art caps the fit scaler enforces.
            // Invariants (asserted by the unit suite): foe art top
            // (stage.y - capH) clears the foe plate's bottom edge by
            // >= 16 px; both art bottoms (stage.y) stay >= 14 px above
            // the window band; the ally art is X-SEPARATED from the ally
            // plate — the roster audit (all 504 battlers measured) puts
            // the widest ally-fit screen width at 348 px (halfW 175), so
            // stage.x - 175 clears the plate's right edge with margin,
            // at any height.
            foeStage: { x: Math.round(W * 0.695), y: H - 310, capH: 250, capW: 470 },
            allyStage: { x: Math.round(W * 0.487), y: H - 312, capH: 300, capW: 520 },
            // Doubles plan (Arena build): same corner language, narrower
            // plates stacked in each side column (foe right, ally left),
            // four stage slots between them, every capped art box above
            // the window band and clear of every plate. Back slots are
            // smaller — the stacked plates consume the top corners, the
            // same trade Champions makes. The unit suite asserts no
            // doubles stage's capped art box intersects any doubles
            // plate.
            doubles: {
                foePlates: [
                    { x: W - 380 - 24, y: 24, w: 380, h: 106 },
                    { x: W - 380 - 24, y: 138, w: 380, h: 106 }
                ],
                allyPlates: [
                    { x: 24, y: 160, w: 380, h: 106 },
                    { x: 24, y: 274, w: 380, h: 106 }
                ],
                foeStages: [
                    { x: 700, y: H - 310, capH: 230, capW: 320 },
                    { x: 1010, y: H - 310, capH: 140, capW: 260 }
                ],
                allyStages: [
                    { x: Math.round(W * 0.487), y: H - 312, capH: 300, capW: 360 },
                    { x: 950, y: H - 312, capH: 150, capW: 280 }
                ]
            }
        };
    };

    GanjukoEngine.hpPercent = function(hp, mhp) {
        if (!mhp || mhp <= 0) return 0;
        return Math.max(0, Math.min(100, Math.round((hp / mhp) * 100)));
    };

    GanjukoEngine.hpColor = function(rate) {
        if (rate < 0.25) return "#EF4444"; // red
        if (rate < 0.5) return "#EAB308";  // yellow
        return "#4ADE80";                  // green
    };

    GanjukoEngine.battlerFitScale = function(artW, artH, capW, capH) {
        if (!artW || !artH || artW <= 0 || artH <= 0) return 1;
        return Math.min(1, capH / artH, capW / artW);
    };

    // Extra multiplier that keeps a COMPOSED scale (fit × idle breathing)
    // inside the caps: the wrapped code's breathing animation rides on
    // top of the fit scale and can push the result a few % past the cap,
    // so the cap is re-clamped against the final scale every frame.
    GanjukoEngine.capClampFactor = function(artW, artH, scaleX, scaleY, capW, capH) {
        if (!artW || !artH) return 1;
        return Math.min(1,
            capH / (artH * Math.max(0.0001, Math.abs(scaleY))),
            capW / (artW * Math.max(0.0001, Math.abs(scaleX))));
    };

    // Inverse of the zoom transform for one axis: screen = p + (w - p) * z.
    GanjukoEngine.zoomUnmap = function(canvasCoord, pivot, factor) {
        return pivot + (canvasCoord - pivot) / factor;
    };

    let _p2b_layoutCache = null, _p2b_layoutKey = "";
    const _p2b_layout = function() {
        const w = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxWidth : 1280;
        const h = (typeof Graphics !== "undefined" && Graphics) ? Graphics.boxHeight : 720;
        const key = w + "x" + h;
        if (_p2b_layoutCache && _p2b_layoutKey === key) return _p2b_layoutCache;
        _p2b_layoutKey = key;
        _p2b_layoutCache = GanjukoEngine.battleLayout(w, h);
        return _p2b_layoutCache;
    };

    const _p2b_status = {
        foeHome: false, enemyFit: false, enemyHitReact: false,
        hudProto: false, playerProto: false, switchProto: false,
        fxApply: false, fxTick: false, zoom: false, touch: false
    };
    GanjukoEngine.BATTLE_UI = { status: _p2b_status, layout: _p2b_layout };

    // ---------------------------------------------------------------------
    // P2B.1 Battler art measurement + fit
    // ---------------------------------------------------------------------
    const _p2b_artBoxes = {};
    GanjukoEngine.battlerArtBox = function(bitmap) {
        if (!bitmap || typeof bitmap.isReady !== "function" || !bitmap.isReady()) return null;
        const key = bitmap.url || null;
        if (key && _p2b_artBoxes[key]) return _p2b_artBoxes[key];
        const w = bitmap.width, h = bitmap.height;
        if (!w || !h) return null;
        let box = { left: 0, top: 0, right: w - 1, bottom: h - 1, w: w, h: h, cx: w / 2 };
        try {
            const ctx = bitmap._context || bitmap.context;
            if (ctx) {
                const data = ctx.getImageData(0, 0, w, h).data;
                let top = -1, bottom = -1, left = w, right = -1;
                for (let y = 0; y < h; y++) {
                    const row = y * w * 4;
                    let any = false;
                    for (let x = 0; x < w; x++) {
                        if (data[row + x * 4 + 3] > 10) {
                            any = true;
                            if (x < left) left = x;
                            if (x > right) right = x;
                        }
                    }
                    if (any) { if (top < 0) top = y; bottom = y; }
                }
                if (top >= 0 && right >= left) {
                    box = { left: left, top: top, right: right, bottom: bottom,
                            w: right - left + 1, h: bottom - top + 1, cx: (left + right) / 2 };
                }
            }
        } catch (e) { /* canvas unavailable/tainted: full-canvas box stands */ }
        if (key) _p2b_artBoxes[key] = box;
        return box;
    };

    // Multiply the sprite's current scale by the fit factor, then nudge
    // position so the ART (not the canvas) is centered on the sprite's
    // anchor column and the art's bottom edge sits exactly where the
    // canvas bottom was — i.e. on the stage ground point. All inputs are
    // recomputed by the wrapped stock/Section 7 code every frame, so
    // these additive/multiplicative corrections never accumulate.
    const _p2b_applyArtFit = function(sprite, stage) {
        const bmp = sprite.bitmap;
        if (!bmp || typeof bmp.isReady !== "function" || !bmp.isReady() || !bmp.width) return;
        const box = GanjukoEngine.battlerArtBox(bmp);
        if (!box) return;
        const s = GanjukoEngine.battlerFitScale(box.w, box.h, stage.capW, stage.capH);
        sprite.scale.x *= s;
        sprite.scale.y *= s;
        const clamp = GanjukoEngine.capClampFactor(box.w, box.h, sprite.scale.x, sprite.scale.y, stage.capW, stage.capH);
        if (clamp < 1) {
            sprite.scale.x *= clamp;
            sprite.scale.y *= clamp;
        }
        const ax = (sprite.anchor && typeof sprite.anchor.x === "number") ? sprite.anchor.x : 0.5;
        sprite.x += -(box.cx - ax * bmp.width) * sprite.scale.x;
        sprite.y += (bmp.height - box.bottom - 1) * sprite.scale.y;
    };

    // Foe home: the P2B stage slot (wraps the Section 4 fixed 890/330).
    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype) {
        if (typeof Game_Enemy.prototype.screenX === "function") {
            const _p2b_GE_screenX = Game_Enemy.prototype.screenX;
            Game_Enemy.prototype.screenX = function() {
                try { return _p2b_layout().foeStage.x; }
                catch (e) { return _p2b_GE_screenX.call(this); }
            };
            _p2b_status.foeHome = true;
        }
        if (typeof Game_Enemy.prototype.screenY === "function") {
            const _p2b_GE_screenY = Game_Enemy.prototype.screenY;
            Game_Enemy.prototype.screenY = function() {
                try { return _p2b_layout().foeStage.y; }
                catch (e) { return _p2b_GE_screenY.call(this); }
            };
        }
    }

    // Foe fit: outermost updatePosition wrapper (Section 7's breathing /
    // hover / lunge writes run first, then the fit composes on top).
    if (typeof Sprite_Enemy !== "undefined" && Sprite_Enemy.prototype &&
        typeof Sprite_Enemy.prototype.updatePosition === "function") {
        const _p2b_SE_updatePosition = Sprite_Enemy.prototype.updatePosition;
        Sprite_Enemy.prototype.updatePosition = function() {
            _p2b_SE_updatePosition.call(this);
            try { _p2b_applyArtFit(this, _p2b_layout().foeStage); } catch (e) {}
        };
        _p2b_status.enemyFit = true;
    }

    // Foe hit reaction: shake + red flash while _p2bHitT runs down (the
    // flag is set by the Game_Action.apply hook in P2B.3 at the exact
    // moment damage lands — no result polling, no retrigger).
    if (typeof Sprite_Enemy !== "undefined" && Sprite_Enemy.prototype &&
        typeof Sprite_Enemy.prototype.update === "function") {
        const _p2b_SE_update = Sprite_Enemy.prototype.update;
        Sprite_Enemy.prototype.update = function() {
            _p2b_SE_update.call(this);
            try {
                if (this._p2bHitT > 0) {
                    this._p2bHitT--;
                    const k = this._p2bHitT / 12;
                    this.x += (this._p2bHitT % 2 === 0 ? 6 : -6) * k;
                    this.setBlendColor([255, 110, 110, Math.round(160 * k)]);
                    if (this._p2bHitT === 0) this.setBlendColor([0, 0, 0, 0]);
                }
            } catch (e) {}
        };
        _p2b_status.enemyHitReact = true;
    }

    // ---------------------------------------------------------------------
    // P2B.2 Champions plates (HUD redraw) + private-class prototype capture
    // ---------------------------------------------------------------------
    const _p2b_redrawHud = function(actor, enemy, playerHpRate, enemyHpRate, expRate) {
        const bmp = this.bitmap;
        bmp.clear();
        const L = _p2b_layout();

        // 1. FOE PLATE — static anchor, top-right. Bar + % only.
        if (enemy && enemy.isAlive()) {
            const p = L.foePlate;
            this.drawCardBox(bmp, p.x, p.y, p.w, p.h, "rgba(24, 20, 32, 0.94)", "#F87171");
            const spF = enemy.ganjukoSpecies();
            const typeF = GanjukoEngine.getTypeInfo(spF.type1);

            bmp.fontSize = 20;
            bmp.textColor = "#F87171";
            bmp.drawText("⚔ [FOE]", p.x + 16, p.y + 10, 85, 28, "left");
            bmp.fontSize = 22;
            bmp.textColor = "#FFFFFF";
            // Shrink-to-fit: long names (12+ chars) must not slide under
            // the type badge — reduce the font until the name fits the
            // space in front of the badge (floor 13px).
            const nameF2 = (enemy._isShiny ? "★ " : "") + enemy.name();
            while (bmp.measureTextWidth(nameF2) > 134 && bmp.fontSize > 13) bmp.fontSize -= 1;
            bmp.drawText(nameF2, p.x + 102, p.y + 10, 190, 28, "left");
            bmp.fontSize = 22;
            this.drawTypeBadge(bmp, typeF, p.x + p.w - 160, p.y + 10);
            bmp.fontSize = 20;
            bmp.textColor = "#FACC15";
            bmp.drawText("Lv" + enemy.ganjukoLevel(), p.x + p.w - 80, p.y + 10, 64, 28, "right");

            const dispF = (enemyHpRate !== undefined) ? enemyHpRate
                : Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.mhp)));
            this.drawHpBar(bmp, p.x + 16, p.y + 46, p.w - 32, 20, dispF);

            const rateF = enemy.hp / Math.max(1, enemy.mhp);
            bmp.fontSize = 17;
            bmp.textColor = GanjukoEngine.hpColor(rateF);
            bmp.drawText("HP " + GanjukoEngine.hpPercent(enemy.hp, enemy.mhp) + "%", p.x + 16, p.y + 74, 100, 24, "left");
            this.drawStatusPill(bmp, enemy, p.x + 118, p.y + 74);
            if ($gameSystem.isSpeciesCaught(enemy.ganjukoSpeciesId())) {
                bmp.fontSize = 14;
                bmp.textColor = "#38BDF8";
                bmp.drawText("[CAUGHT]", p.x + 180, p.y + 76, 76, 24, "left");
            }
            if ($gameTemp._isTrainerBattle && $gameTemp._trainerQueue) {
                const rem = 1 + $gameTemp._trainerQueue.length;
                bmp.fontSize = 16;
                bmp.textColor = "#F87171";
                bmp.drawText("Trainer: " + "●".repeat(rem), p.x + 250, p.y + 74, p.w - 266, 24, "right");
            }
        }

        // 2. ALLY PLATE — static anchor, bottom-left. Bar + % only; the
        // EXP row (label + bar on one line) sits fully inside the plate.
        if (actor) {
            const p = L.allyPlate;
            this.drawCardBox(bmp, p.x, p.y, p.w, p.h, "rgba(15, 23, 42, 0.94)", "#38BDF8");
            const spA = actor.ganjukoSpecies();
            const typeA = GanjukoEngine.getTypeInfo(spA.type1);

            bmp.fontSize = 20;
            bmp.textColor = "#38BDF8";
            bmp.drawText("★ [ALLY]", p.x + 16, p.y + 10, 88, 28, "left");
            bmp.fontSize = 22;
            bmp.textColor = "#FFFFFF";
            while (bmp.measureTextWidth(actor.name()) > 128 && bmp.fontSize > 13) bmp.fontSize -= 1;
            bmp.drawText(actor.name(), p.x + 108, p.y + 10, 184, 28, "left");
            bmp.fontSize = 22;
            this.drawTypeBadge(bmp, typeA, p.x + p.w - 160, p.y + 10);
            bmp.fontSize = 20;
            bmp.textColor = "#FACC15";
            bmp.drawText("Lv" + actor.level, p.x + p.w - 80, p.y + 10, 64, 28, "right");

            this.drawEffectivenessBanner(bmp);

            const dispA = (playerHpRate !== undefined) ? playerHpRate
                : Math.max(0, Math.min(1, actor.hp / Math.max(1, actor.mhp)));
            this.drawHpBar(bmp, p.x + 16, p.y + 46, p.w - 32, 20, dispA);

            const rateA = actor.hp / Math.max(1, actor.mhp);
            bmp.fontSize = 17;
            bmp.textColor = GanjukoEngine.hpColor(rateA);
            bmp.drawText("HP " + GanjukoEngine.hpPercent(actor.hp, actor.mhp) + "%", p.x + 16, p.y + 74, 100, 24, "left");
            this.drawStatusPill(bmp, actor, p.x + 118, p.y + 74);
            bmp.fontSize = 16;
            bmp.textColor = "#60A5FA";
            bmp.drawText(`PP ${actor.mp}/${actor.mmp}`, p.x + 180, p.y + 75, 110, 24, "left");
            const partyOrbs = $gameParty.allMembers().map(m => (m.isAlive() ? "●" : "○")).join(" ");
            bmp.fontSize = 16;
            bmp.textColor = "#34D399";
            bmp.drawText(partyOrbs, p.x + 296, p.y + 75, p.w - 312, 24, "right");

            // EXP row: label + bar share one row, fully inside the plate
            // (bar bottom = plate.y + 114, plate is 134 tall).
            const expR = (expRate !== undefined) ? expRate : 0;
            bmp.fontSize = 12;
            bmp.textColor = "#94A3B8";
            bmp.drawText("EXP", p.x + 16, p.y + 103, 34, 16, "left");
            const barX = p.x + 54, barW = p.w - 70;
            bmp.fillRect(barX, p.y + 105, barW, 8, "#0F172A");
            bmp.fillRect(barX + 1, p.y + 106, barW - 2, 6, "#1E293B");
            const fillW = Math.round((barW - 2) * Math.max(0, Math.min(1, expR)));
            if (fillW > 0) {
                bmp.fillRect(barX + 1, p.y + 106, fillW, 6, "#38BDF8");
                bmp.fillRect(barX + 1, p.y + 106, fillW, 2, "rgba(255, 255, 255, 0.5)");
            }
        }
    };

    // Runs after the (wrapped) player sprite update each frame: art fit,
    // then the KO presentation state machine.
    const _p2b_afterPlayerSpriteUpdate = function(sprite) {
        const L = _p2b_layout();
        if (sprite.bitmap) _p2b_applyArtFit(sprite, L.allyStage);
        const actor = (typeof $gameParty !== "undefined" && $gameParty && $gameParty.battleMembers)
            ? $gameParty.battleMembers()[0] : null;
        if (!actor) return;
        if (actor.isAlive()) {
            if (sprite._p2bKoT !== null && sprite._p2bKoT !== undefined) {
                sprite._p2bKoT = null;
                sprite.opacity = 255;
            }
            return;
        }
        // KO: sink + fade over 26 frames instead of an instant vanish.
        if (sprite._p2bKoT === null || sprite._p2bKoT === undefined) sprite._p2bKoT = 0;
        if (sprite._p2bKoT < 26) {
            sprite._p2bKoT++;
            const k = sprite._p2bKoT / 26;
            sprite.visible = true;
            sprite.opacity = Math.round(255 * (1 - k));
            sprite.y += k * 3;
        } else {
            sprite.visible = false;
        }
    };

    let _p2b_playerProtoPatched = false, _p2b_hudProtoPatched = false, _p2b_switchProtoPatched = false;

    const _p2b_patchPlayerProto = function(sprite) {
        if (!sprite) return;
        const L = _p2b_layout();
        // The live instance always takes the new stage anchor, even before
        // the prototype patch lands.
        sprite._baseX = L.allyStage.x;
        sprite._baseY = L.allyStage.y;
        if (_p2b_playerProtoPatched) return;
        const proto = Object.getPrototypeOf(sprite);
        if (!proto || typeof proto.update !== "function") return;
        _p2b_playerProtoPatched = true;
        _p2b_status.playerProto = true;
        const origUpdate = proto.update;
        proto.update = function() {
            origUpdate.call(this);
            try { _p2b_afterPlayerSpriteUpdate(this); } catch (e) {}
        };
        if (typeof proto.initialize === "function") {
            const origInit = proto.initialize;
            proto.initialize = function() {
                origInit.call(this);
                const L2 = _p2b_layout();
                this._baseX = L2.allyStage.x;
                this._baseY = L2.allyStage.y;
            };
        }
    };

    const _p2b_patchHudProto = function(sprite) {
        if (_p2b_hudProtoPatched || !sprite) return;
        const proto = Object.getPrototypeOf(sprite);
        if (!proto || typeof proto.redrawHud !== "function") return;
        _p2b_hudProtoPatched = true;
        _p2b_status.hudProto = true;
        proto.redrawHud = _p2b_redrawHud;
    };

    const _p2b_patchSwitchProto = function(win) {
        if (_p2b_switchProtoPatched || !win) return;
        const proto = Object.getPrototypeOf(win);
        if (!proto || typeof proto.drawItem !== "function") return;
        _p2b_switchProtoPatched = true;
        _p2b_status.switchProto = true;
        proto.drawItem = function(index) {
            const actor = $gameParty.allMembers()[index];
            if (!actor) return;
            const rect = this.itemLineRect(index);
            const sp = actor.ganjukoSpecies();
            const typeInfo = GanjukoEngine.getTypeInfo(sp.type1);
            const enabled = index > 0 && actor.isAlive();
            this.changePaintOpacity(enabled);
            const tag = index === 0 ? "[ACTIVE] " : (actor.isDead() ? "[FAINTED] " : "");
            this.resetTextColor();
            this.drawText(`${tag}${actor.name()} Lv${actor.level}`, rect.x, rect.y, 240, "left");
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(`[${typeInfo.name}]`, rect.x + 245, rect.y, 90, "left");
            // HP rule: percentage only, colored like the plates.
            this.changeTextColor(GanjukoEngine.hpColor(actor.hp / Math.max(1, actor.mhp)));
            this.drawText("HP " + GanjukoEngine.hpPercent(actor.hp, actor.mhp) + "%", rect.x + 340, rect.y, rect.width - 345, "right");
            this.resetTextColor();
            this.changePaintOpacity(1);
        };
    };

    if (typeof Spriteset_Battle !== "undefined" && Spriteset_Battle.prototype &&
        typeof Spriteset_Battle.prototype.createLowerLayer === "function") {
        const _p2b_SB_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer;
        Spriteset_Battle.prototype.createLowerLayer = function() {
            _p2b_SB_createLowerLayer.call(this);
            try {
                if (this._playerGanjukoSprite) _p2b_patchPlayerProto(this._playerGanjukoSprite);
                if (this._ganjukoHudSprite) _p2b_patchHudProto(this._ganjukoHudSprite);
            } catch (e) {}
        };
    }

    if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype &&
        typeof Scene_Battle.prototype.createAllWindows === "function") {
        const _p2b_SB_createAllWindows = Scene_Battle.prototype.createAllWindows;
        Scene_Battle.prototype.createAllWindows = function() {
            _p2b_SB_createAllWindows.call(this);
            try {
                if (this._ganjukoSwitchWindow) _p2b_patchSwitchProto(this._ganjukoSwitchWindow);
            } catch (e) {}
        };
    }

    // ---------------------------------------------------------------------
    // P2B.3 Battle FX: impact bursts, foe hit reaction trigger, player
    // damage popups, sprite housekeeping
    // ---------------------------------------------------------------------
    const _p2b_impactBitmapCache = {};
    const _p2b_impactBitmap = function(color) {
        if (_p2b_impactBitmapCache[color]) return _p2b_impactBitmapCache[color];
        const bmp = new Bitmap(160, 160);
        try {
            const ctx = bmp._context || bmp.context;
            if (ctx) {
                const g = ctx.createRadialGradient(80, 80, 4, 80, 80, 78);
                g.addColorStop(0, "rgba(255,255,255,0.95)");
                g.addColorStop(0.25, color);
                g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(80, 80, 78, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(80, 80, 60, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "rgba(255,255,255,0.85)";
                ctx.lineWidth = 4;
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(80 + Math.cos(a) * 28, 80 + Math.sin(a) * 28);
                    ctx.lineTo(80 + Math.cos(a) * 72, 80 + Math.sin(a) * 72);
                    ctx.stroke();
                }
                const bt = bmp._baseTexture || bmp.baseTexture;
                if (bt && typeof bt.update === "function") bt.update();
            }
        } catch (e) {}
        _p2b_impactBitmapCache[color] = bmp;
        return bmp;
    };

    const _p2b_spawnImpact = function(target, elementId, big) {
        const scene = (typeof SceneManager !== "undefined") ? SceneManager._scene : null;
        if (!scene || !scene._spriteset || !scene._spriteset._battleField) return;
        const ss = scene._spriteset;
        let ts = null;
        if (target.isActor()) ts = ss._playerGanjukoSprite;
        else ts = (ss._enemySprites && ss._enemySprites[0]) || null;
        if (!ts) return;
        const typeInfo = GanjukoEngine.getTypeInfo(Math.max(1, elementId || 1));
        const spr = new Sprite(_p2b_impactBitmap(typeInfo.color || "#FFFFFF"));
        spr.anchor.set(0.5, 0.5);
        spr.x = ts.x;
        spr.y = ts.y - (target.isActor() ? 120 : 105);
        spr._p2bT = 0;
        spr._p2bBig = !!big;
        const protoUpdate = Sprite.prototype.update;
        spr.update = function() {
            protoUpdate.call(this);
            this._p2bT++;
            const t = this._p2bT / 16;
            const s = (this._p2bBig ? 2.3 : 1.55) * (0.45 + 0.75 * t);
            this.scale.set(s, s);
            this.opacity = Math.round(255 * (1 - t));
            this.rotation = 0.25 * t;
            if (this._p2bT >= 16) {
                if (this.parent) this.parent.removeChild(this);
                this.destroy();
            }
        };
        ss._battleField.addChild(spr);
        (ss._p2bImpacts = ss._p2bImpacts || []).push({
            spr: spr, born: (typeof Graphics !== "undefined") ? Graphics.frameCount : 0
        });
    };

    if (typeof Game_Action !== "undefined" && Game_Action.prototype &&
        typeof Game_Action.prototype.apply === "function") {
        const _p2b_Game_Action_apply = Game_Action.prototype.apply;
        Game_Action.prototype.apply = function(target) {
            _p2b_Game_Action_apply.call(this, target);
            try {
                if (!target || typeof target.result !== "function") return;
                const result = target.result();
                if (!result || !result.hpAffected || !(result.hpDamage > 0)) return;
                const item = (typeof this.item === "function") ? this.item() : null;
                const elementId = (item && item.damage) ? item.damage.elementId : 1;
                _p2b_spawnImpact(target, elementId, !!(target.isDead && target.isDead()));
                if (!target.isActor()) {
                    const scene = (typeof SceneManager !== "undefined") ? SceneManager._scene : null;
                    const ss = scene && scene._spriteset;
                    const es = ss && ss._enemySprites && ss._enemySprites[0];
                    if (es) es._p2bHitT = 12;
                }
            } catch (e) {}
        };
        _p2b_status.fxApply = true;
    }

    // Per-frame battle FX housekeeping. Runs OUTSIDE the Section 17
    // battler-shadow sync, so shadows already read settled positions.
    const _p2b_battleFxTick = function(ss) {
        // Player-side damage popups: the lead has no Sprite_Battler in
        // front view, so stock MZ sets the popup request flag and nobody
        // ever renders or clears it. Consume it here.
        const actor = (typeof $gameParty !== "undefined" && $gameParty && $gameParty.battleMembers)
            ? $gameParty.battleMembers()[0] : null;
        const ps = ss._playerGanjukoSprite;
        if (actor && ps && typeof actor.isDamagePopupRequested === "function" &&
            actor.isDamagePopupRequested()) {
            actor.clearDamagePopup();
            const r = (typeof actor.result === "function") ? actor.result() : null;
            if (r && (r.hpAffected || r.missed || r.evaded) && typeof Sprite_Damage !== "undefined") {
                const dmg = new Sprite_Damage();
                dmg.x = ps.x;
                dmg.y = ps.y - 170;
                dmg.setup(actor);
                ss._battleField.addChild(dmg);
                (ss._p2bDamages = ss._p2bDamages || []).push(dmg);
            }
        }
        if (ss._p2bDamages && ss._p2bDamages.length) {
            ss._p2bDamages = ss._p2bDamages.filter(d => {
                if (d && typeof d.isPlaying === "function" && d.isPlaying()) return true;
                if (d && d.parent) d.parent.removeChild(d);
                if (d && typeof d.destroy === "function") d.destroy();
                return false;
            });
        }
        // Impact bursts remove themselves at 16 frames; this sweep is the
        // backstop if a burst's update ever stops being reached.
        if (ss._p2bImpacts && ss._p2bImpacts.length) {
            const now = (typeof Graphics !== "undefined") ? Graphics.frameCount : 0;
            ss._p2bImpacts = ss._p2bImpacts.filter(rec => {
                if (rec.spr && rec.spr.parent && now - rec.born <= 24) return true;
                if (rec.spr && rec.spr.parent) {
                    rec.spr.parent.removeChild(rec.spr);
                    rec.spr.destroy();
                }
                return false;
            });
        }
    };

    if (typeof Spriteset_Battle !== "undefined" && Spriteset_Battle.prototype &&
        typeof Spriteset_Battle.prototype.update === "function") {
        const _p2b_SB_update = Spriteset_Battle.prototype.update;
        Spriteset_Battle.prototype.update = function() {
            _p2b_SB_update.call(this);
            try { _p2b_battleFxTick(this); } catch (e) {}
        };
        _p2b_status.fxTick = true;
    }

    // ---------------------------------------------------------------------
    // P2B.4 Camera zoom 1.5x (overworld) + touch correction
    // ---------------------------------------------------------------------
    GanjukoEngine.ZOOM = { factor: 1.5, enabled: true, disabled: false, pivot: { x: 640, y: 336 } };
    if (typeof window !== "undefined") {
        window.GanjukoZoom = {
            factor: GanjukoEngine.ZOOM.factor,
            setEnabled: function(b) { GanjukoEngine.ZOOM.enabled = !!b; },
            isEnabled: function() { return GanjukoEngine.ZOOM.enabled && !GanjukoEngine.ZOOM.disabled; },
            pivot: function() { return { x: GanjukoEngine.ZOOM.pivot.x, y: GanjukoEngine.ZOOM.pivot.y }; }
        };
    }

    const _p2b_applyZoom = function(spriteset) {
        const Z = GanjukoEngine.ZOOM;
        const base = spriteset._baseSprite;
        if (!base) return;
        if (!Z.enabled || Z.disabled) {
            if (base.scale.x !== 1 || base.scale.y !== 1) {
                base.scale.set(1, 1);
                base.position.set(0, 0);
            }
            Z.pivot.x = (typeof Graphics !== "undefined") ? Graphics.boxWidth / 2 : 640;
            Z.pivot.y = (typeof Graphics !== "undefined") ? Graphics.boxHeight / 2 : 360;
            return;
        }
        const player = (typeof $gamePlayer !== "undefined") ? $gamePlayer : null;
        if (!player || typeof player.screenX !== "function") return;
        const px = player.screenX();
        const py = player.screenY() - 24; // pivot at the player's mid-body
        Z.pivot.x = px;
        Z.pivot.y = py;
        const z = Z.factor;
        base.scale.set(z, z);
        base.position.set(Math.round(px * (1 - z)), Math.round(py * (1 - z)));
    };

    if (typeof Spriteset_Map !== "undefined" && Spriteset_Map.prototype &&
        typeof Spriteset_Map.prototype.update === "function") {
        const _p2b_SM_update = Spriteset_Map.prototype.update;
        Spriteset_Map.prototype.update = function() {
            _p2b_SM_update.call(this);
            try { _p2b_applyZoom(this); }
            catch (e) { GanjukoEngine.ZOOM.disabled = true; } // self-disable, Section 17 discipline
        };
        _p2b_status.zoom = true;
    }

    if (typeof Game_Map !== "undefined" && Game_Map.prototype &&
        typeof Game_Map.prototype.canvasToMapX === "function" &&
        typeof Game_Map.prototype.canvasToMapY === "function") {
        const _p2b_c2mX = Game_Map.prototype.canvasToMapX;
        Game_Map.prototype.canvasToMapX = function(x) {
            const Z = GanjukoEngine.ZOOM;
            const cx = (Z.enabled && !Z.disabled) ? GanjukoEngine.zoomUnmap(x, Z.pivot.x, Z.factor) : x;
            return _p2b_c2mX.call(this, cx);
        };
        const _p2b_c2mY = Game_Map.prototype.canvasToMapY;
        Game_Map.prototype.canvasToMapY = function(y) {
            const Z = GanjukoEngine.ZOOM;
            const cy = (Z.enabled && !Z.disabled) ? GanjukoEngine.zoomUnmap(y, Z.pivot.y, Z.factor) : y;
            return _p2b_c2mY.call(this, cy);
        };
        _p2b_status.touch = true;
    }


// =============================================================================
// SECTION P2C — AREA ENCOUNTERS + EVOLUTION-STAGE GATING + FOLLOWER SHEET
// SYSTEM (Engine Pass 2, sub-pass C)
// =============================================================================
// What this section does:
//
// 1. AREA ENCOUNTERS. Wild encounters on the ten mapped areas no longer
//    draw from the old global species 1-12 clamp: each area rolls its own
//    themed table from work/AREA-ENCOUNTERS.md in two stages — a
//    1,000-point tier roll (Common 600 / Uncommon 270 / Rare 99 /
//    Mythic 1 / quiet 30, quiet re-rolls) then a weighted species roll
//    inside the tier. Maps with no table keep the legacy behavior.
//    Encounter RATE is per-area too, via a multiplier on the map's
//    encounterStep (Route 1's base step of 12 meant a wild battle every
//    ~6 grass steps — the "spawn rate way too high" Rene hit; Route 1
//    now runs a 3.5x step, the gentlest rate in the game).
//
//    Route 1 deviations from the design doc, per Rene's directives
//    (gentlest fights in the game + opening areas draw stage-1 only):
//    level caps softened (commons max 4, uncommons max 4, Embit max 4,
//    Tideclaw 3-5) and the mythic slot is Zephyrhornkit (pos 43, stage 1,
//    Volt, Lv 4-5) instead of Raibunny — Raibunny is a stage-2 species at
//    the stage-1 BST band ceiling (215), the hardest legal early roll,
//    and Rene's stage gate bars stage-2+ from Route 1 entirely. Raibunny
//    remains earnable the intended way: evolve Bunspark.
//
// 2. EVOLUTION-STAGE GATING. Every species is tagged with its evolution
//    stage, computed at runtime from the evolveTo chains (stage counts
//    reproduce the design audit exactly: 224 stage-1 / 176 stage-2 /
//    104 stage-3). Each area has a max stage for its regular tiers —
//    the gate codifies the tables' own compartmentalization (stage-2
//    appears from the Cavern on, stage-3 regulars only on Victory Road)
//    and filters any future over-stage table entry at roll time. The
//    per-area MYTHIC slot is a designer-placed signature sighting
//    (1-in-1,000) and is exempt from the gate — EXCEPT on Route 1, where
//    Rene's stage-1-only rule for opening areas is explicit.
//
// 3. RADIANT WANDERER. After the tier roll, on Map023 (Astral Plateau)
//    only, with 4+ badges: a 1-in-10,000 roll replaces the encounter
//    with Solgoddess (pos 490) at Lv 40.
//
// 4. FOLLOWER SHEET SYSTEM. The follower must render the lead's OWN walk
//    sheet. Root cause of Rene's mismatch: three species' walk sheets
//    were drawn under abandoned pre-rename identities (Bubblix's sheet
//    was a dark fox "Aquafox", Florabit's a green pup "Leafpup",
//    Bunspark's a dragon "Sparklet") — different creatures from their
//    battlers. Those three sheets were regenerated from their own
//    battler masters and now live under the canonical names; their
//    species records were repointed to match. The resolver below makes
//    the contract structural: walkSheetFor(pos) derives the sheet from
//    the species' own name ("$Ganjuko_<Name>_Walk"), the follower and
//    the actor's character image both resolve through it, a deviating
//    record is logged loudly (never silently used), and there is NO
//    fallback to another species' sheet — the old code fell back to
//    "$Ganjuko_Embit_Walk", an Embit following every trainer. A species
//    that cannot resolve is excluded from following (follower hidden)
//    and the exclusion is recorded on GanjukoEngine.FOLLOWER_EXCLUSIONS.
// =============================================================================
(function() {
    "use strict";
    if (typeof GanjukoEngine === "undefined") return;
    const GE = GanjukoEngine;
    const _p2c_status = { stages: false, encounterStep: false, updateEncounter: false, follower: false, speciesImage: false };

    // ---------------------------------------------------------------------
    // P2C.0 Evolution-stage tagging (lazy; from the live species data)
    // ---------------------------------------------------------------------
    let _p2c_stageCache = null;
    function _p2c_buildStages() {
        const total = 504;
        const idToPos = {};
        const records = [];
        for (let pos = 1; pos <= total; pos++) {
            const sp = GE.getSpecies ? GE.getSpecies(pos) : null;
            if (!sp) return null;
            records[pos] = sp;
            if (sp.id != null) idToPos[sp.id] = pos;
        }
        const preds = {};
        for (let pos = 1; pos <= total; pos++) {
            const sp = records[pos];
            if (sp.evolveTo) {
                const t = idToPos[sp.evolveTo];
                if (t) (preds[t] = preds[t] || []).push(pos);
            }
        }
        const memo = {};
        const stageOf = (pos, depth) => {
            if (memo[pos]) return memo[pos];
            if (depth > 8) return 1; // cycle guard; chains are depth <= 3 in the data
            const ps = preds[pos] || [];
            const s = ps.length === 0 ? 1 : 1 + Math.max(...ps.map(p => stageOf(p, depth + 1)));
            memo[pos] = s;
            return s;
        };
        const out = {};
        for (let pos = 1; pos <= total; pos++) out[pos] = stageOf(pos, 0);
        return out;
    }
    GE.speciesStage = function(pos) {
        if (!_p2c_stageCache) {
            try { _p2c_stageCache = _p2c_buildStages(); } catch (e) { _p2c_stageCache = null; }
            if (_p2c_stageCache) _p2c_status.stages = true;
        }
        if (!_p2c_stageCache) return 1; // data not ready: gate passes (roll still table-driven)
        return _p2c_stageCache[pos] || 1;
    };

    // ---------------------------------------------------------------------
    // P2C.1 Area tables (work/AREA-ENCOUNTERS.md; Route 1 softened, above)
    // ---------------------------------------------------------------------
    const E = (speciesPos, weight, minLv, maxLv) => ({ speciesPos, weight, minLv, maxLv });
    const AREA_TABLES = {
        3: { // Route 1 — Kaze Trail (SOFTENED: see header)
            tiers: {
                common: [E(10, 30, 2, 4), E(14, 30, 2, 4), E(7, 20, 2, 4), E(12, 20, 2, 4)],
                uncommon: [E(16, 55, 3, 4), E(4, 45, 3, 4)],
                rare: [E(1, 50, 3, 4), E(19, 50, 3, 5)]
            },
            mythic: { speciesPos: 43, minLv: 4, maxLv: 5 } // Zephyrhornkit (doc: Raibunny — substituted, see header)
        },
        7: { // Route 2 — Zephyr Coast (verbatim)
            tiers: {
                common: [E(19, 30, 4, 7), E(21, 25, 5, 8), E(14, 25, 4, 7), E(10, 20, 4, 6)],
                uncommon: [E(12, 50, 5, 8), E(64, 50, 5, 8)],
                rare: [E(280, 55, 6, 8), E(16, 45, 6, 8)]
            },
            mythic: { speciesPos: 65, minLv: 9, maxLv: 11 }
        },
        8: { // Obsidian Cavern Mines (verbatim)
            tiers: {
                common: [E(16, 30, 8, 11), E(22, 25, 8, 11), E(24, 25, 9, 12), E(73, 20, 9, 12)],
                uncommon: [E(17, 55, 10, 13), E(106, 45, 10, 13)],
                rare: [E(235, 40, 11, 13), E(28, 30, 11, 13), E(46, 30, 11, 13)]
            },
            mythic: { speciesPos: 237, minLv: 13, maxLv: 15 }
        },
        11: { // Route 3 — Thunder Meadow (verbatim)
            tiers: {
                common: [E(10, 30, 10, 13), E(12, 30, 10, 13), E(14, 20, 10, 13), E(70, 20, 11, 14)],
                uncommon: [E(43, 50, 12, 15), E(205, 50, 12, 15)],
                rare: [E(151, 40, 13, 15), E(97, 35, 13, 15), E(124, 25, 13, 15)]
            },
            mythic: { speciesPos: 153, minLv: 15, maxLv: 17 }
        },
        15: { // Route 4 — Verdant Canopy (verbatim)
            tiers: {
                common: [E(7, 30, 14, 17), E(40, 25, 14, 17), E(202, 25, 15, 18), E(67, 20, 15, 18)],
                uncommon: [E(8, 55, 16, 19), E(94, 45, 16, 19)],
                rare: [E(256, 40, 17, 19), E(283, 35, 17, 19), E(409, 25, 17, 19)]
            },
            mythic: { speciesPos: 69, minLv: 19, maxLv: 21 }
        },
        17: { // Route 5 — Scorched Pass (verbatim)
            tiers: {
                common: [E(1, 25, 18, 21), E(34, 25, 18, 21), E(88, 25, 19, 22), E(223, 25, 19, 22)],
                uncommon: [E(2, 50, 20, 23), E(115, 50, 20, 23)],
                rare: [E(169, 40, 21, 24), E(142, 35, 21, 24), E(250, 25, 21, 24)]
            },
            mythic: { speciesPos: 117, minLv: 24, maxLv: 26 }
        },
        19: { // Route 6 — Skyward Ridge (verbatim)
            tiers: {
                common: [E(14, 30, 22, 25), E(76, 25, 22, 25), E(265, 25, 23, 26), E(103, 20, 23, 26)],
                uncommon: [E(49, 50, 24, 27), E(361, 50, 24, 27)],
                rare: [E(15, 45, 25, 28), E(157, 30, 25, 28), E(184, 25, 25, 28)]
            },
            mythic: { speciesPos: 78, minLv: 28, maxLv: 30 }
        },
        21: { // Route 7 — Gloom Mire (verbatim; night weight shifts in P2C.2)
            tiers: {
                common: [E(22, 30, 26, 29), E(24, 25, 26, 29), E(214, 25, 27, 30), E(187, 20, 27, 30)],
                uncommon: [E(52, 50, 28, 31), E(160, 50, 28, 31)],
                rare: [E(106, 40, 29, 32), E(322, 35, 29, 32), E(295, 25, 30, 32)]
            },
            mythic: { speciesPos: 54, minLv: 32, maxLv: 34 }
        },
        23: { // Route 8 — Astral Plateau (verbatim; night Rare-share raise in P2C.2)
            tiers: {
                common: [E(26, 30, 30, 34), E(136, 25, 30, 34), E(190, 25, 31, 35), E(244, 20, 31, 35)],
                uncommon: [E(163, 50, 33, 37), E(55, 50, 33, 37)],
                rare: [E(109, 40, 35, 38), E(325, 35, 35, 38), E(27, 25, 36, 38)]
            },
            mythic: { speciesPos: 57, minLv: 38, maxLv: 40 }
        },
        25: { // Victory Road Labyrinth (verbatim)
            tiers: {
                common: [E(35, 25, 38, 43), E(32, 25, 38, 43), E(17, 25, 39, 44), E(8, 25, 39, 44)],
                uncommon: [E(15, 50, 41, 46), E(27, 50, 41, 46)],
                rare: [E(33, 40, 43, 48), E(174, 35, 43, 48), E(222, 25, 44, 48)]
            },
            mythic: { speciesPos: 165, minLv: 46, maxLv: 50 }
        }
    };
    // Max evolution stage admitted to an area's REGULAR tiers (mythic exempt, see header).
    const AREA_MAX_STAGE = { 3: 1, 7: 1, 8: 2, 11: 1, 15: 2, 17: 2, 19: 2, 21: 1, 23: 2, 25: 3 };
    // Per-area encounterStep multipliers (rate): Route 1 gentlest in the game.
    // FR4 QA-D22 pacing: Route 1 (Map003, base step 12) 3.5 -> 6.0 = counter 72
    // (~36 bush steps between battles); Route 2 (Map007, base step 14)
    // 2.3 -> 4.6 = counter ~64 (~32 bush steps). Cadence only, not battle math.
    const AREA_STEP_MULT = { 3: 6.0, 7: 4.6, 8: 2.5, 11: 2.5, 15: 1.0, 17: 1.0, 19: 1.0, 21: 1.0, 23: 1.0, 25: 0.87 };
    // Route 7 night variants: within-tier weight overrides by speciesPos.
    const NIGHT_WEIGHT_SHIFTS = { 21: { common: { 22: 40, 24: 35 }, rare: { 106: 50 } } };
    const RADIANT = { speciesPos: 490, probability: 0.0001, homeMapId: 23, minBadges: 4, level: 40 };

    function _p2c_isNight(opts) {
        if (opts && typeof opts.isNight === "boolean") return opts.isNight;
        try {
            return typeof GE.getTimeOfDay === "function" && GE.getTimeOfDay().name === "NIGHT";
        } catch (e) { return false; }
    }
    function _p2c_badges(opts) {
        if (opts && typeof opts.badges === "number") return opts.badges;
        try {
            if (typeof $gameSystem !== "undefined" && $gameSystem && typeof $gameSystem.badges === "function") {
                return $gameSystem.badges().length;
            }
        } catch (e) {}
        return 0;
    }

    // The gated species pool for one tier of one area (night shifts applied).
    GE.areaTierPool = function(mapId, tier, isNight) {
        const table = AREA_TABLES[mapId];
        if (!table) return [];
        if (tier === "mythic") {
            if (!table.mythic) return [];
            // Route 1's mythic obeys the stage-1 rule like every other slot.
            if (mapId === 3 && GE.speciesStage(table.mythic.speciesPos) > AREA_MAX_STAGE[3]) return [];
            return [table.mythic];
        }
        const list = (table.tiers[tier] || []);
        const maxStage = AREA_MAX_STAGE[mapId] || 3;
        let pool = list.filter(en => GE.speciesStage(en.speciesPos) <= maxStage);
        if (isNight && NIGHT_WEIGHT_SHIFTS[mapId] && NIGHT_WEIGHT_SHIFTS[mapId][tier]) {
            const shift = NIGHT_WEIGHT_SHIFTS[mapId][tier];
            pool = pool.map(en => shift[en.speciesPos] ? { speciesPos: en.speciesPos, weight: shift[en.speciesPos], minLv: en.minLv, maxLv: en.maxLv } : en);
        }
        return pool;
    };

    // Two-stage roll. Returns { speciesPos, level, tier } or null (no table).
    GE.rollAreaEncounter = function(mapId, opts) {
        opts = opts || {};
        const table = AREA_TABLES[mapId];
        if (!table) return null;
        const rng = typeof opts.rng === "function" ? opts.rng : Math.random;
        const night = _p2c_isNight(opts);
        // Tier points (Route 8 at night: Rare share rises 99 -> 120).
        let pCommon = 600, pUncommon = 270, pRare = 99;
        if (night && mapId === 23) { pCommon = 579; pRare = 120; }
        const pMythic = 1; // + 30 quiet (re-roll) = 1,000
        let tier = null;
        for (let guard = 0; guard < 64 && !tier; guard++) {
            const r = Math.floor(rng() * 1000);
            if (r < pCommon) tier = "common";
            else if (r < pCommon + pUncommon) tier = "uncommon";
            else if (r < pCommon + pUncommon + pRare) tier = "rare";
            else if (r < pCommon + pUncommon + pRare + pMythic) tier = "mythic";
            // else: quiet band — re-roll
        }
        if (!tier) tier = "common";
        let pool = GE.areaTierPool(mapId, tier, night);
        if (pool.length === 0 && tier !== "common") {
            tier = "common";
            pool = GE.areaTierPool(mapId, "common", night);
        }
        if (pool.length === 0) return null;
        let picked;
        if (tier === "mythic") {
            picked = pool[0];
        } else {
            const totalW = pool.reduce((s, en) => s + en.weight, 0);
            let roll = rng() * totalW;
            picked = pool[pool.length - 1];
            for (const en of pool) {
                roll -= en.weight;
                if (roll < 0) { picked = en; break; }
            }
        }
        const level = picked.minLv + Math.floor(rng() * (picked.maxLv - picked.minLv + 1));
        let result = { speciesPos: picked.speciesPos, level, tier };
        // Radiant Wanderer: rolled after the tier roll, Map023 + 4 badges only.
        if (mapId === RADIANT.homeMapId && _p2c_badges(opts) >= RADIANT.minBadges && rng() < RADIANT.probability) {
            result = { speciesPos: RADIANT.speciesPos, level: RADIANT.level, tier: "radiant" };
        }
        return result;
    };

    // ---------------------------------------------------------------------
    // P2C.2 Encounter rate (per-area encounterStep multiplier)
    // ---------------------------------------------------------------------
    if (typeof Game_Map !== "undefined" && Game_Map.prototype) {
        const _p2c_encounterStep = Game_Map.prototype.encounterStep;
        Game_Map.prototype.encounterStep = function() {
            const base = typeof _p2c_encounterStep === "function" ? _p2c_encounterStep.call(this) : 30;
            const mult = AREA_STEP_MULT[this.mapId()];
            return mult ? Math.max(1, Math.round(base * mult)) : base;
        };
        _p2c_status.encounterStep = true;
    }

    // ---------------------------------------------------------------------
    // P2C.3 Encounter integration (tabled maps roll the area system;
    //       every other map keeps the legacy behavior untouched)
    // ---------------------------------------------------------------------
    if (typeof Scene_Map !== "undefined" && Scene_Map.prototype &&
        typeof Scene_Map.prototype.updateEncounter === "function") {
        const _p2c_prevUpdateEncounter = Scene_Map.prototype.updateEncounter;
        Scene_Map.prototype.updateEncounter = function() {
            if (!AREA_TABLES[$gameMap.mapId()]) {
                _p2c_prevUpdateEncounter.call(this);
                return;
            }
            if ($gamePlayer.executeEncounter()) {
                let rolled = null;
                try { rolled = GE.rollAreaEncounter($gameMap.mapId(), {}); } catch (e) { rolled = null; }
                if (rolled) {
                    GE.startWildBattle(rolled.speciesPos, rolled.level, true);
                    return;
                }
                // Defensive fallback (unreachable with the shipped tables —
                // the gated common pool is never empty): the legacy pick,
                // inlined because executeEncounter is already consumed.
                const troopId = $gamePlayer.makeEncounterTroopId();
                const speciesId = Math.min(Math.max(troopId, 1), 12);
                const level = 2 + Math.randomInt(4);
                GE.startWildBattle(speciesId, level, true);
            }
        };
        _p2c_status.updateEncounter = true;
    }

    // ---------------------------------------------------------------------
    // P2C.4 Follower sheet system (canonical resolver; no silent fallback)
    // ---------------------------------------------------------------------
    GE.FOLLOWER_EXCLUSIONS = [];
    GE._walkSheetWarnings = [];
    GE.walkSheetFor = function(speciesPos) {
        const sp = GE.getSpecies ? GE.getSpecies(speciesPos) : null;
        if (!sp || !sp.name) {
            if (!GE.FOLLOWER_EXCLUSIONS.includes(speciesPos)) GE.FOLLOWER_EXCLUSIONS.push(speciesPos);
            return null;
        }
        const canonical = "$Ganjuko_" + sp.name + "_Walk";
        if (sp.characterName && sp.characterName !== canonical && !GE._walkSheetWarnings.includes(speciesPos)) {
            GE._walkSheetWarnings.push(speciesPos);
            if (typeof console !== "undefined" && console.warn) {
                console.warn("[Ganjuko] species " + speciesPos + " (" + sp.name + ") record characterName '" +
                    sp.characterName + "' deviates from its canonical walk sheet '" + canonical +
                    "'; the canonical sheet is used.");
            }
        }
        return canonical;
    };

    if (typeof Game_Follower !== "undefined" && Game_Follower.prototype) {
        Game_Follower.prototype.refresh = function() {
            const actor = typeof this.actor === "function" ? this.actor() : null;
            if (!actor) { this.setImage("", 0); return; }
            let sheet = null;
            try { sheet = GE.walkSheetFor(actor.ganjukoSpeciesId()); } catch (e) { sheet = null; }
            if (sheet) { this.setImage(sheet, 0); return; }
            // Unresolvable species: excluded from following, recorded —
            // never another species' sheet.
            this.setImage("", 0);
        };
        _p2c_status.follower = true;
    }
    if (typeof Game_Actor !== "undefined" && Game_Actor.prototype &&
        typeof Game_Actor.prototype.setGanjukoSpecies === "function") {
        const _p2c_setSpecies = Game_Actor.prototype.setGanjukoSpecies;
        Game_Actor.prototype.setGanjukoSpecies = function(speciesId) {
            _p2c_setSpecies.call(this, speciesId);
            try {
                const sheet = GE.walkSheetFor(speciesId);
                if (sheet) this.setCharacterImage(sheet, 0);
            } catch (e) {}
        };
        _p2c_status.speciesImage = true;
    }

    GE.AREA_ENCOUNTERS = {
        tables: AREA_TABLES,
        maxStage: AREA_MAX_STAGE,
        stepMult: AREA_STEP_MULT,
        radiant: RADIANT,
        status: _p2c_status
    };
})();

// =============================================================================
// SECTION P3 — TUTORIAL-THROUGH-GAMEPLAY (Engine Pass 3, 2026-11-02)
// =============================================================================
// Rene's spec: the opening teaches THROUGH PLAY, not menus.
//   1. GUIDED FIRST BATTLE — the first battle of a save (whichever battle
//      comes first — the trigger is game STATE, not an event) gets short
//      in-battle coaching: how to pick a move, what the HP % means, and a
//      type-effectiveness note on the player's own first damaging move.
//      Save-flagged: it can never fire twice on one save.
//   2. FREE BEAT — deliberately nothing. After the guided battle the game
//      is just the game until Route 1.
//   3. CAPTURE LESSON — the first natural wild encounter on Route 1
//      (Map003) after the guided battle is staged as a teaching catch:
//      the gentlest legal target from Route 1's own area table (highest
//      catchRate stage-1 species — Galewing), real Orb mechanics, real
//      inventory (3 Orbs granted only if the player holds none), coaching
//      to weaken first, encouragement on break-free. The lesson completes
//      on the catch; a KO or a defeat simply re-arms it for the next
//      Route 1 encounter — it can never soft-lock.
//   Plus the identity fix's engine half lives with the intro scene above
//   (starter showcase now shows Bubblix / Florabit); the Lab half is in
//   data/Map002.json (orb events hand out and display the right species).
//
// Save state: $gameSystem._ganjukoTutorial = { battle: 0|1, capture: 0|2,
// v: 1 }. capture 0 = lesson pending, 2 = done. Mid-battle lesson state is
// per-battle, in $gameTemp. Legacy saves (state absent) are decided ONCE
// by GE.P3.evaluateLegacy(): progressed saves (any badge / party beyond
// the starter / caught > 1 / any member Lv>=10 / long playtime) and
// opening-less states (rigs, dev states) resolve to COMPLETE silently;
// a starter-chosen but otherwise fresh save arms the tutorial normally.
//
// Safety contract (Section 16/17 discipline): every install is
// feature-tested and try/catch guarded; every wrapper calls the stored
// original; a failure anywhere in P3 degrades to "no tutorial", never to
// a broken battle. GE.P3.status reports which hooks installed.
// =============================================================================
(function() {
    "use strict";
    if (typeof GanjukoEngine === "undefined") return;
    const GE = GanjukoEngine;

    const _p3_status = {
        stateApi: false, newGameHook: false, setupHook: false,
        stagingHook: false, inputHook: false, applyHook: false,
        logHook: false, endHook: false, sceneHooks: false
    };

    const P3 = {};
    GE.P3 = P3;
    P3.status = _p3_status;
    P3.ROUTE1_MAP_ID = 3;
    P3.ORB_ITEM_ID = 1;          // $dataItems[1] "Ganjuko Orb" (<GanjukoOrb: 1.0>)
    P3.ORB_GRANT = 3;
    P3.WEAKEN_PCT = 0.6;         // foe at/below this HP fraction -> BAG beat
    P3.AUTO_ADVANCE_FRAMES = 480;

    // ---------------------------------------------------------------------
    // P3.0 Save state + legacy heuristic
    // ---------------------------------------------------------------------
    function _p3_playtimeSeconds() {
        try {
            if (typeof $gameSystem === "undefined" || !$gameSystem) return null;
            if (typeof $gameSystem._playtime === "number") {
                // Conservative read: if the counter is frames, /60 gives
                // seconds; if it is already seconds this only understates
                // progress, which can never wrongly skip a tutorial.
                return Math.floor($gameSystem._playtime / 60);
            }
        } catch (e) {}
        return null;
    }

    P3.isProgressed = function() {
        try {
            if (typeof $gameSystem === "undefined" || !$gameSystem) return true;
            if (typeof $gameSystem.badges === "function" && $gameSystem.badges().length > 0) return true;
            if (typeof $gameSystem.caughtCount === "function" && $gameSystem.caughtCount() > 1) return true;
            if (typeof $gameParty !== "undefined" && $gameParty && typeof $gameParty.allMembers === "function") {
                const members = $gameParty.allMembers();
                if (members.length > 1) return true;
                for (const m of members) {
                    if (m && typeof m.level === "number" && m.level >= 10) return true;
                }
            }
            const secs = _p3_playtimeSeconds();
            if (secs != null && secs >= 1200) return true;
        } catch (e) {}
        return false;
    };

    P3.evaluateLegacy = function() {
        const done = { battle: 1, capture: 2, v: 1 };
        const fresh = { battle: 0, capture: 0, v: 1 };
        try {
            if (P3.isProgressed()) return done;
            let starterChosen = false;
            try {
                starterChosen = !!((typeof $gameSwitches !== "undefined" && $gameSwitches && $gameSwitches.value(1)) ||
                                   ((typeof $gameVariables !== "undefined" && $gameVariables && $gameVariables.value(1)) > 0));
            } catch (e) {}
            return starterChosen ? fresh : done;
        } catch (e) { return done; }
    };

    GE.tutorialState = function() {
        try {
            if (typeof $gameSystem === "undefined" || !$gameSystem) return null;
            const st = $gameSystem._ganjukoTutorial;
            if (st && typeof st.battle === "number" && typeof st.capture === "number") return st;
            const decided = P3.evaluateLegacy();
            $gameSystem._ganjukoTutorial = decided;
            return decided;
        } catch (e) { return null; }
    };
    _p3_status.stateApi = true;

    // Real new games are born with fresh tutorial state (the ONLY writers
    // of a fresh state are this hook and the legacy heuristic above).
    if (typeof Scene_Title !== "undefined" && Scene_Title.prototype &&
        typeof Scene_Title.prototype.commandNewGame === "function") {
        const _p3_commandNewGame = Scene_Title.prototype.commandNewGame;
        Scene_Title.prototype.commandNewGame = function() {
            _p3_commandNewGame.call(this);
            try {
                if (typeof $gameSystem !== "undefined" && $gameSystem) {
                    $gameSystem._ganjukoTutorial = { battle: 0, capture: 0, v: 1 };
                }
            } catch (e) {}
        };
        _p3_status.newGameHook = true;
    }

    // ---------------------------------------------------------------------
    // P3.1 Lesson target: Route 1's gentlest legal catch, chosen at
    // runtime from the area table (stage-1 only, highest catchRate,
    // table minimum level). Today that is Galewing (pos 14, catch 220).
    // ---------------------------------------------------------------------
    P3.pickLessonTarget = function() {
        try {
            const AE = GE.AREA_ENCOUNTERS;
            if (!AE || !AE.tables || !AE.tables[P3.ROUTE1_MAP_ID]) return null;
            const table = AE.tables[P3.ROUTE1_MAP_ID];
            let best = null;
            for (const tier of ["common", "uncommon", "rare"]) {
                const list = (table.tiers && table.tiers[tier]) || [];
                for (const en of list) {
                    if (!en) continue;
                    if (typeof GE.speciesStage === "function" && GE.speciesStage(en.speciesPos) !== 1) continue;
                    const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(en.speciesPos) : null;
                    const cr = sp && typeof sp.catchRate === "number" ? sp.catchRate : 0;
                    if (!best || cr > best.catchRate) {
                        best = { speciesPos: en.speciesPos, level: en.minLv, catchRate: cr, name: sp ? sp.name : "" };
                    }
                }
            }
            return best;
        } catch (e) { return null; }
    };

    // ---------------------------------------------------------------------
    // P3.2 Copy (Kusu's teaching voice, the game's narration register;
    // faceless like every line in this game). \FS[20] sizes the coach
    // window; each beat is pre-wrapped to <=3 lines.
    // ---------------------------------------------------------------------
    function _p3_titleCase(s) {
        s = String(s || "");
        return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
    }
    P3.titleCase = _p3_titleCase;

    function _p3_leadName() {
        try {
            const lead = $gameParty.battleMembers()[0];
            if (lead && lead.name) return lead.name();
        } catch (e) {}
        return "your partner";
    }
    const LINES = {
        battleA() {
            return "Your first battle — breathe, and trust your partner.\n" +
                   "When you are ready, choose FIGHT and stand your ground.";
        },
        battleB() {
            const lead = _p3_leadName();
            return "Pick a move for " + lead + ".\n" +
                   "A move that shares " + lead + "'s own type strikes harder —\n" +
                   "and every foe has types it fears.";
        },
        battleC() {
            return "See the % beside each Ganjuko? That is the health it has left.\n" +
                   "Wear a foe down without emptying it,\n" +
                   "and it is ripe for an Orb.";
        },
        battleD(hit) {
            if (!hit) return "";
            if (hit.rate === 0) {
                return hit.move + " cannot touch " + hit.foe + " at all —\n" +
                       "its kind is immune to " + hit.moveType + ". Choose another move!";
            }
            if (hit.rate >= 2) {
                return "Did you see that drop? " + hit.move + " is strong against " + hit.foe + " —\n" +
                       "it fears " + hit.moveType + " moves. Remember that pairing!";
            }
            if (hit.rate <= 0.5) {
                return hit.move + " barely scratched " + hit.foe + " — its kind resists " + hit.moveType + ".\n" +
                       "A different move may bite harder.";
            }
            return hit.move + " landed true.\n" +
                   "Moves bite hardest when their type is strong against the foe —\n" +
                   "watch for those matchups as you travel.";
        },
        lessonA(lesson) {
            const name = (lesson && lesson.targetName) || "Galewing";
            const body = "A wild " + name + " appeared! Easygoing, and common on this trail —\n" +
                         "perfect for a first catch. Soften it first: land a hit or two,\n" +
                         "but do not knock it out!";
            if (lesson && lesson.granted > 0) {
                return "Professor Kusu tucked " + lesson.granted + " spare Orbs into your bag for practice.\n" + body;
            }
            return body;
        },
        lessonB() {
            return "Its % is sinking — a weakened Ganjuko is far easier to catch.\n" +
                   "Open your BAG and throw a Ganjuko Orb!";
        },
        freeStrong() {
            return "It burst free — too strong still! Weaken it a little more,\n" +
                   "then throw again.";
        },
        freeWeak1() {
            return "It burst free! Do not fret — it is still weak.\n" +
                   "Throw another Orb!";
        },
        freeWeak2() {
            return "Stubborn little one! Its strength is nearly spent —\n" +
                   "one more Orb should do it.";
        }
    };
    P3.LINES = LINES;

    // ---------------------------------------------------------------------
    // P3.3 Beat queue (shared between BattleManager hooks and the scene)
    // ---------------------------------------------------------------------
    function _p3_queue(id, text) {
        try {
            if (typeof $gameTemp === "undefined" || !$gameTemp || !text) return;
            if ($gameTemp._p3SkipAll) return;
            ($gameTemp._p3Queue = $gameTemp._p3Queue || []).push({ id: id, text: text });
        } catch (e) {}
    }
    P3.queueBeat = _p3_queue;

    function _p3_mapLines(lines) {
        try {
            if (typeof $gameMessage === "undefined" || !$gameMessage) return;
            for (const line of lines) $gameMessage.add(line);
        } catch (e) {}
    }

    // ---------------------------------------------------------------------
    // P3.4 Battle arming: BattleManager.setup decides, from state alone,
    // whether this battle is the guided battle or the capture lesson.
    // ---------------------------------------------------------------------
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.setup === "function") {
        const _p3_BM_setup = BattleManager.setup;
        BattleManager.setup = function(troopId, canEscape, canLose) {
            _p3_BM_setup.call(this, troopId, canEscape, canLose);
            try {
                if (typeof $gameTemp === "undefined" || !$gameTemp) return;
                const stagedLesson = $gameTemp._p3Lesson && $gameTemp._p3Lesson.fresh ? $gameTemp._p3Lesson : null;
                $gameTemp._p3Queue = [];
                $gameTemp._p3Fired = {};
                $gameTemp._p3FirstHit = null;
                $gameTemp._p3LessonCaught = false;
                $gameTemp._p3SkipAll = false;
                $gameTemp._p3Coach = null;
                $gameTemp._p3Kind = null;
                $gameTemp._p3Lesson = stagedLesson;
                if (stagedLesson) stagedLesson.fresh = false;
                if (typeof this.isBattleTest === "function" && this.isBattleTest()) return;
                const st = GE.tutorialState();
                if (!st) return;
                const hasParty = typeof $gameParty !== "undefined" && $gameParty &&
                                 typeof $gameParty.allMembers === "function" && $gameParty.allMembers().length > 0;
                if (!hasParty) return;
                if (stagedLesson && st.capture === 0) {
                    $gameTemp._p3Kind = "lesson";
                } else if (st.battle === 0) {
                    $gameTemp._p3Coach = true;
                    $gameTemp._p3Kind = "battle";
                }
            } catch (e) {}
        };
        _p3_status.setupHook = true;
    }

    // ---------------------------------------------------------------------
    // P3.5 Lesson staging: the first natural Route 1 wild encounter after
    // the guided battle becomes the teaching catch. Encounter timing is
    // untouched (P2C rolls it); only the foe is replaced.
    // ---------------------------------------------------------------------
    if (typeof GE.startWildBattle === "function") {
        const _p3_startWildBattle = GE.startWildBattle;
        GE.startWildBattle = function(speciesId, level, canEscape) {
            try {
                const st = GE.tutorialState();
                if (st && st.battle === 1 && st.capture === 0 &&
                    typeof $gameMap !== "undefined" && $gameMap && $gameMap.mapId() === P3.ROUTE1_MAP_ID &&
                    typeof $gameParty !== "undefined" && $gameParty && $gameParty.allMembers().length > 0) {
                    const target = P3.pickLessonTarget();
                    if (target) {
                        let granted = 0;
                        try {
                            const orb = (typeof $dataItems !== "undefined" && $dataItems) ? $dataItems[P3.ORB_ITEM_ID] : null;
                            if (orb && $gameParty.numItems(orb) === 0) {
                                $gameParty.gainItem(orb, P3.ORB_GRANT);
                                granted = P3.ORB_GRANT;
                            }
                        } catch (e) { granted = 0; }
                        $gameTemp._p3Lesson = {
                            fresh: true, targetPos: target.speciesPos,
                            targetName: target.name, granted: granted, breaks: 0
                        };
                        return _p3_startWildBattle.call(this, target.speciesPos, target.level, true);
                    }
                }
            } catch (e) {}
            return _p3_startWildBattle.apply(this, arguments);
        };
        _p3_status.stagingHook = true;
    }

    // ---------------------------------------------------------------------
    // P3.6 Turn beats at each input phase (startInput), and the record of
    // the player's first damaging move (Game_Action.apply).
    // ---------------------------------------------------------------------
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.startInput === "function") {
        const _p3_BM_startInput = BattleManager.startInput;
        BattleManager.startInput = function() {
            _p3_BM_startInput.call(this);
            try {
                if (typeof $gameTemp === "undefined" || !$gameTemp) return;
                const kind = $gameTemp._p3Kind;
                if (!kind) return;
                const fired = $gameTemp._p3Fired || ($gameTemp._p3Fired = {});
                let foe = null, lead = null;
                try { foe = $gameTroop.members()[0]; } catch (e) {}
                try { lead = $gameParty.battleMembers()[0]; } catch (e) {}
                if (kind === "battle") {
                    if (!fired.b) { fired.b = true; _p3_queue("b", LINES.battleB()); }
                    if (!fired.d && $gameTemp._p3FirstHit) {
                        fired.d = true;
                        _p3_queue("d", LINES.battleD($gameTemp._p3FirstHit));
                    }
                    if (!fired.c && ((foe && foe.hp < foe.mhp) || (lead && lead.hp < lead.mhp))) {
                        fired.c = true;
                        _p3_queue("c", LINES.battleC());
                    }
                } else if (kind === "lesson") {
                    if (!fired.b && foe && foe.mhp > 0 && (foe.hp / foe.mhp) <= P3.WEAKEN_PCT) {
                        fired.b = true;
                        _p3_queue("b", LINES.lessonB());
                    }
                }
            } catch (e) {}
        };
        _p3_status.inputHook = true;
    }

    if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.apply === "function") {
        const _p3_GA_apply = Game_Action.prototype.apply;
        Game_Action.prototype.apply = function(target) {
            _p3_GA_apply.call(this, target);
            try {
                if (typeof $gameTemp === "undefined" || !$gameTemp) return;
                if ($gameTemp._p3Kind !== "battle" || $gameTemp._p3FirstHit) return;
                const item = typeof this.item === "function" ? this.item() : null;
                if (!item || !item.damage || !(item.damage.type === 1 || item.damage.type === 5)) return;
                const subject = typeof this.subject === "function" ? this.subject() : null;
                if (!subject) return;
                if (typeof subject.isActor === "function" && !subject.isActor()) return;
                if (typeof subject.isEnemy === "function" && subject.isEnemy()) return;
                if (!target) return;
                if (typeof target.isEnemy === "function" && !target.isEnemy()) return;
                if (typeof target.isActor === "function" && target.isActor()) return;
                const el = item.damage.elementId || 0;
                if (el < 1) return;
                let rate = 1;
                try { rate = GE.typeEffectiveness(el, target); } catch (e) {}
                const tinfo = typeof GE.getTypeInfo === "function" ? GE.getTypeInfo(el) : null;
                $gameTemp._p3FirstHit = {
                    move: item.name || "That move",
                    rate: rate,
                    moveType: tinfo ? _p3_titleCase(tinfo.name) : "",
                    foe: (typeof target.name === "function" ? target.name() : null) || "the foe"
                };
            } catch (e) {}
        };
        _p3_status.applyHook = true;
    }

    // ---------------------------------------------------------------------
    // P3.7 Orb outcomes inside the lesson battle (battle-log seam: the
    // engine's own capture display reads the same result flags).
    // ---------------------------------------------------------------------
    if (typeof Window_BattleLog !== "undefined" && Window_BattleLog.prototype &&
        typeof Window_BattleLog.prototype.displayActionResults === "function") {
        const _p3_WBL_displayActionResults = Window_BattleLog.prototype.displayActionResults;
        Window_BattleLog.prototype.displayActionResults = function(subject, target) {
            _p3_WBL_displayActionResults.call(this, subject, target);
            try {
                if (typeof $gameTemp === "undefined" || !$gameTemp) return;
                if ($gameTemp._p3Kind !== "lesson") return;
                const result = target && typeof target.result === "function" ? target.result() : null;
                if (!result || !result.ganjukoOrbAttempt) return;
                if (result.ganjukoCaught) { $gameTemp._p3LessonCaught = true; return; }
                if (result.orbBlockedByTrainer) return;
                const lesson = $gameTemp._p3Lesson;
                if (!lesson) return;
                lesson.breaks = (lesson.breaks || 0) + 1;
                const fired = $gameTemp._p3Fired || ($gameTemp._p3Fired = {});
                const pct = target && target.mhp ? (target.hp / target.mhp) : 1;
                if (pct > P3.WEAKEN_PCT) {
                    if (!fired.freeStrong) { fired.freeStrong = true; _p3_queue("freeStrong", LINES.freeStrong()); }
                } else if (lesson.breaks === 1) {
                    _p3_queue("freeWeak1", LINES.freeWeak1());
                } else if (lesson.breaks === 2) {
                    _p3_queue("freeWeak2", LINES.freeWeak2());
                }
            } catch (e) {}
        };
        _p3_status.logHook = true;
    }

    // ---------------------------------------------------------------------
    // P3.8 Battle end: completion flags + post-battle map lines. Runs for
    // every outcome; the engine's own defeat handling (heal + return)
    // already guarantees no tutorial soft-lock.
    // ---------------------------------------------------------------------
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.endBattle === "function") {
        const _p3_BM_endBattle = BattleManager.endBattle;
        BattleManager.endBattle = function(result) {
            try {
                if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._p3Kind) {
                    const kind = $gameTemp._p3Kind;
                    const st = GE.tutorialState();
                    if (kind === "battle") {
                        if (st) st.battle = 1;
                        if (result === 2) {
                            _p3_mapLines([
                                "Your partner has been patched up, free of charge.",
                                "Every trainer's first battle humbles them — the next one is yours."
                            ]);
                        }
                    } else if (kind === "lesson") {
                        const lesson = $gameTemp._p3Lesson || {};
                        if ($gameTemp._p3LessonCaught) {
                            if (st) st.capture = 2;
                            _p3_mapLines([
                                "\\C[11]First catch — " + (lesson.targetName || "caught") + "!\\C[0]",
                                "Weaken it, Orb it, catch it. That is the way of it."
                            ]);
                        } else if (result === 0) {
                            _p3_mapLines([
                                "It fainted before an Orb could fly — a gentler touch next time.",
                                "The tall grass will offer another chance."
                            ]);
                        } else if (result === 2) {
                            _p3_mapLines([
                                "Your partner has been patched up, free of charge.",
                                "The lesson keeps — the grass will offer another chance."
                            ]);
                        }
                        // result 1 (escape): re-arms silently.
                    }
                }
            } catch (e) {}
            try {
                if (typeof $gameTemp !== "undefined" && $gameTemp) {
                    $gameTemp._p3Coach = null;
                    $gameTemp._p3Kind = null;
                    $gameTemp._p3Lesson = null;
                    $gameTemp._p3Queue = [];
                    $gameTemp._p3FirstHit = null;
                    $gameTemp._p3LessonCaught = false;
                }
            } catch (e) {}
            _p3_BM_endBattle.call(this, result);
        };
        _p3_status.endHook = true;
    }

    // ---------------------------------------------------------------------
    // P3.9 Coach overlay inside Scene_Battle: a bottom-band window that
    // pauses command input while a line is up. OK/tap dismisses, cancel
    // skips this battle's remaining coaching, and a frame failsafe
    // auto-advances — a coach line can never stall a battle.
    // ---------------------------------------------------------------------

    // =====================================================================
    // FIX ROUND 3 (2026-11-02) — D11 trainer line-of-sight, D17
    // Champions-style move info. (D13's coach surface discipline is patched
    // directly into _p3_deactivateWindows / _p3_coachTick below, since those
    // are scope-local functions.) Standing rules hold on every surface
    // added here: HP is shown as bar + percentage only; no genetics
    // numbers anywhere.
    // =====================================================================

    // ---- D11: trainer line-of-sight battles. Rene (2026-11-02): trainers
    // should spot the player crossing their facing line and walk up into
    // battle. Registry: "mapId:eventId" -> defeat switch (the switch gates
    // the event's post-battle page, so a set switch also disables sight).
    // Choreography: lock player input -> "!" balloon -> brisk walk-up until
    // adjacent -> face player -> start() the event's own battle page.
    // Gyms/leaders are NOT in the registry (unchanged, event-page driven).
    const FR3_SIGHT = {
        "3:9": 6, "3:10": 7, "7:11": 14, "8:4": 13, "11:10": 20,
        "15:6": 62, "17:5": 63, "19:4": 64, "21:5": 65, "23:4": 66
    };
    const FR3_SIGHT_RANGE = 5;
    let _fr3Sight = null;       // { ev, key, phase, frames, oldSpeed, stuck }
    const _fr3SightCool = {};   // key -> frameCount until re-spotting allowed

    function _fr3SightVec(d) {
        return d === 2 ? [0, 1] : d === 8 ? [0, -1] : d === 4 ? [-1, 0] : [1, 0];
    }
    function _fr3LosClear(ev, px, py) {
        const dir = ev.direction();
        const [vx, vy] = _fr3SightVec(dir);
        let x = ev.x, y = ev.y;
        for (;;) {
            const nx = x + vx, ny = y + vy;
            if (nx === px && ny === py) return true;
            if (!$gameMap.isPassable(x, y, dir)) return false;
            x = nx; y = ny;
        }
    }
    function _fr3TrySpot() {
        if (_fr3Sight) return;
        const mapId = $gameMap.mapId();
        for (const key of Object.keys(FR3_SIGHT)) {
            const [mid, eid] = key.split(":").map(Number);
            if (mid !== mapId) continue;
            if ($gameSwitches.value(FR3_SIGHT[key])) continue; // defeated
            if (_fr3SightCool[key] && Graphics.frameCount < _fr3SightCool[key]) continue;
            const ev = $gameMap.event(eid);
            if (!ev || ev._erased || ev._pageIndex !== 0) continue;
            if (!ev.characterName()) continue;
            const px = $gamePlayer.x, py = $gamePlayer.y;
            const dx = px - ev.x, dy = py - ev.y;
            const dir = ev.direction();
            let inLine = false;
            if (dir === 2 && dx === 0 && dy >= 1 && dy <= FR3_SIGHT_RANGE) inLine = true;
            if (dir === 8 && dx === 0 && dy <= -1 && dy >= -FR3_SIGHT_RANGE) inLine = true;
            if (dir === 4 && dy === 0 && dx <= -1 && dx >= -FR3_SIGHT_RANGE) inLine = true;
            if (dir === 6 && dy === 0 && dx >= 1 && dx <= FR3_SIGHT_RANGE) inLine = true;
            if (!inLine) continue;
            if (!_fr3LosClear(ev, px, py)) continue;
            _fr3Sight = {
                ev, key, phase: "alert", frames: 0,
                oldSpeed: ev.moveSpeed(), stuck: 0
            };
            $gameTemp.requestBalloon(ev, 1); // exclamation
            SoundManager.playCursor();
            return;
        }
    }
    function _fr3SightEnd(startBattle) {
        const s = _fr3Sight;
        if (!s) return;
        _fr3Sight = null;
        s.ev.setMoveSpeed(s.oldSpeed);
        if (startBattle) {
            s.ev.turnTowardPlayer();
            $gamePlayer.turnTowardCharacter(s.ev);
            s.ev.start();
        } else {
            _fr3SightCool[s.key] = Graphics.frameCount + 150;
        }
    }
    function _fr3SightTick() {
        if (!$gameMap || !$gamePlayer || !$gameSwitches) return;
        if (SceneManager.isSceneChanging()) { if (_fr3Sight) _fr3SightEnd(false); return; }
        if ($gameMap.isEventRunning() || $gameMessage.isBusy()) {
            if (_fr3Sight) _fr3SightEnd(false);
            return;
        }
        if (!_fr3Sight) { _fr3TrySpot(); return; }
        const s = _fr3Sight;
        s.frames++;
        if (s.phase === "alert") {
            if (s.frames >= 36) { s.phase = "walk"; s.ev.setMoveSpeed(4); }
            return;
        }
        // walk phase: step in the facing line until adjacent to the player
        const ev = s.ev;
        const dist = Math.abs($gamePlayer.x - ev.x) + Math.abs($gamePlayer.y - ev.y);
        if (dist <= 1) { _fr3SightEnd(true); return; }
        if (!ev.isMoving()) {
            const dir = ev.direction();
            const [vx, vy] = _fr3SightVec(dir);
            const before = ev.x + "," + ev.y;
            ev.moveStraight(dir);
            if (ev.x + "," + ev.y === before) {
                if (++s.stuck > 100) _fr3SightEnd(false); // boxed in: give up
            } else {
                s.stuck = 0;
            }
        }
        if (s.frames > 60 * 12) _fr3SightEnd(false); // hard failsafe
    }
    const _fr3_CanMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (_fr3Sight) return false; // input locked during spot + walk-up
        return _fr3_CanMove.call(this);
    };
    const _fr3_SMUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _fr3_SMUpdate.call(this);
        _fr3SightTick();
    };

    // ---- D17: Champions-style move info in the fight UI, derived at
    // runtime from the skill record itself (formula coefficient, success
    // rate, damage type, effects, repeats) so it can never drift from the
    // data it describes. Rendered into MZ's help window while the battle
    // skill list is open (help strip y416..512 overlaps neither plate).
    function fr3MovePow(skill) {
        if (!skill || !skill.damage || skill.damage.type === 0 || !skill.damage.formula) return null;
        const m = String(skill.damage.formula).match(/a\.(?:atk|mat)\s*\*\s*([0-9.]+)/);
        if (m) return Math.round(parseFloat(m[1]) * 100);
        const b = String(skill.damage.formula).match(/^([0-9.]+)\s*\+/);
        if (b) return Math.round(parseFloat(b[1]) / 10);
        return null;
    }
    function fr3MoveEffectLine(skill) {
        if (!skill) return "";
        const bits = [];
        const t = skill.damage ? skill.damage.type : 0;
        if (t === 5) bits.push("Drains HP");
        if (t === 6) bits.push("Drains MP");
        if (skill.repeats && skill.repeats > 1) bits.push("Hits " + skill.repeats + "x");
        // Names verified against data/States.json (4 Poison, 11 Burn,
        // 12 Paralysis, 2 Guard...). MZ effect code 21 = Add State; scope
        // decides whether that is an infliction (enemy scopes 1-6) or a
        // self/ally grant. Code 31/32 = buff/debuff (dataId = param id).
        const stateNames = { 2: "Guard", 4: "Poison", 5: "Blind", 6: "Silence", 7: "Rage", 8: "Confusion", 9: "Charm", 10: "Sleep", 11: "Burn", 12: "Paralysis", 13: "Stun", 14: "Freeze", 31: "Badly Poisoned" };
        const paramNames = { 2: "ATK", 3: "DEF", 4: "MAT", 5: "MDF", 6: "AGI", 7: "LUK" };
        const raiseCount = {}, lowerCount = {};
        for (const e of skill.effects || []) {
            if (e.code === 21 && stateNames[e.dataId]) {
                if (skill.scope >= 1 && skill.scope <= 6) {
                    const pct = Math.round((e.value1 || 0) * 100);
                    if (pct >= 100) bits.push("Inflicts " + stateNames[e.dataId]);
                    else if (pct > 0) bits.push("May inflict " + stateNames[e.dataId] + " (" + pct + "%)");
                } else {
                    bits.push("Grants " + stateNames[e.dataId]);
                }
            }
            // v13: under the stage system ONE code-31/32 entry = ONE stage,
            // so the counts shown are the stage counts (v1 §2.5 wording).
            if (e.code === 31 && paramNames[e.dataId]) raiseCount[paramNames[e.dataId]] = (raiseCount[paramNames[e.dataId]] || 0) + 1;
            if (e.code === 32 && paramNames[e.dataId]) lowerCount[paramNames[e.dataId]] = (lowerCount[paramNames[e.dataId]] || 0) + 1;
        }
        const fmtStages = (counts, sign) => Object.keys(counts).map(k => k + " " + sign + counts[k]).join(" · ");
        if (Object.keys(raiseCount).length) bits.push("Raises own " + fmtStages(raiseCount, "+"));
        if (Object.keys(lowerCount).length) bits.push("Lowers foe " + fmtStages(lowerCount, "-"));
        // v13 Champions tables (Section 21): the move-info must read the
        // same SELF_STAGE / FOE_STAGE / recoil / recharge / high-crit /
        // flinch tables the battle engine applies — it can never again
        // describe Leaf Storm without its self-drop.
        try {
            const S21 = window.GanjukoEngine && window.GanjukoEngine.S21;
            if (S21) {
                const lbl = { atk: "ATK", def: "DEF", mat: "MAT", mdf: "MDF", agi: "AGI", acc: "ACC", eva: "EVA" };
                const sgn = (d) => (d > 0 ? "+" + d : "" + d);
                if (S21.SELF_STAGE && S21.SELF_STAGE[skill.id]) {
                    bits.push("Self: " + S21.SELF_STAGE[skill.id].map(([k, d]) => lbl[k] + " " + sgn(d)).join(" · "));
                }
                if (S21.FOE_STAGE && S21.FOE_STAGE[skill.id]) {
                    for (const [k, d, ch] of S21.FOE_STAGE[skill.id]) {
                        bits.push("Lowers foe " + lbl[k] + " " + sgn(d) + (ch < 1 ? " (" + Math.round(ch * 100) + "%)" : ""));
                    }
                }
                if (S21.FLINCH_RIDERS && S21.FLINCH_RIDERS[skill.id]) {
                    bits.push("May flinch (" + Math.round(S21.FLINCH_RIDERS[skill.id] * 100) + "%)");
                }
                if (S21.RECOIL && S21.RECOIL[skill.id]) {
                    bits.push("Recoil " + Math.round(S21.RECOIL[skill.id] * 100) + "% of damage");
                }
                if (S21.RECHARGE_SKILLS && S21.RECHARGE_SKILLS[skill.id]) {
                    bits.push("Must recharge next turn");
                }
                if (S21.HIGH_CRIT && S21.HIGH_CRIT[skill.id]) {
                    bits.push("High critical rate");
                }
                if (S21.TRAP_SKILL === skill.id) {
                    bits.push("Traps the foe");
                }
            }
        } catch (e) {}
        return bits.join(" · ");
    }
    const FR3_TYPE_NAMES = {
        1: "NORMAL", 2: "FIRE", 3: "WATER", 4: "NATURE", 5: "VOLT",
        6: "EARTH", 7: "WIND", 8: "UMBRA", 9: "ASTRAL"
    };
    function fr3MoveInfoText(skill) {
        if (!skill) return "";
        const typeName = FR3_TYPE_NAMES[skill.damage.elementId] || "NORMAL";
        const pow = fr3MovePow(skill);
        const powTxt = pow === null ? "POW —" : "POW " + pow;
        const head = "[" + typeName + "]  " + powTxt + "  ·  ACC " + skill.successRate;
        const fx = fr3MoveEffectLine(skill);
        const desc = String(skill.description || "").replace(/^\[[A-Z]+\]\s*/, "");
        let out = fx ? head + "  —  " + fx : head;
        if (desc && desc !== fx) out += "\n" + desc;
        return out;
    }
    window.GanjukoEngine.fr3MoveInfoText = fr3MoveInfoText;
    if (typeof Window_BattleSkill !== "undefined") {
        Window_BattleSkill.prototype.setHelpWindowItem = function(item) {
            if (this._helpWindow) {
                this._helpWindow.setText(item ? fr3MoveInfoText(item) : "");
            }
        };
    }

    let Window_GanjukoCoach = null;
    if (typeof Window_Base !== "undefined" && typeof Rectangle !== "undefined" && typeof Graphics !== "undefined") {
        try {
            Window_GanjukoCoach = class extends Window_Base {
                constructor(rect) {
                    super(rect);
                    this.opacity = 238;
                }
            };
            window.Window_GanjukoCoach = Window_GanjukoCoach;
        } catch (e) { Window_GanjukoCoach = null; }
    }

    function _p3_deactivateWindows(scene, ctl) {
        const wins = [scene._partyCommandWindow, scene._actorCommandWindow];
        for (const w of wins) {
            try {
                if (w && w.active) {
                    w.deactivate();
                    if (!ctl.deactivated.includes(w)) ctl.deactivated.push(w);
                }
            } catch (e) {}
        }
        // FR3 D13: deactivating is not enough — the deactivated command
        // windows, the battle message window, and the gold window all stayed
        // VISIBLE, stacking three framed text boxes in the bottom band under
        // the coach line (Rene playtest 2026-11-02; probe fix3/probe-d13.js).
        // While a coach line shows it is the only text surface: hide the
        // rest, restore in _p3_coachTick's reactivate step.
        try {
            if (!ctl.fr3Hidden) ctl.fr3Hidden = [];
            const hideWins = [
                scene._partyCommandWindow, scene._actorCommandWindow,
                scene._skillWindow, scene._itemWindow, scene._statusWindow,
                scene._helpWindow, scene._messageWindow, scene._goldWindow,
                scene._actorWindow, scene._enemyWindow
            ];
            for (const w of hideWins) {
                if (w && w.visible && !ctl.fr3Hidden.includes(w)) {
                    ctl.fr3Hidden.push(w);
                    w.hide();
                }
            }
            const cb = scene._cancelButton;
            if (cb && cb.visible && !ctl.fr3Hidden.includes(cb)) {
                ctl.fr3Hidden.push(cb);
                cb.visible = false;
            }
        } catch (e) {}
    }

    function _p3_showLine(scene, ctl, beat) {
        const win = scene._p3CoachWindow;
        if (!win) return false;
        try {
            win.contents.clear();
            win.drawTextEx("\\FS[20]" + beat.text, 4, 2);
            win.show();
            ctl.showing = beat;
            ctl.shownFrames = 0;
            if (scene._p3Prompt) scene._p3Prompt.visible = true;
            _p3_deactivateWindows(scene, ctl);
            return true;
        } catch (e) { return false; }
    }

    function _p3_hideLine(scene, ctl) {
        try {
            if (scene._p3CoachWindow) scene._p3CoachWindow.hide();
            if (scene._p3Prompt) scene._p3Prompt.visible = false;
        } catch (e) {}
        ctl.showing = null;
        ctl.shownFrames = 0;
        ctl.resumeAt = (typeof Graphics !== "undefined" ? Graphics.frameCount : 0) + 1;
    }

    function _p3_coachTick(scene) {
        const ctl = scene._p3;
        if (!ctl || !scene._p3CoachWindow) return;
        const gt = (typeof $gameTemp !== "undefined") ? $gameTemp : null;
        if (!gt || !gt._p3Kind) return;
        // Reactivate command windows one frame after a line closes, so the
        // dismiss press cannot leak into a command selection.
        if (!ctl.showing && ctl.resumeAt &&
            (typeof Graphics === "undefined" || Graphics.frameCount >= ctl.resumeAt)) {
            for (const w of ctl.deactivated) { try { w.activate(); } catch (e) {} }
            ctl.deactivated = [];
            // FR3 D13: restore whatever the coach display hid.
            if (ctl.fr3Hidden) {
                for (const w of ctl.fr3Hidden) {
                    try {
                        if (w === scene._cancelButton) w.visible = true;
                        else w.show();
                    } catch (e) {}
                }
                ctl.fr3Hidden = [];
            }
            ctl.resumeAt = 0;
        }
        if (ctl.showing) {
            _p3_deactivateWindows(scene, ctl);
            ctl.shownFrames++;
            if (scene._p3Prompt) {
                try { scene._p3Prompt.opacity = 150 + Math.round(90 * Math.sin((typeof Graphics !== "undefined" ? Graphics.frameCount : ctl.shownFrames) * 0.15)); } catch (e) {}
            }
            let advance = false, skip = false;
            try {
                if (typeof Input !== "undefined" && Input.isTriggered("cancel")) skip = true;
                else if ((typeof Input !== "undefined" && Input.isTriggered("ok")) ||
                         (typeof TouchInput !== "undefined" && TouchInput.isTriggered())) advance = true;
            } catch (e) {}
            if (!advance && ctl.shownFrames >= P3.AUTO_ADVANCE_FRAMES) advance = true;
            if (skip) {
                ctl.skip = true;
                gt._p3SkipAll = true;
                gt._p3Queue = [];
                _p3_hideLine(scene, ctl);
            } else if (advance) {
                _p3_hideLine(scene, ctl);
            }
            return;
        }
        if (ctl.skip) return;
        const q = gt._p3Queue || [];
        if (!q.length) return;
        let phase = null;
        try { phase = (typeof BattleManager !== "undefined") ? BattleManager._phase : null; } catch (e) {}
        if (phase === "input" || phase === "start" || phase === "" || phase == null) {
            const beat = q.shift();
            if (beat) _p3_showLine(scene, ctl, beat);
        }
    }
    P3.coachTick = _p3_coachTick;

    if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype &&
        typeof Scene_Battle.prototype.create === "function" &&
        typeof Scene_Battle.prototype.start === "function" &&
        typeof Scene_Battle.prototype.update === "function") {
        const _p3_SB_create = Scene_Battle.prototype.create;
        Scene_Battle.prototype.create = function() {
            _p3_SB_create.call(this);
            try {
                if (typeof $gameTemp === "undefined" || !$gameTemp || !$gameTemp._p3Kind) return;
                if (!Window_GanjukoCoach) return;
                this._p3 = { showing: null, shownFrames: 0, deactivated: [], resumeAt: 0, skip: false };
                const h = 124;
                const rect = new Rectangle(24, Graphics.boxHeight - h - 8, Graphics.boxWidth - 48, h);
                const win = new Window_GanjukoCoach(rect);
                win.hide();
                this.addWindow(win);
                this._p3CoachWindow = win;
                if (typeof Bitmap !== "undefined" && typeof Sprite !== "undefined") {
                    const bmp = new Bitmap(24, 24);
                    bmp.fontSize = 18;
                    bmp.drawText("▼", 0, 0, 24, 24, "center");
                    const spr = new Sprite(bmp);
                    spr.x = rect.x + rect.width - 38;
                    spr.y = rect.y + rect.height - 30;
                    spr.visible = false;
                    this.addChild(spr);
                    this._p3Prompt = spr;
                }
            } catch (e) {}
        };
        const _p3_SB_start = Scene_Battle.prototype.start;
        Scene_Battle.prototype.start = function() {
            _p3_SB_start.call(this);
            try {
                if (typeof $gameTemp === "undefined" || !$gameTemp || !$gameTemp._p3Kind) return;
                const fired = $gameTemp._p3Fired || ($gameTemp._p3Fired = {});
                if (fired.a) return;
                fired.a = true;
                if ($gameTemp._p3Kind === "battle") _p3_queue("a", LINES.battleA());
                else if ($gameTemp._p3Kind === "lesson") _p3_queue("a", LINES.lessonA($gameTemp._p3Lesson));
            } catch (e) {}
        };
        const _p3_SB_update = Scene_Battle.prototype.update;
        Scene_Battle.prototype.update = function() {
            try { _p3_coachTick(this); } catch (e) {}
            _p3_SB_update.call(this);
        };
        _p3_status.sceneHooks = true;
    }
})();


// =============================================================================
// SECTION 18 — HIDDEN DEPTH (2026-11-02): LEVEL 100 + HIDDEN GENETICS +
// CHARACTER SHEET + THE LISTENER (JUDGE) + CHROMA VARIANTS
// =============================================================================
// Design: work/MULTIPLAYER-AND-DEPTH-DESIGN.md sections B, C, D.6, D.7 and
// the Chroma note in work/AREA-ENCOUNTERS.md. Decisions: DESIGN-DECISIONS.md
// (Rene, 2026-11-01, "Approved for all").
//
// Every creature carries a hidden individual profile:
//   _ganjukoGenetics = { ivs:{hp,atk,def,mat,mdf,agi} 0-31,
//                        evs:{...} 0-252 each, <=510 total,
//                        trait: word, bond: 0-255, seed: uint32,
//                        chroma: bool (derived from the seed, 1/1024),
//                        battles: n, metPlace: "", steps: n }
// rolled once at encounter/creation and never re-rolled. Genetics modify
// the Pass 2 A unified paramBase result — the unified formula stays the
// base truth; this section only adds the individual's quiet difference:
//   floor(iv * level / 100) + floor(floor(ev / 4) * level / 100)
// per stat (HP uses its own pair; MP and LUK have no genetics).
//
// THE NEVER-DISPLAY RULE (design C.6) — build-time discipline, checked by
// every future UI change and by this lane's lint:
//   1. No window, scene, message, or tooltip may render an IV value, an
//      EV value, a bond value, or any arithmetic involving them.
//   2. Stat displays show FINAL params only. A final number is the
//      creature's stat; its decomposition does not exist for the UI.
//   3. Bond may be shown ONLY as 0-5 hearts and through behaviour.
//   4. Personality is a WORD from the trait list. Words allowed; the
//      numbers behind them are not.
//   5. window.GanjukoCompetitive never gains a genetics field. The one
//      debug accessor (S18.debugGenetics) is gated behind the plugin
//      parameter S18DebugGenetics, default OFF.
//   6. The Judge's qualitative bands are reviewed copy — words, exempt
//      by being words.
//
// Safety contract (Sections 16/17/P2/P3 discipline): every install is
// feature-tested and try/catch guarded; every wrapper calls the stored
// original; a failure anywhere in Section 18 degrades to "no hidden
// depth", never to a broken game. GE.S18.status reports what installed.
// =============================================================================
(function() {
    "use strict";
    if (typeof GanjukoEngine === "undefined") return;
    const GE = GanjukoEngine;

    const _s18_status = {
        core: false, paramWraps: false, maxLevel: false, classExt: false,
        rareCandy: false, birthSeams: false, captureHandoff: false,
        daycare: false, evFlow: false, bond: false, endure: false,
        chromaSprites: false, followerTint: false, hop: false,
        sheet: false, dex: false, judge: false
    };

    const S18 = {};
    GE.S18 = S18;
    S18.status = _s18_status;

    // ---------------------------------------------------------------------
    // 18.0 Small deterministic helpers (unit-tested in section-18.test.js)
    // ---------------------------------------------------------------------
    const STAT_KEYS = ["hp", "atk", "def", "mat", "mdf", "agi"];
    const PARAM_TO_KEY = { 0: "hp", 2: "atk", 3: "def", 4: "mat", 5: "mdf", 6: "agi" };

    function hash32(str) {
        let h = 0x811c9dc5;
        const s = String(str);
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }
    S18.hash32 = hash32;

    function mulberry32(seed) {
        let a = seed >>> 0;
        return function() {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    S18.mulberry32 = mulberry32;

    function randomSeed() {
        return (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0);
    }

    // The Chroma flag is a pure function of the individual's seed:
    // exactly one seed in 1024 carries it (design rate 1/1024).
    function deriveChroma(seed) {
        return (hash32("chroma:" + (seed >>> 0)) % 1024) === 0;
    }
    S18.deriveChroma = deriveChroma;

    // ---------------------------------------------------------------------
    // 18.1 Traits, temperament prose, roles (design C.7 — flavour only)
    // ---------------------------------------------------------------------
    const TRAITS = ["Brave", "Gentle", "Curious", "Stubborn", "Playful",
        "Stoic", "Proud", "Shy", "Mischievous", "Loyal", "Dreamy", "Fierce"];
    S18.TRAITS = TRAITS;
    const MANNER = {
        Brave: "bravely", Gentle: "gently", Curious: "curiously",
        Stubborn: "stubbornly", Playful: "playfully", Stoic: "stoically",
        Proud: "proudly", Shy: "shyly", Mischievous: "mischievously",
        Loyal: "loyally", Dreamy: "dreamily", Fierce: "fiercely"
    };
    // Inclination lines keyed by the individual's strongest hidden stat —
    // design C.7 verbatim.
    const INCLINATION = {
        hp: "Sturdy as old roots — slow to tire, quick to forgive.",
        atk: "Hits first and apologises never.",
        def: "A wall that decided to be a friend.",
        mat: "Dreams in colour and fights in poetry.",
        mdf: "Unshakeable; weather passes through and it remains.",
        agi: "Born to run — always first to the horizon."
    };
    S18.INCLINATION = INCLINATION;

    function topStatKey(values) {
        let best = STAT_KEYS[0], bestV = -Infinity;
        for (const k of STAT_KEYS) {
            const v = values[k] || 0;
            if (v > bestV) { bestV = v; best = k; }
        }
        return best;
    }
    S18.topStatKey = topStatKey;

    // Stat-role noun from a stat shape (design: speedster / wall /
    // glass cannon / bruiser / duelist / arcanist / bulwark / all-rounder).
    function roleFor(st) {
        const keys = ["atk", "def", "mat", "mdf", "agi"];
        const vals = keys.map(k => st[k] || 0);
        const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1) || 1;
        const max = Math.max.apply(null, vals);
        if (max <= mean * 1.12) return "all-rounder";
        const top = keys[vals.indexOf(max)];
        if (top === "agi" && (st.atk || 0) >= mean * 1.05) return "duelist";
        if (top === "agi") return "speedster";
        if ((top === "atk" || top === "mat") && max >= mean * 1.30 &&
            Math.min(st.def || 0, st.mdf || 0) <= mean * 0.92) return "glass cannon";
        if (top === "atk") return (st.hp || 0) >= mean ? "bruiser" : "duelist";
        if (top === "mat") return "arcanist";
        if (top === "def" || top === "mdf") {
            const other = top === "def" ? (st.mdf || 0) : (st.def || 0);
            return other >= max * 0.88 ? "bulwark" : "wall";
        }
        return "all-rounder";
    }
    S18.roleFor = roleFor;

    function articleFor(word) {
        return /^[aeiou]/i.test(word) ? "an" : "a";
    }

    // "a/an + trait word + stat-role noun" — the flavour profile line.
    function flavorProfile(profile, shapeStats) {
        const role = roleFor(shapeStats);
        const trait = (profile && profile.trait) || "Curious";
        const a = articleFor(role);
        return "A" + (a === "an" ? "n" : "") + " " + trait.toLowerCase() + " " + role + ".";
    }
    S18.flavorProfile = flavorProfile;

    // One temperament line: inclination (strongest hidden stat) + manner
    // (trait adverb), composed the way design D.6 shows it.
    function temperamentLine(profile) {
        if (!profile) return "";
        const inc = INCLINATION[topStatKey(profile.ivs || {})] || "";
        const adv = MANNER[profile.trait] || "quietly";
        const body = inc.replace(/; /g, ", ").replace(/\.$/, "");
        return body + ", and gets there " + adv + ".";
    }
    S18.temperamentLine = temperamentLine;

    // Bond expressed only as a qualitative closeness read (design C.7).
    function relationshipLine(bond) {
        if (bond >= 170) return "You don't walk together. You walk as one.";
        if (bond >= 85) return "Travels like it chose this.";
        return "Still deciding about you.";
    }
    S18.relationshipLine = relationshipLine;

    function heartsFor(bond) {
        if (!bond || bond <= 0) return 0;
        return Math.min(5, 1 + Math.floor(bond / 52));
    }
    S18.heartsFor = heartsFor;

    function heartsString(bond) {
        const n = heartsFor(bond);
        let s = "";
        for (let i = 0; i < 5; i++) s += i < n ? "♥" : "♡";
        return s;
    }
    S18.heartsString = heartsString;

    // The species-level role line for the Dex (design decision 5: the Dex
    // line describes the KIND; the sheet line describes THIS one).
    function speciesKindLine(sp) {
        if (!sp || !sp.baseStats) return "";
        const role = roleFor(sp.baseStats);
        const inc = INCLINATION[topStatKey(sp.baseStats)] || "";
        const body = inc.replace(/; /g, ", ").replace(/\.$/, "");
        const lowered = body.charAt(0).toLowerCase() + body.slice(1);
        return "Kind: " + articleFor(role) + " " + role + " — " + lowered + ".";
    }
    S18.speciesKindLine = speciesKindLine;

    // ---------------------------------------------------------------------
    // 18.2 The genetics record — creation, legacy derivation, accessor
    // ---------------------------------------------------------------------
    function zeroStats() {
        return { hp: 0, atk: 0, def: 0, mat: 0, mdf: 0, agi: 0 };
    }

    function rollIvs(rng, floor) {
        const ivs = {};
        for (const k of STAT_KEYS) {
            if (floor >= 31) ivs[k] = 31;
            else ivs[k] = floor + Math.floor(rng() * (32 - floor));
        }
        return ivs;
    }

    function makeProfile(seed, ivs, trait) {
        return {
            ivs: ivs,
            evs: zeroStats(),
            trait: trait,
            bond: 0,
            seed: seed >>> 0,
            chroma: deriveChroma(seed),
            battles: 0,
            metPlace: "",
            steps: 0
        };
    }

    // Fresh roll for a genuinely new individual. floor: 0 wild, 12
    // trainer, 24 gym, 31 Stadium/Champion (design C.2 tiers).
    function rollProfile(floor) {
        const rng = Math.random;
        const seed = randomSeed();
        const ivs = rollIvs(rng, floor || 0);
        const trait = TRAITS[Math.floor(rng() * TRAITS.length)];
        return makeProfile(seed, ivs, trait);
    }
    S18.rollProfile = rollProfile;

    // Legacy derivation (design C.1): a pre-Section-18 creature's profile
    // is derived deterministically from (actorId, speciesId) the first
    // time it is touched, then stored — stable forever, never re-rolled.
    function legacyProfile(actorId, speciesId) {
        const seed = hash32("legacy:" + actorId + ":" + speciesId);
        const rng = mulberry32(seed);
        const ivs = rollIvs(rng, 0);
        const trait = TRAITS[Math.floor(rng() * TRAITS.length)];
        return makeProfile(seed, ivs, trait);
    }
    S18.legacyProfile = legacyProfile;

    function cloneProfile(p) {
        if (!p) return null;
        return {
            ivs: Object.assign({}, p.ivs),
            evs: Object.assign({}, p.evs),
            trait: p.trait,
            bond: p.bond || 0,
            seed: p.seed >>> 0,
            chroma: !!p.chroma,
            battles: p.battles || 0,
            metPlace: p.metPlace || "",
            steps: p.steps || 0
        };
    }
    S18.cloneProfile = cloneProfile;

    function isEnemyBattler(b) {
        try { return !!(b && b.isEnemy && b.isEnemy()); } catch (e) { return false; }
    }
    function isActorBattler(b) {
        try { return !!(b && b.isActor && b.isActor()); } catch (e) { return false; }
    }

    function currentPlaceName() {
        try {
            if (typeof $gameMap !== "undefined" && $gameMap) {
                if (typeof $gameMap.displayName === "function" && $gameMap.displayName()) return $gameMap.displayName();
                const id = typeof $gameMap.mapId === "function" ? $gameMap.mapId() : 0;
                if (id && typeof $dataMapInfos !== "undefined" && $dataMapInfos && $dataMapInfos[id]) return $dataMapInfos[id].name || "";
            }
        } catch (e) {}
        return "";
    }

    function stampMetPlace(actor, overwrite) {
        try {
            const g = actor && actor._ganjukoGenetics;
            if (!g) return;
            if (!overwrite && g.metPlace) return;
            const place = currentPlaceName();
            if (place) g.metPlace = place;
        } catch (e) {}
    }

    // The single accessor (design C.1). Creates the record on first touch
    // for creatures that predate the sanctioned birth seams: actors get
    // the deterministic legacy profile; enemies get a wild roll (their
    // setup seam normally creates it first — this is only a safety net).
    function geneticsOf(battler) {
        if (!battler) return null;
        if (battler._ganjukoGenetics) return battler._ganjukoGenetics;
        let profile = null;
        try {
            if (isEnemyBattler(battler)) {
                profile = rollProfile(0);
            } else {
                const actorId = typeof battler.actorId === "function" ? battler.actorId() : 0;
                const speciesId = typeof battler.ganjukoSpeciesId === "function" ? battler.ganjukoSpeciesId() : 0;
                profile = legacyProfile(actorId, speciesId);
            }
        } catch (e) {
            profile = rollProfile(0);
        }
        battler._ganjukoGenetics = profile;
        return profile;
    }
    S18.geneticsOf = geneticsOf;
    GE.geneticsOf = geneticsOf;

    // The paramBase contribution of a battler's record for one MZ param.
    // Reads the record ONLY (never creates): mid-creation param calls
    // during setup/changeClass must not mint a profile early.
    function geneticsAdd(battler, paramId) {
        const key = PARAM_TO_KEY[paramId];
        if (!key) return 0; // MP (1) and LUK (7) have no genetics — by design.
        const g = battler && battler._ganjukoGenetics;
        if (!g) return 0;
        let level = 1;
        try {
            if (isEnemyBattler(battler)) level = typeof battler.ganjukoLevel === "function" ? battler.ganjukoLevel() : 1;
            else level = battler.level || 1;
        } catch (e) {}
        level = Math.max(1, Math.min(100, Math.floor(level) || 1));
        const iv = (g.ivs && g.ivs[key]) || 0;
        const ev = (g.evs && g.evs[key]) || 0;
        return Math.floor(iv * level / 100) + Math.floor(Math.floor(ev / 4) * level / 100);
    }
    S18.geneticsAdd = geneticsAdd;
    _s18_status.core = true;

    // ---------------------------------------------------------------------
    // 18.3 Param composition — genetics ride UNDER everything else:
    // this wrap installs last, calls the Pass 2 A unified result, and
    // adds the individual's contribution. Section 16.6's Stadium
    // normalization wraps Game_BattlerBase.param (downstream), so it
    // measures genetics-inclusive totals exactly as design C.3 states.
    // ---------------------------------------------------------------------
    try {
        let wrapped = 0;
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.paramBase === "function") {
            const _s18_actor_paramBase = Game_Actor.prototype.paramBase;
            Game_Actor.prototype.paramBase = function(paramId) {
                const base = _s18_actor_paramBase.call(this, paramId);
                try { return base + geneticsAdd(this, paramId); } catch (e) { return base; }
            };
            wrapped++;
        }
        if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.paramBase === "function") {
            const _s18_enemy_paramBase = Game_Enemy.prototype.paramBase;
            Game_Enemy.prototype.paramBase = function(paramId) {
                const base = _s18_enemy_paramBase.call(this, paramId);
                try { return base + geneticsAdd(this, paramId); } catch (e) { return base; }
            };
            wrapped++;
        }
        _s18_status.paramWraps = wrapped === 2;
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 18.4 Level 100 (design B.1) — three seams
    // ---------------------------------------------------------------------
    // Seam 1: maxLevel. Ganjuko actors return 100; anything else keeps
    // stock behaviour. (Actors.json already carries 100 in the shipped
    // data; this wrap makes the cap a guarantee of the engine, not of
    // one data file — and isMaxLevel/changeLevel read through it.)
    try {
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype) {
            const _s18_maxLevel = typeof Game_Actor.prototype.maxLevel === "function" ? Game_Actor.prototype.maxLevel : null;
            Game_Actor.prototype.maxLevel = function() {
                try {
                    if (typeof this.ganjukoSpecies === "function" && this.ganjukoSpecies()) return 100;
                } catch (e) {}
                return _s18_maxLevel ? _s18_maxLevel.call(this) : 99;
            };
            _s18_status.maxLevel = true;
        }
    } catch (e) {}

    // Seam 2: class param tables end at index 99. Boot pass (design B.3):
    // after data load, append index 100 = v[99] + max(1, v[99] - v[98])
    // to every class param array of length exactly 100. Runtime-only;
    // the file on disk is untouched; the length guard makes it
    // idempotent and skips any longer future export.
    function extendClassParams(classes) {
        let extended = 0;
        if (!Array.isArray(classes)) return 0;
        for (const cls of classes) {
            if (!cls || !Array.isArray(cls.params)) continue;
            for (const arr of cls.params) {
                if (Array.isArray(arr) && arr.length === 100) {
                    const v99 = arr[99], v98 = arr[98];
                    if (typeof v99 === "number" && isFinite(v99) && typeof v98 === "number" && isFinite(v98)) {
                        arr.push(v99 + Math.max(1, v99 - v98));
                        extended++;
                    }
                }
            }
        }
        return extended;
    }
    S18.extendClassParams = extendClassParams;
    try {
        if (typeof DataManager !== "undefined" && typeof DataManager.onLoad === "function") {
            const _s18_onLoad = DataManager.onLoad;
            DataManager.onLoad = function(object) {
                _s18_onLoad.call(this, object);
                try {
                    if (typeof $dataClasses !== "undefined" && object === $dataClasses) {
                        extendClassParams($dataClasses);
                        _s18_status.classExt = true;
                    }
                } catch (e) {}
            };
        }
    } catch (e) {}

    // Seam 3: the Rare Candy gate. The engine's applyItemEffect override
    // tests target.level < 99 — a constant inside an override a wrapper
    // cannot reach, so (design B.1.2, following the 16.7 precedent) this
    // pre-branch performs exactly the original lines for a Lv 99 Ganjuko
    // target and skips the original for that effect only.
    try {
        if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.applyItemEffect === "function") {
            const _s18_applyItemEffect = Game_Action.prototype.applyItemEffect;
            Game_Action.prototype.applyItemEffect = function(target, effect) {
                try {
                    const item = typeof this.item === "function" ? this.item() : null;
                    if (item && typeof DataManager !== "undefined" && DataManager.isItem(item) &&
                        item.note && /<RareCandy:\s*\d+>/i.test(item.note) &&
                        target && isActorBattler(target) && target.level === 99 &&
                        typeof target.ganjukoSpecies === "function" && target.ganjukoSpecies() &&
                        typeof target.maxLevel === "function" && target.maxLevel() >= 100) {
                        target.changeLevel(target.level + 1, true);
                        target.recoverAll();
                        if (typeof target.checkAndPerformEvolution === "function") target.checkAndPerformEvolution();
                        if (typeof target.result === "function" && target.result()) target.result().success = true;
                        return;
                    }
                } catch (e) {}
                return _s18_applyItemEffect.call(this, target, effect);
            };
            _s18_status.rareCandy = true;
        }
    } catch (e) {}


    // ---------------------------------------------------------------------
    // 18.5 Evolution graph helpers — stage + line root + EV yield
    // (design C.4: stage from the evolveTo graph; yield derived from the
    // species' stage and dominant base stats, ties hp>atk>def>mat>mdf>agi)
    // ---------------------------------------------------------------------
    let _stageCache = null;
    function computeStages() {
        const total = (typeof $dataGanjukoSpecies !== "undefined" && $dataGanjukoSpecies) ? $dataGanjukoSpecies.length : 0;
        const firstPred = {};
        for (let q = 1; q <= total; q++) {
            const cand = GE.getSpecies(q);
            if (!cand) continue;
            const tgt = GE.evolutionTargetId(cand);
            if (tgt > 0 && !(tgt in firstPred)) firstPred[tgt] = q;
        }
        const stage = {}, root = {};
        for (let pos = 1; pos <= total; pos++) {
            let cur = pos, depth = 1;
            const seen = new Set([cur]);
            for (let guard = 0; guard < 12; guard++) {
                const pred = firstPred[cur];
                if (!pred || seen.has(pred)) break;
                cur = pred; depth++;
                seen.add(cur);
            }
            stage[pos] = depth;
            root[pos] = cur;
        }
        return { stage: stage, root: root, total: total };
    }
    function stageData() {
        if (!_stageCache) _stageCache = computeStages();
        return _stageCache;
    }
    function stageOf(posId) {
        try { return stageData().stage[posId] || 1; } catch (e) { return 1; }
    }
    function rootOfSpecies(posId) {
        try { return stageData().root[posId] || posId; } catch (e) { return posId; }
    }
    S18.stageOf = stageOf;
    S18.rootOfSpecies = rootOfSpecies;

    function rankedStatKeys(bs) {
        return STAT_KEYS.slice().sort((a, b) => {
            const d = (bs[b] || 0) - (bs[a] || 0);
            return d !== 0 ? d : STAT_KEYS.indexOf(a) - STAT_KEYS.indexOf(b);
        });
    }
    function evYieldFor(posId) {
        const sp = GE.getSpecies(posId);
        if (!sp || !sp.baseStats) return {};
        const stage = stageOf(posId);
        const ranked = rankedStatKeys(sp.baseStats);
        const out = {};
        if (stage <= 1) { out[ranked[0]] = 1; }
        else if (stage === 2) { out[ranked[0]] = 1; out[ranked[1]] = 1; }
        else { out[ranked[0]] = 2; out[ranked[1]] = 1; }
        return out;
    }
    S18.evYieldFor = evYieldFor;

    function totalEv(g) {
        if (!g || !g.evs) return 0;
        return STAT_KEYS.reduce((sum, k) => sum + (g.evs[k] || 0), 0);
    }
    S18.totalEv = totalEv;

    // Caps bind per-stat (252) and in total (510); excess yield is lost,
    // never redistributed (design C.4 — honest behaviour in a system the
    // player cannot see).
    function addEv(actor, yieldMap) {
        const g = geneticsOf(actor);
        if (!g) return;
        for (const k of STAT_KEYS) {
            const want = yieldMap[k] || 0;
            if (!want) continue;
            const roomStat = 252 - (g.evs[k] || 0);
            const roomTotal = 510 - totalEv(g);
            const add = Math.max(0, Math.min(want, roomStat, roomTotal));
            if (add > 0) g.evs[k] = (g.evs[k] || 0) + add;
        }
    }
    S18.addEv = addEv;

    // ---------------------------------------------------------------------
    // 18.6 Birth seams (design C.2) — where profiles are born
    // ---------------------------------------------------------------------
    // Actor (re)setup is a (re)birth of the individual: any old record
    // goes. Creation rolls happen at setGanjukoSpecies (starters, gifts,
    // every giveGanjuko product) — evolution calls setGanjukoSpecies too,
    // but the record EXISTS by then and is the individual's, untouched.
    try {
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.setup === "function") {
            const _s18_actor_setup = Game_Actor.prototype.setup;
            Game_Actor.prototype.setup = function(actorId) {
                _s18_actor_setup.call(this, actorId);
                this._ganjukoGenetics = null;
            };
        }
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.setGanjukoSpecies === "function") {
            const _s18_setSpecies = Game_Actor.prototype.setGanjukoSpecies;
            Game_Actor.prototype.setGanjukoSpecies = function(speciesId) {
                _s18_setSpecies.call(this, speciesId);
                try {
                    if (!this._ganjukoGenetics) {
                        this._ganjukoGenetics = rollProfile(0);
                        this._ganjukoGenetics._freshBirth = true;
                        stampMetPlace(this, false);
                    }
                } catch (e) {}
            };
        }
        // Wild/trainer enemies roll at setup, tiered by who sent them
        // (design C.2): wild uniform; trainer floored at 12; gym leaders
        // floored at 24; Stadium and Champion all 31. Never displayed.
        if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.setupGanjukoEnemy === "function") {
            const _s18_enemy_setup = Game_Enemy.prototype.setupGanjukoEnemy;
            Game_Enemy.prototype.setupGanjukoEnemy = function(speciesId, level) {
                _s18_enemy_setup.call(this, speciesId, level);
                try {
                    let floor = 0;
                    const t = (typeof $gameTemp !== "undefined" && $gameTemp) || {};
                    if (t._stadiumActive) floor = 31;
                    else if (t._isTrainerBattle) {
                        const name = t._trainerName || "";
                        if (/champion/i.test(name)) floor = 31;
                        else if (/gym leader/i.test(name)) floor = 24;
                        else floor = 12;
                    }
                    this._ganjukoGenetics = rollProfile(floor);
                    this._s18YieldBanked = false;
                    // Section 18 SUPERSEDES the pilot-era 4% hue "shiny":
                    // the only variant now is Chroma (1/1024, per-type
                    // colour-matrix, design AREA-ENCOUNTERS). The legacy
                    // surfaces that read _isShiny (the battle HUD's star)
                    // become the Chroma marker; the hue itself is zeroed
                    // because the matrix filter does the colour work.
                    this._isShiny = !!this._ganjukoGenetics.chroma;
                    this._battlerHue = 0;
                    if (typeof this.recoverAll === "function") this.recoverAll();
                } catch (e) {}
            };
        }
        _s18_status.birthSeams = true;
    } catch (e) {}

    // giveGanjuko is THE creation path for owned creatures. It consumes
    // the pending-genetics hand-off ($gameTemp._ganjukoPendingGenetics —
    // the same pattern capture and eggs use, design C.2/C.5) and
    // normalizes birth bond: the changeLevel inside giveGanjuko fires
    // levelUp per level, which must not make a newborn arrive bonded.
    try {
        if (typeof GE.giveGanjuko === "function") {
            const _s18_give = GE.giveGanjuko;
            GE.giveGanjuko = function(speciesId, level, nickname) {
                let pending = null;
                try {
                    if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._ganjukoPendingGenetics) {
                        pending = $gameTemp._ganjukoPendingGenetics;
                        $gameTemp._ganjukoPendingGenetics = null;
                    }
                } catch (e) {}
                const res = _s18_give.call(this, speciesId, level, nickname);
                try {
                    if (res && res.actor) {
                        if (pending) {
                            res.actor._ganjukoGenetics = cloneProfile(pending);
                            stampMetPlace(res.actor, false);
                        }
                        const g = res.actor._ganjukoGenetics;
                        if (g && g._freshBirth) {
                            g.bond = 0;
                            g.battles = 0;
                            delete g._freshBirth;
                        }
                    }
                } catch (e) {}
                return res;
            };
        }
    } catch (e) {}

    // Capture: the creature you fought IS the creature you caught
    // (design C.2). processGanjukoCapture creates the actor from the
    // troop member — hand its exact profile over. The same wrap later
    // distributes this battle's EV yields and bond (a capture is a won
    // battle for the participants).
    function inBattleNow() {
        try { return typeof $gameTroop !== "undefined" && $gameTroop && typeof $gameTroop.inBattle === "function" && $gameTroop.inBattle(); }
        catch (e) { return false; }
    }
    function exhibitionBattle() {
        try {
            const t = (typeof $gameTemp !== "undefined" && $gameTemp) || {};
            return !!(t._stadiumActive || t._arenaActive);
        } catch (e) { return false; }
    }

    // ---------------------------------------------------------------------
    // 18.7 Daycare inheritance (design C.5)
    // depositDaycare additionally snapshots each depositor's genetics
    // into the slot entry — a snapshot, not a live reference. The egg's
    // child (line-root species + inherited profile) is computed when the
    // egg ripens, rides the carried Egg object, and is handed over at
    // hatch through the same pending-genetics seam capture uses.
    // ---------------------------------------------------------------------
    function breedProfile(g1, g2) {
        const rng = Math.random;
        const ivs = {};
        const keys = STAT_KEYS.slice();
        // Exactly 3 distinct stats are inherited; each takes one parent's
        // value (coin-flip parent per stat). The other 3 roll fresh.
        const inherited = new Set();
        while (inherited.size < 3) inherited.add(keys[Math.floor(rng() * keys.length)]);
        for (const k of keys) {
            if (inherited.has(k)) {
                let parent = rng() < 0.5 ? g1 : g2;
                if (!parent) parent = g1 || g2;
                ivs[k] = parent && parent.ivs ? (parent.ivs[k] || 0) : Math.floor(rng() * 32);
            } else {
                ivs[k] = Math.floor(rng() * 32);
            }
        }
        let trait;
        if ((g1 || g2) && rng() < 0.5) {
            let parent = rng() < 0.5 ? g1 : g2;
            if (!parent) parent = g1 || g2;
            trait = parent.trait;
        } else {
            trait = TRAITS[Math.floor(rng() * TRAITS.length)];
        }
        const child = makeProfile(randomSeed(), ivs, trait);
        return child;
    }
    S18.breedProfile = breedProfile;

    function computeDaycareChild(d) {
        if (!d || !d.slot1 || !d.slot2) return null;
        const g1 = d.slot1.genetics ? cloneProfile(d.slot1.genetics) : null;
        const g2 = d.slot2.genetics ? cloneProfile(d.slot2.genetics) : null;
        return { speciesId: rootOfSpecies(d.slot1.id), genetics: breedProfile(g1, g2) };
    }
    S18.computeDaycareChild = computeDaycareChild;

    try {
        if (typeof GE.depositDaycare === "function") {
            const _s18_deposit = GE.depositDaycare;
            GE.depositDaycare = function(slot) {
                let snap = null;
                try {
                    const member = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers()[1] : null;
                    if (member) snap = cloneProfile(geneticsOf(member));
                } catch (e) {}
                _s18_deposit.call(this, slot);
                try {
                    const d = (typeof $gameSystem !== "undefined" && $gameSystem) ? $gameSystem._daycare : null;
                    const entry = d ? (slot === 1 ? d.slot1 : d.slot2) : null;
                    if (entry && snap) entry.genetics = snap;
                } catch (e) {}
            };
        }
        _s18_status.daycare = true;
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 18.8 Battle bookkeeping — yields banked at each faint, EXP
    // recipients recorded, distribution at turn/victory boundaries
    // (design C.4: EV follows EXP exactly). Bond participation tracked
    // alongside (design C.7: +1 won battle, +1/256 steps, +2/level,
    // +5/badge — it never decays).
    // ---------------------------------------------------------------------
    function tempState() {
        return (typeof $gameTemp !== "undefined" && $gameTemp) ? $gameTemp : null;
    }
    function resetBattleBookkeeping() {
        const t = tempState();
        if (!t) return;
        t._s18YieldBank = [];
        t._s18ExpRecipients = [];
        t._s18Participants = [];
        t._s18EndureUsed = {};
        t._s18LookbackShown = {};
        t._s18VictoryBondDone = false;
    }
    function noteParticipant(actor) {
        const t = tempState();
        if (!t || !actor) return;
        t._s18Participants = t._s18Participants || [];
        const id = typeof actor.actorId === "function" ? actor.actorId() : 0;
        if (id && !t._s18Participants.includes(id)) t._s18Participants.push(id);
    }
    function distributeYields() {
        const t = tempState();
        if (!t) return;
        const bank = t._s18YieldBank || [];
        const recipients = t._s18ExpRecipients || [];
        t._s18YieldBank = [];
        t._s18ExpRecipients = [];
        if (!bank.length || !recipients.length) return;
        if (exhibitionBattle()) return; // exhibitions grant neither (C.4/A.6 spirit)
        try {
            const actors = (typeof $gameActors !== "undefined" && $gameActors) ? $gameActors : null;
            if (!actors) return;
            for (const speciesId of bank) {
                const yieldMap = evYieldFor(speciesId);
                for (const actorId of recipients) {
                    const actor = actors.actor(actorId);
                    if (actor) addEv(actor, yieldMap);
                }
            }
        } catch (e) {}
    }
    S18.distributeYields = distributeYields;

    function applyVictoryBond() {
        const t = tempState();
        if (!t || t._s18VictoryBondDone) return;
        t._s18VictoryBondDone = true;
        if (exhibitionBattle()) return;
        try {
            const ids = new Set(t._s18Participants || []);
            if (typeof $gameParty !== "undefined" && $gameParty) {
                for (const m of $gameParty.battleMembers()) {
                    if (m && typeof m.actorId === "function") ids.add(m.actorId());
                }
            }
            if (typeof $gameActors === "undefined" || !$gameActors) return;
            for (const id of ids) {
                const actor = $gameActors.actor(id);
                if (!actor) continue;
                const g = geneticsOf(actor);
                if (g) {
                    g.bond = Math.min(255, (g.bond || 0) + 1);
                    g.battles = (g.battles || 0) + 1;
                }
            }
        } catch (e) {}
    }
    S18.applyVictoryBond = applyVictoryBond;

    try {
        let installed = 0;
        // Faints bank their species' yield (once per enemy setup-life).
        if (typeof Game_BattlerBase !== "undefined" && Game_BattlerBase.prototype && typeof Game_BattlerBase.prototype.die === "function") {
            const _s18_die = Game_BattlerBase.prototype.die;
            Game_BattlerBase.prototype.die = function() {
                try {
                    if (isEnemyBattler(this) && !this._s18YieldBanked &&
                        typeof this.ganjukoSpeciesId === "function" && inBattleNow()) {
                        this._s18YieldBanked = true;
                        const t = tempState();
                        if (t) (t._s18YieldBank = t._s18YieldBank || []).push(this.ganjukoSpeciesId());
                    }
                } catch (e) {}
                _s18_die.call(this);
            };
            installed++;
        }
        // EXP recipients: anyone gainExp actually pays during a battle.
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.gainExp === "function") {
            const _s18_gainExp = Game_Actor.prototype.gainExp;
            Game_Actor.prototype.gainExp = function(exp) {
                _s18_gainExp.call(this, exp);
                try {
                    if (exp > 0 && inBattleNow()) {
                        const t = tempState();
                        if (t && typeof this.actorId === "function") {
                            t._s18ExpRecipients = t._s18ExpRecipients || [];
                            if (!t._s18ExpRecipients.includes(this.actorId())) t._s18ExpRecipients.push(this.actorId());
                        }
                    }
                } catch (e) {}
            };
            installed++;
        }
        if (typeof BattleManager !== "undefined" && BattleManager) {
            if (typeof BattleManager.setup === "function") {
                const _s18_bm_setup = BattleManager.setup;
                BattleManager.setup = function(troopId, canEscape, canLose) {
                    _s18_bm_setup.call(this, troopId, canEscape, canLose);
                    resetBattleBookkeeping();
                };
                installed++;
            }
            if (typeof BattleManager.startBattle === "function") {
                const _s18_bm_start = BattleManager.startBattle;
                BattleManager.startBattle = function() {
                    _s18_bm_start.call(this);
                    try {
                        if (typeof $gameParty !== "undefined" && $gameParty) {
                            for (const m of $gameParty.battleMembers()) noteParticipant(m);
                        }
                    } catch (e) {}
                };
                installed++;
            }
            if (typeof BattleManager.startTurn === "function") {
                const _s18_bm_turn = BattleManager.startTurn;
                BattleManager.startTurn = function() {
                    _s18_bm_turn.call(this);
                    // A trainer's mid-battle KO paid its EXP already (the
                    // engine's queue flow) — its yield lands now, on the
                    // same recipients, before the next turn is fought.
                    distributeYields();
                };
                installed++;
            }
            if (typeof BattleManager.processVictory === "function") {
                const _s18_bm_victory = BattleManager.processVictory;
                BattleManager.processVictory = function() {
                    _s18_bm_victory.call(this);
                    distributeYields();
                    applyVictoryBond();
                };
                installed++;
            }
            if (typeof BattleManager.processGanjukoCapture === "function") {
                const _s18_bm_capture = BattleManager.processGanjukoCapture;
                BattleManager.processGanjukoCapture = function() {
                    try {
                        const enemy = (typeof $gameTroop !== "undefined" && $gameTroop) ? $gameTroop.members()[0] : null;
                        if (enemy && enemy._ganjukoGenetics) {
                            const t = tempState();
                            if (t) t._ganjukoPendingGenetics = cloneProfile(enemy._ganjukoGenetics);
                        }
                    } catch (e) {}
                    _s18_bm_capture.call(this);
                    distributeYields();
                    applyVictoryBond();
                    _s18_status.captureHandoff = true;
                };
                installed++;
            }
            if (typeof BattleManager.endBattle === "function") {
                const _s18_bm_end = BattleManager.endBattle;
                BattleManager.endBattle = function(result) {
                    _s18_bm_end.call(this, result);
                    const t = tempState();
                    if (t) {
                        t._s18YieldBank = [];
                        t._s18ExpRecipients = [];
                        t._s18Participants = [];
                    }
                };
                installed++;
            }
        }
        // Swapped-in leads are participants too.
        if (typeof Game_Party !== "undefined" && Game_Party.prototype && typeof Game_Party.prototype.swapOrder === "function") {
            const _s18_swap = Game_Party.prototype.swapOrder;
            Game_Party.prototype.swapOrder = function(index1, index2) {
                _s18_swap.call(this, index1, index2);
                try { if (inBattleNow()) noteParticipant(this.allMembers()[0]); } catch (e) {}
            };
            installed++;
        }
        _s18_status.evFlow = installed >= 5;
    } catch (e) {}

    // Bond: level gains (+2) and badges (+5 to the party). Level gains
    // during a Stadium run are scaling, not growth — the run's own flags
    // gate them out (the party-scale loop runs under _stadiumRun.active).
    function stadiumScaling() {
        try {
            const t = (typeof $gameTemp !== "undefined" && $gameTemp) || {};
            if (t._stadiumActive) return true;
            if (GE._stadiumRun && GE._stadiumRun.active) return true;
        } catch (e) {}
        return false;
    }
    try {
        let bondHooks = 0;
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.levelUp === "function") {
            const _s18_levelUp = Game_Actor.prototype.levelUp;
            Game_Actor.prototype.levelUp = function() {
                _s18_levelUp.call(this);
                try {
                    if (stadiumScaling()) return;
                    const g = this._ganjukoGenetics;
                    if (g) g.bond = Math.min(255, (g.bond || 0) + 2);
                } catch (e) {}
            };
            bondHooks++;
        }
        if (typeof Game_System !== "undefined" && Game_System.prototype && typeof Game_System.prototype.awardBadge === "function") {
            const _s18_award = Game_System.prototype.awardBadge;
            Game_System.prototype.awardBadge = function(badgeName) {
                let before = 0;
                try { before = this.badges ? this.badges().length : 0; } catch (e) {}
                _s18_award.call(this, badgeName);
                try {
                    const after = this.badges ? this.badges().length : 0;
                    if (after > before && typeof $gameParty !== "undefined" && $gameParty) {
                        for (const member of $gameParty.allMembers()) {
                            const g = geneticsOf(member);
                            if (g) g.bond = Math.min(255, (g.bond || 0) + 5);
                        }
                    }
                } catch (e) {}
            };
            bondHooks++;
        }
        _s18_status.bond = bondHooks === 2;
    } catch (e) {}

    // Steps: +1 bond per 256 steps walked with the creature in the party
    // (design C.7) — folded into the same per-step seam the daycare uses.
    // This wrapper also carries the daycare-egg genetics (18.7): the
    // child is computed when the egg ripens, applied to the carried Egg
    // on first sight, and handed over on the hatch step.
    try {
        if (typeof Game_Party !== "undefined" && Game_Party.prototype && typeof Game_Party.prototype.increaseSteps === "function") {
            const _s18_steps = Game_Party.prototype.increaseSteps;
            Game_Party.prototype.increaseSteps = function() {
                let myPending = null;
                // The step belongs to whoever was in the party when it
                // began: a creature that hatches INTO the party during
                // this very step (below) must not accrue it — otherwise
                // its inherited profile differs from the egg's by the
                // step counter before it has ever walked.
                let preMembers = null;
                try { preMembers = new Set(this.allMembers()); } catch (e) {}
                try {
                    const sys = (typeof $gameSystem !== "undefined" && $gameSystem) ? $gameSystem : null;
                    const egg = sys ? sys._daycareEgg : null;
                    if (egg) {
                        if (!egg._s18ChildApplied) {
                            egg._s18ChildApplied = true;
                            const d = sys._daycare;
                            const child = (d && d._s18EggChild) || computeDaycareChild(d || {});
                            if (child) {
                                egg.speciesId = child.speciesId;
                                egg._s18Genetics = child.genetics;
                            }
                        }
                        if (egg._s18Genetics && (egg.stepsLeft || 256) <= 1) {
                            const t = tempState();
                            if (t) {
                                myPending = cloneProfile(egg._s18Genetics);
                                t._ganjukoPendingGenetics = myPending;
                            }
                        }
                    }
                } catch (e) {}
                _s18_steps.call(this);
                try {
                    const sys = (typeof $gameSystem !== "undefined" && $gameSystem) ? $gameSystem : null;
                    // If the hatch did not consume the pending profile I
                    // placed (no genetics on the egg), take it back so it
                    // can never leak into an unrelated creation.
                    const t = tempState();
                    if (myPending && t && t._ganjukoPendingGenetics === myPending) t._ganjukoPendingGenetics = null;
                    if (sys && sys._daycare && sys._daycare.eggReady && !sys._daycare._s18EggChild) {
                        const child = computeDaycareChild(sys._daycare);
                        if (child) sys._daycare._s18EggChild = child;
                    }
                    if (typeof $gameParty !== "undefined" && $gameParty) {
                        for (const member of $gameParty.allMembers()) {
                            if (preMembers && !preMembers.has(member)) continue;
                            const g = member && member._ganjukoGenetics;
                            if (!g) continue;
                            g.steps = (g.steps || 0) + 1;
                            if (g.steps >= 256) {
                                g.steps -= 256;
                                g.bond = Math.min(255, (g.bond || 0) + 1);
                            }
                        }
                    }
                } catch (e) {}
            };
        }
    } catch (e) {}


    // ---------------------------------------------------------------------
    // 18.9 Bond's one real effect (design C.7): the look-back endure.
    // At bond >= 230, once per battle, a creature of yours that would
    // faint instead endures at 1 HP — announced by its own text every
    // time. At bond >= 180 the look-back also fires as pure flavour
    // (on a critical hit landed, or on being brought to <=10% HP),
    // occasionally, at most once per battle per creature.
    // ---------------------------------------------------------------------
    function battleLogLine(text) {
        try {
            if (typeof BattleManager !== "undefined" && BattleManager && BattleManager._logWindow &&
                typeof BattleManager._logWindow.push === "function") {
                BattleManager._logWindow.push("addText", text);
            }
        } catch (e) {}
    }
    function lookbackText(actor) {
        return "\\C[14]" + actor.name() + "\\C[0] looked back at you — and held on!";
    }
    function maybeLookback(actor) {
        try {
            const t = tempState();
            if (!t || !actor || typeof actor.actorId !== "function") return;
            t._s18LookbackShown = t._s18LookbackShown || {};
            const id = actor.actorId();
            if (t._s18LookbackShown[id]) return;
            if (Math.random() >= 0.5) return;
            t._s18LookbackShown[id] = true;
            battleLogLine(lookbackText(actor));
        } catch (e) {}
    }
    try {
        let endureHooks = 0;
        if (typeof Game_Battler !== "undefined" && Game_Battler.prototype && typeof Game_Battler.prototype.gainHp === "function") {
            const _s18_gainHp = Game_Battler.prototype.gainHp;
            Game_Battler.prototype.gainHp = function(value) {
                let endured = false;
                try {
                    if (value < 0 && isActorBattler(this) && inBattleNow() &&
                        typeof this.isAlive === "function" && this.isAlive()) {
                        const g = this._ganjukoGenetics;
                        if (g && (g.bond || 0) >= 230 && this.hp + value <= 0 && this.hp > 0) {
                            const t = tempState();
                            const used = t ? (t._s18EndureUsed = t._s18EndureUsed || {}) : {};
                            if (!used[this.actorId()]) {
                                used[this.actorId()] = true;
                                value = -(this.hp - 1);
                                endured = true;
                            }
                        }
                    }
                } catch (e) {}
                _s18_gainHp.call(this, value);
                try {
                    if (endured) {
                        battleLogLine(lookbackText(this));
                    } else if (value < 0 && isActorBattler(this) && inBattleNow() &&
                        typeof this.isAlive === "function" && this.isAlive()) {
                        const g = this._ganjukoGenetics;
                        if (g && (g.bond || 0) >= 180 && this.hp > 0 &&
                            this.hp <= Math.max(1, Math.floor(this.mhp * 0.10))) {
                            maybeLookback(this);
                        }
                    }
                } catch (e) {}
            };
            endureHooks++;
        }
        if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.executeHpDamage === "function") {
            const _s18_execHp = Game_Action.prototype.executeHpDamage;
            Game_Action.prototype.executeHpDamage = function(target, value) {
                _s18_execHp.call(this, target, value);
                try {
                    if (value > 0 && inBattleNow() && target && typeof target.result === "function" &&
                        target.result() && target.result().critical) {
                        const subject = typeof this.subject === "function" ? this.subject() : null;
                        if (subject && isActorBattler(subject)) {
                            const g = subject._ganjukoGenetics;
                            if (g && (g.bond || 0) >= 180) maybeLookback(subject);
                        }
                    }
                } catch (e) {}
            };
            endureHooks++;
        }
        _s18_status.endure = endureHooks >= 1;
    } catch (e) {}

    // The hop (design C.7): at high bond the lead's follower occasionally
    // hops on entering a new map. Pure joy, no function.
    try {
        let hopHooks = 0;
        if (typeof Game_Player !== "undefined" && Game_Player.prototype && typeof Game_Player.prototype.performTransfer === "function") {
            const _s18_transfer = Game_Player.prototype.performTransfer;
            Game_Player.prototype.performTransfer = function(reserve) {
                _s18_transfer.call(this, reserve);
                try {
                    const t = tempState();
                    if (t) t._s18HopFrames = 100 + Math.floor(Math.random() * 60);
                } catch (e) {}
            };
            hopHooks++;
        }
        if (typeof Game_Map !== "undefined" && Game_Map.prototype && typeof Game_Map.prototype.update === "function") {
            const _s18_map_update = Game_Map.prototype.update;
            Game_Map.prototype.update = function(sceneActive) {
                _s18_map_update.call(this, sceneActive);
                try {
                    const t = tempState();
                    if (t && t._s18HopFrames > 0) {
                        t._s18HopFrames--;
                        if (t._s18HopFrames === 0) {
                            const lead = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers()[0] : null;
                            const g = lead && lead._ganjukoGenetics;
                            if (g && (g.bond || 0) >= 180 && Math.random() < 0.6 &&
                                typeof $gamePlayer !== "undefined" && $gamePlayer && typeof $gamePlayer.followers === "function") {
                                const follower = $gamePlayer.followers().data()[0];
                                if (follower && typeof follower.jump === "function") follower.jump(0, 0);
                            }
                        }
                    }
                } catch (e) {}
            };
            hopHooks++;
        }
        _s18_status.hop = hopHooks === 2;
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 18.10 CHROMA rendering (design AREA-ENCOUNTERS): NO new art. The
    // battler is drawn through a runtime colour matrix — hue rotation by
    // a per-type offset + partial inversion — so a Chroma reads as "the
    // same creature, impossibly coloured". The follower/walk sprite
    // approximates the same shift with a blend tint (MZ character
    // sprites cannot take the full matrix cheaply).
    // ---------------------------------------------------------------------
    const TYPE_CHROMA = {
        1: { base: 45, off: 160, inv: 0.22 },   // Normal
        2: { base: 15, off: 170, inv: 0.22 },   // Fire
        3: { base: 215, off: 140, inv: 0.22 },  // Water
        4: { base: 120, off: 180, inv: 0.22 },  // Nature
        5: { base: 55, off: 200, inv: 0.22 },   // Volt
        6: { base: 30, off: 150, inv: 0.24 },   // Earth
        7: { base: 165, off: 170, inv: 0.22 },  // Wind
        8: { base: 270, off: 120, inv: 0.30 },  // Umbra (dark: more inversion)
        9: { base: 315, off: 160, inv: 0.18 }   // Astral
    };
    S18.TYPE_CHROMA = TYPE_CHROMA;
    function chromaEntry(typeId) { return TYPE_CHROMA[typeId] || TYPE_CHROMA[1]; }

    // The full recipe as a 5x4 colour matrix (pure — unit-tested).
    function chromaMatrix(typeId) {
        const e = chromaEntry(typeId);
        const rad = e.off * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const H = [
            0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
            0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.140, 0.072 - cos * 0.072 - sin * 0.283,
            0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072
        ];
        const s = 1 - 2 * e.inv, k = e.inv;
        return [
            s * H[0], s * H[1], s * H[2], 0, k,
            s * H[3], s * H[4], s * H[5], 0, k,
            s * H[6], s * H[7], s * H[8], 0, k,
            0, 0, 0, 1, 0
        ];
    }
    S18.chromaMatrix = chromaMatrix;

    function chromaFilter(typeId) {
        try {
            if (typeof PIXI !== "undefined" && PIXI.filters && PIXI.filters.ColorMatrixFilter) {
                const f = new PIXI.filters.ColorMatrixFilter();
                f.matrix = chromaMatrix(typeId);
                return f;
            }
        } catch (e) {}
        try {
            // Fallback: MZ's own ColorFilter (hue rotation only).
            if (typeof ColorFilter !== "undefined") {
                const cf = new ColorFilter();
                if (typeof cf.setHue === "function") cf.setHue(chromaEntry(typeId).off);
                return cf;
            }
        } catch (e) {}
        return null;
    }
    S18.chromaFilter = chromaFilter;

    function hslToRgb(h, s, l) {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
    }
    // Follower tint: the type's chroma hue as a blend colour (MZ blend
    // alpha runs 0-255).
    function chromaTintFor(typeId) {
        const e = chromaEntry(typeId);
        const hue = (((e.base + e.off) % 360) + 360) % 360;
        const rgb = hslToRgb(hue, 0.7, 0.55);
        return [rgb[0], rgb[1], rgb[2], 96];
    }
    S18.chromaTintFor = chromaTintFor;

    function spawnChromaBurst(ss, battlerSpr) {
        try {
            if (typeof Bitmap === "undefined" || typeof Sprite === "undefined") return;
            const parent = battlerSpr.parent || ss._battleField || ss;
            if (!parent || typeof parent.addChild !== "function") return;
            const bmp = new Bitmap(56, 56);
            bmp.fontSize = 42;
            bmp.textColor = "#FFD700";
            bmp.drawText("★", 0, 0, 56, 48, "center");
            const s = new Sprite(bmp);
            s.anchor.x = 0.5; s.anchor.y = 0.5;
            s.x = battlerSpr.x || 0;
            s.y = (battlerSpr.y || 0) - 90;
            s.opacity = 0;
            parent.addChild(s);
            (ss._s18Bursts = ss._s18Bursts || []).push({ sprite: s, t: 0 });
        } catch (e) {}
    }
    function stepChromaBursts(ss) {
        const list = ss._s18Bursts;
        if (!list || !list.length) return;
        for (let i = list.length - 1; i >= 0; i--) {
            const b = list[i];
            b.t++;
            const k = b.t / 50;
            if (k >= 1) {
                try { if (b.sprite.parent) b.sprite.parent.removeChild(b.sprite); } catch (e) {}
                list.splice(i, 1);
                continue;
            }
            b.sprite.opacity = Math.floor(255 * Math.sin(Math.PI * Math.min(1, k)));
            const sc = 0.6 + k * 1.1;
            b.sprite.scale.x = sc; b.sprite.scale.y = sc;
            b.sprite.y -= 0.7;
        }
    }
    function applyBattlerChroma(ss, spr, typeId) {
        if (!spr) return;
        const want = typeId || 0;
        if ((spr._s18ChromaType || 0) === want) return;
        spr._s18ChromaType = want;
        try {
            const f = want ? chromaFilter(want) : null;
            spr.filters = f ? [f] : null;
        } catch (e) {}
        if (want) spawnChromaBurst(ss, spr);
    }
    function refreshBattleChroma(ss) {
        if (!ss) return;
        try {
            const foes = ss._enemySprites || [];
            for (const spr of foes) {
                const b = spr && (spr._enemy || spr._battler);
                let want = 0;
                if (b && b._ganjukoGenetics && b._ganjukoGenetics.chroma && typeof b.ganjukoSpecies === "function") {
                    const sp = b.ganjukoSpecies();
                    want = sp ? (sp.type1 || 1) : 1;
                }
                applyBattlerChroma(ss, spr, want);
            }
            const ps = ss._playerGanjukoSprite;
            if (ps) {
                let want = 0;
                try {
                    const lead = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers()[0] : null;
                    if (lead && lead._ganjukoGenetics && lead._ganjukoGenetics.chroma && typeof lead.ganjukoSpecies === "function") {
                        const sp = lead.ganjukoSpecies();
                        want = sp ? (sp.type1 || 1) : 1;
                    }
                } catch (e) {}
                applyBattlerChroma(ss, ps, want);
            }
            stepChromaBursts(ss);
        } catch (e) {}
    }
    S18.refreshBattleChroma = refreshBattleChroma;

    try {
        let chromaHooks = 0;
        if (typeof Spriteset_Battle !== "undefined" && Spriteset_Battle.prototype) {
            if (typeof Spriteset_Battle.prototype.createLowerLayer === "function") {
                const _s18_createLower = Spriteset_Battle.prototype.createLowerLayer;
                Spriteset_Battle.prototype.createLowerLayer = function() {
                    _s18_createLower.call(this);
                    this._s18Bursts = [];
                    refreshBattleChroma(this);
                };
                chromaHooks++;
            }
            if (typeof Spriteset_Battle.prototype.update === "function") {
                const _s18_ss_update = Spriteset_Battle.prototype.update;
                Spriteset_Battle.prototype.update = function() {
                    _s18_ss_update.call(this);
                    refreshBattleChroma(this);
                };
                chromaHooks++;
            }
        }
        _s18_status.chromaSprites = chromaHooks === 2;
    } catch (e) {}

    // Follower/walk tint (the design's approximation for map sprites).
    try {
        if (typeof Sprite_Character !== "undefined" && Sprite_Character.prototype && typeof Sprite_Character.prototype.updateBitmap === "function") {
            const _s18_updateBitmap = Sprite_Character.prototype.updateBitmap;
            Sprite_Character.prototype.updateBitmap = function() {
                _s18_updateBitmap.call(this);
                try {
                    const ch = this._character;
                    if (!ch || typeof Game_Follower === "undefined" || !(ch instanceof Game_Follower)) return;
                    const a = typeof ch.actor === "function" ? ch.actor() : null;
                    let key = 0, rgba = null;
                    if (a && a._ganjukoGenetics && a._ganjukoGenetics.chroma && typeof a.ganjukoSpecies === "function") {
                        const sp = a.ganjukoSpecies();
                        key = sp ? (sp.type1 || 1) : 1;
                        rgba = chromaTintFor(key);
                    }
                    if ((this._s18TintKey || 0) !== key) {
                        this._s18TintKey = key;
                        if (typeof this.setBlendColor === "function") this.setBlendColor(rgba || [0, 0, 0, 0]);
                    }
                } catch (e) {}
            };
            _s18_status.followerTint = true;
        }
    } catch (e) {}


    // ---------------------------------------------------------------------
    // 18.11 The Character Sheet (design D.6) — evolution of the existing
    // Summary scene, same menu entry, rebuilt presentation: the sprite
    // gets the biggest area, prose outranks numbers, hearts sit beside
    // the name, and the stat block is last and quietest. Everything the
    // hidden systems are allowed to say is said here — and nothing they
    // aren't (C.6). The window class lives in the core IIFE's closure,
    // so the sheet is installed by patching the live window instance
    // from the scene's create — the original refresh stays as fallback.
    // ---------------------------------------------------------------------
    function wrapText(text, maxChars) {
        const words = String(text || "").split(/\s+/).filter(w => w.length);
        const lines = [];
        let line = "";
        for (const w of words) {
            if ((line + " " + w).trim().length > maxChars && line) {
                lines.push(line);
                line = w;
            } else {
                line = line ? line + " " + w : w;
            }
        }
        if (line) lines.push(line);
        return lines;
    }
    S18.wrapText = wrapText;

    function drawSheet(win) {
        if (typeof $gameParty === "undefined" || !$gameParty) return;
        const members = $gameParty.allMembers();
        win.contents.clear();
        if (!members.length) return;
        const idx = Math.min(Math.max(0, win._memberIndex || 0), members.length - 1);
        const actor = members[idx];
        const sp = typeof actor.ganjukoSpecies === "function" ? actor.ganjukoSpecies() : null;
        if (!sp) return;
        const g = geneticsOf(actor);
        const W = win.innerWidth, H = win.innerHeight;
        const typeInfo = GE.getTypeInfo(sp.type1 || 1);
        const type2Info = sp.type2 ? GE.getTypeInfo(sp.type2) : null;
        const sysColor = (typeof ColorManager !== "undefined" && ColorManager.systemColor) ? ColorManager.systemColor() : "#ffffff";
        const setSize = n => { try { win.contents.fontSize = n; } catch (e) {} };
        const setItalic = b => { try { win.contents.fontItalic = b; } catch (e) {} };
        const setColor = c => { try { win.changeTextColor(c); } catch (e) {} };
        const draw = (text, x, y, w, align) => { win.drawText(String(text), x, y, w, align || "left"); };
        try { if (typeof win.resetFontSettings === "function") win.resetFontSettings(); } catch (e) {}

        // Ground shadow for the portrait (Section 17's grounding idea,
        // drawn as overlapping soft circles — an ellipse by accumulation).
        try {
            for (const dx of [-72, -36, 0, 36, 72]) {
                win.contents.drawCircle(215 + dx, 452, 34, "rgba(0,0,0,0.26)");
            }
        } catch (e) {}

        // Battler portrait — the biggest area on any menu screen.
        try {
            if (!win._battlerSprite && typeof Sprite !== "undefined") {
                win._battlerSprite = new Sprite();
                win._battlerSprite.anchor.x = 0.5;
                win._battlerSprite.anchor.y = 0.5;
                win.addChild(win._battlerSprite);
            }
            const spr = win._battlerSprite;
            if (spr) {
                spr.visible = true;
                spr.x = 215; spr.y = 268;
                const bmp = ImageManager.loadEnemy(sp.battlerName);
                spr.bitmap = bmp;
                const fit = () => {
                    try {
                        const bw = (bmp && bmp.width) || 1, bh = (bmp && bmp.height) || 1;
                        const s = Math.min(1, 330 / bw, 310 / bh);
                        spr.scale.x = s; spr.scale.y = s;
                    } catch (e) {}
                };
                if (bmp && typeof bmp.addLoadListener === "function") bmp.addLoadListener(fit); else fit();
                try {
                    const f = (g && g.chroma) ? chromaFilter(sp.type1 || 1) : null;
                    spr.filters = f ? [f] : null;
                } catch (e) {}
            }
        } catch (e) {}

        // Walk inset — the same individual, on the ground.
        try {
            if (!win._s18WalkSprite && typeof Sprite !== "undefined") {
                win._s18WalkSprite = new Sprite();
                win._s18WalkSprite.anchor.x = 0.5;
                win._s18WalkSprite.anchor.y = 1;
                win.addChild(win._s18WalkSprite);
            }
            const ws = win._s18WalkSprite;
            if (ws) {
                ws.visible = true;
                ws.x = 338; ws.y = 452;
                const cbmp = ImageManager.loadCharacter(sp.characterName);
                ws.bitmap = cbmp;
                const frame = () => {
                    try {
                        const big = (sp.characterName || "").charAt(0) === "$";
                        const pw = big ? cbmp.width / 3 : cbmp.width / 12;
                        const ph = big ? cbmp.height / 4 : cbmp.height / 8;
                        let fx = pw, fy = 0;
                        if (!big) {
                            const ci = sp.characterIndex || 0;
                            fx = (ci % 4) * 3 * pw + pw;
                            fy = Math.floor(ci / 4) * 4 * ph;
                        }
                        ws.setFrame(fx, fy, pw, ph);
                        const sc = Math.min(1, 76 / ph);
                        ws.scale.x = sc; ws.scale.y = sc;
                    } catch (e) {}
                };
                if (cbmp && typeof cbmp.addLoadListener === "function") cbmp.addLoadListener(frame); else frame();
                try {
                    if (typeof ws.setBlendColor === "function") {
                        ws.setBlendColor(g && g.chroma ? chromaTintFor(sp.type1 || 1) : [0, 0, 0, 0]);
                    }
                } catch (e) {}
            }
        } catch (e) {}

        // Header — name, level, hearts beside the name (never a number).
        setSize(28);
        draw(actor.name() + "   Lv " + actor.level, 16, 2, W - 250, "left");
        setSize(23);
        setColor("#FFD700");
        draw(heartsString(g ? g.bond : 0), W - 216, 8, 200, "right");
        setColor(sysColor);
        setSize(21);
        draw(sp.title + "  ·  " + typeInfo.name + (type2Info ? " / " + type2Info.name : ""), 16, 42, W - 250, "left");
        if (g && g.chroma) {
            setColor("#FFD700");
            draw("★ CHROMA", W - 216, 42, 200, "right");
        }
        win.resetTextColor();

        // Prose zone — outranks numbers by design.
        const PX = 452, PW = W - PX - 16;
        const shape = {};
        for (const k of STAT_KEYS) shape[k] = (sp.baseStats[k] || 0) + ((g && g.ivs[k]) || 0);
        setItalic(true);
        setSize(24);
        setColor("#FFD700");
        draw(flavorProfile(g, shape), PX, 78, PW, "left");
        win.resetTextColor();
        setSize(21);
        let ly = 112;
        for (const line of wrapText(sp.desc || "", 62).slice(0, 3)) { draw(line, PX, ly, PW, "left"); ly += 30; }
        setItalic(true);
        ly = 214;
        for (const line of wrapText(temperamentLine(g), 62).slice(0, 2)) { draw(line, PX, ly, PW, "left"); ly += 30; }
        setItalic(false);
        draw(relationshipLine(g ? g.bond : 0), PX, 284, PW, "left");
        setColor(sysColor);
        draw("Personality:", PX, 320, 150, "left");
        win.resetTextColor();
        draw(g ? g.trait.toUpperCase() : "—", PX + 150, 320, PW - 150, "left");
        setColor(sysColor);
        draw("Battles together:", PX, 352, 190, "left");
        win.resetTextColor();
        draw(String(g ? (g.battles || 0) : 0) + (g && g.metPlace ? "   ·   With you since " + g.metPlace : "   ·   With you since the start of the journey"), PX + 190, 352, PW - 190, "left");
        setColor(sysColor);
        draw("Moves:", PX, 388, 90, "left");
        win.resetTextColor();
        const moveNames = (typeof actor.skills === "function" ? actor.skills() : []).map(s => s.name).filter(Boolean);
        ly = 388;
        for (const line of wrapText(moveNames.join("  ·  ") || "—", 58).slice(0, 2)) { draw(line, PX + 90, ly, PW - 90, "left"); ly += 30; }
        setColor(sysColor);
        draw("Evolution:", PX, 446, 130, "left");
        win.resetTextColor();
        if (sp.evolveTo > 0) {
            const nextSp = GE.getSpeciesByRecordId(sp.evolveTo) || GE.getSpecies(sp.evolveTo);
            draw("Evolves into " + (nextSp ? nextSp.name : "?") + " at Level " + sp.evolveLv, PX + 130, 446, PW - 130, "left");
        } else {
            draw("Final Form (Fully evolved)", PX + 130, 446, PW - 130, "left");
        }

        // Stat block — last and quietest. FINAL params only; bars scale
        // to what this species can be at Lv 100 (design D.6). There is
        // no breakdown, and there never will be. Layout: ONE row of six
        // across the full width at a fixed y=486, in the band between
        // the prose zone (ends 474) and the footer. Two earlier layouts
        // failed live: a 2-column block collided with the Moves lines,
        // and a 3x2 grid's second row landed outside the visible window
        // on the real summary scene (its inner height is smaller than
        // the canvas suggests). A single row cannot be clipped by any
        // window height that still shows the footer, and it matches the
        // Dex's horizontal stat-bar language.
        const statRows = [
            ["HP", 0, actor.mhp], ["ATK", 2, actor.atk], ["DEF", 3, actor.def],
            ["MAT", 4, actor.mat], ["MDF", 5, actor.mdf], ["AGI", 6, actor.agi]
        ];
        const statsY = 486;
        const colW = Math.floor(W / 6) - 8;
        setSize(17);
        statRows.forEach((row, i) => {
            const colX = 16 + i * (colW + 4);
            const label = row[0], paramId = row[1], value = row[2];
            const maxForBar = GE.unifiedParam(sp.baseStats, paramId, 100) + 94;
            const frac = Math.max(0, Math.min(1, (value || 0) / Math.max(1, maxForBar)));
            setColor(sysColor);
            draw(label, colX, statsY, 44, "left");
            win.resetTextColor();
            draw(String(value), colX + colW - 46, statsY, 46, "right");
            try {
                win.contents.fillRect(colX + 48, statsY + 6, colW - 100, 10, "rgba(255,255,255,0.14)");
                win.contents.fillRect(colX + 48, statsY + 6, Math.round((colW - 100) * frac), 10, typeInfo.color || "#38BDF8");
            } catch (e) {}
        });
        // Ability line (v13, Section 21): the individual's own rolled
        // ability — public info (name + one-liner), never a number.
        try {
            if (GE.S21 && typeof GE.S21.abilityLineFor === "function") {
                const abLine = GE.S21.abilityLineFor(actor);
                if (abLine) {
                    setSize(15);
                    setColor(sysColor);
                    draw("Ability:", PX, statsY + 30, 90, "left");
                    win.resetTextColor();
                    let txt = abLine.name + " — " + abLine.desc;
                    if (txt.length > 118) txt = txt.slice(0, 117) + "…";
                    draw(txt, PX + 90, statsY + 30, PW - 90, "left");
                }
            }
        } catch (e) {}
        setSize(16);
        setColor(sysColor);
        draw("← / → : Next partner      B : Back", 16, H - 26, 500, "left");
        win.resetTextColor();
        try { if (typeof win.resetFontSettings === "function") win.resetFontSettings(); } catch (e) {}
    }
    S18.drawCharacterSheet = drawSheet;

    try {
        if (typeof Scene_GanjukoSummary !== "undefined" && Scene_GanjukoSummary.prototype &&
            typeof Scene_GanjukoSummary.prototype.create === "function") {
            const _s18_summary_create = Scene_GanjukoSummary.prototype.create;
            Scene_GanjukoSummary.prototype.create = function() {
                _s18_summary_create.call(this);
                try {
                    const win = this._summaryWindow;
                    if (win && !win._s18Patched) {
                        win._s18Patched = true;
                        const origRefresh = win.refresh;
                        win.refresh = function() {
                            try { drawSheet(this); }
                            catch (e) { if (typeof origRefresh === "function") origRefresh.call(this); }
                        };
                        win.refresh();
                    }
                } catch (e) {}
            };
            _s18_status.sheet = true;
        }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 18.12 Dex additions (design decision 5 + Chroma surfaces): the
    // species role line describes the KIND; a Chroma tag appears when a
    // Chroma of that kind travels with the player. Drawn as a footer on
    // the detail window (instance-patched like the sheet).
    // ---------------------------------------------------------------------
    S18.ownsChroma = function(posId) {
        try {
            const check = a => {
                if (!a || typeof a.ganjukoSpeciesId !== "function") return false;
                if (a.ganjukoSpeciesId() !== posId) return false;
                const g = geneticsOf(a);
                return !!(g && g.chroma);
            };
            if (typeof $gameParty !== "undefined" && $gameParty) {
                for (const m of $gameParty.allMembers()) if (check(m)) return true;
            }
            if (typeof $gameSystem !== "undefined" && $gameSystem && typeof $gameSystem.ganjukoBox === "function" &&
                typeof $gameActors !== "undefined" && $gameActors) {
                for (const id of $gameSystem.ganjukoBox()) {
                    if (check($gameActors.actor(id))) return true;
                }
            }
        } catch (e) {}
        return false;
    };

    function drawDexExtras(win) {
        const sp = GE.getSpecies(win._speciesId);
        if (!sp) return;
        if (typeof $gameSystem === "undefined" || !$gameSystem || !$gameSystem.isSpeciesSeen(win._speciesId)) return;
        const W = win.innerWidth;
        // Placement: the detail window's own layout is fixed-position —
        // title 8, element 46, evolves 84, stats 132..336, entry header
        // 348, description from 382 wrapping at 62 chars, 32px per line.
        // The extras therefore continue the description's flow, directly
        // below its last line. (The first live screenshot showed a
        // bottom-anchored footer striking through the description: the
        // window is only ~530px inside and the description already
        // reaches its lower third. Desc-flow placement cannot collide.)
        let descLines = 1;
        try {
            const words = String(sp.desc || "").split(" ");
            let line = "";
            for (const w of words) {
                if ((line + w).length > 62) { descLines++; line = w + " "; }
                else line += w + " ";
            }
        } catch (e) {}
        const kindY = 382 + (descLines - 1) * 32 + 38;
        try { if (typeof win.resetFontSettings === "function") win.resetFontSettings(); } catch (e) {}
        try { win.contents.fontSize = 21; } catch (e) {}
        win.resetTextColor();
        win.drawText(speciesKindLine(sp), 16, kindY, W - 32, "left");
        if (S18.ownsChroma(win._speciesId)) {
            // The Chroma tag lives under the battler sprite, right of the
            // stat block: the desc flow has exactly one free line (used
            // by Kind above — a second line under it clips outside the
            // ~476px contents bitmap), and the title row is too crowded
            // (measured live: long titles + the sprite's wing overlap it).
            // Placement is clamped into the 288-322 band so it always
            // lands in the empty under-sprite zone, above the entry
            // header at 348. (An earlier version gated the draw on a
            // measured text width and silently fell back to the clipped
            // desc flow when the measurement ran a few px wide — the
            // run-6 screenshot showed no tag. No gate now: at 16px the
            // line is ~340px and the band offers ~370px.)
            try {
                win.contents.fontSize = 16;
                win.changeTextColor("#FFD700");
                const tag = "★ A Chroma of this kind travels with you.";
                let ty = 292;
                try {
                    const spr = win._sprite || win._battlerSprite;
                    if (spr && spr.bitmap && spr.bitmap.height) {
                        const sc = spr.scale && spr.scale.y ? spr.scale.y : 1;
                        ty = 145 + Math.ceil(spr.bitmap.height * sc / 2) + 10;
                    }
                } catch (e) {}
                ty = Math.max(288, Math.min(322, ty));
                win.drawText(tag, 448, ty, W - 448 - 4, "left");
                win.resetTextColor();
            } catch (e) {}
        }
        try { if (typeof win.resetFontSettings === "function") win.resetFontSettings(); } catch (e) {}
    }
    S18.drawDexExtras = drawDexExtras;

    try {
        if (typeof Scene_GanjukoDex !== "undefined" && Scene_GanjukoDex.prototype &&
            typeof Scene_GanjukoDex.prototype.create === "function") {
            const _s18_dex_create = Scene_GanjukoDex.prototype.create;
            Scene_GanjukoDex.prototype.create = function() {
                _s18_dex_create.call(this);
                try {
                    const win = this._detailWindow;
                    if (win && !win._s18Patched) {
                        win._s18Patched = true;
                        const origRefresh = win.refresh;
                        win.refresh = function() {
                            if (typeof origRefresh === "function") origRefresh.call(this);
                            try { drawDexExtras(this); } catch (e) {}
                        };
                    }
                } catch (e) {}
            };
            _s18_status.dex = true;
        }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 18.13 The Judge — "the Listener" (design C.7 + D.7). The verdict
    // function returns {gift, band} in WORDS ONLY so any event or NPC
    // can speak the pattern; the Listener is its first speaker — an NPC
    // at the Ganjuko League Champions Hall (the late-game hall), gated
    // in dialogue at eight badges. One gift, one band, no numbers, no
    // comparisons, and no second reading of the same creature in a row.
    // ---------------------------------------------------------------------
    const JUDGE_GIFT = {
        hp: "This one's gift is its endurance. It was born deep-rooted — storms spend themselves on it, and it remains.",
        atk: "This one's gift is its strength. It was born striking — the first blow is a kind of honesty.",
        def: "This one's gift is its guard. It was born a wall — harm arrives, and is turned away politely.",
        mat: "This one's gift is its bright mind. It was born dreaming in colour — and the dreams obey it.",
        mdf: "This one's gift is its calm. It was born unshakeable — weather passes through, and it remains.",
        agi: "This one's gift is its speed. It was born swift — the horizon insults it."
    };
    const JUDGE_BAND = [
        "An honest, ordinary heart — and nothing wrong with that.",
        "Something about this one glitters.",
        "A rare light in this one. Raise it well.",
        "Once in a generation. I have nothing to teach it."
    ];
    S18.JUDGE_GIFT = JUDGE_GIFT;
    S18.JUDGE_BAND = JUDGE_BAND;

    function judgeVerdict(actor) {
        if (!actor) return null;
        const g = geneticsOf(actor);
        if (!g) return null;
        const id = typeof actor.actorId === "function" ? actor.actorId() : 0;
        const sys = (typeof $gameSystem !== "undefined" && $gameSystem) ? $gameSystem : null;
        if (sys && id !== 0 && sys._s18JudgeLast === id) return { refused: true };
        if (sys) sys._s18JudgeLast = id;
        const total = STAT_KEYS.reduce((sum, k) => sum + (g.ivs[k] || 0), 0);
        const band = total < 90 ? 0 : total < 120 ? 1 : total < 150 ? 2 : 3;
        return { gift: topStatKey(g.ivs), band: band, refused: false };
    }
    S18.judgeVerdict = judgeVerdict;

    // --- Listener scene (dialogue pattern: a text pane + a party pick) ---
    let ListenerSceneDefined = false;
    try {
        if (typeof Scene_MenuBase !== "undefined" && typeof Window_Base !== "undefined" && typeof Window_Selectable !== "undefined") {
            function Window_GanjukoListenerText() { this.initialize(...arguments); }
            Window_GanjukoListenerText.prototype = Object.create(Window_Base.prototype);
            Window_GanjukoListenerText.prototype.constructor = Window_GanjukoListenerText;
            Window_GanjukoListenerText.prototype.initialize = function(rect) {
                Window_Base.prototype.initialize.call(this, rect);
                this._lines = ["I don't read numbers, child. I listen to what a creature is. …Shall I listen to one of yours?"];
                this.refresh();
            };
            Window_GanjukoListenerText.prototype.setLines = function(lines) {
                this._lines = lines || [];
                this.refresh();
            };
            Window_GanjukoListenerText.prototype.refresh = function() {
                this.contents.clear();
                try { this.resetFontSettings(); } catch (e) {}
                try { this.contents.fontSize = 22; } catch (e) {}
                let y = 4;
                for (const raw of this._lines) {
                    const words = String(raw).split(/\s+/);
                    let line = "";
                    const flush = () => { if (line) { this.drawText(line, 8, y, this.innerWidth - 16, "left"); y += 32; line = ""; } };
                    for (const w of words) {
                        const cand = line ? line + " " + w : w;
                        let width = 0;
                        try { width = this.textWidth(cand); } catch (e) { width = cand.length * 11; }
                        if (width > this.innerWidth - 16 && line) { flush(); line = w; }
                        else line = cand;
                    }
                    flush();
                    y += 6;
                }
                try { this.resetFontSettings(); } catch (e) {}
            };

            function Window_GanjukoListenerList() { this.initialize(...arguments); }
            Window_GanjukoListenerList.prototype = Object.create(Window_Selectable.prototype);
            Window_GanjukoListenerList.prototype.constructor = Window_GanjukoListenerList;
            Window_GanjukoListenerList.prototype.initialize = function(rect) {
                Window_Selectable.prototype.initialize.call(this, rect);
                this.refresh();
                this.activate();
                this.select(0);
            };
            Window_GanjukoListenerList.prototype.maxItems = function() {
                return (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers().length : 0;
            };
            Window_GanjukoListenerList.prototype.itemHeight = function() { return 46; };
            Window_GanjukoListenerList.prototype.drawItem = function(index) {
                const members = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers() : [];
                const actor = members[index];
                if (!actor) return;
                const rect = this.itemLineRect(index);
                const g = actor._ganjukoGenetics;
                this.resetTextColor();
                this.drawText(actor.name() + "   Lv " + actor.level, rect.x + 8, rect.y, rect.width - 240, "left");
                try { this.changeTextColor("#FFD700"); } catch (e) {}
                this.drawText(heartsString(g ? g.bond : 0), rect.x + rect.width - 220, rect.y, 200, "right");
                this.resetTextColor();
            };

            function Scene_GanjukoListener() { this.initialize(...arguments); }
            Scene_GanjukoListener.prototype = Object.create(Scene_MenuBase.prototype);
            Scene_GanjukoListener.prototype.constructor = Scene_GanjukoListener;
            Scene_GanjukoListener.prototype.create = function() {
                Scene_MenuBase.prototype.create.call(this);
                const textRect = new Rectangle(0, this.mainAreaTop(), Graphics.boxWidth, 168);
                this._textWindow = new Window_GanjukoListenerText(textRect);
                this.addWindow(this._textWindow);
                const listRect = new Rectangle(0, this.mainAreaTop() + 168, Graphics.boxWidth, this.mainAreaHeight() - 168 - 56);
                this._listWindow = new Window_GanjukoListenerList(listRect);
                this._listWindow.setHandler("ok", this.onListenOk.bind(this));
                this._listWindow.setHandler("cancel", this.popScene.bind(this));
                this.addWindow(this._listWindow);
                const helpRect = new Rectangle(0, this.mainAreaTop() + this.mainAreaHeight() - 56, Graphics.boxWidth, 56);
                this._helpWindow = new Window_Base(helpRect);
                this._helpWindow.drawText("Choose a partner, and the Listener will listen.      B : Done", 8, 0, this._helpWindow.innerWidth - 16, "left");
                this.addWindow(this._helpWindow);
            };
            Scene_GanjukoListener.prototype.onListenOk = function() {
                const members = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers() : [];
                const actor = members[this._listWindow.index()];
                if (actor) {
                    const v = judgeVerdict(actor);
                    if (v && v.refused) {
                        this._textWindow.setLines(["I've said what there is to say."]);
                    } else if (v) {
                        this._textWindow.setLines(["…" + JUDGE_GIFT[v.gift], JUDGE_BAND[v.band]]);
                    }
                }
                this._listWindow.activate();
            };
            if (typeof window !== "undefined") window.Scene_GanjukoListener = Scene_GanjukoListener;
            ListenerSceneDefined = true;
        }
    } catch (e) {}

    // Entry point for the Listener's map event. Below eight badges the
    // Listener defers in dialogue; at eight, the listening opens.
    S18.listenerEvent = function() {
        try {
            const badges = (typeof $gameSystem !== "undefined" && $gameSystem && typeof $gameSystem.badges === "function")
                ? $gameSystem.badges().length : 0;
            if (badges < 8) {
                if (typeof $gameMessage !== "undefined" && $gameMessage) {
                    $gameMessage.add("The Listener: \\C[14]\"Eight badges, child. When all eight sing on your chest, come back — and I will listen.\"\\C[0]");
                }
                return false;
            }
            if (!ListenerSceneDefined) return false;
            SceneManager.push(window.Scene_GanjukoListener);
            return true;
        } catch (e) { return false; }
    };
    _s18_status.judge = ListenerSceneDefined;

    // The one debug accessor — gated behind a plugin parameter that
    // defaults OFF (design C.6 rule 5). Returns a copy, never the record.
    S18.debugGenetics = function(actor) {
        try {
            const params = (typeof PluginManager !== "undefined" && PluginManager.parameters)
                ? PluginManager.parameters("GanjukoEngine") : {};
            if (!params || params["S18DebugGenetics"] !== "true") return null;
            const g = actor && actor._ganjukoGenetics;
            return g ? cloneProfile(g) : null;
        } catch (e) { return null; }
    };
})();


// =============================================================================
// SECTION 19 — ARENA OFFLINE (2026-11-02): REGISTRATION, TRIAL PARTNERS,
// SPARRING vs ARENA PILOTS, THE DOUBLES FORMAT, CHAMPIONS TIMERS
// =============================================================================
// Phase A of the Arena design (work/MULTIPLAYER-AND-DEPTH-DESIGN.md A.8 +
// E.1): everything provable with zero network. Online matchmaking, the
// relay and live seasons are Section 20 / Phase C and are NOT in this
// build — the hub says so on its face, in copy, rather than pretending.
//
// The three hard rules, enforced here exactly as designed:
//   1. NO IMPORTING. A registered team is a list of actor ids drawn ONLY
//      from the player's own party, their own PC Box, and Trial Partners
//      rented at the Arena desk. There is no team code, no share string,
//      no import surface anywhere in this section — the registration
//      source list IS the whole universe of bringable creatures.
//   2. NATURAL LEVELS. Arena battles run at the levels the creatures
//      actually are. No scaling, no set-to-50 (that is the Stadium's
//      contrast, kept deliberately). Fairness comes from level BANDS:
//      Sprout 1-20 / Bronze 21-40 / Silver 41-60 / Gold 61-80 /
//      Masters 81-100, set by the team's highest-level member.
//   3. HIDDEN DEPTH STAYS HIDDEN. Arena screens show levels, bands,
//      hearts, trait words, flavour profiles, AP, and the player's own
//      rating record — never a genetics number (the C.6 lint discipline
//      applies to every string literal in this section; the unit suite
//      greps them). HP in every Arena battle surface is bar + PERCENTAGE
//      only (Rene's locked rule), including team preview and picks.
//
// Battle composition (all of it deliberate):
//   - Registration stores REFERENCES (actor ids), never copies: an Arena
//     battle fields the player's actual actors, so level, genetics,
//     trait, bond and Chroma are the real ones. Battles run under a
//     Stadium-style snapshot/restore of level/EXP/HP/MP plus party
//     composition: the party leaves exactly as it entered.
//   - $gameTemp._arenaActive marks an Arena battle as an EXHIBITION:
//     Section 18's exhibition check already reads that flag, so Arena
//     battles grant no EVs (design A.6). EXP/gold paid by the stock
//     victory path are unwound by the snapshot restore (gold is 0 by
//     construction — rewards are AP, an Arena-side currency).
//   - Bond: Section 18's victory-bond hook also sits out exhibitions;
//     this section adds its own +1 for the player's OWN partners on a
//     win (design C.5 counts Arena wins; A.4 calls Arena bond-slow —
//     one point per won battle, rentals excluded, is exactly that).
//   - The bond endure (bond >= 230, once per battle) is part of the
//     creature and applies in the Arena unchanged.
//   - Formats: SINGLES bring-6-pick-3 (the engine's proven 1-active
//     battle, queue send-outs) and DOUBLES bring-6-pick-4 with TRUE
//     2v2: two active battlers per side (Game_Party.maxBattleMembers
//     returns 2 only while $gameTemp._arenaDoubles is set), per-slot
//     target selection through MZ's own enemy/actor windows, spread
//     moves (a designated set of field-wide skills becomes all-foes at
//     0.75x damage — Skills.json ships scope-1 only, so the spread set
//     is an engine table, active only in doubles), and per-slot
//     replacement from the remaining picks when a battler faints.
//     Plates and stage slots are the doubles layout Pass 2 B planned
//     (GanjukoEngine.battleLayout().doubles) — extended, not redesigned.
//   - Timers (Champions-derived): 20:00 total / 7:00 of your own input
//     time / 0:45 per turn. A turn timeout auto-plays the battler's
//     first strong move ("acts on instinct"); three consecutive turn
//     timeouts, or running out of your-time, is a forfeit. Total-time
//     expiry is decided on creatures standing, then on combined HP%.
//     The pure timer state machine is S19.timerStep (unit-tested); the
//     Scene_Battle wrap feeds it real input-phase time.
//
// Safety contract (Sections 16/17/P2/P3/18 discipline): every install is
// feature-tested and try/catch guarded; every wrapper calls the stored
// original; a failure anywhere in Section 19 degrades to "no Arena",
// never to a broken game. GE.S19.status reports what installed.
// =============================================================================
(function() {
    "use strict";
    if (typeof GanjukoEngine === "undefined") return;
    const GE = GanjukoEngine;

    const _s19_status = {
        core: false, state: false, catalogue: false, rental: false,
        registration: false, battle: false, battleEnd: false,
        doubles: false, spread: false, ai: false, targeting: false,
        sprites: false, hud: false, timers: false, bagLock: false,
        scenes: false, menu: false
    };
    const S19 = {};
    GE.S19 = S19;
    S19.status = _s19_status;

    // ---------------------------------------------------------------------
    // 19.0 Constants + pure helpers (unit-tested in section-19.test.js)
    // ---------------------------------------------------------------------
    const STAT_KEYS19 = ["hp", "atk", "def", "mat", "mdf", "agi"];
    S19.STAT_KEYS = STAT_KEYS19;

    const BANDS = [
        { index: 0, name: "Sprout", min: 1, max: 20 },
        { index: 1, name: "Bronze", min: 21, max: 40 },
        { index: 2, name: "Silver", min: 41, max: 60 },
        { index: 3, name: "Gold", min: 61, max: 80 },
        { index: 4, name: "Masters", min: 81, max: 100 }
    ];
    S19.BANDS = BANDS;
    function bandIndexForLevel(level) {
        const lv = Math.max(1, Math.min(100, Math.floor(Number(level) || 1)));
        for (let i = 0; i < BANDS.length; i++) if (lv <= BANDS[i].max) return i;
        return BANDS.length - 1;
    }
    S19.bandIndexForLevel = bandIndexForLevel;
    function bandForLevel(level) { return BANDS[bandIndexForLevel(level)]; }
    S19.bandForLevel = bandForLevel;
    // A team's band is set by its highest-level member (design A.3).
    function bandIndexForLevels(levels) {
        if (!levels || !levels.length) return 0;
        return bandIndexForLevel(Math.max.apply(null, levels.map(n => Number(n) || 1)));
    }
    S19.bandIndexForLevels = bandIndexForLevels;

    // Ranked tiers (design A.7) — display crests over the rating number.
    const TIERS = [
        { name: "Rookie", min: 0 }, { name: "Ganjuko", min: 1200 },
        { name: "Great", min: 1500 }, { name: "Ultra", min: 1800 },
        { name: "Master", min: 2100 }
    ];
    S19.TIERS = TIERS;
    function tierForRating(rating) {
        const r = Number(rating) || 0;
        let t = TIERS[0];
        for (const tier of TIERS) if (r >= tier.min) t = tier;
        return t.name;
    }
    S19.tierForRating = tierForRating;
    function nextTierForRating(rating) {
        const r = Number(rating) || 0;
        for (const tier of TIERS) if (r < tier.min) return tier;
        return null;
    }
    S19.nextTierForRating = nextTierForRating;

    S19.FORMATS = {
        singles: { name: "Singles", picks: 3, actives: 1 },
        doubles: { name: "Doubles", picks: 4, actives: 2 }
    };
    function pickCountFor(format) {
        const f = S19.FORMATS[format];
        return f ? f.picks : 3;
    }
    S19.pickCountFor = pickCountFor;

    S19.RENT_COST = 50;          // AP per partner per set (design A.4)
    S19.RECRUIT_COST = 500;      // AP, one-time, after 5 rented sets
    S19.RECRUIT_SETS = 5;
    S19.SET_BATTLES = 10;        // a set lasts at most 10 Arena battles
    S19.WELCOME_AP = 150;        // one-time grant: the day-one on-ramp
    S19.AP_AWARD = { singles: { win: 25, loss: 5 }, doubles: { win: 35, loss: 5 }, firstWinBonus: 20 };

    function apAwardFor(format, won, firstWinOfDay) {
        const table = S19.AP_AWARD[format] || S19.AP_AWARD.singles;
        let ap = won ? table.win : table.loss;
        if (won && firstWinOfDay) ap += S19.AP_AWARD.firstWinBonus;
        return ap;
    }
    S19.apAwardFor = apAwardFor;

    // Registration legality (design A.1): team size 1-6, no duplicate
    // actor, every entry drawn from the player's own sources. Sources are
    // passed in as an id list so this stays pure and testable — the point
    // of the exercise is that NOTHING outside that list can be registered.
    function validateRegistration(ids, sourceIds) {
        if (!Array.isArray(ids)) return { ok: false, error: "team is not a list" };
        if (ids.length < 1) return { ok: false, error: "register at least one partner" };
        if (ids.length > 6) return { ok: false, error: "a team holds at most six" };
        const src = new Set((sourceIds || []).map(Number));
        const seen = new Set();
        for (const raw of ids) {
            const id = Number(raw);
            if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "bad team entry" };
            if (seen.has(id)) return { ok: false, error: "the same partner twice" };
            seen.add(id);
            if (!src.has(id)) return { ok: false, error: "only your own party, Box and rented partners can be registered" };
        }
        return { ok: true };
    }
    S19.validateRegistration = validateRegistration;

    // Battle picks legality: exactly the format's pick count, drawn from
    // the registered team, distinct, and every pick standing (alive).
    function validatePicks(teamIds, picks, format, aliveById) {
        const need = pickCountFor(format);
        if (!Array.isArray(picks) || picks.length !== need) {
            return { ok: false, error: "bring " + need + " for " + (S19.FORMATS[format] ? S19.FORMATS[format].name : format) };
        }
        const team = new Set((teamIds || []).map(Number));
        const seen = new Set();
        for (const raw of picks) {
            const id = Number(raw);
            if (seen.has(id)) return { ok: false, error: "the same partner twice" };
            seen.add(id);
            if (!team.has(id)) return { ok: false, error: "picks come from your registered team" };
            if (aliveById && aliveById[id] === false) return { ok: false, error: "a fainted partner cannot take the field" };
        }
        return { ok: true };
    }
    S19.validatePicks = validatePicks;

    // Doubles replacement planner — PURE. Given the live shape of both
    // sides, decide which fainted foe slots are re-filled from the queue
    // and which fainted player slots swap with which standing reserve.
    // partyAlive is indexed by party position (0..n-1; actives are the
    // first `actives` positions; the rest are reserves in pick order).
    function planReplacements(state) {
        const actives = state.actives || 2;
        const party = (state.partyAlive || []).slice();
        const foeAlive = state.foeAlive || [];
        let queue = Math.max(0, state.foeQueue | 0);
        const foeSetups = [];
        for (let slot = 0; slot < foeAlive.length; slot++) {
            if (!foeAlive[slot] && queue > 0) { foeSetups.push(slot); queue--; }
        }
        const partySwaps = [];
        for (let slot = 0; slot < Math.min(actives, party.length); slot++) {
            if (party[slot]) continue;
            let reserve = -1;
            for (let i = actives; i < party.length; i++) {
                if (party[i]) { reserve = i; break; }
            }
            if (reserve < 0) break;
            partySwaps.push({ from: slot, to: reserve });
            party[reserve] = party[slot];
            party[slot] = true;
        }
        return { foeSetups: foeSetups, partySwaps: partySwaps };
    }
    S19.planReplacements = planReplacements;

    // Champions timers — the pure state machine. The Scene_Battle wrap
    // feeds it real milliseconds, whether the player is being asked for
    // input, and the current turn count; it answers with events.
    S19.TIMERS = { totalMs: 20 * 60 * 1000, yourMs: 7 * 60 * 1000, turnMs: 45 * 1000 };
    function createTimerState() {
        return { elapsed: 0, yourElapsed: 0, turnElapsed: 0, turnSeen: -1,
                 turnTimedOut: false, consecutiveTimeouts: 0, over: false };
    }
    S19.createTimerState = createTimerState;
    function timerStep(st, dtMs, inputting, turnCount, limits) {
        const ev = [];
        if (!st || st.over) return ev;
        const lim = limits || S19.TIMERS;
        const dt = Math.max(0, Number(dtMs) || 0);
        st.elapsed += dt;
        if (turnCount !== st.turnSeen) {
            st.turnSeen = turnCount;
            st.turnElapsed = 0;
            if (!st.turnTimedOut) st.consecutiveTimeouts = 0;
            st.turnTimedOut = false;
        }
        if (inputting) {
            st.yourElapsed += dt;
            st.turnElapsed += dt;
            if (st.turnElapsed >= lim.turnMs) {
                st.turnElapsed = 0;
                st.turnTimedOut = true;
                st.consecutiveTimeouts++;
                ev.push("turn-timeout");
                if (st.consecutiveTimeouts >= 3) { st.over = true; ev.push("forfeit"); }
            }
            if (!st.over && st.yourElapsed >= lim.yourMs) { st.over = true; ev.push("forfeit"); }
        }
        if (!st.over && st.elapsed >= lim.totalMs) { st.over = true; ev.push("time-decision"); }
        return ev;
    }
    S19.timerStep = timerStep;
    function fmtClock(ms) {
        const s = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
        return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }
    S19.fmtClock = fmtClock;

    // Spread moves (doubles only): field-wide skills. Skills.json ships
    // every damaging move at MZ scope 1, so the spread set is designated
    // here — the big field-shaping move of each type. In doubles these
    // hit BOTH opposing slots at SPREAD_FACTOR damage (the genre rule);
    // everywhere else they behave exactly as they always have.
    S19.SPREAD_SKILLS = new Set([27, 30, 34, 36, 49, 51, 56, 59, 61, 64, 66]);
    S19.SPREAD_FACTOR = 0.75;
    function isSpreadSkillId(id) { return S19.SPREAD_SKILLS.has(Number(id)); }
    S19.isSpreadSkillId = isSpreadSkillId;

    _s19_status.core = true;

    // ---------------------------------------------------------------------
    // 19.1 Arena state on $gameSystem (design A.1 persistence pattern)
    // ---------------------------------------------------------------------
    function defaultArenaState() {
        return {
            ap: 0, welcomed: false,
            team: [],
            rentals: {},      // buildId -> { actorId, battlesLeft }
            rentalSets: {},   // buildId -> completed sets (recruitment track)
            recruited: {},    // buildId -> true
            record: { wins: 0, losses: 0, draws: 0 },
            rating: 1500, bestRating: 1500,
            lastFirstWinDay: "",
            lastResult: ""
        };
    }
    function ensureArena() {
        try {
            if (typeof $gameSystem === "undefined" || !$gameSystem) return null;
            let a = $gameSystem._ganjukoArena;
            if (!a || typeof a !== "object") {
                a = defaultArenaState();
                $gameSystem._ganjukoArena = a;
            }
            const d = defaultArenaState();
            for (const k of Object.keys(d)) if (a[k] === undefined) a[k] = d[k];
            if (!a.record || typeof a.record !== "object") a.record = d.record;
            return a;
        } catch (e) { return null; }
    }
    S19.ensureArena = ensureArena;
    try {
        if (typeof Game_System !== "undefined" && Game_System.prototype && typeof Game_System.prototype.initialize === "function") {
            const _s19_Game_System_initialize = Game_System.prototype.initialize;
            Game_System.prototype.initialize = function() {
                _s19_Game_System_initialize.call(this);
                this._ganjukoArena = defaultArenaState();
            };
            _s19_status.state = true;
        }
    } catch (e) {}

    function actorById(id) {
        try {
            if (typeof $gameActors !== "undefined" && $gameActors) return $gameActors.actor(Number(id)) || null;
        } catch (e) {}
        return null;
    }
    S19.actorById = actorById;
    function geneticsOfActor(actor) {
        try { if (actor && typeof GE.geneticsOf === "function") return GE.geneticsOf(actor); } catch (e) {}
        return actor ? actor._ganjukoGenetics || null : null;
    }
    // The flavour one-liner for a creature (design 6.2 via Section 18):
    // "A mischievous speedster." Words only, always legal to show.
    function profileLineOf(actor) {
        try {
            if (!actor || !GE.S18 || typeof GE.S18.flavorProfile !== "function") return "";
            const sp = typeof actor.ganjukoSpecies === "function" ? actor.ganjukoSpecies() : null;
            if (!sp) return "";
            const g = geneticsOfActor(actor);
            const shape = {};
            for (const k of STAT_KEYS19) shape[k] = (sp.baseStats[k] || 0) + ((g && g.ivs[k]) || 0);
            return GE.S18.flavorProfile(g, shape) || "";
        } catch (e) { return ""; }
    }
    S19.profileLineOf = profileLineOf;
    function heartsOf(actor) {
        try {
            if (!GE.S18 || typeof GE.S18.heartsString !== "function") return "";
            const g = geneticsOfActor(actor);
            return GE.S18.heartsString(g ? g.bond : 0);
        } catch (e) { return ""; }
    }
    S19.heartsOf = heartsOf;

    // The registration universe (hard rule 1): party + Box + rented
    // Trial Partners. This list is the ONLY source registration reads.
    function arenaSources() {
        const out = [];
        const seen = new Set();
        const push = (id, source, buildId) => {
            id = Number(id);
            if (!id || seen.has(id)) return;
            seen.add(id);
            out.push({ actorId: id, source: source, buildId: buildId || null });
        };
        try {
            if (typeof $gameParty !== "undefined" && $gameParty) {
                for (const m of $gameParty.allMembers()) push(m.actorId(), "party");
            }
            if (typeof $gameSystem !== "undefined" && $gameSystem && typeof $gameSystem.ganjukoBox === "function") {
                for (const id of $gameSystem.ganjukoBox()) push(id, "box");
            }
            const a = ensureArena();
            if (a) for (const bid of Object.keys(a.rentals)) push(a.rentals[bid].actorId, "trial", bid);
        } catch (e) {}
        return out;
    }
    S19.arenaSources = arenaSources;
    function sourceIds() { return arenaSources().map(s => s.actorId); }
    S19.sourceIds = sourceIds;
    function teamLevels() {
        const a = ensureArena();
        if (!a) return [];
        return a.team.map(id => { const m = actorById(id); return m ? m.level : 0; }).filter(n => n > 0);
    }
    S19.teamLevels = teamLevels;
    function teamBandIndex() { return bandIndexForLevels(teamLevels()); }
    S19.teamBandIndex = teamBandIndex;

    // ---------------------------------------------------------------------
    // 19.2 The Trial Partner catalogue + Arena pilots (data tables)
    // ---------------------------------------------------------------------
    // A build = species (POSITIONAL id) + fixed level inside its band +
    // a trait word + a lender for flavour. Its genetics are NOT rolled:
    // the fixed, honest profile (every inner value exactly median, no
    // training growth, no bond) comes from trialProfileFor(). Its moves
    // are the best-4 the 16.5 pool system chooses — computed through the
    // real augmentSkills so a card never promises a move the partner
    // will not actually carry.
    const TRIAL_BUILDS = [
        // Sprout (1-20)
        { id: "sprout-embit", band: 0, speciesId: 1, level: 12, trait: "Playful", lender: "Rookie Rin" },
        { id: "sprout-bubblix", band: 0, speciesId: 4, level: 10, trait: "Gentle", lender: "Old Ferran" },
        { id: "sprout-galewing", band: 0, speciesId: 14, level: 14, trait: "Curious", lender: "Sister Wren" },
        // Bronze (21-40)
        { id: "bronze-leviatide", band: 1, speciesId: 5, level: 30, trait: "Stoic", lender: "Trainer Marco" },
        { id: "bronze-titanite", band: 1, speciesId: 17, level: 32, trait: "Stubborn", lender: "Madame Lume" },
        { id: "bronze-zephyrhornkit", band: 1, speciesId: 43, level: 28, trait: "Mischievous", lender: "The Twins" },
        // Silver (41-60)
        { id: "silver-pyroclysm", band: 2, speciesId: 3, level: 52, trait: "Fierce", lender: "Captain Ivo" },
        { id: "silver-geocore", band: 2, speciesId: 18, level: 54, trait: "Stoic", lender: "Old Ferran" },
        { id: "silver-grimmfang", band: 2, speciesId: 23, level: 48, trait: "Mischievous", lender: "Sister Wren" },
        // Gold (61-80)
        { id: "gold-oceanlord", band: 3, speciesId: 6, level: 72, trait: "Proud", lender: "Marina" },
        { id: "gold-yggdrasylph", band: 3, speciesId: 9, level: 74, trait: "Dreamy", lender: "Gardener Pell" },
        { id: "gold-spectrolord", band: 3, speciesId: 25, level: 70, trait: "Stoic", lender: "Madame Lume" },
        // Masters (81-100) — Marina's Crushcean and the Lv98 Stormcresteon
        // are the design's own catalogue cards (D.3), verbatim.
        { id: "masters-crushcean", band: 4, speciesId: 20, level: 95, trait: "Stoic", lender: "Marina" },
        { id: "masters-stormcresteon", band: 4, speciesId: 57, level: 98, trait: "Proud", lender: "The Herald" },
        { id: "masters-hydrofinis", band: 4, speciesId: 33, level: 96, trait: "Brave", lender: "The Herald" }
    ];
    S19.TRIAL_BUILDS = TRIAL_BUILDS;
    function buildById(buildId) {
        for (const b of TRIAL_BUILDS) if (b.id === buildId) return b;
        return null;
    }
    S19.buildById = buildById;
    function buildsForBand(bandIdx) { return TRIAL_BUILDS.filter(b => b.band === bandIdx); }
    S19.buildsForBand = buildsForBand;

    // The fixed Trial profile: median inner values, no growth, no bond —
    // "a steady, finished creature: what you see is exactly what you get."
    function trialProfileFor(build) {
        const ivs = {}, evs = {};
        for (const k of STAT_KEYS19) { ivs[k] = 16; evs[k] = 0; }
        let seed = 19000 + TRIAL_BUILDS.indexOf(build) * 7919 + build.speciesId;
        try {
            if (GE.S18 && typeof GE.S18.deriveChroma === "function") {
                while (GE.S18.deriveChroma(seed)) seed++; // a Trial Partner is never a Chroma
            }
        } catch (e) {}
        return { ivs: ivs, evs: evs, trait: build.trait, bond: 0, seed: seed,
                 chroma: false, battles: 0, metPlace: "the Arena", steps: 0 };
    }
    S19.trialProfileFor = trialProfileFor;

    // Best-4 moves for a build, through the REAL 16.5 pool system: a
    // scratch battler wearing the species at the build's level, so the
    // card, the rental and the recruit all agree by construction.
    function buildMovesPreview(build) {
        try {
            const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(build.speciesId) : null;
            if (!sp || typeof GE.augmentSkills !== "function") return [];
            const fake = {
                _skills: [],
                _ganjukoSpeciesId: build.speciesId,
                level: build.level,
                isEnemy: () => false,
                isActor: () => true,
                ganjukoSpecies: () => sp,
                ganjukoSpeciesId: () => build.speciesId,
                ganjukoType: () => sp.type1 || 1,
                ganjukoLevel: () => build.level,
                currentClass: () => null
            };
            if (Array.isArray(sp.learnings)) {
                for (const l of sp.learnings) if (l && l.level <= build.level) fake._skills.push(l.skillId);
            }
            GE.augmentSkills(fake);
            const names = [];
            for (const id of (fake._skills || []).slice(-4)) {
                const sk = (typeof $dataSkills !== "undefined" && $dataSkills) ? $dataSkills[id] : null;
                names.push(sk ? sk.name : ("Move " + id));
            }
            return names;
        } catch (e) { return []; }
    }
    S19.buildMovesPreview = buildMovesPreview;

    // Arena pilots — the offline stand-ins (design A.2 Sparring). Teams
    // are generated per band (BST floor + type diversity, the Stadium
    // generator's proven shape) at natural levels inside the band.
    const PILOTS = [
        { id: "rin", name: "Rookie Rin", band: 0, tier: "trainer", bstMin: 100, lvMin: 4, lvMax: 10 },
        { id: "june", name: "Rookie June", band: 0, tier: "trainer", bstMin: 110, lvMin: 8, lvMax: 16 },
        { id: "marco", name: "Trainer Marco", band: 1, tier: "trainer", bstMin: 140, lvMin: 24, lvMax: 32 },
        { id: "yuki", name: "Trainer Yuki", band: 1, tier: "trainer", bstMin: 160, lvMin: 30, lvMax: 38 },
        { id: "felix", name: "Trainer Felix", band: 2, tier: "trainer", bstMin: 180, lvMin: 44, lvMax: 52 },
        { id: "noor", name: "Ace-in-Training Noor", band: 2, tier: "gym", bstMin: 200, lvMin: 50, lvMax: 58 },
        { id: "sable", name: "Arena Ace Sable", band: 3, tier: "gym", bstMin: 210, lvMin: 64, lvMax: 74 },
        { id: "bram", name: "Arena Ace Bram", band: 3, tier: "gym", bstMin: 225, lvMin: 70, lvMax: 79 },
        { id: "vera", name: "Arena Ace Vera", band: 4, tier: "gym", bstMin: 240, lvMin: 84, lvMax: 93 },
        { id: "odo", name: "Arena Master Odo", band: 4, tier: "stadium", bstMin: 280, lvMin: 92, lvMax: 100 }
    ];
    S19.PILOTS = PILOTS;
    function pilotById(id) { for (const p of PILOTS) if (p.id === id) return p; return null; }
    S19.pilotById = pilotById;
    function pilotsForBand(bandIdx) { return PILOTS.filter(p => p.band === bandIdx); }
    S19.pilotsForBand = pilotsForBand;

    function generatePilotTeam(pilot, format) {
        const count = pickCountFor(format);
        let entries = [];
        try {
            if (typeof window !== "undefined" && window.$dataGanjukoSpecies && window.$dataGanjukoSpecies.length) {
                entries = window.$dataGanjukoSpecies.map((sp, i) => sp ? { sp: sp, pos: i + 1 } : null).filter(Boolean);
            }
        } catch (e) {}
        if (!entries.length) return [];
        const bstOf = (typeof GE.stadiumSpeciesBST === "function")
            ? GE.stadiumSpeciesBST : (sp => { const bs = (sp && sp.baseStats) || {}; let t = 0; for (const k of Object.keys(bs)) if (k !== "mp") t += Number(bs[k]) || 0; return t; });
        let threshold = pilot.bstMin;
        let candidates = entries.filter(e => bstOf(e.sp) >= threshold);
        while (candidates.length < count && threshold > 60) {
            threshold -= 20;
            candidates = entries.filter(e => bstOf(e.sp) >= threshold);
        }
        if (candidates.length < count) candidates = entries.slice().sort((x, y) => bstOf(y.sp) - bstOf(x.sp)).slice(0, Math.max(count, entries.length));
        const shuffled = candidates.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
        }
        const team = [], usedTypes = new Set();
        for (const e of shuffled) {
            if (team.length >= count) break;
            const t = e.sp.type1 || e.sp.type || 1;
            if (!usedTypes.has(t)) { usedTypes.add(t); team.push(e); }
        }
        for (const e of shuffled) {
            if (team.length >= count) break;
            if (!team.includes(e)) team.push(e);
        }
        const span = Math.max(0, pilot.lvMax - pilot.lvMin);
        return team.map(e => ({
            speciesId: e.pos,
            level: Math.max(1, Math.min(100, pilot.lvMin + Math.floor(Math.random() * (span + 1))))
        }));
    }
    S19.generatePilotTeam = generatePilotTeam;
    _s19_status.catalogue = true;

    // ---------------------------------------------------------------------
    // 19.3 Registration + Trial rental / recruitment
    // ---------------------------------------------------------------------
    // Ending a rental set (team change, 10 battles fought, or a recruit
    // superseding it): the rented actor leaves the team and the desk;
    // the set counts toward recruitment when countSet is true (design
    // A.4: a set ends when the team changes or 10 battles complete).
    function endRentalSet(buildId, countSet) {
        const a = ensureArena();
        if (!a || !a.rentals[buildId]) return false;
        const actorId = a.rentals[buildId].actorId;
        delete a.rentals[buildId];
        a.team = a.team.filter(id => Number(id) !== Number(actorId));
        if (countSet) a.rentalSets[buildId] = (a.rentalSets[buildId] || 0) + 1;
        return true;
    }
    S19.endRentalSet = endRentalSet;

    function setTeam(ids) {
        const a = ensureArena();
        if (!a) return { ok: false, error: "arena state unavailable" };
        // Clearing the sheet entirely is legal (it also ends every
        // running rental set); a NON-empty sheet must pass validation.
        if (!ids || ids.length === 0) {
            for (const bid of Object.keys(a.rentals)) endRentalSet(bid, true);
            a.team = [];
            return { ok: true };
        }
        const v = validateRegistration(ids, sourceIds());
        if (!v.ok) return v;
        const wanted = new Set(ids.map(Number));
        // A rented partner dropped from the team ends its set.
        for (const bid of Object.keys(a.rentals)) {
            if (!wanted.has(Number(a.rentals[bid].actorId))) endRentalSet(bid, true);
        }
        a.team = ids.map(Number);
        return { ok: true };
    }
    S19.setTeam = setTeam;
    function addToTeam(actorId) {
        const a = ensureArena();
        if (!a) return { ok: false, error: "arena state unavailable" };
        if (a.team.map(Number).includes(Number(actorId))) return { ok: true };
        return setTeam(a.team.concat([Number(actorId)]));
    }
    S19.addToTeam = addToTeam;
    function removeFromTeam(actorId) {
        const a = ensureArena();
        if (!a) return { ok: false, error: "arena state unavailable" };
        return setTeam(a.team.filter(id => Number(id) !== Number(actorId)));
    }
    S19.removeFromTeam = removeFromTeam;

    // Create a creature from a build table through the normal creation
    // path with the fixed Trial profile riding the Section 18 pending
    // hand-off — the same mechanism eggs and captures use.
    function createFromBuild(build) {
        try {
            if (typeof $gameTemp === "undefined" || !$gameTemp) return null;
            if (typeof GE.giveGanjuko !== "function") return null;
            $gameTemp._ganjukoPendingGenetics = (GE.S18 && typeof GE.S18.cloneProfile === "function")
                ? GE.S18.cloneProfile(trialProfileFor(build)) : trialProfileFor(build);
            const res = GE.giveGanjuko(build.speciesId, build.level);
            if ($gameTemp._ganjukoPendingGenetics) $gameTemp._ganjukoPendingGenetics = null;
            return res && res.actor ? res.actor : null;
        } catch (e) { return null; }
    }
    S19.createFromBuild = createFromBuild;

    function rentTrial(buildId) {
        const a = ensureArena();
        const build = buildById(buildId);
        if (!a || !build) return { ok: false, error: "unknown partner" };
        if (a.rentals[buildId]) return { ok: false, error: "already on your set" };
        if (a.ap < S19.RENT_COST) return { ok: false, error: "not enough AP" };
        const actor = createFromBuild(build);
        if (!actor) return { ok: false, error: "the desk could not fetch that partner" };
        const actorId = actor.actorId();
        // A rented partner lives at the Arena desk, not in the story
        // party or Box: lift it straight back out of wherever the
        // creation path parked it. It exists as an actor; it is fielded
        // only by Arena battles, from the registration list.
        try {
            if (typeof $gameParty !== "undefined" && $gameParty && $gameParty.allMembers().some(m => m.actorId() === actorId)) {
                $gameParty.removeActor(actorId);
            } else if (typeof $gameSystem !== "undefined" && $gameSystem && typeof $gameSystem.removeFromGanjukoBox === "function") {
                $gameSystem.removeFromGanjukoBox(actorId);
            }
        } catch (e) {}
        a.ap -= S19.RENT_COST;
        a.rentals[buildId] = { actorId: actorId, battlesLeft: S19.SET_BATTLES };
        if (a.team.length < 6) a.team.push(actorId);
        return { ok: true, actorId: actorId };
    }
    S19.rentTrial = rentTrial;

    function recruitTrial(buildId) {
        const a = ensureArena();
        const build = buildById(buildId);
        if (!a || !build) return { ok: false, error: "unknown partner" };
        if (a.recruited[buildId]) return { ok: false, error: "already recruited" };
        if ((a.rentalSets[buildId] || 0) < S19.RECRUIT_SETS) return { ok: false, error: "rent this partner in " + S19.RECRUIT_SETS + " sets first" };
        if (a.ap < S19.RECRUIT_COST) return { ok: false, error: "not enough AP" };
        const actor = createFromBuild(build);
        if (!actor) return { ok: false, error: "the desk could not fetch that partner" };
        a.ap -= S19.RECRUIT_COST;
        a.recruited[buildId] = true;
        // The recruit is a normal creature now (party or Box, by the
        // creation path). An active rental of the same build is
        // superseded — released without counting another set.
        if (a.rentals[buildId]) endRentalSet(buildId, false);
        return { ok: true, actorId: actor.actorId() };
    }
    S19.recruitTrial = recruitTrial;
    _s19_status.rental = true;
    _s19_status.registration = true;

    // ---------------------------------------------------------------------
    // 19.4 Arena battles — snapshot/restore, start, finish
    // ---------------------------------------------------------------------
    function snapshotArenaParty(picks) {
        const snap = { partyIds: [], stats: [] };
        try {
            if (typeof $gameParty !== "undefined" && $gameParty) {
                snap.partyIds = $gameParty.allMembers().map(m => m.actorId());
            }
            for (const id of picks) {
                const actor = actorById(id);
                if (!actor) continue;
                snap.stats.push({
                    actorId: id,
                    level: actor.level,
                    exp: (typeof actor.currentExp === "function") ? actor.currentExp() : 0,
                    hp: actor.hp, mp: actor.mp
                });
            }
        } catch (e) {}
        return snap;
    }
    function restoreArenaParty(run) {
        if (!run || !run.snapshot) return;
        const snap = run.snapshot;
        try {
            for (const entry of snap.stats) {
                const actor = actorById(entry.actorId);
                if (!actor) continue;
                if (actor.level !== entry.level && typeof actor.changeLevel === "function") {
                    actor.changeLevel(entry.level, false);
                }
                try {
                    // EXP comes back EXACTLY (design A.6: Arena battles
                    // grant none). The trainer send-out seam pays the
                    // lead EXP mid-battle before this restore runs, so
                    // a top-up-only restore would leak it — set the
                    // stored value outright, with the top-up as a
                    // fallback for unexpected actor shapes.
                    if (typeof actor.currentExp === "function" && actor.currentExp() !== entry.exp) {
                        if (actor._exp && typeof actor._exp === "object" && "_classId" in actor) {
                            actor._exp[actor._classId] = entry.exp;
                        } else if (typeof actor.gainExp === "function") {
                            const diff = entry.exp - actor.currentExp();
                            if (diff > 0) actor.gainExp(diff);
                        }
                    }
                } catch (e) {}
                try {
                    if (typeof actor.recoverAll === "function") actor.recoverAll();
                    if (typeof actor.setHp === "function") actor.setHp(Math.min(entry.hp, actor.mhp));
                    if (typeof actor.setMp === "function") actor.setMp(Math.min(entry.mp, actor.mmp));
                } catch (e) {}
            }
            if (typeof $gameParty !== "undefined" && $gameParty) {
                $gameParty._actors = snap.partyIds.slice();
            }
            if (typeof $gamePlayer !== "undefined" && $gamePlayer && typeof $gamePlayer.refresh === "function") {
                $gamePlayer.refresh();
            }
        } catch (e) {}
    }
    S19._restoreArenaParty = restoreArenaParty;

    function clearArenaTemp() {
        try {
            if (typeof $gameTemp === "undefined" || !$gameTemp) return;
            $gameTemp._arenaActive = false;
            $gameTemp._arenaDoubles = false;
            $gameTemp._arenaFoeQueue = [];
            $gameTemp._arenaTimer = null;
            $gameTemp._arenaForfeit = false;
            $gameTemp._arenaTimeResult = null;
            $gameTemp._trainerQueue = [];
            $gameTemp._isTrainerBattle = false;
            $gameTemp._ganjukoDifficulty = null;
        } catch (e) {}
    }

    // Start an Arena battle. cfg: { format, foeName, foeTeam:
    // [{speciesId, level}...], difficulty, picks: [actorId...] }.
    // The battle party becomes exactly the picks (composition snapshot
    // restores the real party afterwards); the foe side rides the
    // trainer-battle machinery (foe 1 through the troop, the rest as
    // send-out queue — in doubles, foes 1-2 open and the queue feeds
    // per-slot replacements through the S19 checkBattleEnd wrap).
    function startArenaBattle(cfg) {
        try {
            const a = ensureArena();
            if (!a) return false;
            if (GE._arenaBattle && GE._arenaBattle.active) return false;
            if (typeof $gameParty === "undefined" || !$gameParty || typeof BattleManager === "undefined") return false;
            const format = cfg && cfg.format === "doubles" ? "doubles" : "singles";
            const picks = (cfg && cfg.picks || []).map(Number);
            const aliveById = {};
            for (const id of picks) { const m = actorById(id); aliveById[id] = !!(m && typeof m.isAlive === "function" && m.isAlive()); }
            const v = validatePicks(a.team, picks, format, aliveById);
            if (!v.ok) {
                if (typeof $gameMessage !== "undefined" && $gameMessage) $gameMessage.add("\\C[18]" + v.error + "\\C[0]");
                return false;
            }
            const foeTeam = (cfg.foeTeam || []).filter(f => f && f.speciesId);
            if (foeTeam.length < pickCountFor(format)) return false;

            const run = {
                active: true, resolving: false, format: format,
                foeName: cfg.foeName || "Arena Pilot",
                picks: picks.slice(),
                snapshot: snapshotArenaParty(picks)
            };
            GE._arenaBattle = run;

            // Compose the battle party from the picks alone.
            $gameParty._actors = picks.slice();
            try { if (typeof $gamePlayer !== "undefined" && $gamePlayer) $gamePlayer.refresh(); } catch (e) {}

            const doubles = format === "doubles";
            $gameTemp._isTrainerBattle = true;
            $gameTemp._trainerName = run.foeName;
            $gameTemp._trainerRewardGold = 0;
            $gameTemp._arenaActive = true;
            $gameTemp._arenaDoubles = doubles;
            // Singles reserves ride the proven trainer queue ONLY;
            // the arena foe queue is the doubles send-out queue. (A
            // singles battle that filled both double-counted the
            // reserves in the HUD pips and the time-decision count —
            // caught by the first live section19 rig run's probe.)
            $gameTemp._arenaFoeQueue = doubles ? foeTeam.slice(2) : [];
            $gameTemp._trainerQueue = doubles ? [] : foeTeam.slice(1);
            $gameTemp._wildSpeciesId = foeTeam[0].speciesId;
            $gameTemp._wildLevel = foeTeam[0].level;
            $gameTemp._ganjukoDifficulty = cfg.difficulty || "trainer";
            $gameTemp._arenaTimer = createTimerState();
            $gameTemp._arenaForfeit = false;
            $gameTemp._arenaTimeResult = null;

            const troopId = Math.min(Math.max(foeTeam[0].speciesId, 1), 30);
            BattleManager.setup(troopId, false, true);
            if (doubles) {
                // Second foe: construct on foe 1's proven troop row, then
                // re-setup in place — the exact send-out seam the trainer
                // queue uses — before the battle scene exists, so the
                // spriteset is born with both battlers.
                const foe2 = foeTeam[1];
                const e2 = new Game_Enemy(troopId, 0, 0);
                e2.setupGanjukoEnemy(foe2.speciesId, foe2.level);
                $gameTroop._enemies.push(e2);
            }
            // The Pass 3 tutorial never coaches an Arena battle: its
            // per-battle temp flags were armed inside setup(); clear
            // them. The save's tutorial state itself is untouched — the
            // lesson simply waits for the next story battle.
            $gameTemp._p3Kind = null;
            $gameTemp._p3Coach = null;
            $gameTemp._p3Lesson = null;
            if (typeof AudioManager !== "undefined" && AudioManager.playBgm) {
                AudioManager.playBgm({ name: "Battle2", volume: 90, pitch: 100, pan: 0 });
            }
            SceneManager.push(Scene_Battle);
            return true;
        } catch (e) {
            // Roll back a half-armed start (observed live: pushing the
            // battle scene can throw when the map scene it replaces
            // has not finished starting — Scene_Map.stop dereferences
            // windows that do not exist yet). Restore the party and
            // disarm so the Arena refuses cleanly instead of wedging
            // with a phantom battle armed.
            try {
                if (GE._arenaBattle && GE._arenaBattle.active && GE._arenaBattle.snapshot) {
                    restoreArenaParty(GE._arenaBattle);
                }
            } catch (e2) {}
            try { if (GE._arenaBattle) GE._arenaBattle.active = false; } catch (e2) {}
            clearArenaTemp();
            return false;
        }
    }
    S19.startArenaBattle = startArenaBattle;

    function startSparring(format, pilotId, picks) {
        const pilot = pilotById(pilotId);
        if (!pilot) return false;
        const foeTeam = generatePilotTeam(pilot, format);
        if (!foeTeam.length) return false;
        return startArenaBattle({
            format: format, foeName: pilot.name, foeTeam: foeTeam,
            difficulty: pilot.tier, picks: picks
        });
    }
    S19.startSparring = startSparring;

    function todayKey() {
        const d = new Date();
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    }
    S19.todayKey = todayKey;

    // After-battle settlement, run once the map owns the screen again:
    // AP, the sparring record, rental set clocks, the small victory
    // bond for the player's own partners, result copy, and the walk
    // back into the Arena hub.
    function finishArenaBattle(run, won, draw) {
        const a = ensureArena();
        try {
            if (a) {
                const firstWin = won && a.lastFirstWinDay !== todayKey();
                const award = apAwardFor(run.format, won, firstWin);
                if (won && firstWin) a.lastFirstWinDay = todayKey();
                a.ap += award;
                if (won) a.record.wins += 1;
                else if (draw) a.record.draws += 1;
                else a.record.losses += 1;
                // Rental set clocks: a set burns one battle per fight
                // the partner actually took part in.
                const spentSets = [];
                for (const bid of Object.keys(a.rentals)) {
                    const r = a.rentals[bid];
                    if (run.picks.includes(Number(r.actorId))) {
                        r.battlesLeft -= 1;
                        if (r.battlesLeft <= 0) spentSets.push(bid);
                    }
                }
                for (const bid of spentSets) {
                    const b = buildById(bid);
                    endRentalSet(bid, true);
                    if (b && typeof $gameMessage !== "undefined" && $gameMessage) {
                        const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(b.speciesId) : null;
                        $gameMessage.add((b.lender || "The desk") + "'s " + (sp ? sp.name : "partner") + " has finished its set and returned to the Trial Counter.");
                    }
                }
                // Bond (this section's own +1, own partners only, wins
                // only): exhibitions sit out Section 18's hook by
                // design; Arena attachment grows slowly, by showing up.
                if (won) {
                    const rentalIds = new Set(Object.values(a.rentals).map(r => Number(r.actorId)));
                    for (const id of run.picks) {
                        if (rentalIds.has(Number(id))) continue;
                        const actor = actorById(id);
                        if (!actor) continue;
                        const g = geneticsOfActor(actor);
                        if (g) {
                            g.bond = Math.min(255, (g.bond || 0) + 1);
                            g.battles = (g.battles || 0) + 1;
                        }
                    }
                }
                const resultLine = won ? "Victory over " + run.foeName + "!"
                    : draw ? "Time! A draw with " + run.foeName + "."
                    : run.foeName + " takes this one.";
                a.lastResult = resultLine;
                if (typeof $gameMessage !== "undefined" && $gameMessage) {
                    $gameMessage.add("\\C[14]BATTLE ARENA\\C[0] — " + resultLine);
                    $gameMessage.add("You earned \\C[14]" + award + " AP\\C[0]. Your partners were restored, as the Arena always restores them.");
                }
            }
        } catch (e) {}
        try { run.active = false; } catch (e) {}
        clearArenaTemp();
        // Walk back into the hub — but the battle scene still owns
        // the screen when this runs, and its own pop back to the map
        // clobbers an immediate push (observed live: a finished Arena
        // bout landed on the map and the hub never opened). Wait
        // until the map owns the screen again, then push the hub
        // over it. The result line waits in $gameMessage and reads
        // when the player leaves the hub; the hub's own status pane
        // shows the same result immediately.
        try {
            let hubTries = 0;
            const pushHub = () => {
                try {
                    if (GE._arenaBattle && GE._arenaBattle.active) return; // a new bout already armed
                    const sc = typeof SceneManager !== "undefined" ? SceneManager._scene : null;
                    const onMap = !!sc && ((sc.constructor && sc.constructor.name === "Scene_Map") ||
                        (typeof Scene_Map !== "undefined" && sc instanceof Scene_Map));
                    if (onMap && typeof SceneManager.push === "function" && typeof Scene_GanjukoArena !== "undefined") {
                        // NEVER push while the result message is up and
                        // never push twice. A push stop()s the map scene;
                        // if the message window is open at that moment it
                        // can never be dismissed (a stopped scene does not
                        // process it), the queued hub scene can never take
                        // over, and every retry stacks another dead
                        // Scene_Map — a soft-lock found live on the
                        // defeat path (stack flooded ~190 deep). Wait for
                        // the message to be read and dismissed instead:
                        // the retry cadence pushes on the first clear tick.
                        if (SceneManager._nextScene) return;
                        const msgBusy = typeof $gameMessage !== "undefined" && $gameMessage &&
                            typeof $gameMessage.isBusy === "function" && $gameMessage.isBusy();
                        if (!msgBusy) {
                            SceneManager.push(Scene_GanjukoArena);
                            return;
                        }
                    }
                } catch (e) {}
                if (++hubTries <= 240) setTimeout(pushHub, 250);
            };
            setTimeout(pushHub, 250);
        } catch (e) {}
    }
    S19.finishArenaBattle = finishArenaBattle;

    // Chain off battle end, Stadium-style: settle the outcome and
    // restore the party BEFORE the engine's own updateBattleEnd runs,
    // so its blackout branch can never fire for an Arena loss.
    try {
        if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.updateBattleEnd === "function") {
            const _s19_BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
            BattleManager.updateBattleEnd = function() {
                let done = null;
                try {
                    const run = GE._arenaBattle;
                    if (run && run.active && typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive && !run.resolving) {
                        run.resolving = true;
                        let won, draw = false;
                        if ($gameTemp._arenaForfeit) won = false;
                        else if ($gameTemp._arenaTimeResult) { won = $gameTemp._arenaTimeResult === "win"; draw = $gameTemp._arenaTimeResult === "draw"; }
                        else won = !(typeof $gameParty !== "undefined" && $gameParty && $gameParty.isAllDead());
                        done = { run: run, won: won, draw: draw };
                        restoreArenaParty(run);
                    }
                } catch (e) { done = null; }
                _s19_BattleManager_updateBattleEnd.call(this);
                if (done) {
                    const d = done;
                    setTimeout(() => { try { finishArenaBattle(d.run, d.won, d.draw); } catch (e) {} }, 400);
                }
            };
            _s19_status.battleEnd = true;
        }
    } catch (e) {}

    // Doubles send-outs: replace fainted battlers per slot, from the
    // picks (player) and the foe queue (pilot), at the same seam the
    // engine's own faint-switch uses. Singles Arena battles fall
    // through to the proven original untouched.
    try {
        if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.checkBattleEnd === "function") {
            const _s19_BattleManager_checkBattleEnd = BattleManager.checkBattleEnd;
            BattleManager.checkBattleEnd = function() {
                try {
                    if (this._phase && typeof $gameTemp !== "undefined" && $gameTemp &&
                        $gameTemp._arenaActive && $gameTemp._arenaDoubles) {
                        const plan = planReplacements({
                            actives: 2,
                            partyAlive: $gameParty.allMembers().map(m => !!(m && typeof m.isAlive === "function" && m.isAlive())),
                            foeAlive: $gameTroop.members().map(m => !!(m && typeof m.isAlive === "function" && m.isAlive())),
                            foeQueue: ($gameTemp._arenaFoeQueue || []).length
                        });
                        let acted = false;
                        for (const slot of plan.foeSetups) {
                            const next = ($gameTemp._arenaFoeQueue || []).shift();
                            const foe = $gameTroop.members()[slot];
                            if (!next || !foe) continue;
                            const fallenName = foe.name();
                            foe.setupGanjukoEnemy(next.speciesId, next.level);
                            try { if (typeof AudioManager !== "undefined") AudioManager.playSe({ name: "Monster1", volume: 90, pitch: 110, pan: 0 }); } catch (e) {}
                            if (this._logWindow) {
                                this._logWindow.push("addText", fallenName + " fainted!");
                                this._logWindow.push("addText", "\\C[14]" + ($gameTemp._trainerName || "Pilot") + " sent out " + foe.name() + " (Lv " + foe.ganjukoLevel() + ")!\\C[0]");
                            }
                            acted = true;
                        }
                        for (const sw of plan.partySwaps) {
                            const fallen = $gameParty.allMembers()[sw.from];
                            $gameParty.swapOrder(sw.from, sw.to);
                            const next = $gameParty.allMembers()[sw.from];
                            try { if (typeof AudioManager !== "undefined") AudioManager.playSe({ name: "Raise1", volume: 90, pitch: 100, pan: 0 }); } catch (e) {}
                            if (this._logWindow) {
                                if (fallen) this._logWindow.push("addText", "\\C[18]" + fallen.name() + " fainted!\\C[0]");
                                if (next) this._logWindow.push("addText", "\\C[11]Go! " + next.name() + "!\\C[0]");
                            }
                            acted = true;
                        }
                        if (acted) {
                            try {
                                const sc = (typeof SceneManager !== "undefined") ? SceneManager._scene : null;
                                if (sc && typeof sc.refreshGanjukoBattleHud === "function") sc.refreshGanjukoBattleHud();
                            } catch (e) {}
                            return false;
                        }
                    }
                } catch (e) {}
                return _s19_BattleManager_checkBattleEnd.call(this);
            };
            _s19_status.doubles = true;
        }
    } catch (e) {}

    // Two active battlers per side, doubles only. Every other battle in
    // the game keeps the engine's 1-active rule exactly as shipped.
    try {
        if (typeof Game_Party !== "undefined" && Game_Party.prototype && typeof Game_Party.prototype.maxBattleMembers === "function") {
            const _s19_Game_Party_maxBattleMembers = Game_Party.prototype.maxBattleMembers;
            Game_Party.prototype.maxBattleMembers = function() {
                try {
                    if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaDoubles) return 2;
                } catch (e) {}
                return _s19_Game_Party_maxBattleMembers.call(this);
            };
        }
    } catch (e) {}

    // Arena battles grant no EXP (design A.6): the trainer send-out
    // seam and the victory reward flow both pay EXP through gainExp,
    // so seal the tap while an Arena battle is live. The party
    // restore (which runs before the flag clears) writes the stored
    // EXP value directly, so it does not need this tap open.
    try {
        if (typeof Game_Actor !== "undefined" && Game_Actor.prototype && typeof Game_Actor.prototype.gainExp === "function") {
            const _s19_Game_Actor_gainExp = Game_Actor.prototype.gainExp;
            Game_Actor.prototype.gainExp = function(exp) {
                try {
                    if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive) return;
                } catch (e) {}
                return _s19_Game_Actor_gainExp.call(this, exp);
            };
        }
    } catch (e) {}

    // The Bag is sealed in every Arena battle (design A.2) — the same
    // three-layer lock the Stadium uses, keyed on our own flag.
    try {
        let locks = 0;
        if (typeof Window_ActorCommand !== "undefined" && Window_ActorCommand.prototype && typeof Window_ActorCommand.prototype.makeCommandList === "function") {
            const _s19_WAC_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
            Window_ActorCommand.prototype.makeCommandList = function() {
                _s19_WAC_makeCommandList.call(this);
                try {
                    if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive && Array.isArray(this._list)) {
                        for (const cmd of this._list) { if (cmd && cmd.symbol === "item") cmd.enabled = false; }
                    }
                } catch (e) {}
            };
            locks++;
        }
        if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype && typeof Scene_Battle.prototype.commandItem === "function") {
            const _s19_SB_commandItem = Scene_Battle.prototype.commandItem;
            Scene_Battle.prototype.commandItem = function() {
                try {
                    if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive) {
                        if (typeof SoundManager !== "undefined" && SoundManager.playBuzzer) SoundManager.playBuzzer();
                        if (this._actorCommandWindow) this._actorCommandWindow.activate();
                        return;
                    }
                } catch (e) {}
                return _s19_SB_commandItem.call(this);
            };
            locks++;
        }
        if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.apply === "function") {
            const _s19_GA_apply = Game_Action.prototype.apply;
            Game_Action.prototype.apply = function(target) {
                try {
                    if (typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive) {
                        const item = this.item();
                        const subject = typeof this.subject === "function" ? this.subject() : null;
                        if (item && typeof DataManager !== "undefined" && DataManager.isItem && DataManager.isItem(item) &&
                            subject && typeof subject.isActor === "function" && subject.isActor()) {
                            if (target && typeof target.result === "function") { const r = target.result(); r.clear(); r.used = true; }
                            return;
                        }
                    }
                } catch (e) {}
                return _s19_GA_apply.call(this, target);
            };
            locks++;
        }
        _s19_status.bagLock = locks === 3;
    } catch (e) {}
    _s19_status.battle = true;

    // ---------------------------------------------------------------------
    // 19.5 Doubles mechanics — spread scope, spread damage, foe targeting
    // ---------------------------------------------------------------------
    function arenaDoublesNow() {
        try { return !!(typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive && $gameTemp._arenaDoubles); }
        catch (e) { return false; }
    }
    S19.arenaDoublesNow = arenaDoublesNow;
    function arenaBattleNow() {
        try { return !!(typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._arenaActive); }
        catch (e) { return false; }
    }
    S19.arenaBattleNow = arenaBattleNow;

    // Spread scope: one seam (Game_Action.checkItemScope) decides every
    // scope question MZ asks — one-target, all-targets, needs-selection.
    // In doubles, a designated spread skill answers as scope 2 (all
    // foes); MZ's own target machinery then collects both slots.
    try {
        if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.checkItemScope === "function") {
            const _s19_GA_checkItemScope = Game_Action.prototype.checkItemScope;
            Game_Action.prototype.checkItemScope = function(list) {
                try {
                    if (arenaDoublesNow()) {
                        const item = typeof this.item === "function" ? this.item() : null;
                        if (item && item.scope === 1 && isSpreadSkillId(item.id)) {
                            return list.includes(2);
                        }
                    }
                } catch (e) {}
                return _s19_GA_checkItemScope.call(this, list);
            };
            _s19_status.spread = true;
        }
    } catch (e) {}

    // Spread damage: 0.75x per target (the genre rule), doubles only.
    try {
        if (typeof Game_Action !== "undefined" && Game_Action.prototype && typeof Game_Action.prototype.makeDamageValue === "function") {
            const _s19_GA_makeDamageValue = Game_Action.prototype.makeDamageValue;
            Game_Action.prototype.makeDamageValue = function(target, critical) {
                let value = _s19_GA_makeDamageValue.call(this, target, critical);
                try {
                    if (arenaDoublesNow() && value > 0) {
                        const item = typeof this.item === "function" ? this.item() : null;
                        if (item && item.damage && item.damage.type === 1 && isSpreadSkillId(item.id)) {
                            value = Math.max(1, Math.round(value * S19.SPREAD_FACTOR));
                        }
                    }
                } catch (e) {}
                return value;
            };
        }
    } catch (e) {}

    // Foe targeting in doubles: Section 16.4 picks the move against the
    // lead; this outermost pass re-decides WHICH standing battler it
    // lands on, scoring both with the engine's own evaluator and the
    // pilot tier's discipline (the 16.4 probabilities, reused).
    try {
        if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype && typeof Game_Enemy.prototype.makeActions === "function") {
            const _s19_GE_makeActions = Game_Enemy.prototype.makeActions;
            Game_Enemy.prototype.makeActions = function() {
                _s19_GE_makeActions.call(this);
                try {
                    if (!arenaDoublesNow() || !this._actions || typeof $gameParty === "undefined" || !$gameParty) return;
                    const members = $gameParty.battleMembers().filter(m => m && typeof m.isAlive === "function" && m.isAlive());
                    if (members.length < 2) return;
                    const difficulty = $gameTemp._ganjukoDifficulty;
                    const pBest = (difficulty === "gym" || difficulty === "stadium") ? 0.95 : (difficulty === "trainer" ? 0.8 : 0.4);
                    for (const act of this._actions) {
                        if (!act || typeof act.isForOpponent !== "function" || !act.isForOpponent()) continue;
                        if (typeof act.checkItemScope === "function" && !act.checkItemScope([1])) continue; // spread needs no target
                        const skill = typeof act.item === "function" ? act.item() : null;
                        if (!skill || typeof GE.scoreEnemyAction !== "function") continue;
                        let best = null, bestScore = -Infinity;
                        for (const m of members) {
                            const s = GE.scoreEnemyAction(this, skill, m);
                            if (s > bestScore) { bestScore = s; best = m; }
                        }
                        const chosen = (best && Math.random() < pBest)
                            ? best : members[Math.floor(Math.random() * members.length)];
                        if (chosen && typeof chosen.index === "function" && typeof act.setTarget === "function") {
                            act.setTarget(chosen.index());
                        }
                    }
                } catch (e) {}
            };
            _s19_status.ai = true;
        }
    } catch (e) {}

    // Per-slot target selection: in doubles, a single-target move asks
    // WHICH slot through MZ's own selection windows (the singles flow
    // auto-targets its only possible answer, as shipped). The enemy
    // window draws names only — no numbers to leak.
    try {
        if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype && typeof Scene_Battle.prototype.onSelectAction === "function") {
            const _s19_SB_onSelectAction = Scene_Battle.prototype.onSelectAction;
            Scene_Battle.prototype.onSelectAction = function() {
                try {
                    if (arenaDoublesNow()) {
                        const action = (typeof BattleManager !== "undefined") ? BattleManager.inputtingAction() : null;
                        if (action && typeof action.needsSelection === "function" && action.needsSelection()) {
                            // Restore the STOCK selection flow (the
                            // engine's replacement auto-targets slot 0,
                            // which is only sound with one possible
                            // target): MZ's own start*Selection windows.
                            this.hideSubInputWindows();
                            if (typeof action.isForOpponent === "function" && action.isForOpponent() &&
                                typeof this.startEnemySelection === "function") {
                                this.startEnemySelection();
                                return;
                            }
                            if (typeof action.isForFriend === "function" && action.isForFriend() &&
                                typeof this.startActorSelection === "function") {
                                this.startActorSelection();
                                return;
                            }
                        }
                    }
                } catch (e) {}
                return _s19_SB_onSelectAction.call(this);
            };
            _s19_status.targeting = true;
        }
    } catch (e) {}

    // Switching in doubles: the GANJUKO command swaps the INPUTTING
    // battler's own slot with a standing reserve (singles keeps the
    // shipped slot-0 behaviour). The switch window's rules are patched
    // on its prototype (captured live, the Pass 2 B pattern) with
    // flag-gated doubles behaviour; its HP line is already
    // percentage-only by the P2B patch.
    let _s19_switchProtoPatched = false;
    function patchSwitchProto(win) {
        if (_s19_switchProtoPatched || !win) return;
        const proto = Object.getPrototypeOf(win);
        if (!proto || typeof proto.isCurrentItemEnabled !== "function") return;
        _s19_switchProtoPatched = true;
        const origEnabled = proto.isCurrentItemEnabled;
        proto.isCurrentItemEnabled = function() {
            try {
                if (arenaDoublesNow()) {
                    const idx = this.index();
                    const member = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers()[idx] : null;
                    return idx >= 2 && !!member && typeof member.isAlive === "function" && member.isAlive();
                }
            } catch (e) {}
            return origEnabled.call(this);
        };
        if (typeof proto.drawItem === "function") {
            const origDraw = proto.drawItem;
            proto.drawItem = function(index) {
                try {
                    if (arenaDoublesNow()) {
                        const actor = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers()[index] : null;
                        if (!actor) return;
                        const rect = this.itemLineRect(index);
                        const sp = typeof actor.ganjukoSpecies === "function" ? actor.ganjukoSpecies() : null;
                        const typeInfo = sp ? GE.getTypeInfo(sp.type1) : { name: "" };
                        const enabled = index >= 2 && actor.isAlive();
                        this.changePaintOpacity(enabled);
                        const tag = index < 2 ? "[ACTIVE] " : (actor.isDead() ? "[FAINTED] " : "");
                        this.resetTextColor();
                        this.drawText(tag + actor.name() + " Lv" + actor.level, rect.x, rect.y, 240, "left");
                        this.changeTextColor(ColorManager.systemColor());
                        this.drawText("[" + typeInfo.name + "]", rect.x + 245, rect.y, 90, "left");
                        this.resetTextColor();
                        this.changeTextColor(GE.hpColor(actor.hp / Math.max(1, actor.mhp)));
                        this.drawText("HP " + GE.hpPercent(actor.hp, actor.mhp) + "%", rect.x + 340, rect.y, rect.width - 345, "right");
                        this.resetTextColor();
                        this.changePaintOpacity(1);
                        return;
                    }
                } catch (e) {}
                return origDraw.call(this, index);
            };
        }
    }
    try {
        if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype && typeof Scene_Battle.prototype.onSwitchGanjukoOk === "function") {
            const _s19_SB_onSwitchOk = Scene_Battle.prototype.onSwitchGanjukoOk;
            Scene_Battle.prototype.onSwitchGanjukoOk = function() {
                try {
                    if (arenaDoublesNow()) {
                        const actor = (typeof BattleManager !== "undefined") ? BattleManager.actor() : null;
                        const members = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers() : [];
                        const myIdx = actor ? members.indexOf(actor) : -1;
                        const targetIdx = this._ganjukoSwitchWindow ? this._ganjukoSwitchWindow.index() : -1;
                        const target = members[targetIdx];
                        if (myIdx < 0 || targetIdx < 2 || !target || !target.isAlive()) {
                            if (typeof SoundManager !== "undefined" && SoundManager.playBuzzer) SoundManager.playBuzzer();
                            if (this._ganjukoSwitchWindow) this._ganjukoSwitchWindow.activate();
                            return;
                        }
                        const oldName = actor.name();
                        $gameParty.swapOrder(myIdx, targetIdx);
                        const newIn = $gameParty.allMembers()[myIdx];
                        try { if (typeof AudioManager !== "undefined") AudioManager.playSe({ name: "Raise1", volume: 90, pitch: 100, pan: 0 }); } catch (e) {}
                        if (this._ganjukoSwitchWindow) { this._ganjukoSwitchWindow.hide(); this._ganjukoSwitchWindow.deactivate(); }
                        if (this._logWindow) {
                            this._logWindow.push("addText", "Come back, " + oldName + "! Go! \\C[11]" + newIn.name() + "\\C[0]!");
                        }
                        if (typeof this.refreshGanjukoBattleHud === "function") this.refreshGanjukoBattleHud();
                        const action = (typeof BattleManager !== "undefined") ? BattleManager.inputtingAction() : null;
                        if (action) action.setGuard();
                        this.selectNextCommand();
                        return;
                    }
                } catch (e) {}
                return _s19_SB_onSwitchOk.call(this);
            };
        }
        if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype && typeof Scene_Battle.prototype.createAllWindows === "function") {
            const _s19_SB_createAllWindows = Scene_Battle.prototype.createAllWindows;
            Scene_Battle.prototype.createAllWindows = function() {
                _s19_SB_createAllWindows.call(this);
                try { if (this._ganjukoSwitchWindow) patchSwitchProto(this._ganjukoSwitchWindow); } catch (e) {}
                try {
                    if (arenaBattleNow() && typeof Window_ArenaTimer !== "undefined") {
                        const tw = 470, th = 54;
                        const rect = new Rectangle(Math.floor((Graphics.boxWidth - tw) / 2), 8, tw, th);
                        this._arenaTimerWindow = new Window_ArenaTimer(rect);
                        this.addWindow(this._arenaTimerWindow);
                    }
                } catch (e) {}
            };
        }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 19.6 Doubles presentation — stage slots, the second ally sprite,
    // four plates (all from battleLayout().doubles, planned in P2B)
    // ---------------------------------------------------------------------
    function doublesLayout() {
        try {
            if (typeof GE.battleLayout === "function" && typeof Graphics !== "undefined") {
                return GE.battleLayout(Graphics.boxWidth, Graphics.boxHeight).doubles;
            }
        } catch (e) {}
        return null;
    }
    function foeStageFor(enemy) {
        const L = doublesLayout();
        if (!L) return null;
        try {
            const idx = (typeof $gameTroop !== "undefined" && $gameTroop) ? $gameTroop.members().indexOf(enemy) : 0;
            return L.foeStages[Math.max(0, idx)] || L.foeStages[0];
        } catch (e) { return L.foeStages[0]; }
    }
    try {
        if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype) {
            if (typeof Game_Enemy.prototype.screenX === "function") {
                const _s19_GE_screenX = Game_Enemy.prototype.screenX;
                Game_Enemy.prototype.screenX = function() {
                    try { if (arenaDoublesNow()) { const st = foeStageFor(this); if (st) return st.x; } } catch (e) {}
                    return _s19_GE_screenX.call(this);
                };
            }
            if (typeof Game_Enemy.prototype.screenY === "function") {
                const _s19_GE_screenY = Game_Enemy.prototype.screenY;
                Game_Enemy.prototype.screenY = function() {
                    try { if (arenaDoublesNow()) { const st = foeStageFor(this); if (st) return st.y; } } catch (e) {}
                    return _s19_GE_screenY.call(this);
                };
            }
        }
        // Outermost art-fit clamp: Pass 2 B fits foe art to the singles
        // stage; in doubles each slot's own caps bind (fit only shrinks,
        // so a second clamp against the slot composes exactly).
        if (typeof Sprite_Enemy !== "undefined" && Sprite_Enemy.prototype && typeof Sprite_Enemy.prototype.updatePosition === "function") {
            const _s19_SE_updatePosition = Sprite_Enemy.prototype.updatePosition;
            Sprite_Enemy.prototype.updatePosition = function() {
                _s19_SE_updatePosition.call(this);
                try {
                    if (!arenaDoublesNow() || !this._enemy) return;
                    const st = foeStageFor(this._enemy);
                    if (!st || !this.bitmap) return;
                    const box = typeof GE.battlerArtBox === "function" ? GE.battlerArtBox(this.bitmap) : null;
                    if (!box) return;
                    const f = GE.capClampFactor(box.w, box.h, this.scale.x, this.scale.y, st.capW, st.capH);
                    if (f < 1) { this.scale.x *= f; this.scale.y *= f; }
                } catch (e) {}
            };
        }
    } catch (e) {}

    // The second ally battler sprite: a sibling of the engine's player
    // sprite (same prototype, captured live), with its own update that
    // reads slot 1 — breathing, lunge, hit flash, KO sink, art fit
    // against the slot's caps, and the Section 18 Chroma filter.
    function makeAllySlotUpdate(slot) {
        return function() {
            const L = doublesLayout();
            const stage = L ? L.allyStages[slot] : null;
            let actor = null;
            try { actor = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers()[slot] : null; } catch (e) {}
            if (!actor || !stage) { this.visible = false; return; }
            // KO presentation (P2B's state machine, per slot).
            if (!actor.isAlive()) {
                if (this._s19KoT === null || this._s19KoT === undefined) this._s19KoT = 0;
                if (this._s19KoT < 26) {
                    this._s19KoT++;
                    const k = this._s19KoT / 26;
                    this.visible = true;
                    this.opacity = Math.round(255 * (1 - k));
                    this.y = stage.y + k * 30;
                } else this.visible = false;
                return;
            }
            if (this._s19KoT !== null && this._s19KoT !== undefined) { this._s19KoT = null; this.opacity = 255; }
            this.visible = true;
            let bName = null;
            try { const sp = actor.ganjukoSpecies(); bName = sp ? sp.battlerName : null; } catch (e) {}
            if (bName && this._currentBattlerName !== bName) {
                this._currentBattlerName = bName;
                try { this.bitmap = ImageManager.loadEnemy(bName); } catch (e) {}
            }
            this._breathTick = ((this._breathTick || 0) + 1) % 120;
            const breath = Math.sin((this._breathTick / 120) * Math.PI * 2) * 0.025;
            let lungeX = 0, lungeY = 0;
            if (this._lungeTimer > 0) {
                this._lungeTimer--;
                const p = Math.sin((16 - this._lungeTimer) / 16 * Math.PI);
                lungeX = p * 60; lungeY = -p * 25;
            }
            this.scale.x = -1.0;
            this.scale.y = 1.0 + breath;
            if (actor.result && actor.result() && actor.result().hpAffected && actor.result().hpDamage > 0 && !this._hitFlash) {
                this._hitFlash = 16;
            }
            if (this._hitFlash > 0) {
                this._hitFlash--;
                this.x = stage.x + (this._hitFlash % 4 < 2 ? -8 : 8) + lungeX;
                this.y = stage.y + lungeY;
                if (typeof this.setBlendColor === "function") this.setBlendColor([255, 100, 100, 140]);
            } else {
                this.x = stage.x + lungeX;
                this.y = stage.y + lungeY;
                if (typeof this.setBlendColor === "function") this.setBlendColor([0, 0, 0, 0]);
            }
            // Art fit against this slot's caps (P2B math, exported).
            try {
                const bmp = this.bitmap;
                if (bmp && typeof bmp.isReady === "function" && bmp.isReady() && bmp.width) {
                    const box = GE.battlerArtBox(bmp);
                    if (box) {
                        const s = GE.battlerFitScale(box.w, box.h, stage.capW, stage.capH);
                        this.scale.x *= s; this.scale.y *= s;
                        const clamp = GE.capClampFactor(box.w, box.h, this.scale.x, this.scale.y, stage.capW, stage.capH);
                        if (clamp < 1) { this.scale.x *= clamp; this.scale.y *= clamp; }
                        const ax = (this.anchor && typeof this.anchor.x === "number") ? this.anchor.x : 0.5;
                        this.x += -(box.cx - ax * bmp.width) * this.scale.x;
                        this.y += (bmp.height - box.bottom - 1) * this.scale.y;
                    }
                }
            } catch (e) {}
            // Chroma: the Section 18 colour matrix, keyed per battler.
            try {
                const g = actor._ganjukoGenetics;
                const want = (g && g.chroma && GE.S18 && typeof GE.S18.chromaFilter === "function")
                    ? (actor.ganjukoSpecies() ? (actor.ganjukoSpecies().type1 || 1) : 1) : 0;
                if ((this._s19ChromaKey || 0) !== want) {
                    this._s19ChromaKey = want;
                    const f = want ? GE.S18.chromaFilter(want) : null;
                    this.filters = f ? [f] : null;
                }
            } catch (e) {}
        };
    }

    // Four doubles plates, drawn on the battle HUD sprite's own bitmap
    // with its own card helpers — the singles redraw is replaced whole
    // while doubles is live (never both).
    function drawDoublesPlates(hud, disp) {
        const L = doublesLayout();
        if (!L || !hud || !hud.bitmap) return;
        const bmp = hud.bitmap;
        bmp.clear();
        const shownRate = (battler, idx) => {
            if (disp && typeof disp[idx] === "number" && disp[idx] >= 0) return disp[idx];
            return Math.max(0, Math.min(1, battler.hp / Math.max(1, battler.mhp)));
        };
        const drawFoe = (enemy, p, pips, slotIdx) => {
            if (!enemy) return;
            hud.drawCardBox(bmp, p.x, p.y, p.w, p.h, "rgba(24, 20, 32, 0.94)", "#F87171");
            let sp = null;
            try { sp = enemy.ganjukoSpecies(); } catch (e) {}
            const typeInfo = sp ? GE.getTypeInfo(sp.type1) : { name: "" };
            bmp.fontSize = 18; bmp.textColor = "#F87171";
            bmp.drawText("⚔ [FOE]", p.x + 14, p.y + 8, 78, 26, "left");
            bmp.fontSize = 21; bmp.textColor = "#FFFFFF";
            const nm = (enemy._isShiny ? "★ " : "") + enemy.name();
            while (bmp.measureTextWidth(nm) > 118 && bmp.fontSize > 12) bmp.fontSize -= 1;
            bmp.drawText(nm, p.x + 94, p.y + 8, 168, 26, "left");
            bmp.fontSize = 21;
            hud.drawTypeBadge(bmp, typeInfo, p.x + p.w - 152, p.y + 8);
            bmp.fontSize = 19; bmp.textColor = "#FACC15";
            bmp.drawText("Lv" + enemy.ganjukoLevel(), p.x + p.w - 76, p.y + 8, 60, 26, "right");
            const rate = shownRate(enemy, slotIdx);
            hud.drawHpBar(bmp, p.x + 14, p.y + 42, p.w - 28, 18, rate);
            bmp.fontSize = 16; bmp.textColor = GE.hpColor(rate);
            bmp.drawText("HP " + Math.round(rate * 100) + "%", p.x + 14, p.y + 68, 96, 22, "left");
            hud.drawStatusPill(bmp, enemy, p.x + 112, p.y + 68);
            if (pips) {
                bmp.fontSize = 15; bmp.textColor = "#F87171";
                bmp.drawText("Team: " + "●".repeat(Math.min(6, pips)), p.x + 190, p.y + 68, p.w - 204, 22, "right");
            }
        };
        const drawAlly = (actor, p, slotIdx) => {
            if (!actor) return;
            hud.drawCardBox(bmp, p.x, p.y, p.w, p.h, "rgba(15, 23, 42, 0.94)", "#38BDF8");
            let sp = null;
            try { sp = actor.ganjukoSpecies(); } catch (e) {}
            const typeInfo = sp ? GE.getTypeInfo(sp.type1) : { name: "" };
            bmp.fontSize = 18; bmp.textColor = "#38BDF8";
            bmp.drawText("★ [ALLY]", p.x + 14, p.y + 8, 82, 26, "left");
            bmp.fontSize = 21; bmp.textColor = "#FFFFFF";
            const nm = actor.name();
            while (bmp.measureTextWidth(nm) > 112 && bmp.fontSize > 12) bmp.fontSize -= 1;
            bmp.drawText(nm, p.x + 100, p.y + 8, 162, 26, "left");
            bmp.fontSize = 21;
            hud.drawTypeBadge(bmp, typeInfo, p.x + p.w - 152, p.y + 8);
            bmp.fontSize = 19; bmp.textColor = "#FACC15";
            bmp.drawText("Lv" + actor.level, p.x + p.w - 76, p.y + 8, 60, 26, "right");
            const rate = shownRate(actor, 2 + slotIdx);
            hud.drawHpBar(bmp, p.x + 14, p.y + 42, p.w - 28, 18, rate);
            bmp.fontSize = 16; bmp.textColor = GE.hpColor(rate);
            bmp.drawText("HP " + Math.round(rate * 100) + "%", p.x + 14, p.y + 68, 96, 22, "left");
            hud.drawStatusPill(bmp, actor, p.x + 112, p.y + 68);
        };
        try {
            const foes = (typeof $gameTroop !== "undefined" && $gameTroop) ? $gameTroop.members() : [];
            const allies = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers() : [];
            const pips = foes.filter(f => f && f.isAlive()).length + (($gameTemp && $gameTemp._arenaFoeQueue) || []).length;
            drawFoe(foes[0], L.foePlates[0], pips, 0);
            drawFoe(foes[1], L.foePlates[1], 0, 1);
            drawAlly(allies[0], L.allyPlates[0], 0);
            drawAlly(allies[1], L.allyPlates[1], 1);
        } catch (e) {}
    }
    S19.drawDoublesPlates = drawDoublesPlates;

    function doublesHudUpdate() {
        // Smoothed per-slot rates, P2B's drain idiom; redraw while any
        // rate is still travelling or the cast changed.
        const slots = [];
        try {
            const foes = (typeof $gameTroop !== "undefined" && $gameTroop) ? $gameTroop.members() : [];
            const allies = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers() : [];
            for (const f of [foes[0], foes[1]]) slots.push(f ? Math.max(0, Math.min(1, f.hp / Math.max(1, f.mhp))) : -1);
            for (const m of [allies[0], allies[1]]) slots.push(m ? Math.max(0, Math.min(1, m.hp / Math.max(1, m.mhp))) : -1);
            const castKey = [foes[0] && foes[0].name(), foes[1] && foes[1].name(),
                             allies[0] && allies[0].name(), allies[1] && allies[1].name()].join("|");
            if (this._s19CastKey !== castKey) { this._s19CastKey = castKey; this._s19Disp = null; }
        } catch (e) {}
        if (!this._s19Disp) this._s19Disp = slots.slice();
        let moving = false;
        for (let i = 0; i < 4; i++) {
            const d = this._s19Disp[i], t = slots[i];
            if (t < 0) { if (d !== -1) { this._s19Disp[i] = -1; moving = true; } continue; }
            if (d < 0) { this._s19Disp[i] = t; moving = true; continue; }
            if (Math.abs(d - t) > 0.003) {
                // FR4 QA-D22: same drain constant as the singles HUD (was 0.025).
                this._s19Disp[i] = d > t ? Math.max(t, d - 0.012) : Math.min(t, d + 0.012);
                moving = true;
            } else if (d !== t) this._s19Disp[i] = t;
        }
        // Redraw while any displayed rate is still travelling (the
        // plates read this._s19Disp, so bars and % drain together,
        // exactly like the singles HUD), once more at rest.
        if (moving || this._s19NeedsDraw) {
            this._s19NeedsDraw = false;
            try { drawDoublesPlates(this, this._s19Disp); } catch (e) {}
        }
    }

    let _s19_hudProtoPatched = false, _s19_playerProtoPatched = false;
    function patchHudProto(sprite) {
        if (_s19_hudProtoPatched || !sprite) return;
        const proto = Object.getPrototypeOf(sprite);
        if (!proto || typeof proto.update !== "function") return;
        _s19_hudProtoPatched = true;
        const origUpdate = proto.update;
        proto.update = function() {
            if (arenaDoublesNow()) { try { doublesHudUpdate.call(this); } catch (e) {} return; }
            return origUpdate.call(this);
        };
    }
    function patchPlayerProto(sprite) {
        if (_s19_playerProtoPatched || !sprite) return;
        const proto = Object.getPrototypeOf(sprite);
        if (!proto || typeof proto.update !== "function") return;
        _s19_playerProtoPatched = true;
        const origUpdate = proto.update;
        proto.update = function() {
            origUpdate.call(this);
            try {
                // Slot 0 in doubles: same ground point as singles, but
                // the doubles column is narrower — one more clamp.
                if (arenaDoublesNow() && this._s19SlotIndex == null) {
                    const L = doublesLayout();
                    if (!L || !this.bitmap) return;
                    const box = GE.battlerArtBox(this.bitmap);
                    if (!box) return;
                    const st = L.allyStages[0];
                    const f = GE.capClampFactor(box.w, box.h, this.scale.x, this.scale.y, st.capW, st.capH);
                    if (f < 1) { this.scale.x *= f; this.scale.y *= f; }
                }
            } catch (e) {}
        };
    }
    try {
        if (typeof Spriteset_Battle !== "undefined" && Spriteset_Battle.prototype && typeof Spriteset_Battle.prototype.createLowerLayer === "function") {
            const _s19_SB_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer;
            Spriteset_Battle.prototype.createLowerLayer = function() {
                _s19_SB_createLowerLayer.call(this);
                try {
                    if (this._ganjukoHudSprite) patchHudProto(this._ganjukoHudSprite);
                    if (this._playerGanjukoSprite) patchPlayerProto(this._playerGanjukoSprite);
                    if (arenaDoublesNow() && this._playerGanjukoSprite && !this._playerGanjukoSprite2) {
                        const proto = Object.getPrototypeOf(this._playerGanjukoSprite);
                        const spr = Object.create(proto);
                        proto.initialize.call(spr);
                        spr._s19SlotIndex = 1;
                        spr.update = makeAllySlotUpdate(1);
                        if (typeof spr.triggerLunge !== "function") spr.triggerLunge = function() { this._lungeTimer = 16; };
                        this._playerGanjukoSprite2 = spr;
                        if (this._battleField && typeof this._battleField.addChild === "function") this._battleField.addChild(spr);
                        else this.addChild(spr);
                    }
                } catch (e) {}
            };
            _s19_status.sprites = true;
            _s19_status.hud = true;
        }
        // Lunge routing: the log's performAction fires the main sprite
        // for any actor subject; when slot 1 acts, move the lunge there.
        if (typeof Window_BattleLog !== "undefined" && Window_BattleLog.prototype && typeof Window_BattleLog.prototype.performAction === "function") {
            const _s19_WBL_performAction = Window_BattleLog.prototype.performAction;
            Window_BattleLog.prototype.performAction = function(subject, action) {
                _s19_WBL_performAction.call(this, subject, action);
                try {
                    if (!arenaDoublesNow() || !subject || typeof subject.isActor !== "function" || !subject.isActor()) return;
                    const sc = (typeof SceneManager !== "undefined") ? SceneManager._scene : null;
                    const ss = sc && sc._spriteset;
                    if (!ss || !ss._playerGanjukoSprite2) return;
                    const slot1 = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers()[1] : null;
                    if (slot1 && subject === slot1) {
                        if (ss._playerGanjukoSprite) ss._playerGanjukoSprite._lungeTimer = 0;
                        if (typeof ss._playerGanjukoSprite2.triggerLunge === "function") ss._playerGanjukoSprite2.triggerLunge();
                    }
                } catch (e) {}
            };
        }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 19.7 Champions timers — 20m / 7m / 45s, graceful timeouts
    // ---------------------------------------------------------------------
    // The clock pane: total match time, the player's own decision
    // clock, and the current turn's 45 seconds. Time is a legal number
    // to show — HP and genetics stay unshown, as everywhere.
    if (typeof Window_Base !== "undefined" && typeof Rectangle !== "undefined") {
        class Window_ArenaTimer extends Window_Base {
            initialize(rect) {
                super.initialize(rect);
                this.opacity = 235;
                this._lastText = "";
                this.refresh();
            }
            refresh() {
                try {
                    const st = (typeof $gameTemp !== "undefined" && $gameTemp) ? $gameTemp._arenaTimer : null;
                    if (!st) { this.contents.clear(); this._lastText = ""; return; }
                    const L = S19.TIMERS;
                    const yourLeft = Math.max(0, L.yourMs - st.yourElapsed);
                    const turnLeft = Math.max(0, L.turnMs - st.turnElapsed);
                    const totalLeft = Math.max(0, L.totalMs - st.elapsed);
                    const text = "⏱ YOUR " + fmtClock(yourLeft) + " · TURN " + fmtClock(turnLeft) + " · TOTAL " + fmtClock(totalLeft);
                    if (text === this._lastText) return;
                    this._lastText = text;
                    this.contents.clear();
                    this.contents.fontSize = 17;
                    this.changeTextColor(turnLeft <= 10000 ? "#F87171" : (yourLeft <= 60000 ? "#FACC15" : "#E2E8F0"));
                    this.drawText(text, 0, 0, this.contentsWidth(), "center");
                    this.resetTextColor();
                } catch (e) {}
            }
            update() {
                super.update();
                this.refresh();
            }
        }
        window.Window_ArenaTimer = Window_ArenaTimer;
    }

    // Timeout behaviour (design A.5): the turn is auto-submitted as
    // "fight with the first listed move" — the acting battler's first
    // usable damaging move, else its first usable move, else guard.
    function forceTimeoutAction(scene) {
        try {
            if (typeof BattleManager === "undefined" || !BattleManager) return false;
            const subject = typeof BattleManager.actor === "function" ? BattleManager.actor() : null;
            const action = typeof BattleManager.inputtingAction === "function" ? BattleManager.inputtingAction() : null;
            if (!subject || !action) return false;
            const actions = (typeof subject.makeActionList === "function") ? subject.makeActionList() : [];
            let chosen = null;
            for (const a of actions) { if (a && a.item() && a.item().damage && a.item().damage.type === 1) { chosen = a; break; } }
            if (!chosen) chosen = actions[0] || null;
            if (chosen) {
                if (typeof action.setSkill === "function" && chosen.item()) action.setSkill(chosen.item().id);
            } else if (typeof action.setGuard === "function") {
                action.setGuard();
            }
            if (typeof action.isForOpponent === "function" && action.isForOpponent() &&
                typeof action.setTarget === "function" && typeof action.checkItemScope === "function" && action.checkItemScope([1])) {
                action.setTarget(0);
            }
            if (scene && typeof scene.hideSubInputWindows === "function") scene.hideSubInputWindows();
            if (scene && scene._logWindow && typeof subject.name === "function") {
                scene._logWindow.push("addText", subject.name() + " acts on instinct!");
            }
            if (scene && typeof scene.selectNextCommand === "function") scene.selectNextCommand();
            return true;
        } catch (e) { return false; }
    }
    S19.forceTimeoutAction = forceTimeoutAction;

    // Total time expiry (design A.5): more standing partners wins;
    // a tie breaks on total team health; still tied is a draw.
    function decideTimeResult() {
        try {
            const picksAlive = (typeof $gameParty !== "undefined" && $gameParty)
                ? $gameParty.allMembers().filter(m => m && typeof m.isAlive === "function" && m.isAlive()).length : 0;
            const queueLeft = (typeof $gameTemp !== "undefined" && $gameTemp)
                ? (($gameTemp._trainerQueue || []).length + ($gameTemp._arenaFoeQueue || []).length) : 0;
            const foesAlive = (typeof $gameTroop !== "undefined" && $gameTroop)
                ? $gameTroop.members().filter(m => m && typeof m.isAlive === "function" && m.isAlive()).length : 0;
            if (picksAlive !== foesAlive + queueLeft) return picksAlive > foesAlive + queueLeft ? "win" : "loss";
            let mine = 0, theirs = 0;
            if (typeof $gameParty !== "undefined" && $gameParty) {
                for (const m of $gameParty.allMembers()) mine += m.hp / Math.max(1, m.mhp);
            }
            if (typeof $gameTroop !== "undefined" && $gameTroop) {
                for (const m of $gameTroop.members()) theirs += m.hp / Math.max(1, m.mhp);
            }
            theirs += queueLeft; // untouched reserves count in full
            if (Math.abs(mine - theirs) < 0.001) return "draw";
            return mine > theirs ? "win" : "loss";
        } catch (e) { return "draw"; }
    }
    S19.decideTimeResult = decideTimeResult;

    try {
        if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype && typeof Scene_Battle.prototype.update === "function") {
            const _s19_SB_update = Scene_Battle.prototype.update;
            Scene_Battle.prototype.update = function() {
                _s19_SB_update.call(this);
                try {
                    if (typeof $gameTemp === "undefined" || !$gameTemp || !$gameTemp._arenaActive) return;
                    const run = GE._arenaBattle;
                    if (!run || !run.active || run.resolving) return;
                    if (typeof BattleManager === "undefined" || !BattleManager) return;
                    if (typeof BattleManager.isBusy === "function" && BattleManager.isBusy()) return;
                    if (this.isAnyInputWindowActive && this.isAnyInputWindowActive()) { /* input still counts: your-time runs while deciding */ }
                    const st = $gameTemp._arenaTimer;
                    if (!st) return;
                    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
                    const dt = st._lastNow ? Math.max(0, Math.min(500, now - st._lastNow)) : 0;
                    st._lastNow = now;
                    const inputting = typeof BattleManager.isInputting === "function" ? BattleManager.isInputting() : false;
                    const turnCount = (typeof $gameTroop !== "undefined" && $gameTroop && typeof $gameTroop.turnCount === "function") ? $gameTroop.turnCount() : 0;
                    const events = timerStep(st, dt, inputting, turnCount, S19.TIMERS);
                    for (const ev of events) {
                        if (ev === "turn-timeout") {
                            forceTimeoutAction(this);
                        } else if (ev === "forfeit") {
                            $gameTemp._arenaForfeit = true;
                            if (this._logWindow) this._logWindow.push("addText", "\\C[18]Time! The Arena calls it — a forfeit.\\C[0]");
                            BattleManager.processDefeat();
                        } else if (ev === "time-decision") {
                            const result = decideTimeResult();
                            $gameTemp._arenaTimeResult = result;
                            if (this._logWindow) this._logWindow.push("addText", "\\C[14]Time! The judges confer…\\C[0]");
                            if (result === "win") {
                                for (const m of $gameTroop.members()) { try { m.die(); } catch (e) {} }
                                $gameTemp._arenaFoeQueue = [];
                                $gameTemp._trainerQueue = [];
                            } else {
                                BattleManager.processDefeat();
                            }
                        }
                    }
                } catch (e) {}
            };
            _s19_status.timers = true;
        }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 19.8 The Arena scenes — hub, registration, Trial Counter, season
    // ---------------------------------------------------------------------
    // Copy discipline across every Arena surface: levels, AP, ratings
    // and clocks are shown; HP is bar + percentage only; genetics are
    // flavor (hearts, trait words, profile lines) — never numbers.
    function arenaHelp(scene, text) {
        try { if (scene && scene._helpWindow) scene._helpWindow.setText(text); } catch (e) {}
    }
    function teamRowsText() {
        const a = ensureArena();
        if (!a) return [];
        return a.team.map(id => {
            const m = actorById(id);
            return m ? m : null;
        }).filter(Boolean);
    }

    try {
      if (typeof Scene_MenuBase !== "undefined" && typeof Window_Command !== "undefined" && typeof Window_Base !== "undefined") {
        // ---- Hub ------------------------------------------------------------
        class Window_GanjukoArenaCommand extends Window_Command {
            makeCommandList() {
                const a = ensureArena();
                const teamN = a ? a.team.length : 0;
                this.addCommand("REGISTER TEAM", "register", true);
                this.addCommand("SPARRING — SINGLES (bring 6, pick 3)", "sparSingles", teamN >= 3);
                this.addCommand("SPARRING — DOUBLES (bring 6, pick 4)", "sparDoubles", teamN >= 4);
                this.addCommand("TRIAL PARTNERS", "trials", true);
                this.addCommand("SEASON & REWARDS", "season", true);
                this.addCommand("CASUAL BATTLE — arrives with the online update", "online", false);
                this.addCommand("RANKED BATTLE — arrives with the online update", "online", false);
                this.addCommand("LEAVE THE ARENA", "cancel", true);
            }
        }
        class Window_GanjukoArenaStatus extends Window_Base {
            refresh() {
                this.contents.clear();
                const a = ensureArena();
                if (!a) return;
                let y = 0;
                const line = (text, color, size) => {
                    this.contents.fontSize = size || 20;
                    if (color) this.changeTextColor(color); else this.resetTextColor();
                    this.drawText(text, 8, y, this.contentsWidth() - 16, "left");
                    y += (size || 20) + 12;
                };
                line("BATTLE ARENA — CHAMPIONS HALL", "#FACC15", 24);
                line("Arena Points: " + a.ap + " AP", "#7DD3FC", 20);
                const band = BANDS[teamBandIndex()] || BANDS[0];
                line("Team band: " + band.name + "    Rating: " + a.rating + " (" + tierForRating(a.rating) + ")", null, 19);
                line("Sparring record: " + a.record.wins + "W / " + a.record.losses + "L / " + a.record.draws + "D", null, 19);
                y += 4;
                line("REGISTERED TEAM", "#FACC15", 19);
                const rows = teamRowsText();
                if (!rows.length) line("  (nobody yet — register your partners at REGISTER TEAM)", "#94A3B8", 18);
                for (const m of rows) {
                    const rental = Object.values(a.rentals).some(r => Number(r.actorId) === m.actorId());
                    line("  " + m.name() + "  Lv" + m.level + (rental ? "  [TRIAL]" : "") + "  " + heartsOf(m), null, 18);
                }
                const onSet = Object.keys(a.rentals).length;
                if (onSet) line("Trial sets running: " + onSet, "#A5B4FC", 18);
                if (a.lastResult) { y += 4; line("Last bout: " + a.lastResult, "#94A3B8", 18); }
                y += 6;
                line("Arena rules: natural levels, no items, partners fully", "#64748B", 16);
                line("restored after every bout. Battles here grant no", "#64748B", 16);
                line("experience — the bond you build is the reward.", "#64748B", 16);
            }
        }
        class Scene_GanjukoArena extends Scene_MenuBase {
            create() {
                super.create();
                const a = ensureArena();
                this._welcomeNote = false;
                if (a && !a.welcomed) {
                    a.welcomed = true;
                    a.ap += S19.WELCOME_AP;
                    this._welcomeNote = true;
                }
                this.createHelpWindow();
                this._helpWindow.setText(this._welcomeNote
                    ? "Welcome to the Battle Arena! The desk grants you " + S19.WELCOME_AP + " AP to begin. Register a team, then spar a pilot."
                    : "The Battle Arena: spar the house pilots, rent Trial Partners, climb at your own pace.");
                const cw = 560, ch = this.calcWindowHeight(8, true);
                this._commandWindow = new Window_GanjukoArenaCommand(new Rectangle(24, this.mainAreaTop(), cw, ch));
                this._commandWindow.setHandler("register", this.commandRegister.bind(this));
                this._commandWindow.setHandler("sparSingles", () => this.commandSpar("singles"));
                this._commandWindow.setHandler("sparDoubles", () => this.commandSpar("doubles"));
                this._commandWindow.setHandler("trials", this.commandTrials.bind(this));
                this._commandWindow.setHandler("season", this.commandSeason.bind(this));
                this._commandWindow.setHandler("cancel", this.popScene.bind(this));
                this.addWindow(this._commandWindow);
                this._statusWindow = new Window_GanjukoArenaStatus(new Rectangle(24 + cw + 16, this.mainAreaTop(), Graphics.boxWidth - cw - 56, this.mainAreaHeight()));
                this.addWindow(this._statusWindow);
                this._statusWindow.refresh();
            }
            commandRegister() { SceneManager.push(Scene_GanjukoArenaRegister); }
            commandTrials() { SceneManager.push(Scene_GanjukoArenaTrials); }
            commandSeason() { SceneManager.push(Scene_GanjukoArenaSeason); }
            commandSpar(format) { S19._pendingFormat = format; SceneManager.push(Scene_GanjukoArenaVersus); }
        }

        // ---- Registration ----------------------------------------------------
        class Window_GanjukoArenaSources extends Window_Selectable {
            initialize(rect) { super.initialize(rect); this._data = []; this.refresh(); this.select(0); }
            maxItems() { return this._data ? this._data.length : 0; }
            item() { return this._data && this._data[this.index()] ? this._data[this.index()] : null; }
            refresh() {
                this._data = arenaSources();
                this.createContents();
                this.drawAllItems();
            }
            drawItem(index) {
                const entry = this._data[index];
                if (!entry) return;
                const actor = actorById(entry.actorId);
                if (!actor) return;
                const rect = this.itemLineRect(index);
                const a = ensureArena();
                const inTeam = a && a.team.map(Number).includes(actor.actorId());
                let sp = null;
                try { sp = actor.ganjukoSpecies(); } catch (e) {}
                const t1 = sp ? GE.getTypeInfo(sp.type1) : { name: "?" };
                const t2 = sp && sp.type2 ? GE.getTypeInfo(sp.type2) : null;
                this.changePaintOpacity(true);
                this.resetTextColor();
                const tag = entry.source === "party" ? "[PARTY]" : entry.source === "trial" ? "[TRIAL]" : "[BOX]";
                this.changeTextColor(entry.source === "trial" ? "#A5B4FC" : ColorManager.systemColor());
                this.drawText(tag, rect.x, rect.y, 84, "left");
                this.resetTextColor();
                this.drawText(actor.name(), rect.x + 88, rect.y, 150, "left");
                this.changeTextColor("#FACC15");
                this.drawText("Lv" + actor.level, rect.x + 240, rect.y, 56, "left");
                this.resetTextColor();
                this.drawText(t1.name + (t2 ? "/" + t2.name : ""), rect.x + 300, rect.y, 150, "left");
                this.drawText(heartsOf(actor), rect.x + 452, rect.y, 120, "left");
                if (inTeam) {
                    this.changeTextColor("#4ADE80");
                    this.drawText("IN TEAM #" + (a.team.map(Number).indexOf(actor.actorId()) + 1), rect.x + 580, rect.y, rect.width - 584, "left");
                    this.resetTextColor();
                }
            }
            currentDetail() {
                const entry = this.item();
                if (!entry) return "Your own partners only — the party, the Box, and Trial Partners on a set.";
                const actor = actorById(entry.actorId);
                if (!actor) return "";
                const buildId = entry.buildId ? " · Trial Partner of " + (buildById(entry.buildId) || {}).lender : "";
                return actor.name() + " — " + profileLineOf(actor) + buildId;
            }
        }
        class Window_GanjukoArenaTeam extends Window_Base {
            refresh() {
                this.contents.clear();
                const a = ensureArena();
                this.contents.fontSize = 20;
                this.changeTextColor("#FACC15");
                this.drawText("YOUR ARENA TEAM (order = send-out order)", 4, 0, this.contentsWidth() - 8, "left");
                this.resetTextColor();
                let y = 34;
                const rows = teamRowsText();
                if (!rows.length) {
                    this.contents.fontSize = 18; this.changeTextColor("#94A3B8");
                    this.drawText("Nobody registered yet. Pick from the list — up to six.", 4, y, this.contentsWidth() - 8, "left");
                    this.resetTextColor();
                }
                rows.forEach((m, i) => {
                    this.contents.fontSize = 18;
                    this.drawText((i + 1) + ". " + m.name() + "  Lv" + m.level + "  " + heartsOf(m), 4, y, this.contentsWidth() - 8, "left");
                    y += 26;
                });
                if (a) {
                    this.contents.fontSize = 17; this.changeTextColor("#94A3B8");
                    const band = BANDS[teamBandIndex()] || BANDS[0];
                    // The band line follows the rows (it used to pin to
                    // the pane's bottom edge and crowd the last rows of
                    // a full six — the pane is sized for both now).
                    this.drawText("Band: " + band.name + " — set by your highest-level partner.", 4, y + 6, this.contentsWidth() - 8, "left");
                    this.resetTextColor();
                }
            }
        }
        class Scene_GanjukoArenaRegister extends Scene_MenuBase {
            create() {
                super.create();
                this.createHelpWindow();
                this._helpWindow.setText("Your own partners only — the party, the Box, and Trial Partners on a set.");
                const top = this.mainAreaTop();
                const listH = Math.floor(this.mainAreaHeight() * 0.58);
                this._listWindow = new Window_GanjukoArenaSources(new Rectangle(24, top, Graphics.boxWidth - 48, listH));
                this._listWindow.setHandler("ok", this.onSourceOk.bind(this));
                this._listWindow.setHandler("cancel", this.popScene.bind(this));
                this.addWindow(this._listWindow);
                this._teamWindow = new Window_GanjukoArenaTeam(new Rectangle(24, top + listH + 12, Graphics.boxWidth - 48, this.mainAreaHeight() - listH - 12));
                this.addWindow(this._teamWindow);
                this._teamWindow.refresh();
                this._listWindow.activate();
            }
            update() {
                super.update();
                if (this._listWindow) arenaHelp(this, this._listWindow.currentDetail());
            }
            onSourceOk() {
                const entry = this._listWindow.item();
                if (!entry) { this._listWindow.activate(); return; }
                const a = ensureArena();
                const id = entry.actorId;
                const res = (a && a.team.map(Number).includes(id)) ? removeFromTeam(id) : addToTeam(id);
                if (!res.ok) {
                    SoundManager.playBuzzer();
                    arenaHelp(this, res.error);
                } else {
                    SoundManager.playOk();
                }
                this._listWindow.refresh();
                this._teamWindow.refresh();
                this._listWindow.activate();
            }
        }

        // ---- Trial Counter ---------------------------------------------------
        class Window_GanjukoArenaBands extends Window_Command {
            makeCommandList() {
                for (const b of BANDS) this.addCommand(b.name + "  (Lv " + b.min + "–" + b.max + ")", "band" + b.index);
            }
        }
        class Window_GanjukoArenaBuilds extends Window_Selectable {
            initialize(rect) { super.initialize(rect); this._band = 0; this._data = []; this.refresh(); }
            setBand(i) { this._band = i; this.refresh(); this.select(0); }
            maxItems() { return this._data ? this._data.length : 0; }
            item() { return this._data && this._data[this.index()] ? this._data[this.index()] : null; }
            refresh() {
                this._data = buildsForBand(this._band);
                this.createContents();
                this.drawAllItems();
            }
            drawItem(index) {
                const build = this._data[index];
                if (!build) return;
                const rect = this.itemLineRect(index);
                const a = ensureArena();
                const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(build.speciesId) : null;
                const t1 = sp ? GE.getTypeInfo(sp.type1) : { name: "?" };
                const sets = a ? (a.rentalSets[build.id] || 0) : 0;
                const active = a && a.rentals[build.id];
                this.resetTextColor();
                this.drawText(build.lender + "'s " + (sp ? sp.name : "?"), rect.x, rect.y, 226, "left");
                this.changeTextColor("#FACC15");
                this.drawText("Lv" + build.level, rect.x + 230, rect.y, 48, "left");
                this.resetTextColor();
                this.drawText(t1.name + " · " + build.trait, rect.x + 282, rect.y, 148, "left");
                this.changeTextColor("#94A3B8");
                // Moves column: fit by measurement — whole move names
                // only, with an ellipsis when the full set cannot fit.
                // The state column owns the last 176 px (right-aligned,
                // shortened strings); the first build of this window
                // let the two columns collide, and a wider state claim
                // squeezed the preview to a single move.
                const movesW = Math.max(60, rect.width - 176 - 434);
                const moveNames = buildMovesPreview(build);
                let movesText = "";
                for (const mn of moveNames) {
                    const cand = movesText ? movesText + " · " + mn : mn;
                    if (this.textWidth(cand) > movesW) { movesText += " …"; break; }
                    movesText = cand;
                }
                this.drawText(movesText, rect.x + 434, rect.y, movesW, "left");
                this.resetTextColor();
                let state = "";
                if (a && a.recruited[build.id]) state = "RECRUITED — yours";
                else if (active) state = "ON SET — " + a.rentals[build.id].battlesLeft + " left";
                else state = "●".repeat(sets) + "○".repeat(Math.max(0, S19.RECRUIT_SETS - sets)) + " · " + S19.RENT_COST + " AP";
                this.changeTextColor(active ? "#4ADE80" : "#A5B4FC");
                this.drawText(state, rect.x + rect.width - 176, rect.y, 172, "right");
                this.resetTextColor();
            }
            currentDetail() {
                const build = this.item();
                if (!build) return "Trial Partners: honest, even partners lent by Arena regulars.";
                const a = ensureArena();
                if (a && a.recruited[build.id]) return build.lender + "'s partner joined you for good. It fights as your own now.";
                if (a && (a.rentalSets[build.id] || 0) >= S19.RECRUIT_SETS) {
                    return "You know this partner well — RECRUIT it for " + S19.RECRUIT_COST + " AP and it is yours for good.";
                }
                return "Rent for " + S19.RENT_COST + " AP: up to " + S19.SET_BATTLES + " Arena battles, or until your team changes. A set counts toward recruiting.";
            }
        }
        class Window_GanjukoArenaTrialChoice extends Window_Command {
            makeCommandList() {
                this.addCommand("Rent — " + S19.RENT_COST + " AP", "rent");
                this.addCommand("Recruit for good — " + S19.RECRUIT_COST + " AP", "recruit");
                this.addCommand("Not now", "cancel");
            }
        }
        class Scene_GanjukoArenaTrials extends Scene_MenuBase {
            create() {
                super.create();
                this.createHelpWindow();
                this._helpWindow.setText("Trial Partners: honest, even partners lent by Arena regulars. AP: " + (ensureArena() || {}).ap);
                const top = this.mainAreaTop();
                this._bandWindow = new Window_GanjukoArenaBands(new Rectangle(24, top, 300, this.calcWindowHeight(5, true)));
                BANDS.forEach(b => this._bandWindow.setHandler("band" + b.index, () => this.onBand(b.index)));
                this._bandWindow.setHandler("cancel", this.popScene.bind(this));
                this.addWindow(this._bandWindow);
                const bw = Graphics.boxWidth - 348;
                this._buildWindow = new Window_GanjukoArenaBuilds(new Rectangle(324, top, bw, this.mainAreaHeight()));
                this._buildWindow.setHandler("ok", this.onBuildOk.bind(this));
                this._buildWindow.setHandler("cancel", this.onBuildCancel.bind(this));
                this._buildWindow.deactivate();
                this.addWindow(this._buildWindow);
                this._choiceWindow = new Window_GanjukoArenaTrialChoice(new Rectangle(Graphics.boxWidth - 420, top + 60, 372, this.calcWindowHeight(3, true)));
                this._choiceWindow.setHandler("rent", this.onChoiceRent.bind(this));
                this._choiceWindow.setHandler("recruit", this.onChoiceRecruit.bind(this));
                this._choiceWindow.setHandler("cancel", this.onChoiceCancel.bind(this));
                this._choiceWindow.hide();
                this._choiceWindow.deactivate();
                this.addWindow(this._choiceWindow);
                this._bandWindow.select(teamBandIndex());
                this._buildWindow.setBand(teamBandIndex());
                this._bandWindow.activate();
            }
            onBand(i) {
                this._buildWindow.setBand(i);
                this._bandWindow.deactivate();
                this._buildWindow.activate();
            }
            onBuildCancel() {
                this._buildWindow.deactivate();
                this._bandWindow.activate();
            }
            onBuildOk() {
                const build = this._buildWindow.item();
                const a = ensureArena();
                if (!build || !a) { this._buildWindow.activate(); return; }
                if (a.rentals[build.id] || a.recruited[build.id]) {
                    SoundManager.playBuzzer();
                    this._buildWindow.activate();
                    return;
                }
                if ((a.rentalSets[build.id] || 0) >= S19.RECRUIT_SETS) {
                    this._pendingBuild = build;
                    this._buildWindow.deactivate();
                    this._choiceWindow.show();
                    this._choiceWindow.activate();
                    this._choiceWindow.select(0);
                    return;
                }
                this.doRent(build);
            }
            doRent(build) {
                const res = rentTrial(build.id);
                if (!res.ok) { SoundManager.playBuzzer(); arenaHelp(this, "The desk shakes its head: " + res.error + "."); }
                else {
                    SoundManager.playOk();
                    const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(build.speciesId) : null;
                    arenaHelp(this, build.lender + " lends you " + (sp ? sp.name : "a partner") + " for this set. It is on your team sheet.");
                }
                this._buildWindow.refresh();
                this._buildWindow.activate();
            }
            onChoiceRent() { this._choiceWindow.hide(); this._choiceWindow.deactivate(); this.doRent(this._pendingBuild); }
            onChoiceRecruit() {
                this._choiceWindow.hide();
                this._choiceWindow.deactivate();
                const build = this._pendingBuild;
                const res = recruitTrial(build.id);
                if (!res.ok) { SoundManager.playBuzzer(); arenaHelp(this, "The desk shakes its head: " + res.error + "."); }
                else {
                    SoundManager.playOk();
                    const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(build.speciesId) : null;
                    arenaHelp(this, (sp ? sp.name : "Your partner") + " is yours for good now — find it with your own partners.");
                }
                this._buildWindow.refresh();
                this._buildWindow.activate();
            }
            onChoiceCancel() {
                this._choiceWindow.hide();
                this._choiceWindow.deactivate();
                this._buildWindow.activate();
            }
            update() {
                super.update();
                if (this._buildWindow && this._buildWindow.active) arenaHelp(this, this._buildWindow.currentDetail());
            }
        }

        // ---- Season & rewards (a shell until the online update) --------------
        class Scene_GanjukoArenaSeason extends Scene_MenuBase {
            create() {
                super.create();
                this.createHelpWindow();
                this._helpWindow.setText("Seasons begin when ranked play opens with the online update. Your rating shell is ready.");
                const w = new Window_Base(new Rectangle(24, this.mainAreaTop(), Graphics.boxWidth - 48, this.mainAreaHeight()));
                const a = ensureArena();
                if (a) {
                    const tier = tierForRating(a.rating);
                    const next = nextTierForRating(a.rating);
                    let y = 10;
                    const line = (t, c, s) => {
                        w.contents.fontSize = s || 20;
                        if (c) w.changeTextColor(c); else w.resetTextColor();
                        w.drawText(t, 12, y, w.contentsWidth() - 24, "left");
                        y += (s || 20) + 14;
                    };
                    line("SEASON & REWARDS", "#FACC15", 26);
                    line("Current tier: " + tier + " · Rating " + a.rating, "#7DD3FC", 21);
                    if (next) line("Next tier: " + next.name + " at " + next.min + " (" + (next.min - a.rating) + " points to go)", null, 19);
                    else line("You stand at the top tier. Hold it when the season opens.", null, 19);
                    line("Best rating so far: " + a.bestRating, null, 19);
                    line("Sparring record: " + a.record.wins + "W / " + a.record.losses + "L / " + a.record.draws + "D (practice — ranked seasons count separately)", "#94A3B8", 18);
                    y += 8;
                    line("When seasons begin (8-week seasons, with the online update):", "#FACC15", 19);
                    line("  · Season-end rewards: a per-tier AP bonus plus an item bundle —", null, 18);
                    line("    the top tier earns 2 Rare Candies, an evolution item of your", null, 18);
                    line("    choice, and gold; lower tiers scale down from there.", null, 18);
                    line("  · Rewards are claimed at the Arena Desk when the season closes,", null, 18);
                    line("    and they flow into your main adventure. Nothing is owed yet.", null, 18);
                }
                this.addWindow(w);
            }
            update() {
                super.update();
                if (Input.isTriggered("cancel") || Input.isTriggered("ok")) this.popScene();
            }
        }

        window.Scene_GanjukoArena = Scene_GanjukoArena;
        window.Scene_GanjukoArenaRegister = Scene_GanjukoArenaRegister;
        window.Scene_GanjukoArenaTrials = Scene_GanjukoArenaTrials;
        window.Scene_GanjukoArenaSeason = Scene_GanjukoArenaSeason;
      }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 19.9 Versus — pilot choice, team preview, ordered picks
    // ---------------------------------------------------------------------
    // Team preview is honest Champions courtesy: both sides show names
    // and levels, nothing more. The player's own side also shows trait
    // words and hearts (flavor); the pilot's side never shows genetics
    // at all — and HP is shown nowhere outside a battle, by the rule.
    try {
      if (typeof Scene_MenuBase !== "undefined" && typeof Window_Selectable !== "undefined" && typeof Window_Base !== "undefined") {
        class Window_GanjukoArenaPilots extends Window_Selectable {
            initialize(rect) { super.initialize(rect); this._data = []; this.refresh(); this.select(0); }
            maxItems() { return this._data ? this._data.length : 0; }
            item() { return this._data && this._data[this.index()] ? this._data[this.index()] : null; }
            refresh() {
                this._data = pilotsForBand(teamBandIndex());
                this.createContents();
                this.drawAllItems();
            }
            drawItem(index) {
                const p = this._data[index];
                if (!p) return;
                const rect = this.itemLineRect(index);
                this.resetTextColor();
                this.drawText(p.name, rect.x, rect.y, 200, "left");
                this.changeTextColor("#94A3B8");
                this.drawText(BANDS[p.band].name + " pilot · teams Lv " + p.lvMin + "–" + p.lvMax, rect.x + 204, rect.y, rect.width - 208, "left");
                this.resetTextColor();
            }
        }
        class Window_GanjukoArenaPreview extends Window_Base {
            setContent(format, foeName, foeTeam, ownTeam) {
                this._format = format; this._foeName = foeName; this._foeTeam = foeTeam || []; this._ownTeam = ownTeam || [];
                this.refresh();
            }
            refresh() {
                this.contents.clear();
                let y = 0;
                const line = (t, c, s) => {
                    this.contents.fontSize = s || 19;
                    if (c) this.changeTextColor(c); else this.resetTextColor();
                    this.drawText(t, 8, y, this.contentsWidth() - 16, "left");
                    y += (s || 19) + 9;
                };
                if (!this._foeTeam || !this._foeTeam.length) {
                    line("Choose a pilot — their team is revealed here.", "#94A3B8", 18);
                    line("Team preview: names and levels only, both sides.", "#94A3B8", 18);
                    return;
                }
                line((this._foeName || "Pilot") + "'s team:", "#F87171", 20);
                for (const f of this._foeTeam) {
                    const sp = typeof GE.getSpecies === "function" ? GE.getSpecies(f.speciesId) : null;
                    line("  " + (sp ? sp.name : "?") + "  Lv" + f.level, null, 18);
                }
                y += 4;
                line("Your registered team:", "#38BDF8", 20);
                for (const m of this._ownTeam) {
                    const g = geneticsOfActor(m);
                    line("  " + m.name() + "  Lv" + m.level + (g && g.trait ? "  · " + g.trait : "") + "  " + heartsOf(m), null, 18);
                }
            }
        }
        class Window_GanjukoArenaPicks extends Window_Selectable {
            initialize(rect) { super.initialize(rect); this._picks = []; this._need = 3; this._format = "singles"; this.refresh(); }
            setFormat(format, picks) { this._format = format; this._need = pickCountFor(format); this._picks = (picks || []).slice(); this.refresh(); this.select(0); }
            picks() { return this._picks.slice(); }
            toggle(id) {
                const i = this._picks.indexOf(Number(id));
                if (i >= 0) this._picks.splice(i, 1);
                else if (this._picks.length < this._need) this._picks.push(Number(id));
                else return false;
                this.refresh();
                return true;
            }
            maxItems() { return teamRowsText().length + 1; }
            isBeginRow() { return this.index() === teamRowsText().length; }
            isCurrentItemEnabled() {
                if (this.isBeginRow()) return this._picks.length === this._need;
                return true;
            }
            refresh() { this.createContents(); this.drawAllItems(); }
            drawItem(index) {
                const rows = teamRowsText();
                const rect = this.itemLineRect(index);
                if (index === rows.length) {
                    this.changePaintOpacity(this._picks.length === this._need);
                    this.changeTextColor("#FACC15");
                    this.drawText("► BEGIN BATTLE — pick " + this._picks.length + " of " + this._need, rect.x, rect.y, rect.width, "left");
                    this.resetTextColor();
                    this.changePaintOpacity(1);
                    return;
                }
                const m = rows[index];
                if (!m) return;
                const order = this._picks.indexOf(m.actorId());
                this.resetTextColor();
                this.drawText(m.name(), rect.x, rect.y, 190, "left");
                this.changeTextColor("#FACC15");
                this.drawText("Lv" + m.level, rect.x + 194, rect.y, 56, "left");
                this.resetTextColor();
                if (order >= 0) {
                    this.changeTextColor("#4ADE80");
                    this.drawText("PICK " + (order + 1) + (order < (this._format === "doubles" ? 2 : 1) ? " — leads" : ""), rect.x + 254, rect.y, rect.width - 258, "left");
                    this.resetTextColor();
                } else if (!m.isAlive()) {
                    this.changeTextColor("#F87171");
                    this.drawText("FAINTED — cannot fight", rect.x + 254, rect.y, rect.width - 258, "left");
                    this.resetTextColor();
                }
            }
        }
        class Scene_GanjukoArenaVersus extends Scene_MenuBase {
            create() {
                super.create();
                this._format = S19._pendingFormat === "doubles" ? "doubles" : "singles";
                this._foeTeam = [];
                this._pilot = null;
                this.createHelpWindow();
                this._helpWindow.setText(this._format === "doubles"
                    ? "DOUBLES sparring: bring 6, pick 4. Two fight at once; spread moves splash both foes."
                    : "SINGLES sparring: bring 6, pick 3. One at a time, first pick leads.");
                const top = this.mainAreaTop();
                this._pilotWindow = new Window_GanjukoArenaPilots(new Rectangle(24, top, 560, this.calcWindowHeight(4, true)));
                this._pilotWindow.setHandler("ok", this.onPilotOk.bind(this));
                this._pilotWindow.setHandler("cancel", this.popScene.bind(this));
                this.addWindow(this._pilotWindow);
                this._previewWindow = new Window_GanjukoArenaPreview(new Rectangle(600, top, Graphics.boxWidth - 624, this.mainAreaHeight()));
                this.addWindow(this._previewWindow);
                this._previewWindow.setContent(this._format, null, [], teamRowsText());
                const pickTop = top + this.calcWindowHeight(4, true) + 12;
                this._pickWindow = new Window_GanjukoArenaPicks(new Rectangle(24, pickTop, 560, this.mainAreaHeight() - (pickTop - top)));
                this._pickWindow.setFormat(this._format, defaultPicks(this._format));
                this._pickWindow.setHandler("ok", this.onPickOk.bind(this));
                this._pickWindow.setHandler("cancel", this.onPickCancel.bind(this));
                this._pickWindow.deactivate();
                this.addWindow(this._pickWindow);
                this._pilotWindow.activate();
            }
            onPilotOk() {
                const pilot = this._pilotWindow.item();
                if (!pilot) { this._pilotWindow.activate(); return; }
                this._pilot = pilot;
                this._foeTeam = generatePilotTeam(pilot, this._format);
                this._previewWindow.setContent(this._format, pilot.name, this._foeTeam, teamRowsText());
                SoundManager.playOk();
                this._pilotWindow.deactivate();
                this._pickWindow.activate();
            }
            onPickCancel() {
                this._pickWindow.deactivate();
                this._pilotWindow.activate();
            }
            onPickOk() {
                if (this._pickWindow.isBeginRow()) {
                    const a = ensureArena();
                    const picks = this._pickWindow.picks();
                    const aliveById = {};
                    for (const id of picks) { const m = actorById(id); aliveById[id] = !!(m && typeof m.isAlive === "function" && m.isAlive()); }
                    const v = validatePicks(a ? a.team : [], picks, this._format, aliveById);
                    if (!v.ok) {
                        SoundManager.playBuzzer();
                        arenaHelp(this, v.error);
                        this._pickWindow.activate();
                        return;
                    }
                    const pilot = this._pilot, foeTeam = this._foeTeam, format = this._format;
                    SoundManager.playOk();
                    SceneManager.goto(Scene_Map);
                    setTimeout(() => {
                        try {
                            const ok = startArenaBattle({
                                format: format, foeName: pilot.name, foeTeam: foeTeam,
                                difficulty: pilot.tier, picks: picks
                            });
                            if (!ok) {
                                if (typeof $gameMessage !== "undefined" && $gameMessage) $gameMessage.add("The Arena desk could not start that bout.");
                                SceneManager.push(Scene_GanjukoArena);
                            }
                        } catch (e) {}
                    }, 150);
                    return;
                }
                const rows = teamRowsText();
                const m = rows[this._pickWindow.index()];
                if (!m) { this._pickWindow.activate(); return; }
                if (!m.isAlive()) {
                    SoundManager.playBuzzer();
                    arenaHelp(this, m.name() + " has fainted — the Arena nurses restore partners after story battles, not before.");
                    this._pickWindow.activate();
                    return;
                }
                if (this._pickWindow.toggle(m.actorId())) SoundManager.playOk(); else SoundManager.playBuzzer();
                this._pickWindow.activate();
            }
        }
        function defaultPicks(format) {
            const a = ensureArena();
            if (!a) return [];
            const need = pickCountFor(format);
            const out = [];
            for (const id of a.team) {
                const m = actorById(id);
                if (m && typeof m.isAlive === "function" && m.isAlive()) out.push(Number(id));
                if (out.length >= need) break;
            }
            return out;
        }
        S19.defaultPicks = defaultPicks;
        window.Scene_GanjukoArenaVersus = Scene_GanjukoArenaVersus;
        _s19_status.scenes = true;
      }
    } catch (e) {}

    // ---------------------------------------------------------------------
    // 19.10 Entry points — menu command, plugin command, API
    // ---------------------------------------------------------------------
    S19.openArena = function() {
        try {
            if (typeof SceneManager !== "undefined" && SceneManager && typeof Scene_GanjukoArena !== "undefined") {
                SceneManager.push(Scene_GanjukoArena);
                return true;
            }
        } catch (e) {}
        return false;
    };
    try {
        if (typeof Window_MenuCommand !== "undefined" && Window_MenuCommand.prototype &&
            typeof Window_MenuCommand.prototype.addOriginalCommands === "function") {
            const _s19_WMC_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
            Window_MenuCommand.prototype.addOriginalCommands = function() {
                _s19_WMC_addOriginalCommands.call(this);
                try {
                    const hasParty = typeof $gameParty !== "undefined" && $gameParty && $gameParty.allMembers().length > 0;
                    this.addCommand("BATTLE ARENA", "ganjukoArena", hasParty);
                } catch (e) {}
            };
        }
        if (typeof Scene_Menu !== "undefined" && Scene_Menu.prototype && typeof Scene_Menu.prototype.createCommandWindow === "function") {
            const _s19_SM_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
            Scene_Menu.prototype.createCommandWindow = function() {
                _s19_SM_createCommandWindow.call(this);
                try {
                    if (this._commandWindow) {
                        this._commandWindow.setHandler("ganjukoArena", () => { S19.openArena(); });
                    }
                } catch (e) {}
            };
            _s19_status.menu = true;
        }
    } catch (e) {}
    try {
        if (typeof PluginManager !== "undefined" && PluginManager && typeof PluginManager.registerCommand === "function") {
            PluginManager.registerCommand("GanjukoEngine", "OpenArena", () => { S19.openArena(); });
        }
    } catch (e) {}
})();
// === END Section 19 — Arena (offline) ===

// ============================================================================
// SECTION 21 — CHAMPIONS BATTLE STANDARD (OTA v13, 2026-11-02)
// ============================================================================
// Implements work/CHAMPIONS-BATTLE-STANDARD.md (v1) as amended by
// work/CHAMPIONS-BATTLE-STANDARD-V2.md (v2 WINS on every conflict):
//   Part A (this block): stat stages ±6 (v1 §2), the SELF_STAGE / FOE_STAGE
//     tables, the complete status system (v2 §2: one-major rule, type +
//     ability immunity gate, ordered action gate with the Champions sleep /
//     freeze clocks and 12.5% full-paralysis, burn physical cut in the
//     damage chain, toxic escalation + trapping chips at turn end, recoil
//     table, Hydro Cannon recharge, Fire-thaw, crit rate 1/24 with stage
//     table + stage-ignore, drain fraction corrected to 50%).
//   Part B (next block): the 316-entry ability library framework
//     (work/abilities/) — entry / end-of-turn / damage / on-hit / pre-move /
//     field (Sky + auras) / copy-swap-suppression registry hooks.
//
// Hard rules honored throughout: abilities never read or write genetics
// (Section 18's store is never touched here); every random draw in this
// section flows through GanjukoEngine.battleRandom, the single seedable
// seam Section 20's relay will drive; HP is displayed as bars + percentage
// only — nothing in this section ever renders a raw HP number.
(() => {
    "use strict";
    const GE = window.GanjukoEngine;
    if (!GE) return;
    const S21 = {};
    GE.S21 = S21;
    S21._status = { loaded: true };

    // ------------------------------------------------------------------ RNG
    let _rngFn = null;
    S21.setBattleRandom = function (fn) { _rngFn = (typeof fn === "function") ? fn : null; };
    S21.battleRandom = function () { return _rngFn ? _rngFn() : Math.random(); };
    GE.battleRandom = S21.battleRandom;
    const br = () => S21.battleRandom();
    const brChance = (p) => br() < p;

    // -------------------------------------------------------------- helpers
    function isGanjukoBattler(b) {
        return !!b && typeof b.ganjukoSpecies === "function" && typeof b.ganjukoSpeciesId === "function";
    }
    S21.isGanjukoBattler = isGanjukoBattler;
    function inBattle() {
        try {
            return typeof $gameParty !== "undefined" && $gameParty &&
                typeof $gameParty.inBattle === "function" && $gameParty.inBattle();
        } catch (e) { return false; }
    }
    S21.inBattle = inBattle;
    function sideOf(b) {
        try { if (typeof b.isActor === "function" && b.isActor()) return "actor"; } catch (e) {}
        try { if (typeof b.isEnemy === "function" && b.isEnemy()) return "enemy"; } catch (e) {}
        try { if (typeof Game_Actor !== "undefined" && b instanceof Game_Actor) return "actor"; } catch (e) {}
        return "enemy";
    }
    S21.sideOf = sideOf;
    function isOpponent(a, b) { return !!a && !!b && sideOf(a) !== sideOf(b); }
    function standingActors() {
        try {
            if (typeof $gameParty === "undefined" || !$gameParty) return [];
            if (typeof $gameParty.battleMembers === "function") return $gameParty.battleMembers().slice();
            if (typeof $gameParty.allMembers === "function") return $gameParty.allMembers().slice();
        } catch (e) {}
        return [];
    }
    function standingEnemies() {
        try {
            if (typeof $gameTroop !== "undefined" && $gameTroop && typeof $gameTroop.members === "function") {
                return $gameTroop.members().slice();
            }
        } catch (e) {}
        return [];
    }
    S21.standingOf = function (b) {
        return sideOf(b) === "actor" ? standingActors() : standingEnemies();
    };
    S21.allStanding = function () { return standingActors().concat(standingEnemies()); };
    S21.foesOf = function (b) {
        return (sideOf(b) === "actor" ? standingEnemies() : standingActors())
            .filter(x => x && x !== b && (typeof x.isAlive !== "function" || x.isAlive()));
    };
    S21.alliesOf = function (b) {
        return S21.standingOf(b).filter(x => x && x !== b && (typeof x.isAlive !== "function" || x.isAlive()));
    };
    S21.logLines = [];
    S21.log = function (text) {
        S21.logLines.push(text);
        try {
            if (typeof BattleManager !== "undefined" && BattleManager && BattleManager._logWindow &&
                typeof BattleManager._logWindow.push === "function") {
                BattleManager._logWindow.push("addText", text);
            }
        } catch (e) {}
    };
    function battlerName(b) {
        try { return b.name(); } catch (e) { return "The battler"; }
    }
    S21.battlerName = battlerName;
    function typesOf(b) {
        try {
            const sp = b.ganjukoSpecies();
            if (sp) return [sp.type1 || sp.type || 0, sp.type2 || 0].filter(t => t > 0);
        } catch (e) {}
        return [];
    }
    S21.typesOf = typesOf;
    // Effective types: Part B may layer type-change effects (Prismflesh,
    // Skyward Guise, Fieldmirror, type-conversion touches read the MOVE's
    // type, not the battler's). Part A ships the species-truth version;
    // Part B wraps this.
    S21.effectiveTypes = function (b) { return typesOf(b); };

    // ------------------------------------------------------- stage system
    // v1 §2.1: battle-only store on battler._ganjukoStages. Volatile keys
    // (v2 §2.6 hook 1) live in the same object: statusClock (sleep/freeze
    // attempt counter — PERSISTS across switches), toxicCounter (resets on
    // switch-out), confusionCounter, flinch, trapTurns, recharge.
    function freshStore() {
        return {
            atk: 0, def: 0, mat: 0, mdf: 0, agi: 0, acc: 0, eva: 0,
            statusClock: 0, toxicCounter: 0, confusionCounter: 0,
            flinch: false, trapTurns: 0, trapSource: null, recharge: false,
            entered: false, out: true, lastAttacker: null, lastSkillId: 0,
            lastTarget: null, misc: {}
        };
    }
    S21.freshStore = freshStore;
    S21.store = function (b) {
        if (!b._ganjukoStages) b._ganjukoStages = freshStore();
        return b._ganjukoStages;
    };
    S21.STAGE_STATS = ["atk", "def", "mat", "mdf", "agi", "acc", "eva"];
    S21.PARAM_OF_STAGE = { atk: 2, def: 3, mat: 4, mdf: 5, agi: 6 };
    S21.STAGE_OF_PARAM = { 2: "atk", 3: "def", 4: "mat", 5: "mdf", 6: "agi" };
    S21.STAGE_LABEL = { atk: "ATK", def: "DEF", mat: "MAT", mdf: "MDF", agi: "AGI", acc: "ACC", eva: "EVA" };
    // v1 §2.1 multiplier tables: stat scale (2+s)/2, acc/eva scale (3+s)/3.
    S21.stageMult = function (statKey, s) {
        s = Math.max(-6, Math.min(6, s | 0));
        if (s === 0) return 1;
        if (statKey === "acc" || statKey === "eva") return s > 0 ? (3 + s) / 3 : 3 / (3 - s);
        return s > 0 ? (2 + s) / 2 : 2 / (2 - s);
    };
    function stageWording(delta) {
        if (delta >= 3) return " rose drastically!";
        if (delta === 2) return " rose sharply!";
        if (delta === 1) return " rose!";
        if (delta === -1) return " fell!";
        if (delta === -2) return " harshly fell!";
        return " severely fell!";
    }
    // The one stage-changing door. Handles clamping, Mirror Temper /
    // Open Book (Part B ability ids read here as data), the foe-lowering
    // protection family, Defiance / Proud Retort, Mirroring Ambition, and
    // the Pokémon log wording. Returns the delta actually applied.
    S21.applyStageChange = function (target, statKey, delta, source, opts) {
        opts = opts || {};
        if (!target || !delta || typeof target.isAlive === "function" && !target.isAlive()) return 0;
        const st = S21.store(target);
        const tgtAbility = S21.abilityActive ? S21.abilityActive(target) : null;
        // Foe-caused lowerings: protection family (v1 §4 status-hook rules).
        if (delta < 0 && source && isOpponent(source, target) && !opts.ignoreProtect) {
            const fullBlock = ["brightbody", "pale-shroud", "brightforge-body", "temporal-sovereignty"];
            const statBlock = (statKey === "atk" && tgtAbility === "shearbrand") ||
                (statKey === "def" && tgtAbility === "proudcrest");
            const entryAtkBlock = opts.entryEffect && statKey === "atk" &&
                ["blithe-mind", "own-cadence", "stillpoint", "bold-spirit"].includes(tgtAbility);
            const accBlock = statKey === "acc" &&
                ["lantern-gaze", "trueaim-regard", "inward-eye"].includes(tgtAbility);
            if (accBlock) {
                S21.log(battlerName(target) + "'s ACC was not lowered!");
                return 0;
            }
            if (tgtAbility === "watchdogs-pride" && opts.entryEffect && statKey === "atk") {
                S21.log(battlerName(target) + "'s Watchdog's Pride turned the intimidation back!");
                return S21.applyStageChange(target, statKey, 1, null, { ignoreProtect: true, depth: (opts.depth || 0) + 1 });
            }
            if (fullBlock.includes(tgtAbility) || statBlock || entryAtkBlock) {
                if (tgtAbility === "mirrorplate" && !opts.reflected) {
                    S21.log(battlerName(target) + "'s Mirrorplate reflected the drop!");
                    return S21.applyStageChange(source, statKey, delta, null, { ignoreProtect: true, reflected: true, depth: (opts.depth || 0) + 1 });
                }
                S21.log(battlerName(target) + "'s " + S21.STAGE_LABEL[statKey] + " was not lowered!");
                return 0;
            }
            if (tgtAbility === "mirrorplate" && !opts.reflected) {
                S21.log(battlerName(target) + "'s Mirrorplate reflected the drop!");
                return S21.applyStageChange(source, statKey, delta, null, { ignoreProtect: true, reflected: true, depth: (opts.depth || 0) + 1 });
            }
        }
        if (tgtAbility === "mirror-temper" && !opts.noReverse) delta = -delta;
        if (tgtAbility === "open-book" && !opts.noDouble) delta = delta * 2;
        const before = st[statKey] | 0;
        let after = Math.max(-6, Math.min(6, before + delta));
        // Raptor's Regard: its ACC stages never fall below 0.
        if (statKey === "acc" && tgtAbility === "raptors-regard" && after < 0) after = 0;
        const applied = after - before;
        if (applied === 0) {
            if (delta > 0) S21.log(battlerName(target) + "'s " + S21.STAGE_LABEL[statKey] + " won't go any higher!");
            else if (delta < 0) S21.log(battlerName(target) + "'s " + S21.STAGE_LABEL[statKey] + " won't go any lower!");
            return 0;
        }
        st[statKey] = after;
        S21.log(battlerName(target) + "'s " + S21.STAGE_LABEL[statKey] + stageWording(applied));
        // Defiance / Proud Retort: a foe's lowering raises ATK / MAT +2.
        if (applied < 0 && source && isOpponent(source, target) && !opts.noRetort) {
            if (tgtAbility === "defiance") S21.applyStageChange(target, "atk", 2, null, { ignoreProtect: true, noRetort: true, depth: (opts.depth || 0) + 1 });
            if (tgtAbility === "proud-retort") S21.applyStageChange(target, "mat", 2, null, { ignoreProtect: true, noRetort: true, depth: (opts.depth || 0) + 1 });
            // Startle Reflex also triggers when its ATK is lowered on entry.
            if (opts.entryEffect && tgtAbility === "startle-reflex") S21.applyStageChange(target, "agi", 1, null, { ignoreProtect: true, noRetort: true });
        }
        // Mirroring Ambition: foes of the raiser copy the raise.
        if (applied > 0 && !opts.noMirror && (opts.depth || 0) < 2) {
            for (const other of S21.foesOf(target)) {
                if (S21.abilityActive && S21.abilityActive(other) === "mirroring-ambition") {
                    S21.applyStageChange(other, statKey, applied, null, { ignoreProtect: true, noMirror: true, depth: (opts.depth || 0) + 1 });
                }
            }
        }
        return applied;
    };
    S21.resetStages = function (b, silent) {
        const st = S21.store(b);
        for (const k of S21.STAGE_STATS) st[k] = 0;
        if (!silent) { /* stage resets are silent in Pokémon */ }
    };
    // Switch-out processing (v1 §2.4 + v2 §2.6 hook 1): stages and volatiles
    // clear; the sleep/freeze statusClock PERSISTS; the toxic counter
    // restarts (next turn-end back in costs 1/16 again).
    S21.processSwitchOut = function (b) {
        const st = S21.store(b);
        S21.resetStages(b, true);
        st.confusionCounter = 0;
        st.flinch = false;
        st.trapTurns = 0;
        st.trapSource = null;
        st.recharge = false;
        st.toxicCounter = 1;
        try { if (typeof b.isStateAffected === "function" && b.isStateAffected(8)) b.removeState(8); } catch (e) {}
        st.out = true;
        st.entered = false;
        if (typeof S21.onSwitchOut === "function") { try { S21.onSwitchOut(b); } catch (e) {} }
    };
    S21.processEntry = function (b) {
        const st = S21.store(b);
        if (st.entered) return;
        st.entered = true;
        st.out = false;
        if (typeof S21.onEntry === "function") { try { S21.onEntry(b); } catch (e) {} }
    };
    // Diff the party's standing set and process transitions. Called at turn
    // boundaries and after every switch seam so faint-replacements (which
    // swap inside BattleManager.checkBattleEnd) are caught too.
    S21.processFieldTransitions = function () {
        if (!inBattle()) return;
        try {
            if (typeof $gameParty === "undefined" || !$gameParty || typeof $gameParty.allMembers !== "function") return;
            const standing = standingActors();
            for (const m of $gameParty.allMembers()) {
                if (!m || !m._ganjukoStages) continue;
                const isStanding = standing.includes(m);
                const st = m._ganjukoStages;
                if (isStanding && st.out) S21.processEntry(m);
                else if (!isStanding && !st.out && st.entered) S21.processSwitchOut(m);
            }
        } catch (e) {}
    };

    // ------------------------------------------------------- ability seam
    // Part A defines the resolver contract; Part B fills the registry.
    // abilityOf: the battler's own ability (rolled once per individual from
    // its species' slots, stored on the battler — never derived from
    // genetics). abilityActive: abilityOf minus suppression (Null Air) and
    // copy/swap overrides — every effect check reads abilityActive.
    S21.abilitySlotsFor = function (b) {
        try {
            const sp = b.ganjukoSpecies();
            if (sp && sp.abilities) {
                const out = [];
                for (const id of sp.abilities.regular || []) out.push(id);
                if (sp.abilities.special) out.push(sp.abilities.special);
                if (sp.abilities.signature) out.push(sp.abilities.signature);
                return out;
            }
        } catch (e) {}
        return [];
    };
    S21.abilityOf = function (b) {
        if (!b) return null;
        if (b._s21AbilityOverride) return b._s21AbilityOverride;
        if (b._s21AbilityId) {
            // A stored roll is only valid for the species it was rolled
            // on. Battler objects get re-specced (wild-actor reuse,
            // trainer-queue replacement, evolution): if the stored id
            // is not among the CURRENT species' slots it is a previous
            // species' roll leaking through — fall through and re-roll.
            // (Copy/swap never writes _s21AbilityId; it uses the
            // override, which is checked first and is unaffected.)
            const cur = S21.abilitySlotsFor(b);
            if (!cur.length || cur.indexOf(b._s21AbilityId) >= 0) return b._s21AbilityId;
        }
        const slots = S21.abilitySlotsFor(b);
        if (!slots.length) return null;
        const pick = slots[Math.min(slots.length - 1, Math.floor(br() * slots.length))];
        b._s21AbilityId = pick;
        return pick;
    };
    S21.setAbility = function (b, id) { if (b) b._s21AbilityId = id; };
    S21.abilityActive = function (b) {
        // Part B replaces this with the suppression-aware version.
        return S21.abilityOf(b);
    };
    // Extension points Part B implements (safe defaults here):
    S21.riderChanceMult = function (subject, item, stateId) { return 1; };
    S21.riderBlocked = function (subject, target, item) { return false; };
    S21.modifyDamageDealt = function (subject, target, item, value, critical) { return value; };
    S21.modifyDamageTaken = function (target, subject, item, value, critical) { return value; };
    S21.endOfTurnEffects = function (b) {};
    S21.tickMisc = function (b) {};
    S21.fieldTick = function () {};
    S21.extraActionGate = function (subject, action) { return false; };
    S21.trapBlockedByAbility = function (b) { return false; };

    // ------------------------------------------------------- status core
    S21.MAJOR_STATES = [4, 10, 11, 12, 14, 31];
    S21.STATE_NAMES = { 4: "poisoned", 8: "confused", 10: "asleep", 11: "burned", 12: "paralyzed", 14: "frozen solid", 31: "badly poisoned" };
    S21.POWDER_SKILLS = { 78: true, 84: true };
    S21.HIGH_CRIT = { 15: true, 37: true, 43: true };
    S21.RECOIL = { 17: 1 / 3, 20: 1 / 3, 50: 1 / 4 };
    S21.FLINCH_RIDERS = { 8: 0.10, 22: 0.30, 42: 0.20 };
    S21.RECHARGE_SKILLS = { 29: true };
    S21.TRAP_SKILL = 63;
    // v1 §2.4 SELF_STAGE: self stage changes on damaging moves, applied in
    // the applyItemUserEffect wrap only when the action connected.
    S21.SELF_STAGE = {
        7: [["agi", 1]],
        60: [["mat", -2]], 61: [["mat", -2]], 68: [["mat", -2]],
        70: [["mat", -2]], 71: [["atk", -1], ["def", -1]], 72: [["mat", -2]]
    };
    // Foe stage riders on damaging moves. MZ data cannot carry a debuff
    // chance (stock itemEffectAddDebuff has no chance roll), so these live
    // here next to SELF_STAGE; move-info and the AI scorer read both tables.
    // [statKey, delta, chance]
    S21.FOE_STAGE = {
        25: [["acc", -1, 0.30]],
        62: [["mdf", -1, 1.0]],
        75: [["atk", -1, 1.0]],
        76: [["mat", -1, 1.0]],
        77: [["def", -1, 0.50]],
        78: [["mdf", -1, 0.50]],
        79: [["acc", -1, 1.0]]
    };
    S21.majorStatusOf = function (b) {
        if (!b) return 0;
        if (S21.abilityActive && S21.abilityActive(b) === "eternal-slumber") return 10;
        if (typeof b.isStateAffected !== "function") return 0;
        for (const id of S21.MAJOR_STATES) if (b.isStateAffected(id)) return id;
        return 0;
    };
    // Type immunities (v2 §2.4) + the ability gate Part B extends.
    S21.typeImmuneTo = function (user, target, stateId, skill) {
        const types = S21.effectiveTypes(target);
        if (stateId === 11 && types.includes(2)) return true;                    // Fire <- burn
        if (stateId === 12) {
            if (types.includes(5)) return true;                                  // Volt <- paralysis
            if (types.includes(6) && skill && skill.damage && skill.damage.elementId === 5) return true; // Earth <- Volt-move paralysis
        }
        if ((stateId === 4 || stateId === 31) && types.includes(6)) {
            if (!(user && S21.abilityActive && S21.abilityActive(user) === "rustvenom")) return true; // Earth <- poison (Steel seat)
        }
        if (skill && S21.POWDER_SKILLS[skill.id] && types.includes(4)) return true; // Nature <- powder moves
        return false;
    };
    S21.abilityImmuneTo = function (target, stateId, skill, user) { return false; }; // Part B extends
    S21.fieldImmuneTo = function (target, stateId) { return false; };                 // Part B extends (auras / Sky)
    S21.canApplyStatus = function (user, target, stateId, skill) {
        if (!target || (typeof target.isAlive === "function" && !target.isAlive())) return { ok: false, reason: "dead" };
        if (S21.MAJOR_STATES.includes(stateId)) {
            const cur = S21.majorStatusOf(target);
            if (cur) return { ok: false, reason: cur === stateId ? "already" : "blocked" };
        }
        if (S21.typeImmuneTo(user, target, stateId, skill)) return { ok: false, reason: "immune" };
        if (S21.abilityImmuneTo(target, stateId, skill, user)) return { ok: false, reason: "immune" };
        if (S21.fieldImmuneTo(target, stateId)) return { ok: false, reason: "immune" };
        return { ok: true };
    };
    S21.onStatusApplied = []; // Part B subscribes (Shared Burden, Puppeteer's Venom)
    S21.applyStatus = function (user, target, stateId, skill) {
        const gate = S21.canApplyStatus(user, target, stateId, skill);
        if (!gate.ok) return gate;
        target.addState(stateId);
        if (typeof target.isStateAffected === "function" && !target.isStateAffected(stateId)) {
            return { ok: false, reason: "resisted" };
        }
        const st = S21.store(target);
        if (stateId === 10 || stateId === 14) st.statusClock = 0;
        if (stateId === 31) st.toxicCounter = 1;
        if (stateId === 8) st.confusionCounter = 2 + Math.floor(br() * 4); // 2-5, Gen IX
        for (const fn of S21.onStatusApplied) { try { fn(user, target, stateId, skill); } catch (e) {} }
        return { ok: true };
    };
    // Confusion self-hit (v2 §2.3, Gen IX): typeless POW-40 physical, own
    // stage-adjusted ATK vs own DEF in the engine's formula shape, no crit,
    // no STAB, no chart, cannot miss. The sim uses this exact formula.
    S21.confusionSelfHit = function (b) {
        const atk = (typeof b.atk === "number") ? b.atk : 100;
        const def = (typeof b.def === "number") ? b.def : 100;
        const roll = 0.85 + br() * 0.15;
        return Math.max(1, Math.floor((atk * 0.40 - def * 0.16) * roll));
    };

    // ------------------------------------------------------------- wraps
    function wrapProto(obj, name, fn) {
        if (obj && typeof obj[name] === "function") {
            const orig = obj[name];
            obj[name] = function () { return fn.call(this, orig, arguments); };
            return true;
        }
        return false;
    }

    // Stages compose inside param(): (unified + genetics) x traitRate x
    // stageMult — MZ's paramBuffRate IS the stage multiplier slot.
    if (typeof Game_BattlerBase !== "undefined" && Game_BattlerBase.prototype) {
        wrapProto(Game_BattlerBase.prototype, "paramBuffRate", function (orig, args) {
            const key = S21.STAGE_OF_PARAM[args[0]];
            if (key && isGanjukoBattler(this) && inBattle()) {
                return S21.stageMult(key, S21.store(this)[key]);
            }
            return orig.apply(this, args);
        });
        // Faint: stages reset with the battler (v1 §2.4); KO hooks (Part B
        // subscribes via S21.onFaint) fire with the recorded attacker.
        wrapProto(Game_BattlerBase.prototype, "die", function (orig, args) {
            if (isGanjukoBattler(this)) {
                const st = S21.store(this);
                if (typeof S21.onFaint === "function") { try { S21.onFaint(this, st.lastAttacker, st.lastSkillId); } catch (e) {} }
                S21.resetStages(this, true);
                st.flinch = false; st.trapTurns = 0; st.recharge = false; st.confusionCounter = 0;
            }
            return orig.apply(this, args);
        });
    }

    if (typeof Game_Battler !== "undefined" && Game_Battler.prototype) {
        // v1 §2.2: addBuff/addDebuff become stage changes (one call = one
        // stage; MZ's timed-buff turns are ignored entirely). Calls for
        // params 2-6 on Ganjuko battlers in battle are intercepted; a
        // debuff arriving here is hostile by construction (self-drops ride
        // SELF_STAGE, never data), a buff is friendly.
        wrapProto(Game_Battler.prototype, "addBuff", function (orig, args) {
            const key = S21.STAGE_OF_PARAM[args[0]];
            if (key && isGanjukoBattler(this) && inBattle()) {
                S21.applyStageChange(this, key, 1, null, { viaData: true });
                try { if (this._result && this._result.pushAddedBuff) this._result.pushAddedBuff(args[0]); } catch (e) {}
                try { this.refresh(); } catch (e) {}
                return;
            }
            return orig.apply(this, args);
        });
        wrapProto(Game_Battler.prototype, "addDebuff", function (orig, args) {
            const key = S21.STAGE_OF_PARAM[args[0]];
            if (key && isGanjukoBattler(this) && inBattle()) {
                // Source unknown at this seam; treat as foe-caused so the
                // protection family applies (documented in the report).
                const foe = S21.foesOf(this)[0] || null;
                S21.applyStageChange(this, key, -1, foe, { viaData: true });
                try { if (this._result && this._result.pushAddedDebuff) this._result.pushAddedDebuff(args[0]); } catch (e) {}
                try { this.refresh(); } catch (e) {}
                return;
            }
            return orig.apply(this, args);
        });
        // One-major-status backstop + clock bookkeeping for every route
        // that adds a state (skills, items, events, ability code).
        wrapProto(Game_Battler.prototype, "addState", function (orig, args) {
            const stateId = args[0];
            if (isGanjukoBattler(this) && inBattle() && S21.MAJOR_STATES.includes(stateId)) {
                const cur = S21.majorStatusOf(this);
                if (cur && cur !== stateId) return; // second major never lands
                if (S21.abilityImmuneTo(this, stateId, null, null)) return;
                if (S21.fieldImmuneTo(this, stateId)) return;
            }
            const had = (typeof this.isStateAffected === "function") ? this.isStateAffected(stateId) : false;
            const r = orig.apply(this, args);
            if (!had && typeof this.isStateAffected === "function" && this.isStateAffected(stateId)) {
                const st = S21.store(this);
                if (stateId === 10 || stateId === 14) st.statusClock = 0;
                if (stateId === 31 && !(st.toxicCounter > 0)) st.toxicCounter = 1;
                if (stateId === 8 && !(st.confusionCounter > 0)) st.confusionCounter = 2 + Math.floor(br() * 4);
            }
            return r;
        });
        wrapProto(Game_Battler.prototype, "removeState", function (orig, args) {
            const r = orig.apply(this, args);
            if (isGanjukoBattler(this)) {
                const st = S21.store(this);
                if (args[0] === 31) st.toxicCounter = 0; // cure zeroes the escalation (v2 §2.6 hook 6)
                if (args[0] === 8) st.confusionCounter = 0;
                if (args[0] === 10 || args[0] === 14) st.statusClock = 0;
            }
            return r;
        });
        // Battle start: fresh store, entry hooks.
        wrapProto(Game_Battler.prototype, "onBattleStart", function (orig, args) {
            const r = orig.apply(this, args);
            if (isGanjukoBattler(this)) {
                this._ganjukoStages = freshStore();
                S21.store(this).out = false;
                S21.processEntry(this);
            }
            return r;
        });
        // Battle end: stages/stores never persist past the battle (v1 §2.4).
        wrapProto(Game_Battler.prototype, "onBattleEnd", function (orig, args) {
            if (isGanjukoBattler(this)) {
                delete this._ganjukoStages;
                delete this._s21AbilityOverride;
                if (typeof S21.onBattleEnd === "function") { try { S21.onBattleEnd(this); } catch (e) {} }
            }
            return orig.apply(this, args);
        });
        // Turn end (v2 §2.6 hook 6): stock first (trait chips for poison /
        // burn land there per §2.5's design), then the engine-computed
        // pieces — toxic escalation, trapping chip — then Part B's
        // end-of-turn ability effects, then field ticks.
        wrapProto(Game_Battler.prototype, "onTurnEnd", function (orig, args) {
            const hpBefore = this.hp;
            const r = orig.apply(this, args);
            if (!isGanjukoBattler(this) || !inBattle()) return r;
            const st = S21.store(this);
            const myAbility = S21.abilityActive ? S21.abilityActive(this) : null;
            // Poison-chip shields: Hexward Body takes no indirect damage;
            // Toxinbloom converts poison-family chips into healing. The
            // trait chips already landed inside stock regenerateHp, so the
            // shield restores exactly that slip amount (computed from the
            // states present, MZ slip formula) before anything else runs.
            const hasPoisonChip = (typeof this.isStateAffected === "function") &&
                (this.isStateAffected(4) || this.isStateAffected(11));
            if (hasPoisonChip && (myAbility === "hexward-body" || myAbility === "toxinbloom") &&
                typeof this.isAlive === "function" && this.isAlive()) {
                let slip = 0;
                if (this.isStateAffected(4)) slip += Math.floor(this.mhp * 0.125);
                if (this.isStateAffected(11)) slip += Math.floor(this.mhp * 0.0625);
                slip = Math.min(slip, Math.max(hpBefore - 1, 0)); // MZ slip cap
                if (slip > 0 && this.hp < hpBefore) this._hp = Math.min(this.mhp, this.hp + slip);
                if (myAbility === "toxinbloom" && typeof this.isAlive === "function" && this.isAlive()) {
                    const heal = Math.max(1, Math.floor(this.mhp / 8));
                    try { this.gainHp(heal); } catch (e) {}
                    S21.log(battlerName(this) + "'s Toxinbloom turned poison into strength!");
                }
            }
            // Toxic escalation: floor(mhp x counter/16), min 1, then +1.
            if (typeof this.isStateAffected === "function" && this.isStateAffected(31) &&
                typeof this.isAlive === "function" && this.isAlive() &&
                myAbility !== "hexward-body" && myAbility !== "toxinbloom") {
                const chip = Math.max(1, Math.floor(this.mhp * Math.max(1, st.toxicCounter) / 16));
                S21.log(battlerName(this) + " is hurt by its poison!");
                try { this.gainHp(-chip); } catch (e) {}
                st.toxicCounter = Math.min(15, Math.max(1, st.toxicCounter) + 1);
            }
            // Trapping chip (Sand Tomb): 1/8 max HP while bound.
            if (st.trapTurns > 0 && typeof this.isAlive === "function" && this.isAlive()) {
                if (myAbility !== "hexward-body") {
                    const chip = Math.max(1, Math.floor(this.mhp / 8));
                    S21.log(battlerName(this) + " is hurt by the trap!");
                    try { this.gainHp(-chip); } catch (e) {}
                }
                st.trapTurns--;
            }
            st.flinch = false; // a flinch flag never survives the turn
            if (typeof this.isAlive === "function" && this.isAlive()) {
                try { S21.endOfTurnEffects(this); } catch (e) {}
                try { S21.tickMisc(this); } catch (e) {}
            }
            // Once-per-turn field tick (aura countdown), keyed on troop turn.
            try {
                const tc = (typeof $gameTroop !== "undefined" && $gameTroop && typeof $gameTroop.turnCount === "function")
                    ? $gameTroop.turnCount() : -1;
                if (tc !== S21._fieldTickStamp) { S21._fieldTickStamp = tc; S21.fieldTick(); }
            } catch (e) {}
            S21.processFieldTransitions();
            return r;
        });
    }

    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype &&
        typeof Game_Enemy.prototype.setupGanjukoEnemy === "function") {
        // Trainer-queue replacement: the same enemy object is re-specced —
        // that is a fresh entry (stages reset, entry hooks fire).
        wrapProto(Game_Enemy.prototype, "setupGanjukoEnemy", function (orig, args) {
            const r = orig.apply(this, args);
            if (inBattle()) {
                this._ganjukoStages = freshStore();
                S21.store(this).out = false;
                delete this._s21AbilityId;
                S21.processEntry(this);
            }
            return r;
        });
    }
    if (typeof Game_Party !== "undefined" && Game_Party.prototype &&
        typeof Game_Party.prototype.swapOrder === "function") {
        wrapProto(Game_Party.prototype, "swapOrder", function (orig, args) {
            const r = orig.apply(this, args);
            S21.processFieldTransitions();
            return r;
        });
    }

    if (typeof Game_Action !== "undefined" && Game_Action.prototype) {
        // Accuracy stages (v1 §2.2): hitType-0 certain hits bypass. Both
        // stage scales fold into itemHit (MZ's itemEva is ~0 for Ganjuko
        // battlers; Pokémon's acc/eva stage ratio is one number).
        wrapProto(Game_Action.prototype, "itemHit", function (orig, args) {
            const rate = orig.apply(this, args);
            const target = args[0];
            const item = (typeof this.item === "function") ? this.item() : null;
            const subj = (typeof this.subject === "function") ? this.subject() : null;
            if (!item || !subj || !isGanjukoBattler(subj) || !inBattle()) return rate;
            if (item.hitType === 0 || rate >= 1) return rate;
            // No Guard class: either side's Openfield Stance forces a hit.
            if (S21.abilityActive(subj) === "openfield-stance") return 1;
            if (target && isGanjukoBattler(target) && S21.abilityActive(target) === "openfield-stance") return 1;
            let out = rate;
            out *= S21.stageMult("acc", S21.store(subj).acc);
            if (target && isGanjukoBattler(target)) {
                const tAb = S21.abilityActive(target);
                const ignoreEva = ["lantern-gaze", "trueaim-regard", "inward-eye", "raptors-regard"].includes(S21.abilityActive(subj));
                if (!ignoreEva) {
                    let evaStage = S21.store(target).eva;
                    // Passive EVA bonuses read as stages (Part B conditions).
                    if (tAb === "dustveil" && S21.skyNow && S21.skyNow() === "Tempest") evaStage += 1;
                    if (tAb === "stormshroud" && S21.skyNow && S21.skyNow() === "Tempest") evaStage += 1;
                    if (tAb === "reeling-steps" && typeof target.isStateAffected === "function" && target.isStateAffected(8)) evaStage += 1;
                    out /= S21.stageMult("eva", Math.max(-6, Math.min(6, evaStage)));
                }
                if (tAb === "slipskin" && item.damage && item.damage.type === 0) out *= 0.5;
            }
            const sAb = S21.abilityActive(subj);
            if (sAb === "manifold-eyes") out *= 1.3;
            if (sAb === "reckless-brawn" && item.hitType === 1) out *= 0.8;
            if (sAb === "guiding-star" || S21.alliesOf(subj).some(a => S21.abilityActive(a) === "guiding-star")) out *= 1.1;
            return out;
        });
        // Crit rate (v2 §2.10): 1/24 base, stage table [1/24, 1/8, 1/2, 1];
        // high-crit skills {15, 37, 43}; crit-nullifying abilities on the
        // target side zero it. (Stage-ignore lives in makeDamageValue.)
        wrapProto(Game_Action.prototype, "itemCri", function (orig, args) {
            const target = args[0];
            const item = (typeof this.item === "function") ? this.item() : null;
            const subj = (typeof this.subject === "function") ? this.subject() : null;
            if (!item || !subj || !isGanjukoBattler(subj) || !item.damage || !item.damage.critical) {
                return orig.apply(this, args);
            }
            if (target && isGanjukoBattler(target)) {
                const tAb = S21.abilityActive(target);
                if (tAb === "bastion-hide" || tAb === "carapace-guard") return 0;
                if (subj && S21.abilityActive(subj) === "no-mercy-for-the-sick") {
                    const ms = S21.majorStatusOf(target);
                    if (ms === 4 || ms === 31) return 1;
                }
            }
            let stage = 0;
            if (S21.HIGH_CRIT[item.id]) stage += 1;
            if (S21.abilityActive(subj) === "loaded-stars") stage += 1;
            stage = Math.max(0, Math.min(3, stage));
            return [1 / 24, 1 / 8, 1 / 2, 1][stage];
        });
        // Damage chain — this wrap is installed last, so it sees the final
        // composed value (chart x STAB x roll) and applies, in order: crit
        // stage-ignore (by store surgery around the inner call), the burn
        // physical cut (v2 §2.6 hook 4), then Part B's dealt/taken ability
        // modifiers. Floor >= 1 on any positive result, per v1 §4.2(iii).
        wrapProto(Game_Action.prototype, "makeDamageValue", function (orig, args) {
            const target = args[0];
            const critical = !!args[1];
            const item = (typeof this.item === "function") ? this.item() : null;
            const subj = (typeof this.subject === "function") ? this.subject() : null;
            let saved = null;
            const unawares = subj && target && isGanjukoBattler(subj) && isGanjukoBattler(target) &&
                (S21.abilityActive(subj) === "unheeding" || S21.abilityActive(target) === "unheeding");
            if (subj && target && isGanjukoBattler(subj) && isGanjukoBattler(target) && (critical || unawares)) {
                const ss = S21.store(subj), ts = S21.store(target);
                saved = { sa: ss.atk, sm: ss.mat, td: ts.def, tm: ts.mdf };
                if (critical || S21.abilityActive(subj) === "unheeding") {
                    if (ss.atk < 0) ss.atk = 0;
                    if (ss.mat < 0) ss.mat = 0;
                }
                if (critical || S21.abilityActive(target) === "unheeding") {
                    if (ts.def > 0) ts.def = 0;
                    if (ts.mdf > 0) ts.mdf = 0;
                }
                // Unheeding on the ATTACKER also ignores the target's stages
                // entirely in Pokémon; on the DEFENDER it ignores the
                // attacker's. The two branches above cover the crit-overlap;
                // full Unaware semantics: attacker-side ignores ALL target
                // stages, defender-side ignores ALL attacker stages.
                if (S21.abilityActive(subj) === "unheeding") { ts.def = 0; ts.mdf = 0; }
                if (S21.abilityActive(target) === "unheeding") { ss.atk = 0; ss.mat = 0; }
            }
            // Recover-type skills (damage.type 3/4): the Section 5 wrap
            // floors EVERY makeDamageValue result at Math.max(1, value),
            // which collapses MZ's signed heal values (negative) to 1 —
            // in-battle healing skills would deal 1 damage instead of
            // healing (items heal through effects, so drives never caught
            // it). Recompute the signed value from the stock formula seam
            // for Ganjuko subjects so heals heal; Bloom Renewal then
            // scales the result below. (v13 drive-by fix; see report.)
            let precomputed = null;
            if (subj && target && item && item.damage && (item.damage.type === 3 || item.damage.type === 4) &&
                isGanjukoBattler(subj) && typeof this.evalDamageFormula === "function") {
                try {
                    let v = this.evalDamageFormula(target);
                    if (typeof v === "number" && isFinite(v)) {
                        if (typeof this.applyVariance === "function") v = this.applyVariance(v, item.damage.variance || 0);
                        precomputed = Math.round(v);
                    }
                } catch (e) { precomputed = null; }
            }
            let value;
            try { value = precomputed !== null ? precomputed : orig.apply(this, args); }
            finally {
                if (saved) {
                    const ss = S21.store(subj), ts = S21.store(target);
                    ss.atk = saved.sa; ss.mat = saved.sm; ts.def = saved.td; ts.mdf = saved.tm;
                }
            }
            if (subj && isGanjukoBattler(subj)) {
                if (target && isGanjukoBattler(target)) {
                    const ts = S21.store(target);
                    ts.lastAttacker = subj;
                    ts.lastSkillId = item ? item.id : 0;
                    ts.lastHitContact = (typeof S21.isContact === "function" && item) ? S21.isContact(item, subj) : false;
                    S21.store(subj).lastTarget = target;
                }
                if (typeof value === "number" && value > 0 && item) {
                    // Burn cut: attacker burned + physical category = x0.5.
                    if (typeof subj.isStateAffected === "function" && subj.isStateAffected(11) &&
                        item.hitType === 1 && S21.abilityActive(subj) !== "painfeast") {
                        value = Math.floor(value * 0.5);
                    }
                    try { value = S21.modifyDamageDealt(subj, target, item, value, critical); } catch (e) {}
                    if (target && isGanjukoBattler(target)) {
                        try { value = S21.modifyDamageTaken(target, subj, item, value, critical); } catch (e) {}
                    }
                    if (value > 0) value = Math.max(1, Math.floor(value));
                }
                // Bloom Renewal: healing the bearer performs restores x1.5.
                if (typeof value === "number" && value < 0 && item && S21.abilityActive(subj) === "bloom-renewal") {
                    value = Math.floor(value * 1.5);
                }
            }
            return value;
        });
        // Post-hit rider seam (v1 §2.4 + v2 hooks 7/8): SELF_STAGE, foe
        // stage riders, flinch riders, recharge, recoil, trapping. Stock
        // apply() only calls this when the action connected (result.isHit).
        wrapProto(Game_Action.prototype, "applyItemUserEffect", function (orig, args) {
            const r = orig.apply(this, args);
            try {
                const target = args[0];
                const item = (typeof this.item === "function") ? this.item() : null;
                const subj = (typeof this.subject === "function") ? this.subject() : null;
                if (!item || !subj || !isGanjukoBattler(subj) || !inBattle()) return r;
                const result = (target && typeof target.result === "function") ? target.result() : null;
                const hit = result && typeof result.isHit === "function" ? result.isHit() : true;
                if (!hit) return r;
                const chanceMult = (stateId) => S21.riderChanceMult(subj, item, stateId);
                const selfStages = S21.SELF_STAGE[item.id];
                if (selfStages && subj._s21SelfStageFor !== this) {
                    // Once per action (all SELF_STAGE skills are single-hit;
                    // the stamp keeps repeats from double-dropping).
                    subj._s21SelfStageFor = this;
                    for (const [k, d] of selfStages) S21.applyStageChange(subj, k, d, null, { selfInflicted: true });
                }
                if (target && target !== subj && isGanjukoBattler(target)) {
                    const foeStages = S21.FOE_STAGE[item.id];
                    if (foeStages && !S21.riderBlocked(subj, target, item)) {
                        for (const [k, d, ch] of foeStages) {
                            if (brChance(ch * chanceMult(0))) S21.applyStageChange(target, k, d, subj, {});
                        }
                    }
                    const fl = S21.FLINCH_RIDERS[item.id];
                    if (fl && typeof target.isAlive === "function" && target.isAlive() &&
                        !S21.riderBlocked(subj, target, item) &&
                        S21.abilityActive(target) !== "stillpoint" &&
                        brChance(fl * chanceMult(0))) {
                        S21.store(target).flinch = true;
                        if (S21.abilityActive(target) === "unbowed") {
                            S21.applyStageChange(target, "agi", 1, null, { ignoreProtect: true });
                        }
                    }
                    if (item.id === S21.TRAP_SKILL && typeof target.isAlive === "function" && target.isAlive()) {
                        const tTypes = S21.effectiveTypes(target);
                        if (!tTypes.includes(8)) { // Umbra <- trapping immunity (v2 §2.4)
                            const ts = S21.store(target);
                            ts.trapTurns = 4 + Math.floor(br() * 2); // 4-5 turns
                            ts.trapSource = subj;
                            S21.log(battlerName(target) + " was trapped by Sand Tomb!");
                        }
                    }
                    // Fire-thaw (defender side, v2 §2.6 hook 9): a frozen
                    // target hit by a Fire damaging move thaws after damage.
                    if (item.damage && item.damage.elementId === 2 && item.damage.type > 0 &&
                        typeof target.isStateAffected === "function" && target.isStateAffected(14)) {
                        target.removeState(14);
                        S21.log(battlerName(target) + " was thawed by the heat!");
                    }
                }
                if (S21.RECHARGE_SKILLS[item.id]) S21.store(subj).recharge = true;
                const rec = S21.RECOIL[item.id];
                if (rec && result && result.hpDamage > 0 && typeof subj.isAlive === "function" && subj.isAlive()) {
                    const sAb = S21.abilityActive(subj);
                    if (sAb !== "skullbastion" && sAb !== "hexward-body") {
                        const dmg = Math.max(1, Math.floor(result.hpDamage * rec));
                        S21.log(battlerName(subj) + " was hurt by recoil!");
                        try { subj.gainHp(-dmg); } catch (e) {}
                    }
                }
            } catch (e) {}
            return r;
        });
        // Status application gate (v2 §2.6 hook 2): every skill state rider
        // flows through here. Immunity / one-major refusals log the
        // Pokémon lines; the chance roll uses the seeded battle RNG.
        wrapProto(Game_Action.prototype, "itemEffectAddNormalState", function (orig, args) {
            const target = args[0], effect = args[1];
            const item = (typeof this.item === "function") ? this.item() : null;
            const subj = (typeof this.subject === "function") ? this.subject() : null;
            const stateId = effect ? effect.dataId : 0;
            const gated = isGanjukoBattler(target) && inBattle() && item && subj &&
                (S21.MAJOR_STATES.includes(stateId) || stateId === 8);
            if (!gated) return orig.apply(this, args);
            if (S21.riderBlocked(subj, target, item)) return; // Warding Dust / Brute Clarity
            // Mirrorward: status-class moves bounce back at their user.
            if (item.damage && item.damage.type === 0 && S21.abilityActive(target) === "mirrorward" &&
                isOpponent(subj, target)) {
                S21.log(battlerName(target) + "'s Mirrorward bounced it back!");
                const back = S21.applyStatus(subj, subj, stateId, item);
                if (back.ok) { try { this.makeSuccess(subj); } catch (e) {} }
                return;
            }
            if (item.damage && item.damage.type === 0 && S21.abilityActive(target) === "gilded-immunity" &&
                isOpponent(subj, target)) {
                S21.log("It doesn't affect " + battlerName(target) + "!");
                return;
            }
            const gate = S21.canApplyStatus(subj, target, stateId, item);
            if (!gate.ok) {
                if (gate.reason === "immune") S21.log("It doesn't affect " + battlerName(target) + "!");
                else if (item.damage && item.damage.type === 0) S21.log("But it failed!");
                return;
            }
            let chance = effect.value1 || 0;
            if (typeof this.isCertainHit === "function" && !this.isCertainHit()) {
                if (typeof target.stateRate === "function") chance *= target.stateRate(stateId);
                if (typeof this.lukEffectRate === "function") chance *= this.lukEffectRate(target);
            }
            chance *= S21.riderChanceMult(subj, item, stateId);
            if (brChance(chance)) {
                const applied = S21.applyStatus(subj, target, stateId, item);
                if (applied.ok) { try { this.makeSuccess(target); } catch (e) {} }
            }
            return;
        });
        // Drain correction (v2 Step 3 verification): stock MZ returns 100%
        // of damage as healing; the Champions standard is 50%.
        wrapProto(Game_Action.prototype, "gainDrainedHp", function (orig, args) {
            const value = args[0];
            const subj = (typeof this.subject === "function") ? this.subject() : null;
            const isDrain = (typeof this.isDrain === "function") ? this.isDrain() : false;
            if (!isDrain || !subj || !isGanjukoBattler(subj) || !(value > 0)) return orig.apply(this, args);
            const gain = Math.max(1, Math.floor(value * 0.5));
            let gainTarget = subj;
            try { if (this._reflectionTarget) gainTarget = this._reflectionTarget; } catch (e) {}
            // Gravewater: a drainer of a Gravewater bearer takes the drain
            // as damage instead of healing.
            const lastTarget = S21.store(subj).lastTarget;
            if (lastTarget && isGanjukoBattler(lastTarget) && lastTarget !== gainTarget &&
                S21.abilityActive(lastTarget) === "gravewater") {
                S21.log(battlerName(gainTarget) + " was hurt by the foul ooze!");
                try { gainTarget.gainHp(-gain); } catch (e) {}
                return;
            }
            try { gainTarget.gainHp(gain); } catch (e) {}
        });
    }

    // ------------------------------------------------------- action gate
    // v2 §2.6 hook 3, exact order: recharge -> freeze -> sleep -> paralysis
    // -> flinch -> confusion. A cancelled action consumes the turn (it is
    // NOT an Arena timeout strike — the action was submitted and played).
    S21.actionGate = function (subject) {
        if (!subject || !isGanjukoBattler(subject)) return false;
        if (typeof subject.isAlive === "function" && !subject.isAlive()) return false;
        const action = (typeof subject.currentAction === "function") ? subject.currentAction() : null;
        try { if (S21.extraActionGate(subject, action)) return true; } catch (e) {}
        const st = S21.store(subject);
        const myAbility = S21.abilityActive(subject);
        if (st.recharge) {
            st.recharge = false;
            S21.log(battlerName(subject) + " must recharge!");
            return true;
        }
        const has = (id) => (typeof subject.isStateAffected === "function") && subject.isStateAffected(id);
        if (has(14)) {
            st.statusClock++;
            if (st.statusClock >= 3 || brChance(0.25)) {
                subject.removeState(14);
                S21.log(battlerName(subject) + " thawed out!");
            } else {
                S21.log(battlerName(subject) + " is frozen solid!");
                return true;
            }
        }
        if (has(10) && myAbility !== "eternal-slumber") {
            st.statusClock++;
            let wake;
            if (myAbility === "dawnriser") wake = st.statusClock >= 2 || (st.statusClock === 1 && brChance(1 / 3));
            else wake = st.statusClock >= 3 || (st.statusClock === 2 && brChance(1 / 3));
            if (wake) {
                subject.removeState(10);
                S21.log(battlerName(subject) + " woke up!");
            } else {
                S21.log(battlerName(subject) + " is fast asleep!");
                return true;
            }
        }
        if (has(12) && brChance(0.125)) {
            S21.log(battlerName(subject) + " is paralyzed! It can't move!");
            return true;
        }
        if (st.flinch) {
            st.flinch = false;
            S21.log(battlerName(subject) + " flinched and couldn't move!");
            if (myAbility === "unbowed") S21.applyStageChange(subject, "agi", 1, null, { ignoreProtect: true });
            return true;
        }
        if (has(8)) {
            if (st.confusionCounter > 0) st.confusionCounter--;
            if (st.confusionCounter <= 0) {
                subject.removeState(8);
                S21.log(battlerName(subject) + " snapped out of its confusion!");
            } else if (brChance(1 / 3)) {
                const dmg = S21.confusionSelfHit(subject);
                S21.log(battlerName(subject) + " is confused! It hurt itself in its confusion!");
                try { subject.gainHp(-dmg); } catch (e) {}
                return true;
            }
        }
        return false;
    };
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.startAction === "function") {
        const _s21_BM_startAction = BattleManager.startAction;
        BattleManager.startAction = function () {
            const subject = this._subject;
            let mpBefore = null;
            try { if (subject && typeof subject.mp === "number") mpBefore = subject.mp; } catch (e) {}
            let cancelled = false;
            try { cancelled = !!S21.actionGate(subject); } catch (e) { cancelled = false; }
            _s21_BM_startAction.call(this);
            if (cancelled) {
                this._targets = [];
                // A gate-cancelled action was submitted, not used: refund
                // the MP stock useItem just charged.
                try {
                    if (subject && mpBefore !== null && typeof subject.setMp === "function") subject.setMp(mpBefore);
                } catch (e) {}
            }
        };
    }
    // Trapping blocks the switch command: Sand Tomb's bind plus the
    // trapping abilities (Part B consults trapBlockedByAbility).
    if (typeof Scene_Battle !== "undefined" && Scene_Battle.prototype &&
        typeof Scene_Battle.prototype.onSwitchGanjukoOk === "function") {
        const _s21_SB_onSwitchOk = Scene_Battle.prototype.onSwitchGanjukoOk;
        Scene_Battle.prototype.onSwitchGanjukoOk = function () {
            try {
                const members = (typeof $gameParty !== "undefined" && $gameParty && typeof $gameParty.battleMembers === "function")
                    ? $gameParty.battleMembers() : [];
                const outgoing = members[0];
                if (outgoing && isGanjukoBattler(outgoing)) {
                    const st = S21.store(outgoing);
                    const trapped = st.trapTurns > 0 || S21.trapBlockedByAbility(outgoing);
                    if (trapped && typeof outgoing.isAlive === "function" && outgoing.isAlive()) {
                        S21.log(battlerName(outgoing) + " can't be switched out!");
                        try { if (typeof SoundManager !== "undefined") SoundManager.playBuzzer(); } catch (e) {}
                        return;
                    }
                }
            } catch (e) {}
            const r = _s21_SB_onSwitchOk.call(this);
            S21.processFieldTransitions();
            return r;
        };
    }

    S21._status.core = true;
})();
// === END Section 21 Part A — stages + status core ===


// ============================================================================
// SECTION 21 Part B — ABILITY FRAMEWORK (OTA v13)
// ============================================================================
// The 316-entry Champions ability library (work/abilities/library.json +
// assignments.json) implemented against Part A's seams. Descriptors live in
// S21.ABILITY_IMPL (Part B3, next block); this block is the machinery:
// suppression/copy/swap registry, the Sky + Aura field object, damage
// modifiers, the on-hit reaction queue, entry / end-of-turn / KO hooks,
// pre-move effects, passive param rates, and the public UI lines.
//
// Hard rules (test-enforced in champions-abilities): no code here reads or
// writes Section 18 genetics; every random draw flows through
// S21.battleRandom; nothing renders a raw HP number.
(() => {
    "use strict";
    const GE = window.GanjukoEngine;
    if (!GE || !GE.S21) return;
    const S21 = GE.S21;
    const br = () => S21.battleRandom();
    const brChance = (p) => br() < p;
    const name = (b) => S21.battlerName(b);
    const inBattle = () => S21.inBattle();
    const IMPL = () => S21.ABILITY_IMPL || {};
    const implOf = (b) => { const id = S21.abilityActive(b); return id ? (IMPL()[id] || null) : null; };
    const rawImplOf = (b) => { const id = S21.abilityOf(b); return id ? (IMPL()[id] || null) : null; };

        // Generated from work/abilities/library.json (name / one-liner / hook / tier).
    S21.ABILITY_LIB = {
        "musk-haze": { name: "Musk Haze", desc: "Its attacks carry a rank musk that can make the target flinch.", hook: "dmg-dealt", tier: "standard" },
        "nightrain": { name: "Nightrain", desc: "It brings the night rain with it; the sky turns to Night when it enters.", hook: "field", tier: "standard" },
        "quickening": { name: "Quickening", desc: "It gathers momentum without pause; its Speed climbs every turn.", hook: "end-of-turn", tier: "strong" },
        "bastion-hide": { name: "Bastion Hide", desc: "A fortress hide that turns aside every telling blow.", hook: "dmg-taken", tier: "standard" },
        "last-rampart": { name: "Last Rampart", desc: "It will not fall to one blow while its strength is whole.", hook: "dmg-taken", tier: "strong" },
        "stillwater-aura": { name: "Stillwater Aura", desc: "A hush of damp air settles; nothing here can burst.", hook: "system", tier: "utility" },
        "suppleframe": { name: "Suppleframe", desc: "A loose, limber frame that shock cannot lock up.", hook: "status", tier: "standard" },
        "dustveil": { name: "Dustveil", desc: "It slips through the tempest haze, half-seen and hard to strike.", hook: "passive", tier: "standard" },
        "sparksnare": { name: "Sparksnare", desc: "Snapping sparks crawl over its skin and bite whatever touches it.", hook: "on-hit", tier: "standard" },
        "stormcell": { name: "Stormcell", desc: "It drinks the lightning and grows stronger on it.", hook: "dmg-taken", tier: "strong" },
        "deepwell": { name: "Deepwell", desc: "Its body is a well; struck by water, it only fills.", hook: "dmg-taken", tier: "strong" },
        "blithe-mind": { name: "Blithe Mind", desc: "Too cheerfully unaware to be charmed, goaded, or cowed.", hook: "status", tier: "standard" },
        "clearsky-mind": { name: "Clearsky Mind", desc: "Its calm unravels the mood of the sky itself.", hook: "field", tier: "standard" },
        "manifold-eyes": { name: "Manifold Eyes", desc: "A hundred lenses miss nothing.", hook: "pre-move", tier: "standard" },
        "sleepless-vigil": { name: "Sleepless Vigil", desc: "It has never once closed its eyes.", hook: "status", tier: "standard" },
        "prismflesh": { name: "Prismflesh", desc: "Its flesh takes the hue \u2014 and the kind \u2014 of whatever strikes it.", hook: "on-hit", tier: "standard" },
        "antivenin": { name: "Antivenin", desc: "Its blood unmakes venom on contact.", hook: "status", tier: "standard" },
        "kindled-core": { name: "Kindled Core", desc: "Struck by flame, it banks the fire and burns the brighter.", hook: "dmg-taken", tier: "strong" },
        "warding-dust": { name: "Warding Dust", desc: "A fine dust settles over it and smothers every side effect.", hook: "dmg-taken", tier: "standard" },
        "own-cadence": { name: "Own Cadence", desc: "It keeps its own rhythm, deaf to confusion and bluster.", hook: "status", tier: "standard" },
        "anchorhold": { name: "Anchorhold", desc: "Rooted fast; no force on the field can drag it out.", hook: "system", tier: "utility" },
        "dread-presence": { name: "Dread Presence", desc: "Its arrival alone is enough to make strong foes hesitate.", hook: "entry", tier: "strong" },
        "umbral-tether": { name: "Umbral Tether", desc: "It stands on your shadow, and your shadow cannot leave.", hook: "system", tier: "strong" },
        "shardhide": { name: "Shardhide", desc: "A hide of broken edges that pays every touch in blood.", hook: "on-hit", tier: "standard" },
        "ninefold-ward": { name: "Ninefold Ward", desc: "A ninefold ward turns aside all but the blows that find its true weakness.", hook: "dmg-taken", tier: "apex" },
        "skyborne": { name: "Skyborne", desc: "It never touches the ground, and the ground cannot touch it.", hook: "dmg-taken", tier: "strong" },
        "dreamspore": { name: "Dreamspore", desc: "Its spores drift onto anything that touches it \u2014 poison, palsy, or sleep.", hook: "on-hit", tier: "standard" },
        "shared-burden": { name: "Shared Burden", desc: "What sickness it is given, it gives back in kind.", hook: "status", tier: "standard" },
        "brightbody": { name: "Brightbody", desc: "A body of clear light that no foe can dim or drag down.", hook: "status", tier: "strong" },
        "wild-renewal": { name: "Wild Renewal", desc: "The wild itself mends it whenever it withdraws.", hook: "switch", tier: "standard" },
        "galvanic-spire": { name: "Galvanic Spire", desc: "Every spark on the field bends toward it \u2014 and feeds it.", hook: "dmg-taken", tier: "strong" },
        "fortunes-smile": { name: "Fortune's Smile", desc: "Fortune leans close and whispers twice as often.", hook: "dmg-dealt", tier: "strong" },
        "nightcurrent": { name: "Nightcurrent", desc: "In the night rain it moves like the current itself.", hook: "passive", tier: "standard" },
        "sunreacher": { name: "Sunreacher", desc: "It drinks the daylight and outruns the morning.", hook: "passive", tier: "standard" },
        "lantern-gaze": { name: "Lantern Gaze", desc: "Its gaze is a lantern: steady, and never dimmed.", hook: "pre-move", tier: "standard" },
        "echo-talent": { name: "Echo Talent", desc: "It enters wearing a borrowed gift, copied from the foe before it.", hook: "entry", tier: "strong" },
        "titans-gift": { name: "Titan's Gift", desc: "Strength out of all proportion lives in this small frame.", hook: "passive", tier: "apex" },
        "venomspine": { name: "Venomspine", desc: "Barbs along its body weep a patient venom.", hook: "on-hit", tier: "standard" },
        "stillpoint": { name: "Stillpoint", desc: "A mind like still water; nothing startles it.", hook: "status", tier: "standard" },
        "magmashell": { name: "Magmashell", desc: "A shell of living magma that no frost can set upon.", hook: "status", tier: "standard" },
        "tideveil": { name: "Tideveil", desc: "A veil of living water that fire cannot cling to.", hook: "status", tier: "standard" },
        "lodestone-grasp": { name: "Lodestone Grasp", desc: "Its magnetic grasp holds fast to anything that carries a charge.", hook: "system", tier: "utility" },
        "hushfield": { name: "Hushfield", desc: "A field of hush swallows every sound before it lands.", hook: "dmg-taken", tier: "standard" },
        "nightwell": { name: "Nightwell", desc: "It gathers the night rain and drinks deep between turns.", hook: "end-of-turn", tier: "standard" },
        "tempestcaller": { name: "Tempestcaller", desc: "Where it walks, the dust rises into a howling tempest.", hook: "field", tier: "standard" },
        "dread-tax": { name: "Dread Tax", desc: "Its presence is a weight; every foe move costs dearly.", hook: "system", tier: "standard" },
        "winterfat": { name: "Winterfat", desc: "Layers of winter fat shrug off flame and killing cold alike.", hook: "dmg-taken", tier: "standard" },
        "dawnriser": { name: "Dawnriser", desc: "It wakes with the first light, long before it should.", hook: "status", tier: "utility" },
        "cinderhide": { name: "Cinderhide", desc: "Its body is banked coals; touch it and be burned.", hook: "on-hit", tier: "standard" },
        "slipaway": { name: "Slipaway", desc: "There is no snare, trap, or stare that can hold it in a wild fight.", hook: "system", tier: "utility" },
        "trueaim-regard": { name: "Trueaim Regard", desc: "A gaze that measures distance the way scales measure weight.", hook: "pre-move", tier: "standard" },
        "shearbrand": { name: "Shearbrand", desc: "Blades it carries in body and will; no foe can blunt them.", hook: "status", tier: "standard" },
        "slacker-heart": { name: "Slacker Heart", desc: "For every moment of effort, it demands a moment of rest.", hook: "pre-move", tier: "detrimental" },
        "reckless-brawn": { name: "Reckless Brawn", desc: "All force, no finesse \u2014 it hits harder and aims worse.", hook: "passive", tier: "strong" },
        "dazing-charm": { name: "Dazing Charm", desc: "Something about it makes attackers hesitate, heartsick.", hook: "on-hit", tier: "standard" },
        "anode-soul": { name: "Anode Soul", desc: "It hums brighter beside a kindred charge.", hook: "passive", tier: "standard" },
        "cathode-soul": { name: "Cathode Soul", desc: "It drinks the field's charge and answers in kind.", hook: "passive", tier: "standard" },
        "skyward-guise": { name: "Skyward Guise", desc: "Its body reads the sky and becomes what the sky demands.", hook: "field", tier: "standard" },
        "sloughskin": { name: "Sloughskin", desc: "It leaves its troubles behind in a cast-off skin.", hook: "end-of-turn", tier: "standard" },
        "painfeast": { name: "Painfeast", desc: "Pain is a meal to it; sickness only makes it savage.", hook: "passive", tier: "strong" },
        "lustrous-scales": { name: "Lustrous Scales", desc: "Beneath affliction its scales harden to a mirror shine.", hook: "passive", tier: "standard" },
        "gravewater": { name: "Gravewater", desc: "What it leaks is poison to anything that would drink from it.", hook: "dmg-taken", tier: "standard" },
        "thornsurge": { name: "Thornsurge", desc: "Wounded, the wild in it surges past all restraint.", hook: "dmg-dealt", tier: "standard" },
        "cindersurge": { name: "Cindersurge", desc: "Wounded, its inner fire stops asking permission.", hook: "dmg-dealt", tier: "standard" },
        "riptide-surge": { name: "Riptide Surge", desc: "Wounded, the tide in it turns and comes back harder.", hook: "dmg-dealt", tier: "standard" },
        "hiveheart": { name: "Hiveheart", desc: "Wounded, the whole swarm answers through one body.", hook: "dmg-dealt", tier: "standard" },
        "skullbastion": { name: "Skullbastion", desc: "A skull like a fortress gate; its own violence cannot shake it.", hook: "dmg-dealt", tier: "standard" },
        "dawncaller": { name: "Dawncaller", desc: "It carries the sunrise in its throat and calls it down.", hook: "field", tier: "standard" },
        "snareground": { name: "Snareground", desc: "The ground itself is its accomplice; nothing rooted leaves.", hook: "system", tier: "strong" },
        "undying-spark": { name: "Undying Spark", desc: "A spark that refuses, on principle, to go out.", hook: "status", tier: "standard" },
        "pale-shroud": { name: "Pale Shroud", desc: "A pale shroud hangs over it; hostile hands slide off.", hook: "status", tier: "strong" },
        "innocent-might": { name: "Innocent Might", desc: "Power without malice, and without limit it can find.", hook: "passive", tier: "apex" },
        "carapace-guard": { name: "Carapace Guard", desc: "A shell grown over a lifetime, proof against the telling blow.", hook: "dmg-taken", tier: "standard" },
        "stilled-heavens": { name: "Stilled Heavens", desc: "Around it, the heavens themselves hold their breath.", hook: "field", tier: "standard" },
        "reeling-steps": { name: "Reeling Steps", desc: "It staggers \u2014 and a staggering target is a hard one to hit.", hook: "passive", tier: "utility" },
        "galvengine": { name: "Galvengine", desc: "Lightning is not a threat to it; lightning is fuel.", hook: "dmg-taken", tier: "strong" },
        "unbowed": { name: "Unbowed", desc: "Every startle only teaches it to move sooner next time.", hook: "on-hit", tier: "standard" },
        "stormshroud": { name: "Stormshroud", desc: "It wears the tempest like a cloak and cannot be found inside it.", hook: "passive", tier: "standard" },
        "wrathpoint": { name: "Wrathpoint", desc: "One cruel blow and its temper goes to the very top.", hook: "on-hit", tier: "standard" },
        "kilnbody": { name: "Kilnbody", desc: "Built like a kiln; fire is its working weather.", hook: "dmg-taken", tier: "standard" },
        "open-book": { name: "Open Book", desc: "Everything that happens to it, happens twice as much.", hook: "status", tier: "strong" },
        "parchhide": { name: "Parchhide", desc: "Skin that drinks the night rain and cracks under the day.", hook: "end-of-turn", tier: "standard" },
        "cold-reading": { name: "Cold Reading", desc: "It reads a foe the way the Listener reads a room \u2014 once, completely.", hook: "entry", tier: "standard" },
        "pugilists-oath": { name: "Pugilist's Oath", desc: "Every strike it throws is thrown the way it was taught: all in.", hook: "dmg-dealt", tier: "standard" },
        "toxinbloom": { name: "Toxinbloom", desc: "Poison does not sicken it; poison feeds it.", hook: "end-of-turn", tier: "strong" },
        "true-affinity": { name: "True Affinity", desc: "It does not borrow its element; it is its element.", hook: "dmg-dealt", tier: "strong" },
        "chainmaster": { name: "Chainmaster", desc: "One motion, perfectly repeated, never cut short.", hook: "dmg-dealt", tier: "standard" },
        "rainwash": { name: "Rainwash", desc: "The night rain washes every affliction off it.", hook: "end-of-turn", tier: "standard" },
        "sunfeast": { name: "Sunfeast", desc: "It feasts on daylight, and the feast consumes it.", hook: "passive", tier: "standard" },
        "feversteps": { name: "Feversteps", desc: "Affliction cannot slow a body that runs hotter than its sickness.", hook: "passive", tier: "standard" },
        "plainchant": { name: "Plainchant", desc: "It sings one plain note, and every song it knows becomes that note.", hook: "dmg-dealt", tier: "standard" },
        "deadeye-creed": { name: "Deadeye Creed", desc: "It does not strike often at the weak point \u2014 but when it does, it is ruinous.", hook: "dmg-dealt", tier: "standard" },
        "hexward-body": { name: "Hexward Body", desc: "No slow harm can touch it; only honest blows land.", hook: "dmg-taken", tier: "strong" },
        "openfield-stance": { name: "Openfield Stance", desc: "It fights in the open, and drags every foe into the open with it.", hook: "pre-move", tier: "standard" },
        "lastlight": { name: "Lastlight", desc: "It is in no hurry whatsoever, and the battle waits for it.", hook: "pre-move", tier: "detrimental" },
        "smallcraft": { name: "Smallcraft", desc: "It loves small tools and uses them better than great ones.", hook: "dmg-dealt", tier: "strong" },
        "canopy-ward": { name: "Canopy Ward", desc: "Under the day canopy, no sickness can settle on it.", hook: "status", tier: "standard" },
        "wardbreaker": { name: "Wardbreaker", desc: "Its blows do not ask what guards you; they arrive anyway.", hook: "system", tier: "strong" },
        "loaded-stars": { name: "Loaded Stars", desc: "The stars are loaded dice, and they are loaded for it.", hook: "dmg-dealt", tier: "standard" },
        "ashes-toll": { name: "Ashes' Toll", desc: "Bring it down by hand, and its ashes will bill you for it.", hook: "ko-fainted", tier: "standard" },
        "threatsense": { name: "Threatsense", desc: "It shivers on entry, reading the danger in the room.", hook: "entry", tier: "utility" },
        "dreamreading": { name: "Dreamreading", desc: "It dreams one true thing about the foe before the fighting starts.", hook: "entry", tier: "utility" },
        "unheeding": { name: "Unheeding", desc: "It simply does not care how much you have grown or shrunk.", hook: "dmg-dealt", tier: "strong" },
        "prism-lens": { name: "Prism Lens", desc: "Through its lens, even a blunted blow finds the seam.", hook: "dmg-dealt", tier: "standard" },
        "aegis-weave": { name: "Aegis Weave", desc: "A woven aegis that takes the edge off the worst-matched blows.", hook: "dmg-taken", tier: "strong" },
        "slow-kindling": { name: "Slow Kindling", desc: "A great fire, but it takes five turns to catch.", hook: "passive", tier: "detrimental" },
        "bold-spirit": { name: "Bold Spirit", desc: "It refuses to believe in untouchable things.", hook: "dmg-dealt", tier: "standard" },
        "maelstrom-call": { name: "Maelstrom Call", desc: "Every tide on the field runs, sooner or later, into its whirlpool.", hook: "dmg-taken", tier: "strong" },
        "stormmend": { name: "Stormmend", desc: "The tempest knits it back together, flake by flake.", hook: "end-of-turn", tier: "standard" },
        "bedrock-soul": { name: "Bedrock Soul", desc: "Bedrock does not care that you found the fault line.", hook: "dmg-taken", tier: "strong" },
        "tempest-herald": { name: "Tempest Herald", desc: "It arrives ahead of the storm, announcing it.", hook: "field", tier: "standard" },
        "all-in-heart": { name: "All-In Heart", desc: "It throws its whole body into every blow and calls the cost fair.", hook: "dmg-dealt", tier: "standard" },
        "bloomtide-gift": { name: "Bloomtide Gift", desc: "In daylight it blooms, and the whole field blooms with it.", hook: "passive", tier: "standard" },
        "nightmare-tithe": { name: "Nightmare Tithe", desc: "Sleeping near it is a debt collected in flesh.", hook: "end-of-turn", tier: "standard" },
        "brute-clarity": { name: "Brute Clarity", desc: "It trades every trick for one clean, honest enormity of force.", hook: "dmg-dealt", tier: "strong" },
        "mirror-temper": { name: "Mirror Temper", desc: "Praise it and it weakens; wound its pride and it grows.", hook: "status", tier: "strong" },
        "rattlebones": { name: "Rattlebones", desc: "Something in its stare spoils every appetite on the other side.", hook: "system", tier: "utility" },
        "defiance": { name: "Defiance", desc: "Every insult to its strength is answered with more of it.", hook: "status", tier: "strong" },
        "faltering-crown": { name: "Faltering Crown", desc: "Its crown is heavy, and once it starts to slip, it falls.", hook: "passive", tier: "detrimental" },
        "hexed-husk": { name: "Hexed Husk", desc: "Strike it, and the curse may reach back and seal your striking hand.", hook: "on-hit", tier: "standard" },
        "field-medic": { name: "Field Medic", desc: "Between blows, it tends the ones beside it.", hook: "end-of-turn", tier: "utility" },
        "guardian-stance": { name: "Guardian Stance", desc: "It stands in the way, on purpose, every single time.", hook: "dmg-taken", tier: "standard" },
        "fracture-plate": { name: "Fracture Plate", desc: "Its armor cracks \u2014 and every crack makes it faster.", hook: "on-hit", tier: "standard" },
        "prism-scales": { name: "Prism Scales", desc: "Unhurt, its scales are a prism that breaks the force of any blow.", hook: "dmg-taken", tier: "strong" },
        "venom-vigor": { name: "Venom Vigor", desc: "Poison in its veins is just more fuel for its fists.", hook: "dmg-dealt", tier: "standard" },
        "pyre-vigor": { name: "Pyre Vigor", desc: "Burning only concentrates its fire into finer flame.", hook: "dmg-dealt", tier: "standard" },
        "kindred-sense": { name: "Kindred Sense", desc: "It hears its allies' intent and is never where their blows land.", hook: "dmg-taken", tier: "utility" },
        "weatherheart": { name: "Weatherheart", desc: "Its heart is weather: something always rising, something always falling.", hook: "end-of-turn", tier: "strong" },
        "stormproof-coat": { name: "Stormproof Coat", desc: "A coat grown for bad weather and worse company.", hook: "status", tier: "standard" },
        "venomtouch": { name: "Venomtouch", desc: "Its touch alone is a dose.", hook: "dmg-dealt", tier: "standard" },
        "returnbloom": { name: "Returnbloom", desc: "Withdrawn, it blooms back toward whole.", hook: "switch", tier: "strong" },
        "proudcrest": { name: "Proudcrest", desc: "It carries its crest too proudly to ever let it droop.", hook: "status", tier: "standard" },
        "tempest-rush": { name: "Tempest Rush", desc: "The tempest is not its enemy; the tempest is its road.", hook: "passive", tier: "standard" },
        "slipskin": { name: "Slipskin", desc: "Status tricks slide off its skin like rain off oil.", hook: "dmg-taken", tier: "standard" },
        "lastword-mind": { name: "Lastword Mind", desc: "It lets everyone else speak first \u2014 then answers perfectly.", hook: "dmg-dealt", tier: "standard" },
        "borrowed-face": { name: "Borrowed Face", desc: "It walks in wearing the face of the friend behind it.", hook: "entry", tier: "strong" },
        "perfect-mimic": { name: "Perfect Mimic", desc: "One look, and it is you \u2014 everything but your wounds.", hook: "entry", tier: "strong" },
        "ghoststep": { name: "Ghoststep", desc: "Walls, veils, and stand-ins mean nothing to it.", hook: "dmg-dealt", tier: "standard" },
        "plague-touch": { name: "Plague Touch", desc: "What touches it, carries it away with them.", hook: "on-hit", tier: "standard" },
        "bloodsurge": { name: "Bloodsurge", desc: "Every fall it causes makes it hungrier.", hook: "ko-dealt", tier: "strong" },
        "retribution": { name: "Retribution", desc: "Struck from the dark, it answers with righteous force.", hook: "on-hit", tier: "standard" },
        "startle-reflex": { name: "Startle Reflex", desc: "Fear makes it faster, not slower.", hook: "on-hit", tier: "standard" },
        "mirrorward": { name: "Mirrorward", desc: "A polished ward that hands every hex back to its sender.", hook: "dmg-taken", tier: "strong" },
        "thornfeast": { name: "Thornfeast", desc: "It eats the forest's weapons and grows on them.", hook: "dmg-taken", tier: "strong" },
        "tricksters-bow": { name: "Trickster's Bow", desc: "It bows, it grins, and its trick is already done.", hook: "pre-move", tier: "strong" },
        "tempest-force": { name: "Tempest Force", desc: "In the tempest, the earth itself hits harder through it.", hook: "dmg-dealt", tier: "standard" },
        "barbhide": { name: "Barbhide", desc: "A hide of forged barbs that punishes every touch.", hook: "on-hit", tier: "standard" },
        "twofold-soul": { name: "Twofold Soul", desc: "Two souls share this body, and pain decides which one drives.", hook: "passive", tier: "strong" },
        "guiding-star": { name: "Guiding Star", desc: "A small star of luck that shines on the whole field side.", hook: "pre-move", tier: "standard" },
        "heavenbrand": { name: "Heavenbrand", desc: "Its brand burns through every ward a foe can raise.", hook: "system", tier: "strong" },
        "stormbrand": { name: "Stormbrand", desc: "Its brand is the storm's own signature, and wards do not stop weather.", hook: "system", tier: "strong" },
        "calm-incense": { name: "Calm Incense", desc: "A calm scent that keeps every nearby mind its own.", hook: "status", tier: "standard" },
        "petalward": { name: "Petalward", desc: "A drifting veil of petals guards its green kindred.", hook: "status", tier: "standard" },
        "shifting-palette": { name: "Shifting Palette", desc: "It paints itself the color of the blow it is about to strike.", hook: "pre-move", tier: "strong" },
        "luxuriant-pelt": { name: "Luxuriant Pelt", desc: "A pelt so thick that fists arrive as compliments.", hook: "dmg-taken", tier: "strong" },
        "shellward": { name: "Shellward", desc: "A shell proof against anything lobbed, launched, or spat at it.", hook: "dmg-taken", tier: "standard" },
        "proud-retort": { name: "Proud Retort", desc: "Insult its strength, and its sorcery answers twice as loud.", hook: "status", tier: "strong" },
        "crushing-jaws": { name: "Crushing Jaws", desc: "Jaws that treat bone as a suggestion.", hook: "dmg-dealt", tier: "standard" },
        "frostmantle-touch": { name: "Frostmantle Touch", desc: "Its plainest blows carry the killing frost of high places.", hook: "dmg-dealt", tier: "standard" },
        "honeyveil": { name: "Honeyveil", desc: "A honeyed air in which no one beside it can be made to sleep.", hook: "status", tier: "standard" },
        "blade-and-aegis-stance": { name: "Blade-and-Aegis Stance", desc: "It is the sword when it strikes and the shield when it schemes.", hook: "pre-move", tier: "strong" },
        "firstwind": { name: "Firstwind", desc: "Whole and unhurt, it rides the first wind of the battle.", hook: "pre-move", tier: "strong" },
        "siege-heart": { name: "Siege Heart", desc: "A heart built like a siege engine, tuned for the long shot.", hook: "dmg-dealt", tier: "standard" },
        "bloomplate": { name: "Bloomplate", desc: "Where the field blooms, its hide turns to armor.", hook: "passive", tier: "standard" },
        "rending-claws": { name: "Rending Claws", desc: "Every touch it makes is made with intent to tear.", hook: "dmg-dealt", tier: "standard" },
        "stardust-touch": { name: "Stardust Touch", desc: "Its plainest blows scatter stardust as they land.", hook: "dmg-dealt", tier: "standard" },
        "tarskin": { name: "Tarskin", desc: "Touch it, and you will not move quickly again soon.", hook: "on-hit", tier: "standard" },
        "zephyr-touch": { name: "Zephyr Touch", desc: "Its plainest blows ride the high wind down.", hook: "dmg-dealt", tier: "standard" },
        "twofold-bond": { name: "Twofold Bond", desc: "It fights as two: the blow, and the blow that follows it home.", hook: "dmg-dealt", tier: "apex" },
        "umbral-aura": { name: "Umbral Aura", desc: "Its presence deepens every shadow on the field.", hook: "field", tier: "strong" },
        "astral-aura": { name: "Astral Aura", desc: "Its presence brightens every star on the field.", hook: "field", tier: "strong" },
        "stillpoint-aura": { name: "Stillpoint Aura", desc: "Where it stands, every aura on the field runs backwards.", hook: "field", tier: "standard" },
        "first-oceans-reign": { name: "First Ocean's Reign", desc: "The first ocean rises with it, and fire itself drowns.", hook: "field", tier: "apex" },
        "first-suns-reign": { name: "First Sun's Reign", desc: "The first sun rises with it, and water itself boils away.", hook: "field", tier: "apex" },
        "first-storms-reign": { name: "First Storm's Reign", desc: "The first storm levels every advantage the sky ever gave.", hook: "field", tier: "apex" },
        "bulwark-growth": { name: "Bulwark Growth", desc: "Every blow it takes is answered with more wall.", hook: "on-hit", tier: "strong" },
        "cowards-exit": { name: "Coward's Exit", desc: "Hurt past bearing, it is simply \u2014 gone.", hook: "on-hit", tier: "utility" },
        "sovereigns-exit": { name: "Sovereign's Exit", desc: "It withdraws at the moment of true danger, by ancient right.", hook: "on-hit", tier: "utility" },
        "tidepack": { name: "Tidepack", desc: "Struck by water, it packs itself denser and harder.", hook: "on-hit", tier: "standard" },
        "no-mercy-for-the-sick": { name: "No Mercy for the Sick", desc: "It has never once struck a healthy target gently \u2014 or a sick one at all gently.", hook: "dmg-dealt", tier: "standard" },
        "shellfall-stance": { name: "Shellfall Stance", desc: "Armored while whole; the moment the shell falls, the hunger wakes.", hook: "passive", tier: "strong" },
        "ambush-creed": { name: "Ambush Creed", desc: "It has been watching the door the whole time you were gone.", hook: "dmg-dealt", tier: "strong" },
        "bubbleward": { name: "Bubbleward", desc: "A living bubble of water: cool to friends, death to fire.", hook: "dmg-taken", tier: "strong" },
        "forgeheart": { name: "Forgeheart", desc: "The forge is in its chest, and everything it makes is steel-true.", hook: "dmg-dealt", tier: "standard" },
        "painflare": { name: "Painflare", desc: "The blow that halves it is the blow that wakes it.", hook: "on-hit", tier: "standard" },
        "stormglide": { name: "Stormglide", desc: "It does not fight the storm; it rides the storm's own back.", hook: "passive", tier: "standard" },
        "farhand": { name: "Farhand", desc: "Its reach is longer than its arms, and it never has to touch you.", hook: "dmg-dealt", tier: "utility" },
        "tidevoice": { name: "Tidevoice", desc: "Its voice comes back as water, always.", hook: "dmg-dealt", tier: "standard" },
        "mercys-haste": { name: "Mercy's Haste", desc: "Mercy, from it, never arrives late.", hook: "pre-move", tier: "standard" },
        "galvanic-touch": { name: "Galvanic Touch", desc: "Its plainest blows arrive charged.", hook: "dmg-dealt", tier: "standard" },
        "voltrider": { name: "Voltrider", desc: "It surfed the first voltfield and never came down.", hook: "passive", tier: "standard" },
        "one-as-many": { name: "One-as-Many", desc: "Alone it is many; hurt, it is only itself.", hook: "passive", tier: "strong" },
        "sacrificial-veil": { name: "Sacrificial Veil", desc: "The veil takes the first blow meant for it \u2014 once \u2014 and bills it for the privilege.", hook: "dmg-taken", tier: "strong" },
        "bond-ascendant": { name: "Bond Ascendant", desc: "A foe falls, and the bond answers with fire in three veins at once.", hook: "ko-dealt", tier: "strong" },
        "cellswarm-ascendant": { name: "Cellswarm Ascendant", desc: "Hurt past bearing, its scattered cells gather and make it greater.", hook: "on-hit", tier: "apex" },
        "rustvenom": { name: "Rustvenom", desc: "Its venom rusts through every immunity nature ever issued.", hook: "status", tier: "standard" },
        "eternal-slumber": { name: "Eternal Slumber", desc: "It dreams, and the dream is load-bearing: it fights from inside it.", hook: "status", tier: "strong" },
        "regal-decree": { name: "Regal Decree", desc: "No one rushes a queen. No one.", hook: "pre-move", tier: "strong" },
        "last-tithe": { name: "Last Tithe", desc: "Its final act is arithmetic, and the sum is you.", hook: "ko-fainted", tier: "standard" },
        "echo-dancer": { name: "Echo Dancer", desc: "It cannot hear a dance and leave it unanswered.", hook: "system", tier: "standard" },
        "living-battery": { name: "Living Battery", desc: "It is the second heart in every ally's sorcery.", hook: "passive", tier: "standard" },
        "cloudpelt": { name: "Cloudpelt", desc: "Soft as a cloud to the touch, and just as flammable.", hook: "dmg-taken", tier: "standard" },
        "blinding-mien": { name: "Blinding Mien", desc: "Look at it and the moment is gone; it has already moved.", hook: "pre-move", tier: "strong" },
        "soulforge-heart": { name: "Soulforge Heart", desc: "Every fall on the field feeds the forge in its chest.", hook: "ko-fainted", tier: "strong" },
        "snarlmane": { name: "Snarlmane", desc: "Touch its mane and you will be a while untangling yourself.", hook: "on-hit", tier: "standard" },
        "inheritor": { name: "Inheritor", desc: "It stands where the fallen stood and takes up what they carried.", hook: "ko-fainted", tier: "standard" },
        "alchemists-inheritance": { name: "Alchemist's Inheritance", desc: "Nothing the fallen knew is wasted; it transmutes their gift into its own.", hook: "ko-fainted", tier: "standard" },
        "triumphant-zenith": { name: "Triumphant Zenith", desc: "Every victory raises whichever of its gifts already stands highest.", hook: "ko-dealt", tier: "strong" },
        "voltfield-herald": { name: "Voltfield Herald", desc: "It arrives, and the ground itself begins to hum.", hook: "field", tier: "strong" },
        "mindfield-herald": { name: "Mindfield Herald", desc: "It arrives, and the air thickens with thought.", hook: "field", tier: "strong" },
        "mistfield-herald": { name: "Mistfield Herald", desc: "It arrives walking out of a mist that was not there before.", hook: "field", tier: "strong" },
        "bloomfield-herald": { name: "Bloomfield Herald", desc: "It arrives, and the field remembers it is alive.", hook: "field", tier: "strong" },
        "brightforge-body": { name: "Brightforge Body", desc: "Forged in one piece; there is nowhere for a weakness to be inserted.", hook: "status", tier: "strong" },
        "eclipseshield": { name: "Eclipseshield", desc: "Unhurt, it stands in its own eclipse, and blows arrive diminished.", hook: "dmg-taken", tier: "strong" },
        "prismforge-armor": { name: "Prismforge Armor", desc: "Armor that splits the worst light into harmless colors.", hook: "dmg-taken", tier: "strong" },
        "overmind-edge": { name: "Overmind Edge", desc: "It thinks in weaknesses; every true strike lands truer.", hook: "dmg-dealt", tier: "standard" },
        "firstblade-oath": { name: "Firstblade Oath", desc: "It enters with its blade already sworn and already rising.", hook: "entry", tier: "strong" },
        "firstwall-oath": { name: "Firstwall Oath", desc: "It enters with its wall already raised.", hook: "entry", tier: "strong" },
        "shifting-colors": { name: "Shifting Colors", desc: "It becomes the color of its own next blow, every time anew.", hook: "pre-move", tier: "strong" },
        "cottonfall": { name: "Cottonfall", desc: "Struck, it bursts into drifting fluff that tangles every other limb on the field.", hook: "on-hit", tier: "standard" },
        "slipstream-wake": { name: "Slipstream Wake", desc: "It cuts its own wake and cannot be drawn off it.", hook: "system", tier: "standard" },
        "mirrorplate": { name: "Mirrorplate", desc: "What you lower in it, you lower in yourself.", hook: "status", tier: "strong" },
        "fishers-dividend": { name: "Fisher's Dividend", desc: "It fishes while it fights, and it throws what it catches.", hook: "on-hit", tier: "standard" },
        "unswerving-wake": { name: "Unswerving Wake", desc: "Its course was set before the battle began and does not bend.", hook: "system", tier: "standard" },
        "boilerheart": { name: "Boilerheart", desc: "Hit it with fire or water and all you have done is stoke the boiler.", hook: "on-hit", tier: "strong" },
        "thunderous-verse": { name: "Thunderous Verse", desc: "Its verses hit harder, and everyone else's verses arrive muffled.", hook: "dmg-dealt", tier: "standard" },
        "tempest-answer": { name: "Tempest Answer", desc: "Every blow against it is answered by the sky itself.", hook: "on-hit", tier: "standard" },
        "frostscale-veil": { name: "Frostscale Veil", desc: "Scales of rime that halve the force of every sorcery.", hook: "dmg-taken", tier: "strong" },
        "frostmask": { name: "Frostmask", desc: "A mask of ice takes the first blow for it \u2014 and shatters doing it.", hook: "dmg-taken", tier: "strong" },
        "empowering-ground": { name: "Empowering Ground", desc: "The ground beside it is simply a better place to fight from.", hook: "passive", tier: "standard" },
        "fieldmirror": { name: "Fieldmirror", desc: "It takes the color of whatever ground the battle stands on.", hook: "field", tier: "standard" },
        "veilsweeper": { name: "Veilsweeper", desc: "It enters sweeping, and every veil on the field comes down.", hook: "entry", tier: "standard" },
        "forge-anthem": { name: "Forge Anthem", desc: "Its anthem makes every allied forge burn steel-true.", hook: "passive", tier: "standard" },
        "doommark-touch": { name: "Doommark Touch", desc: "Touch it, and both of you are already counting.", hook: "on-hit", tier: "strong" },
        "spirit-exchange": { name: "Spirit Exchange", desc: "Its gift will not stay with it; it trades with whoever touches it.", hook: "on-hit", tier: "standard" },
        "single-minded-onslaught": { name: "Single-Minded Onslaught", desc: "Terrible strength, one idea, no revisions.", hook: "passive", tier: "strong" },
        "null-air": { name: "Null Air", desc: "The air around it is an argument that no gift can survive.", hook: "system", tier: "strong" },
        "pastel-ward": { name: "Pastel Ward", desc: "A gentle veil under which no venom can find its friends.", hook: "status", tier: "standard" },
        "sudden-draw": { name: "Sudden Draw", desc: "Sometimes \u2014 unpredictably, unfairly \u2014 it is simply first.", hook: "pre-move", tier: "standard" },
        "unseen-hand": { name: "Unseen Hand", desc: "Its fists arrive from a direction that guarding does not cover.", hook: "dmg-dealt", tier: "standard" },
        "shell-tonic": { name: "Shell Tonic", desc: "It carries a tonic in its shell and shares it the moment it arrives.", hook: "entry", tier: "utility" },
        "overcharge-heart": { name: "Overcharge Heart", desc: "A heart that does not store the charge \u2014 it multiplies it.", hook: "dmg-dealt", tier: "standard" },
        "starwyrm-maw": { name: "Starwyrm Maw", desc: "A maw that has eaten stars and kept the fire.", hook: "dmg-dealt", tier: "standard" },
        "winter-toll": { name: "Winter Toll", desc: "A foe falls, and somewhere a cold bell rings for it.", hook: "ko-dealt", tier: "standard" },
        "dread-toll": { name: "Dread Toll", desc: "A foe falls, and the dark takes its share of the sound.", hook: "ko-dealt", tier: "standard" },
        "twin-souled-sovereign": { name: "Twin-Souled Sovereign", desc: "Two sovereigns, one silhouette: the rider's dread, the steed's triumph.", hook: "ko-dealt", tier: "apex" },
        "clinging-perfume": { name: "Clinging Perfume", desc: "Its scent does not leave with it; it leaves with you.", hook: "on-hit", tier: "standard" },
        "sowsong": { name: "Sowsong", desc: "Struck, it answers by sowing the field with itself.", hook: "on-hit", tier: "standard" },
        "feverforge": { name: "Feverforge", desc: "Fire only feeds the forge and raises the hammer.", hook: "on-hit", tier: "standard" },
        "shellwrath": { name: "Shellwrath", desc: "Crack the shell and what is inside stops defending itself entirely.", hook: "on-hit", tier: "standard" },
        "saltward-body": { name: "Saltward Body", desc: "Salt-pure: no sickness settles, and the dark strikes it softly.", hook: "status", tier: "strong" },
        "kilnbaked-body": { name: "Kilnbaked Body", desc: "It has already survived the fire. Your fire is a formality.", hook: "dmg-taken", tier: "strong" },
        "galecrown": { name: "Galecrown", desc: "The wind is not its weather; the wind is its crown.", hook: "dmg-taken", tier: "strong" },
        "watchdogs-pride": { name: "Watchdog's Pride", desc: "Threaten it and it stands taller; drag it and it does not move.", hook: "entry", tier: "standard" },
        "quarryheart": { name: "Quarryheart", desc: "It carries the quarry in its chest and throws with all of it.", hook: "dmg-dealt", tier: "standard" },
        "stormcharge": { name: "Stormcharge", desc: "The wind charges it, and the next bolt spends it all.", hook: "on-hit", tier: "standard" },
        "hero-unmasked": { name: "Hero Unmasked", desc: "It leaves the field a nobody and returns as the story.", hook: "switch", tier: "strong" },
        "woundcharge": { name: "Woundcharge", desc: "Pain is just charging, done the slow way.", hook: "on-hit", tier: "standard" },
        "dawnforge-protocol": { name: "Dawnforge Protocol", desc: "An ancient protocol wakes with the daylight and perfects its best gift.", hook: "passive", tier: "strong" },
        "voltforge-protocol": { name: "Voltforge Protocol", desc: "A future protocol that wakes on charged ground and perfects its best gift.", hook: "passive", tier: "strong" },
        "gilded-immunity": { name: "Gilded Immunity", desc: "A body of solid gold, and a will to match: tricks simply do not apply.", hook: "dmg-taken", tier: "strong" },
        "vessel-of-undoing": { name: "Vessel of Undoing", desc: "The vessel it carries unmakes the sorcery of everyone near it.", hook: "field", tier: "apex" },
        "sword-of-undoing": { name: "Sword of Undoing", desc: "The sword it carries unmakes the guard of everyone near it.", hook: "field", tier: "apex" },
        "tablets-of-undoing": { name: "Tablets of Undoing", desc: "The tablets it carries unmake the strength of everyone near it.", hook: "field", tier: "apex" },
        "beads-of-undoing": { name: "Beads of Undoing", desc: "The beads it carries unmake the ward of everyone near it.", hook: "field", tier: "apex" },
        "ancient-dawn-pulse": { name: "Ancient Dawn Pulse", desc: "An ancient pulse that brings the dawn and fights beside it.", hook: "field", tier: "apex" },
        "future-engine": { name: "Future Engine", desc: "A future engine that charges the ground and fights beside it.", hook: "field", tier: "apex" },
        "mirroring-ambition": { name: "Mirroring Ambition", desc: "It never lets a foe's ambition stand unanswered.", hook: "status", tier: "standard" },
        "edge-discipline": { name: "Edge Discipline", desc: "It keeps every edge it owns at a razor's discipline.", hook: "dmg-dealt", tier: "standard" },
        "crown-of-the-fallen": { name: "Crown of the Fallen", desc: "It fights with the strength of everyone who fell before it.", hook: "passive", tier: "strong" },
        "shared-ledger": { name: "Shared Ledger", desc: "It keeps its allies' accounts as carefully as its own.", hook: "entry", tier: "standard" },
        "venom-rubble": { name: "Venom Rubble", desc: "What breaks off it stays on the ground, waiting for the next arrival.", hook: "on-hit", tier: "standard" },
        "veiltail-decree": { name: "Veiltail Decree", desc: "The strange tail thinks first, and its thought is always 'no, not quickly'.", hook: "pre-move", tier: "strong" },
        "earthfeast": { name: "Earthfeast", desc: "It eats the ground's violence and calls it a meal.", hook: "dmg-taken", tier: "strong" },
        "patient-spores": { name: "Patient Spores", desc: "Its tricks arrive last and cannot be argued with.", hook: "pre-move", tier: "standard" },
        "hearthwelcome": { name: "Hearthwelcome", desc: "It enters the way a good host enters: with something for you.", hook: "entry", tier: "standard" },
        "inward-eye": { name: "Inward Eye", desc: "The eye that looks inward cannot be deceived by outward dodging.", hook: "pre-move", tier: "strong" },
        "aspect-of-the-masks": { name: "Aspect of the Masks", desc: "A remembered mask blazes, and one gift rises with it.", hook: "entry", tier: "apex" },
        "chainvenom": { name: "Chainvenom", desc: "Every blow it lands trails a chain of deeper venom.", hook: "dmg-dealt", tier: "strong" },
        "syrup-haze": { name: "Syrup Haze", desc: "A sickly-sweet haze pours off it, and everyone's aim goes soft.", hook: "entry", tier: "standard" },
        "prismworld-shell": { name: "Prismworld Shell", desc: "A shell holding every color at once; unbroken, nothing strikes it truly.", hook: "dmg-taken", tier: "apex" },
        "worldstill": { name: "Worldstill", desc: "When it wakes, weather and ground alike are reduced to zero.", hook: "field", tier: "apex" },
        "puppeteers-venom": { name: "Puppeteer's Venom", desc: "Its venom does not just sicken the body; it takes the body's strings.", hook: "status", tier: "strong" },
        "aegis-of-ages": { name: "Aegis of Ages", desc: "Older than the mountains it resembles; sorcery breaks on it like weather.", hook: "dmg-taken", tier: "signature" },
        "solar-ascendant": { name: "Solar Ascendant", desc: "It rises, and its sorcery rises with it.", hook: "entry", tier: "signature" },
        "crushing-depths": { name: "Crushing Depths", desc: "The pressure of the deep arrives before it does.", hook: "entry", tier: "signature" },
        "seismic-heart": { name: "Seismic Heart", desc: "The earth does not serve it; the earth is it.", hook: "dmg-dealt", tier: "signature" },
        "jet-stream": { name: "Jet Stream", desc: "It enters already moving at the speed of weather.", hook: "entry", tier: "signature" },
        "dread-twilight": { name: "Dread Twilight", desc: "A twilight that thinks, and what it thinks is dread.", hook: "entry", tier: "signature" },
        "dawn-radiance": { name: "Dawn Radiance", desc: "Dawn, given a body and a schedule.", hook: "end-of-turn", tier: "signature" },
        "temporal-sovereignty": { name: "Temporal Sovereignty", desc: "Time does not argue with it, and neither do stat drops.", hook: "status", tier: "signature" },
        "magma-core": { name: "Magma Core", desc: "A core of the first fire; flame is family, never threat.", hook: "dmg-dealt", tier: "signature" },
        "permafrost-veil": { name: "Permafrost Veil", desc: "A veil of the first winter lies over it, always.", hook: "dmg-taken", tier: "signature" },
        "world-roots": { name: "World Roots", desc: "Its roots reach the world's memory, and the world mends what it loves.", hook: "end-of-turn", tier: "signature" },
        "tempest-wrath": { name: "Tempest Wrath", desc: "The tempest does not strike through it; it strikes as it.", hook: "dmg-dealt", tier: "signature" },
        "primordial-core": { name: "Primordial Core", desc: "The first stone, still warm from the making.", hook: "entry", tier: "signature" },
        "soul-tithe": { name: "Soul Tithe", desc: "Every fall it causes is a tithe, and the tithe is power.", hook: "ko-dealt", tier: "signature" },
        "starlight-surge": { name: "Starlight Surge", desc: "Starlight does not fall on it; it pours from it.", hook: "dmg-dealt", tier: "signature" },
        "tidal-terror": { name: "Tidal Terror", desc: "The tide goes out in every defender when it surfaces.", hook: "entry", tier: "signature" },
        "eternal-flame": { name: "Eternal Flame", desc: "Wounded past bearing, the eternal flame stops holding back.", hook: "dmg-dealt", tier: "signature" },
        "bloom-renewal": { name: "Bloom Renewal", desc: "Every mending it works blooms larger than it should.", hook: "passive", tier: "signature" },
        "eye-of-the-storm": { name: "Eye of the Storm", desc: "The calm at its center is the most violent place on the field.", hook: "entry", tier: "signature" },
        "soul-harvest": { name: "Soul Harvest", desc: "It does not waste a fall; every fall is a harvest.", hook: "ko-dealt", tier: "signature" },
        "architects-decree": { name: "Architect's Decree", desc: "The Architect speaks once, at the door, and the room rearranges itself.", hook: "entry", tier: "signature" },
        "radiant-plume": { name: "Radiant Plume", desc: "Its plumage keeps a little of the dawn in reserve, always.", hook: "end-of-turn", tier: "signature" },
        "sovereign-scales": { name: "Sovereign Scales", desc: "Unhurt, it is not merely defended; it is sovereign.", hook: "dmg-taken", tier: "signature" },
        "calamity-heart": { name: "Calamity Heart", desc: "A calamity with a heartbeat, and the heartbeat is fire.", hook: "dmg-dealt", tier: "signature" },
        "trench-heart": { name: "Trench Heart", desc: "A trench with a heartbeat, and the heartbeat is tide.", hook: "dmg-dealt", tier: "signature" },
        "sylvan-heart": { name: "Sylvan Heart", desc: "A forest with a heartbeat, and the heartbeat is green.", hook: "dmg-dealt", tier: "signature" },
        "plasma-barbs": { name: "Plasma Barbs", desc: "Its barbs answer touch with a crackle that slows the blood.", hook: "on-hit", tier: "signature" },
        "raptors-regard": { name: "Raptor's Regard", desc: "A raptor's regard: measured once, never wrong, never shaken.", hook: "pre-move", tier: "signature" },
        "iron-pincer": { name: "Iron Pincer", desc: "The pincer does not squeeze; it concludes.", hook: "dmg-dealt", tier: "signature" },
        "toxic-tide": { name: "Toxic Tide", desc: "Its tide comes in poisoned, every time, on purpose.", hook: "status", tier: "signature" },
        "storm-bloom": { name: "Storm Bloom", desc: "Where it blooms, the wind itself flowers open.", hook: "dmg-dealt", tier: "signature" },
        "shadow-beak": { name: "Shadow Beak", desc: "A beak that strikes from the shadow side of the light.", hook: "dmg-dealt", tier: "signature" },
        "frost-mane": { name: "Frost Mane", desc: "A mane of living frost; fire cannot take hold in it.", hook: "status", tier: "signature" },
    };


    S21.abilityName = function (id) { const e = S21.ABILITY_LIB[id]; return e ? e.name : id; };
    S21.abilityDesc = function (id) { const e = S21.ABILITY_LIB[id]; return e ? e.desc : ""; };

    // ------------------------------------------------------------- banner
    S21.banners = [];
    S21.banner = function (b, abilityId) {
        if (!b || !abilityId) return;
        S21.banners.push({ battler: name(b), ability: abilityId });
        S21.log("\\C[14]" + name(b) + "'s " + S21.abilityName(abilityId) + "\\C[0]");
        const st = S21.store(b);
        st.misc.bannerShown = st.misc.bannerShown || {};
        st.misc.bannerShown[abilityId] = true;
    };
    function bannerOnce(b, abilityId) {
        const st = S21.store(b);
        st.misc.bannerShown = st.misc.bannerShown || {};
        if (!st.misc.bannerShown[abilityId]) S21.banner(b, abilityId);
    }

    // ---------------------------------------------- suppression + registry
    // abilityOf (Part A) already honors _s21AbilityOverride (the copy/swap
    // registry's storage). abilityActive adds Null Air suppression: while a
    // Null Air bearer stands, every OTHER battler's ability is inert.
    S21.abilityActive = function (b) {
        if (!b) return null;
        const mine = S21.abilityOf(b);
        if (!mine) return null;
        if (inBattle() && S21.isGanjukoBattler(b)) {
            try {
                for (const o of S21.allStanding()) {
                    if (o !== b && S21.abilityOf(o) === "null-air") return null;
                }
            } catch (e) {}
        }
        return mine;
    };
    const activeIs = (b, id) => S21.abilityActive(b) === id;
    S21.activeIs = activeIs;
    function anyStandingWith(id, side) {
        return S21.allStanding().some(o => (!side || S21.sideOf(o) === side) && activeIs(o, id));
    }
    S21.anyStandingWith = anyStandingWith;

    // ------------------------------------------------------------ field
    // Sky: Day / Night / Tempest (default from the overworld clock).
    // Aura: Volt / Astral / Mist / Bloom for 5 turns from a Herald entry.
    S21.field = null;
    function defaultSky() {
        try {
            const h = new Date().getHours();
            return (h >= 20 || h < 5) ? "Night" : "Day";
        } catch (e) { return "Day"; }
    }
    S21.initField = function () {
        S21.field = { sky: defaultSky(), aura: null, auraTurns: 0,
                      hazards: { actor: 0, enemy: 0 } };
        return S21.field;
    };
    function field() { return S21.field || S21.initField(); }
    function skyNullified() {
        return anyStandingWith("clearsky-mind") || anyStandingWith("stilled-heavens") || anyStandingWith("worldstill");
    }
    S21.skyNow = function () { return field().sky; };
    S21.skyActive = function () { return skyNullified() ? null : field().sky; };
    S21.auraNow = function () { return field().aura; };
    S21.auraActive = function () {
        if (skyNullified()) return null;
        if (anyStandingWith("worldstill")) return null;
        return field().aura;
    };
    S21.setSky = function (sky, source) {
        const f = field();
        if (f.sky !== sky) {
            f.sky = sky;
            S21.log("The sky turned to " + sky + "!");
            // Frostmask restores when the Sky becomes Tempest.
            for (const b of S21.allStanding()) {
                if (sky === "Tempest" && activeIs(b, "frostmask")) S21.store(b).misc.shieldReady = true;
            }
        }
    };
    S21.setAura = function (aura, turns) {
        const f = field();
        f.aura = aura;
        f.auraTurns = turns || 5;
        if (aura) S21.log("A " + aura + " aura covered the field!");
    };
    S21.fieldTick = function () {
        const f = field();
        if (f.aura && f.auraTurns > 0) {
            f.auraTurns--;
            if (f.auraTurns <= 0) { f.aura = null; S21.log("The aura faded."); }
        }
    };
    S21.grounded = function (b) {
        if (!b) return false;
        if (S21.effectiveTypes(b).includes(7)) return false; // Wind
        if (activeIs(b, "skyborne")) return false;
        return true;
    };

    // -------------------------------------------------- effective types
    const _s21BaseTypes = S21.effectiveTypes;
    S21.effectiveTypes = function (b) {
        const st = b && b._ganjukoStages ? b._ganjukoStages : null;
        const ov = st && st.misc ? st.misc.typeOverride : null;
        if (ov && ov.length) return ov.slice();
        const ab = S21.abilityActive(b);
        if (ab === "skyward-guise") {
            const sky = S21.skyActive();
            if (sky === "Day") return [2];
            if (sky === "Night") return [3];
            if (sky === "Tempest") return [7];
        }
        if (ab === "fieldmirror") {
            const aura = S21.auraActive();
            if (aura === "Volt") return [5];
            if (aura === "Astral") return [9];
            if (aura === "Mist") return [3];
            if (aura === "Bloom") return [4];
        }
        return _s21BaseTypes(b);
    };

    // ------------------------------------------------------- move facts
    const _tagCache = {};
    S21.skillTags = function (item) {
        if (!item) return [];
        if (_tagCache[item.id]) return _tagCache[item.id];
        let tags = [];
        const m = /<tags:\s*([^>]+)>/.exec(item.note || "");
        if (m) tags = m[1].trim().split(/\s+/);
        _tagCache[item.id] = tags;
        return tags;
    };
    S21.skillPow = function (item) {
        if (!item || !item.damage || !item.damage.formula) return 0;
        const m = /a\.(?:atk|mat)\s*\*\s*([0-9.]+)/.exec(item.damage.formula);
        return m ? Math.round(parseFloat(m[1]) * 100) : 0;
    };
    S21.isContact = function (item, subject) {
        if (!item || !item.damage || item.damage.type === 0) return false;
        if (subject && activeIs(subject, "farhand")) return false;
        return item.hitType === 1; // physical category = contact (documented rule)
    };
    function chartRate(elementId, target) {
        try {
            const sp = target.ganjukoSpecies();
            return GE.typeEffectiveness(elementId, sp);
        } catch (e) { return 1; }
    }
    S21.chartRate = chartRate;
    function effRateVsEffective(elementId, target) {
        // Chart against the target's EFFECTIVE types (post type-changes).
        const types = S21.effectiveTypes(target);
        let rate = 1;
        const chart = GE.GANJUKO_TYPE_CHART || {};
        for (const t of types) {
            const row = chart[elementId] || {};
            const r = row[t];
            rate *= (typeof r === "number") ? r : 1;
        }
        return rate;
    }
    function turnNow() {
        try {
            if (typeof $gameTroop !== "undefined" && $gameTroop && typeof $gameTroop.turnCount === "function") return $gameTroop.turnCount();
        } catch (e) {}
        return 0;
    }
    S21.turnNow = turnNow;
    function healOf(b, frac) { return Math.max(1, Math.floor(b.mhp * frac)); }
    S21.healAmount = function (b, amount) {
        // Bloom Renewal (healing performed x1.5) is applied by callers that
        // know the healer; this helper covers self-heals.
        return amount;
    };
    function cureMajor(b) {
        const cur = S21.majorStatusOf(b);
        if (cur && typeof b.removeState === "function") { b.removeState(cur); return cur; }
        return 0;
    }
    S21.cureMajor = cureMajor;

    // ------------------------------------------------ status immunities
    const ABILITY_STATUS_IMMUNE = {
        "suppleframe": [12], "antivenin": [4, 31], "tideveil": [11],
        "frost-mane": [11], "feverforge": [11], "magmashell": [14],
        "sleepless-vigil": [10], "undying-spark": [10], "own-cadence": [8],
        "magma-core": [11]
    };
    S21.abilityImmuneTo = function (target, stateId, skill, user) {
        const ab = S21.abilityActive(target);
        if (!ab) return false;
        // Wardbreaker class: the user's moves ignore the target's ability.
        if (user && user !== target && ["wardbreaker", "heavenbrand", "stormbrand"].includes(S21.abilityActive(user))) return false;
        const imp = implOf(target);
        if (imp) {
            if (imp.immuneAll) return true;
            if (Array.isArray(imp.immune) && imp.immune.includes(stateId)) return true;
        }
        const table = ABILITY_STATUS_IMMUNE[ab];
        if (table && table.includes(stateId)) return true;
        if (ab === "saltward-body") return true; // cannot gain any status
        if (ab === "canopy-ward" && S21.skyActive() === "Day") return true;
        if (ab === "eternal-slumber") return true; // its slot is permanently occupied
        if (skill && S21.POWDER_SKILLS[skill.id] && ab === "stormproof-coat") return true;
        // Ally-scope veils (doubles-aware; in singles they cover the self).
        const allies = [target].concat(S21.alliesOf(target));
        for (const a of allies) {
            const aAb = S21.abilityActive(a);
            if (aAb === "petalward" && S21.effectiveTypes(target).includes(4)) return true;
            if (aAb === "honeyveil" && stateId === 10) return true;
            if (aAb === "pastel-ward" && (stateId === 4 || stateId === 31)) return true;
        }
        return false;
    };
    S21.fieldImmuneTo = function (target, stateId) {
        const aura = S21.auraActive();
        if (!aura) return false;
        if (aura === "Volt" && stateId === 10) return true; // no battler can fall asleep
        if (aura === "Mist" && S21.grounded(target)) return true;
        return false;
    };
    S21.riderChanceMult = function (subject, item, stateId) {
        let m = 1;
        if (subject && activeIs(subject, "fortunes-smile")) m *= 2;
        return m;
    };
    S21.riderBlocked = function (subject, target, item) {
        if (!item || !item.damage || item.damage.type === 0) return false; // pure status moves unaffected
        if (target && activeIs(target, "warding-dust")) return true;
        if (subject && activeIs(subject, "brute-clarity")) return true;
        if (target && activeIs(target, "stormproof-coat") && S21.skillTags(item).includes("powder")) return true;
        return false;
    };
    // Shared Burden + Puppeteer's Venom ride Part A's application hook.
    S21.onStatusApplied.push(function (user, target, stateId, skill) {
        if (!user || !target || user === target) return;
        const tAb = S21.abilityActive(target);
        if (tAb === "shared-burden" && [11, 12, 4, 31].includes(stateId) &&
            S21.sideOf(user) !== S21.sideOf(target)) {
            const back = S21.applyStatus(target, user, stateId, skill);
            if (back.ok) S21.banner(target, "shared-burden");
        }
        if (S21.abilityActive(user) === "puppeteers-venom" && (stateId === 4 || stateId === 31)) {
            const c = S21.applyStatus(user, target, 8, skill);
            if (c.ok) S21.banner(user, "puppeteers-venom");
        }
    });

    // ------------------------------------------------------ damage dealt
    function auraBoostMult(elementId) {
        // Field auras boost EVERY battler's matching moves; Stillpoint Aura
        // reverses aura effects (boosts become 0.75).
        const aura = S21.auraActive();
        let m = 1;
        if (aura === "Volt" && elementId === 5) m = 1.3;
        if (aura === "Astral" && elementId === 9) m = 1.3;
        if (aura === "Mist" && elementId === 9) m = 0.5;
        if (aura === "Bloom" && elementId === 4) m = 1.3;
        if (m > 1 && anyStandingWith("stillpoint-aura")) m = 0.75; // Aura Break: boosts reverse to 0.75; penalties stand
        if (m === 1) {
            // Ability auras (Umbral / Astral) are field-wide too.
            if (elementId === 8 && anyStandingWith("umbral-aura")) m = anyStandingWith("stillpoint-aura") ? 0.75 : 1.33;
            if (elementId === 9 && anyStandingWith("astral-aura")) m = anyStandingWith("stillpoint-aura") ? 0.75 : 1.33;
        }
        return m;
    }
    function condOk(cond, ctx, bearer) {
        if (!cond) return true;
        // HP/status conditions read the BEARER (subject for dealt rules,
        // target for taken rules); move conditions read the ctx.
        const self = bearer || ctx.subject;
        switch (cond) {
            case "pinch": return self.hp * 3 <= self.mhp;
            case "fullhp": return self.hp >= self.mhp;
            case "halfOrBelow": return self.hp * 2 <= self.mhp;
            case "aboveHalf": return self.hp * 2 > self.mhp;
            case "se": return ctx.effRate > 1;
            case "nve": return ctx.effRate < 1 && ctx.effRate > 0;
            case "crit": return !!ctx.critical;
            case "contact": return !!ctx.contact;
            case "statused": return S21.majorStatusOf(self) > 0;
            case "doubles": return S21.alliesOf(ctx.subject).length >= 1;
            default:
                if (cond.startsWith("sky:")) return S21.skyActive() === cond.slice(4);
                if (cond.startsWith("aura:")) return S21.auraActive() === cond.slice(5);
                return true;
        }
    }
    function evalMultList(list, ctx, bearer) {
        let m = 1;
        if (!Array.isArray(list)) return m;
        for (const rule of list) {
            if (rule.el !== undefined && rule.el !== ctx.element) continue;
            if (rule.cat !== undefined && rule.cat !== ctx.category) continue;
            if (rule.tag !== undefined && !ctx.tags.includes(rule.tag)) continue;
            if (rule.powLE !== undefined && !(ctx.pow > 0 && ctx.pow <= rule.powLE)) continue;
            if (rule.recoilMove !== undefined && !!S21.RECOIL[ctx.item.id] !== rule.recoilMove) continue;
            if (!condOk(rule.if, ctx, bearer)) continue;
            m *= rule.m;
            if (bearer) bannerOnce(bearer, S21.abilityActive(bearer));
        }
        return m;
    }
    function buildCtx(subject, target, item, value, critical) {
        const element = item && item.damage ? (item.damage.elementId || 1) : 1;
        return {
            subject, target, item, value, critical,
            element,
            category: item ? item.hitType : 0,
            tags: S21.skillTags(item),
            pow: S21.skillPow(item),
            contact: S21.isContact(item, subject),
            effRate: target ? effRateVsEffective(element, target) : 1
        };
    }
    // Type-conversion touches + STAB / chart correction: the inner chain
    // priced the move with its DATA element and the species' printed
    // types. Conversions (and defender type-changes) re-price here.
    function conversionElement(subject, item, element) {
        const ab = S21.abilityActive(subject);
        if (!ab || !item || !item.damage || item.damage.type === 0) return element;
        const tags = S21.skillTags(item);
        if (ab === "plainchant") return 1;
        if (element === 1) {
            if (ab === "frostmantle-touch") return 3;
            if (ab === "stardust-touch") return 9;
            if (ab === "zephyr-touch") return 7;
            if (ab === "galvanic-touch") return 5;
        }
        if (ab === "tidevoice" && tags.includes("sound")) return 3;
        return element;
    }
    S21.modifyDamageDealt = function (subject, target, item, value, critical) {
        if (!subject || !item || !target) return value;
        const ctx = buildCtx(subject, target, item, value, critical);
        // Reign nullifications are field rules, not target abilities.
        if (anyStandingWith("first-oceans-reign") && ctx.element === 2) return 0;
        if (anyStandingWith("first-suns-reign") && ctx.element === 3) return 0;
        let m = 1;
        // Conversion: re-price chart + STAB against the converted element.
        const convEl = conversionElement(subject, item, ctx.element);
        if (convEl !== ctx.element) {
            const before = chartRate(ctx.element, target);
            const after = effRateVsEffective(convEl, target);
            if (before > 0 && value > 0) m *= after / before;
            const subjTypes = S21.effectiveTypes(subject);
            const wasStab = subjTypes.includes(ctx.element);
            const isStab = subjTypes.includes(convEl);
            if (isStab && !wasStab) m *= 1.5;
            if (wasStab && !isStab) m /= 1.5;
            ctx.element = convEl;
            ctx.effRate = after;
            if (S21.abilityActive(subject) !== "tidevoice") m *= 1.2; // -ate family boost
            bannerOnce(subject, S21.abilityActive(subject));
        }
        // Defender type-changes (Prismflesh etc.): correct the chart leg.
        if (value > 0) {
            const speciesRate = chartRate(ctx.element, target);
            if (speciesRate > 0 && Math.abs(speciesRate - ctx.effRate) > 1e-9) m *= ctx.effRate / speciesRate;
        }
        m *= auraBoostMult(ctx.element);
        // Forge Anthem: bearer + allies' Earth moves x1.5.
        if (ctx.element === 6 && S21.standingOf(subject).some(a => activeIs(a, "forge-anthem"))) m *= 1.5;
        // Ally batteries (doubles): Living Battery (special x1.3),
        // Empowering Ground (all x1.3) — the BEARER boosts its allies.
        if (ctx.category === 2 && S21.alliesOf(subject).some(a => activeIs(a, "living-battery"))) m *= 1.3;
        if (S21.alliesOf(subject).some(a => activeIs(a, "empowering-ground"))) m *= 1.3;
        const imp = implOf(subject);
        if (imp) {
            m *= evalMultList(imp.dealt, ctx, subject);
            if (typeof imp.dealtFn === "function") { const r = imp.dealtFn(ctx, S21); if (typeof r === "number") m *= r; }
        }
        const sAb = S21.abilityActive(subject);
        // Charge flags (Stormcharge / Woundcharge): next Volt move x2.
        if (ctx.element === 5 && S21.store(subject).misc.charge) {
            S21.store(subject).misc.charge = false;
            m *= 2;
            S21.log(name(subject) + " unleashed its charge!");
        }
        // Kindled Core: once kindled, own Fire moves x1.5.
        if (ctx.element === 2 && sAb === "kindled-core" && S21.store(subject).misc.kindled) m *= 1.5;
        // True Affinity: STAB 1.5 -> 2.0.
        if (sAb === "true-affinity" && S21.effectiveTypes(subject).includes(ctx.element)) m *= 2 / 1.5;
        // Deadeye Creed: crits deal an extra x1.5 (1.5 -> 2.25 total).
        if (critical && sAb === "deadeye-creed") m *= 1.5;
        // Prism Lens: not-very-effective hits double (0.5 lands as 1.0).
        if (sAb === "prism-lens" && ctx.effRate > 0 && ctx.effRate < 1) m *= 2;
        // Overmind Edge: super-effective hits x1.25 more.
        if (sAb === "overmind-edge" && ctx.effRate > 1) m *= 1.25;
        // Lastword Mind: acting last (lowest effective AGI standing) x1.3.
        if (sAb === "lastword-mind") {
            const speeds = S21.allStanding().filter(x => x && typeof x.isAlive === "function" && x.isAlive())
                .map(x => (typeof x.agi === "number" ? x.agi : 0));
            if (speeds.length && (typeof subject.agi === "number" ? subject.agi : 0) <= Math.min.apply(null, speeds)) m *= 1.3;
        }
        // Ambush Creed: x2 vs a target that switched in this turn.
        if (sAb === "ambush-creed" && target) {
            const ts = S21.store(target);
            if (ts.misc.enteredTurn === turnNow() && !ts.misc.leadEntry) { m *= 2; bannerOnce(subject, sAb); }
        }
        // First Storm's Reign: Wind battlers have no weaknesses.
        if (ctx.effRate > 1 && S21.effectiveTypes(target).includes(7) && anyStandingWith("first-storms-reign")) {
            m *= 1 / ctx.effRate;
        }
        return Math.floor(value * m);
    };

    // ------------------------------------------------------ damage taken
    S21.modifyDamageTaken = function (target, subject, item, value, critical) {
        if (!target || !item || !subject) return value;
        // Wardbreaker class: the attacker's moves ignore the target's
        // ability entirely (field rules above still applied on the dealt
        // side; ally-guardian reduction below is an ALLY ability and stays).
        const breaker = ["wardbreaker", "heavenbrand", "stormbrand"].includes(S21.abilityActive(subject));
        const ctx = buildCtx(subject, target, item, value, critical);
        ctx.element = conversionElement(subject, item, ctx.element);
        let m = 1;
        const tAb = S21.abilityActive(target);
        const tst = S21.store(target);
        if (!breaker && tAb) {
            // Absorbs and nullifications (heals/stages resolve via pending
            // flags in the executeHpDamage wrap, which runs after).
            const absorb = (AB, el, kind, frac) => {
                if (tAb === AB && ctx.element === el) {
                    tst.misc.pendingAbsorb = { kind, frac: frac || 0.25, ability: AB };
                    return true;
                }
                return false;
            };
            if (absorb("stormcell", 5, "heal")) return 0;
            if (absorb("deepwell", 3, "heal")) return 0;
            if (absorb("earthfeast", 6, "heal")) return 0;
            if (absorb("kindled-core", 2, "kindle")) return 0;
            if (absorb("galvengine", 5, "stageAgi")) return 0;
            if (absorb("galvanic-spire", 5, "stageMat")) return 0;
            if (absorb("maelstrom-call", 3, "stageMat")) return 0;
            if (absorb("thornfeast", 4, "stageAtk")) return 0;
            if (absorb("kilnbaked-body", 2, "stageDef2")) return 0;
            if (absorb("galecrown", 7, "stageAtk")) return 0;
            if (tAb === "skyborne" && ctx.element === 6) return 0;
            if (tAb === "hushfield" && ctx.tags.includes("sound")) { bannerOnce(target, tAb); return 0; }
            if (tAb === "shellward" && ctx.tags.includes("ballistic")) { bannerOnce(target, tAb); return 0; }
            if (tAb === "ninefold-ward" && ctx.effRate <= 1) { bannerOnce(target, tAb); return 0; }
            // One-time shields.
            if (tAb === "sacrificial-veil" && tst.misc.shieldReady !== false) {
                tst.misc.shieldReady = false;
                tst.misc.pendingShieldLoss = 1 / 8;
                S21.banner(target, tAb);
                return 0;
            }
            if (tAb === "frostmask" && ctx.category === 1 && tst.misc.shieldReady !== false) {
                tst.misc.shieldReady = false;
                S21.banner(target, tAb);
                return 0;
            }
            // Last Rampart (Sturdy): survive a would-be KO from full HP.
            if (tAb === "last-rampart" && target.hp >= target.mhp && value >= target.hp) {
                S21.banner(target, tAb);
                return Math.max(0, target.hp - 1);
            }
            const imp = implOf(target);
            if (imp) {
                m *= evalMultList(imp.taken, ctx, target);
                if (typeof imp.takenFn === "function") { const r = imp.takenFn(ctx, S21); if (typeof r === "number") m *= r; }
            }
        }
        // Guardian Stance: an ally's presence reduces damage to this
        // battler in doubles (ally ability — not negated by Wardbreaker).
        if (S21.alliesOf(target).some(a => activeIs(a, "guardian-stance"))) m *= 0.75;
        // Kindred Sense: no damage from allies' spread (multi-target) moves.
        if (S21.sideOf(subject) === S21.sideOf(target) && subject !== target &&
            tAb === "kindred-sense" && item.scope && item.scope !== 1) m = 0;
        return Math.floor(value * m);
    };

    // ------------------------------------------- on-hit reaction queue
    function applyChip(attacker, amount, sourceName) {
        if (!attacker || amount <= 0) return;
        if (activeIs(attacker, "hexward-body")) return; // Magic Guard: no indirect damage
        try { attacker.gainHp(-amount); } catch (e) {}
    }
    S21.chipDamage = applyChip;
    S21.fireOnHit = function (subject, target, item, damageDealt) {
        if (!subject || !target || !item) return;
        const tst = S21.store(target);
        const sst = S21.store(subject);
        // Defender's disguise breaks on damage.
        if (tst.misc.disguiseSpeciesId && damageDealt > 0) {
            delete tst.misc.disguiseSpeciesId;
            S21.log(name(target) + "'s disguise was broken!");
        }
        // Fisher's Dividend: a carrying defender counters the attacker.
        if (tst.misc.hasCatch && damageDealt > 0 && typeof subject.isAlive === "function" && subject.isAlive()) {
            tst.misc.hasCatch = false;
            S21.banner(target, "fishers-dividend");
            applyChip(subject, Math.max(1, Math.floor(subject.mhp * 0.20)));
        }
        const tAb = S21.abilityActive(target);
        const breaker = ["wardbreaker", "heavenbrand", "stormbrand"].includes(S21.abilityActive(subject));
        const contact = S21.isContact(item, subject);
        const element = item.damage ? (item.damage.elementId || 1) : 1;
        const wasAboveHalf = tst.misc.hpBeforeHit !== undefined ? tst.misc.hpBeforeHit * 2 > target.mhp : target.hp * 2 > target.mhp;
        const nowBelowHalf = target.hp * 2 <= target.mhp;
        const crossedHalf = wasAboveHalf && nowBelowHalf && typeof target.isAlive === "function" && target.isAlive();
        if (!breaker && tAb && typeof target.isAlive === "function" && (target.isAlive() || tAb === "ashes-toll" || tAb === "last-tithe")) {
            const imp = implOf(target);
            if (imp && typeof imp.onHitFn === "function") {
                try { imp.onHitFn({ subject, target, item, damageDealt, contact, element, crossedHalf }, S21); } catch (e) {}
            }
            // Contact status family (30%): through the status gate, so the
            // attacker's own immunities (incl. Earth vs poison) apply.
            const contactStatus = { "sparksnare": 12, "venomspine": 4, "cinderhide": 11 };
            if (contact && contactStatus[tAb] && brChance(0.30)) {
                if (S21.applyStatus(target, subject, contactStatus[tAb], item).ok) S21.banner(target, tAb);
            }
            if (contact && tAb === "dreamspore" && brChance(0.30)) {
                const pick = [4, 12, 10][Math.floor(br() * 3)];
                if (S21.applyStatus(target, subject, pick, item).ok) S21.banner(target, tAb);
            }
            if (contact && (tAb === "shardhide" || tAb === "barbhide")) {
                applyChip(subject, Math.max(1, Math.floor(subject.mhp / 8)));
                bannerOnce(target, tAb);
            }
            if (contact && (tAb === "tarskin" || tAb === "snarlmane")) {
                S21.applyStageChange(subject, "agi", -1, target, {});
                bannerOnce(target, tAb);
            }
            if (contact && tAb === "plague-touch") {
                subject._s21AbilityOverride = "plague-touch";
                S21.banner(target, tAb);
                S21.log(name(subject) + "'s ability became Plague Touch!");
            }
            if (contact && tAb === "clinging-perfume") {
                subject._s21AbilityOverride = "clinging-perfume";
                S21.banner(target, tAb);
                S21.log(name(subject) + "'s ability became Clinging Perfume!");
            }
            if (contact && tAb === "spirit-exchange") {
                const mine = S21.abilityOf(target), theirs = S21.abilityOf(subject);
                subject._s21AbilityOverride = mine;
                target._s21AbilityOverride = theirs;
                S21.banner(target, tAb);
                S21.log(name(target) + " and " + name(subject) + " swapped abilities!");
            }
            if (contact && tAb === "doommark-touch" && typeof subject.isAlive === "function" && subject.isAlive()) {
                tst.misc.doomTurns = 3;
                S21.store(subject).misc.doomTurns = 3;
                S21.banner(target, tAb);
                S21.log("A doom mark settled on both battlers!");
            }
            if (tAb === "wrathpoint" && tst.misc.lastHitCrit) {
                const cur = tst.atk;
                S21.applyStageChange(target, "atk", 6 - cur, null, { ignoreProtect: true, noDouble: true, noReverse: true });
                S21.banner(target, tAb);
            }
            if (tAb === "fracture-plate" && ctx_category(item) === 1) {
                S21.applyStageChange(target, "def", -1, null, { selfInflicted: true });
                S21.applyStageChange(target, "agi", 2, null, { selfInflicted: true });
                bannerOnce(target, tAb);
            }
            if (tAb === "bulwark-growth") { S21.applyStageChange(target, "def", 1, null, {}); bannerOnce(target, tAb); }
            if (tAb === "tidepack" && element === 3) S21.applyStageChange(target, "def", 2, null, {});
            if (tAb === "boilerheart" && (element === 2 || element === 3)) { S21.applyStageChange(target, "agi", 3, null, {}); bannerOnce(target, tAb); }
            if (tAb === "stormcharge" && element === 7) { tst.misc.charge = true; S21.log(name(target) + " became charged!"); }
            if (tAb === "woundcharge") { tst.misc.charge = true; S21.log(name(target) + " became charged!"); }
            if (tAb === "feverforge" && element === 2) S21.applyStageChange(target, "atk", 1, null, {});
            if (tAb === "retribution" && element === 8) S21.applyStageChange(target, "atk", 1, null, {});
            if (tAb === "startle-reflex" && [8, 9, 4].includes(element)) S21.applyStageChange(target, "agi", 1, null, {});
            if (tAb === "prismflesh") { tst.misc.typeOverride = [element]; S21.log(name(target) + "'s type changed!"); }
            if (tAb === "hexed-husk" && brChance(0.30) && item.id) {
                S21.store(subject).misc.disabled = S21.store(subject).misc.disabled || {};
                S21.store(subject).misc.disabled[item.id] = 4;
                S21.banner(target, tAb);
                S21.log(name(subject) + "'s " + item.name + " was disabled!");
            }
            if (tAb === "venom-rubble" && ctx_category(item) === 1) {
                const side = S21.sideOf(subject);
                const f = field();
                if (f.hazards[side] < 2) {
                    f.hazards[side]++;
                    S21.banner(target, tAb);
                    S21.log("Venom was scattered on " + name(subject) + "'s side!");
                }
            }
            if (tAb === "tempest-answer") S21.setSky("Tempest", target);
            if (tAb === "sowsong") S21.setAura("Bloom", 5);
            if (crossedHalf && tAb === "painflare") S21.applyStageChange(target, "mat", 1, null, {});
            if (crossedHalf && tAb === "shellwrath") {
                S21.applyStageChange(target, "def", -1, null, { selfInflicted: true });
                S21.applyStageChange(target, "mdf", -1, null, { selfInflicted: true });
                S21.applyStageChange(target, "atk", 1, null, {});
                S21.applyStageChange(target, "mat", 1, null, {});
                S21.applyStageChange(target, "agi", 1, null, {});
                S21.banner(target, tAb);
            }
            if (crossedHalf && tAb === "cellswarm-ascendant" && !tst.misc.ascended) {
                tst.misc.ascended = true;
                S21.applyStageChange(target, "def", 1, null, {});
                S21.applyStageChange(target, "mdf", 1, null, {});
                try { target.gainHp(healOf(target, 0.25)); } catch (e) {}
                S21.banner(target, tAb);
            }
            if (crossedHalf && (tAb === "cowards-exit" || tAb === "sovereigns-exit")) {
                tst.misc.exitWanted = true;
            }
        }
        // Attacker-side on-hit riders.
        const sAb = S21.abilityActive(subject);
        if (sAb && typeof subject.isAlive === "function" && subject.isAlive() &&
            typeof target.isAlive === "function" && target.isAlive()) {
            if (contact && sAb === "venomtouch" && brChance(0.30)) {
                if (S21.applyStatus(subject, target, 4, item).ok) S21.banner(subject, sAb);
            }
            if (sAb === "chainvenom" && brChance(0.30)) {
                if (S21.applyStatus(subject, target, 31, item).ok) S21.banner(subject, sAb);
            }
            if (sAb === "toxic-tide" && brChance(0.10)) {
                if (S21.applyStatus(subject, target, 4, item).ok) bannerOnce(subject, sAb);
            }
            if (sAb === "musk-haze" && brChance(0.10) && !S21.riderBlocked(subject, target, item)) {
                if (activeIs(target, "stillpoint")) { /* Stillpoint cannot flinch */ }
                else S21.store(target).flinch = true;
            }
        }
    };
    function ctx_category(item) { return item ? item.hitType : 0; }

    if (typeof Game_Action !== "undefined" && Game_Action.prototype &&
        typeof Game_Action.prototype.executeHpDamage === "function") {
        const _s21B_EHD = Game_Action.prototype.executeHpDamage;
        Game_Action.prototype.executeHpDamage = function (target, value) {
            const subject = (typeof this.subject === "function") ? this.subject() : null;
            const item = (typeof this.item === "function") ? this.item() : null;
            let hpBefore = null, critFlag = false;
            try {
                if (target && S21.isGanjukoBattler(target)) {
                    const tst = S21.store(target);
                    tst.misc.hpBeforeHit = target.hp;
                    try { critFlag = !!(target.result && target.result().critical); } catch (e) {}
                    tst.misc.lastHitCrit = critFlag;
                    hpBefore = target.hp;
                }
            } catch (e) {}
            _s21B_EHD.call(this, target, value);
            try {
                if (!target || !S21.isGanjukoBattler(target) || !inBattle()) return;
                const tst = S21.store(target);
                // Pending absorb / shield consequences from the taken pass.
                if (tst.misc.pendingAbsorb) {
                    const pa = tst.misc.pendingAbsorb;
                    delete tst.misc.pendingAbsorb;
                    S21.banner(target, pa.ability);
                    if (pa.kind === "heal") { try { target.gainHp(healOf(target, pa.frac)); } catch (e) {} S21.log(name(target) + " restored its HP!"); }
                    if (pa.kind === "kindle") { tst.misc.kindled = true; S21.log(name(target) + " was kindled!"); }
                    if (pa.kind === "stageAgi") S21.applyStageChange(target, "agi", 1, null, {});
                    if (pa.kind === "stageMat") S21.applyStageChange(target, "mat", 1, null, {});
                    if (pa.kind === "stageAtk") S21.applyStageChange(target, "atk", 1, null, {});
                    if (pa.kind === "stageDef2") S21.applyStageChange(target, "def", 2, null, {});
                }
                if (tst.misc.pendingShieldLoss) {
                    const frac = tst.misc.pendingShieldLoss;
                    delete tst.misc.pendingShieldLoss;
                    try { target.gainHp(-Math.max(1, Math.floor(target.mhp * frac))); } catch (e) {}
                }
                const dealt = (hpBefore !== null) ? Math.max(0, hpBefore - target.hp) : Math.max(0, value || 0);
                if (subject && item && item.damage && item.damage.type > 0 && dealt >= 0 && value > 0) {
                    S21.fireOnHit(subject, target, item, dealt);
                    // Twofold Bond: a second strike at 25% of the first.
                    if (activeIs(subject, "twofold-bond") && dealt > 0 &&
                        typeof target.isAlive === "function" && target.isAlive() &&
                        typeof subject.isAlive === "function" && subject.isAlive()) {
                        const second = Math.max(1, Math.floor(dealt * 0.25));
                        S21.banner(subject, "twofold-bond");
                        try { target.gainHp(-second); } catch (e) {}
                        S21.log(name(target) + " was struck a second time!");
                    }
                }
            } catch (e) {}
        };
        const _s21B_AIUE = Game_Action.prototype.applyItemUserEffect;
        Game_Action.prototype.applyItemUserEffect = function (target) {
            const r = _s21B_AIUE.call(this, target);
            try {
                const subject = (typeof this.subject === "function") ? this.subject() : null;
                const item = (typeof this.item === "function") ? this.item() : null;
                if (!subject || !item || !S21.isGanjukoBattler(subject) || !inBattle()) return r;
                // Fisher's Dividend: using a Water move arms the catch.
                if (item.damage && item.damage.elementId === 3 && activeIs(subject, "fishers-dividend")) {
                    S21.store(subject).misc.hasCatch = true;
                }
                // Echo Dancer: dance moves are copied by every bearer.
                if (S21.skillTags(item).includes("dance")) {
                    for (const b of S21.allStanding()) {
                        if (b !== subject && activeIs(b, "echo-dancer") && typeof b.isAlive === "function" && b.isAlive()) {
                            S21.banner(b, "echo-dancer");
                            for (const e of item.effects || []) {
                                if (e.code === 31 && S21.STAGE_OF_PARAM[e.dataId]) {
                                    S21.applyStageChange(b, S21.STAGE_OF_PARAM[e.dataId], 1, null, { selfInflicted: true });
                                }
                            }
                        }
                    }
                }
            } catch (e) {}
            return r;
        };
    }
    S21._status.framework = true;
})();
// === END Section 21 Part B2 — ability framework core ===


// ============================================================================
// SECTION 21 Part B3 — ABILITY HOOK DISPATCH + THE 316 IMPLEMENTATIONS
// ============================================================================
// Entry / end-of-turn / KO / faint dispatchers, the pre-move gate, passive
// param rates, priority (speed) adjustments, MP tax, item block, escape
// rules, doubles draw-in, Perfect Mimic / Borrowed Face surface wraps, the
// AI scorer extension, and S21.ABILITY_IMPL — the per-entry implementation
// table for all 316 library entries (declarative where the framework's
// vocabulary suffices, fn hooks where it does not).
(() => {
    "use strict";
    const GE = window.GanjukoEngine;
    if (!GE || !GE.S21) return;
    const S21 = GE.S21;
    const br = () => S21.battleRandom();
    const brChance = (p) => br() < p;
    const name = (b) => S21.battlerName(b);
    const activeIs = (b, id) => S21.abilityActive(b) === id;
    const implOf = (b) => { const id = S21.abilityActive(b); return id ? (S21.ABILITY_IMPL[id] || null) : null; };
    const turnNow = () => S21.turnNow();
    function healOf(b, frac) { return Math.max(1, Math.floor(b.mhp * frac)); }
    function doHeal(b, frac) {
        if (!b || typeof b.isAlive !== "function" || !b.isAlive()) return;
        let amt = healOf(b, frac);
        if (activeIs(b, "bloom-renewal")) amt = Math.floor(amt * 1.5);
        try { b.gainHp(amt); } catch (e) {}
    }
    function foeSkills(b) {
        const ids = new Set();
        try { if (typeof b.skills === "function") for (const s of b.skills()) if (s && s.id) ids.add(s.id); } catch (e) {}
        try { if (Array.isArray(b._ganjukoPoolSkills)) for (const id of b._ganjukoPoolSkills) ids.add(id); } catch (e) {}
        try {
            const data = (typeof b.enemy === "function") ? b.enemy() : null;
            if (data && Array.isArray(data.actions)) for (const a of data.actions) if (a && a.skillId) ids.add(a.skillId);
        } catch (e) {}
        return Array.from(ids);
    }
    function skillById(id) {
        try { if (typeof $dataSkills !== "undefined" && $dataSkills && $dataSkills[id]) return $dataSkills[id]; } catch (e) {}
        return null;
    }

    // ------------------------------------------------------------ entry
    S21.onEntry = function (b) {
        const st = S21.store(b);
        const m = st.misc;
        m.enteredTurn = turnNow();
        m.turnsInBattle = 0;
        m.paletteUsed = false;
        if (!S21._leadsMarked) {
            S21._leadsMarked = true;
            for (const x of S21.allStanding()) { try { S21.store(x).misc.leadEntry = true; } catch (e) {} }
        }
        const ab = S21.abilityActive(b);
        const imp = implOf(b);
        if (ab && imp) {
            if (imp.entry) {
                const e = imp.entry;
                let acted = false;
                if (e.sky) { S21.setSky(e.sky, b); acted = true; }
                if (e.aura) { S21.setAura(e.aura, 5); acted = true; }
                if (e.first && m.enteredOnce) { /* first-entry effects skip re-entries */ }
                else {
                    if (e.self) for (const k of Object.keys(e.self)) { S21.applyStageChange(b, k, e.self[k], null, { selfInflicted: true }); acted = true; }
                    if (e.foes) {
                        for (const f of S21.foesOf(b)) {
                            for (const k of Object.keys(e.foes)) S21.applyStageChange(f, k, e.foes[k], b, { entryEffect: true });
                        }
                        acted = true;
                    }
                }
                if (acted) S21.banner(b, ab);
                if (e.first) m.enteredOnce = true;
            }
            if (typeof imp.entryFn === "function") { try { imp.entryFn(b, S21); } catch (e) {} }
        }
        // Venom Rubble entry hazard on this battler's side.
        try {
            const f = S21.field;
            const layers = f && f.hazards ? (f.hazards[S21.sideOf(b)] || 0) : 0;
            if (layers > 0 && typeof b.isAlive === "function" && b.isAlive()) {
                const r = S21.applyStatus(null, b, layers >= 2 ? 31 : 4, null);
                if (r.ok) S21.log(name(b) + " was poisoned by the venom rubble!");
            }
        } catch (e) {}
        // Hero Unmasked: the return package, once per battle.
        if (ab === "hero-unmasked" && m.leftOnce && !m.heroDone) {
            m.heroDone = true;
            S21.banner(b, ab);
            S21.applyStageChange(b, "atk", 1, null, { selfInflicted: true });
            S21.applyStageChange(b, "mat", 1, null, { selfInflicted: true });
        }
    };
    S21.onSwitchOut = function (b) {
        const ab = S21.abilityActive(b);
        const m = S21.store(b).misc;
        if (ab === "wild-renewal") S21.cureMajor(b);
        if (ab === "returnbloom") doHeal(b, 1 / 3);
        if (ab === "hero-unmasked") m.leftOnce = true;
        delete m.lockedSkillId; // move locks end on switch (source rule)
        delete m.truantOk;      // loafing parity restarts on entry
        delete m.typeOverride; // Prismflesh / palette forms end on switch
        delete m.doomTurns;    // doom clears on switch (Pokémon rule)
        delete m.disguiseSpeciesId;
    };
    S21.onBattleEnd = function (b) {
        delete b._s21MimicSpeciesId;
        S21._leadsMarked = false;
    };
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.setup === "function") {
        const _s21B_BM_setup = BattleManager.setup;
        BattleManager.setup = function () {
            S21.initField();
            S21._leadsMarked = false;
            return _s21B_BM_setup.apply(this, arguments);
        };
    }

    // ------------------------------------------------------- end of turn
    S21.endOfTurnEffects = function (b) {
        const ab = S21.abilityActive(b);
        const imp = implOf(b);
        const sky = S21.skyActive();
        const aura = S21.auraActive();
        if (imp && imp.eot) {
            const e = imp.eot;
            if (e.heal) { doHeal(b, e.heal); S21.banner(b, ab); }
            if (e.healSky && sky && e.healSky[sky]) doHeal(b, e.healSky[sky]);
            if (e.loseSky && sky && e.loseSky[sky] && activeIs(b, "hexward-body") !== true) {
                try { b.gainHp(-healOf(b, e.loseSky[sky])); } catch (err) {}
            }
            if (e.cure && brChance(e.cure)) {
                if (S21.cureMajor(b)) { S21.banner(b, ab); S21.log(name(b) + " was cured of its status!"); }
            }
            if (e.cureSky && sky === e.cureSky) {
                if (S21.cureMajor(b)) S21.log(name(b) + " was cured of its status!");
            }
        }
        if (imp && typeof imp.eotFn === "function") { try { imp.eotFn(b, S21); } catch (e) {} }
        // Bloom aura: grounded battlers restore 1/16.
        if (aura === "Bloom" && S21.grounded(b) && typeof b.isAlive === "function" && b.isAlive()) {
            doHeal(b, 1 / 16);
        }
    };
    S21.tickMisc = function (b) {
        const st = S21.store(b);
        const m = st.misc;
        m.turnsInBattle = (m.turnsInBattle || 0) + 1;
        if (m.disabled) {
            for (const k of Object.keys(m.disabled)) {
                m.disabled[k]--;
                if (m.disabled[k] <= 0) delete m.disabled[k];
            }
        }
        if (m.doomTurns !== undefined && m.doomTurns !== null && typeof b.isAlive === "function" && b.isAlive()) {
            m.doomTurns--;
            if (m.doomTurns <= 0) {
                delete m.doomTurns;
                S21.log(name(b) + "'s doom counter reached zero!");
                try { b.gainHp(-b.hp); } catch (e) {}
            }
        }
        // Coward's Exit / Sovereign's Exit resolve at turn end.
        if (m.exitWanted) {
            m.exitWanted = false;
            if (typeof b.isAlive === "function" && b.isAlive()) {
                const side = S21.sideOf(b);
                if (side === "enemy") {
                    let wild = true;
                    try { wild = !(typeof $gameTemp !== "undefined" && $gameTemp && $gameTemp._isTrainerBattle); } catch (e) {}
                    if (wild && typeof b.escape === "function") {
                        S21.banner(b, S21.abilityActive(b));
                        S21.log(name(b) + " fled the battle!");
                        try { b.escape(); } catch (e) {}
                    }
                } else {
                    try {
                        const all = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers() : [];
                        const benchIdx = all.findIndex((x, i) => i > 0 && x && typeof x.isAlive === "function" && x.isAlive());
                        if (benchIdx > 0 && all[0] === b) {
                            S21.banner(b, S21.abilityActive(b));
                            $gameParty.swapOrder(0, benchIdx);
                        }
                    } catch (e) {}
                }
            }
        }
    };

    // ------------------------------------------------------------ faints
    S21.onFaint = function (fainted, attacker, skillId) {
        // Witnesses: Soulforge Heart rises on ANY other battler's faint.
        for (const b of S21.allStanding()) {
            if (b !== fainted && typeof b.isAlive === "function" && b.isAlive() && activeIs(b, "soulforge-heart")) {
                S21.applyStageChange(b, "mat", 1, null, {});
                S21.banner(b, "soulforge-heart");
            }
        }
        // Inheritor class: an ally's faint passes its ability on (doubles).
        try {
            for (const b of S21.alliesOf(fainted)) {
                const bAb = S21.abilityActive(b);
                if ((bAb === "inheritor" || bAb === "alchemists-inheritance") &&
                    typeof b.isAlive === "function" && b.isAlive()) {
                    b._s21AbilityOverride = S21.abilityOf(fainted);
                    S21.banner(b, bAb);
                    S21.log(name(b) + " inherited " + name(fainted) + "'s ability!");
                }
            }
        } catch (e) {}
        const imp = implOf(fainted);
        if (imp && typeof imp.faintFn === "function") { try { imp.faintFn(fainted, attacker, S21); } catch (e) {} }
        if (attacker && attacker !== fainted && typeof attacker.isAlive === "function" && attacker.isAlive()) {
            const aImp = implOf(attacker);
            if (aImp) {
                if (aImp.ko) {
                    for (const k of Object.keys(aImp.ko)) S21.applyStageChange(attacker, k, aImp.ko[k], null, {});
                    S21.banner(attacker, S21.abilityActive(attacker));
                }
                if (typeof aImp.koFn === "function") { try { aImp.koFn(attacker, fainted, S21); } catch (e) {} }
            }
        }
    };

    // --------------------------------------------------------- pre-move
    S21.extraActionGate = function (subject, action) {
        if (!subject || !action) return false;
        let item = null;
        try { item = (typeof action.item === "function") ? action.item() : null; } catch (e) {}
        if (!item) return false;
        const sAb = S21.abilityActive(subject);
        // Stillwater Aura: no battler may use explosive moves.
        if (S21.skillTags(item).includes("explosive") && S21.anyStandingWith("stillwater-aura")) {
            S21.log("The still water damped the explosion!");
            return true;
        }
        // Priority blocks: Regal Decree class + Astral aura.
        let prio = (item.speed || 0) > 0;
        if (!prio && sAb === "tricksters-bow" && item.damage && item.damage.type === 0) prio = true;
        if (!prio && sAb === "firstwind" && item.damage && item.damage.elementId === 7 && subject.hp >= subject.mhp) prio = true;
        if (prio && typeof action.isForOpponent === "function" && action.isForOpponent()) {
            if (S21.foesOf(subject).some(f => ["regal-decree", "blinding-mien", "veiltail-decree"].includes(S21.abilityActive(f)))) {
                S21.log("A regal decree blocked the priority move!");
                return true;
            }
            if (S21.auraActive() === "Astral" && S21.foesOf(subject).length &&
                S21.foesOf(subject).every(f => S21.grounded(f))) {
                S21.log("The Astral aura blocked the priority move!");
                return true;
            }
        }
        const imp = implOf(subject);
        if (imp && typeof imp.gateFn === "function") {
            try { if (imp.gateFn(subject, item, S21)) return true; } catch (e) {}
        }
        // Hexed Husk disable lock (Calm Incense covers the bearer + allies).
        const dis = S21.store(subject).misc.disabled;
        if (dis && dis[item.id] > 0) {
            const covered = [subject].concat(S21.alliesOf(subject)).some(a => activeIs(a, "calm-incense"));
            if (!covered) {
                S21.log(name(subject) + "'s " + item.name + " is disabled!");
                return true;
            }
        }
        // Shifting Palette / Shifting Colors: become the move's type.
        if ((sAb === "shifting-palette" || sAb === "shifting-colors") &&
            !S21.store(subject).misc.paletteUsed && item.damage && item.damage.elementId) {
            S21.store(subject).misc.typeOverride = [item.damage.elementId];
            S21.store(subject).misc.paletteUsed = true;
            S21.banner(subject, sAb);
        }
        // Blade-and-Aegis Stance: a per-action stage lens, reverted when
        // the action ends (BattleManager.endAction wrap below).
        if (sAb === "blade-and-aegis-stance") {
            const st = S21.store(subject);
            const damaging = item.damage && item.damage.type > 0;
            const lens = damaging ? { atk: 1, mat: 1, def: -1, mdf: -1 } : { atk: -1, mat: -1, def: 1, mdf: 1 };
            st.misc.lens = lens;
            for (const k of Object.keys(lens)) st[k] = Math.max(-6, Math.min(6, st[k] + lens[k]));
        }
        return false;
    };
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.endAction === "function") {
        const _s21B_BM_endAction = BattleManager.endAction;
        BattleManager.endAction = function () {
            const subject = this._subject;
            const r = _s21B_BM_endAction.call(this);
            try {
                if (subject && subject._ganjukoStages && subject._ganjukoStages.misc.lens) {
                    const st = subject._ganjukoStages;
                    for (const k of Object.keys(st.misc.lens)) st[k] -= st.misc.lens[k];
                    delete st.misc.lens;
                }
            } catch (e) {}
            return r;
        };
    }
    // Trickster's Bow vs Umbra targets + Patient Spores' ability-piercing
    // status: a second gate layer over Part A's state application wrap.
    if (typeof Game_Action !== "undefined" && Game_Action.prototype &&
        typeof Game_Action.prototype.itemEffectAddNormalState === "function") {
        const _s21B_IEANS = Game_Action.prototype.itemEffectAddNormalState;
        Game_Action.prototype.itemEffectAddNormalState = function (target, effect) {
            try {
                const subject = (typeof this.subject === "function") ? this.subject() : null;
                const item = (typeof this.item === "function") ? this.item() : null;
                if (subject && item && item.damage && item.damage.type === 0 && target && S21.isGanjukoBattler(target)) {
                    const sAb = S21.abilityActive(subject);
                    if (sAb === "tricksters-bow" && S21.effectiveTypes(target).includes(8)) {
                        S21.log("It doesn't affect " + name(target) + "!");
                        return;
                    }
                    if (sAb === "patient-spores" && effect && effect.dataId) {
                        // Status moves pierce the target's ability: apply
                        // directly with the ability gate temporarily lifted.
                        const saved = S21.abilityImmuneTo;
                        S21.abilityImmuneTo = function () { return false; };
                        try { return _s21B_IEANS.call(this, target, effect); }
                        finally { S21.abilityImmuneTo = saved; }
                    }
                }
            } catch (e) {}
            return _s21B_IEANS.call(this, target, effect);
        };
    }
    // Bold Spirit / Inward Eye hit-through: Normal and Earth moves strike
    // Umbra-types. The inner chain prices chart immunity as 0; when the
    // only reason for the 0 is that immunity, recompute the strike with
    // the immunity lifted (STAB and the standard roll included).
    S21.recomputeStrike = function (subject, target, item, critical) {
        try {
            const formula = item && item.damage ? item.damage.formula : null;
            if (!formula) return 0;
            const a = { atk: subject.atk, mat: subject.mat, mhp: subject.mhp, hp: subject.hp, mp: subject.mp };
            const b = { def: target.def, mdf: target.mdf, mhp: target.mhp, hp: target.hp };
            const fn = new Function("a", "b", "return (" + String(formula).replace(/[^0-9a-zA-Z_+\-*/(). ]/g, "") + ");");
            let v = Number(fn(a, b)) || 0;
            const el = item.damage.elementId || 1;
            if (S21.effectiveTypes(subject).includes(el)) v *= 1.5;
            if (critical) v *= 1.5;
            v *= 0.85 + br() * 0.15;
            return Math.max(1, Math.floor(v));
        } catch (e) { return 0; }
    };
    if (typeof Game_Action !== "undefined" && Game_Action.prototype &&
        typeof Game_Action.prototype.makeDamageValue === "function") {
        const _s21B_MDV = Game_Action.prototype.makeDamageValue;
        Game_Action.prototype.makeDamageValue = function (target, critical) {
            const value = _s21B_MDV.call(this, target, critical);
            try {
                if (value === 0 && target && S21.isGanjukoBattler(target)) {
                    const subject = (typeof this.subject === "function") ? this.subject() : null;
                    const item = (typeof this.item === "function") ? this.item() : null;
                    if (subject && item && item.damage && item.damage.type > 0 &&
                        [1, 6].includes(item.damage.elementId || 1) &&
                        S21.effectiveTypes(target).includes(8)) {
                        const sAb = S21.abilityActive(subject);
                        if (sAb === "bold-spirit" || sAb === "inward-eye") {
                            return S21.recomputeStrike(subject, target, item, critical);
                        }
                    }
                }
            } catch (e) {}
            return value;
        };
    }

    // ------------------------------------------------- passive param rates
    function paramCondOk(cond, b) {
        if (!cond) return true;
        if (cond === "statused") return S21.majorStatusOf(b) > 0;
        if (cond === "halfOrBelow") return b.hp * 2 <= b.mhp;
        if (cond === "aboveHalf") return b.hp * 2 > b.mhp;
        if (cond.startsWith("sky:")) return S21.skyActive() === cond.slice(4);
        if (cond.startsWith("aura:")) return S21.auraActive() === cond.slice(5);
        return true;
    }
    if (typeof Game_BattlerBase !== "undefined" && Game_BattlerBase.prototype &&
        typeof Game_BattlerBase.prototype.paramRate === "function") {
        const _s21B_paramRate = Game_BattlerBase.prototype.paramRate;
        Game_BattlerBase.prototype.paramRate = function (paramId) {
            let r = _s21B_paramRate.call(this, paramId);
            try {
                if (!S21.isGanjukoBattler(this)) return r;
                if (S21.inBattle()) {
                    // Ruin quartet: field-wide suppression by OTHER bearers.
                    const ruin = { 2: "tablets-of-undoing", 3: "sword-of-undoing", 4: "vessel-of-undoing", 5: "beads-of-undoing" }[paramId];
                    if (ruin && S21.allStanding().some(o => o !== this && activeIs(o, ruin))) r *= 0.75;
                    // Bloomtide Gift: Day sky lifts bearer + allies.
                    if ((paramId === 2 || paramId === 5) && S21.skyActive() === "Day" &&
                        S21.standingOf(this).some(o => activeIs(o, "bloomtide-gift"))) r *= 1.5;
                }
                const imp = implOf(this);
                if (imp) {
                    if (Array.isArray(imp.param)) {
                        for (const rule of imp.param) {
                            if (rule.p === paramId && paramCondOk(rule.if, this)) r *= rule.m;
                        }
                    }
                    if (typeof imp.paramFn === "function") {
                        const m = imp.paramFn(this, paramId, S21);
                        if (typeof m === "number") r *= m;
                    }
                }
            } catch (e) {}
            return r;
        };
    }
    // ------------------------------------------------------- priority
    if (typeof Game_Action !== "undefined" && Game_Action.prototype &&
        typeof Game_Action.prototype.speed === "function") {
        const _s21B_speed = Game_Action.prototype.speed;
        Game_Action.prototype.speed = function () {
            let s = _s21B_speed.call(this);
            try {
                const subject = (typeof this.subject === "function") ? this.subject() : null;
                const item = (typeof this.item === "function") ? this.item() : null;
                if (!subject || !item || !S21.isGanjukoBattler(subject)) return s;
                const imp = implOf(subject);
                if (imp) {
                    if (typeof imp.speed === "number") s += imp.speed;
                    if (typeof imp.speedFn === "function") s += imp.speedFn(subject, item, S21) || 0;
                }
            } catch (e) {}
            return s;
        };
    }
    // ------------------------------------------------------- MP tax
    if (typeof Game_BattlerBase !== "undefined" && Game_BattlerBase.prototype &&
        typeof Game_BattlerBase.prototype.skillMpCost === "function") {
        const _s21B_skillMpCost = Game_BattlerBase.prototype.skillMpCost;
        Game_BattlerBase.prototype.skillMpCost = function (skill) {
            let cost = _s21B_skillMpCost.call(this, skill);
            try {
                if (S21.isGanjukoBattler(this) && S21.inBattle() &&
                    S21.foesOf(this).some(f => activeIs(f, "dread-tax") || activeIs(f, "twin-souled-sovereign"))) {
                    cost *= 2;
                }
            } catch (e) {}
            return cost;
        };
    }
    // ------------------------------------------------------- item block
    if (typeof Game_Party !== "undefined" && Game_Party.prototype &&
        typeof Game_Party.prototype.canUse === "function") {
        const _s21B_canUse = Game_Party.prototype.canUse;
        Game_Party.prototype.canUse = function (item) {
            try {
                if (item && item.consumable && S21.inBattle() &&
                    S21.allStanding().some(o => S21.sideOf(o) === "enemy" &&
                        (activeIs(o, "rattlebones") || activeIs(o, "twin-souled-sovereign")))) {
                    return false;
                }
            } catch (e) {}
            return _s21B_canUse.call(this, item);
        };
    }
    // ------------------------------------------------------- escape rules
    S21.trapBlockedByAbility = function (b) {
        // Foe-side trapping abilities hold this battler in.
        const types = S21.effectiveTypes(b);
        for (const f of S21.foesOf(b)) {
            const fAb = S21.abilityActive(f);
            if (fAb === "umbral-tether" && !types.includes(8)) return true;
            if (fAb === "lodestone-grasp" && types.includes(5)) return true;
            if (fAb === "snareground" && S21.grounded(b)) return true;
        }
        return false;
    };
    if (typeof BattleManager !== "undefined" && BattleManager && typeof BattleManager.processEscape === "function") {
        const _s21B_processEscape = BattleManager.processEscape;
        BattleManager.processEscape = function () {
            try {
                const party = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers() : [];
                const trapped = party.some(m => m && S21.trapBlockedByAbility(m));
                if (trapped) this._escapeRatio = -1;
                else if (party.some(m => m && activeIs(m, "slipaway"))) this._escapeRatio = 999;
            } catch (e) {}
            return _s21B_processEscape.call(this);
        };
    }
    // ------------------------------------------------------- draw-in
    if (typeof Game_Enemy !== "undefined" && Game_Enemy.prototype &&
        typeof Game_Enemy.prototype.makeActions === "function") {
        const _s21B_makeActions = Game_Enemy.prototype.makeActions;
        Game_Enemy.prototype.makeActions = function () {
            _s21B_makeActions.call(this);
            try {
                if (!S21.inBattle() || !this._actions) return;
                const sAb = S21.abilityActive(this);
                if (sAb === "slipstream-wake" || sAb === "unswerving-wake") return;
                const members = (typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.battleMembers() : [];
                if (members.length < 2) return; // draw-in matters in doubles
                for (const act of this._actions) {
                    if (!act || typeof act.isForOpponent !== "function" || !act.isForOpponent()) continue;
                    const item = (typeof act.item === "function") ? act.item() : null;
                    if (!item || !item.damage) continue;
                    const el = item.damage.elementId;
                    const want = el === 5 ? "galvanic-spire" : (el === 3 ? "maelstrom-call" : null);
                    if (!want) continue;
                    const idx = members.findIndex(mm => mm && activeIs(mm, want) && typeof mm.isAlive === "function" && mm.isAlive());
                    if (idx >= 0 && typeof act.setTarget === "function") act.setTarget(idx);
                }
            } catch (e) {}
        };
    }
    // --------------------------------------- mimic + disguise surfaces
    for (const clsName of ["Game_Actor", "Game_Enemy"]) {
        const cls = (typeof window !== "undefined") ? window[clsName] : null;
        if (cls && cls.prototype && typeof cls.prototype.ganjukoSpecies === "function") {
            const orig = cls.prototype.ganjukoSpecies;
            cls.prototype.ganjukoSpecies = function () {
                if (this._s21MimicSpeciesId) return GE.getSpecies(this._s21MimicSpeciesId);
                return orig.call(this);
            };
        }
        if (cls && cls.prototype && typeof cls.prototype.name === "function") {
            const origName = cls.prototype.name;
            cls.prototype.name = function () {
                try {
                    const st = this._ganjukoStages;
                    if (st && st.misc && st.misc.disguiseSpeciesId) {
                        const sp = GE.getSpecies(st.misc.disguiseSpeciesId);
                        if (sp) return sp.name;
                    }
                } catch (e) {}
                return origName.call(this);
            };
        }
    }

    // ------------------------------------------------------- AI scorer
    // v1 §6 + v2 §2.9: stage literacy, status literacy, setup valuation.
    // Wraps the Section 16.4 scorer; the base score still prices damage.
    const STAGE_OF_PARAM_SC = { 2: "atk", 3: "def", 4: "mat", 5: "mdf", 6: "agi" };
    function stageContentOf(skill) {
        const self = [], foe = [];
        for (const e of skill.effects || []) {
            if (e.code === 31 && STAGE_OF_PARAM_SC[e.dataId]) self.push([STAGE_OF_PARAM_SC[e.dataId], 1]);
            if (e.code === 32 && STAGE_OF_PARAM_SC[e.dataId]) foe.push([STAGE_OF_PARAM_SC[e.dataId], -1, 1]);
        }
        if (S21.SELF_STAGE[skill.id]) for (const [k, d] of S21.SELF_STAGE[skill.id]) self.push([k, d]);
        if (S21.FOE_STAGE[skill.id]) for (const [k, d, c] of S21.FOE_STAGE[skill.id]) foe.push([k, d, c]);
        return { self, foe };
    }
    function statWeight(k) { return { atk: 16, mat: 16, agi: 12, def: 10, mdf: 10, acc: 8, eva: 8 }[k] || 8; }
    const _s21B_score = GE.scoreEnemyAction;
    GE.scoreEnemyAction = function (enemy, actionItem, target) {
        const base = _s21B_score.call(this, enemy, actionItem, target);
        try {
            if (!enemy || !S21.isGanjukoBattler(enemy)) return base;
            let skill = null;
            if (typeof actionItem === "number") skill = skillById(actionItem);
            else if (actionItem && actionItem.damage) skill = actionItem;
            else if (actionItem && typeof actionItem.item === "function") skill = actionItem.item();
            else if (actionItem && actionItem.skillId != null) skill = skillById(actionItem.skillId);
            if (!skill) return base;
            const est = S21.store(enemy);
            const tst = target ? S21.store(target) : null;
            const content = stageContentOf(skill);
            const damaging = skill.damage && skill.damage.type > 0;
            // (e) A burned attacker's physical estimates halve (the shared
            // damage path does this live; the scorer mirrors it).
            let score = base;
            if (damaging && skill.hitType === 1 && typeof enemy.isStateAffected === "function" && enemy.isStateAffected(11)) {
                score = base * 0.5;
            }
            // Pure stage moves: value setup by headroom + battle length.
            const isHeal = skill.damage && skill.damage.type === 3 && /mhp/.test(skill.damage.formula || "");
            if (!damaging && !isHeal && (content.self.length || content.foe.length)) {
                let v = 0;
                const hpRate = (typeof enemy.hpRate === "function") ? enemy.hpRate() : (enemy.hp / Math.max(1, enemy.mhp));
                const lengthFactor = hpRate > 0.7 ? 1 : 0.45; // don't set up while dying
                for (const [k, d] of content.self) {
                    const cur = est[k] || 0;
                    const headroom = d > 0 ? (6 - cur) / 6 : (cur + 6) / 6;
                    if (headroom <= 0) continue;
                    v += statWeight(k) * 3.4 * Math.abs(d) * headroom * lengthFactor;
                }
                for (const [k, d, c] of content.foe) {
                    if (!tst) continue;
                    const cur = tst[k] || 0;
                    const headroom = (cur + 6) / 6;
                    if (headroom <= 0) continue;
                    v += statWeight(k) * 2.2 * Math.abs(d) * (c || 1) * headroom;
                }
                return v > 0 ? v * ((skill.successRate || 100) / 100) : 0.5;
            }
            // Damaging moves: foe stage riders add matchup value; capped
            // riders add nothing. Self-drops price at face value already.
            if (damaging && tst && content.foe.length) {
                let add = 0;
                for (const [k, d, c] of content.foe) {
                    const cur = tst[k] || 0;
                    if (cur <= -6) continue;
                    let relevance = 0.7;
                    try {
                        if (k === "atk") relevance = target.atk >= target.mat ? 1 : 0.4;
                        if (k === "mat") relevance = target.mat >= target.atk ? 1 : 0.4;
                        if (k === "def") relevance = enemy.atk >= enemy.mat ? 1 : 0.4;
                        if (k === "mdf") relevance = enemy.mat >= enemy.atk ? 1 : 0.4;
                    } catch (e) {}
                    add += statWeight(k) * 1.4 * Math.abs(d) * (c || 1) * relevance;
                }
                score += add * ((skill.successRate || 100) / 100);
            }
            // Pure status moves: worthless vs immune / already-statused
            // targets; valued by matchup otherwise (v2 §2.9).
            if (!damaging && skill.effects && skill.effects.some(e => e.code === 21) && target) {
                const stateId = (skill.effects.find(e => e.code === 21) || {}).dataId;
                const gate = S21.canApplyStatus(enemy, target, stateId, skill);
                if (!gate.ok) return 0.5;
                let v = 20;
                try {
                    if (stateId === 11 && target.atk >= target.mat) v += 14;         // burn vs physical
                    if (stateId === 12 && target.agi > enemy.agi) v += 14;          // paralysis vs faster
                    if (stateId === 31) v += (turnNow() <= 2 ? 12 : 4);             // toxic in long battles
                    if (stateId === 10) v *= 0.6;                                    // sleep is short (clock)
                    if (stateId === 8) v *= 0.8;
                } catch (e) {}
                return v * ((skill.successRate || 100) / 100);
            }
            return score;
        } catch (e) { return base; }
    };

    // ------------------------------------------------------- public UI
    S21.abilityLineFor = function (b) {
        const id = S21.abilityOf(b);
        if (!id) return null;
        return { id, name: S21.abilityName(id), desc: S21.abilityDesc(id) };
    };
    S21.dexLineForSpecies = function (sp) {
        if (!sp || !sp.abilities) return "";
        const names = [];
        for (const id of sp.abilities.regular || []) names.push(S21.abilityName(id));
        if (sp.abilities.special) names.push(S21.abilityName(sp.abilities.special));
        if (sp.abilities.signature) names.push(S21.abilityName(sp.abilities.signature));
        return names.join(" · ");
    };
    S21._status.dispatch = true;
})();
// === END Section 21 Part B3 (dispatch) ===


// ============================================================================
// SECTION 21 Part B3b — S21.ABILITY_IMPL: ALL 316 LIBRARY ENTRIES
// ============================================================================
// Declarative rules ({dealt, taken, param, entry, eot, immune, ko, speed})
// are consumed by the Part A/B2/B3 framework seams; fn hooks cover the
// rest. An empty object {} means the entry's machinery lives entirely in
// a framework seam (named in the v13 report). Coverage is test-enforced:
// every library id must appear here AND in S21.ABILITY_LIB.
(() => {
    "use strict";
    const GE = window.GanjukoEngine;
    if (!GE || !GE.S21) return;
    const S21 = GE.S21;
    const brC = (p) => S21.battleRandom() < p;
    const nm = (b) => S21.battlerName(b);
    function foeSkillIds(b) {
        const ids = new Set();
        try { if (typeof b.skills === "function") for (const s of b.skills()) if (s && s.id) ids.add(s.id); } catch (e) {}
        try { if (Array.isArray(b._ganjukoPoolSkills)) for (const id of b._ganjukoPoolSkills) ids.add(id); } catch (e) {}
        try {
            const data = (typeof b.enemy === "function") ? b.enemy() : null;
            if (data && Array.isArray(data.actions)) for (const a of data.actions) if (a && a.skillId) ids.add(a.skillId);
        } catch (e) {}
        return Array.from(ids);
    }
    function skillRec(id) {
        try { if (typeof $dataSkills !== "undefined" && $dataSkills && $dataSkills[id]) return $dataSkills[id]; } catch (e) {}
        return null;
    }
    function skillPowOf(id) { const s = skillRec(id); return s ? S21.skillPow(s) : 0; }

    S21.ABILITY_IMPL = {
        // ------------------------------------------------ ENTRY (24)
        "dread-presence": { entry: { foes: { atk: -1 } } },
        "crushing-depths": { entry: { foes: { atk: -1 } } },
        "dread-twilight": { entry: { foes: { mat: -1 } } },
        "tidal-terror": { entry: { foes: { def: -1 } } },
        "eye-of-the-storm": { entry: { foes: { agi: -1 } } },
        "solar-ascendant": { entry: { self: { mat: 1 } } },
        "jet-stream": { entry: { self: { agi: 1 } } },
        "primordial-core": { entry: { self: { def: 1 } } },
        "architects-decree": { entry: { self: { atk: 1, def: 1, mat: 1, mdf: 1 } } },
        "firstblade-oath": { entry: { self: { atk: 1 }, first: true } },
        "firstwall-oath": { entry: { self: { def: 1 }, first: true } },
        "syrup-haze": { entry: { foes: { eva: -1 }, first: true } },
        "echo-talent": { entryFn(b) {
            for (const f of S21.foesOf(b)) {
                const fid = S21.abilityOf(f);
                if (!fid) continue;
                const tier = (S21.ABILITY_LIB[fid] || {}).tier;
                if (tier === "signature" || tier === "apex") continue;
                b._s21AbilityOverride = fid;
                S21.banner(b, "echo-talent");
                S21.log(nm(b) + " copied " + nm(f) + "'s " + S21.abilityName(fid) + "!");
                return;
            }
        } },
        "cold-reading": { entryFn(b) {
            const foes = S21.foesOf(b).filter(f => typeof f.isAlive !== "function" || f.isAlive());
            if (!foes.length) return;
            let t = foes[0];
            for (const f of foes) if ((f.def + f.mdf) < (t.def + t.mdf)) t = f;
            S21.banner(b, "cold-reading");
            S21.applyStageChange(b, t.def < t.mdf ? "atk" : "mat", 1, null, { selfInflicted: true });
        } },
        "threatsense": { entryFn(b) {
            const types = S21.effectiveTypes(b);
            for (const f of S21.foesOf(b)) {
                for (const id of foeSkillIds(f)) {
                    const s = skillRec(id);
                    if (!s || !s.damage || s.damage.type === 0) continue;
                    const el = s.damage.elementId || 1;
                    let rate = 1;
                    for (const t of types) rate *= (GE.GANJUKO_TYPE_CHART[el] || {})[t] !== undefined ? GE.GANJUKO_TYPE_CHART[el][t] : 1;
                    if (rate > 1 || S21.skillPow(s) >= 130) {
                        S21.banner(b, "threatsense");
                        S21.log(nm(b) + " shuddered — a dangerous move is near!");
                        return;
                    }
                }
            }
        } },
        "dreamreading": { entryFn(b) {
            let best = null, bestPow = -1;
            for (const f of S21.foesOf(b)) {
                for (const id of foeSkillIds(f)) {
                    const p = skillPowOf(id);
                    if (p > bestPow) { bestPow = p; best = skillRec(id); }
                }
            }
            if (best) {
                S21.banner(b, "dreamreading");
                S21.log(nm(b) + " foresaw the foe's " + best.name + "!");
            }
        } },
        "borrowed-face": {
            entryFn(b) {
                try {
                    const roster = S21.sideOf(b) === "actor"
                        ? ((typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers() : [])
                        : ((typeof $gameTroop !== "undefined" && $gameTroop) ? $gameTroop.members() : []);
                    const last = roster[roster.length - 1];
                    if (last && last !== b && typeof last.ganjukoSpeciesId === "function") {
                        S21.store(b).misc.disguiseSpeciesId = last.ganjukoSpeciesId();
                    }
                } catch (e) {}
            },
            onHitFn(ctx) { delete S21.store(ctx.target).misc.disguiseSpeciesId; }
        },
        "perfect-mimic": { entryFn(b) {
            const foe = S21.foesOf(b).find(f => typeof f.isAlive !== "function" || f.isAlive());
            if (!foe || typeof foe.ganjukoSpeciesId !== "function") return;
            b._s21MimicSpeciesId = foe.ganjukoSpeciesId();
            const fs = S21.store(foe), bs = S21.store(b);
            for (const k of ["atk", "def", "mat", "mdf", "agi", "acc", "eva"]) bs[k] = fs[k];
            const fid = S21.abilityOf(foe);
            if (fid) b._s21AbilityOverride = fid;
            try { if (b.hp > b.mhp) b.hp = b.mhp; } catch (e) {}
            S21.banner(b, "perfect-mimic");
            S21.log(nm(b) + " transformed into " + nm(foe) + "!");
        } },
        "veilsweeper": { entryFn(b) { S21.banner(b, "veilsweeper"); } }, // no screens exist in Ganjuko (see report)
        "shell-tonic": { entryFn(b) {
            let any = false;
            for (const a of S21.alliesOf(b)) {
                const st = S21.store(a);
                for (const k of ["atk", "def", "mat", "mdf", "agi", "acc", "eva"]) {
                    if (st[k] !== 0) { st[k] = 0; any = true; }
                }
            }
            if (any) { S21.banner(b, "shell-tonic"); S21.log("Ally stage changes were reset!"); }
        } },
        "watchdogs-pride": {}, // Part A entry-effect inversion + trap seam
        "shared-ledger": { entryFn(b) {
            const ally = S21.alliesOf(b).find(a => {
                const st = S21.store(a);
                return ["atk", "def", "mat", "mdf", "agi", "acc", "eva"].some(k => st[k] !== 0);
            });
            if (!ally) return;
            const as = S21.store(ally), bs = S21.store(b);
            for (const k of ["atk", "def", "mat", "mdf", "agi", "acc", "eva"]) bs[k] = as[k];
            S21.banner(b, "shared-ledger");
        } },
        "hearthwelcome": { entryFn(b) {
            const ally = S21.alliesOf(b).find(a => typeof a.isAlive === "function" && a.isAlive());
            if (!ally) return;
            S21.banner(b, "hearthwelcome");
            try { ally.gainHp(Math.max(1, Math.floor(ally.mhp / 4))); } catch (e) {}
        } },
        "aspect-of-the-masks": { entryFn(b) {
            let aspect = "atk", best = -1;
            try {
                const sp = (typeof b.ganjukoSpecies === "function") ? b.ganjukoSpecies() : null;
                const bs = sp && sp.baseStats ? sp.baseStats : null;
                if (bs) {
                    for (const [pid, key] of [[2, "atk"], [3, "def"], [5, "mdf"], [6, "agi"]]) {
                        if ((bs[pid] || 0) > best) { best = bs[pid] || 0; aspect = key; }
                    }
                }
            } catch (e) {}
            S21.banner(b, "aspect-of-the-masks");
            S21.applyStageChange(b, aspect, 1, null, { selfInflicted: true });
        } },

        // ------------------------------------------------ END OF TURN (13)
        "quickening": { eotFn(b) {
            if ((S21.store(b).misc.turnsInBattle || 0) < 1) return; // not on the entry turn
            S21.applyStageChange(b, "agi", 1, null, {});
            S21.banner(b, "quickening");
        } },
        "nightwell": { eot: { healSky: { Night: 1 / 16 } } },
        "sloughskin": { eot: { cure: 0.30 } },
        "world-roots": { eot: { cure: 0.30 } },
        "rainwash": { eot: { cureSky: "Night" } },
        "stormmend": { eot: { healSky: { Tempest: 1 / 16 } } },
        "dawn-radiance": { eot: { heal: 1 / 8 } },
        "radiant-plume": { eot: { heal: 1 / 10 } },
        "toxinbloom": {}, // Part A trait-chip seam (heals instead of slipping)
        "parchhide": {
            eot: { healSky: { Night: 1 / 8 }, loseSky: { Day: 1 / 8 } },
            takenFn(ctx) {
                if (ctx.element === 3) { // Water heals it
                    S21.store(ctx.target).misc.pendingAbsorb = { kind: "heal", frac: 0.25, ability: "parchhide" };
                    return 0;
                }
                if (ctx.element === 2) return 1.25; // Fire bites deeper
                return null;
            }
        },
        "nightmare-tithe": { eotFn(b) {
            for (const f of S21.foesOf(b)) {
                if (typeof f.isAlive === "function" && f.isAlive() && S21.majorStatusOf(f) === 10) {
                    S21.chipDamage(f, Math.max(1, Math.floor(f.mhp / 8)), b);
                }
            }
        } },
        "field-medic": { eotFn(b) {
            if (!brC(0.30)) return;
            for (const a of S21.alliesOf(b)) {
                if (S21.cureMajor(a)) { S21.banner(b, "field-medic"); return; }
            }
        } },
        "weatherheart": { eotFn(b) {
            const keys = ["atk", "def", "mat", "mdf", "agi"];
            const up = keys[Math.floor(S21.battleRandom() * keys.length)];
            let dn = keys[Math.floor(S21.battleRandom() * keys.length)];
            if (dn === up) dn = keys[(keys.indexOf(up) + 1) % keys.length];
            S21.banner(b, "weatherheart");
            S21.applyStageChange(b, up, 2, null, {});
            S21.applyStageChange(b, dn, -1, null, {});
        } },

        // ------------------------------------------------ DAMAGE DEALT (57)
        "musk-haze": {},        // B2 on-hit queue (flinch rider)
        "fortunes-smile": {},   // B2 riderChanceMult x2
        "thornsurge": { dealt: [{ el: 4, m: 1.5, if: "pinch" }] },
        "hiveheart": { dealt: [{ el: 4, m: 1.5, if: "pinch" }] },
        "cindersurge": { dealt: [{ el: 2, m: 1.5, if: "pinch" }] },
        "riptide-surge": { dealt: [{ el: 3, m: 1.5, if: "pinch" }] },
        "eternal-flame": { dealt: [{ el: 2, m: 1.5, if: "pinch" }] },
        "skullbastion": {},     // Part A recoil seam
        "pugilists-oath": { dealt: [{ tag: "punch", m: 1.2 }] },
        "true-affinity": {},    // B2 STAB x(2/1.5)
        "chainmaster": {},      // vacuous: no variable-hit moves exist (see report)
        "plainchant": {},       // B2 conversion
        "deadeye-creed": {},    // B2 crit x1.5
        "smallcraft": { dealt: [{ powLE: 60, m: 1.5 }] },
        "loaded-stars": {},     // Part A itemCri (+1 crit stage)
        "unheeding": {},        // Part A makeDamageValue stage-ignore
        "prism-lens": {},       // B2 NVE x2
        "bold-spirit": {},      // Part A entry-ATK block + B3 hit-through
        "all-in-heart": { dealt: [{ recoilMove: true, m: 1.2 }] },
        "brute-clarity": { dealtFn(ctx) {
            const item = ctx.item;
            if (!item) return null;
            const hasRider = ((item.effects || []).some(e => e.code === 21)) ||
                !!S21.FOE_STAGE[item.id] || !!S21.FLINCH_RIDERS[item.id];
            return hasRider ? 1.3 : null;
        } },
        "venom-vigor": { dealtFn(ctx) {
            const st = S21.majorStatusOf(ctx.subject);
            return (st === 4 || st === 31) && ctx.category === 1 ? 1.5 : null;
        } },
        "pyre-vigor": { dealtFn(ctx) {
            return S21.majorStatusOf(ctx.subject) === 11 && ctx.category === 2 ? 1.5 : null;
        } },
        "venomtouch": {},       // B2 on-hit queue
        "lastword-mind": {},    // B2 (documented approximation, see report)
        "ghoststep": {},        // vacuous: no screens/substitutes exist (see report)
        "tempest-force": { dealt: [{ el: 6, m: 1.3, if: "sky:Tempest" }] },
        "crushing-jaws": { dealt: [{ tag: "bite", m: 1.5 }] },
        "frostmantle-touch": {}, // B2 conversion
        "siege-heart": { dealt: [{ tag: "pulse", m: 1.5 }] },
        "rending-claws": { dealt: [{ if: "contact", m: 1.3 }] },
        "stardust-touch": {},   // B2 conversion
        "zephyr-touch": {},     // B2 conversion
        "twofold-bond": {},     // B2 second strike at 25%
        "no-mercy-for-the-sick": {}, // Part A itemCri (always crit vs poisoned)
        "ambush-creed": {},     // B2 (switch-in turn x2)
        "forgeheart": { dealt: [{ el: 6, m: 1.5 }] },
        "quarryheart": { dealt: [{ el: 6, m: 1.5 }] },
        "overcharge-heart": { dealt: [{ el: 5, m: 1.5 }] },
        "starwyrm-maw": { dealt: [{ el: 9, m: 1.5 }] },
        "seismic-heart": { dealt: [{ el: 6, m: 1.3 }] },
        "tempest-wrath": { dealt: [{ el: 5, m: 1.3 }] },
        "starlight-surge": { dealt: [{ el: 9, m: 1.3 }] },
        "magma-core": { dealt: [{ el: 2, m: 1.3 }], immune: [11] },
        "calamity-heart": { dealt: [{ el: 2, m: 1.2 }] },
        "trench-heart": { dealt: [{ el: 3, m: 1.2 }] },
        "sylvan-heart": { dealt: [{ el: 4, m: 1.2 }] },
        "storm-bloom": { dealt: [{ el: 7, m: 1.2 }] },
        "shadow-beak": { dealt: [{ el: 8, m: 1.2 }] },
        "iron-pincer": { dealt: [{ cat: 1, m: 1.2 }] },
        "farhand": {},          // B2 isContact (never makes contact)
        "tidevoice": {},        // B2 conversion (sound -> Water)
        "galvanic-touch": {},   // B2 conversion
        "overmind-edge": {},    // B2 SE x1.25
        "thunderous-verse": { dealt: [{ tag: "sound", m: 1.3 }], taken: [{ tag: "sound", m: 0.5 }] },
        "unseen-hand": {},      // vacuous: no protect-class moves exist (see report)
        "edge-discipline": { dealt: [{ tag: "slicing", m: 1.5 }] },
        "chainvenom": {},       // B2 on-hit queue (30% badly poison)

        // ------------------------------------------------ DAMAGE TAKEN (42)
        "bastion-hide": {},     // Part A itemCri (cannot be crit)
        "carapace-guard": {},   // Part A itemCri
        "last-rampart": {},     // B2 full-HP survival
        "stormcell": {},        // B2 absorb (Volt -> heal 1/4)
        "deepwell": {},         // B2 absorb (Water -> heal 1/4)
        "earthfeast": {},       // B2 absorb (Earth -> heal 1/4)
        "kindled-core": {},     // B2 absorb + kindle flag
        "galvengine": {},       // B2 absorb (Volt -> AGI +1)
        "galvanic-spire": {},   // B2 absorb (Volt -> MAT +1) + B3 draw-in
        "maelstrom-call": {},   // B2 absorb (Water -> MAT +1) + B3 draw-in
        "thornfeast": {},       // B2 absorb (Nature -> ATK +1)
        "kilnbaked-body": {},   // B2 absorb (Fire -> DEF +2)
        "galecrown": {},        // B2 absorb (Wind -> ATK +1)
        "warding-dust": {},     // B2 riderBlocked (no added effects)
        "ninefold-ward": {},    // B2 (only super-effective hits land)
        "skyborne": {},         // B2 (Earth immunity)
        "hushfield": {},        // B2 (sound immunity)
        "shellward": {},        // B2 (ballistic immunity)
        "gravewater": {},       // Part A gainDrainedHp inversion
        "hexward-body": {},     // Part A/B2 indirect-damage immunity seams
        "guardian-stance": {},  // B2 ally reduction x0.75
        "kindred-sense": {},    // B2 ally spread immunity
        "slipskin": {},         // Part A itemHit (status moves x0.5 acc)
        "mirrorward": {},       // Part A application gate (reflect)
        "gilded-immunity": {},  // Part A application gate (status-move immune)
        "sacrificial-veil": {}, // B2 one-time shield
        "frostmask": {},        // B2 one-time physical shield (+ Tempest restore)
        "winterfat": { taken: [{ el: 2, m: 0.5 }, { el: 7, m: 0.5 }] },
        "kilnbody": { taken: [{ el: 2, m: 0.5 }] },
        "aegis-weave": { taken: [{ m: 0.75, if: "se" }] },
        "bedrock-soul": { taken: [{ m: 0.75, if: "se" }] },
        "prismforge-armor": { taken: [{ m: 0.75, if: "se" }] },
        "prism-scales": { taken: [{ m: 0.5, if: "fullhp" }] },
        "eclipseshield": { taken: [{ m: 0.5, if: "fullhp" }] },
        "sovereign-scales": { taken: [{ m: 0.5, if: "fullhp" }] },
        "prismworld-shell": { taken: [{ m: 0.75, if: "fullhp" }] },
        "luxuriant-pelt": { taken: [{ cat: 1, m: 0.5 }] },
        "frostscale-veil": { taken: [{ cat: 2, m: 0.5 }] },
        "aegis-of-ages": { taken: [{ cat: 2, m: 0.75 }] },
        "permafrost-veil": { taken: [{ cat: 1, m: 0.75 }] },
        "bubbleward": { taken: [{ el: 2, m: 0.5 }], dealt: [{ el: 3, m: 2 }], immune: [11] },
        "cloudpelt": { takenFn(ctx) {
            let m = null;
            if (ctx.contact) m = 0.5;
            if (ctx.element === 2) m = (m === null ? 1 : m) * 2;
            return m;
        } },

        // ------------------------------------------------ ON HIT (37)
        // B2 fireOnHit hardcodes the contact-status family, chips, stage
        // reactions, copy/swap, doom, hazards and the crossed-half set.
        "sparksnare": {}, "venomspine": {}, "cinderhide": {}, "dreamspore": {},
        "shardhide": {}, "barbhide": {}, "tarskin": {}, "snarlmane": {},
        "plague-touch": {}, "clinging-perfume": {}, "spirit-exchange": {},
        "doommark-touch": {}, "wrathpoint": {}, "fracture-plate": {},
        "bulwark-growth": {}, "tidepack": {}, "boilerheart": {},
        "stormcharge": {}, "woundcharge": {}, "feverforge": {},
        "retribution": {}, "startle-reflex": {}, "prismflesh": {},
        "hexed-husk": {}, "venom-rubble": {}, "tempest-answer": {},
        "sowsong": {}, "fishers-dividend": {},
        "painflare": {}, "shellwrath": {}, "cellswarm-ascendant": {},
        "cowards-exit": {}, "sovereigns-exit": {}, "unbowed": {},
        "plasma-barbs": { onHitFn(ctx) {
            if (ctx.item && ctx.item.hitType === 1 && brC(0.30)) {
                S21.applyStageChange(ctx.subject, "agi", -1, ctx.target, {});
                S21.banner(ctx.target, "plasma-barbs");
            }
        } },
        "dazing-charm": { onHitFn(ctx) {
            // v2 §2.3 EXCLUDES infatuation (no gender model): the library's
            // infatuation is expressed as confusion (see report).
            if (ctx.contact && brC(0.30)) {
                if (S21.applyStatus(ctx.target, ctx.subject, 8, ctx.item).ok) S21.banner(ctx.target, "dazing-charm");
            }
        } },
        "cottonfall": { onHitFn(ctx) {
            for (const o of S21.allStanding()) {
                if (o !== ctx.target) S21.applyStageChange(o, "agi", -1, ctx.target, {});
            }
            S21.banner(ctx.target, "cottonfall");
        } },

        // ------------------------------------------------ PRE-MOVE (20)
        "manifold-eyes": {},    // Part A itemHit x1.3
        "lantern-gaze": {},     // Part A accBlock + itemHit ignoreEva
        "trueaim-regard": {},   // Part A accBlock + itemHit ignoreEva
        "inward-eye": {},       // Part A + B3 hit-through
        "raptors-regard": {},   // Part A ACC floor + ignoreEva
        "openfield-stance": {}, // Part A itemHit (No Guard both ways)
        "guiding-star": {},     // Part A itemHit x1.1 (self + allies)
        "slacker-heart": { gateFn(b, item) {
            const m = S21.store(b).misc;
            if (m.truantOk === undefined) m.truantOk = true;
            if (!m.truantOk) {
                m.truantOk = true;
                S21.banner(b, "slacker-heart");
                S21.log(nm(b) + " is loafing around!");
                return true;
            }
            m.truantOk = false;
            return false;
        } },
        "lastlight": { speed: -1000 },
        "tricksters-bow": { speedFn(b, item) {
            return item && item.damage && item.damage.type === 0 ? 1000 : 0;
        } }, // + B3 gate treats its status moves as priority class
        "shifting-palette": {}, // B3 extraActionGate type change
        "shifting-colors": {},  // B3 extraActionGate type change
        "blade-and-aegis-stance": {}, // B3 per-action stage lens
        "firstwind": { speedFn(b, item) {
            return item && item.damage && item.damage.elementId === 7 && b.hp >= b.mhp ? 1000 : 0;
        } }, // + B3 gate priority class
        "mercys-haste": { speedFn(b, item) {
            return item && item.damage && item.damage.type === 3 ? 3000 : 0;
        } },
        "regal-decree": {},      // B3 priority block
        "blinding-mien": {},     // B3 priority block
        "veiltail-decree": {},   // B3 priority block
        "sudden-draw": { speedFn() { return brC(0.30) ? 1000 : 0; } },
        "patient-spores": { speedFn(b, item) {
            return item && item.damage && item.damage.type === 0 ? -1000 : 0;
        } }, // ability-piercing status handled in the B3 application wrap

        // ------------------------------------------------ STATUS (35)
        "suppleframe": { immune: [12] },
        "sleepless-vigil": { immune: [10] },
        "undying-spark": { immune: [10] },
        "antivenin": { immune: [4, 31] },
        "own-cadence": { immune: [8] }, // + Part A entry-ATK block
        "tideveil": { immune: [11] },
        "frost-mane": { immune: [11] },
        "magmashell": { immune: [14] },
        "eternal-slumber": { immuneAll: true }, // + Part A pseudo-asleep state
        "saltward-body": { immuneAll: true, taken: [{ el: 8, m: 0.5 }] },
        "blithe-mind": {},      // Part A entry-ATK block
        "stillpoint": {},       // Part A flinch immunity + entry-ATK block
        "shearbrand": {},       // Part A ATK stat-block
        "proudcrest": {},       // Part A DEF stat-block
        "brightbody": {},       // Part A full stat protection
        "pale-shroud": {},      // Part A full stat protection
        "brightforge-body": {}, // Part A full stat protection
        "temporal-sovereignty": {}, // Part A full stat protection (signature)
        "mirror-temper": {},    // Part A stage reversal
        "open-book": {},        // Part A stage doubling
        "defiance": {},         // Part A ATK +2 on foe lowering
        "proud-retort": {},     // Part A MAT +2 on foe lowering
        "mirrorplate": {},      // Part A reflection
        "mirroring-ambition": {}, // Part A foe-raise copy
        "dawnriser": {},        // Part A sleep clock (wakes early)
        "shared-burden": {},    // B2 onStatusApplied reflection
        "puppeteers-venom": {}, // B2 onStatusApplied confusion add
        "canopy-ward": {},      // B2 abilityImmuneTo under Day sky
        "stormproof-coat": {},  // B2 powder immunity
        "petalward": {},        // B2 ally veil (Nature allies)
        "honeyveil": {},        // B2 ally veil (sleep)
        "pastel-ward": {},      // B2 ally veil (poison family)
        "calm-incense": {},     // B3 disable-cover in the pre-move gate
        "rustvenom": {},        // Part A application gate (poison pierces type immunity)
        "toxic-tide": {},       // B2 on-hit queue (10% poison, signature)

        // ------------------------------------------------ PASSIVE (32)
        "dustveil": {},         // Part A itemHit EVA under Tempest
        "stormshroud": {},      // Part A itemHit EVA under Tempest
        "reeling-steps": {},    // Part A itemHit EVA while confused
        "reckless-brawn": { param: [{ p: 2, m: 1.5 }] }, // accuracy x0.8 in Part A itemHit
        "nightcurrent": { param: [{ p: 6, m: 2, if: "sky:Night" }] },
        "sunreacher": { param: [{ p: 6, m: 2, if: "sky:Day" }] },
        "tempest-rush": { param: [{ p: 6, m: 2, if: "sky:Tempest" }] },
        "stormglide": { param: [{ p: 6, m: 2, if: "sky:Tempest" }] },
        "voltrider": { param: [{ p: 6, m: 2, if: "aura:Volt" }] },
        "titans-gift": { param: [{ p: 2, m: 1.5 }] },
        "innocent-might": { param: [{ p: 2, m: 1.5 }] },
        "painfeast": { param: [{ p: 2, m: 1.5, if: "statused" }] }, // burn-cut exemption in Part A
        "lustrous-scales": { param: [{ p: 3, m: 1.5, if: "statused" }] },
        "faltering-crown": { param: [{ p: 2, m: 0.5, if: "halfOrBelow" }, { p: 4, m: 0.5, if: "halfOrBelow" }] },
        "bloomplate": { param: [{ p: 3, m: 1.5, if: "aura:Bloom" }] },
        "sunfeast": { param: [{ p: 4, m: 1.5, if: "sky:Day" }], eot: { loseSky: { Day: 1 / 8 } } },
        "bloomtide-gift": {},   // B3 paramRate (bearer + allies under Day)
        "bloom-renewal": {},    // Part A makeDamageValue (own healing x1.5, signature)
        "anode-soul": { paramFn(b, pid) {
            if (pid !== 4) return null;
            return S21.alliesOf(b).some(a => ["anode-soul", "cathode-soul"].includes(S21.abilityActive(a))) ? 1.5 : null;
        } },
        "cathode-soul": { paramFn(b, pid) {
            if (pid !== 4) return null;
            return S21.alliesOf(b).some(a => ["anode-soul", "cathode-soul"].includes(S21.abilityActive(a))) ? 1.5 : null;
        } },
        "feversteps": { paramFn(b, pid) {
            if (pid !== 6) return null;
            const st = S21.majorStatusOf(b);
            if (st === 12) return 3;   // x1.5 net of the paralysis halving trait
            return st > 0 ? 1.5 : null;
        } },
        "slow-kindling": { paramFn(b, pid) {
            if (pid !== 2 && pid !== 6) return null;
            return (S21.store(b).misc.turnsInBattle || 0) < 5 ? 0.5 : null;
        } },
        "twofold-soul": { paramFn(b, pid) {
            if (b.hp * 2 > b.mhp) return null;
            if (pid === 4 || pid === 5) return 1.3;
            if (pid === 2 || pid === 3) return 0.8;
            return null;
        } },
        "shellfall-stance": {
            param: [{ p: 6, m: 0.8, if: "aboveHalf" }],
            taken: [{ m: 0.75, if: "aboveHalf" }],
            dealt: [{ m: 1.2, if: "halfOrBelow" }]
        },
        "one-as-many": { dealt: [{ m: 1.25, if: "aboveHalf" }], taken: [{ m: 0.8, if: "aboveHalf" }] },
        "living-battery": {},   // B2 ally special x1.3
        "empowering-ground": {}, // B2 ally x1.3
        "forge-anthem": {},     // B2 Earth x1.5 (bearer + allies)
        "single-minded-onslaught": {
            param: [{ p: 2, m: 1.4 }],
            gateFn(b, item) {
                const m = S21.store(b).misc;
                if (!m.lockedSkillId) { m.lockedSkillId = item.id; return false; }
                if (item.id !== m.lockedSkillId) {
                    S21.log(nm(b) + " can only use " + (skillRec(m.lockedSkillId) || {}).name + "!");
                    return true;
                }
                return false;
            }
        },
        "dawnforge-protocol": { paramFn(b, pid) {
            if (S21.skyActive() !== "Day") return null;
            let bestPid = 2, best = -1;
            for (const p of [2, 3, 4, 5, 6]) {
                let v = 0;
                try { v = b.paramBase(p); } catch (e) {}
                if (v > best) { best = v; bestPid = p; }
            }
            if (pid !== bestPid) return null;
            return pid === 6 ? 1.5 : 1.3;
        } },
        "voltforge-protocol": { paramFn(b, pid) {
            if (S21.auraActive() !== "Volt") return null;
            let bestPid = 2, best = -1;
            for (const p of [2, 3, 4, 5, 6]) {
                let v = 0;
                try { v = b.paramBase(p); } catch (e) {}
                if (v > best) { best = v; bestPid = p; }
            }
            if (pid !== bestPid) return null;
            return pid === 6 ? 1.5 : 1.3;
        } },
        "crown-of-the-fallen": { paramFn(b, pid) {
            if (pid !== 2 && pid !== 4) return null;
            let fainted = 0;
            try {
                const roster = S21.sideOf(b) === "actor"
                    ? ((typeof $gameParty !== "undefined" && $gameParty) ? $gameParty.allMembers() : [])
                    : ((typeof $gameTroop !== "undefined" && $gameTroop) ? $gameTroop.members() : []);
                for (const x of roster) if (x && x !== b && typeof x.isDead === "function" && x.isDead()) fainted++;
            } catch (e) {}
            return fainted > 0 ? Math.min(1.5, 1 + 0.1 * fainted) : null;
        } },

        // ------------------------------------------------ FIELD (25)
        "nightrain": { entry: { sky: "Night" } },
        "dawncaller": { entry: { sky: "Day" } },
        "tempestcaller": { entry: { sky: "Tempest" } },
        "tempest-herald": { entry: { sky: "Tempest" } },
        "first-oceans-reign": { entry: { sky: "Night" } },  // Fire nullification in B2 dealt
        "first-suns-reign": { entry: { sky: "Day" } },      // Water nullification in B2 dealt
        "first-storms-reign": { entry: { sky: "Tempest" } }, // weakness removal in B2 dealt
        "voltfield-herald": { entry: { aura: "Volt" } },
        "mindfield-herald": { entry: { aura: "Astral" } },
        "mistfield-herald": { entry: { aura: "Mist" } },
        "bloomfield-herald": { entry: { aura: "Bloom" } },
        "ancient-dawn-pulse": { entry: { sky: "Day" }, param: [{ p: 2, m: 1.3, if: "sky:Day" }] },
        "future-engine": { entry: { aura: "Volt" }, param: [{ p: 4, m: 1.3, if: "aura:Volt" }] },
        "worldstill": { entryFn(b) {
            try { S21.field.aura = null; S21.field.auraTurns = 0; } catch (e) {}
            S21.banner(b, "worldstill");
        } }, // ongoing nullification in B2 sky checks
        "clearsky-mind": {},    // B2 sky/aura nullification while standing
        "stilled-heavens": {},  // B2 sky/aura nullification while standing
        "skyward-guise": {},    // B2 effectiveTypes by Sky
        "fieldmirror": {},      // B2 effectiveTypes by Aura
        "umbral-aura": {},      // B2 auraBoostMult x1.33
        "astral-aura": {},      // B2 auraBoostMult x1.33
        "stillpoint-aura": {},  // B2 auraBoostMult reversal
        "tablets-of-undoing": {}, // B3 paramRate field modifier (ATK)
        "sword-of-undoing": {},   // B3 paramRate field modifier (DEF)
        "vessel-of-undoing": {},  // B3 paramRate field modifier (MAT)
        "beads-of-undoing": {},   // B3 paramRate field modifier (MDF)

        // ------------------------------------------------ SYSTEM (15)
        "stillwater-aura": {},  // B3 pre-move gate (explosive block)
        "anchorhold": {},       // no forced-switch moves exist in Ganjuko (see report)
        "umbral-tether": {},    // B3 trap + escape seams
        "lodestone-grasp": {},  // B3 trap + escape seams
        "snareground": {},      // B3 trap + escape seams
        "dread-tax": {},        // B3 skillMpCost x2
        "slipaway": {},         // B3 processEscape
        "rattlebones": {},      // B3 Game_Party.canUse block
        "wardbreaker": {},      // framework negation (damage/status seams)
        "heavenbrand": {},      // framework negation
        "stormbrand": {},       // framework negation
        "echo-dancer": {},      // B2 applyItemUserEffect wrap (dance copy)
        "slipstream-wake": {},  // B3 draw-in exemption
        "unswerving-wake": {},  // B3 draw-in exemption
        "null-air": {},         // B2 abilityActive suppression

        // ------------------------------------------------ SWITCH (3)
        "wild-renewal": {},     // B3 onSwitchOut cure
        "returnbloom": {},      // B3 onSwitchOut heal 1/3
        "hero-unmasked": {},    // B3 switch-out flag + entry package

        // ------------------------------------------------ KO DEALT (8)
        "bloodsurge": { ko: { atk: 1 } },
        "winter-toll": { ko: { atk: 1 } },
        "soul-tithe": { ko: { atk: 1 } },
        "dread-toll": { ko: { mat: 1 } },
        "bond-ascendant": { ko: { atk: 1, mat: 1, agi: 1 } },
        "triumphant-zenith": { koFn(b) {
            let bestKey = "atk", best = -1;
            for (const [pid, key] of [[2, "atk"], [3, "def"], [4, "mat"], [5, "mdf"], [6, "agi"]]) {
                let v = 0;
                try { v = b.paramBase(pid); } catch (e) {}
                if (v > best) { best = v; bestKey = key; }
            }
            S21.applyStageChange(b, bestKey, 1, null, {});
            S21.banner(b, "triumphant-zenith");
        } },
        "twin-souled-sovereign": { koFn(b) {
            // Variant fixed per species: the higher offensive base stat.
            let atkB = 0, matB = 0;
            try {
                const sp = (typeof b.ganjukoSpecies === "function") ? b.ganjukoSpecies() : null;
                if (sp && sp.baseStats) { atkB = sp.baseStats[2] || 0; matB = sp.baseStats[4] || 0; }
            } catch (e) {}
            S21.applyStageChange(b, atkB >= matB ? "atk" : "mat", 1, null, {});
            S21.banner(b, "twin-souled-sovereign");
        } }, // item block in B3 canUse
        "soul-harvest": { koFn(b) {
            try { b.gainHp(Math.max(1, Math.floor(b.mhp * 0.25))); } catch (e) {}
            S21.banner(b, "soul-harvest");
        } },

        // ------------------------------------------------ KO FAINTED (5)
        "ashes-toll": { faintFn(fainted, attacker) {
            if (!attacker) return;
            if (S21.store(fainted).lastHitContact) {
                S21.chipDamage(attacker, Math.max(1, Math.floor(attacker.mhp / 4)), fainted);
            }
        } },
        "last-tithe": { faintFn(fainted, attacker) {
            if (!attacker) return;
            const amt = S21.store(fainted).misc.hpBeforeHit || 0;
            if (amt > 0) S21.chipDamage(attacker, amt, fainted);
        } },
        "soulforge-heart": {},  // B3 onFaint witness raise
        "inheritor": {},        // B3 onFaint ally copy
        "alchemists-inheritance": {} // B3 onFaint ally copy
    };
    S21._status.impl = true;
})();
// === END Section 21 Part B3b (ABILITY_IMPL) ===

