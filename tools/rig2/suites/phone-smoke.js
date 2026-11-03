// rig2 phone-smoke suite — the phone-target proof cycle (2026-11-02).
//   title screen -> New Game -> Wakaba Town -> Prof. Kusu's Lab ->
//   back out -> Route 1, with held-key walking the whole way and a
//   screenshot + live state read at every stage. Exists to prove the
//   `phone` target end-to-end (Samsung Chrome over adb reverse/forward);
//   it runs against any target, but `phone` is what it was built for.
// Movement uses the house pattern: BFS one-step planning over
// $gameMap.isPassable (route-walk suite), with two corrections proven
// in the 2026-11-02 phone diagnostics: (1) only priority!=0 event tiles
// block the BFS — priority-0 ("below characters") events are walkable,
// and blocking them sealed Wakaba's north exit (the Grass Warning
// triggers at (10..12,1) guard the Route 1 tiles); (2) touch-transfer
// events fire with a lag after the step, so arrivals are confirmed by
// polling for the map change, and legs tolerate a lagged transfer
// hijack by re-driving from whatever map they land on; (3) movement
// uses stepOnce — hold the key only until the tile changes — because
// fixed-duration holds are frame-rate calibrated: 350 ms ≈ 1 tile at
// SwiftShader's ~10 FPS but ~4 tiles at the phone's ~65 FPS, which
// ricocheted the player back onto transfer tiles (traced live).
// Screenshots on the phone target are phone-NATIVE
// (adb screencap pulled to the Razer): CDP captures written from this
// VM are zeroed by the write-guard. See PHONE-TEST-TARGET-2026-11-02.md.
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const { sleep } = require("../lib/cdp");
const { KEYS } = require("../lib/session");

const NEXTSTEP = (tx, ty) => `(function(){
  const sx = $gamePlayer.x, sy = $gamePlayer.y;
  if (sx === ${tx} && sy === ${ty}) return "arrived";
  const W = $gameMap.width(), H = $gameMap.height();
  const step = { 2: [0, 1, "down"], 8: [0, -1, "up"], 4: [-1, 0, "left"], 6: [1, 0, "right"] };
  const rev = { 2: 8, 8: 2, 4: 6, 6: 4 };
  const blocked = new Set($dataMap.events.filter(Boolean).filter(e => !(e.x === ${tx} && e.y === ${ty}) && e.pages[0].priorityType !== 0).map(e => e.x + "," + e.y));
  function can(x, y, d) {
    const nx = x + step[d][0], ny = y + step[d][1];
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
    if (blocked.has(nx + "," + ny)) return false;
    return $gameMap.isPassable(x, y, d) && $gameMap.isPassable(nx, ny, rev[d]);
  }
  const start = sx + "," + sy, goal = ${tx} + "," + ${ty};
  const prev = new Map([[start, null]]); const q = [[sx, sy]];
  while (q.length) {
    const cur = q.shift();
    if (cur[0] + "," + cur[1] === goal) break;
    for (const d of [2, 4, 6, 8]) {
      if (!can(cur[0], cur[1], d)) continue;
      const nx = cur[0] + step[d][0], ny = cur[1] + step[d][1], k = nx + "," + ny;
      if (!prev.has(k)) { prev.set(k, { from: cur[0] + "," + cur[1], dir: step[d][2] }); q.push([nx, ny]); }
    }
  }
  if (!prev.has(goal)) return null;
  let cur = goal, firstDir = null;
  while (cur !== start) { const p = prev.get(cur); if (!p) return null; firstDir = p.dir; cur = p.from; }
  return firstDir;
})()`;

const PLAYER = "(function(){ return { x: $gamePlayer.x, y: $gamePlayer.y, map: $gameMap.mapId(), moving: $gamePlayer.isMoving() }; })()";
const TILE = "(function(){ return $gameMap.mapId() + ':' + $gamePlayer.x + ',' + $gamePlayer.y; })()";

// ONE tile of movement, frame-rate independent: hold the key down and
// release it the moment the player's tile changes. Session.holdKey's
// fixed-duration holds are calibrated for ~10 FPS software rendering
// (350 ms ≈ 1 tile); on the phone's real GPU at ~65 FPS the same hold
// covers ~4 tiles, which ricocheted the player back onto transfer
// tiles and bounced whole walk legs into the Lab (traced 2026-11-02).
async function stepOnce(session, dir) {
  const k = KEYS[dir];
  if (!k) throw new Error("phone-smoke: unknown direction " + dir);
  const before = await session.evSafe(TILE);
  await session.cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk, code: k.code, key: k.key });
  let moved = false;
  for (let i = 0; i < 16; i++) {
    await sleep(50);
    const now = await session.evSafe(TILE);
    if (now && before && now !== before) { moved = true; break; }
  }
  await session.cdp.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk, code: k.code, key: k.key });
  return moved;
}

// Walk with held keys toward (tx,ty) on the CURRENT map. Returns when the
// player arrives, when a transfer changes the map, or when the step
// budget runs out — the caller checks which. Fails fast when the BFS
// finds no path several polls in a row (a blocked-rule defect once
// burned a whole 140-step budget standing still).
async function walkTo(session, tx, ty, { maxSteps = 140 } = {}) {
  const map0 = await session.evSafe("$gameMap.mapId()");
  let nullStreak = 0;
  for (let i = 0; i < maxSteps; i++) {
    const st = await session.evSafe(PLAYER);
    if (!st) { await sleep(400); continue; }
    if (st.map !== map0) return { arrived: "mapchange", map: st.map, steps: i, at: st };
    if (st.x === tx && st.y === ty && !st.moving) return { arrived: true, map: st.map, steps: i, at: st };
    const dir = await session.evSafe(NEXTSTEP(tx, ty));
    if (!dir) {
      if (++nullStreak >= 8) return { arrived: false, reason: "no-path", map: st.map, steps: i, at: st };
      await sleep(500); continue;
    }
    nullStreak = 0;
    if (dir === "arrived") continue;
    await stepOnce(session, dir);
    await sleep(60);
  }
  const end = await session.evSafe(PLAYER);
  return { arrived: false, reason: "budget", map: end && end.map, steps: maxSteps, at: end };
}

// Touch transfers fire with a lag: poll for the map to BECOME mapId.
async function waitMap(session, mapId, tries = 24) {
  for (let i = 0; i < tries; i++) {
    if ((await session.evSafe("$gameMap.mapId()")) === mapId) return true;
    await sleep(500);
  }
  return false;
}

async function shot(ctx, rep, dir, name) {
  // Phone target: phone-native capture (adb screencap -> Razer folder).
  if (ctx.phoneShot) {
    const size = await ctx.phoneShot(name).catch(() => 0);
    rep.note(`screenshot ${name}: phone-native via adb, Razer-side file (${size} bytes)`);
    return { saved: "razer:ganjuko-rig2-scratch/phone-shots/" + name, size };
  }
  const p = path.join(dir, name);
  const saved = await ctx.cdp.screenshot(p).catch(() => null);
  let size = 0;
  if (saved) { try { size = fs.statSync(saved).size; } catch (e) { /* keep 0 */ } }
  rep.note(`screenshot ${name}: ${saved ? saved : "FAILED"} (${size} bytes)`);
  return { saved, size };
}

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "phone-smoke", target, engineMd5: preEngineMd5(target), outDir });
  const shotsDir = path.join(outDir, "shots");
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const s = ctx.session;

    // --- title screen ---
    const boot = await s.boot(ctx.gameUrl);
    rep.note(`boot: focus=${boot.focused} webgl=${boot.webgl} fps=${boot.fps}`);
    const titleScene = await s.sceneName();
    const titleShot = await shot(ctx, rep, shotsDir, "phone-01-title.png");
    await rep.check("phone.title", titleScene === "Scene_Title" && titleShot.size > 10000,
      `scene=${titleScene} screenshot=${titleShot.size}B fps=${boot.fps}`);

    // --- New Game -> Wakaba Town (Map001, spawn 6,9) ---
    await s.newGame();
    await s.evSafe("$gameSystem.disableEncounter()");
    const start = await s.evSafe(PLAYER);
    const snap = await s.snapshot();
    const townShot = await shot(ctx, rep, shotsDir, "phone-02-wakaba.png");
    await rep.check("phone.newGame", !!start && start.map === 1 && !!snap,
      `map=${start && start.map} at=(${start && start.x},${start && start.y}) snapshot=${JSON.stringify(snap)} screenshot=${townShot.size}B`);

    // --- walk into Prof. Kusu's Lab (Map002) via the Lab Step tile ---
    const toLab = await walkTo(s, 16, 15);
    const labIn = await waitMap(s, 2);
    await s.settle().catch(() => {});
    const inLab = await s.evSafe(PLAYER);
    const labShot = await shot(ctx, rep, shotsDir, "phone-03-lab.png");
    await rep.check("phone.lab", labIn && !!inLab && inLab.map === 2 && labShot.size > 10000,
      `walk=${JSON.stringify(toLab)} at=(${inLab && inLab.x},${inLab && inLab.y}) screenshot=${labShot.size}B`);

    // --- back out of the Lab, then north to Route 1 (Map003). Touch
    // transfers lag seconds behind the step and can hijack a leg that
    // starts too soon after the previous transfer (observed: a Wakaba
    // leg bounced back into the Lab mid-walk). So this leg is a
    // recovery loop in the house pattern (cf. startWildBattleVerified):
    // whatever map a lagged transfer leaves us on, re-drive. ---
    const outLab = await walkTo(s, 8, 12);
    const labOut = await waitMap(s, 1);
    await s.settle().catch(() => {});
    let onRoute = null;
    const driveLog = [];
    for (let attempt = 0; attempt < 5 && !onRoute; attempt++) {
      const st = await s.evSafe(PLAYER);
      if (!st) { await sleep(600); continue; }
      driveLog.push(`attempt${attempt}: map=${st.map} at=(${st.x},${st.y})`);
      if (st.map === 3) { onRoute = st; break; }
      if (st.map === 2) { await walkTo(s, 8, 12); await waitMap(s, 1, 30); await s.settle().catch(() => {}); continue; }
      if (st.x === 16 && st.y === 15) await walkTo(s, 16, 17); // step off the Lab Step tile first
      await walkTo(s, 11, 0);
      if (await waitMap(s, 3, 10)) onRoute = await s.evSafe(PLAYER);
      await sleep(600);
    }
    await s.settle().catch(() => {});
    const routeShot = await shot(ctx, rep, shotsDir, "phone-04-route1.png");
    await rep.check("phone.route1", !!onRoute && onRoute.map === 3 && routeShot.size > 10000,
      `labExit=${JSON.stringify(outLab)} labOut=${labOut} drive=[${driveLog.join(" | ")}] at=(${onRoute && onRoute.x},${onRoute && onRoute.y}) screenshot=${routeShot.size}B`);

    // --- input proof: tile-exact steps up Route 1 (arrival (11,28)
    // to (11,24)) — four single-tile moves, each one released on the
    // tile boundary by stepOnce. ---
    const p0 = await s.evSafe(PLAYER);
    const stepsWalk = onRoute ? await walkTo(s, 11, 24) : { arrived: false };
    const p1 = await s.evSafe(PLAYER);
    await rep.check("phone.input", !!stepsWalk && stepsWalk.arrived === true && !!p1 && p1.map === 3 && p1.x === 11 && p1.y === 24,
      `tile-exact route steps: (${p0 && p0.x},${p0 && p0.y}) -> (${p1 && p1.x},${p1 && p1.y}) walk=${JSON.stringify(stepsWalk)}`);

    await s.evSafe("$gameSystem.enableEncounter()");
    const fpsEnd = await s.fpsProbe(1500);
    await rep.check("rig.loopAlive", fpsEnd > 0, `frame clock still advancing at suite end (fps=${fpsEnd})`);
    await rep.check("rig.noExceptions", ctx.cdp.exceptions.length === 0,
      (ctx.cdp.exceptions.length ? "EXCEPTIONS: " + JSON.stringify(ctx.cdp.exceptions.slice(0, 3)) : "no uncaught page exceptions") +
      (ctx.cdp.consoleErrors.length ? ` | console.error warnings: ${ctx.cdp.consoleErrors.length}` : ""));
  } catch (e) {
    await rep.check("phone.fatal", false, String(e && e.message || e));
  } finally {
    if (ctx) await ctx.cleanup();
  }
  return rep.write();
}

module.exports = { run };
