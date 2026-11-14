# Timeline as the only view — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The timeline replaces the card wall as the only view, with an order toggle and a view toggle.

**Architecture:** Four static pages render one `Timeline.astro` component with an `order` and a `view` prop. The
toggles are links between the pages. Pure functions in `src/lib/cards.js` decide the order and the grouping.

**Tech Stack:** Astro 7 static output, plain JavaScript with JSDoc, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-timeline-only-design.md`

## Global Constraints

- Pages: `/` newest · cards, `/oldest/` oldest · cards, `/lines/` newest · lines, `/lines/oldest/` oldest · lines.
- No new client JavaScript. Every toggle is a link, and the current one has `aria-current="page"`.
- Ads: `withAdSlots(entries)` with its defaults (every 4, desktop every 8), on the ordered entries.
- The variant pages give `/` as canonical and stay out of the sitemap.
- Pure functions in `src/lib/` decide order and grouping. `.astro` files only render.
- Verification gate: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"`, then `npm run test:e2e`.

## Review Focus

1. Newest first on a day with a milestone and a card: the exact reverse of oldest first (the card comes first). Task 1 test.
2. A card dated on the last day of a month falls in that month in every time zone (UTC grouping). Task 1 test.
3. An ad slot at a year or month boundary stays with the entry before it, in both orders. Task 1 test.
4. At 320 px the toggles and the small-card grid cause no horizontal scroll. Task 2 e2e.
5. With JavaScript off, every card shows on `/` and the toggles still work. Task 2 e2e.

---

### Task 1: Order and grouping in `src/lib/cards.js`

**Files:**
- Modify: `src/lib/cards.js` (`timelineEntries`, `byYear`)
- Test: `src/__tests__/cards.test.js`

**Interfaces:**
- Produces: `timelineEntries(cards, milestones, order = 'oldest')`, `order: 'oldest' | 'newest'`, returns `TimelineEntry[]`.
- Produces: `groupSlots(slots, keyOf)`, `keyOf: (item: T) => number`, returns `{ key: number, slots: Slot<T>[] }[]`.
  It replaces `byYear`: year groups are `groupSlots(slots, (e) => e.year)`, month groups inside a year are
  `groupSlots(year.slots, (e) => e.date.getUTCMonth())`.

- [ ] **Step 1: Write the failing tests**
  - `timeline: newest first is the exact reverse of oldest first`: same input as the existing oldest-first test, with
    `'newest'`; expect `[['card', 2023], ['milestone', 2023], ['card', 2013]]`.
  - Rename the `byYear` test to `groupSlots: one group per key, an ad slot stays with the entry before it`, call
    `groupSlots(slots, (e) => e.year)`, and expect `[[2013, 3], [2022, 1], [2023, 1]]` from `g.key`.
  - `groupSlots: months by UTC date`: items with dates `2025-03-31`, `2025-03-01`, `2025-04-01` (as `new Date('…')`),
    key `(e) => e.date.getUTCMonth()`; expect keys `[2, 3]` and slot counts `[2, 1]`.
- [ ] **Step 2: Run `npm test -- cards` and see the three tests fail.**
- [ ] **Step 3: Implement.** `newest` reverses the sorted oldest-first array. `groupSlots` is `byYear` with the key
  taken from `keyOf`.
- [ ] **Step 4: Run `npm test -- cards` and see it pass.**
- [ ] **Step 5: Commit** `feat(timeline): newest-first order and slot grouping by any key`.

### Task 2: Timeline pages, toggles and removal of the wall

**Files:**
- Create: `src/components/Timeline.astro`, `src/pages/oldest.astro`, `src/pages/lines/index.astro`, `src/pages/lines/oldest.astro`
- Modify: `src/pages/index.astro` (the wall becomes `<Timeline order="newest" view="cards" />`)
- Delete: `src/pages/timeline.astro` (its lines markup moves into `Timeline.astro`)
- Modify: `src/components/Card.astro` (`small` prop, heading level 4), `src/components/Header.astro` (remove the Views
  nav and the `path` prop), `src/layouts/Base.astro` (stop passing `path` to the header), `src/styles/global.css`,
  `astro.config.mjs` (sitemap filter), `src/pages/404.astro` and `src/components/AdCard.astro` (copy: "the wall" → "the timeline")
- Test: `e2e/site.spec.js`
- Docs: `docs/superpowers/specs/2026-11-13-beforegta6-design.md` § Goals and `AGENTS.md` line 3, edited to the final state.

**Interfaces:**
- Consumes: `timelineEntries`, `groupSlots`, `withAdSlots` (Task 1).
- Produces: `Timeline.astro` props `{ order: 'oldest' | 'newest', view: 'cards' | 'lines' }`. It wraps `Base` with
  `path="/"`, the title `Everything we got before GTA 6 · beforegta6.wtf` and the `h1` with `data-launch-title`.

- [ ] **Step 1: Write the failing e2e changes**
  - axe routes: `['/', '/lines/oldest/', '/flying-cars/', '/privacy/', '/does-not-exist/']`.
  - 320 px reflow routes: `['/', '/lines/']`.
  - Ad density: count entries as `.grid > li:not(.ad-slot)`, not `.grid article` (milestones are entries too).
  - No JavaScript: rename to `the timeline reads in full and shows the launch date`; keep `.grid article` = `launched`;
    then click the link `Oldest first` and expect the URL `/oldest/`.
  - New test `the toggles switch order and view`: on `/` the first `.year h2` is `2026`; click `Oldest first` → URL
    `/oldest/`, first `.year h2` is `2013`; click `Lines` → URL `/lines/oldest/`, the link `Lines` has
    `aria-current="page"`, and `.timeline .entry` count is `launched`.
- [ ] **Step 2: Run `npm run build && npm run test:e2e` and see the new and changed tests fail.**
- [ ] **Step 3: Implement.**
  - Toggles: `<nav aria-label="Timeline options">` with two labelled link groups, `Newest first | Oldest first` and
    `Cards | Lines`. Page path: `${view === 'lines' ? '/lines' : ''}/${order === 'oldest' ? 'oldest/' : ''}`.
  - Cards view: per year an `h2`; per month an `h3` (month name, `en-GB`, UTC) and a `ul.grid` of `li` items. A card
    is `<Card small headingLevel={4} />`, eager for the first four cards of the page. A milestone `li` and an ad `li`
    span the full row. Month groups get no `section` wrapper: 40 named regions would swamp the landmark list.
  - Lines view: today's `/timeline/` markup.
  - Sitemap: `sitemap({ filter: (page) => !/\/(oldest|lines)\/$/.test(page) })`.
  - CSS: the header pill styles move to the toggles; `.milestone` styles apply in both views; small-card grid of
    2, 3, 4 and 5 columns at 0, 600, 960 and 1280 px.
- [ ] **Step 4: Run the verification gate and `npm run test:e2e`; all pass.**
- [ ] **Step 5: Commit** `feat: make the timeline the only view, with order and view toggles`.
