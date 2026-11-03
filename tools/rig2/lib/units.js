// rig2 unit-suite runner — executes the existing Node regression suites
// (work/engine/tests/fix-round-*.test.js, which stub-load the engine source)
// and translates their PASS/FAIL lines into rig2 checks, stamped with the
// md5 of the engine file under test.
"use strict";
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const { md5File } = require("./results");

const TESTS_DIR = path.join(process.env.HOME, "workspace/ganjuko/work/engine/tests");
const ENGINE_PATH = path.join(process.env.HOME, "workspace/ganjuko/work/GanjukoEngine.js");

function runUnitFile(file) {
  return new Promise((resolve) => {
    execFile("node", [path.join(TESTS_DIR, file)], { timeout: 120000, cwd: TESTS_DIR }, (err, stdout, stderr) => {
      const lines = String(stdout || "").split("\n");
      const checks = [];
      for (const line of lines) {
        let m = line.match(/^PASS (.+)$/);
        if (m) { checks.push({ name: m[1], pass: true, detail: "" }); continue; }
        m = line.match(/^FAIL (.+?) - (.*)$/);
        if (m) { checks.push({ name: m[1], pass: false, detail: m[2] }); continue; }
        m = line.match(/^FAIL (.+)$/);
        if (m) { checks.push({ name: m[1], pass: false, detail: "" }); }
      }
      resolve({ checks, exitCode: err ? (err.code != null ? err.code : 1) : 0, stderr: String(stderr || "").slice(0, 500), raw: lines.join("\n") });
    });
  });
}

async function runUnitSuite(reporter, file, expectedCount) {
  const engineMd5 = md5File(ENGINE_PATH);
  reporter.note(`unit engine under test: ${ENGINE_PATH} md5=${engineMd5}`);
  const r = await runUnitFile(file);
  for (const c of r.checks) await reporter.check("unit." + c.name, c.pass, c.detail || file);
  await reporter.check("unit.count", r.checks.length === expectedCount, `${r.checks.length} checks parsed from ${file} (expected ${expectedCount}), exit=${r.exitCode}`);
  if (r.stderr) reporter.note("stderr: " + r.stderr);
  return r;
}

module.exports = { runUnitSuite, runUnitFile, TESTS_DIR, ENGINE_PATH };
