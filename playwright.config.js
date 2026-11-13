import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

// Runs against the built site (npm run build first). Astro 7 backgrounds `astro preview` when it detects an agent
// session, so the command clears those markers and Playwright keeps owning the server process.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `env -u CLAUDECODE -u AI_AGENT -u CLAUDE_CODE_ENTRYPOINT npx astro preview --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
  ],
});
