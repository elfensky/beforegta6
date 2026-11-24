import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(await fs.readFile(path.join(dir, 'timing.json'), 'utf8'));
if (timing.narrationFile)
  throw new Error('Human narration is configured. Use scripts/prepare-recording.mjs.');
const cache = path.join(dir, '.cache');
await fs.mkdir(cache, { recursive: true });

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', timeout: 120000 });
}

function stamp(seconds) {
  return new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23).replace('.', ',');
}

const filters = [];
const inputs = [];
const subtitles = [];
for (const [i, line] of timing.narration.entries()) {
  const source = path.join(cache, `voice-${i}.txt`);
  const target = path.join(cache, `voice-${i}.aiff`);
  await fs.writeFile(source, line.text);
  run('/usr/bin/say', ['-v', 'Daniel', '-r', String(line.rate), '-f', source, '-o', target]);
  const duration = Number(
    run('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nw=1:nk=1',
      target,
    ]),
  );
  const next = timing.narration[i + 1]?.start ?? timing.duration - 0.05;
  if (line.start + duration > next - 0.1)
    throw new Error(`Narration line ${i + 1} overlaps the next beat.`);
  line.duration = duration;
  inputs.push('-i', target);
  filters.push(
    `[${i}:a]aresample=48000,highpass=f=75,adelay=${Math.round(line.start * 1000)}:all=1[a${i}]`,
  );
  subtitles.push(
    `${i + 1}\n${stamp(line.start)} --> ${stamp(line.start + duration)}\n${line.caption ?? line.text.replace('GTA six', 'GTA 6')}\n`,
  );
}
filters.push(
  `${timing.narration.map((_, i) => `[a${i}]`).join('')}amix=inputs=${timing.narration.length}:normalize=0,apad,atrim=duration=${timing.duration},loudnorm=I=-16:TP=-2:LRA=7[out]`,
);
run('ffmpeg', [
  '-v',
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
  path.join(dir, 'public/temporary-narration.wav'),
]);
await fs.writeFile(path.join(dir, 'captions.srt'), subtitles.join('\n'));
await fs.writeFile(
  path.join(dir, 'voiceover.txt'),
  timing.narration.map((l) => l.text).join('\n\n') + '\n',
);
await fs.writeFile(
  path.join(dir, 'public/narration-timing.json'),
  JSON.stringify(timing, null, 2) + '\n',
);
console.log(JSON.stringify(timing.narration, null, 2));
