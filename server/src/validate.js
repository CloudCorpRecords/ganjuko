// Team-packet validation (design A.5 + TRUST §3.4 Layer 4). What crosses
// the wire is final stats only — never genetics. The relay checks:
//   - shape: 1..6 members for the registered team (picks are checked at
//     match start against the format), species exists, level 1..100,
//     params are 7 integers, moves are <=4 known skill ids;
//   - plausibility: every param inside the legal envelope for that
//     species at that level: [unified(IV0/EV0), unified(IV31/EV252)]
//     computed from the bundled species table (+2 slack, see gen-data).
//     Beyond-envelope forgery dies here. In-envelope forgery is
//     undetectable BY DESIGN (A.6) — the envelope is a wall against
//     absurdity, not a lie detector, and this file says so.
//   - ranked species clause: no two members of the same species.
// Move legality: the genre's full legality is learnset ∪ the engine's
// 16.5 coverage pools; the pool tables live in the engine, not in the
// repo data the relay bundles. The relay therefore enforces "skill
// exists" as a hard rule and reports learnset outsiders as an anomaly
// FLAG on the replay (visible to review), not a rejection — rejecting
// honest coverage moves would be a false wall. PROTOCOL.md states this
// precisely.

export const PARAM_ORDER = ["hp", "mp", "atk", "def", "mat", "mdf", "agi"];
const ENVELOPE_SLACK = 2;

export function unifiedParam(base, stat, level) {
  const L = Math.max(1, Math.min(100, Math.floor(level) || 1));
  const mult = 0.3 + 0.034 * L;
  if (stat === "hp") return Math.max(1, Math.floor(base * mult) + L + 5);
  if (stat === "mp") return Math.max(0, Math.floor(base * mult) + 5);
  return Math.max(1, Math.floor(base * mult) + 5);
}

export function paramEnvelope(speciesRec, stat, level) {
  const L = Math.max(1, Math.min(100, Math.floor(level) || 1));
  const lo = unifiedParam(speciesRec.baseMin[stat], stat, L) - ENVELOPE_SLACK;
  // Genetics contribution exists for every stat except MP (Section 18:
  // MP has no genetics). Max contribution: floor(31L/100) + floor(63L/100).
  const geneticsMax = stat === "mp" ? 0 : Math.floor((31 * L) / 100) + Math.floor((63 * L) / 100);
  const hi = unifiedParam(speciesRec.baseMax[stat], stat, L) + geneticsMax + ENVELOPE_SLACK;
  return [Math.max(0, lo), hi];
}

export function validateTeam(team, gameData, { ranked = false } = {}) {
  const errors = [];
  const flags = [];
  if (!Array.isArray(team) || team.length < 1 || team.length > 6) {
    return { ok: false, errors: ["team must be an array of 1..6 members"], flags };
  }
  const seenSpecies = new Set();
  team.forEach((m, i) => {
    const where = `member ${i}`;
    if (!m || typeof m !== "object") {
      errors.push(`${where}: not an object`);
      return;
    }
    const sp = gameData.species[m.speciesId];
    if (!sp) {
      errors.push(`${where}: unknown speciesId ${m.speciesId}`);
      return;
    }
    if (!Number.isInteger(m.level) || m.level < 1 || m.level > 100) {
      errors.push(`${where}: level must be an integer 1..100`);
      return;
    }
    if (m.nickname != null && (typeof m.nickname !== "string" || m.nickname.length > 24)) {
      errors.push(`${where}: nickname must be a string of <=24 chars`);
    }
    if (m.trait != null && (typeof m.trait !== "string" || m.trait.length > 24)) {
      errors.push(`${where}: trait must be a string of <=24 chars`);
    }
    if (!Array.isArray(m.params) || m.params.length !== 7 || !m.params.every(Number.isInteger)) {
      errors.push(`${where}: params must be 7 integers [mhp,mmp,atk,def,mat,mdf,agi]`);
      return;
    }
    PARAM_ORDER.forEach((stat, pi) => {
      const [lo, hi] = paramEnvelope(sp, stat, m.level);
      if (m.params[pi] < lo || m.params[pi] > hi) {
        errors.push(
          `${where}: ${stat}=${m.params[pi]} outside legal envelope [${lo}, ${hi}] for species ${m.speciesId} at level ${m.level}`
        );
      }
    });
    // Envelope-edge anomaly (TRUST §3.4 review signal, not a rejection):
    // a member sitting at the ceiling on >=3 stats is legal but rare.
    let atCeiling = 0;
    PARAM_ORDER.forEach((stat, pi) => {
      if (stat === "mp") return;
      const [, hi] = paramEnvelope(sp, stat, m.level);
      if (m.params[pi] >= hi - ENVELOPE_SLACK) atCeiling++;
    });
    if (atCeiling >= 3) flags.push(`${where}: envelope-edge stats (${atCeiling} at ceiling)`);
    if (!Array.isArray(m.moves) || m.moves.length < 1 || m.moves.length > 4) {
      errors.push(`${where}: moves must be 1..4 skill ids`);
      return;
    }
    for (const skillId of m.moves) {
      if (!gameData.skills[skillId]) {
        errors.push(`${where}: unknown skillId ${skillId}`);
      } else if (!sp.learnset.includes(skillId)) {
        flags.push(`${where}: skill ${skillId} outside learnset (may be a 16.5 pool move)`);
      }
    }
    if (seenSpecies.has(m.speciesId)) {
      if (ranked) errors.push(`${where}: ranked species clause — duplicate species ${m.speciesId}`);
    }
    seenSpecies.add(m.speciesId);
  });
  return { ok: errors.length === 0, errors, flags };
}

export function validatePicks(picks, teamSize, pickCount) {
  if (!Array.isArray(picks) || picks.length !== pickCount) {
    return `picks must be exactly ${pickCount} team indices`;
  }
  const seen = new Set();
  for (const p of picks) {
    if (!Number.isInteger(p) || p < 0 || p >= teamSize) return `pick ${p} out of range`;
    if (seen.has(p)) return `pick ${p} duplicated`;
    seen.add(p);
  }
  return null;
}

const NAME_OK = /^[^\u0000-\u001f\u007f]{1,12}$/u;
export function validateDisplayName(name) {
  return typeof name === "string" && NAME_OK.test(name.trim()) && name.trim().length > 0;
}
