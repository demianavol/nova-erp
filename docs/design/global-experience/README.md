# «Опыт без границ» — supplied video and interactive bubbles

The section retains the supplied moving flag footage. The three country buttons
highlight the actual selected flag without moving, scaling or seeking the video.
There is no visible pause/play button. Country descriptions remain marked
«Прототип · На подтверждении»; no unverified achievements were added.

## Separate supplied films for both themes

Dark theme uses `flags-film-masked-v3.mp4` (about 2.15MB). Light theme uses
`flags-film-native-light-v3.mp4`, prepared from the supplied light video. The dark
loop has 226 frames and the light loop has 173 frames, both at 24 fps. The light
transition aligns movement in the footage before blending. Packed resolution
is 896 × 1440 with original RGB footage above and
synchronized China/Kyrgyzstan/Uzbekistan mattes in the lower RGB channels.

`global-experience-video-compositor.ts` is a small WebGL video compositor, with no
cloth geometry. Dark atmosphere has continuous alpha and an elliptical falloff.
The light film retains its original lighting, shadows, globe and pale background;
only its perimeter fades into the page. Flag coverage protects outer fabric edges.
Selection grades the original pixels in place, brightening the chosen flag up
to 8% and dimming the other two up to 14%. Theme switching loads the appropriate source and restores the playhead;
country selection always retains the current source, position and playback time.

Sources, unchanged in the user's Downloads folder:

- `gemini_generated_video_9958c37b.mp4`, SHA-256
  `982E00CA9799807277B51EF7028A493BD5FBFDB7733BC03B50681017A9C9E4E3`.
- `a_Young_Unicorn_—_LIGH.mp4`, SHA-256
  `9D6C9CF29D314BEB7050C348CD81BAB0DBBFA6F76F8CCAA0171EB6ED2A62273B`.

Preparation requires FFmpeg/imageio-ffmpeg, OpenCV, numpy, scipy and Pillow. No
runtime dependency was added. For the native light source, run the existing video
preparation script with `SOURCE --native-light`, then the mask script with
`--native-light --source public/media/global-experience/flags-film-native-light.mp4`.
Then run `python scripts/stabilize-light-flag-mattes.py` to restore missing red
folds and smooth the mattes across motion-aligned frames. Run
`python scripts/loop-light-flags.py` to close the light loop using the same
motion map for both the footage and the mattes. The previous recolored
light film and old packed variants are retained only as
preparation references; the section does not request them. `light-video-prompt.txt`
is retained as the earlier generation brief.

## Uzbekistan lower-left corner

Per-frame GrabCut incorrectly removed purple-lit cloth below the bright orbit.
Green-only seeds fixed green pixels but missed dark folds. The dark-film generator
now tracks the full-resolution hem within source-reviewed rotoscope guides and
continues the visible leading edge through the corner. Spatial/temporal smoothing
and a narrow feather preserve a continuous silhouette with original RGB motion.

`verify-global-experience-matte.py` audits the actual encoded film across all
226 frames. It checks green fabric AND a source-reviewed all-color cloth interior.
The previous v2 film lost up to 740 pixels in the all-color check despite passing
the green-only check. The v3 film loses **0** in both checks. `matte-report.json`
records each frame; `uzbekistan-full-cycle.jpg` compares the source and encoded
cloth silhouette at 20 times, including the loop join.

## Country description typing

Only the selected country's description uses the typewriter effect. The section
heading, lead, country labels and status keep their existing appearance. Each
description reserves its complete footprint, so typing does not shift controls
or video. Screen readers receive the complete text once; animated characters are
hidden from accessibility. Reduced motion shows the complete text immediately.

## Bubbles across the section

Eight glass bubbles float continuously on independent axes, with different periods
and phases. Hover repulsion uses a smooth distance field and critical damping:
about 11px of travel, with continuous position and velocity when the pointer crosses
or leaves. Light-theme bubbles have a stronger violet rim, shading and 0.76 opacity;
dark-theme bubbles use 0.4 opacity.

Pressing a bubble expands and breaks it into a ring and six small drops. It stays
absent briefly, then a new bubble grows at the same position over a 1.7s sequence.
Autonomous drift pauses during the pop and resumes after respawn. Repeated presses
while absent are ignored. Country buttons/links never trigger popping. The bubbles
remain decorative, without extra tab stops. Animations are cleaned up on unmount;
autonomous motion pauses offscreen and under reduced motion.

## Verification and fallbacks

`browser-report.json` records ten layouts (1440, 1024, 768, 390 and 320px in both
themes) and thirty country selections. It verifies stable video/selector positions,
no horizontal overflow, country-specific canvas pixel changes, transparent borders,
correct theme source and retained playhead, looping and offscreen pause. It also
checks panel-only typing without height changes, autonomous bubble movement,
responsive smooth hover, bubble disappearance/respawn and light-theme visibility.
Reduced motion uses theme-specific posters without requesting either MP4. Video
or WebGL failure retains the poster and usable country information controls.

TypeScript, production build and Vitest (12 files / 78 tests) pass. Existing Zod
annotation warnings in the build and experimental Node localStorage warnings in
Vitest are unchanged. Browser QA uses installed Microsoft Edge via Playwright;
`PREVIEW_URL` and `BROWSER_CHANNEL` override its defaults.

The compositor is lazy-imported near the section. Drawing follows decoded frames
via `requestVideoFrameCallback`, with DPR capped at 1.5. Playback/rendering pause
offscreen and when the document is hidden. Only the active theme video is decoded.

## Relevant implementation

- `src/components/global-experience.tsx` and `experience-typewriter.tsx`
- `src/components/global-experience-film.tsx`
- `src/components/global-experience-video-compositor.ts`
- `src/components/global-experience-atmosphere.tsx`
- `src/global-experience.css`
- `scripts/prepare-global-experience-video.py`
- `scripts/prepare-global-experience-masks.py`
- `scripts/verify-global-experience-matte.py`
- `scripts/verify-global-experience.cjs`
- `public/media/global-experience/NOTICE.txt`, current packed films and posters

Unrelated pre-existing working-tree changes and other sections are retained.
