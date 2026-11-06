// rig2 playthrough core — honest-play primitives for the full playthrough
// suite (playtest/PLAYTHROUGH-TEST.md). Everything here drives the REAL game
// UI: held keys for walking, the battle windows for fighting/catching, the
// shop windows for buying, the menu for Town Map / Fly. No state is seeded,
// granted, teleported or edited; the only reads are state probes a test
// needs to make decisions a player would make from looking at the screen
// (party HP, foe identity, inventory counts) plus the F-PT-01 forensic
// record ($gameTemp._wildSpeciesId/_wildLevel before stock-troop battles).
//
// Built on the proven rig2 machinery: session.js (held keys, settle, focus),
// battle.js (windowState/moveCursorTo/fightViaUI/useItemViaUI/battleState).
"use strict";
const { sleep } = require("./cdp");
const battle = require("./battle");

// ---------------------------------------------------------------------------
// State probes
// ---------------------------------------------------------------------------

// Lean map/UI state for flow decisions.
function mapUiState(session) {
  return session.evSafe(`(function(){ try {
    const s = SceneManager._scene;
    const name = s ? s.constructor.name : "none";
    let choice = null;
    try {
      const mw = s && s._messageWindow;
      const cw = mw && mw._choiceWindow;
      if (cw && cw.active) choice = { index: cw.index(), items: ($gameMessage.choices() || []).slice() };
    } catch (e) {}
    return {
      scene: name,
      map: typeof $gameMap !== "undefined" ? $gameMap.mapId() : -1,
      x: typeof $gamePlayer !== "undefined" ? $gamePlayer.x : -1,
      y: typeof $gamePlayer !== "undefined" ? $gamePlayer.y : -1,
      moving: typeof $gamePlayer !== "undefined" ? !!$gamePlayer.isMoving() : false,
      msgBusy: !!(typeof $gameMessage !== "undefined" && $gameMessage.isBusy()),
      interp: !!(typeof $gameMap !== "undefined" && $gameMap._interpreter && $gameMap._interpreter.isRunning()),
      choice
    };
  } catch (e) { return null; } })()`);
}

// Full run-state snapshot (checkpoint records + policy decisions).
function runState(session) {
  return session.evSafe(`(function(){ try {
    const items = {};
    [1, 2, 4, 5, 10, 11, 12, 13, 14, 22, 23].forEach(id => { if ($dataItems[id]) items[id] = $gameParty.numItems($dataItems[id]); });
    return {
      map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y,
      gold: $gameParty.gold(),
      badges: (function(){ try { return $gameSystem.badges(); } catch (e) { return null; } })(),
      badgeCount: (function(){ try { const b = $gameSystem.badges(); return b ? b.length : null; } catch (e) { return null; } })(),
      party: $gameParty.allMembers().map(m => ({ sp: m.ganjukoSpeciesId(), name: m.name(), lv: m.level, hp: m.hp, mhp: m.mhp, mp: m.mp, mmp: m.mmp, alive: m.isAlive() })),
      boxCount: (function(){ try { return $gameSystem.ganjukoBox ? $gameSystem.ganjukoBox().length : null; } catch (e) { return null; } })(),
      items,
      switches: { 5: $gameSwitches.value(5), 9: $gameSwitches.value(9), 10: $gameSwitches.value(10), 11: $gameSwitches.value(11), 15: $gameSwitches.value(15), 16: $gameSwitches.value(16), 20: $gameSwitches.value(20), 21: $gameSwitches.value(21), 26: $gameSwitches.value(26), 27: $gameSwitches.value(27), 28: $gameSwitches.value(28), 29: $gameSwitches.value(29), 30: $gameSwitches.value(30), 36: $gameSwitches.value(36), 62: $gameSwitches.value(62), 63: $gameSwitches.value(63), 64: $gameSwitches.value(64), 65: $gameSwitches.value(65), 66: $gameSwitches.value(66) },
      tempWild: { sp: (typeof $gameTemp !== "undefined" ? $gameTemp._wildSpeciesId : null), lv: (typeof $gameTemp !== "undefined" ? $gameTemp._wildLevel : null), trainer: (typeof $gameTemp !== "undefined" ? !!$gameTemp._isTrainerBattle : null) },
      playtime: (function(){ try { return $gameSystem.playtimeText ? $gameSystem.playtimeText() : null; } catch (e) { return null; } })()
    };
  } catch (e) { return null; } })()`);
}

function partyHpPct(st) {
  if (!st || !st.party.length) return 1;
  const hp = st.party.reduce((a, m) => a + Math.max(0, m.hp), 0);
  const mhp = st.party.reduce((a, m) => a + m.mhp, 0);
  return mhp ? hp / mhp : 1;
}
function leadHpPct(st) {
  if (!st || !st.party.length) return 1;
  const l = st.party[0];
  return l.mhp ? l.hp / l.mhp : 1;
}

// ---------------------------------------------------------------------------
// Walking — in-page BFS (two-tile passability rule, route-walk pattern),
// one tap per tile, replan every step. Transfer tiles of OTHER portals are
// blocked so a walk never teleports sideways by accident; normal-priority
// event tiles block, except the interaction target's own tile.
// ---------------------------------------------------------------------------

function planStepEval(tx, ty, adjacent, targetEventId) {
  return `(function(){
    const sx = $gamePlayer.x, sy = $gamePlayer.y;
    const W = $gameMap.width(), H = $gameMap.height();
    const rev = { 2: 8, 8: 2, 4: 6, 6: 4 };
    const step = { 2: [0, 1, "down"], 8: [0, -1, "up"], 4: [-1, 0, "left"], 6: [1, 0, "right"] };
    const blocked = new Set();
    for (const e of $gameMap.events()) {
      if (!e || e.eventId() === ${targetEventId || -1}) continue;
      const page = e.page && e.page();
      let isTransfer = false;
      try { if (page && page.list && page.list.some(c => c.code === 201)) isTransfer = true; } catch (err) {}
      if (isTransfer) { blocked.add(e.x + "," + e.y); continue; }
      try { if (e.isNormalPriority() && !e.isThrough()) blocked.add(e.x + "," + e.y); } catch (err) {}
    }
    const isGoal = (x, y) => ${adjacent ? `(Math.abs(x - ${tx}) + Math.abs(y - ${ty}) === 1)` : `(x === ${tx} && y === ${ty})`};
    if (isGoal(sx, sy)) return { next: null, remaining: 0, arrived: true };
    function can(x, y, d) {
      const nx = x + step[d][0], ny = y + step[d][1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
      if (blocked.has(nx + "," + ny)) return false;
      return $gameMap.isPassable(x, y, d) && $gameMap.isPassable(nx, ny, rev[d]);
    }
    const start = sx + "," + sy;
    const prev = new Map([[start, null]]); const q = [[sx, sy]];
    let goalKey = null;
    while (q.length) {
      const [x, y] = q.shift();
      if (isGoal(x, y)) { goalKey = x + "," + y; break; }
      for (const d of [2, 4, 6, 8]) {
        if (!can(x, y, d)) continue;
        const nx = x + step[d][0], ny = y + step[d][1], k = nx + "," + ny;
        if (!prev.has(k)) { prev.set(k, { from: x + "," + y, dir: step[d][2] }); q.push([nx, ny]); }
      }
    }
    if (!goalKey) return null;
    const path = []; let cur = goalKey;
    while (cur !== start) { const p = prev.get(cur); path.unshift(p.dir); cur = p.from; }
    return { next: path[0], remaining: path.length, arrived: false };
  })()`;
}

const DIRS = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] };
const DIRNUM = { down: 2, left: 4, right: 6, up: 8 };

// Walk toward (tx,ty) on the CURRENT map. ctx.flow() resolves any battle /
// message / event that interrupts (wild encounter, sight trainer, transfer
// side-effects). Returns one of:
//   { status: "arrived" }            — standing on / adjacent to the target
//   { status: "transferred", map }   — a portal fired; now on another map
//   { status: "blackout", map }      — party wiped; engine respawned us
//   { status: "stuck", why, at }     — no progress; caller logs a finding
async function walkTo(session, ctx, tx, ty, opts = {}) {
  const adjacent = !!opts.adjacent;
  const targetEventId = opts.targetEventId || -1;
  const maxTaps = opts.maxTaps || 400;
  const startMap = await session.evSafe("$gameMap.mapId()");
  const startPos = await session.evSafe("([$gamePlayer.x, $gamePlayer.y])");
  let taps = 0, noProgress = 0, lastX = startPos ? startPos[0] : -1, lastY = startPos ? startPos[1] : -1;
  let targetDisplacements = 0;
  while (taps < maxTaps) {
    const ui = await mapUiState(session);
    if (!ui) { await sleep(500); continue; }
    if (ui.map !== startMap) {
      // A portal (or blackout respawn) moved us. Distinguish by party state.
      const st = await runState(session);
      const wiped = st && st.party.length > 0 && st.party.every(m => m.hp >= m.mhp); // healed by respawn is ambiguous; caller re-checks
      return { status: "transferred", map: ui.map, wipedHint: !!wiped };
    }
    if (ui.scene !== "Scene_Map" || ui.msgBusy || ui.interp || ui.choice) {
      const r = await ctx.flow();
      if (r && r.blackout) return { status: "blackout", map: ui.map };
      // Displacement-loop guard (F-PT-RIG-01, baseline run 2026-11-03): if
      // the player was standing ON the target tile when an event/flow took
      // over, and the flow ends with the player somewhere else on the same
      // map, the target tile's own event moved us off it (e.g. Map001 ev7
      // "Grass Warning" at (11,1) routes the player back to (11,2) every
      // time it fires, and its page re-arms). Re-entering just re-fires it;
      // after the second identical displacement, report the target as
      // event-blocked instead of burning the tap budget re-triggering it.
      if (ui.x === tx && ui.y === ty) {
        const afterUi = await mapUiState(session);
        if (afterUi && afterUi.map === startMap && (afterUi.x !== ui.x || afterUi.y !== ui.y)) {
          targetDisplacements++;
          if (targetDisplacements >= 2) {
            return { status: "stuck", why: "target tile event repeatedly displaces player", at: [afterUi.x, afterUi.y], taps };
          }
        }
      }
      continue;
    }
    if (!ui.moving) {
      if (adjacent ? (Math.abs(ui.x - tx) + Math.abs(ui.y - ty) === 1) : (ui.x === tx && ui.y === ty)) {
        return { status: "arrived", taps };
      }
      const plan = await session.evSafe(planStepEval(tx, ty, adjacent, targetEventId));
      if (!plan) return { status: "stuck", why: "no path", at: [ui.x, ui.y], taps };
      if (plan.arrived) return { status: "arrived", taps };
      const dir = plan.next;
      const ex = ui.x + DIRS[dir][0], ey = ui.y + DIRS[dir][1];
      await session.holdKey(dir, opts.tapMs || 130);
      taps++;
      // wait for the step to land (or an interrupt to appear)
      for (let poll = 0; poll < 12; poll++) {
        await sleep(180);
        const p = await mapUiState(session);
        if (!p) continue;
        if (p.map !== startMap) break;
        if (p.scene !== "Scene_Map" || p.msgBusy || p.interp) break;
        if (!p.moving && p.x === ex && p.y === ey) break;
        if (!p.moving && (p.x !== ui.x || p.y !== ui.y)) break; // overshoot/undershoot: replan
      }
      const after = await mapUiState(session);
      if (after && after.x === lastX && after.y === lastY && !after.moving && after.scene === "Scene_Map" && !after.msgBusy && !after.interp) {
        noProgress++;
        if (noProgress >= 10) return { status: "stuck", why: "no progress for 10 taps", at: [after.x, after.y], taps };
      } else if (after) { lastX = after.x; lastY = after.y; noProgress = 0; }
    } else {
      await sleep(200);
    }
  }
  return { status: "stuck", why: "tap budget exhausted", taps };
}

// gotoMap: hop portals per the static portal graph until on targetMap.
// portals: { fromMap: [{x, y, to}] } (data-derived; see suites/playthrough.js).
async function gotoMap(session, ctx, portals, targetMap, opts = {}) {
  for (let hop = 0; hop < 12; hop++) {
    const cur = await session.evSafe("$gameMap.mapId()");
    if (cur === targetMap) return { ok: true, hops: hop };
    // BFS over the portal graph
    const prev = new Map([[cur, null]]); const q = [cur];
    while (q.length) {
      const m = q.shift();
      if (m === targetMap) break;
      for (const p of portals[m] || []) {
        if (!prev.has(p.to)) { prev.set(p.to, { from: m, portal: p }); q.push(p.to); }
      }
    }
    if (!prev.has(targetMap)) return { ok: false, why: "no portal path from " + cur + " to " + targetMap };
    const chain = []; let c = targetMap;
    while (c !== cur) { const s = prev.get(c); chain.unshift(s); c = s.from; }
    const step = chain[0];
    // F-PT-RIG-02 (baseline run 2026-11-03): planStepEval blocks EVERY
    // transfer-event tile so a walk never teleports sideways — including the
    // target portal's own tile, which made every gotoMap BFS return "no
    // path" instantly (portal tiles are player-touch transfer events).
    // Worse, doors are often TWO transfer tiles: the Lab's listed edge
    // (16,14) is reachable only from its twin "Lab Step" tile (16,15),
    // which is itself a transfer to the same map — blocked, so the listed
    // edge is unreachable by construction (probe-verified: BFS visited 386
    // tiles, no path, with and without the single-tile exclusion).
    // General fix: collect EVERY tile on this map whose active page
    // transfers to the hop's destination map, try the PORTALS-listed tile
    // first, then each twin in turn (excluding exactly that tile's event
    // from the blocked set via targetEventId), until one walk does not
    // come back "stuck".
    const candidates = await session.evSafe(`(function(){ try {
      const out = [];
      for (const e of $gameMap.events()) {
        if (!e) continue;
        const pg = e.page && e.page();
        if (!pg || !pg.list) continue;
        const tr = pg.list.find(c => c.code === 201);
        if (tr && tr.parameters && tr.parameters[1] === ${step.portal.to}) out.push({ x: e.x, y: e.y, id: e.eventId() });
      }
      return out;
    } catch (err) { return []; } })()`);
    let candList = Array.isArray(candidates) && candidates.length
      ? candidates.slice()
      : [{ x: step.portal.x, y: step.portal.y, id: -1 }];
    candList.sort((a, b) =>
      ((a.x === step.portal.x && a.y === step.portal.y) ? 0 : 1) -
      ((b.x === step.portal.x && b.y === step.portal.y) ? 0 : 1));
    let w = null;
    for (const cand of candList) {
      w = await walkTo(session, ctx, cand.x, cand.y, { maxTaps: opts.maxTaps || 500, targetEventId: cand.id || -1 });
      if (w.status !== "stuck") break;
    }
    if (w.status === "transferred") {
      await session.settle(8000).catch(() => {});
      await sleep(600);
      continue;
    }
    if (w.status === "arrived") {
      // Standing on the portal tile but no transfer fired yet: nudge.
      await sleep(800);
      const now = await session.evSafe("$gameMap.mapId()");
      if (now === cur) { await session.holdKey("down", 120); await sleep(600); }
      continue;
    }
    return { ok: false, why: "walk to portal failed: " + JSON.stringify(w) };
  }
  return { ok: false, why: "hop budget exhausted" };
}

// ---------------------------------------------------------------------------
// Event interaction: walk adjacent, face, press OK, let the flow driver
// resolve dialogue / choices / battles / shops / evolution.
// ---------------------------------------------------------------------------

async function faceToward(session, tx, ty) {
  const p = await session.evSafe("([$gamePlayer.x, $gamePlayer.y])");
  if (!p) return;
  const dx = tx - p[0], dy = ty - p[1];
  const dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8);
  await session.evSafe(`$gamePlayer.setDirection(${dir})`);
}

async function interactEvent(session, ctx, eventId, opts = {}) {
  const info = await session.evSafe(`(function(){ const e = $gameMap.event(${eventId}); return e ? { x: e.x, y: e.y } : null; })()`);
  if (!info) return { ok: false, why: "event " + eventId + " not on current map" };
  const w = await walkTo(session, ctx, info.x, info.y, { adjacent: true, targetEventId: eventId, maxTaps: opts.maxTaps || 400 });
  if (w.status !== "arrived") return { ok: false, why: "walk to event failed: " + JSON.stringify(w) };
  await faceToward(session, info.x, info.y);
  await sleep(250);
  await session.holdOk(300);
  const r = await ctx.flow({ timeoutMs: opts.flowTimeoutMs || 600000 });
  return { ok: true, flow: r };
}

// ---------------------------------------------------------------------------
// Battle driver — policy-driven, on top of battle.js primitives.
// policy: {
//   kind: "wild" | "trainer",
//   capture: bool           (wild only: weaken + throw orbs for unowned species)
//   orbItem: 1, maxThrows: 6,
//   potions: [itemIds],     (trainer: heal lead below potionBelow, max potionMax)
//   potionBelow: 0.3, potionMax: 3,
//   leadSwitch: bool        (trainer: turn-1 switch if a bench member's best
//                            move scores > switchRatio x the lead's)
//   switchRatio: 1.6,
//   timeoutMs
// }
// Returns { outcome: "win"|"defeat"|"caught"|"ended"|"timeout"|"gameover"|
//           "no-battle", turns, foe: {sp,name,lv}, throws, potionsUsed,
//           switchedTo, blackout }
// ---------------------------------------------------------------------------

function foeInfo(session) {
  return session.evSafe(`(function(){ try {
    const f = $gameTroop.aliveMembers()[0] || $gameTroop.members()[0];
    if (!f) return null;
    return { sp: f.ganjukoSpeciesId ? f.ganjukoSpeciesId() : null, name: f.name(), lv: f.ganjukoLevel ? f.ganjukoLevel() : null, hp: f.hp, mhp: f.mhp };
  } catch (e) { return null; } })()`);
}

// Best-damage score per living party member against the current foe, using
// the game's own Game_Action.makeDamageValue (same math as scoreSkills).
function benchScores(session) {
  return session.evSafe(`(function(){ try {
    const foe = $gameTroop.aliveMembers()[0];
    if (!foe) return null;
    return $gameParty.allMembers().map(m => {
      let best = -1, bestName = null;
      if (m.isAlive()) {
        for (const s of m.skills()) {
          if (!(s.damage && (s.damage.type === 1 || s.damage.type === 2) && (s.scope === 1 || s.scope === 2))) continue;
          let can = false; try { can = m.canUse(s); } catch (e) {}
          if (!can) continue;
          try {
            const a = new Game_Action(m, false); a.setSkill(s.id);
            let sum = 0, n = 0;
            for (let k = 0; k < 3; k++) { const v = a.makeDamageValue(foe, false); if (typeof v === "number" && isFinite(v)) { sum += v; n++; } }
            if (n && sum / n > best) { best = sum / n; bestName = s.name; }
          } catch (e) {}
        }
      }
      return { sp: m.ganjukoSpeciesId(), name: m.name(), lv: m.level, hp: m.hp, mhp: m.mhp, alive: m.isAlive(), best: Math.round(best), bestName };
    });
  } catch (e) { return null; } })()`);
}

async function drivePlayBattle(session, ctx, policy = {}) {
  const timeoutMs = policy.timeoutMs || (policy.kind === "trainer" ? 420000 : 300000);
  const t0 = Date.now();
  const rec = {
    kind: policy.kind || "wild", outcome: "timeout", turns: 0, throws: 0,
    potionsUsed: 0, switchedTo: null, foe: null, tempBefore: null, blackout: false,
  };
  rec.tempBefore = await session.evSafe("(function(){ try { return { sp: $gameTemp._wildSpeciesId || null, lv: $gameTemp._wildLevel || null }; } catch (e) { return null; } })()");
  // Deterministic outcome recorder (runtime-only instrumentation, the same
  // pattern as battle.js installHooks): the engine's blackout recovery
  // HEALS the party before the scene returns to the map, so post-battle HP
  // cannot distinguish defeat from victory. processVictory/processDefeat
  // are the ground truth.
  await session.evSafe(`(function(){
    if (!window.__ptHooks) {
      window.__ptHooks = true;
      const pv = BattleManager.processVictory, pd = BattleManager.processDefeat, pa = BattleManager.processAbort;
      BattleManager.processVictory = function() { window.__ptOutcome = "win"; return pv.apply(this, arguments); };
      BattleManager.processDefeat = function() { window.__ptOutcome = "defeat"; return pd.apply(this, arguments); };
      BattleManager.processAbort = function() { if (!window.__ptOutcome) window.__ptOutcome = "abort"; return pa.apply(this, arguments); };
    }
    window.__ptOutcome = null;
    return 1;
  })()`);
  let sawBattle = false, evoPressed = false, switched = false, weakened = false;
  let detectedTrainer = false; // set from $gameTemp once the battle is live
  let lastProgressAt = Date.now(), lastTurnSeen = -1;
  let lastTurn = -1, cmdSeenAt = 0;
  while (Date.now() - t0 < timeoutMs) {
    const st = await battle.battleState(session);
    if (!st) { await sleep(500); continue; }
    if (st.turn > rec.turns) rec.turns = st.turn;
    if (st.scene === "Scene_Battle") {
      sawBattle = true;
      if (!rec.foe) {
        rec.foe = await foeInfo(session);
        const tb = await session.evSafe("(function(){ try { return { t: !!$gameTemp._isTrainerBattle, name: $gameTemp._trainerName || '' }; } catch (e) { return null; } })()");
        if (tb) {
          rec.trainerFlag = tb;
          // startTrainerBattle sets both; startWildBattle clears both.
          // Stock 301 battles leave them stale — the suite's explicit
          // policy.forceTactics covers those (gyms/leaders/bosses).
          detectedTrainer = !!(tb.t && tb.name);
          rec.kind = detectedTrainer ? "trainer" : rec.kind;
        }
      }
    }
    if (st.scene === "Scene_GanjukoEvolution") {
      if (st.evoPhase === 3 && !evoPressed) { evoPressed = true; await session.holdOk(250); }
      await sleep(600);
      continue;
    }
    evoPressed = false;
    if (st.scene === "Scene_Gameover") { rec.outcome = "gameover"; return rec; }
    if (st.scene === "Scene_Map" && sawBattle) {
      const hooked = await session.evSafe("(function(){ return window.__ptOutcome || null; })()");
      if (hooked === "defeat") { rec.outcome = "defeat"; rec.blackout = true; return rec; }
      const after = await runState(session);
      if (after && after.party.length && after.party.every(m => !m.alive || m.hp <= 0)) {
        rec.outcome = "defeat"; rec.blackout = true; return rec;
      }
      if (hooked === "win") {
        // A capture also ends through processVictory? No — capture ends via
        // processGanjukoCapture -> endBattle(0) without processVictory, so
        // a hooked "win" is a genuine KO win.
        rec.outcome = "win"; return rec;
      }
      // Was it a capture? Check ownership of the foe species.
      if (policy.kind === "wild" && rec.foe && rec.foe.sp) {
        const caught = await session.evSafe(`(function(){ try { return $gameSystem.isSpeciesCaught(${rec.foe.sp}); } catch (e) { return false; } })()`);
        const owned = caught && ctx.ownedSpecies && !ctx.ownedSpecies.has(rec.foe.sp);
        if (owned || (caught && rec.throws > 0)) { rec.outcome = "caught"; return rec; }
      }
      rec.outcome = st.partyAlive === 0 ? "defeat" : (st.troopAlive === 0 ? "win" : "ended");
      if (rec.outcome === "defeat") rec.blackout = true;
      return rec;
    }
    if (!sawBattle && Date.now() - t0 > 45000) { rec.outcome = "no-battle"; return rec; }
    if (st.scene !== "Scene_Battle") { await sleep(450); continue; }
    if (st.partyAlive === 0) {
      // FR4 lane 8 — 1v1 promotion race (identical fix to battle.js
      // driveBattle): battleState's partyAlive is $gameParty
      // .aliveMembers(), which in battle counts ONLY the standing
      // member (maxBattleMembers = 1). It reads 0 in the window between
      // the lead's faint and the engine's auto-promotion of the next
      // living bench member — a transient sample, not a defeat. Only
      // the engine's declared outcome (the __ptOutcome hook installed
      // above, or Scene_Gameover) may declare one: if the whole party
      // has fallen, processDefeat fires and the hooked outcome returns
      // the defeat here; if the engine promotes, the command window
      // reopens below and the drive continues with the new lead.
      const oc = await session.evSafe("(function(){ return window.__ptOutcome || null; })()");
      if (oc === "defeat") { rec.outcome = "defeat"; rec.blackout = true; return rec; }
      await sleep(600);
      continue;
    }

    // --- decision point: command window active ---
    if (st.cmd) {
      cmdSeenAt = Date.now();
      // 1) capture policy (wild, unowned species only — never vs a trainer)
      const wantCapture = policy.capture && !detectedTrainer && rec.foe && rec.foe.sp && ctx.ownedSpecies && !ctx.ownedSpecies.has(rec.foe.sp);
      if (wantCapture && rec.throws < (policy.maxThrows || 6)) {
        const foePct = st.foeHpPct;
        if (!weakened && foePct != null && foePct > 0.4) {
          const r = await battle.fightViaUI(session, "spar");
          ctx.log(`  battle: weaken (${r.skillName || r.reason}) foe=${Math.round((foePct || 0) * 100)}%`);
          await sleep(900);
          continue;
        }
        weakened = true;
        const orbCount = await session.evSafe(`$gameParty.numItems($dataItems[${policy.orbItem || 1}])`);
        if (orbCount > 0) {
          const r = await battle.useItemViaUI(session, policy.orbItem || 1);
          if (r.ok) rec.throws++;
          ctx.log(`  battle: throw orb #${rec.throws} (${r.ok ? "thrown" : r.reason})`);
          await sleep(900);
          continue;
        }
      }
      // 2) potion policy (trainer tactics, or forced for scripted bosses)
      if ((detectedTrainer || policy.forceTactics) && policy.potions && policy.potions.length && rec.potionsUsed < (policy.potionMax || 3)) {
        const lead = await session.evSafe("(function(){ const m = $gameParty.allMembers()[0]; return m ? { hp: m.hp, mhp: m.mhp } : null; })()");
        if (lead && lead.mhp && lead.hp / lead.mhp < (policy.potionBelow || 0.3)) {
          let usedItem = 0;
          for (const pid of policy.potions) {
            const n = await session.evSafe(`$gameParty.numItems($dataItems[${pid}])`);
            if (n > 0) {
              const r = await battle.useItemViaUI(session, pid);
              if (r.ok) { usedItem = pid; rec.potionsUsed++; }
              break;
            }
          }
          if (usedItem) { ctx.log(`  battle: potion used (item ${usedItem})`); await sleep(900); continue; }
        }
      }
      // 3) lead switch (turn 1 of trainer battles, once)
      if ((detectedTrainer || policy.forceTactics) && policy.leadSwitch && !switched && rec.turns <= 1 && st.turn <= 1) {
        const scores = await benchScores(session);
        if (scores && scores.length > 1 && scores[0].best > 0) {
          let bestIdx = 0;
          for (let i = 1; i < scores.length; i++) if (scores[i].alive && scores[i].best > scores[bestIdx].best) bestIdx = i;
          if (bestIdx > 0 && scores[bestIdx].best > scores[0].best * (policy.switchRatio || 1.6)) {
            const cmd = await battle.windowState(session, battle.WIN.cmd);
            const si = cmd && cmd.symbols ? cmd.symbols.indexOf("switchGanjuko") : -1;
            if (si >= 0 && await battle.moveCursorTo(session, battle.WIN.cmd, si)) {
              await session.holdOk(400);
              await sleep(700);
              const sw = await battle.windowState(session, battle.WIN.sw);
              if (sw && sw.active) {
                // switch window lists party members; aim for bestIdx
                if (await battle.moveCursorTo(session, battle.WIN.sw, bestIdx)) {
                  await session.holdOk(400);
                  switched = true;
                  rec.switchedTo = scores[bestIdx].name;
                  ctx.log(`  battle: switched lead to ${scores[bestIdx].name} (score ${scores[bestIdx].best} vs ${scores[0].best})`);
                  await sleep(900);
                  continue;
                }
              }
              // switch window didn't open as expected: cancel back out
              await session.holdKey("cancel", 200);
              switched = true; // don't retry the maneuver this battle
            }
          }
        }
      }
      // 4) fight
      const r = await battle.fightViaUI(session, "best");
      if (!r.ok) ctx.log(`  battle: fight step: ${r.reason}`);
      await sleep(900);
      continue;
    }
    if (st.skill) {
      const r = await battle.fightViaUI(session, "best");
      if (!r.ok) ctx.log(`  battle: fight-resume: ${r.reason}`);
      await sleep(900);
      continue;
    }
    if (st.enemy) { await battle.moveCursorTo(session, battle.WIN.enemy, 0); await session.holdOk(250); await sleep(500); continue; }
    if (st.actor) { await battle.moveCursorTo(session, battle.WIN.actor, 0); await session.holdOk(250); await sleep(500); continue; }
    if (st.phase === "battleEnd") { await session.holdOk(400); await sleep(1200); lastProgressAt = Date.now(); continue; }
    if (st.phase === "start") { await session.holdOk(400); await sleep(450); lastProgressAt = Date.now(); continue; }
    // Progress tracking: a turn change or any actionable window counts.
    if (st.turn !== lastTurnSeen || st.cmd || st.skill || st.enemy || st.actor) { lastTurnSeen = st.turn; lastProgressAt = Date.now(); }
    else if (Date.now() - lastProgressAt > 8000) {
      // Nothing actionable for 8s: the Pass 3 COACH overlay (guided first
      // battle / capture lesson) parks the input windows and waits for OK
      // presses to advance its beats. A player taps through; so do we.
      await session.holdOk(300);
      lastProgressAt = Date.now() - 4000; // re-tap at most every ~4s
    }
    await sleep(450);
  }
  return rec;
}

// ---------------------------------------------------------------------------
// Flow driver — resolves whatever the game puts in front of the player:
// dialogue (OK cadence), choices, battles, evolution, shops (via ctx.task),
// town map (via ctx.task), until the map is quiet. This is the single
// resolver every walker/interaction hands control to.
// ctx.task: { type: "shop", buyList: [{itemId, count}] } | { type: "fly", mapId }
// Returns { ended: "quiet"|"timeout"|"gameover", battles: [recs], blackout }
// ---------------------------------------------------------------------------

async function pickChoice(session, ctx, choice) {
  // Preference order: the suite's per-context pick (ctx.choicePick), else a
  // "Yes"-like affirmative, else index 0. Verified by index read-back.
  const items = choice.items || [];
  let target = 0;
  if (typeof ctx.choicePick === "function") {
    const p = ctx.choicePick(items);
    if (typeof p === "number" && p >= 0 && p < items.length) target = p;
  } else {
    const yes = items.findIndex(t => /^(yes|yeah|ok|sure|confirm)/i.test(String(t).trim()));
    if (yes >= 0) target = yes;
  }
  const cw = "SceneManager._scene._messageWindow._choiceWindow";
  for (let i = 0; i < 12; i++) {
    const st = await battle.windowState(session, cw);
    if (!st || !st.active) return false;
    if (st.index === target) break;
    await session.holdKey(st.index < target ? "down" : "up", 200);
    await sleep(300);
  }
  ctx.log(`  choice: picked [${target}] "${items[target]}" of ${JSON.stringify(items)}`);
  await session.holdOk(300);
  return true;
}

async function driveFlow(session, ctx, opts = {}) {
  const timeoutMs = opts.timeoutMs || 600000;
  const t0 = Date.now();
  const out = { ended: "timeout", battles: [], blackout: false };
  let quietPolls = 0;
  while (Date.now() - t0 < timeoutMs) {
    const ui = await mapUiState(session);
    if (!ui) { await sleep(500); continue; }
    if (ui.scene === "Scene_Gameover") { out.ended = "gameover"; return out; }
    if (ui.scene === "Scene_Battle") {
      const rec = await drivePlayBattle(session, ctx, ctx.battlePolicy());
      out.battles.push(rec);
      if (ctx.onBattle) ctx.onBattle(rec);
      if (rec.blackout) out.blackout = true;
      if (rec.outcome === "gameover") { out.ended = "gameover"; return out; }
      quietPolls = 0;
      continue;
    }
    if (ui.scene === "Scene_GanjukoEvolution") {
      const st = await battle.battleState(session);
      if (st && st.evoPhase === 3) await session.holdOk(250);
      await sleep(600);
      continue;
    }
    if (ui.scene === "Scene_Shop") {
      if (ctx.task && ctx.task.type === "shop") {
        const list = ctx.task.buyList || [];
        ctx.task = null;
        await shopBuy(session, ctx, list);
      } else {
        await exitShop(session);
      }
      quietPolls = 0;
      continue;
    }
    if (ui.scene === "Scene_GanjukoTownMap") {
      if (ctx.task && ctx.task.type === "fly") {
        const dest = ctx.task.mapId;
        ctx.task = null;
        await townMapSelect(session, ctx, dest);
      } else {
        await session.holdKey("cancel", 250);
        await sleep(600);
      }
      quietPolls = 0;
      continue;
    }
    if (ui.scene !== "Scene_Map") {
      // Menus and other scenes a stray keypress may have opened: back out.
      await session.holdKey("cancel", 250);
      await sleep(600);
      quietPolls = 0;
      continue;
    }
    // Scene_Map
    if (ui.choice) {
      await pickChoice(session, ctx, ui.choice);
      quietPolls = 0;
      continue;
    }
    if (ui.msgBusy || ui.interp) {
      await session.holdOk(250);
      await sleep(700);
      quietPolls = 0;
      continue;
    }
    quietPolls++;
    if (quietPolls >= 4) { out.ended = "quiet"; return out; }
    await sleep(550);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shop (Scene_Shop) — buy a computed list through the real windows.
// ---------------------------------------------------------------------------

const SHOP_WIN = {
  cmd: "SceneManager._scene._commandWindow",
  buy: "SceneManager._scene._buyWindow",
  num: "SceneManager._scene._numberWindow",
};

async function shopBuy(session, ctx, buyList) {
  const bought = [];
  const cmd = await battle.windowState(session, SHOP_WIN.cmd);
  if (!cmd || !cmd.symbols) { ctx.log("  shop: command window not readable"); return bought; }
  const bi = cmd.symbols.indexOf("buy");
  if (bi < 0) { ctx.log("  shop: no buy command"); return bought; }
  if (await battle.moveCursorTo(session, SHOP_WIN.cmd, bi)) await session.holdOk(400);
  await sleep(800);
  for (const want of buyList) {
    if (!want.count || want.count <= 0) continue;
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      const bw = await battle.windowState(session, SHOP_WIN.buy, { withItems: true });
      if (!bw || !bw.active || !bw.items) { await sleep(600); continue; }
      const idx = bw.items.findIndex(it => it && it.id === want.itemId);
      if (idx < 0) { ctx.log(`  shop: item ${want.itemId} not sold here`); done = true; break; }
      if (!(await battle.moveCursorTo(session, SHOP_WIN.buy, idx))) continue;
      const before = await session.evSafe(`$gameParty.numItems($dataItems[${want.itemId}])`);
      await session.holdOk(400);
      await sleep(700);
      // Number window: set quantity. MZ Window_ShopNumber: up +1, down -1,
      // right +10, left -10; starts at 1.
      const nw = await battle.windowState(session, SHOP_WIN.num);
      if (nw && nw.active) {
        let cur = await session.evSafe("SceneManager._scene._numberWindow._number");
        if (typeof cur !== "number") cur = 1;
        let guard = 0;
        while (cur !== want.count && guard++ < 40) {
          const diff = want.count - cur;
          if (diff >= 10) { await session.holdKey("right", 150); cur += 10; }
          else if (diff <= -10) { await session.holdKey("left", 150); cur -= 10; }
          else if (diff > 0) { await session.holdKey("up", 150); cur += 1; }
          else { await session.holdKey("down", 150); cur -= 1; }
          await sleep(160);
          const read = await session.evSafe("SceneManager._scene._numberWindow._number");
          if (typeof read === "number") cur = read;
        }
        await session.holdOk(400);
        await sleep(700);
      }
      const after = await session.evSafe(`$gameParty.numItems($dataItems[${want.itemId}])`);
      if (typeof before === "number" && typeof after === "number" && after > before) {
        bought.push({ itemId: want.itemId, count: after - before });
        ctx.log(`  shop: bought ${after - before} x item ${want.itemId}`);
        done = true;
      }
    }
    if (!done) ctx.log(`  shop: FAILED to buy item ${want.itemId} x${want.count}`);
  }
  await exitShop(session);
  return bought;
}

async function exitShop(session) {
  for (let i = 0; i < 10; i++) {
    const name = await session.evSafe("SceneManager._scene ? SceneManager._scene.constructor.name : 'none'");
    if (name !== "Scene_Shop") return true;
    const cmd = await battle.windowState(session, SHOP_WIN.cmd);
    if (cmd && cmd.active && cmd.symbols) {
      const ci = cmd.symbols.indexOf("cancel");
      if (ci >= 0 && await battle.moveCursorTo(session, SHOP_WIN.cmd, ci)) { await session.holdOk(300); await sleep(600); continue; }
    }
    await session.holdKey("cancel", 250);
    await sleep(600);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Town Map / Fly — opened via the menu by flyTo(); selection handled here.
// ---------------------------------------------------------------------------

async function townMapSelect(session, ctx, destMapId) {
  const win = "SceneManager._scene._mapWindow";
  for (let i = 0; i < 24; i++) {
    const towns = await session.evSafe("(function(){ try { const w = SceneManager._scene._mapWindow; return w && w._towns ? w._towns.map(t => ({ mapId: t.mapId, unlocked: !!t.unlocked, name: t.name })) : null; } catch (e) { return null; } })()");
    if (!towns) { await sleep(500); continue; }
    const idx = towns.findIndex(t => t.mapId === destMapId);
    if (idx < 0) { ctx.log(`  fly: map ${destMapId} not a town-map destination`); break; }
    if (!towns[idx].unlocked) { ctx.log(`  fly: destination ${towns[idx].name} LOCKED`); ctx.flyResult = { ok: false, locked: true, name: towns[idx].name }; await session.holdKey("cancel", 250); return false; }
    if (await battle.moveCursorTo(session, win, idx)) {
      await session.holdOk(400);
      ctx.flyResult = { ok: true, name: towns[idx].name };
      return true;
    }
    await sleep(500);
  }
  ctx.flyResult = { ok: false };
  return false;
}

// Open the menu and choose "Town Map / Fly", then let driveFlow's town-map
// branch complete the selection (it owns ctx.task). Simpler: do it inline.
async function flyTo(session, ctx, destMapId) {
  const ui = await mapUiState(session);
  if (!ui || ui.scene !== "Scene_Map") return { ok: false, why: "not on map scene" };
  if (ui.map === destMapId) return { ok: true, already: true };
  await session.holdKey("cancel", 300); // MZ menu key
  await sleep(900);
  const scene = await session.evSafe("SceneManager._scene ? SceneManager._scene.constructor.name : 'none'");
  if (scene !== "Scene_Menu") return { ok: false, why: "menu did not open (scene=" + scene + ")" };
  const cmdPath = "SceneManager._scene._commandWindow";
  const cmd = await battle.windowState(session, cmdPath);
  const ti = cmd && cmd.symbols ? cmd.symbols.indexOf("townMap") : -1;
  if (ti < 0) { await session.holdKey("cancel", 250); return { ok: false, why: "no townMap command in menu" }; }
  if (!(await battle.moveCursorTo(session, cmdPath, ti))) { await session.holdKey("cancel", 250); return { ok: false, why: "could not reach townMap command" }; }
  ctx.flyResult = null;
  ctx.task = { type: "fly", mapId: destMapId };
  await session.holdOk(400);
  const r = await driveFlow(session, ctx, { timeoutMs: 60000 });
  await sleep(800);
  const now = await session.evSafe("$gameMap.mapId()");
  if (now === destMapId) return { ok: true, name: ctx.flyResult && ctx.flyResult.name };
  return { ok: false, why: "fly did not arrive (map=" + now + ")", flow: r.ended, flyResult: ctx.flyResult };
}

// ---------------------------------------------------------------------------
// Grass: find bush tiles on the current map for grinding.
// ---------------------------------------------------------------------------

function grassTiles(session, max = 40) {
  return session.evSafe(`(function(){
    const out = [];
    for (let y = 0; y < $gameMap.height() && out.length < ${max}; y++)
      for (let x = 0; x < $gameMap.width() && out.length < ${max}; x++)
        if ($gameMap.isBush(x, y)) out.push([x, y]);
    return out;
  })()`);
}

module.exports = {
  mapUiState, runState, partyHpPct, leadHpPct,
  walkTo, gotoMap, faceToward, interactEvent,
  foeInfo, benchScores, drivePlayBattle, driveFlow,
  shopBuy, exitShop, townMapSelect, flyTo, grassTiles,
  DIRS, DIRNUM,
};
