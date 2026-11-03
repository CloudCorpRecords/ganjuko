// Generates the relay's bundled game-data file (data/game-data.json)
// from the repo's canonical game data:
//   - species table: razer-original/ganjuko/data/GanjukoSpecies.json
//   - skills table:  src-data/Skills.json
//
// For each species we keep exactly what the relay is allowed to know
// (TRUST §2: final stats and public facts only):
//   - baseMin / baseMax per stat: the legal param envelope is computed
//     from the engine's unified stat model (GanjukoEngine.unifiedParam:
//     mult = 0.30 + 0.034*L; HP also +L+5; others +5) over the species'
//     base stats, plus the Section 18 genetics contribution range
//     (IV 0..31, EV 0..252 -> floor(31*L/100) + floor(63*L/100)).
//     The repo's data carries two base-stat spellings (`base` and
//     `baseStats`) that differ by a point or two on some species; the
//     envelope spans BOTH spellings plus a +2 slack, so an honest
//     client can never be rejected for which spelling its build used —
//     while a forged 9999 still dies at the door (design A.5/A.6).
//   - learnset: skill ids from the species' `learnings` table.
//   - the content hash (TRUST §3.2): SHA-256 over the canonical form of
//     { species: id -> {baseMax, learnset}, skillIds }. The client lane
//     computes the same value over its canonical tables; see
//     CLIENT-INTEGRATION.md for the reconciliation step.
//
// Run: npm run gen-data
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "../../");
const speciesRaw = JSON.parse(
  readFileSync(path.join(repo, "razer-original/ganjuko/data/GanjukoSpecies.json"), "utf8")
);
const skillsRaw = JSON.parse(readFileSync(path.join(repo, "src-data/Skills.json"), "utf8"));

const STATS = ["hp", "mp", "atk", "def", "mat", "mdf", "agi"];
const PARAM_INDEX = { hp: 0, mp: 1, atk: 2, def: 3, mat: 4, mdf: 5, agi: 6 };

function unifiedParam(base, stat, level) {
  const mult = 0.3 + 0.034 * level;
  if (stat === "hp") return Math.max(1, Math.floor(base * mult) + level + 5);
  if (stat === "mp") return Math.max(0, Math.floor(base * mult) + 5);
  return Math.max(1, Math.floor(base * mult) + 5);
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  return (
    "{" +
    Object.keys(value)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
      .join(",") +
    "}"
  );
}

const species = {};
for (const rec of speciesRaw) {
  if (!rec || typeof rec.id !== "number") continue;
  const bases = [rec.base, rec.baseStats].filter(Boolean);
  if (!bases.length) continue;
  const baseMin = {};
  const baseMax = {};
  for (const stat of STATS) {
    baseMin[stat] = Math.min(...bases.map((b) => b[stat] ?? 0));
    baseMax[stat] = Math.max(...bases.map((b) => b[stat] ?? 0));
  }
  species[rec.id] = {
    name: rec.name,
    baseMin,
    baseMax,
    learnset: [...new Set((rec.learnings || []).map((l) => l.skillId))].sort((a, b) => a - b),
  };
}

const skills = {};
for (const rec of skillsRaw) {
  if (!rec || typeof rec.id !== "number" || !rec.name) continue;
  skills[rec.id] = { name: rec.name };
}

const contentHash = createHash("sha256")
  .update(
    canonical({
      species: Object.fromEntries(
        Object.entries(species).map(([id, s]) => [id, { baseMax: s.baseMax, learnset: s.learnset }])
      ),
      skillIds: Object.keys(skills).map(Number).sort((a, b) => a - b),
    }),
    "utf8"
  )
  .digest("hex");

const out = {
  generatedFrom: ["razer-original/ganjuko/data/GanjukoSpecies.json", "src-data/Skills.json"],
  speciesCount: Object.keys(species).length,
  skillCount: Object.keys(skills).length,
  contentHash,
  paramIndex: PARAM_INDEX,
  species,
  skills,
};

writeFileSync(path.join(root, "../data/game-data.json"), JSON.stringify(out));
console.log(
  `game-data.json: ${out.speciesCount} species, ${out.skillCount} skills, contentHash=${contentHash}`
);
