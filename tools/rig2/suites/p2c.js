// rig2 p2c suite — Pass 2 sub-pass C live verification: area encounter
// tables + stage gating + encounter rate in the real engine, the
// Scene_Map encounter integration end-to-end, and the follower sheet
// system for all three starter lines (game object + loaded sprite
// bitmap). Runs against the VM-local copy via razer-chrome.
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const { sleep } = require("../lib/cdp");

const ROUTE1_SPECIES = [10, 14, 7, 12, 16, 4, 1, 19, 43]; // incl. mythic Zephyrhornkit
const ROUTE1_LEVELS = { 10: [2, 4], 14: [2, 4], 7: [2, 4], 12: [2, 4], 16: [3, 4], 4: [3, 4], 1: [3, 4], 19: [3, 5], 43: [4, 5] };

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "p2c", target, engineMd5: preEngineMd5(target), outDir });
  const shotsDir = path.join(outDir, "shots");
  try { fs.mkdirSync(shotsDir, { recursive: true }); } catch (e) {}
  let ctx = null;
  const shot = async (name) => {
    try { return await ctx.session.cdp.screenshot(path.join(shotsDir, name)); }
    catch (e) { return null; }
  };
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const boot = await ctx.session.boot(ctx.gameUrl);
    try {
      await ctx.session.cdp.send("Emulation.setDeviceMetricsOverride", { width: 1300, height: 800, deviceScaleFactor: 1, mobile: false });
      await sleep(1000);
    } catch (e) {}
    await rep.check("p2c.boot", true, `focus=${boot.focused} fps=${boot.fps}`);
    await ctx.session.newGame();

    // ---- hooks + stage model in the live engine ----
    const st = await ctx.session.ev(`(function(){
      const AE = GanjukoEngine.AREA_ENCOUNTERS;
      const counts = { 1: 0, 2: 0, 3: 0 };
      for (let pos = 1; pos <= 504; pos++) counts[GanjukoEngine.speciesStage(pos)]++;
      return { status: AE.status, counts, tables: Object.keys(AE.tables).length };
    })()`);
    const stAll = st && Object.values(st.status).every(Boolean);
    await rep.check("p2c.hooksInstalled", !!stAll, `AREA_ENCOUNTERS.status=${JSON.stringify(st && st.status)}`);
    await rep.check("p2c.stageCountsLive", !!st && st.counts[1] === 224 && st.counts[2] === 176 && st.counts[3] === 104 && st.tables === 10,
      `live stage counts=${JSON.stringify(st && st.counts)} tables=${st && st.tables}`);

    // ---- roll distribution on Route 1 (in-engine, real tables) ----
    const dist = await ctx.session.ev(`(function(){
      const seen = {};
      let bad = 0, maxLv = 0;
      for (let i = 0; i < 4000; i++) {
        const r = GanjukoEngine.rollAreaEncounter(3, { isNight: false });
        if (!r) { bad++; continue; }
        seen[r.speciesPos] = (seen[r.speciesPos] || 0) + 1;
        if (GanjukoEngine.speciesStage(r.speciesPos) !== 1) bad++;
        if (r.speciesPos === 11) bad++; // Raibunny
        maxLv = Math.max(maxLv, r.level);
      }
      return { seen, bad, maxLv };
    })()`);
    const seenPos = dist ? Object.keys(dist.seen).map(Number) : [];
    await rep.check("p2c.route1Rolls", !!dist && dist.bad === 0 && seenPos.length >= 6 && seenPos.every(p => ROUTE1_SPECIES.includes(p)),
      `4000 rolls: species seen=${seenPos.sort((a, b) => a - b).join(",")} violations=${dist && dist.bad} maxLv=${dist && dist.maxLv}`);

    // ---- encounter rate: Route 1's effective step in-engine ----
    await ctx.session.directLoadMap(3, 10, 10);
    const step = await ctx.session.ev(`$gameMap.encounterStep()`);
    await rep.check("p2c.route1Rate", step === 42, `$gameMap.encounterStep() on Map003 = ${step} (base 12 x 3.5 = 42, gentlest in the game)`);

    // ---- Radiant gate: no badges -> never radiant on Map023 ----
    const radiant = await ctx.session.ev(`(function(){
      let n = 0;
      for (let i = 0; i < 3000; i++) {
        const r = GanjukoEngine.rollAreaEncounter(23, { isNight: false });
        if (r && r.tier === "radiant") n++;
      }
      return { radiant: n, badges: $gameSystem.badges().length };
    })()`);
    await rep.check("p2c.radiantGated", !!radiant && radiant.radiant === 0 && radiant.badges === 0,
      `3000 Map023 rolls at ${radiant && radiant.badges} badges -> radiant=${radiant && radiant.radiant}`);

    // ---- Integration: the real Scene_Map encounter trigger on Route 1 ----
    // executeEncounter consumes the zeroed counter and sets up the troop
    // immediately; the battle scene itself arrives only after the
    // encounter transition effect (~3s under rig rendering) — poll for it.
    await ctx.session.seedParty([{ species: 28, level: 30 }]);
    await ctx.session.evSafe(`(function(){ $gamePlayer._encounterCount = 0; SceneManager._scene.updateEncounter(); return 1; })()`);
    let trigger = null;
    for (let i = 0; i < 14 && !trigger; i++) {
      await sleep(900);
      const s = await ctx.session.evSafe(`(function(){
        if (SceneManager._scene.constructor.name !== "Scene_Battle") return null;
        const e = $gameTroop.members()[0];
        return { speciesPos: e.ganjukoSpeciesId(), level: e.ganjukoLevel() };
      })()`);
      if (s) trigger = s;
    }
    const trigOk = !!trigger && ROUTE1_SPECIES.includes(trigger.speciesPos) &&
      trigger.level >= ROUTE1_LEVELS[trigger.speciesPos][0] && trigger.level <= ROUTE1_LEVELS[trigger.speciesPos][1];
    await rep.check("p2c.encounterTrigger", trigOk,
      `Scene_Map.updateEncounter on Map003 -> ${JSON.stringify(trigger)} (species must be a Route 1 table species, level in its band)`);
    // Leave the battle cleanly if one started.
    await ctx.session.evSafe(`(function(){ if (SceneManager._scene.constructor.name === "Scene_Battle") { $gameTroop.members().forEach(m => m.setHp(0)); BattleManager.processVictory && BattleManager.processVictory(); } })()`);
    await sleep(1500);

    // ---- Follower: all three starter lines, game object + sprite bitmap ----
    // giveGanjuko APPENDS to the party, so each species needs a fresh
    // new game to sit in the lead slot the follower mirrors.
    const followerResults = [];
    for (const pos of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      await ctx.session.newGame();
      await ctx.session.seedParty([{ species: pos, level: 5 }]);
      const expect = "$Ganjuko_" + (await ctx.session.evSafe(`GanjukoEngine.getSpecies(${pos}).name`)) + "_Walk";
      // Poll: the game object resolves synchronously, but the follower
      // SPRITE swaps its bitmap on a later frame tick.
      let fr = null;
      for (let i = 0; i < 10; i++) {
        fr = await ctx.session.evSafe(`(function(){
          const f = $gamePlayer.followers().follower(0);
          f.refresh();
          const spriteset = SceneManager._scene._spriteset;
          let bmp = null;
          if (spriteset && spriteset._characterSprites) {
            for (const s of spriteset._characterSprites) {
              if (s._character === f && s.bitmap && s.bitmap.url) bmp = s.bitmap.url;
            }
          }
          return { charName: f.characterName(), bmp };
        })()`);
        if (fr && fr.charName === expect && fr.bmp && fr.bmp.includes(expect.slice(9) + ".png")) break;
        await sleep(450);
      }
      const okBmp = !!fr && !!fr.bmp && fr.bmp.includes(expect.slice(9) + ".png");
      followerResults.push({ pos, expect, got: fr && fr.charName, bmpOk: okBmp });
      if (pos === 4) { const s = await shot("p2c-follower-bubblix.png"); rep.note(`Bubblix follower screenshot: ${s}`); }
      if (pos === 7) { const s = await shot("p2c-follower-florabit.png"); rep.note(`Florabit follower screenshot: ${s}`); }
    }
    const folOk = followerResults.every(r => r.got === r.expect && r.bmpOk);
    await rep.check("p2c.followerStarterLines", folOk,
      followerResults.map(r => `pos${r.pos}:${r.got === r.expect ? "sheet-ok" : "sheet=" + r.got}${r.bmpOk ? "+bmp" : "-bmp"}`).join(" "));

    const warnings = await ctx.session.evSafe(`GanjukoEngine._walkSheetWarnings.length`);
    await rep.check("p2c.noSheetWarnings", warnings === 0, `walkSheetWarnings=${warnings} (live data is canonical after the fix)`);

    const fpsEnd = await ctx.session.fpsProbe(1500);
    await rep.check("rig.loopAlive", fpsEnd > 0, `frame clock still advancing (fps=${fpsEnd})`);
    await rep.check("rig.noExceptions", ctx.cdp.exceptions.length === 0,
      ctx.cdp.exceptions.length ? "EXCEPTIONS: " + JSON.stringify(ctx.cdp.exceptions.slice(0, 3)) : "no uncaught page exceptions");
  } catch (e) {
    await rep.check("p2c.fatal", false, String(e && e.message || e));
  } finally {
    if (ctx) await ctx.cleanup();
  }
  return rep.write();
}

module.exports = { run };
