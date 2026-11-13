import { expect, test } from 'vitest';
import { ogImageOf, timelineEntries, visibleCards } from '../lib/cards.js';

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
test('timeline: oldest first, milestone before card on the same date, year set', () => {
  const t = timelineEntries(
    [
      card({ id: 'a', date: '2023-12-05' }),
      card({ id: 'b', date: '2013-09-18' }),
      card({ id: 'h', status: 'hold', date: '2020-01-01' }),
    ],
    [{ date: '2023-12-05', title: 'Trailer 1', blurb: '', factUrl: '' }],
  );
  expect(t.map((e) => [e.kind, e.year])).toEqual([
    ['card', 2013],
    ['milestone', 2023],
    ['card', 2023],
  ]);
});
test('nsfw card has no OG image', () => {
  expect(ogImageOf(card({ id: 'x', date: '2025-01-01', nsfw: true }))).toBeNull();
  expect(ogImageOf(card({ id: 'y', date: '2025-01-01' }))).toEqual({ src: '/y.jpg' });
});
