import { expect, test } from 'vitest';
import yaml from 'yaml';
import {
  cardMarkdown,
  checkCandidates,
  imageExtension,
  reviewTable,
  toCard,
} from '../../scripts/lib/candidate.js';

/** @param {Record<string, unknown>} overrides */
const fixture = (overrides = {}) => ({
  id: 'flying-cars',
  title: 'We got flying cars before GTA 6',
  blurb: 'Tesla showed a Roadster that hops on cold-gas thrusters.',
  kind: 'real-event',
  event_date: '2026-10-15',
  post_date: '2026-10-16',
  timeline_date: '2026-10-15',
  fact_url: 'https://example.com/fact',
  source_url: 'https://x.com/a/status/1',
  source_platform: 'x',
  source_engagement: '108K likes',
  image_url: 'https://pbs.twimg.com/media/a.jpg',
  image_note: 'from the White House post',
  nsfw: false,
  status: 'launch',
  ...overrides,
});

test('maps a real event', () => {
  const { id, frontmatter } = toCard(fixture());
  expect(id).toBe('flying-cars');
  expect(frontmatter).toMatchObject({
    kind: 'real-event',
    date: '2026-10-15',
    eventDate: '2026-10-15',
    nsfw: false,
    status: 'launch',
    source: { url: 'https://x.com/a/status/1', platform: 'x', engagement: '108K likes' },
    factUrl: 'https://example.com/fact',
  });
});

test('a joke takes the post date', () => {
  const { frontmatter } = toCard(
    fixture({
      kind: 'joke',
      event_date: null,
      timeline_date: null,
      post_date: '2023-11-21',
      fact_url: null,
    }),
  );
  expect(frontmatter.date).toBe('2023-11-21');
  expect(frontmatter.eventDate).toBeUndefined();
  expect(frontmatter.factUrl).toBeUndefined();
});

test('a Commons image carries its credit; a post image has none', () => {
  const commons = fixture({
    image_page: 'https://commons.wikimedia.org/wiki/File:M87.jpg',
    image_license: 'CC BY 4.0 (EHT Collaboration)',
  });
  expect(toCard(commons).frontmatter.imageCredit).toEqual({
    text: 'CC BY 4.0 (EHT Collaboration)',
    url: 'https://commons.wikimedia.org/wiki/File:M87.jpg',
  });
  expect(toCard(fixture({ image_license: 'post image' })).frontmatter.imageCredit).toBeUndefined();
});

test('rejects a bad id', () => {
  expect(() => toCard(fixture({ id: 'Flying Cars!' }))).toThrow('id');
});

test('rejects a missing source', () => {
  expect(() => toCard(fixture({ source_url: null }))).toThrow('flying-cars: source_url missing');
});

test('frontmatter survives quotes, colons, hashes and emoji', () => {
  const title = 'We got "GTA 7": #1 🚗 before GTA 6';
  const md = cardMarkdown(toCard(fixture({ title })).frontmatter, 'flying-cars.jpg');
  const data = yaml.parse(md.split('---')[1]);
  expect(data.title).toBe(title);
  expect(data.image).toBe('../../assets/cards/flying-cars.jpg');
});

test('only image content types pass', () => {
  expect(imageExtension('image/jpeg')).toBe('jpg');
  expect(imageExtension('image/png')).toBe('png');
  expect(imageExtension('image/webp')).toBe('webp');
  expect(imageExtension('image/gif')).toBe('gif');
  expect(imageExtension('text/html; charset=utf-8')).toBeNull();
  expect(imageExtension(null)).toBeNull();
});

test('uses a hand-written alt text, else the title', () => {
  expect(toCard(fixture({ image_alt: 'A Roadster in the air' })).frontmatter.imageAlt).toBe(
    'A Roadster in the air',
  );
  expect(toCard(fixture()).frontmatter.imageAlt).toBe('We got flying cars before GTA 6');
});

test('rejects a missing or unknown status', () => {
  expect(() => toCard(fixture({ status: undefined }))).toThrow('flying-cars: status');
  expect(() => toCard(fixture({ status: 'Launch' }))).toThrow('flying-cars: status');
});

test('checkCandidates names duplicates, bad statuses and broken launch items', () => {
  const errors = checkCandidates([
    fixture(),
    fixture(),
    fixture({ id: 'typo', status: 'Launch' }),
    fixture({ id: 'no-post', source_url: null }),
    fixture({ id: 'archived-no-post', status: 'drop', source_url: null }),
  ]);
  expect(errors).toEqual([
    'duplicate id: flying-cars',
    'typo: status must be launch, hold or drop',
    'no-post: source_url missing',
  ]);
});

test('reviewTable groups by first subject tag and escapes pipes', () => {
  const md = reviewTable({
    passes: [{ pass: 3, date: '2026-11-14', notes: ['Impact 10 = the whole world noticed it.'] }],
    candidates: [
      fixture({
        id: 'a',
        title: 'We got A | B before GTA 6',
        tags: ['tech', 'internet', 'world-event'],
        impact_score: 8,
      }),
      fixture({ id: 'b', status: 'drop', tags: ['world-event'] }),
    ],
    excluded: [{ id: 'covid-pandemic', reason: 'Global pandemic; deaths.' }],
  });
  expect(md).toContain('- Impact 10 = the whole world noticed it.');
  expect(md).toContain('## Tech (1)');
  expect(md).not.toContain('## Internet');
  expect(md).toContain('We got A \\| B before GTA 6');
  expect(md).toContain('## Untagged (1)');
  expect(md).toContain('- `covid-pandemic`: Global pandemic; deaths.');
  expect(md).toMatch(/\| Total \| 1 \| 0 \| 1 \| 2 \|/);
});
