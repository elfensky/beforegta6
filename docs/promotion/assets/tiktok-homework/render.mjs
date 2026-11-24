import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
const cache = path.join(dir, '.render-cache');
const fps = 30;
const lines = [
  'I started fact-checking the before GTA six meme.',
  "Google's AI suggested glue on pizza.",
  'America put tariffs on islands full of penguins.',
  'Katy Perry went to space.',
  'Anyway, I accidentally made a history website.',
];

function run(command, args) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  });
}

function duration(file) {
  const result = Number(
    run('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nw=1:nk=1',
      file,
    ]).trim(),
  );
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error(`Invalid audio duration: ${file}`);
  }
  return result;
}

async function prepareNarration() {
  const scenes = [];
  let start = 0;
  for (const [index, text] of lines.entries()) {
    const source = path.join(cache, `voice-${index}.txt`);
    const audio = path.join(cache, `voice-${index}.aiff`);
    await fs.writeFile(source, text);
    let exists = true;
    try {
      await fs.access(audio);
    } catch {
      exists = false;
    }
    if (!exists) run('/usr/bin/say', ['-v', 'Daniel', '-r', '175', '-f', source, '-o', audio]);
    const speech = duration(audio);
    const length = Math.ceil((speech + (index === 4 ? 2.25 : 0.3)) * fps) / fps;
    scenes.push({ index, text, audio, start, speech, length });
    start += length;
    console.log(`Scene ${index + 1}: ${length.toFixed(2)} seconds`);
  }
  return {
    scenes,
    duration: start,
    fps,
    width: 1080,
    height: 1920,
    voice: 'macOS Daniel, temporary',
  };
}

async function captureWebsite(browser) {
  const page = await browser.newPage({
    viewport: { width: 540, height: 5400 },
    deviceScaleFactor: 2,
  });
  const mime = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== 'https://capture.beforegta6.local') return route.abort();
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(root, 'dist', relative);
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) return route.abort();
    try {
      await route.fulfill({
        body: await fs.readFile(file),
        contentType: mime[path.extname(file)] ?? 'application/octet-stream',
      });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
  await page.goto('https://capture.beforegta6.local/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const pictures = [...document.querySelectorAll('img')];
    pictures.forEach((img) => {
      img.loading = 'eager';
    });
    await Promise.all(pictures.slice(0, 25).map((img) => img.decode().catch(() => {})));
    await document.fonts.ready;
  });
  await page.screenshot({
    path: path.join(dir, 'website-scroll.png'),
  });
  const size = await sharp(path.join(dir, 'website-scroll.png')).metadata();
  if (size.width !== 1080 || size.height !== 10800) {
    throw new Error('Website capture must include the full 5400-pixel scroll area.');
  }
  await page.close();
}

function ffmpegEncoder() {
  const child = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '19',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      path.join(cache, 'picture.mp4'),
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  );
  let errors = '';
  child.stderr.on('data', (chunk) => {
    errors += chunk;
  });
  const done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => (code === 0 ? resolve() : reject(new Error(errors))));
  });
  return { child, done };
}

async function renderPictures(browser, manifest) {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(path.join(dir, 'draft.html')).href);
  await page.evaluate(async (scenes) => {
    window.scenes = scenes;
    await Promise.all([...document.images].map((img) => img.decode()));
    await document.fonts.ready;
  }, manifest.scenes);
  const { child, done } = ffmpegEncoder();
  const frames = Math.round(manifest.duration * fps);
  let lastScene = -1;
  for (let frame = 0; frame < frames; frame++) {
    const time = frame / fps;
    await page.evaluate((t) => window.renderFrame(t), time);
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!child.stdin.write(jpeg)) await once(child.stdin, 'drain');
    const scene = manifest.scenes.findLast((s) => time >= s.start);
    if (scene.index !== lastScene && time - scene.start > 0.4) {
      await page.screenshot({ path: path.join(cache, `scene-${scene.index + 1}.png`) });
      lastScene = scene.index;
    }
    if (frame % 90 === 0) console.log(`Rendered ${frame}/${frames} frames`);
  }
  child.stdin.end();
  await done;
  await page.close();
}

function composeSound(manifest) {
  const inputs = manifest.scenes.flatMap((s) => ['-i', s.audio]);
  const filters = manifest.scenes.map(
    (s, i) =>
      `[${i}:a]aresample=48000,apad,atrim=duration=${s.length.toFixed(6)},asetpts=PTS-STARTPTS[a${i}]`,
  );
  filters.push(
    `${manifest.scenes.map((_, i) => `[a${i}]`).join('')}concat=n=5:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=7[out]`,
  );
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    ...inputs,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[out]',
    '-ar',
    '48000',
    '-ac',
    '2',
    path.join(dir, 'temporary-narration.wav'),
  ]);
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(cache, 'picture.mp4'),
    '-i',
    path.join(dir, 'temporary-narration.wav'),
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-t',
    manifest.duration.toFixed(6),
    '-movflags',
    '+faststart',
    path.join(dir, 'beforegta6-homework-draft.mp4'),
  ]);
}

function stamp(seconds) {
  const value = Math.round(seconds * 1000);
  return `${String(Math.floor(value / 3600000)).padStart(2, '0')}:${String(Math.floor(value / 60000) % 60).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')},${String(value % 1000).padStart(3, '0')}`;
}

await fs.mkdir(cache, { recursive: true });
const manifest = await prepareNarration();
await fs.writeFile(
  path.join(dir, 'timing.json'),
  JSON.stringify(
    {
      ...manifest,
      scenes: manifest.scenes.map((scene) => ({
        ...scene,
        audio: path.relative(dir, scene.audio),
      })),
    },
    null,
    2,
  ) + '\n',
);
const subtitles = manifest.scenes
  .map((s, i) => `${i + 1}\n${stamp(s.start)} --> ${stamp(s.start + s.speech)}\n${s.text}\n`)
  .join('\n');
await fs.writeFile(path.join(dir, 'captions.srt'), subtitles);
await fs.writeFile(path.join(dir, 'voiceover.txt'), lines.join('\n\n') + '\n');
await fs.writeFile(
  path.join(dir, 'caption.txt'),
  [
    'the side quests got out of hand',
    'beforegta6.wtf',
    'Photo credits (opening thumbnails cropped):',
    'Pizza: Shisma, CC BY 4.0 — https://commons.wikimedia.org/wiki/File:Margherita_pizza_on_plate.jpg',
    'Penguins: laikolosse, CC BY 2.0 — https://commons.wikimedia.org/wiki/File:King_Penguins_at_Corinthian_Bay,_Heard_Island.jpg',
    'Katy Perry concert portrait: Misterwiki16, CC0 — https://commons.wikimedia.org/wiki/File:Katy_Perry_in_Budapest,_Hungary_at_MVM_Dome_for_the_Lifetimes_Tour_(October_27,_2025).jpg',
    'Licences: https://creativecommons.org/licenses/by/4.0/ · https://creativecommons.org/licenses/by/2.0/',
  ].join('\n\n') + '\n',
);

const browser = await chromium.launch({ headless: true });
try {
  await captureWebsite(browser);
  await renderPictures(browser, manifest);
} finally {
  await browser.close();
}
composeSound(manifest);
console.log(
  `Saved ${manifest.duration.toFixed(2)}s draft: ${path.join(dir, 'beforegta6-homework-draft.mp4')}`,
);
