# Milestone presentation

Scope: the 14 candidates whose review notes ask for GTA milestone rendering.
Patches for `research/candidates.json` are in `milestones.json`.

## Contract

- Candidate field `presentation: "milestone"`, optional. When absent, the candidate is a normal card. Any other value is a sync error.
- `presentation` is independent of `kind` (`real-event` or `joke`).
- `toCard` writes `presentation: "milestone"` to the card frontmatter only when it is set, so other card files do not change.
- The content schema accepts `presentation: card | milestone`, with `card` as the default.
- `withMilestoneCards(cards, milestones)` in `src/lib/cards.js` is a pure function:
  - It takes launch cards with `presentation: milestone` out of the card rows.
  - It adds each one as a milestone: `title`, `blurb`, `factUrl` (or the source URL if `factUrl` is absent), and `href: /<id>/`.
  - A milestone card explicitly named by `candidateId` in `src/data/milestones.js` merges into that milestone. The hand-written text stays, and the milestone links to the card page. The event shows one time.
  - Two milestone cards on one date stay as two milestones.
- `timelineEntries` does the sort, as before. On one date, milestones come before cards and sort by title. Newest first is the exact reverse.
- In `TimelineItem.astro`, a milestone title links to its card page when `href` is set.
- Card pages, images, the pager and OG images do not change. A milestone card keeps its page, so every card file stays live and its image stays in use.

## Merges

| Candidate | Hand-written milestone |
|---|---|
| `gta5-ps3-x360` | GTA V comes out (2013-09-17, start of the line) |
| `gta6-trailer` | Trailer 1 (2023-12-05) |
| `gta6-delays` | Second delay (2025-11-06); First delay stays separate |

## Checks

- The 235 million figure (as of 30 September 2026, Take-Two Q2 FY2027) and the Miami Heat dates (announced 2 October 2026, game 18 November 2026, with Rockstar) were checked on 2026-11-17 against the sources listed in `milestones.json`.
- The other dates are well-known release dates. They match the candidates' sources.
- `gta5-pc` says "GTA 6 has no PC date yet". This statement was not checked again for November 2026.

**eli14:** Some cards are now flagged "show me as a signpost". On the timeline they look like the pink GTA signposts, and a click opens their page. When an existing signpost explicitly names that card, the card joins it, so the same event never shows two times.
