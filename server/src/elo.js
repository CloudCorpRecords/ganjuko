// Rating math (design A.7 + TRUST §3.4: ratings move only server-side).
// Simple Elo, K = 32, start 1500. Placement: a player's first 5 ranked
// matches of a season use double K. When a widened match crosses bands,
// the expectation — never the stored rating — is adjusted by a fixed
// per-band step, so beating a higher-band team pays more and losing to
// one costs less.

export const START_RATING = 1500;
export const K_BASE = 32;
export const PLACEMENT_MATCHES = 5;
export const BAND_ELO_STEP = 40; // expectation-only, per band of difference

export const TIERS = [
  { name: "Rookie", min: 0 },
  { name: "Ganjuko", min: 1200 },
  { name: "Great", min: 1500 },
  { name: "Ultra", min: 1800 },
  { name: "Master", min: 2100 },
];

export function tierFor(rating) {
  let tier = TIERS[0];
  for (const t of TIERS) if (rating >= t.min) tier = t;
  return tier.name;
}

export function nextTier(rating) {
  for (const t of TIERS) if (rating < t.min) return { name: t.name, at: t.min, toGo: t.min - rating };
  return null;
}

// Level bands (design A.3): set by the team's highest-level member.
export const BANDS = [
  { name: "Sprout", min: 1, max: 20 },
  { name: "Bronze", min: 21, max: 40 },
  { name: "Silver", min: 41, max: 60 },
  { name: "Gold", min: 61, max: 80 },
  { name: "Masters", min: 81, max: 100 },
];

export function bandForLevel(level) {
  for (let i = 0; i < BANDS.length; i++) {
    if (level >= BANDS[i].min && level <= BANDS[i].max) return { ...BANDS[i], index: i };
  }
  return null;
}

export function bandForTeam(team) {
  const max = Math.max(...team.map((m) => m.level));
  return bandForLevel(max);
}

export function expectedScore(ratingA, ratingB, bandIndexA = null, bandIndexB = null) {
  let diff = ratingA - ratingB;
  if (bandIndexA != null && bandIndexB != null) {
    diff += BAND_ELO_STEP * (bandIndexA - bandIndexB);
  }
  return 1 / (1 + Math.pow(10, -diff / 400));
}

export function kFor(record) {
  return (record?.rankedThisSeason ?? 0) < PLACEMENT_MATCHES ? K_BASE * 2 : K_BASE;
}

// scoreA/scoreB are 1/0, 0/1, or 0.5/0.5. Returns integer deltas.
export function ratingDeltas(recA, recB, bandIndexA, bandIndexB, scoreA, scoreB) {
  const expA = expectedScore(recA.rating, recB.rating, bandIndexA, bandIndexB);
  const expB = 1 - expA;
  return {
    a: Math.round(kFor(recA) * (scoreA - expA)),
    b: Math.round(kFor(recB) * (scoreB - expB)),
    expectedA: expA,
    expectedB: expB,
  };
}
