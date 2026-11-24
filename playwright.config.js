import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.SITE_TEST_PORT ?? 4321);

// Runs against the built site (npm run build first). Astro's --ignore-lock keeps the preview
// in the foreground, so Playwright owns its process even inside an agent session.
export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'review.spec.js',
  fullyParallel: true,
  // A stray test.only would quietly narrow the required check.
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `npx astro preview --ignore-lock --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
  ],
});
