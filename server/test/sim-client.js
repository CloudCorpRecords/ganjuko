// Simulated Arena client for the relay test-suite. This is a PROTOCOL
// test double, not the game: it implements the client half of
// PROTOCOL.md faithfully (Ed25519 identity, signed messages, pick
// phase, lockstep actions, per-turn state hashes, desync snapshot
// adoption, time-up reports, battle-end claims) against a deliberately
// tiny deterministic battle resolution, so two instances computing
// independently must agree on every hash — which is the property the
// relay exists to witness.
import WebSocket from "ws";
import { generateIdentity, signMessage } from "../src/identity.js";
import { CountedRng } from "../src/prng.js";
import { canonicalStateString, hashState, parseCanonicalStateString } from "../src/hash.js";
import { unifiedParam } from "../src/validate.js";

export function legalTeam(gameData, speciesIds, level, { iv = 16, ev = 0 } = {}) {
  const stats = ["hp", "mp", "atk", "def", "mat", "mdf", "agi"];
  return speciesIds.map((speciesId) => {
    const sp = gameData.species[speciesId];
    const params = stats.map((stat) => {
      let v = unifiedParam(sp.baseMax[stat], stat, level);
      if (stat !== "mp") v += Math.floor((iv * level) / 100) + Math.floor((Math.floor(ev / 4) * level) / 100);
      return v;
    });
    return {
      speciesId,
      nickname: null,
      level,
      params,
      moves: sp.learnset.slice(0, 4),
      trait: "Stoic",
    };
  });
}

const pseudoPower = (skillId) => ((skillId * 37) % 50) + 40;

export class MiniBattle {
  constructor({ seed, format, mySide, teams }) {
    this.seed = seed;
    this.format = format;
    this.mySide = mySide;
    this.rng = new CountedRng(seed);
    this.turn = 0;
    this.members = [];
    for (const side of ["P1", "P2"]) {
      teams[side].forEach((m, idx) => {
        this.members.push({
          side,
          idx,
          speciesId: m.speciesId,
          level: m.level,
          hp: m.params[0],
          maxHp: m.params[0],
          mp: m.params[1],
          status: [],
          alive: true,
          params: m.params,
          moves: m.moves,
        });
      });
    }
    const activesPerSide = format === "singles" ? 1 : 2;
    this.actives = {
      P1: Array.from({ length: activesPerSide }, (_, i) => i),
      P2: Array.from({ length: activesPerSide }, (_, i) => i),
    };
    this.winner = null;
  }

  memberAt(side, teamIdx) {
    return this.members.find((m) => m.side === side && m.idx === teamIdx);
  }

  chooseActions() {
    const opp = this.mySide === "P1" ? "P2" : "P1";
    return this.actives[this.mySide].map((teamIdx, slot) => {
      const me = this.memberAt(this.mySide, teamIdx);
      const skillId = me.moves.reduce((a, b) => (pseudoPower(a) >= pseudoPower(b) ? a : b));
      const targetSlot = this.actives[opp].findIndex((ti) => this.memberAt(opp, ti).alive);
      return { slot, kind: "fight", skillId, target: { side: "opp", slot: Math.max(0, targetSlot) } };
    });
  }

  resolve(actions) {
    const queue = [];
    for (const side of ["P1", "P2"]) {
      const opp = side === "P1" ? "P2" : "P1";
      (actions[side] || []).forEach((action, slot) => {
        const teamIdx = this.actives[side][slot];
        if (teamIdx == null) return;
        const member = this.memberAt(side, teamIdx);
        queue.push({ side, opp, slot, member, action });
      });
    }
    queue.sort(
      (a, b) =>
        b.member.params[6] - a.member.params[6] ||
        (a.side === b.side ? a.slot - b.slot : a.side === "P1" ? -1 : 1)
    );
    for (const item of queue) {
      const attacker = item.member;
      if (!attacker.alive || item.action.kind !== "fight") continue;
      let targetIdx = this.actives[item.opp][item.action.target?.slot ?? 0];
      let target = targetIdx != null ? this.memberAt(item.opp, targetIdx) : null;
      if (!target || !target.alive) {
        const alt = this.actives[item.opp].find((ti) => this.memberAt(item.opp, ti).alive);
        if (alt == null) continue;
        target = this.memberAt(item.opp, alt);
      }
      const roll = 0.85 + 0.15 * this.rng.next();
      const dmg = Math.max(
        1,
        Math.floor(pseudoPower(item.action.skillId) * (attacker.params[2] / Math.max(1, target.params[3])) * roll)
      );
      target.hp = Math.max(0, target.hp - dmg);
      if (target.hp === 0) target.alive = false;
    }
    // End-of-turn replacements: next living bench member takes the slot.
    for (const side of ["P1", "P2"]) {
      const next = [...this.actives[side]];
      for (let slot = 0; slot < next.length; slot++) {
        if (this.memberAt(side, next[slot]).alive) continue;
        const bench = this.members.find(
          (m) => m.side === side && m.alive && !next.includes(m.idx)
        );
        if (bench) next[slot] = bench.idx;
      }
      this.actives[side] = next;
    }
    const aliveCount = (side) => this.members.filter((m) => m.side === side && m.alive).length;
    if (aliveCount("P1") === 0 && aliveCount("P2") === 0) this.winner = "draw";
    else if (aliveCount("P1") === 0) this.winner = "P2";
    else if (aliveCount("P2") === 0) this.winner = "P1";
  }

  standing() {
    const view = (side) => {
      const mine = this.members.filter((m) => m.side === side);
      return {
        alive: mine.filter((m) => m.alive).length,
        hpPctSum: mine.reduce((s, m) => s + Math.floor((100 * m.hp) / m.maxHp), 0),
      };
    };
    return { self: view(this.mySide), opponent: view(this.mySide === "P1" ? "P2" : "P1") };
  }

  canonicalState() {
    return {
      turn: this.turn,
      actives: this.actives,
      members: this.members.map((m) => ({
        side: m.side,
        speciesId: m.speciesId,
        level: m.level,
        hp: m.hp,
        mp: m.mp,
        status: m.status,
        alive: m.alive,
      })),
      prngCalls: this.rng.calls,
    };
  }

  hash() {
    return hashState(this.canonicalState());
  }

  snapshotString() {
    return canonicalStateString(this.canonicalState());
  }

  applySnapshot(text) {
    const parsed = parseCanonicalStateString(text);
    parsed.members.forEach((pm, i) => {
      const m = this.members[i];
      m.hp = pm.hp;
      m.mp = pm.mp;
      m.status = pm.status;
      m.alive = pm.alive;
    });
    this.actives = parsed.actives;
    this.rng = CountedRng.atPosition(this.seed, parsed.prngCalls);
    this.winner = null;
    const aliveCount = (side) => this.members.filter((m) => m.side === side && m.alive).length;
    if (aliveCount("P1") === 0 && aliveCount("P2") === 0) this.winner = "draw";
    else if (aliveCount("P1") === 0) this.winner = "P2";
    else if (aliveCount("P2") === 0) this.winner = "P1";
  }
}

export class SimClient {
  constructor(url, { displayName = "Tester", gameData, identity, autoAccept = true, actionDelayMs = 0 } = {}) {
    this.url = url;
    this.gameData = gameData;
    this.identity = identity || generateIdentity();
    this.autoAccept = autoAccept;
    this.actionDelayMs = actionDelayMs;
    this.displayName = displayName;
    this.inbox = [];
    this.waiters = [];
    this.hello = null;
    this.identOk = null;
    this.matchId = null;
    this.side = null;
    this.battle = null;
    this.format = null;
    this.mode = null;
    this.tamperTurns = new Set();
    this.actInMatch = true; // timeout tests switch this off
    this.seen = []; // every message, for assertions
    this.matchEnd = null;
    this.desyncs = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.on("open", resolve);
      this.ws.on("error", reject);
      this.ws.on("message", (data) => this.onMessage(JSON.parse(data.toString())));
    });
  }

  onMessage(msg) {
    this.seen.push(msg);
    this.inbox.push(msg);
    this.waiters = this.waiters.filter((w) => !w(msg));
    this.drive(msg).catch(() => {});
  }

  waitFor(type, timeoutMs = 15000, pred = () => true) {
    const existing = this.inbox.find((m) => m.type === type && pred(m));
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs);
      this.waiters.push((m) => {
        if (m.type === type && pred(m)) {
          clearTimeout(timer);
          resolve(m);
          return true;
        }
        return false;
      });
    });
  }

  // Outbound pacing: the relay enforces the design's ≤4 messages/second
  // (TRUST §3.4). A real game client is naturally slower than that —
  // every turn renders — but this test double would happily fire
  // machine-gun turns, so it paces itself like a polite client.
  sendRaw(obj) {
    const PACE_MS = 255;
    this._sendChain = (this._sendChain || Promise.resolve()).then(
      () =>
        new Promise((resolve) => {
          const wait = Math.max(0, PACE_MS - (Date.now() - (this._lastSentAt || 0)));
          setTimeout(() => {
            this._lastSentAt = Date.now();
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
              this.ws.send(JSON.stringify(obj));
            }
            resolve();
          }, wait);
        })
    );
    return this._sendChain;
  }

  sendSigned(type, fields = {}) {
    const msg = { type, ...fields };
    msg.sig = signMessage(this.identity.privateKey, {
      type,
      matchId: fields.matchId ?? null,
      turn: fields.turn ?? null,
      body: { ...fields },
    });
    this.sendRaw(msg);
    return msg;
  }

  async ident(contentHash) {
    this.hello = await this.waitFor("HELLO");
    const body = {
      pubkey: this.identity.pubkeyB64,
      displayName: this.displayName,
      contentHash: contentHash ?? this.gameData?.contentHash ?? null,
    };
    const sig = signMessage(this.identity.privateKey, { type: "IDENT", matchId: null, turn: null, body });
    this.sendRaw({ type: "IDENT", ...body, sig });
    this.identOk = await this.waitFor("IDENT_OK");
    return this.identOk;
  }

  queueJoin({ mode, format, team }) {
    this.mode = mode;
    this.format = format;
    this.sendSigned("QUEUE_JOIN", { mode, format, team });
  }

  // The per-match driver: reacts to relay messages until MATCH_END.
  async drive(msg) {
    switch (msg.type) {
      case "MATCH_FOUND":
        this.matchId = msg.matchId;
        this.side = msg.youAre;
        if (msg.acceptRequired && this.autoAccept) this.sendRaw({ type: "QUEUE_ACCEPT" });
        break;
      case "PICK_OPEN": {
        const pickCount = msg.pickCount;
        this.sendSigned("PICK", {
          matchId: this.matchId,
          picks: Array.from({ length: pickCount }, (_, i) => i),
        });
        break;
      }
      case "MATCH_START": {
        this.battle = new MiniBattle({
          seed: msg.seed,
          format: msg.format,
          mySide: msg.youAre,
          teams: { [msg.youAre]: msg.yourTeam, [msg.youAre === "P1" ? "P2" : "P1"]: msg.opponentTeam },
        });
        break;
      }
      case "TURN_OPEN": {
        if (!this.battle || this.battle.winner) break;
        // Turn tracking is battle state, not a choice: it advances even
        // for a client that will be auto-played this turn. (A silent
        // client that left its counter at 0 produced a different —
        // genuinely different — state hash, and the relay was right to
        // call it a desync. The counter now also re-syncs at EXCHANGE.)
        this.battle.turn = msg.turn;
        if (!this.actInMatch) break;
        const actions = this.battle.chooseActions();
        const send = () =>
          this.sendSigned("ACTION", { matchId: this.matchId, turn: msg.turn, actions });
        if (this.actionDelayMs > 0) setTimeout(send, this.actionDelayMs);
        else send();
        break;
      }
      case "EXCHANGE": {
        if (!this.battle) break;
        this.battle.turn = msg.turn;
        this.battle.resolve(msg.actions);
        if (this.tamperTurns.has(msg.turn) && this.side === "P2") {
          const mine = this.battle.members.find((m) => m.side === "P2");
          mine.hp = Math.min(mine.maxHp, mine.hp + 37);
          mine.alive = mine.hp > 0;
        }
        this.sendSigned("HASH", {
          matchId: this.matchId,
          turn: msg.turn,
          hash: this.battle.hash(),
          prngCalls: this.battle.rng.calls,
        });
        if (this.battle.winner) {
          this.sendSigned("BATTLE_END", {
            matchId: this.matchId,
            winner: this.battle.winner,
            finalHash: this.battle.hash(),
          });
        }
        break;
      }
      case "DESYNC":
        this.desyncs += 1;
        break;
      case "SNAPSHOT_REQUEST":
        this.sendSigned("SNAPSHOT", {
          matchId: this.matchId,
          turn: msg.turn,
          state: this.battle.snapshotString(),
        });
        break;
      case "SNAPSHOT":
        this.battle.applySnapshot(msg.state);
        this.sendSigned("SNAPSHOT_ACK", { matchId: this.matchId, turn: msg.turn });
        break;
      case "TIME_UP":
        this.sendSigned("TIME_RESULT", { matchId: this.matchId, standing: this.battle.standing() });
        break;
      case "MATCH_END":
        this.matchEnd = msg;
        break;
      case "MATCH_RESUME": {
        this.matchId = msg.matchId;
        this.side = msg.youAre;
        if (!this.battle && msg.resumeFrom && msg.seed != null) {
          const oppSide = msg.youAre === "P1" ? "P2" : "P1";
          this.battle = new MiniBattle({
            seed: msg.seed,
            format: this.format || "singles",
            mySide: msg.youAre,
            teams: { [msg.youAre]: msg.yourTeam, [oppSide]: msg.opponentTeam },
          });
          // Replay completed turns. If a hash is owed, the LAST history
          // entry is the in-flight turn: hold it back, resolve it after
          // the rebuild, and pay the hash debt.
          const turns = [...msg.resumeFrom.turns];
          const inflight = msg.owesHash && turns.length ? turns[turns.length - 1] : null;
          const completed = inflight ? turns.slice(0, -1) : turns;
          for (const past of completed) {
            this.battle.turn = past.turn;
            this.battle.resolve(past.actions);
          }
          if (inflight) {
            this.battle.turn = inflight.turn;
            this.battle.resolve(inflight.actions);
            this.sendSigned("HASH", {
              matchId: this.matchId,
              turn: inflight.turn,
              hash: this.battle.hash(),
              prngCalls: this.battle.rng.calls,
            });
            if (this.battle.winner) {
              this.sendSigned("BATTLE_END", {
                matchId: this.matchId,
                winner: this.battle.winner,
                finalHash: this.battle.hash(),
              });
            }
          }
        }
        if (msg.owesAction && this.battle && !this.battle.winner) {
          this.battle.turn = msg.turn;
          const actions = this.battle.chooseActions();
          this.sendSigned("ACTION", { matchId: this.matchId, turn: msg.turn, actions });
        }
        if (msg.owesPick) {
          this.sendSigned("PICK", {
            matchId: this.matchId,
            picks: [0, 1, 2, 3].slice(0, this.format === "doubles" ? 4 : 3),
          });
        }
        break;
      }
    }
  }

  decline() {
    this.sendRaw({ type: "QUEUE_DECLINE" });
  }

  accept() {
    this.sendRaw({ type: "QUEUE_ACCEPT" });
  }

  rejoin(matchId) {
    this.sendSigned("REJOIN", { matchId });
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }

  terminate() {
    try {
      this.ws.terminate();
    } catch {}
  }
}
