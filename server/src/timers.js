// Champions clock rules (design A.2/A.5 as amended by the shipped S19
// timer machine — the relay mirrors the engine's own semantics so a
// player meets the same clocks offline and online):
//   - 20:00 total match clock. On expiry the result is decided from the
//     clients' mirrored standing reports: more creatures standing wins;
//     tie -> higher sum of remaining HP%% wins; exact tie -> draw.
//   - 7:00 per-player decision bank ("your time"), consumed only while
//     that player owes an action. Bank exhaustion = that player loses.
//   - 0:45 per-turn decision cap. A player who lets it lapse has an
//     action auto-submitted for them ("act on instinct": fight with
//     each active creature's first listed move). Three CONSECUTIVE
//     lapses = forfeit. Any on-time action resets the strike count.

export const CLOCKS = {
  totalMs: 20 * 60 * 1000,
  bankMs: 7 * 60 * 1000,
  turnMs: 45 * 1000,
  pickMs: 30 * 1000,
  graceMs: 30 * 1000,
  acceptMs: 20 * 1000,
  claimMs: 10 * 1000,
  maxStrikes: 3,
};

// standing = { alive, hpPctSum } for one side, reported by BOTH clients
// (mirrored: each reports both sides; agreement is checked by the match).
export function decideTimeResult(a, b) {
  if (a.alive !== b.alive) return a.alive > b.alive ? "P1" : "P2";
  if (a.hpPctSum !== b.hpPctSum) return a.hpPctSum > b.hpPctSum ? "P1" : "P2";
  return "draw";
}

// The auto-action for a silent side: one fight action per active slot,
// first listed move, targeting the first opposing slot. The relay knows
// the picked teams (it forwarded them), so it can construct this
// without any battle logic.
export function instinctAction(battleTeam, activeCount, format) {
  const actions = [];
  for (let slot = 0; slot < activeCount; slot++) {
    const member = battleTeam[slot];
    actions.push({
      slot,
      kind: "fight",
      skillId: member.moves[0],
      target: { side: "opp", slot: 0 },
      instinct: true,
    });
  }
  return actions;
}
