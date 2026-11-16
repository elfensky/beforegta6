import { expect, test } from 'vitest';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createStore } from '../../scripts/review/store.js';
import { reviewFixture } from './review-fixture.js';

test('reaffirming a decision invalidates older views even when JSON content is unchanged', async () => {
  const { root } = await reviewFixture();
  try {
    const store = createStore(root);
    const before = await store.state();
    const saved = await store.change({ id: 'first', status: 'drop', revision: before.revision });
    expect(saved.revision).not.toBe(before.revision);
    await expect(
      store.change({ id: 'first', status: 'launch', revision: before.revision }),
    ).rejects.toMatchObject({ status: 409 });
    await writeFile(join(root, 'research/.review-pending'), 'Interrupted synchronization.');
    expect((await createStore(root).state()).syncError).toBe('Interrupted synchronization.');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
