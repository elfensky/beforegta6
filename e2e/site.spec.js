import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

const launched = readdirSync('src/content/cards').filter(
  (f) =>
    /^status: "launch"$/m.test(readFileSync(`src/content/cards/${f}`, 'utf8')) &&
    !/^presentation: "milestone"$/m.test(readFileSync(`src/content/cards/${f}`, 'utf8')),
).length;
const milestoneIds = JSON.parse(readFileSync('research/candidates.json', 'utf8'))
  .candidates.filter((c) => c.status === 'launch' && c.presentation === 'milestone')
  .map((c) => c.id);

// Any live card stands for every card page; a review can drop any one of them.
const firstCard = readdirSync('src/content/cards')
  .filter((f) => f.endsWith('.md'))
  .sort()[0]
  .replace(/\.md$/, '');

test('the public site does not expose the local review tool or research files', async ({
  request,
}) => {
  for (const route of [
    '/review/',
    '/api/state',
    '/scripts/review/app.js',
    '/research/candidates.json',
  ]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
  }
  for (const directory of ['scripts', 'research', 'review'])
    expect(readdirSync('dist')).not.toContain(directory);
});

for (const route of [
  '/',
  '/oldest/',
  `/${firstCard}/`,
  '/privacy/',
  '/contact/',
  '/contact/sent/',
  '/does-not-exist/',
]) {
  test(`axe finds no violations on ${route}`, async ({ page }) => {
    // axe over the full timeline takes ~11 s in Firefox alone; parallel workers can triple that.
    test.setTimeout(60_000);
    // CI must not depend on Cloudflare: the Turnstile widget never loads.
    let turnstile = false;
    await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
    page.on('requestfinished', (request) => {
      if (request.url().startsWith('https://challenges.cloudflare.com/')) turnstile = true;
    });
    const response = await page.goto(route);
    // The 404 page also passes axe, so every other route must be a real page.
    if (route !== '/does-not-exist/') expect(response?.ok(), route).toBe(true);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
    expect(turnstile, 'Turnstile loaded').toBe(false);
  });
}

test.describe('at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const route of ['/', '/oldest/']) {
    test(`no horizontal scroll on ${route}`, async ({ page }) => {
      await page.goto(route);
      const [scroll, client] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(client);
    });
  }
});

test('the skip link moves focus to main', async ({ page, browserName }) => {
  await page.goto('/');
  // WebKit on macOS skips links on plain Tab; Option+Tab is its keyboard path to them.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the timeline reads in full and shows the launch date', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.timeline .entry')).toHaveCount(launched);
    await expect(page.getByText('GTA 6: 19 November 2026')).toBeVisible();
    await page.getByRole('link', { name: 'Oldest first' }).click();
    await expect(page).toHaveURL('/oldest/');
  });

  test('a card page shows no share button', async ({ page }) => {
    await page.goto(`/${firstCard}/`);
    await expect(page.getByRole('button')).toHaveCount(0);
  });
});

// A deferred tracker holds back every module script until it loads: a stalled Umami froze the countdown.
test('the countdown runs while the Umami script never answers', async ({ page }) => {
  await page.route('https://umami.lav.ren/**', () => {});
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.locator('.countdown [data-left]')).not.toBeEmpty();
});

// Real ads on the apex only (Andrei, 2026-11-15). Google and Umami are blocked: a test run sends neither a request.
test('the AdSense script loads on the apex only', async ({ page, baseURL }) => {
  /** @type {string[]} */
  const google = [];
  await page.route('https://pagead2.googlesyndication.com/**', (r) => {
    google.push(r.request().url());
    return r.abort();
  });
  await page.route('https://umami.lav.ren/**', (r) => r.abort());
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(google).toEqual([]);
  // The apex host name, answered by the test server. No forwarded headers: the preview server refuses Firefox's Host.
  await page.route('https://beforegta6.wtf/**', async (r) =>
    r.fulfill({
      response: await r.fetch({
        url: r.request().url().replace('https://beforegta6.wtf', `${baseURL}`),
        headers: {},
      }),
    }),
  );
  await page.goto('https://beforegta6.wtf/');
  await expect.poll(() => google.length).toBe(1);
  // Other page requests can still be in the handler here, and the page close disposes their fetched responses.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

// The order is the only control: there is no view toggle.
test('the order toggle switches between newest and oldest first', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.year h2').first()).toHaveText('2026');
  await expect(page.getByRole('link', { name: 'Lines' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Oldest first' }).click();
  await expect(page).toHaveURL('/oldest/');
  await expect(page.locator('.year h2').first()).toHaveText('2013');
  await expect(page.getByRole('link', { name: 'Oldest first' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('reviewed GTA milestones appear once and keep their individual pages', async ({ page }) => {
  for (const route of ['/', '/oldest/']) {
    await page.goto(route);
    for (const id of milestoneIds) {
      await expect(page.locator(`.milestone .t-title a[href="/${id}/"]`)).toHaveCount(1);
      await expect(page.locator(`.entry .t-title a[href="/${id}/"]`)).toHaveCount(0);
    }
  }
  await page.locator('.milestone .t-title a[href="/gta5-free-on-epic/"]').click();
  await expect(page.locator('h1')).toHaveText('GTA V goes free on the Epic Games Store');
});

// The image of a row is hover-only on desktop: the first view of the timeline loads no card image.
test.describe('at 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a row shows its image on hover, and no card image loads before', async ({ page }) => {
    /** @type {string[]} */
    const images = [];
    // Card images are built into /_astro/. Firefox also reports the favicon as an image request.
    page.on('request', (r) => {
      if (r.resourceType() === 'image' && r.url().includes('/_astro/')) images.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(images).toEqual([]);
    const row = page.locator('.timeline .entry').first();
    await row.hover();
    await expect(row.locator('.media img')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(row.locator('.media')).toBeHidden();
  });

  test('a hover image covers a milestone, never an ad', async ({ page }) => {
    await page.goto('/');
    const z = await page.evaluate(() => {
      // Ads are off in the build: a bare box stands in for an in-page Auto ad.
      const ad = document.createElement('div');
      ad.className = 'google-auto-placed';
      document.querySelector('.timeline')?.append(ad);
      const zOf = (/** @type {string} */ s) =>
        Number(getComputedStyle(document.querySelector(s) ?? document.body).zIndex) || 0;
      return { media: zOf('.media'), milestone: zOf('.milestone'), ad: zOf('.google-auto-placed') };
    });
    expect(z.media).toBeGreaterThan(z.milestone);
    expect(z.ad).toBeGreaterThan(z.media);
  });
});

test('the footer names the operator, the contact and the privacy page', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer).toContainText('A hobby site by Andrei Lavrenov');
  // Astro drops a line break before a link: the words must not run into the link text.
  await expect(footer).toContainText('Want one removed? takedown@lav.ren');
  await expect(footer).toContainText('Contact · Privacy');
  await expect(footer.getByRole('link', { name: 'takedown@lav.ren' })).toHaveAttribute(
    'href',
    'mailto:takedown@lav.ren',
  );
  // A personal site since 2026-11-13: no company details, no home address.
  await expect(footer).not.toContainText('DRUNIK');
  await expect(footer).not.toContainText('Tirlemont');
  await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact/');
  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
});

test.describe('the share button on a card page', () => {
  test('uses the share sheet where the browser has one', async ({ page }) => {
    await page.addInitScript(() => {
      /** @type {any} */ (window).shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (/** @type {ShareData} */ d) => /** @type {any} */ (window).shared.push(d.url),
      });
    });
    await page.goto(`/${firstCard}/`);
    await page.getByRole('button', { name: 'Share this card' }).click();
    expect(await page.evaluate(() => /** @type {any} */ (window).shared)).toEqual([
      `https://beforegta6.wtf/${firstCard}/`,
    ]);
  });

  test('copies the link where there is no share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      /** @type {any} */ (window).copied = [];
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (/** @type {string} */ t) => /** @type {any} */ (window).copied.push(t),
        },
      });
    });
    await page.goto(`/${firstCard}/`);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByRole('status')).toHaveText('Link copied.');
    expect(await page.evaluate(() => /** @type {any} */ (window).copied)).toEqual([
      `https://beforegta6.wtf/${firstCard}/`,
    ]);
  });
});

test.describe('the line under the title', () => {
  test('stays hidden before the launch', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 15, 12));
    await page.goto('/');
    await expect(page.getByText('And we got GTA 6 before')).toBeHidden();
  });

  test('shows after the launch, with the flipped title', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 19, 0, 1));
    await page.goto('/');
    await expect(page.locator('[data-launch-title]')).toHaveText(
      'We got all of this before GTA 6.',
    );
    await expect(page.getByText('And we got GTA 6 before The Winds of Winter.')).toBeVisible();
  });
});
