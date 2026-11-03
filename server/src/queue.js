// Matchmaking (design A.3). Queue key = (mode, format, band); the band
// comes from the team's highest-level member — levels are public by
// rule 2, so none of this is secret. After ~30 s without a pairing the
// search widens ±1 band and the player is TOLD (QUEUE_WIDENED) — never
// silently. Casual players may decline a widened match at MATCH_FOUND
// (the accept step lives in the relay); ranked auto-accepts (no
// dodging) but shows the same preview. Ranked prefers the closest
// rating inside the band.

export class QueueManager {
  constructor({ widenAfterMs = 30000, now = () => Date.now() } = {}) {
    this.entries = []; // {playerId, session, mode, format, bandIndex, rating, team, joinedAt, widened}
    this.widenAfterMs = widenAfterMs;
    this.now = now;
  }

  add(entry) {
    this.remove(entry.playerId);
    if (entry.joinedAt == null) entry.joinedAt = this.now();
    if (entry.widened == null) entry.widened = false;
    this.entries.push(entry);
    return entry;
  }

  remove(playerId) {
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.playerId !== playerId);
    return this.entries.length !== before;
  }

  has(playerId) {
    return this.entries.some((e) => e.playerId === playerId);
  }

  size() {
    return this.entries.length;
  }

  // One pairing pass. Returns an array of [entryA, entryB] pairs and
  // fires onWiden(entry) for entries whose search widened this pass.
  pairPass(onWiden) {
    const now = this.now();
    for (const e of this.entries) {
      if (!e.widened && now - e.joinedAt >= this.widenAfterMs) {
        e.widened = true;
        if (onWiden) onWiden(e);
      }
    }
    const pairs = [];
    const used = new Set();
    const ordered = [...this.entries].sort((a, b) => a.joinedAt - b.joinedAt);
    for (const head of ordered) {
      if (used.has(head.playerId)) continue;
      const candidates = ordered.filter(
        (c) =>
          c !== head &&
          !used.has(c.playerId) &&
          c.mode === head.mode &&
          c.format === head.format &&
          this.bandsCompatible(head, c)
      );
      if (!candidates.length) continue;
      let partner;
      const sameBand = candidates.filter((c) => c.bandIndex === head.bandIndex);
      if (sameBand.length) {
        partner =
          head.mode === "ranked"
            ? sameBand.sort((a, b) => Math.abs(a.rating - head.rating) - Math.abs(b.rating - head.rating))[0]
            : sameBand[0];
      } else {
        partner = candidates.sort((a, b) => a.joinedAt - b.joinedAt)[0];
      }
      used.add(head.playerId);
      used.add(partner.playerId);
      pairs.push([head, partner]);
    }
    if (used.size) this.entries = this.entries.filter((e) => !used.has(e.playerId));
    return pairs;
  }

  bandsCompatible(a, b) {
    if (a.bandIndex === b.bandIndex) return true;
    const diff = Math.abs(a.bandIndex - b.bandIndex);
    return diff === 1 && (a.widened || b.widened);
  }
}
