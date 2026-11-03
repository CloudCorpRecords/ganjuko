// Smoke test against a DEPLOYED relay: two simulated clients play a
// full casual singles match over the real production clocks (both act
// immediately, so turns complete in pacing time). Usage:
//   node scripts/smoke-deployed.mjs wss://ganjuko-arena-relay.fly.dev/arena
import { readFileSync } from "node:fs";
import { SimClient, legalTeam } from "../test/sim-client.js";

const wsUrl = process.argv[2];
if (!wsUrl) {
  console.error("usage: node scripts/smoke-deployed.mjs wss://<host>/arena");
  process.exit(2);
}
const gameData = JSON.parse(readFileSync(new URL("../data/game-data.json", import.meta.url), "utf8"));

const a = new SimClient(wsUrl, { displayName: "SmokeA", gameData });
const b = new SimClient(wsUrl, { displayName: "SmokeB", gameData });
await a.connect();
await b.connect();
const ia = await a.ident();
const ib = await b.ident();
console.log("idents:", ia.playerId, ib.playerId, "season:", ia.season);
a.queueJoin({ mode: "casual", format: "singles", team: legalTeam(gameData, [1, 4, 7, 10, 13, 16], 50) });
b.queueJoin({ mode: "casual", format: "singles", team: legalTeam(gameData, [2, 5, 8, 11, 14, 17], 50) });
const [ea, eb] = await Promise.all([a.waitFor("MATCH_END", 180000), b.waitFor("MATCH_END", 180000)]);
console.log("MATCH_END A:", JSON.stringify(ea));
console.log("MATCH_END B:", JSON.stringify(eb));
const mirror =
  (ea.result === "win" && eb.result === "loss" && ea.winner === "P1") ||
  (ea.result === "loss" && eb.result === "win" && ea.winner === "P2") ||
  (ea.result === "draw" && eb.result === "draw");
console.log(mirror && ea.reason === "battle" ? "SMOKE PASS" : "SMOKE FAIL");
a.close();
b.close();
process.exit(mirror && ea.reason === "battle" ? 0 : 1);
