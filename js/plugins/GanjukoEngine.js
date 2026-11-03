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

            // Face LEFT toward Player Ganjuko!
            this.scale.x = -1.0;
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
        return 8; // Snappy, responsive battle action flow
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
        const drainSpeed = 0.025; // Smooth animated draining

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
            this._expDispRate += (targetExpRate - this._expDispRate) * 0.1;
            needsRedraw = true;
        } else {
            this._expDispRate = targetExpRate;
        }

        const hash = [
            actor ? `${actor.name()}_${actor.level}_${actor.hp}_${actor.mhp}_${actor.mp}_${actor.mmp}` : "none",
            enemy ? `${enemy.name()}_${enemy.ganjukoLevel()}_${enemy.hp}_${enemy.mhp}_${enemy.isAlive()}` : "none",
            $gameParty.allMembers().map(m => `${m.hp}`).join(",")
        ].join("|");

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

            // Numeric HP & remaining Trainer Orbs
            bmp.fontSize = 16;
            bmp.textColor = "#CBD5E1";
            bmp.drawText(`HP: ${enemy.hp} / ${enemy.mhp}`, ex + 16, ey + 72, 180, 24, "left");

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
        let text = "", color = "";
        if (battler.isStateAffected(11)) { text = "BRN"; color = "#EF4444"; } // Burn
        else if (battler.isStateAffected(4)) { text = "PSN"; color = "#A855F7"; } // Poison
        else if (battler.isStateAffected(6)) { text = "PAR"; color = "#F59E0B"; } // Paralyze
        else if (battler.isStateAffected(5)) { text = "SLP"; color = "#64748B"; } // Sleep
        else if (battler.isStateAffected(14)) { text = "FRZ"; color = "#06B6D4"; } // Freeze

        if (text) {
            bmp.fillRect(x, y, 54, 24, color);
            bmp.fontSize = 13;
            bmp.textColor = "#FFFFFF";
            bmp.drawText(text, x, y, 54, 24, "center");
        }
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
        this.drawText(`HP ${actor.hp}/${actor.mhp}`, rect.x + 340, rect.y, rect.width - 345, "right");
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
    const GANJUKO_MOVE_POOLS = {
        1: { early: [1, 3, 4, 5], mid: [51], late: [53], statusOrHeal: [2, 52] },
        2: { early: [6, 7], mid: [8], late: [9, 27, 28, 54], statusOrHeal: [55] },
        3: { early: [10, 38], mid: [58, 11, 12, 40], late: [13, 29, 30, 59, 67, 60, 68], statusOrHeal: [] },
        4: { early: [14], mid: [15], late: [17, 32, 61, 62], statusOrHeal: [16, 31] },
        5: { early: [18], mid: [19, 35], late: [20, 33, 34], statusOrHeal: [] },
        6: { early: [24], mid: [25], late: [26, 37, 63, 36, 56], statusOrHeal: [57] },
        7: { early: [21], mid: [22], late: [23, 64], statusOrHeal: [] },
        8: { early: [41, 45], mid: [42, 43], late: [44, 46, 65, 66, 71, 72], statusOrHeal: [] },
        9: { early: [47], mid: [48], late: [49, 50, 69, 70], statusOrHeal: [] }
    };
    const GANJUKO_POOL_TIER_LEVEL = { early: 1, mid: 10, late: 22, statusOrHeal: 6 };
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
    GanjukoEngine.STAT_MODEL = { intercept: 0.30, perLevel: 0.034, expCoef: 0.083, expPow: 1.6, stadiumBand: 620 };

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
                    return Math.max(1, Math.round(bs4 * Math.pow(Math.max(1, lv), GanjukoEngine.STAT_MODEL.expPow) * GanjukoEngine.STAT_MODEL.expCoef));
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
    const AREA_STEP_MULT = { 3: 3.5, 7: 2.3, 8: 2.5, 11: 2.5, 15: 1.0, 17: 1.0, 19: 1.0, 21: 1.0, 23: 1.0, 25: 0.87 };
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
        const stateNames = { 2: "Guard", 4: "Poison", 5: "Blind", 6: "Silence", 7: "Rage", 8: "Confusion", 9: "Charm", 10: "Sleep", 11: "Burn", 12: "Paralysis", 13: "Stun" };
        const paramNames = { 2: "ATK", 3: "DEF", 4: "MAT", 5: "MDF", 6: "AGI", 7: "LUK" };
        const raises = [], lowers = [];
        for (const e of skill.effects || []) {
            if (e.code === 21 && stateNames[e.dataId]) {
                if (skill.scope >= 1 && skill.scope <= 6) {
                    const pct = Math.round((e.value1 || 0) * 100);
                    if (pct > 0) bits.push("May inflict " + stateNames[e.dataId] + " (" + pct + "%)");
                } else {
                    bits.push("Grants " + stateNames[e.dataId]);
                }
            }
            if (e.code === 31 && paramNames[e.dataId]) raises.push(paramNames[e.dataId]);
            if (e.code === 32 && paramNames[e.dataId]) lowers.push(paramNames[e.dataId]);
        }
        if (raises.length) bits.push("Raises own " + raises.join(" & "));
        if (lowers.length) bits.push("Lowers foe " + lowers.join(" & "));
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
                this._s19Disp[i] = d > t ? Math.max(t, d - 0.025) : Math.min(t, d + 0.025);
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
