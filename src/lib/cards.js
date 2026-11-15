/** @typedef {import('astro:content').CollectionEntry<'cards'>} Card */
/** @typedef {{ date: string, title: string, blurb: string, factUrl: string }} Milestone */
/**
 * @typedef {{ kind: 'card', date: Date, year: number, card: Card }
 *   | { kind: 'milestone', date: Date, year: number, milestone: Milestone }} TimelineEntry
 */

/** @param {Card[]} cards */
const launched = (cards) => cards.filter((c) => c.data.status === 'launch');

/**
 * Cards and GTA milestones on one axis, oldest first. On the same day a milestone comes first, then cards by title.
 * Newest first is the exact reverse. Only launch cards take part.
 * @param {Card[]} cards
 * @param {Milestone[]} milestones
 * @param {'oldest' | 'newest'} [order]
 * @returns {TimelineEntry[]}
 */
export function timelineEntries(cards, milestones, order = 'oldest') {
  /** @type {TimelineEntry[]} */
  const entries = [
    ...milestones.map((m) => {
      const date = new Date(m.date);
      return /** @type {const} */ ({
        kind: 'milestone',
        date,
        year: date.getUTCFullYear(),
        milestone: m,
      });
    }),
    ...launched(cards).map((card) => {
      const date = card.data.date;
      return /** @type {const} */ ({ kind: 'card', date, year: date.getUTCFullYear(), card });
    }),
  ];
  const rank = { milestone: 0, card: 1 };
  /** @param {TimelineEntry} e */
  const title = (e) => (e.kind === 'card' ? e.card.data.title : e.milestone.title);
  entries.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      rank[a.kind] - rank[b.kind] ||
      title(a).localeCompare(title(b)),
  );
  return order === 'newest' ? entries.reverse() : entries;
}

/**
 * The link-preview image of a card page; null (the site image) for an NSFW card.
 * @param {Card} card
 */
export function ogImageOf(card) {
  return card.data.nsfw ? null : card.data.image;
}

/**
 * Split "We got <event> before GTA 6" into the frame and the event, so the frame can render muted. The space in
 * "GTA 6" becomes a no-break space. A title without the frame comes back whole, as the event.
 * @param {string} title
 * @returns {{ before: string, event: string, after: string }}
 */
export function splitTitle(title) {
  const m = title.match(/^(We got )(.+) before GTA 6$/);
  return m
    ? { before: m[1], event: m[2], after: ' before GTA 6' }
    : { before: '', event: title, after: '' };
}
