import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: 'review.spec.js',
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4322' },
  webServer: {
    command: 'node e2e/review-server.js',
    url: 'http://127.0.0.1:4322/',
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
});
