#!/usr/bin/env node
// rig2 CLI — one command per suite.
//   node run.js smoke|regression-fr1|regression-fr2|static|demo-battle|shipgate|all
//   options: --target local|razer (default local) --out DIR --port N --cdp-port N
// Exit code 0 iff every suite verdict is PASS. See ../../playtest/TESTING.md.
"use strict";
const path = require("path");

const SUITES = {
  "smoke": () => require("./suites/smoke"),
  "regression-fr1": () => require("./suites/regression-fr1"),
  "regression-fr2": () => require("./suites/regression-fr2"),
  "static": () => require("./suites/static"),
  "demo-battle": () => require("./suites/demo-battle"),
  "p2b": () => require("./suites/p2b"),
  "p2c": () => require("./suites/p2c"),
  "prov": () => require("./suites/prov"),
  "route-walk": () => require("./suites/route-walk"),
  "shipgate": () => require("./suites/shipgate"),
  "v13-drives": () => require("./suites/v13-drives"),
  "recon-p3": () => require("./suites/recon-p3"),
  "pass3": () => require("./suites/pass3"),
  "section18": () => require("./suites/section18"),
  "section19": () => require("./suites/section19"),
  "probe19": () => require("./suites/probe19"),
  "phone-smoke": () => require("./suites/phone-smoke"),
};
const ALL = ["regression-fr1", "regression-fr2", "static", "smoke", "demo-battle"];
const SUITE_TIMEOUT_MS = 25 * 60 * 1000;

function parseArgs(argv) {
  // Default target is razer-chrome: it serves the VM-LOCAL copy (local-first
  // content) but renders it in a throwaway Razer Chrome, because this VM's
  // hardened Chromium refuses direct launches from agent shells. Use
  // --target local on hosts with a launchable Chrome; --target razer is the
  // ship-gate check against the Razer's live :8080 build.
  const args = { suite: argv[0] || "smoke", target: "razer-chrome", outDir: path.join(__dirname, "results"), port: 8971, cdpPort: 9333 };
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === "--target") args.target = argv[++i];
    else if (argv[i] === "--out") args.outDir = argv[++i];
    else if (argv[i] === "--port") args.port = parseInt(argv[++i], 10);
    else if (argv[i] === "--cdp-port") args.cdpPort = parseInt(argv[++i], 10);
  }
  return args;
}

async function runOne(name, args) {
  const mod = SUITES[name]();
  console.log(`\n=== rig2 ${name} (target=${args.target}) ===`);
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error(`suite watchdog ${SUITE_TIMEOUT_MS / 60000} min`)), SUITE_TIMEOUT_MS));
  const out = await Promise.race([mod.run(args), timeout]);
  const summary = out.summary || (out.verdict ? out.summary : null);
  console.log(`--- ${name}: ${summary ? summary.verdict : "?"} (${summary ? `${summary.passed}/${summary.total}` : "no summary"}) -> ${out.jsonPath || out.mdPath || ""}`);
  if (out.persistError) console.log(`!!! result files blocked (${out.persistError}); persist the RIG2-SUMMARY line below from a clean step (see TESTING.md).`);
  if (summary) console.log("RIG2-SUMMARY " + JSON.stringify(summary));
  if (out.verdict) console.log("RIG2-VERDICT " + JSON.stringify(out.verdict));
  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const names = args.suite === "all" ? ALL : [args.suite];
  for (const n of names) if (!SUITES[n]) { console.error("unknown suite: " + n + " (have: " + Object.keys(SUITES).join(", ") + ", all)"); process.exit(2); }
  let allPass = true;
  for (const n of names) {
    try {
      const s = await runOne(n, args);
      if (!s || s.verdict !== "PASS") allPass = false;
    } catch (e) {
      console.error(`--- ${n}: SUITE ERROR ${e && e.message || e}`);
      allPass = false;
    }
  }
  process.exit(allPass ? 0 : 1);
}

main();
