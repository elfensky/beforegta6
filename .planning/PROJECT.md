# beforegta6.wtf

## What This Is

beforegta6.wtf is a meme site: "We got ___ before GTA 6". It shows one timeline of cards, from the GTA V release (2013-09-17) to the GTA 6 launch (2026-11-19). Each card has a meme image, the meme line, one factual line and a link to the original post. It is a personal hobby project by Andrei Lavrenov (Belgium). The repo `elfensky/beforegta6` is public. This repo owns this plan.

The site is static Astro 7 with plain JavaScript and JSDoc, on Node 26. It runs as an nginx image on Docker Swarm. A push to `develop` deploys staging (Pi swarm). A push to `main` deploys production (Hetzner swarm).

## Core Value

The site is live, fast and correct on GTA 6 launch week, so the meme has a finished archive when it stops working on 2026-11-19.

## Business Context

- **Customer**: Public visitors. The site is free and has no accounts.
- **Revenue model**: Google AdSense Auto ads on Andrei's personal AdSense account. Andrei expects little or no income (2026-11-13).
- **Success metric** (derived from the design spec `Success` section and `docs/PROMOTION.md`; Andrei has not stated a number):
  1. The site is live before 2026-11-19 with the curated launch set. Met on 2026-11-13.
  2. Every card has its own address, and a shared link previews that card's meme. Met.
  3. AdSense approves the site after launch, and the site shows no ads until then. Open. Andrei confirmed review remains pending on 2026-11-16.
  4. Launch-week traffic by channel. No target exists. The plan only reads Umami referrers on 2026-11-22.
- **Strategy notes**: `docs/PROMOTION.md` (launch-week promotion plan, adopted 2026-11-15).

## Requirements

Full list with IDs and evidence: `.planning/REQUIREMENTS.md`.

### Validated

- ✓ A design spec and launch plan exist, and the repo is personal and public — Phase 1
- ✓ The card set is researched, has local images and follows the content rules — Phase 2
- ✓ One candidates file with tags and status drives the cards (`npm run cards`) — Phase 2
- ✓ The site is live with card pages, a countdown, deploy pipelines, the www redirect and Umami page views — Phase 3
- ✓ The front page is one centred line timeline with an order link and a hover image — Phase 4
- ✓ AdSense ownership is verified, Auto ads are wired for the apex only, Web Vitals are counted, and the HTML cache header is set — Phase 5
- ✓ The local review tool supports persistent decision records, editorial notes, image previews, item URLs, resume, and numbered navigation while protecting held candidates — Phase 7
- Social metadata uses full titles, fixed-size preview images, connected JSON-LD, and a generated public `llms.txt` index. The contract and verification are in `docs/METADATA.md`.
- ✓ A failed image permits a saved Yes pending image approval; incomplete cards remain outside generated site content — Phase 7
- ✓ Dedicated deployment branches serve both environments, and source branches require PRs and passing checks — Phase 8

### Active

- [x] Release the sorted selection and review feedback to staging and production. Both environments are verified through PRs #29 and #30 — CONT-06.


- [ ] Launch-week site changes reach production and work: the share button, the post-launch line, the edge cache rule, and the held card `gta5-farewell-drive` on 2026-11-18 — Phase 6
- [ ] Complete public social promotion — PROMO-04. Drafts are prepared; Andrei publishes manually and handles moderator contact. The assistant sends nothing. r/gaming remains closed after removal. r/SideProject is excluded. No X connection is needed for draft preparation.
- [ ] AdSense approves the site (external, Andrei's account) — Phase 6

### Out of Scope

- Submissions, accounts, comments, merch, other languages — launch non-goals (design spec).
- Search, filters, view counts, a view toggle — the line timeline design allows one control: the order.
- Own ad slots — AdSense Auto ads replaced them on 2026-11-15.
- Official-looking Rockstar material (GTA logo, Rockstar fonts, key art) — trademark risk, and ads make the site commercial.
- Sexually explicit content, and cards about deaths, war, violence, sexual-abuse cases, harassment of private people or hate — AdSense rules and Andrei's content rules.
- A Show HN post, a site name inside meme images, a card-grid homepage image — the promotion council rejected them.
- Likes and dislikes — a v2 idea, not designed (see REQUIREMENTS.md).

The 2026-11-17 exceptions in `AGENTS.md` qualify these exclusions: Queen Elizabeth II's death, one COVID/chip-shortage card, and two Rockstar-image uses. Five specified media replacements have separate permission exceptions. Cena keeps his portrait.

## Context

- GTA 6 launches on Thursday 2026-11-19. `docs/PROMOTION.md` cites Take-Two Q2 FY27 earnings of 9 Nov 2026 for that date. The design spec says Rockstar set the date in November 2025 and that nobody confirmed it since. Both give 2026-11-19.
- After the launch the meme inverts. The header reads "We got all of this before GTA 6." A line under the title reads "And we got GTA 6 before The Winds of Winter."
- Three competing sites exist: a placeholder, an empty board and an unfinished quiz (checked 2026-11-15, per `docs/PROMOTION.md`). The promotion angle is "the meme dies Thursday, here is its archive".
- Staging and production selection verified on 2026-11-17: 206 card pages, 192 normal timeline rows, 14 candidate milestones, and 18 rendered milestones. All 95 original notes and every recorded click remain preserved.
- State on 2026-11-15 (checked in the repo): 97 cards in `src/content/cards/`, 383 candidates in `research/candidates.json` (97 launch, 3 hold, 283 drop), 84 excluded finds.
- Issues #19 and #24 are complete on 2026-11-16. PR #26, release PR #27, and `drunikbe/infra#79` are merged. The codebase map is in `.planning/codebase/`. Known concerns are in `.planning/codebase/CONCERNS.md`.
- The build took three days: 2026-11-13 to 2026-11-15. The roadmap phases 1 to 5 are backdated groups of that work.

## Constraints

- **Tech stack**: Astro 7 static output, plain JavaScript with JSDoc (`checkJs`, strict), Node 26 via `.node-version`. No TypeScript.
- **Assets**: Every asset comes from the site. Exceptions: the AdSense script (Google), Cloudflare Turnstile on `/contact/`, and self-hosted Umami at `umami.lav.ren`. System fonts only. Images go through `astro:assets`.
- **Analytics**: Self-hosted Umami, cookieless, no consent banner. Page views and Web Vitals only. Never load Umami's `recorder.js`.
- **Ads and consent**: Auto ads only. The script loads on the apex only. No ads and no placeholder before approval. Google's consent tool covers the EEA, UK and Switzerland. The CSP sets no `script-src`.
- **Content**: Andrei's picks. Politics, religion and identity are in. NSFW cards may be crude, never sexually explicit. Every card keeps a local image, credits the creator and links the source post. Rockstar material is limited to the two exceptions in `AGENTS.md`.
- **Performance**: The page must stay fast under a traffic spike. The HTML is cached at the edge for 5 minutes (nginx sends `CDN-Cache-Control`; the Cloudflare rule is a phase 6 item).
- **Deploy**: The image tag in a compose file is the deploy. CI writes it. Nobody edits it by hand. Never write the GitHub skip marker in a commit message.
- **Accessibility**: Pages pass axe, do not scroll sideways at 320 px, and read in full without JavaScript.
- **Verification gate**: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"`, then `npm run test:e2e` and `npm run test:review`.
- **Process**: Every change goes in by PR with the `check` job green. Rebase integration PRs into `develop`. Merge release PRs from `develop` into `main` with a merge commit. Commit as `andrei@lav.ren`.

## Key Decisions

<decisions>

No ADR exists for this project, so no decision is ADR-locked. The rows below are dated decisions by Andrei from the design specs and `AGENTS.md`. They are SPEC-level (`locked: false`). Treat them as binding until Andrei changes them. The later date wins where one decision replaces another.

| Date | Decision | Source | Status |
|------|----------|--------|--------|
| 2026-11-13 | Astro static site with plain JavaScript and JSDoc, on Node 26. Andrei chose it over a plain static page and over a server app. | Design spec, Approaches | In effect |
| 2026-11-13 | The repo is personal and public: `elfensky/beforegta6`. Commits use `andrei@lav.ren`. It replaces the private `drunikbe` repo. | Design spec, Repo; `AGENTS.md` | In effect |
| 2026-11-13 | Footer reads "A hobby site by Andrei Lavrenov, Belgium" with `takedown@lav.ren` and no address. | Design spec, Operator | In effect |
| 2026-11-13 | The AdSense script from Google and the US-service use are documented exceptions to the no-CDN and EU-first rules. Andrei asked for AdSense. | `AGENTS.md` | In effect |
| 2026-11-13 | Rulesets on `develop` and `main` block force-push and deletion only. | `AGENTS.md`, Branches | Superseded on 2026-11-16 by issue #24 |
| 2026-11-13 | Likes and dislikes are not in the launch. They are a v2 proposal. | Design spec, Later | Deferred |
| 2026-11-15 | One centred line timeline is the front page. It replaces the card grid, the lines view and the view toggle. The order is the only control. The 2026-11-14 timeline-only decision stays in part (static pages, link toggles). | Line timeline design | In effect |
| 2026-11-15 | `/timeline/` answers 301 to `/`, because it was live in production. | Line timeline design | In effect |
| 2026-11-15 | AdSense Auto ads replace own ad slots. The script loads on the apex only. The CSP has no `script-src`. | Design spec, Ads | In effect |
| 2026-11-15 | The content rule is "Andrei's picks". It replaces "highlights only". The first picks are the cards on production on 2026-11-15. | `AGENTS.md`; candidates design | In effect |
| 2026-11-15 | `research/candidates.json` is the one place to edit cards. `npm run cards` syncs them. The JSON wins over a hand edit. | Candidates design | In effect |
| 2026-11-15 | The HTML is cached at the edge for 5 minutes in place of a CSP nonce. For up to 5 minutes after a release, a cached page can ask for `/_astro/` files the new build lacks. Andrei accepts this. | `deploy/README.md` step 8 | Accepted risk |
| 2026-11-15 | Promotion option A (narrow, Reddit-led). A normal Hacker News submission, not Show HN. No short video, no Bluesky. | `docs/PROMOTION.md` | In effect |
| 2026-11-16 | CI pins images on `deploy/staging` and `deploy/production`. Arcane reads those branches. Source branches require PRs and the GitHub Actions `check` job. | Andrei; issue #24; completion evidence | Verified live |
| 2026-11-16 | Integration PRs use rebase merges. Releases from `develop` to `main` use merge commits. | `deploy/README.md`; source rulesets | Enforced |

| 2026-11-17 | Review feedback preserves notes and clicks, archives merged duplicates, and renders 14 GTA items as milestones. | Feedback outcomes; candidates spec | Implemented locally |
| 2026-11-17 | Queen, COVID, two Rockstar-image uses, and five specified media replacements are exceptions. Cena keeps his portrait. | Andrei; `AGENTS.md` | Approved |
| 2026-11-17 | Local Yes/No tool and manual sort are done. Complete images, update staging and production, then create and publish social posts immediately. | Andrei; roadmap Current execution order | Release complete; publication owner superseded below |
| 2026-11-17 | Andrei will publish everything himself. The assistant prepares unique drafts and assets only, with current community rules. | Andrei; latest clarification; `docs/PROMOTION.md` | In effect |

</decisions>

## Evolution

This document changes at phase transitions and at milestone boundaries.

After each phase:
1. Move invalidated requirements to Out of Scope with a reason.
2. Move validated requirements to Validated with the phase.
3. Add new requirements to Active.
4. Log new decisions in the Key Decisions block.
5. Check that "What This Is" is still accurate.

After the milestone: review all sections, check the Core Value, and update Context.

---
*Last updated: 2026-11-17. The reviewed selection is verified on staging and production. Drafts are prepared; Andrei owns publication.*
