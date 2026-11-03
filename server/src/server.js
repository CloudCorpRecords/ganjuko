import http from "node:http";
import { readFileSync } from "node:fs";
import { Store } from "./store.js";
import { Relay } from "./relay.js";
import { loadConfig } from "./config.js";

// HTTP surface. Deliberately tiny:
//   GET  /            the privacy promise (TRUST §2.3) — publishable text
//   GET  /health      liveness + counts (no player data)
//   GET  /admin/stats, /admin/flags, /admin/replay/:id,
//   POST /admin/ban, /admin/unban    — Bearer ADMIN_TOKEN only; if no
//                     token is configured the routes do not exist (404).
//   Honeypot routes (/.env, /wp-login.php, /admin/backup, ...) — decoys.
//   They log every touch; the decoy material they serve carries the
//   canary token (CAN-GANJUKO-001 in the Canary Trap Log). Presenting
//   that token to a real admin route is a canary hit: logged as such
//   and refused like any other wrong token.
// The game protocol itself is WebSocket-only, at /arena.

const PRIVACY_PROMISE = `Ganjuko Battle Arena — versus relay

Ganjuko is made by one person, with AI help, and we say so out loud.
This server keeps only what it needs to run your matches: the display
name you pick, your public player ID, your rating, and replays of
matches so results can be checked. It never asks for your email, a
password, or payment details, and your save file never leaves your
computer. We don't sell data — there's barely any data to sell. If
this ever changes, we'll change this page first, in plain words,
before it happens.

Protocol: PROTOCOL.md in the ganjuko-versus-relay repo.
Health: /health
`;

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 16384) reject(new Error("body too large"));
      else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function createRelayServer({ config, gameData }) {
  const store = new Store(config.dataDir);
  const relay = new Relay({ config, store, gameData });

  const checkAdmin = (req, res) => {
    if (!config.adminToken) {
      json(res, 404, { error: "not found" });
      return false;
    }
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (config.canaryToken && token && token === config.canaryToken) {
      store.logCanaryHit({
        kind: "canary_token_presented",
        trap: "CAN-GANJUKO-001",
        ip: req.headers["fly-client-ip"] || req.socket.remoteAddress,
        path: req.url,
        ua: req.headers["user-agent"] || null,
      });
      json(res, 401, { error: "unauthorized" });
      return false;
    }
    if (token !== config.adminToken) {
      json(res, 401, { error: "unauthorized" });
      return false;
    }
    return true;
  };

  const honeypot = (req, res, decoyBody, contentType = "text/plain") => {
    store.logCanaryHit({
      kind: "honeypot_route_hit",
      trap: "CAN-GANJUKO-001",
      ip: req.headers["fly-client-ip"] || req.socket.remoteAddress,
      path: req.url,
      method: req.method,
      ua: req.headers["user-agent"] || null,
    });
    res.writeHead(200, { "content-type": contentType });
    res.end(decoyBody);
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://relay");
    const p = url.pathname;
    try {
      if (req.method === "GET" && p === "/") {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        return res.end(PRIVACY_PROMISE);
      }
      if (req.method === "GET" && p === "/health") return json(res, 200, relay.stats());

      // --- honeypots (checked before admin: /admin/backup is a decoy,
      // not a route; the real admin surface is listed below) ---
      if (p === "/.env" || p === "/config/.env" || p === "/admin/backup" || p === "/wp-login.php" || p === "/.git/config") {
        const decoy = [
          "# ganjuko relay — production backup (DO NOT COMMIT)",
          "ADMIN_TOKEN=" + (config.canaryToken || "unset"),
          "DATABASE_URL=postgres://relay:decoy@db.internal:5432/ganjuko",
          "FLY_API_TOKEN=fo1_decoy_do_not_use",
          "",
        ].join("\n");
        return honeypot(req, res, decoy);
      }

      // --- admin ---
      if (p === "/admin/stats" && req.method === "GET") {
        if (!checkAdmin(req, res)) return;
        return json(res, 200, { ...relay.stats(), store: { players: store.players.size } });
      }
      if (p === "/admin/flags" && req.method === "GET") {
        if (!checkAdmin(req, res)) return;
        const flags = [];
        for (const rec of store.players.values()) {
          if (rec.flags?.length) flags.push({ playerId: rec.playerId, flags: rec.flags });
        }
        return json(res, 200, { flags });
      }
      if (p.startsWith("/admin/replay/") && req.method === "GET") {
        if (!checkAdmin(req, res)) return;
        const replay = await store.readReplay(p.slice("/admin/replay/".length));
        if (!replay) return json(res, 404, { error: "no such replay" });
        return json(res, 200, replay);
      }
      if ((p === "/admin/ban" || p === "/admin/unban") && req.method === "POST") {
        if (!checkAdmin(req, res)) return;
        const body = JSON.parse(await readBody(req));
        const rec = store.getPlayer(body.playerId || "");
        if (!rec) return json(res, 404, { error: "no such player" });
        rec.banned = p === "/admin/ban";
        rec.updatedAt = Date.now();
        await store.save();
        return json(res, 200, { playerId: rec.playerId, banned: rec.banned });
      }

      return json(res, 404, { error: "not found" });
    } catch (err) {
      return json(res, 500, { error: "internal", detail: String(err?.message || err) });
    }
  });

  relay.attach(server);
  return { server, relay, store };
}

export async function main() {
  const config = loadConfig();
  const gameData = JSON.parse(
    readFileSync(new URL("../data/game-data.json", import.meta.url), "utf8")
  );
  const { server, store } = createRelayServer({ config, gameData });
  await store.init();
  setInterval(() => store.pruneReplays(Date.now()).catch(() => {}), 3600 * 1000).unref();
  setInterval(() => store.pruneConnLog(Date.now()).catch(() => {}), 3600 * 1000).unref();
  server.listen(config.port, config.host, () => {
    console.log(
      `ganjuko-versus-relay listening on ${config.host}:${config.port} (data: ${config.dataDir})`
    );
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
