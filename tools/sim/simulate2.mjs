#!/usr/bin/env node
/**
 * Ganjuko Lv50 1v1 battle simulator + balance audit — V2 (three modes).
 * Dependency-free Node.js. Seeded (mulberry32) — runs are reproducible.
 *
 * Model (per SPEC-UPGRADE.md test bar + work/TYPE-CHART.md v1):
 *  - Stats: Classes.json params[paramId][50]; 0=MHP 1=MMP 2=ATK 3=DEF 4=MAT 5=MDF 6=AGI 7=LUK.
 *  - Moves: class learnings with level <= 50, mapped to Skills.json.
 *  - Damage: skill formula evaluated with attacker (a) / defender (b) stats, then
 *    NEW 9x9 type chart multiplier (move element vs defender type1, single-type),
 *    STAB x1.5 if move element == attacker type1, crit x1.5 with p=1/16,
 *    damage roll uniform 0.85-1.00, min 1 damage when effectiveness > 0.
 *  - Accuracy: skill successRate (all 72 skills are 100 in current data).
 *  - Heal moves (damage.type 3 with an mhp formula): heal at face value,
 *    limited to 3 uses per move per battle (PP-style cap so heal loops terminate).
 *  - Status / buff moves (damage.type 3, no heal formula; effects code 21/31):
 *    fixed utility value STATUS_UTILITY = 30 HP-equivalent, usable once per battle.
 *    Their selection score is that utility; they deal no damage in this model.
 *  - Damaging moves with an added status effect (e.g. Poison Fang) are scored
 *    and resolved as pure damage; the rider effect is ignored (documented).
 *  - Move selection: highest expected value each turn.
 *    Damaging: max(0, formula) x typeMult x STAB x accuracy (crit excluded from expectation).
 *    Heal: min(missing HP, heal amount) x 0.9, 0 at full HP.
 *  - Higher AGI moves first (tie: coin flip). Cap 100 rounds; on cap the higher
 *    HP fraction wins, equal fraction = draw (0.5 win each).
 *  - MP costs are not modelled (Lv50 MMP pools are 330+ vs max cost 42; symmetric).
 *
 * Usage: node simulate2.mjs [seed]
 * Writes results-v2.json next to this file. Runs THREE modes over one
 * continuous seeded stream: A = chart v1 + raw learnsets (bit-exact
 * reproduction of simulate.mjs, gated against results.json),
 * B = chart v1.1 + raw learnsets, C = chart v1.1 + engine Section 16.5
 * best-4 pools. Matrix samples are drawn once (mode A, identical to the
 * original) and reused for B and C for paired comparison.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..'); // ~/workspace/ganjuko
const SEED = Number(process.argv[2] || 20261101);
const LEVEL = 50;
const STATUS_UTILITY = 30;
const HEAL_USES = 3;

// ---------- seeded RNG (mulberry32) ----------
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
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- load data ----------
const speciesArr = JSON.parse(fs.readFileSync(path.join(ROOT, 'inspect/GanjukoSpecies.json'), 'utf8'));
const skillsArr = JSON.parse(fs.readFileSync(path.join(ROOT, 'src-data/Skills.json'), 'utf8'));
const classesArr = JSON.parse(fs.readFileSync(path.join(ROOT, 'src-data/Classes.json'), 'utf8'));
const imgLines = fs.readFileSync(path.join(ROOT, 'img-listing.txt'), 'utf8').split(/\r?\n/);
// img-listing.txt: enemies section runs until the first "---..." separator line.
const sepIdx = imgLines.findIndex((l) => l.trim().startsWith('---'));
const enemyFiles = new Set(imgLines.slice(0, sepIdx >= 0 ? sepIdx : undefined).map((l) => l.trim()).filter(Boolean));

const TYPES = ['', 'Normal', 'Fire', 'Water', 'Nature', 'Volt', 'Earth', 'Wind', 'Umbra', 'Astral'];
// NEW 9x9 chart v1 (work/TYPE-CHART.md). CHART[atk][def], unlisted = 1.0.
let CHART = {};
for (let a = 1; a <= 9; a++) { CHART[a] = {}; for (let d = 1; d <= 9; d++) CHART[a][d] = 1; }
const setMult = (atk, def, v) => { CHART[atk][def] = v; };
// Normal(1): .5 Earth(6), .5 Astral(9), 0 Umbra(8)
setMult(1, 6, 0.5); setMult(1, 9, 0.5); setMult(1, 8, 0);
// Fire(2): 2 Nature(4), 2 Umbra(8), .5 Fire, .5 Water(3), .5 Earth(6)
setMult(2, 4, 2); setMult(2, 8, 2); setMult(2, 2, 0.5); setMult(2, 3, 0.5); setMult(2, 6, 0.5);
// Water(3): 2 Fire, 2 Earth, .5 Water, .5 Nature
setMult(3, 2, 2); setMult(3, 6, 2); setMult(3, 3, 0.5); setMult(3, 4, 0.5);
// Nature(4): 2 Earth, 2 Water, .5 Fire, .5 Nature, .5 Wind(7)
setMult(4, 6, 2); setMult(4, 3, 2); setMult(4, 2, 0.5); setMult(4, 4, 0.5); setMult(4, 7, 0.5);
// Volt(5): 2 Water, 2 Wind, .5 Volt, .5 Nature, 0 Earth
setMult(5, 3, 2); setMult(5, 7, 2); setMult(5, 5, 0.5); setMult(5, 4, 0.5); setMult(5, 6, 0);
// Earth(6): 2 Volt, 2 Fire, 2 Normal, .5 Nature, 0 Wind
setMult(6, 5, 2); setMult(6, 2, 2); setMult(6, 1, 2); setMult(6, 4, 0.5); setMult(6, 7, 0);
// Wind(7): 2 Nature, 2 Fire, .5 Volt, .5 Astral
setMult(7, 4, 2); setMult(7, 2, 2); setMult(7, 5, 0.5); setMult(7, 9, 0.5);
// Umbra(8): 2 Astral, 2 Nature, .5 Umbra, .5 Fire, 0 Normal
setMult(8, 9, 2); setMult(8, 4, 2); setMult(8, 8, 0.5); setMult(8, 2, 0.5); setMult(8, 1, 0);
// Astral(9): 2 Umbra, 2 Wind, 2 Astral, .5 Normal
setMult(9, 8, 2); setMult(9, 7, 2); setMult(9, 9, 2); setMult(9, 1, 0.5);
const CHART_V1 = CHART;
// Chart v1.1 (work/TYPE-CHART.md): exactly one change — Water -> Nature = 1.0
// (the 0.5 setMult(3, 4, 0.5) above is removed). Matches the engine's
// GANJUKO_TYPE_CHART in Section 16.1, whose Water row has no Nature entry.
const CHART_V11 = JSON.parse(JSON.stringify(CHART_V1));
CHART_V11[3][4] = 1;

// ---------- formula compilation (safe: arithmetic + a./b. stat refs only) ----------
const STAT_PROPS = new Set(['mhp', 'mmp', 'hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk']);
function compileFormula(formula) {
  const src = String(formula ?? '0');
  const expr = src.replace(/\b([ab])\.(\w+)/g, (m, side, prop) => {
    if (!STAT_PROPS.has(prop)) throw new Error(`Bad stat prop in formula: ${src}`);
    return `${side === 'a' ? 'A' : 'B'}.${prop}`;
  });
  // Safety: after removing valid a./b. stat refs, only arithmetic may remain.
  const stripped = src.replace(/\b[ab]\.\w+/g, '');
  if (!/^[\d\s+\-*/().]+$/.test(stripped)) throw new Error(`Unsafe formula: ${src}`);
  return new Function('A', 'B', `return (${expr});`);
}

// ---------- species model ----------
const skillById = new Map();
for (const s of skillsArr) if (s) skillById.set(s.id, s);

function classifySkill(skill) {
  if (skill.damage.type === 1) return 'damage';
  if (skill.damage.type === 3 && /mhp/.test(skill.damage.formula)) return 'heal';
  if (skill.damage.type === 3) return 'status';
  return 'other';
}

const speciesById = new Map();
for (const sp of speciesArr) {
  const cls = classesArr[sp.id]; // class id == species id (array index)
  const p = cls.params.map((arr) => arr[LEVEL]);
  const stats = { mhp: p[0], mmp: p[1], atk: p[2], def: p[3], mat: p[4], mdf: p[5], agi: p[6], luk: p[7] };
  const bst = stats.mhp + stats.atk + stats.def + stats.mat + stats.mdf + stats.agi; // Lv50 BST (excl. MMP/LUK)
  const moves = [];
  for (const l of cls.learnings || []) {
    if (l.level > LEVEL) continue;
    const skill = skillById.get(l.skillId);
    if (!skill) continue;
    moves.push({
      skill,
      kind: classifySkill(skill),
      fn: compileFormula(skill.damage.formula),
      element: skill.damage.elementId,
      acc: (skill.successRate ?? 100) / 100,
    });
  }
  speciesById.set(sp.id, {
    id: sp.id, name: sp.name, type1: sp.type1, typeName: TYPES[sp.type1],
    evolveTo: sp.evolveTo || 0, evolveLv: sp.evolveLv || 0, catchRate: sp.catchRate,
    battlerName: sp.battlerName, stats, bst, moves,
    dmgMoves: moves.filter((m) => m.kind === 'damage'),
    learnset: (cls.learnings || []).map((l) => ({ level: l.level, skillId: l.skillId })),
  });
}
const allSpecies = [...speciesById.values()].sort((a, b) => a.id - b.id);

// ---------- engine Section 16.5 move pools (literal replication) ----------
// Constants copied verbatim from work/GanjukoEngine.js Section 16.5.
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
  for (const tier of ['early', 'mid', 'late']) {
    if (level >= GANJUKO_POOL_TIER_LEVEL[tier]) out.push(...(pool[tier] || []));
  }
  return out; // ascending strength (engine comment)
};
const poolStatusOrHealFor = (typeId, level) => {
  if (level < GANJUKO_POOL_TIER_LEVEL.statusOrHeal) return [];
  const pool = GANJUKO_MOVE_POOLS[typeId] || GANJUKO_MOVE_POOLS[1];
  if (pool.statusOrHeal && pool.statusOrHeal.length) return pool.statusOrHeal.slice();
  return [2]; // Brace fallback, as in the engine
};
// Engine _s16_evalFormula + _s16_statOf, with the "battler" being the
// species' own Lv50 stat block (augmentSkills scores a battler vs itself;
// _s16_skillStrength passes (battler, battler)).
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
function engineSkillStrength(sp, skillId) {
  const skill = skillById.get(skillId);
  if (!skill || !skill.damage) return 0;
  if (skill.damage.type === 3) return 15;
  const self = { ...sp.stats, hp: sp.stats.mhp, mp: sp.stats.mmp };
  const est = Math.max(0, engineEvalFormula(skill.damage.formula, self));
  const stab = (sp.type1 === (skill.damage.elementId || 0)) ? 1.5 : 1;
  return est * stab;
}
// GanjukoEngine.augmentSkills, actor path, at the sim's LEVEL (50).
// learned = _skills ∪ species learnings ∪ class learnings (all <= LEVEL).
// Species learnings and class learnings are identical for all 504 species
// in current data (verified), and a fresh battler's _skills is built by
// setGanjukoSpecies learning exactly the class learnings (RMMZ learnSkill
// pushes + sorts ascending; engine enforceFourMoveLimit keeps the last 4
// after each learn), so the union is the Lv<=LEVEL learnset either way.
function enginePoolFor(sp) {
  const typeId = sp.type1;
  const level = LEVEL;
  const poolDamaging = poolDamagingFor(typeId, level);
  const statusIds = poolStatusOrHealFor(typeId, level);
  const skillsArr = [];
  for (const l of sp.learnset) {
    if (l.level > level) continue;
    if (!skillsArr.includes(l.skillId)) { skillsArr.push(l.skillId); skillsArr.sort((x, y) => x - y); }
    if (skillsArr.length > 4) skillsArr.splice(0, skillsArr.length - 4);
  }
  const learned = new Set(skillsArr);
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
    const s = engineSkillStrength(sp, id);
    if (s > learnedBestScore) { learnedBestScore = s; learnedBest = id; }
  }
  push(statusPick || learnedBest);
  push(coverageId);
  push(stabSecond);
  push(stabStrongest);
  if (chosen.length < 4) {
    const rest = Array.from(new Set([...learned, ...poolDamaging]))
      .filter((id) => !chosen.includes(id) && valid(id))
      .sort((x, y) => engineSkillStrength(sp, y) - engineSkillStrength(sp, x));
    for (const id of rest) { if (chosen.length >= 4) break; chosen.splice(Math.max(0, chosen.length - 1), 0, id); }
  }
  return chosen.slice(-4);
}
for (const sp of allSpecies) {
  sp.poolSkillIds = enginePoolFor(sp);
  sp.poolMoves = sp.poolSkillIds.map((id) => {
    const skill = skillById.get(id);
    return {
      skill, kind: classifySkill(skill), fn: compileFormula(skill.damage.formula),
      element: skill.damage.elementId, acc: (skill.successRate ?? 100) / 100,
    };
  });
  sp.poolDmgMoves = sp.poolMoves.filter((m) => m.kind === 'damage');
}

// ---------- battle ----------
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
  if (mv.kind === 'status') {
    return mv.used ? 0 : STATUS_UTILITY * mv.acc;
  }
  return 0;
}
function chooseMove(battler, foe) {
  let best = null, bestScore = -1;
  for (const mv of battler.moves) {
    const sc = moveScore(battler, foe, mv);
    if (sc > bestScore) { bestScore = sc; best = mv; }
  }
  return best; // may be null only if species has zero moves at all
}
function takeTurn(att, def) {
  const mv = chooseMove(att, def);
  if (!mv) return;
  if (rng() > mv.acc) return; // miss
  const A = statBlock(att), B = statBlock(def);
  if (mv.kind === 'damage') {
    const mult = CHART[mv.element][def.sp.type1];
    if (mult === 0) return;
    let dmg = Math.max(0, mv.fn(A, B) || 0) * mult * (mv.element === att.sp.type1 ? 1.5 : 1);
    if (rng() < 1 / 16) dmg *= 1.5; // crit
    dmg = Math.floor(dmg * (0.85 + rng() * 0.15));
    def.hp -= Math.max(1, dmg);
  } else if (mv.kind === 'heal') {
    mv.usesLeft -= 1;
    const amt = Math.max(0, mv.fn(A, B) || 0);
    att.hp = Math.min(att.sp.stats.mhp, att.hp + Math.floor(amt));
  } else if (mv.kind === 'status') {
    mv.used = true; // utility modelled as selection value only; no state tracked
  }
}
let ACTIVE_MODE = 'raw'; // 'raw' = full learnset, 'engine' = Section 16.5 best-4 pool
const activeMovesOf = (sp) => (ACTIVE_MODE === 'engine' ? sp.poolMoves : sp.moves);
function newBattler(sp) {
  return {
    sp, hp: sp.stats.mhp,
    moves: activeMovesOf(sp).map((m) => ({ ...m, usesLeft: m.kind === 'heal' ? HEAL_USES : Infinity, used: false })),
  };
}
/** Returns 1 if A wins, 0 if B wins, 0.5 draw. */
function battle(spA, spB) {
  const A = newBattler(spA), B = newBattler(spB);
  for (let round = 0; round < 100; round++) {
    let first = A, second = B;
    if (B.sp.stats.agi > A.sp.stats.agi || (B.sp.stats.agi === A.sp.stats.agi && rng() < 0.5)) { first = B; second = A; }
    takeTurn(first, second);
    if (second.hp <= 0) return second === A ? 0 : 1;
    takeTurn(second, first);
    if (first.hp <= 0) return first === A ? 0 : 1;
  }
  const fa = A.hp / A.sp.stats.mhp, fb = B.hp / B.sp.stats.mhp;
  return fa > fb ? 1 : fa < fb ? 0 : 0.5;
}

const byType = new Map();
for (let t = 1; t <= 9; t++) byType.set(t, allSpecies.filter((s) => s.type1 === t));

// ---------- modes: type matrix + round-robin (original protocol) ----------
// Identical sampling/battle/RNG-consumption order to simulate.mjs; the only
// parameters are the active CHART, ACTIVE_MODE, and (for B/C) reuse of the
// matrix sample drawn under mode A.
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
function runMode(reuseSampleIds) {
  let matrixSample;
  if (reuseSampleIds) {
    matrixSample = reuseSampleIds;
  } else {
    matrixSample = {}; // typeId -> sampled species ids (fully-evolved preferred)
    for (let t = 1; t <= 9; t++) {
      const pool = byType.get(t);
      const evolved = pool.filter((s) => s.evolveTo === 0);
      const base = evolved.length >= 12 ? evolved : pool;
      matrixSample[t] = shuffled(base).slice(0, 12).map((s) => s.id);
    }
  }
  const MATRIX_BATTLES = 20;
  const matrix = {}; // matrix[atkType][defType] = win fraction for atkType side
  const matrixRaw = {};
  for (let a = 1; a <= 9; a++) {
    matrix[a] = {}; matrixRaw[a] = {};
    for (let d = 1; d <= 9; d++) {
      let score = 0;
      for (let i = 0; i < MATRIX_BATTLES; i++) {
        const sa = speciesById.get(pick(matrixSample[a]));
        const sb = speciesById.get(pick(matrixSample[d]));
        score += battle(sa, sb);
      }
      matrix[a][d] = score / MATRIX_BATTLES;
      matrixRaw[a][d] = { wins: score, battles: MATRIX_BATTLES };
    }
  }
  const typeOverall = {};
  for (let a = 1; a <= 9; a++) {
    let w = 0, n = 0, wEx = 0, nEx = 0;
    for (let d = 1; d <= 9; d++) { w += matrixRaw[a][d].wins; n += MATRIX_BATTLES; if (d !== a) { wEx += matrixRaw[a][d].wins; nEx += MATRIX_BATTLES; } }
    typeOverall[a] = { winRate: w / n, battles: n, winRateExMirror: wEx / nEx };
  }
  const record = new Map(allSpecies.map((s) => [s.id, { battles: 0, score: 0 }]));
  function recordBattle(sa, sb) {
    const r = battle(sa, sb);
    const ra = record.get(sa.id), rb = record.get(sb.id);
    ra.battles++; rb.battles++; ra.score += r; rb.score += 1 - r;
    return r;
  }
  let rrBattles = 0;
  while (Math.min(...[...record.values()].map((r) => r.battles)) < 60 && rrBattles < 60000) {
    for (let i = 0; i < 1000; i++) {
      const sa = pick(allSpecies);
      let sb = pick(allSpecies);
      if (sb.id === sa.id) sb = allSpecies[(sa.id) % allSpecies.length];
      recordBattle(sa, sb); rrBattles++;
    }
  }
  const rankings = allSpecies.map((s) => {
    const r = record.get(s.id);
    const actDmg = activeMovesOf(s).filter((m) => m.kind === 'damage');
    return {
      id: s.id, name: s.name, type: s.typeName, type1: s.type1, bst: s.bst,
      stats: s.stats, battles: r.battles, winRate: r.score / r.battles,
      dmgMoveCount: actDmg.length,
      bestMove: actDmg.length ? actDmg.map((m) => m.skill.name).join('/') : '(none)',
    };
  }).sort((a, b) => b.winRate - a.winRate);
  const top20 = rankings.slice(0, 20);
  const bottom20 = rankings.slice(-20).reverse();
  const rankByIdM = new Map(rankings.map((r) => [r.id, r]));
  const analysisLite = {
    meanWinRateFinal: mean(rankings.filter((r) => speciesById.get(r.id).evolveTo === 0).map((r) => r.winRate)),
    meanWinRateUnevolved: mean(rankings.filter((r) => speciesById.get(r.id).evolveTo !== 0).map((r) => r.winRate)),
    meanWinRateByType: Object.fromEntries([...byType.entries()].map(([t, pool]) => [TYPES[t], mean(pool.map((s) => rankByIdM.get(s.id).winRate))])),
    matrixSampleMeanBST: Object.fromEntries(Object.entries(matrixSample).map(([t, ids]) => [TYPES[t], mean(ids.map((id) => speciesById.get(id).bst))])),
    outOfBandTypes: Object.entries(typeOverall).filter(([, o]) => o.winRate < 0.42 || o.winRate > 0.58)
      .map(([t, o]) => ({ type: TYPES[t], winRate: o.winRate })),
    speciesAt100: rankings.filter((r) => r.winRate >= 0.999).map((r) => ({ id: r.id, name: r.name, type: r.type, winRate: r.winRate, battles: r.battles })),
    speciesAbove95Count: rankings.filter((r) => r.winRate >= 0.95).length,
    speciesBelow5Count: rankings.filter((r) => r.winRate <= 0.05).length,
  };
  return {
    typeMatrix: { types: TYPES.slice(1), sampleIds: matrixSample, matrix, overall: typeOverall },
    speciesRankings: rankings, top20, bottom20,
    roundRobinBattles: rrBattles, matrixBattlesPerPairing: MATRIX_BATTLES,
    analysis: analysisLite,
  };
}
const modes = {};
CHART = CHART_V1; ACTIVE_MODE = 'raw';
modes.A_v1_raw = runMode(null);
const SHARED_SAMPLE = modes.A_v1_raw.typeMatrix.sampleIds;
CHART = CHART_V11; ACTIVE_MODE = 'raw';
modes.B_v11_raw = runMode(SHARED_SAMPLE);
CHART = CHART_V11; ACTIVE_MODE = 'engine';
modes.C_v11_pool = runMode(SHARED_SAMPLE);


// ---------- 2b) structural analysis (static, no RNG) ----------
const rankAMap = new Map(modes.A_v1_raw.speciesRankings.map((r) => [r.id, r]));
const analysis = {
  bst: {
    min: Math.min(...allSpecies.map((s) => s.bst)), max: Math.max(...allSpecies.map((s) => s.bst)),
    mean: mean(allSpecies.map((s) => s.bst)),
    meanFinal: mean(allSpecies.filter((s) => s.evolveTo === 0).map((s) => s.bst)),
    meanUnevolved: mean(allSpecies.filter((s) => s.evolveTo !== 0).map((s) => s.bst)),
  },
  normalOnlyDamage: allSpecies.filter((s) => s.dmgMoves.length > 0 && s.dmgMoves.every((m) => m.element === 1))
    .map((s) => ({ id: s.id, name: s.name, type: s.typeName, winRate: rankAMap.get(s.id).winRate })),
  duplicateSkillInLearnset: allSpecies.filter((s) => {
    const ids = s.moves.map((m) => m.skill.id); return new Set(ids).size !== ids.length;
  }).map((s) => ({ id: s.id, name: s.name, skillIds: s.moves.map((m) => m.skill.id) })),
  learnsetTemplates: (() => {
    const tmpl = new Map();
    for (const s of allSpecies) {
      const key = s.moves.map((m) => m.skill.id).join(',');
      if (!tmpl.has(key)) tmpl.set(key, { skillIds: key.split(',').map(Number), skillNames: s.moves.map((m) => m.skill.name), count: 0, ids: [] });
      const e = tmpl.get(key); e.count++; e.ids.push(s.id);
    }
    return [...tmpl.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  })(),
  distinctLearnsets: new Set(allSpecies.map((s) => s.moves.map((m) => m.skill.id).join(','))).size,
};

// ---------- 2c) engine pool analysis (mode C move sets) ----------
const poolGroups = new Map();
for (const s of allSpecies) {
  const key = s.poolSkillIds.join(',');
  if (!poolGroups.has(key)) poolGroups.set(key, { skillIds: s.poolSkillIds.slice(), count: 0, ids: [], types: [] });
  const e = poolGroups.get(key); e.count++; e.ids.push(s.id); if (!e.types.includes(s.typeName)) e.types.push(s.typeName);
}
const poolPerType = {};
for (let t = 1; t <= 9; t++) {
  const rep = byType.get(t)[0];
  poolPerType[TYPES[t]] = {
    skillIds: rep.poolSkillIds,
    skills: rep.poolMoves.map((m) => ({ id: m.skill.id, name: m.skill.name, element: TYPES[m.element], kind: m.kind })),
    damagingCount: rep.poolDmgMoves.length,
    distinctPoolsWithinType: new Set(byType.get(t).map((s) => s.poolSkillIds.join(','))).size,
    speciesCount: byType.get(t).length,
  };
}
const poolAnalysis = {
  distinctPools: poolGroups.size,
  groups: [...poolGroups.values()].map((g) => ({ skillIds: g.skillIds, count: g.count, types: g.types })),
  perType: poolPerType,
  guarantee: {
    lessThan3Damaging: allSpecies.filter((s) => s.poolDmgMoves.length < 3)
      .map((s) => ({ id: s.id, name: s.name, type: s.typeName, pool: s.poolSkillIds })),
    noNonOwnTypeCoverage: allSpecies.filter((s) => !s.poolDmgMoves.some((m) => m.element !== s.type1))
      .map((s) => ({ id: s.id, name: s.name, type: s.typeName, pool: s.poolSkillIds })),
    poolSizeNot4: allSpecies.filter((s) => s.poolSkillIds.length !== 4)
      .map((s) => ({ id: s.id, name: s.name, pool: s.poolSkillIds })),
  },
};

// ---------- 3) data audit ----------
const nameToIds = new Map();
for (const s of allSpecies) { if (!nameToIds.has(s.name)) nameToIds.set(s.name, []); nameToIds.get(s.name).push(s.id); }
const duplicateNames = [...nameToIds.entries()].filter(([, ids]) => ids.length > 1)
  .map(([name, ids]) => ({ name, ids }));

const missingBattlers = allSpecies.filter((s) => !enemyFiles.has(s.battlerName));
const battlerUse = new Map();
for (const s of allSpecies) battlerUse.set(s.battlerName, (battlerUse.get(s.battlerName) || 0) + 1);

const noStab = [], fewDmg = [];
for (const s of allSpecies) {
  const stab = s.dmgMoves.filter((m) => m.element === s.type1);
  if (stab.length === 0) noStab.push({ id: s.id, name: s.name, type: s.typeName });
  if (s.dmgMoves.length < 3) fewDmg.push({ id: s.id, name: s.name, type: s.typeName, fullyEvolved: s.evolveTo === 0, dmgMoves: s.dmgMoves.length, moves: s.dmgMoves.map((m) => m.skill.name) });
}
const catchRates = allSpecies.map((s) => s.catchRate).sort((a, b) => a - b);
const catchBuckets = { '3-10': 0, '11-45': 0, '46-100': 0, '101-200': 0, '201-255': 0 };
for (const c of catchRates) {
  if (c <= 10) catchBuckets['3-10']++; else if (c <= 45) catchBuckets['11-45']++;
  else if (c <= 100) catchBuckets['46-100']++; else if (c <= 200) catchBuckets['101-200']++; else catchBuckets['201-255']++;
}
// evolution chain checks
const evoMissingTarget = [], evoLvZero = [], evoLvSetNoTarget = [];
for (const s of allSpecies) {
  if (s.evolveTo !== 0 && !speciesById.has(s.evolveTo)) evoMissingTarget.push({ id: s.id, name: s.name, evolveTo: s.evolveTo });
  if (s.evolveTo !== 0 && s.evolveLv === 0) evoLvZero.push({ id: s.id, name: s.name, evolveTo: s.evolveTo });
  if (s.evolveTo === 0 && s.evolveLv !== 0) evoLvSetNoTarget.push({ id: s.id, name: s.name, evolveLv: s.evolveLv });
}
const cycles = [];
{
  const state = new Map(); // id -> 1 visiting, 2 done
  const stack = [];
  const visit = (id) => {
    state.set(id, 1); stack.push(id);
    const nxt = speciesById.get(id)?.evolveTo || 0;
    if (nxt && speciesById.has(nxt)) {
      if (state.get(nxt) === 1) cycles.push(stack.slice(stack.indexOf(nxt)).concat(nxt));
      else if (!state.get(nxt)) visit(nxt);
    }
    stack.pop(); state.set(id, 2);
  };
  for (const s of allSpecies) if (!state.get(s.id)) visit(s.id);
}
// referenced-but-missing skills in learnsets
const missingSkillRefs = [];
for (const sp of speciesArr) {
  const cls = classesArr[sp.id];
  for (const l of cls.learnings || []) if (!skillById.has(l.skillId)) missingSkillRefs.push({ speciesId: sp.id, skillId: l.skillId });
}
// per-type best/worst move power context: strongest damaging formula value at a generic Lv50 stat line
const skillPower = [...skillById.values()].filter((s) => s.damage.type === 1).map((s) => ({ id: s.id, name: s.name, element: s.damage.elementId, elementName: TYPES[s.damage.elementId] }));

// ---------- reproduction gate: mode A vs original results.json ----------
const origResults = JSON.parse(fs.readFileSync(path.join(HERE, 'results.json'), 'utf8'));
const gateChecks = {};
{
  const a = modes.A_v1_raw;
  gateChecks.sampleIdsEqual = JSON.stringify(a.typeMatrix.sampleIds) === JSON.stringify(origResults.typeMatrix.sampleIds);
  gateChecks.roundRobinBattlesEqual = a.roundRobinBattles === origResults.meta.roundRobinBattles;
  let maxOverallDiff = 0;
  for (let t = 1; t <= 9; t++) maxOverallDiff = Math.max(maxOverallDiff, Math.abs(a.typeMatrix.overall[t].winRate - origResults.typeMatrix.overall[t].winRate));
  gateChecks.maxTypeOverallDiff = maxOverallDiff;
  const origRank = new Map(origResults.speciesRankings.map((r) => [r.id, r.winRate]));
  let maxRankDiff = 0;
  for (const r of a.speciesRankings) maxRankDiff = Math.max(maxRankDiff, Math.abs(r.winRate - origRank.get(r.id)));
  gateChecks.maxSpeciesWinRateDiff = maxRankDiff;
  gateChecks.top20IdsEqual = JSON.stringify(a.top20.map((s) => s.id)) === JSON.stringify(origResults.top20.map((s) => s.id));
  gateChecks.bottom20IdsEqual = JSON.stringify(a.bottom20.map((s) => s.id)) === JSON.stringify(origResults.bottom20.map((s) => s.id));
  gateChecks.pass = gateChecks.sampleIdsEqual && gateChecks.roundRobinBattlesEqual &&
    maxOverallDiff < 1e-12 && maxRankDiff < 1e-12 && gateChecks.top20IdsEqual && gateChecks.bottom20IdsEqual;
}

const results = {
  meta: {
    seed: SEED, level: LEVEL, generatedAt: new Date().toISOString(),
    statusUtility: STATUS_UTILITY, healUsesPerBattle: HEAL_USES,
    speciesCount: allSpecies.length, skillCount: skillById.size,
    modes: {
      A_v1_raw: 'Chart v1 + raw learnsets — reproduction of simulate.mjs (see reproductionGate).',
      B_v11_raw: 'Chart v1.1 (Water->Nature 1.0, only change) + raw learnsets.',
      C_v11_pool: 'Chart v1.1 + engine Section 16.5 best-4 pools (augmentSkills replicated literally at Lv50).',
    },
    reproductionGate: gateChecks,
    modelNotes: [
      'Stats from Classes.json params[*][50]; BST = MHP+ATK+DEF+MAT+MDF+AGI at Lv50 (MMP/LUK excluded).',
      'STAB 1.5, crit 1.5 @ p=1/16, roll 0.85-1.00, min 1 dmg if effectiveness > 0. Heals at face value, max 3 uses/move/battle. Status/buff utility fixed at 30 HP-equivalent, once/battle, no state tracked. MP costs not modelled.',
      'One continuous mulberry32 stream: mode A consumes it in exactly the original order (samples, matrix, round-robin); modes B and C continue the stream and reuse mode A matrix samples for paired comparison.',
      'Mode C move sets: GanjukoEngine.augmentSkills (Section 16.5) replicated line-for-line at Lv50, including _s16_skillStrength (type-3 skills score a flat 15; damage scored vs the battler itself with STAB x1.5) and the [statusPick, coverage, stabSecond, stabStrongest] slot plan.',
    ],
  },
  modes,
  analysis,
  poolAnalysis,
  dataAudit: {
    duplicateNames,
    battlers: {
      enemyFilesInListing: enemyFiles.size,
      distinctBattlerNamesUsed: battlerUse.size,
      customGanjukoBattlers: [...battlerUse.keys()].filter((b) => b.startsWith('Ganjuko_')).length,
      speciesSharingBattler: allSpecies.filter((s) => battlerUse.get(s.battlerName) > 1).length,
      missing: missingBattlers.map((s) => ({ id: s.id, name: s.name, battlerName: s.battlerName, fullyEvolved: s.evolveTo === 0 })),
      missingCount: missingBattlers.length,
      missingFullyEvolved: missingBattlers.filter((s) => s.evolveTo === 0).length,
    },
    noDamagingStab: noStab,
    fewDamagingMoves: fewDmg,
    catchRate: {
      min: catchRates[0], max: catchRates[catchRates.length - 1],
      mean: catchRates.reduce((a, b) => a + b, 0) / catchRates.length,
      median: catchRates[Math.floor(catchRates.length / 2)],
      buckets: catchBuckets,
      at3: catchRates.filter((c) => c === 3).length,
      atOrBelow10: catchRates.filter((c) => c <= 10).length,
      atOrBelow45: catchRates.filter((c) => c <= 45).length,
    },
    evolution: {
      chains: allSpecies.filter((s) => s.evolveTo !== 0).length,
      fullyEvolvedCount: allSpecies.filter((s) => s.evolveTo === 0).length,
      missingTarget: evoMissingTarget, evolveLvZeroWithTarget: evoLvZero,
      evolveLvSetNoTarget: evoLvSetNoTarget, cycles,
    },
    missingSkillRefs,
    damagingSkillsByElement: skillPower.reduce((acc, s) => { acc[s.elementName] = (acc[s.elementName] || 0) + 1; return acc; }, {}),
  },
};
fs.writeFileSync(path.join(HERE, 'results-v2.json'), JSON.stringify(results, null, 2));
console.log('REPRODUCTION GATE:', gateChecks.pass ? 'PASS' : 'FAIL', JSON.stringify(gateChecks));
for (const [key, m] of Object.entries(modes)) {
  console.log(`\n== ${key} (round-robin battles=${m.roundRobinBattles}) ==`);
  console.log('type overall:', Object.entries(m.typeMatrix.overall).map(([t, o]) => `${TYPES[t]} ${(o.winRate * 100).toFixed(1)}%`).join(' | '));
  console.log('out of band 42-58:', m.analysis.outOfBandTypes.map((x) => `${x.type} ${(x.winRate * 100).toFixed(1)}%`).join('; ') || '(none)');
  console.log('RR mean by type:', Object.entries(m.analysis.meanWinRateByType).map(([t, v]) => `${t} ${(v * 100).toFixed(1)}%`).join(' | '));
  console.log('final vs unevolved RR mean:', (m.analysis.meanWinRateFinal * 100).toFixed(1) + '%', '/', (m.analysis.meanWinRateUnevolved * 100).toFixed(1) + '%');
  console.log('top5:', m.top20.slice(0, 5).map((s) => `#${s.id} ${s.name} ${(s.winRate * 100).toFixed(1)}%`).join('; '));
  console.log('bottom5:', m.bottom20.slice(0, 5).map((s) => `#${s.id} ${s.name} ${(s.winRate * 100).toFixed(1)}%`).join('; '));
  console.log('species >=95%:', m.analysis.speciesAbove95Count, '| species <=5%:', m.analysis.speciesBelow5Count, '| at 100%:', m.analysis.speciesAt100.length);
}
console.log('\ndistinct engine pools (mode C):', poolAnalysis.distinctPools);
console.log('pool guarantee violations: <3 dmg', poolAnalysis.guarantee.lessThan3Damaging.length,
  '| no coverage', poolAnalysis.guarantee.noNonOwnTypeCoverage.length,
  '| pool size != 4', poolAnalysis.guarantee.poolSizeNot4.length);
console.log('audit: dupNames', duplicateNames.length, '| missingBattlers', missingBattlers.length, '| noStab', noStab.length, '| fewDmg', fewDmg.length, '| evoBroken', evoMissingTarget.length + evoLvZero.length, '| cycles', cycles.length);
