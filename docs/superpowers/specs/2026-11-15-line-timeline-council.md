# Council: line timeline layout (2026-11-15)

- Mode: debate, 2 rounds.
- Seats: Mistral Large 4 (`acpRegistry_mistral_vibe`, `mistral-large-4-0-3`, thinking high) and DeepSeek V4.1 Flash
  (`opencode`, `deepseek/deepseek-flash`, variant high). Andrei named both seats.
- Decision it fed: `2026-11-15-line-timeline-design.md`.

## Brief (summary of the task text both seats got)

- **Question:** how should the one-line centred timeline lay out? Options: A, alternating sides per entry. B, a ledger
  with dates left of a centred line and titles right of it. C, alternating sides per month.
- **Sub-questions:** thumbnail, full title or event only, which static fact and where, year and month markers, the 7
  milestones, ad slots, the order toggle.
- **Facts given:** Astro 7 static site, 97 cards and 7 milestones (cards per year 2 to 17), every title "We got … before
  GTA 6", all cards `kind: real-event`, source domains (51 Wikipedia, 27 X), today's views, `withAdSlots` (4 and 8), the
  palette.
- **Owner decisions given:** centred line with items left and right ("potentially"), cards too busy, month tiles look
  weird, order is the only control, static facts only.
- **Standards given:** AGENTS.md invariants, the e2e checks (axe, 320 px reflow, no-JS), the ui-ux search findings
  (WCAG 2.2 AA 24 px targets, DOM order = reading order, reduced motion, contrast).
- **Rules:** read-only. Round 2 of DeepSeek ran with no tools at all, because its first round-2 run asked to run a shell
  command, which the brief forbids. That run was stopped.

## Round 1

**Mistral Large 4.** Verdict B, line at 50 % at every width. No thumbnail. The event part of the title only, with the
frame said once in the `h1`. Right of the line: a linked source name and "· N days before GTA 6". Month label at the
first entry of each month. Ads in the right column only. Missing fact: mobile vs desktop traffic. Score 8/10.

**DeepSeek V4.1 Flash.** Verdict B′, a ledger with the line at the edge of the date gutter. No thumbnail. The full title in
the DOM with the frame in `--muted` (browser find and the screen-reader links list need it). A tabular day count at the
far right; no source link (a second link per row adds 97 tab stops). Line drawn per row, so ads and milestones pause it;
"GTA 6 comes out" ends the line. Missing fact: is "centred" a hard rule for the line. Score 8/10.

## Round 2

**Mistral Large 4.** Critique: B′ drops the owner's "centred" line. It adopts DeepSeek's full title with a muted frame
and the per-row line. It keeps the day count as a suffix after the title, not in a third column. Final: B, line at 50 %
at every width, day count as the only fact, no source link, full-width ads and milestones, no month labels in the
gutter except at the first entry of a month. Score 8/10.

**DeepSeek V4.1 Flash.** Critique: a 50 % line at 320 px leaves about 130 px for a title of up to 71 characters. Removing
the frame from the DOM breaks find. A linked source adds tab stops. Final: B2, the line at 50 % from 960 px and at the
left edge below. Full title, day count at the far right from 960 px and under the title below. Years break the line. No
month markers. Milestones and ads full width, line per row. Score 8/10.

## Synthesis

- **Agreed:** ledger over zigzag and over alternating by month. No thumbnails on rows. Full title with a muted frame.
  The day count as the one fact, no source link. Per-row line. Full-width milestones and ads. "GTA 6 comes out" ends the
  line. Two pill links for the order.
- **Split:** the line on phones (Mistral: 50 % at every width; DeepSeek: left edge below 960 px). Month labels
  (Mistral: at the first entry of a month; DeepSeek: none).
- **Taken:** DeepSeek's phone layout (the 320 px reflow test would fail with a 50 % line) and no month labels (every
  date shows its month).
- **Added outside the council:** the ad density (10 and 20, from Andrei's one-ad-per-screen rule of 2026-11-13).
- **Unverified claim dropped:** DeepSeek's round-1 "16 rem / ~250 px AdSense minimum".

| Seat | Verdict | Score | Strongest reason |
|---|---|---|---|
| Mistral Large 4 | B, line at 50 % at every width | 8/10 | One aligned row per event, the same reading order at every width |
| DeepSeek V4.1 Flash | B2, line at 50 % from 960 px, left edge below | 8/10 | Keeps "centred" where the width allows, stays readable at 320 px |

## After the council

Andrei compared mockups of the ledger and the zigzag and chose the centred ledger. He then asked for media in the empty
left half and chose the image on hover over a panel that follows the scroll (2026-11-15).
