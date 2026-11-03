// rig2 session library — the reusable core every suite builds on.
// Encodes the hard-won rules from the 2026-11-01 lanes (see playtest/TESTING.md):
//  - headless Chrome starts UNFOCUSED and MZ idles: focus must be applied in a
//    retry loop and VERIFIED via document.hasFocus(), plus an FPS floor probe.
//  - map changes go through direct loads (DataManager.loadMapData + $gameMap.setup),
//    NEVER $gamePlayer.reserveTransfer (it doesn't process during the intro
//    message queue — that one mistake invalidated a whole verification run).
//  - keys are HELD (rawKeyDown … sleep … keyUp); instant CDP key pairs do not
//    register at SwiftShader frame rates.
"use strict";
const { sleep } = require("./cdp");

const KEYS = {
  ok: { vk: 90, code: "KeyZ", key: "z" },
  cancel: { vk: 88, code: "KeyX", key: "x" },
  up: { vk: 38, code: "ArrowUp", key: "ArrowUp" },
  down: { vk: 40, code: "ArrowDown", key: "ArrowDown" },
  left: { vk: 37, code: "ArrowLeft", key: "ArrowLeft" },
  right: { vk: 39, code: "ArrowRight", key: "ArrowRight" },
  shift: { vk: 16, code: "ShiftLeft", key: "Shift" },
};

class Session {
  constructor(cdp) {
    this.cdp = cdp;
    this.bootInfo = null;
  }

  ev(expr) { return this.cdp.ev(expr); }
  evSafe(expr) { return this.cdp.evSafe(expr); }

  async holdKey(name, ms = 300) {
    const k = KEYS[name];
    if (!k) throw new Error("rig2: unknown key " + name);
    // LATENCY INVARIANT (root-caused 2026-11-03, smoke.wildBattleWin):
    // do NOT await the keyDown RESPONSE before sleeping. cdp.send() resolves
    // only when Chrome's response crosses the SSH tunnel back to us, so the
    // old await made the in-game key-down duration = ms + ~2x tunnel RTT.
    // At RTT ~1s a 350 ms tap became a multi-second hold; MZ's frame-based
    // key-repeat (24-frame wait) then scrolled window cursors uncontrollably,
    // the driver's verify/confirm raced the still-held key, and battles kept
    // confirming the skill at cursor index 0 (Bulk Up) until PP exhaustion —
    // the deterministic "turns=8, PP 1/47, no usable skill" ship-gate failure.
    // The WS write itself is synchronous and ordered, so dispatching both
    // events without awaiting responses keeps the in-game hold ~= ms
    // regardless of tunnel latency.
    const down = this.cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk, code: k.code, key: k.key });
    down.catch(() => {});
    await sleep(ms);
    const up = this.cdp.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk, code: k.code, key: k.key });
    up.catch(() => {});
    await sleep(60); // let the release clear before the caller's next eval
  }
  holdOk(ms = 300) { return this.holdKey("ok", ms); }

  sceneName() {
    return this.evSafe("SceneManager._scene ? SceneManager._scene.constructor.name : 'none'");
  }

  async waitScene(name, tries = 60) {
    for (let i = 0; i < tries; i++) {
      if ((await this.sceneName()) === name) return true;
      await sleep(500);
    }
    return false;
  }

  // Focus-ensure loop: apply focus emulation + bringToFront + a click, then
  // CHECK document.hasFocus(); repeat. A single application is provably flaky.
  async ensureFocus(maxTries = 24) {
    for (let i = 0; i < maxTries; i++) {
      const f = await this.evSafe("document.hasFocus()");
      if (f) return true;
      await this.cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true }).catch(() => {});
      await this.cdp.send("Page.bringToFront").catch(() => {});
      await this.cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 10, y: 10, button: "left", clickCount: 1 }).catch(() => {});
      await this.cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 10, y: 10, button: "left", clickCount: 1 }).catch(() => {});
      await sleep(1200);
    }
    return false;
  }

  // FPS probe via Graphics.frameCount delta. MZ under SwiftShader ran ~10 FPS
  // on the Razer; the floor is deliberately low but a stall below it means the
  // scene clock is not advancing and no input-driven result can be trusted.
  // The frame counter RESETS if the page reloads mid-boot (observed: a probe
  // reading of -133 FPS) — a negative interval means "resample", not "slow".
  async fpsProbe(ms = 2500) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const a = await this.evSafe("typeof Graphics !== 'undefined' ? Graphics.frameCount : -1");
      await sleep(ms);
      const b = await this.evSafe("typeof Graphics !== 'undefined' ? Graphics.frameCount : -1");
      if (a < 0 || b < 0) return -1;
      if (b >= a) return (b - a) / (ms / 1000);
      await sleep(1000); // counter reset: let the new boot settle, resample
    }
    return -1;
  }

  // SETTLE: the current scene exists, has started, and its frame clock is
  // advancing. Seeding or scene pushes issued into an unstarted scene race
  // its construction (observed: giveGanjuko throwing inside addActor on a
  // null refresh target; a SceneManager.push dropped during load churn).
  // Every state-changing helper settles before returning.
  async settle(timeoutMs = 30000) {
    const t0 = Date.now();
    let lastFrames = -1;
    while (Date.now() - t0 < timeoutMs) {
      const st = await this.evSafe(`(function(){ const s = SceneManager._scene; return {
        has: !!s, started: !!(s && s.isStarted && s.isStarted()),
        frames: (typeof Graphics !== "undefined" ? Graphics.frameCount : -1) }; })()`);
      if (st && st.has && st.started && st.frames > 0) {
        if (lastFrames >= 0 && st.frames > lastFrames) return true;
        lastFrames = st.frames;
      }
      await sleep(600);
    }
    return false;
  }

  // Boot the game at `url`, wait for engine globals, verify focus + FPS.
  // Throws (fails loudly) if focus can't be proven or FPS is under the floor —
  // a run whose setup can't be proven must never produce results.
  async boot(url, { fpsFloor = 4, bootWaitMs = 2500 } = {}) {
    await this.cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true }).catch(() => {});
    await this.cdp.navigate(url);
    let ready = false;
    for (let i = 0; i < 120; i++) {
      const ok = await this.evSafe("typeof SceneManager !== 'undefined' && typeof GanjukoEngine !== 'undefined'");
      if (ok) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error("rig2: game globals (SceneManager/GanjukoEngine) never appeared");
    await sleep(bootWaitMs);
    const focused = await this.ensureFocus();
    if (!focused) throw new Error("rig2: could not prove document focus after retry loop — refusing to run (MZ idles unfocused)");
    const webgl = await this.evSafe("(function(){ try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })()");
    const fps = await this.fpsProbe();
    if (fps >= 0 && fps < fpsFloor) throw new Error(`rig2: FPS probe ${fps.toFixed(1)} below floor ${fpsFloor} — scene clock not advancing, refusing to run`);
    this.bootInfo = { focused, webgl: !!webgl, fps: Math.round(fps * 10) / 10 };
    return this.bootInfo;
  }

  // Fresh game state, landed on the map scene. After this, ALWAYS move with
  // directLoadMap (which also clears the intro interpreter/message queue).
  async newGame() {
    // ev, not evSafe: a silently-swallowed setup failure poisons every later
    // step with confusing null-global errors downstream.
    await this.ev("DataManager.setupNewGame()");
    await sleep(800);
    // Scene_Map.stop() dereferences _mapNameWindow; on a map scene that has
    // just been re-created by a battle return, that window may not exist yet
    // and goto() throws (observed). Wait for formation, retry once.
    for (let i = 0; i < 20; i++) {
      const formed = await this.evSafe("(function(){ const s = SceneManager._scene; if (!s) return true; if (s.constructor.name !== 'Scene_Map') return true; return !!s._mapNameWindow; })()");
      if (formed) break;
      await sleep(500);
    }
    try {
      await this.ev("SceneManager.goto(Scene_Map)");
    } catch (e) {
      await this.settle();
      await this.ev("SceneManager.goto(Scene_Map)");
    }
    const ok = await this.waitScene("Scene_Map", 60);
    if (!ok) throw new Error("rig2: newGame did not reach Scene_Map");
    await this.settle();
    await sleep(600);
  }

  // THE map loader. Clears the map interpreter + message queue, loads map data
  // directly, sets up, and locates the player. (FR2 B5c pattern, hardened:)
  //  DataManager.loadMapData nulls $dataMap FIRST and loads async — every
  //  frame rendered during that window throws in the tilemap
  //  (Game_Map.isLoopHorizontal reads $dataMap.scrollType), and a throw
  //  inside the update loop HALTS THE GAME PERMANENTLY (proven: frozen
  //  frameCount, stuck encounter effect, scene change never processed).
  //  On a fast local server the window is ~ms and lanes got away with it;
  //  over a tunnel it is seconds and it kills runs. So: fetch the map JSON
  //  in-page first (old map keeps rendering safely), then swap $dataMap and
  //  set up in ONE synchronous eval — no frame can interleave, $dataMap is
  //  never null.
  async directLoadMap(mapId, x = 8, y = 8) {
    await this.evSafe("(function(){ try { $gameMap._interpreter.clear(); } catch (e) {} try { $gameMessage.clear(); } catch (e) {} return 1; })()");
    const file = "Map" + String(mapId).padStart(3, "0") + ".json";
    const fetched = await this.ev(`fetch("data/${file}").then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(j => { window.__rig2MapData = j; return !!(j && j.events && j.width > 0); })`);
    if (!fetched) throw new Error("rig2: map " + mapId + " data fetch/parse failed");
    await this.ev(`(function(){ $dataMap = window.__rig2MapData; window.__rig2MapData = null; $gameMap.setup(${mapId}); $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(2); $gameMap.refresh(); return $gameMap.mapId(); })()`);
    await sleep(900);
    const now = await this.evSafe("$gameMap.mapId()");
    if (now !== mapId) throw new Error(`rig2: directLoadMap wanted ${mapId}, on ${now}`);
    await this.settle(12000);
    return true;
  }

  // ---- State seeding (all ids are POSITIONAL species ids, the engine's own
  // convention; items are $dataItems ids — setItem/gainItem take objects) ----
  async seedParty(list) {
    // list: [{species: <positional id>, level: n}]
    // giveGanjuko -> Game_Party.addActor dereferences $gamePlayer/$gameTemp,
    // which can still be null in a narrow post-boot window even after the
    // scene settles (observed twice). Guard on the globals and retry.
    const parts = list.map((p) => `GanjukoEngine.giveGanjuko(${p.species}, ${p.level});`);
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ready = await this.evSafe("!!(window.$gameParty && window.$gamePlayer && window.$gameTemp && window.$gameMap)");
      if (ready) {
        try {
          return await this.ev(`(function(){ ${parts.join(" ")} $gameParty.allMembers().forEach(m => m.recoverAll()); return $gameParty.allMembers().map(m => m.ganjukoSpeciesId()); })()`);
        } catch (e) { lastErr = e; }
      }
      await this.settle();
      await sleep(800);
    }
    throw lastErr || new Error("rig2: seedParty preconditions never became ready");
  }
  async seedGold(n) { await this.ev(`$gameParty.gainGold(${n})`); }
  async seedItem(itemId, n) { await this.ev(`$gameParty.gainItem($dataItems[${itemId}], ${n})`); }
  async seedSwitch(id, value) { await this.ev(`$gameSwitches.setValue(${id}, ${!!value})`); }
  async seedBadge(name) {
    return this.evSafe(`(function(){ try { $gameSystem.awardBadge(${JSON.stringify(name)}); return true; } catch (e) { return false; } })()`);
  }
  async healParty() {
    await this.evSafe("(function(){ $gameParty.allMembers().forEach(m => m.recoverAll()); return 1; })()");
  }

  partyState() {
    return this.evSafe("(function(){ return $gameParty.allMembers().map(m => ({ sp: m.ganjukoSpeciesId(), name: m.name(), lv: m.level, hp: m.hp, mhp: m.mhp, agi: m.agi })); })()");
  }

  // Save/load round-trip on a slot (MZ DataManager promises). Returns the
  // restored snapshot so callers can diff against the pre-save snapshot.
  async saveGame(slot = 1) {
    return this.ev(`DataManager.saveGame(${slot}).then(() => true).catch(() => false)`);
  }
  async loadGame(slot = 1) {
    const ok = await this.ev(`DataManager.loadGame(${slot}).then(() => true).catch(() => false)`);
    if (ok) { await this.waitScene("Scene_Map", 40); await this.settle(); await sleep(600); }
    return ok;
  }

  // Start a wild battle and PROVE the battle scene arrives; if the push was
  // dropped by scene churn, settle and re-issue exactly once. Returns true
  // only when Scene_Battle is actually active.
  async startWildBattleVerified(species, level, tries = 30) {
    for (let attempt = 0; attempt < 2; attempt++) {
      // If a battle transition is already queued (e.g. a random encounter
      // fired on the same frames), ride it instead of double-pushing.
      const queued = await this.evSafe("SceneManager._nextScene ? SceneManager._nextScene.constructor.name : null");
      if (queued !== "Scene_Battle") await this.ev(`GanjukoEngine.startWildBattle(${species}, ${level})`);
      if (await this.waitScene("Scene_Battle", tries)) { await this.settle(10000); return true; }
      await this.settle();
    }
    return (await this.sceneName()) === "Scene_Battle";
  }
  snapshot() {
    return this.evSafe("(function(){ return { gold: $gameParty.gold(), map: $gameMap.mapId(), party: $gameParty.allMembers().map(m => ({ sp: m.ganjukoSpeciesId(), lv: m.level })) }; })()");
  }
}

module.exports = { Session, KEYS };
