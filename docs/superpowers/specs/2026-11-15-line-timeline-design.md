# Line timeline — design

- Date: 2026-11-15
- Status: approved by Andrei on 2026-11-15, built the same day. It replaces the views of `2026-11-14-timeline-only-design.md`: the small cards and the view toggle go.
- Council record: `2026-11-15-line-timeline-council.md` (Mistral Large 4, DeepSeek V4.1 Flash, 2 rounds).

## Intent

The front page timeline is too busy. Each small card shows an image, a title, a blurb, a date and a source. The month
tiles in the card grid look like empty cards. The timeline becomes one calm, centred line with one short row per
event. The card page (`/<id>/`) keeps the image, the blurb and the sources.

## Decided (Andrei, 2026-11-15)

- **Layout: centred ledger.** On desktop the line runs down the centre. The date sits left of the line, the title right
  of it. Andrei chose it over the zigzag after he saw mockups of both.
- **One fact per row: the day count to the GTA 6 launch** ("617 days"). No likes and no view counts: both need a server
  and a database.
- **Media: the row's image on hover, on desktop only.** It shows in the empty left half, with an arrow to the row and the
  photo credit. Phones show no media.
- **The only control is the order:** newest first or oldest first. The view toggle goes. No search: the whole page
  loads, and the browser's find covers it.

## Goals

- One row per event, readable straight down.
- The same focus order and screen-reader order at every width: both follow the DOM. The one visual move is the day
  count on phones, which shows beside the date, above the title (builder's call, 2026-11-15: it matches the approved
  mockup, and the count is plain text, not a tab stop).
- No images load on the first view of the timeline.
- About one ad per screen (Andrei, 2026-11-13: "roughly one ad card per scrollable page").

## Non-goals

- Likes, view counts, comments: they need a server.
- Search or filters.
- A media panel that follows the scroll.
- Month markers.

## Anti-goals

- The busy look comes back: images, blurbs or a second link on every row.
- A row that a screen reader or the browser's find cannot read in full.
- An image that covers other content when it shows.

## Approaches

| Question | Option | Trade-off | Outcome |
|---|---|---|---|
| Layout | **Centred ledger** | Calm, one text axis. The left half holds only the dates. | **Chosen** |
| Layout | Zigzag | Uses the full width. The eye crosses the line on every row, and it is the most common timeline look on the web. | Not chosen |
| Layout | Alternating by month | Long runs on one side (17 rows in 2025). | Rejected by the council |
| Row fact | **Day count** | The joke in numbers. The source shows only on the card page. | **Chosen** |
| Row fact | Source site | 51 of 97 rows would say "Wikipedia". | Not chosen |
| Media | **Image on hover** | CSS only. The left half is empty at rest. | **Chosen** |
| Media | Panel that follows the scroll | About 30 lines of JavaScript, the image changes while you scroll, milestones and ads must move to the right half. | Not chosen |
| Media | Thumbnail on every row | Busier, and no room for the credit that CC BY and CC BY-SA photos need. | Not chosen |

## Design

### Pages

- `/` shows newest first and `/oldest/` oldest first. `/oldest/` keeps `/` as its canonical address and stays out of
  the sitemap, as today.
- `src/pages/lines/index.astro` and `src/pages/lines/oldest.astro` are deleted. They exist only on staging, so they get
  no redirect.
- `/timeline/` is live in production today (`origin/main` has `src/pages/timeline.astro`). When this change reaches
  `main`, nginx sends `/timeline/` and `/timeline` to `/` with a 301: a `location ~ ^/timeline/?$ { return 301 /; }`
  block in `deploy/nginx.conf`, before the existing `location /`.

### A card row

The DOM order of a row is: date, node, title link, day count, hover image.

- **Date:** `<time datetime="YYYY-MM-DD">` with day and short month ("12 Mar"), en-GB, UTC, as today. The year comes
  from the year heading.
- **Node:** a dot on the line, `aria-hidden="true"`.
- **Title:** one link to `/<id>/`. The link text is the full title. A pure `splitTitle(title)` in `src/lib/cards.js`
  splits "We got <event> before GTA 6" into the frame and the event. The frame renders in `--muted`, the event in
  `--text` and bold. A title without that form renders whole. The space in "GTA 6" is a no-break space, so "6" never
  wraps onto a line of its own (the mockup showed it does).
- **Day count:** whole days from the card's date (UTC) to the launch day, from a pure `daysBefore(date, launch)` in
  `src/lib/countdown.js`, beside `remaining`. The launch day comes from `LAUNCH` in `src/data/site.js`. The row shows
  "617 days", with a thousands separator ("1,412 days") and "1 day" for one. The row shows no count when the result is
  0 or less. Today no card falls on or after the launch day. Tabular figures, `--muted`.
- **Hover image:** see Media below.
- **NSFW card:** the timeline never shows its image. The hover figure shows an "NSFW" tile in its place. The card page
  keeps its `<details>` gate.

### Layout

- The timeline column is at most 56rem wide, centred. The page `main` stays at 84rem.
- **Below 960 px:** the line runs at the left edge. A row has two lines: the date (left) and the day count (right),
  then the title.
- **From 960 px:** each row is a grid of `1fr 2.5rem 1fr`. The date is right-aligned in the left column, the node sits
  on the line, the title and the day count share the right column. The day count is right-aligned and does not wrap.
- **The line is drawn per row:** a pseudo-element on each card row and on each year heading, at the same x. Milestone
  and ad rows draw no line, so the line pauses at them.
- **Years:** one `<section>` with an `<h2>` per year, as today. The heading sits on the line: centred from 960 px, at the
  left below. No month markers: every date shows its month.
- **Milestones:** full-width rows with the pink border of today: date, ◆, title, blurb. "GTA 6 comes out" is the end of
  the line: centred, larger, with the year in its date. The markup is the same in both orders.

### Media on hover (desktop only)

- The row holds a `<figure>` with the card image and a caption. Below 960 px the figure is `display: none` at all times.
- **When it shows:** from 960 px, on pointer hover where the device can hover (`@media (hover: hover)`), and when the row's
  link has keyboard focus (`:focus-visible` inside the row). A tap on a touch screen opens the card page and shows no
  image.
- **Where:** in the left half, at its left edge, about 16rem wide, hanging down from the row. A pink arrow runs from the
  image to the row, and the node turns pink. Hanging, not centred: centred, the first rows under the launch milestone
  showed only a strip of their image. The row just above a milestone or an ad shows the top of its image only.
- **It covers milestones, never ads.** The dates sit at the right end of the left column, so the image and the arrow stay
  clear of them. The figure stacks above a milestone row and below an ad row (`z-index`): AdSense forbids content over an
  ad. WCAG 1.4.13 asks that on-hover content that covers content can be dismissed, so Escape hides the figure until the
  pointer or focus leaves the row (`src/scripts/media.js`). The figure is inside the row, so the pointer can move onto it
  and it stays open.
- **Image:** `astro:assets` `<Image>`, `alt=""` (the title link names the row; the card page has the full alt text),
  `loading="lazy"`, widths 256 and 512, `sizes="16rem"`, a 3:2 crop. At rest the figure is hidden with `display: none`
  at every width, never with `visibility` or `opacity`: a lazy image in a `display: none` box loads only when the box
  shows. The e2e test checks it in all three browsers.
- **Caption:** `imageCredit.text` as plain text under the image ("photo: CC BY-SA 4.0 (Bryan Berlin)"). CC BY and CC BY-SA
  need the credit beside the image (`src/content.config.js`). Plain text, not a link, so the row keeps one tab stop.

### Order toggle

- The existing `.toggles` links under the `h1`, without the View group: "Newest first" and "Oldest first". The current
  one carries `aria-current="page"`. Each link is at least 24 × 24 px.

### Ads

- The same pure `withAdSlots`, with new defaults: a slot after every 10 entries, and every 20th position is also a
  desktop slot. Today's 4 and 8 fit cards. With short rows they would put an ad about every third of a phone screen.
- Ad rows are full width, as today.

### Removed

- The `view` prop of `Timeline.astro` and `TimelineItem.astro`, the `small` variant of `Card.astro` and its image sizes,
  the card grid and month-tile CSS, and the lines-view CSS.
- `monthOf` and its unit test, if nothing else uses it. `groupSlots` and `yearOf` stay.
- The `eager` image set in `Timeline.astro`: no image is above the fold any more.

### Tests

- **Unit:** `splitTitle` (the usual form, a title without the frame, the no-break space). `daysBefore` (2025-03-12 →
  617, the launch day → 0, UTC in any time zone). `withAdSlots` with the new defaults.
- **e2e** (`e2e/site.spec.js`): axe on `/` and `/oldest/`. No horizontal scroll at 320 px on `/` and `/oldest/`. The ad
  density test moves to 10 entries. Without JavaScript the timeline reads in full. The order toggle switches between `/`
  and `/oldest/`. At 1280 px, hovering a row shows its image, and the first load requests no card image. The tests for the
  lines pages, the view toggle and the month tiles go.
- The verification gate of AGENTS.md passes.

### Release

- `origin/develop` holds the timeline-only work (14 commits) that `origin/main` does not have. Production `/` still shows
  the card wall. So the first release to `main` after this change takes production from the card wall straight to the
  line timeline, and drops `/timeline/` in the same step. The `/timeline/` redirect must be in that release.

### Docs

- `2026-11-14-timeline-only-design.md` gets a status line that points here.
- `deploy/README.md` notes the `/timeline/` redirect.

## Left to the builder

Exact sizes (image width, column gap, row padding), the look of the arrow and of the NSFW tile, the names of the CSS
classes, and the test layout. The mockup in `.superpowers/brainstorm/21460-1794705626/content/line-timeline-media-v2.html`
(gitignored) shows one way to do it.

## Noticed, outside this change

- On 2025-11-06 the card "We got two GTA 6 delays" sits next to the "Second delay" milestone.
