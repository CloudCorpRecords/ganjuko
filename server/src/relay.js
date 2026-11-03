import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import { playerIdFromPubkey, verifyMessage } from "./identity.js";
import { validateTeam, validatePicks, validateDisplayName } from "./validate.js";
import { bandForTeam, tierFor } from "./elo.js";
import { applyRollover, seasonAt, seasonWindow } from "./seasons.js";
import { QueueManager } from "./queue.js";
import { Match } from "./match.js";

const realScheduler = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

// Message types a client may sign-and-send after IDENT. Signatures are
// verified per message type with the session's public key (TRUST §3.1):
// a borrowed connection cannot forge actions for someone else's team.
const SIGNED_TYPES = new Set([
  "QUEUE_JOIN",
  "PICK",
  "ACTION",
  "HASH",
  "SNAPSHOT",
  "SNAPSHOT_ACK",
  "BATTLE_END",
  "TIME_RESULT",
  "REJOIN",
]);

export class Relay {
  constructor({ config, store, gameData }) {
    this.config = config;
    this.store = store;
    this.gameData = gameData;
    this.sessions = new Set();
    this.sessionsByPlayer = new Map();
    this.matches = new Set();
    this.queue = new QueueManager({ widenAfterMs: config.widenMs });
    this.joinWindows = new Map(); // key -> [timestamps]
    this.startedAt = Date.now();
    this._pairTimer = null;
  }

  attach(httpServer) {
    this.wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
    httpServer.on("upgrade", (req, socket, head) => {
      const url = new URL(req.url, "http://relay");
      if (url.pathname !== "/arena") {
        socket.destroy();
        return;
      }
      this.wss.handleUpgrade(req, socket, head, (ws) => this.onConnection(ws, req));
    });
    this._pairTimer = setInterval(() => this.pairPass(), 500);
    this._pairTimer.unref?.();
  }

  clientIp(req) {
    return (
      req.headers["fly-client-ip"] ||
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  onConnection(ws, req) {
    const session = {
      id: randomUUID(),
      ws,
      ip: this.clientIp(req),
      playerId: null,
      rawPubkey: null,
      displayName: null,
      match: null,
      side: null,
      tokens: this.config.msgBurst,
      lastRefill: Date.now(),
      strikes: 0,
      isOpen: () => ws.readyState === ws.OPEN,
      send: (obj) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
      },
    };
    this.sessions.add(session);
    this.store.logConnection({ event: "connect", ip: session.ip });
    ws.send(
      JSON.stringify({
        type: "HELLO",
        nonce: randomUUID() + randomUUID(),
        serverVersion: "ganjuko-relay/1.0.0",
        season: seasonAt(Date.now(), this.config.seasonEpochMs),
        contentHashExpected: this.gameData.contentHash,
      })
    );
    ws.on("message", (data) => this.onMessage(session, data).catch(() => {}));
    ws.on("close", () => this.onClose(session));
    ws.on("error", () => {});
  }

  error(session, code, detail) {
    session.send({ type: "ERROR", code, ...(detail ? { detail } : {}) });
  }

  strike(session, code) {
    session.strikes += 1;
    this.error(session, code);
    if (session.strikes >= 5) session.ws.close(1008, "protocol violations");
  }

  rateOk(session) {
    const now = Date.now();
    const refill = ((now - session.lastRefill) / 1000) * this.config.msgRatePerSec;
    session.tokens = Math.min(this.config.msgBurst, session.tokens + refill);
    session.lastRefill = now;
    if (session.tokens < 1) return false;
    session.tokens -= 1;
    return true;
  }

  joinRateOk(key) {
    const now = Date.now();
    const win = (this.joinWindows.get(key) || []).filter((t) => now - t < 60000);
    if (win.length >= this.config.joinsPerMin) {
      this.joinWindows.set(key, win);
      return false;
    }
    win.push(now);
    this.joinWindows.set(key, win);
    return true;
  }

  verifySigned(session, msg) {
    const { sig, ...rest } = msg;
    const body = { ...rest };
    delete body.type;
    return verifyMessage(
      session.rawPubkey,
      { type: msg.type, matchId: msg.matchId ?? null, turn: msg.turn ?? null, body },
      sig || ""
    );
  }

  async onMessage(session, data) {
    const rawLen = Buffer.byteLength(data.toString());
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return this.strike(session, "bad_json");
    }
    const limit = msg.type === "SNAPSHOT" ? this.config.maxSnapshotBytes : this.config.maxMsgBytes;
    if (rawLen > limit) return this.strike(session, "message_too_large");
    if (!this.rateOk(session)) return this.strike(session, "rate_limited");
    if (!msg || typeof msg.type !== "string") return this.strike(session, "bad_message");

    if (msg.type === "IDENT") return this.handleIdent(session, msg);
    if (!session.playerId) return this.error(session, "not_identified");
    if (SIGNED_TYPES.has(msg.type) && !this.verifySigned(session, msg)) {
      return this.strike(session, "bad_signature");
    }

    switch (msg.type) {
      case "QUEUE_JOIN":
        return this.handleQueueJoin(session, msg);
      case "QUEUE_LEAVE":
        this.queue.remove(session.playerId);
        session.send({ type: "QUEUE_LEFT" });
        return;
      case "QUEUE_ACCEPT":
        if (session.match) session.match.handleAccept(session.side);
        return;
      case "QUEUE_DECLINE":
        if (session.match) session.match.handleDecline(session.side);
        return;
      case "PICK":
        return this.handlePick(session, msg);
      case "ACTION":
        if (session.match) session.match.handleAction(session.side, msg);
        return;
      case "HASH":
        if (session.match) session.match.handleHash(session.side, msg);
        return;
      case "SNAPSHOT":
        if (session.match) session.match.handleSnapshot(session.side, msg);
        return;
      case "SNAPSHOT_ACK":
        if (session.match) session.match.handleSnapshotAck(session.side, msg);
        return;
      case "BATTLE_END":
        if (session.match) session.match.handleBattleEndClaim(session.side, msg);
        return;
      case "TIME_RESULT":
        if (session.match) session.match.handleTimeResult(session.side, msg);
        return;
      case "REJOIN":
        return this.handleRejoin(session, msg);
      case "PING":
        session.send({ type: "PONG", at: Date.now() });
        return;
      default:
        return this.error(session, "unknown_type");
    }
  }

  handleIdent(session, msg) {
    let rawPub;
    try {
      rawPub = Buffer.from(msg.pubkey || "", "base64");
    } catch {
      rawPub = Buffer.alloc(0);
    }
    if (rawPub.length !== 32) return this.error(session, "bad_pubkey");
    const playerId = playerIdFromPubkey(rawPub);
    const body = { pubkey: msg.pubkey, displayName: msg.displayName, contentHash: msg.contentHash ?? null };
    if (!verifyMessage(rawPub, { type: "IDENT", matchId: null, turn: null, body }, msg.sig || "")) {
      return this.error(session, "bad_signature");
    }
    if (!validateDisplayName(msg.displayName)) {
      return this.error(session, "bad_display_name", "1..12 visible characters");
    }
    const existing = this.store.getPlayer(playerId);
    if (existing && existing.pubkey !== msg.pubkey) {
      // Same ID, different key bytes cannot happen (ID derives from the
      // key) — but a record planted by an admin tool must never be
      // adopted by a stranger's key. Fail closed.
      return this.error(session, "identity_conflict");
    }
    if (existing?.banned) {
      session.send({ type: "IDENT_REJECTED", code: "banned" });
      session.ws.close(1008, "banned");
      return;
    }
    if (
      this.config.contentHashes.size > 0 &&
      msg.contentHash &&
      !this.config.contentHashes.has(msg.contentHash)
    ) {
      session.send({
        type: "IDENT_REJECTED",
        code: "content_mismatch",
        detail: "This build's data doesn't match the Arena — update to play online.",
      });
      session.ws.close(1008, "content mismatch");
      return;
    }
    session.playerId = playerId;
    session.rawPubkey = rawPub;
    session.displayName = msg.displayName.trim();
    const prev = this.sessionsByPlayer.get(playerId);
    if (prev && prev !== session) prev.ws.close(1000, "superseded");
    this.sessionsByPlayer.set(playerId, session);
    const rec = this.store.ensurePlayer(playerId, {
      displayName: session.displayName,
      pubkeyB64: msg.pubkey,
    });
    applyRollover(rec, Date.now(), this.config.seasonEpochMs);
    rec.lastContentHash = msg.contentHash ?? null;
    rec.updatedAt = Date.now();
    this.store.save();
    this.store.logConnection({ event: "ident", ip: session.ip, playerId });
    session.send({
      type: "IDENT_OK",
      playerId,
      displayName: session.displayName,
      rating: rec.rating,
      tier: tierFor(rec.rating),
      season: seasonWindow(rec.season, this.config.seasonEpochMs),
      record: { w: rec.w, l: rec.l, d: rec.d },
    });
  }

  handleQueueJoin(session, msg) {
    if (session.match) return this.error(session, "already_in_match");
    if (!this.joinRateOk("id:" + session.playerId) || !this.joinRateOk("ip:" + session.ip)) {
      return this.error(session, "join_rate_limited");
    }
    const mode = msg.mode;
    const format = msg.format;
    if (!["casual", "ranked"].includes(mode) || !["singles", "doubles"].includes(format)) {
      return this.error(session, "bad_mode_or_format");
    }
    const pickCount = format === "singles" ? 3 : 4;
    const check = validateTeam(msg.team, this.gameData, { ranked: mode === "ranked" });
    if (!check.ok) {
      session.send({ type: "QUEUE_ERROR", code: "team_invalid", errors: check.errors });
      return;
    }
    if (msg.team.length < pickCount) {
      session.send({
        type: "QUEUE_ERROR",
        code: "team_too_small",
        errors: [`${format} fields ${pickCount} creatures — register at least ${pickCount}`],
      });
      return;
    }
    const band = bandForTeam(msg.team);
    const rec = this.store.getPlayer(session.playerId);
    this.queue.add({
      playerId: session.playerId,
      session,
      mode,
      format,
      bandIndex: band.index,
      rating: rec ? rec.rating : 1500,
      team: msg.team,
      teamFlags: check.flags,
    });
    session.send({
      type: "QUEUED",
      mode,
      format,
      band: { name: band.name, index: band.index },
      widenAfterMs: this.config.widenMs,
    });
  }

  handlePick(session, msg) {
    if (!session.match) return;
    const match = session.match;
    const err = validatePicks(msg.picks, match.players[session.side].team.length, match.pickCount);
    if (err) return this.error(session, "bad_picks", err);
    match.handlePick(session.side, msg.picks);
  }

  handleRejoin(session, msg) {
    for (const match of this.matches) {
      const side = match.sideOf(session.playerId);
      if (side && match.id === msg.matchId) {
        session.match = match;
        session.side = side;
        match.handleReconnect(side, session);
        return;
      }
    }
    this.error(session, "no_such_match", "the match is over or never existed");
  }

  pairPass() {
    const pairs = this.queue.pairPass((entry) => {
      entry.session.send({
        type: "QUEUE_WIDENED",
        band: entry.bandIndex,
        detail: "Search widened — you may meet a stronger band.",
      });
    });
    for (const [a, b] of pairs) this.createMatch(a, b);
  }

  createMatch(entryA, entryB) {
    const bandIndex = Math.max(entryA.bandIndex, entryB.bandIndex);
    const bandNames = ["Sprout", "Bronze", "Silver", "Gold", "Masters"];
    const match = new Match({
      store: this.store,
      config: {
        clocks: this.config.clocks,
        seedSource: this.config.seedSource,
        seasonEpochMs: this.config.seasonEpochMs,
      },
      p1: { session: entryA.session, playerId: entryA.playerId, team: entryA.team, bandIndex: entryA.bandIndex, queueJoinedAt: entryA.joinedAt },
      p2: { session: entryB.session, playerId: entryB.playerId, team: entryB.team, bandIndex: entryB.bandIndex, queueJoinedAt: entryB.joinedAt },
      mode: entryA.mode,
      format: entryA.format,
      band: { name: bandNames[bandIndex], index: bandIndex },
      scheduler: realScheduler,
    });
    match.onEnd = (m) => {
      this.matches.delete(m);
      for (const side of ["P1", "P2"]) {
        const s = m.players[side].session;
        if (s && s.match === m) {
          s.match = null;
          s.side = null;
        }
      }
    };
    match.onAbort = (m, accepted) => {
      // The accepter asked for a match and behaved — back into the
      // queue with their original wait intact.
      for (const side of ["P1", "P2"]) {
        if (!accepted[side]) continue;
        const p = m.players[side];
        // onAbort runs before onEnd clears session.match, so the
        // aborting match itself must not count as "busy".
        if (p.session.isOpen() && (p.session.match === null || p.session.match === m)) {
          this.queue.add({
            playerId: p.playerId,
            session: p.session,
            mode: m.mode,
            format: m.format,
            bandIndex: p.bandIndex,
            rating: this.store.getPlayer(p.playerId)?.rating ?? 1500,
            team: p.team,
            teamFlags: [],
            joinedAt: p.queueJoinedAt,
          });
        }
      }
    };
    entryA.session.match = match;
    entryA.session.side = "P1";
    entryB.session.match = match;
    entryB.session.side = "P2";
    this.matches.add(match);
    match.start();
  }

  onClose(session) {
    this.sessions.delete(session);
    if (session.playerId && this.sessionsByPlayer.get(session.playerId) === session) {
      this.sessionsByPlayer.delete(session.playerId);
    }
    if (session.playerId) this.queue.remove(session.playerId);
    if (session.match) {
      const match = session.match;
      session.match = null;
      match.handleDisconnect(session.side, session);
    }
    this.store.logConnection({ event: "disconnect", ip: session.ip, playerId: session.playerId });
  }

  stats() {
    return {
      ok: true,
      service: "ganjuko-versus-relay",
      version: "1.0.0",
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      season: seasonAt(Date.now(), this.config.seasonEpochMs),
      players: this.store.players.size,
      queued: this.queue.size(),
      matches: this.matches.size,
      sessions: this.sessions.size,
    };
  }
}
