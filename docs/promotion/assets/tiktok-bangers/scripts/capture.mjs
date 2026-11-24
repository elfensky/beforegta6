import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(dir, '../../../..');
const dist = path.join(root, 'dist');
const browser = await chromium.launch({ headless: true });
const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
try {
  const page = await browser.newPage({
    viewport: { width: 540, height: 5400 },
    deviceScaleFactor: 2,
  });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== 'https://capture.beforegta6.local') return route.abort();
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) return route.abort();
    try {
      await route.fulfill({
        body: await fs.readFile(file),
        contentType: mime[path.extname(file)] ?? 'application/octet-stream',
      });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
  async function ready() {
    await page.evaluate(async () => {
      const images = [...document.images];
      images.forEach((img) => {
        img.loading = 'eager';
      });
      await Promise.all(images.slice(0, 30).map((img) => img.decode()));
      await document.fonts.ready;
    });
  }
  await page.goto('https://capture.beforegta6.local/', { waitUntil: 'networkidle' });
  await ready();
  const shot = path.join(dir, 'public/website-scroll.png');
  await page.screenshot({ path: shot });
  const size = await sharp(shot).metadata();
  if (size.width !== 1080 || size.height !== 10800)
    throw new Error('Website screenshot dimensions are incorrect.');
  await page.setViewportSize({ width: 540, height: 1200 });
  for (const slug of ['flying-cars', 'blue-texas', 'kitkat-heist']) {
    await page.goto(`https://capture.beforegta6.local/${slug}/`, { waitUntil: 'networkidle' });
    await ready();
    await page
      .locator('article.card')
      .screenshot({ path: path.join(dir, `public/card-${slug}.png`) });
  }
  console.log(
    'Captured actual homepage at 1080 × 10800 and three actual card pages. External requests blocked.',
  );
} finally {
  await browser.close();
}
