import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const candidates = JSON.parse(readFileSync('research/candidates.json', 'utf8')).candidates;
const selected = candidates.filter((card) => card.status === 'launch');
const safe = selected
  .filter((card) => !card.nsfw)
  .sort((a, b) => b.title.length - a.title.length)[0];
const mature = selected.find((card) => card.nsfw);
const site = 'https://beforegta6.wtf';

test.use({ javaScriptEnabled: false });

for (const route of ['/', '/oldest/', `/${safe.id}/`, '/privacy/']) {
  test(`crawler HTML has complete social metadata and connected structured data on ${route}`, async ({
    page,
    request,
  }) => {
    await page.goto(route);
    const meta = async (key) =>
      page.locator(`meta[property="${key}"], meta[name="${key}"]`).getAttribute('content');
    const canonical = route === '/oldest/' ? `${site}/` : `${site}${route}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    expect(await meta('og:url')).toBe(canonical);
    expect(await meta('og:locale')).toBe('en_GB');
    expect(await meta('twitter:card')).toBe('summary_large_image');
    expect(await meta('twitter:title')).toBe(await meta('og:title'));
    expect(await meta('twitter:description')).toBe(await meta('description'));
    expect(await meta('twitter:image:alt')).toBe(await meta('og:image:alt'));
    expect(await meta('og:image:alt')).toBeTruthy();
    const image = await meta('og:image');
    expect(await meta('twitter:image')).toBe(image);
    expect(image).toMatch(/^https:\/\/beforegta6\.wtf\/_astro\/.+\.jpg$/);
    expect(await meta('og:image:width')).toBe('1200');
    expect(await meta('og:image:height')).toBe('630');
    expect(await meta('og:image:type')).toBe('image/jpeg');
    const response = await request.get(new URL(image).pathname);
    expect(response.ok()).toBe(true);
    expect(await sharp(await response.body()).metadata()).toMatchObject({
      width: 1200,
      height: 630,
      format: 'jpeg',
    });
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    expect(schema['@context']).toBe('https://schema.org');
    const webpage = schema['@graph'].find((node) =>
      ['WebPage', 'CollectionPage'].includes(node['@type']),
    );
    expect(webpage.url).toBe(canonical);
    if (route === '/' || route === '/oldest/') {
      const visible = await page
        .locator('.entry .t-title a')
        .evaluateAll((links) =>
          links.map((a) => new URL(a.getAttribute('href'), 'https://beforegta6.wtf').href),
        );
      expect(webpage.mainEntity.itemListElement.map((item) => item.url)).toEqual(visible);
    }
    if (route === `/${safe.id}/`) {
      expect(await meta('og:title')).toBe(safe.title);
      expect(webpage.mainEntity.citation).toContain(safe.source_url);
      expect(webpage.mainEntity).not.toHaveProperty('datePublished');
    }
  });
}

test('NSFW metadata uses the safe default image and its matching description', async ({ page }) => {
  expect(mature).toBeDefined();
  await page.goto('/');
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');
  const alt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
  await page.goto(`/${mature.id}/`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', image);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alt);
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())[
    '@graph'
  ];
  const pageData = graph.find((node) => node['@type'] === 'WebPage');
  expect(pageData.mainEntity.isFamilyFriendly).toBe(false);
  expect(graph.find((node) => node['@type'] === 'ImageObject').url).toBe(image);
});

test('the machine-readable index matches canonical pages and omits research and excluded items', async ({
  request,
}) => {
  const response = await request.get('/llms.txt');
  expect(response.ok()).toBe(true);
  const text = await response.text();
  const urls = [...text.matchAll(/\]\((https:\/\/beforegta6\.wtf\/[^)]*)\)/g)]
    .map((match) => match[1])
    .sort();
  expect(urls).toEqual(
    [`${site}/`, `${site}/privacy/`, ...selected.map((card) => `${site}/${card.id}/`)].sort(),
  );
  const sitemapIndex = await (await request.get('/sitemap-index.xml')).text();
  const sitemapPath = new URL(sitemapIndex.match(/<loc>(.*?)<\/loc>/)[1]).pathname;
  const sitemap = await (await request.get(sitemapPath)).text();
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).sort()).toEqual(urls);
  expect(text).not.toMatch(/review_notes|review_decision|decided_at|merged_into/);
});

test('404 pages stay out of structured search data', async ({ page }) => {
  const response = await page.goto('/this-card-does-not-exist/');
  expect(response.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});
