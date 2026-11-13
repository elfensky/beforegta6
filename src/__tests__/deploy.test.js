import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// A rebase or squash release carries the pin commit to the tip of main; with [skip ci] there, the push to main
// builds nothing and production silently keeps its old image.
test('the CI pin commit does not carry [skip ci]', () => {
  expect(readFileSync('scripts/pin-image.sh', 'utf8')).not.toMatch(/\[skip ci\]/);
});
