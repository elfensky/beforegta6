import { expect, test } from 'vitest';
import { withAdSlots } from '../lib/ads.js';

/** @param {number} n */
const items = (n) => Array.from({ length: n }, (_, i) => i);
/** @param {import('../lib/ads.js').Slot<number>[]} slots */
const ads = (slots) => slots.flatMap((s, i) => (s.kind === 'ad' ? [[i, s.desktop]] : []));

test('20 items: a mobile slot every 4, a desktop slot every 8, none at the end', () => {
  expect(ads(withAdSlots(items(20)))).toEqual([
    [4, false],
    [9, true],
    [14, false],
    [19, true],
  ]);
});
test('8 items: no trailing slot', () => {
  expect(ads(withAdSlots(items(8)))).toEqual([[4, false]]);
});
test('3 items: no slot', () => {
  expect(ads(withAdSlots(items(3)))).toEqual([]);
});
test('items keep their order', () => {
  const slots = withAdSlots(items(9));
  expect(slots.flatMap((s) => (s.kind === 'item' ? [s.item] : []))).toEqual(items(9));
});
