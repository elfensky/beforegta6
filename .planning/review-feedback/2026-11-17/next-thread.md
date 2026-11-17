# Historical handoff: finish selected images and release

## Current state — latest instruction, 17 November 2026

All 46 images are complete. The reviewed selection is released and verified on staging and production.
Andrei will publish every social post himself. The assistant prepares drafts and assets only; it must not publish or contact moderators.
Current drafts are in `docs/promotion/2026-11-17-posts.md` and `docs/promotion/2026-11-17-subreddit-posts.md`.
The original launch brief below is historical. Its request for agent publication is superseded. Do not repeat image integration or deployment work.

## Original launch brief

Continue beforegta6 in the EXISTING worktree `/Users/andrei/Developer/.worktrees/beforegta6/t3-9d82a03b-43861fdb17515a94`, branch `chore/audit-remaining-design-work`. Clone: `/Users/andrei/Developer/beforegta6`. This worktree has extensive uncommitted user review selections, review-tool fixes, content edits, and image files. Preserve them; do not start from the remote branch or rerun `integrate.mjs`.

Read `AGENTS.md`, `.planning/review-feedback/2026-11-17/VERIFICATION.md`, `outcomes.json`, `remaining-image-selections.json`, `integration-notes.md`, and `docs/REVIEW.md`. The existing pass covers all 95 notes; 46 additional Yes selections without notes need images. Find appropriate local images, inspect them, document provenance, and complete these saved selections. Use cheaper Opus delegates through T3 when useful, as requested by Andrei. Preserve all notes and recorded clicks. The parent alone changes the candidate JSON and runs card synchronization.

Approved content/media exceptions are in `AGENTS.md`; do not broaden them. Keep Cena's portrait and Gary's current image. Gary's driving frame does not exist. Source agents and local snapshots already contain extensive evidence; do not repeat completed research. Use the repository verification gate and browser tests after changes. The previous gate passed 86 unit/API, 66 public browser, and 12 review browser tests.

After the image follow-up finishes, prepare deliberate commits and the integration/release PRs through `develop` and `main`, following `deploy/README.md`. Link all PRs through T3. Confirm staging and production match the reviewed selection. Andrei clarified that the final goal is actual social promotion: create and publish posts as soon as the updated production site is verified. Drafts alone do not complete the goal. Follow the current execution order in `.planning/ROADMAP.md` and the channels and stop rules in `docs/PROMOTION.md`.

Local site last started at port 4321; review tool at 4322. Check before restarting. The previous review shutdown notification was expected. No beforegta6 commits, pushes, or deployments occurred in the preceding session.

## Answers from the glance handoff

Thread launch: approved by Andrei, 2026-11-17: "Start it (Recommended)".
Confirmed task: finish 46 missing images, publish verified updates to staging and production, then create and publish promotion posts immediately. The 2026-11-17 clarification replaces the previous drafts-only endpoint.
Additional scope choices: none pending; existing user instructions apply.
