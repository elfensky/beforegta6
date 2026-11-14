import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

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

// Astro ships the original of every image the collection imports, linked or not. A card that is not live waits
// in research/held/ (or is deleted), so its image never reaches the site.
test('every card in the collection is launched', () => {
  const notLive = cards.filter(({ text }) => !/^status: "launch"$/m.test(text));
  expect(notLive.map((c) => c.f)).toEqual([]);
});
