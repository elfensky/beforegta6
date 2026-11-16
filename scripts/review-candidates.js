import { fileURLToPath } from 'node:url';
import { createReviewServer } from './review/server.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = createReviewServer({ root });
server.on('error', (error) => {
  console.error(`Cannot start candidate review: ${error.message}`);
  process.exitCode = 1;
});
server.listen(4322, '127.0.0.1', () => {
  console.log('Candidate review: http://127.0.0.1:4322/');
  console.log('Decisions update local files. Publishing follows the normal release process.');
});
