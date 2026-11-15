import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { cardMarkdown, toCard } from '../../scripts/lib/candidate.js';

const DIR = 'src/content/cards';
const cards = readdirSync(DIR).map((f) => ({ f, text: readFileSync(`${DIR}/${f}`, 'utf8') }));

// Visitors read blurbs in the grid, on card pages and in link previews; research notes must not reach them.
test('no research notes in blurbs', () => {
  const leaks = cards.filter(({ text }) =>
    /^blurb:.*(not inspected|not verified|unverified|image_note|TODO)/im.test(text),
  );
  expect(leaks.map((c) => c.f)).toEqual([]);
});

// Cards show the engagement text as it is; a research note in brackets ("read 2026-11-14") must stay in research/.
test('no research notes in engagement', () => {
  const leaks = cards.filter(({ text }) => /"engagement":"[^"]*[()]/.test(text));
  expect(leaks.map((c) => c.f)).toEqual([]);
});

// Astro ships the original of every image the collection imports, linked or not. The image of a card that is not
// live waits in research/images/ (or is deleted), so it never reaches the site.
test('every card in the collection is launched', () => {
  const notLive = cards.filter(({ text }) => !/^status: "launch"$/m.test(text));
  expect(notLive.map((c) => c.f)).toEqual([]);
});

// The cards are generated: research/candidates.json decides, `npm run cards` writes. A hand edit to a card fails here.
test('the cards are exactly the launch candidates, as npm run cards writes them', () => {
  /** @type {{ candidates: import('../../scripts/lib/candidate.js').Candidate[] }} */
  const { candidates } = JSON.parse(readFileSync('research/candidates.json', 'utf8'));
  const assets = readdirSync('src/assets/cards');
  const launch = candidates.filter((c) => c.status === 'launch');
  expect(cards.map(({ f }) => f.replace(/\.md$/, '')).sort()).toEqual(
    launch.map((c) => c.id).sort(),
  );
  for (const c of launch) {
    const image = assets.find((f) => f.replace(/\.[^.]+$/, '') === c.id);
    expect(image, c.id).toBeDefined();
    expect(readFileSync(`${DIR}/${c.id}.md`, 'utf8'), c.id).toBe(
      cardMarkdown(toCard(c).frontmatter, /** @type {string} */ (image)),
    );
  }
});
