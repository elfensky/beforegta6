import sharp from 'sharp';
import { expect, test } from 'vitest';
import service from '../lib/social-image-service.js';

test('a portrait preview preserves both ends inside a 1200 by 630 canvas', async () => {
  const input = await sharp({
    create: { width: 200, height: 800, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  const { data, format } = await service.transform(input, { socialPreview: true }, {}, console);
  const result = sharp(data);
  expect(format).toBe('jpg');
  expect(await result.metadata()).toMatchObject({ width: 1200, height: 630, format: 'jpeg' });
  const { data: pixels, info } = await result.raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [
    ...pixels.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3),
  ];
  for (const y of [5, 625]) {
    expect(pixel(600, y)[0]).toBeGreaterThan(245);
    expect(pixel(600, y)[1]).toBeLessThan(10);
  }
  expect(pixel(5, 315)[0]).toBeLessThan(30);
});

test('ordinary page image transformations keep their original behavior', async () => {
  const input = await sharp({
    create: { width: 200, height: 800, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  const { data } = await service.transform(
    input,
    { src: '/image.png', width: 100, format: 'webp' },
    { service: { config: {} } },
    console,
  );
  expect(await sharp(data).metadata()).toMatchObject({ width: 100, height: 400, format: 'webp' });
});

test('the development image URL preserves the social transform and its cache key', () => {
  expect(service.propertiesToHash).toContain('socialPreview');
  const options = service.parseURL(
    new URL('http://localhost/_image?href=/image.png&w=1200&h=630&f=jpg&socialPreview=v1'),
    {},
  );
  expect(options.socialPreview).toBe('v1');
  expect(
    service.parseURL(new URL('http://localhost/_image?href=/image.png&w=400&f=webp'), {})
      .socialPreview,
  ).toBeUndefined();
});
