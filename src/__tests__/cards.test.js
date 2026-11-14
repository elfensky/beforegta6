import { expect, test } from 'vitest';
import { groupSlots, ogImageOf, timelineEntries, visibleCards } from '../lib/cards.js';

// Mirrors a cards collection entry: the schema coerces dates to Date.
/** @param {{ id: string, date: string, status?: string, nsfw?: boolean, title?: string }} d */
const card = ({ id, date, status = 'launch', nsfw = false, title = id }) =>
  /** @type {any} */ ({
    id,
    data: { title, date: new Date(date), status, nsfw, image: { src: `/${id}.jpg` } },
  });

test('only launch cards, newest first', () => {
  const cards = [
    card({ id: 'h', status: 'hold', date: '2025-01-01' }),
    card({ id: 'd', status: 'drop', date: '2025-01-01' }),
    card({ id: 'old', date: '2024-03-01' }),
    card({ id: 'new', date: '2026-10-15' }),
  ];
  expect(visibleCards(cards).map((c) => c.id)).toEqual(['new', 'old']);
});
test('same date: ordered by title', () => {
  const cards = [
    card({ id: 'b', title: 'B', date: '2025-01-01' }),
    card({ id: 'a', title: 'A', date: '2025-01-01' }),
  ];
  expect(visibleCards(cards).map((c) => c.id)).toEqual(['a', 'b']);
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
  expect(groupSlots(slots, (e) => e.year).map((g) => [g.key, g.slots.length])).toEqual([
    [2013, 3],
    [2022, 1],
    [2023, 1],
  ]);
});

// A Date in local time would put 2025-03-31 in April east of UTC; the content dates are UTC midnights.
test('groupSlots: months by UTC date', () => {
  /** @param {string} d */
  const e = (d) => ({ kind: 'item', item: { date: new Date(d) } });
  const slots = /** @type {any[]} */ ([e('2025-03-31'), e('2025-03-01'), e('2025-04-01')]);
  const groups = groupSlots(slots, (i) => i.date.getUTCMonth());
  expect(groups.map((g) => [g.key, g.slots.length])).toEqual([
    [2, 2],
    [3, 1],
  ]);
});
