# Verification — narration-led local review

Verification date: 2026-11-18, Europe/Brussels. Story evidence date: 2026-11-17. Publication date: 2026-11-18, reported by Andrei; the upload was not compared with the local file.

The current MP4 is `out/andrei-paced/beforegta6-andrei-paced-review.mp4`.
It contains 501 frames at 1080 × 1920 and 30 fps. Its duration is 16.7 seconds.
H.264 video uses limited-range BT.709 yuv420p. Stereo AAC audio uses 48 kHz.
The complete file decodes without errors. Analysis detects no black intervals or clipping.
Integrated audio loudness is −17.1 LUFS. The true peak is −4.5 dBFS.

## Timing and picture

| Scene | Time | Verified behavior |
| --- | --- | --- |
| Title | 0–3.1 s | Four text rows animate with the opening words. The complete opening sentence stays on this scene. |
| Flying cars | 3.1–6.5 s | Normal-speed Tesla action, followed by a pause with raised source sound. |
| Blue Texas | 6.5–8.7 s | Centered state label, Senate context, and a short two-note chime after the phrase. |
| KitKat | 8.7–12.2 s | Original recorded theft line, illustrative photograph, truck, and typographic joke. |
| Website | 12.2–16.7 s | Actual website capture with a stationary address for 4.5 seconds. |

Twenty-one exact encoded frames were inspected across the intro animation, scene boundaries, and ending.
Frame 92 at 3.067 seconds still shows the complete title. Frame 93 at 3.1 seconds starts the car scene.
The opening voice excerpt ends at 2.93 seconds. Its subtitle ends at 2.8 seconds.
Both preparation and verification reject narration or subtitles that cross their matching scene boundaries.
Five subtitle cues are non-overlapping and contained within the video duration.
The Texas label remains centered during the zoom. No empty website region appears.

## Voice and sound

The original recording is Andrei's “best one I think.m4a”. Its source hash is enforced before processing.
Each phrase uses a separate excerpt at its original speed and pitch. No generated speech or voice conversion is used.
Source audio stays lower during the car phrase and rises smoothly in its pause.
The Texas chime and other transition accents use original local synthesis.
The car pause and Texas chime were measured separately to check their signal levels.

The repository gate passes lint, 92 tests, the 210-page build, and HTML validation.
The final mix changes also pass targeted lint and formatting checks.
Previous MP4 exports and editable archives match their saved SHA-256 hashes.
The editable archive contains the selected original recording, current sources, media, subtitles, and credits.

The harness cannot hear audio. Automatic transcription and signal checks do not replace a full human listening pass.
Andrei published the video on 2026-11-18. No agent uploaded or posted it, and the upload was not compared with this local file.
