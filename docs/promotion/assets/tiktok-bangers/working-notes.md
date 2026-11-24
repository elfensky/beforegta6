# Production working notes — 2026-11-17

- The task explicitly selects Remotion, Andrei's recording, and local production. No additional design approval or agent delegation was required.
- All useful first-draft files were copied before production. The source workspace was never edited. Copied file hashes are in `../../sources/parent-copy-manifest.json`.
- A bounded Nowledge MCP search used `beforegta6 final TikTok Remotion recorded voice meme became homework exact approval`, normal mode, default strict space, no label filter. Rank 1: `1b6cc669-6f08-46b8-9c84-671a71ef2456`, production approval, score 0.99. Rank 2: `10acabd6-20eb-45e0-9c5b-ce42e4069ed9`, final attempt and keep-live decision, score 0.8165. Rank 3: `fef0bcc3-06e8-479c-9e3b-1d1e4d92450f`, prior metadata release, score 0.5791. The third result did not affect production. The graph was omitted because matching strict-space enforcement was not established.
- The first yt-dlp media format returned HTTP 403. The HLS format pair `270+234` succeeded. The downloaded 650–680 second excerpt is retained. No browser cookies or sign-ins were used.
- Direct inspection places the selected flip around 11:12, later than the inherited approximate timestamp. The new edit starts at source 672.1 seconds.
- Remotion 4.0.544 is pinned. An assumed font-package version was unavailable. The resolved available Fontsource packages are pinned at 5.3.0.
- Repeated browser startup and then a three-page render produced intermittent “Visited http://localhost:3000/index.html but got no response” errors. A retained browser instance rendered all seven later stills. The export uses one page to remove concurrent navigation from that path.
- The opening crop shifts when Tesla's source camera changes. This keeps the car nearer the centre and away from TikTok's right-side controls.
- The first-draft screenshot-height defect is prevented by an asserted 1080 × 10800 capture and a scroll clamp.
- Audio inspection in this harness supports waveform, duration, loudness, peak and decode checks. Returning an audio item does not establish that an auditory model received it. No listening pass is claimed.
- Andrei's recording remains unavailable. The temporary voice and local export are review material. Publication, uploads, outreach, edits, and deletions remain outside this task.
- The first encoded export used full-range yuvj420p. The final mix explicitly converts full range to limited BT.709 yuv420p for player compatibility. Verification rejects other formats.
- Encoded-frame review found the entering cards crossing the homework caption. The cards now enter from above, fade into place, and stop above the caption. The final address was raised to y=1390.

## Faster revision — 2026-11-17

- Andrei liked the previous draft but requested faster timing, a title page, the three stories, and “Find out more at beforegta6.wtf”. This authorizes a revised local draft, not publication.
- The new timeline is 14 seconds. The title lasts 1.5 seconds. The first narration line continues into the car scene so the title need not delay the action.
- The previous 23.5-second MP4 and 30 MB source archive remain unchanged. The faster export has its own `out/snappy/` folder.
- The car excerpt remains at normal speed. Source audio is delayed to the new car start. Map, truck, sound effects, subtitles, and website motion follow the shorter timeline.
- The dedicated homework and joke scenes are removed. “Grand Theft KitKat” remains a brief stamp within the theft scene.
- A targeted Nowledge search returned the prior local-draft record, `970351d1-8be7-4da9-96c1-d4ff9dcee70b`, score 0.99. The current user feedback governs the revision. The strict-space graph limitation remains unchanged.

## Original voice integration — 2026-11-18

- Andrei supplied `/Users/andrei/Downloads/recordings`. Five M4A files were copied into ignored local sources with byte hashes. Downloads and the parent worktree remain unchanged.
- The filename “best one I think.m4a” identifies the preferred take. Local transcription confirms all five lines. The fourth line says “somebody stealing”, so subtitles follow that wording.
- The first four phrases remain one continuous excerpt. Generous margins retain soft consonants. The main removed pause is before the address. The accepted 14-second picture is unchanged.
- The audio tool returned “audio content omitted because you do not support audio input”. An auditory listening pass remains unavailable. No listening claim is made.
- Local faster-whisper uses downloaded public model weights. Audio inference runs offline. PyAV rejected its `metadata_errors` argument, so existing FFmpeg decodes to a NumPy float array first.
- An initial command combined a package working directory with a repo-relative script path. It was corrected. The resulting misplaced cache was moved into this package's ignored `.cache/` folder, and empty directories were removed.
- The bounded Nowledge MCP search used `beforegta6 faster draft accepted voice recording 14 seconds`, normal default mode, strict default space, label `beforegta6`, limit 1. Rank 1: `f7234a6e-b94a-4546-9306-f9b54e3fd059`, “beforegta6 faster draft accepted for voice recording”, score 0.99. The graph remains omitted because matching strict-space enforcement is unverified.
- The current narration is human. The temporary generation script now rejects the human configuration to prevent accidental replacement.
- Prettier does not use this package's nested `.gitignore` for cache exclusion. The root `.prettierignore` now excludes the local transcription cache, as it already excludes render outputs.
- Repository tests require loopback access. The sandbox produced `listen EPERM` for 19 review tests and one deployment-fixture timeout. The same gate is rerun with ordinary local-server permission; no application code is changed.

## Centered Texas label — 2026-11-18

- Andrei requested that the map label be centered inside Texas. The HTML label used fixed offsets and was too far left.
- The label now belongs to the same SVG as the state outline. Its anchor is the state area centroid, rounded to source coordinates (418, 448). Raster integration measured (417.879, 447.903).
- `textAnchor="middle"` and `dominantBaseline="central"` center the text on that point. The label follows the existing map zoom.
- The corrected export uses `out/andrei-centered/`. Prior videos and archives remain preserved. Narration, subtitle timing, scene timing, and source media are unchanged.
- One targeted Nowledge MCP search used `beforegta6 local TikTok Andrei supplied voice 14-second current export`, default normal mode, strict default space, label `beforegta6`, limit 1. Rank 1: `469a6728-8ec0-422a-97bc-5a497f431d9d`, original-voice export, score 0.99. The strict-space graph limitation remains unchanged.

## Narration-led timing — 2026-11-18

- Andrei rejected the car appearing while the opening sentence was still playing. The requested structure is a complete animated title, flying cars with a source-sound pause, blue Texas with a short sound accent, then the KitKat story.
- The cut is 16.7 seconds: title 0–3.1, car 3.1–6.5, Texas 6.5–8.7, KitKat 8.7–12.2, website 12.2–16.7. The existing KitKat wording is retained from the supplied take.
- Each recorded phrase now has its own excerpt. Every excerpt and subtitle must remain inside its scene. Both preparation and verification reject a crossed boundary.
- The title reveals four lines with the recorded words. The GTA 6 line lands with spring motion and a drawn underline. This replaces the earlier short title that let the opening sentence continue over the car.
- The mix reads source-audio timing and sound events from `timing.json`. Tesla sound rises smoothly after the car phrase. A quiet original two-note chime fills the Texas pause.
- Encoded review now extracts exact frame indices instead of approximate seek times. This makes the last title frame and first car frame explicit.
- One targeted Nowledge MCP search used `beforegta6 TikTok Texas label centered corrected local export Andrei voice timing`, default normal mode, strict default space, label `beforegta6`, limit one. Rank 1 was `e6aae025-7058-40b2-89cf-806f32000f22`, corrected local export, score 0.99. Strict-space graph enforcement remains unverified, so no graph was opened.
- Short pause windows were checked separately for signal level. The first Texas chime was too quiet and was raised before delivery.
- `loudnorm` can emit long audio frames. A following frame-evaluated volume expression then misses the intended short ramp. The source path now resamples to 48 kHz and splits into 480-sample frames before applying its volume curve.

## Manual posting guidance — 2026-11-18

- Andrei requested posting instructions, title, and description. The current proposed exact description is `posting-caption.txt`. The video and earlier archives remain unchanged.
- The cover uses encoded frame 75 at 2.5 seconds, when the full title and underline are visible.
- TikTok's direct help-page extraction returned empty text. Its indexed official cover and content-disclosure articles provided the usable procedure, and official page snapshots were archived.
- No browser account, upload, publication, message, reply, profile change, or purchase was performed.
- A targeted Nowledge MCP search used `beforegta6 TikTok latest 16.7-second intro pauses exact final publication approval`, default normal mode, strict default space, label `beforegta6`, limit one. Rank 1: `e996c35c-c6c9-47c9-a953-9e0d5cb597e6`, timing revision, score 0.99. The strict-space graph limitation remains unchanged.

## Publication reported — 2026-11-18

- Andrei supplied https://www.tiktok.com/@elfensky/video/7709427620697378070 and wrote “done”. Publication is recorded from his report.
- The uploaded video and caption have not been independently compared with the local files. No agent upload, post, message, or account change occurred.
- This completes the final promotion attempt. The existing instruction to keep the website live remains in force.
- A Nowledge MCP search used `beforegta6 TikTok manual posting caption cover prepared published`, default normal mode, strict default space, no filters, limit three. Rank 1: `72552807-5d8a-44ff-a35a-2039988028c6`, posting materials, score 0.99. Rank 2: `10acabd6-20eb-45e0-9c5b-ce42e4069ed9`, final attempt and keep-live decision, score 0.8473. Rank 3: `970351d1-8be7-4da9-96c1-d4ff9dcee70b`, older local draft, score 0.8334. The strict-space graph limitation remains unchanged.
