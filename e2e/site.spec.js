import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

const launched = readdirSync('src/content/cards').filter((f) =>
  /^status: "launch"$/m.test(readFileSync(`src/content/cards/${f}`, 'utf8')),
).length;

for (const route of ['/', '/lines/oldest/', '/flying-cars/', '/privacy/', '/does-not-exist/']) {
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

  for (const route of ['/', '/lines/']) {
    test(`no horizontal scroll on ${route}`, async ({ page }) => {
      await page.goto(route);
      const [scroll, client] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(client);
    });
  }

  test('ad slots come no more often than every 4 entries', async ({ page }) => {
    await page.goto('/');
    // Milestones are timeline entries too, and withAdSlots counts them. Month tiles are not entries.
    const entries = await page.locator('.grid > li:not(.ad-slot, .month)').count();
    const ads = await page.locator('.grid .ad-slot:visible').count();
    expect(ads).toBeGreaterThan(0);
    expect(ads).toBeLessThanOrEqual(Math.floor(entries / 4));
  });
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
    await expect(page.locator('.grid article')).toHaveCount(launched);
    await expect(page.getByText('GTA 6: 19 November 2026')).toBeVisible();
    await page.getByRole('link', { name: 'Oldest first' }).click();
    await expect(page).toHaveURL('/oldest/');
  });
});

test('the toggles switch order and view', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.year h2').first()).toHaveText('2026');
  await page.getByRole('link', { name: 'Oldest first' }).click();
  await expect(page).toHaveURL('/oldest/');
  await expect(page.locator('.year h2').first()).toHaveText('2013');
  await page.getByRole('link', { name: 'Lines' }).click();
  await expect(page).toHaveURL('/lines/oldest/');
  await expect(page.getByRole('link', { name: 'Lines' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.timeline .entry')).toHaveCount(launched);
});

// Most months hold one or two cards: a grid per month would leave most of each desktop row empty.
test('the card view has one grid per year, with a month tile in the row', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.year > .grid')).toHaveCount(await page.locator('.year').count());
  await expect(page.locator('.grid > .month h3').first()).toHaveText('November');
});

// AdSense sizes a responsive unit from its own width; a zero-width <ins> never fills.
test('an AdSense unit spans its ad card', async ({ page }) => {
  await page.goto('/');
  const width = await page.evaluate(() => {
    const card = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('.ad-card')].find(
        (el) => /** @type {HTMLElement} */ (el).offsetParent,
      )
    );
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    card.prepend(ins);
    return [ins.offsetWidth, card.clientWidth];
  });
  expect(width[0]).toBeGreaterThan(width[1] / 2);
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
