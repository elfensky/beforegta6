import { expect, test } from 'vitest';
import { pageTitle, structuredData, serializeJsonLd } from '../lib/meta.js';

test('short title keeps the site suffix', () => {
  expect(pageTitle('We got a new Pope before GTA 6')).toBe(
    'We got a new Pope before GTA 6 · beforegta6.wtf',
  );
});
test('a title that only fits without the suffix drops it', () => {
  const t = 'We got ChatGPT turning GTA 5 characters into real people before GTA 6';
  expect(t.length).toBeLessThanOrEqual(70);
  expect(pageTitle(t)).toBe(t);
});
test('an apostrophe counts as its HTML escape', () => {
  const t = "We got Messi's first World Cup hat-trick before GTA 6";
  expect((t + ' · beforegta6.wtf').length).toBe(70);
  expect(pageTitle(t)).toBe(t);
  expect(pageTitle(`${"'".repeat(20)}x`)).toBe(`${"'".repeat(13)}…`);
});
test('a title over 70 characters is cut with an ellipsis', () => {
  const t = 'x'.repeat(90);
  expect(pageTitle(t)).toHaveLength(70);
  expect(pageTitle(t).endsWith('…')).toBe(true);
});

const image = {
  url: 'https://beforegta6.wtf/_astro/example.jpg',
  width: 1200,
  height: 630,
  alt: 'Example image',
};

test('collection metadata connects the site, page and visible card list', () => {
  const graph = structuredData({
    title: 'The timeline',
    description: 'Two entries',
    path: '/',
    image,
    items: [
      { id: 'one', title: 'First entry' },
      { id: 'two', title: 'Second entry' },
    ],
  })['@graph'];
  const site = graph.find((node) => node['@type'] === 'WebSite');
  const page = graph.find((node) => node['@type'] === 'CollectionPage');
  expect(site.url).toBe('https://beforegta6.wtf/');
  expect(page.isPartOf['@id']).toBe(site['@id']);
  expect(page.mainEntity.numberOfItems).toBe(2);
  expect(page.mainEntity.itemListElement.map(({ position, url }) => [position, url])).toEqual([
    [1, 'https://beforegta6.wtf/one/'],
    [2, 'https://beforegta6.wtf/two/'],
  ]);
});

test('card metadata describes the source without inventing publication dates or ratings', () => {
  const graph = structuredData({
    title: 'A card',
    description: 'An event long before this website',
    path: '/example/',
    image,
    card: { citations: ['https://example.com/source'], nsfw: true },
  })['@graph'];
  const page = graph.find((node) => node['@type'] === 'WebPage');
  expect(page.mainEntity).toMatchObject({
    '@type': 'CreativeWork',
    citation: ['https://example.com/source'],
    isFamilyFriendly: false,
  });
  expect(page.mainEntity).not.toHaveProperty('datePublished');
  expect(page.mainEntity).not.toHaveProperty('aggregateRating');
  const breadcrumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
  expect(breadcrumbs.itemListElement.map(({ item }) => item)).toEqual([
    'https://beforegta6.wtf/',
    'https://beforegta6.wtf/example/',
  ]);
});

test('JSON-LD cannot close its script element or inject HTML', () => {
  const value = { name: '</script><script>alert("x")</script> & \u2028\u2029' };
  const encoded = serializeJsonLd(value);
  expect(encoded).not.toContain('<');
  expect(encoded).not.toContain('\u2028');
  expect(encoded).not.toContain('\u2029');
  expect(JSON.parse(encoded)).toEqual(value);
});
