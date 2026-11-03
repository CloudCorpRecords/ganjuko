import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { mulberry32, CountedRng } from "../src/prng.js";
import { canonicalStringify, fnv1a32, hashState, canonicalStateString, parseCanonicalStateString } from "../src/hash.js";
import { generateIdentity, signMessage, verifyMessage, playerIdFromPubkey } from "../src/identity.js";
import {
  expectedScore,
  ratingDeltas,
  tierFor,
  bandForLevel,
  bandForTeam,
  START_RATING,
} from "../src/elo.js";
import { seasonAt, softReset, applyRollover, SEASON_MS, DEFAULT_EPOCH_MS } from "../src/seasons.js";
import { validateTeam, paramEnvelope } from "../src/validate.js";
import { decideTimeResult, instinctAction } from "../src/timers.js";
import { QueueManager } from "../src/queue.js";
import { Store } from "../src/store.js";
import { legalTeam } from "./sim-client.js";

const gameData = JSON.parse(readFileSync(new URL("../data/game-data.json", import.meta.url), "utf8"));

test("prng: mulberry32 is deterministic and seed-sensitive", () => {
  const a = mulberry32(1234);
  const b = mulberry32(1234);
  const c = mulberry32(4321);
  const seqA = Array.from({ length: 100 }, () => a());
  const seqB = Array.from({ length: 100 }, () => b());
  const seqC = Array.from({ length: 100 }, () => c());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);
  assert.ok(seqA.every((v) => v >= 0 && v < 1));
});

test("prng: CountedRng position rebuild reproduces the stream", () => {
  const r = new CountedRng(99);
  for (let i = 0; i < 17; i++) r.next();
  const at = CountedRng.atPosition(99, 17);
  assert.equal(at.calls, 17);
  assert.equal(at.next(), r.next());
});

test("hash: FNV-1a known vectors", () => {
  assert.equal(fnv1a32(""), "811c9dc5");
  assert.equal(fnv1a32("a"), "e40c292c");
});

test("hash: canonical stringify is key-order independent", () => {
  assert.equal(canonicalStringify({ b: 1, a: { d: 4, c: 3 } }), canonicalStringify({ a: { c: 3, d: 4 }, b: 1 }));
});

test("hash: canonical state string round-trips through the parser", () => {
  const state = {
    turn: 7,
    actives: { P1: [2], P2: [0] },
    members: [
      { side: "P1", speciesId: 4, level: 50, hp: 120, mp: 30, status: [4], alive: true },
      { side: "P1", speciesId: 9, level: 48, hp: 0, mp: 12, status: [], alive: false },
      { side: "P2", speciesId: 30, level: 51, hp: 200, mp: 44, status: [], alive: true },
    ],
    prngCalls: 123,
  };
  const text = canonicalStateString(state);
  const parsed = parseCanonicalStateString(text);
  assert.equal(parsed.turn, 7);
  assert.equal(parsed.prngCalls, 123);
  assert.deepEqual(parsed.actives, { P1: [2], P2: [0] });
  assert.equal(parsed.members.length, 3);
  assert.deepEqual(parsed.members[0], state.members[0]);
  assert.equal(hashState(state), fnv1a32(text));
});

test("identity: player id derives from the key and signatures verify", () => {
  const id = generateIdentity();
  assert.match(id.playerId, /^[0-9a-f]{16}$/);
  assert.equal(playerIdFromPubkey(id.rawPubkey), id.playerId);
  const fields = { type: "ACTION", matchId: "m_x", turn: 3, body: { actions: [1, 2] } };
  const sig = signMessage(id.privateKey, fields);
  assert.ok(verifyMessage(id.rawPubkey, fields, sig));
  const other = generateIdentity();
  assert.ok(!verifyMessage(other.rawPubkey, fields, sig));
  assert.ok(!verifyMessage(id.rawPubkey, { ...fields, turn: 4 }, sig));
});

test("elo: expected scores", () => {
  assert.equal(expectedScore(1500, 1500), 0.5);
  assert.ok(Math.abs(expectedScore(1900, 1500) - 0.909) < 0.001);
  assert.ok(Math.abs(expectedScore(1500, 1900) - 0.091) < 0.001);
  // Band adjustment is expectation-only: a higher-band team is favoured.
  assert.ok(expectedScore(1500, 1500, 4, 0) > 0.6);
  assert.ok(expectedScore(1500, 1500, 0, 4) < 0.4);
});

test("elo: deltas — win/loss/draw, placement double-K, veteran K", () => {
  const fresh = () => ({ rating: 1500, rankedThisSeason: 0 });
  const d = ratingDeltas(fresh(), fresh(), 2, 2, 1, 0);
  assert.equal(d.a, 32); // K=64 placement, expected 0.5 -> +32
  assert.equal(d.b, -32);
  const vet = () => ({ rating: 1500, rankedThisSeason: 9 });
  const dv = ratingDeltas(vet(), vet(), 2, 2, 1, 0);
  assert.equal(dv.a, 16); // K=32 -> +16
  const dd = ratingDeltas(fresh(), fresh(), 2, 2, 0.5, 0.5);
  assert.equal(dd.a, 0);
  assert.equal(dd.b, 0);
  // Underdog win pays more than favourite win.
  const dog = ratingDeltas({ rating: 1300, rankedThisSeason: 9 }, { rating: 1700, rankedThisSeason: 9 }, 2, 2, 1, 0);
  const fav = ratingDeltas({ rating: 1700, rankedThisSeason: 9 }, { rating: 1300, rankedThisSeason: 9 }, 2, 2, 1, 0);
  assert.ok(dog.a > fav.a);
});

test("elo: tier boundaries at 1200/1500/1800/2100", () => {
  assert.equal(tierFor(1199), "Rookie");
  assert.equal(tierFor(1200), "Ganjuko");
  assert.equal(tierFor(1499), "Ganjuko");
  assert.equal(tierFor(1500), "Great");
  assert.equal(tierFor(1799), "Great");
  assert.equal(tierFor(1800), "Ultra");
  assert.equal(tierFor(2099), "Ultra");
  assert.equal(tierFor(2100), "Master");
  assert.equal(START_RATING, 1500);
});

test("elo: level bands and team band (highest member)", () => {
  assert.equal(bandForLevel(1).name, "Sprout");
  assert.equal(bandForLevel(20).name, "Sprout");
  assert.equal(bandForLevel(21).name, "Bronze");
  assert.equal(bandForLevel(60).name, "Silver");
  assert.equal(bandForLevel(61).name, "Gold");
  assert.equal(bandForLevel(100).name, "Masters");
  assert.equal(bandForTeam([{ level: 12 }, { level: 55 }, { level: 30 }]).name, "Silver");
});

test("seasons: numbering, soft reset, lazy rollover", () => {
  assert.equal(seasonAt(DEFAULT_EPOCH_MS - 1), 0);
  assert.equal(seasonAt(DEFAULT_EPOCH_MS), 1);
  assert.equal(seasonAt(DEFAULT_EPOCH_MS + SEASON_MS - 1), 1);
  assert.equal(seasonAt(DEFAULT_EPOCH_MS + SEASON_MS), 2);
  assert.equal(softReset(1700), 1600);
  assert.equal(softReset(1300), 1400);
  assert.equal(softReset(1500), 1500);
  const rec = {
    rating: 1900, season: 1, seasonBest: 1950, w: 10, l: 4, d: 1,
    rankedThisSeason: 14, casualThisSeason: 3, seasonHistory: [],
  };
  applyRollover(rec, DEFAULT_EPOCH_MS + SEASON_MS + 1000);
  assert.equal(rec.season, 2);
  assert.equal(rec.rating, 1700);
  assert.equal(rec.rankedThisSeason, 0);
  assert.equal(rec.seasonHistory.length, 1);
  assert.equal(rec.seasonHistory[0].finalRating, 1900);
  assert.equal(rec.seasonHistory[0].w, 10);
});

test("timers: time-up decision — standing count, then HP% sums, then draw", () => {
  assert.equal(decideTimeResult({ alive: 3, hpPctSum: 100 }, { alive: 2, hpPctSum: 290 }), "P1");
  assert.equal(decideTimeResult({ alive: 2, hpPctSum: 290 }, { alive: 3, hpPctSum: 100 }), "P2");
  assert.equal(decideTimeResult({ alive: 2, hpPctSum: 150 }, { alive: 2, hpPctSum: 140 }), "P1");
  assert.equal(decideTimeResult({ alive: 2, hpPctSum: 150 }, { alive: 2, hpPctSum: 150 }), "draw");
});

test("timers: instinct action fights with first moves, one per slot", () => {
  const team = [{ moves: [10, 11] }, { moves: [20] }];
  const acts = instinctAction(team, 2, "doubles");
  assert.equal(acts.length, 2);
  assert.equal(acts[0].skillId, 10);
  assert.equal(acts[1].skillId, 20);
  assert.ok(acts.every((a) => a.kind === "fight" && a.instinct === true));
});

test("validate: a legal mid team passes; envelope edges behave", () => {
  const team = legalTeam(gameData, [1, 4, 7, 10, 13, 16], 50);
  const res = validateTeam(team, gameData, { ranked: true });
  assert.ok(res.ok, res.errors.join("; "));
  const sp = gameData.species[1];
  const [lo, hi] = paramEnvelope(sp, "atk", 100);
  assert.ok(hi > lo && lo > 0);
});

test("validate: forged stats die at the door", () => {
  const team = legalTeam(gameData, [1, 4, 7], 50);
  team[0].params[2] = 9999;
  const res = validateTeam(team, gameData, {});
  assert.ok(!res.ok);
  assert.ok(res.errors.some((e) => e.includes("outside legal envelope")));
});

test("validate: perfect-IV legal team is accepted (the honest ceiling)", () => {
  const team = legalTeam(gameData, [1, 4, 7], 100, { iv: 31, ev: 252 });
  const res = validateTeam(team, gameData, {});
  assert.ok(res.ok, res.errors.join("; "));
});

test("validate: ranked species clause; casual allows duplicates", () => {
  const team = legalTeam(gameData, [1, 1, 7], 50);
  assert.ok(!validateTeam(team, gameData, { ranked: true }).ok);
  assert.ok(validateTeam(team, gameData, { ranked: false }).ok);
});

test("validate: bad levels, unknown species, unknown skills rejected", () => {
  const t1 = legalTeam(gameData, [1, 4, 7], 50);
  t1[0].level = 101;
  assert.ok(!validateTeam(t1, gameData, {}).ok);
  const t2 = legalTeam(gameData, [1, 4, 7], 50);
  t2[0].speciesId = 99999;
  assert.ok(!validateTeam(t2, gameData, {}).ok);
  const t3 = legalTeam(gameData, [1, 4, 7], 50);
  t3[0].moves = [99999];
  assert.ok(!validateTeam(t3, gameData, {}).ok);
});

test("queue: same-band pairing, widening, ranked proximity", () => {
  let now = 1000000;
  const q = new QueueManager({ widenAfterMs: 30000, now: () => now });
  const entry = (playerId, bandIndex, rating = 1500) => ({
    playerId, session: { send() {} }, mode: "ranked", format: "singles", bandIndex, rating, team: [],
  });
  q.add(entry("a", 2));
  assert.deepEqual(q.pairPass(), []);
  q.add(entry("b", 3)); // different band, nobody widened yet
  assert.deepEqual(q.pairPass(), []);
  now += 31000; // both widen
  const pairs = q.pairPass();
  assert.equal(pairs.length, 1);
  // ranked proximity inside the band
  const q2 = new QueueManager({ widenAfterMs: 30000, now: () => now });
  q2.add(entry("x", 1, 1500));
  q2.add(entry("y", 1, 1900));
  q2.add(entry("z", 1, 1520));
  const p2 = q2.pairPass();
  assert.equal(p2.length, 1);
  assert.deepEqual([p2[0][0].playerId, p2[0][1].playerId].sort(), ["x", "z"]);
});

test("store: player records and replay retention round-trip", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ganjuko-store-"));
  const store = new Store(dir);
  await store.init();
  const rec = store.ensurePlayer("abcd1234abcd1234", { displayName: "Rene", pubkeyB64: "AAAA" });
  assert.equal(rec.rating, 1500);
  await store.save();
  const store2 = new Store(dir);
  await store2.init();
  assert.equal(store2.getPlayer("abcd1234abcd1234").displayName, "Rene");
  await store2.writeReplay({ matchId: "m_old", expiresAt: Date.now() - 1000, events: [] });
  await store2.writeReplay({ matchId: "m_new", expiresAt: Date.now() + 100000, events: [] });
  const removed = await store2.pruneReplays(Date.now());
  assert.equal(removed, 1);
  assert.ok(existsSync(path.join(dir, "replays", "m_new.json")));
});
