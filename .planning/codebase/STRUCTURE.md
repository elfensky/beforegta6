---
last_mapped_commit: 9d66e1a8a7a921f9cab223ca26cf4950205412f1
last_mapped_at: 2026-11-15
---
# Codebase Structure

**Analysis Date:** 2026-11-15

## Directory Layout

```
beforegta6/
├── src/                    # The Astro site
│   ├── pages/              # Routes: index, oldest, [id], privacy, 404
│   ├── components/         # Astro components (render only)
│   ├── layouts/            # Base.astro document shell
│   ├── lib/                # Pure logic: order, countdown, titles
│   ├── data/               # Constants and milestones
│   ├── scripts/            # Browser scripts, shipped as files
│   ├── styles/             # global.css
│   ├── content/cards/      # One Markdown file per launch card (generated)
│   ├── assets/cards/       # Card images (imported by the collection)
│   ├── assets/             # og-default.png
│   ├── content.config.js   # Zod schema of the cards collection
│   └── __tests__/          # Vitest suites for src/ and scripts/
├── scripts/                # Node tools: sync-cards, pin-image
│   └── lib/                # candidate.js: pure candidate functions
├── research/               # Data (not shipped)
│   ├── candidates.json     # The one file to edit cards
│   ├── candidates.md       # Generated review table
│   └── images/             # Images of cards that are not live
├── deploy/                 # Container and deploy config
│   ├── nginx.conf          # Server block baked into the image
│   ├── README.md           # Stacks, secrets, AdSense, takedowns
│   ├── production/compose.yaml
│   └── staging/compose.yaml
├── e2e/                    # Playwright specs (site.spec.js)
├── public/                 # Copied as-is: favicon, robots, ads.txt, security.txt
├── docs/                   # Specs, plans, PROMOTION.md (not shipped)
│   ├── superpowers/specs/  # Design specs (dated)
│   └── superpowers/plans/  # Implementation plans (dated)
├── .github/workflows/      # ci.yml (check), build.yml (image + pin)
├── .planning/codebase/     # These analysis documents
├── astro.config.mjs        # Astro, sitemap filter, no inline scripts
├── content.config.js       # (not here) schema is at src/content.config.js
├── jsconfig.json           # checkJs and strict
├── playwright.config.js
├── vitest.config.js
├── eslint.config.mjs
├── Dockerfile              # nginx:1.30-alpine image with dist/
├── AGENTS.md               # Repo rules (CLAUDE.md is a symlink to it)
└── package.json            # npm scripts; engines node >= 26
```

Note: there is no `content.config.js` at the root. The schema is `src/content.config.js`.

## Directory Purposes

**`src/pages/`:**
- Purpose: One file per route. Astro file-based routing.
- Contains: `index.astro` (`/`), `oldest.astro` (`/oldest/`), `[id].astro` (`/<card-id>/`), `privacy.astro`,
  `404.astro`.
- Key files: `src/pages/[id].astro` (uses `getStaticPaths` over the timeline).

**`src/components/`:**
- Purpose: Reusable `.astro` pieces.
- Contains: `Timeline.astro` (year sections and order toggle), `TimelineItem.astro` (one row, card or
  milestone), `Card.astro` (card body, used on the card page), `Countdown.astro`, `Header.astro`, `Footer.astro`.
- Key files: `src/components/Timeline.astro`.

**`src/layouts/`:**
- Purpose: Shared page shell.
- Contains: `Base.astro`: head meta, Open Graph, Umami and AdSense loaders, skip link, header, main slot, footer.
- Key files: `src/layouts/Base.astro`.

**`src/lib/`:**
- Purpose: Pure functions, unit-tested. No DOM and no I/O.
- Contains: `cards.js` (`timelineEntries`, `ogImageOf`, `splitTitle`), `countdown.js` (`remaining`, `daysBefore`),
  `meta.js` (`pageTitle`).
- Key files: `src/lib/cards.js`.

**`src/data/`:**
- Purpose: Constants and hand-written data.
- Contains: `site.js` (site URL, `LAUNCH` date, AdSense and Umami IDs, operator name), `milestones.js` (GTA timeline).
- Key files: `src/data/site.js`.

**`src/scripts/`:**
- Purpose: Browser code, imported with `<script>` tags so Vite ships them as files.
- Contains: `countdown.js`, `media.js`, `share.js`.

**`src/styles/`:**
- Purpose: Global stylesheet.
- Contains: `global.css`, imported by `Base.astro`.

**`src/content/cards/`:**
- Purpose: The site's content. One `.md` file per launch card.
- Generated: Yes, by `npm run cards` (`scripts/sync-cards.js`). Do not edit by hand.
- Committed: Yes.

**`src/assets/cards/`:**
- Purpose: Images for live cards (`.jpg`, `.png`, `.webp`, `.gif`).
- Generated: Written by `npm run cards` when it downloads an image. Committed: Yes.

**`src/__tests__/`:**
- Purpose: Vitest suites: `candidate.test.js`, `cards.test.js`, `content.test.js` (cards match the sync output),
  `countdown.test.js`, `deploy.test.js`, `meta.test.js`, `smoke.test.js`.
- Run with: `npm test`.

**`scripts/`:**
- Purpose: Node tools that run outside the build.
- Contains: `sync-cards.js` (candidates to cards and review table), `pin-image.sh` (CI pins the image tag),
  `lib/candidate.js` (pure functions used by the sync and its tests).

**`research/`:**
- Purpose: Source data for cards. Not shipped (`paths-ignore` in CI, not in the image).
- Contains: `candidates.json` (every find with its status), `candidates.md` (generated), `images/` (held images).
- Committed: Yes. Public repository, so a takedown also removes the image file.

**`deploy/`:**
- Purpose: Everything that runs the site in production.
- Contains: `nginx.conf` (copied into the image), `README.md` (runbook), `production/compose.yaml` and
  `staging/compose.yaml` (Swarm stacks; `image:` is pinned by CI).

**`e2e/`:**
- Purpose: Playwright end-to-end checks on the built site (axe, reflow, skip link, no-JS).
- Key files: `e2e/site.spec.js`, configured by `playwright.config.js`.

**`public/`:**
- Purpose: Static files served at the root without processing.
- Contains: `favicon.svg`, `robots.txt`, `ads.txt`, `.well-known/security.txt`.

**`docs/`:**
- Purpose: Design history. Not shipped.
- Contains: `superpowers/specs/` and `superpowers/plans/`, each file dated `YYYY-MM-DD-<topic>`. `PROMOTION.md`.

**`.github/workflows/`:**
- Purpose: CI and deploy.
- Contains: `ci.yml` (lint, test, build, html-validate, e2e), `build.yml` (build image, pin tag).

## Key File Locations

**Entry Points:**
- `src/pages/index.astro`: home timeline (newest first)
- `src/pages/oldest.astro`: oldest-first timeline
- `src/pages/[id].astro`: card page
- `astro.config.mjs`: Astro configuration

**Configuration:**
- `astro.config.mjs`: site URL, trailing slash `always`, sitemap filter, `assetsInlineLimit: 0`
- `src/content.config.js`: card schema
- `jsconfig.json`: JS type checking
- `eslint.config.mjs`, `.prettierrc`, `.prettierignore`: lint and format
- `vitest.config.js`, `playwright.config.js`: test runners
- `.node-version`: Node pin (26)
- `src/data/site.js`: runtime constants (launch date, IDs)

**Core Logic:**
- `src/lib/cards.js`: timeline ordering and title split
- `src/lib/countdown.js`: countdown math
- `scripts/lib/candidate.js`: candidate to card conversion and validation

**Testing:**
- `src/__tests__/`: unit and content tests
- `e2e/site.spec.js`: browser checks

**Deploy:**
- `Dockerfile`, `deploy/nginx.conf`, `deploy/*/compose.yaml`, `.github/workflows/build.yml`

## Naming Conventions

**Files:**
- Astro components and pages: PascalCase for components (`TimelineItem.astro`), lowercase for pages
  (`index.astro`), dynamic route in brackets (`[id].astro`).
- Browser and library modules: lowercase single word (`countdown.js`, `media.js`, `cards.js`).
- Tests: `<module>.test.js` in `src/__tests__/`. E2E: `<name>.spec.js` in `e2e/`.
- Cards: kebab-case slug matching the id, `src/content/cards/<id>.md` (`^[a-z0-9-]+$`). Images share the id:
  `src/assets/cards/<id>.<ext>`.
- Research files: `research/candidates.json`. Docs: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

**Directories:**
- Lowercase, single words or kebab-case (`superpowers`, `content/cards`).

**Code:**
- Functions: camelCase (`timelineEntries`, `daysBefore`, `pageTitle`).
- Constants: UPPER_SNAKE for exported config (`LAUNCH`, `SITE_URL`, `ADSENSE_CLIENT`).
- Types: JSDoc `@typedef` (`TimelineEntry`, `Milestone`, `Candidate`).

## Where to Add New Code

**A new card:**
- Edit `research/candidates.json`: add or change the entry with `status: "launch"`.
- Run `npm run cards`. It writes `src/content/cards/<id>.md`, and it places or fetches the image in
  `src/assets/cards/`.
- Tests: `src/__tests__/content.test.js` checks the result.

**A new route or page:**
- Implementation: `src/pages/<name>.astro`. Use `Base.astro` as the layout.
- Tests: add a case to `e2e/site.spec.js` if the page is user-facing.
- Sitemap: it is included by default. Exclude it in `astro.config.mjs` if it should not be indexed.

**A new timeline rule or ordering:**
- Implementation: `src/lib/cards.js`.
- Tests: `src/__tests__/cards.test.js`.

**A new countdown or date helper:**
- Implementation: `src/lib/countdown.js`.
- Tests: `src/__tests__/countdown.test.js`.

**A new component:**
- Implementation: `src/components/<Name>.astro`. Keep logic out of it; import pure helpers from `src/lib/`.

**A new browser behaviour:**
- Implementation: `src/scripts/<name>.js`, then import it from a `<script>` tag in the page or component.
  Do not write inline `<script>` content (the CSP has no `'unsafe-inline'`).

**A new milestone:**
- Implementation: append to `src/data/milestones.js` (`date`, `title`, `blurb`, `factUrl`).

**A new shared constant:**
- Implementation: `src/data/site.js`.

**A new deploy or infra change:**
- Implementation: `deploy/` or `.github/workflows/`. The `image:` line in a compose file belongs to CI.

**A new utility script:**
- Implementation: `scripts/<name>.js`. Put its pure logic in `scripts/lib/` so tests can import it.

## Special Directories

**`src/content/cards/`:**
- Purpose: Card Markdown, one file per live card.
- Generated: Yes (`npm run cards`).
- Committed: Yes.

**`src/assets/cards/`:**
- Purpose: Images of live cards. Astro optimizes and ships them.
- Generated: Partly (downloaded by `npm run cards`).
- Committed: Yes.

**`research/images/`:**
- Purpose: Images of cards that are not live. Never imported, so never shipped.
- Generated: Written by `npm run cards`.
- Committed: Yes. The repo is public, so a takedown deletes the file too.

**`dist/`:**
- Purpose: Build output, copied into the Docker image.
- Generated: Yes (`npm run build`).
- Committed: No (`.gitignore`).

**`.astro/`:**
- Purpose: Astro's generated types and cache.
- Generated: Yes. Committed: No.

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents for planning.
- Generated: Yes (by the mapper). Committed: by the orchestrator.

---

*Structure analysis: 2026-11-15*
