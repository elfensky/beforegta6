# One candidates file Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every research find lives in `research/candidates.json` with `tags` and `status`, and `npm run cards` makes the cards match it.

**Architecture:** Pure functions in `scripts/lib/candidate.js` map, check and tabulate candidates. `scripts/sync-cards.js` does the I/O. A one-time migration script, kept outside git, merges the two research files and copies the hand edits back. The site code does not change.

**Tech Stack:** Node 26, plain JavaScript with JSDoc (checkJs strict), Vitest, Astro 7 content collections.

**Spec:** `docs/superpowers/specs/2026-11-15-one-candidates-file-design.md`

## Global Constraints

- After the migration and one `npm run cards`, `git diff src/content src/assets` is empty.
- `status` is one of `launch`, `hold`, `drop`. There is no default.
- Subject tags, in this order: `politics`, `economy`, `tech`, `internet`, `science`, `sport`, `culture`, `gaming`, `gta`, `creators`. The size tag `world-event` is always last.
- No Rockstar material. An image from `image_url` is looked at before the merge.
- `research/` never ships. Prettier ignores it, so `candidates.md` is not formatted by the gate.
- Commits as `andrei@lav.ren`. Never write the GitHub skip marker in a commit message.
- Files soft 500 lines, functions soft 60 lines.

## Review Focus

- A find added by hand with no `status`, or `"Launch"`: the sync stops before any write and names the id. Task 1 tests `checkCandidates`.
- A title with `|` in it: the review table must not break its row. Task 2 tests it.
- A find with only `world-event`, or no tags: it appears under "Untagged", not nowhere. Task 2 tests it.
- A card dropped and later launched again: it gets back its own image from `research/images/`, byte for byte, not a new fetch. Task 4 checks it by hand.
- A dropped image that exists under two extensions: one id keeps one image. Task 3 implements it, and Task 4 checks it.

---

### Task 1: `toCard` and the pre-flight check

**Files:**
- Modify: `scripts/lib/candidate.js` (header comment, `Candidate` typedef, `toCard`)
- Test: `src/__tests__/candidate.test.js`

**Interfaces:**
- Produces: `toCard(c: Candidate): { id: string, frontmatter: CardFrontmatter }`, which now throws on a missing or unknown `status` and writes `imageAlt: c.image_alt ?? c.title`.
- Produces: `checkCandidates(candidates: Candidate[]): string[]`, one message per problem: a duplicate id, a `status` that is not `launch`/`hold`/`drop` (on every candidate), and any `toCard` error (on `launch` candidates only). An empty array means the file is good.
- Produces: `Candidate` gains `tags: string[]` and `image_alt?: string|null`, and `status` becomes required.

- [ ] **Step 1: Write the failing tests**

```js
test('uses a hand-written alt text, else the title', () => {
  expect(toCard(fixture({ image_alt: 'A Roadster in the air' })).frontmatter.imageAlt).toBe('A Roadster in the air');
  expect(toCard(fixture()).frontmatter.imageAlt).toBe('We got flying cars before GTA 6');
});

test('rejects a missing or unknown status', () => {
  expect(() => toCard(fixture({ status: undefined }))).toThrow('flying-cars: status');
  expect(() => toCard(fixture({ status: 'Launch' }))).toThrow('flying-cars: status');
});

test('checkCandidates names duplicates, bad statuses and broken launch items', () => {
  const errors = checkCandidates([
    fixture(),
    fixture(),
    fixture({ id: 'typo', status: 'Launch' }),
    fixture({ id: 'no-post', source_url: null }),
    fixture({ id: 'archived-no-post', status: 'drop', source_url: null }),
  ]);
  expect(errors).toEqual([
    'duplicate id: flying-cars',
    'typo: status must be launch, hold or drop',
    'no-post: source_url missing',
  ]);
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/__tests__/candidate.test.js`
Expected: FAIL. `checkCandidates` is not exported, and `toCard` accepts a missing status.

- [ ] **Step 3: Implement**

The status message is `${c.id}: status must be launch, hold or drop`. Drop both `?? 'launch'` defaults. The header comment says that `scripts/sync-cards.js` does the I/O.

- [ ] **Step 4: Run the tests and see them pass**

Run: `npx vitest run src/__tests__/candidate.test.js`
Expected: PASS, the old tests included.

- [ ] **Step 5: Commit** — `feat(cards): require a status and keep hand-written alt text`

### Task 2: The review table

**Files:**
- Modify: `scripts/lib/candidate.js`
- Test: `src/__tests__/candidate.test.js`

**Interfaces:**
- Produces: `SUBJECT_TAGS` (the ordered list above, `as const`).
- Produces: `reviewTable(data: ResearchFile): string`, Markdown. `ResearchFile` is `{ passes: { pass: number, date: string, notes: string[] }[], candidates: Candidate[], excluded: { id: string, reason: string, field?: string }[] }`. Other keys in a pass are allowed and ignored.

Layout:
1. `# Research candidates`, then a line saying the file is generated from `research/candidates.json` by `npm run cards`, so edits go in the JSON.
2. One `## Pass N (date)` heading per pass, with its `notes` as bullets.
3. `## Counts`: one row per subject tag, then "Untagged", then a "Total" row. Columns: Tag, Launch, Hold, Drop, Total. An item counts once, under its first subject tag.
4. One `## <Tag> (N)` section per subject tag that has items, then `## Untagged (N)`. Rows are sorted by status (launch, hold, drop), then by date, newest first. Columns: Title, Date, Tags, World event, Impact, Meme, Status, Post, Fact. Post is `[<platform>](<source_url>)`, Fact is `[fact](<fact_url>)` or `–`, and World event is `yes` or empty. A missing score is `–`.
5. `## Excluded (N)`: one bullet per item, `` `id` (field): reason ``, with ` (field)` only when the item has one.

`|` in a cell becomes `\|`, and a newline becomes a space.

- [ ] **Step 1: Write the failing tests**

```js
test('reviewTable groups by first subject tag and escapes pipes', () => {
  const md = reviewTable({
    passes: [{ pass: 3, date: '2026-11-14', notes: ['Impact 10 = the whole world noticed it.'] }],
    candidates: [
      fixture({ id: 'a', title: 'We got A | B before GTA 6', tags: ['tech', 'internet', 'world-event'], impact_score: 8 }),
      fixture({ id: 'b', status: 'drop', tags: ['world-event'] }),
    ],
    excluded: [{ id: 'covid-pandemic', reason: 'Global pandemic; deaths.' }],
  });
  expect(md).toContain('- Impact 10 = the whole world noticed it.');
  expect(md).toContain('## Tech (1)');
  expect(md).not.toContain('## Internet');
  expect(md).toContain('We got A \\| B before GTA 6');
  expect(md).toContain('## Untagged (1)');
  expect(md).toContain('- `covid-pandemic`: Global pandemic; deaths.');
  expect(md).toMatch(/\| Total \| 1 \| 0 \| 1 \| 2 \|/);
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/__tests__/candidate.test.js -t reviewTable`
Expected: FAIL, `reviewTable` is not exported.

- [ ] **Step 3: Implement `reviewTable` and `SUBJECT_TAGS`** in `scripts/lib/candidate.js`. A section heading is the tag with a capital first letter.

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run src/__tests__/candidate.test.js`
Expected: PASS.

- [ ] **Step 5: Commit** — `feat(research): build the review table from the candidates file`

### Task 3: The sync script

**Files:**
- Create: `scripts/sync-cards.js` (from `scripts/import-cards.js`, with `git mv`)
- Modify: `package.json` (add `"cards": "node scripts/sync-cards.js"`)

**Interfaces:**
- Consumes: `toCard`, `cardMarkdown`, `imageExtension`, `checkCandidates`, `reviewTable` from `scripts/lib/candidate.js`.
- Produces: `npm run cards` reads `research/candidates.json` (fixed path, no argument) and writes `src/content/cards/`, `src/assets/cards/`, `research/images/` and `research/candidates.md`.

Behaviour, in this order:
1. `checkCandidates`. Any message: print each one and exit 1 before any write.
2. For each `launch` candidate:
   - Image: a file `<id>.*` in `src/assets/cards/`, else one in `research/images/` (move it), else fetch `image_url` with the existing user agent. Record the ids that were fetched.
   - A failed fetch adds a line to the failures and skips the card.
   - Write `src/content/cards/<id>.md` from `cardMarkdown(toCard(c).frontmatter, image)`, and overwrite it when it exists.
3. For each `src/content/cards/*.md` without a `launch` candidate: delete it, and move its `src/assets/cards/<id>.*` into `research/images/`.
4. Before every move, delete each other `<id>.*` in the target folder.
5. Write `research/candidates.md` from `reviewTable`.
6. Print the counts (written, removed, fetched, failed), then list the fetched ids under "look at these images before the merge" and the failures. Exit 1 if anything failed.

The id of a file is its name without the last extension, as in the current script.

- [ ] **Step 1: Move the script and write the behaviour above**

Run: `git mv scripts/import-cards.js scripts/sync-cards.js`, then edit it.

- [ ] **Step 2: Lint**

Run: `npm run lint` (CI has no separate type-check step)
Expected: no errors.

- [ ] **Step 3: Commit** — `feat(cards): sync the cards with the candidates file`

The script runs for the first time in Task 4, after the migration.

### Task 4: The migration

**Files:**
- Create (not committed): `.superpowers/migrate-candidates.mjs`. The `.superpowers/` folder is in `.gitignore`.
- Modify: `research/candidates.json`
- Delete: `research/world-events.json`, `research/world-events.md`, `research/held/*.md`
- Move: `research/held/*.{jpg,png}` → `research/images/`
- Create: `research/images/<id>.*` for the 63 images that `528ede2` deleted, from `528ede2^`
- Regenerate: `research/candidates.md`

**Interfaces:**
- Consumes: `toCard`, `cardMarkdown` from Task 1, and `SUBJECT_TAGS` from Task 2.
- Produces: `research/candidates.json` in the `ResearchFile` shape. Each candidate starts with `id`, `status`, `tags`, then the old keys without `field`.

The migration script, in order:
1. Read both files. `passes` = `[{ pass: 2, date: '2026-11-13', notes, login_walls, not_covered }, { pass: 3, date: '2026-11-14', notes, rule, fields }]`. Pass 2 notes: `Sorted by rank (absurdity and impact first).` Pass 3 notes: the five bullets at the top of `research/world-events.md` (criterion, highlight rule, score scale, the two council promotions), as they are.
2. Join `candidates` (91 + 291) and `excluded` (31 + 53).
3. Copy the hand edits. Old card files are the 97 in `src/content/cards/`, the 3 in `research/held/` and the 63 in `528ede2^:src/content/cards/` (`git diff --name-only --diff-filter=D 528ede2^ 528ede2`). For each one:
   - Parse the frontmatter (one `key: <JSON>` per line).
   - Map each difference onto the candidate: `blurb` → `blurb`, `date` → `timeline_date`, `factUrl` → `fact_url`, `source` → `source_url`, `source_platform` and `source_engagement` (`null` when absent), `imageAlt` → `image_alt`. Any other key stops the script.
   - Assert that `cardMarkdown(toCard({ ...c, status: <old status> }).frontmatter, <old image file>)` equals the old file. The expected totals are 15 live, 1 held and 25 archived cards changed.
4. Tags: `field` maps as in the spec. The split fields default to `tech` and `sport`. Explicit lists move items to `internet` and `culture`, and every pass-2 candidate gets subject tags by id. `world-event` goes on each item with `impact_score >= 7`, or `impact_score >= 5 && meme_score >= 4`, and on `notre-dame-reopens` and `gamestop-short-squeeze`. A tag outside `SUBJECT_TAGS` and `world-event` stops the script.
5. Write the file with `JSON.stringify(data, null, 2)` and a final newline.

Images: `git show 528ede2^:<path> > research/images/<file>` for each deleted image (`--diff-filter=D -- src/assets/cards`). Then `git mv research/held/<id>.<ext> research/images/`.

- [ ] **Step 1: Write and run the migration script**

Run: `node .superpowers/migrate-candidates.mjs`
Expected: it prints `live 15, held 1, archived 25 changed; 382 candidates, 84 excluded` and exits 0.

- [ ] **Step 2: Move the images and delete the old files**

Expected: `ls research/images | wc -l` is 66 (63 restored and 3 held). `research/held/` and both `world-events.*` files are gone.

- [ ] **Step 3: Run the sync and check the acceptance**

Run: `npm run cards && git status --short src/`
Expected: `written 97, removed 0, fetched 0, failed 0`, and no output from `git status` for `src/`.

- [ ] **Step 4: Check a drop and a re-launch by hand**

Set `flying-cars` to `drop`, then run `npm run cards`. Expected: the card is gone, and `research/images/flying-cars.*` exists. Set it back to `launch` and run the sync again. Expected: `git status --short src/ research/images/` is empty. Repeat the first half with a stray `research/images/flying-cars.png` present. Expected: one `flying-cars.*` file remains.

- [ ] **Step 5: Read the table**

Open `research/candidates.md`. Expected: the counts show 97 launch, 3 hold and 282 drop, and the subject sections look plausible.

- [ ] **Step 6: Commit** — `feat(research): merge every find into one tagged candidates file`

### Task 5: The guard and the e2e route

**Files:**
- Modify: `src/__tests__/content.test.js`
- Modify: `e2e/site.spec.js:9`
- Modify: `src/content.config.js:5` (comment)

**Interfaces:**
- Consumes: `toCard`, `cardMarkdown` from `scripts/lib/candidate.js`, and `research/candidates.json` from Task 4.

- [ ] **Step 1: Write the guard test**

```js
// The cards are generated: research/candidates.json decides, `npm run cards` writes. A hand edit to a card fails here.
test('the cards are exactly the launch candidates, as npm run cards writes them', () => {
  const { candidates } = JSON.parse(readFileSync('research/candidates.json', 'utf8'));
  const assets = readdirSync('src/assets/cards');
  const launch = candidates.filter((c) => c.status === 'launch');
  expect(cards.map(({ f }) => f.replace(/\.md$/, '')).sort()).toEqual(launch.map((c) => c.id).sort());
  for (const c of launch) {
    const image = assets.find((f) => f.replace(/\.[^.]+$/, '') === c.id);
    expect(image, c.id).toBeDefined();
    expect(readFileSync(`${DIR}/${c.id}.md`, 'utf8'), c.id).toBe(cardMarkdown(toCard(c).frontmatter, /** @type {string} */ (image)));
  }
});
```

Update the comment on the third existing test: a card that is not live waits in `research/images/`, not `research/held/`.

- [ ] **Step 2: Run it, then break it once to see it fail**

Run: `npx vitest run src/__tests__/content.test.js` → PASS. Edit one blurb in a card by hand, run again → FAIL naming that id. Undo the edit.

- [ ] **Step 3: Replace the fixed e2e route**

In `e2e/site.spec.js`, the route list uses `/${firstCard}/`, where `firstCard` is the first file name in `readdirSync('src/content/cards')`, sorted, without `.md`.

- [ ] **Step 4: Fix the schema comment**

`src/content.config.js:5` reads: `// Keys match scripts/lib/candidate.js CardFrontmatter. npm run cards writes the cards; nobody edits them by hand.`

- [ ] **Step 5: Run the unit tests and the e2e tests**

Run: `npm test && npm run build && npm run test:e2e`
Expected: PASS.

- [ ] **Step 6: Commit** — `test(cards): fail when the cards and the candidates file disagree`

### Task 6: Docs

**Files:**
- Modify: `AGENTS.md` (commands table, `research/` rule, content rules, the held-card invariant)
- Modify: `deploy/README.md` § Removing or holding a card
- Modify: `docs/superpowers/specs/2026-11-13-beforegta6-design.md` (content model, and the content rules that point to `research/world-events.*`)

Exact AGENTS.md text:
- Commands row: `` `npm run cards` `` — "Make the cards match `research/candidates.json`, and regenerate `research/candidates.md`. Run it after every edit to the JSON." It replaces the `import-cards.js` row.
- `research/` rule: "`research/candidates.json` is the one place to edit cards. It holds every find, and `status: "launch"` puts one on the site. `research/images/` keeps the image of every find that is not live. Neither ships."
- Content rules, first bullet: "The site shows Andrei's picks (Andrei, 2026-11-15). The first picks are the cards on production on 2026-11-15." The politics bullet ends at "are in". The other bullets stay.
- Invariant: "Every card in `src/content/cards/` is live and generated by `npm run cards`. A card that is not live keeps its image in `research/images/`, because Astro ships every imported image."

`deploy/README.md`:
- **Hold or archive:** set `status` to `hold` or `drop`, then run `npm run cards`. The image moves to `research/images/`.
- **Takedown:** set `status: "drop"`, run `npm run cards`, then delete `research/images/<id>.*`, because the repo is public. Merge, release and purge as before.
- **Launch:** set `status: "launch"` and run `npm run cards`. Look at every image that the run lists as fetched.
- The held dates stay: `gta5-farewell-drive` until 2026-11-18; `sex-2` and `durian-condom` until AdSense approves the site.

- [ ] **Step 1: Edit the three files**

- [ ] **Step 2: Search for stale names**

Run: `/usr/bin/grep -rn "import-cards\|research/held\|world-events" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . | /usr/bin/grep -v "docs/superpowers/plans/2026-11-13\|docs/superpowers/specs/2026-11-15"`
Expected: no lines, apart from history in older plan and spec files.

- [ ] **Step 3: Commit** — `docs: describe the one candidates file and npm run cards`

### Task 7: Gate, PR and council

- [ ] **Step 1: Run the verification gate**

Run: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html" && npm run test:e2e`
Expected: every command passes.

- [ ] **Step 2: Push and open the PR to `develop`**, with the council table from both design rounds in the description.

- [ ] **Step 3: Run the council code review** with Claude Opus, Mistral Large 4 and DeepSeek V4.1 Flash, and record the table in the PR description.
