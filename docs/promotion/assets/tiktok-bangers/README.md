# Things we got before GTA 6 — Andrei voice review

Status: Andrei reported publication on 2026-11-18: [TikTok post](https://www.tiktok.com/@elfensky/video/7709427620697378070).
The local 16.7-second export uses Andrei's original recording.
The picture follows each spoken line, with an animated title and pauses between stories.
The uploaded video and caption have not been independently compared with the local files.
Any further publication or changes by an agent require approval of the exact content.

## Delivery

Rendered files under `out/` stay local only; Git ignores them.

- `out/andrei-paced/beforegta6-andrei-paced-review.mp4`: current 1080 × 1920, 30 fps video.
- `out/andrei-paced/beforegta6-andrei-paced-editable.zip`: editable package with the selected recording and required media.
- `captions.srt`, `posting-caption.txt`: aligned subtitles and the caption prepared for the post.
- `voiceover.txt`, `recording-script.md`: recorded wording and narration notes.
- `src/`, `scripts/`, `timing.json`, and the npm manifest and lockfile: editable Remotion project.
- `sources/recording-edit.json`: original recording hash and exact audio cuts.
- `source-credits.md`: media, licence, and source evidence.
- `out/andrei-paced/verification.json`, `out/andrei-paced/encoded-contact-sheet.jpg`: encoded checks and inspected frames.

The five supplied recordings are preserved locally under `sources/recordings/` with their copy manifest.
The source folder in Downloads remains unchanged. The editable archive includes only the selected take.
The recording and generated audio remain ignored by Git.

## Picture and sound

The title lasts 3.1 seconds and stays visible through the complete opening sentence.
Its four text rows appear with the corresponding words. “GTA 6” lands with a short spring motion and underline.
The normal-speed Tesla action lasts 3.4 seconds. Its original sound rises after “Flying cars”.
The Texas scene lasts 2.2 seconds and retains “2026 US Senate race”.
A quiet two-note chime follows “Blue Texas” during the pause.
The “TEXAS” map label is centered inside the state and follows its zoom.
The KitKat scene lasts 3.5 seconds and retains the illustrative photograph label.
“Grand Theft KitKat” appears within that scene.
The actual website and stationary address remain visible for the final 4.5 seconds.

The selected recording is “best one I think.m4a”. Its original speed and pitch are preserved.
The five phrases use separate excerpts from the same original take. Pauses separate the spoken examples.
A low-cut filter, light compression, and level adjustment prepare the voice for the mix.
Tesla's source sound stays below the spoken phrase, then rises during the pause. The transition sounds are original synthesis.
The fourth subtitle follows the recording: “And somebody stealing twelve tonnes of KitKats.”

**eli14:** each story has its own beat. The picture waits until the previous sentence is finished.

## Local use

Use Node 26, FFmpeg, and the existing Playwright Chromium installation.
All media and fonts load locally. No paid component or cloud rendering service is used.

```sh
npm ci --ignore-scripts
npm run prepare:voice
npm run studio
```

Create the complete export:

```sh
npm run render
node scripts/mix.mjs
npm run verify
```

The voice excerpts and subtitles must stay inside their matching scenes. The preparation and verification scripts enforce this boundary.
A fresh clone cannot render the picture by itself. These inputs stay local, because Git ignores them: `sources/recordings/`, `public/tesla-action.mp4`, `public/website-scroll.png` and the card stills. The capture also needs the site build (`npm run build` in the repository root) and `node scripts/capture.mjs`. Without them, the project renders only the text layers.
`scripts/prepare.mjs` rejects replacement with temporary speech while human narration is configured.

## Preserved drafts

- `out/andrei-centered/beforegta6-andrei-centered-review.mp4`: previous 14-second cut with the centered Texas label.
- `out/andrei-centered/beforegta6-andrei-centered-editable.zip`: unchanged source archive for that cut.

- `out/andrei/beforegta6-andrei-review.mp4`: previous original-voice export.
- `out/andrei/beforegta6-andrei-editable.zip`: unchanged editable archive for that export.

- `out/snappy/beforegta6-snappy-draft.mp4`: accepted 14-second picture with temporary Daniel narration.
- `out/snappy/beforegta6-snappy-editable.zip`: unchanged editable archive for that draft.
- `out/beforegta6-bangers-draft.mp4`: previous 23.5-second cut.
- `out/beforegta6-tiktok-v2-editable.zip`: unchanged previous editable archive.

## Remaining review

The recording dependency is complete. A full human listening pass remains open.
The harness supports transcription and audio measurements but cannot hear the exported audio.
Andrei published the video and caption on 2026-11-18. The upload was not compared with these local files.
