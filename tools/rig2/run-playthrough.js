#!/usr/bin/env node
// rig2 playthrough runner — standalone entry for suites/playthrough.js.
// Exists separately from run.js because (a) a full playthrough runs for
// hours, far past run.js's 25-minute suite watchdog, and (b) run.js is
// shared infra other lanes drive concurrently; this file touches nothing
// they own. Usage:
//   node run-playthrough.js [--target razer-chrome|local|phone] [--port N] [--cdp-port N]
// Exit code 0 iff the suite verdict is PASS (all checkpoints). A baseline
// STALL is an honest FAIL verdict with the full record on stdout
// (PLAYTHROUGH-CP / PLAYTHROUGH-VERDICT lines) and in results/playthrough/.
"use strict";
const path = require("path");

async function main() {
  const args = { target: "razer-chrome", outDir: path.join(__dirname, "results"), port: 8971, cdpPort: 9333 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--target") args.target = argv[++i];
    else if (argv[i] === "--out") args.outDir = argv[++i];
    else if (argv[i] === "--port") args.port = parseInt(argv[++i], 10);
    else if (argv[i] === "--cdp-port") args.cdpPort = parseInt(argv[++i], 10);
  }
  const mod = require("./suites/playthrough");
  console.log(`\n=== rig2 playthrough (target=${args.target}) ===`);
  const out = await mod.run(args);
  const summary = out.summary || null;
  console.log(`--- playthrough: ${summary ? summary.verdict : "?"} (${summary ? `${summary.passed}/${summary.total}` : "no summary"}) -> ${out.jsonPath || out.mdPath || ""}`);
  if (out.persistError) console.log("!!! result files blocked (" + out.persistError + "); the PLAYTHROUGH-* stdout lines carry the record.");
  if (summary) console.log("RIG2-SUMMARY " + JSON.stringify(summary));
  process.exit(summary && summary.verdict === "PASS" ? 0 : 1);
}

main().catch((e) => { console.error("playthrough runner error:", e && e.message || e); process.exit(2); });
