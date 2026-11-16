import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, rename, rm, lstat, realpath, link, open } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCandidates } from '../lib/candidate.js';
import { downloadImage } from './download.js';

const exec = promisify(execFile);
const syncScript = fileURLToPath(new URL('../sync-cards.js', import.meta.url));
export const ID = /^[a-z0-9-]+$/;
const extensions = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};
/** @typedef {{ id?: string, status?: string, revision: string }} Decision */

/** @param {number} status @param {string} message */
export function failure(status, message) {
  return Object.assign(new Error(message), { status });
}

/** Locate a regular image inside its fixed local directory.
 * @param {string} root @param {string} id
 */
export async function localImage(root, id) {
  if (!ID.test(id)) return null;
  for (const folder of ['src/assets/cards', 'research/images']) {
    const directory = resolve(await realpath(root), folder);
    for (const [extension, type] of Object.entries(extensions)) {
      const path = join(directory, `${id}.${extension}`);
      try {
        const stat = await lstat(path);
        if (stat.isFile() && !stat.isSymbolicLink() && dirname(await realpath(path)) === directory)
          return { path, type };
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  return null;
}

/** @param {string} root */
async function read(root) {
  const file = await open(join(root, 'research/candidates.json'), 'r');
  let text;
  let identity;
  try {
    text = await file.readFile('utf8');
    const stat = await file.stat({ bigint: true });
    identity = `${stat.dev}:${stat.ino}:${stat.mtimeNs}:${stat.ctimeNs}`;
  } finally {
    await file.close();
  }
  const data = JSON.parse(text);
  if (
    !Array.isArray(data.candidates) ||
    !Array.isArray(data.passes) ||
    !Array.isArray(data.excluded)
  )
    throw failure(422, 'The research file has an invalid structure.');
  return {
    data,
    revision: createHash('sha256')
      .update(text)
      .update('\0' + identity)
      .digest('hex'),
  };
}

/** @param {string} root */
async function syncError(root) {
  try {
    return await readFile(join(root, 'research/.review-pending'), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

/** @param {string} root */
async function state(root) {
  const { data, revision } = await read(root);
  return {
    revision,
    candidates: await Promise.all(
      data.candidates
        .filter((c) => c.status !== 'hold')
        .map(async (c) => ({
          ...c,
          image: (await localImage(root, c.id)) ? `/image/${c.id}` : null,
        })),
    ),
    protectedCount: data.candidates.filter((c) => c.status === 'hold').length,
    syncError: await syncError(root),
  };
}

/** @param {string} root @param {import('../lib/candidate.js').ResearchFile} data */
async function preflight(root, data) {
  const errors = checkCandidates(data.candidates);
  if (errors.length) throw failure(422, errors.join('\n'));
  for (const item of data.candidates.filter((c) => c.status === 'launch')) {
    if (!(await localImage(root, item.id))) throw failure(422, `${item.id}: local image missing.`);
  }
}

/** @param {string} root */
async function sync(root) {
  try {
    await preflight(root, (await read(root)).data);
    await exec(process.execPath, [syncScript], {
      cwd: root,
      timeout: 60000,
      maxBuffer: 1024 * 1024,
    });
    await rm(join(root, 'research/.review-pending'), { force: true });
  } catch (error) {
    console.error(error.stderr || error.stdout || error.message);
    throw Object.assign(
      failure(
        500,
        'Decision saved. Card synchronization failed. Check the server terminal, fix the problem, then retry synchronization.',
      ),
      { saved: true, synced: false },
    );
  }
  return { ...(await state(root)), saved: true, synced: true };
}

/** @param {string} root @param {Decision} body @param {boolean} retry */
async function change(root, body, retry) {
  const { data, revision } = await read(root);
  if (body.revision !== revision)
    throw failure(409, 'The research file changed. Refresh before deciding again.');
  if (retry) return sync(root);
  if (await syncError(root)) throw failure(409, 'Retry synchronization before another decision.');
  const candidate = data.candidates.find((c) => c.id === body.id);
  if (!candidate) throw failure(404, 'Candidate not found.');
  if (candidate.status === 'hold') throw failure(422, 'This candidate has a protected hold.');
  candidate.status = body.status;
  await preflight(root, data);
  const path = join(root, 'research/candidates.json');
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
    if ((await read(root)).revision !== revision)
      throw failure(409, 'The research file changed. Refresh before deciding again.');
    // The durable marker preserves interrupted synchronization across server restarts.
    await writeFile(
      join(root, 'research/.review-pending'),
      'Card synchronization is incomplete. Retry synchronization.',
    );
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return sync(root);
}

/** @param {string} root @param {Decision} body @param {typeof downloadImage} downloader */
async function fetchImage(root, body, downloader) {
  const { data, revision } = await read(root);
  if (body.revision !== revision)
    throw failure(409, 'The research file changed. Refresh before fetching an image.');
  const candidate = data.candidates.find((c) => c.id === body.id);
  if (!candidate) throw failure(404, 'Candidate not found.');
  if (candidate.status === 'hold') throw failure(422, 'This candidate has a protected hold.');
  if (await localImage(root, candidate.id)) return state(root);
  if (!candidate.image_url) throw failure(422, 'No image URL. Save a local image manually.');
  let image;
  try {
    image = await downloader(candidate.image_url);
  } catch (error) {
    throw failure(422, `Image download failed: ${error.message}`);
  }
  if ((await read(root)).revision !== revision)
    throw failure(
      409,
      'The research file changed during the download. Refresh before fetching again.',
    );
  if (!['png', 'jpg', 'webp', 'gif'].includes(image.extension))
    throw failure(422, 'Unsupported image type.');
  const path = join(root, `research/images/${candidate.id}.${image.extension}`);
  const temporary = join(root, `research/images/.review-${randomUUID()}`);
  try {
    await writeFile(temporary, image.bytes, { flag: 'wx' });
    // Expose only complete bytes. Exclusive linking preserves an image saved by an external editor.
    await link(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return state(root);
}

/** Serialized file access. The downloader boundary permits isolated network tests.
 * @param {string} root @param {typeof downloadImage} [downloader]
 */
export function createStore(root, downloader = downloadImage) {
  let queue = Promise.resolve();
  /** @template T @param {() => Promise<T>} operation @returns {Promise<T>} */
  function serialize(operation) {
    const result = queue.then(operation);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  return {
    state: () => serialize(() => state(root)),
    change: (body, retry = false) => serialize(() => change(root, body, retry)),
    image: (body) => serialize(() => fetchImage(root, body, downloader)),
  };
}
