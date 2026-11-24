import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(await fs.readFile(path.join(dir, 'timing.json'), 'utf8'));
const output = path.join(dir, timing.outputDirectory);
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(dir, '.cache'), { recursive: true });
const sampleRate = 48000;
const samples = new Float32Array(Math.round(timing.duration * sampleRate));
// Original, deterministic accents. No sampled music or third-party effects.
function tone(start, duration, frequency, gain, sweep = 0) {
  const offset = Math.round(start * sampleRate);
  for (let n = 0; n < duration * sampleRate; n++) {
    const t = n / sampleRate;
    const envelope = Math.sin((Math.PI * t) / duration) ** 2 * Math.exp((-5 * t) / duration);
    samples[offset + n] +=
      Math.sin(2 * Math.PI * (frequency * t + (sweep * t * t) / 2)) * envelope * gain;
  }
}
for (const effect of timing.effects) {
  if (effect.start < 0 || effect.start + effect.duration > timing.duration)
    throw new Error('Sound effect is outside the timeline.');
  tone(effect.start, effect.duration, effect.frequency, effect.gain, effect.sweep);
}

const buffer = Buffer.alloc(44 + samples.length * 2);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(buffer.length - 8, 4);
buffer.write('WAVEfmt ', 8);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(samples.length * 2, 40);
samples.forEach((sample, i) =>
  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2),
);
await fs.writeFile(path.join(dir, '.cache/effects.wav'), buffer);

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
    timeout: 120000,
  });
}
const voice = process.env.NARRATION_FILE
  ? path.resolve(process.env.NARRATION_FILE)
  : path.join(dir, timing.narrationFile ?? 'public/temporary-narration.wav');
const outputName = process.env.NARRATION_FILE
  ? 'beforegta6-custom-voice-review.mp4'
  : timing.outputName;
const sourceMix = timing.sourceAudio;
const sourceScene = timing.scenes.find((scene) => scene.id === sourceMix.scene);
const sourceDuration = sourceScene.end - sourceScene.start;
const duckEnd = sourceMix.duckUntil - sourceScene.start;
const rampEnd = duckEnd + sourceMix.fadeUpDuration;
const ramp = (sourceMix.openGain - sourceMix.quietGain) / sourceMix.fadeUpDuration;
const sourceVolume = `if(lt(t,${duckEnd}),${sourceMix.quietGain},if(lt(t,${rampEnd}),${sourceMix.quietGain}+(t-${duckEnd})*${ramp},${sourceMix.openGain}))`;
const availableSource = Number(
  execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nw=1:nk=1',
      path.join(dir, 'public/tesla-action.mp4'),
    ],
    { encoding: 'utf8' },
  ),
);
if (sourceDuration > availableSource)
  throw new Error('The car scene exceeds the available source clip.');
ffmpeg([
  '-i',
  voice,
  '-i',
  path.join(dir, 'public/tesla-action.mp4'),
  '-i',
  path.join(dir, '.cache/effects.wav'),
  '-filter_complex',
  `[0:a]aresample=48000[voice];[1:a]aresample=48000,highpass=f=90,loudnorm=I=-22:TP=-6:LRA=7,aresample=48000,asetnsamples=n=480:p=0,volume='${sourceVolume}':eval=frame,atrim=duration=${sourceDuration},afade=t=out:st=${sourceDuration - sourceMix.fadeOutDuration}:d=${sourceMix.fadeOutDuration},adelay=${Math.round(sourceScene.start * 1000)}:all=1[source];[voice][source][2:a]amix=inputs=3:normalize=0,apad,atrim=duration=${timing.duration},loudnorm=I=-16:TP=-1.5:LRA=7[out]`,
  '-map',
  '[out]',
  '-ar',
  '48000',
  '-ac',
  '2',
  path.join(dir, 'public/mix.wav'),
]);
if (process.argv.includes('--audio-only')) process.exit(0);
ffmpeg([
  '-i',
  path.join(output, 'picture.mp4'),
  '-i',
  path.join(dir, 'public/mix.wav'),
  '-map',
  '0:v:0',
  '-map',
  '1:a:0',
  '-vf',
  'scale=in_range=pc:out_range=tv,format=yuv420p',
  '-c:v',
  'libx264',
  '-preset',
  'slow',
  '-crf',
  '17',
  '-color_range',
  'tv',
  '-colorspace',
  'bt709',
  '-color_primaries',
  'bt709',
  '-color_trc',
  'bt709',
  '-c:a',
  'aac',
  '-b:a',
  '256k',
  '-t',
  String(timing.duration),
  '-movflags',
  '+faststart',
  '-metadata',
  'title=Things we got before GTA 6 — faster local review draft',
  '-metadata',
  `comment=${process.env.NARRATION_FILE ? 'Custom human narration review' : timing.voice}; not approved for publication`,
  path.join(output, outputName),
]);
console.log(`Saved ${outputName}`);
