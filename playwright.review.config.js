import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.REVIEW_TEST_PORT ?? 4322);

export default defineConfig({
  testDir: 'e2e',
  testMatch: 'review.spec.js',
  workers: 1,
  // A stray test.only would quietly narrow the required check.
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: 'node e2e/review-server.js',
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
});
