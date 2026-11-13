# AGENTS.md — beforegta6.wtf

A personal meme site, "We got ___ before GTA 6": a wall of cards and a timeline. Andrei works on it. It deploys to the Pi swarm (staging) and the Hetzner swarm (production).

Shared standards: the developer handbook, `~/vault/knowledge/developer/developer.md` (layout 1.0.0).
This file holds only what is true of this repo. A personal project (Andrei, 2026-11-13: made for the meme, ads on his personal AdSense account): commits as `andrei@lav.ren`, `gh` user `elfensky`
(identity per project: `~/vault/meta/registry.md`).

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro 7, static output | One Markdown file per card in `src/content/cards/`, images in `src/assets/cards/` |
| Language | Plain JavaScript + JSDoc | `jsconfig.json` checkJs + strict |
| Runtime | Node 26 via `.node-version` | See the exceptions below |
| Deploy | nginx image on Docker Swarm, own Cloudflare Tunnel per stack | A push to `develop` deploys staging, a push to `main` deploys production (`deploy/README.md`) |

## Commands

| Command | Purpose |
|---|---|
| `npm run dev:up` / `npm run dev:down` | Dev server in the background (Astro's own `--background` mode) |
| `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html"` | **Verification gate**, in CI's order. Run it before calling work done |
| `npm run test:e2e` | Playwright: axe, reflow, skip link, no-JS checks on the built site |
| `node scripts/import-cards.js research/candidates.json` | One-off import of researched candidates. It never overwrites an existing card |

## Branches

`develop` integrates and deploys staging, and `main` releases to production. A push to either branch triggers a deploy. Every change goes in by PR, with the
`check` job green. Merge with `gh pr merge --rebase`. Rulesets on both branches block force-pushes and deletion only. A
rule that requires a PR or the `check` job would also block the CI pin commit: GitHub refuses the GitHub Actions app as a
bypass actor (HTTP 422, 2026-11-13). Enforcing PRs needs a deploy key with bypass for the pin job, and that is still
open with Andrei.

Never write the GitHub skip marker (square brackets around `skip ci`) anywhere in a commit message, the body included:
GitHub then skips every workflow for that push, so a staging or production build silently does not happen. Never
squash-merge a PR whose commits contain it: the squash message concatenates every commit body (2026-11-13,
commit da7170f on `feat/launch` carries it in its body).

## This repo's own rules

- **Documented exceptions** (Andrei, 2026-11-13):
  - The AdSense script loads from Google's servers. This goes against the no-CDN rule.
  - AdSense is a US service. This goes against the EU-first preference.
  - Andrei asked for AdSense explicitly.
- **`.node-version` in place of `mise.toml`.** `actions/setup-node` reads it, and mise reads it locally, so the repo keeps one pin (as in miklav.com).
- **`research/` is data.** It holds the research output the cards came from. It is not code and never ships.
- **Content rules** (Andrei, 2026-11-13):
  - Rank by absurdity and impact.
  - Politics, religion and identity are in when they are funny.
  - Cards about deaths, war, violence, sexual-abuse cases, harassment of private people or hate stay out.
  - NSFW cards may be crude, never sexually explicit (AdSense).
- **No Rockstar material:** no GTA logo, fonts or key art.

## Architecture invariants

- Pure functions in `src/lib/` decide order, timeline, ad positions and the countdown. `.astro` files only render.
- Every asset is served from the site, except the AdSense script (above) and Umami (`umami.lav.ren`, self-hosted).
- Every card in `src/content/cards/` is live. A held card waits in `research/held/`, and a removed card is deleted with its image, because Astro ships every imported image (`deploy/README.md` § Removing or holding a card). An `nsfw` card never becomes a link-preview image.
- The image tag in a compose file is the deploy. CI writes it, and nobody edits it by hand.

## Docs

| Code path | Doc path | What drifts |
|---|---|---|
| `src/`, `scripts/` | `docs/superpowers/specs/2026-11-13-beforegta6-design.md` | Features, content model |
| `deploy/`, `.github/workflows/` | `deploy/README.md` | Stacks, secrets, one-time setup |

## Life cockpit

Tracked in the life-cockpit vault under `#personal` (tracker: `elfensky/beforegta6`). The cockpit is the
control plane (what to work on). This repo is where the work happens. Report progress by
opening and closing issues and PRs as usual. The cockpit pulls from the tracker on its next
`/sync`. There is nothing to update in the vault. Do not mirror cockpit state (milestones, due dates) here.

<!-- A new convention for this repo goes here in the same session, never into per-machine agent memory. -->
