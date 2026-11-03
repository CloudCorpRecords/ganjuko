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
    const actor = () => ev(`const m = $gameParty.battleMembers()[0]; return m ? { hp: m.hp, mhp: m.mhp, agi: m.agi, stages: Object.assign({}, m._ganjukoStages || {}), states: m.states().map(s => s.id), ability: m._s21AbilityOverride || m._s21AbilityId || null } : null;`);
    const foe = () => ev(`const f = $gameTroop.aliveMembers()[0]; return f ? { hp: f.hp, mhp: f.mhp, stages: Object.assign({}, f._ganjukoStages || {}) } : null;`);

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
    // Advance until the next command window (target windows confirmed
    // by battleStep polls along the way).
    async function advanceTurn(opts = {}) {
      const c = { evoPressed: false, itemUsed: false, throws: 0, lastAction: null };
      for (let i = 0; i < 40; i++) {
        const st = await battle.battleState(S);
        if (!st || st.scene !== "Scene_Battle") return st;
        if (st.cmd && i > 2) return st;
        await battle.battleStep(S, st, opts, c);
      }
      return await battle.battleState(S);
    }
    // Wait until the actor command window is up (a stable eval point).
    async function waitCmd(tries = 60) {
      for (let i = 0; i < tries; i++) {
        const st = await battle.battleState(S);
        if (st && st.scene === "Scene_Battle" && st.cmd) return st;
        if (st && st.scene !== "Scene_Battle") return st;
        await sleep(450);
      }
      return await battle.battleState(S);
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
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(1, 3);
    await waitCmd();
    const baseAgi = (await actor()).agi;
    await ev(`$gameParty.battleMembers()[0].addState(12); return 1;`);
    await sleep(700);
    const paraState = await actor();
    const paraShot = await shot(S, outDir, "v13-paralysis-chip.png");
    await rep.check("v13.paralysis.applied", paraState.states.includes(12), `states=${JSON.stringify(paraState.states)}`);
    await rep.check("v13.paralysis.agiHalved", paraState.agi === Math.max(1, Math.floor(baseAgi * 0.5)) || paraState.agi === Math.ceil(baseAgi * 0.5),
      `agi ${baseAgi} -> ${paraState.agi} (expect ~${Math.floor(baseAgi * 0.5)})`);
    await rep.check("v13.paralysis.chipShot", !!paraShot, `screenshot=${paraShot}`);
    // Brace every turn (no foe damage); sustain keeps the actor alive;
    // poll the battle log for a full-paralysis cancellation.
    let fullPara = false;
    let turnsTried = 0;
    for (let t = 0; t < 44 && !fullPara; t++) {
      const st = await waitCmd();
      if (!st || st.scene !== "Scene_Battle") break;
      turnsTried++;
      const logs = await battle.readLogs(S).catch(() => []);
      if (/fully paralyzed|fully paralysed/i.test((logs || []).join(" "))) { fullPara = true; break; }
      await ev(`const m = $gameParty.battleMembers()[0]; if (m) m.setHp(m.mhp); return 1;`);
      await useSkillById(2); // Brace: passes the turn without hurting the foe
      await sleep(1600);
      const logs2 = await battle.readLogs(S).catch(() => []);
      if (/fully paralyzed|fully paralysed/i.test((logs2 || []).join(" "))) fullPara = true;
    }
    await rep.check("v13.paralysis.fullParaEvent", fullPara, `brace turns attempted=${turnsTried} (12.5%/attempt)`);
    await endBattle();

    // ============ D2: BURN ============
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    // (a) physical damage unburned: 3 Heavy Slam hits on a Lv50 Earth foe
    async function measureHits(n, skillId) {
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
    const hitsClean = await measureHits(3, 51);
    await endBattle();
    // (b) burned: same measurement
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(16, 50);
    await waitCmd();
    await ev(`$gameParty.battleMembers()[0].addState(11); return 1;`);
    await sleep(700);
    const burnState = await actor();
    const burnShot = await shot(S, outDir, "v13-burn-chip.png");
    await rep.check("v13.burn.applied", burnState.states.includes(11), `states=${JSON.stringify(burnState.states)}`);
    await rep.check("v13.burn.chipShot", !!burnShot, `screenshot=${burnShot}`);
    const hitsBurned = await measureHits(3, 51);
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const ratio = mean(hitsClean) > 0 ? mean(hitsBurned) / mean(hitsClean) : 0;
    await rep.check("v13.burn.physicalHalved", ratio > 0.3 && ratio < 0.7,
      `clean hits=${JSON.stringify(hitsClean)} burned hits=${JSON.stringify(hitsBurned)} ratio=${ratio.toFixed(2)}`);
    await endBattle();
    // (c) 1/16 tick: Lv3 foe, Brace turns, no sustain; hp deltas per turn
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(1, 3);
    await waitCmd();
    await ev(`$gameParty.battleMembers()[0].addState(11); return 1;`);
    const tickDeltas = [];
    {
      let prev = (await actor()).hp;
      for (let t = 0; t < 3; t++) {
        const st = await waitCmd();
        if (!st || st.scene !== "Scene_Battle") break;
        const now0 = (await actor()).hp;
        if (t > 0) tickDeltas.push(prev - now0);
        prev = now0;
        await useSkillById(2); // Brace
        await sleep(1600);
      }
      const chip = Math.floor(mhp / 16);
      await rep.check("v13.burn.tick", tickDeltas.some((d) => d >= chip && d <= chip + 6),
        `mhp=${mhp} expect chip=${chip}/turn; per-turn hp deltas=${JSON.stringify(tickDeltas)} (foe damage included, small at Lv3)`);
    }
    await endBattle();

    // ============ D3: STAGES ============
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await S.startWildBattleVerified(16, 50);
    await waitCmd();
    const preDance = await measureHits(2, 51);
    const skillsKnown = await ev(`return $gameParty.battleMembers()[0].skills ? $gameParty.battleMembers()[0].skills().map(s => s.id) : [];`);
    const danceId = Array.isArray(skillsKnown) && skillsKnown.includes(81) ? 81 : 52;
    await useSkillById(danceId);
    await sleep(2500);
    await waitCmd();
    const staged = await actor();
    const logsD3 = (await battle.readLogs(S).catch(() => [])).join("\n");
    const stageShot = await shot(S, outDir, "v13-stage-pips.png");
    const expectStage = danceId === 81 ? 2 : 1;
    await rep.check("v13.stage.selfBoost", (staged.stages.atk || 0) === expectStage,
      `skill=${danceId} stages=${JSON.stringify(staged.stages)}`);
    await rep.check("v13.stage.callout", /attack (rose|sharply)/i.test(logsD3) || /rose/i.test(logsD3),
      `log tail: ${logsD3.slice(-200).replace(/\n/g, " | ")}`);
    await rep.check("v13.stage.shot", !!stageShot, `screenshot=${stageShot}`);
    const postDance = await measureHits(2, 51);
    const dmgRatio = mean(preDance) > 0 ? mean(postDance) / mean(preDance) : 0;
    await rep.check("v13.stage.damageChange", dmgRatio > 1.3,
      `pre=${JSON.stringify(preDance)} post=${JSON.stringify(postDance)} ratio=${dmgRatio.toFixed(2)} (stage +${expectStage} ATK)`);
    await endBattle();
    // Leaf Storm self-drop: find a species that learns skill 60/61 by Lv50
    const speciesData = JSON.parse(fs.readFileSync(path.join(DEFAULT_GAME_DIR, "data/GanjukoSpecies.json"), "utf8"));
    let lsPos = -1;
    speciesData.forEach((sp, i) => {
      if (lsPos > 0) return;
      if ((sp.learnings || []).some((l) => (l.skillId === 60 || l.skillId === 61) && l.level <= 50)) lsPos = i + 1;
    });
    if (lsPos > 0) {
      await S.newGame();
      await battle.installHooks(S);
      await S.seedParty([{ species: lsPos, level: 50 }]);
      await S.startWildBattleVerified(16, 50);
      await waitCmd();
      const lsSkill = await ev(`const m = $gameParty.battleMembers()[0]; const sk = m.skills().map(s => s.id).filter(id => id === 60 || id === 61); return sk[0] || 0;`);
      await useSkillById(lsSkill);
      await sleep(2500);
      await waitCmd();
      const afterLs = await actor();
      const logsLs = (await battle.readLogs(S).catch(() => [])).join("\n");
      await rep.check("v13.stage.leafStormDrop", (afterLs.stages.mat || 0) === -2,
        `species=${lsPos} skill=${lsSkill} stages=${JSON.stringify(afterLs.stages)}`);
      await rep.check("v13.stage.leafStormCallout", /harshly fell|special attack/i.test(logsLs),
        `log tail: ${logsLs.slice(-200).replace(/\n/g, " | ")}`);
      await endBattle();
    } else {
      await rep.check("v13.stage.leafStormDrop", false, "no species learns skill 60/61 by Lv50 (data scan)");
    }

    // ============ D4: ABILITIES ============
    // (a) entry ability: Dread Presence -> foe ATK -1 + banner in log
    await S.newGame();
    await battle.installHooks(S);
    await S.seedParty([{ species: 28, level: 50 }]);
    await ev(`const m = $gameParty.members()[0]; m._s21AbilityOverride = "dread-presence"; return 1;`);
    await S.startWildBattleVerified(16, 50);
    await sleep(2500);
    const foeAfterEntry = await foe();
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
      await rep.check("v13.ability.takenMeasured", r > 0.6 && r < 0.9,
        `Ember makeDamageValue means: neutral=${mean(sample.neutral).toFixed(1)} prism=${mean(sample.prism).toFixed(1)} ratio=${r.toFixed(2)} (expect ~0.75)`);
    } else {
      await rep.check("v13.ability.takenMeasured", false, `sampling failed: ${JSON.stringify(sample)}`);
    }
    await endBattle();
  } catch (e) {
    rep.note(`v13-drives error: ${e && e.message}`);
    await rep.check("v13.drives.completed", false, String(e && e.message));
  } finally {
    if (ctx) await ctx.close().catch(() => null);
    await rep.finish();
  }
}

module.exports = { run };
