import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRelayServer } from "../src/server.js";
import { loadConfig } from "../src/config.js";
import { SimClient, legalTeam } from "./sim-client.js";

const gameData = JSON.parse(readFileSync(new URL("../data/game-data.json", import.meta.url), "utf8"));
const TEAM_A = [1, 4, 7, 10, 13, 16];
const TEAM_B = [2, 5, 8, 11, 14, 17];

async function boot(clocks) {
  const dataDir = mkdtempSync(path.join(tmpdir(), "ganjuko-relay-test-"));
  const config = loadConfig({
    PORT: "0",
    DATA_DIR: dataDir,
    ADMIN_TOKEN: "test-admin-token",
    ALLOW_TEST_CLOCKS: "1",
    RELAY_CLOCKS_JSON: JSON.stringify(clocks),
    RELAY_WIDEN_MS: "60000",
    RELAY_JOINS_PER_MIN: "100000", // loopback test rig: many identities, one IP
  });
  const { server, relay, store } = createRelayServer({ config, gameData });
  await store.init();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `ws://127.0.0.1:${server.address().port}/arena`;
  return { server, relay, store, url, dataDir };
}

const liveClients = new Set();
afterEach(() => {
  for (const c of liveClients) c.terminate();
  liveClients.clear();
});

async function client(url, name, opts = {}) {
  const c = new SimClient(url, { displayName: name, gameData, ...opts });
  liveClients.add(c);
  await c.connect();
  await c.ident();
  return c;
}

async function pairedMatch(a, b, { mode = "casual", format = "singles", level = 50 } = {}) {
  a.queueJoin({ mode, format, team: legalTeam(gameData, TEAM_A, level) });
  b.queueJoin({ mode, format, team: legalTeam(gameData, TEAM_B, level) });
  const foundA = await a.waitFor("MATCH_FOUND");
  const foundB = await b.waitFor("MATCH_FOUND");
  assert.equal(foundA.matchId, foundB.matchId);
  return foundA.matchId;
}

function assertMirroredEnd(a, b) {
  assert.ok(a.matchEnd, "client A never saw MATCH_END");
  assert.ok(b.matchEnd, "client B never saw MATCH_END");
  const ra = a.matchEnd.result;
  const rb = b.matchEnd.result;
  if (ra === "draw") assert.equal(rb, "draw");
  else if (ra === "void") assert.equal(rb, "void");
  else {
    assert.equal(ra === "win" ? "loss" : "win", rb);
  }
  assert.equal(a.matchEnd.reason, b.matchEnd.reason);
}

// ---------------------------------------------------------------------
let S; // shared server: brisk but forgiving clocks
before(async () => {
  S = await boot({ turnMs: 1500, bankMs: 120000, totalMs: 600000, pickMs: 3000, graceMs: 1200, acceptMs: 3000, claimMs: 800 });
});
after(() => S.server.close());

test("match: full singles casual match completes over the real socket, hashes agree throughout", async () => {
  const a = await client(S.url, "Alpha");
  const b = await client(S.url, "Bravo");
  await pairedMatch(a, b, { mode: "casual", format: "singles" });
  await a.waitFor("MATCH_END", 30000);
  await b.waitFor("MATCH_END", 30000);
  assertMirroredEnd(a, b);
  assert.equal(a.matchEnd.reason, "battle");
  assert.equal(a.desyncs + b.desyncs, 0);
  const turns = a.seen.filter((m) => m.type === "EXCHANGE").length;
  assert.ok(turns >= 3, `expected a real battle, got ${turns} turns`);
  a.close(); b.close();
});

test("match: full doubles ranked match completes; ratings and replay move server-side", async () => {
  const a = await client(S.url, "Charli");
  const b = await client(S.url, "Delta");
  const matchId = await pairedMatch(a, b, { mode: "ranked", format: "doubles" });
  await a.waitFor("MATCH_END", 30000);
  await b.waitFor("MATCH_END", 30000);
  assertMirroredEnd(a, b);
  const winner = a.matchEnd.result === "win" ? a : b.matchEnd.result === "win" ? b : null;
  const loser = winner === a ? b : winner === b ? a : null;
  if (winner) {
    assert.ok(winner.matchEnd.rating.delta > 0, "winner rating should rise");
    assert.ok(loser.matchEnd.rating.delta < 0, "loser rating should fall");
    const recW = S.store.getPlayer(winner.identity.playerId);
    const recL = S.store.getPlayer(loser.identity.playerId);
    assert.equal(recW.w, 1);
    assert.equal(recL.l, 1);
    assert.equal(recW.rating, winner.matchEnd.rating.after);
  }
  const replay = await S.store.readReplay(matchId);
  assert.ok(replay, "replay retained");
  assert.equal(replay.mode, "ranked");
  assert.ok(replay.events.some((e) => e.type === "match_end"));
  a.close(); b.close();
});

test("match: forged team is refused at the queue door; perfect legal team is accepted", async () => {
  const cheat = await client(S.url, "Forged");
  const forged = legalTeam(gameData, TEAM_A, 50);
  forged[0].params[2] = 9999;
  cheat.queueJoin({ mode: "casual", format: "singles", team: forged });
  const err = await cheat.waitFor("QUEUE_ERROR");
  assert.equal(err.code, "team_invalid");
  const honest = await client(S.url, "Perfect");
  honest.queueJoin({ mode: "casual", format: "singles", team: legalTeam(gameData, TEAM_A, 100, { iv: 31, ev: 252 }) });
  await honest.waitFor("QUEUED");
  honest.sendRaw({ type: "QUEUE_LEAVE" });
  cheat.close(); honest.close();
});

test("match: casual decline aborts the pairing and requeues the accepter", async () => {
  const a = await client(S.url, "Accepter");
  const b = await client(S.url, "Decliner", { autoAccept: false });
  a.queueJoin({ mode: "casual", format: "singles", team: legalTeam(gameData, TEAM_A, 50) });
  b.queueJoin({ mode: "casual", format: "singles", team: legalTeam(gameData, TEAM_B, 50) });
  const found = await a.waitFor("MATCH_FOUND");
  await b.waitFor("MATCH_FOUND");
  b.decline();
  await a.waitFor("MATCH_ABORTED");
  assert.ok(S.relay.queue.has(a.identity.playerId), "accepter returns to the queue");
  assert.ok(!S.relay.queue.has(b.identity.playerId), "decliner leaves the queue");
  const c = await client(S.url, "Charlie");
  c.queueJoin({ mode: "casual", format: "singles", team: legalTeam(gameData, TEAM_B, 50) });
  const found2 = await a.waitFor("MATCH_FOUND", 10000, (m) => m.matchId !== found.matchId);
  assert.ok(found2);
  a.close(); b.close(); c.close();
});

test("match: P2 tampering triggers snapshot recovery and the match still completes", async () => {
  const a = await client(S.url, "HonestA");
  const b = await client(S.url, "TamperB");
  b.tamperTurns = new Set([2]);
  await pairedMatch(a, b, { mode: "casual", format: "singles" });
  await a.waitFor("MATCH_END", 30000);
  await b.waitFor("MATCH_END", 30000);
  assertMirroredEnd(a, b);
  assert.equal(a.matchEnd.reason, "battle");
  assert.ok(a.desyncs + b.desyncs >= 1, "a desync must have been detected");
  assert.ok(b.seen.some((m) => m.type === "SNAPSHOT"), "P2 received the leader snapshot");
  assert.ok(a.seen.some((m) => m.type === "RESYNCED"), "match resynced");
  a.close(); b.close();
});

test("match: a second desync voids the match and ranked ratings do not move", async () => {
  const a = await client(S.url, "HonestC");
  const b = await client(S.url, "TamperD");
  b.tamperTurns = new Set([2, 4]);
  await pairedMatch(a, b, { mode: "ranked", format: "singles" });
  await a.waitFor("MATCH_END", 30000);
  await b.waitFor("MATCH_END", 30000);
  assert.equal(a.matchEnd.result, "void");
  assert.equal(a.matchEnd.reason, "void_desync");
  assert.equal(S.store.getPlayer(a.identity.playerId).rating, 1500);
  assert.equal(S.store.getPlayer(b.identity.playerId).rating, 1500);
  a.close(); b.close();
});

test("match: silent player is auto-played twice, then forfeits on the third strike", async () => {
  const a = await client(S.url, "Patient");
  const b = await client(S.url, "Silent");
  b.actInMatch = false;
  await pairedMatch(a, b, { mode: "ranked", format: "singles" });
  await a.waitFor("MATCH_END", 30000);
  await b.waitFor("MATCH_END", 30000);
  assert.equal(a.matchEnd.result, "win");
  assert.equal(a.matchEnd.reason, "forfeit_strikes");
  assert.equal(b.matchEnd.result, "loss");
  assert.equal(S.store.getPlayer(a.identity.playerId).w, 1);
  assert.equal(S.store.getPlayer(b.identity.playerId).l, 1);
  a.close(); b.close();
});

test("match: disconnect inside grace rejoins and completes; past grace forfeits", async () => {
  const a = await client(S.url, "Stayer");
  const b = await client(S.url, "Dropper");
  const matchId = await pairedMatch(a, b, { mode: "casual", format: "singles" });
  await a.waitFor("EXCHANGE", 10000);
  b.terminate();
  await a.waitFor("OPPONENT_DISCONNECTED", 10000);
  const b2 = new SimClient(S.url, { displayName: "Dropper", gameData, identity: b.identity });
  liveClients.add(b2);
  b2.format = "singles";
  await b2.connect();
  await b2.ident();
  b2.rejoin(matchId);
  const resume = await b2.waitFor("MATCH_RESUME", 10000);
  assert.ok(resume.resumeFrom, "resume carries the rebuild trail");
  await a.waitFor("MATCH_END", 30000);
  await b2.waitFor("MATCH_END", 30000);
  assertMirroredEnd(a, b2);
  assert.equal(a.matchEnd.reason, "battle");
  a.close(); b2.close();

  // Past grace: the dropper never returns.
  const c = await client(S.url, "Stayer2");
  const d = await client(S.url, "Goner");
  await pairedMatch(c, d, { mode: "casual", format: "singles" });
  await c.waitFor("EXCHANGE", 10000);
  d.terminate();
  await c.waitFor("MATCH_END", 15000);
  assert.equal(c.matchEnd.result, "win");
  assert.equal(c.matchEnd.reason, "forfeit_disconnect");
  c.close();
});

// ---------------------------------------------------------------------
test("match: decision-bank exhaustion loses on time", async () => {
  const srv = await boot({ turnMs: 1200, bankMs: 2000, totalMs: 600000, pickMs: 3000, graceMs: 1200, acceptMs: 3000, claimMs: 800 });
  try {
    const a = await client(srv.url, "Banked");
    const b = await client(srv.url, "Bankrupt");
    b.actInMatch = false; // silent: bank drains 1200 on turn 1, leaving 800 < turn cap
    await pairedMatch(a, b, { mode: "casual", format: "singles" });
    await a.waitFor("MATCH_END", 20000);
    assert.equal(a.matchEnd.result, "win");
    assert.equal(a.matchEnd.reason, "time_bank");
    a.close(); b.close();
  } finally {
    srv.server.close();
  }
});

test("match: total clock expiry is decided by standing count / HP%", async () => {
  const srv = await boot({ turnMs: 4000, bankMs: 600000, totalMs: 3200, pickMs: 3000, graceMs: 1200, acceptMs: 3000, claimMs: 800 });
  try {
    const a = await client(srv.url, "ClockA", { actionDelayMs: 600 });
    const b = await client(srv.url, "ClockB", { actionDelayMs: 600 });
    await pairedMatch(a, b, { mode: "casual", format: "singles", level: 100 });
    await a.waitFor("MATCH_END", 20000);
    await b.waitFor("MATCH_END", 20000);
    assertMirroredEnd(a, b);
    assert.equal(a.matchEnd.reason, "time");
    a.close(); b.close();
  } finally {
    srv.server.close();
  }
});
