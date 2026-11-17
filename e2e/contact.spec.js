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

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page still gives the takedown address', async ({ page }) => {
    await page.goto('/contact/');
    await expect(
      page.getByRole('main').getByRole('link', { name: 'takedown@lav.ren' }),
    ).toHaveAttribute('href', 'mailto:takedown@lav.ren');
  });
});
