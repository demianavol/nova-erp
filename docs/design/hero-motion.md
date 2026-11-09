# Young Unicorn hero motion

The first screen shows the company description and animated headline next to
the original glass mark. The dark theme uses a near-black surface with a
subtle moving glow behind the mark. Navigation is in the site header. The
three glass shards reveal details on pointer hover, keyboard focus, or tap.

## Loop preparation

Run `python scripts/prepare-hero-logo.py` with PyAV, Pillow, NumPy, SciPy and
imageio-ffmpeg. It rotoscopes the shards from the existing 24 fps
`young-unicorn-hero-loop.mp4`, using a 650 × 550 source crop. It produces a
transparent 640 × 540 WebP poster and one H.264 loop containing three stacked
640 × 540 planes for color, alpha and signed edge distance. ElectricLogo
samples the three planes in the same draw so the rim light follows the glass.

The display canvas uses the layout size and device pixel ratio, capped at 2×
and 1280 pixels wide. The 640 × 540 media keeps almost all the detail in the
source crop. A higher resolution original would be needed for more detail.

## Playback and accessibility

- Playback pauses offscreen and in hidden tabs.
- Reduced motion, printing and PDF export use the transparent poster.
- When WebGL is unavailable, Canvas 2D composites the color and alpha planes
  of the same video. The original glass motion continues without the
  shader-generated rim light. The poster covers loading and media failure.
  Blocked autoplay can be retried with the play button.
