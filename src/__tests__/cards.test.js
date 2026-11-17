import { expect, test } from 'vitest';
import { ogImageOf, splitTitle, timelineEntries, withMilestoneCards } from '../lib/cards.js';

// Mirrors a cards collection entry: the schema coerces dates to Date.
/**
 * @param {{ id: string, date: string, status?: string, nsfw?: boolean, title?: string, presentation?: string,
 *   factUrl?: string }} d
 */
const card = ({
  id,
  date,
  status = 'launch',
  nsfw = false,
  title = id,
  presentation = 'card',
  factUrl,
}) =>
  /** @type {any} */ ({
    id,
    data: {
      title,
      blurb: `${id} blurb`,
      date: new Date(date),
      status,
      nsfw,
      presentation,
      factUrl,
      source: { url: `https://example.com/${id}`, platform: 'other' },
      image: { src: `/${id}.jpg` },
    },
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

const start = {
  date: '2013-09-17',
  title: 'GTA V comes out',
  blurb: 'start',
  factUrl: 'f',
  candidateId: 'gta5',
};
const end = { date: '2026-11-19', title: 'GTA 6 comes out', blurb: 'end', factUrl: 'f' };
test('milestone cards: leave the card rows, join the milestones with a link to their page', () => {
  const { cards, milestones } = withMilestoneCards(
    [
      card({ id: 'row', date: '2020-01-01' }),
      card({
        id: 'sales',
        title: 'GTA V sells',
        date: '2026-09-30',
        presentation: 'milestone',
        factUrl: 'https://x.test/',
      }),
      card({ id: 'pc', date: '2015-04-14', presentation: 'milestone' }),
      card({ id: 'held', date: '2016-01-01', presentation: 'milestone', status: 'hold' }),
    ],
    [start, end],
  );
  expect(cards.map((c) => c.id)).toEqual(['row']);
  expect(milestones).toContainEqual({
    date: '2026-09-30',
    title: 'GTA V sells',
    blurb: 'sales blurb',
    factUrl: 'https://x.test/',
    href: '/sales/',
  });
  // No fact URL: the source is the citation.
  expect(milestones.find((m) => m.href === '/pc/')?.factUrl).toBe('https://example.com/pc');
  expect(milestones.some((m) => m.href === '/held/')).toBe(false);
});
test('milestone cards: the explicitly linked candidate merges, and the input is not changed', () => {
  const input = [start, end];
  const { milestones } = withMilestoneCards(
    [card({ id: 'gta5', title: 'GTA V on PS3', date: '2013-09-17', presentation: 'milestone' })],
    input,
  );
  expect(milestones).toEqual([{ ...start, href: '/gta5/' }, end]);
  expect(input[0]).not.toHaveProperty('href');
});
test('milestone cards: unrelated events on a handwritten milestone date stay visible', () => {
  const { milestones } = withMilestoneCards(
    [card({ id: 'unrelated', date: start.date, presentation: 'milestone' })],
    [start],
  );
  expect(milestones).toHaveLength(2);
  expect(milestones[1].href).toBe('/unrelated/');
});
test('milestone cards: sorted on the line, the launch stays the cap at either end', () => {
  const { cards, milestones } = withMilestoneCards(
    [
      card({ id: 'b', title: 'B', date: '2022-03-15', presentation: 'milestone' }),
      card({ id: 'a', title: 'A', date: '2022-03-15', presentation: 'milestone' }),
      card({ id: 'row', date: '2022-03-15' }),
    ],
    [end, start],
  );
  const order = (/** @type {'oldest'|'newest'} */ o) =>
    timelineEntries(cards, milestones, o).map((e) =>
      e.kind === 'card' ? e.card.id : e.milestone.title,
    );
  expect(order('oldest')).toEqual(['GTA V comes out', 'A', 'B', 'row', 'GTA 6 comes out']);
  expect(order('newest')).toEqual(['GTA 6 comes out', 'row', 'B', 'A', 'GTA V comes out']);
});
