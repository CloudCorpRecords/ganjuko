// rig2 v13 drives — Champions Battle Standard live verification on the
// final engine bytes: paralysis (chip, AGI halving, full-para event),
// burn (chip, 1/16 tick, physical halving), stat stages (callout,
// measured damage change, Leaf Storm self-drop), abilities (entry
// banner + measured stage effect, damage-taken measurement through
// the real makeDamageValue chain).
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, DEFAULT_GAME_DIR } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

async function shot(S, outDir, name) {
  try {
    const r = await S.cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const p = path.join(outDir, "shots", name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, Buffer.from(r.data, "base64"));
    return p;
  } catch (e) { return null; }
}

async function run({ target, outDir, port, cdpPort }) {
  const { preEngineMd5 } = require("../lib/live");
  const rep = new Reporter({ suite: "v13-drives", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const S = ctx.session;
    const boot = await S.boot(ctx.gameUrl);
    rep.note(`boot: focus=${boot.focused} fps=${boot.fps}`);
    const ev = (code) => S.evSafe(`(function(){ try { ${code} } catch (e) { return "ERR:" + e.message; } })()`);
    const resetLogs = () => ev(`if (window.__rig2) window.__rig2.logs.length = 0; return 1;`);
    const actorOnce = () => ev(`const m = $gameParty.battleMembers()[0]; return m ? { hp: m.hp, mhp: m.mhp, agi: m.agi, stages: Object.assign({}, m._ganjukoStages || {}), states: m.states().map(s => s.id), ability: m._s21AbilityOverride || m._s21AbilityId || null } : null;`);
    const foeOnce = () => ev(`const f = $gameTroop.aliveMembers()[0]; return f ? { hp: f.hp, mhp: f.mhp, stages: Object.assign({}, f._ganjukoStages || {}) } : null;`);
    // Retry wrappers: a single eval can return undefined while the
    // tunnel/page settles right after a battle starts.
    async function actor() {
      for (let i = 0; i < 12; i++) {
        const v = await actorOnce();
        if (v && typeof v.hp === "number") return v;
        await sleep(800);
      }
      return { hp: -1, mhp: 0, agi: 0, stages: {}, states: [], ability: null };
    }
    async function foe() {
      for (let i = 0; i < 12; i++) {
        const v = await foeOnce();
        if (v && typeof v.hp === "number") return v;
        await sleep(800);
      }
      return null;
    }

    // Use one specific skill through the real windows (fightViaUI's
    // pattern with a fixed pick).
    async function useSkillById(skillId) {
      const sw0 = await battle.windowState(S, battle.WIN.skill);
      if (!(sw0 && sw0.active)) {
        const cmd = await battle.windowState(S, battle.WIN.cmd);
        if (!cmd || !cmd.active || !cmd.symbols) return { ok: false, reason: "cmd window inactive" };
        const fi = cmd.symbols.indexOf("skill");
        if (fi < 0) return { ok: false, reason: "no FIGHT" };
        if (!(await battle.moveCursorTo(S, battle.WIN.cmd, fi))) return { ok: false, reason: "cursor" };
        await S.holdOk(400);
      }
      for (let i = 0; i < 20; i++) {
        const sw = await battle.windowState(S, battle.WIN.skill, { withItems: true });
        if (sw && sw.active && sw.items) {
          const idx = sw.items.findIndex((it) => it && it.id === skillId);
          if (idx < 0) return { ok: false, reason: "skill " + skillId + " not in window" };
          if (!(await battle.moveCursorTo(S, battle.WIN.skill, idx))) return { ok: false, reason: "cursor skill" };
          const v = await battle.windowState(S, battle.WIN.skill, { withItems: true });
          if (!v || !v.items[v.index] || v.items[v.index].id !== skillId) return { ok: false, reason: "selection mismatch" };
          await S.holdOk(400);
          return { ok: true, skillId };
        }
        await sleep(350);
      }
      return { ok: false, reason: "skill window never activated" };
    }
    // SAFE stepper: advances messages and confirms target windows,
    // but NEVER touches the command/skill windows (battleStep's spar
    // fighting kept polluting measurements and killing drive foes).
    async function safeStep(st) {
      if (!st) { await sleep(400); return; }
      if (st.scene === "Scene_GanjukoEvolution") { await sleep(650); return; }
      if (st.enemy) { await battle.moveCursorTo(S, battle.WIN.enemy, 0); await S.holdOk(250); await sleep(400); return; }
      if (st.actor) { await battle.moveCursorTo(S, battle.WIN.actor, 0); await S.holdOk(250); await sleep(400); return; }
      if (st.msgBusy || st.phase === "start" || st.phase === "battleEnd") { await S.holdOk(300); await sleep(450); return; }
      await sleep(400);
    }
    // Advance until the next command window via the safe stepper.
    async function advanceTurn(opts = {}) {
      for (let i = 0; i < 40; i++) {
        const st = await battle.battleState(S);
        if (!st || st.scene !== "Scene_Battle") return st;
        if (st.cmd && i > 2) return st;
        await safeStep(st);
      }
      return await battle.battleState(S);
    }
    // Wait until the actor command window is up (a stable eval point).
    // Must PUMP while waiting: the battle-intro message only advances
    // on OK input; pure polling wedges the battle at turn 0 forever.
    // The pump is the SAFE stepper (no command/skill window contact).
    async function waitCmd(tries = 80) {
      for (let i = 0; i < tries; i++) {
        const st = await battle.battleState(S);
        if (!st) { await sleep(600); continue; } // transient eval miss: not evidence
        if (st.scene !== "Scene_Battle") return st;
        if (st.cmd) return st;
        await safeStep(st);
      }
      return await battle.battleState(S);
    }
    // Pump + read until the actor readback is real (agi > 0), or give up.
    async function settleActor(maxRounds = 8) {
      for (let i = 0; i < maxRounds; i++) {
        await waitCmd();
        const a = await actor();
        if (a && a.agi > 0) return a;
        await sleep(1200);
      }
      const a = await actor();
      return a && a.agi > 0 ? a : null;
    }
    // Poll-step the battle (sustain optional) until pred() or turn cap.
    async function stepUntil(pred, maxTurns, opts = {}) {
      const c = { evoPressed: false, itemUsed: false, throws: 0, lastAction: null };
      let lastTurn = -1;
      for (let i = 0; i < maxTurns * 30; i++) {
        const st = await battle.battleState(S);
        if (!st || st.scene !== "Scene_Battle") return { ended: true, turn: lastTurn };
        if (st.turn !== lastTurn) {
          lastTurn = st.turn;
          if (await pred(st)) return { ended: false, turn: lastTurn };
          if (lastTurn > maxTurns) return { ended: false, turn: lastTurn };
        }
        await battle.battleStep(S, st, opts, c);
      }
      return { ended: false, turn: lastTurn };
    }
    async function endBattle() {
      await battle.driveBattle(S, { strategy: "best", timeoutMs: 120000 }).catch(() => null);
      for (let i = 0; i < 20; i++) {
        const st = await battle.battleState(S);
        if (!st || st.scene !== "Scene_Battle") break;
        await sleep(500);
      }
    }

    // ============ D1: PARALYSIS ============
    await S.newGame();
    await battle.installHooks(S);
    await resetLogs();
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(1, 3);
    const settled = await settleActor();
    const baseAgi = settled ? settled.agi : 0;
    let paraState = settled;
    for (let i = 0; i < 5; i++) {
      await ev(`$gameParty.battleMembers()[0].addState(12); return 1;`);
      await sleep(700);
      paraState = await actor();
      if (paraState.states.includes(12)) break;
    }
    const paraShot = await shot(S, outDir, "v13-paralysis-chip.png");
    await rep.check("v13.paralysis.applied", !!paraState.states.includes(12), `states=${JSON.stringify(paraState.states)} baseAgi=${baseAgi}`);
    await rep.check("v13.paralysis.agiHalved", baseAgi > 0 && (paraState.agi === Math.max(1, Math.floor(baseAgi * 0.5)) || paraState.agi === Math.ceil(baseAgi * 0.5)),
      `agi ${baseAgi} -> ${paraState.agi} (expect ~${Math.floor(baseAgi * 0.5)})`);
    await rep.check("v13.paralysis.chipShot", !!paraShot, `screenshot=${paraShot}`);
    // Full-paralysis event hunt: paralyze a durable Lv50 foe and let
    // driveBattle (the proven driver) spar it down under sustain; the
    // foe attempts an action every turn at a 12.5% cancel rate. Scan
    // the captured battle log after each bout, up to 3 bouts.
    await endBattle();
    let fullPara = false;
    let bouts = 0;
    for (let b = 0; b < 3 && !fullPara; b++) {
      bouts++;
      await S.newGame();
      await battle.installHooks(S);
      await S.seedParty([{ species: 28, level: 50 }]);
      await S.startWildBattleVerified(16, 50);
      await settleActor();
      await ev(`const f = $gameTroop.aliveMembers()[0]; if (f) f.addState(12); return 1;`);
      await sleep(600);
      await battle.driveBattle(S, { strategy: "spar", sustain: true, timeoutMs: 420000 }).catch(() => null);
      const logs = await battle.readLogs(S).catch(() => []);
      if (/paralyzed and can.t move|is paralyzed! It can.t move/i.test((logs || []).join(" "))) fullPara = true;
    }
    await rep.check("v13.paralysis.fullParaEvent", fullPara, `foe-side paralysis over ${bouts} driven bout(s), log scanned for the cancellation line`);

    // ============ D2: BURN ============
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    // (a) physical damage unburned: 3 Heavy Slam hits on a Lv50 Earth foe
    async function measureHits(n, skillId) {
      // settle: pump + read until the foe readback is real
      for (let i = 0; i < 24; i++) {
        const f = await foe();
        if (f) break;
        await waitCmd();
      }
      const deltas = [];
      for (let i = 0; i < n; i++) {
        await waitCmd();
        const f0 = await foe();
        if (!f0) break;
        await useSkillById(skillId);
        await advanceTurn({ strategy: "spar" });
        const f1 = await foe();
        if (f1 && f0) deltas.push(f0.hp - f1.hp);
        const st = await battle.battleState(S);
        if (!st || st.scene !== "Scene_Battle") break;
      }
      return deltas;
    }
    await S.startWildBattleVerified(16, 50);
    await settleActor();
    const sample51 = async (n) => ev(`
      const me = $gameParty.battleMembers()[0];
      const foeB = $gameTroop.aliveMembers()[0];
      const out = [];
      for (let i = 0; i < ${n}; i++) {
        const act = new Game_Action(me);
        act.setSkill(51);
        out.push(Math.abs(act.makeDamageValue(foeB, false)));
      }
      return out;`);
    const cleanSamples = await sample51(12);
    let burnState = await actor();
    for (let i = 0; i < 5; i++) {
      await ev(`$gameParty.battleMembers()[0].addState(11); return 1;`);
      await sleep(700);
      burnState = await actor();
      if (burnState.states.includes(11)) break;
    }
    const burnShot = await shot(S, outDir, "v13-burn-chip.png");
    await rep.check("v13.burn.applied", burnState.states.includes(11), `states=${JSON.stringify(burnState.states)}`);
    await rep.check("v13.burn.chipShot", !!burnShot, `screenshot=${burnShot}`);
    const burnedSamples = await sample51(12);
    const mean = (a) => (Array.isArray(a) && a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const ratio = mean(cleanSamples) > 0 ? mean(burnedSamples) / mean(cleanSamples) : 0;
    await rep.check("v13.burn.physicalHalved", ratio > 0.35 && ratio < 0.65,
      `Heavy Slam makeDamageValue means: clean=${mean(cleanSamples).toFixed(1)} burned=${mean(burnedSamples).toFixed(1)} ratio=${ratio.toFixed(2)} (expect ~0.50)`);
    await endBattle();
    // (c) 1/16 tick: Lv3 foe, War Dance turns, no sustain; hp deltas per turn
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(1, 3);
    await waitCmd();
    await ev(`$gameParty.battleMembers()[0].addState(11); return 1;`);
    const tickDeltas = [];
    let tickMhp = 0;
    for (let attempt = 0; attempt < 2 && tickDeltas.length < 2; attempt++) {
      if (attempt > 0) {
        await S.newGame();
        await battle.installHooks(S);
        await S.seedParty([{ species: 28, level: 50 }]);
        await S.startWildBattleVerified(1, 3);
        await waitCmd();
        await ev(`$gameParty.battleMembers()[0].addState(11); return 1;`);
      }
      const a0 = await actor();
      tickMhp = a0.mhp;
      let prev = a0.hp;
      tickDeltas.length = 0;
      for (let t = 0; t < 3; t++) {
        const st = await waitCmd();
        if (!st || st.scene !== "Scene_Battle") break;
        const now0 = (await actor()).hp;
        if (t > 0) tickDeltas.push(prev - now0);
        prev = now0;
        if (now0 <= 0) break; // fainted: retry with a fresh battle
        await useSkillById(81); // War Dance (non-damaging)
        await sleep(1600);
      }
    }
    {
      const chip = Math.floor(tickMhp / 16);
      await rep.check("v13.burn.tick", tickDeltas.some((d) => d >= chip && d <= chip + 8),
        `mhp=${tickMhp} expect chip=${chip}/turn; per-turn hp deltas=${JSON.stringify(tickDeltas)} (foe damage included, small at Lv3)`);
    }
    await endBattle();

    // ============ D3: STAGES ============
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(16, 50);
    await settleActor();
    const preDance = await sample51(12);
    const skillsKnown = await ev(`return $gameParty.battleMembers()[0].skills ? $gameParty.battleMembers()[0].skills().map(s => s.id) : [];`);
    const danceId = Array.isArray(skillsKnown) && skillsKnown.includes(81) ? 81 : 52;
    const expectStage = danceId === 81 ? 2 : 1;
    await useSkillById(danceId);
    // watch-read: poll the store until the stage lands (turn execution
    // over the tunnel is not instantaneous)
    let staged = await actor();
    for (let i = 0; i < 30 && (staged.stages.atk || 0) !== expectStage; i++) {
      await sleep(700);
      staged = await actor();
    }
    const logsD3 = (await battle.readLogs(S).catch(() => [])).join("\n");
    const stageShot = await shot(S, outDir, "v13-stage-pips.png");
    await rep.check("v13.stage.selfBoost", (staged.stages.atk || 0) === expectStage,
      `skill=${danceId} stages=${JSON.stringify(staged.stages)}`);
    await rep.check("v13.stage.callout", /attack (rose|sharply)/i.test(logsD3) || /rose/i.test(logsD3),
      `log tail: ${logsD3.slice(-200).replace(/\n/g, " | ")}`);
    await rep.check("v13.stage.shot", !!stageShot, `screenshot=${stageShot}`);
    const postDance = await sample51(12);
    const dmgRatio = mean(preDance) > 0 ? mean(postDance) / mean(preDance) : 0;
    await rep.check("v13.stage.damageChange", dmgRatio > 1.3,
      `Heavy Slam makeDamageValue means: pre=${mean(preDance).toFixed(1)} post=${mean(postDance).toFixed(1)} ratio=${dmgRatio.toFixed(2)} (stage +${expectStage} ATK)`);
    await endBattle();
    // Leaf Storm self-drop: the only learners are Yggdrash (61 @45)
    // and Glaciodraco (60 @55). Discover what the battle moveset
    // actually offers in-page, use it if present, watch the store.
    {
      let lsDone = false;
      let lsDetail = "";
      const candidates = [
        { pos: 494, level: 50, skill: 61 },
        { pos: 493, level: 60, skill: 60 },
      ];
      for (const cand of candidates) {
        if (lsDone) break;
        await S.newGame();
        await battle.installHooks(S);
        await resetLogs();
        await S.seedParty([{ species: cand.pos, level: cand.level }]);
        await S.startWildBattleVerified(16, 50);
        await settleActor();
        // open the skill window to read the actual battle moveset
        {
          const cmd = await battle.windowState(S, battle.WIN.cmd);
          if (cmd && cmd.active && cmd.symbols) {
            const fi = cmd.symbols.indexOf("skill");
            if (fi >= 0) { await battle.moveCursorTo(S, battle.WIN.cmd, fi); await S.holdOk(400); await sleep(700); }
          }
        }
        const win = await battle.windowState(S, battle.WIN.skill, { withItems: true }).catch(() => null);
        const winIds = win && win.items ? win.items.map((x) => x && x.id) : [];
        const allSkills = await ev(`return $gameParty.battleMembers()[0].skills().map(s => s.id);`);
        lsDetail += `pos${cand.pos}: window=${JSON.stringify(winIds)} skills=${JSON.stringify(allSkills)}; `;
        if (!winIds.includes(cand.skill)) continue;
        await useSkillById(cand.skill);
        let afterLs = await actor();
        for (let i = 0; i < 30 && (afterLs.stages.mat || 0) !== -2; i++) {
          await sleep(700);
          afterLs = await actor();
        }
        const logsLs = (await battle.readLogs(S).catch(() => [])).join("\n");
        await rep.check("v13.stage.leafStormDrop", (afterLs.stages.mat || 0) === -2,
          `species=${cand.pos} skill=${cand.skill} stages=${JSON.stringify(afterLs.stages)} | discovery: ${lsDetail}`);
        await rep.check("v13.stage.leafStormCallout", /harshly fell/i.test(logsLs),
          `log tail: ${logsLs.slice(-200).replace(/\n/g, " | ")}`);
        lsDone = true;
        await endBattle();
      }
      if (!lsDone) {
        await rep.check("v13.stage.leafStormDrop", false,
          `neither learner carries 60/61 in its battle moveset window | discovery: ${lsDetail}`);
      }
    }

    // ============ D4: ABILITIES ============
    // (a) entry ability: Dread Presence -> foe ATK -1 + banner in log
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await ev(`const m = $gameParty.members()[0]; if (m) m._s21AbilityOverride = "dread-presence"; return 1;`);
    await S.startWildBattleVerified(16, 50);
    await settleActor();
    // Re-assert the override on the actual battle actor, then fight a
    // SECOND battle with the same party: the actor (and override)
    // persists, so its entry effect must fire at battle 2's start.
    await ev(`const m = $gameParty.battleMembers()[0]; if (m) m._s21AbilityOverride = "dread-presence"; return 1;`);
    await endBattle();
    await resetLogs();
    await S.startWildBattleVerified(16, 50);
    await settleActor();
    let foeAfterEntry = null;
    for (let i = 0; i < 16 && !foeAfterEntry; i++) { foeAfterEntry = await foe(); if (!foeAfterEntry) await sleep(800); }
    const logsD4 = (await battle.readLogs(S).catch(() => [])).join("\n");
    const bannerShot = await shot(S, outDir, "v13-ability-banner.png");
    await rep.check("v13.ability.entryStage", foeAfterEntry && (foeAfterEntry.stages.atk || 0) === -1,
      `foe stages=${JSON.stringify(foeAfterEntry && foeAfterEntry.stages)}`);
    await rep.check("v13.ability.banner", /Dread Presence/i.test(logsD4),
      `log head: ${logsD4.slice(0, 240).replace(/\n/g, " | ")}`);
    await rep.check("v13.ability.bannerShot", !!bannerShot, `screenshot=${bannerShot}`);
    await endBattle();
    // (b) damage-taken: Prism Scales through the real makeDamageValue
    // chain — Ember (special) samples with a neutral override vs
    // prism-scales, 12 samples each.
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(1, 50);
    await waitCmd();
    const sample = await ev(`
      const foeB = $gameTroop.aliveMembers()[0];
      const me = $gameParty.battleMembers()[0];
      function samples(override) {
        me._s21AbilityOverride = override;
        const out = [];
        for (let i = 0; i < 12; i++) {
          const act = new Game_Action(foeB);
          act.setSkill(6);
          out.push(Math.abs(act.makeDamageValue(me, false)));
        }
        return out;
      }
      const neutral = samples("own-cadence");
      const prism = samples("prism-scales");
      me._s21AbilityOverride = null;
      return { neutral, prism };`);
    if (sample && Array.isArray(sample.neutral) && Array.isArray(sample.prism)) {
      const r = mean(sample.prism) / Math.max(1, mean(sample.neutral));
      await rep.check("v13.ability.takenMeasured", r > 0.38 && r < 0.62,
        `Ember makeDamageValue means: neutral=${mean(sample.neutral).toFixed(1)} prism=${mean(sample.prism).toFixed(1)} ratio=${r.toFixed(2)} (Prism Scales: damage taken halved at full HP, expect ~0.50)`);
    } else {
      await rep.check("v13.ability.takenMeasured", false, `sampling failed: ${JSON.stringify(sample)}`);
    }
    await endBattle();
  } catch (e) {
    rep.note(`v13-drives error: ${e && e.message}`);
    await rep.check("v13.drives.completed", false, String(e && e.message));
  } finally {
    if (ctx && typeof ctx.cleanup === "function") await ctx.cleanup().catch(() => null);
  }
  return rep.write();
}

module.exports = { run };
