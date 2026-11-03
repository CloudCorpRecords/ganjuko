#!/usr/bin/env node
/**
 * Ganjuko Champions v13 gate simulator (v2 §3 two-stage decomposition).
 *
 * Consumes the SHIPPED data files (Skills.json + GanjukoSpecies.json from
 * the given data dir — the same bytes the OTA publishes), the engine's
 * unified stat model, chart v1.1, STAB 1.5, crit 1/24 x1.5 (v2), damage
 * roll 0.85-1.00, the v13 stage system, and — in Stage B — the v2 status
 * system + the ability framework's declarative core.
 *
 *   Stage A: renorm + learnsets + stages; status application DISABLED.
 *   Stage B: full v2 (status on, abilities on).
 *
 * Gates (v2 §3): Stage A — every type RR in 38-60%, Lv50 TTK 3.0-3.6,
 * one-shot <= 16%, Lv100 TTK >= 2.2. Stage B — per-type RR within 3 pts
 * of Stage A; Stage A absolute bands still hold; status checks 4/8/10;
 * per-ability RR delta <= +8 pts (GenesisOmega <= +12) vs no-ability.
 *
 * Usage: node simulate-v13.mjs <dataDir> [seed] [--stage=A|B|both] [--rrN=40]
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.argv[2];
if (!DATA) { console.error('usage: simulate-v13.mjs <dataDir> [seed] [--stage=..]'); process.exit(1); }
const SEED = Number(process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 20261102);
const flags = process.argv.slice(3).join(' ');
const STAGE = (flags.match(/--stage=([AB]|both|ttk)/) || [])[1] || 'both';
const RRN = Number((flags.match(/--rrN=(\d+)/) || [])[1] || 40);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// ---------- chart v1.1 (identical table to simulate3) ----------
const TYPES = ['', 'Normal', 'Fire', 'Water', 'Nature', 'Volt', 'Earth', 'Wind', 'Umbra', 'Astral'];
const CHART = {};
for (let a = 1; a <= 9; a++) { CHART[a] = {}; for (let d = 1; d <= 9; d++) CHART[a][d] = 1; }
const setMult = (atk, def, v) => { CHART[atk][def] = v; };
setMult(1, 6, 0.5); setMult(1, 9, 0.5); setMult(1, 8, 0);
setMult(2, 4, 2); setMult(2, 8, 2); setMult(2, 2, 0.5); setMult(2, 3, 0.5); setMult(2, 6, 0.5);
setMult(3, 2, 2); setMult(3, 6, 2); setMult(3, 3, 0.5); setMult(3, 4, 0.5);
setMult(4, 6, 2); setMult(4, 3, 2); setMult(4, 2, 0.5); setMult(4, 4, 0.5);
setMult(5, 3, 2); setMult(5, 7, 2); setMult(5, 5, 0.5); setMult(5, 4, 0.5); setMult(5, 6, 0);
setMult(6, 5, 2); setMult(6, 2, 2); setMult(6, 1, 2); setMult(6, 4, 0.5); setMult(6, 7, 0);
setMult(7, 4, 2); setMult(7, 2, 2); setMult(7, 5, 0.5); setMult(7, 9, 0.5);
setMult(8, 9, 2); setMult(8, 4, 2); setMult(8, 8, 0.5); setMult(8, 2, 0.5); setMult(8, 1, 0);
setMult(9, 8, 2); setMult(9, 7, 2); setMult(9, 9, 2); setMult(9, 1, 0.5);
CHART[3][4] = 1;

// ---------- data ----------
const speciesArr = JSON.parse(fs.readFileSync(path.join(DATA, 'GanjukoSpecies.json'), 'utf8'));
const skillsArr = JSON.parse(fs.readFileSync(path.join(DATA, 'Skills.json'), 'utf8'));
const skillById = new Map(skillsArr.filter(Boolean).map((s) => [s.id, s]));

// ---------- unified stats ----------
function unifiedParam(bs, paramId, level) {
  const L = Math.max(1, Math.min(100, level | 0));
  const mult = 0.30 + L * 0.034;
  switch (paramId) {
    case 0: return Math.max(1, Math.floor(bs.hp * mult) + L + 5);
    case 2: return Math.max(1, Math.floor(bs.atk * mult) + 5);
    case 3: return Math.max(1, Math.floor(bs.def * mult) + 5);
    case 4: return Math.max(1, Math.floor(bs.mat * mult) + 5);
    case 5: return Math.max(1, Math.floor(bs.mdf * mult) + 5);
    case 6: return Math.max(1, Math.floor(bs.agi * mult) + 5);
    default: return 10;
  }
}
const statsAt = (bs, level) => ({
  mhp: unifiedParam(bs, 0, level), atk: unifiedParam(bs, 2, level), def: unifiedParam(bs, 3, level),
  mat: unifiedParam(bs, 4, level), mdf: unifiedParam(bs, 5, level), agi: unifiedParam(bs, 6, level),
});

// ---------- formulas / POW / stage content ----------
const STAT_PROPS = new Set(['mhp', 'mmp', 'hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk']);
function compileFormula(formula) {
  const src = String(formula ?? '0');
  const expr = src.replace(/\b([ab])\.(\w+)/g, (m, side, prop) => {
    if (!STAT_PROPS.has(prop)) throw new Error(`Bad stat prop: ${src}`);
    return `${side === 'a' ? 'A' : 'B'}.${prop}`;
  });
  if (!/^[\d\s+\-*/().ab]+$/.test(src.replace(/\b[ab]\.\w+/g, ''))) throw new Error(`Unsafe: ${src}`);
  return new Function('A', 'B', `return (${expr});`);
}
const FN = new Map();
for (const s of skillsArr) if (s && s.damage) { try { FN.set(s.id, compileFormula(s.damage.formula)); } catch (e) { FN.set(s.id, () => 0); } }
function powOf(s) {
  if (!s || !s.damage || ![1, 5, 6].includes(s.damage.type)) return 0;
  const m = String(s.damage.formula).match(/a\.(?:atk|mat)\s*\*\s*([0-9.]+)/);
  return m ? Math.round(Number(m[1]) * 100) : 0;
}
// Stage content: one source of truth = data effects + the engine's tables.
const SELF_STAGE = { 7: [['agi', 1]], 60: [['mat', -2]], 61: [['mat', -2]], 68: [['mat', -2]], 70: [['mat', -2]], 72: [['mat', -2]], 71: [['atk', -1], ['def', -1]] };
const FOE_STAGE = { 25: [['acc', -1, 0.30]], 62: [['mdf', -1, 1]], 75: [['atk', -1, 1]], 76: [['mat', -1, 1]], 77: [['def', -1, 0.5]], 78: [['mdf', -1, 0.5]], 79: [['acc', -1, 1]] };
const PARAM_STAGE = { 2: 'atk', 3: 'def', 4: 'mat', 5: 'mdf', 6: 'agi' };
function stageContent(s) {
  const self = [], foe = [];
  for (const e of s.effects || []) {
    if (e.code === 31 && PARAM_STAGE[e.dataId]) self.push([PARAM_STAGE[e.dataId], 1]);
    if (e.code === 32 && PARAM_STAGE[e.dataId]) foe.push([PARAM_STAGE[e.dataId], -1, 1]);
  }
  if (SELF_STAGE[s.id]) self.push(...SELF_STAGE[s.id]);
  if (FOE_STAGE[s.id]) foe.push(...FOE_STAGE[s.id]);
  return { self, foe };
}
const stageMult = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
const accMult = (s) => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));
const HIGH_CRIT = new Set([15, 37, 43]);
const FLINCH_RIDERS = { 8: 0.10, 22: 0.30, 42: 0.20 };
const RECOIL = { 17: 1 / 3, 20: 1 / 3, 50: 1 / 4 };

// ---------- pools (v13, mirrors the engine) ----------
const POOLS = {
  1: { early: [1, 3, 4, 5], mid: [51], late: [53], statusOrHeal: [2, 52, 81] },
  2: { early: [6, 7], mid: [8], late: [9, 27, 28], statusOrHeal: [55] },
  3: { early: [10, 38], mid: [40, 11, 12], late: [13, 30], statusOrHeal: [] },
  4: { early: [14], mid: [15, 78], late: [32], statusOrHeal: [16, 31, 84] },
  5: { early: [18], mid: [19, 35], late: [33], statusOrHeal: [83] },
  6: { early: [24], mid: [25], late: [63, 77, 26, 37, 36], statusOrHeal: [57, 79, 80] },
  7: { early: [21], mid: [22], late: [23], statusOrHeal: [74] },
  8: { early: [41], mid: [43], late: [42, 46, 44], statusOrHeal: [45, 82] },
  9: { early: [], mid: [47, 76, 48], late: [49], statusOrHeal: [73] },
};
const TIER_LEVEL = { early: 1, mid: 10, late: 26, statusOrHeal: 6 };
const COVERAGE = { 1: 41, 2: 24, 3: 19, 4: 7, 5: 22, 6: 18, 7: 42, 8: 47, 9: 43 };

// ---------- ability subset (declarative core; coverage printed) ----------
// Mirrors S21.ABILITY_IMPL's balance-relevant rules for the entries the
// sim models; fn-hook exotics (copy/swap, draw-in, doom) are excluded
// and listed in ABILITY_SIM_EXCLUDED. Entry stage drops, absorbs, EoT
// heals/cures, param multipliers, pinch/heart boosts ARE modeled.
const AB = {
  dealt: {
    'calamity-heart': [[2, 1.2]], 'trench-heart': [[3, 1.2]], 'sylvan-heart': [[4, 1.2]],
    'storm-bloom': [[7, 1.2]], 'shadow-beak': [[8, 1.2]], 'seismic-heart': [[6, 1.3]],
    'tempest-wrath': [[5, 1.3]], 'starlight-surge': [[9, 1.3]], 'magma-core': [[2, 1.3]],
    'forgeheart': [[6, 1.5]], 'quarryheart': [[6, 1.5]], 'overcharge-heart': [[5, 1.5]],
    'starwyrm-maw': [[9, 1.5]], 'bubbleward': [[3, 2]],
  },
  pinch: { 'thornsurge': 4, 'hiveheart': 4, 'cindersurge': 2, 'riptide-surge': 3, 'eternal-flame': 2 },
  takenEl: { 'winterfat': [[2, 0.5], [7, 0.5]], 'kilnbody': [[2, 0.5]], 'bubbleward': [[2, 0.5]], 'saltward-body': [[8, 0.5]] },
  takenCat: { 'luxuriant-pelt': [1, 0.5], 'frostscale-veil': [2, 0.5], 'aegis-of-ages': [2, 0.75], 'permafrost-veil': [1, 0.75] },
  takenSE: { 'aegis-weave': 0.75, 'bedrock-soul': 0.75, 'prismforge-armor': 0.75 },
  takenFullHp: { 'prism-scales': 0.5, 'eclipseshield': 0.5, 'sovereign-scales': 0.5, 'prismworld-shell': 0.75 },
  absorb: { 'stormcell': [5, 'heal'], 'deepwell': [3, 'heal'], 'earthfeast': [6, 'heal'], 'kindled-core': [2, 'kindle'], 'galvengine': [5, 'agi'], 'galvanic-spire': [5, 'mat'], 'maelstrom-call': [3, 'mat'], 'thornfeast': [4, 'atk'], 'kilnbaked-body': [2, 'def2'], 'galecrown': [7, 'atk'] },
  entryFoe: { 'dread-presence': [['atk', -1]], 'crushing-depths': [['atk', -1]], 'dread-twilight': [['mat', -1]], 'tidal-terror': [['def', -1]], 'eye-of-the-storm': [['agi', -1]] },
  entrySelf: { 'solar-ascendant': [['mat', 1]], 'jet-stream': [['agi', 1]], 'primordial-core': [['def', 1]], 'architects-decree': [['atk', 1], ['def', 1], ['mat', 1], ['mdf', 1]], 'firstblade-oath': [['atk', 1]], 'firstwall-oath': [['def', 1]] },
  entrySky: { 'nightrain': 'Night', 'dawncaller': 'Day', 'tempestcaller': 'Tempest', 'tempest-herald': 'Tempest', 'first-oceans-reign': 'Night', 'first-suns-reign': 'Day', 'first-storms-reign': 'Tempest', 'ancient-dawn-pulse': 'Day' },
  entryAura: { 'voltfield-herald': 'Volt', 'mindfield-herald': 'Astral', 'mistfield-herald': 'Mist', 'bloomfield-herald': 'Bloom', 'future-engine': 'Volt' },
  eotHeal: { 'dawn-radiance': 1 / 8, 'radiant-plume': 1 / 10 },
  eotCure: { 'sloughskin': 0.30, 'world-roots': 0.30 },
  param: { 'titans-gift': [[2, 1.5]], 'innocent-might': [[2, 1.5]], 'reckless-brawn': [[2, 1.5]], 'single-minded-onslaught': [[2, 1.4]] },
  statusImmune: { 'suppleframe': [12], 'sleepless-vigil': [10], 'undying-spark': [10], 'antivenin': [4, 31], 'own-cadence': [8], 'tideveil': [11], 'frost-mane': [11], 'magmashell': [14], 'magma-core': [11], 'bubbleward': [11], 'feverforge': [11], 'eternal-slumber': [4, 10, 11, 12, 14, 31], 'saltward-body': [4, 10, 11, 12, 14, 31] },
};
const ABILITY_SIM_COVERED = new Set([
  ...Object.keys(AB.dealt), ...Object.keys(AB.pinch), ...Object.keys(AB.takenEl), ...Object.keys(AB.takenCat),
  ...Object.keys(AB.takenSE), ...Object.keys(AB.takenFullHp), ...Object.keys(AB.absorb), ...Object.keys(AB.entryFoe),
  ...Object.keys(AB.entrySelf), ...Object.keys(AB.entrySky), ...Object.keys(AB.entryAura), ...Object.keys(AB.eotHeal),
  ...Object.keys(AB.eotCure), ...Object.keys(AB.param), ...Object.keys(AB.statusImmune),
  'skyborne', 'iron-pincer', 'smallcraft', 'pugilists-oath', 'crushing-jaws', 'siege-heart', 'edge-discipline',
]);

// ---------- views ----------
function buildViews(level) {
  const views = [];
  speciesArr.forEach((s, idx) => {
    const stats = statsAt(s.baseStats, level);
    const learned = new Map();
    for (const l of s.learnings || []) if (l.level <= level && !learned.has(l.skillId)) learned.set(l.skillId, l.level);
    const pool = POOLS[s.type1] || POOLS[1];
    const poolDmg = [];
    for (const tier of ['early', 'mid', 'late']) if (level >= TIER_LEVEL[tier]) poolDmg.push(...pool[tier]);
    const soh = level >= TIER_LEVEL.statusOrHeal ? pool.statusOrHeal : [];
    const strength = (id, foeType) => {
      const sk = skillById.get(id);
      if (!sk || !sk.damage) return 0;
      if (sk.damage.type === 3) return 15;
      if (![1, 5, 6].includes(sk.damage.type)) return 0;
      const self = { ...stats, hp: stats.mhp, mp: 50 };
      let est = 0;
      try { est = Math.max(0, FN.get(id)(self, self) || 0); } catch (e) { est = 0; }
      const stab = s.type1 === (sk.damage.elementId || 0) ? 1.5 : 1;
      const chart = foeType ? CHART[sk.damage.elementId][foeType] : 1;
      return est * stab * chart;
    };
    // §16.5-style best-4: status pick, coverage, 2nd STAB, strongest STAB,
    // then strongest learned/pool fill (mirrors simulate3's replication).
    const chosen = [];
    const push = (id) => { if (id && skillById.has(id) && !chosen.includes(id)) chosen.push(id); };
    const stabSorted = poolDmg.slice().sort((a, b) => strength(a) - strength(b));
    const stabStrongest = stabSorted[stabSorted.length - 1] || 0;
    const stabSecond = stabSorted[stabSorted.length - 2] || 0;
    const coverageId = level >= 8 ? (COVERAGE[s.type1] || 0) : 0;
    const statusPick = soh.length ? soh[soh.length - 1] : 0;
    let learnedBest = 0, learnedBestScore = -1;
    for (const id of learned.keys()) {
      if ([stabStrongest, stabSecond, coverageId, statusPick].includes(id)) continue;
      const sc = strength(id);
      if (sc > learnedBestScore) { learnedBestScore = sc; learnedBest = id; }
    }
    push(statusPick || learnedBest);
    push(coverageId);
    push(stabSecond);
    push(stabStrongest);
    if (chosen.length < 4) {
      const rest = Array.from(new Set([...learned.keys(), ...poolDmg]))
        .filter((id) => !chosen.includes(id))
        .sort((a, b) => strength(b) - strength(a));
      for (const id of rest) { if (chosen.length >= 4) break; chosen.push(id); }
    }
    views.push({
      pos: idx + 1, name: s.name, type1: s.type1, stats, baseStats: s.baseStats,
      abilities: s.abilities || null,
      moves: chosen.slice(-4).map((id) => skillById.get(id)).filter(Boolean),
    });
  });
  return views;
}

// ---------- battle ----------
const MAJOR = [4, 10, 11, 12, 14, 31];
const AB_OFF = new Set((process.env.SIM_OFF || '').split(',').filter(Boolean));
const POWDER = new Set([78, 84]);
function freshStages() { return { atk: 0, def: 0, mat: 0, mdf: 0, agi: 0, acc: 0, eva: 0 }; }
function typeImmune(user, target, stateId, skill) {
  const tt = target.view.type1;
  if (stateId === 11 && tt === 2) return true;
  if (stateId === 12 && (tt === 5 || (skill && skill.damage.elementId === 5 && tt === 6))) return true;
  if ((stateId === 4 || stateId === 31) && tt === 6) return true;
  if (POWDER.has(skill ? skill.id : -1) && tt === 4) return true;
  return false;
}
function canApply(user, target, stateId, skill, field) {
  if (target.hp <= 0) return false;
  if (MAJOR.includes(stateId) && target.major) return false;
  if (typeImmune(user, target, stateId, skill)) return false;
  const imm = AB.statusImmune[target.ability];
  if (imm && imm.includes(stateId)) return false;
  if (field) {
    if (field.aura === 'Volt' && stateId === 10) return false;
    if (field.aura === 'Mist' && MAJOR.includes(stateId) && target.view.type1 !== 7) return false;
  }
  return true;
}
const STATUS_STATS = { applied: {}, takenByType: {} };
function applyStatus(user, target, stateId, skill, R, field) {
  if (!canApply(user, target, stateId, skill, field)) return false;
  STATUS_STATS.applied[stateId] = (STATUS_STATS.applied[stateId] || 0) + 1;
  const tt = target.view.type1;
  STATUS_STATS.takenByType[tt] = (STATUS_STATS.takenByType[tt] || 0) + 1;
  if (MAJOR.includes(stateId)) {
    target.major = stateId;
    target.statusClock = 0;
    if (stateId === 31) target.toxicCounter = 1;
  } else if (stateId === 8) {
    target.confusion = 2 + Math.floor(R() * 4);
  }
  return true;
}
function effStat(b, key) {
  const base = b.view.stats[key === 'hp' ? 'mhp' : key];
  let v = base;
  const pm = AB.param[b.ability];
  if (pm) for (const [pid, m] of pm) if (PARAM_STAGE[pid] === key) v *= m;
  v = Math.floor(v * stageMult(b.stages[key] || 0));
  if (key === 'agi' && b.major === 12) v = Math.floor(v * 0.5);
  return Math.max(1, v);
}
function statBlockSim(b, foe, critOverride) {
  // A/B blocks for formula eval; crit ignores atk-neg + def-pos stages.
  const mk = (x, isAtkSide) => ({
    mhp: x.view.stats.mhp, mmp: 50, hp: x.hp, mp: 50,
    atk: effStat(x, 'atk'), def: effStat(x, 'def'), mat: effStat(x, 'mat'),
    mdf: effStat(x, 'mdf'), agi: effStat(x, 'agi'), luk: 10,
  });
  const A = mk(b, true), B = mk(foe, false);
  if (critOverride) {
    const raw = (x, key) => Math.floor(x.view.stats[key] * (key === 'agi' && x.major === 12 ? 0.5 : 1));
    A.atk = Math.max(raw(b, 'atk'), A.atk); A.mat = Math.max(raw(b, 'mat'), A.mat);
    B.def = Math.min(raw(foe, 'def'), B.def); B.mdf = Math.min(raw(foe, 'mdf'), B.mdf);
  }
  return [A, B];
}
function auraBoost(el, field) {
  if (!field || !field.aura) return 1;
  if (field.aura === 'Volt' && el === 5) return 1.3;
  if (field.aura === 'Astral' && el === 9) return 1.3;
  if (field.aura === 'Mist' && el === 9) return 0.5;
  if (field.aura === 'Bloom' && el === 4) return 1.3;
  return 1;
}
function abilityDealtMult(att, def, skill, ctx) {
  let m = 1;
  if (AB_OFF.has('dealt')) return 1;
  const el = skill.damage.elementId || 1;
  for (const [e2, mult] of AB.dealt[att.ability] || []) if (e2 === el) m *= mult;
  if (AB.pinch[att.ability] === el && att.hp * 3 <= att.view.stats.mhp) m *= 1.5;
  if (att.ability === 'iron-pincer' && skill.hitType === 1) m *= 1.2;
  if (att.ability === 'smallcraft' && powOf(skill) > 0 && powOf(skill) <= 60) m *= 1.5;
  return m;
}
function abilityTakenMult(att, def, skill, ctx) {
  let m = 1;
  if (AB_OFF.has('taken')) return 1;
  const el = skill.damage.elementId || 1;
  for (const [e2, mult] of AB.takenEl[def.ability] || []) if (e2 === el) m *= mult;
  const tc = AB.takenCat[def.ability];
  if (tc && tc[0] === skill.hitType) m *= tc[1];
  if (AB.takenSE[def.ability] && ctx.eff > 1) m *= AB.takenSE[def.ability];
  if (AB.takenFullHp[def.ability] && def.hp >= def.view.stats.mhp) m *= AB.takenFullHp[def.ability];
  return m;
}
function scoreMove(att, def, skill, field, stageB) {
  const sc = stageContent(skill);
  const dmgType = skill.damage ? skill.damage.type : 0;
  if (dmgType === 1 || dmgType === 5 || dmgType === 6) {
    const [A, B] = statBlockSim(att, def, false);
    let raw = 0;
    try { raw = Math.max(0, FN.get(skill.id)(A, B) || 0); } catch (e) { raw = 0; }
    const eff = CHART[skill.damage.elementId][def.view.type1];
    if (eff === 0) return 0.5;
    // abilities are public info (banner + Dex): the scorer knows an
    // absorb / ability immunity makes the move worthless, exactly as
    // it already knows chart immunities above.
    const abKnow = AB.absorb[def.ability];
    if (abKnow && abKnow[0] === skill.damage.elementId) return 0.4;
    if (def.ability === 'skyborne' && skill.damage.elementId === 6) return 0.4;
    const stab = skill.damage.elementId === att.view.type1 ? 1.5 : 1;
    let est = raw * eff * stab * ((skill.successRate ?? 100) / 100);
    if (att.major === 11 && skill.hitType === 1) est *= 0.5;
    est *= abilityDealtMult(att, def, skill, { eff });
    // foe stage riders on damaging moves add matchup value
    for (const [k, d, c] of sc.foe) {
      const head = (def.stages[k] + 6) / 6;
      if (head > 0) est += 14 * (c || 1) * head;
    }
    return est;
  }
  if (dmgType === 3 && /mhp/.test(skill.damage.formula)) {
    const missing = att.view.stats.mhp - att.hp;
    if (missing <= 0 || att.healsUsed >= 3) return 0;
    const [A] = statBlockSim(att, def, false);
    let amt = 0;
    try { amt = Math.max(0, FN.get(skill.id)(A, A) || 0); } catch (e) { amt = 0; }
    return Math.min(missing, amt) * 0.9;
  }
  // pure stage move
  if (sc.self.length || sc.foe.length) {
    let v = 0;
    const lengthF = att.hp / att.view.stats.mhp > 0.7 ? 1 : 0.45;
    for (const [k, d] of sc.self) {
      const head = d > 0 ? (6 - att.stages[k]) / 6 : (att.stages[k] + 6) / 6;
      if (head > 0) v += (k === 'atk' || k === 'mat' ? 16 : 11) * 3.4 * Math.abs(d) * head * lengthF;
    }
    for (const [k, d, c] of sc.foe) {
      const head = (def.stages[k] + 6) / 6;
      if (head > 0) v += 11 * 2.2 * (c || 1) * head;
    }
    return v > 0 ? v * ((skill.successRate ?? 100) / 100) : 0.5;
  }
  // pure status move
  const stateEff = (skill.effects || []).find((e) => e.code === 21);
  if (stateEff) {
    if (!stageB) return 0.5;
    if (!canApply(att, def, stateEff.dataId, skill, field)) return 0.5;
    let v = 20;
    if (stateEff.dataId === 11 && effStat(def, 'atk') >= effStat(def, 'mat')) v += 14;
    if (stateEff.dataId === 12 && effStat(def, 'agi') > effStat(att, 'agi')) v += 14;
    if (stateEff.dataId === 10) v *= 0.6;
    return v * ((skill.successRate ?? 100) / 100);
  }
  return 0.5;
}
function executeMove(att, def, skill, R, field, stageB, stats, abilitiesOn = true) {
  // accuracy with acc/eva stages
  const accStage = att.stages.acc || 0, evaStage = def.stages.eva || 0;
  const hitP = ((skill.successRate ?? 100) / 100) * (accMult(accStage) / accMult(evaStage));
  const sc = stageContent(skill);
  const dmgType = skill.damage ? skill.damage.type : 0;
  if (R() > hitP) {
    if (dmgType === 0) { /* status/stage miss: nothing */ }
    return;
  }
  if (dmgType === 1 || dmgType === 5 || dmgType === 6) {
    const el = skill.damage.elementId || 1;
    const eff = CHART[el][def.view.type1];
    if (eff === 0) return;
    // absorbs
    const ab = AB.absorb[def.ability];
    if (abilitiesOn && !AB_OFF.has('absorb') && ab && ab[0] === el) {
      if (ab[1] === 'heal') def.hp = Math.min(def.view.stats.mhp, def.hp + Math.floor(def.view.stats.mhp / 4));
      else if (ab[1] === 'kindle') def.kindled = true;
      else if (ab[1] === 'agi') def.stages.agi = Math.min(6, def.stages.agi + 1);
      else if (ab[1] === 'mat') def.stages.mat = Math.min(6, def.stages.mat + 1);
      else if (ab[1] === 'atk') def.stages.atk = Math.min(6, def.stages.atk + 1);
      else if (ab[1] === 'def2') def.stages.def = Math.min(6, def.stages.def + 2);
      return;
    }
    if (abilitiesOn && def.ability === 'skyborne' && el === 6) return;
    const critRate = HIGH_CRIT.has(skill.id) ? 1 / 8 : 1 / 24;
    const crit = R() < critRate;
    const [A, B] = statBlockSim(att, def, crit);
    let raw = 0;
    try { raw = Math.max(0, FN.get(skill.id)(A, B) || 0); } catch (e) { raw = 0; }
    let dmg = raw * eff * (el === att.view.type1 ? 1.5 : 1);
    if (crit) dmg *= 1.5;
    dmg *= 0.85 + R() * 0.15;
    if (att.major === 11 && skill.hitType === 1) dmg *= 0.5;
    if (abilitiesOn) {
      dmg *= abilityDealtMult(att, def, skill, { eff });
      dmg *= abilityTakenMult(att, def, skill, { eff });
      dmg *= auraBoost(el, field);
      if (att.kindled && el === 2) dmg *= 1.5;
    }
    dmg = Math.max(1, Math.floor(dmg));
    def.hp -= dmg;
    stats.dmgDealt += dmg;
    if (dmgType === 5) { // drain: 50% (v2 Step 3 correction)
      const healAmt = Math.max(1, Math.floor(dmg * 0.5));
      if (def.ability === 'gravewater' && abilitiesOn) att.hp -= healAmt;
      else att.hp = Math.min(att.view.stats.mhp, att.hp + healAmt);
    }
    if (stageB) {
      // status riders
      for (const e of skill.effects || []) {
        if (e.code === 21 && R() < e.value1) applyStatus(att, def, e.dataId, skill, R, field);
      }
      for (const [k, d, c] of sc.foe) {
        if (R() < (c || 1)) def.stages[k] = Math.max(-6, Math.min(6, def.stages[k] + d));
      }
      if (FLINCH_RIDERS[skill.id] && R() < FLINCH_RIDERS[skill.id]) def.flinch = true;
      if (skill.id === 63 && def.view.type1 !== 8) { def.trapTurns = 4 + Math.floor(R() * 2); }
    } else {
      for (const [k, d, c] of sc.foe) {
        if (R() < (c || 1)) def.stages[k] = Math.max(-6, Math.min(6, def.stages[k] + d));
      }
    }
    for (const [k, d] of sc.self) att.stages[k] = Math.max(-6, Math.min(6, att.stages[k] + d));
    if (RECOIL[skill.id]) {
      const rec = Math.max(1, Math.floor(dmg * RECOIL[skill.id]));
      if (!(abilitiesOn && att.ability === 'skullbastion')) att.hp -= rec;
    }
    if (skill.id === 29) att.recharge = true;
    return;
  }
  if (dmgType === 3 && /mhp/.test(skill.damage.formula)) {
    if (att.healsUsed >= 3) return;
    att.healsUsed++;
    const [A] = statBlockSim(att, def, false);
    let amt = 0;
    try { amt = Math.max(0, FN.get(skill.id)(A, A) || 0); } catch (e) { amt = 0; }
    if (att.ability === 'bloom-renewal' && abilitiesOn) amt = Math.floor(amt * 1.5);
    att.hp = Math.min(att.view.stats.mhp, att.hp + Math.floor(amt));
    return;
  }
  // status / stage moves
  for (const [k, d] of sc.self) att.stages[k] = Math.max(-6, Math.min(6, att.stages[k] + d));
  for (const [k, d, c] of sc.foe) {
    if (R() < (c || 1)) def.stages[k] = Math.max(-6, Math.min(6, def.stages[k] + d));
  }
  if (stageB) {
    for (const e of skill.effects || []) {
      if (e.code === 21 && R() < e.value1) applyStatus(att, def, e.dataId, skill, R, field);
    }
  }
}
function actionGate(b, R) {
  // returns true when the action is cancelled (v2 §2.6 order)
  if (b.recharge) { b.recharge = false; return true; }
  if (b.major === 14) {
    b.statusClock++;
    if (b.statusClock >= 3 || R() < 0.25) { b.major = null; b.statusClock = 0; }
    else return true;
  }
  if (b.major === 10) {
    b.statusClock++;
    if (b.statusClock === 1) return true;
    if (b.statusClock === 2) { if (R() < 1 / 3) { b.major = null; b.statusClock = 0; } else return true; }
    if (b.statusClock >= 3) { b.major = null; b.statusClock = 0; }
  }
  if (b.major === 12 && R() < 0.125) return true;
  if (b.flinch) { b.flinch = false; return true; }
  if (b.confusion !== null && b.confusion !== undefined) {
    b.confusion--;
    if (b.confusion <= 0) { b.confusion = null; }
    else if (R() < 1 / 3) {
      const dmg = Math.max(1, Math.floor((effStat(b, 'atk') * 0.40 - effStat(b, 'def') * 0.16) * (0.85 + R() * 0.15)));
      b.hp -= dmg;
      b.selfHitDmg = (b.selfHitDmg || 0) + dmg;
      b.selfHits = (b.selfHits || 0) + 1;
      return true;
    }
  }
  return false;
}
function endOfTurn(b, foe, R, field, stats, statusOn = true, abilitiesOn = true) {
  if (b.hp <= 0) return;
  if (!statusOn) {
    if (abilitiesOn && !AB_OFF.has('eot')) {
      const heal0 = AB.eotHeal[b.ability];
      if (heal0) b.hp = Math.min(b.view.stats.mhp, b.hp + Math.max(1, Math.floor(b.view.stats.mhp * heal0)));
    }
    return;
  }
  if (b.major === 4) { // poison: trait slip, cannot kill (MZ rule)
    const chip = Math.floor(b.view.stats.mhp / 8);
    b.hp = Math.max(1, b.hp - chip);
    stats.chipDmg += chip; stats.burnChipDmg += 0;
  }
  if (b.major === 11) {
    const chip = Math.floor(b.view.stats.mhp / 16);
    b.hp = Math.max(1, b.hp - chip);
    stats.chipDmg += chip; stats.burnChipDmg += chip;
  }
  if (b.major === 31) {
    const chip = Math.max(1, Math.floor(b.view.stats.mhp * Math.min(b.toxicCounter || 1, 15) / 16));
    b.hp -= chip;
    stats.chipDmg += chip;
    b.toxicCounter = Math.min(15, (b.toxicCounter || 1) + 1);
  }
  if (b.trapTurns > 0) {
    b.hp -= Math.max(1, Math.floor(b.view.stats.mhp / 8));
    stats.chipDmg += Math.floor(b.view.stats.mhp / 8);
    b.trapTurns--;
  }
  if (field && field.aura === 'Bloom' && b.view.type1 !== 7) {
    b.hp = Math.min(b.view.stats.mhp, b.hp + Math.max(1, Math.floor(b.view.stats.mhp / 16)));
  }
  const heal = AB_OFF.has('eot') ? null : AB.eotHeal[b.ability];
  if (heal) b.hp = Math.min(b.view.stats.mhp, b.hp + Math.max(1, Math.floor(b.view.stats.mhp * heal)));
  const cure = AB.eotCure[b.ability];
  if (cure && b.major && R() < cure) b.major = null;
}
function mkBattler(view, R, stageB, abilitiesOn) {
  let ability = null;
  if (abilitiesOn && view.forceAbility) ability = view.forceAbility;
  else if (abilitiesOn && view.abilities) {
    const slots = [...(view.abilities.regular || []),
      ...(view.abilities.special ? [view.abilities.special] : []),
      ...(view.abilities.signature ? [view.abilities.signature] : [])];
    if (slots.length) ability = slots[Math.floor(R() * slots.length)];
  }
  return {
    view, hp: view.stats.mhp, stages: freshStages(), major: null, statusClock: 0,
    toxicCounter: 0, confusion: null, flinch: false, trapTurns: 0, recharge: false,
    ability, healsUsed: 0, kindled: false, acted: false, statusTurns: 0,
    selfHitDmg: 0, selfHits: 0,
  };
}
function entryEffects(b, foe, field) {
  if (AB_OFF.has('entry')) return;
  const foeDrops = AB.entryFoe[b.ability];
  if (foeDrops) for (const [k, d] of foeDrops) foe.stages[k] = Math.max(-6, foe.stages[k] + d);
  const selfUps = AB.entrySelf[b.ability];
  if (selfUps) for (const [k, d] of selfUps) b.stages[k] = Math.min(6, b.stages[k] + d);
  if (field) {
    if (AB.entrySky[b.ability]) field.sky = AB.entrySky[b.ability];
    if (AB.entryAura[b.ability]) { field.aura = AB.entryAura[b.ability]; field.auraTurns = 5; }
  }
}
function battle(viewA, viewB, seed, stageB, abilitiesOn = true) {
  const R = mulberry32(seed);
  const field = { sky: 'Day', aura: null, auraTurns: 0 };
  const A = mkBattler(viewA, R, stageB, abilitiesOn);
  const B = mkBattler(viewB, R, stageB, abilitiesOn);
  if (abilitiesOn) { entryEffects(A, B, field); entryEffects(B, A, field); }
  const stats = { dmgDealt: 0, chipDmg: 0, burnChipDmg: 0 };
  let finalRound = 100;
  for (let round = 1; round <= 100; round++) {
    finalRound = round;
    const order = effStat(B, 'agi') > effStat(A, 'agi') || (effStat(B, 'agi') === effStat(A, 'agi') && R() < 0.5) ? [B, A] : [A, B];
    for (const att of order) {
      const def = att === A ? B : A;
      if (att.hp <= 0 || def.hp <= 0) continue;
      att.acted = true;
      if (stageB && actionGate(att, R)) continue;
      let best = null, bestScore = -Infinity;
      for (const mv of att.view.moves) {
        const sc = scoreMove(att, def, mv, field, stageB);
        if (sc > bestScore) { bestScore = sc; best = mv; }
      }
      if (best) executeMove(att, def, best, R, field, stageB, stats, abilitiesOn);
    }
    if (A.hp <= 0 || B.hp <= 0) break;
    {
      endOfTurn(A, B, R, field, stats, stageB, abilitiesOn);
      endOfTurn(B, A, R, field, stats, stageB, abilitiesOn);
      if (stageB) {
        if (A.major) A.statusTurns++;
        if (B.major) B.statusTurns++;
      }
      if (field.auraTurns > 0) { field.auraTurns--; if (field.auraTurns === 0) field.aura = null; }
    }
    if (A.hp <= 0 || B.hp <= 0) break;
  }
  let winner;
  if (A.hp <= 0 && B.hp <= 0) winner = 0.5;
  else if (B.hp <= 0) winner = 1;
  else if (A.hp <= 0) winner = 0;
  else winner = (A.hp / A.view.stats.mhp) > (B.hp / B.view.stats.mhp) ? 1 : (A.hp / A.view.stats.mhp) < (B.hp / B.view.stats.mhp) ? 0 : 0.5;
  const loser = winner === 1 ? B : winner === 0 ? A : null;
  return {
    winner, rounds: finalRound, loserActed: loser ? loser.acted : true,
    statusTurns: A.statusTurns + B.statusTurns,
    burnChipDmg: stats.burnChipDmg, totalDmg: stats.dmgDealt + stats.chipDmg,
    selfHitDmg: A.selfHitDmg + B.selfHitDmg, selfHits: A.selfHits + B.selfHits,
    atkAvg: (A.view.stats.atk + B.view.stats.atk) / 2, defAvg: (A.view.stats.def + B.view.stats.def) / 2,
  };
}

// ---------- metrics ----------
function ttk(views, stageB, seedBase, pairs = 300, mirrors = 100) {
  const R = mulberry32(seedBase);
  const rounds = [];
  let oneShot = 0;
  for (let i = 0; i < pairs; i++) {
    const a = views[Math.floor(R() * views.length)];
    const b = views[Math.floor(R() * views.length)];
    const r = battle(a, b, seedBase * 100000 + i, stageB);
    rounds.push(r.rounds);
    if (!r.loserActed) oneShot++;
  }
  for (let i = 0; i < mirrors; i++) {
    const a = views[Math.floor(R() * views.length)];
    const r = battle(a, a, seedBase * 200000 + i, stageB);
    rounds.push(r.rounds);
    if (!r.loserActed) oneShot++;
  }
  const mean = rounds.reduce((x, y) => x + y, 0) / rounds.length;
  return { mean: +mean.toFixed(2), oneShotPct: +(100 * oneShot / rounds.length).toFixed(1), n: rounds.length };
}
function roundRobin(views, stageB, seedBase, abilitiesOn = true) {
  const wins = new Map(), games = new Map();
  for (const v of views) { wins.set(v.pos, 0); games.set(v.pos, 0); }
  for (const v of views) {
    const R = mulberry32(seedBase + v.pos * 7919);
    for (let i = 0; i < RRN; i++) {
      let foe = views[Math.floor(R() * views.length)];
      if (foe.pos === v.pos) foe = views[(v.pos) % views.length];
      const seed = seedBase * 1000003 + v.pos * 10007 + i;
      const r = i % 2 === 0 ? battle(v, foe, seed, stageB, abilitiesOn) : battle(foe, v, seed, stageB, abilitiesOn);
      const won = i % 2 === 0 ? r.winner : (r.winner === 1 ? 0 : r.winner === 0 ? 1 : 0.5);
      games.set(v.pos, games.get(v.pos) + 1);
      wins.set(v.pos, wins.get(v.pos) + (won === 1 ? 1 : won === 0.5 ? 0.5 : 0));
    }
  }
  const byType = {};
  for (let t = 1; t <= 9; t++) {
    const members = views.filter((v) => v.type1 === t);
    let w = 0, g = 0;
    for (const m of members) { w += wins.get(m.pos); g += games.get(m.pos); }
    byType[TYPES[t]] = g ? +(100 * w / g).toFixed(1) : null;
  }
  return { byType, wins, games };
}
function abilityDeltas(views, seedBase) {
  const out = [];
  for (const v of views) {
    if (!v.abilities) continue;
    const slots = [...(v.abilities.regular || []), ...(v.abilities.special ? [v.abilities.special] : []), ...(v.abilities.signature ? [v.abilities.signature] : [])];
    if (!slots.length) continue;
    const R = mulberry32(seedBase + v.pos * 104729);
    let wOn = 0, wOff = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      let foe = views[Math.floor(R() * views.length)];
      if (foe.pos === v.pos) foe = views[(v.pos) % views.length];
      const seed = seedBase * 3000017 + v.pos * 50021 + i;
      const rOn = battle(v, foe, seed, true, true);
      const rOff = battle(v, foe, seed, true, false);
      wOn += rOn.winner === 1 ? 1 : rOn.winner === 0.5 ? 0.5 : 0;
      wOff += rOff.winner === 1 ? 1 : rOff.winner === 0.5 ? 0.5 : 0;
    }
    out.push({ pos: v.pos, name: v.name, abilitySlots: slots, deltaPts: +((100 * wOn / N) - (100 * wOff / N)).toFixed(1) });
  }
  return out;
}
function abilityDeltasPerAbility(views, seedBase) {
  const out = [];
  const covered = [...ABILITY_SIM_COVERED];
  for (const abId of covered) {
    const host = views.find((v) => v.abilities && [...(v.abilities.regular || []), v.abilities.special, v.abilities.signature].includes(abId));
    if (!host) continue;
    const forced = { ...host, forceAbility: abId };
    const R = mulberry32(seedBase + host.pos * 31 + abId.length * 7);
    let wOn = 0, wOff = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      let foe = views[Math.floor(R() * views.length)];
      if (foe.pos === host.pos) foe = views[(host.pos) % views.length];
      const seed = seedBase * 7000001 + host.pos * 30011 + i;
      const rOn = battle(forced, foe, seed, true, true);
      const rOff = battle(host, foe, seed, true, false);
      wOn += rOn.winner === 1 ? 1 : rOn.winner === 0.5 ? 0.5 : 0;
      wOff += rOff.winner === 1 ? 1 : rOff.winner === 0.5 ? 0.5 : 0;
    }
    out.push({ ability: abId, hostPos: host.pos, hostName: host.name, deltaPts: +((100 * wOn / N) - (100 * wOff / N)).toFixed(1) });
  }
  return out.sort((a, b) => b.deltaPts - a.deltaPts);
}
function burnFixture(views) {
  // Sacred Fire (54, 50% burn rider) vs a passive target: burn chip
  // share of total damage must stay <= 12% (v2 check 4, sim scale).
  const fire = views.find((v) => v.type1 === 2);
  const tank = views.slice().sort((a, b) => b.stats.mhp - a.stats.mhp)[0];
  const mkView = (base, moveIds) => ({ ...base, moves: moveIds.map((id) => skillById.get(id)).filter(Boolean) });
  const A = mkView(fire, [54]);
  const B = mkView(tank, [1]);
  let chip = 0, total = 0;
  for (let i = 0; i < 100; i++) {
    const r = battle(A, B, 555000 + i, true, false);
    chip += r.burnChipDmg;
    total += r.totalDmg;
  }
  // representative variant: median-HP opponent playing its natural kit
  const sorted = views.slice().sort((a, b) => a.stats.mhp - b.stats.mhp);
  const mid = sorted.filter((v) => v.type1 !== 2)[Math.floor(sorted.length / 2)];
  let chip2 = 0, total2 = 0;
  for (let i = 0; i < 200; i++) {
    const r = battle(A, mid, 556000 + i, true, false);
    chip2 += r.burnChipDmg;
    total2 += r.totalDmg;
  }
  return {
    tankStressChipSharePct: +(100 * chip / Math.max(1, total)).toFixed(1),
    representativeChipSharePct: +(100 * chip2 / Math.max(1, total2)).toFixed(1),
  };
}
function confusionFixture(views) {
  // Both sides spam Water Pulse (11): confusion self-hit damage mean vs
  // the typeless POW-40 analytic benchmark (v2 check 8, sim scale).
  const a = views.find((v) => v.type1 === 3) || views[0];
  const b = views.find((v) => v.type1 === 9) || views[1];
  const mkView = (base) => ({ ...base, moves: [skillById.get(11)] });
  const A = mkView(a), B = mkView(b);
  let dmg = 0, hits = 0;
  for (let i = 0; i < 150; i++) {
    const r = battle(A, B, 777000 + i, true, false);
    dmg += r.selfHitDmg;
    hits += r.selfHits;
  }
  const bench = ((a.stats.atk + b.stats.atk) / 2) * 0.40 - ((a.stats.def + b.stats.def) / 2) * 0.16;
  const expected = Math.max(1, bench * 0.925);
  return { selfHits: hits, meanSelfHit: hits ? +(dmg / hits).toFixed(1) : null, benchmark: +expected.toFixed(1), ratioPct: hits ? +(100 * (dmg / hits) / expected).toFixed(1) : null };
}

// ---------- main ----------
const V12_BASELINE = { Normal: 40.8, Fire: 53.4, Water: 54.7, Nature: 39.8, Volt: 45.9, Earth: 55.9, Wind: 46.2, Umbra: 55.1, Astral: 59.1 };
const results = { seed: SEED, dataDir: DATA };
const views50 = buildViews(50);
if (STAGE === 'ttk') {
  const abOn = process.env.AB !== '0';
  const origBattle = battle;
  const t = (() => {
    // ttk() calls battle(a, b, seed, stageB) with abilitiesOn default true;
    // for the probe we monkey-see via env-driven AB_OFF instead.
    return ttk(views50, process.env.STATUS === '1', SEED + 11);
  })();
  console.log('TTK probe', JSON.stringify({ ttk: t, AB: abOn, STATUS: process.env.STATUS === '1', SIM_OFF: process.env.SIM_OFF || '' }));
  process.exit(0);
}
if (STAGE === 'A' || STAGE === 'both') {
  const t = ttk(views50, false, SEED + 11);
  const rr = roundRobin(views50, false, SEED + 21);
  const views100 = buildViews(100);
  const t100 = ttk(views100, false, SEED + 31, 200, 50);
  results.stageA = { ttk50: t, ttk100: t100, rrByType: rr.byType };
  console.log('\n== STAGE A (renorm only, status application disabled)');
  console.log('Lv50 TTK:', JSON.stringify(t), '| Lv100 TTK:', JSON.stringify(t100));
  console.log('RR by type:', JSON.stringify(rr.byType));
  console.log('vs v12 baselines:', JSON.stringify(Object.fromEntries(Object.keys(V12_BASELINE).map((k) => [k, +(rr.byType[k] - V12_BASELINE[k]).toFixed(1)]))));
}
if (STAGE === 'B' || STAGE === 'both') {
  const t = ttk(views50, true, SEED + 11);
  const rr = roundRobin(views50, true, SEED + 21);
  // status uptime over the RR battles is re-measured on a dedicated pass
  let statusTurns = 0, battles = 0;
  const R = mulberry32(SEED + 77);
  for (let i = 0; i < 400; i++) {
    const a = views50[Math.floor(R() * views50.length)];
    const b = views50[Math.floor(R() * views50.length)];
    const r = battle(a, b, SEED * 500000 + i, true);
    statusTurns += r.statusTurns;
    battles++;
  }
  const deltas = abilityDeltasPerAbility(views50, SEED + 41);
  const over = deltas.filter((d) => d.deltaPts > (d.hostName === 'GenesisOmega' ? 12 : 8));
  results.stageB = {
    ttk50: t, rrByType: rr.byType,
    statusUptimePerBattler: +(statusTurns / (battles * 2)).toFixed(2),
    burnFixture: burnFixture(views50),
    confusionFixture: confusionFixture(views50),
    abilityDeltasOverGate: over,
    abilityDeltaTop10: deltas.slice(0, 10),
    abilityDeltaCount: deltas.length,
    statusApplications: STATUS_STATS,
  };
  console.log('\n== STAGE B (full v2: status + abilities)');
  console.log('Lv50 TTK:', JSON.stringify(t));
  console.log('RR by type:', JSON.stringify(rr.byType));
  if (results.stageA) console.log('RR delta vs Stage A:', JSON.stringify(Object.fromEntries(Object.keys(rr.byType).map((k) => [k, +(rr.byType[k] - results.stageA.rrByType[k]).toFixed(1)]))));
  console.log('status uptime/battler/battle:', results.stageB.statusUptimePerBattler);
  console.log('burn fixture:', JSON.stringify(results.stageB.burnFixture));
  console.log('confusion fixture:', JSON.stringify(results.stageB.confusionFixture));
  console.log(`ability deltas (per-ability, forced): ${deltas.length} modeled abilities measured`);
  console.log('top deltas:', JSON.stringify(deltas.slice(0, 10)));
  console.log('over gate:', JSON.stringify(over));
  console.log('status applications:', JSON.stringify(STATUS_STATS));
}
console.log('\nsim ability coverage (modeled subset):', [...ABILITY_SIM_COVERED].sort().join(','));
fs.writeFileSync(new URL('../../v13/logs/sim-results.json', import.meta.url), JSON.stringify(results, null, 1));
console.log('wrote v13/logs/sim-results.json');
