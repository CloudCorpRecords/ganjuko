// rig2 recon-p3 — Pass 3 design recon (temporary suite): giveGanjuko id
// semantics for the Lab orb arguments, foe sprite resolution, battle scene
// window inventory. Read-only probes; no game files touched.
"use strict";
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "recon-p3", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    await ctx.session.boot(ctx.gameUrl);
    await rep.check("recon.boot", true, "booted");

    // (a) giveGanjuko id semantics, fresh state per arg (the Lab orb events
    // call giveGanjuko(1/3/5) for Embit/Bubblix/Florabit).
    const results = {};
    for (const arg of [1, 3, 5, 4, 7]) {
      await ctx.session.newGame();
      const r = await ctx.session.ev(`(function(){
        const res = GanjukoEngine.giveGanjuko(${arg}, 5);
        const a = res.actor;
        return {
          name: a.name(),
          speciesPos: a.ganjukoSpeciesId(),
          speciesName: (a.ganjukoSpecies() || {}).name,
          battler: a.battlerName(),
          charName: a.characterName(),
          classId: a._classId
        };
      })()`);
      results[arg] = r;
    }
    await rep.check("recon.giveSemantics", true, JSON.stringify(results));

    // (b) foe sprite resolution + battle scene inventory.
    await ctx.session.newGame();
    await battle.installHooks(ctx.session);
    await ctx.session.seedParty([{ species: 28, level: 30 }]);
    const reached = await ctx.session.startWildBattleVerified(4, 3);
    await sleep(2500);
    const inv = await ctx.session.evSafe(`(function(){
      const s = SceneManager._scene;
      const wins = [];
      const walk = (o, d) => {
        if (!o || d > 3) return;
        if (o.constructor && o.constructor.name && o.constructor.name.indexOf("Window") === 0) wins.push(o.constructor.name + (o.active ? ":active" : ""));
        (o.children || []).forEach(c => walk(c, d + 1));
      };
      walk(s, 0);
      let foeBmp = null;
      if (s._spriteset && s._spriteset._enemySprites) {
        for (const sp of s._spriteset._enemySprites) { if (sp.bitmap && sp.bitmap.url) foeBmp = sp.bitmap.url; }
      }
      const foe = $gameTroop.members()[0];
      return {
        scene: s.constructor.name,
        hasPartyCmd: !!s._partyCommandWindow, hasActorCmd: !!s._actorCommandWindow,
        hasLog: !!s._logWindow, hasHelp: !!s._helpWindow, hasStatus: !!s._statusWindow,
        phase: (typeof BattleManager !== "undefined") ? BattleManager._phase : null,
        foeBmp, foeSpecies: foe ? foe.ganjukoSpeciesId() : null,
        foeName: foe ? foe.name() : null,
        wins: wins.slice(0, 24)
      };
    })()`);
    await rep.check("recon.battleScene", reached === true, JSON.stringify(inv));
    await ctx.session.evSafe(`(function(){ if (SceneManager._scene.constructor.name === "Scene_Battle") { $gameTroop.members().forEach(m => m.setHp(0)); BattleManager.processVictory && BattleManager.processVictory(); } })()`);
    await sleep(1500);

    await rep.check("rig.noExceptions", ctx.cdp.exceptions.length === 0,
      ctx.cdp.exceptions.length ? "EXCEPTIONS: " + JSON.stringify(ctx.cdp.exceptions.slice(0, 3)) : "no uncaught page exceptions");
  } catch (e) {
    await rep.check("recon.fatal", false, String(e && e.message || e));
  } finally {
    if (ctx) await ctx.cleanup();
  }
  return rep.write();
}

module.exports = { run };
