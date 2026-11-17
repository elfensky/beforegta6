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
