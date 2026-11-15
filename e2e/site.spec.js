import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

const launched = readdirSync('src/content/cards').filter((f) =>
  /^status: "launch"$/m.test(readFileSync(`src/content/cards/${f}`, 'utf8')),
).length;

// Any live card stands for every card page; a review can drop any one of them.
const firstCard = readdirSync('src/content/cards')
  .filter((f) => f.endsWith('.md'))
  .sort()[0]
  .replace(/\.md$/, '');

for (const route of ['/', '/oldest/', `/${firstCard}/`, '/privacy/', '/does-not-exist/']) {
  test(`axe finds no violations on ${route}`, async ({ page }) => {
    // axe over the full timeline takes ~11 s in Firefox alone; parallel workers can triple that.
    test.setTimeout(60_000);
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
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
  await expect(footer.getByRole('link', { name: 'takedown@lav.ren' })).toHaveAttribute(
    'href',
    'mailto:takedown@lav.ren',
  );
  // A personal site since 2026-11-13: no company details, no home address.
  await expect(footer).not.toContainText('DRUNIK');
  await expect(footer).not.toContainText('Tirlemont');
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
