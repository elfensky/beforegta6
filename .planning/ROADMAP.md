# Roadmap: beforegta6.wtf

## Overview

beforegta6.wtf is a meme timeline, "We got ___ before GTA 6", that must be live and fast on GTA 6 launch week (launch: 2026-11-19). The roadmap holds one milestone, v1.0. Phases 1 to 5 are backdated groups of the work done on 2026-11-13 to 2026-11-15: the plan, the research, the launch site, the timeline and the ads. Each carries its completion date and its evidence. Phases 6 and 7 are the open work: the launch-week promotion and the candidate review page.

This repo owns this plan. Phase structure follows Andrei's own frame (2026-11-15). `.planning/config.json` sets granularity `standard` and sequential phase IDs.

## Milestones

- 🚧 **v1.0 Launch-week site** - Phases 1-7 (in progress; GTA 6 launches 2026-11-19)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): planned milestone work
- Decimal phases (2.1, 2.2): urgent insertions (marked INSERTED)

Phases 2 to 5 overlap in time. They are groups of one build, not a strict sequence.

- [x] **Phase 1: Plan** - Approved design spec, launch plan and the personal repo (completed 2026-11-13)
- [x] **Phase 2: Research** - The researched card set and one candidates file (completed 2026-11-15)
- [x] **Phase 3: Launch site (site v1)** - Card pages, countdown, deploy pipelines and page views (completed 2026-11-14)
- [x] **Phase 4: Timeline (site v2)** - The centred line timeline as the only view (completed 2026-11-15)
- [x] **Phase 5: Ads and measurement (site v3)** - AdSense Auto ads, Web Vitals and the HTML cache header (completed 2026-11-15)
- [ ] **Phase 6: Launch-week promotion** - Launch-week site changes, the posting schedule and the result read (in progress)
- [ ] **Phase 7: Candidate review** - A local swipe page that sorts candidates into launch and drop (not started)

## Phase Details

### Phase 1: Plan
**Goal**: Andrei approves what to build, and the repo has its home.
**Depends on**: Nothing (first phase)
**Requirements**: PLAN-01, PLAN-02
**Success Criteria** (what must be TRUE):
  1. An approved design spec states the intent, success, goals, content rules, stack and deploy shape (`docs/superpowers/specs/2026-11-13-beforegta6-design.md`).
  2. A launch plan of eight tasks turns the spec into build steps (`docs/superpowers/plans/2026-11-13-beforegta6-launch.md`).
  3. The repo is `elfensky/beforegta6`, public and personal. It replaces the private `drunikbe` repo.
**Plans**: Backdated. No plan files.
**Status**: Complete, 2026-11-13.
**Evidence**: bfe55d5 (design, 19:20 CET), 474d25c (launch plan, 19:27 CET), 8f1ecdb (personal repo, 21:04 CET).

### Phase 2: Research
**Goal**: Andrei has a researched card set, and one file he can edit to change it.
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. Each launched card has its own local image, a creator credit and a link to the source post. No card shows Rockstar art.
  2. The two cards `sex-2` and `durian-condom` are held off the site until AdSense approves.
  3. Every find stays in the research archive. A world-event rule, pass 3 with a 291-event archive, picks the highlights.
  4. `research/candidates.json` holds all 383 finds with tags and status (97 launch, 3 hold, 283 drop, checked 2026-11-15). `npm run cards` makes the 97 card files match it, and a test fails when they differ.
**Plans**: Backdated. No plan files.
**Status**: Complete, 2026-11-15.
**Evidence**: PR #1 (88 launch cards per the PR list; 89 card files at 8f1ecdb), #3, #4, #5, #8 (2026-11-14), #16, #21 (landed on `develop` by rebase at 0c89808 on 2026-11-15; GitHub shows it CLOSED after a 502).

### Phase 3: Launch site (site v1)
**Goal**: The site is live on production before the launch, with a page for every card.
**Depends on**: Phase 1 (the first launch cards come from Phase 2)
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, A11Y-01, MEAS-01
**Success Criteria** (what must be TRUE):
  1. `beforegta6.wtf` serves the launch set from the Hetzner swarm, and `staging.beforegta6.wtf` serves `develop` from the Pi swarm.
  2. Every card has a page at `/<id>/`, and a shared link previews that card's meme.
  3. The header counts down to 2026-11-19 and flips to "We got all of this before GTA 6." at the launch moment.
  4. `www.beforegta6.wtf` redirects to the bare domain, and Umami counts page views on the apex only.
  5. Pages pass axe, do not scroll sideways at 320 px, have a skip link and read without JavaScript.
**Plans**: Backdated. No plan files.
**Status**: Complete, 2026-11-14. The first version used a card grid and a timeline page. Phase 4 replaced them.
**Evidence**: PR #1 (2026-11-13 20:07 UTC), release PR #6 (2026-11-13 23:24 UTC), PR #7 (2026-11-14 00:18 UTC). Production live 2026-11-13 23:58 CET (journal of that day); the first production pin commit 1db66e6 is 23:48 CET.

### Phase 4: Timeline (site v2)
**Goal**: The front page is one calm timeline that reads straight down.
**Depends on**: Phase 3
**Requirements**: TIME-01, TIME-02, TIME-03, TIME-04, TIME-05
**Success Criteria** (what must be TRUE):
  1. `/` shows one centred line with one short row per event, year headings and fixed milestones. It ends at "GTA 6 comes out".
  2. The only control is the order: `/` is newest first and `/oldest/` is oldest first. There is no view toggle.
  3. No card image loads on the first view. On desktop, a hover or focus on a row shows its image above milestones.
  4. A row reads in the same order for keyboard and screen-reader users at every width, with no sideways scroll at 320 px.
  5. `/timeline/` answers 301 to `/` in production.
**Plans**: Backdated. No plan files.
**Status**: Complete, 2026-11-15.
**Evidence**: PR #9 (2026-11-14), #11, #12, release PR #13 (2026-11-15 02:49 UTC); d11eeee for the redirect.

### Phase 5: Ads and measurement (site v3)
**Goal**: Ads and measurement are wired in and cannot hurt the page.
**Depends on**: Phase 4
**Requirements**: ADS-01, ADS-02, MEAS-02, PERF-01
**Success Criteria** (what must be TRUE):
  1. The site proves ownership to AdSense with a meta tag and `ads.txt`.
  2. The AdSense script loads on the apex only. The site has no ad slots of its own, and it shows no ad and no placeholder before approval.
  3. Umami counts Web Vitals, and the countdown still runs when Umami never answers.
  4. nginx sends the HTML a 5-minute edge cache header. The Cloudflare rule that uses it is Phase 6 (PROMO-01).
**Plans**: Backdated. No plan files.
**Status**: Complete, 2026-11-15.
**Unverified**: the AdSense approval state ("Getting ready" on 2026-11-15, per `deploy/README.md`), and the live state of release #18. Release PR #18 merged to `main` on 2026-11-15 at 12:38 UTC, and the production pin commit 8a9e1e8 exists (12:39 UTC). Nothing in the repo shows that production serves it.
**Evidence**: PR #14, release PR #15 (2026-11-15 03:00 UTC), #10, #17, #20, #23, release PR #18.

### Phase 6: Launch-week promotion
**Goal**: Launch-week visitors reach a site that is ready, and the week's result is on record.
**Depends on**: Phase 5 (the card set comes from Phase 2)
**Requirements**: PROMO-01, PROMO-02, PROMO-03, PROMO-04, PROMO-05, CONT-05, ADS-03
**Success Criteria** (what must be TRUE):
  1. The Cloudflare Cache Rule `HTML at the edge` is applied before the first link post, and the second request to `/` shows `cf-cache-status: HIT`.
  2. Production card pages carry the share button. After the launch moment on 2026-11-19 the title reads "We got all of this before GTA 6." and the line "And we got GTA 6 before The Winds of Winter." shows under it.
  3. The posts in `docs/PROMOTION.md` go out from 2026-11-15 to 2026-11-22, and each stop rule holds: a Reddit link post with no Umami referrer visit after 1 hour means no other Reddit link post that day.
  4. The card `gta5-farewell-drive` is live on 2026-11-18.
  5. On 2026-11-22 Andrei reads Umami referrers per channel, and the AdSense approval state is written down (approved, pending or refused). Phase 6 can close with ADS-03 still open: Google's approval is external.
**Plans**: TBD
**Status**: In progress since 2026-11-15. The share button and the post-launch line are built (PR #22). The posting schedule is human work. The first scheduled post is Sunday 2026-11-15 at 19:00 CET, and it needs the Cache Rule first.

### Phase 7: Candidate review
**Goal**: Andrei sorts the finds in `research/candidates.json` into launch and drop by swipe or key, and the site follows.
**Depends on**: Phase 2 (the candidates file and `npm run cards`). It can run alongside Phase 6, because Phase 6 is mostly human work.
**Requirements**: REV-01, REV-02, REV-03
**Success Criteria** (what must be TRUE):
  1. A local page shows one candidate at a time from `research/candidates.json`, with a yes and a no answer by swipe or keys.
  2. Yes writes `status: "launch"` and no writes `status: "drop"` to the JSON. No other field changes.
  3. After `npm run cards` the card files match the JSON, and the content guard test passes.
  4. The page never ships: no file from it appears in `dist/`.
**Plans**: TBD
**UI hint**: yes
**Status**: Not started (#19). Open question for planning: a yes on a find with no image fails the sync (four such finds, see REV-02).

## Progress

**Execution Order:**
Phases 1 to 5 are complete and backdated; they overlap in time. The open phases run in numeric order, 6 then 7. Phase 7 may start while Phase 6 runs.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plan | backdated | Complete | 2026-11-13 |
| 2. Research | backdated | Complete | 2026-11-15 |
| 3. Launch site (site v1) | backdated | Complete | 2026-11-14 |
| 4. Timeline (site v2) | backdated | Complete | 2026-11-15 |
| 5. Ads and measurement (site v3) | backdated | Complete | 2026-11-15 |
| 6. Launch-week promotion | 0/TBD | In progress | - |
| 7. Candidate review | 0/TBD | Not started | - |
