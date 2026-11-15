---
last_mapped_commit: 9d66e1a8a7a921f9cab223ca26cf4950205412f1
last_mapped_at: 2026-11-15
---
# Testing Patterns

**Analysis Date:** 2026-11-15

## Test Framework

**Unit and content tests:**
- Vitest 5 (`package.json` devDependency `vitest` `^5.1.0`)
- Config: `vitest.config.js`. It sets `include: ['src/**/*.test.js']`, so only tests under `src/` run under Vitest.
- Assertion library: Vitest built-in `expect`. No extra matcher library.
- YAML parsing in tests uses the `yaml` package (`src/__tests__/candidate.test.js`, `src/__tests__/cards.test.js`).

**End-to-end tests:**
- Playwright Test 1.65 (`@playwright/test`)
- Accessibility checks: `@axe-core/playwright` (`AxeBuilder`)
- Config: `playwright.config.js`
  - `testDir: 'e2e'`, `fullyParallel: true`
  - Three browser projects: `chromium` (Desktop Chrome), `webkit` (Desktop Safari), `firefox` (Desktop Firefox)
  - `webServer` runs `astro preview` on `127.0.0.1:4321` against the built `dist/`. It reuses a running server outside CI (`reuseExistingServer: !process.env.CI`).
  - Reporter: `github` in CI, `list` locally.

**HTML validation (not a test runner, but a gate):**
- `html-validate` 11 runs on the built output: `npx html-validate "dist/**/*.html"`. Config is not in a separate file; defaults apply in CI.

**Run Commands:**
```bash
npm test                    # Vitest unit and content tests (src/**/*.test.js)
npm run test:e2e            # Playwright against the built site (needs npm run build first)
npm run lint                # eslint . && prettier --check .
npm run build               # Astro static build into dist/
npx html-validate "dist/**/*.html"   # HTML validation of the build output
npm run cards               # Regenerate cards and research/candidates.md (runs no tests; run npm test after it)
```

**Verification gate (from `AGENTS.md`, in CI order):**
```bash
npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"
```
Run this before calling work done. `npm run test:e2e` is a separate step that CI runs after `html-validate`.

**Watch mode and coverage:**
- No watch script is defined in `package.json`. Run `npx vitest` directly for watch mode (not configured in the repo).
- No coverage script or coverage config exists.

## Test File Organization

**Location:**
- Unit and content tests are separate from source: `src/__tests__/*.test.js`. They are not co-located with `src/lib/*.js`.
- Scripts' pure logic is tested through `src/__tests__/candidate.test.js`, which imports `../../scripts/lib/candidate.js`.
- E2E tests live in `e2e/`, one spec file: `e2e/site.spec.js`.

**Naming:**
- Vitest: `<topic>.test.js`, one file per module or concern.
  - `candidate.test.js` (scripts/lib/candidate.js)
  - `cards.test.js` (src/lib/cards.js)
  - `countdown.test.js` (src/lib/countdown.js)
  - `meta.test.js` (src/lib/meta.js)
  - `content.test.js` (card files and research data)
  - `deploy.test.js` (pin-image script and the skip-marker rule)
  - `smoke.test.js` (one trivial test so Vitest exits 0 on the first commit)
- Playwright: `<area>.spec.js`. The repo has `site.spec.js` only.

**Structure:**
```
src/__tests__/
  candidate.test.js     # pure pipeline functions
  cards.test.js         # timeline order, splitTitle, ogImageOf
  content.test.js       # reads src/content/cards/*.md and research/*.json; generated-content gate
  countdown.test.js     # remaining, daysBefore
  deploy.test.js        # reads scripts/pin-image.sh as text
  meta.test.js          # pageTitle length rules
  smoke.test.js         # trivial
e2e/
  site.spec.js          # all browser-level checks
```

## Test Structure

**Suite Organization:**
Vitest uses top-level `test()` calls, with no `describe` blocks in the unit tests. Import `expect` and `test` from `vitest` on every file.
```javascript
import { expect, test } from 'vitest';
import { daysBefore, remaining } from '../lib/countdown.js';

const LAUNCH = { year: 2026, monthIndex: 10, day: 19 };
test('daysBefore: whole UTC days to the launch day', () => {
  expect(daysBefore(new Date('2025-03-12'), LAUNCH)).toBe(617);
});
```

Test names follow `<function>: <behaviour>` or a plain sentence describing the rule:
- `'timeline: oldest first, milestone before card on the same date, year set'` (`cards.test.js`)
- `'splitTitle: frame and event, no-break space in GTA 6'` (`cards.test.js`)
- `'rejects a bad id'`, `'rejects a missing source'` (`candidate.test.js`)

**Playwright suites:**
- Use `test.describe` to group tests that share a viewport or a JavaScript setting.
- Set the context per block with `test.use({ viewport: ... })` or `test.use({ javaScriptEnabled: false })`.
```typescript
test.describe('at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const route of ['/', '/oldest/']) {
    test(`no horizontal scroll on ${route}`, async ({ page }) => { /* ... */ });
  }
});
```

**Patterns:**
- Setup: build data inline or in a factory. No `beforeEach` in the repo. Shared fixtures are module-level `const` values (`timelineCards`, `trailer` in `cards.test.js`).
- Teardown: none needed. Tests are pure or read-only. Playwright manages the browser context.
- Assertion: `toBe`, `toEqual`, `toMatchObject`, `toContain`, `toMatch`, `toThrow` for unit tests. `toHaveCount`, `toBeVisible`, `toBeHidden`, `toBeFocused`, `toHaveText`, `toHaveAttribute` and `expect.poll` for Playwright.
- Assertion messages: pass a second argument when the failure needs a hint. Example in `content.test.js`: `expect(readFileSync(...), 'run npm run cards').toBe(reviewTable(data))`, and `expect(image, c.id).toBeDefined()`.

## Mocking

**Framework:** None in Vitest. No `vi.mock`, `vi.fn` or spies appear in the repo. Tests use plain data.

**Pattern for test data (Vitest):** Override-style factories. Build one valid fixture, then override the fields a test needs:
```javascript
/** @param {Record<string, unknown>} overrides */
const fixture = (overrides = {}) => ({
  id: 'flying-cars',
  title: 'We got flying cars before GTA 6',
  // ... every required field ...
  status: 'launch',
  ...overrides,
});

// usage: a missing source
expect(() => toCard(fixture({ source_url: null }))).toThrow('flying-cars: source_url missing');
```
The same approach appears in `src/__tests__/cards.test.js` as `card({ id, date, status, nsfw, title })`. That factory casts its result with `/** @type {any} */` because it mirrors an Astro collection entry.

**Mocking in Playwright (network and browser APIs):**
- Block a third-party request with `page.route` and `route.abort()`:
```javascript
await page.route('https://umami.lav.ren/**', () => {});   // never answers
await page.route('https://umami.lav.ren/**', (r) => r.abort());
```
- Record a request, then abort it:
```javascript
await page.route('https://pagead2.googlesyndication.com/**', (r) => {
  google.push(r.request().url());
  return r.abort();
});
```
- Replace a browser API before page scripts run with `page.addInitScript`:
```javascript
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => ... });
});
```
- Fix the clock with `page.clock.setFixedTime(new Date(2026, 10, 19, 0, 1))` to test time-gated UI.
- Serve the apex host from the test server by fulfilling the route with `r.fetch` pointed at `baseURL` (`e2e/site.spec.js`, AdSense test).

**What to Mock:**
- Third-party scripts and beacons (Umami, Google AdSense). Tests must not send requests to external hosts.
- Browser APIs that differ by browser or are absent in the test browser (`navigator.share`, `navigator.clipboard`).
- Time, for countdown and launch-state tests.

**What NOT to Mock:**
- The site itself. E2E tests run against the built `dist/` served by `astro preview`.
- Pure functions. Unit tests call them directly with fixtures.
- The filesystem in content tests. `src/__tests__/content.test.js` reads the real `src/content/cards/` and `research/candidates.json`, and it is the gate for generated content.

## Fixtures and Factories

**Test Data:**
- Inline fixtures per file. There is no shared fixtures directory.
- Use realistic values: real card titles, real dates, real URL shapes (`https://x.com/a/status/1`).
- Put the expected output next to the input in the same test so a reader sees both.

**Location:**
- Factories are defined at the top of the test file that uses them.
- Real data for content tests comes from `src/content/cards/`, `research/candidates.json`, `research/candidates.md` and `src/assets/cards/`.

## Coverage

**Requirements:** None enforced. No coverage threshold in `vitest.config.js` or `package.json`.

**View Coverage:** Not configured. To measure coverage, add `@vitest/coverage-v8` and a script. This is not set up in the repo.

## Test Types

**Unit Tests (Vitest):**
- Scope: pure functions in `src/lib/` and `scripts/lib/`.
- Approach: direct calls with inline data. Assert exact outputs with `toEqual`. Test edge cases the code names: ties on the same day, pipes in table cells, quotes and emoji in YAML, apostrophes that count as HTML escapes.

**Content and Gate Tests (Vitest):**
- Scope: the built data the site ships. `content.test.js` checks that every card is live, has an image, matches the generated Markdown exactly, and carries no research notes.
- `deploy.test.js` reads a shell script as text and asserts that the skip marker is absent.
- These tests fail when a hand edit drifts from `npm run cards`. The fix is to edit `research/candidates.json` and rerun the script, not to change the test.

**Integration Tests (Playwright):**
- Scope: the rendered site in three browsers: axe accessibility rules, horizontal scroll at 320 px, the skip link, a no-JavaScript path, the countdown with a stalled analytics script, the AdSense script on the apex only, the order toggle, hover-only images, footer text, share and copy buttons, and the launch-state line.
- `e2e/site.spec.js` covers the rules documented in `AGENTS.md` and `deploy/README.md`. Add new user-visible rules here.

**E2E Tests:**
- Framework: Playwright. Run with `npm run test:e2e` after `npm run build`.
- Routes checked by axe: `/`, `/oldest/`, one card page, `/privacy/`, and `/does-not-exist/` (the 404 page).
- The e2e suite is slow: axe over the full timeline takes about 11 s in Firefox alone (`e2e/site.spec.js` comment). CI runs it after the HTML validation (`.github/workflows/ci.yml`).

## Common Patterns

**Async Testing (Playwright):**
```javascript
await page.goto('/');
await expect(page.locator('.timeline .entry')).toHaveCount(launched);
// Poll a value that changes over time
await expect.poll(() => google.length).toBe(1);
```
Use `expect.poll` for values set by a request or script after load. Use the locator assertions (`toHaveCount`, `toBeVisible`) instead of fixed waits. No `waitForTimeout` appears in the repo; keep it that way.

**Async Testing (Vitest):** No async unit tests exist. Pure functions are synchronous. If one is added, use `async () => {}` and `await expect(...).resolves`.

**Error Testing (Vitest):**
```javascript
expect(() => toCard(fixture({ id: 'Flying Cars!' }))).toThrow('id');
expect(() => toCard(fixture({ status: 'Launch' }))).toThrow('flying-cars: status');
```
Match the message with a substring that names the id and field. For a list of errors, assert the whole array with `toEqual`, as `checkCandidates` tests do.

**Accessibility Testing (Playwright):**
```javascript
const { violations } = await new AxeBuilder({ page }).analyze();
expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
```
Report violations by rule id and node count. A failure lists the rule that broke.

**Layout Testing (Playwright):**
```javascript
const [scroll, client] = await page.evaluate(() => [
  document.documentElement.scrollWidth,
  document.documentElement.clientWidth,
]);
expect(scroll).toBeLessThanOrEqual(client);
```

**Browser-specific Handling:**
- WebKit on macOS skips links on plain Tab. The skip-link test uses `Alt+Tab` for WebKit only (`browserName === 'webkit'`).
- Firefox reports the favicon as an image request. Filter image requests to `/_astro/` when checking that no card image loads.

## Where to Add a New Test

- Pure logic in `src/lib/` (order, date math, string rules): add to the matching `src/__tests__/<module>.test.js`. If there is no file for that module, create `src/__tests__/<module>.test.js`.
- Logic in `scripts/lib/`: add to `src/__tests__/candidate.test.js`, because it covers the candidate pipeline.
- Rule about generated card content or research data: add to `src/__tests__/content.test.js`.
- User-visible behaviour, layout or accessibility: add a `test` or `test.describe` to `e2e/site.spec.js`.
- Any new non-trivial logic (a branch, a loop, a parser) needs at least one test. Trivial changes need none.

---

*Testing analysis: 2026-11-15*
