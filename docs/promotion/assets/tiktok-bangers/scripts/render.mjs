import { bundle } from '@remotion/bundler';
import { openBrowser, renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(await fs.readFile(path.join(dir, 'timing.json'), 'utf8'));
const output = path.join(dir, timing.outputDirectory);
await fs.mkdir(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(dir, 'src/index.jsx'),
  publicDir: path.join(dir, 'public'),
  outDir: path.join(dir, 'node_modules/.cache/remotion-bundle'),
});
const puppeteerInstance = await openBrowser('chrome', {
  browserExecutable: chromium.executablePath(),
  chromeMode: 'chrome-for-testing',
});
const options = {
  serveUrl,
  puppeteerInstance,
  browserExecutable: chromium.executablePath(),
  chromeMode: 'chrome-for-testing',
};
try {
  const composition = await selectComposition({ ...options, id: 'Bangers' });
  if (process.argv.includes('--stills')) {
    for (const frame of [0, 25, 75, 104, 166, 234, 281, 318, 408]) {
      await renderStill({
        ...options,
        composition,
        frame,
        output: path.join(output, `frame-${frame}.png`),
        imageFormat: 'png',
      });
      console.log(`Still ${frame}`);
    }
  } else {
    let last = -1;
    await renderMedia({
      ...options,
      composition,
      codec: 'h264',
      crf: 17,
      pixelFormat: 'yuv420p',
      concurrency: 1,
      outputLocation: path.join(output, 'picture.mp4'),
      onProgress: ({ progress }) => {
        const tenth = Math.floor(progress * 10);
        if (tenth !== last) {
          console.log(`Render ${tenth * 10}%`);
          last = tenth;
        }
      },
    });
    console.log('Picture rendered. Run scripts/mix.mjs to create the review MP4.');
  }
} finally {
  await puppeteerInstance.close({ silent: true });
}
