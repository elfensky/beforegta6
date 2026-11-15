import { expect, test } from 'vitest';
import { ogImageOf, splitTitle, timelineEntries } from '../lib/cards.js';

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

// The frame repeats on every row: it renders muted, and "GTA 6" never breaks before the 6.
test('splitTitle: frame and event, no-break space in GTA 6', () => {
  expect(splitTitle('We got blue Texas before GTA 6')).toEqual({
    before: 'We got ',
    event: 'blue Texas',
    after: ' before GTA 6',
  });
});
test('splitTitle: a title without the frame stays whole', () => {
  expect(splitTitle('GTA 6 comes out')).toEqual({
    before: '',
    event: 'GTA 6 comes out',
    after: '',
  });
});
