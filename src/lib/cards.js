/** @typedef {import('astro:content').CollectionEntry<'cards'>} Card */
/** @typedef {{ date: string, title: string, blurb: string, factUrl: string }} Milestone */
/**
 * @typedef {{ kind: 'card', date: Date, year: number, card: Card }
 *   | { kind: 'milestone', date: Date, year: number, milestone: Milestone }} TimelineEntry
 */

/** @param {Card[]} cards */
const launched = (cards) => cards.filter((c) => c.data.status === 'launch');

/**
 * Cards for the grid: launch status only, newest first, ties by title.
 * @param {Card[]} cards
 * @returns {Card[]}
 */
export function visibleCards(cards) {
  return launched(cards).sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.data.title.localeCompare(b.data.title),
  );
}

/**
 * Cards and GTA milestones on one axis, oldest first. On the same day a milestone comes first.
 * @param {Card[]} cards
 * @param {Milestone[]} milestones
 * @returns {TimelineEntry[]}
 */
export function timelineEntries(cards, milestones) {
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
  return entries.sort((a, b) => a.date.getTime() - b.date.getTime() || rank[a.kind] - rank[b.kind]);
}

/**
 * The link-preview image of a card page; null (the site image) for an NSFW card.
 * @param {Card} card
 */
export function ogImageOf(card) {
  return card.data.nsfw ? null : card.data.image;
}

/**
 * Split the timeline's slots into year sections. An ad slot belongs to the year of the entry before it.
 * @template {{ year: number }} T
 * @param {import('./ads.js').Slot<T>[]} slots
 * @returns {{ year: number, slots: import('./ads.js').Slot<T>[] }[]}
 */
export function byYear(slots) {
  /** @type {{ year: number, slots: import('./ads.js').Slot<T>[] }[]} */
  const groups = [];
  for (const slot of slots) {
    const last = groups.at(-1);
    if (slot.kind === 'item' && slot.item.year !== last?.year)
      groups.push({ year: slot.item.year, slots: [slot] });
    else last?.slots.push(slot);
  }
  return groups;
}
