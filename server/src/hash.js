import { createHash } from "node:crypto";

// Canonical JSON: object keys sorted recursively, no whitespace. Every
// signature and content hash in the protocol is computed over this form,
// so two implementations that build the same value hash it identically.
export function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(value[k])).join(",") + "}";
}

export function sha256hex(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// FNV-1a 32-bit — the per-turn state hash (design A.5 allows FNV-1a or
// truncated SHA-256; FNV-1a is what the spec fixes so client and relay
// test doubles agree bit-for-bit).
export function fnv1a32(text) {
  let h = 0x811c9dc5;
  const bytes = Buffer.from(text, "utf8");
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Canonical battle-state string (PROTOCOL.md §6 is the normative spec).
// state = {
//   turn,                       // integer, the turn just resolved
//   actives: { P1: [teamIdx..], P2: [teamIdx..] },   // slots on the field
//   members: [ { side, speciesId, level, hp, mp, status: [ids], alive } ]
//              // P1's team in pick order, then P2's team in pick order
//   prngCalls                   // shared-stream calls consumed so far
// }
export function canonicalStateString(state) {
  const member = (m) =>
    `${m.side}:${m.speciesId},${m.level},${m.hp},${m.mp},${(m.status || []).join("+")},${m.alive ? 1 : 0}`;
  const ordered = [...state.members].sort((a, b) =>
    a.side === b.side ? 0 : a.side === "P1" ? -1 : 1
  );
  return [
    "g1",
    `t=${state.turn}`,
    `a1=${(state.actives.P1 || []).join(".")}`,
    `a2=${(state.actives.P2 || []).join(".")}`,
    `m=${ordered.map(member).join(";")}`,
    `rng=${state.prngCalls}`,
  ].join("|");
}

export function hashState(state) {
  return fnv1a32(canonicalStateString(state));
}

// Parse a canonical state string back into its dynamic fields. Clients
// use this during desync recovery: static facts (params, moves) come
// from the team packets they already hold; everything dynamic comes
// from the leader's string.
export function parseCanonicalStateString(text) {
  const parts = Object.create(null);
  for (const seg of String(text).split("|")) {
    const eq = seg.indexOf("=");
    if (eq > 0) parts[seg.slice(0, eq)] = seg.slice(eq + 1);
  }
  if (parts.g1 !== undefined || !("t" in parts)) {
    // "g1" is a bare version tag, not a key=value segment.
    if (!("t" in parts)) throw new Error("not a canonical state string");
  }
  const members = (parts.m || "")
    .split(";")
    .filter(Boolean)
    .map((tuple) => {
      const [side, rest] = tuple.split(":");
      const [speciesId, level, hp, mp, status, alive] = rest.split(",");
      return {
        side,
        speciesId: Number(speciesId),
        level: Number(level),
        hp: Number(hp),
        mp: Number(mp),
        status: status ? status.split("+").map(Number) : [],
        alive: alive === "1",
      };
    });
  return {
    turn: Number(parts.t),
    actives: {
      P1: parts.a1 ? parts.a1.split(".").map(Number) : [],
      P2: parts.a2 ? parts.a2.split(".").map(Number) : [],
    },
    members,
    prngCalls: Number(parts.rng),
  };
}
