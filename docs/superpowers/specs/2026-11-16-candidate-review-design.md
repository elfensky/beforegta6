# Local candidate review

Issue: <https://github.com/elfensky/beforegta6/issues/19>.
Requirements: REV-01 through REV-06 in `.planning/REQUIREMENTS.md`.

The local review page shows one candidate, its image, title, date, blurb, tags, and source links.
Yes saves the selection, setting `launch` when a local preview has loaded. No selects `drop`.
Buttons, arrow keys, and horizontal swipes provide the same actions.
Each accepted decision records `review_decision: { choice: "yes" | "no", decided_at: <ISO UTC timestamp> }`.
The record stores the latest decision, including repeated choices that leave the status unchanged.
The UI shows the choice, save time, and a decided count from disk, independently of the browser's visited count.
Earlier choices remain unrecorded unless explicitly recovered from confirmed user directions. The tool never interprets notes automatically.

Skip and Next leave the candidate unchanged. Previous permits correction of a decision.
Each reviewable candidate has a local `/<itemId>` address. Explicit addresses select that item on load or reload.
Opening `/` resumes the last item from browser storage. The same storage preserves the visited count.
Item numbers follow the queue order and exclude protected holds. Go accepts integers from 1 to the displayed total.

Next is disabled at the last candidate; Skip or a decision can still reach the completion screen at `/#complete`.
Browser Back and Forward select the item named by the address.
Missing or protected item addresses return the review shell with HTTP 404 and allow selection through Go.
Unavailable browser storage does not prevent review or direct item links.
The Notes field records image or presentation directions in the candidate's optional `review_notes` string.
Save notes saves up to 2,000 characters without changing the selection. An empty note removes the field.
Yes, No, Skip, Next, Previous, Go, and browser Back/Forward save pending notes before advancing.
Failed saves retain the text and prevent navigation. Failed history navigation restores the current item's address.
Refresh retains unsaved text. Leaving the page with unsaved notes triggers the browser's warning.
Keyboard cursor movement and touch gestures inside the text field never select a candidate.

The page runs through `npm run review` on the loopback address.
A small Node server serves files from `scripts/review/` and images from the two existing image directories.
It writes decisions to `research/candidates.json` and runs the existing card sync before confirming success.
Decisions atomically save the selected candidate's status and latest `review_decision` with a server-generated timestamp.
Rejected decisions do not create a record. A synchronization failure retains the saved record; retrying synchronization does not change it.
Note saves change only `review_notes`. Visits, navigation, notes, and image fetches never create decision records.
All other data survives. Notes and decision records never enter generated public cards or the static build.
No dependency, database, public API, or production route is needed.

Candidates with `hold` status remain protected and outside the decision queue.
Their existing release conditions remain authoritative.
A candidate without a local image cannot launch through the review page.
Yes still records the choice when an image is missing or its preview fails. Its site status remains `drop` until image approval.
A saved Yes with `drop` status means pending image approval; no additional persisted flag is needed.
The UI shows **Needs image approval**, counts pending choices, and includes them in the decided count.
The decision request carries the browser's `imageReady` boolean. The server also checks for a local file before launch.
When an image source exists, Fetch image saves a local copy for inspection. Selecting Yes again after inspection permits launch.
No cancels a pending Yes. A pending image never blocks decisions on other items or creates a synchronization error.
The download accepts only public HTTP(S) destinations, validates redirects, and limits response size and time.
Downloads use the same write protections and never change candidate status.
Rejected downloads leave notes and other review actions available. Errors identify the HTTP status or content type.
Conflicting revisions, access failures, and uncertain writes still require a state refresh.
Candidate metadata must pass the existing validation before launch.

Writes are serialized. A revision check rejects decisions from a stale browser view.
The server accepts writes only from its own page, with a session token and a matching origin.
Host checks reject DNS rebinding. File requests use fixed routes and validated candidate identifiers.
The page renders candidate text as text and permits only HTTP(S) source links.
All scripts, styles, images, and fonts remain local.

The tool does not select any candidates automatically or publish site changes.
Tests use temporary fixtures. They never change the real research selections.
`REVIEW_TEST_PORT` selects a separate browser-test port when the real review tool is running.
No review files or research images appear in the static build.

## Approach

A standalone Node server reuses the existing file model and sync command.
An Astro endpoint would require a server adapter for a static site.
A browser-only file editor would add manual file selection and could not run the sync command.

**eli14:** The page is a private sorting desk beside the public timeline.
Each choice changes one label and prepares the matching card files.
The desk also keeps a dated checkmark for that choice, even when the label was already correct.
Selected cards with unfinished pictures wait at the desk until their pictures are approved.
Publishing still follows the repository's release process.
