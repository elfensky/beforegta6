# Completion evidence — 2026-11-16

## Production

- Cloudflare rule `HTML at the edge` applies to `beforegta6.wtf` only.
- Edge TTL uses the origin cache header. Browser TTL respects the origin header.
- Tiered Cache uses Automatic Upper Tiers. Always Online remains off.
- Two consecutive production requests returned HTTP 200, `cf-cache-status: HIT`, and `age: 290`.
- Both responses contained `CDN-Cache-Control: max-age=300, stale-if-error=86400` and `Cache-Control: public, max-age=0`.
- Production card HTML contains the share control. Its deployed script supports the share sheet and clipboard fallback.
- Production serves the countdown script and post-launch line. The calendar-dependent live check remains due on 2026-11-19.
- AdSense remains in review, confirmed by Andrei on 2026-11-16.

Page evidence: [home](https://beforegta6.wtf/) · [🔖 2026-11-16](https://linkding.lav.ren/bookmarks?details=6649),
[card page](https://beforegta6.wtf/new-pope/) · [🔖 2026-11-16](https://linkding.lav.ren/bookmarks?details=6650).

## Candidate review

Issue #19 covers the local candidate review tool. Its usage is documented in `docs/REVIEW.md`.
The real candidate selections remain unchanged: 383 candidates, including 97 launch, 3 hold, and 283 drop.
The repository contains 163 local candidate images. Another 216 candidates have an image URL but no local image.
Four candidates need a manually supplied image.

Verification completed on 2026-11-16:

- `npm run lint` passed.
- `npm test` passed 71 tests across 10 files.
- `npm run build` generated 101 pages.
- `npx html-validate "dist/**/*.html"` passed.
- `npm run test:review` passed six Chromium tests.
- `npm run test:e2e` passed 63 tests across Chromium, WebKit, and Firefox.
- All three browsers verified that review and research routes return 404 from the public build.
- A recursive scan of 853 build entries found no review, research, or script directory.
- The deployment tests cover source preservation, configuration propagation, stale builds, retries, and invalid inputs.
- Review tests cover decisions, protected holds, stale tabs, interrupted sync, local access restrictions, and bounded image downloads.
- Browser tests cover buttons, keys, swipes, preview failures, image fetching, focus, reflow, and accessibility.

Independent review and PR delivery remain pending.

## Deployment protection

Andrei selected dedicated deployment branches for issue #24 on 2026-11-16.
The intended mapping is `develop` → `deploy/staging` and `main` → `deploy/production`.
The migration sequence is documented in `deploy/README.md`.
The infrastructure recovery registry selects `deploy/production` in the prepared companion change.
Its production-profile `ansible-lint --offline` check passed across 112 files.
The Arcane recovery playbook passed `--check --diff` with `changed=0`, `failed=0`, and `unreachable=0`.
The existing `beforegta6` sync record is present. The create-only playbook leaves existing records unchanged.
Live Arcane migration and source-branch ruleset verification remain pending.
The current source rulesets contain force-push and deletion protection only, confirmed through the GitHub API.
The `check` job reports from GitHub Actions integration `15368`.
The intended rules require PRs, resolved conversations, and that check, with no bypass actors or required self-approval.
Integration uses rebase merges and a current base. Releases use merge commits without requiring `main` ancestry in `develop`.

**eli14:** Source branches hold approved changes. Deployment branches hold the image labels read by the servers.
Checks protect the approved changes while automation updates the labels.

## Remaining launch work

| Requirement | Remaining result | Date or dependency |
|---|---|---|
| CONT-05 | Release `gta5-farewell-drive` | 2026-11-18 |
| PROMO-03 | Verify the live title and post-launch line after midnight | 2026-11-19 |
| PROMO-04 | Complete the promotion schedule and its stop rules | Human posting, through 2026-11-22 |
| PROMO-05 | Record Umami referrers by channel | 2026-11-22 |
| ADS-03 | Approval, ad density, and the published consent message | Google and AdSense dashboard settings |

Voting remains deferred to v2. `sex-2` and `durian-condom` remain held until AdSense approval.
