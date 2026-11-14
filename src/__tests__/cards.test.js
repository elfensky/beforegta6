import { expect, test } from 'vitest';
import { groupSlots, monthOf, ogImageOf, timelineEntries, yearOf } from '../lib/cards.js';

// Mirrors a cards collection entry: the schema coerces dates to Date.
/** @param {{ id: string, date: string, status?: string, nsfw?: boolean, title?: string }} d */
const card = ({ id, date, status = 'launch', nsfw = false, title = id }) =>
  /** @type {any} */ ({
    id,
    data: { title, date: new Date(date), status, nsfw, image: { src: `/${id}.jpg` } },
  });

const timelineCards = [
  card({ id: 'a', date: '2023-12-05' }),
  card({ id: 'b', date: '2013-09-18' }),
  card({ id: 'h', status: 'hold', date: '2020-01-01' }),
];
const trailer = [{ date: '2023-12-05', title: 'Trailer 1', blurb: '', factUrl: '' }];
test('timeline: oldest first, milestone before card on the same date, year set', () => {
  const t = timelineEntries(timelineCards, trailer);
  expect(t.map((e) => [e.kind, e.year])).toEqual([
    ['card', 2013],
    ['milestone', 2023],
    ['card', 2023],
  ]);
});
// The card pages' newer/older links read the same order, so a tie must not depend on the collection's load order.
test('timeline: cards on the same day are ordered by title, reversed for newest first', () => {
  const cards = [
    card({ id: 'b', title: 'B', date: '2025-01-01' }),
    card({ id: 'a', title: 'A', date: '2025-01-01' }),
  ];
  expect(timelineEntries(cards, []).map((e) => e.kind === 'card' && e.card.id)).toEqual(['a', 'b']);
  expect(timelineEntries(cards, [], 'newest').map((e) => e.kind === 'card' && e.card.id)).toEqual([
    'b',
    'a',
  ]);
});
test('timeline: newest first is the exact reverse of oldest first', () => {
  const t = timelineEntries(timelineCards, trailer, 'newest');
  expect(t.map((e) => [e.kind, e.year])).toEqual([
    ['card', 2023],
    ['milestone', 2023],
    ['card', 2013],
  ]);
});
test('nsfw card has no OG image', () => {
  expect(ogImageOf(card({ id: 'x', date: '2025-01-01', nsfw: true }))).toBeNull();
  expect(ogImageOf(card({ id: 'y', date: '2025-01-01' }))).toEqual({ src: '/y.jpg' });
});

test('groupSlots: one group per key, an ad slot stays with the entry before it', () => {
  /** @param {number} year */
  const e = (year) => ({ kind: 'item', item: { year } });
  const slots = /** @type {any[]} */ ([
    e(2013),
    e(2013),
    { kind: 'ad', desktop: false },
    e(2022),
    e(2023),
  ]);
  expect(groupSlots(slots, yearOf).map((g) => [g.key, g.slots.length])).toEqual([
    [2013, 3],
    [2022, 1],
    [2023, 1],
  ]);
});

// Content dates are UTC midnights. West of UTC, a local month would move the 1st of a month into the month before.
test('monthOf: months by UTC date, in any time zone', () => {
  const tz = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    /** @param {string} d */
    const e = (d) => ({ kind: 'item', item: { date: new Date(d) } });
    const slots = /** @type {any[]} */ ([e('2025-03-31'), e('2025-03-01'), e('2025-04-01')]);
    expect(groupSlots(slots, monthOf).map((g) => [g.key, g.slots.length])).toEqual([
      [2, 2],
      [3, 1],
    ]);
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});
