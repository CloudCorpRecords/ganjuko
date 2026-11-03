// rig2 route-walk suite — Route Enlargement lane verification.
// For each enlarged route (Map015/017/019/021/023, now 44x30):
//   1. in-engine BFS over $gameMap.isPassable (both-tile rule): every event
//      tile reached, zero orphan passable cells, dims + encounterStep read.
//   2. a real closed-loop WALK with held keys from the west arrival (1,10)
//      to the east exit tile (24,10) — stepping on the exit transfer or the
//      map changing counts as arrival. Encounters are disabled for the walk
//      only (test-harness state; restored after each map).
//   3. screenshots at spawn and at a valley viewpoint for visual QA.
// Runs against the VM-local copy via razer-chrome (default target).
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const { sleep } = require("../lib/cdp");

const MAPS = [
  { id: 15, name: "Route 4", view: [20, 24] },
  { id: 17, name: "Route 5", view: [23, 24] },
  { id: 19, name: "Route 6", view: [21, 26] },
  { id: 21, name: "Route 7", view: [20, 24] },
  { id: 23, name: "Route 8", view: [24, 24] },
];
const DIRS = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] };
const DIRNUM = { down: 2, left: 4, right: 6, up: 8 };

const BFS_EVAL = `(function(){
  const W = $gameMap.width(), H = $gameMap.height();
  const rev = { 2: 8, 8: 2, 4: 6, 6: 4 };
  const step = { 2: [0, 1], 8: [0, -1], 4: [-1, 0], 6: [1, 0] };
  function can(x, y, d) {
    const nx = x + step[d][0], ny = y + step[d][1];
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
    return $gameMap.isPassable(x, y, d) && $gameMap.isPassable(nx, ny, rev[d]);
  }
  const seen = new Set(["1,10"]); const q = [[1, 10]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [2, 4, 6, 8]) {
      if (!can(x, y, d)) continue;
      const k = (x + step[d][0]) + "," + (y + step[d][1]);
      if (!seen.has(k)) { seen.add(k); q.push([x + step[d][0], y + step[d][1]]); }
    }
  }
  let passable = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if ([2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))) passable++;
  }
  const events = $dataMap.events.filter(Boolean).map(e => ({
    id: e.id, name: e.name, x: e.x, y: e.y,
    trigger: e.pages[0].trigger,
    reached: seen.has(e.x + "," + e.y),
    adj: [[1,0],[-1,0],[0,1],[0,-1]].some(s => seen.has((e.x + s[0]) + "," + (e.y + s[1])))
  }));
  return { W, H, enc: $dataMap.encounterStep, reached: seen.size, passable, events };
})()`;

const NEXTSTEP_EVAL = `(function(){
  const sx = $gamePlayer.x, sy = $gamePlayer.y;
  const W = $gameMap.width(), H = $gameMap.height();
  const rev = { 2: 8, 8: 2, 4: 6, 6: 4 };
  const step = { 2: [0, 1, "down"], 8: [0, -1, "up"], 4: [-1, 0, "left"], 6: [1, 0, "right"] };
  const blocked = new Set($dataMap.events.filter(Boolean)
    .filter(e => !(e.x === 24 && e.y === 10)).map(e => e.x + "," + e.y));
  function can(x, y, d) {
    const nx = x + step[d][0], ny = y + step[d][1];
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
    if (blocked.has(nx + "," + ny)) return false;
    return $gameMap.isPassable(x, y, d) && $gameMap.isPassable(nx, ny, rev[d]);
  }
  const start = sx + "," + sy;
  const prev = new Map([[start, null]]); const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === 24 && y === 10) break;
    for (const d of [2, 4, 6, 8]) {
      if (!can(x, y, d)) continue;
      const nx = x + step[d][0], ny = y + step[d][1], k = nx + "," + ny;
      if (!prev.has(k)) { prev.set(k, { from: x + "," + y, dir: step[d][2] }); q.push([nx, ny]); }
    }
  }
  if (!prev.has("24,10")) return null;
  const path = []; let cur = "24,10";
  while (cur !== start) { const p = prev.get(cur); path.unshift(p.dir); cur = p.from; }
  return { next: path[0], remaining: path.length };
})()`;

async function playerState(session) {
  const p = await session.evSafe("([$gamePlayer.x, $gamePlayer.y, $gamePlayer.isMoving(), $gameMap.mapId()])");
  return Array.isArray(p) ? { x: p[0], y: p[1], moving: !!p[2], map: p[3] } : null;
}

// Self-healing walker: one short tap per tile, wait for the move to settle,
// then REPLAN from wherever the player actually is. Overshoot (a hold that
// carried two tiles) is recovered by the replan, not treated as failure.
async function walkToExit(session, mid, maxTaps = 220) {
  let taps = 0, replans = 0;
  while (taps < maxTaps) {
    const st = await playerState(session);
    if (!st) return { done: false, why: "no player state", taps };
    if (st.map !== mid) return { done: true, transferred: true, taps, replans };
    if (st.x === 24 && st.y === 10) return { done: true, transferred: false, taps, replans };
    const plan = await session.ev(NEXTSTEP_EVAL);
    if (!plan || !plan.next) return { done: false, why: "no path from " + st.x + "," + st.y, taps };
    replans++;
    const dir = plan.next;
    const tx = st.x + DIRS[dir][0], ty = st.y + DIRS[dir][1];
    await session.holdKey(dir, 130);
    taps++;
    // wait for this tile-step to complete (or a transfer to fire)
    for (let poll = 0; poll < 14; poll++) {
      await sleep(200);
      const p = await playerState(session);
      if (!p) continue;
      if (p.map !== mid) return { done: true, transferred: true, taps, replans };
      if (!p.moving && p.x === tx && p.y === ty) break;
      if (!p.moving && (p.x !== st.x || p.y !== st.y) && poll > 3) break; // overshoot/undershoot: replan
    }
  }
  const st = await playerState(session);
  return { done: false, why: "tap budget exhausted", taps, at: st };
}

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "route-walk", target, engineMd5: preEngineMd5(target), outDir });
  const shotsDir = path.join(outDir, "shots");
  try { fs.mkdirSync(shotsDir, { recursive: true }); } catch (e) {}
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const boot = await ctx.session.boot(ctx.gameUrl);
    await rep.check("routewalk.boot", true, `focus=${boot.focused} fps=${boot.fps}`);
    await ctx.session.newGame();

    for (const m of MAPS) {
      const tag = `map${String(m.id).padStart(3, "0")}`;
      await ctx.session.directLoadMap(m.id, 1, 10);
      await ctx.session.ev("$gameSystem.disableEncounter()");
      const bfs = await ctx.session.ev(BFS_EVAL);
      const evOk = bfs && bfs.events.every(e => e.reached || (e.trigger === 0 && e.adj));
      await rep.check(`routewalk.${tag}.bfs`, !!bfs && bfs.W === 44 && bfs.H === 30 && bfs.reached === bfs.passable && evOk,
        `${m.name}: dims=${bfs && bfs.W}x${bfs && bfs.H} encStep=${bfs && bfs.enc} reached=${bfs && bfs.reached}/${bfs && bfs.passable} ` +
        `events=${bfs ? bfs.events.map(e => `#${e.id}:${e.reached ? "on" : e.adj ? "adj" : "MISS"}`).join(" ") : "?"}`);
      try { await ctx.session.cdp.screenshot(path.join(shotsDir, `${tag}-spawn.png`)); } catch (e) {}

      const w = await walkToExit(ctx.session, m.id);
      await rep.check(`routewalk.${tag}.walk`, !!w.done,
        `${m.name}: walk=${JSON.stringify(w)}`);
      if (w.done) {
        // Valley screenshot is QA garnish, never a suite-killer: the exit
        // transfer may still be processing (it fires a beat after the
        // player lands on the tile), so settle first and retry the load.
        try {
          await ctx.session.settle();
          await sleep(1200);
          try { await ctx.session.directLoadMap(m.id, m.view[0], m.view[1]); }
          catch (e) { await ctx.session.settle(); await ctx.session.directLoadMap(m.id, m.view[0], m.view[1]); }
          await ctx.session.ev("$gameSystem.disableEncounter()");
          await ctx.session.cdp.screenshot(path.join(shotsDir, `${tag}-valley.png`));
        } catch (e) {}
      }
      await ctx.session.evSafe("$gameSystem.enableEncounter()");
    }
  } catch (e) {
    await rep.check("routewalk.fatal", false, String(e && e.message || e));
  } finally {
    if (ctx) { try { await ctx.close(); } catch (e) {} }
  }
  return rep.write();
}

module.exports = { run };
