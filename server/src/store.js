import { promises as fs } from "node:fs";
import path from "node:path";

// File-backed persistence (design A.5): one JSON file for player records,
// rewritten atomically (tmp file + rename) on every mutation; replays as
// one JSON file per match. No database. Seasons bound the blast radius
// of any failure: the catastrophic case is "the ladder resets", never
// "user data leaks" — the inventory is deliberately boring (TRUST §2.1).
//
// Retention (§2.1): ranked replays live until season close + 30 days,
// casual replays 7 days; connection log lines rotate out at 72 hours.
// Each replay file carries its own expiresAt; pruning is a boot-time
// and hourly sweep.

const DAY_MS = 24 * 3600 * 1000;

export class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.playersPath = path.join(dataDir, "players.json");
    this.replaysDir = path.join(dataDir, "replays");
    this.connLogPath = path.join(dataDir, "connections.log");
    this.canaryLogPath = path.join(dataDir, "canary-hits.jsonl");
    this.players = new Map();
    this._saveChain = Promise.resolve();
  }

  async init() {
    await fs.mkdir(this.replaysDir, { recursive: true });
    try {
      const raw = await fs.readFile(this.playersPath, "utf8");
      const parsed = JSON.parse(raw);
      for (const [id, rec] of Object.entries(parsed.players || {})) {
        this.players.set(id, rec);
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    await this.pruneReplays(Date.now());
    await this.pruneConnLog(Date.now());
  }

  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  ensurePlayer(playerId, { displayName, pubkeyB64 }) {
    let rec = this.players.get(playerId);
    if (!rec) {
      const now = Date.now();
      rec = {
        playerId,
        displayName,
        pubkey: pubkeyB64,
        rating: 1500,
        season: 0,
        seasonBest: 1500,
        best: 1500,
        w: 0,
        l: 0,
        d: 0,
        rankedThisSeason: 0,
        casualThisSeason: 0,
        seasonHistory: [],
        banned: false,
        flags: [],
        createdAt: now,
        updatedAt: now,
      };
      this.players.set(playerId, rec);
    } else if (displayName && rec.displayName !== displayName) {
      rec.displayName = displayName;
      rec.updatedAt = Date.now();
    }
    return rec;
  }

  // Serialized atomic saves: callers fire-and-forget; the chain keeps
  // writes ordered and each write is tmp+rename so a crash mid-save
  // never leaves a torn file.
  save() {
    const snapshot = JSON.stringify({ players: Object.fromEntries(this.players) });
    this._saveChain = this._saveChain.then(async () => {
      const tmp = this.playersPath + ".tmp";
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.rename(tmp, this.playersPath);
    });
    return this._saveChain;
  }

  async writeReplay(replay) {
    const file = path.join(this.replaysDir, `${replay.matchId}.json`);
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(replay), { mode: 0o600 });
    await fs.rename(tmp, file);
    return file;
  }

  async readReplay(matchId) {
    try {
      return JSON.parse(await fs.readFile(path.join(this.replaysDir, `${matchId}.json`), "utf8"));
    } catch {
      return null;
    }
  }

  async pruneReplays(now) {
    let removed = 0;
    for (const name of await fs.readdir(this.replaysDir)) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(this.replaysDir, name);
      try {
        const replay = JSON.parse(await fs.readFile(file, "utf8"));
        if (replay.expiresAt && replay.expiresAt <= now) {
          await fs.unlink(file);
          removed++;
        }
      } catch {
        /* unreadable replay files are left for a human, never deleted blind */
      }
    }
    return removed;
  }

  async logConnection(entry) {
    const line = JSON.stringify({ at: Date.now(), ...entry }) + "\n";
    await fs.appendFile(this.connLogPath, line, { mode: 0o600 }).catch(() => {});
  }

  async pruneConnLog(now) {
    try {
      const raw = await fs.readFile(this.connLogPath, "utf8");
      const kept = raw
        .split("\n")
        .filter((line) => {
          if (!line.trim()) return false;
          try {
            return now - JSON.parse(line).at < 72 * 3600 * 1000;
          } catch {
            return false;
          }
        })
        .join("\n");
      await fs.writeFile(this.connLogPath, kept ? kept + "\n" : "", { mode: 0o600 });
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  async logCanaryHit(entry) {
    const line = JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n";
    await fs.appendFile(this.canaryLogPath, line, { mode: 0o600 }).catch(() => {});
  }

  replayRetentionMs(mode, seasonEndsAt, now) {
    return mode === "ranked" ? Math.max(seasonEndsAt + 30 * DAY_MS, now + DAY_MS) : now + 7 * DAY_MS;
  }
}
