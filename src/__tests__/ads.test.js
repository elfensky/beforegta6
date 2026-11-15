import { expect, test } from 'vitest';
import { withAdSlots } from '../lib/ads.js';

/** @param {number} n */
const items = (n) => Array.from({ length: n }, (_, i) => i);
/** @param {import('../lib/ads.js').Slot<number>[]} slots */
const ads = (slots) => slots.flatMap((s, i) => (s.kind === 'ad' ? [[i, s.desktop]] : []));

// One-line rows: about one ad per screen means one slot per 10 entries on phones, per 20 on desktop.
test('40 items: a mobile slot every 10, a desktop slot every 20, none at the end', () => {
  expect(ads(withAdSlots(items(40)))).toEqual([
    [10, false],
    [21, true],
    [32, false],
  ]);
});
test('20 items: no trailing slot', () => {
  expect(ads(withAdSlots(items(20)))).toEqual([[10, false]]);
});
test('9 items: no slot', () => {
  expect(ads(withAdSlots(items(9)))).toEqual([]);
});
test('items keep their order', () => {
  const slots = withAdSlots(items(9));
  expect(slots.flatMap((s) => (s.kind === 'item' ? [s.item] : []))).toEqual(items(9));
});
