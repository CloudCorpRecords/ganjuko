// rig2 smoke suite — boot, save/load round-trip, wild battle win, capture.
// Runs against any live target; every check is UI/state driven, nothing here
// touches game files.
"use strict";
const { openLive } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

const ORB_ITEM = 2; // $dataItems[2] "Great Orb" (note tag <GanjukoOrb: 1.8>) — lane 10; was item 1 (1.0x) through lane 7
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
    // Fresh state for the capture leg.
    //
    // HISTORY (compressed; full record in playtest/CHAMPIONS-V13-
    // REPORT.md 2026-11-03 addendum, fix4/RIG-GATE-REPORT.md, and
    // fix4/FIXTURE-GATE-REPORT.md): the Ursabrawl and Cryostrikefang
    // fixtures died to a rig-driver defect (battleStep's skill-
    // window resume completed an interrupted weaken selection with
    // the STRONGEST move). The crit-proof Pyrotailkit Lv9 fixture
    // that followed was safe against that resume but fainted in 2
    // consecutive standalone proof attempts to the Lv3 Embit's Fire
    // kit during weaken/throws. FR4 lane 6 FIXED THE RIG (battle.js):
    // while capture throws remain, the resume honors "spar" — the
    // systematic foe-KO channel is closed and the strongest-move
    // constraint is dead. What remained was the faint channel.
    //
    // LANE 7 (2026-11-05) findings that shape any fixture here:
    //  (1) Battles are 1v1 (maxBattleMembers = 1): in-battle
    //      $gameParty.aliveMembers() counts only the standing
    //      battle member, so driveBattle's partyAlive === 0 branch
    //      declares "defeat" the moment the lead faints, racing
    //      the engine's own auto-promotion. A bench cannot insure
    //      this leg (proven live: a 3-member party drive returned
    //      "defeat" with 2 members standing). The lead itself must
    //      not faint; there is no useful bench.
    //  (2) S16.5 classes key by species POSITION (setGanjuko-
    //      Species does changeClass(speciesId)), not record index.
    //  (3) REPLICA OUTPUTS ARE HYPOTHESES; THE IN-RIG PROBE IS
    //      THE GATE. Two replica errors were caught only in-rig:
    //      a Frostmaneis fixture's Shadow Sneak spar sampled 12.67
    //      (Umbra->Fire = 1.0, not the 0.5 a transposed chart
    //      constant claims; true spar crit ~24, not 11); and a
    //      Duskreaper fixture whose replica set contained a
    //      phantom Ember (real set: Dark Pulse / Night Slash /
    //      Shadow Sneak, spar crit ~17) while the chart missed
    //      Fire->Umbra = 2.0 (foe Ember sampled 15.57 live vs the
    //      modeled 7.8). Both fixtures were discarded BEFORE any
    //      proof run consumed them; the fixture below is the one
    //      whose every load-bearing number was sampled in-rig.
    //  (4) The foe's real AI (engine S16.4, wild): the stock MZ
    //      pick comes from the enemy ROW's action patterns — for
    //      Embit that is Tackle alone. Per turn, with p = 0.4 the
    //      best-scoring affordable move (scoreEnemyAction) replaces
    //      it if it scores higher. Casts are therefore both
    //      probability-thinned and hard-capped by MP 17 (at most
    //      2x Fire Fang + 1x Ember across the whole battle).
    //
    // LANE 10 (2026-11-06) — GREAT ORB + THE FIXTURE DECISION.
    // Rene's directive: the gate passes 27/27 with NO waiver, so
    // this leg's per-run pass rate is the whole game. Two changes
    // vs lane 7: the seeded Orb is now the GREAT ORB (item 2, note
    // tag <GanjukoOrb: 1.8>), and the derivation below replaces
    // lane 7's Monte Carlo wholesale — its 0.033% faint / 89.8%
    // caught figures were WITHDRAWN by lane 7 itself (see fix4/
    // FIXTURE-GATE-REPORT.md section 4); do not cite them.
    //
    // THE LIVE CATCH FORMULA (engine 16.7 applyGanjukoOrb — the
    // second, overriding copy of the function, not the section-5
    // original):
    //   p = min(0.95, max(0.015, (catchRate/180) * hpFactor
    //        * orbMult * statusBonus))
    //   hpFactor = (3*maxHp - 2*curHp) / (3*maxHp)
    //   statusBonus = 1.0 here (the foe never carries a status).
    // Embit catchRate 45 -> base 0.25. Throws start at foe HP
    // h <= 11 (weakenTo 0.4 of 28 HP), so hpFactor = (84-2h)/84
    // in [0.738, 0.976] and, with the Great Orb, p in [0.332,
    // 0.439] per throw. Exhaustion — all 10 throws failing — is
    // E[(1-p)^10] over the weaken landing distribution: ~0.8-1.3%
    // for ANY lead. That floor is structural (the check's
    // mechanics are unchanged) and is what keeps every fixture
    // below a clean 99%.
    //
    // LANE 10 OFFLINE MC (fix4/mc_lane10.mjs; 200k battles per
    // config; damage machinery calibrated to lane 7's in-rig
    // samples within +-9% — Ember 4.37 modeled vs 4.39 sampled;
    // foe crit rate 0: the enemy row carries no CRI trait and
    // lane 7's 400-sample maxes show no crits; lead crit 5% from
    // the class CRI xparam trait 0.05):
    //   Oceanlord Lv4 + Orb 1.0x (lane 7 control): 86.9% pass
    //     (faint 5.4% incl. burn, exhaustion 7.7%)
    //   Oceanlord Lv4 + Great Orb:                 97.8% pass
    //     (faint 1.4% — burn is ~half of it: Oceanlord is NOT
    //     burn-immune, and Ember/Fire Fang riders chip
    //     floor(61/16) = 3/turn — exhaustion 0.8%,
    //     weaken-KO ~0.06%)
    //   Frostmaneis Lv11 + Great Orb:              98.7-98.9%
    //     (faint 0 in 400k battles; exhaustion 1.1-1.3%)
    // So the Great Orb alone does NOT reach the >=99% bar on
    // the incumbent. Frostmaneis (440) Lv11 is the evaluated
    // successor:
    //   - 16.5 slot plan (Normal type, Lv11), derived from
    //     engine source: [81 War Dance, 41 Shadow Sneak,
    //     5 Quick Strike, 51 Heavy Slam]; driver spar = Shadow
    //     Sneak (replica mean ~6.5; SIM-CHART crit bound
    //     10 <= 11).
    //   - Sole ability slot: frost-mane (signature), the S21
    //     burn immunity { immune: [11] } — the channel that
    //     produces ~half of Oceanlord's faints does not exist
    //     for it. Bulk: unifiedParam Lv11 = HP 82, DEF/MDF 28
    //     before genetics (~88 HP / +2 with typical rolls).
    //   - Residual failure shapes: exhaustion (above) plus a
    //     hairline weaken-KO (~0.02-0.05%): variance stacks on
    //     crits (x1.5, then +-15%), so a max-roll crit at foe
    //     HP 12 can reach 12. CORRECTION to lane 7: its
    //     "weaken KO arithmetically impossible" bound ignored
    //     the variance stack; the true worst case exceeds 11
    //     for BOTH fixtures, at ~1e-4 frequency — two orders
    //     below the exhaustion floor, immaterial to the pick.
    // INSTALL RULE (lane 10 brief): Frostmaneis replaces the
    // lead below ONLY after in-rig sampling confirms its set,
    // spar, stats, the foe kit against it, and the burn
    // immunity (fix4/probe_fixture_lane10.js, staged). Until
    // that sampling lands, the installed fixture remains
    // Oceanlord Lv4 + Great Orb (97.8% projected). Proofs run
    // only on the final installed fixture. Full record:
    // fix4/GREAT-ORB-GATE-REPORT.md.
    // The assertion below is unchanged (owned +1 via a catch),
    // and no threshold or capture mechanic was touched. Game/
    // engine/data bytes are untouched by this fix.
    await ctx.session.newGame();
    await battle.installHooks(ctx.session);
    await ctx.session.seedParty([{ species: 6, level: 4 }]);
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
