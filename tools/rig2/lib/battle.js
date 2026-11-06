// rig2 battle driver v2 — a phase-aware state machine that drives the REAL
// battle UI with held keys (closed-loop: every cursor move is verified by
// reading the window back). It exists because the 2026-11-01 lanes proved:
//  - a skill picker that misreads MZ damage formulas (coefficient AFTER '*')
//    stalls battles forever — here scoring uses the game's own
//    Game_Action.makeDamageValue, with the formula-parse as fallback;
//  - QA rows G5 (item use) and G10 (turn order) went inconclusive because no
//    driver could work the custom BAG window or force multi-turn battles —
//    useItemThroughUI() and sparring mode close both;
//  - battle 'start' phases need OK presses, the evolution scene needs exactly
//    ONE OK in phase 3, battleEnd wants a slow OK cadence. All encoded below.
"use strict";
const { sleep } = require("./cdp");

const WIN = {
  cmd: "SceneManager._scene._actorCommandWindow",
  skill: "SceneManager._scene._skillWindow",
  item: "SceneManager._scene._itemWindow",
  enemy: "SceneManager._scene._enemyWindow",
  actor: "SceneManager._scene._actorWindow",
  sw: "SceneManager._scene._ganjukoSwitchWindow",
};

// Install turn-order + battle-log recorders (idempotent, runtime-only).
async function installHooks(session) {
  await session.evSafe(`(function(){
    if (window.__rig2) return 1;
    window.__rig2 = { actions: [], logs: [] };
    const _sa = BattleManager.startAction;
    BattleManager.startAction = function() {
      try {
        const s = this._subject;
        window.__rig2.actions.push({ turn: $gameTroop.turnCount(), name: s ? s.name() : "?", actorSide: s ? !!s.isActor() : null, agi: s ? s.agi : null });
      } catch (e) {}
      return _sa.apply(this, arguments);
    };
    if (typeof Window_BattleLog !== "undefined" && Window_BattleLog.prototype.addText) {
      const _at = Window_BattleLog.prototype.addText;
      Window_BattleLog.prototype.addText = function(t) {
        try { window.__rig2.logs.push(String(t)); } catch (e) {}
        return _at.apply(this, arguments);
      };
    }
    return 1;
  })()`);
}

function readActions(session) {
  return session.evSafe("(function(){ return window.__rig2 ? window.__rig2.actions.slice() : []; })()");
}
function readLogs(session) {
  return session.evSafe("(function(){ return window.__rig2 ? window.__rig2.logs.slice() : []; })()");
}

// One lean battle-state poll (keep payloads small — heavy probes stall
// battle-end processing, FR2 rig lesson 4).
function battleState(session) {
  return session.evSafe(`(function(){ try {
    const s = SceneManager._scene;
    const name = s ? s.constructor.name : "none";
    return {
      scene: name,
      phase: (typeof BattleManager !== "undefined" && BattleManager._phase) || "",
      evoPhase: name === "Scene_GanjukoEvolution" && s._phase !== undefined ? s._phase : null,
      cmd: !!(s && s._actorCommandWindow && s._actorCommandWindow.active),
      skill: !!(s && s._skillWindow && s._skillWindow.active),
      item: !!(s && s._itemWindow && s._itemWindow.active),
      enemy: !!(s && s._enemyWindow && s._enemyWindow.active),
      actor: !!(s && s._actorWindow && s._actorWindow.active),
      msgBusy: !!(typeof $gameMessage !== "undefined" && $gameMessage.isBusy()),
      interp: !!(typeof $gameMap !== "undefined" && $gameMap._interpreter && $gameMap._interpreter.isRunning()),
      troopAlive: typeof $gameTroop !== "undefined" ? $gameTroop.aliveMembers().length : -1,
      foeHpPct: (function(){ try { const f = $gameTroop.aliveMembers()[0]; return f ? Math.round((f.hp / f.mhp) * 100) / 100 : null; } catch (e) { return null; } })(),
      partyAlive: typeof $gameParty !== "undefined" ? $gameParty.aliveMembers().length : -1,
      turn: typeof $gameTroop !== "undefined" ? $gameTroop.turnCount() : -1
    };
  } catch (e) { return null; } })()`);
}

// Window state. LEAN BY DEFAULT: index/active/symbols only. Item enumeration
// (itemAt for every row) is a separate call — through a tunnel each eval is
// seconds, and the first version of this driver burned an entire 180 s
// battle timeout inside cursor navigation round trips.
async function windowState(session, winPath, { withItems = false } = {}) {
  return session.evSafe(`(function(){ try {
    const w = ${winPath};
    if (!w) return null;
    const out = { active: !!w.active, index: w.index(), maxCols: typeof w.maxCols === "function" ? w.maxCols() : 1,
                  maxItems: typeof w.maxItems === "function" ? w.maxItems() : 0,
                  symbols: w._list ? w._list.map(c => c.symbol) : null,
                  currentSymbol: typeof w.currentSymbol === "function" ? w.currentSymbol() : null, items: null };
    if (${withItems ? "true" : "false"}) {
      const items = [];
      for (let j = 0; j < out.maxItems; j++) { try { const it = w.itemAt(j); items.push(it ? { id: it.id, name: it.name } : null); } catch (e) { items.push(null); } }
      out.items = items;
    }
    return out;
  } catch (e) { return null; } })()`);
}

// Closed-loop cursor navigation: press a direction, READ BACK the index,
// repeat until the target is reached. Fails loudly after maxPresses.
async function moveCursorTo(session, winPath, target, { maxPresses = 30, holdMs = 350, settleMs = 320 } = {}) {
  for (let p = 0; p < maxPresses; p++) {
    const st = await windowState(session, winPath);
    if (!st || !st.active) return false;
    if (st.index === target) return true;
    const cols = Math.max(1, st.maxCols);
    const row = Math.floor(st.index / cols), col = st.index % cols;
    const trow = Math.floor(target / cols), tcol = target % cols;
    let dir = null;
    if (trow > row) dir = "down"; else if (trow < row) dir = "up";
    else if (tcol > col) dir = "right"; else if (tcol < col) dir = "left";
    if (!dir) return true;
    const before = st.index;
    await session.holdKey(dir, holdMs);
    await sleep(settleMs);
    const after = await windowState(session, winPath);
    if (after && after.index === before) {
      // Grid edge semantics (wrap) differ per window; try the other axis once.
      const alt = dir === "down" || dir === "up" ? (target > before ? "right" : "left") : (target > before ? "down" : "up");
      await session.holdKey(alt, holdMs);
      await sleep(settleMs);
    }
  }
  const st = await windowState(session, winPath);
  return !!st && st.index === target;
}

// Score the current actor's skills against the first living foe using the
// game's own damage math (3-sample makeDamageValue average). Fallback: the
// FR2 formula parse (largest coefficient after '*') if sampling throws.
function scoreSkills(session) {
  return session.evSafe(`(function(){ try {
    const scene = SceneManager._scene;
    const w = scene && scene._skillWindow;
    const action = (typeof BattleManager !== "undefined") ? BattleManager.inputtingAction() : null;
    if (!action) return null;
    const subject = action.subject();
    const foe = $gameTroop.aliveMembers()[0];
    if (!foe || !subject) return null;
    const skills = subject.skills ? subject.skills() : [];
    const out = [];
    for (let j = 0; j < skills.length; j++) {
      const s = skills[j];
      let enabled = false;
      try { enabled = subject.canUse(s); } catch (e) {}
      if (w) { try { const idx = w._data ? w._data.indexOf(s) : -1; if (idx >= 0) enabled = w.isEnabled(s); } catch (e) {} }
      const isDmg = !!(s.damage && (s.damage.type === 1 || s.damage.type === 2) && (s.scope === 1 || s.scope === 2));
      let score = -1;
      if (enabled && isDmg) {
        try {
          const a = new Game_Action(subject, false);
          a.setSkill(s.id);
          let sum = 0, n = 0;
          for (let k = 0; k < 3; k++) { const v = a.makeDamageValue(foe, false); if (typeof v === "number" && isFinite(v)) { sum += v; n++; } }
          if (n) score = sum / n;
        } catch (e) {}
        if (score < 0) {
          let p = 0; const parts = String((s.damage && s.damage.formula) || "").split("*");
          for (let q = 1; q < parts.length; q++) { const v = parseFloat(parts[q].trim().split(" ")[0]); if (!isNaN(v) && v > p) p = v; }
          score = p;
        }
      }
      out.push({ skillId: s.id, name: s.name, enabled, isDmg, score, winIndex: w && w._data ? w._data.indexOf(s) : -1 });
    }
    return out;
  } catch (e) { return null; } })()`);
}

// Choose a skill per mode. NOTE: scoring happens while the COMMAND window
// is active, when the skill window's _data is still EMPTY (it populates on
// open) — so never gate on a window index here. The caller resolves the
// picked skillId to a window index AFTER the window opens.
async function chooseSkill(session, mode) {
  const scored = await scoreSkills(session);
  if (!scored) return null;
  const usable = scored.filter((s) => s.enabled);
  if (!usable.length) return null;
  const dmg = usable.filter((s) => s.isDmg && s.score > 0);
  if (mode === "spar") {
    if (dmg.length) return dmg.reduce((a, b) => (a.score <= b.score ? a : b));
    return usable[0]; // no damaging move: take anything (turn still passes)
  }
  if (dmg.length) return dmg.reduce((a, b) => (a.score >= b.score ? a : b));
  return usable[0];
}

// Drive FIGHT through the real windows: command (symbol 'skill') -> skill
// window -> chosen entry, each step verified by reading the window back.
// Re-entrant: if the skill window is already open (a previous attempt got
// that far), finish the selection instead of starting over.
async function fightViaUI(session, mode = "best") {
  const sw0 = await windowState(session, WIN.skill);
  if (!(sw0 && sw0.active)) {
    const cmd = await windowState(session, WIN.cmd);
    if (!cmd || !cmd.active || !cmd.symbols) return { ok: false, reason: "command window not active" };
    const fi = cmd.symbols.indexOf("skill");
    if (fi < 0) return { ok: false, reason: "no FIGHT command" };
    if (!(await moveCursorTo(session, WIN.cmd, fi))) return { ok: false, reason: "could not reach FIGHT" };
    const chk = await windowState(session, WIN.cmd);
    if (!chk || chk.currentSymbol !== "skill") return { ok: false, reason: "FIGHT not selected (symbol=" + (chk && chk.currentSymbol) + ")" };
    await session.holdOk(400);
  }
  const pick = await chooseSkill(session, mode); // inputtingAction is live in both entry states
  if (!pick) return { ok: false, reason: "no usable skill" };
  for (let i = 0; i < 20; i++) {
    const sw = await windowState(session, WIN.skill, { withItems: true });
    if (sw && sw.active && sw.items) {
      const idx = sw.items.findIndex((it) => it && it.id === pick.skillId);
      if (idx < 0) return { ok: false, reason: "picked skill " + pick.skillId + " not in skill window" };
      if (!(await moveCursorTo(session, WIN.skill, idx))) return { ok: false, reason: "could not reach skill " + pick.name };
      const v = await windowState(session, WIN.skill, { withItems: true });
      if (!v || !v.items[v.index] || v.items[v.index].id !== pick.skillId) return { ok: false, reason: "skill selection mismatch" };
      await session.holdOk(400);
      return { ok: true, skillId: pick.skillId, skillName: pick.name, score: Math.round(pick.score) };
    }
    await sleep(350);
  }
  return { ok: false, reason: "skill window never activated" };
}

// Drive BAG -> item through the real windows (this closes QA G5: the item is
// chosen in Window_BattleItem by cursor, never by action injection).
async function useItemViaUI(session, itemId) {
  const cmd = await windowState(session, WIN.cmd);
  if (!cmd || !cmd.active || !cmd.symbols) return { ok: false, reason: "command window not active" };
  const bi = cmd.symbols.indexOf("item");
  if (bi < 0) return { ok: false, reason: "no BAG command" };
  if (!(await moveCursorTo(session, WIN.cmd, bi))) return { ok: false, reason: "could not reach BAG" };
  const chk = await windowState(session, WIN.cmd);
  if (!chk || chk.currentSymbol !== "item") return { ok: false, reason: "BAG not selected" };
  await session.holdOk(400);
  for (let i = 0; i < 20; i++) {
    const iw = await windowState(session, WIN.item, { withItems: true });
    if (iw && iw.active) {
      const entry = iw.items.findIndex((it) => it && it.id === itemId);
      if (entry < 0) return { ok: false, reason: "item " + itemId + " not in battle item list" };
      if (!(await moveCursorTo(session, WIN.item, entry))) return { ok: false, reason: "could not reach item entry" };
      const v = await windowState(session, WIN.item, { withItems: true });
      if (!v || !v.items[v.index] || v.items[v.index].id !== itemId) return { ok: false, reason: "item selection mismatch" };
      await session.holdOk(400);
      return { ok: true, itemId };
    }
    await sleep(350);
  }
  return { ok: false, reason: "item window never activated" };
}

// Per-poll battle step shared by driveBattle / gym / stadium loops.
// ctx carries cross-poll state: { evoPressed, itemUsed, throws, lastAction }.
async function battleStep(session, st, opts, ctx) {
  const pollMs = opts.pollMs || 450;
  if (st.scene === "Scene_GanjukoEvolution") {
    // Rule: NO input in phases 0-2; exactly ONE OK in phase 3 (repeats reset
    // the 48-frame fade-out forever — FR2 probe_evo2/evo3).
    if (st.evoPhase === 3 && !ctx.evoPressed) {
      ctx.evoPressed = true;
      await session.holdOk(250);
    }
    await sleep(650);
    return;
  }
  ctx.evoPressed = false;
  if (st.scene !== "Scene_Battle") { await sleep(pollMs); return; }

  if (opts.sustain) {
    await session.evSafe("(function(){ try { $gameParty.battleMembers().forEach(m => { m.setHp(m.mhp); if (m.setMp) m.setMp(m.mmp); }); } catch (e) {} return 1; })()");
  }
  if (st.cmd) {
    if (opts.capture && ctx.throws < (opts.capture.maxThrows || 8)) {
      // Real capture play: weaken first (spar = weakest damaging move) until
      // the foe is under the HP threshold, THEN throw. At tunnel latencies a
      // throw round costs ~a minute; full-HP throws are how runs time out.
      const weakenTo = opts.capture.weakenTo != null ? opts.capture.weakenTo : 0.4;
      if (!ctx.weakened && st.foeHpPct != null && st.foeHpPct > weakenTo) {
        const r = await fightViaUI(session, "spar");
        ctx.lastAction = { kind: "weaken", ...r };
        await sleep(900);
        return;
      }
      ctx.weakened = true;
      const r = await useItemViaUI(session, opts.capture.itemId);
      ctx.lastAction = { kind: "capture", ...r };
      if (r.ok) ctx.throws++;
      await sleep(900);
      return;
    }
    if (opts.itemOnce && !ctx.itemUsed) {
      const r = await useItemViaUI(session, opts.itemOnce);
      ctx.lastAction = { kind: "item", ...r };
      if (r.ok) ctx.itemUsed = true;
      await sleep(900);
      return;
    }
    const r = await fightViaUI(session, opts.strategy === "spar" ? "spar" : "best");
    ctx.lastAction = { kind: "fight", ...r };
    await sleep(900);
    return;
  }
  if (st.skill) {
    // Skill window already open (an earlier step got FIGHT confirmed):
    // finish the selection rather than idling until the timeout.
    // FR4 rig fix: in capture mode this window can only have been opened
    // by a weaken ("spar") selection — capture throws go through the
    // BAG/item window, never the skill window. Resuming it with "best"
    // (the old behavior when capture passed no strategy) completes the
    // interrupted weaken with the STRONGEST move and one-shots the
    // target: the systematic win-without-catch failure root-caused in
    // the CHAMPIONS-V13 report's 2026-11-03 addendum §1. While throws
    // remain, complete the selection with the weaken move instead.
    // Once throws are exhausted the finish-off fight keeps "best".
    const capturing = opts.capture && ctx.throws < (opts.capture.maxThrows || 8);
    const r = await fightViaUI(session, capturing || opts.strategy === "spar" ? "spar" : "best");
    ctx.lastAction = { kind: "fight-resume", ...r };
    await sleep(900);
    return;
  }
  if (st.enemy) {
    await moveCursorTo(session, WIN.enemy, opts.foeTarget || 0);
    await session.holdOk(250);
    await sleep(500);
    return;
  }
  if (st.actor) {
    await moveCursorTo(session, WIN.actor, opts.allyTarget || 0);
    await session.holdOk(250);
    await sleep(500);
    return;
  }
  if (st.phase === "battleEnd") { await session.holdOk(400); await sleep(1300); return; }
  if (st.phase === "start") { await session.holdOk(400); await sleep(pollMs); return; }
  await sleep(pollMs);
}

// Engine-outcome recorder for driveBattle (runtime-only, idempotent):
// wraps BattleManager.processVictory/processDefeat/processAbort so the
// driver can read the ENGINE's declared outcome instead of inferring one
// from HP samples. Reset at the start of every drive.
async function installOutcomeHook(session) {
  await session.evSafe(`(function(){
    if (!window.__rig2OutcomeHooks) {
      window.__rig2OutcomeHooks = true;
      const pv = BattleManager.processVictory, pd = BattleManager.processDefeat, pa = BattleManager.processAbort;
      BattleManager.processVictory = function() { window.__rig2Outcome = "win"; return pv.apply(this, arguments); };
      BattleManager.processDefeat = function() { window.__rig2Outcome = "defeat"; return pd.apply(this, arguments); };
      BattleManager.processAbort = function() { if (!window.__rig2Outcome) window.__rig2Outcome = "abort"; return pa.apply(this, arguments); };
    }
    window.__rig2Outcome = null;
    return 1;
  })()`);
}
function readOutcome(session) {
  return session.evSafe("(function(){ return window.__rig2Outcome || null; })()");
}

// Drive the currently-running (or about-to-start) battle to its end.
// Returns { outcome: 'win'|'defeat'|'ended'|'timeout', turns, actions, lastAction }.
async function driveBattle(session, opts = {}) {
  const timeoutMs = opts.timeoutMs || 240000;
  await installOutcomeHook(session);
  const ctx = { evoPressed: false, itemUsed: false, throws: 0, lastAction: null };
  const actionsBefore = (await readActions(session)).length;
  const t0 = Date.now();
  let sawBattle = false;
  let maxTurn = 0;
  while (Date.now() - t0 < timeoutMs) {
    const st = await battleState(session);
    if (!st) { await sleep(600); continue; }
    if (st.turn > maxTurn) maxTurn = st.turn;
    if (st.scene === "Scene_Battle") sawBattle = true;
    if (st.scene === "Scene_Gameover") return { outcome: "defeat", turns: maxTurn, actions: (await readActions(session)).slice(actionsBefore), lastAction: ctx.lastAction };
    if (st.scene === "Scene_Map" && sawBattle) {
      // The engine's declared outcome (processVictory/processDefeat hook)
      // is ground truth. The sample-based fallback only covers endings
      // that bypass all three hooks (e.g. capture's direct endBattle(0)).
      const oc = await readOutcome(session);
      const outcome = oc === "defeat" ? "defeat"
        : oc === "win" ? "win"
        : oc === "abort" ? "ended"
        : (st.partyAlive === 0 ? "defeat" : (st.troopAlive === 0 ? "win" : "ended"));
      return { outcome, turns: maxTurn, actions: (await readActions(session)).slice(actionsBefore), lastAction: ctx.lastAction };
    }
    if (st.scene === "Scene_Battle" && st.partyAlive === 0) {
      // FR4 lane 8 — 1v1 promotion race: battles are 1v1
      // (maxBattleMembers = 1), so $gameParty.aliveMembers() counts ONLY
      // the standing battle member. This sample therefore reads 0 in
      // the window between the lead's faint and the engine's
      // auto-promotion of the next living bench member — it is NOT a
      // defeat (reproduced live: the old branch returned "defeat" at
      // turn 2 with two full-HP bench members standing and the engine
      // having declared no outcome). A defeat may only be declared
      // from the engine's own outcome (the processDefeat hook above,
      // or Scene_Gameover). Otherwise keep driving: battleStep presses
      // OK through the battleEnd phase, and when the engine promotes,
      // the command window reopens for the promoted member.
      const oc = await readOutcome(session);
      if (oc === "defeat") {
        return { outcome: "defeat", turns: maxTurn, actions: (await readActions(session)).slice(actionsBefore), lastAction: ctx.lastAction };
      }
      await sleep(700);
      continue;
    }
    // Fail FAST when the battle never started: burning the full timeout on a
    // dropped scene push cost the first smoke run 9 minutes and said nothing.
    if (!sawBattle && Date.now() - t0 > 60000) {
      return { outcome: "no-battle", turns: 0, actions: [], lastAction: ctx.lastAction };
    }
    await battleStep(session, st, opts, ctx);
  }
  return { outcome: "timeout", turns: maxTurn, actions: (await readActions(session)).slice(actionsBefore), lastAction: ctx.lastAction };
}

// Drive a gym-leader event end to end: seed -> direct-load -> event.start()
// -> dialogue cadence + battle driving -> completion assertions.
// opts: { mapId, x, y, eventId, winSwitch, badgeName, timeoutMs, sustain }
async function driveGymEvent(session, opts) {
  const timeoutMs = opts.timeoutMs || 420000;
  await session.directLoadMap(opts.mapId, opts.x || 8, opts.y || 5);
  await session.evSafe("(function(){ try { $gameMap._interpreter.clear(); } catch (e) {} try { $gameMessage.clear(); } catch (e) {} return 1; })()");
  const started = await session.evSafe(`(function(){ const e = $gameMap.event(${opts.eventId}); if (e) { e.start(); return 1; } return 0; })()`);
  if (!started) return { completed: false, reason: "event " + opts.eventId + " not found on map " + opts.mapId };
  const ctx = { evoPressed: false, itemUsed: false, throws: 0, lastAction: null };
  const t0 = Date.now();
  let sawBattle = false;
  while (Date.now() - t0 < timeoutMs) {
    const st = await battleState(session);
    if (!st) { await sleep(600); continue; }
    if (st.scene === "Scene_Battle") sawBattle = true;
    if (st.scene === "Scene_Gameover") return { completed: false, defeat: true, sawBattle };
    if (st.scene === "Scene_Map" && sawBattle) {
      const sw = opts.winSwitch ? await session.evSafe(`$gameSwitches.value(${opts.winSwitch})`) : true;
      if (sw && !st.interp && !st.msgBusy) {
        await sleep(1200); // settle: post-event text/scripts
        const sw2 = opts.winSwitch ? await session.evSafe(`$gameSwitches.value(${opts.winSwitch})`) : true;
        const st2 = await battleState(session);
        if (sw2 && st2 && !st2.interp) {
          const badges = await session.evSafe("(function(){ try { return $gameSystem.badges(); } catch (e) { return null; } })()");
          return { completed: true, sawBattle, badges };
        }
      }
    }
    if (st.scene === "Scene_Battle" || st.scene === "Scene_GanjukoEvolution") {
      await battleStep(session, st, opts, ctx);
    } else {
      // Map dialogue / event text: gentle OK cadence.
      await session.holdOk(250);
      await sleep(800);
    }
  }
  return { completed: false, reason: "timeout", sawBattle };
}

// Drive a full 5-round Stadium chain where the engine supports it.
// Returns { supported:false } on engines without GanjukoEngine.startStadium
// (e.g. the older VM-local build) — an honest capability report, not a fail.
async function driveStadiumRun(session, opts = {}) {
  const supported = await session.evSafe("typeof GanjukoEngine !== 'undefined' && typeof GanjukoEngine.startStadium === 'function'");
  if (!supported) return { supported: false };
  const timeoutMs = opts.timeoutMs || 900000;
  await session.evSafe("GanjukoEngine.startStadium()");
  const ctx = { evoPressed: false, itemUsed: false, throws: 0, lastAction: null };
  const t0 = Date.now();
  let battles = 0;
  let prevInBattle = false;
  let idlePolls = 0;
  while (Date.now() - t0 < timeoutMs) {
    const st = await battleState(session);
    if (!st) { await sleep(600); continue; }
    const inBattle = st.scene === "Scene_Battle";
    if (inBattle && !prevInBattle) battles++;
    prevInBattle = inBattle;
    const stats = await session.evSafe("(function(){ try { return GanjukoEngine.ensureStadiumStats(); } catch (e) { return null; } })()");
    if (st.scene === "Scene_Map" && battles > 0 && !st.interp && !st.msgBusy) {
      idlePolls++;
      if (idlePolls >= 6 && stats) return { supported: true, completed: true, battles, stats };
    } else idlePolls = 0;
    if (st.scene === "Scene_Gameover") return { supported: true, completed: false, defeat: true, battles, stats };
    if (inBattle || st.scene === "Scene_GanjukoEvolution") await battleStep(session, st, opts, ctx);
    else { await session.holdOk(250); await sleep(800); }
  }
  const stats = await session.evSafe("(function(){ try { return GanjukoEngine.ensureStadiumStats(); } catch (e) { return null; } })()");
  return { supported: true, completed: false, reason: "timeout", battles, stats };
}

module.exports = {
  installHooks, installOutcomeHook, readOutcome, readActions, readLogs, battleState, windowState,
  moveCursorTo, scoreSkills, chooseSkill, fightViaUI, useItemViaUI,
  battleStep, driveBattle, driveGymEvent, driveStadiumRun, WIN,
};
