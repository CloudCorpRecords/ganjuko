// rig2 battle-driver demonstrations — the capabilities QA could not get in
// 2026-11-01: a gym event driven end to end, item use through the real BAG
// window (closes QA G5), a forced multi-turn battle with recorded turn order
// (closes QA G10), and an honest Stadium capability probe.
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, DEFAULT_GAME_DIR } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

const POTION = 4; // $dataItems[4] "Potion" (+45 HP)

function pickSparPair(gameDir) {
  const data = JSON.parse(fs.readFileSync(path.join(gameDir, "data/GanjukoSpecies.json"), "utf8"));
  const rows = data.map((sp, i) => {
    const b = sp.base || sp.baseStats || {};
    return { pos: i + 1, name: sp.name, hp: b.hp || 0, atk: Math.max(b.atk || 0, b.mat || 0), agi: b.agi || 0 };
  }).filter((r) => r.hp > 0);
  let best = null;
  for (const a of rows) for (const b of rows) {
    if (a.pos === b.pos) continue;
    const gap = a.agi - b.agi;
    if (gap < 25) continue;
    const longevity = (a.atk + b.atk) / (a.hp + b.hp); // lower = longer fight
    const score = longevity - gap / 1000;
    if (!best || score < best.score) best = { ours: a, foe: b, gap, score };
  }
  return best;
}

async function run({ target, outDir, port, cdpPort }) {
  const { preEngineMd5 } = require("../lib/live");
  const rep = new Reporter({ suite: "demo-battle", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const S = ctx.session;
    const boot = await S.boot(ctx.gameUrl);
    rep.note(`boot: focus=${boot.focused} fps=${boot.fps}`);
    await S.newGame();
    await battle.installHooks(S);

    // ---------- 1. Gym event end to end (Sylva, Map016 ev2) ----------
    // sustain=true mirrors the FR2 B5c proof technique: this check proves the
    // event->battle->badge FLOW through the real UI, not balance.
    await S.seedParty([{ species: 28, level: 55 }, { species: 19, level: 55 }, { species: 37, level: 55 }]);
    const gym = await battle.driveGymEvent(S, { mapId: 16, x: 8, y: 5, eventId: 2, winSwitch: 26, badgeName: "Canopy Badge", timeoutMs: 600000, sustain: true });
    await rep.check("demo.gymEventEndToEnd", gym.completed === true,
      `completed=${gym.completed} sawBattle=${gym.sawBattle} badges=${JSON.stringify(gym.badges)} ${gym.reason || ""}`);
    await rep.check("demo.gymBadge", Array.isArray(gym.badges) && gym.badges.includes("Canopy Badge"),
      `badges=${JSON.stringify(gym.badges)} (want Canopy Badge)`);

    // ---------- 2. Item use through the BAG window (QA G5) ----------
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 30 }]);
    await S.seedItem(POTION, 3);
    await S.ev("(function(){ const m = $gameParty.allMembers()[0]; m.setHp(Math.max(1, Math.floor(m.mhp * 0.35))); return m.hp; })()");
    const hpBefore = await S.evSafe("(function(){ const m = $gameParty.allMembers()[0]; return { hp: m.hp, mhp: m.mhp }; })()");
    await S.startWildBattleVerified(1, 5);
    let submitted = null;
    let maxHpAfter = -1;
    const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      const st = await battle.battleState(S);
      if (st && st.cmd) { submitted = await battle.useItemViaUI(S, POTION); break; }
      if (st && st.phase === "start") await S.holdOk(200);
      await sleep(400);
    }
    // Sample HP until the turn resolves (heal lands), up to 30 s.
    const t1 = Date.now();
    while (Date.now() - t1 < 30000) {
      const hp = await S.evSafe("(function(){ const m = $gameParty.allMembers()[0]; return m ? m.hp : -1; })()");
      if (typeof hp === "number" && hp > maxHpAfter) maxHpAfter = hp;
      const st = await battle.battleState(S);
      if (st && (st.cmd || st.scene === "Scene_Map")) break;
      await sleep(400);
    }
    const finish = await battle.driveBattle(S, { strategy: "best", timeoutMs: 180000 });
    const potionsAfter = await S.evSafe(`$gameParty.numItems($dataItems[${POTION}])`);
    const logs = await battle.readLogs(S);
    const logMentions = logs.some((l) => /Potion/i.test(l));
    await rep.check("demo.itemUse.submitted", !!submitted && submitted.ok === true, JSON.stringify(submitted));
    await rep.check("demo.itemUse.countDecremented", potionsAfter === 2, `potions 3 -> ${potionsAfter} (want 2)`);
    await rep.check("demo.itemUse.healed", maxHpAfter > (hpBefore ? hpBefore.hp : 0),
      `hp ${hpBefore && hpBefore.hp}/${hpBefore && hpBefore.mhp} -> peak ${maxHpAfter} after item turn; battle outcome=${finish.outcome}; logMentionsPotion=${logMentions}`);

    // ---------- 3. Sparring: multi-turn battle + turn order (QA G10) ----------
    const pair = pickSparPair(ctx.gameDir || DEFAULT_GAME_DIR);
    rep.note(`spar pair from data: ours=${pair.ours.name}(pos ${pair.ours.pos}, agi ${pair.ours.agi}) vs foe=${pair.foe.name}(pos ${pair.foe.pos}, agi ${pair.foe.agi})`);
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: pair.ours.pos, level: 10 }]);
    await S.startWildBattleVerified(pair.foe.pos, 10);
    const liveAgi = await S.evSafe("(function(){ const a = $gameParty.battleMembers()[0]; const f = $gameTroop.aliveMembers()[0]; return a && f ? { ours: a.agi, foe: f.agi } : null; })()");
    const spar = await battle.driveBattle(S, { strategy: "spar", timeoutMs: 300000 });
    const byTurn = new Map();
    for (const a of spar.actions) {
      if (!byTurn.has(a.turn)) byTurn.set(a.turn, []);
      byTurn.get(a.turn).push(a);
    }
    const comparable = [...byTurn.values()].filter((arr) => arr.length === 2 && arr[0].actorSide !== arr[1].actorSide && Math.abs((arr[0].agi || 0) - (arr[1].agi || 0)) >= 3);
    const ordered = comparable.filter((arr) => (arr[0].agi || 0) > (arr[1].agi || 0));
    // MZ action speed = agi + rand(0 .. 5 + agi/4); a live gap beyond that
    // bound makes the expected order deterministic.
    const bound = liveAgi ? 5 + Math.max(liveAgi.ours, liveAgi.foe) / 4 : Infinity;
    const deterministic = !!liveAgi && Math.abs(liveAgi.ours - liveAgi.foe) > bound;
    await rep.check("demo.turnOrder.multiTurn", spar.turns >= 2 && spar.outcome === "win",
      `outcome=${spar.outcome} maxTurnIndex=${spar.turns} (want >=2, i.e. 3+ turns) actions=${spar.actions.length}`);
    await rep.check("demo.turnOrder.recorded", comparable.length >= 2 && (!deterministic || ordered.length === comparable.length),
      `comparable 2-action turns=${comparable.length}, agi-ordered=${ordered.length}, liveAgi=${JSON.stringify(liveAgi)}, deterministicGap=${deterministic}, sample=${JSON.stringify(comparable.slice(0, 3))}`);

    // ---------- 4. Stadium capability probe ----------
    const stadium = await battle.driveStadiumRun(S, { timeoutMs: 120000 });
    const engineHas = await S.evSafe("typeof GanjukoEngine !== 'undefined' && typeof GanjukoEngine.startStadium === 'function'");
    await rep.check("demo.stadiumCapability", stadium.supported === !!engineHas,
      engineHas ? `engine exposes startStadium; run=${JSON.stringify(stadium).slice(0, 300)}` : "local engine has no startStadium (pre-Section-16 build) — driver correctly reports supported:false; chain driving is exercised against v3+ engines");

    const fpsEnd = await S.fpsProbe(1500);
    await rep.check("rig.loopAlive", fpsEnd > 0, `frame clock still advancing at suite end (fps=${fpsEnd})`);
    await rep.check("rig.noExceptions", ctx.cdp.exceptions.length === 0,
      (ctx.cdp.exceptions.length ? "EXCEPTIONS: " + JSON.stringify(ctx.cdp.exceptions.slice(0, 3)) : "no uncaught page exceptions") +
      (ctx.cdp.consoleErrors.length ? ` | console.error warnings: ${ctx.cdp.consoleErrors.length} (first: ${String(ctx.cdp.consoleErrors[0].text).slice(0, 120)})` : ""));
  } catch (e) {
    await rep.check("demo.fatal", false, String((e && e.message) || e));
  } finally {
    if (ctx) await ctx.cleanup();
  }
  return rep.write();
}

module.exports = { run };
