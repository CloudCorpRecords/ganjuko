// Load sanity check — NOT part of the default `npm test` (it spawns a
// real server process and plays 20 concurrent matches; run it with
// `npm run test:load`). The relay's workload is a matchmaking trickle,
// not a throughput firehose — this test exists to prove the single
// process holds 20 simultaneous lockstep matches without breaking a
// sweat, and to record what that costs in memory.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SimClient, legalTeam } from "./sim-client.js";

const gameData = JSON.parse(readFileSync(new URL("../data/game-data.json", import.meta.url), "utf8"));
const TEAM_A = [1, 4, 7, 10, 13, 16];
const TEAM_B = [2, 5, 8, 11, 14, 17];
const MATCHES = 20;

function rssKb(pid) {
  try {
    const out = execFileSync("ps", ["-o", "rss=", "-p", String(pid)], { encoding: "utf8" });
    return Number(out.trim());
  } catch {
    return null;
  }
}

test("load: 20 concurrent ranked doubles matches complete on one small process", { timeout: 300000 }, async () => {
  const port = 18777;
  const dataDir = mkdtempSync(path.join(tmpdir(), "ganjuko-load-"));
  const env = {
    ...process.env,
    PORT: String(port),
    DATA_DIR: dataDir,
    ADMIN_TOKEN: "load-test-token",
    ALLOW_TEST_CLOCKS: "1",
    RELAY_CLOCKS_JSON: JSON.stringify({
      turnMs: 20000, bankMs: 1200000, totalMs: 3600000,
      pickMs: 10000, graceMs: 5000, acceptMs: 10000, claimMs: 2000,
    }),
    RELAY_JOINS_PER_MIN: "100000",
  };
  const child = spawn("node", ["src/server.js"], {
    cwd: new URL("..", import.meta.url).pathname,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  child.stdout.on("data", (d) => (serverLog += d));
  child.stderr.on("data", (d) => (serverLog += d));
  try {
    // Wait for /health.
    const url = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 50; i++) {
      try {
        const r = await fetch(url + "/health");
        if (r.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    const wsUrl = `ws://127.0.0.1:${port}/arena`;
    const startedAt = Date.now();
    const clients = [];
    for (let i = 0; i < MATCHES * 2; i++) {
      const c = new SimClient(wsUrl, { displayName: "Load" + i, gameData });
      await c.connect();
      await c.ident();
      clients.push(c);
    }
    const rssAfterIdent = rssKb(child.pid);
    for (let i = 0; i < MATCHES; i++) {
      clients[2 * i].queueJoin({ mode: "ranked", format: "doubles", team: legalTeam(gameData, TEAM_A, 80) });
      clients[2 * i + 1].queueJoin({ mode: "ranked", format: "doubles", team: legalTeam(gameData, TEAM_B, 80) });
    }
    const ends = await Promise.all(
      clients.map((c) => c.waitFor("MATCH_END", 240000))
    );
    const wallMs = Date.now() - startedAt;
    const rssAtEnd = rssKb(child.pid);
    const health = await (await fetch(url + "/health")).json();
    assert.equal(ends.length, MATCHES * 2);
    assert.ok(ends.every((e) => e.reason === "battle"), "every load match should end by battle, not void/forfeit");
    assert.equal(health.matches, 0);
    assert.equal(health.players, MATCHES * 2);
    console.log(
      `LOAD RESULT: ${MATCHES} concurrent doubles matches, ${ends.reduce((s, e) => s, 0) + MATCHES} completed, ` +
        `wall ${wallMs}ms, server RSS after ident ${rssAfterIdent} KB, at end ${rssAtEnd} KB, log: ${serverLog.trim().split("\n")[0]}`
    );
    for (const c of clients) c.close();
  } finally {
    child.kill("SIGTERM");
  }
});
