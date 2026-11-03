// mulberry32 — byte-identical to the generator the game engine uses
// (GanjukoEngine.js, Section 18: `S18.mulberry32`). The relay itself never
// rolls battle dice; it issues the seed. Both clients seed this generator
// from MATCH_START and advance it identically because both execute the
// same actions in the same order. Keep this implementation in lockstep
// with the engine's — any drift is a desync factory.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A mulberry32 stream with a call counter. The canonical state hash
// carries the call count: two clients can hold identical visible state
// yet have divergent futures if their streams have advanced differently,
// and the count is what catches that early (design A.5).
export class CountedRng {
  constructor(seed) {
    this._next = mulberry32(seed);
    this.calls = 0;
  }
  next() {
    this.calls += 1;
    return this._next();
  }
  // Rebuild a stream positioned exactly `calls` deep (used when a client
  // adopts the leader's snapshot during desync recovery).
  static atPosition(seed, calls) {
    const r = new CountedRng(seed);
    for (let i = 0; i < calls; i++) r.next();
    return r;
  }
}
