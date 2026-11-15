# Line timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the small-card timeline and the view toggle with one centred line timeline (one row per event, day count, image on hover) and ship it to production before the GTA 6 launch.

**Architecture:** Two small pure functions (`splitTitle`, `daysBefore`) and new `withAdSlots` defaults in `src/lib/`. `Timeline.astro` and `TimelineItem.astro` render one `<ol class="timeline">` per year; all layout lives in `src/styles/global.css`. The lines pages go, `/timeline/` gets an nginx 301.

**Tech Stack:** Astro 7 static, plain JavaScript + JSDoc (checkJs strict), Vitest, Playwright + axe, nginx.

**Spec:** `docs/superpowers/specs/2026-11-15-line-timeline-design.md`

## Global Constraints

- Pages: `/` newest first, `/oldest/` oldest first. No other timeline pages.
- Row DOM order: date, node, title link + day count, hover figure.
- Title: full text in one link; frame `We got ` and ` before GTA 6` in `--muted`; the space in "GTA 6" is U+00A0.
- Day count: `617 days`, `1 day`, `1,412 days` (en-GB separator); none when the count is 0 or less.
- Breakpoint 960 px. Below: line at the left edge, row = date + day count, then title. From 960 px: `1fr 2.5rem 1fr`, line at 50 %.
- Timeline column max 56rem. Line drawn per row and per year heading; milestones and ads draw none.
- Hover figure: `display: none` at rest at every width; shown from 960 px on `:hover` under `(hover: hover)` and when the row's link has `:focus-visible`. About 16rem wide, `alt=""`, widths 256/512, `sizes="16rem"`, 3:2 crop, caption `photo: <imageCredit.text>`, plain text. NSFW: an "NSFW" tile, never the image.
- Milestone and ad rows stack above the figure (`z-index`).
- Ads: `withAdSlots` defaults `every = 10`, `desktopEvery = 20`.
- Verification gate: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"`, then `npm run test:e2e`.
- Commits as `andrei@lav.ren`. Never the GitHub skip marker in a commit message.

## Review Focus

- A title without the "We got … before GTA 6" form renders whole, not empty (Task 1 test).
- A card dated on the launch day or later shows no "0 days" or negative count (Task 1 test, Task 2 render guard).
- Touch screens at ≥ 960 px (tablets): a tap must not leave a stuck image (Task 2: `(hover: hover)` gate).
- The first load fetches no card image at desktop width (Task 3 e2e).
- A hover image near a milestone or an ad goes under it, never over it (Task 2 CSS, checked in the Task 4 screenshot).

---

### Task 1: Pure functions

**Files:**
- Modify: `src/lib/cards.js` (add `splitTitle`, delete `monthOf`)
- Modify: `src/lib/countdown.js` (add `daysBefore`)
- Modify: `src/lib/ads.js` (defaults 10 and 20, doc comment)
- Test: `src/__tests__/cards.test.js`, `src/__tests__/countdown.test.js`, `src/__tests__/ads.test.js`

**Interfaces:**
- Produces: `splitTitle(title: string) => { before: string, event: string, after: string }`; `daysBefore(date: Date, launch: { year: number, monthIndex: number, day: number }) => number`; `withAdSlots(items, { every = 10, desktopEvery = 20 } = {})`.

- [ ] **Step 1: Write the failing tests**

```js
// cards.test.js
test('splitTitle: frame and event, no-break space in GTA 6', () => {
  expect(splitTitle('We got blue Texas before GTA 6')).toEqual({
    before: 'We got ', event: 'blue Texas', after: ' before GTA 6',
  });
});
test('splitTitle: a title without the frame stays whole', () => {
  expect(splitTitle('GTA 6 comes out')).toEqual({ before: '', event: 'GTA 6 comes out', after: '' });
});
// countdown.test.js
const LAUNCH = { year: 2026, monthIndex: 10, day: 19 };
test('daysBefore: whole UTC days to the launch day', () => {
  expect(daysBefore(new Date('2025-03-12'), LAUNCH)).toBe(617);
  expect(daysBefore(new Date('2026-11-18'), LAUNCH)).toBe(1);
  expect(daysBefore(new Date('2026-11-19'), LAUNCH)).toBe(0);
  expect(daysBefore(new Date('2026-11-20'), LAUNCH)).toBe(-1);
});
// ads.test.js: replace the 20-items test
test('40 items: a mobile slot every 10, a desktop slot every 20, none at the end', () => {
  expect(ads(withAdSlots(items(40)))).toEqual([[10, false], [21, true], [32, false]]);
});
```

Also: `8 items` → `20 items: no trailing slot` expecting `[[10, false]]`; `3 items` → `9 items: no slot`. Delete the `monthOf` test and its import.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/__tests__/cards.test.js src/__tests__/countdown.test.js src/__tests__/ads.test.js`
Expected: FAIL (`splitTitle` and `daysBefore` not exported, ad positions differ).

- [ ] **Step 3: Implement**

`splitTitle`: one regex `/^(We got )(.+)( before GTA 6)$/`; `after` gets U+00A0 in place of the last space. `daysBefore`: `Math.round((Date.UTC(launch.year, launch.monthIndex, launch.day) - date.getTime()) / 86_400_000)` (content dates are UTC midnights). `withAdSlots`: change the defaults only.

- [ ] **Step 4: Run them and see them pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit** — `feat(timeline): split titles, count days to the launch, one ad per screen`

### Task 2: Line timeline markup and CSS

**Files:**
- Modify: `src/components/Timeline.astro` (drop `view`, the View toggle group, `eager`, the month grouping; one `<ol class="timeline">` per year)
- Modify: `src/components/TimelineItem.astro` (drop `view` and `eager`; card row per Global Constraints; milestone and ad unchanged in content)
- Modify: `src/components/Card.astro` (drop `small`)
- Modify: `src/styles/global.css` (delete `.grid`, `.month`, `.card.small`, the old `.timeline`/`.entry`/`.thumb`/`.nsfw-thumb` rules; add the line timeline)
- Modify: `src/pages/index.astro`, `src/pages/oldest.astro` (drop `view`)
- Delete: `src/pages/lines/index.astro`, `src/pages/lines/oldest.astro`
- Modify: `astro.config.mjs` sitemap filter → `/\/oldest\/$/`

**Interfaces:**
- Consumes: `splitTitle`, `daysBefore` (Task 1), `LAUNCH` from `src/data/site.js`.
- Produces for Task 3: row `li.entry` in `ol.timeline`; `time.date`, `.node`, `.what` (title + days), `.t-title a`, `.days`, `figure.media` (with `img` or `.nsfw` tile); milestone `li.milestone` (`.cap` on the launch); ad `li.ad-slot`; toggles nav `.toggles` with two links.

- [ ] **Step 1: Rewrite the components and pages as listed.** The row markup follows the mockup `.superpowers/brainstorm/21460-1794705626/content/line-timeline-media-v2.html` (`.body` there is `.what` here). The launch milestone (date equals `LAUNCH`) gets `class="milestone cap"` and shows the year.
- [ ] **Step 2: Write the CSS** from the same mockup, translated from `@container` to `@media (min-width: 960px)`; hover rule under `@media (min-width: 960px) and (hover: hover)`; focus rule `.entry:has(a:focus-visible) .media`. `.milestone, .ad-slot { position: relative; z-index: 4 }`, `.media { z-index: 3 }`. Keep `[data-desktop='false'] { display: none }` from 960 px.
- [ ] **Step 3: Build and check**

Run: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"`
Expected: all pass; `dist/lines/` does not exist.

- [ ] **Step 4: Commit** — `feat(timeline): one centred line with a row per event and the image on hover`

### Task 3: e2e, redirect, docs

**Files:**
- Modify: `e2e/site.spec.js`
- Modify: `deploy/nginx.conf` (add `location ~ ^/timeline/?$ { return 301 /; }` before `location /`; `absolute_redirect off` keeps it relative)
- Modify: `deploy/README.md` (one line on the redirect)
- Modify: `docs/superpowers/specs/2026-11-14-timeline-only-design.md` (status line: views replaced by `2026-11-15-line-timeline-design.md`)

- [ ] **Step 1: Update the e2e tests**
  - axe routes: `/`, `/oldest/`, `/flying-cars/`, `/privacy/`, `/does-not-exist/`.
  - 320 px no horizontal scroll: `/`, `/oldest/`.
  - Ad density at 320 px: `entries = .timeline > li:not(.ad-slot)`, `ads = .timeline .ad-slot:visible`, `ads > 0` and `ads <= Math.floor(entries / 10)`.
  - Without JavaScript: `.timeline .entry` count equals `launched`; the launch date shows; "Oldest first" goes to `/oldest/`.
  - Order toggle: first `.year h2` is `2026` on `/`, `2013` on `/oldest/`; "Oldest first" has `aria-current="page"` there; no link named "Lines".
  - New, at 1280 × 900: collect requests with `resourceType() === 'image'` during `goto('/')` → 0; hover the first `.entry` → its `.media img` is visible.
  - Delete the month-tile test.
- [ ] **Step 2: Run** `npm run test:e2e` — expected all pass (check port 4321 is free first).
- [ ] **Step 3: Commit** — `test(timeline): cover the line timeline; redirect /timeline/ to /`

### Task 4: Ship

- [ ] **Step 1:** Push `feat/line-timeline`, open a PR to `develop`, wait for `check`, `gh pr merge --rebase`. Staging deploys.
- [ ] **Step 2:** Check staging at 1280 px and 390 px (screenshot), `/oldest/`, and that `/lines/` is 404.
- [ ] **Step 3:** Open a PR `develop` → `main`, wait for `check`, merge with `--rebase`. Production deploys.
- [ ] **Step 4:** Check production: `/` shows the line timeline, `/timeline/` answers 301 to `/` (`/usr/bin/curl -sI`), a card page loads.
