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
  await expect(page.locator('#decision')).toHaveText('Not decided.');
  await expect(page.locator('#decisions')).toHaveText('0 of 2 decided.');
  // No must record an explicit decision even though this item already has drop status.
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await expect(page.locator('#decisions')).toHaveText('1 of 2 decided.');
  await expect(page.locator('#decision')).toHaveText('Not decided.');
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('#decision')).toContainText('Decided: No.');
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('second');
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('launch');
  await expect(page.locator('#decision')).toContainText('Decided: Yes.');
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.locator('#decisions')).toHaveText('1 of 2 decided.');
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#progress')).toHaveText(
    'Review complete. 2 of 2 visited. 1 protected hold.',
  );
  await page.reload();
  await expect(page.locator('#progress')).toHaveText(
    'Review complete. 2 of 2 visited. 1 protected hold.',
  );
  const state = await (await page.request.get('/api/state')).json();
  expect(state.candidates[0].status).toBe('drop');
  expect(state.candidates[0].review_decision.choice).toBe('no');
  expect(state.candidates[1]).not.toHaveProperty('review_decision');
  await page.getByRole('spinbutton', { name: 'Go to item', exact: true }).fill('1');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#status')).toHaveText('drop');
  await expect(page.locator('#decision')).toContainText('Decided: No.');
  await expect(page.locator('#decisions')).toHaveText('1 of 2 decided.');
});

test('item URLs, next, previous, number jumps, and browser history preserve notes and selections', async ({
  page,
}) => {
  await page.goto('/first');
  await expect(page.locator('#progress')).toContainText('Candidate 1 of 2');
  await expect(page.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  await notes.fill('First navigation note.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/\/second$/);
  await expect(page.locator('#progress')).toContainText('Candidate 2 of 2');
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await notes.fill('Second navigation note.');
  await page.goBack();
  await expect(page).toHaveURL(/\/first$/);
  await expect(notes).toHaveValue('First navigation note.');
  await page.goForward();
  await expect(page).toHaveURL(/\/second$/);
  await expect(notes).toHaveValue('Second navigation note.');
  const number = page.getByRole('spinbutton', { name: 'Go to item', exact: true });
  for (const invalid of ['0', '3', '1.5', '']) {
    await number.fill(invalid);
    await page.getByRole('button', { name: 'Go', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('1 to 2');
    await expect(page).toHaveURL(/\/second$/);
  }
  await number.fill('1');
  await number.press('Enter');
  await expect(page).toHaveURL(/\/first$/);
  const saved = await (await page.request.get('/api/state')).json();
  expect(saved.candidates.map((c) => c.status)).toEqual(['drop', 'drop']);
  expect(saved.candidates.map((c) => c.review_notes)).toEqual([
    'First navigation note.',
    'Second navigation note.',
  ]);
});

test('reload, root visits, and a reopened tab resume the item while explicit URLs take priority', async ({
  page,
  context,
}) => {
  await page.goto('/second');
  await expect(page.locator('#title')).toHaveText('second');
  await page.reload();
  await expect(page).toHaveURL(/\/second$/);
  await expect(page.locator('#title')).toHaveText('second');
  await page.goto('/');
  await expect(page).toHaveURL(/\/second$/);
  const reopened = await context.newPage();
  await reopened.goto(new URL('/', page.url()).href);
  await expect(reopened).toHaveURL(/\/second$/);
  await reopened.close();
  await page.goto('/first');
  await expect(page.locator('#progress')).toHaveText(
    'Candidate 1 of 2. 2 visited. 1 protected hold.',
  );
  await expect(page).toHaveURL(/\/first$/);
  await page.goto('/missing-item');
  await expect(page.getByRole('alert')).toContainText('not available');
  await expect(page.locator('#candidate')).toBeHidden();
  await page.getByRole('spinbutton', { name: 'Go to item', exact: true }).fill('2');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page).toHaveURL(/\/second$/);
});

test('failed note saves block number jumps and restore the current URL after browser Back', async ({
  page,
}) => {
  await page.goto('/first');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/\/second$/);
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  await notes.fill('Keep this pending instruction.');
  await page.route('**/api/notes', (route) => route.abort());
  await page.getByRole('spinbutton', { name: 'Go to item', exact: true }).fill('1');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/second$/);
  await expect(notes).toHaveValue('Keep this pending instruction.');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/second$/);
  await expect(page.locator('#title')).toHaveText('second');
  await expect(notes).toHaveValue('Keep this pending instruction.');
  await page.unroute('**/api/notes');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page).toHaveURL(/\/first$/);
  const saved = await (await page.request.get('/api/state')).json();
  expect(saved.candidates[1].review_notes).toBe('Keep this pending instruction.');
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
    headers: { origin: new URL(page.url()).origin, 'x-review-token': state.token },
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
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('second');
  await expect(page.getByRole('alert')).toBeVisible();
});

test('the page reflows at 320px and exposes accessible controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'No', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('notes save on disk, survive navigation, and do not turn text editing into a vote', async ({
  page,
}) => {
  await page.goto('/');
  const initial = await (await page.request.get('/api/state')).json();
  const secondNote = initial.candidates[1].review_notes ?? '';
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  const text = 'Replace this image.\nUse a wider crop 🖼️';
  await notes.fill(text);
  await notes.press('ArrowRight');
  await notes.press('ArrowLeft');
  await notes.dispatchEvent('pointerdown', {
    pointerType: 'touch',
    pointerId: 4,
    clientX: 80,
    clientY: 100,
  });
  await notes.dispatchEvent('pointerup', {
    pointerType: 'touch',
    pointerId: 4,
    clientX: 220,
    clientY: 100,
  });
  await expect(notes).toHaveValue(text);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'First <script>alert(1)</script>',
  );
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  await expect(page.locator('#notes-status')).toHaveText('Notes saved.');
  await page.reload();
  await expect(notes).toHaveValue(text);
  await notes.fill('New crop instructions.');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(notes).toHaveValue(secondNote);
  await notes.fill('Adjust the second card caption.');
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(notes).toHaveValue('New crop instructions.');
  await notes.fill('Final first-card instructions.');
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(notes).toHaveValue('Adjust the second card caption.');
  const state = await (await page.request.get('/api/state')).json();
  expect(state.candidates[0]).toMatchObject({
    status: 'launch',
    review_notes: 'Final first-card instructions.',
  });
});

test('failed note saves preserve the draft and stop navigation until it can be saved', async ({
  page,
}) => {
  await page.goto('/');
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  await notes.fill('Do not lose this instruction.');
  await page.route('**/api/notes', (route) => route.abort());
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(notes).toHaveValue('Do not lose this instruction.');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'First <script>alert(1)</script>',
  );
  await page.unroute('**/api/notes');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(notes).toHaveValue('Do not lose this instruction.');
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  await expect(page.locator('#notes-status')).toHaveText('Notes saved.');
  await page.reload();
  await expect(notes).toHaveValue('Do not lose this instruction.');
});

test('a failed preview saves Yes through buttons, keys, and swipes without launching', async ({
  page,
}) => {
  await page.route('**/image/first?*', (route) =>
    route.fulfill({ contentType: 'image/png', body: 'broken image' }),
  );
  for (const action of ['button', 'key', 'swipe']) {
    await page.goto('/first');
    await expect(page.getByRole('alert')).toContainText('image could not load');
    await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
    if (action === 'button') await page.getByRole('button', { name: 'Yes', exact: true }).click();
    else if (action === 'key') await page.keyboard.press('ArrowRight');
    else {
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
    }
    await expect(page).toHaveURL(/\/second$/);
    await expect(page.locator('#message')).toContainText(
      'Yes saved. Image approval needed before launch.',
    );
    const state = await (await page.request.get('/api/state')).json();
    expect(state.candidates[0]).toMatchObject({
      status: 'drop',
      review_decision: { choice: 'yes' },
    });
  }
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('Needs image approval');
  await expect(page.locator('#pending-images')).toContainText('1 selected item');
  await page.reload();
  await expect(page.locator('#decision')).toContainText('Decided: Yes.');
  await page.unroute('**/image/first?*');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page).toHaveURL(/\/second$/);
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('launch');
  await expect(page.locator('#pending-images')).toBeHidden();
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
    await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
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

test('a rejected image download permits notes and a pending Yes, then an approved image can launch', async ({
  page,
}) => {
  const { root, data } = await reviewFixture();
  const png = await readFile(join(root, 'research/images/second.png'));
  await rm(join(root, 'research/images/first.png'));
  data.candidates[0].image_url = 'https://images.example/first.png';
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  let available = false;
  const server = createReviewServer({
    root,
    downloadImage: async () => {
      if (!available) throw new Error('Image source returned HTTP 503.');
      return { extension: 'png', bytes: png };
    },
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
    await page.getByRole('button', { name: 'Fetch image', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('HTTP 503');
    await notes.fill('Please replace this unavailable image.');
    await expect(page.getByRole('button', { name: 'Save notes', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'No', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Save notes', exact: true }).click();
    await expect(page.locator('#notes-status')).toHaveText('Notes saved.');
    expect(
      JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8')).candidates[0],
    ).toMatchObject({
      status: 'drop',
      review_notes: 'Please replace this unavailable image.',
    });
    await page.getByRole('button', { name: 'Fetch image', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('HTTP 503');
    await notes.fill('A replacement is still needed.');
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('second');
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(notes).toHaveValue('A replacement is still needed.');
    await expect(page.locator('#status')).toHaveText('Needs image approval');
    expect(
      JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8')).candidates[0],
    ).toMatchObject({
      status: 'drop',
      review_decision: { choice: 'yes' },
      review_notes: 'A replacement is still needed.',
    });
    available = true;
    await page.getByRole('button', { name: 'Fetch image', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Yes', exact: true })).toBeEnabled();
    await page.reload();
    await expect(notes).toHaveValue('A replacement is still needed.');
    await expect(page.locator('#status')).toHaveText('Needs image approval');
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(page).toHaveURL(/\/second$/);
    expect(
      JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8')).candidates[0],
    ).toMatchObject({ status: 'launch', review_decision: { choice: 'yes' } });
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
    await rm(root, { recursive: true, force: true });
  }
});
