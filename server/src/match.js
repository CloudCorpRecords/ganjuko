import { randomUUID } from "node:crypto";
import { CLOCKS, decideTimeResult, instinctAction } from "./timers.js";
import { ratingDeltas } from "./elo.js";
import { seasonWindow } from "./seasons.js";

// One witnessed match. The relay never resolves battles — both clients
// run the same battle code locally against the shared seed and report a
// state hash per turn (design A.5). The relay owns everything around
// that: pairing facts, the turn barrier, the clocks, desync recovery,
// forfeits, the result both sides agreed on, ratings, and the replay.
//
// Sessions are duck-typed: { playerId, displayName, send(obj),
// isOpen() }. All clock handling goes through the injected scheduler so
// tests can run matches in milliseconds and production runs real time.

const SIDES = ["P1", "P2"];
const other = (side) => (side === "P1" ? "P2" : "P1");

export class Match {
  constructor({ store, config, p1, p2, mode, format, band, scheduler }) {
    this.id = "m_" + randomUUID().replace(/-/g, "").slice(0, 16);
    this.store = store;
    this.config = config;
    this.mode = mode; // "casual" | "ranked"
    this.format = format; // "singles" | "doubles"
    this.pickCount = format === "singles" ? 3 : 4;
    this.activeCount = format === "singles" ? 1 : 2;
    this.band = band; // {name, index}
    this.scheduler = scheduler;
    this.players = {
      P1: { session: p1.session, playerId: p1.playerId, team: p1.team, bandIndex: p1.bandIndex, queueJoinedAt: p1.queueJoinedAt ?? null, picks: null, battleTeam: null },
      P2: { session: p2.session, playerId: p2.playerId, team: p2.team, bandIndex: p2.bandIndex, queueJoinedAt: p2.queueJoinedAt ?? null, picks: null, battleTeam: null },
    };
    this.phase = "picks"; // picks -> battle -> timeup -> ended
    this.turn = 0;
    this.seed = null;
    this.pendingActions = {};
    this.pendingHashes = {};
    this.history = []; // completed turns: {turn, actions} — the resume trail
    this.lastAgreedHash = null;
    this.strikes = { P1: 0, P2: 0 };
    this.banks = { P1: config.clocks.bankMs, P2: config.clocks.bankMs };
    this.decisionStart = 0;
    this.deadlines = { P1: 0, P2: 0 };
    this.desyncs = 0;
    this.startedAt = Date.now();
    this.totalDeadline = 0;
    this.timers = new Set();
    this.disconnected = { P1: false, P2: false };
    this.paused = false;
    this.claims = {};
    this.timeReports = {};
    this.events = []; // replay action stream
    this.result = null;
    this.turnTimers = new Set();
    this.onEnd = null; // set by the relay: cleanup + queue release
  }

  // ---------- plumbing ----------
  send(side, obj) {
    const s = this.players[side].session;
    if (s && s.isOpen()) s.send(obj);
  }
  broadcast(obj) {
    this.send("P1", obj);
    this.send("P2", obj);
  }
  later(ms, fn) {
    const t = this.scheduler.setTimeout(() => {
      this.timers.delete(t);
      this.turnTimers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
    return t;
  }
  laterTurn(ms, fn) {
    const t = this.later(ms, fn);
    this.turnTimers.add(t);
    return t;
  }
  clearTimers() {
    for (const t of this.timers) this.scheduler.clearTimeout(t);
    this.timers.clear();
    this.turnTimers.clear();
  }
  // Per-turn deadline timers must never leak into a later turn: a stale
  // decision deadline firing mid-turn would auto-act for a player who
  // still has time. Cleared whenever a turn opens or resolves.
  clearTurnTimers() {
    for (const t of this.turnTimers) {
      this.scheduler.clearTimeout(t);
      this.timers.delete(t);
    }
    this.turnTimers.clear();
  }
  logEvent(ev) {
    this.events.push({ at: Date.now(), ...ev });
  }

  opponentView(side) {
    const opp = this.players[other(side)];
    return {
      displayName: opp.session.displayName,
      playerId: opp.playerId,
      team: opp.team,
      band: { name: ["Sprout", "Bronze", "Silver", "Gold", "Masters"][opp.bandIndex], index: opp.bandIndex },
    };
  }

  start() {
    this.logEvent({ type: "match_found", mode: this.mode, format: this.format, band: this.band });
    // Casual shows an accept/decline step at Match Found (design A.3 —
    // the fairness valve for widened pairings). Ranked auto-accepts:
    // no dodging. That difference lives here, in the accept phase.
    this.requireAccept = this.mode === "casual";
    this.accepted = { P1: !this.requireAccept, P2: !this.requireAccept };
    for (const side of SIDES) {
      this.send(side, {
        type: "MATCH_FOUND",
        matchId: this.id,
        mode: this.mode,
        format: this.format,
        band: this.band,
        youAre: side,
        opponent: this.opponentView(side),
        acceptRequired: this.requireAccept,
        acceptMs: this.config.clocks.acceptMs,
      });
    }
    if (this.requireAccept) {
      this.phase = "accept";
      this.later(this.config.clocks.acceptMs, () => {
        if (this.phase === "accept") this.abort("accept_timeout");
      });
    } else {
      this.startPicks();
    }
  }

  handleAccept(side) {
    if (this.phase !== "accept") return;
    this.accepted[side] = true;
    this.logEvent({ type: "accept", side });
    if (this.accepted.P1 && this.accepted.P2) {
      this.clearTimers();
      this.startPicks();
    }
  }

  handleDecline(side) {
    if (this.phase !== "accept") return;
    this.logEvent({ type: "decline", side });
    this.abort("declined");
  }

  // A pairing that never became a battle: no replay, no ratings, no
  // record — as if the queue simply moved on. The relay requeues the
  // player who did accept (they asked for a match and behaved).
  abort(reason) {
    if (this.phase === "ended") return;
    this.phase = "ended";
    this.clearTimers();
    this.result = { winner: null, draw: false, reason: "aborted:" + reason };
    this.broadcast({ type: "MATCH_ABORTED", matchId: this.id, reason });
    if (this.onAbort) this.onAbort(this, { ...this.accepted });
    if (this.onEnd) this.onEnd(this);
  }

  startPicks() {
    this.phase = "picks";
    for (const side of SIDES) {
      this.send(side, {
        type: "PICK_OPEN",
        matchId: this.id,
        pickCount: this.pickCount,
        pickMs: this.config.clocks.pickMs,
        yourTeam: this.players[side].team,
        opponentTeam: this.players[other(side)].team,
      });
    }
    this.later(this.config.clocks.pickMs, () => {
      if (this.phase !== "picks") return;
      for (const side of SIDES) if (!this.players[side].picks) this.autoPick(side);
      this.beginBattle();
    });
  }

  autoPick(side) {
    const n = this.players[side].team.length;
    this.players[side].picks = Array.from({ length: Math.min(this.pickCount, n) }, (_, i) => i);
  }

  handlePick(side, picks) {
    if (this.phase !== "picks" || this.players[side].picks) return;
    this.players[side].picks = picks;
    this.logEvent({ type: "pick", side, picks });
    if (this.players.P1.picks && this.players.P2.picks) this.beginBattle();
  }

  beginBattle() {
    if (this.phase !== "picks") return;
    this.clearTimers();
    for (const side of SIDES) {
      const p = this.players[side];
      if (!p.picks) this.autoPick(side);
      p.battleTeam = p.picks.map((i) => p.team[i]);
    }
    this.seed = this.config.seedSource();
    this.activeCount = Math.min(
      this.activeCount,
      this.players.P1.battleTeam.length,
      this.players.P2.battleTeam.length
    );
    this.phase = "battle";
    this.turn = 1;
    this.totalDeadline = this.scheduler.now() + this.config.clocks.totalMs;
    this.later(this.config.clocks.totalMs, () => this.onTotalExpiry());
    for (const side of SIDES) {
      this.send(side, {
        type: "MATCH_START",
        matchId: this.id,
        seed: this.seed,
        youAre: side,
        format: this.format,
        mode: this.mode,
        band: this.band,
        yourTeam: this.players[side].battleTeam,
        opponentTeam: this.players[other(side)].battleTeam,
        opponent: {
          displayName: this.players[other(side)].session.displayName,
          playerId: this.players[other(side)].playerId,
        },
        clocks: {
          totalMs: this.config.clocks.totalMs,
          bankMs: this.config.clocks.bankMs,
          turnMs: this.config.clocks.turnMs,
        },
      });
    }
    this.logEvent({ type: "match_start", seed: this.seed });
    this.openTurn();
  }

  clocksSnapshot() {
    const now = this.scheduler.now();
    return {
      turn: this.turn,
      bankMs: { ...this.banks },
      totalLeftMs: Math.max(0, this.totalDeadline - now),
      strikes: { ...this.strikes },
    };
  }

  openTurn() {
    if (this.phase !== "battle") return;
    this.clearTurnTimers();
    this.pendingActions = {};
    this.pendingHashes = {};
    this.decisionStart = this.scheduler.now();
    for (const side of SIDES) {
      const byTurnCap = this.decisionStart + this.config.clocks.turnMs;
      const byBank = this.decisionStart + this.banks[side];
      this.deadlines[side] = Math.min(byTurnCap, byBank);
      const delay = Math.max(0, this.deadlines[side] - this.decisionStart);
      this.laterTurn(delay, () => this.onDecisionDeadline(side, byBank <= byTurnCap));
    }
    this.broadcast({
      type: "TURN_OPEN",
      matchId: this.id,
      turn: this.turn,
      clocks: this.clocksSnapshot(),
    });
  }

  onDecisionDeadline(side, bankBound) {
    if (this.phase !== "battle" || this.pendingActions[side]) return;
    if (bankBound) {
      this.banks[side] = 0;
      this.finish({ winner: other(side), reason: "time_bank", loser: side });
      return;
    }
    this.strikes[side] += 1;
    // Your-time drains while you think, acted or not: a silent turn
    // costs the full decision window from the bank.
    this.banks[side] = Math.max(0, this.banks[side] - this.config.clocks.turnMs);
    this.logEvent({ type: "timeout", side, turn: this.turn, strikes: this.strikes[side] });
    if (this.strikes[side] >= this.config.clocks.maxStrikes) {
      this.finish({ winner: other(side), reason: "forfeit_strikes", loser: side });
      return;
    }
    const auto = instinctAction(this.players[side].battleTeam, this.activeCount, this.format);
    this.submitAction(side, auto, { instinct: true });
  }

  submitAction(side, actions, meta = {}) {
    if (this.phase !== "battle" || this.pendingActions[side]) return false;
    const now = this.scheduler.now();
    if (!meta.instinct) {
      const spent = Math.min(now - this.decisionStart, this.config.clocks.turnMs, this.banks[side]);
      this.banks[side] = Math.max(0, this.banks[side] - spent);
      this.strikes[side] = 0;
    }
    this.pendingActions[side] = actions;
    this.logEvent({ type: "action", side, turn: this.turn, actions, instinct: !!meta.instinct });
    if (this.pendingActions.P1 && this.pendingActions.P2) {
      this.history.push({
        turn: this.turn,
        actions: { P1: this.pendingActions.P1, P2: this.pendingActions.P2 },
      });
      this.broadcast({
        type: "EXCHANGE",
        matchId: this.id,
        turn: this.turn,
        actions: { P1: this.pendingActions.P1, P2: this.pendingActions.P2 },
      });
    }
    return true;
  }

  handleAction(side, msg) {
    if (msg.turn !== this.turn) {
      this.send(side, { type: "ERROR", code: "wrong_turn", turn: this.turn });
      return;
    }
    if (!Array.isArray(msg.actions) || msg.actions.length !== this.activeCount) {
      this.send(side, {
        type: "ERROR",
        code: "bad_actions",
        detail: `expected ${this.activeCount} action(s), one per active slot`,
      });
      return;
    }
    this.submitAction(side, msg.actions);
  }

  handleHash(side, msg) {
    if (this.phase !== "battle" || msg.turn !== this.turn || this.pendingHashes[side]) return;
    this.pendingHashes[side] = msg.hash;
    this.logEvent({ type: "hash", side, turn: this.turn, hash: msg.hash, prngCalls: msg.prngCalls ?? null });
    const { P1, P2 } = this.pendingHashes;
    if (!P1 || !P2) return;
    if (P1 === P2) {
      this.lastAgreedHash = P1;
      this.logEvent({ type: "turn_agreed", turn: this.turn, hash: P1 });
      // If a BATTLE_END claim is already in, the battle is over: hold
      // the barrier and let the claim path settle (its window timer is
      // already running). Opening the next turn would auto-act a
      // finished battle.
      if (Object.keys(this.claims).length) return;
      this.turn += 1;
      this.openTurn();
    } else {
      this.onDesync();
    }
  }

  onDesync() {
    this.clearTurnTimers();
    this.desyncs += 1;
    this.logEvent({ type: "desync", turn: this.turn, count: this.desyncs, hashes: { ...this.pendingHashes } });
    if (this.desyncs >= 2) {
      this.finish({ winner: null, reason: "void_desync" });
      return;
    }
    this.phase = "desync";
    this.broadcast({ type: "DESYNC", matchId: this.id, turn: this.turn, attempt: this.desyncs });
    this.send("P1", { type: "SNAPSHOT_REQUEST", matchId: this.id, turn: this.turn });
    this.later(this.config.clocks.claimMs * 3, () => {
      if (this.phase === "desync") this.finish({ winner: null, reason: "void_desync_unresolved" });
    });
  }

  handleSnapshot(side, msg) {
    if (this.phase !== "desync" || side !== "P1" || msg.turn !== this.turn) return;
    this.logEvent({ type: "snapshot", turn: this.turn, state: msg.state });
    this.send("P2", { type: "SNAPSHOT", matchId: this.id, turn: this.turn, state: msg.state });
  }

  handleSnapshotAck(side, msg) {
    if (this.phase !== "desync" || side !== "P2" || msg.turn !== this.turn) return;
    this.clearTimers();
    this.phase = "battle";
    this.logEvent({ type: "resync", turn: this.turn });
    this.broadcast({ type: "RESYNCED", matchId: this.id, turn: this.turn });
    this.turn += 1;
    // The total clock kept its own timer through the desync pause; if it
    // lapsed during recovery the expiry handler already ran. Re-open.
    this.openTurn();
  }

  onTotalExpiry() {
    if (this.phase !== "battle" && this.phase !== "desync") return;
    this.phase = "timeup";
    this.timeReports = {};
    this.broadcast({ type: "TIME_UP", matchId: this.id, turn: this.turn });
    this.logEvent({ type: "time_up", turn: this.turn });
    this.later(this.config.clocks.claimMs, () => {
      if (this.phase === "timeup") this.finish({ winner: null, reason: "void_time_unresolved" });
    });
  }

  handleTimeResult(side, msg) {
    if (this.phase !== "timeup") return;
    // Each client reports BOTH sides from its own resolution; the two
    // reports must mirror or the honest state of the match is unknowable.
    this.timeReports[side] = msg.standing;
    const a = this.timeReports.P1;
    const b = this.timeReports.P2;
    if (!a || !b) return;
    const mirror =
      a.self.alive === b.opponent.alive &&
      a.self.hpPctSum === b.opponent.hpPctSum &&
      a.opponent.alive === b.self.alive &&
      a.opponent.hpPctSum === b.self.hpPctSum;
    if (!mirror) {
      this.finish({ winner: null, reason: "void_time_disagreement" });
      return;
    }
    const winner = decideTimeResult(a.self, a.opponent);
    this.finish({ winner: winner === "draw" ? null : winner, draw: winner === "draw", reason: "time" });
  }

  handleBattleEndClaim(side, msg) {
    if (this.phase !== "battle" && this.phase !== "desync") return;
    this.claims[side] = { winner: msg.winner, finalHash: msg.finalHash ?? null };
    this.logEvent({ type: "battle_end_claim", side, winner: msg.winner });
    const a = this.claims.P1;
    const b = this.claims.P2;
    if (a && b) {
      if (a.winner === b.winner && ["P1", "P2", "draw"].includes(a.winner)) {
        this.finish({
          winner: a.winner === "draw" ? null : a.winner,
          draw: a.winner === "draw",
          reason: "battle",
        });
      } else {
        this.finish({ winner: null, reason: "void_result_disagreement" });
      }
      return;
    }
    this.later(this.config.clocks.claimMs, () => {
      if (this.phase !== "ended" && Object.keys(this.claims).length === 1) {
        this.finish({ winner: null, reason: "void_result_unclaimed" });
      }
    });
  }

  // ---------- disconnect / reconnect ----------
  handleDisconnect(side, session) {
    if (this.phase === "ended") return;
    // A stale socket closing after the player already rejoined on a new
    // session is not a disconnect — the seat is occupied.
    if (session && this.players[side].session !== session) return;
    if (this.phase === "accept") {
      // Leaving at the Match Found screen is a decline, not a forfeit.
      this.abort("opponent_left");
      return;
    }
    this.disconnected[side] = true;
    this.logEvent({ type: "disconnect", side });
    this.send(other(side), {
      type: "OPPONENT_DISCONNECTED",
      matchId: this.id,
      graceMs: this.config.clocks.graceMs,
    });
    this.later(this.config.clocks.graceMs, () => {
      if (this.phase !== "ended" && this.disconnected[side]) {
        this.finish({ winner: other(side), reason: "forfeit_disconnect", loser: side });
      }
    });
  }

  handleReconnect(side, session) {
    if (this.phase === "ended") return false;
    this.players[side].session = session;
    this.disconnected[side] = false;
    this.logEvent({ type: "reconnect", side });
    // What does the rejoining side still owe the barrier? The resume
    // must say exactly, or the match can deadlock: a client that
    // dropped after EXCHANGE but before its HASH landed leaves the
    // turn barrier open forever unless the resume names the debt.
    const lastTurn = this.history[this.history.length - 1];
    const inflight = lastTurn && lastTurn.turn === this.turn ? lastTurn : null;
    const owesHash =
      this.phase === "battle" && !!inflight && !this.pendingHashes[side];
    const owesAction = this.phase === "battle" && !this.pendingActions[side];
    this.send(side, {
      type: "MATCH_RESUME",
      matchId: this.id,
      phase: this.phase,
      youAre: side,
      turn: this.turn,
      seed: this.seed,
      yourTeam: this.players[side].battleTeam || this.players[side].team,
      opponentTeam: this.players[other(side)].battleTeam || this.players[other(side)].team,
      owesAction,
      owesHash,
      owesPick: this.phase === "picks" && !this.players[side].picks,
      clocks: this.clocksSnapshot(),
      // Deterministic rebuild trail: the rejoining client re-seeds from
      // `seed` and replays every completed turn's exchanged actions to
      // reconstruct the exact current state (PROTOCOL.md §8). If
      // owesHash is set, the LAST history entry is the in-flight turn:
      // replay the rest as completed, resolve that one, and hash it.
      resumeFrom: {
        turns: this.history,
        lastAgreedHash: this.lastAgreedHash,
      },
    });
    this.send(other(side), { type: "OPPONENT_RECONNECTED", matchId: this.id });
    if (owesHash || owesAction) {
      // A rejoined client gets one fresh decision window to pay its
      // debt; silence after that is abandonment, not a stall. The
      // check is pinned to the turn the debt belongs to: if the turn
      // has advanced, the debt was paid by definition (the barrier
      // cannot move without it), and a later turn's open barrier must
      // never trip the old wire.
      const debtTurn = this.turn;
      this.later(this.config.clocks.turnMs, () => {
        if (this.phase !== "battle" || this.disconnected[side]) return;
        if (this.turn !== debtTurn) return;
        if (owesAction && !this.pendingActions[side]) {
          this.finish({ winner: other(side), reason: "forfeit_abandoned", loser: side });
        } else if (owesHash && !this.pendingHashes[side]) {
          this.finish({ winner: other(side), reason: "forfeit_abandoned", loser: side });
        }
      });
    }
    return true;
  }

  sideOf(playerId) {
    if (this.players.P1.playerId === playerId) return "P1";
    if (this.players.P2.playerId === playerId) return "P2";
    return null;
  }

  // ---------- settlement ----------
  async finish({ winner, draw = false, reason, loser = null }) {
    if (this.phase === "ended") return;
    this.phase = "ended";
    this.clearTimers();
    this.result = { winner, draw, reason };
    this.logEvent({ type: "match_end", winner, draw, reason });

    let rating = null;
    const recA = this.store.getPlayer(this.players.P1.playerId);
    const recB = this.store.getPlayer(this.players.P2.playerId);
    if (this.mode === "ranked" && recA && recB && reason !== "void_desync" && !String(reason).startsWith("void")) {
      const scoreA = draw ? 0.5 : winner === "P1" ? 1 : 0;
      const scoreB = draw ? 0.5 : winner === "P2" ? 1 : 0;
      const deltas = ratingDeltas(
        recA,
        recB,
        this.players.P1.bandIndex,
        this.players.P2.bandIndex,
        scoreA,
        scoreB
      );
      recA.rating += deltas.a;
      recB.rating += deltas.b;
      recA.best = Math.max(recA.best, recA.rating);
      recB.best = Math.max(recB.best, recB.rating);
      recA.seasonBest = Math.max(recA.seasonBest ?? recA.rating, recA.rating);
      recB.seasonBest = Math.max(recB.seasonBest ?? recB.rating, recB.rating);
      if (draw) {
        recA.d += 1;
        recB.d += 1;
      } else if (winner === "P1") {
        recA.w += 1;
        recB.l += 1;
      } else {
        recB.w += 1;
        recA.l += 1;
      }
      rating = {
        P1: { before: recA.rating - deltas.a, after: recA.rating, delta: deltas.a },
        P2: { before: recB.rating - deltas.b, after: recB.rating, delta: deltas.b },
      };
    }
    if (recA) recA.rankedThisSeason += this.mode === "ranked" ? 1 : 0;
    if (recB) recB.rankedThisSeason += this.mode === "ranked" ? 1 : 0;
    if (recA) recA.casualThisSeason += this.mode === "casual" ? 1 : 0;
    if (recB) recB.casualThisSeason += this.mode === "casual" ? 1 : 0;
    if (recA) recA.updatedAt = Date.now();
    if (recB) recB.updatedAt = Date.now();
    await this.store.save();

    const season = seasonWindow(recA?.season ?? 0, this.config.seasonEpochMs);
    const replay = {
      matchId: this.id,
      mode: this.mode,
      format: this.format,
      band: this.band,
      players: {
        P1: { playerId: this.players.P1.playerId, displayName: this.players.P1.session.displayName },
        P2: { playerId: this.players.P2.playerId, displayName: this.players.P2.session.displayName },
      },
      teams: { P1: this.players.P1.team, P2: this.players.P2.team },
      seed: this.seed,
      events: this.events,
      result: this.result,
      rating,
      startedAt: this.startedAt,
      endedAt: Date.now(),
      expiresAt: this.store.replayRetentionMs(this.mode, season.endsAt ?? Date.now(), Date.now()),
    };
    await this.store.writeReplay(replay).catch(() => {});

    for (const side of SIDES) {
      this.send(side, {
        type: "MATCH_END",
        matchId: this.id,
        youAre: side,
        result: draw ? "draw" : winner ? (winner === side ? "win" : "loss") : "void",
        winner,
        reason,
        rating: rating ? rating[side] : null,
      });
    }
    if (this.onEnd) this.onEnd(this);
  }
}
