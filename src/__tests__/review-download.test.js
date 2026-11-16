import { expect, test } from 'vitest';
import { isPublicAddress, imageTarget, downloadImage } from '../../scripts/review/download.js';

test('image destinations exclude local, private, mapped, and transition addresses', () => {
  for (const address of [
    '127.0.0.1',
    '10.0.0.1',
    '172.16.2.3',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.1.2.3',
    '198.18.0.1',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '64:ff9b::a00:1',
    '2002:7f00:1::',
    '2001::1',
    '2001:db8::1',
    '3fff::1',
    '192.88.99.1',
    '3ffe::1',
  ])
    expect(isPublicAddress(address), address).toBe(false);
  for (const address of [
    '93.184.216.34',
    '1.1.1.1',
    '2606:4700:4700::1111',
    '2001:4860:4860::8888',
  ])
    expect(isPublicAddress(address), address).toBe(true);
});

test('image downloads time out even when DNS never completes', async () => {
  await expect(
    downloadImage('https://example.com/a', {
      resolver: () => new Promise(() => {}),
    }),
  ).rejects.toThrow(/timed out/i);
}, 20000);

test('URL validation rejects credentials, unsupported schemes, and private DNS answers', async () => {
  const resolver = async () => [{ address: '93.184.216.34', family: 4 }];
  for (const url of [
    'file:///etc/passwd',
    'https://user:pass@example.com/a',
    'http://127.1/a',
    'http://[::1]/a',
  ])
    await expect(imageTarget(url, resolver)).rejects.toThrow();
  await expect(
    imageTarget('https://example.com/a', async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '192.168.1.1', family: 4 },
    ]),
  ).rejects.toThrow(/public/i);
  expect(await imageTarget('https://example.com/a', resolver)).toMatchObject({
    address: '93.184.216.34',
    family: 4,
  });
});

test('the downloader validates redirects, limits bytes, and rejects non-image responses', async () => {
  const resolver = async () => [{ address: '93.184.216.34', family: 4 }];
  // Only the network boundary is replaced; URL validation and streaming limits remain real.
  const response = (status, headers, chunks = []) =>
    Object.assign(
      (async function* () {
        for (const chunk of chunks) yield Buffer.from(chunk);
      })(),
      { statusCode: status, headers, destroy() {} },
    );
  const request = async () => response(302, { location: 'http://127.0.0.1/private' });
  await expect(downloadImage('https://example.com/a', { resolver, request })).rejects.toThrow(
    /public/i,
  );
  await expect(
    downloadImage('https://example.com/a', {
      resolver,
      request: async () => response(200, { 'content-type': 'text/html' }, ['bad']),
    }),
  ).rejects.toThrow(/image/i);
  await expect(
    downloadImage('https://example.com/a', {
      resolver,
      request: async () =>
        response(200, { 'content-type': 'image/png' }, [Buffer.alloc(10 * 1024 * 1024 + 1)]),
    }),
  ).rejects.toThrow(/large/i);
  const downloaded = await downloadImage('https://example.com/a', {
    resolver,
    request: async () => response(200, { 'content-type': 'image/png' }, ['image bytes']),
  });
  expect(downloaded).toEqual({ extension: 'png', bytes: Buffer.from('image bytes') });
});
