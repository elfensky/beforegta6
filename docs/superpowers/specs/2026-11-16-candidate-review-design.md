# Local candidate review

Issue: <https://github.com/elfensky/beforegta6/issues/19>.
Requirements: REV-01, REV-02, REV-03 in `.planning/REQUIREMENTS.md`.

The local review page shows one candidate, its image, title, date, blurb, tags, and source links.
Yes selects `launch`. No selects `drop`. Buttons, arrow keys, and horizontal swipes provide the same actions.
Skip leaves the candidate unchanged. Previous permits correction of a decision.

The page runs through `npm run review` on the loopback address.
A small Node server serves files from `scripts/review/` and images from the two existing image directories.
It writes decisions to `research/candidates.json` and runs the existing card sync before confirming success.
Only the selected candidate's status changes. All other data survives.
No dependency, database, public API, or production route is needed.

Candidates with `hold` status remain protected and outside the decision queue.
Their existing release conditions remain authoritative.
A candidate without a local image cannot launch through the review page.
The page explains the missing image instead of confirming an incomplete change.
When an image source exists, Fetch image saves a local copy for inspection before Yes becomes available.
The download accepts only public HTTP(S) destinations, validates redirects, and limits response size and time.
Downloads use the same write protections and never change candidate status.
Candidate metadata must pass the existing validation before launch.

Writes are serialized. A revision check rejects decisions from a stale browser view.
The server accepts writes only from its own page, with a session token and a matching origin.
Host checks reject DNS rebinding. File requests use fixed routes and validated candidate identifiers.
The page renders candidate text as text and permits only HTTP(S) source links.
All scripts, styles, images, and fonts remain local.

The tool does not select any candidates automatically or publish site changes.
Tests use temporary fixtures. They never change the real research selections.
No review files or research images appear in the static build.

## Approach

A standalone Node server reuses the existing file model and sync command.
An Astro endpoint would require a server adapter for a static site.
A browser-only file editor would add manual file selection and could not run the sync command.

**eli14:** The page is a private sorting desk beside the public timeline.
Each choice changes one label and prepares the matching card files.
Publishing still follows the repository's release process.
