import { expect, test } from 'vitest';
import yaml from 'yaml';
import { cardMarkdown, imageExtension, toCard } from '../../scripts/lib/candidate.js';

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
    fixture({ kind: 'joke', event_date: null, timeline_date: null, post_date: '2023-11-21', fact_url: null }),
  );
  expect(frontmatter.date).toBe('2023-11-21');
  expect(frontmatter.eventDate).toBeUndefined();
  expect(frontmatter.factUrl).toBeUndefined();
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
