// rig2 ship-gate — the verdict an OTA publish step can require.
// Runs: FR1 + FR2 unit suites (against the engine source under test), the
// static audit (local targets), and the live smoke suite; then certifies ONLY
// if every component passes AND the target's live engine md5 equals the
// unit-tested engine's md5. Emits verdict.json + verdict.md with stable names
// in the output dir, alongside the standard timestamped results.
"use strict";
const fs = require("fs");
const path = require("path");
const { Reporter, md5File } = require("../lib/results");
const { runUnitSuite, ENGINE_PATH } = require("../lib/units");
const { auditAssets, validateSpecies } = require("../lib/static-audit");
const { DEFAULT_GAME_DIR } = require("../lib/live");
const smoke = require("./smoke");

async function run({ target, outDir, port, cdpPort }) {
  const unitEngineMd5 = md5File(ENGINE_PATH);
  const rep = new Reporter({ suite: "shipgate", target, engineMd5: unitEngineMd5, outDir });
  rep.note(`unit-tested engine: ${ENGINE_PATH} md5=${unitEngineMd5}`);

  await runUnitSuite(rep, "fix-round-1.test.js", 10);
  await runUnitSuite(rep, "fix-round-2.test.js", 11);

  let targetEngineMd5 = null;
  if (target === "local" || target === "razer-chrome") {
    const dir = process.env.RIG2_GAME_DIR || DEFAULT_GAME_DIR;
    targetEngineMd5 = md5File(path.join(dir, "js/plugins/GanjukoEngine.js"));
    const assets = auditAssets(dir);
    await rep.check("shipgate.static.noRealMisses", assets.misses.length === 0,
      assets.misses.length ? "REAL misses: " + assets.misses.map((m) => `${m.cls}/${m.name}`).join(" | ") : `all ${assets.distinct} distinct references resolve`);
    const sp = validateSpecies(dir);
    await rep.check("shipgate.static.species", sp.ok, sp.ok ? "species validation clean" : sp.problems.join("; "));
  } else {
    await rep.check("shipgate.static.noRealMisses", false, "static audit needs local files; for razer targets run it against a synced copy (RIG2_GAME_DIR) as a separate step");
  }

  const smokeOut = await smoke.run({ target, outDir, port, cdpPort });
  const s = smokeOut.summary;
  targetEngineMd5 = s.engineMd5 || targetEngineMd5;
  await rep.check("shipgate.smoke", s.verdict === "PASS", `smoke ${s.passed}/${s.total} passed on target engine md5=${s.engineMd5}`);
  await rep.check("shipgate.engineConsistency", !!targetEngineMd5 && targetEngineMd5 === unitEngineMd5,
    `target engine md5=${targetEngineMd5} vs unit-tested md5=${unitEngineMd5} — a gate cannot certify a build it did not test`);

  const { summary } = await rep.write();
  const verdict = {
    verdict: summary.verdict,
    gate: "ganjuko-shipgate-v1",
    target,
    unitEngineMd5,
    targetEngineMd5,
    at: new Date().toISOString(),
    failedChecks: summary.checks.filter((c) => !c.pass).map((c) => c.id),
    totalChecks: summary.total,
    passedChecks: summary.passed,
  };
  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "verdict.json"), JSON.stringify(verdict, null, 2), "utf8");
    fs.writeFileSync(path.join(outDir, "verdict.md"),
      `# Ship-gate verdict: ${verdict.verdict}\n\n- target: ${target}\n- unit-tested engine md5: ${unitEngineMd5}\n- target engine md5: ${targetEngineMd5}\n- checks: ${verdict.passedChecks}/${verdict.totalChecks}\n- failed: ${verdict.failedChecks.join(", ") || "none"}\n`, "utf8");
  } catch (e) {
    // Write-guard: the verdict still counts — it is printed by run.js.
    verdict.persistError = String((e && e.code) || e);
  }
  return { summary, verdict };
}

module.exports = { run };
