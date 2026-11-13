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
test('a title over 70 characters is cut with an ellipsis', () => {
  const t = 'x'.repeat(90);
  expect(pageTitle(t)).toHaveLength(70);
  expect(pageTitle(t).endsWith('…')).toBe(true);
});
