// Seasons (design A.7): 8 weeks, soft reset at season start (rating
// moves halfway toward 1500). Season boundaries are pure arithmetic from
// a fixed epoch, so the relay, the client, and the tests all agree on
// "which season is it" without a calendar service. Season 1 opens at the
// epoch: Monday 2026-11-02T00:00:00Z by default; production may move it
// via RELAY_SEASON_EPOCH_MS before launch — after Season 1 opens the
// epoch is frozen forever (moving it would rewrite history).

export const SEASON_MS = 8 * 7 * 24 * 3600 * 1000;
export const DEFAULT_EPOCH_MS = Date.UTC(2026, 10, 2, 0, 0, 0, 0);

export function seasonAt(nowMs, epochMs = DEFAULT_EPOCH_MS) {
  if (nowMs < epochMs) return 0; // pre-season: ranked runs in shadow mode
  return Math.floor((nowMs - epochMs) / SEASON_MS) + 1;
}

export function seasonWindow(season, epochMs = DEFAULT_EPOCH_MS) {
  if (season <= 0) return { season: 0, startsAt: null, endsAt: epochMs };
  const startsAt = epochMs + (season - 1) * SEASON_MS;
  return { season, startsAt, endsAt: startsAt + SEASON_MS };
}

export function softReset(rating) {
  return Math.round(1500 + (rating - 1500) / 2);
}

// Lazy rollover: the first time a record is touched in a new season, the
// old season is archived into seasonHistory and the soft reset applies.
// Deterministic and testable — no cron, no migration window.
export function applyRollover(record, nowMs, epochMs = DEFAULT_EPOCH_MS) {
  const current = seasonAt(nowMs, epochMs);
  if (record.season === current) return record;
  if (record.season > 0 || record.rankedThisSeason > 0 || record.casualThisSeason > 0) {
    record.seasonHistory = record.seasonHistory || [];
    record.seasonHistory.push({
      season: record.season,
      finalRating: record.rating,
      best: record.seasonBest ?? record.rating,
      w: record.w ?? 0,
      l: record.l ?? 0,
      d: record.d ?? 0,
    });
  }
  record.rating = softReset(record.rating);
  record.season = current;
  record.seasonBest = record.rating;
  record.rankedThisSeason = 0;
  record.casualThisSeason = 0;
  record.w = 0;
  record.l = 0;
  record.d = 0;
  return record;
}
