import { expect, test } from '@playwright/test';

test('the opt-out button sets and clears the Umami flag', async ({ page }) => {
  await page.goto('/privacy/');
  const flag = () => page.evaluate(() => localStorage.getItem('umami.disabled'));
  const status = page.getByRole('status');
  await page.getByRole('button', { name: 'Stop counting my visits' }).click();
  expect(await flag()).toBe('1');
  await expect(status).toHaveText('Not counted.');
  await page.getByRole('button', { name: 'Count my visits again' }).click();
  expect(await flag()).toBeNull();
  await expect(status).toHaveText('Counted.');
});

test('a browser that blocks storage gets a message, not an error', async ({ page }) => {
  /** @type {Error[]} */
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
  });
  await page.goto('/privacy/');
  await page.getByRole('button', { name: 'Stop counting my visits' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'This browser blocks storage, so the choice cannot be saved.',
  );
  expect(errors).toEqual([]);
});

test('the privacy page names the contact form recipients', async ({ page }) => {
  await page.goto('/privacy/');
  const main = page.getByRole('main');
  await expect(main).toContainText('Formspark');
  await expect(main).toContainText('Turnstile');
  await expect(main).not.toContainText('no forms');
  await expect(page.locator('#contact-form')).toHaveCount(1);
});

test('the privacy page states what the scripts really do', async ({ page }) => {
  await page.goto('/privacy/');
  const main = page.getByRole('main');
  await expect(main).toContainText('and how long it was open');
  await expect(main).toContainText('This button stops Umami from counting your visits');
  await expect(main).toContainText('When you open the contact page, Cloudflare Turnstile');
  await expect(main).toContainText('our legitimate interest in keeping spam out');
  await expect(main).toContainText('Formspark also receives your IP address');
  await expect(main).toContainText('Questions or requests: the contact form or takedown@lav.ren.');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the opt-out button stays hidden', async ({ page }) => {
    await page.goto('/privacy/');
    // The button is in the HTML, but only the script shows it: without it, the button would do nothing.
    await expect(page.locator('#optout')).toHaveCount(1);
    await expect(page.locator('#optout')).toBeHidden();
  });
});
