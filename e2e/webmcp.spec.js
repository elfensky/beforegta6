import { expect, test } from '@playwright/test';
import { CONTACT_SUBJECTS } from '../src/data/site.js';

// Website standard GEO-08. Full Chromium, not the headless shell: only it has the WebMCP feature.
test.skip(({ browserName }) => browserName !== 'chromium', 'WebMCP exists only in Chromium');
test.use({ channel: 'chromium', launchOptions: { args: ['--enable-features=WebMCP'] } });

test.beforeEach(async ({ page }) => {
  await page.route('**/challenges.cloudflare.com/**', (route) => route.abort());
});

test('an agent sees the four visitor fields and no hidden or trap field', async ({ page }) => {
  await page.goto('/contact/');
  const tools = await page.evaluate(async () =>
    (await document.modelContext.getTools()).map(({ name, inputSchema }) => ({
      name,
      inputSchema,
    })),
  );
  expect(tools.map((tool) => tool.name)).toEqual(['send_message']);
  const schema = tools[0].inputSchema;
  expect(Object.keys(schema.properties)).toEqual(['subject', 'email', 'link', 'message']);
  expect(schema.required.toSorted()).toEqual(['email', 'message', 'subject']);
  // Chrome lists the empty "Choose a subject" prompt too, disabled or not; `required` rejects it on Send.
  expect(schema.properties.subject.enum).toEqual(['', ...CONTACT_SUBJECTS]);
  for (const property of Object.values(schema.properties)) {
    expect(property.description).toBeTruthy();
  }
});

test('the page carries the WebMCP origin-trial token for this site and its subdomains', async ({
  page,
}) => {
  await page.goto('/contact/');
  const token = await page.locator('meta[http-equiv="origin-trial"]').getAttribute('content');
  // A token is 1 version byte, a 64-byte signature and a 4-byte length, then its JSON payload.
  const payload = JSON.parse(Buffer.from(token, 'base64').subarray(69).toString());
  expect(payload).toMatchObject({
    origin: 'https://beforegta6.wtf:443',
    feature: 'WebMCP',
    isSubdomain: true,
  });
  // Fails once the trial ends (2027-03-30): renew the token, or remove it (deploy/README.md § Contact form).
  expect(payload.expiry * 1000).toBeGreaterThan(Date.now());
});
