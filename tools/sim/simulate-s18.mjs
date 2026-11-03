#!/usr/bin/env node
/**
 * Ganjuko Pass 2 simulator — unified stat model + damage rescale grid search.
 * Dependency-free Node.js. Seeded (mulberry32).
 *
 * Model deltas vs simulate2.mjs:
 *  - Stats come from ONE engine-side formula over GanjukoSpecies.json
 *    baseStats (the proposed GanjukoEngine.unifiedParam), NOT Classes.json
 *    curves. Both sides use it — that is the unification being tested.
 *  - Optional baseStats band normalization by evolution stage (chain
 *    species only; standalones untouched), applied in-sim.
 *  - Skills.json damage formulas (damage.type 1 only) have every numeric
 *    literal scaled by K — a linear transform, so it scales output by K.
 *  - Battle engine otherwise identical to v2: chart v1.1, STAB 1.5,
 *    crit 1.5 @ 1/16, roll 0.85-1.00, greedy EV move choice, Section 16.5
 *    pools built at the battle level, heal cap 3, status utility 30.
 *
 * Metrics: turns-to-KO (rounds to first faint) at Lv 5/10/25/50 from
 * stage-appropriate random pairs + mirror matches; optional Lv50
 * round-robin type win rates for the chosen configuration.
 *
 * Usage: node simulate3.mjs <dataDir> [seed] [--rr] [--k=0.20] [--a0=0.30] [--b=0.034] [--nonorm]
 *   dataDir contains GanjukoSpecies.json, Skills.json, Classes.json.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.argv[2];
if (!DATA) { console.error('usage: simulate3.mjs <dataDir> [seed] [flags]'); process.exit(1); }
const SEED = Number(process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 20261101);
const flags = process.argv.slice(3).join(' ');
const flagVal = (name, dflt) => { const m = flags.match(new RegExp('--' + name + '=([0-9.]+)')); return m ? Number(m[1]) : dflt; };
const DO_RR = flags.includes('--rr');
const NORM = !flags.includes('--nonorm');
const A0 = flagVal('a0', 0.30);      // unifiedParam: mult = A0 + B * level
const B = flagVal('b', 0.034);
const KS = flags.includes('--k=') ? [flagVal('k', 0.2)] : [0.14, 0.16, 0.18, 0.20, 0.22, 0.25, 0.28, 0.32];

// ---------- seeded RNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const randInt = (n) => Math.floor(rng() * n);
const pick = (arr) => arr[randInt(arr.length)];

// ---------- chart v1.1 (verbatim from simulate2) ----------
const TYPES = ['', 'Normal', 'Fire', 'Water', 'Nature', 'Volt', 'Earth', 'Wind', 'Umbra', 'Astral'];
let CHART = {};
for (let a = 1; a <= 9; a++) { CHART[a] = {}; for (let d = 1; d <= 9; d++) CHART[a][d] = 1; }
const setMult = (atk, def, v) => { CHART[atk][def] = v; };
setMult(1, 6, 0.5); setMult(1, 9, 0.5); setMult(1, 8, 0);
setMult(2, 4, 2); setMult(2, 8, 2); setMult(2, 2, 0.5); setMult(2, 3, 0.5); setMult(2, 6, 0.5);
setMult(3, 2, 2); setMult(3, 6, 2); setMult(3, 3, 0.5); setMult(3, 4, 0.5);
setMult(4, 6, 2); setMult(4, 3, 2); setMult(4, 2, 0.5); setMult(4, 4, 0.5); setMult(4, 7, 0.5);
setMult(5, 3, 2); setMult(5, 7, 2); setMult(5, 5, 0.5); setMult(5, 4, 0.5); setMult(5, 6, 0);
setMult(6, 5, 2); setMult(6, 2, 2); setMult(6, 1, 2); setMult(6, 4, 0.5); setMult(6, 7, 0);
setMult(7, 4, 2); setMult(7, 2, 2); setMult(7, 5, 0.5); setMult(7, 9, 0.5);
setMult(8, 9, 2); setMult(8, 4, 2); setMult(8, 8, 0.5); setMult(8, 2, 0.5); setMult(8, 1, 0);
setMult(9, 8, 2); setMult(9, 7, 2); setMult(9, 9, 2); setMult(9, 1, 0.5);
CHART[3][4] = 1; // v1.1: Water -> Nature neutral

// ---------- load data ----------
const speciesArr = JSON.parse(fs.readFileSync(path.join(DATA, 'GanjukoSpecies.json'), 'utf8'));
const skillsArr = JSON.parse(fs.readFileSync(path.join(DATA, 'Skills.json'), 'utf8'));
const classesArr = JSON.parse(fs.readFileSync(path.join(DATA, 'Classes.json'), 'utf8'));

// ---------- stage + normalization ----------
const byId = new Map(speciesArr.map((s) => [s.id, s]));
const preOf = new Map(); // recordId -> recordId of pre-evolution
for (const s of speciesArr) if (s.evolveTo) preOf.set(s.evolveTo, s.id);
function stageOf(id) {
  let d = 1, cur = id; const seen = new Set();
  while (preOf.has(cur) && !seen.has(cur)) { seen.add(cur); cur = preOf.get(cur); d++; }
  return d;
}
function bstOf(bs) { return bs.hp + bs.atk + bs.def + bs.mat + bs.mdf + bs.agi; }
const BANDS = { 1: [130, 215], 2: [215, 325], 3: [295, 380] };
const normLog = [];
function normalizedBase(s) {
  const bs = { ...s.baseStats };
  if (!NORM) return bs;
  const inChain = preOf.has(s.id) || s.evolveTo > 0;
  if (!inChain) return bs; // standalone: untouched
  const st = stageOf(s.id);
  const band = BANDS[Math.min(st, 3)];
  if (!band) return bs;
  const bst = bstOf(bs);
  let f = 1;
  if (bst < band[0]) f = band[0] / bst;
  else if (bst > band[1]) f = band[1] / bst;
  if (f !== 1) {
    for (const k of ['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi']) bs[k] = Math.max(1, Math.round(bs[k] * f));
    normLog.push({ pos: speciesArr.indexOf(s) + 1, name: s.name, stage: st, bstBefore: bst, bstAfter: bstOf(bs), factor: +f.toFixed(3) });
  }
  return bs;
}

// ---------- unified stat model (mirror of the proposed engine code) ----------
function unifiedParam(bs, paramId, level) {
  const L = Math.max(1, Math.min(100, level | 0));
  const mult = A0 + L * B;
  switch (paramId) {
    case 0: return Math.max(1, Math.floor(bs.hp * mult) + L + 5);
    case 1: return Math.max(0, Math.floor((bs.mp || 30) * mult) + 5);
    case 2: return Math.max(1, Math.floor(bs.atk * mult) + 5);
    case 3: return Math.max(1, Math.floor(bs.def * mult) + 5);
    case 4: return Math.max(1, Math.floor(bs.mat * mult) + 5);
    case 5: return Math.max(1, Math.floor(bs.mdf * mult) + 5);
    case 6: return Math.max(1, Math.floor(bs.agi * mult) + 5);
    case 7: return 10 + L;
    default: return 10;
  }
}
// ---------- Section 18 genetics add-on (mirror of the engine wrap) ----------
// paramBase contribution per stat: floor(iv * L / 100) + floor(floor(ev / 4) * L / 100).
// GEN_PROFILE is set per run: { iv: n, evTop: n, evSecond: n } — EVs land on the
// species' two highest baseStats (a trained build), like the design's yield shape.
let GEN_PROFILE = { iv: 16, evTop: 0, evSecond: 0 };
const STATKEYS = ['hp', 'atk', 'def', 'mat', 'mdf', 'agi'];
function geneticsAdd(bs, key, level) {
  const L = Math.max(1, Math.min(100, level | 0));
  const ranked = STATKEYS.slice().sort((a, b) => (bs[b] || 0) - (bs[a] || 0));
  let ev = 0;
  if (key === ranked[0]) ev = GEN_PROFILE.evTop;
  else if (key === ranked[1]) ev = GEN_PROFILE.evSecond;
  return Math.floor(GEN_PROFILE.iv * L / 100) + Math.floor(Math.floor(ev / 4) * L / 100);
}
function statsAt(bs, level) {
  const base = {
    mhp: unifiedParam(bs, 0, level), mmp: unifiedParam(bs, 1, level),
    atk: unifiedParam(bs, 2, level), def: unifiedParam(bs, 3, level),
    mat: unifiedParam(bs, 4, level), mdf: unifiedParam(bs, 5, level),
    agi: unifiedParam(bs, 6, level), luk: unifiedParam(bs, 7, level),
  };
  base.mhp += geneticsAdd(bs, 'hp', level);
  base.atk += geneticsAdd(bs, 'atk', level);
  base.def += geneticsAdd(bs, 'def', level);
  base.mat += geneticsAdd(bs, 'mat', level);
  base.mdf += geneticsAdd(bs, 'mdf', level);
  base.agi += geneticsAdd(bs, 'agi', level);
  return base;
}

// ---------- skills (with K transform) ----------
function scaleFormula(formula, K) {
  return String(formula).replace(/\d+\.?\d*/g, (n) => {
    const v = Math.round(Number(n) * K * 100) / 100;
    return String(v);
  });
}
const STAT_PROPS = new Set(['mhp', 'mmp', 'hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk']);
function compileFormula(formula) {
  const src = String(formula ?? '0');
  const expr = src.replace(/\b([ab])\.(\w+)/g, (m, side, prop) => {
    if (!STAT_PROPS.has(prop)) throw new Error(`Bad stat prop in formula: ${src}`);
    return `${side === 'a' ? 'A' : 'B'}.${prop}`;
  });
  const stripped = src.replace(/\b[ab]\.\w+/g, '');
  if (!/^[\d\s+\-*/().]+$/.test(stripped)) throw new Error(`Unsafe formula: ${src}`);
  return new Function('A', 'B', `return (${expr});`);
}
function classifySkill(skill) {
  if (skill.damage.type === 1) return 'damage';
  if (skill.damage.type === 3 && /mhp/.test(skill.damage.formula)) return 'heal';
  if (skill.damage.type === 3) return 'status';
  return 'other';
}

// ---------- Section 16.5 pools (replicated from simulate2, level-parametrized) ----------
const GANJUKO_MOVE_POOLS = {
  1: { early: [1, 3, 4, 5], mid: [51], late: [53], statusOrHeal: [2, 52] },
  2: { early: [6, 7], mid: [8], late: [9, 27, 28, 54], statusOrHeal: [55] },
  3: { early: [10, 38], mid: [58, 11, 12, 40], late: [13, 29, 30, 59, 67, 60, 68], statusOrHeal: [] },
  4: { early: [14], mid: [15], late: [17, 32, 61, 62], statusOrHeal: [16, 31] },
  5: { early: [18], mid: [19, 35], late: [20, 33, 34], statusOrHeal: [] },
  6: { early: [24], mid: [25], late: [26, 37, 63, 36, 56], statusOrHeal: [57] },
  7: { early: [21], mid: [22], late: [23, 64], statusOrHeal: [] },
  8: { early: [41, 45], mid: [42, 43], late: [44, 46, 65, 66, 71, 72], statusOrHeal: [] },
  9: { early: [47], mid: [48], late: [49, 50, 69, 70], statusOrHeal: [] },
};
const GANJUKO_POOL_TIER_LEVEL = { early: 1, mid: 10, late: 22, statusOrHeal: 6 };
const GANJUKO_COVERAGE = { 1: 41, 2: 24, 3: 19, 4: 7, 5: 22, 6: 18, 7: 42, 8: 47, 9: 43 };
const poolDamagingFor = (typeId, level) => {
  const pool = GANJUKO_MOVE_POOLS[typeId] || GANJUKO_MOVE_POOLS[1];
  const out = [];
  for (const tier of ['early', 'mid', 'late']) if (level >= GANJUKO_POOL_TIER_LEVEL[tier]) out.push(...(pool[tier] || []));
  return out;
};
const poolStatusOrHealFor = (typeId, level) => {
  if (level < GANJUKO_POOL_TIER_LEVEL.statusOrHeal) return [];
  const pool = GANJUKO_MOVE_POOLS[typeId] || GANJUKO_MOVE_POOLS[1];
  if (pool.statusOrHeal && pool.statusOrHeal.length) return pool.statusOrHeal.slice();
  return [2];
};
function engineEvalFormula(formula, stats) {
  if (typeof formula !== 'string' || !formula) return 10;
  let expr = formula.replace(/([ab])\.(\w+)/g, (m, side, key) => {
    const v = stats[key];
    return String(typeof v === 'number' && isFinite(v) ? v : 10);
  });
  expr = expr.replace(/\bv\[\d+\]/g, '0');
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return 10;
  try {
    const val = Function('"use strict"; return (' + expr + ');')();
    return (typeof val === 'number' && isFinite(val)) ? val : 10;
  } catch (e) { return 10; }
}

// ---------- species views per (K, level) ----------
function buildViews(K, level) {
  const skillById = new Map();
  for (const s of skillsArr) {
    if (!s) continue;
    const copy = JSON.parse(JSON.stringify(s));
    if (copy.damage && copy.damage.type === 1) copy.damage.formula = scaleFormula(copy.damage.formula, K);
    skillById.set(copy.id, copy);
  }
  const views = [];
  speciesArr.forEach((s, idx) => {
    const pos = idx + 1;
    const bs = normalizedBase(s);
    const stats = statsAt(bs, level);
    const cls = classesArr[pos]; // engine assigns class at positional index
    const learnset = (cls && cls.learnings ? cls.learnings : []).map((l) => ({ level: l.level, skillId: l.skillId }));
    views.push({
      pos, id: s.id, name: s.name, type1: s.type1, stage: stageOf(s.id),
      inChain: preOf.has(s.id) || s.evolveTo > 0,
      bs, stats, bst: bstOf(bs), learnset, skillById,
    });
  });
  // pools
  for (const sp of views) {
    const typeId = sp.type1;
    const poolDamaging = poolDamagingFor(typeId, level);
    const statusIds = poolStatusOrHealFor(typeId, level);
    const skillStrength = (skillId) => {
      const skill = skillById.get(skillId);
      if (!skill || !skill.damage) return 0;
      if (skill.damage.type === 3) return 15;
      const self = { ...sp.stats, hp: sp.stats.mhp, mp: sp.stats.mmp };
      const est = Math.max(0, engineEvalFormula(skill.damage.formula, self));
      const stab = (sp.type1 === (skill.damage.elementId || 0)) ? 1.5 : 1;
      return est * stab;
    };
    const skillsArr2 = [];
    for (const l of sp.learnset) {
      if (l.level > level) continue;
      if (!skillsArr2.includes(l.skillId)) { skillsArr2.push(l.skillId); skillsArr2.sort((x, y) => x - y); }
      if (skillsArr2.length > 4) skillsArr2.splice(0, skillsArr2.length - 4);
    }
    const learned = new Set(skillsArr2);
    for (const l of sp.learnset) { if (l.level <= level) learned.add(l.skillId); }
    const valid = (id) => skillById.has(id);
    const chosen = [];
    const push = (id) => { if (id && valid(id) && !chosen.includes(id)) chosen.push(id); };
    const stabStrongest = poolDamaging.length ? poolDamaging[poolDamaging.length - 1] : 0;
    const stabSecond = poolDamaging.length > 1 ? poolDamaging[poolDamaging.length - 2] : 0;
    const coverageId = (level >= 8) ? (GANJUKO_COVERAGE[typeId] || 0) : 0;
    const statusPick = statusIds.length ? statusIds[statusIds.length - 1] : 0;
    let learnedBest = 0, learnedBestScore = -1;
    for (const id of learned) {
      if (id === stabStrongest || id === stabSecond || id === coverageId || id === statusPick) continue;
      const sc = skillStrength(id);
      if (sc > learnedBestScore) { learnedBestScore = sc; learnedBest = id; }
    }
    push(statusPick || learnedBest);
    push(coverageId);
    push(stabSecond);
    push(stabStrongest);
    if (chosen.length < 4) {
      const rest = Array.from(new Set([...learned, ...poolDamaging]))
        .filter((id) => !chosen.includes(id) && valid(id))
        .sort((x, y) => skillStrength(y) - skillStrength(x));
      for (const id of rest) { if (chosen.length >= 4) break; chosen.splice(Math.max(0, chosen.length - 1), 0, id); }
    }
    sp.poolMoves = chosen.slice(-4).map((id) => {
      const skill = skillById.get(id); // skillById already holds the K-scaled formula for type-1 skills
      return {
        skill, kind: classifySkill(skill), fn: compileFormula(skill.damage.formula),
        element: skill.damage.elementId, acc: (skill.successRate ?? 100) / 100,
      };
    });
    // NOTE: pool scoring above uses the TRANSFORMED skill set (skillById holds K-scaled formulas only for type-1; heal/status untouched).
  }
  return views;
}

// ---------- battle (v2 model) ----------
const STATUS_UTILITY = 30, HEAL_USES = 3;
function statBlock(battler) {
  const s = battler.sp.stats;
  return { mhp: s.mhp, mmp: s.mmp, hp: battler.hp, mp: s.mmp, atk: s.atk, def: s.def, mat: s.mat, mdf: s.mdf, agi: s.agi, luk: s.luk };
}
function moveScore(battler, foe, mv) {
  const A = statBlock(battler), B = statBlock(foe);
  if (mv.kind === 'damage') {
    const raw = Math.max(0, mv.fn(A, B) || 0);
    const mult = CHART[mv.element][foe.sp.type1];
    const stab = mv.element === battler.sp.type1 ? 1.5 : 1;
    return raw * mult * stab * mv.acc;
  }
  if (mv.kind === 'heal') {
    if (mv.usesLeft <= 0) return 0;
    const missing = battler.sp.stats.mhp - battler.hp;
    if (missing <= 0) return 0;
    const amt = Math.max(0, mv.fn(A, B) || 0);
    return Math.min(missing, amt) * 0.9 * mv.acc;
  }
  if (mv.kind === 'status') return mv.used ? 0 : STATUS_UTILITY * mv.acc;
  return 0;
}
function chooseMove(battler, foe) {
  let best = null, bestScore = -1;
  for (const mv of battler.moves) { const sc = moveScore(battler, foe, mv); if (sc > bestScore) { bestScore = sc; best = mv; } }
  return best;
}
function takeTurn(att, def) {
  const mv = chooseMove(att, def);
  if (!mv) return 0;
  if (rng() > mv.acc) return 0;
  const A = statBlock(att), B = statBlock(def);
  if (mv.kind === 'damage') {
    const mult = CHART[mv.element][def.sp.type1];
    if (mult === 0) return 0;
    let dmg = Math.max(0, mv.fn(A, B) || 0) * mult * (mv.element === att.sp.type1 ? 1.5 : 1);
    if (rng() < 1 / 16) dmg *= 1.5;
    dmg = Math.floor(dmg * (0.85 + rng() * 0.15));
    const dealt = Math.max(1, dmg);
    def.hp -= dealt;
    return dealt;
  } else if (mv.kind === 'heal') {
    mv.usesLeft -= 1;
    const amt = Math.max(0, mv.fn(A, B) || 0);
    att.hp = Math.min(att.sp.stats.mhp, att.hp + Math.floor(amt));
  } else if (mv.kind === 'status') { mv.used = true; }
  return 0;
}
/** Battle; returns { winner: 1|0|0.5, rounds, firstBloodRound, loserActed } */
function battle(spA, spB) {
  const A = { sp: spA, hp: spA.stats.mhp, moves: spA.poolMoves.map((m) => ({ ...m, usesLeft: m.kind === 'heal' ? HEAL_USES : Infinity, used: false })) };
  const B = { sp: spB, hp: spB.stats.mhp, moves: spB.poolMoves.map((m) => ({ ...m, usesLeft: m.kind === 'heal' ? HEAL_USES : Infinity, used: false })) };
  const acted = new Map([[A, false], [B, false]]);
  for (let round = 1; round <= 100; round++) {
    let first = A, second = B;
    if (B.sp.stats.agi > A.sp.stats.agi || (B.sp.stats.agi === A.sp.stats.agi && rng() < 0.5)) { first = B; second = A; }
    takeTurn(first, second); acted.set(first, true);
    if (second.hp <= 0) return { winner: second === A ? 0 : 1, rounds: round, loserActed: acted.get(second) };
    takeTurn(second, first); acted.set(second, true);
    if (first.hp <= 0) return { winner: first === A ? 0 : 1, rounds: round, loserActed: acted.get(first) };
  }
  const fa = A.hp / A.sp.stats.mhp, fb = B.hp / B.sp.stats.mhp;
  return { winner: fa > fb ? 1 : fa < fb ? 0 : 0.5, rounds: 100, loserActed: true, capped: true };
}

// ---------- metrics ----------
function ttkSample(views, level) {
  let eligible;
  if (level <= 6) eligible = views.filter((v) => v.inChain && v.stage === 1);
  else if (level <= 12) eligible = views.filter((v) => v.inChain && v.stage <= 2);
  else if (level <= 30) eligible = views.filter((v) => v.inChain || v.bst >= 200);
  else eligible = views;
  const rounds = [];
  let oneShot = 0, capped = 0;
  const N = 300, M = 100;
  for (let i = 0; i < N; i++) {
    const r = battle(pick(eligible), pick(eligible));
    rounds.push(r.rounds); if (!r.loserActed) oneShot++; if (r.capped) capped++;
  }
  for (let i = 0; i < M; i++) {
    const sp = pick(eligible);
    const r = battle(sp, sp);
    rounds.push(r.rounds); if (!r.loserActed) oneShot++; if (r.capped) capped++;
  }
  rounds.sort((x, y) => x - y);
  const mean = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  return {
    level, n: rounds.length, mean: +mean.toFixed(2), median: rounds[rounds.length >> 1],
    p90: rounds[Math.floor(rounds.length * 0.9)], oneShotPct: +(100 * oneShot / rounds.length).toFixed(1), capped,
  };
}
function roundRobin(views) {
  const wins = new Map(), games = new Map();
  for (const v of views) { wins.set(v.pos, 0); games.set(v.pos, 0); }
  // each species battles 40 random opponents (paired sampling like v2 RR scale)
  for (const v of views) {
    for (let i = 0; i < 40; i++) {
      const foe = pick(views);
      if (foe.pos === v.pos) continue;
      const r = battle(v, foe);
      games.set(v.pos, games.get(v.pos) + 1);
      wins.set(v.pos, wins.get(v.pos) + (r.winner === 1 ? 1 : r.winner === 0.5 ? 0.5 : 0));
    }
  }
  const byType = {};
  for (let t = 1; t <= 9; t++) {
    const members = views.filter((v) => v.type1 === t);
    let w = 0, g = 0;
    for (const m of members) { w += wins.get(m.pos); g += games.get(m.pos); }
    byType[TYPES[t]] = g ? +(100 * w / g).toFixed(1) : null;
  }
  let min = 100, max = 0;
  for (const m of views) { const wr = 100 * wins.get(m.pos) / Math.max(1, games.get(m.pos)); if (wr < min) min = wr; if (wr > max) max = wr; }
  return { byType, speciesWrRange: [+min.toFixed(1), +max.toFixed(1)] };
}

// ---------- EXP pacing report (QA-D07 calibration) ----------
function expForLevel(L) { // MZ Game_Actor.expForLevel with expParams [30,20,30,30]
  const basis = 30, extra = 20, aa = 30, ab = 30;
  return Math.round((basis * Math.pow(L - 1, 0.9 + aa / 250) * L * (L + 1)) / (6 + Math.pow(L, 2) / 50 / ab)) + (L - 1) * extra;
}
function expReport() {
  console.log('\nEXP pacing (wins of equal-level average foe per level-up):');
  console.log('Lv | gap | foeYield current (bs4*L/7) | wins | foeYield new (bs4*L^1.6*0.083) | wins');
  for (const L of [3, 5, 8, 13, 20, 30, 40, 50]) {
    // representative bs4: mean of hp+atk+def+mat over stage-appropriate species
    const pool = speciesArr.filter((s) => { const st = stageOf(s.id); return L <= 6 ? st === 1 : L <= 15 ? st <= 2 : true; });
    const bs4 = pool.reduce((a, s) => a + s.baseStats.hp + s.baseStats.atk + s.baseStats.def + s.baseStats.mat, 0) / pool.length;
    const gap = expForLevel(L + 1) - expForLevel(L);
    const cur = Math.round(bs4 * L / 7);
    const neu = Math.round(bs4 * Math.pow(L, 1.6) * 0.083);
    console.log(`${L} | ${gap} | ${cur} | ${(gap / cur).toFixed(1)} | ${neu} | ${(gap / neu).toFixed(1)}`);
  }
}

// ---------- main ----------
console.log(`simulate3: A0=${A0} B=${B} NORM=${NORM} seed=${SEED}`);
if (NORM) {
  // trigger normalization logging once (level-independent)
  speciesArr.forEach((s) => normalizedBase(s));
  console.log(`normalization: ${normLog.length} species adjusted`);
  const byStage = {};
  for (const e of normLog) { byStage[e.stage] = (byStage[e.stage] || 0) + 1; }
  console.log('  by stage:', JSON.stringify(byStage));
  for (const e of normLog.slice(0, 12)) console.log(`  pos ${e.pos} ${e.name} stage ${e.stage} BST ${e.bstBefore} -> ${e.bstAfter} (x${e.factor})`);
  if (normLog.length > 12) console.log(`  ... and ${normLog.length - 12} more`);
}
// ---------- Section 18 gate runs ----------
// Data dir already carries the shipped P2A damage rescale, so K = 1.0
// (identity transform) and NORM stays off (data already band-normalized).
console.log('simulate-s18: Lv100 gate — shipped Skills.json (K=1.0), shipped baseStats (no re-norm)');
const PROFILES = [
  { name: 'median wild (IV 16, EV 0)', iv: 16, evTop: 0, evSecond: 0 },
  { name: 'perfect trained (IV 31, EV 252/252)', iv: 31, evTop: 252, evSecond: 252 },
  { name: 'no genetics (IV 0, EV 0) — formula-only bound', iv: 0, evTop: 0, evSecond: 0 },
];
for (const prof of PROFILES) {
  GEN_PROFILE = prof;
  for (const L of [50, 100]) {
    const views = buildViews(1.0, L);
    const r = ttkSample(views, L);
    console.log(`  [${prof.name}] Lv${r.level}: TTK mean ${r.mean} median ${r.median} p90 ${r.p90} oneShot ${r.oneShotPct}% capped ${r.capped} (n=${r.n})`);
  }
}
GEN_PROFILE = PROFILES[0];
console.log('GATE: Lv100 median-profile mean TTK must be >= 2.5 (design B.4).');
