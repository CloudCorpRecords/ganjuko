// rig2 playthrough suite — the full honest playthrough of PLAYTHROUGH-TEST.md.
// A fresh character walks the game: opening chain, Route 1, gyms 1-8 (fly
// between the fly-gyms as the game intends), Victory Road, Champion. All
// state changes happen through the real UI (see lib/playthrough-core.js).
// Checkpoints follow the spec ladder CP0-CP16; a wall that outlasts its
// grind budget ends the run as a HARD STALL with the wall state recorded.
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const { sleep } = require("../lib/cdp");
const core = require("../lib/playthrough-core");
const battleLib = require("../lib/battle");

// Portal graph, data-derived from the shipped maps (transfer event tiles).
// portals[from] = [{x, y, to}] — step on (x,y) to transfer to map `to`.
const PORTALS = {
  1: [{ x: 16, y: 14, to: 2 }, { x: 10, y: 0, to: 3 }],
  2: [{ x: 8, y: 12, to: 1 }],
  3: [{ x: 11, y: 29, to: 1 }, { x: 11, y: 0, to: 4 }],
  4: [{ x: 12, y: 21, to: 3 }, { x: 7, y: 12, to: 5 }, { x: 18, y: 12, to: 6 }, { x: 25, y: 14, to: 7 }],
  5: [{ x: 9, y: 12, to: 4 }],
  6: [{ x: 8, y: 18, to: 4 }],
  7: [{ x: 0, y: 11, to: 4 }, { x: 9, y: 0, to: 8 }, { x: 25, y: 11, to: 9 }],
  8: [{ x: 12, y: 27, to: 7 }],
  9: [{ x: 0, y: 12, to: 7 }, { x: 7, y: 8, to: 5 }, { x: 18, y: 8, to: 10 }, { x: 12, y: 0, to: 11 }],
  10: [{ x: 8, y: 18, to: 9 }],
  11: [{ x: 12, y: 29, to: 9 }, { x: 12, y: 0, to: 12 }],
  12: [{ x: 12, y: 25, to: 11 }, { x: 7, y: 9, to: 5 }, { x: 19, y: 9, to: 13 }, { x: 19, y: 10, to: 15 }],
  13: [{ x: 8, y: 18, to: 12 }],
  14: [{ x: 10, y: 22, to: 12 }],
  15: [{ x: 0, y: 10, to: 12 }, { x: 24, y: 10, to: 16 }],
  16: [{ x: 8, y: 18, to: 15 }],
  17: [{ x: 0, y: 10, to: 15 }, { x: 24, y: 10, to: 18 }],
  18: [{ x: 8, y: 18, to: 17 }],
  19: [{ x: 0, y: 10, to: 17 }, { x: 24, y: 10, to: 20 }],
  20: [{ x: 8, y: 18, to: 19 }],
  21: [{ x: 0, y: 10, to: 19 }, { x: 24, y: 10, to: 22 }],
  22: [{ x: 8, y: 18, to: 21 }],
  23: [{ x: 0, y: 10, to: 21 }, { x: 24, y: 10, to: 24 }],
  24: [{ x: 8, y: 18, to: 23 }, { x: 8, y: 1, to: 25 }],
  25: [{ x: 12, y: 29, to: 24 }, { x: 12, y: 1, to: 26 }],
  26: [{ x: 12, y: 29, to: 25 }],
};

const PRICES = { 1: 200, 4: 150, 5: 400 };
const WALL_BUDGET_MS = 90 * 60 * 1000;
const WALL_BUDGET_BATTLES = 120;
const GLOBAL_CAP_MS = 6 * 60 * 60 * 1000;

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "playthrough", target, engineMd5: preEngineMd5(target), outDir });
  const ptDir = path.join(outDir, "playthrough");
  try { fs.mkdirSync(ptDir, { recursive: true }); } catch (e) {}
  let live = null;
  const t0 = Date.now();
  const elapsed = () => Date.now() - t0;

  const ctx = {
    session: null, task: null, flyResult: null,
    ownedSpecies: new Set(),
    policyMode: "wild",
    tallies: { battles: 0, wins: 0, losses: 0, catches: 0, blackouts: 0, throws: 0, potions: 0 },
    catches: [], battleLog: [], defects: [], checkpoints: {},
    stall: null, globalDeadline: t0 + GLOBAL_CAP_MS,
    log(msg) { console.log("  [pt] " + msg); rep.note(msg); },
    defect(id, detail) { this.defects.push({ id, detail, at: elapsed() }); this.log("DEFECT " + id + ": " + detail); },
  };
  ctx.battlePolicy = () => ctx.policyMode === "trainer"
    ? { kind: "trainer", capture: false, potions: [4, 5], potionBelow: 0.3, potionMax: 3, leadSwitch: true, forceTactics: true, timeoutMs: 420000 }
    : { kind: "wild", capture: true, orbItem: 1, maxThrows: 6, potions: [], leadSwitch: false, timeoutMs: 300000 };
  ctx.onBattle = (rec) => {
    ctx.tallies.battles++;
    ctx.tallies.throws += rec.throws || 0;
    ctx.tallies.potions += rec.potionsUsed || 0;
    if (rec.outcome === "win" || rec.outcome === "caught") ctx.tallies.wins++;
    if (rec.outcome === "defeat") ctx.tallies.losses++;
    if (rec.blackout) ctx.tallies.blackouts++;
    if (rec.outcome === "caught" && rec.foe && rec.foe.sp) {
      ctx.tallies.catches++;
      ctx.catches.push({ sp: rec.foe.sp, name: rec.foe.name, lv: rec.foe.lv, throws: rec.throws });
      ctx.ownedSpecies.add(rec.foe.sp);
    }
    ctx.battleLog.push({ ...rec, at: elapsed() });
    ctx.log(`battle: ${rec.kind} vs ${rec.foe ? rec.foe.name + " Lv" + rec.foe.lv : "?"} -> ${rec.outcome} (turns=${rec.turns}, throws=${rec.throws || 0})`);
  };
  ctx.flow = (opts) => core.driveFlow(ctx.session, ctx, opts || {});

  const S = () => ctx.session;
  async function refreshOwned() {
    const ids = await S().evSafe(`(function(){ const out = new Set(); $gameParty.allMembers().forEach(m => out.add(m.ganjukoSpeciesId())); try { if ($gameSystem.ganjukoBox) $gameSystem.ganjukoBox().forEach(e => out.add(typeof e === "number" ? e : (e.ganjukoSpeciesId ? e.ganjukoSpeciesId() : e))); } catch (e) {} return [...out]; })()`);
    if (Array.isArray(ids)) ctx.ownedSpecies = new Set(ids);
    return ctx.ownedSpecies;
  }

  async function checkpoint(id, pass, detail) {
    const st = await core.runState(S());
    const rec = { id, pass: !!pass, detail, elapsedMs: elapsed(), state: st, tallies: { ...ctx.tallies } };
    ctx.checkpoints[id] = rec;
    console.log("PLAYTHROUGH-CP " + JSON.stringify(rec));
    try { fs.writeFileSync(path.join(ptDir, id + ".json"), JSON.stringify(rec, null, 2)); } catch (e) {}
    try { await S().cdp.screenshot(path.join(ptDir, id + ".png")); } catch (e) {}
    await rep.check("playthrough." + id, !!pass, `${detail} | party=${st ? st.party.map(m => m.name + " Lv" + m.lv + " " + m.hp + "/" + m.mhp).join(", ") : "?"} gold=${st ? st.gold : "?"} badges=${st ? st.badgeCount : "?"}`);
    return rec;
  }
  async function subCheck(id, pass, detail) {
    ctx.log(`sub ${id}: ${pass ? "PASS" : "FAIL"} — ${detail}`);
    await rep.check("playthrough." + id, !!pass, detail);
    return !!pass;
  }

  // ---- travel / heal / shop helpers ----
  async function gotoMap(mapId, opts) { return core.gotoMap(S(), ctx, PORTALS, mapId, opts || {}); }
  async function healVia(mapId, eventId, label) {
    const g = await gotoMap(mapId);
    if (!g.ok) { ctx.log(`heal: could not reach map ${mapId}: ${g.why}`); return false; }
    const r = await core.interactEvent(S(), ctx, eventId, { flowTimeoutMs: 120000 });
    const st = await core.runState(S());
    const full = st && core.partyHpPct(st) > 0.99;
    ctx.log(`heal at ${label}: ${full ? "party full" : "party at " + Math.round(core.partyHpPct(st || { party: [] }) * 100) + "%"}`);
    return !!full;
  }
  // Nearest practical heal for the current area (spec policy).
  async function healNearest() {
    const st = await core.runState(S());
    if (!st) return false;
    const m = st.map;
    if (m === 26 || m === 25) return healVia(26, 3, "League Nurse Momo");
    if (m >= 15) { // fly-gym island: fly to Kurogane (always unlocked), walk to Center
      const f = await core.flyTo(S(), ctx, 4);
      if (f.ok) return healVia(5, 4, "Center Nurse Momo");
      return healVia(5, 4, "Center Nurse Momo");
    }
    if (m >= 4) return healVia(5, 4, "Center Nurse Momo");
    return healVia(1, 12, "Mom (Wakaba)");
  }
  async function maybeHeal(threshold = 0.5) {
    const st = await core.runState(S());
    if (st && st.party.length && core.partyHpPct(st) < threshold) {
      ctx.log(`party at ${Math.round(core.partyHpPct(st) * 100)}% — heal detour`);
      await healNearest();
    }
  }
  async function shopStop() {
    const g = await gotoMap(5);
    if (!g.ok) { ctx.log("shop: Center unreachable: " + g.why); return; }
    const st = await core.runState(S());
    if (!st) return;
    let gold = st.gold;
    const want = [];
    const plan = [[1, 6], [4, 4], [5, 2]]; // orbs to 6, potions to 4, super potions to 2
    for (const [itemId, targetN] of plan) {
      const have = st.items[itemId] || 0;
      let n = Math.max(0, targetN - have);
      while (n > 0 && gold - n * PRICES[itemId] < (itemId === 5 ? 300 : 0)) n--;
      while (n > 0 && n * PRICES[itemId] > gold) n--;
      if (n > 0) { want.push({ itemId, count: n }); gold -= n * PRICES[itemId]; }
    }
    if (!want.length) { ctx.log("shop: nothing needed"); return; }
    ctx.task = { type: "shop", buyList: want };
    await core.interactEvent(S(), ctx, 5, { flowTimeoutMs: 240000 });
    const st2 = await core.runState(S());
    ctx.log(`shop done: orbs=${st2 ? st2.items[1] : "?"} potions=${st2 ? st2.items[4] : "?"} super=${st2 ? st2.items[5] : "?"} gold=${st2 ? st2.gold : "?"}`);
  }

  // Maps 17/19/21/23/25 have no walking entrance from the west; they are
  // reached by flying to their gym and exiting, or (25) via Map024.
  const FLY_ANCHORS = { 17: 18, 19: 20, 21: 22, 23: 24, 25: 24 };
  async function travelTo(mapId) {
    const g = await gotoMap(mapId);
    if (g.ok) return g;
    const anchor = FLY_ANCHORS[mapId];
    if (anchor) {
      const f = await core.flyTo(S(), ctx, anchor);
      if (f.ok) { const g2 = await gotoMap(mapId); if (g2.ok) return g2; }
    }
    return g;
  }

  // ---- grind + wall machinery ----
  async function grindBattles(n, opts = {}) {
    // Fight n wild battles on the current map's grass, healing as needed.
    const grassMap = opts.grassMap;
    if (grassMap) { const g = await travelTo(grassMap); if (!g.ok) return { fought: 0, why: "grind map unreachable: " + g.why }; }
    let tiles = await core.grassTiles(S());
    if (!tiles || !tiles.length) return { fought: 0, why: "no bush tiles on map " + (await S().evSafe("$gameMap.mapId()")) };
    const startBattles = ctx.tallies.battles;
    const deadline = Date.now() + (opts.maxMs || WALL_BUDGET_MS);
    let anchor = tiles[0];
    while (ctx.tallies.battles - startBattles < n && Date.now() < deadline && Date.now() < ctx.globalDeadline) {
      // pace between two grass tiles a few steps apart
      const st = await core.runState(S());
      if (!st) break;
      let best = anchor, bestD = 1e9;
      for (const t of tiles) { const d = Math.abs(t[0] - st.x) + Math.abs(t[1] - st.y); if (d >= 3 && d <= 9 && d < bestD) { bestD = d; best = t; } }
      const before = ctx.tallies.battles;
      const w = await core.walkTo(S(), ctx, best[0], best[1], { maxTaps: 60 });
      if (w.status === "blackout") { await healNearest(); const g = await travelTo(grassMap || st.map); if (!g.ok) return { fought: ctx.tallies.battles - startBattles, why: "could not return to grass after blackout" }; tiles = await core.grassTiles(S()); anchor = tiles && tiles[0]; continue; }
      if (w.status === "transferred") { const g = await travelTo(grassMap || st.map); if (!g.ok) return { fought: ctx.tallies.battles - startBattles, why: "wandered off the grind map" }; continue; }
      if (ctx.tallies.battles === before) {
        // no encounter on that leg: hop to a different patch
        anchor = tiles[Math.floor(Math.random() * tiles.length)] || anchor;
        await core.walkTo(S(), ctx, anchor[0], anchor[1], { maxTaps: 80 }).catch(() => {});
      }
      const st2 = await core.runState(S());
      if (st2 && core.partyHpPct(st2) < 0.4) {
        await healNearest();
        const g = await travelTo(grassMap || st.map);
        if (!g.ok) return { fought: ctx.tallies.battles - startBattles, why: "could not return to grass after heal" };
        tiles = await core.grassTiles(S());
      }
      await refreshOwned();
    }
    return { fought: ctx.tallies.battles - startBattles };
  }

  // wallTry: attempt() -> true when the objective state is reached. On each
  // failure, grind a batch of 10 on the wall's grass and retry, until the
  // wall budget (90 min / 120 grind battles) or the global cap runs out.
  async function wallTry(name, attempt, opts = {}) {
    const wall = { name, attempts: 0, grindBattles: 0, grindMs: 0 };
    while (Date.now() < ctx.globalDeadline) {
      wall.attempts++;
      ctx.log(`wall ${name}: attempt ${wall.attempts}`);
      let ok = false;
      try { ok = await attempt(); } catch (e) { ctx.log(`wall ${name}: attempt threw: ${e && e.message || e}`); }
      if (ok) { ctx.log(`wall ${name}: CLEARED in ${wall.attempts} attempt(s), grind=${wall.grindBattles} battles`); return { won: true, wall }; }
      if (opts.noGrind) {
        if (wall.attempts >= (opts.maxAttempts || 40)) return { won: false, wall };
        await sleep(500);
        continue;
      }
      if (wall.grindBattles >= WALL_BUDGET_BATTLES || wall.grindMs >= WALL_BUDGET_MS) return { won: false, wall };
      const g0 = Date.now();
      const batchN = Math.min(10, WALL_BUDGET_BATTLES - wall.grindBattles);
      ctx.log(`wall ${name}: grinding batch of ${batchN} on map ${opts.grassMap}`);
      const g = await grindBattles(batchN, { grassMap: opts.grassMap, maxMs: WALL_BUDGET_MS - wall.grindMs });
      wall.grindBattles += g.fought || 0;
      wall.grindMs += Date.now() - g0;
      if (g.why) ctx.log(`wall ${name}: grind note: ${g.why}`);
      await healNearest();
    }
    return { won: false, wall, why: "global cap reached" };
  }

  function stallAt(cp, wallInfo, detail) {
    ctx.stall = { cp, wall: wallInfo || null, detail, at: elapsed() };
    ctx.log(`HARD STALL at ${cp}: ${detail}`);
  }

  // Challenge a scripted event (trainer/leader/boss) once: travel is the
  // caller's job; this sets trainer tactics, interacts, and reports whether
  // the success predicate holds afterwards.
  async function challenge(eventId, successFn, opts = {}) {
    ctx.policyMode = "trainer";
    const before = await core.runState(S());
    const r = await core.interactEvent(S(), ctx, eventId, { flowTimeoutMs: opts.flowTimeoutMs || 600000 });
    ctx.policyMode = "wild";
    if (!r.ok) { ctx.log(`challenge ev${eventId}: interaction failed: ${r.why}`); return false; }
    const after = await core.runState(S());
    const ok = successFn ? successFn(before, after) : (r.flow && r.flow.battles.length > 0 && !r.flow.blackout);
    return !!ok;
  }
  const switchOn = (id) => (b, a) => a && a.switches && a.switches[id];
  const badgeIs = (n) => (b, a) => a && a.badgeCount >= n;

  try {
    live = await openLive({ target, port, cdpPort });
    ctx.session = live.session;
    rep.engineMd5 = live.engineMd5 || rep.engineMd5;
    rep.attachSession(live.session);
    const boot = await live.session.boot(live.gameUrl);
    rep.note(`boot: focus=${boot.focused} fps=${boot.fps} engine=${live.engineMd5}`);
    if (live.engineMd5 !== "144ff812b5f0ac033f35d095353318ba") {
      rep.note(`WARNING: target engine is ${live.engineMd5}, not the v13 baseline 144ff812b5f0ac033f35d095353318ba — results are stamped with the actual md5 and must be compared accordingly.`);
    }
    // REAL title flow (the pass3-proven route): the title scene's own New
    // Game command births the tutorial state and runs Scene_GanjukoIntro
    // (starter showcase + avatar select). DataManager.setupNewGame() would
    // bypass the intro entirely — not how a player starts, so not how we do.
    await live.session.waitScene("Scene_Title", 90);
    await live.session.ev("SceneManager._scene.commandNewGame()");
    {
      let onMap = false;
      for (let i = 0; i < 70; i++) {
        if ((await live.session.sceneName()) === "Scene_Map") { onMap = true; break; }
        await live.session.holdOk(300);
        await sleep(600);
      }
      if (!onMap) throw new Error("intro scene never handed off to Scene_Map");
      await live.session.settle();
    }
    await battleLib.installHooks(live.session);
    await refreshOwned();

    // ---------------- CP0: new game ----------------
    {
      const st = await core.runState(S());
      await checkpoint("CP0", !!st && st.party.length === 0, `new game through the real intro; landed on Map${st ? st.map : "?"} at (${st ? st.x : "?"},${st ? st.y : "?"}), party empty`);
      if (!st || st.party.length !== 0) { stallAt("CP0", null, "intro did not produce a fresh empty-party state"); throw new Error("stall"); }
    }

    // ---------------- Opening: intercept -> Lab -> starter (CP1) ----------
    {
      // Wherever the intro landed us, get to the Lab; the FR3 intercept
      // chain (leave-town attempt -> Kusu runs up -> Lab) resolves via flow.
      let st0 = await core.runState(S());
      if (st0 && st0.map === 1) await core.walkTo(S(), ctx, 11, 1, { maxTaps: 120 }).catch(() => {}); // provoke the intercept if it wants a leave attempt
      await gotoMap(2).catch(() => {});
      let st = await core.runState(S());
      if (!st || st.map !== 2) {
        await gotoMap(2).catch(() => {});
        st = await core.runState(S());
      }
      if (!st || st.map !== 2) { await checkpoint("CP1", false, "could not reach the Lab (Map002) through the opening chain"); stallAt("CP1", null, "Lab unreachable in opening"); throw new Error("stall"); }
      // Talk to Kusu (the offer), then take the Embit orb (ev4).
      await core.interactEvent(S(), ctx, 7, { flowTimeoutMs: 180000 }).catch(() => {});
      ctx.choicePick = (items) => { const y = items.findIndex(t => /^yes/i.test(String(t).trim())); return y >= 0 ? y : 0; };
      for (let tries = 0; tries < 3; tries++) {
        st = await core.runState(S());
        if (st && st.party.length >= 1) break;
        await core.interactEvent(S(), ctx, 4, { flowTimeoutMs: 180000 }).catch(() => {});
      }
      ctx.choicePick = null;
      st = await core.runState(S());
      const got = !!st && st.party.length >= 1 && st.party[0].sp === 1 && st.party[0].lv === 5;
      await checkpoint("CP1", got, got ? "starter chosen: Embit (pos 1) Lv5" : `starter NOT obtained (party=${st ? JSON.stringify(st.party) : "?"})`);
      if (!got) { stallAt("CP1", null, "starter orb flow did not grant Embit"); throw new Error("stall"); }
    }

    // ---------------- CP2: Rival Haru ----------------
    {
      const res = await wallTry("Rival Haru", async () => {
        const g = await gotoMap(2);
        if (!g.ok) return false;
        return challenge(8, switchOn(5), { flowTimeoutMs: 300000 });
      }, { noGrind: true, maxAttempts: 60 });
      const st = await core.runState(S());
      await checkpoint("CP2", res.won && !!st && st.switches[5], `Rival Haru ${res.won ? "beaten" : "NOT beaten"} after ${res.wall.attempts} attempt(s)`);
      if (!res.won) { stallAt("CP2", res.wall, "Rival Haru unbeaten after retry budget (no grass is reachable before the rival in the opening chain, so each attempt is a fresh RNG roll at Lv5)"); throw new Error("stall"); }
    }

    // ---------------- Route 1: Ren, Sora -> Kurogane (CP3) ----------------
    {
      await healVia(1, 12, "Mom (Wakaba)").catch(() => {});
      const g = await gotoMap(3);
      if (!g.ok) { await checkpoint("CP3", false, "Route 1 (Map003) unreachable: " + g.why); stallAt("CP3", null, "Route 1 unreachable"); throw new Error("stall"); }
      // Walk the spine north; sight battles with Ren (9,18) and Sora (12,9)
      // fire en route through the flow driver.
      await core.walkTo(S(), ctx, 11, 2, { maxTaps: 300 }).catch(() => {});
      let st = await core.runState(S());
      if (st && !st.switches[6]) {
        const res = await wallTry("Bug Catcher Ren", async () => {
          const gg = await gotoMap(3); if (!gg.ok) return false;
          return challenge(9, switchOn(6));
        }, { grassMap: 3 });
        await subCheck("trainer.ren", res.won, `Ren ${res.won ? "beaten" : "NOT beaten"} (attempts=${res.wall.attempts}, grind=${res.wall.grindBattles})`);
        if (!res.won) { await checkpoint("CP3", false, "blocked at Ren on Route 1"); stallAt("CP3", res.wall, "Ren unbeaten after grind budget"); throw new Error("stall"); }
      } else await subCheck("trainer.ren", true, "Ren beaten during the Route 1 crossing");
      st = await core.runState(S());
      if (st && !st.switches[7]) {
        const res = await wallTry("Sky Watcher Sora", async () => {
          const gg = await gotoMap(3); if (!gg.ok) return false;
          return challenge(10, switchOn(7));
        }, { grassMap: 3 });
        await subCheck("trainer.sora", res.won, `Sora ${res.won ? "beaten" : "NOT beaten"} (attempts=${res.wall.attempts}, grind=${res.wall.grindBattles})`);
        if (!res.won) { await checkpoint("CP3", false, "blocked at Sora on Route 1"); stallAt("CP3", res.wall, "Sora unbeaten after grind budget"); throw new Error("stall"); }
      } else await subCheck("trainer.sora", true, "Sora beaten during the Route 1 crossing");
      const g2 = await gotoMap(4);
      st = await core.runState(S());
      await checkpoint("CP3", !!g2.ok && !!st && st.map === 4, "arrived Kurogane Town (Map004) on foot via Route 1");
      if (!g2.ok) { stallAt("CP3", null, "could not exit Route 1 into Kurogane"); throw new Error("stall"); }
    }

    // ---------------- Gym 1: Daichi (CP4), Rokuro (CP5) ----------------
    {
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      await shopStop().catch(() => {});
      const resD = await wallTry("Gym Trainer Daichi", async () => {
        const g = await gotoMap(6); if (!g.ok) return false;
        return challenge(5, switchOn(9));
      }, { grassMap: 3 });
      await checkpoint("CP4", resD.won, `Daichi ${resD.won ? "beaten" : "NOT beaten"} (attempts=${resD.wall.attempts}, grind=${resD.wall.grindBattles})`);
      if (!resD.won) { stallAt("CP4", resD.wall, "Daichi unbeaten after grind budget"); throw new Error("stall"); }
      await maybeHeal(0.99);
      const resR = await wallTry("Gym Leader Rokuro", async () => {
        const g = await gotoMap(6); if (!g.ok) return false;
        return challenge(6, badgeIs(1));
      }, { grassMap: 3 });
      const st = await core.runState(S());
      await checkpoint("CP5", resR.won && !!st && st.badgeCount >= 1, `Rokuro ${resR.won ? "beaten — TECTONIC BADGE" : "NOT beaten"} (attempts=${resR.wall.attempts}, grind=${resR.wall.grindBattles})`);
      if (!resR.won) { stallAt("CP5", resR.wall, "Rokuro unbeaten after grind budget"); throw new Error("stall"); }
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      await shopStop().catch(() => {});
    }

    // ---------------- Route 2 + Cavern -> Port Marine (CP6) ----------------
    {
      const resK = await wallTry("Fisherman Kai", async () => {
        const g = await gotoMap(7); if (!g.ok) return false;
        // Kai stands mid-route; walking the spine may trigger him first.
        const st0 = await core.runState(S());
        if (st0 && st0.switches[14]) return true;
        return challenge(11, switchOn(14));
      }, { grassMap: 7 });
      await subCheck("trainer.kai", resK.won, `Kai ${resK.won ? "beaten" : "NOT beaten"} (attempts=${resK.wall.attempts}, grind=${resK.wall.grindBattles})`);
      if (!resK.won) { await checkpoint("CP6", false, "blocked at Kai on Route 2"); stallAt("CP6", resK.wall, "Kai unbeaten"); throw new Error("stall"); }
      const resG = await wallTry("Miner Goro", async () => {
        const g = await gotoMap(8); if (!g.ok) return false;
        const st0 = await core.runState(S());
        if (st0 && st0.switches[13]) return true;
        return challenge(4, switchOn(13));
      }, { grassMap: 7 });
      await subCheck("trainer.goro", resG.won, `Goro ${resG.won ? "beaten" : "NOT beaten"} (attempts=${resG.wall.attempts}, grind=${resG.wall.grindBattles})`);
      if (!resG.won) { await checkpoint("CP6", false, "blocked at Goro in the Cavern"); stallAt("CP6", resG.wall, "Goro unbeaten"); throw new Error("stall"); }
      // Terramonarch boss (scripted wild Lv20, Map008 ev5) — a designed spike.
      const bossBefore = ctx.tallies.battles;
      const resB = await wallTry("Terramonarch Boss (Lv20)", async () => {
        const g = await gotoMap(8); if (!g.ok) return false;
        ctx.policyMode = "trainer"; // boss tactics: potions + lead switch allowed
        const r = await core.interactEvent(S(), ctx, 5, { flowTimeoutMs: 420000 });
        ctx.policyMode = "wild";
        if (!r.ok) return false;
        const fought = ctx.battleLog.slice(bossBefore);
        return fought.some(b => b.outcome === "win");
      }, { grassMap: 7 });
      await subCheck("boss.terramonarch", resB.won, `Terramonarch ${resB.won ? "beaten" : "NOT beaten"} (attempts=${resB.wall.attempts}, grind=${resB.wall.grindBattles})`);
      if (!resB.won) { await checkpoint("CP6", false, "blocked at the Terramonarch boss"); stallAt("CP6", resB.wall, "Terramonarch boss unbeaten"); throw new Error("stall"); }
      const g = await gotoMap(9);
      const st = await core.runState(S());
      await checkpoint("CP6", !!g.ok && !!st && st.map === 9, "arrived Port Marine (Map009) via Route 2 + Obsidian Cavern");
      if (!g.ok) { stallAt("CP6", null, "could not exit the Cavern into Port Marine"); throw new Error("stall"); }
    }

    // ---------------- Gym 2: Maya, Marina (CP7) ----------------
    {
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      await shopStop().catch(() => {});
      const resM = await wallTry("Swimmer Maya", async () => {
        const g = await gotoMap(10); if (!g.ok) return false;
        return challenge(5, switchOn(15));
      }, { grassMap: 7 });
      await subCheck("trainer.maya", resM.won, `Maya ${resM.won ? "beaten" : "NOT beaten"} (attempts=${resM.wall.attempts}, grind=${resM.wall.grindBattles})`);
      if (!resM.won) { await checkpoint("CP7", false, "blocked at Maya in Port Marine Gym"); stallAt("CP7", resM.wall, "Maya unbeaten"); throw new Error("stall"); }
      await maybeHeal(0.99);
      const resL = await wallTry("Gym Leader Marina", async () => {
        const g = await gotoMap(10); if (!g.ok) return false;
        return challenge(6, badgeIs(2));
      }, { grassMap: 7 });
      const st = await core.runState(S());
      await checkpoint("CP7", resL.won && !!st && st.badgeCount >= 2, `Marina ${resL.won ? "beaten — TIDAL BADGE" : "NOT beaten"} (attempts=${resL.wall.attempts}, grind=${resL.wall.grindBattles})`);
      if (!resL.won) { stallAt("CP7", resL.wall, "Marina unbeaten after grind budget"); throw new Error("stall"); }
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      await shopStop().catch(() => {});
    }

    // ---------------- Route 3: Axel -> Spark City (CP8) ----------------
    {
      const resA = await wallTry("Biker Axel", async () => {
        const g = await gotoMap(11); if (!g.ok) return false;
        const st0 = await core.runState(S());
        if (st0 && st0.switches[20]) return true;
        return challenge(10, switchOn(20));
      }, { grassMap: 11 });
      await subCheck("trainer.axel", resA.won, `Axel ${resA.won ? "beaten" : "NOT beaten"} (attempts=${resA.wall.attempts}, grind=${resA.wall.grindBattles})`);
      if (!resA.won) { await checkpoint("CP8", false, "blocked at Axel on Route 3"); stallAt("CP8", resA.wall, "Axel unbeaten"); throw new Error("stall"); }
      const g = await gotoMap(12);
      const st = await core.runState(S());
      await checkpoint("CP8", !!g.ok && !!st && st.map === 12, "arrived Spark City (Map012) via Route 3");
      if (!g.ok) { stallAt("CP8", null, "could not exit Route 3 into Spark City"); throw new Error("stall"); }
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      await shopStop().catch(() => {});
    }

    // ---------------- Gym 3: Volk (CP9) ----------------
    {
      const resV = await wallTry("Gym Leader Volk", async () => {
        const g = await gotoMap(13); if (!g.ok) return false;
        return challenge(4, badgeIs(3));
      }, { grassMap: 11 });
      const st = await core.runState(S());
      await checkpoint("CP9", resV.won && !!st && st.badgeCount >= 3, `Volk ${resV.won ? "beaten — DYNAMO BADGE" : "NOT beaten"} (attempts=${resV.wall.attempts}, grind=${resV.wall.grindBattles})`);
      if (!resV.won) { stallAt("CP9", resV.wall, "Volk unbeaten after grind budget"); throw new Error("stall"); }
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      await shopStop().catch(() => {});
    }

    // ---------------- Fly-gym helper (gyms 4-8) ----------------
    async function flyGym(cpId, gymMap, leaderEv, badgeN, name, grassMap) {
      const logBefore = ctx.battleLog.length;
      const res = await wallTry(name, async () => {
        const f = await core.flyTo(S(), ctx, gymMap);
        if (!f.ok) { const t = await travelTo(gymMap); if (!t.ok) return false; }
        return challenge(leaderEv, badgeIs(badgeN));
      }, { grassMap });
      const st = await core.runState(S());
      const won = res.won && !!st && st.badgeCount >= badgeN;
      await checkpoint(cpId, won, `${name} ${won ? "beaten — badge " + badgeN : "NOT beaten"} (attempts=${res.wall.attempts}, grind=${res.wall.grindBattles})`);
      if (won) {
        const battles = ctx.battleLog.slice(logBefore);
        const lastFoe = battles.length ? battles[battles.length - 1] : null;
        if (lastFoe) ctx.log(`F-PT-01 record (${name}): tempBefore=${JSON.stringify(lastFoe.tempBefore)} foe=${lastFoe.foe ? lastFoe.foe.name + " sp" + lastFoe.foe.sp + " Lv" + lastFoe.foe.lv : "?"} outcome=${lastFoe.outcome}`);
        if (!battles.some(b => b.outcome === "win")) {
          ctx.defect("BADGE-WITHOUT-WIN", `${name}: badge count reached ${badgeN} with no won battle in the attempt log — the stock-battle event appears to award the badge unconditionally (battles: ${battles.map(b => b.outcome).join(",") || "none"})`);
        }
      }
      if (!won) { stallAt(cpId, res.wall, name + " unbeaten after grind budget"); throw new Error("stall"); }
      await healVia(5, 4, "Center Nurse Momo").catch(() => {});
      return res;
    }
    async function routeTrainer(tag, routeMap, evId, swId, name, grassMap) {
      const res = await wallTry(name, async () => {
        const t = await travelTo(routeMap); if (!t.ok) return false;
        const st0 = await core.runState(S());
        if (st0 && st0.switches[swId]) return true;
        return challenge(evId, switchOn(swId));
      }, { grassMap });
      await subCheck("trainer." + tag, res.won, `${name} ${res.won ? "beaten" : "NOT beaten"} (attempts=${res.wall.attempts}, grind=${res.wall.grindBattles})`);
      if (!res.won) { stallAt("trainer." + tag, res.wall, name + " unbeaten"); throw new Error("stall"); }
    }

    // ---------------- Gym 4: Sylva (CP10) + Route 4's Ivy ----------------
    {
      // Route 4 on foot first (it is walkable from Spark City): Ivy + roamer.
      const resI = await wallTry("Botanist Ivy", async () => {
        const g = await gotoMap(15); if (!g.ok) return false;
        const st0 = await core.runState(S());
        if (st0 && st0.switches[62]) return true;
        return challenge(6, switchOn(62));
      }, { grassMap: 15 });
      await subCheck("trainer.ivy", resI.won, `Ivy ${resI.won ? "beaten" : "NOT beaten"} (attempts=${resI.wall.attempts}, grind=${resI.wall.grindBattles})`);
      if (!resI.won) { await checkpoint("CP10", false, "blocked at Ivy on Route 4"); stallAt("CP10", resI.wall, "Ivy unbeaten"); throw new Error("stall"); }
      await flyGym("CP10", 16, 2, 4, "Leader Sylva", 15);
    }

    // ---------------- Gym 5: Ignacio (CP11) + Bruno ----------------
    await flyGym("CP11", 18, 2, 5, "Leader Ignacio", 17);
    await routeTrainer("bruno", 17, 5, 63, "Hiker Bruno", 17);

    // ---------------- Gym 6: Zephyr (CP12) + Aera ----------------
    await flyGym("CP12", 20, 2, 6, "Leader Zephyr", 19);
    await routeTrainer("aera", 19, 4, 64, "Sky Trainer Aera", 19);

    // ---------------- Gym 7: Morbius (CP13) + Nyx ----------------
    await flyGym("CP13", 22, 2, 7, "Leader Morbius", 21);
    await routeTrainer("nyx", 21, 5, 65, "Hex Maniac Nyx", 21);

    // ---------------- Gym 8: Astraea (CP14) + Celio ----------------
    await flyGym("CP14", 24, 2, 8, "Leader Astraea", 23);
    await routeTrainer("celio", 23, 4, 66, "Star Sage Celio", 23);

    // ---------------- Victory Road (CP15) ----------------
    {
      const t = await travelTo(25);
      if (!t.ok) { await checkpoint("CP15", false, "Victory Road (Map025) unreachable: " + t.why); stallAt("CP15", null, "Victory Road unreachable"); throw new Error("stall"); }
      const resK = await wallTry("Veteran Kaelen", async () => {
        const tt = await travelTo(25); if (!tt.ok) return false;
        const logBefore = ctx.battleLog.length;
        ctx.policyMode = "trainer";
        const r = await core.interactEvent(S(), ctx, 3, { flowTimeoutMs: 420000 });
        ctx.policyMode = "wild";
        if (!r.ok) return false;
        return ctx.battleLog.slice(logBefore).some(b => b.outcome === "win");
      }, { grassMap: 23 });
      await subCheck("trainer.kaelen", resK.won, `Kaelen ${resK.won ? "beaten" : "NOT beaten"} (attempts=${resK.wall.attempts}, grind=${resK.wall.grindBattles})`);
      if (!resK.won) { await checkpoint("CP15", false, "blocked at Kaelen on Victory Road"); stallAt("CP15", resK.wall, "Kaelen unbeaten"); throw new Error("stall"); }
      const g = await gotoMap(26);
      const st = await core.runState(S());
      await checkpoint("CP15", !!g.ok && !!st && st.map === 26, "crossed Victory Road — arrived Ganjuko League Champions Hall (Map026)");
      if (!g.ok) { stallAt("CP15", null, "could not exit Victory Road into the Champions Hall"); throw new Error("stall"); }
    }

    // ---------------- Champion: Grand Champion Leon (CP16 = WIN) ----------------
    {
      await healVia(26, 3, "League Nurse Momo").catch(() => {});
      const logBefore = ctx.battleLog.length;
      const res = await wallTry("Grand Champion Leon", async () => {
        const tt = await travelTo(26); if (!tt.ok) return false;
        await healVia(26, 3, "League Nurse Momo").catch(() => {});
        return challenge(2, (b, a) => a && a.switches[36] && (a.items[22] || 0) >= 1 && (a.items[23] || 0) >= 1, { flowTimeoutMs: 600000 });
      }, { grassMap: 23 });
      const st = await core.runState(S());
      const won = res.won && !!st && st.switches[36] && (st.items[22] || 0) >= 1 && (st.items[23] || 0) >= 1 && st.badgeCount >= 8;
      const battles = ctx.battleLog.slice(logBefore);
      const lastFoe = battles.length ? battles[battles.length - 1] : null;
      if (lastFoe) ctx.log(`F-PT-01 record (Champion): tempBefore=${JSON.stringify(lastFoe.tempBefore)} foe=${lastFoe.foe ? lastFoe.foe.name + " sp" + lastFoe.foe.sp + " Lv" + lastFoe.foe.lv : "?"} outcome=${lastFoe.outcome}`);
      if (won && !battles.some(b => b.outcome === "win")) ctx.defect("CHAMPION-WITHOUT-WIN", "Champion event completed (switch 36 + trophy) with no won battle in the attempt log");
      await checkpoint("CP16", won, won ? "GRAND CHAMPION — Leon beaten, switch 36 ON, Trophy + Origin Sphere held, 8 badges" : `Champion NOT beaten (attempts=${res.wall.attempts}, grind=${res.wall.grindBattles})`);
      if (!won) { stallAt("CP16", res.wall, "Grand Champion Leon unbeaten after grind budget"); throw new Error("stall"); }
      ctx.wonGame = true;
    }
  } catch (e) {
    if (!ctx.stall && String(e && e.message) !== "stall") {
      await rep.check("playthrough.fatal", false, String(e && e.message || e));
      ctx.stall = ctx.stall || { cp: "driver", detail: String(e && e.message || e), at: elapsed() };
    }
  } finally {
    const st = ctx.session ? await core.runState(ctx.session).catch(() => null) : null;
    const verdict = ctx.wonGame ? "WIN" : (ctx.stall ? "STALLED at " + ctx.stall.cp : "INCOMPLETE");
    const summaryRec = {
      verdict, engineMd5: rep.engineMd5, elapsedMs: elapsed(),
      stall: ctx.stall, tallies: ctx.tallies, catches: ctx.catches,
      checkpoints: Object.fromEntries(Object.entries(ctx.checkpoints).map(([k, v]) => [k, { pass: v.pass, detail: v.detail, elapsedMs: v.elapsedMs, party: v.state ? v.state.party : null, gold: v.state ? v.state.gold : null, badgeCount: v.state ? v.state.badgeCount : null }])),
      defects: ctx.defects, finalState: st,
      battles: ctx.battleLog.map(b => ({ kind: b.kind, foe: b.foe, outcome: b.outcome, turns: b.turns, throws: b.throws, tempBefore: b.tempBefore, trainerFlag: b.trainerFlag || null, at: b.at })),
    };
    console.log("PLAYTHROUGH-VERDICT " + JSON.stringify(summaryRec));
    try { fs.writeFileSync(path.join(ptDir, "verdict.json"), JSON.stringify(summaryRec, null, 2)); } catch (e) {}
    rep.note("VERDICT: " + verdict);
    rep.note("tallies: " + JSON.stringify(ctx.tallies));
    if (live) await live.cleanup().catch(() => {});
  }
  return rep.write();
}

module.exports = { run };
