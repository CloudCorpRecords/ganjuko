// rig2 static suite — asset-reference audit + species validation against a
// local game directory (no browser). For --target razer there are no local
// files to audit; point RIG2_GAME_DIR at a synced copy instead.
"use strict";
const fs = require("fs");
const path = require("path");
const { Reporter, md5File } = require("../lib/results");
const { auditAssets, validateSpecies } = require("../lib/static-audit");
const { DEFAULT_GAME_DIR } = require("../lib/live");

async function run({ target, outDir }) {
  const dir = process.env.RIG2_GAME_DIR || DEFAULT_GAME_DIR;
  const rep = new Reporter({ suite: "static", target: dir, engineMd5: md5File(path.join(dir, "js/plugins/GanjukoEngine.js")), outDir });
  if (!fs.existsSync(path.join(dir, "data"))) {
    await rep.check("static.available", false, "no data/ under " + dir);
    return rep.write();
  }
  const assets = auditAssets(dir);
  rep.note(`asset refs: ${assets.distinct} distinct, ${assets.totalLocations} locations, by class ${JSON.stringify(assets.byClass)}`);
  await rep.check("static.assets.noRealMisses", assets.misses.length === 0,
    assets.misses.length ? "REAL misses: " + assets.misses.map((m) => `${m.cls}/${m.name} (${m.locations.join("; ")})`).join(" | ") : `all ${assets.distinct} distinct references resolve`);
  const sp = validateSpecies(dir);
  await rep.check("static.species", sp.ok, sp.ok ? `species validation clean: ${JSON.stringify(sp.counts)}` : sp.problems.join("; ") + ` counts=${JSON.stringify(sp.counts)}`);
  return rep.write();
}
module.exports = { run };
