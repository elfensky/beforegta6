## Conflict Detection Report

Mode: new. Docs read: 11 (SPEC 6, DOC 5). ADR 0, PRD 0, UNKNOWN 0, so there are no locked decisions. The launch plan was re-tagged DOC (historical, manifest override) by the coordinator.
Precedence used: ADR > SPEC > PRD > DOC. Within one type, the later-dated approved decision wins where the same feature changes. `AGENTS.md` (repo root) tells current from superseded. GitHub PR merge dates (elfensky/beforegta6, #1 to #23) support the order.

### BLOCKERS (0)

None.

### WARNINGS (0)

None. No competing acceptance variants and no unresolved contradictions that need a user pick were found.

### INFO (17)

[INFO] Auto-resolved: timeline views, 2026-11-15 line timeline wins over 2026-11-14 and 2026-11-13
  Note: docs/superpowers/specs/2026-11-13-beforegta6-design.md (Goals, Timeline) lists four static pages `/`, `/oldest/`, `/lines/`, `/lines/oldest/`, small cards or lines, a view toggle, and a card grid with a header switch. docs/superpowers/specs/2026-11-14-timeline-only-design.md makes the timeline the only view (removes `/timeline/`, the card grid and the header switch) with those four pages (PR #9, 2026-11-14). docs/superpowers/specs/2026-11-15-line-timeline-design.md replaces both views and the view toggle with one centred line, deletes `src/pages/lines/*`, and keeps only `/` and `/oldest/` (PR #11, 2026-11-15). Each earlier doc states this in its own status line. Winner: 2026-11-15 line-timeline design. Kept from 2026-11-14: static pages with link toggles, canonical `/`, `/oldest/` out of the sitemap. Superseded plan: docs/superpowers/plans/2026-11-14-timeline-only.md (small-card variant, month tiles, Cards/Lines toggle, `view` prop). Its order and grouping functions survive (see `constraints.md`).

[INFO] Auto-resolved: `/timeline/` redirect, 2026-11-15 corrects 2026-11-14
  Note: docs/superpowers/specs/2026-11-14-timeline-only-design.md says "`/timeline/` is live only on staging, so it gets no redirect". docs/superpowers/specs/2026-11-15-line-timeline-design.md found that `/timeline/` is live in production and adds an nginx 301 to `/` that must ship in the first release to `main`. Winner: the later spec, a factual correction. That release happened on 2026-11-15 (PR #13). The `/lines/` pages stay without a redirect because they existed only on staging.

[INFO] Auto-resolved: ad slots, AdSense Auto ads (2026-11-15) win over own slots at density 4/8 and 10/20
  Note: docs/superpowers/specs/2026-11-14-timeline-only-design.md uses own slots (every 4, desktop every 8) through `withAdSlots` and `AdCard`. docs/superpowers/specs/2026-11-15-line-timeline-design.md and docs/superpowers/plans/2026-11-15-line-timeline.md change the density to every 10 and desktop every 20, still with own ad rows. docs/superpowers/specs/2026-11-13-beforegta6-design.md (Ads, decision dated 2026-11-15) says "AdSense Auto ads: Google chooses where the ads go. The site has no ad slots of its own." PR order: #11 and #12 (line timeline, hover image "below ads") then #17 (Auto ads place the ads) and #20 (Auto ads on), all 2026-11-15. The repo agrees: `src/components/` has no `AdCard.astro` and `src/lib/` has no `ads.js` or `withAdSlots` (checked 2026-11-15). Winner: Auto ads. Stale text that still names own slots: line-timeline design (Ads section, Removed/Tests mentions of `withAdSlots` and the ad density test, "stacks ... below an ad row"), line-timeline plan (Task 1 `withAdSlots` defaults, Task 3 ad density e2e), timeline-only design and plan. Remaining valid part: about one ad per screen, now set in the Auto ads settings; the hover figure must still stay under Google's auto-placed ads (`.google-auto-placed`, per `.planning/codebase/CONCERNS.md`).

[INFO] Auto-resolved: launch plan, own ad slots (every 4 on phones, every 8 from 960 px, house card until `ADSENSE_CLIENT` is set) superseded by AdSense Auto ads
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (DOC, historical; Global Constraints "Ads", Tasks 3 and 4, Task 8 step 7 "Set `ADSENSE_CLIENT` and `ADSENSE_SLOT`") against docs/superpowers/specs/2026-11-13-beforegta6-design.md (SPEC, Ads: no ad slots of its own) and `AGENTS.md`. Winner: SPEC (higher precedence, later decision, PRs #14, #17, #20). No AdSense slot or `ADSENSE_SLOT` is used any more.

[INFO] Auto-resolved: launch plan takedown address `takedown@drunik.be` superseded by `takedown@lav.ren`
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (Global Constraints "Footer", `TAKEDOWN_EMAIL`) against docs/superpowers/specs/2026-11-13-beforegta6-design.md (Operator and contact: footer "A hobby site by Andrei Lavrenov, Belgium" with `takedown@lav.ren`, personal project, Andrei 2026-11-13). Winner: SPEC and `AGENTS.md` (commits as `andrei@lav.ren`).

[INFO] Auto-resolved: launch plan names `drunikbe/beforegta6.wtf` and `ghcr.io/drunikbe/beforegta6.wtf`; the repo is `elfensky/beforegta6`
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (Global Constraints "Names", Task 1 step 5 Life cockpit `#drunik`, step 9 `gh api repos/drunikbe/beforegta6.wtf/rulesets`) against docs/superpowers/specs/2026-11-13-beforegta6-design.md (Repo: `elfensky/beforegta6`, public, personal, replaces the first private repo `drunikbe/beforegta6.wtf`; image `ghcr.io/elfensky/beforegta6:sha-<commit>`) and `AGENTS.md` (life cockpit `#personal`, tracker `elfensky/beforegta6`). Winner: SPEC and `AGENTS.md`. The `drunikbe/infra` Git Sync entries in the plan still hold (the SPEC repeats them).

[INFO] Auto-resolved: launch plan import script ("never overwrites an existing .md, because hand edits win") superseded by `npm run cards`, where the JSON wins
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (Task 2 step 5, `scripts/import-cards.js <candidates.json>`, `imageAlt` from `image_note`) against docs/superpowers/specs/2026-11-15-one-candidates-file-design.md (`scripts/sync-cards.js`, overwrites cards, pre-flight, `imageAlt` from `image_alt` else title; anti-goal "a hand edit that a sync silently undoes" is handled by copying hand edits into the JSON first). `AGENTS.md`: `research/candidates.json` is the one place to edit cards. Winner: the 2026-11-15 SPEC.

[INFO] Auto-resolved: launch plan CSP with a `script-src` allowlist superseded by a CSP with no `script-src`
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (Task 7 step 2: `script-src 'self' https://umami.lav.ren` plus AdSense origins, `frame-src` and `connect-src` ad origins) against docs/superpowers/specs/2026-11-13-beforegta6-design.md (Ads: no `script-src`, because Google hosts are not listed and Google's nonce policy would stop the HTML edge cache; Andrei 2026-11-15) and `.planning/codebase/CONCERNS.md`. Winner: SPEC. The CSP still limits objects, the base URL, form targets and framing.

[INFO] Auto-resolved: launch plan branch rulesets that require a PR and the `check` job, with a GitHub Actions bypass actor, superseded by rulesets that block force-push and deletion only
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (Task 1 step 9, Task 8 step 2) against `AGENTS.md` (Branches: GitHub refuses the GitHub Actions app as a bypass actor, HTTP 422, 2026-11-13; enforcing PRs needs a deploy key with bypass for the pin job, still open with Andrei). Winner: `AGENTS.md`. Every change still goes in by PR by convention, with `check` green.

[INFO] Auto-resolved: launch plan card grid, `/timeline/` page with Cards/Timeline header switch, and 160 px thumbnail rows, superseded by the line timeline
  Note: docs/superpowers/plans/2026-11-13-beforegta6-launch.md (Tasks 4 and 5) is covered by the first INFO entry above (timeline views). The plan's `withAdSlots` and `AdCard` shapes, the `timelineEntries` oldest-first signature (no `order` argument), and the Tasks 4/5 CSS grid are historical.

[INFO] Auto-resolved: content rule, "Andrei's picks" (2026-11-15) replaces "highlights only" (2026-11-14 to 2026-11-15)
  Note: docs/superpowers/specs/2026-11-13-beforegta6-design.md (Content rules) records both and states the later rule. docs/superpowers/specs/2026-11-15-one-candidates-file-design.md changes `AGENTS.md` the same way and says the first picks are the 97 cards on production on 2026-11-15. `AGENTS.md` carries the current rule. The research bar for world events (impact 7 or more, or 5 or more with a real "before GTA 6" post) now only drives the `world-event` tag.

[INFO] Auto-resolved: council split on the phone line, DeepSeek layout taken
  Note: docs/superpowers/specs/2026-11-15-line-timeline-council.md: Mistral wanted the line at 50 % at every width, DeepSeek at 50 % from 960 px and at the left edge below. The decision doc docs/superpowers/specs/2026-11-15-line-timeline-design.md takes the DeepSeek layout (the 320 px reflow test fails with a 50 % line). The council record is a DOC; the design (SPEC) wins by precedence and by date.

[INFO] Auto-resolved: promotion plan overrides seat proposals
  Note: docs/superpowers/specs/2026-11-15-promotion-council.md: both seats scheduled a Show HN; the chair checked news.ycombinator.com/showhn.html and the plan docs/PROMOTION.md uses a normal Hacker News submission. Mistral dropped r/astrojs and DeepSeek dropped the r/gaming link; docs/PROMOTION.md keeps r/gaming (Andrei's account answer of 2026-11-15) and allows one of r/belgium or r/astrojs. Site name inside memes and a card-grid homepage OG image are dropped. docs/PROMOTION.md is the adopted version.

[INFO] Cycle check: back-references between the three timeline specs are supersession pointers, not a dependency loop (confirmed by the coordinator)
  Note: the cross_refs graph has two 2-cycles: 2026-11-13-beforegta6-design.md <-> 2026-11-14-timeline-only-design.md, and 2026-11-14-timeline-only-design.md <-> 2026-11-15-line-timeline-design.md. In each pair the earlier doc names the later one as replacing part of it, and the later doc names the earlier one as the doc it changes. Synthesis followed date order (acyclic). The launch plan's cross_refs point only to the 2026-11-13 design and non-ingested files, so they add no cycle. Traversal depth stayed far below the cap of 50.

[INFO] Stale text inside the 2026-11-13 design
  Note: docs/superpowers/specs/2026-11-13-beforegta6-design.md, Goals, Timeline bullet, still describes the four-page, two-view toggle. Its own status line says the 2026-11-14 spec replaces it, and the 2026-11-15 spec replaces the views. The "Left to the builder" line ("alternating sides on desktop, one column on mobile is the starting proposal") is also overtaken by the centred ledger. `constraints.md` and `requirements.md` carry the current form. Consider editing the Goals bullet to its final state.

[INFO] Launch-date wording differs between SPEC and DOC
  Note: docs/superpowers/specs/2026-11-13-beforegta6-design.md says the date was set by Rockstar in November 2025 and "nobody has confirmed since then that the date still holds". docs/PROMOTION.md cites Take-Two Q2 FY27 earnings of 9 Nov 2026 for the Thursday 2026-11-19 launch. Both use 2026-11-19, so no decision conflicts. The SPEC sentence is likely stale; it is a fact, not a decision, so no precedence was applied.

[INFO] Stale wording in promotion drafts, and plan types
  Note: docs/PROMOTION.md draft 1 says "I only kept events that hit a lot of people"; the current rule is "Andrei's picks". The drafts' "97 events" and "4,811 days" depend on the card set staying at 97. Separately, the plan docs carry mixed types (timeline-only plan and candidates plan SPEC; line-timeline plan and launch plan DOC). docs/superpowers/plans/2026-11-15-line-timeline.md restates its parent spec and was found consistent apart from the ad items above; its parent SPEC wins on any difference.
