import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(await fs.readFile(path.join(dir, 'timing.json'), 'utf8'));
const edit = JSON.parse(await fs.readFile(path.join(dir, 'sources/recording-edit.json'), 'utf8'));
const source = path.join(dir, edit.source);
const hash = createHash('sha256')
  .update(await fs.readFile(source))
  .digest('hex');
if (hash !== edit.sha256) throw new Error('The original recording does not match its source hash.');
if (edit.speed !== 1) throw new Error('This edit preserves the original voice speed.');
await fs.mkdir(path.join(dir, '.cache'), { recursive: true });

const branches = edit.segments.map((_, i) => `[input${i}]`).join('');
const filters = [`[0:a]aresample=48000,asplit=${edit.segments.length}${branches}`];
for (const [i, segment] of edit.segments.entries()) {
  const duration = segment.sourceEnd - segment.sourceStart;
  const next = edit.segments[i + 1]?.destinationStart ?? timing.duration;
  if (duration <= 0 || segment.sourceStart < 0 || segment.sourceEnd > edit.sourceDuration)
    throw new Error(`Invalid source bounds for segment ${i + 1}.`);
  if (segment.destinationStart + duration > next + 0.001)
    throw new Error(`Recorded segment ${i + 1} overlaps the next segment.`);
  const scene = timing.scenes.find((item) => item.id === segment.scene);
  if (
    !scene ||
    segment.destinationStart < scene.start ||
    segment.destinationStart + duration > scene.end + 0.001
  )
    throw new Error(`Recorded segment ${i + 1} crosses its scene boundary.`);
  filters.push(
    `[input${i}]atrim=start=${segment.sourceStart}:end=${segment.sourceEnd},asetpts=PTS-STARTPTS,afade=t=in:d=0.025,afade=t=out:st=${duration - 0.04}:d=0.04,adelay=${Math.round(segment.destinationStart * 1000)}:all=1[a${i}]`,
  );
}
filters.push(
  `${edit.segments.map((_, i) => `[a${i}]`).join('')}amix=inputs=${edit.segments.length}:normalize=0,highpass=f=75,acompressor=threshold=0.125:ratio=2:attack=8:release=100,apad,atrim=duration=${timing.duration},loudnorm=I=-16:TP=-2:LRA=7[out]`,
);
execFileSync(
  'ffmpeg',
  [
    '-v',
    'error',
    '-y',
    '-i',
    source,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[out]',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-map_metadata',
    '-1',
    path.join(dir, timing.narrationFile),
  ],
  { stdio: 'inherit', timeout: 120000 },
);

const stamp = (seconds) =>
  new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23).replace('.', ',');
const subtitles = timing.narration.map((line, i) => {
  const scene = timing.scenes.find((item) => item.id === line.scene);
  if (!scene || line.start < scene.start || line.end > scene.end)
    throw new Error(`Subtitle ${i + 1} crosses its scene boundary.`);
  if (
    line.start < 0 ||
    line.end <= line.start ||
    line.end > timing.duration ||
    line.end > (timing.narration[i + 1]?.start ?? timing.duration)
  )
    throw new Error(`Invalid subtitle interval ${i + 1}.`);
  return `${i + 1}\n${stamp(line.start)} --> ${stamp(line.end)}\n${line.caption}\n`;
});
await fs.writeFile(path.join(dir, 'captions.srt'), subtitles.join('\n'));
await fs.writeFile(
  path.join(dir, 'voiceover.txt'),
  timing.narration.map((line) => line.text).join('\n\n') + '\n',
);
console.log('Prepared Andrei’s original voice, with pauses trimmed and five aligned subtitles.');
