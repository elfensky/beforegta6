# Candidate review implementation plan

> **For agentic workers:** Use subagent-driven development for the bounded implementation task below.

**Goal:** Complete issue #19 and requirements REV-01, REV-02, REV-03.
**Architecture:** A loopback Node server serves a local review page and applies serialized candidate decisions.
The existing sync script remains the only card generator.
**Tech stack:** Node 26, JavaScript with JSDoc, native HTTP, Vitest, Playwright.
**Spec:** `docs/superpowers/specs/2026-11-16-candidate-review-design.md`.

## Global constraints

- No new dependencies, TypeScript, external assets, or public review routes.
- Only candidate status changes. Existing hold conditions remain in force.
- Every successful status change runs the existing card sync.
- Tests use temporary fixture repositories.
- The review tool must not appear in `dist/`.

## Review focus

- Stale tabs and repeated actions cannot overwrite a newer decision.
- Missing images or invalid metadata cannot produce a false success.
- Cross-origin requests and forged hosts cannot change local files.
- Candidate text, source URLs, and image requests cannot inject markup or traverse directories.
- Keyboard and swipe actions preserve focus, scrolling, and visible failure messages.

## Task 1: Candidate review tool

**Ownership:** `scripts/review/`, `scripts/review-candidates.js`, review tests under `src/__tests__/`,
`e2e/review.spec.js`, `playwright.review.config.js`, and relevant package and lint configuration.

**Interfaces:** `npm run review` starts the loopback server.
The server reads the existing research file, saves a candidate decision, and runs `scripts/sync-cards.js`.
An exported server factory accepts a fixture root for tests. The CLI always uses the repository root.

- [x] Write failing fixture tests for preserved fields, decisions, sync output, protected holds, missing images, and stale decisions.
- [x] Observe the failures, then implement the server and bounded file routes.
- [x] Add HTTP tests for origin, host, token, malformed input, and path restrictions.
- [x] Add explicit image fetching, with bounded public destinations, and show its local preview before enabling Yes.
- [x] Implement the page with one candidate, progress, source links, buttons, arrow keys, and horizontal swipes.
- [x] Add browser tests for saved choices, errors, keyboard and swipe input, reflow, and accessible controls.
- [x] Run focused tests and the full unit suite. Record failures and fixes faithfully.

## Task 2: Completion evidence and delivery

**Ownership:** Parent session. Planning files, deployment notes, feature usage documentation, and PR delivery.

- [x] Verify production share assets and complete the planned Cloudflare cache configuration.
- [x] Record AdSense as in review on 2026-11-16, per Andrei.
- [x] Update the roadmap and requirements using actual verification evidence.
- [x] Run lint, unit tests, the build, HTML validation, and browser tests.
- [x] Check the built output for review routes and files.
- [ ] Obtain the required independent review, resolve findings, and deliver through a PR.
- [ ] Report dated tasks and external dependencies separately from completed software.
