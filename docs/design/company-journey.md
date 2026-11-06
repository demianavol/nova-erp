# Young Unicorn journey — current implementation

The company-history block is real HTML/CSS/SVG over the approved Veo scene. The
reference screenshot is never used as a background. Current work prioritizes PC;
further phone optimization is deferred at the user's request.

## Artwork and scope

`src/data/history-media.ts` selects the existing light/dark MP4 and matching poster.
The original 16:9 contain fitting, object scale, right/bottom placement, masks,
autoplay/muted/loop/playsInline and reduced-motion poster are preserved. No video,
poster or other landing/ERP asset was regenerated or altered.

Seven supplied RGBA PNGs are copied byte-for-byte to `public/media/history-icons`.
`src/data/history-milestone-visuals.ts` maps foundation, clothing, package, sparkle,
growth, shopping bag and rocket to 2020–2026. These are visual metaphors, not proof
of historical achievements. Resident PNG layers crossfade in 400ms without
remounting; interrupted transitions continue from the current painted opacity.

The icon is now a larger background layer behind the year, with bounded position
variation between stages. A damped pointer controller follows the history spread
(up to 12 degrees and a few pixels of parallax). It returns to rest on leave and
stops for reduced motion/coarse pointers. Text and timeline remain above this
layer, which never intercepts clicks. PNGs remain 2D renders; the isolated artwork
adapter can later be replaced with a GLB renderer without changing the controller.

## Editorial content and photographs

`src/data/history-editorial-copy.ts` supplies short titles and one-sentence copy.
The full original milestone text, evidence and verification status remain in
company-history/company-journey and as fullHeadline/fullDescription in the view
model. There are no new claims or aggregated statistics. Only «Наш путь» remains
in the section header; the upper-right period/prototype captions were removed.

`src/data/history-photographs.ts` distinguishes pending/example/verified material.
The user explicitly requested temporary examples. The current seven images come
from existing editorial/product visuals, carry «Пример фото», and explicitly say
in their enlarged captions that they are not dated historical photographs.
No illustrative photograph is promoted to verified archive evidence.

Each year has an independently composed set of one to three prints. Counts,
positions, main-print aspect ratios and angles are configured per year; hidden
slots fade out and are inert. The main Polaroid, wider print and portrait print
use different proportions. The larger glass object has a separate clear area
beside the reading column, with a stage-specific angle and pointer parallax.
Paper is warm white in light mode and muted lavender-grey (#c6bccd) in dark mode.
The primary paperclip is SVG; photos, paper and glass are independent of the video.
The gallery stays below the reading area and raises a hovered/focused print.
Each available image opens a Radix Dialog lightbox with its caption, focus trap,
Escape/outside dismissal and focus return. Empty pending slots retain a clearly
marked placeholder. The original historical statuses remain separate from example
image provenance. Replace asset/alt/caption/source and verification together when
approved company photography becomes available.

## Timeline synchronization

One canonical arc-length fraction drives local dash lengths and getPointAtLength
coordinates. The progress path deliberately omits non-scaling-stroke: combining
that effect with normalized dash lengths had caused painted endpoint drift under
the stretched viewBox. Fixed dots use the same path. The last crossed milestone
selects the year; React commits milestone changes in the same frame as SVG updates.
Fractional scrolling does not rerender the narrative. Manual selection uses one
cancellable RAF tween, interrupted continuously by scroll. ResizeObserver updates
geometry. Finite 300–320ms arrival/ripple feedback never eases the endpoint itself.

## Other animation fixes authorized earlier in this session

The original detailed primary-stat SVG choreography is restored in
`metric-svg-animation.ts`: staggered people, lifted bag/check drawing, fanned brand
cards and drawn growth chart/endpoint. One animation owner snapshots interrupted
states and returns to a fully visible deterministic rest state on mouse leave.
No entrance sequence restarts on exit; the three lower metrics are unchanged.

Directions had two edge causes: lifting the entire clipped button exposed a 2px
container strip; separately promoted photographs could expose a source-pixel
fringe around independently painted gradients at fractional zoom. The frame now
stays stationary. Image and vignette share one transformed visual wrapper and
one final rounded clip; the outer viewport has no pale backing. Photos, card
proportions, text/CTA reveal and navigation are preserved. No opaque masking
rectangle or white overlay was added.

## Verification evidence

Earlier browser checks: `output/glass-icons-final` records the restored rich SVG
sequences, monotonic mouse-leave recovery, 64 rapid statistic hover reversals,
48 direction reversals and the original seven PNGs loading successfully.

`output/history-editorial-final` contains desktop/light/dark captures, 112
composition cases before example population, 42 populated-example cases, photo
lightbox checks, all-seven-icon tilt/keyboard checks and 529 rapid-scroll frames
without remounting or blank artwork. The native painted-endpoint audit has 75
samples including fractional progress, resize and reduced-motion interruption.
Latest changes were additionally inspected in the user's actual in-app browser,
including all seven PC scenes and their three loaded photo slots. Final PC
screenshots show the shortened copy, larger background icon and collage.

TypeScript, production build and the existing 66 tests are required final checks.

Final PC refinement: the glass object is 290px on the main desktop spread,
with a dedicated clear area beside the reading column and a unique angle per
year. Seven-scene checks in the user browser confirm no text intersection.
Photo sets vary 1/2/3/2/3/2/2; count, positions, aspect ratio and angle are
editorial settings, not archive quantities. Hidden prints fade out and are inert.
Current screenshots and checks: final-pc-light.jpg, final-pc-dark.jpg and
final-pc-scenes.json in output/history-editorial-final. Phone work is deferred.
