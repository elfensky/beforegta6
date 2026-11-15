---
last_mapped_commit: 9d66e1a8a7a921f9cab223ca26cf4950205412f1
last_mapped_at: 2026-11-15
---
# Technology Stack

**Analysis Date:** 2026-11-15

## Languages

**Primary:**
- JavaScript (ES modules, `"type": "module"` in `package.json`) - all source: `src/`, `scripts/`, `e2e/`, `astro.config.mjs`, `eslint.config.mjs`, `playwright.config.js`, `vitest.config.js`
- Astro components (`.astro`) - rendering only: `src/components/*.astro`, `src/layouts/Base.astro`, `src/pages/*.astro`

**Secondary:**
- Markdown - card content, one file per card: `src/content/cards/*.md`; research data: `research/candidates.json`, `research/candidates.md`
- YAML - Docker Swarm stack files and CI workflows: `deploy/production/compose.yaml`, `deploy/staging/compose.yaml`, `.github/workflows/build.yml`, `.github/workflows/ci.yml`
- Bash - image pin script: `scripts/pin-image.sh`
- CSS - `src/styles/global.css`
- nginx config - `deploy/nginx.conf`

**Typing:**
- No TypeScript source. Types come from JSDoc and `checkJs` in `jsconfig.json` (extends `astro/tsconfigs/strict`, `checkJs: true`, `strict: true`).

## Runtime

**Build-time environment:**
- Node.js 26 - pinned in `.node-version` (value `26`). `package.json` `engines.node` is `>=26`.
- Read by CI through `actions/setup-node` (`node-version-file: '.node-version'`) in `.github/workflows/ci.yml` and `.github/workflows/build.yml`.

**Serving environment (production and staging):**
- No Node process serves the site. The build output `dist/` is copied into an `nginx:1.30-alpine` image (`Dockerfile`). The site is static HTML, CSS and JS.
- Cloudflare terminates TLS. nginx listens on plain HTTP port 80 inside the overlay network.

**Package Manager:**
- npm (npm lockfile present: `package-lock.json`, `lockfileVersion` read by `npm ci` in CI)
- Install in CI: `npm ci`

## Frameworks

**Core:**
- Astro 7.4.12 (`astro` in `package.json` dependencies, `^7.4.12`) - static site generator. Output mode is the Astro default (static). Configured in `astro.config.mjs`: `site: 'https://beforegta6.wtf'`, `trailingSlash: 'always'`, `vite.build.assetsInlineLimit: 0` (every script ships as a file, so the CSP needs no `unsafe-inline`).
- Astro content collections - the `cards` collection, Markdown loaded by `glob` loader, schema in `src/content.config.js` (uses `astro/zod` and `astro:assets` `image()`).
- `@astrojs/sitemap` 3.7.5 - sitemap generation. Filters out `/oldest/` in `astro.config.mjs`.

**Testing:**
- Vitest 5.1.0 - unit tests. Config: `vitest.config.js` (includes `src/**/*.test.js`). Run: `npm test`. Test files: `src/__tests__/*.test.js`.
- Playwright Test (`@playwright/test` 1.65.0) - end-to-end tests on the built site. Config: `playwright.config.js` (testDir `e2e`, projects chromium, webkit, firefox; web server `astro preview` on port 4321). Spec: `e2e/site.spec.js`.
- `@axe-core/playwright` 4.14.0 - accessibility checks inside the Playwright suite.

**Build/Dev:**
- Astro CLI - `npm run dev`, `npm run build`, `npm run preview`, `npm run dev:up` / `npm run dev:down` (background dev server).
- ESLint 10.14.0 (flat config in `eslint.config.mjs`) with `@eslint/js` 10.0.1, `eslint-plugin-astro` 3.2.1, `globals` 17.14.0.
- Prettier 3.10.1 with `prettier-plugin-astro` 1.1.2. Config: `.prettierrc`; ignores: `.prettierignore`.
- html-validate 11.21.1 - HTML validation of `dist/**/*.html`. Run in CI: `npx html-validate "dist/**/*.html"`. No config file.
- `yaml` 2.9.1 (devDependency) - parses YAML in tests (`src/__tests__/deploy.test.js`).
- `scripts/sync-cards.js` - Node script, run with `npm run cards`. Uses only Node built-ins (`node:fs`, `fetch`).

**Docker images used by the build and deploy:**
- `nginx:1.30-alpine` - base of the site image (`Dockerfile`).
- `cloudflare/cloudflared:latest` - tunnel connector, in both compose files. Not pinned to a version.

## Key Dependencies

**Critical (runtime, shipped to the browser):**
- None. The browser loads only the files that Astro builds from `src/`, plus two third-party scripts (see `INTEGRATIONS.md`).

**Critical (build):**
- `astro` 7.4.12 - the whole build.
- `@astrojs/sitemap` 3.7.5 - `sitemap-index.xml`.

**Infrastructure (CI and tooling):**
- `vitest` 5.1.0, `@playwright/test` 1.65.0, `eslint` 10.14.0, `prettier` 3.10.1, `html-validate` 11.21.1 - the verification gate in `AGENTS.md`.

**Total runtime dependencies:** 2 (`astro`, `@astrojs/sitemap`). Keep this count low. The AGENTS.md rules favour no new packages.

## CI Actions and Container Actions

- `actions/checkout@v7.0.1`, `actions/setup-node@v7.0.0` - `.github/workflows/ci.yml`, `.github/workflows/build.yml`
- `docker/setup-qemu-action@v4.3.0`, `docker/setup-buildx-action@v4.3.0`, `docker/login-action@v4.6.0`, `docker/build-push-action@v7.3.0` - `.github/workflows/build.yml`
- Multi-arch build: `linux/amd64,linux/arm64` (the Pi swarm is arm64).

## Configuration

**Application config:**
- `astro.config.mjs` - site URL, trailing slash, sitemap, asset inlining.
- `src/data/site.js` - constants: `SITE_URL`, `SITE_NAME`, `LAUNCH` date, `TAKEDOWN_EMAIL`, `ADSENSE_ACCOUNT`, `ADSENSE_CLIENT`, `UMAMI_WEBSITE_ID`, `OPERATOR`. Empty `ADSENSE_CLIENT` turns ads off.
- `src/content.config.js` - card schema.
- `jsconfig.json` - type checking for JS.

**Environment variables:**
- The application reads no runtime environment variables. It is static. Values live in `src/data/site.js`.
- `TUNNEL_TOKEN_FILE` - set in both compose files to point `cloudflared` at its Swarm secret file. Not an app variable.
- `CI`, `CLAUDECODE`, `AI_AGENT`, `CLAUDE_CODE_ENTRYPOINT` - read by `playwright.config.js` (CI flag for reporter and server reuse; the three agent variables are cleared before `astro preview`).
- `SHA`, `REPO`, `BRANCH` - inputs to `scripts/pin-image.sh` from `build.yml`.
- A `.env` file is git-ignored (`.gitignore`). Not used by the repo. No `.env` contents were read.

**Secrets (names and locations only):**
- Cloudflare tunnel tokens: 1Password item `cloudflared-beforegta6.wtf` in vault Infrastructure (fields `staging` and `production`). Loaded into Docker Swarm secrets `staging_beforegta6_cloudflared` and `beforegta6_cloudflared`.
- GitHub Actions: `secrets.GITHUB_TOKEN` (GHCR login and pin commit), used in `.github/workflows/build.yml`.
- Arcane Git Sync and GHCR credentials: held by the Arcane server, not in the repo.

**Build config:**
- `Dockerfile` - two-line site image: copies `deploy/nginx.conf` and `dist/`, adds an HTTP healthcheck with `wget`.
- `.dockerignore` - keeps the image context small.
- `deploy/nginx.conf` - server block, cache headers (`Cache-Control`, `CDN-Cache-Control`), security headers, CSP, gzip, `/timeline/` redirect.

## Platform Requirements

**Development:**
- Node.js 26 (see `.node-version`).
- npm with `package-lock.json`.
- Playwright browsers for e2e: `npx playwright install --with-deps chromium webkit firefox` (CI step).
- macOS is the developer platform (paths and tooling in use: `/usr/bin/*`, Git worktrees under `~/Developer/.worktrees/`).
- Verification gate, in CI order: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"`, then `npm run test:e2e`.

**Production:**
- Docker Swarm, with two environments:
  - Staging: Raspberry Pi swarm (arm64), Arcane environment `staging01` (named `swarm01` in the staging compose header; see Notes), branch `develop`, stack `beforegta6-staging`, host `staging.beforegta6.wtf`.
  - Production: Hetzner swarm, Arcane environment `production01`, branch `main`, stack `beforegta6`, host `beforegta6.wtf`. Tasks run on nodes labelled `role == apps`.
- Deploy mechanism: Arcane Git Sync reads the compose file on each branch. CI writes the image tag `ghcr.io/elfensky/beforegta6:sha-<commit>` into that file.
- Image registry: GitHub Container Registry, `ghcr.io/elfensky/beforegta6`.
- Edge: Cloudflare (DNS, Tunnel, cache, Redirect Rules).
- Source: GitHub `elfensky/beforegta6` (public repo).

## Notes

- `deploy/staging/compose.yaml` header says Arcane environment `swarm01`. `deploy/README.md` says `staging01`. Confirm the environment name in Arcane before editing either file.
- `cloudflare/cloudflared:latest` and `nginx:1.30-alpine` differ in pin strictness. `nginx` has a minor-version pin only. `cloudflared` is unpinned.
- `.node-version` is used in place of `mise.toml` (documented in `AGENTS.md`).
- `package.json` has `"private": "true"` (a string, not a boolean). This has no effect on npm publishing because the package is not published.

---

*Stack analysis: 2026-11-15*
