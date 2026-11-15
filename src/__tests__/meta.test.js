import { expect, test } from 'vitest';
import { pageTitle } from '../lib/meta.js';

test('short title keeps the site suffix', () => {
  expect(pageTitle('We got a new Pope before GTA 6')).toBe(
    'We got a new Pope before GTA 6 · beforegta6.wtf',
  );
});
test('a title that only fits without the suffix drops it', () => {
  const t = 'We got ChatGPT turning GTA 5 characters into real people before GTA 6';
  expect(t.length).toBeLessThanOrEqual(70);
  expect(pageTitle(t)).toBe(t);
});
test('an apostrophe counts as its HTML escape', () => {
  const t = "We got Messi's first World Cup hat-trick before GTA 6";
  expect((t + ' · beforegta6.wtf').length).toBe(70);
  expect(pageTitle(t)).toBe(t);
  expect(pageTitle(`${"'".repeat(20)}x`)).toBe(`${"'".repeat(13)}…`);
});
test('a title over 70 characters is cut with an ellipsis', () => {
  const t = 'x'.repeat(90);
  expect(pageTitle(t)).toHaveLength(70);
  expect(pageTitle(t).endsWith('…')).toBe(true);
});
