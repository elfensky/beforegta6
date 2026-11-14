# beforegta6.wtf — design

- Date: 2026-11-13
- Status: approved by Andrei on 2026-11-13. This document includes his later additions from the same session: the timeline, the content rules and the GTA V re-release cards. The timeline-only change of 2026-11-14 (`2026-11-14-timeline-only-design.md`) replaces the card grid and the header switch.
- Sources: the brainstorming session of 2026-11-13. Candidate research is in `research/` once imported.

## Intent

The site is about the meme "We got ___ before GTA 6": a curated timeline of cards. Each card has an image of the thing, the
meme line, one line of fact and a link to the original post. The site must be live before GTA 6 launches, to catch
launch-week traffic. The launch date is 2026-11-19, set by Rockstar in November 2025. Nobody has confirmed since then that the date still holds.
Google AdSense runs on Andrei's personal account. It is a hobby site made for the meme, and little or no income is expected (Andrei, 2026-11-13).

## Success

- `beforegta6.wtf` is live before 2026-11-19 with the curated launch set.
- Every card has its own address. A shared link previews that card's meme.
- AdSense approves the site after launch. Ad slots show house cards until then.

## Goals

- **Timeline** at `/`, the only view: every card on one time axis, from the GTA V release (2013-09-17) to the GTA 6
  launch, with year markers and fixed GTA milestones (below). Toggles set the order (newest first by default, or oldest
  first) and the view (small cards under each month by default, or lines). Each combination is a static page:
  `/`, `/oldest/`, `/lines/`, `/lines/oldest/` (Andrei, 2026-11-14).
- **One page per card** at `/<id>/`, with Open Graph tags whose image is the card's meme.
- **Countdown** to 2026-11-19 in the header. After that moment the header reads "We got all of this before GTA 6."
- **Ad cards:** one per screenful (see Ads).

## Non-goals (launch)

Submissions, accounts, likes and dislikes, comments, merch, other languages.

## Anti-goals

- Anything that looks like official Rockstar material: no GTA logo, no Rockstar fonts, no copied key art. "GTA" is a
  Take-Two trademark, and ads make the site commercial.
- Sexually explicit content: AdSense bans it on pages with ads.
- Cards about deaths or death wishes, war, violence, sexual-abuse cases, harassment of private people, or hate.
- A page that becomes slow when traffic spikes.

## Content rules (Andrei, 2026-11-13)

- Highlights only (Andrei, 2026-11-14): significant world events that affect a large number of people. Every find stays in
  the research archive (`research/*.json`); only `launch` candidates become cards. Rule for pass 3: impact score 7 or
  more, or 5 or more with a real "before GTA 6" post (`research/world-events.md`).
- Politics, religion and identity are in when the event passes the world-event rule (blue Texas).
- NSFW: crude, profane and absurd posts are in, and their cards carry an `nsfw` flag. Sexually explicit posts are out.
- One card for each GTA V release and re-release: PS3/X360, PS4/Xbox One, PC, PS5/Xbox Series, Enhanced on PC, and others found.
- Every card keeps a local copy of its image, credits the creator and links to the source post. A Commons photo under
  CC BY or CC BY-SA carries its author and licence on the card page (`imageCredit`).
- Launch set (2026-11-13): all researched candidates except `jason-irl`, which shows a private person.
  `gta5-farewell-drive` waits until 2026-11-18 (status `hold`). Pass 3 (2026-11-14) adds the 73 world-event highlights
  of `research/world-events.json` and moves the 63 pass-2 cards below the rule to the archive (`status: "drop"`);
  24 stay (Andrei).

## Approaches

| Approach | Trade-off | Outcome |
|---|---|---|
| Plain static page (`index.html` + JSON + images) | Fastest. A shared link previews only the site. | Not chosen |
| **Astro static site** | Shrinks images itself and makes a page per card with its own preview. Needs a build step. | **Chosen by Andrei** |
| Server app (forum, votes) | Needs moderation, a database and spam protection. Too much for six days. | Dropped for launch; votes come back as v2 |

## Decided

**Stack.** Astro (latest release), Node 26 LTS, plain JavaScript with JSDoc (no TypeScript). The images go through `astro:assets`
and come out as WebP in several widths. The site uses system fonts only. Every asset is served from the site, except the AdSense script.
Analytics: self-hosted Umami.

**Content model.** One Markdown file per card, `src/content/cards/<id>.md`, with this frontmatter:

```yaml
title: We got flying cars before GTA 6        # the meme line
blurb: One factual line: what happened.       # shown on the card
kind: real-event                              # real-event | joke
date: 2026-10-15                              # timeline date: event date, else the post date
source: { url: https://…, platform: x, engagement: 23K likes }
factUrl: https://…                            # real events only
image: ../../assets/cards/flying-cars.jpg     # local copy
imageAlt: …
nsfw: false
status: launch                                # launch | hold | drop
```

A milestones file holds the fixed timeline anchors. Check each date at build time:
- GTA V release: 2013-09-17
- GTA 6 confirmed: 2022-02-04
- Trailer 1: 2023-12-05
- Trailer 2: 2025-05-06
- First delay announced: 2025-05-02
- Second delay announced: 2025-11-06
- Launch: 2026-11-19

**Ads.**
- Units: AdSense in-feed units. Each slot takes a full row of the timeline: an AdSense unit needs about 250 px, more
  than a small card.
- Desktop: one after every 8 timeline entries (cards and milestones), which is about one per screen.
- Mobile: one after every 4 entries. A strict one-per-screen on a phone would make about every third card an ad, and
  AdSense forbids screens with more ads than content.
- Before approval: a house card fills each slot, such as a share prompt or the countdown.
- Consent: Google's certified "Privacy & messaging" consent tool, for visitors from the EEA, UK and Switzerland.
- `ads.txt` at the site root.
- The Content Security Policy allows the Google ad origins.

**Documented exceptions** (recorded in `AGENTS.md`): the AdSense script loads from Google's servers, against the no-CDN
rule, and AdSense is a US service, against the EU-first preference. Andrei asked for AdSense explicitly.

**Deployment.** The usual Arcane Path B shape (vault `knowledge/homelab/static-sites-on-the-pi-swarm.md`), copied from
the miklav.com Astro repo:
- Build: `astro build` runs on the CI runner. The output goes into `nginx:1.30-alpine`, built for amd64 and arm64.
- Image: `ghcr.io/elfensky/beforegta6:sha-<commit>`.
- Staging: `staging.beforegta6.wtf` on the Pi swarm. The stack is `beforegta6-staging`, from `deploy/staging/compose.yaml`, and it deploys from `develop`.
- Production: `beforegta6.wtf` on the Hetzner production swarm. The stack is `beforegta6`, from `deploy/production/compose.yaml`, and it deploys from `main`. Placement: `role == apps`, spread over the nodes.
- Each stack: `web` ×2 and `cloudflared` ×2, with its own tunnel. The secrets are `staging_beforegta6_cloudflared` and `beforegta6_cloudflared`.
- CI pins the built image into the branch's compose file and commits it. Arcane Git Sync runs with `redeployAfterSync: true`, from entries in `drunikbe/infra`.
- Cloudflare: a Redirect Rule sends `www` to the bare domain, and a Cache Rule caches the HTML at the edge for traffic spikes.
- Monitoring: Umami and Uptime Kuma.

**Repo.** `elfensky/beforegta6`: public, personal (Andrei, 2026-11-13; it replaces the first private repo `drunikbe/beforegta6.wtf`). Default branch `develop`, with rulesets.

**Operator and contact.** The footer reads "A hobby site by Andrei Lavrenov, Belgium" with `takedown@lav.ren`. No address (Andrei, 2026-11-13).

## Left to the builder

Colours, spacing, the exact breakpoints, the copy, the house-card content, the timeline's visual form (alternating sides
on desktop, one column on mobile is the starting proposal).

## Andrei's tasks

- Create `takedown@lav.ren`.
- Apply with his personal AdSense account once the site is live. Put the publisher ID in `ads.txt`.
- Create the staging and production tunnels and store their tokens in 1Password. Then create the swarm secrets and merge the `drunikbe/infra` entries.
- Add the Cloudflare Redirect Rule and Cache Rule.

## Later (v2): likes and dislikes

Proposal, not designed: a small API service in the same stack, plus one table (`card_id`, `up`, `down`) in the existing
production Postgres. Votes are anonymous, with a rate limit per hashed IP. The static site stays static and fetches the counts.
