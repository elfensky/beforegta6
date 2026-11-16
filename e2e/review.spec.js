import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createReviewServer } from '../scripts/review/server.js';
import { reviewFixture } from '../src/__tests__/review-fixture.js';

test('buttons save choices, Previous corrects them, and Skip preserves status', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'First <script>alert(1)</script>',
  );
  await expect(page.locator('#sources a')).toHaveCount(1);
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('second');
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('launch');
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#progress')).toHaveText(
    'Review complete. 2 of 2 visited. 1 protected hold.',
  );
  const state = await (await page.request.get('/api/state')).json();
  expect(state.candidates[0].status).toBe('drop');
  await page.reload();
  await expect(page.locator('#status')).toHaveText('drop');
});

test('arrow keys and horizontal swipes save choices without vertical swipe actions', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('second');
  const card = page.locator('#candidate');
  await card.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: 200,
    clientY: 100,
  });
  await card.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: 210,
    clientY: 250,
  });
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('second');
  await card.dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    clientX: 200,
    clientY: 100,
  });
  await card.dispatchEvent('pointerup', {
    pointerId: 2,
    pointerType: 'touch',
    clientX: 80,
    clientY: 110,
  });
  await expect(page.locator('#progress')).toContainText('Review complete');
  const state = await (await page.request.get('/api/state')).json();
  expect(state.candidates.map((c) => c.status)).toEqual(['launch', 'drop']);
});

test('failed saves keep the candidate visible and require a fresh state after stale writes', async ({
  page,
}) => {
  await page.goto('/');
  const state = await (await page.request.get('/api/state')).json();
  await page.request.post('/api/decision', {
    headers: { origin: 'http://127.0.0.1:4322', 'x-review-token': state.token },
    data: { id: 'second', status: 'launch', revision: state.revision },
  });
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('changed');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'First <script>alert(1)</script>',
  );
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('alert')).toBeHidden();
  await page.route('**/api/decision', (route) => route.abort());
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'First <script>alert(1)</script>',
  );
});

test('the page reflows at 320px and exposes accessible controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'No', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('an image that cannot load blocks Yes through buttons, keys, and swipes', async ({ page }) => {
  await page.route('**/image/first?*', (route) =>
    route.fulfill({ contentType: 'image/png', body: 'broken image' }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('image could not load');
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeDisabled();
  const submitted = page.waitForRequest('**/api/decision', { timeout: 500 }).then(
    () => true,
    () => false,
  );
  await page.keyboard.press('ArrowRight');
  const card = page.locator('#candidate');
  await card.dispatchEvent('pointerdown', {
    pointerId: 3,
    pointerType: 'touch',
    clientX: 80,
    clientY: 100,
  });
  await card.dispatchEvent('pointerup', {
    pointerId: 3,
    pointerType: 'touch',
    clientX: 220,
    clientY: 100,
  });
  expect(await submitted).toBe(false);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'First <script>alert(1)</script>',
  );
  await page.unroute('**/image/first?*');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
});

test('Fetch image shows a local preview without selecting the candidate', async ({ page }) => {
  const { root, data } = await reviewFixture();
  const png = await readFile(join(root, 'research/images/second.png'));
  await rm(join(root, 'research/images/first.png'));
  data.candidates[0].image_url = 'https://images.example/first.png';
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  const server = createReviewServer({
    root,
    downloadImage: async () => ({ extension: 'png', bytes: png }),
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Fetch image', exact: true }).click();
    await expect(page.locator('#image')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
    await expect(page.locator('#status')).toHaveText('drop');
    expect(JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8'))).toEqual(
      data,
    );
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
    await rm(root, { recursive: true, force: true });
  }
});
