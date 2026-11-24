import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import sharp from 'sharp';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(await fs.readFile(path.join(dir, 'timing.json'), 'utf8'));
const out = path.join(dir, timing.outputDirectory);
const file = path.join(out, timing.outputName);
const result = JSON.parse(
  execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], {
    encoding: 'utf8',
  }),
);
const video = result.streams.find((s) => s.codec_type === 'video');
const audio = result.streams.find((s) => s.codec_type === 'audio');
if (video.width !== 1080 || video.height !== 1920 || video.avg_frame_rate !== '30/1')
  throw new Error('Unexpected video geometry or frame rate.');
if (video.codec_name !== 'h264' || video.pix_fmt !== 'yuv420p' || audio.codec_name !== 'aac')
  throw new Error('Unexpected codecs.');
if (Math.abs(Number(result.format.duration) - timing.duration) > 0.05)
  throw new Error('Unexpected duration.');
if (Number(video.nb_frames) !== Math.round(timing.duration * timing.fps))
  throw new Error('Incorrect frame count.');
execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: 'pipe' });

const analysis = spawnSync(
  'ffmpeg',
  [
    '-hide_banner',
    '-i',
    file,
    '-vf',
    'blackdetect=d=0.05:pix_th=0.1:pic_th=0.98',
    '-af',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ],
  { encoding: 'utf8', maxBuffer: 4e6 },
);
if (analysis.status !== 0) throw new Error(analysis.stderr);
await fs.writeFile(path.join(out, 'encoded-analysis.log'), analysis.stderr);
if (/black_start/.test(analysis.stderr)) throw new Error('Black interval detected.');
const peak = [...analysis.stderr.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].at(-1)?.[1];
if (peak === undefined || Number(peak) > -0.5) throw new Error('Audio lacks peak headroom.');
const loudness = [...analysis.stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)?.[1];

const scene = Object.fromEntries(timing.scenes.map((item) => [item.id, item]));
const frameAt = (seconds) => Math.round(seconds * timing.fps);
for (const line of timing.narration) {
  if (
    !scene[line.scene] ||
    line.start < scene[line.scene].start ||
    line.end > scene[line.scene].end
  )
    throw new Error(`Narration crosses its ${line.scene} scene boundary.`);
}
const checkFrames = [
  0,
  17,
  31,
  47,
  65,
  frameAt(scene.intro.end) - 1,
  frameAt(scene.car.start),
  frameAt(scene.car.start) + 18,
  frameAt(timing.narration.find((line) => line.scene === 'car').end) + 5,
  frameAt(scene.car.end) - 1,
  frameAt(scene.texas.start),
  frameAt(scene.texas.start) + 20,
  frameAt(scene.texas.end) - 1,
  frameAt(scene.chocolate.start),
  frameAt(scene.chocolate.start) + 30,
  frameAt(scene.chocolate.start) + 75,
  frameAt(scene.chocolate.end) - 1,
  frameAt(scene.website.start),
  frameAt(scene.website.start) + 60,
  frameAt(scene.website.start) + 90,
  frameAt(timing.duration) - 1,
];
const checks = checkFrames.map((frame) => frame / timing.fps);
const pieces = [];
for (const [i, second] of checks.entries()) {
  const target = path.join(out, `encoded-${String(i).padStart(2, '0')}.png`);
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-i',
    file,
    '-vf',
    `select=eq(n\\,${checkFrames[i]})`,
    '-frames:v',
    '1',
    target,
  ]);
  const label = Buffer.from(
    `<svg width="270" height="34"><rect width="270" height="34" fill="#222"/><text x="12" y="24" fill="white" font-family="Arial" font-size="20">${second.toFixed(2)} s</text></svg>`,
  );
  const thumb = await sharp(target)
    .resize(270, 480)
    .extend({ bottom: 34, background: '#222' })
    .composite([{ input: label, top: 480, left: 0 }])
    .png()
    .toBuffer();
  pieces.push({ input: thumb, left: (i % 7) * 270, top: Math.floor(i / 7) * 514 });
}
await sharp({ create: { width: 1890, height: 1542, channels: 3, background: '#222' } })
  .composite(pieces)
  .jpeg({ quality: 92 })
  .toFile(path.join(out, 'encoded-contact-sheet.jpg'));

// Measure text-safe margins and the final address hold from frame crops.
const crop = { left: 70, top: 1380, width: 820, height: 115 };
const hashes = [];
for (const i of [18, 19, 20]) {
  const data = await sharp(path.join(out, `encoded-${i}.png`))
    .extract(crop)
    .greyscale()
    .raw()
    .toBuffer();
  hashes.push(data);
}
const meanDifferences = hashes
  .slice(1)
  .map(
    (data) => data.reduce((sum, pixel, i) => sum + Math.abs(pixel - hashes[0][i]), 0) / data.length,
  );
if (meanDifferences.some((n) => n > 3))
  throw new Error('Final address moves or changes unexpectedly.');
const report = {
  checked: new Date().toISOString(),
  file: path.basename(file),
  width: video.width,
  height: video.height,
  fps: video.avg_frame_rate,
  frames: Number(video.nb_frames),
  duration: Number(result.format.duration),
  videoCodec: video.codec_name,
  pixelFormat: video.pix_fmt,
  audioCodec: audio.codec_name,
  audioSampleRate: audio.sample_rate,
  audioChannels: audio.channels,
  integratedLoudnessLufs: Number(loudness),
  truePeakDbfs: Number(peak),
  decodeErrors: 0,
  detectedBlackIntervals: 0,
  finalAddressHoldSeconds: scene.website.end - scene.website.start,
  finalAddressMeanPixelDifferences: meanDifferences,
  extractedFrames: checks,
  exactFrameIndices: checkFrames,
  narrationContainedWithinScenes: true,
  narration: timing.voice,
  auditoryReview: 'Human listening pass required. Automated level analysis is not listening.',
};
await fs.writeFile(path.join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
