import { expect, test } from 'vitest';

// A vitest run with no test files exits 1, so CI needs one test from the first commit.
test('smoke', () => {
  expect(1 + 1).toBe(2);
});
