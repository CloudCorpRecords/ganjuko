// rig2 regression — Fix Round 2 unit suite (11 checks), one command.
"use strict";
const { Reporter } = require("../lib/results");
const { runUnitSuite, ENGINE_PATH } = require("../lib/units");
const { md5File } = require("../lib/results");

async function run({ target, outDir }) {
  const rep = new Reporter({ suite: "regression-fr2", target: "unit", engineMd5: md5File(ENGINE_PATH), outDir });
  await runUnitSuite(rep, "fix-round-2.test.js", 11);
  return rep.write();
}
module.exports = { run };
