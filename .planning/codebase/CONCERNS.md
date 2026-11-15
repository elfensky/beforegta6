---
last_mapped_commit: 9d66e1a8a7a921f9cab223ca26cf4950205412f1
last_mapped_at: 2026-11-15
---
# Codebase Concerns

**Analysis Date:** 2026-11-15

## Tech Debt

**Launch date copied into several files:**
- Issue: The launch date `19 November 2026` is written by hand in four places. A delay needs an edit in each.
- Files: `src/data/site.js` (`LAUNCH`), `src/data/milestones.js` (`2026-11-19` "GTA 6 comes out"), `src/components/Countdown.astro` (`datetime` and visible text), `e2e/site.spec.js` (text match and fixed clock dates).
- Impact: A third delay leaves the countdown, the milestone and the page text out of step. The e2e test still passes on the old date.
- Fix approach: Keep one exported date in `src/data/site.js`. Import it into `milestones.js` and `Countdown.astro`. Build the visible text and the `datetime` from it. Make the e2e test read the same export.

**Time zone mixed between countdown and timeline:**
- Issue: `src/scripts/countdown.js` builds the target from local midnight (`new Date(LAUNCH.year, ...)`). `src/lib/countdown.js` (`daysBefore`, used by `src/components/TimelineItem.astro`) uses UTC midnights.
- Files: `src/scripts/countdown.js`, `src/lib/countdown.js`, `src/components/TimelineItem.astro`
- Impact: A visitor far from UTC can see a countdown that does not match the day counts on the timeline.
- Fix approach: Use UTC for every date comparison, or local time for every one. Pick one and test both paths.

**Duplicated card and timeline pages:**
- Issue: `src/pages/index.astro` and `src/pages/oldest.astro` both render `src/components/Timeline.astro`. Each page renders the full list. `src/pages/[id].astro` renders one card per page.
- Files: `src/components/Timeline.astro`, `src/pages/index.astro`, `src/pages/oldest.astro`
- Impact: Every card is in the HTML of both timeline pages. The page weight grows with each launched card. This is acceptable at the current size but has no limit.
- Fix approach: Keep the single component. If the list grows past a few hundred rows, add paging or a build-time split by year.

**Hand-written image provenance in the candidates file:**
- Issue: `research/candidates.json` holds 467 candidate records. Most descriptions of images live in a free-text `image_note` field, not in the structured `image_alt` or `image_license` fields.
- Files: `research/candidates.json`, `scripts/lib/candidate.js` (`toCard`: `imageAlt` falls back to the title)
- Impact: A launched card without `image_alt` gets the card title as its alt text. Alt text is then not a description of the picture.
- Fix approach: Add `image_alt` to every launch candidate. Make `checkCandidates` refuse a launch candidate that has no `image_alt`.

## Known Bugs

**Launch candidates with no image URL:**
- Symptoms: `npm run cards` fails for a launch candidate that has no `image_url` and no image file in `src/assets/cards/` or `research/images/`.
- Files: `scripts/sync-cards.js`, `research/candidates.json` (lines near 3848, 8076, 8312, 8676 hold `"image_url": null`)
- Trigger: Set a candidate to `status: "launch"` with no `image_url`.
- Workaround: Save the image by hand in `research/images/<id>.<ext>` before the run. `deploy/README.md` lists the four current cases: `aws-outage-2025`, `pope-meets-patriarch`, `uk-age-checks`, `brain-rot-word-of-the-year`.

**Failed launch leaves an old card file in place:**
- Symptoms: If a launch candidate fails to fetch its image, `scripts/sync-cards.js` records the failure and keeps the existing `src/content/cards/<id>.md` (the id stays in the live set). The run exits 1, but the site still builds from the old file.
- Files: `scripts/sync-cards.js` (the `try` block and the `live` set)
- Trigger: A remote image host returns an error during `npm run cards`.
- Workaround: Read the exit code and the failure list. Fix the image, then run again.

## Security Considerations

**Image host and licence exposure in a public repository:**
- Risk: `research/images/` holds 66 image files that are tracked in git. The repo is public. `AGENTS.md` says that no Rockstar material may ship. `deploy/README.md` says to delete held images on a takedown because the repo is public. Deleting a file does not remove it from git history. The file names include items such as `ai-generated-gta.jpg` and `4k-freddie.png`. This review did not open the images.
- Files: `research/images/` (tracked), `.gitignore` (does not ignore it), `deploy/README.md` § Takedown
- Current mitigation: Only `src/assets/cards/` is imported by the site, so held images do not ship in the build.
- Recommendations: Check each tracked file in `research/images/` against the no-Rockstar rule and the licence in `research/candidates.json`. Remove files that break the rule and rewrite history if needed. Decide whether held images should be tracked at all, then add `research/images/` to `.gitignore` or keep it in private storage.

**CI deploys without the test gate:**
- Risk: `.github/workflows/ci.yml` runs lint, unit tests, the build, html-validate and the e2e suite only on `pull_request`. `.github/workflows/build.yml` runs on every push to `main` and `develop`, builds and pins the image. It does not run lint or tests. A direct push to either branch goes to production or staging with no test run.
- Files: `.github/workflows/ci.yml`, `.github/workflows/build.yml`, `scripts/pin-image.sh`
- Current mitigation: Rulesets block force-push and deletion (`AGENTS.md` § Branches). Open issue #24 covers the four branch-ruleset settings.
- Recommendations: Make `build.yml` run `npm run lint`, `npm test` and `npx html-validate` before the image job. Enforce PRs with a deploy key that can bypass the pin job, as `AGENTS.md` describes.

**Takedown needs a manual cache purge:**
- Risk: `/_astro/` files are cached for one year (`deploy/nginx.conf`, `Cache-Control: public, max-age=31536000, immutable`). A dropped card's image keeps being served from browser and Cloudflare caches until someone purges it by hand.
- Files: `deploy/nginx.conf`, `deploy/README.md` § Takedown
- Current mitigation: The README lists the manual purge steps (Caching → Purge by URL).
- Recommendations: Add a checklist item to the takedown run. Confirm the purge with `cf-cache-status` after it.

**No script-src in the Content Security Policy:**
- Risk: `deploy/nginx.conf` sends `object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`, with no `script-src`. Any script that reaches a page can run. Google's AdSense script loads at run time from hosts that Google does not list, so no `script-src` allowlist is possible without breaking ads.
- Files: `deploy/nginx.conf`, `src/layouts/Base.astro` (AdSense loader, Umami tag)
- Current mitigation: The site has no user input. Astro escapes card text. Inline scripts in `Base.astro` are the only inline code.
- Recommendations: Accept this as a documented trade-off, as `deploy/README.md` § AdSense does. Revisit it if the site gains user input.

**Unpinned third-party images and actions:**
- Risk: `deploy/staging/compose.yaml` and `deploy/production/compose.yaml` run `cloudflare/cloudflared:latest`. The `Dockerfile` uses `nginx:1.30-alpine`, not a digest. The workflows pin actions to tags (for example `actions/checkout@v7.0.1`, `docker/build-push-action@v7.3.0`), not to commit SHAs. The `pin` job holds `contents: write`.
- Files: `deploy/staging/compose.yaml`, `deploy/production/compose.yaml`, `Dockerfile`, `.github/workflows/build.yml`, `.github/workflows/ci.yml`
- Current mitigation: No Renovate or Dependabot config is tracked in the repo.
- Recommendations: Pin `cloudflared` and the nginx base to a version tag or digest. Pin the actions to full commit SHAs with a version comment.

**Security.txt expires in early 2027:**
- Risk: `public/.well-known/security.txt` has `Expires: 2027-02-01`. After that date, the file is no longer valid under RFC 9116.
- Files: `public/.well-known/security.txt`
- Current mitigation: None.
- Recommendations: Renew the date before 2027-02-01. Add a task to the cockpit.

**Canonical and Open Graph URLs point to production on every build:**
- Risk: `astro.config.mjs` sets `site: 'https://beforegta6.wtf'` for all builds. A staging build therefore names the apex as canonical and in `og:url`, and its sitemap lists apex URLs.
- Files: `astro.config.mjs`, `src/layouts/Base.astro`, `public/robots.txt`
- Current mitigation: `deploy/nginx.conf` sends `X-Robots-Tag: noindex` on staging. `src/__tests__/meta.test.js` tests the page titles only.
- Recommendations: Read the site URL from an environment variable in the build, or accept the current setup and document it in `deploy/README.md`.

## Performance Bottlenecks

**Every image is processed at three widths on every build:**
- Problem: `src/components/Card.astro` requests widths 480, 960 and 1200 for each card. Build time and output size grow with each launched card.
- Files: `src/components/Card.astro`, `src/assets/cards/`
- Cause: Astro optimises each image in the cards collection at build time. About 100 JPEG, PNG and WebP files are tracked in `src/assets/cards/`.
- Improvement path: Keep the image widths. Resize the source images to the largest needed width before commit. Drop the 1200 width if no layout reaches it.

**Edge cache depends on a rule that is not yet in place:**
- Problem: `deploy/nginx.conf` sends `CDN-Cache-Control: max-age=300, stale-if-error=86400`. Cloudflare caches HTML only after the cache rule in `deploy/README.md` step 8 exists. Until then, every HTML request goes to the origin.
- Files: `deploy/nginx.conf`, `deploy/README.md` § step 8
- Cause: The Cloudflare dashboard step is still open.
- Improvement path: Create the cache rule and the tiered cache setting as step 8 describes. Check `cf-cache-status` with the curl command in the README.

**Accepted risk on release:**
- Problem: For up to five minutes after a release, a cached old HTML page can ask for `/_astro/` files that the new build does not have. The README accepts this (Andrei, 2026-11-15).
- Files: `deploy/README.md` § step 8
- Cause: Edge cache on HTML, hashed assets in a new build.
- Improvement path: Purge the HTML URLs after each release, or keep the old `/_astro/` files for one release.

## Fragile Areas

**The pin job rewrites a compose file with sed:**
- Files: `scripts/pin-image.sh`, `deploy/staging/compose.yaml`, `deploy/production/compose.yaml`
- Why fragile: The job finds the `image:` line by a regular expression. A hand edit that quotes the value, or a YAML formatter, stops the match. The guard then fails the job, so deploys stop.
- Safe modification: Keep the `image: ghcr.io/elfensky/beforegta6:` line plain. Run `bash scripts/pin-image.sh` against a scratch clone before changing the file format.
- Test coverage: `src/__tests__/deploy.test.js` checks only that the script has no `[skip ci]` string. No test runs the sed or the retry loop. `scripts/pin-image.sh` says a race simulation exists in miklav.com. No such test is in this repo.

**The card sync overwrites hand edits:**
- Files: `scripts/sync-cards.js`, `src/content/cards/*.md`
- Why fragile: `npm run cards` rewrites every launched card and deletes every other card file. Any hand edit in `src/content/cards/` is lost on the next run.
- Safe modification: Edit `research/candidates.json` only, then run `npm run cards`.
- Test coverage: `src/__tests__/content.test.js` fails when a card differs from what the sync writes.

**Relative import from a page script:**
- Files: `src/pages/[id].astro`, `src/components/Timeline.astro`, `src/layouts/Base.astro`
- Why fragile: The script imports point at `../scripts/...` from inside `src/pages/` and `src/components/`. Moving a file breaks the import at build time only.
- Safe modification: Keep the scripts in `src/scripts/`. Import through a path alias if the tree grows.
- Test coverage: The build and the e2e suite catch a broken import.

**Hover-image dismissal:**
- Files: `src/scripts/media.js`, `src/styles/global.css` (`.google-auto-placed`, `.media`, `.milestone`)
- Why fragile: The z-index rules rely on Google's auto ad class `.google-auto-placed`. Google does not document that class. The e2e test "a hover image covers a milestone, never an ad" creates the class by hand.
- Safe modification: Check the live site once ads show, as `deploy/README.md` § AdSense asks.
- Test coverage: The e2e test checks z-index order only. It does not check a real ad.

## Scaling Limits

**Repository size:**
- Current capacity: About 100 card images in `src/assets/cards/`, 66 held images in `research/images/`, and a 467-record candidates file.
- Limit: Not measured. Every image in git adds to every clone.
- Scaling path: Keep images small and in git only when they ship. Move held images to private storage.

## Dependencies at Risk

**The `private` field in `package.json` is a string:**
- Risk: `package.json` sets `"private": "true"`, a string. npm treats any non-empty value as private, so it works today. A tool that checks for the boolean would not.
- Impact: Low.
- Migration plan: Change the value to `true`.

**Node pin and engines:**
- Risk: `.node-version` pins `26` and `package.json` sets `engines.node` to `>=26`. Both follow the newest LTS line, as the shared standard asks.
- Impact: None now. A new LTS line needs both files to change together.
- Migration plan: Change `.node-version` and `engines` in one commit.

## Missing Critical Features

**No recovery path for a bad launch-day release:**
- Problem: The site has no way to hide a card quickly apart from a full release. `deploy/README.md` describes a takedown as a commit, a merge and a release, then a cache purge.
- Blocks: A takedown during the launch-week traffic spike needs the full path, so it takes minutes to hours.
- Fix approach: Document a fast path: set `status: "drop"`, run `npm run cards`, push to `main`, purge the URLs. Time it once before launch week.

## Test Coverage Gaps

**Client scripts have no unit tests:**
- What's not tested: `src/scripts/countdown.js` (the tick and the done state), `src/scripts/share.js` (clipboard and share sheet branches), `src/scripts/media.js` (Escape dismissal).
- Files: `src/scripts/countdown.js`, `src/scripts/share.js`, `src/scripts/media.js`
- Risk: A change breaks the countdown, the share button or the hover dismissal. The e2e suite covers some of these, but not the day-count text.
- Priority: Medium

**Pin script has no behaviour test:**
- What's not tested: The branch guard, the sed pin, the "already pinned" exit and the retry after a rejected push.
- Files: `scripts/pin-image.sh`
- Risk: A change in `build.yml` stops every deploy. The test suite does not catch it.
- Priority: High

**Sync script has no test:**
- What's not tested: `scripts/sync-cards.js` (`moveImage`, the failure list, the exit code).
- Files: `scripts/sync-cards.js`, `scripts/lib/candidate.js` (has tests in `src/__tests__/candidate.test.js`)
- Risk: A move of an image between `src/assets/cards/` and `research/images/` goes wrong and an image ships or disappears.
- Priority: Medium

**Launch date in the e2e suite:**
- What's not tested: The e2e checks set the clock to 2026-11-19 and read the text `GTA 6: 19 November 2026`. They do not read the date from `src/data/site.js`.
- Files: `e2e/site.spec.js`
- Risk: A date change breaks tests for the wrong reason, or the tests keep passing on an old date.
- Priority: Low

---

*Concerns audit: 2026-11-15*
