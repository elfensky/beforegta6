# Timeline as the only view — design

- Date: 2026-11-14
- Status: approved by Andrei on 2026-11-14. It changes the Goals of `2026-11-13-beforegta6-design.md`.

## Intent

The timeline becomes the only view of the site and its front page. The card wall and the header switch go.
A visitor can turn the order (newest first, oldest first) and the view (small cards, lines).

## Decided (Andrei, 2026-11-14)

- Default: newest first, small cards.
- Each combination is its own static page. The toggles are links.

| Page | Order | View |
|---|---|---|
| `/` | newest first | small cards |
| `/oldest/` | oldest first | small cards |
| `/lines/` | newest first | lines |
| `/lines/oldest/` | oldest first | lines |

## Approaches

| Approach | Trade-off | Outcome |
|---|---|---|
| **Four static pages, toggles are links** | Works without JavaScript, every view has a link, ads never move. A toggle loads a new page at the top, and the choice is not remembered. | **Chosen** |
| One page, JavaScript switch | No page load, the choice is remembered. Re-ordering moves live AdSense units, which reloads them. Without JavaScript only the default shows. | Not chosen |

## Design (builder's calls, open to correction)

- **Small cards:** a year heading, then a month heading, then a grid of small cards (image, title, blurb, date, source).
  It reuses `Card.astro` with a smaller variant. Milestones and ad slots span the full row of the grid.
- **Lines:** today's `/timeline/` rows, with year headings: thumbnail, date, title, milestones highlighted.
- **Order:** "newest first" is the exact reverse of "oldest first". The order and the month grouping are pure functions in
  `src/lib/cards.js`, with unit tests.
- **Ads:** the same density as today, computed for each order: one slot after every 4 entries, a desktop slot after every 8.
- **Toggles:** two link groups above the timeline. The current choice carries `aria-current="page"`.
- **Search:** the three variant pages name `/` as their canonical address and stay out of the sitemap.
- **Removed:** `/timeline/`, the card grid and the Cards/Timeline header switch. `/timeline/` is live only on staging, so
  it gets no redirect.
- **Tests:** the e2e checks (axe, 320 px reflow, ad density, no-JavaScript) move to the new pages. One e2e test follows a toggle.

## Left to the builder

Column counts, image widths and the copy of the toggle labels.
