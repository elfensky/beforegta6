import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { imageExtension } from '../lib/candidate.js';

/** Reject private, reserved, documentation, and address-transition destinations.
 * @param {string} address
 */
export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  if (isIP(address) !== 6) return false;
  const [first, second = '0'] = address.toLowerCase().split(':');
  const prefix = parseInt(first, 16);
  const next = parseInt(second || '0', 16);
  return (
    prefix >= 0x2000 &&
    prefix <= 0x3fff &&
    !(prefix === 0x2001 && (next < 0x200 || next === 0xdb8)) &&
    prefix !== 0x2002 &&
    prefix !== 0x3ffe &&
    !(prefix === 0x3fff && next < 0x1000)
  );
}

/** @typedef {{ address: string, family: number }} Address */
/** @param {string} host @returns {Promise<Address[]>} */
const resolveHost = (host) => lookup(host, { all: true, verbatim: true });

/** Resolve once and retain the public destination for the actual socket.
 * @param {string} input @param {(host: string) => Promise<Address[]>} [resolver]
 */
export async function imageTarget(input, resolver = resolveHost) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Image URLs must use HTTP(S) without credentials.');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const family = isIP(hostname);
  const addresses = family ? [{ address: hostname, family }] : await resolver(hostname);
  if (!addresses.length || addresses.some((item) => !isPublicAddress(item.address)))
    throw new Error('Image URLs must resolve only to public addresses.');
  return { url, ...addresses[0] };
}

/** The socket uses the address already validated, preventing a second DNS lookup.
 * @param {{ url: URL, address: string, family: number }} target @param {AbortSignal} signal
 * @returns {Promise<import('node:http').IncomingMessage>}
 */
function requestPinned(target, signal) {
  return new Promise((resolve, reject) => {
    const request = (target.url.protocol === 'https:' ? httpsRequest : httpRequest)(
      target.url,
      {
        signal,
        agent: false,
        family: target.family,
        lookup: (_hostname, _options, callback) => callback(null, target.address, target.family),
        headers: { 'user-agent': 'beforegta6-local-review' },
      },
      resolve,
    );
    request.on('error', reject);
    request.end();
  });
}

/** A user-requested image only: 15 seconds, 10 MiB, and at most three validated redirects.
 * @param {string} input
 * @param {{ resolver?: typeof resolveHost, request?: typeof requestPinned }} [options]
 * @returns {Promise<{ bytes: Buffer, extension: string }>}
 */
export async function downloadImage(
  input,
  { resolver = resolveHost, request = requestPinned } = {},
) {
  const signal = AbortSignal.timeout(15000);
  let rejectTimeout;
  const timeout = new Promise((_, reject) => {
    rejectTimeout = reject;
  });
  const onAbort = () => rejectTimeout(new Error('Image download timed out after 15 seconds.'));
  signal.addEventListener('abort', onAbort, { once: true });
  async function download() {
    let current = input;
    for (let redirects = 0; redirects <= 3; redirects++) {
      const target = await imageTarget(current, resolver);
      signal.throwIfAborted();
      const response = await request(target, signal);
      try {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          if (redirects === 3 || !response.headers.location)
            throw new Error('Too many or invalid image redirects.');
          current = new URL(response.headers.location, target.url).href;
          continue;
        }
        const extension = imageExtension(response.headers['content-type'] ?? null);
        if (response.statusCode !== 200 || !extension)
          throw new Error('The response is not a supported image.');
        const limit = 10 * 1024 * 1024;
        if (Number(response.headers['content-length']) > limit)
          throw new Error('Image is too large (10 MiB maximum).');
        let size = 0;
        const chunks = [];
        for await (const chunk of response) {
          signal.throwIfAborted();
          size += chunk.length;
          if (size > limit) throw new Error('Image is too large (10 MiB maximum).');
          chunks.push(chunk);
        }
        if (!size) throw new Error('The image response is empty.');
        return { bytes: Buffer.concat(chunks), extension };
      } finally {
        response.destroy();
      }
    }
    throw new Error('Too many image redirects.');
  }
  try {
    return await Promise.race([download(), timeout]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}
