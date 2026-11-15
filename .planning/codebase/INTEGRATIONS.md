---
last_mapped_commit: 9d66e1a8a7a921f9cab223ca26cf4950205412f1
last_mapped_at: 2026-11-15
---
# External Integrations

**Analysis Date:** 2026-11-15

## Summary

The site is static. It has no database, no server-side code, no user accounts and no incoming webhooks. Runtime integrations are two third-party scripts in the browser, the Cloudflare edge in front of the site, and the GitHub and Arcane deploy path behind it.

## APIs & External Services

**Browser-side analytics:**
- Umami (self-hosted, `umami.lav.ren`) - cookieless page views and Web Vitals.
  - Loaded in `src/layouts/Base.astro` as a `<script is:inline async src="https://umami.lav.ren/script.js">`.
  - Website ID: `UMAMI_WEBSITE_ID` in `src/data/site.js`. Only the apex host counts (`data-domains` set from `site.hostname`).
  - `data-performance="true"` enables Web Vitals.
  - Umami's recorder (`recorder.js`, session replay) must never be added. A comment in `Base.astro` forbids it.
  - Auth: none (public website ID).

**Advertising:**
- Google AdSense - Auto ads on the apex only. Documented exception in `AGENTS.md` (US service, requested by Andrei).
  - Ownership meta tag: `<meta name="google-adsense-account">` in `src/layouts/Base.astro`, value `ADSENSE_ACCOUNT` in `src/data/site.js`.
  - Loader: `src/layouts/Base.astro` injects `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=<ADSENSE_CLIENT>` with `crossOrigin='anonymous'`. It runs only when `location.hostname` equals the apex host.
  - Seller declaration: `public/ads.txt` (names the account as a direct seller).
  - The site has no ad slots. Google places ads through Auto ads, configured in the AdSense dashboard.
  - Status on 2026-11-15: "Getting ready", no ads served yet.
  - Auth: publisher ID only, no secret.
  - Test: `e2e/site.spec.js` blocks `pagead2.googlesyndication.com` and `umami.lav.ren` with Playwright routes.

**Links out (no code calls):**
- `src/pages/privacy.astro` links to: Cloudflare privacy policy, `adssettings.google.com`, `youronlinechoices.eu`, Google partner-sites policy, Belgian data protection authority (`dataprotectionauthority.be`). These are user navigation links, not API calls.

**Card research (build-time only, not in the browser):**
- `scripts/sync-cards.js` (`npm run cards`) fetches `image_url` values from `research/candidates.json` when a card has no image yet. It sends a fixed browser User-Agent. It writes the image to `src/assets/cards/` and the card to `src/content/cards/`.
- The `source.url` and `factUrl` values in each card point to third-party pages (news, Wikipedia, Commons, social posts). They render as links, not fetched data.
- Four candidates have no `image_url`. They need a manual image in `research/images/` (`deploy/README.md`).

## Data Storage

**Databases:**
- None. Content is Markdown in `src/content/cards/`, loaded at build time by Astro content collections (`src/content.config.js`).

**File Storage:**
- Local filesystem only, at build time: card images in `src/assets/cards/` (processed by Astro `image()`), and `research/images/` for images of cards that are not live (not shipped).
- Shipped assets: `public/` (`favicon.svg`, `robots.txt`, `ads.txt`, `.well-known/security.txt`), `src/assets/og-default.png`.

**Caching:**
- Build-time: npm cache in CI (`actions/setup-node` with `cache: npm`).
- Edge: Cloudflare caches HTML for 5 minutes, configured by the `CDN-Cache-Control` header in `deploy/nginx.conf`. A Cloudflare Cache Rule must be set in the dashboard (`deploy/README.md` step 8, still to do). Always Online must stay off.
- Browser: `/_astro/*` cached for one year (`immutable`). Other pages revalidate.

## Authentication & Identity

- None for visitors. No login, no accounts, no cookies set by the site.
- Operator access:
  - GitHub: `elfensky` account. Repo `elfensky/beforegta6`. `gh` CLI.
  - Cloudflare Zero Trust and DNS: dashboard only.
  - Arcane (Docker Swarm GitOps UI): Git Sync per environment.
  - 1Password: vault Infrastructure, item `cloudflared-beforegta6.wtf`.

## Monitoring & Observability

**Traffic and performance:**
- Umami at `umami.lav.ren` (see above). Staging and local runs do not report (apex-only domain filter).

**Uptime:**
- Uptime Kuma monitor 136 `beforegta6.wtf`, group `production` (external to the repo; configured in Uptime Kuma).

**Error tracking:**
- None in the repo.

**Logs:**
- nginx access and error logs to container stdout (default `nginx:1.30-alpine` behaviour). Not configured in the repo.

## CI/CD & Deployment

**Source host:**
- GitHub, `elfensky/beforegta6` (public).

**CI:**
- GitHub Actions, two workflows:
  - `.github/workflows/ci.yml` - runs on `pull_request` to `develop` and `main`. Steps: `npm ci`, lint, test, build, html-validate, Playwright install (chromium, webkit, firefox), e2e.
  - `.github/workflows/build.yml` - runs on `push` to `main` and `develop` (not on docs, research or pin-commit paths). Builds `dist/`, builds a multi-arch image (`linux/amd64,linux/arm64`), pushes `ghcr.io/elfensky/beforegta6:sha-<commit>`, then the `pin` job runs `scripts/pin-image.sh` and commits the tag to the branch's compose file.
- Permissions: `build` job has `packages: write`. `pin` job has `contents: write`. Both use `GITHUB_TOKEN`.

**Container registry:**
- GitHub Container Registry (`ghcr.io`), image `ghcr.io/elfensky/beforegta6`. Public.

**Hosting:**
- Docker Swarm stacks deployed by Arcane Git Sync:
  - Staging: `deploy/staging/compose.yaml` on branch `develop`, Pi swarm, host `staging.beforegta6.wtf`.
  - Production: `deploy/production/compose.yaml` on branch `main`, Hetzner swarm, host `beforegta6.wtf`.
- Ingress: a Cloudflare Tunnel per stack. The `cloudflared` service dials out. The public hostname maps to `http://web:80` (remote configuration in Zero Trust, not in the repo).
- Each tunnel runs two `cloudflared` replicas.

**Deploy secrets:**
- Swarm external secret `staging_beforegta6_cloudflared` (staging) and `beforegta6_cloudflared` (production). Each holds a tunnel token. The token is read through `TUNNEL_TOKEN_FILE`. Never put a token in a compose file.

## Environment Configuration

**Required env vars for the app:** none.

**Required values for deploy:**
- Two Swarm secrets (names above), created once on a manager.
- Arcane Git Sync entries: `beforegta6-staging` (environment `staging01`) and `beforegta6` (environment `production01`).
- GHCR pull: the repo and its package are public, so no pull credential is needed (`deploy/README.md`).

**Secrets location:**
- Tunnel tokens: 1Password, vault Infrastructure, item `cloudflared-beforegta6.wtf`. Swarm secrets on each manager.
- GitHub token: provided per run by GitHub Actions. Not stored in the repo.
- No secret is committed. `.gitignore` excludes `.env` and `.env.production`.

## Cloudflare Edge

- DNS and proxy for `beforegta6.wtf` and `www` (proxied CNAME to the apex).
- Redirect Rule: `www` to apex, 301, query string kept.
- Cache Rule (planned, `deploy/README.md` step 8): cache HTML at the edge, host `beforegta6.wtf` only. Edge TTL uses origin `CDN-Cache-Control`. Tiered Cache on Smart Topology. Always Online off.
- `vpn.lav.ren` and other records are outside this repo. Not relevant to the site.

## Email

- `takedown@lav.ren` - published contact address (footer, privacy page, `public/.well-known/security.txt`). Not an integration; no code sends mail.

## Webhooks & Callbacks

**Incoming:**
- None. The site has no API endpoints.

**Outgoing:**
- None from the app.
- Deploy path: GitHub push events trigger `build.yml`. Arcane Git Sync polls or receives the branch update and applies the compose file. Both are configured outside the repo.

## Documented Exceptions (from AGENTS.md)

- AdSense loads from Google servers. This breaks the no-CDN rule. Documented exception.
- AdSense is a US service. This breaks the EU-first preference. Documented exception.
- The CSP (`deploy/nginx.conf`) has no `script-src`, so Google scripts can load. The reason is in `deploy/README.md` § AdSense.

---

*Integration audit: 2026-11-15*
