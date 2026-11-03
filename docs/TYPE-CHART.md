# Ganjuko Type Chart v1 (authoritative for the competitive upgrade)

Type IDs: 1 NORMAL, 2 FIRE, 3 WATER, 4 NATURE, 5 VOLT, 6 EARTH, 7 WIND, 8 UMBRA, 9 ASTRAL.
Element IDs in Skills.json / System.json elements use the SAME numbering
(elements list: "", Normal, Fire, Water, Nature, Volt, Earth, Wind, Umbra, Astral).

Attacker -> non-neutral defender multipliers (everything unlisted = 1.0):

- NORMAL: 0.5 vs EARTH, 0.5 vs ASTRAL, 0 vs UMBRA
- FIRE:   2 vs NATURE, 2 vs UMBRA, 0.5 vs FIRE, 0.5 vs WATER, 0.5 vs EARTH
- WATER:  2 vs FIRE, 2 vs EARTH, 0.5 vs WATER
  (v1.1, 2026-11-01 after sim audit: Water->Nature was 0.5 in v1; the Lv50
  simulator put Water at 32.2% overall win rate, second-worst. Removing the
  Nature resist is the single approved chart change; re-sim before any more.)
- NATURE: 2 vs EARTH, 2 vs WATER, 0.5 vs FIRE, 0.5 vs NATURE, 0.5 vs WIND
- VOLT:   2 vs WATER, 2 vs WIND, 0.5 vs VOLT, 0.5 vs NATURE, 0 vs EARTH
- EARTH:  2 vs VOLT, 2 vs FIRE, 2 vs NORMAL, 0.5 vs NATURE, 0 vs WIND
- WIND:   2 vs NATURE, 2 vs FIRE, 0.5 vs VOLT, 0.5 vs ASTRAL
- UMBRA:  2 vs ASTRAL, 2 vs NATURE, 0.5 vs UMBRA, 0.5 vs FIRE, 0 vs NORMAL
- ASTRAL: 2 vs UMBRA, 2 vs WIND, 2 vs ASTRAL, 0.5 vs NORMAL

Design notes: two immunity pairs (Normal<->Umbra spectral pair, Volt->Earth
grounding, Earth->Wind unreachable). Astral is a glass cannon (hits
Umbra/Wind/itself for 2x, weak to Umbra and itself). Earth is the brute-force
"Fighting" analog (the only type super-effective vs Normal). Fire lights up
Umbra. Every type has 2-3 weaknesses except Volt (1: Earth) and Normal
(1: Earth, + Umbra immunity) — the simulator must flag if Volt or Normal
species over-perform at equal stats, and if Normal-type *moves* underperform
(Normal has no super-effective target; its moves compensate with the highest
base-power formulas in Skills.json — verify in the audit).
