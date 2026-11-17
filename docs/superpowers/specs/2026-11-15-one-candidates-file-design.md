# One candidates file — design (2026-11-15)

## Intent

Andrei reviews every find by hand on 2026-11-15. He drops some world events and adds fun events that the world-event
pass did not find. For this, all finds must be in one file, tagged by topic, and one flag must decide what the site
shows.

## Goals

- One file, `research/candidates.json`, holds every find: pass 2 (91 candidates), pass 3 (291) and the 84 excluded
  items.
- Each candidate has `tags` (several per item) and `status`. `status: "launch"` is the only switch for the site.
- An excluded item stays in `excluded` as it is (id and reason), with no tags or status. The sync and the guard read
  only `candidates`.
- One command makes `src/content/cards/` and `src/assets/cards/` match the file: it adds, updates and removes cards.
- One readable table of every item, grouped by tag, for the review.

## Non-goals

- No new research. Andrei adds the missed fun events himself, in the review.
- No review web page in this change. The review on 2026-11-15 is the table plus chat ("launch X, drop Y") or edits to
  the JSON. A swipe-style yes/no review page follows on 2026-11-16 (Andrei). It reads and writes `status` in this file.
- No change to the pages, the components, the card schema or the deploy. The code changes are the sync, its
  `npm run cards` script in `package.json`, `toCard`, the content test, one e2e route and the comments that describe
  the old flow.

## Anti-goals

- A second copy of a published item (a hand-kept `published.json`). Two copies drift.
- An image that the site does not show but still ships. Astro ships every image that the collection imports.
- A dropped item that comes back with Rockstar art. 24 images were replaced by hand on 2026-11-13 (`a21ce3c`).
- A hand edit that a sync silently undoes.

## Approaches

| Approach | Trade-off | Picked |
|---|---|---|
| Status flag in one file. A sync script writes the Markdown cards | The site code does not change. Cards become generated output, so edits go in the JSON | **Yes** (Andrei, 2026-11-15) |
| Hand-kept `published.json` that the site reads | Each published item exists twice. A fix to one copy does not reach the other | No |
| Generated `published.json` in place of the Markdown cards | The same idea as the first option, with more site changes. Astro image handling from JSON is not checked | No |

## Design

### Data

- Merge `research/world-events.json` into `research/candidates.json`. Delete `world-events.json`, `world-events.md`
  and `research/held/*.md`. Git history keeps them.
- Top level: `passes`, `candidates`, `excluded`. The two `candidates` arrays join (91 + 291), and the two `excluded`
  arrays join (31 + 53).
  - `passes` holds one entry per pass with its search notes, as they are: pass 2 keeps `login_walls` and
    `not_covered`, and pass 3 keeps `pass`, `date`, `rule` and `fields`.
  - Each pass also gets `notes`: the prose of its old Markdown file. For pass 3 this is the criterion, the score scale
    and the council promotions. The highlight rule stays there as the research bar.
- Each candidate gets `tags`. Pass 3 `field` becomes a tag, then the `field` key goes.
- Each candidate can have `review_notes`, an optional string for image or presentation directions (2026-11-17).
  The local review tool edits this field. `toCard` excludes it from public card files.
- Each candidate can have `review_decision`, the latest explicit `choice` (`yes` or `no`) and `decided_at` UTC timestamp (2026-11-17).
  Every accepted decision updates it, even without a status change. `toCard` excludes this record from public card files.
  A Yes with `status: "drop"` awaits image approval unless the record has `merged_into`. The review page preserves that selection without generating an incomplete public card.

- `presentation: "milestone"` renders a selected item as a timeline milestone. The field is optional; absent means a normal row.
  Its card page and local image remain available. `src/data/milestones.js` uses `candidateId` to join three existing milestones to their candidates.
  Matching dates alone never merge events. Unrelated events on the same date remain separate.
- `merged_into` names an unmerged canonical candidate. The original record keeps its notes, decision, and `archive_reason`.
  A merged record must remain `drop`. It stays outside the review queue, and review writes reject it.
  These archive fields never enter public card frontmatter.

### Hand edits go into the JSON first

The migration compares every frontmatter field of every card file with `toCard` of its research item, and copies each
difference into the item. Measured on 2026-11-15:

| Card files | Differ | Fields |
|---|---|---|
| 97 live (`src/content/cards/`) | 15 | `imageAlt` 12, `source` 2, `blurb` 1, `date` 1 |
| 3 held (`research/held/`) | 1 | `blurb` (`sex-2`) |
| 63 archived (`528ede2^:src/content/cards/`) | 25 | `imageAlt`, `blurb`, `source`, `factUrl` |

- The field map: `blurb` → `blurb`, `date` → `timeline_date`, `factUrl` → `fact_url`, `source` → `source_url`,
  `source_platform`, `source_engagement`, and `imageAlt` → a new optional `image_alt`.
- `toCard` writes `imageAlt: c.image_alt ?? c.title`.
- `toCard` throws when `status` is missing or not `launch`, `hold` or `drop`. Today it defaults to `launch`, so a find
  added without a status would go live.

### Tags (proposed, Andrei can rename)

- Subject, one or more, first in the list: `politics`, `economy`, `tech`, `internet`, `science`, `sport`, `culture`,
  `gaming`, `gta`, `creators`.
- Size, last in the list: `world-event`. At migration it goes on every item that meets the highlight rule (impact 7 or
  more, or impact 5 or more and meme 4 or more) and on the two council promotions.
- Pass 3 fields map as follows: `politics-world` → `politics`, `economy-business` → `economy`, `tech-internet` → `tech`
  or `internet`, `space-science` → `science`, `sport-culture` → `sport` or `culture`. A split field is decided per item.
- Pass 2 items get subject tags per item. These are calls for the review to correct.

### Images

- `research/images/` replaces `research/held/`. It holds the local image of every candidate that is not live.
- The sync takes the image of a launched item from `src/assets/cards/`, then from `research/images/` (it moves the
  file), then from `image_url`. A hand-saved image always wins over `image_url`.
- An item that stops being live moves its image to `research/images/`.
- A move deletes any other `<id>.*` file in the target folder, so one id never has two images.
- A takedown is the exception. The repo is public, so after the sync the image in `research/images/` is deleted by
  hand, and the Cloudflare purge in `deploy/README.md` still applies.
- The migration restores the 63 images archived in `528ede2` from `528ede2^`, which is after `a21ce3c`. A re-launch
  then gets the hand-checked image, not the original `image_url`.

### Sync

- `scripts/import-cards.js` becomes `scripts/sync-cards.js`, run with `npm run cards`
  (`"cards": "node scripts/sync-cards.js"`).
- Pre-flight, before any write: the duplicate-id check, and on every candidate a valid id, a `status` of `launch`,
  `hold` or `drop`, and `tags` that is a list of known tags. Then `toCard` on every `launch` item, and the table. Any error stops the run with exit 1 and no file changed. A typo such as
  `"Launch"` then stops the run and does not silently hide the item.
- For each `launch` item: write the card from `toCard` (it overwrites, because the JSON wins now) and place the image.
- For each card file without a `launch` item: move its image, then delete the card.
- A failed image fetch skips that card, and the run lists the failures and exits 1, as today. 17 candidates that are
  not live have a Commons file page in `image_url`, not an image, but each has a kept image in `research/images/`.
  4 have no `image_url` and no image, and need an image by hand.
- The run prints the ids whose image came from `image_url`. Each one is looked at before the merge, because that is
  how Rockstar art got in before `a21ce3c`.
- It writes `research/candidates.md`: the pass notes and the counts per tag and status at the top, then one section
  per first subject tag, then an "Untagged" section for items with no subject tag, then the excluded items. Columns:
  Id, Title, Date, Tags, World event, Impact, Meme, Status, Post, Fact.

### Guard

- `src/__tests__/content.test.js` gets one test. For each `launch` item, the card file equals
  `cardMarkdown(toCard(c).frontmatter, <image file for the id>)` and that image exists in `src/assets/cards/`. No card
  is missing and no card is extra. The same test runs the pre-flight check and compares `research/candidates.md`
  with `reviewTable`. `ci.yml` runs `check` on every PR, with no path filter, so a JSON edit without
  `npm run cards` fails the PR.
- The table builder is a pure function in `scripts/lib/candidate.js`, with one small test.
- `e2e/site.spec.js` opens the first card in `src/content/cards/` in place of the fixed `/flying-cars/`, in the axe
  route and in the card-page and share tests, because a review can drop that card.

### Docs

- AGENTS.md: the commands table, the `research/` rule and the held-card invariant.
- AGENTS.md content rules: the highlights bullet becomes "The site shows Andrei's picks" (Andrei, 2026-11-15). The
  first picks are the 97 cards on production on 2026-11-15. The politics bullet loses "when the event passes the
  world-event rule". The exclusions (deaths, war, violence, sexual-abuse cases, harassment, hate) and the NSFW limits
  stay as they are.
- `deploy/README.md` § Removing or holding a card.
- The 2026-11-13 design spec: the content model, and the content rules that point to `research/world-events.*`.
- The comments in `src/content.config.js`, `src/__tests__/content.test.js` and the header of
  `scripts/lib/candidate.js` that describe hand-edited cards, `research/held/` or `import-cards.js`.

## Acceptance

- After the migration and one `npm run cards`, `git diff src/content src/assets` is empty: the same 97 cards and
  images, byte for byte.
- For each held and archived item, `cardMarkdown(toCard(item))` equals its last card file. This is a one-time check of
  the migration, not a test.
- The verification gate in AGENTS.md passes, `npm run test:e2e` included.

## Left to the builder

- The exact JSON key order and the Markdown table layout within the columns above.

## Council review, round 1 (2026-11-15)

Seats: Claude Opus, Mistral Large 4, DeepSeek V4.1 Flash. Accepted: hand-written `imageAlt` (all three seats, P1), the
public-repo takedown, the restore commit and the archived-card comparison, the grouping by subject tag, the place of
`excluded`, `login_walls` and the pass prose, the pre-flight, the required status, the e2e route, the unchecked
`image_url` images, the content-rule scope and the stale comments. Declined:

- A README sentence that the guard runs only on PRs: docs-only, and `ci.yml` runs `check` on every PR.
- A sweep of orphan images in `src/assets/cards/`: Astro ships only imported images, and nothing creates an orphan.
- A cap on how many cards one sync may delete: `git diff` shows every deletion before the commit, and the PR review
  sees it.

## Council review, round 2 (2026-11-15)

Claude Opus 8/10 and Mistral Large 4 8/10, no P0 or P1. Accepted: the status check on every candidate in the
pre-flight, the `package.json` script, the joined arrays, one image per id, the "Untagged" section, the narrower
acceptance path, the politics bullet, and the stale references in the 2026-11-13 spec and `candidate.js`. Declined:

- A note that an item without `source_url` cannot launch: every one of the 382 candidates has a `source_url`
  (measured 2026-11-15), and the pre-flight names a new item that lacks it.

DeepSeek V4.1 Flash, round 2: no result. It asked to run a shell command, which its rules forbid, and waits for an
approval.

## Council code review, PR #21 (2026-11-15)

Round 1: Claude Opus 8/10, Mistral Large 4 8/10, DeepSeek V4.1 Flash 8/10, no P0 or P1. Round 2: 9/10, 9/10 and 8/10,
P3 only. The fixes are in the PR. Declined: moving every image of one id (only a hand save makes two, and neither
ships), escaping `[`, `]` and `<` in cells (no data holds them), and the plan's expected output line (the ledger has
the ruling).
