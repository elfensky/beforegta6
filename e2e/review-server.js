import { rm } from 'node:fs/promises';
import { createReviewServer } from '../scripts/review/server.js';
import { reviewFixture } from '../src/__tests__/review-fixture.js';

const { root } = await reviewFixture();
const server = createReviewServer({ root });
server.listen(4322, '127.0.0.1');
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(async () => {
      await rm(root, { recursive: true, force: true });
      process.exit(0);
    });
    server.closeAllConnections();
  });
}
