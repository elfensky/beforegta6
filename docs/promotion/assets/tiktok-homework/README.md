# The meme became homework

Status: local video draft. Concept selected by Andrei on 17 November 2026.
The final video and caption are not approved for publication. Nothing is uploaded.

## Deliverables

- `beforegta6-homework-draft.mp4`: 17.9 seconds, 1080 × 1920, 30 frames per second, H.264 video and AAC audio.
- `temporary-narration.wav`: temporary macOS Daniel narration, not Andrei's voice.
- `voiceover.txt`: the narration text.
- `captions.srt`: timed narration captions for editing.
- `caption.txt`: proposed post caption and image credits.
- `contact-sheet.jpg`: five frames extracted from the encoded video.
- `draft.html`, `render.mjs`, and `timing.json`: editable source and scene timing.

Large captions are part of the video. No music is included.
The last scene shows the actual locally built homepage. Its external requests were blocked during capture.
The final website address remains visible for the entire last scene, including a silent ending of more than two seconds.

The website remains live after this final promotion attempt.

## Verification — 17 November 2026

The final MP4 decodes without errors. It contains 1080 × 1920 H.264 video at 30 fps and stereo AAC audio at 48 kHz.
Its duration is 17.9 seconds. The measured audio peak is −2.4 dBFS, with no clipping.
Extracted frames show readable captions, the three images, and a populated website scroll at the ending.
The repository gate passes: lint, 92 tests, the 210-page build, and HTML validation.
Browser end-to-end tests were not repeated for this local video package.

## Narration

> I started fact-checking the before GTA six meme.
>
> Google's AI suggested glue on pizza.
>
> America put tariffs on islands full of penguins.
>
> Katy Perry went to space.
>
> Anyway, I accidentally made a history website.

## Image credits

The three featured photos come from the existing reviewed assets.
Their author and licence labels appear in the video. The opening uses cropped thumbnails; the main scenes preserve the full photos.

- Pizza: [Margherita pizza on plate](https://commons.wikimedia.org/wiki/File:Margherita_pizza_on_plate.jpg), Shisma, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Illustrative food photo, not a screenshot of Google's answer.
- Penguins: [King Penguins at Corinthian Bay, Heard Island](https://commons.wikimedia.org/wiki/File:King_Penguins_at_Corinthian_Bay,_Heard_Island.jpg), laikolosse, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- Katy Perry: [Budapest concert portrait, 27 October 2025](https://commons.wikimedia.org/wiki/File:Katy_Perry_in_Budapest,_Hungary_at_MVM_Dome_for_the_Lifetimes_Tour_(October_27,_2025).jpg), Misterwiki16, CC0. This is a concert photo, not her space flight.

Provenance comes from `research/candidates.json`. No new online image search was used for this draft.

## Rebuild

Run from the repository root:

```sh
node docs/promotion/assets/tiktok-homework/render.mjs
```

The renderer requires the existing npm dependencies, the built `dist/` site, FFmpeg, and the installed macOS Daniel voice.
It writes local files only. It does not contact TikTok or publish the website.
Remove `.render-cache/voice-*.aiff` after changing narration text or voice settings, then rebuild.
Generated media stays in this folder and is excluded from Git. The source remains editable.
