---
last_mapped_commit: 9d66e1a8a7a921f9cab223ca26cf4950205412f1
last_mapped_at: 2026-11-15
---
# Coding Conventions

**Analysis Date:** 2026-11-15

## Naming Patterns

**Files:**
- Source modules use lowercase kebab-case with a `.js` or `.astro` extension: `src/lib/cards.js`, `src/lib/countdown.js`, `src/lib/meta.js`, `src/components/TimelineItem.astro`, `src/components/Countdown.astro`.
- Scripts use kebab-case: `scripts/sync-cards.js`, `scripts/pin-image.sh`, `scripts/lib/candidate.js`.
- Card content files are the card id as a file name: `src/content/cards/flying-cars.md`, with the image at `src/assets/cards/flying-cars.jpg`. The id must match `/^[a-z0-9-]+$/` (`scripts/lib/candidate.js`, `ID`).
- Tests use `<topic>.test.js` inside `src/__tests__/`: `src/__tests__/candidate.test.js`, `src/__tests__/countdown.test.js`. The e2e spec is `e2e/site.spec.js`.

**Functions:**
- camelCase for all functions. Named exports are the norm: `timelineEntries`, `ogImageOf`, `splitTitle` (`src/lib/cards.js`); `toCard`, `checkCandidates`, `cardMarkdown`, `imageExtension`, `reviewTable` (`scripts/lib/candidate.js`); `remaining`, `daysBefore` (`src/lib/countdown.js`); `pageTitle` (`src/lib/meta.js`).
- Small private helpers are `const` arrow functions inside the module, for example `const launched = (cards) => ...` in `src/lib/cards.js`, and `const cell = (v) => ...` in `scripts/lib/candidate.js`.
- Test factories are named for what they build: `fixture()` in `src/__tests__/candidate.test.js`, `card()` in `src/__tests__/cards.test.js`.

**Variables:**
- camelCase. Constants at module level are `UPPER_SNAKE_CASE` when they are fixed configuration: `ID`, `STATUSES`, `EXTENSIONS`, `SUBJECT_TAGS`, `STATUS_ORDER` (`scripts/lib/candidate.js`), `MAX` and `SUFFIX` (`src/lib/meta.js`), `PORT` (`playwright.config.js`), `UA`, `DATA`, `TABLE`, `CARDS`, `ASSETS`, `IMAGES` (`scripts/sync-cards.js`).
- Plain `const` is the default. `let` appears only where a value changes, for example counters in `scripts/sync-cards.js` (`changed`, `removed`).

**Types:**
- Types are written as JSDoc, not TypeScript. Typedefs use `@typedef {object} Name` with `@property` lines, for example `Candidate`, `CardFrontmatter`, `ResearchFile` in `scripts/lib/candidate.js`, and `Card` and `Milestone` in `src/lib/cards.js`.
- Astro component props are typed with an inline `@type` block in the frontmatter, for example `src/components/Card.astro`.

**Data fields:**
- JSON data in `research/candidates.json` uses snake_case keys: `event_date`, `source_url`, `image_page`, `impact_score`.
- Card frontmatter uses camelCase keys: `eventDate`, `factUrl`, `imageAlt`, `imageCredit`. The mapping from snake_case to camelCase happens only in `toCard` (`scripts/lib/candidate.js`).

## Code Style

**Formatting:**
- Prettier 3 is the formatter. Config is `.prettierrc`: `singleQuote: true`, `printWidth: 100`, and the `prettier-plugin-astro` plugin for `*.astro` files.
- Default Prettier settings apply otherwise: 2-space indent, and Prettier 3 default trailing commas.
- Run `npm run format` to rewrite files. `npm run lint` runs `prettier --check .` and fails on drift.
- `.prettierignore` excludes files that Prettier must not rewrite. Check it before adding generated output.

**Linting:**
- ESLint 10 flat config in `eslint.config.mjs`. It applies `@eslint/js` recommended rules and `eslint-plugin-astro` recommended rules.
- Globals: both browser and Node globals are enabled for every file (`globals.browser` and `globals.node`).
- Ignored paths: `dist/`, `.astro/`, `node_modules/`, `playwright-report/`, `test-results/`, `.superpowers/`.
- Run `npm run lint`. It runs `eslint .` and then `prettier --check .`.

**Type checking:**
- `jsconfig.json` extends `astro/tsconfigs/strict` and sets `checkJs: true` and `strict: true`. The editor uses these settings for JSDoc types.
- No `tsc` script exists. Type errors show in the editor, not in CI. Keep JSDoc annotations accurate because they are the only type contract.
- Casts use JSDoc form: `/** @type {any} */ (window)`, `/** @type {string} */ (c.source_url)`, `/** @type {const} */ (...)`. Use this form. Do not use TypeScript `as` syntax in `.js` files.

## Import Organization

**Order (observed):**
1. Package imports first: `import { expect, test } from 'vitest';`, `import { defineCollection } from 'astro:content';`
2. Node built-ins with the `node:` prefix: `import { readFileSync } from 'node:fs';`, `import { mkdir, readFile } from 'node:fs/promises';`
3. Relative imports last: `import { timelineEntries } from '../lib/cards.js';`

**Rules:**
- Always use the `node:` prefix for Node built-ins.
- Always write the `.js` extension on relative imports, as ESM requires: `'../lib/cards.js'`, `'./lib/candidate.js'`.
- Use named imports. The only default imports are third-party packages (`import yaml from 'yaml';`, `import AxeBuilder from '@axe-core/playwright';`).
- No barrel files. Import each module by its own path.

**Path Aliases:**
- None. Use relative paths.

## Error Handling

**Pure validation returns messages, it does not throw:**
- `checkCandidates` in `scripts/lib/candidate.js` collects every problem into an array of strings. It does not stop at the first one. The sync script prints them all and exits 1 before any write.
- Pattern: `const errors = []; errors.push(\`${c.id}: ...\`); return errors;`.

**Builders throw with the candidate id as the prefix:**
- `toCard` throws `new Error(\`${c.id}: <field> missing\`)`. Every message starts with the id, so a failure names the file to fix.
- The caller in `checkCandidates` wraps `toCard` in `try/catch` and copies `err.message` into the error list.

**Batch scripts accumulate failures and continue:**
- `scripts/sync-cards.js` wraps each launch candidate in `try/catch`, pushes `failed` entries, and keeps going. It exits with `process.exit(failed.length ? 1 : 0)` after all writes. Keep this pattern for per-item work in scripts: one bad item must not stop the rest.
- Errors that prevent any work (malformed JSON, pre-flight check failure) stop the run before writing: `process.exit(1)` before `mkdir` and writes.

**Guard clauses with explicit null/undefined handling:**
- Use `?.` and `??` for optional data: `c.timeline_date ?? c.event_date ?? c.post_date`, `contentType?.split(';')[0]`.
- Use `Array.isArray` before iterating optional lists: `for (const t of Array.isArray(c.tags) ? c.tags : [])`.

**Schema validation at the content boundary:**
- `src/content.config.js` declares every card field with Zod (`astro/zod`). Invalid frontmatter fails the Astro build. Add new card fields there and in `CardFrontmatter` in `scripts/lib/candidate.js` together. The comment in that file says: keys must match.

## Logging

**Framework:** `console` only. No logging library is used.

**Patterns:**
- Scripts write to `console.log` for the summary line and `console.error` for problems that stop a run: `console.error(\`${errors.length} problems in ${DATA}; nothing written\`)`.
- Single summary line for batch runs, for example `launch N, changed N, removed N, fetched N, failed N` in `scripts/sync-cards.js`.
- Browser code logs nothing in the shipped site.

## Comments

**When to Comment:**
- Comments explain *why* a rule exists, often with a dated decision or a bug reference. Examples in the repo:
  - `src/components/TimelineItem.astro` and `src/lib/cards.js` explain tie ordering.
  - `src/__tests__/cards.test.js` explains why a tie must not depend on load order.
  - `e2e/site.spec.js` explains the Umami stall and the 1280 px hover-only image.
  - `.github/workflows/build.yml` explains why the pin commit must not carry the skip marker.
- Use a dated note for a product or content decision: `// Real ads on the apex only (Andrei, 2026-11-15).` Keep this format.
- Do not comment what the code already says.

**JSDoc/TSDoc:**
- Every exported function in `src/lib/` and `scripts/lib/` has a JSDoc block with `@param` and `@returns`.
- Use `@typedef` for shapes that cross modules (`Candidate`, `Card`, `TimelineEntry`).
- Use `@type` on a `const` for a value with a non-obvious type (`/** @type {Record<string, string>} */`).
- Test helpers have a one-line JSDoc: `/** @param {Record<string, unknown>} overrides */`.

## Function Design

**Size:** Functions are short. Most exported functions are under 30 lines. Long logic is split into `const` helpers at module level, for example `row`, `counts`, `sectionOf`, `dateOf` in `scripts/lib/candidate.js`.

**Parameters:**
- Pass data in, return data out. Pure functions take arrays and objects, not file paths. `scripts/lib/candidate.js` states this at the top: "No I/O here".
- Use an options object or a default parameter for optional modes: `timelineEntries(cards, milestones, order = 'oldest')`.
- Destructure parameters when the function reads several fields: `reviewTable({ passes, candidates, excluded })`, `card({ id, date, status = 'launch', nsfw = false, title = id })`.

**Return Values:**
- Return plain objects with stable keys: `{ id, frontmatter }` from `toCard`, `{ before, event, after }` from `splitTitle`, `{ days, hours, minutes, seconds, done }` from `remaining`.
- Return `null` for "not present" in lookups and for absent image credit (`ogImageOf` returns `null` for an NSFW card; `imageExtension` returns `null`). Return `undefined` only when a `Array.find`-style lookup is the source (`moveImage` in `scripts/sync-cards.js`).

## Module Design

**Exports:**
- Named exports only in `src/lib/` and `scripts/lib/`.
- `src/content.config.js` exports the named `collections` object, which Astro requires.

**Pure logic separation (architecture rule from `AGENTS.md`):**
- Decision logic (order, timeline, countdown, title split, meta title length) lives in `src/lib/*.js` or `scripts/lib/*.js` as pure functions.
- `.astro` files render. They call the pure functions and add markup. Keep date math and sorting out of `.astro` files. `src/components/Timeline.astro` calls `timelineEntries` and only groups the result by year.
- `scripts/sync-cards.js` is the only I/O layer for the candidate pipeline. It reads and writes files. Its logic is in `scripts/lib/candidate.js`.

**Barrel Files:** Not used.

## Astro Component Conventions

- Frontmatter (between `---` fences) holds all logic: props, derived values and imports. The markup below it only renders.
- Props are destructured from `Astro.props` with defaults: `const { card, headingLevel = 2, eager = false, large = false } = Astro.props;` (`src/components/Card.astro`).
- Use `class:list` for conditional classes: `<article class:list={['card', { large }]}>`.
- Use `aria-hidden="true"` on decorative glyphs such as `↗`, and `<span class="sr-only">` for text that only screen readers need.
- Put client scripts in a `<script>` tag that imports a module from `src/scripts/`: `import '../scripts/media.js';` (`src/components/Timeline.astro`).
- Use the `hidden` attribute for elements that a script shows later (`data-after-launch hidden`).
- Use `data-*` attributes as hooks for client scripts and tests: `data-launch-title`, `data-left`. Tests select these attributes, so keep them stable.

## Content Conventions

- Card Markdown files are generated. Do not edit them by hand. Edit `research/candidates.json` and run `npm run cards`. The test `src/__tests__/content.test.js` fails on any hand edit.
- Card frontmatter is written by `cardMarkdown` in `scripts/lib/candidate.js`. Every value passes through `JSON.stringify`, so quotes and colons are safe.
- Use the title format `We got <event> before GTA 6` for every launch card. `splitTitle` in `src/lib/cards.js` depends on it.
- Titles must fit the 70-character `<title>` limit once the site suffix is added or dropped (`src/lib/meta.js`).
- Blurbs and engagement text must not contain research notes. `src/__tests__/content.test.js` checks this.

## Git and Commit Conventions

- Branches: `develop` integrates and deploys staging. `main` deploys production. Work lands by pull request (the developer handbook, `git-and-prs.md`).
- Commit messages in recent history use Conventional Commits with a scope: `feat(ads): ...`, `chore(deploy): staging → sha-...`, `docs(agents): ...`.
- Never write the GitHub skip marker (square brackets around `skip ci`) in any commit message. `src/__tests__/deploy.test.js` checks `scripts/pin-image.sh`. The full rule is in the developer handbook, `git-and-prs.md` § Merging.

## Documentation Conventions

- Design specs live in `docs/superpowers/specs/<date>-<topic>-design.md`. Plans live in `docs/superpowers/plans/`. Use the date prefix in both.
- `AGENTS.md` holds the commands, constraints and documented exceptions for this repo. It does not restate the shared standard.

---

*Convention analysis: 2026-11-15*
