// rig2 smoke suite — boot, save/load round-trip, wild battle win, capture.
// Runs against any live target; every check is UI/state driven, nothing here
// touches game files.
"use strict";
const { openLive } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

const ORB_ITEM = 1; // $dataItems[1] "Ganjuko Orb"
const CAPTURE_SPECIES = 1; // positional id 1 (Embit) — record id == position, so
// the check means the same thing on pre- and post-Fix-Round-1 engines.

async function run({ target, outDir, port, cdpPort }) {
  // Reporter FIRST: if the transport itself fails, the run still emits a
  // stamped FAIL summary instead of dying silently (a lesson from the lanes).
  const { preEngineMd5 } = require("../lib/live");
  const rep = new Reporter({ suite: "smoke", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const boot = await ctx.session.boot(ctx.gameUrl);
    rep.note(`boot: focus=${boot.focused} webgl=${boot.webgl} fps=${boot.fps}`);
    await ctx.session.newGame();
    await battle.installHooks(ctx.session);
    await rep.check("smoke.boot", true, `Scene_Map reached; focus proven; fps=${boot.fps}`);

    // --- save/load round-trip on a controlled snapshot ---
    await ctx.session.seedParty([{ species: 28, level: 30 }]);
    await ctx.session.seedGold(0); // no-op safeguard (gainGold(0))
    await ctx.session.evSafe("$gameParty.gainGold(1234)");
    await ctx.session.directLoadMap(3, 10, 10);
    const before = await ctx.session.snapshot();
    const saved = await ctx.session.saveGame(1);
    await rep.check("smoke.save", saved === true && !!before, `saveGame(1) -> ${saved}; snapshot=${JSON.stringify(before)}`);
    await ctx.session.evSafe("$gameParty.gainGold(777)");
    await ctx.session.directLoadMap(5, 8, 8);
    const loaded = await ctx.session.loadGame(1);
    const after = await ctx.session.snapshot();
    const same = !!before && !!after && before.gold === after.gold && before.map === after.map &&
      JSON.stringify(before.party) === JSON.stringify(after.party);
    await rep.check("smoke.loadRoundTrip", loaded === true && same, `loadGame(1) -> ${loaded}; restored=${JSON.stringify(after)}`);

    // --- wild battle: fight to a win through the real UI ---
    await ctx.session.healParty();
    const reached = await ctx.session.startWildBattleVerified(1, 3);
    await rep.check("smoke.wildBattleStarts", reached, "startWildBattle(1,3) reached Scene_Battle (settle-verified, one re-issue allowed)");
    const fight = await battle.driveBattle(ctx.session, { strategy: "best", timeoutMs: 180000 });
    await rep.check("smoke.wildBattleWin", fight.outcome === "win", `outcome=${fight.outcome} turns=${fight.turns} lastAction=${JSON.stringify(fight.lastAction)}`);

    // --- capture: throw Orbs through the BAG window until caught ---
    const countOwned = () => ctx.session.evSafe(`(function(){ try {
      let n = 0;
      $gameParty.allMembers().forEach(m => { if (m.ganjukoSpeciesId() === ${CAPTURE_SPECIES}) n++; });
      if ($gameSystem.ganjukoBox) $gameSystem.ganjukoBox().forEach(m => { if ((m.ganjukoSpeciesId ? m.ganjukoSpeciesId() : m) === ${CAPTURE_SPECIES}) n++; });
      return n;
    } catch (e) { return -1; } })()`);
    // Fresh state with a LEVEL-MATCHED lead: at Lv30 even the weakest move
    // one-shots a Lv3 foe, so weakening (and therefore capturing) is
    // impossible. Lv5 vs Lv3 can weaken, then throw.
    await ctx.session.newGame();
    await battle.installHooks(ctx.session);
    await ctx.session.seedParty([{ species: 28, level: 5 }]);
    const ownedBefore = await countOwned();
    await ctx.session.seedItem(ORB_ITEM, 20);
    await ctx.session.startWildBattleVerified(1, 3);
    const cap = await battle.driveBattle(ctx.session, { capture: { itemId: ORB_ITEM, maxThrows: 10, weakenTo: 0.4 }, timeoutMs: 600000 });
    await sleep(1200);
    const caught = await ctx.session.evSafe(`$gameSystem.isSpeciesCaught(${CAPTURE_SPECIES})`);
    const ownedAfter = await countOwned();
    await rep.check("smoke.capture", caught === true && ownedAfter === ownedBefore + 1,
      `throws=${cap.lastAction ? "ui" : "?"} outcome=${cap.outcome} caught=${caught} owned ${ownedBefore} -> ${ownedAfter} (want exactly +1)`);

    const fpsEnd = await ctx.session.fpsProbe(1500);
    await rep.check("rig.loopAlive", fpsEnd > 0, `frame clock still advancing at suite end (fps=${fpsEnd}) — a throw inside the update loop halts MZ permanently and shows up exactly like this`);
    await rep.check("rig.noExceptions", ctx.cdp.exceptions.length === 0,
      (ctx.cdp.exceptions.length ? "EXCEPTIONS: " + JSON.stringify(ctx.cdp.exceptions.slice(0, 3)) : "no uncaught page exceptions") +
      (ctx.cdp.consoleErrors.length ? ` | console.error warnings: ${ctx.cdp.consoleErrors.length} (first: ${String(ctx.cdp.consoleErrors[0].text).slice(0, 120)})` : ""));
  } catch (e) {
    await rep.check("smoke.fatal", false, String(e && e.message || e));
  } finally {
    if (ctx) await ctx.cleanup();
  }
  return rep.write();
}

module.exports = { run };
