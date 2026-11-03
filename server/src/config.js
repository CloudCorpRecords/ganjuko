import { randomInt } from "node:crypto";
import { CLOCKS } from "./timers.js";
import { DEFAULT_EPOCH_MS } from "./seasons.js";

// All configuration arrives via the environment. Secrets (ADMIN_TOKEN,
// CANARY_TOKEN) are set with `fly secrets set` in production and never
// exist in the repo (Security Ship Gate). Test clock overrides exist so
// the timeout/forfeit paths can be exercised in milliseconds; they are
// honored ONLY when ALLOW_TEST_CLOCKS=1, which production never sets —
// the shipped defaults are the Champions numbers and cannot be talked
// down by a client.
export function loadConfig(env = process.env) {
  const clocks = { ...CLOCKS };
  if (env.ALLOW_TEST_CLOCKS === "1" && env.RELAY_CLOCKS_JSON) {
    try {
      Object.assign(clocks, JSON.parse(env.RELAY_CLOCKS_JSON));
    } catch {
      /* malformed test clocks are ignored, never fatal */
    }
  }
  return {
    port: Number(env.PORT || 8080),
    host: env.HOST || "0.0.0.0",
    dataDir: env.DATA_DIR || new URL("../var", import.meta.url).pathname,
    adminToken: env.ADMIN_TOKEN || null,
    canaryToken: env.CANARY_TOKEN || null,
    contentHashes: new Set(
      (env.RELAY_CONTENT_HASHES || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
    seasonEpochMs: Number(env.RELAY_SEASON_EPOCH_MS || DEFAULT_EPOCH_MS),
    clocks,
    widenMs: Number(env.RELAY_WIDEN_MS || 30000),
    maxMsgBytes: 4096,
    maxSnapshotBytes: 16384,
    msgRatePerSec: 4,
    msgBurst: 8,
    // Design value is 6/min (§3.4); env override exists for test rigs
    // where dozens of identities share one loopback IP. Production
    // config never sets it.
    joinsPerMin: Number(env.RELAY_JOINS_PER_MIN || 6),
    seedSource: () => randomInt(0, 0x100000000) >>> 0,
  };
}
