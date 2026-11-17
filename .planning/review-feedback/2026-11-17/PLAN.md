# Apply completed review feedback

The source snapshot is `notes.json`: all 95 noted candidates at review completion.
Original notes and recorded choices remain preserved. The parent integrates data patches into `research/candidates.json` and runs `npm run cards`.

## Ownership

- Editorial agent: factual checks, headlines, requested merges, related candidates, and an outcome for every non-milestone note. Output `editorial.json` and `editorial-sources.md`. No shared data or asset edits.
- Image agent: requested replacements and missing images for noted candidates. Output staged files under `assets/`, plus `images.json` with provenance and outcomes. No shared data or code edits.
- Milestone agent: representation of the 14 noted GTA milestones, duplicate suppression, and targeted tests. Owns the required card/timeline model and rendering files. Output `milestones.json` for data edits; never edit the candidates JSON directly.
- Parent: integration, candidate JSON, feedback coverage, shared docs, verification, and remaining corrections.

## Approved exceptions

Andrei confirmed on 2026-11-17 that Queen Elizabeth II's death may replace the coronation item.
Rockstar images may illustrate only the Oppressor comparison and Red Dead running on phones.
Andrei also confirmed one COVID card covering the pandemic and chip shortage.
The other content exclusions remain in effect.

Andrei also approved the five staged media exceptions: Tesla Roadster, Volonaut Airbike, Concord artwork, Pokémon farewell artwork, and GamesRadar's Red Dead phone photograph. Their copyright status stays explicit. Cena retains his portrait; his Instagram key art is not approved.

## Acceptance

Every noted item has an explicit outcome. Implemented outcomes reference the changed fields or local assets.
Merges preserve research records and source evidence while removing duplicate live entries.
Headlines retain factual accuracy. Missing evidence remains explicit; no rumor is presented as fact.
New images have recorded provenance, usable local bytes, and an inspected subject match.
The final candidate file and generated cards agree. All repository verification gates pass.

**eli14:** The notes are an editing checklist. Each checked line points to its finished text, picture, or timeline entry.
