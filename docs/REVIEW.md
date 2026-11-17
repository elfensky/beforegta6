# Candidate review

Run `npm run review` from this repository. Open `http://127.0.0.1:4322/`.
The tool listens only on the local machine.

Each reviewable candidate has an address such as `http://127.0.0.1:4322/aliens`.
Opening that address selects the candidate directly. Reloading preserves the same item.
Opening `/` resumes the last item in the same browser, including after the tab closes.
The browser stores the last item and visited count. Choices and notes remain in `research/candidates.json`.
An explicit item address takes priority over saved progress. Missing or protected item addresses show an unavailable message.

- **Yes** or **Right Arrow** saves a Yes choice. A loaded image permits `launch`; an unavailable image leaves the choice pending.
- **No** or **Left Arrow** sets the candidate to `drop`.
- A horizontal touch swipe selects the same decision: right for Yes, left for No.
- **Skip** advances without a decision. **Previous** returns to the previous candidate.
- **Next** advances without changing the selection. It is disabled at the last candidate.
- **Go to item** accepts a number from 1 to the displayed total, then Go or Enter selects that item.
  Numbers follow the current review queue and exclude protected holds. Enter 1 to return to the start.
- Browser Back and Forward follow visited item addresses.
- **Notes** records image or presentation directions for the current candidate, up to 2,000 characters.
- **Save notes** saves the text without changing the candidate's selection.
- Yes, No, Skip, Next, Previous, Go, and browser Back/Forward save pending notes before moving to another candidate.
- **Fetch image** saves a local preview when the candidate has an image URL but no local image.
- **Refresh** reads the current file after an external edit or a stale-page error.

Each decision saves the candidate status and its latest `review_decision` in `research/candidates.json`.
The record contains `choice` (`yes` or `no`) and `decided_at` (the server's UTC timestamp).
Every accepted Yes or No updates this record, even when the status stays the same.
The page shows each item's decision and save time, plus the number of decided items.
These records survive browser-storage resets and server restarts. Visits, skips, notes, and image fetches do not create decision records.
Earlier choices have no record and appear as "Not decided" until another Yes or No is saved.

An item with a saved Yes and `status: "drop"` awaits image approval. The UI displays **Needs image approval** and counts these items.
The saved Yes counts as decided. The card stays outside generated site content until its image is ready.
Fetch or replace the image, inspect it, then select Yes again to set `launch`. No cancels the pending Yes.
Failed downloads and broken previews do not block pending Yes choices. Notes save with the choice before the page advances.
The tool never interprets note text as a decision automatically.

Notes use the optional `review_notes` field in that same file. An empty note removes the field.
Notes and decision records remain outside public card files and the static build.
The existing sync script then regenerates the cards and the research table.
The page confirms success after synchronization finishes.
If synchronization fails, its error remains visible and further decisions remain blocked until synchronization succeeds.
If a note cannot save, the page keeps the text and prevents navigation to another candidate.
Failed browser-history navigation restores the current item's address.
An unavailable image does not block notes, Yes, No, or Skip. Fetch image remains available for another attempt.
Download errors show the source's HTTP status or unsupported content type.
Refresh reloads the server state while retaining the unsaved note for another save attempt.
The browser warns before leaving the page with unsaved notes. Save before closing the page.

Held candidates remain outside the decision queue.
`gta5-farewell-drive` remains held until 2026-11-18.
`sex-2` and `durian-condom` remain held until AdSense approval.
The page cannot remove these holds.

Images remain local. Inspect each downloaded image before approving the card for launch with Yes.
The existing content rules and the ban on Rockstar artwork apply.
Four candidates have no image URL: `aws-outage-2025`, `pope-meets-patriarch`, `uk-age-checks`, and `brain-rot-word-of-the-year`.
Save their image in `research/images/<id>.jpg`, `.png`, `.webp`, or `.gif`, then refresh.

Decisions change the local working tree. Inspect the diff and use the normal PR and release process to publish them.
Stop the review server with Control-C. The review page and its API never enter the static build.
Browser tests can use a separate port while this tool runs: `REVIEW_TEST_PORT=4323 npm run test:review`.

**eli14:** This page is a private sorting desk for the public timeline.
Each choice prepares the matching card files. A release puts those changes on the public site.
A Yes with an unfinished picture stays in the desk's selected pile until the picture is approved.

## Applied feedback and merged records

The 2026-11-17 feedback pass preserves every original note and recorded click.
A later editorial action can change `status` without rewriting that historical click.
The outcome register is `.planning/review-feedback/2026-11-17/outcomes.json`.

A duplicate has `merged_into` and `archive_reason`, with `status: "drop"`.
It remains in research but stays outside the review queue. The API rejects decisions, notes, and image fetches for it.
A milestone uses `presentation: "milestone"`. It keeps its individual page and shows as a timeline milestone.
