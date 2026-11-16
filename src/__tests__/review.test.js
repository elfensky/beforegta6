import { afterEach, expect, test } from 'vitest';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { createReviewServer } from '../../scripts/review/server.js';
import { reviewFixture } from './review-fixture.js';

const cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

// Native HTTP preserves a forged Host header; fetch replaces it in Node 26.
function rawFetch(url, options) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(url, options, async (response) => {
      const chunks = [];
      for await (const chunk of response) chunks.push(chunk);
      resolve(new Response(Buffer.concat(chunks), { status: response.statusCode }));
    });
    request.on('error', reject);
    request.end(options.body);
  });
}

async function setup(options = {}) {
  const fixture = await reviewFixture();
  cleanups.push(() => rm(fixture.root, { recursive: true, force: true }));
  const server = createReviewServer({ root: fixture.root, ...options });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  cleanups.push(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  const state = await (await fetch(origin + '/api/state')).json();
  const post = (body, headers = {}, path = '/api/decision') =>
    (headers.host ? rawFetch : fetch)(origin + path, {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        'x-review-token': state.token,
        ...headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  const decide = (id, status, revision = state.revision) => post({ id, status, revision });
  return { ...fixture, state, origin, post, decide };
}

test('a cross-site navigation can open the page without exposing the API to cross-site reads', async () => {
  const { origin } = await setup();
  const headers = {
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document',
  };
  expect((await rawFetch(origin + '/', { headers })).status).toBe(200);
  expect((await rawFetch(origin + '/api/state', { headers })).status).toBe(403);
  expect(
    (await rawFetch(origin + '/', { headers: { ...headers, 'sec-fetch-mode': 'cors' } })).status,
  ).toBe(403);
});

test('an explicit image fetch preserves selections and makes a preview available before launch', async () => {
  const urls = [];
  const { root, data, post, decide, origin } = await setup({
    downloadImage: async (url) => {
      urls.push(url);
      return { extension: 'png', bytes: Buffer.from('fixture image') };
    },
  });
  await rm(join(root, 'research/images/first.png'));
  data.candidates[0].image_url = 'https://images.example/first.png';
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  const state = await (await fetch(origin + '/api/state')).json();
  const response = await post({ id: 'first', revision: state.revision }, {}, '/api/image');
  expect(response.status).toBe(200);
  expect(urls).toEqual(['https://images.example/first.png']);
  const ready = await response.json();
  expect(ready.candidates[0].image).toBe('/image/first');
  expect(await readFile(join(root, 'research/images/first.png'), 'utf8')).toBe('fixture image');
  expect(JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8'))).toEqual(data);
  expect((await decide('first', 'launch', ready.revision)).status).toBe(200);
});

test('failed, protected, and stale image requests cannot save an image or a choice', async () => {
  const { root, data, post, origin } = await setup({
    downloadImage: async () => {
      throw new Error('Image unavailable.');
    },
  });
  await rm(join(root, 'research/images/first.png'));
  data.candidates[0].image_url = 'https://images.example/first.png';
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  const state = await (await fetch(origin + '/api/state')).json();
  expect((await post({ id: 'first', revision: state.revision }, {}, '/api/image')).status).toBe(
    422,
  );
  expect((await post({ id: 'protected', revision: state.revision }, {}, '/api/image')).status).toBe(
    422,
  );
  expect((await post({ id: 'first', revision: 'a'.repeat(64) }, {}, '/api/image')).status).toBe(
    409,
  );
  expect(
    (
      await post(
        { id: 'first', revision: state.revision },
        { origin: 'https://evil.example' },
        '/api/image',
      )
    ).status,
  ).toBe(403);
  await expect(readFile(join(root, 'research/images/first.png'))).rejects.toThrow();
  expect(JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8'))).toEqual(data);
});

test('a decision preserves all fields, runs card sync, and permits correction', async () => {
  const { root, data, decide, state } = await setup();
  expect(state.candidates.map((c) => c.id)).toEqual(['first', 'second']);
  expect(state.protectedCount).toBe(1);
  const response = await decide('first', 'launch');
  expect(response.status).toBe(200);
  const saved = await response.json();
  const actual = JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8'));
  data.candidates[0].status = 'launch';
  expect(actual).toEqual(data);
  expect(await readFile(join(root, 'src/content/cards/first.md'), 'utf8')).toContain(
    'status: "launch"',
  );
  expect(await readFile(join(root, 'research/candidates.md'), 'utf8')).toContain('| launch |');
  expect((await decide('first', 'drop', saved.revision)).status).toBe(200);
  await expect(readFile(join(root, 'src/content/cards/first.md'))).rejects.toThrow();
  expect(await readFile(join(root, 'research/images/first.png'))).toBeInstanceOf(Buffer);
});

test('hold protection, missing local images, and invalid launch metadata preserve the file', async () => {
  const { root, decide } = await setup();
  const before = await readFile(join(root, 'research/candidates.json'), 'utf8');
  expect((await decide('protected', 'drop')).status).toBe(422);
  expect((await decide('protected', 'launch')).status).toBe(422);
  await rm(join(root, 'research/images/first.png'));
  const missing = await decide('first', 'launch');
  expect(missing.status).toBe(422);
  expect((await missing.json()).error).toMatch(/local image/i);
  expect(await readFile(join(root, 'research/candidates.json'), 'utf8')).toBe(before);
});

test('invalid metadata cannot become a launch card', async () => {
  const { root, data, origin, decide } = await setup();
  data.candidates[0].source_url = null;
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  const fresh = await (await fetch(origin + '/api/state')).json();
  expect((await decide('first', 'launch', fresh.revision)).status).toBe(422);
  expect(JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8'))).toEqual(data);
});

test('concurrent decisions and external edits reject stale revisions', async () => {
  const { decide, root, data } = await setup();
  const responses = await Promise.all([decide('first', 'launch'), decide('second', 'launch')]);
  expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  data.candidates[0].blurb = 'An external edit.';
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  expect((await decide('first', 'launch')).status).toBe(409);
  expect(JSON.parse(await readFile(join(root, 'research/candidates.json'), 'utf8'))).toEqual(data);
});

test('sync failure reports the saved decision and a retry repairs generated files', async () => {
  const { root, decide, post, origin } = await setup();
  await mkdir(join(root, 'research/candidates.md'));
  const response = await decide('first', 'launch');
  expect(response.status).toBe(500);
  expect(await response.json()).toMatchObject({ saved: true, synced: false });
  const state = await (await fetch(origin + '/api/state')).json();
  expect(state.syncError).toBeTruthy();
  expect(state.candidates[0].status).toBe('launch');
  expect((await decide('second', 'launch', state.revision)).status).toBe(409);
  await rm(join(root, 'research/candidates.md'), { recursive: true });
  const retry = await post({ revision: state.revision }, {}, '/api/sync');
  expect(retry.status).toBe(200);
  expect((await retry.json()).syncError).toBeNull();
  expect(await readFile(join(root, 'research/candidates.md'), 'utf8')).toContain('| launch |');
});

test('synchronization retry refuses a new launch image URL instead of invoking the old downloader', async () => {
  const { root, data, post, origin } = await setup();
  data.candidates[0].status = 'launch';
  data.candidates[0].image_url = `${origin}/image/second`;
  await rm(join(root, 'research/images/first.png'));
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data));
  await writeFile(join(root, 'research/.review-pending'), 'Interrupted synchronization.');
  const fresh = await (await fetch(origin + '/api/state')).json();
  expect((await post({ revision: fresh.revision }, {}, '/api/sync')).status).toBe(500);
  await expect(readFile(join(root, 'src/assets/cards/first.png'))).rejects.toThrow();
  await expect(readFile(join(root, 'src/content/cards/first.md'))).rejects.toThrow();
});

test('foreign origins, forged hosts, missing tokens, and malformed bodies cannot write', async () => {
  const { root, post, state } = await setup();
  const body = { id: 'first', status: 'launch', revision: state.revision };
  const before = await readFile(join(root, 'research/candidates.json'), 'utf8');
  for (const headers of [
    { origin: 'https://evil.example' },
    { origin: 'null' },
    { host: 'evil.example' },
    { 'x-review-token': '' },
    { 'content-type': 'text/plain' },
  ])
    expect((await post(body, headers)).status).toBe(403);
  expect((await post('{')).status).toBe(400);
  expect((await post('x'.repeat(5000))).status).toBe(413);
  for (const change of [{ status: 'hold' }, { id: '../first' }, { surprise: true }])
    expect((await post({ ...body, ...change })).status).toBe(400);
  expect(await readFile(join(root, 'research/candidates.json'), 'utf8')).toBe(before);
});

test('file routes cannot expose research data, traverse directories, or follow image symlinks', async () => {
  const { root, origin } = await setup();
  for (const path of [
    '/research/candidates.json',
    '/api/../candidates.json',
    '/image/..%2Ffirst',
    '/image/first.png',
    '/server.js',
  ])
    expect((await fetch(origin + path)).status).toBe(404);
  await rm(join(root, 'research/images/first.png'));
  await symlink(join(root, 'research/candidates.json'), join(root, 'research/images/first.png'));
  expect((await fetch(origin + '/image/first')).status).toBe(404);
  const page = await fetch(origin);
  expect(page.headers.get('content-security-policy')).toContain("default-src 'self'");
  expect(page.headers.get('cache-control')).toBe('no-store');
  expect((await rawFetch(origin, { headers: { host: 'evil.example' } })).status).toBe(403);
});
