# Browser comment verification — 5 November 2026

Latest refinement:
- Future uses the supplied React Bits GradientWaves. Final speed .22 (down from .9), amplitude 2.2, opacity .45 dark / .6 light. Broad alpha feathering preserves the visible waves without a rectangular boundary. No grain; medium quality, .85 DPR, maximum 60Hz GPU budget, offscreen/reduced-motion pause.
- Light-theme careers footage is fully opaque and unfiltered in a rounded image window. Removed the triple feathered mask from light mode. Mobile order is heading, footage, benefit cards; checked at 390×844 with no horizontal overflow. Dark mode retains its existing blended film.
- Flags are drawn only when a new video frame arrives. Country selection changes the next frame's uniforms and no longer schedules a 60–144Hz full-canvas transition loop. Selection keeps the existing source, playhead, synchronized mattes, modest lift and foreground occlusion. Painting of the video and copy panel is contained separately.
- The regression test submits rapid country changes across 49 decoded frames and asserts exactly 49 draws, 48 texture updates after allocation, no extra animation frames, and no work from a late callback after disposal.
- Live light-theme selection sequence cn→kg→uz advanced canvas frame 3→45 and media time .083→1.833, with playback continuing and no console errors. Prior RAF draw-submission FPS numbers were not GPU benchmarks and have been removed from the implementation.

Retained changes:
- Header has three hover/click categories containing all eight section links; grouped mobile menu, quiet translucent outline, no orbit decoration.
- Partnership restores the previous soft, fixed-height Silk field and fade=.5 after the full-section version was rejected.
- Hero/history retry playback on return/gesture/pageshow. A manual fallback appears only after actual blocked play or media failure. Source files are unchanged.

Validation: TypeScript, production build and all 120 Vitest tests pass. Existing Zod annotation / Node localStorage warnings remain.

Current proof images: future-waves-calm.jpg, careers-crisp-light.jpg, careers-crisp-mobile.jpg, flags-decoder-paced-light.jpg. Earlier images record superseded iterations.
