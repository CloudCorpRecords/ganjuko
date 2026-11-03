// TEMP probe #7 — singles bout with the suite's assisted-clock
// driving (rescue OKs), then dump the battle log + record to see
// HOW the bout is lost: forfeit vs KO. Delete after use.
"use strict";
const { openLive } = require("../lib/live");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

async function waitMapFormed(s, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const formed = await s.evSafe("(function(){ const sc = SceneManager._scene; return !!sc && sc.constructor.name === 'Scene_Map' && !!sc._mapNameWindow; })()");
    if (formed) { await sleep(800); return true; }
    await sleep(500);
  }
  return false;
}

async function run({ target, port, cdpPort }) {
  const ctx = await openLive({ target, port, cdpPort });
  const s = ctx.session;
  try {
    await s.boot(ctx.gameUrl);
    await battle.installHooks(s);
    await s.newGame();
    await s.seedParty([
      { species: 3, level: 20 }, { species: 6, level: 20 }, { species: 9, level: 19 },
      { species: 20, level: 19 }, { species: 25, level: 18 }, { species: 18, level: 18 }
    ]);
    await s.evSafe("(function(){ const S = GanjukoEngine.S19; S.openArena(); const ids = $gameParty.allMembers().map(m => m.actorId()); S.setTeam(ids); const T = S.TIMERS; T.turnMs = 3000; T.yourMs = 3600000; T.totalMs = 3600000; return 1; })()");
    await s.waitScene("Scene_GanjukoArena", 40);
    await s.evSafe("(function(){ SceneManager.goto(Scene_Map); return 1; })()");
    await s.waitScene("Scene_Map", 40);
    await waitMapFormed(s);
    await s.evSafe("(function(){ const S = GanjukoEngine.S19; return S.startSparring('singles', 'rin', S.defaultPicks('singles')); })()");
    await s.waitScene("Scene_Battle", 40);
    const t0 = Date.now();
    let lastRescue = 0, rescues = 0;
    while (Date.now() - t0 < 240000) {
      const st = await battle.battleState(s);
      if (!st) { await sleep(600); continue; }
      if (st.scene === "Scene_GanjukoArena") { console.log("PROBE terminal HUB at", Math.round((Date.now() - t0) / 1000) + "s"); break; }
      if (st.scene !== "Scene_Battle") { await sleep(600); continue; }
      if (st.phase === "start" || st.phase === "battleEnd") { await s.holdOk(300); await sleep(700); continue; }
      if ((st.cmd || st.skill || st.enemy || st.actor) && Date.now() - lastRescue > 3500) {
        lastRescue = Date.now(); rescues++;
        await s.holdOk(300); await sleep(600); continue;
      }
      await sleep(550);
    }
    console.log("PROBE rescues:", rescues);
    const rec = await s.evSafe("(function(){ const a = GanjukoEngine.S19.ensureArena(); return { wins: a.record.wins, losses: a.record.losses, ap: a.ap, lastResult: a.lastResult }; })()");
    console.log("PROBE record =", JSON.stringify(rec));
    const logs = await battle.readLogs(s);
    console.log("PROBE logs count:", logs.length);
    for (const l of logs.slice(-50)) console.log("PROBE LOG:", String(l).slice(0, 140));
    console.log("PROBE done");
  } finally {
    try { if (ctx.cleanup) await ctx.cleanup(); } catch (e) {}
  }
}

module.exports = { run };
