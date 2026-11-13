# beforegta6.wtf Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship beforegta6.wtf before 2026-11-19. The site has a card grid, a timeline, one page per card, ad slots, and the usual staging and production deployment.

**Architecture:** An Astro static site. Each card is one Markdown file with a local image copy, created by a one-time import of
the research JSON. Pure functions in `src/lib/` decide the order, the timeline entries, the ad positions and the countdown. The
`.astro` files only render. The CI runner builds `dist/` and puts it into an nginx image. CI pins that image into the compose file of each branch
(`develop` → Pi staging, `main` → Hetzner production). Arcane Git Sync deploys it.

**Tech Stack:** Astro 7, Node 26, plain JS + JSDoc, vitest, Playwright + `@axe-core/playwright`, nginx 1.30-alpine,
GitHub Actions, Docker Swarm, cloudflared.

**Spec:** `docs/superpowers/specs/2026-11-13-beforegta6-design.md`

## Global Constraints

- Node 26 LTS, one pin: `.node-version` containing `26`. setup-node reads it in CI and mise reads it locally. This is a documented exception in `AGENTS.md`: the handbook asks for `mise.toml`, and miklav.com also uses `.node-version`.
- Plain JavaScript with JSDoc. `jsconfig.json` sets `checkJs: true` and `strict: true`. No `.ts` files and no `tsconfig.json`.
- npm with `package-lock.json` committed. ESLint flat config (`eslint.config.mjs`) with `eslint-plugin-astro`. Prettier with `prettier-plugin-astro`.
- Every asset is served from the site, and the site uses system fonts only. Two script origins are outside the site: AdSense (`pagead2.googlesyndication.com`) and the self-hosted Umami (`umami.lav.ren`).
- Copy: card titles use the form `We got ___ before GTA 6`. After launch, the header reads `We got all of this before GTA 6.`
- Launch moment: 2026-11-19 00:00, in the visitor's local time.
- Ads:
  - From 960 px wide: one slot after every 8th item.
  - Below 960 px: one slot after every 4th item.
  - Never a slot after the last item.
  - Each slot shows a house card until `ADSENSE_CLIENT` is set and the slot fills.
- No GTA logo, no Rockstar fonts, no key art.
- Footer: `Memes belong to their creators. Want one removed? takedown@drunik.be`. Each card links its source.
- Only cards with `status: launch` are built. An `nsfw` card hides its image behind a native `<details>` disclosure, and its link preview uses the site image, not the card image.
- Names:
  - Image: `ghcr.io/drunikbe/beforegta6.wtf:sha-<commit>`.
  - Stacks: `beforegta6-staging` (Pi swarm) and `beforegta6` (production swarm).
  - Secrets: `staging_beforegta6_cloudflared` and `beforegta6_cloudflared`.
  - Hosts: `https://beforegta6.wtf` and `https://staging.beforegta6.wtf`.
- Git: work in `~/Developer/.worktrees/beforegta6.wtf/feat-launch` on branch `feat/launch`, created from `develop`, with `user.email andrei@lav.ren`.
- Release path: open a PR to `develop`, which deploys staging. Then open a PR from `develop` to `main`, which deploys production.
- Gate: run § 0 of `~/vault/knowledge/web-programming/website-standard.md`. In shell probes, call `/usr/bin/curl` and `/usr/bin/grep` by full path.

## Review Focus

1. **A source image URL that is gone, or that answers with an HTML login page.** The import fails for that id, names its URL, and never writes a file that is not an image. Covered by the Task 2 tests.
2. **A title or blurb that contains `"`, `:`, `#` or emoji.** The frontmatter stays valid YAML and the text renders unchanged. Covered by the Task 2 tests.
3. **JavaScript turned off.** The grid, the timeline and the card pages read in full, and the countdown shows the date. Covered by the Task 6 e2e test.
4. **An NSFW card shared on social media.** The preview shows the site image. Covered by the Task 3 `ogImageOf` test.
5. **A 320 px phone.** No horizontal scroll, and no ad slot more often than every 4 cards. Covered by the Task 6 e2e test.

## File structure

```text
.node-version  package.json  package-lock.json  astro.config.mjs  jsconfig.json
eslint.config.mjs  .prettierrc  vitest.config.js  playwright.config.js
AGENTS.md  CLAUDE.md -> AGENTS.md
research/candidates.json  research/candidates.md     research output, kept as the record
scripts/import-cards.js                                CLI: candidates.json → cards + images
scripts/lib/candidate.js                               pure mapping for the import
scripts/pin-image.sh                                   copied from miklav.com
src/content.config.js                                  the cards collection schema
src/content/cards/<id>.md   src/assets/cards/<id>.<ext>
src/assets/og-default.png                              the site link-preview image, 1200×630
src/data/site.js  src/data/milestones.js
src/lib/cards.js  src/lib/ads.js  src/lib/countdown.js
src/layouts/Base.astro
src/components/Card.astro  AdCard.astro  Countdown.astro  Header.astro  Footer.astro
src/scripts/countdown.js  src/scripts/ads.js           client scripts
src/styles/global.css
src/pages/index.astro  timeline.astro  [id].astro  404.astro
public/robots.txt  public/.well-known/security.txt
src/__tests__/*.test.js   e2e/site.spec.js
Dockerfile  .dockerignore  deploy/nginx.conf  deploy/staging/compose.yaml
deploy/production/compose.yaml  deploy/README.md
.github/workflows/ci.yml  .github/workflows/build.yml
```

---

### Task 1: Scaffold, tooling, CI and branch rules

**Files:** Create every root config file in the list above, plus `AGENTS.md`, `CLAUDE.md` (symlink), `.github/workflows/ci.yml` and `src/__tests__/smoke.test.js`.

**Interfaces:**
- Produces:
  - `npm run dev | build | preview | lint | test | test:e2e | dev:up | dev:down`.
  - The CI job named `check`.

- [ ] **Step 1:** Run `npm create astro@latest -- --template minimal --no-install --no-git .` in the worktree, then `npm install`. Delete `tsconfig.json`. Add `jsconfig.json` (`{"extends": "astro/tsconfigs/strict", "compilerOptions": {"checkJs": true, "strict": true}}`), and `.node-version` containing `26`.
- [ ] **Step 2:** Add the dev dependencies `vitest`, `eslint`, `@eslint/js`, `eslint-plugin-astro`, `eslint-plugin-jsx-a11y`, `prettier`, `prettier-plugin-astro`, `@astrojs/sitemap`, `@playwright/test`, `@axe-core/playwright` and `html-validate`. Add these scripts:
  - `lint`: `eslint . && prettier --check .`
  - `test`: `vitest run`
  - `test:e2e`: `playwright test`
  - `dev:up` / `dev:down`: copy `scripts/dev-server.sh` from `~/Developer/miklav.com`.
- [ ] **Step 3: Write the smoke test.** `src/__tests__/smoke.test.js` contains `expect(1 + 1).toBe(2)`. A vitest run with no tests exits 1.
- [ ] **Step 4:** In `astro.config.mjs`, set `site: 'https://beforegta6.wtf'`, `trailingSlash: 'always'` and `integrations: [sitemap()]`.
- [ ] **Step 5:** Write `AGENTS.md` from the template block in `~/vault/knowledge/developer/stack/agents-md.md`. Fill in:
  - The commands above.
  - Life cockpit: `#drunik`, `drunikbe/beforegta6.wtf`.
  - Documented exceptions: the AdSense script origin, AdSense as a US service, `.node-version` in place of `mise.toml`, `research/` as a data folder.
  
  Then run `ln -s AGENTS.md CLAUDE.md`.
- [ ] **Step 6:** Write `.github/workflows/ci.yml` with job `check`, on `pull_request` to `develop` and `main`. It uses setup-node with `node-version-file: '.node-version'` and runs:
  `npm ci`, `npm run lint`, `npm test`, `npm run build` and `npx html-validate "dist/**/*.html"`. Task 6 adds the Playwright
  steps. That way an empty e2e suite can never pass silently.
- [ ] **Step 7: Verify.** Run `npm run lint && npm test && npm run build`. All three exit 0.
- [ ] **Step 8: Commit.** Message: `chore: scaffold the Astro site, tooling and CI`.
- [ ] **Step 9: Push and open the PR to `develop`.** Then create one ruleset per branch (`develop`, `main`) with `gh api repos/drunikbe/beforegta6.wtf/rulesets`:
  - Rules: `pull_request`, plus `required_status_checks` with context `check`.
  - `bypass_actors`: `[{"actor_type":"Integration","actor_id":15368,"bypass_mode":"always"}]` (the GitHub Actions app). The CI pin commit pushes with `GITHUB_TOKEN` and needs this bypass.
  - Read the rulesets back with `gh api`.

### Task 2: Card import (research JSON → Markdown + local images)

**Files:**
- Create: `scripts/lib/candidate.js`, `scripts/import-cards.js`, `src/content.config.js`, `research/candidates.json`, `research/candidates.md`
- Test: `src/__tests__/candidate.test.js`

**Interfaces:**
- Consumes: the research JSON. `candidates[]` has these fields: `id`, `title`, `blurb`, `kind`, `event_date`, `post_date`, `timeline_date`, `fact_url`, `source_url`, `source_platform`, `source_engagement`, `image_url`, `image_note`, `nsfw`, `status`.
- Produces:
  - `toCard(candidate) → { id: string, frontmatter: CardFrontmatter }`. It throws `Error('<id>: <field> missing')`.
  - `cardMarkdown(frontmatter, imageFile) → string`.
  - `imageExtension(contentType) → 'jpg'|'png'|'webp'|'gif'|null`.
  - `CardFrontmatter` uses the spec's frontmatter keys: `title, blurb, kind, date, eventDate?, source{url, platform, engagement?}, factUrl?, image, imageAlt, nsfw, status`.
  - The `cards` collection with a schema of the same keys. `image` uses the `image()` helper. Dates use `z.coerce.date()`. `status` is the enum `launch|hold|drop`.

- [ ] **Step 1: Write the failing tests.**

```js
test('maps a real event', () => {
  const { id, frontmatter } = toCard(fixture({ id: 'flying-cars', event_date: '2026-10-15', timeline_date: '2026-10-15' }));
  expect(id).toBe('flying-cars');
  expect(frontmatter).toMatchObject({ kind: 'real-event', date: '2026-10-15', eventDate: '2026-10-15', nsfw: false, status: 'launch' });
});
test('a joke takes the post date', () => { expect(toCard(fixture({ kind: 'joke', event_date: null, timeline_date: null, post_date: '2023-11-21' })).frontmatter.date).toBe('2023-11-21'); });
test('rejects a bad id', () => { expect(() => toCard(fixture({ id: 'Flying Cars!' }))).toThrow('id'); });
test('rejects a missing source', () => { expect(() => toCard(fixture({ source_url: null }))).toThrow('source_url missing'); });
test('frontmatter survives quotes, colons, hashes and emoji', async () => {
  const md = cardMarkdown(toCard(fixture({ title: 'We got "GTA 7": #1 🚗 before GTA 6' })).frontmatter, 'x.jpg');
  expect(yaml.parse(md.split('---')[1]).title).toBe('We got "GTA 7": #1 🚗 before GTA 6');
});
test('only image content types pass', () => {
  expect(imageExtension('image/jpeg')).toBe('jpg');
  expect(imageExtension('image/webp')).toBe('webp');
  expect(imageExtension('text/html; charset=utf-8')).toBeNull();
});
```

`fixture(overrides)` is a complete valid candidate in the test file. `yaml` is the `yaml` dev dependency.

- [ ] **Step 2: Run `npx vitest run src/__tests__/candidate.test.js`.** Expected: FAIL, because the module is not found.
- [ ] **Step 3: Implement `scripts/lib/candidate.js`.** Ids must match `/^[a-z0-9-]+$/`. Write every frontmatter string with `JSON.stringify`, because a JSON string is a valid YAML scalar. `imageAlt` comes from `image_note`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Write `scripts/import-cards.js <candidates.json>`.**
  - For each candidate: `fetch(image_url)` with a browser User-Agent, check `imageExtension`, then write `src/assets/cards/<id>.<ext>` and `src/content/cards/<id>.md`.
  - It never overwrites an existing `.md`, because hand edits win.
  - At the end it prints `imported N, skipped (exists) M, failed K: <id> <url>…`. It exits 1 when K > 0 or when two candidates share an id.
- [ ] **Step 6: Write `src/content.config.js`** with the `cards` collection (glob loader, `src/content/cards/*.md`).
- [ ] **Step 7: Import the data.**
  1. Copy `/tmp/beforegta6/candidates.json` and `candidates.md` into `research/`.
  2. Run `node scripts/import-cards.js research/candidates.json`.
  3. For each failed id, find an image by hand (the source post, a video thumbnail, or a press photo), save it as `src/assets/cards/<id>.<ext>` and re-run.
  
  Expected: `failed 0`.
- [ ] **Step 8: Verify.** `npm run build` exits 0. A schema error names the file.
- [ ] **Step 9: Commit.** Message: `feat: import the researched cards with local images`.

### Task 3: Ordering, timeline, ads and countdown logic

**Files:**
- Create: `src/lib/cards.js`, `src/lib/ads.js`, `src/lib/countdown.js`, `src/data/site.js`, `src/data/milestones.js`
- Test: `src/__tests__/cards.test.js`, `ads.test.js`, `countdown.test.js`

**Interfaces:**
- Consumes: the `cards` collection entries `{ id, data }` (Task 2).
- Produces:
  - `visibleCards(cards) → Card[]`: `status === 'launch'` only, newest `date` first, ties by `title`.
  - `timelineEntries(cards, milestones) → TimelineEntry[]`: oldest first. `TimelineEntry` is `{ kind: 'card'|'milestone', date: Date, year: number, card?, milestone? }`. On the same date, a milestone comes before a card.
  - `ogImageOf(card) → ImageMetadata|null`: null when `card.data.nsfw`.
  - `withAdSlots(items, { every = 4, desktopEvery = 8 } = {}) → Slot[]`. `Slot` is `{ kind: 'item', item } | { kind: 'ad', desktop: boolean }`.
  - `remaining(nowMs, targetMs) → { days, hours, minutes, seconds, done }`.
  - `site.js`:
    - `SITE_URL = 'https://beforegta6.wtf'`, `LAUNCH = { year: 2026, monthIndex: 10, day: 19 }`, `TAKEDOWN_EMAIL = 'takedown@drunik.be'`.
    - `ADSENSE_CLIENT = ''`, `ADSENSE_SLOT = ''`, `UMAMI_WEBSITE_ID = ''`. All three stay empty until Andrei supplies them; empty means off.
  - `milestones.js`: `[{ date: 'YYYY-MM-DD', title, blurb, factUrl }]`.

- [ ] **Step 1: Write the failing tests.**

```js
// ads.test.js
const items = (n) => Array.from({ length: n }, (_, i) => i);
const ads = (slots) => slots.flatMap((s, i) => (s.kind === 'ad' ? [[i, s.desktop]] : []));
test('20 items: a mobile slot every 4, a desktop slot every 8, none at the end', () => {
  expect(ads(withAdSlots(items(20)))).toEqual([[4, false], [9, true], [14, false], [19, true]]);
});
test('8 items: no trailing slot', () => { expect(ads(withAdSlots(items(8)))).toEqual([[4, false]]); });
test('3 items: no slot', () => { expect(ads(withAdSlots(items(3)))).toEqual([]); });

// countdown.test.js
test('counts down', () => { expect(remaining(0, 90061000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, done: false }); });
test('done at and after the target', () => {
  expect(remaining(5, 5).done).toBe(true);
  expect(remaining(9, 5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
});

// cards.test.js
test('only launch cards, newest first', () => {
  const cards = [card({ id: 'h', status: 'hold', date: '2025-01-01' }), card({ id: 'd', status: 'drop', date: '2025-01-01' }),
    card({ id: 'old', date: '2024-03-01' }), card({ id: 'new', date: '2026-10-15' })];
  expect(visibleCards(cards).map((c) => c.id)).toEqual(['new', 'old']);
});
test('timeline: oldest first, milestone before card on the same date, year set', () => {
  const t = timelineEntries([card({ id: 'a', date: '2023-12-05' }), card({ id: 'b', date: '2013-09-18' })],
    [{ date: '2023-12-05', title: 'Trailer 1', blurb: '', factUrl: '' }]);
  expect(t.map((e) => [e.kind, e.year])).toEqual([['card', 2013], ['milestone', 2023], ['card', 2023]]);
});
test('nsfw card has no OG image', () => { expect(ogImageOf(card({ nsfw: true }))).toBeNull(); });
```

The cards tests build their entries with a local `card(data)` helper.

- [ ] **Step 2: Run `npm test`.** Expected: FAIL, because the modules are not found.
- [ ] **Step 3: Implement the three modules, `site.js` and `milestones.js`.** `milestones.js` holds the spec's seven anchors. Check each date against Rockstar Newswire or Wikipedia, archive each source with `~/vault/meta/scripts/archive <url> beforegta6`, and put that URL in `factUrl`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: card order, timeline, ad slots and countdown logic`.

### Task 4: Layout, card grid and card pages

**Files:** Create `src/layouts/Base.astro`, `src/components/{Card,AdCard,Countdown,Header,Footer}.astro`, `src/scripts/{countdown,ads}.js`, `src/styles/global.css`, `src/pages/{index,[id],404}.astro`, `src/assets/og-default.png`, `public/robots.txt`, `public/.well-known/security.txt`

**Interfaces:**
- Consumes: Task 3, all of it.
- Produces:
  - `Base.astro` props `{ title: string, description: string, ogImage?: ImageMetadata|null, path: string }`.
  - `Card.astro` props `{ card: Card, headingLevel?: 2|3 }`.
  - `AdCard.astro` props `{ desktop: boolean }`.

- [ ] **Step 1: Write `Base.astro`.**
  - `<head>`: `<meta charset>` first, then viewport, a unique `<title>`, the description, `<link rel=canonical>` from `SITE_URL + path`, the Open Graph tags and `twitter:card=summary_large_image`.
  - Preview image: `og:image` is `getImage({ src: ogImage ?? ogDefault, width: 1200, format: 'jpg' })`, made absolute with `Astro.site`.
  - Scripts: the Umami tag when `UMAMI_WEBSITE_ID` is set, and the AdSense loader when `ADSENSE_CLIENT` is set.
  - `<body>`: a skip link to `<main id="main">`, then `Header`, `main` and `Footer`.
- [ ] **Step 2: Write `Card.astro`.**
  - An `<article>`.
  - `<Image>` with `widths=[320, 640, 960]` and `sizes`. For an nsfw card, the image sits inside `<details><summary>NSFW: show</summary>…</details>`.
  - The title is a heading that links to `/<id>/`.
  - The blurb.
  - `<time datetime>`.
  - The link `source ↗`, with `rel="noopener nofollow ugc"`.
- [ ] **Step 3: Write `AdCard.astro`.**
  - An `<aside aria-label="Advertisement">` with `data-desktop={desktop}`.
  - When `ADSENSE_CLIENT` is set, an `<ins class="adsbygoogle" data-ad-client data-ad-slot data-ad-format="fluid">`.
  - Always a house card: "Share the wall" with the site URL, plus the countdown.
  - CSS:
    - `@media (min-width: 960px) { [data-desktop="false"] { display: none } }`.
    - `.ad-card:has(ins[data-ad-status="filled"]) .house { display: none }`.
  - `src/scripts/ads.js` pushes `adsbygoogle` once for each `ins` whose `offsetParent !== null`.
- [ ] **Step 4: Write `Countdown.astro` and `src/scripts/countdown.js`.**
  - The server HTML is `<time datetime="2026-11-19">GTA 6: 19 November 2026</time>`.
  - The script ticks every second with `remaining(Date.now(), new Date(LAUNCH.year, LAUNCH.monthIndex, LAUNCH.day).getTime())`.
  - On `done`, it sets the header `<h1>` to the launch copy and stops.
  - Under `prefers-reduced-motion`, it ticks once a minute.
- [ ] **Step 5: Write the pages.**
  - `index.astro`: `withAdSlots(visibleCards(cards))` in a CSS grid.
  - `[id].astro`: `getStaticPaths` over `visibleCards`, with `ogImage={ogImageOf(card)}`.
  - `404.astro`.
  - `Header`: the site name, `Countdown`, and `<nav aria-label="Views">` with the links Cards (`/`) and Timeline (`/timeline/`), with `aria-current` on the active one.
  - `Footer`: the takedown line from the Global Constraints, with `mailto:`.
- [ ] **Step 6: Write `global.css`.**
  - The grid: 1 column below 600 px, 2 columns from 600, 3 from 960, 4 from 1280.
  - `rem` font sizes, focus styles, and `prefers-reduced-motion`.
  - Images: `max-width: 100%; height: auto`.
- [ ] **Step 7: Write the files in `public/`.**
  - `robots.txt`: `User-agent: *`, `Allow: /`, and `Sitemap: https://beforegta6.wtf/sitemap-index.xml`.
  - `security.txt`: a copy of drunik.be's file with `Canonical: https://beforegta6.wtf/.well-known/security.txt`.
  - `og-default.png`: 1200×630, the site name and the line "Everything we got before GTA 6", with no Rockstar material.
- [ ] **Step 8: Verify.**
  - `npm run build` exits 0.
  - `npx html-validate "dist/**/*.html"` exits 0.
  - `npm run dev:up`. Open `/` and one card page at 375 px and at 1440 px, and look at both.
- [ ] **Step 9: Commit.** Message: `feat: card grid, card pages, ad cards and countdown`.

### Task 5: Timeline view

**Files:** Create `src/pages/timeline.astro`, and modify `src/styles/global.css`.

**Interfaces:**
- Consumes: `timelineEntries`, `withAdSlots`, `Card.astro` (with `headingLevel={3}`) and `AdCard.astro`.

- [ ] **Step 1: Write `timeline.astro`.**
  - Run `withAdSlots(timelineEntries(cards, milestones))`.
  - Render one `<section>` per year, with an `<h2>{year}</h2>` and an `<ol>`. Start a new section when an entry's `year` changes.
  - A card entry is an `<li>` with a 160 px thumbnail, `<time>`, and the title linking to `/<id>/`.
  - A milestone entry is an `<li class="milestone">` with its title, blurb and `factUrl` link.
  - An ad slot is an `<li>` that wraps `AdCard`.
- [ ] **Step 2: Add the CSS.**
  - One column below 960 px.
  - From 960 px: a centre line, card entries alternating sides, and milestones full width.
- [ ] **Step 3: Verify.** `npm run build` and `html-validate` exit 0. Look at the timeline at 375 px and at 1440 px.
- [ ] **Step 4: Commit.** Message: `feat: timeline view`.

### Task 6: Browser checks (website standard § 0)

**Files:** Create `e2e/site.spec.js`. Modify `playwright.config.js`: set `webServer` to `npm run build && npm run preview`, and run the projects chromium, webkit and firefox.

- [ ] **Step 1: Write the tests.**
  - For each route in `['/', '/timeline/', '/flying-cars/', '/does-not-exist/']`: `new AxeBuilder({ page }).analyze()` returns `violations` equal to `[]`.
  - At 320 px: `document.documentElement.scrollWidth <= clientWidth` on `/` and `/timeline/`.
  - At 320 px on `/`: the visible ad asides are fewer than or equal to `floor(cardCount / 4)`.
  - Tab, then Enter, on the skip link focuses `#main`.
  - With `javaScriptEnabled: false`: `/` contains every card title and the text `19 November 2026`.
- [ ] **Step 2: Run `npm run test:e2e`.** Expected: PASS on all three engines. Fix any axe violations in the components, not in the test.
- [ ] **Step 3: Add the browser steps to the `check` job** in `.github/workflows/ci.yml`: `npx playwright install --with-deps` and `npm run test:e2e`.
- [ ] **Step 4: Commit.** Message: `test: axe, reflow, skip link and no-JS checks`.

### Task 7: Image, nginx and the two stacks

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `deploy/nginx.conf`, `deploy/staging/compose.yaml`, `deploy/production/compose.yaml`, `deploy/README.md`, `.github/workflows/build.yml`.
- Copy from `~/Developer/miklav.com`: `scripts/pin-image.sh` and `build.yml`. Change the repo and stack names only.

- [ ] **Step 1: Write the `Dockerfile`** following miklav.com: `FROM nginx:1.30-alpine`, `COPY deploy/nginx.conf`, `COPY dist`, and the same `HEALTHCHECK`.
- [ ] **Step 2: Write `deploy/nginx.conf`**, based on miklav.com's file. Keep `server_tokens off`, `absolute_redirect off`, the `$cache_control` map (`/_astro/` immutable for one year, HTML `no-cache`), `error_page 404 /404.html` and the security headers. Change these:
  - `$robots_tag`: the empty value for `beforegta6.wtf` only, so staging is `noindex`.
  - CSP:
    - `script-src 'self' https://umami.lav.ren`, plus the AdSense origins listed in Google's current AdSense CSP help page. Read that page and archive it.
    - `img-src 'self' https: data:`.
    - `frame-src`: the Google ad origins.
    - `connect-src 'self' https://umami.lav.ren`, plus the ad origins.
  - Delete the redirects map, because this site has no legacy URLs.
- [ ] **Step 3: Write the compose files** from miklav.com's `deploy/{staging,production}/compose.yaml`, with this repo's image, stack and secret names (Global Constraints). Keep the production placement `node.labels.role == apps`, the spread, `start-first` and the `cloudflared` service. The image line is `sha-unpinned` until the first CI pin.
- [ ] **Step 4: Write `build.yml`**: miklav.com's workflow with its comments trimmed to this repo. Write `deploy/README.md` with Andrei's one-time steps from the spec, as commands.
- [ ] **Step 5: Verify locally.**
  1. `npm run build && docker build -t bgta6 . && docker run -d -p 8089:80 --name bgta6 bgta6`.
  2. Check `/`, `/timeline/`, `/flying-cars/` and `/sitemap-index.xml`, which answer 200, and `/nope/`, which answers 404 with no `nginx/` in the body. Use `/usr/bin/curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8089<path>`.
  3. `/usr/bin/curl -sSI -H 'Host: beforegta6.wtf' http://localhost:8089/` shows the CSP, no `X-Robots-Tag`, and `Cache-Control: no-cache`.
  4. `docker rm -f bgta6`.
- [ ] **Step 6: Commit.** Message: `build: nginx image, staging and production stacks, CI pin`.

### Task 8: Ship

- [ ] **Step 1: Run the final branch review.** Then merge `feat/launch` into `develop` by PR, with the `check` job green.
- [ ] **Step 2:** The `pin` job commits `sha-<commit>` into `deploy/staging/compose.yaml` on `develop`. Check that the commit exists with `git log origin/develop -1`. If the ruleset blocked it, fix the bypass actor (Task 1, Step 9).
- [ ] **Step 3: Andrei's one-time setup** (`deploy/README.md`):
  1. Create the tunnels `beforegta6-staging` (host `staging.beforegta6.wtf`) and `beforegta6` (host `beforegta6.wtf`), each pointing to `http://web:80`. Store their tokens in 1Password as `cloudflared-beforegta6.wtf-staging` and `cloudflared-beforegta6.wtf-production`.
  2. Create the swarm secrets and the two `drunikbe/infra` Git Sync entries with `redeployAfterSync: true`.
  3. Add the Cloudflare Redirect Rule (`www` → apex) and a Cache Rule that caches HTML at the edge for 5 minutes.
  4. Add Umami and Uptime Kuma entries.
- [ ] **Step 4: Check staging.** Run the post-deploy block of website-standard § 0 against `https://staging.beforegta6.wtf`. Andrei reviews the cards on staging and sets `status` to `drop` on any card he strikes.
- [ ] **Step 5: Ship production.** Open a PR from `develop` to `main` and merge it. Check the pin commit on `main`. Run § 0 against `https://beforegta6.wtf`.
- [ ] **Step 6: Change `gta5-farewell-drive` from `hold` to `launch`** after 2026-11-18, by a PR through the same path.
- [ ] **Step 7: Turn on AdSense once Andrei has the publisher ID:**
  - Set `ADSENSE_CLIENT` and `ADSENSE_SLOT`.
  - Add `public/ads.txt` with `google.com, pub-<id>, DIRECT, f08c47fec0942fa0`.
  - Turn on the Privacy & messaging EU consent message in AdSense.
  - Check the browser console on staging for CSP violations.
