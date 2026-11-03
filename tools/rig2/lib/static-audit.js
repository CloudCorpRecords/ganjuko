// rig2 static integrity audit — the QA program's 544-reference asset scan and
// species/evolveTo validation, as a runnable check (see playtest/qa-static/
// STATIC-SUMMARY.md for the original methodology this reproduces).
// Read-only: parses data/*.json + the engine's asset literals, checks every
// referenced file exists in the target tree. Never writes to the game dir.
"use strict";
const fs = require("fs");
const path = require("path");

const EXT = {
  audio: [".ogg", ".m4a"],
  img: [".png"],
  effects: [".efkefc"],
  movies: [".mp4", ".webm"],
};

function kindOf(cls) {
  if (cls.startsWith("audio/")) return "audio";
  if (cls.startsWith("img/")) return "img";
  if (cls === "effects") return "effects";
  if (cls === "movies") return "movies";
  return "img";
}

class RefSet {
  constructor(root) {
    this.root = root;
    this.refs = new Map(); // "class::name" -> {cls, name, locations:Set}
    this.totalLocations = 0;
  }
  add(cls, name, loc) {
    if (!name || typeof name !== "string") return;
    const key = cls + "::" + name;
    if (!this.refs.has(key)) this.refs.set(key, { cls, name, locations: new Set() });
    this.refs.get(key).locations.add(loc);
    this.totalLocations++;
  }
  resolve() {
    const misses = [];
    const byClass = {};
    for (const r of this.refs.values()) {
      byClass[r.cls] = (byClass[r.cls] || 0) + 1;
      const dir = path.join(this.root, ...r.cls.split("/"));
      const exts = EXT[kindOf(r.cls)];
      const found = exts.some((e) => fs.existsSync(path.join(dir, r.name + e)));
      if (!found) misses.push({ cls: r.cls, name: r.name, locations: [...r.locations].slice(0, 4) });
    }
    return { distinct: this.refs.size, totalLocations: this.totalLocations, byClass, misses };
  }
}

const AUDIO_METHOD_CLASS = { playBgm: "audio/bgm", playBgs: "audio/bgs", playMe: "audio/me", playSe: "audio/se" };
const LOADER_CLASS = {
  loadEnemy: "img/enemies", loadCharacter: "img/characters", loadPicture: "img/pictures",
  loadFace: "img/faces", loadSystem: "img/system", loadTileset: "img/tilesets",
  loadBattleback1: "img/battlebacks1", loadBattleback2: "img/battlebacks2", loadParallax: "img/parallaxes",
  loadTitle1: "img/titles1", loadTitle2: "img/titles2", loadAnimation: "effects",
};

function scanScriptText(refs, text, loc) {
  if (!text) return;
  let m;
  const reAudio = /(playBgm|playBgs|playMe|playSe)\(\s*\{\s*name:\s*"([^"]+)"/g;
  while ((m = reAudio.exec(text))) refs.add(AUDIO_METHOD_CLASS[m[1]], m[2], loc);
  const reLoad = /(loadEnemy|loadCharacter|loadPicture|loadFace|loadSystem|loadTileset|loadBattleback1|loadBattleback2|loadParallax|loadTitle1|loadTitle2|loadAnimation)\(\s*"([^"]+)"/g;
  while ((m = reLoad.exec(text))) refs.add(LOADER_CLASS[m[1]], m[2], loc);
}

function scanCommandList(refs, list, loc) {
  if (!Array.isArray(list)) return;
  for (const cmd of list) {
    if (!cmd || typeof cmd.code !== "number") continue;
    const p = cmd.parameters || [];
    switch (cmd.code) {
      case 101: refs.add("img/faces", p[0], loc + " 101"); break;
      case 132: if (p[0]) refs.add("audio/bgm", p[0].name, loc + " 132"); break;
      case 133: if (p[0]) refs.add("audio/me", p[0].name, loc + " 133"); break;
      case 139: if (p[0]) refs.add("audio/me", p[0].name, loc + " 139"); break;
      case 140: if (p[0]) refs.add("audio/bgm", p[0].name, loc + " 140"); break;
      case 205: {
        const route = p[1];
        if (route && Array.isArray(route.list)) {
          for (const rc of route.list) {
            if (!rc) continue;
            if (rc.code === 41 && rc.parameters) refs.add("img/characters", rc.parameters[0], loc + " 205/41");
            if (rc.code === 44 && rc.parameters && rc.parameters[0]) refs.add("audio/se", rc.parameters[0].name, loc + " 205/44");
          }
        }
        break;
      }
      case 231: refs.add("img/pictures", p[1], loc + " 231"); break;
      case 241: if (p[0]) refs.add("audio/bgm", p[0].name, loc + " 241"); break;
      case 245: if (p[0]) refs.add("audio/bgs", p[0].name, loc + " 245"); break;
      case 249: if (p[0]) refs.add("audio/me", p[0].name, loc + " 249"); break;
      case 250: if (p[0]) refs.add("audio/se", p[0].name, loc + " 250"); break;
      case 261: refs.add("movies", p[0], loc + " 261"); break;
      case 322:
        refs.add("img/characters", p[1], loc + " 322");
        refs.add("img/faces", p[3], loc + " 322");
        break;
      case 323: refs.add("img/characters", p[1], loc + " 323"); break;
      case 355: case 655: scanScriptText(refs, p[0], loc + " script"); break;
    }
  }
}

function readJson(root, rel) {
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")); } catch (e) { return null; }
}

function auditAssets(root) {
  const refs = new RefSet(root);
  const dataDir = path.join(root, "data");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const data = readJson(root, path.join("data", f));
    if (!data) continue;
    if (/^Map\d+\.json$/.test(f)) {
      refs.add("img/battlebacks1", data.battleback1Name, f + " battleback1Name");
      refs.add("img/battlebacks2", data.battleback2Name, f + " battleback2Name");
      if (data.bgm) refs.add("audio/bgm", data.bgm.name, f + " bgm");
      if (data.bgs) refs.add("audio/bgs", data.bgs.name, f + " bgs");
      refs.add("img/parallaxes", data.parallaxName, f + " parallaxName");
      for (const ev of data.events || []) {
        if (!ev) continue;
        for (const page of ev.pages || []) {
          if (!page) continue;
          if (page.image) refs.add("img/characters", page.image.characterName, `${f} ev${ev.id} page image`);
          scanCommandList(refs, page.list, `${f} ev${ev.id}`);
        }
      }
    } else if (f === "CommonEvents.json" || f === "Troops.json") {
      const list = f === "CommonEvents.json" ? data : (data || []).flatMap((t) => (t && t.pages) || []);
      if (f === "CommonEvents.json") for (const ce of data || []) { if (ce) scanCommandList(refs, ce.list, `CommonEvents ${ce.id}`); }
      else for (const page of list) scanCommandList(refs, page.list, "Troops");
    } else if (f === "System.json") {
      refs.add("img/titles1", data.title1Name, "System title1Name");
      refs.add("img/titles2", data.title2Name, "System title2Name");
      refs.add("img/battlebacks1", data.battleback1Name, "System battleback1Name");
      refs.add("img/battlebacks2", data.battleback2Name, "System battleback2Name");
      for (const k of ["titleBgm", "battleBgm", "boatBgm", "shipBgm", "airshipBgm"]) if (data[k]) refs.add("audio/bgm", data[k].name, "System " + k);
      for (const k of ["victoryMe", "defeatMe", "gameoverMe"]) if (data[k]) refs.add("audio/me", data[k].name, "System " + k);
      for (const s of data.sounds || []) if (s) refs.add("audio/se", s.name, "System sounds");
      for (const k of ["boat", "ship", "airship"]) if (data.vehicles && data.vehicles[k === "boat" ? 0 : k === "ship" ? 1 : 2]) refs.add("img/characters", data.vehicles[k === "boat" ? 0 : k === "ship" ? 1 : 2].characterName, "System vehicle " + k);
    } else if (f === "Actors.json") {
      for (const a of data || []) {
        if (!a) continue;
        refs.add("img/characters", a.characterName, "Actors " + a.id);
        refs.add("img/faces", a.faceName, "Actors " + a.id);
        // Engine semantics: actor battlers load via ImageManager.loadEnemy
        // (resolveBattlerName), NOT img/sv_actors — see STATIC-SUMMARY.
        refs.add("img/enemies", a.battlerName, "Actors " + a.id + " battlerName(loadEnemy)");
      }
    } else if (f === "Enemies.json") {
      for (const e of data || []) if (e) refs.add("img/enemies", e.battlerName, "Enemies " + e.id);
    } else if (f === "Animations.json") {
      for (const a of data || []) {
        if (!a) continue;
        refs.add("effects", a.effectName, "Animations " + a.id);
        for (const t of a.soundTimings || []) if (t && t.se) refs.add("audio/se", t.se.name, "Animations " + a.id);
      }
    } else if (f === "Tilesets.json") {
      for (const t of data || []) {
        if (!t) continue;
        for (const n of t.tilesetNames || []) refs.add("img/tilesets", n, "Tilesets " + t.id);
      }
    } else if (f === "GanjukoSpecies.json") {
      for (const sp of Array.isArray(data) ? data : []) {
        if (!sp) continue;
        refs.add("img/enemies", sp.battlerName || sp.battler, "GanjukoSpecies " + sp.id);
        refs.add("img/characters", sp.characterName || sp.charName, "GanjukoSpecies " + sp.id);
      }
    }
  }
  // Engine literals
  const enginePath = path.join(root, "js", "plugins", "GanjukoEngine.js");
  if (fs.existsSync(enginePath)) scanScriptText(refs, fs.readFileSync(enginePath, "utf8"), "GanjukoEngine.js");
  return refs.resolve();
}

function validateSpecies(root) {
  const data = readJson(root, path.join("data", "GanjukoSpecies.json"));
  const skills = readJson(root, path.join("data", "Skills.json"));
  const out = { ok: false, problems: [] };
  if (!Array.isArray(data)) { out.problems.push("GanjukoSpecies.json is not an array"); return out; }
  const skillIds = new Set((skills || []).filter(Boolean).map((s) => s.id));
  const ids = new Set();
  const names = new Set();
  const byId = new Map();
  let dupId = 0, dupName = 0, badEvolve = 0, badCatch = 0, badStats = 0, badSkill = 0, badType = 0;
  for (const sp of data) {
    if (!sp) continue;
    if (ids.has(sp.id)) dupId++; ids.add(sp.id);
    if (names.has(sp.name)) dupName++; names.add(sp.name);
    byId.set(sp.id, sp);
  }
  const STATS = ["hp", "mp", "atk", "def", "mat", "mdf", "agi"];
  for (const sp of data) {
    if (!sp) continue;
    if (sp.evolveTo && !byId.has(sp.evolveTo)) badEvolve++;
    if (typeof sp.catchRate !== "number" || sp.catchRate < 3 || sp.catchRate > 255) badCatch++;
    const base = sp.base || sp.baseStats;
    if (!base || STATS.some((k) => typeof base[k] !== "number")) badStats++;
    for (const l of sp.learnings || []) if (!skillIds.has(l.skillId)) badSkill++;
    const t1 = sp.type1 != null ? sp.type1 : sp.type;
    if (typeof t1 !== "number" || t1 < 1 || t1 > 9) badType++;
  }
  out.counts = { records: data.length, dupId, dupName, badEvolve, badCatch, badStats, badSkill, badType };
  if (data.length !== 504) out.problems.push(`species records ${data.length} != 504`);
  if (dupId) out.problems.push(`${dupId} duplicate species ids`);
  if (dupName) out.problems.push(`${dupName} duplicate species names`);
  if (badEvolve) out.problems.push(`${badEvolve} evolveTo targets do not resolve by record id`);
  if (badCatch) out.problems.push(`${badCatch} catchRate out of 3..255`);
  if (badStats) out.problems.push(`${badStats} incomplete stat blocks`);
  if (badSkill) out.problems.push(`${badSkill} learnset skill ids missing from Skills.json`);
  if (badType) out.problems.push(`${badType} primary types out of 1..9`);
  out.ok = out.problems.length === 0;
  return out;
}

module.exports = { auditAssets, validateSpecies };
