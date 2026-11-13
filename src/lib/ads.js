/**
 * @template T
 * @typedef {{ kind: 'item', item: T } | { kind: 'ad', desktop: boolean }} Slot
 */

/**
 * Interleave ad slots: one after every `every` items, never after the last item. Every `desktopEvery`-th position is a
 * desktop slot; the others show on narrow screens only (CSS hides them from 960 px), so desktop sees one per
 * `desktopEvery` items.
 * @template T
 * @param {T[]} items
 * @param {{ every?: number, desktopEvery?: number }} [opts]
 * @returns {Slot<T>[]}
 */
export function withAdSlots(items, { every = 4, desktopEvery = 8 } = {}) {
  /** @type {Slot<T>[]} */
  const slots = [];
  items.forEach((item, i) => {
    slots.push({ kind: 'item', item });
    const n = i + 1;
    if (n % every === 0 && n < items.length)
      slots.push({ kind: 'ad', desktop: n % desktopEvery === 0 });
  });
  return slots;
}
