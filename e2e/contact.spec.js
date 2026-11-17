import { expect, test } from '@playwright/test';
import { CONTACT_SUBJECTS, FORMSPARK_FORM_ID } from '../src/data/site.js';

// CI must not depend on Cloudflare: the Turnstile widget never loads in these tests.
test.beforeEach(async ({ page }) => {
  await page.route('**/challenges.cloudflare.com/**', (route) => route.abort());
});

test('the form posts to Formspark with the redirect and no appended fields', async ({
  page,
  baseURL,
}) => {
  await page.goto('/contact/');
  const form = page.locator('form');
  await expect(form).toHaveAttribute('action', `https://submit-form.com/${FORMSPARK_FORM_ID}`);
  await expect(form).toHaveAttribute('method', 'post');
  await expect(form.locator('input[name="_append"]')).toHaveValue('false');
  // The script points the redirect at the current origin, so staging returns to staging.
  await expect(form.locator('input[name="_redirect"]')).toHaveValue(`${baseURL}/contact/sent/`);
});

test('the subject list holds the five subjects in order', async ({ page }) => {
  await page.goto('/contact/');
  const options = page.locator('select[name="subject"] option:not([value=""])');
  await expect(options).toHaveText(CONTACT_SUBJECTS);
  expect(CONTACT_SUBJECTS).toEqual([
    'Suggest a card',
    'Fix a card (wrong date or link)',
    'Takedown request',
    'Privacy request',
    'Something else',
  ]);
});

test('the honeypot is out of reach', async ({ page }) => {
  await page.goto('/contact/');
  const trap = page.locator('input[name="gender"]');
  await expect(trap).toHaveAttribute('tabindex', '-1');
  await expect(trap).toHaveAttribute('autocomplete', 'off');
  await expect(page.locator('[aria-hidden="true"] input[name="gender"]')).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Gender' })).toHaveCount(0);
});

test('a send without the bot check keeps the visitor on the page and gives the address', async ({
  page,
}) => {
  await page.goto('/contact/');
  await page.getByLabel('Subject').selectOption('Takedown request');
  await page.getByLabel('Your email address').fill('visitor@example.test');
  await page.getByLabel('Message').fill('Please remove my meme.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page).toHaveURL('/contact/');
  const alert = page.getByRole('alert');
  await expect(alert).toBeFocused();
  await expect(alert.getByRole('link', { name: 'takedown@lav.ren' })).toBeVisible();
  await expect(page.getByLabel('Message')).toHaveValue('Please remove my meme.');
  await expect(alert).toContainText('and write to takedown@lav.ren.');
});

test('the words before each link keep their space', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.getByRole('main')).toContainText('checks that a person sends it. See Privacy.');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page still gives the takedown address', async ({ page, request }) => {
    await page.goto('/contact/');
    await expect(
      page.getByRole('main').getByRole('link', { name: 'takedown@lav.ren' }).first(),
    ).toHaveAttribute('href', 'mailto:takedown@lav.ren');
    // Playwright does not render <noscript> with JavaScript off, so check the HTML the server sends.
    const html = await (await request.get('/contact/')).text();
    expect(html).toContain(
      '<noscript><p>The form needs JavaScript for its bot check. Without it, write to <a href="mailto:takedown@lav.ren">',
    );
  });
});
