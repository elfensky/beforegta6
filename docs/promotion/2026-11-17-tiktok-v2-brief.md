# Final TikTok: production proposal

Evidence date: 17 November 2026. Publication date: 2026-11-18, reported by Andrei, as “Things we got before GTA 6” ([result](../PROMOTION.md#result--2026-11-18)).

Status: production setup selected. Andrei selected flying cars, blue Texas, and the KitKat heist for the next version.
Andrei selected Remotion and his recorded voice on 17 November 2026. The edit and script below remain proposals.
The first video remains a local draft. Andrei approved a fresh production thread to install Remotion and create the second draft.
No paid service is selected. The final narration will use Andrei's recording.
Andrei published the finished video and caption on 2026-11-18. The website remains live afterwards.

## Creative direction

Retain “The meme became homework” and its dry delivery.
Use a 20–24 second vertical edit. Lead with the car, then Texas, then the chocolate theft.
The website appears as the final joke, with a readable address for about two seconds.

| Approximate time | Picture | Proposed narration or text |
| --- | --- | --- |
| 0–4 seconds | Actual Roadster flight clip, with the action visible immediately | “We got flying cars before GTA 6.” |
| 4–8 seconds | Texas changes to blue on a map. Label: “2026 US Senate race” | “Blue Texas.” |
| 8–14 seconds | KitKat photograph, truck graphic, and a large “12 TONNES” label | “Someone stole twelve tonnes of KitKats. Grand Theft KitKat.” |
| 14–20 seconds | Brief view of the three site cards, then the timeline | “I started checking the meme. I accidentally made a history website.” |
| 20–24 seconds | Readable beforegta6.wtf address and a short visual connection to the opening | Final pause; timing depends on the chosen narration |

The timings and lines remain editable. A voice recording determines the final pauses and cut points.
The Texas label identifies the Senate contest. It does not imply that every Texas election had the same result.
The KitKat graphic illustrates the theft. It must not appear to be surveillance footage.
“Grand Theft KitKat” uses ordinary type, without Rockstar logos or fonts.

## Tool options

| Tool | Availability | Proposed use | Cost and trade-off |
| --- | --- | --- | --- |
| FFmpeg and ffprobe | Installed | Crop, mix audio, export, and inspect the final file | No additional purchase. Existing renderer already uses these tools. |
| yt-dlp | Installed | Obtain the selected source clip when accessible | No additional purchase. A usable clip still needs inspection. |
| Playwright and Sharp | Installed in the project | Capture the actual site and prepare local pictures | No additional install needed for the existing workflow. |
| Remotion | Not installed | Precise animated captions, maps, transitions, and repeatable revisions | Recommended optional install. Free for individuals under its current licence. |
| DaVinci Resolve | Version 21.2.0 installed | Optional manual finishing and audio adjustment | No new app needed. Edition entitlement and scripting control are unverified. |
| Human narration | Recording needed | Dry delivery with deliberate pauses | Recommended. No service charge; requires a recording from Andrei. |
| ElevenLabs stock voice | Not connected | Alternative narration when a human recording is unavailable | Optional paid cloud service. Starter is listed at $6/month before tax, excluding introductory offers. |
| macOS Daniel voice | Available | Temporary timing reference | No service charge. The first draft uses this voice. |

The selected package is Remotion, the existing local tools, and Andrei's narration.
The existing renderer can also make the video without Remotion. Remotion mainly improves revision control over timing and animation.
A generative video subscription is not part of the proposed package. The selected stories already have source material.
Music remains optional. Voice, selected source sound, and a few locally produced effects can establish the rhythm.

Plain-language comparison: Remotion is the cutting table, footage is the picture, and narration is the performance.
A better cutting table helps revisions. The performance and selected pictures determine much of the result.
No installation affects the live website. A later paid voice choice would add an external service and its recurring charge.

## Proposed recording script

> We got flying cars before GTA six.
>
> Blue Texas.
>
> And someone stole twelve tonnes of KitKats.
>
> Grand Theft KitKat.
>
> I started checking the meme…
>
> and accidentally made a history website.

Delivery: dry and conversational. The short lines carry the joke without a presenter voice.
A phone recording in a quiet room is sufficient as the starting source.
Record two takes, with a short pause between lines. Retain the original recording without music or effects.
No microphone purchase is required before testing the recording.

## Material and delivery requirements

- The repository has a Tesla still and a source-stream link. No usable local source clip was found in the review asset folders.
- Inspect the exact flight sequence before fixing its crop and narration. Preserve enough context to show what the prototype does.
- Reuse the selected Texas map and KitKat image, with their attribution records. Confirm the final claims against their sources.
- Keep captions inside the visible central area, away from TikTok controls. Check readability on a phone-sized preview.
- Deliver a 1080 × 1920 MP4, caption text, subtitle file, source credits, and editable local project.
- Review the complete encoded video with sound. Check the first frame, pauses, captions, final address, and audio peaks.
- Preserve the first draft. Store the second version in its own folder.

## Fresh-thread handoff

A fresh production thread is approved. Tool and narration choices are settled.
Production thread: [Produce final beforegta6 TikTok with Remotion](t3-thread://v2/f4c33bd2-f973-45a5-884e-44ab0aedef3d/mcp:launch:3415dcac85dbe301b5fe7e433a6a8684cf756b700d1ecc2f2fb50b135b04c287).
This brief and the first draft package were local, uncommitted files when the thread was handed off.
The production scope excludes publishing, moderator messages, new campaigns, and deployment changes.

## Sources

- [Remotion: features and individual licence](https://www.remotion.dev/) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7160).
- [Remotion licence documentation](https://www.remotion.dev/docs/license) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7162).
- [ElevenLabs pricing](https://elevenlabs.io/pricing) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7161).
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7164).
- [Nestlé's corrected KitKat theft statement](https://www.prnewswire.com/news-releases/thieves-make-a-break-for-it-as-12-tonnes-of-kitkat-go-missing-302727467.html) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7163).
- Tesla stream and footage provenance: [review image sources](../../.planning/review-feedback/2026-11-17/final-image-sources.md).
- Card data and image attribution: [candidates](../../research/candidates.json).
- Existing video and editable renderer: [first draft package](assets/tiktok-homework/README.md).
