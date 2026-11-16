import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createStore, failure, ID, localImage } from './store.js';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);

/** @param {import('node:http').IncomingMessage} request @param {string} route */
async function bodyOf(request, route) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) throw failure(413, 'Request body too large.');
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw failure(400, 'Invalid JSON.');
  }
  const keys =
    route === '/api/sync'
      ? ['revision']
      : route === '/api/image'
        ? ['id', 'revision']
        : ['id', 'status', 'revision'];
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => !keys.includes(key)) ||
    typeof body.revision !== 'string' ||
    !/^[a-f0-9]{64}$/.test(body.revision) ||
    (route !== '/api/sync' && (typeof body.id !== 'string' || !ID.test(body.id))) ||
    (route === '/api/decision' && !['launch', 'drop'].includes(body.status))
  )
    throw failure(400, 'Invalid decision.');
  return body;
}

/** Factory for fixture roots. The CLI always supplies the repository root.
 * @param {{ root: string, downloadImage?: typeof import('./download.js').downloadImage }} options
 * @returns {import('node:http').Server}
 */
export function createReviewServer({ root, downloadImage }) {
  const store = createStore(resolve(root), downloadImage);
  const token = randomBytes(32).toString('hex');
  const server = createServer(async (request, response) => {
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader(
      'content-security-policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    /** @param {number} status @param {unknown} data */
    const json = (status, data) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(data));
    };
    try {
      const address = server.address();
      const host = `127.0.0.1:${typeof address === 'object' ? address.port : ''}`;
      const origin = `http://${host}`;
      if (
        request.headers.host !== host ||
        (request.headers.origin !== undefined && request.headers.origin !== origin) ||
        request.headers['sec-fetch-site'] === 'cross-site'
      )
        throw failure(403, 'Request refused.');
      const route = request.url;
      if (request.method === 'GET') {
        if (route === '/api/state') return json(200, { ...(await store.state()), token });
        const asset = assets.get(route);
        if (asset) {
          response.setHeader('content-type', asset[1]);
          response.end(await readFile(new URL(asset[0], import.meta.url)));
          return;
        }
        const match = /^\/image\/([a-z0-9-]+)(?:\?revision=[a-f0-9]{64})?$/.exec(route);
        const image = match ? await localImage(root, match[1]) : null;
        if (!image) throw failure(404, 'File not found.');
        response.setHeader('content-type', image.type);
        response.end(await readFile(image.path));
        return;
      }
      if (
        request.method !== 'POST' ||
        !['/api/decision', '/api/sync', '/api/image'].includes(route)
      )
        throw failure(404, 'Route not found.');
      if (
        request.headers.origin !== origin ||
        request.headers['x-review-token'] !== token ||
        request.headers['content-type']?.split(';')[0] !== 'application/json'
      )
        throw failure(403, 'Request refused.');
      const retry = route === '/api/sync';
      const body = await bodyOf(request, route);
      const result =
        route === '/api/image' ? await store.image(body) : await store.change(body, retry);
      json(200, { ...result, token });
    } catch (error) {
      json(error.status || 500, {
        error: error.status
          ? error.message
          : 'Cannot read or save review data. Check the server terminal, then refresh.',
        saved: error.saved || false,
        synced: error.synced || false,
      });
      if (!error.status) console.error(error);
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  return server;
}
