# Candidate review

Run `npm run review` from this repository. Open `http://127.0.0.1:4322/`.
The tool listens only on the local machine.

- **Yes** or **Right Arrow** sets the candidate to `launch`.
- **No** or **Left Arrow** sets the candidate to `drop`.
- A horizontal touch swipe selects the same decision: right for Yes, left for No.
- **Skip** advances without a decision. **Previous** returns to the previous candidate.
- **Fetch image** saves a local preview when the candidate has an image URL but no local image.
- **Refresh** reads the current file after an external edit or a stale-page error.

Each decision changes only the candidate status in `research/candidates.json`.
The existing sync script then regenerates the cards and the research table.
The page confirms success after synchronization finishes.
If synchronization fails, its error remains visible and further decisions remain blocked until synchronization succeeds.

Held candidates remain outside the decision queue.
`gta5-farewell-drive` remains held until 2026-11-18.
`sex-2` and `durian-condom` remain held until AdSense approval.
The page cannot remove these holds.

Images remain local. Inspect each downloaded image before selecting Yes.
The existing content rules and the ban on Rockstar artwork apply.
Four candidates have no image URL: `aws-outage-2025`, `pope-meets-patriarch`, `uk-age-checks`, and `brain-rot-word-of-the-year`.
Save their image in `research/images/<id>.jpg`, `.png`, `.webp`, or `.gif`, then refresh.

Decisions change the local working tree. Inspect the diff and use the normal PR and release process to publish them.
Stop the review server with Control-C. The review page and its API never enter the static build.

**eli14:** This page is a private sorting desk for the public timeline.
Each choice prepares the matching card files. A release puts those changes on the public site.
