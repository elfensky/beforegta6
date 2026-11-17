# Requirements: beforegta6.wtf

**Defined:** 2026-11-15
**Core Value:** The site is live, fast and correct on GTA 6 launch week, so the meme has a finished archive when it stops working on 2026-11-19.

## How to read this file

- Scope `v1` means milestone v1.0 (the launch-week site). Scope `v2` means later. "Out of Scope" means not planned.
- The site-version labels in the phase names (site v1, v2, v3) are build stages. They are not requirement scopes.
- `[x]` means complete: built, verified and committed. The evidence follows each line. Commit hashes are short.
- A source tag such as `REQ-card-pages` points to an entry in `.planning/intel/requirements.md`. That folder is local (a GSD runtime folder, gitignored): `/gsd-ingest-docs` rebuilds it from `docs/superpowers/` and `docs/PROMOTION.md`.
- "Unverified" means the intel, the code and the git log cannot show it.
- Dates of merged PRs are UTC merge dates from `gh pr list` (2026-11-15). Open issues are not repeated here. See #19 and #24.

## v1 Requirements

### Plan

- [x] **PLAN-01**: A design spec that Andrei approved and a launch plan exist. Evidence: `docs/superpowers/specs/2026-11-13-beforegta6-design.md` (bfe55d5) and `docs/superpowers/plans/2026-11-13-beforegta6-launch.md` (474d25c), 2026-11-13.
- [x] **PLAN-02**: The repo is personal and public: `elfensky/beforegta6`. Evidence: 8f1ecdb, 2026-11-13.

### Content

- [x] **CONT-01**: Each launched card has its own local image, credits the creator and links the source post. Evidence: PR #1 (917a852, 2026-11-13), PR #4 (8fced32, 2026-11-13).
- [x] **CONT-02**: The live set follows the content rules: Andrei's picks, no Rockstar material, nothing sexually explicit, none of the excluded topics. Source: `REQ-content-rules`. Evidence: PR #3 holds `sex-2` and `durian-condom` (f6f3fc3); PR #5 replaces Rockstar art in 24 card images (a21ce3c); PR #16 archives the MatPat card as drop (1306775).
- [x] **CONT-03**: Every find stays in the research archive, and a world-event rule picks the highlights. Evidence: PR #8 (1e5a777 to 528ede2, 2026-11-14): research pass 3 with a 291-event archive, and 63 pass-2 cards below the rule moved to the archive.
- [x] **CONT-04**: One `research/candidates.json` holds every find with tags and a status. `npm run cards` makes `src/content/cards/` and `src/assets/cards/` match it, and a guard test fails on a mismatch. Source: `REQ-single-candidates-file`. Evidence: 383 candidates (97 launch, 3 hold, 283 drop) and 97 card files, checked 2026-11-15; 007370d, 1e3f1e7, 77474e9, 0c89808 (PR #21 landed on `develop` by rebase on 2026-11-15; GitHub shows it CLOSED after a 502); `src/__tests__/content.test.js`.
- [ ] **CONT-05**: The held card `gta5-farewell-drive` goes live on 2026-11-18: set `status: "launch"` in the JSON, run `npm run cards`, release to `main`. Source: design spec Content rules; `deploy/README.md`. State checked 2026-11-15: `status: "hold"`, `timeline_date: 2026-11-18`.
- [x] **CONT-06**: After the image follow-up completes, staging and production serve the verified, sorted selection and applied review feedback. Completion requires checking both live environments. Source: Andrei's three-goal order, 2026-11-17; `.planning/ROADMAP.md` Current execution order. Completed 2026-11-17 through PRs #29 and #30. Both live selections and all 206 page/image pairs are verified; see `.planning/verification/2026-11-17-release.md`.

### Site

- [x] **SITE-01**: The site is live in production before 2026-11-19 with the curated launch set. Source: `REQ-live-before-launch`. Evidence: PR #1 (2026-11-13 20:07), release PR #6 (2026-11-13 23:24); first production pin 1db66e6 (2026-11-13 22:48 UTC); production live 2026-11-13 23:58 CET (journal of that day).
- [x] **SITE-02**: Every card has a page at `/<id>/` with Open Graph and X card metadata. Social previews use the full title, image description, and a 1200 × 630 JPEG that preserves the complete image. An `nsfw` card uses the default image and its description instead (`ogImageOf` in `src/lib/`). Static JSON-LD describes the website, timeline, entries, and breadcrumbs. `/llms.txt` lists the canonical public pages. Source: `REQ-card-pages` (page and preview part), Andrei's metadata request on 2026-11-17. Evidence: `src/pages/[id].astro`, `src/layouts/Base.astro`, `e2e/metadata.spec.js`, and `docs/METADATA.md`.
- [x] **SITE-03**: The header counts down to 2026-11-19. After that moment it reads "We got all of this before GTA 6." Source: `REQ-countdown` (header part). Evidence: `src/components/Countdown.astro`, `src/scripts/countdown.js`; e2e "shows after the launch, with the flipped title".
- [x] **SITE-04**: A push to `develop` deploys staging, and a push to `main` deploys production. The site runs as an nginx image on Docker Swarm with its own Cloudflare Tunnel per stack, and CI pins the image. Evidence: a465b6c, PR #1, PR #6; `.github/workflows/build.yml`; `deploy/README.md`.
- [x] **SITE-05**: `www.beforegta6.wtf` redirects to the bare domain with a 301. Evidence: PR #7 (1142054, 2026-11-14); `deploy/README.md` step 6.
- [x] **SITE-06**: The footer names the operator and the takedown contact, and a privacy page exists. Evidence: 83a67c9; e2e "the footer names the operator, the contact and the privacy page".
- [x] **A11Y-01**: Pages pass axe, do not scroll sideways at 320 px, have a skip link and read in full without JavaScript. Evidence: f8ec84b; `e2e/site.spec.js` (axe, 320 px, skip link and no-JS tests).
- [x] **MEAS-01**: Umami counts page views on the apex only, with no cookies and no consent banner. Evidence: PR #7 (1142054); `data-domains` in `src/layouts/Base.astro`.

### Timeline

- [x] **TIME-01**: `/` is one centred line timeline: one short row per event, year headings and fixed milestones, ending at "GTA 6 comes out". The card page keeps the image, the blurb and the sources. Source: `REQ-line-timeline`. Evidence: PR #11 (3ccf3bb, 7e98349; 2026-11-15 02:35).
- [x] **TIME-02**: A row reads straight down. Focus order and screen-reader order are the same at every width. Source: `REQ-row-readable`. Evidence: PR #11; e2e axe and 320 px tests.
- [x] **TIME-03**: No card image loads on the first view. On desktop, hover or focus on a row shows its image, above milestones. Source: `REQ-no-images-first-view`. Evidence: PR #11, PR #12 (8a28681); e2e "a row shows its image on hover, and no card image loads before".
- [x] **TIME-04**: The only control is the order. `/` is newest first. `/oldest/` is oldest first, names `/` as canonical and stays out of the sitemap. Source: `REQ-order-control`. Evidence: PR #9 (97be34e, 2026-11-14), PR #11; e2e "the order toggle switches between newest and oldest first".
- [x] **TIME-05**: `/timeline/` answers 301 to `/` in production. Evidence: d11eeee; release PR #13 (2026-11-15 02:49); production pin e2fa991; `deploy/nginx.conf`.

- [x] **TIME-06**: The 14 reviewed GTA items use milestone presentation and retain their pages. Explicit candidate links suppress existing duplicates. Released and verified, 2026-11-17, through PRs #29 and #30. Evidence: `src/lib/cards.js`, timeline tests, feedback outcomes.

### Ads and measurement

- [x] **ADS-01**: The site proves ownership to AdSense with a meta tag and `ads.txt`. Evidence: PR #14 (b04c347), release PR #15 (2026-11-15 03:00).
- [x] **ADS-02**: AdSense Auto ads: Google places the ads, the site has no ad slots of its own, the script loads on the apex only, and the site shows no ads and no placeholder before approval. Source: `REQ-adsense`, `REQ-one-ad-per-screen` (code part). Evidence: PR #17 (87fcd57), PR #20 (25eabbb), PR #23 (aa46e1f); e2e "the AdSense script loads on the apex only".
- [ ] **ADS-03**: AdSense approves the site after launch. Andrei sets Auto ads to about one ad per screen and publishes the consent message for the EEA, UK and Switzerland. This work is external, in Andrei's AdSense account. Source: `REQ-adsense`, `REQ-one-ad-per-screen`. Status: Andrei confirmed AdSense is in review on 2026-11-16. The two settings remain unverified. Phase 6 records the state on 2026-11-22. The requirement stays open until Google approves.
- [x] **MEAS-02**: Umami counts Web Vitals and loads async, so a stalled Umami cannot block the site. Evidence: PR #10 (218e281, a8cde0d; 2026-11-15 03:09); e2e "the countdown runs while the Umami script never answers".
- [x] **PERF-01**: nginx sends `CDN-Cache-Control: max-age=300, stale-if-error=86400` for the HTML. Evidence: ba37c03 (PR #20). The Cloudflare rule that uses it is PROMO-01.

### Launch week

- [x] **PROMO-01**: The Cloudflare Cache Rule `HTML at the edge` is active for the apex. Two production requests returned `cf-cache-status: HIT` and `age: 290` on 2026-11-16. Tiered Cache uses Automatic Upper Tiers. Always Online is off. Evidence: `deploy/README.md`, step 8.
- [x] **PROMO-02**: Production card pages serve the share control and its share-sheet or clipboard script. The control stays hidden without JavaScript. Source: `REQ-card-pages` (share part). Evidence: PR #22 (1ae4c79), release PR #18, and production markup plus script verified on 2026-11-16.
- [ ] **PROMO-03**: After the launch moment on 2026-11-19, the line "And we got GTA 6 before The Winds of Winter." shows under the title. Source: `REQ-countdown` (second part). Built in PR #22 (1ae4c79) with the e2e test "shows after the launch, with the flipped title". The live check happens on 2026-11-19.
- [ ] **PROMO-04**: Prepare unique social-media drafts and assets after CONT-06 is verified in production. Andrei publishes every post himself. The assistant sends no posts, replies, or moderator messages. Draft preparation is complete. Manual publication started with the verified [X post](https://x.com/elfensky/status/2122730891772391740) on 17 November 2026. Further promotion remains in progress. Use `docs/PROMOTION.md` for the channels, limits, and stop rules. Source: Andrei's latest clarification, 2026-11-17.
- [ ] **PROMO-05**: On 2026-11-22 Andrei reads Umami referrers per channel and records the result.

### Candidate review

- [x] **REV-01**: A local review page shows one candidate at a time from `research/candidates.json`, with a yes answer and a no answer by swipe or keys. Source: issue #19. Evidence: `.planning/verification/2026-11-16-completion.md` and the review fixture tests, 2026-11-16.
- [x] **REV-02**: Yes saves the selection and sets `status: "launch"` after a local preview loads. With an unavailable image, Yes stays pending with `status: "drop"`. No sets `drop` and cancels pending selection. The existing sync updates the site. An explicit fetch action prepares a local preview from an image URL. Held candidates remain protected. Source: issue #19; Andrei's image-failure correction, 2026-11-17. Evidence: review API and browser tests.
- [x] **REV-03**: The page is a dev tool and never ships. No file from it appears in `dist/`. Source: issue #19. Evidence: `.planning/verification/2026-11-16-completion.md` and the review fixture tests, 2026-11-16.
- [x] **REV-04**: Each candidate accepts image or presentation notes in `review_notes`. Notes save to the candidates file without changing selection. Navigation saves pending notes; a failed save retains the text. Public cards exclude notes. Source: Andrei, 2026-11-17. Evidence: review API and browser tests.
- [x] **REV-05**: Reviewable items have local `/<itemId>` URLs. Reload preserves the addressed item; `/` resumes the last item in the same browser. Next, Previous, and numbered Go controls preserve selections and save pending notes. Browser history follows item URLs; failed saves prevent navigation. Source: Andrei, 2026-11-17. Evidence: review API and browser tests.
- [x] **REV-06**: Every accepted Yes or No saves the latest choice and timestamp in `review_decision`, even without a status change. Missing or broken images permit a pending Yes. The UI shows each item's decision, the decided count, and the number awaiting image approval. Visits, skips, notes, and image fetches do not mark an item decided. Decision records remain outside public cards. Source: Andrei, 2026-11-17. Evidence: review API and browser tests.

- [x] **REV-07**: Reviewed notes have recorded outcomes; merged duplicates retain their history and cannot relaunch through the review tool. Released and verified, 2026-11-17, through PRs #29 and #30. Evidence: feedback outcomes, candidate validation, review API tests.

### Protected deployments

- [x] **DEPLOY-01**: CI pins staging and production images on dedicated deployment branches. Arcane reads those branches. Both source branches require PRs and the `check` status. Integration uses rebase merges, and releases use merge commits. Force pushes and deletion remain blocked. Source: issue #24, included by Andrei on 2026-11-16. Evidence: live replicas, Git Sync records, recovery registry, and effective branch rules verified in `.planning/verification/2026-11-16-completion.md`.

## v2 Requirements

Deferred. Tracked, not in the current roadmap.

- **VOTE-01**: Visitors can like or dislike a card. Proposal only, not designed: a small API service in the same stack, one table (`card_id`, `up`, `down`) in the production Postgres, anonymous votes, and a rate limit per hashed IP. The site stays static and fetches the counts. Source: `REQ-non-goals-launch`.
- **HOLD-01**: The held cards `sex-2` and `durian-condom` go live after AdSense approves the site (Andrei, 2026-11-13). Both are `status: "hold"` in the JSON (checked 2026-11-15). This depends on ADS-03.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Submissions, accounts, comments, merch, other languages | Launch non-goals (design spec). |
| Search, filters, view counts, a view toggle | The line timeline design allows one control: the order. |
| Own ad slots | AdSense Auto ads replaced them on 2026-11-15. |
| Card grid and lines views | The line timeline replaced them (2026-11-15). |
| Rockstar material (GTA logo, fonts, key art) | Exceptions approved on 2026-11-17: Oppressor comparison and Red Dead phone card only. Cena retains his portrait. |
| Sexually explicit cards; cards about deaths, war, violence, sexual-abuse cases, harassment of private people or hate | Specific exceptions on 2026-11-17: Queen Elizabeth II's death and one COVID/chip-shortage card. Other exclusions remain. |
| Show HN, a site name inside meme images, a card-grid homepage image, Bluesky, short video | The promotion council or Andrei rejected them (`docs/PROMOTION.md`). |
| Fixes for items in `.planning/codebase/CONCERNS.md` | Not requirements until Andrei picks them. |

## Traceability

Each v1 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAN-01 | Phase 1 | Complete (2026-11-13) |
| PLAN-02 | Phase 1 | Complete (2026-11-13) |
| CONT-01 | Phase 2 | Complete (2026-11-13) |
| CONT-02 | Phase 2 | Complete (2026-11-15) |
| CONT-03 | Phase 2 | Complete (2026-11-14) |
| CONT-04 | Phase 2 | Complete (2026-11-15) |
| SITE-01 | Phase 3 | Complete (2026-11-13) |
| SITE-02 | Phase 3 | Complete (2026-11-13) |
| SITE-03 | Phase 3 | Complete (2026-11-13) |
| SITE-04 | Phase 3 | Complete (2026-11-13) |
| SITE-05 | Phase 3 | Complete (2026-11-14) |
| SITE-06 | Phase 3 | Complete (2026-11-13) |
| A11Y-01 | Phase 3 | Complete (2026-11-13) |
| MEAS-01 | Phase 3 | Complete (2026-11-14) |
| TIME-01 | Phase 4 | Complete (2026-11-15) |
| TIME-02 | Phase 4 | Complete (2026-11-15) |
| TIME-03 | Phase 4 | Complete (2026-11-15) |
| TIME-04 | Phase 4 | Complete (2026-11-15) |
| TIME-05 | Phase 4 | Complete (2026-11-15) |
| TIME-06 | Phase 7 | Complete (2026-11-17; PRs #29, #30) |
| ADS-01 | Phase 5 | Complete (2026-11-15) |
| ADS-02 | Phase 5 | Complete (2026-11-15) |
| MEAS-02 | Phase 5 | Complete (2026-11-15) |
| PERF-01 | Phase 5 | Complete (2026-11-15) |
| PROMO-01 | Phase 6 | Complete (2026-11-16) |
| PROMO-02 | Phase 6 | Complete (2026-11-16) |
| PROMO-03 | Phase 6 | In progress (built; live check on 2026-11-19) |
| PROMO-04 | Phase 6 | Publication started: X post verified on 2026-11-17. Andrei owns further posts. r/gaming remains closed. |
| PROMO-05 | Phase 6 | Pending (2026-11-22) |
| CONT-05 | Phase 6 | Pending (2026-11-18) |
| CONT-06 | Phase 6 | Complete (2026-11-17; both environments verified) |
| ADS-03 | Phase 6 | Pending (AdSense in review) |
| REV-01 | Phase 7 | Complete (2026-11-16) |
| REV-02 | Phase 7 | Complete (2026-11-16) |
| REV-03 | Phase 7 | Complete (2026-11-16) |
| REV-04 | Phase 7 | Complete (2026-11-17; PRs #29, #30) |
| REV-05 | Phase 7 | Complete (2026-11-17; PRs #29, #30) |
| REV-06 | Phase 7 | Complete (2026-11-17; PRs #29, #30) |
| REV-07 | Phase 7 | Complete (2026-11-17; PRs #29, #30) |
| DEPLOY-01 | Phase 8 | Complete (2026-11-16) |

**Coverage:**
- v1 requirements: 40 total
- Complete: 35
- Implemented locally: 0
- Open: 5 (Phase 6)
- Mapped to phases: 40
- Unmapped: 0

## Intel traceability

Every entry of `.planning/intel/requirements.md` maps to at least one requirement above.

| Intel entry | Requirement |
|-------------|-------------|
| `REQ-live-before-launch` | SITE-01 |
| `REQ-card-pages` | SITE-02 (page, preview), PROMO-02 (share button) |
| `REQ-countdown` | SITE-03 (header), PROMO-03 (post-launch line) |
| `REQ-adsense` | ADS-02, ADS-03 |
| `REQ-line-timeline` | TIME-01 |
| `REQ-row-readable` | TIME-02 |
| `REQ-no-images-first-view` | TIME-03 |
| `REQ-order-control` | TIME-04 |
| `REQ-one-ad-per-screen` | ADS-02 (code), ADS-03 (setting) |
| `REQ-single-candidates-file` | CONT-04 |
| `REQ-content-rules` | CONT-01, CONT-02 |
| `REQ-non-goals-launch` | Out of Scope; VOTE-01 (v2) |

---
*Requirements defined: 2026-11-15*
*Last updated: 2026-11-17 with verified production (CONT-06) and Andrei's drafts-only instruction for the assistant (PROMO-04).*

The media exceptions in `AGENTS.md` permit five specified replacements without documented reuse licences. Their actual copyright status remains recorded.
