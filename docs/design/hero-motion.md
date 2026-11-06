# Young Unicorn hero motion

The hero blends into the page in both themes. A restrained LiquidEther field sits
behind the copy and the glass mark. The mark is on the right on desktop and below
the copy on narrow screens.

## Loop preparation

Run `python scripts/prepare-hero-logo.py` using PyAV, Pillow, NumPy, SciPy and
imageio-ffmpeg. It rotoscopes the three shards from the existing 24 fps
`young-unicorn-hero-loop.mp4`, then produces a transparent WebP poster and an
H.264 loop with three stacked 512 × 432 planes for color, alpha and signed edge
distance. ElectricLogo traces the distance plane in the same draw as the color
and alpha. Each decoder frame therefore has one matching outline, including at
the loop seam.

## Interaction and accessibility

- The simulation runs at up to 30 updates per second. Pointer motion drives
  the full width, and pointer presses do not trigger bursts.
- Both effects pause offscreen and in hidden tabs. Reduced motion, printing and
  PDF export use the transparent poster and static gradient.
- The poster appears during loading or on media or WebGL failure. A blocked
  autoplay can still be retried with the play button.

## Hero navigation cards

- Four primary glass cards navigate to «01 — Результаты» → `results`, «02 — Направления» → `directions`, «03 — Наш путь» → `about`, and «04 — Наш подход» → `advantages`. A second horizontal row has three borderless text links: «05 — Бренды» → `brands`, «06 — Карьера» → `team`, and «07 — Партнёрам» → `partners`. Nothing is selected initially, and no explanatory copy is visible until interaction. There is no decorative line or orange accent.
- All seven destinations are separate sections in that exact document order. «Направления» scrolls to clothing, self-care, and oral care, with the description «От одежды до новых категорий продуктов». There is no separate expertise section, so its former card was replaced rather than adding an eighth item. The new «Наши бренды» portfolio sits after the approach section and before the team; its content and catalog CTA are separate from the business-directions overview. Existing sections remain unchanged.
- A fine mouse pointer previews each description with a 3 px card lift. The preview clears on pointer exit, while keyboard focus retains its description. Tab moves between links, Enter navigates, and Escape dismisses the preview. Clicks and taps navigate directly, with focus transferred to the section heading; modified clicks retain native link behavior. Repeated activation of the current destination still scrolls. Destinations missing at mount render description-only buttons; click-time checks also guard destinations removed later.
- A twelve-track grid keeps the four primary cards in one row (three tracks each) and the three secondary text links in a second row (four tracks each). Both rows remain horizontal across the tested 320–1440 px range, with comfortable touch targets. Secondary links have no card backgrounds, borders, or shadows. Navigation accounts for the fixed header and scrolls smoothly unless reduced motion is enabled.
- The headline is exactly «Создаём» / «бренды», without punctuation, retaining the original font, line breaks, and white/lavender colors. On desktop, the headline-to-navigation gap is 36 px and the card-to-link gap is 18 px. Primary labels are 11 px with medium weight; card padding and responsive gaps increase readability without changing the desktop hero height.
- The four primary icons are custom inline SVG components in `src/components/hero-navigation-icons.tsx`, inspired by minimalist Lucide shapes. Animation targets named paths and groups, never the entire SVG: chart bars grow with a 30 ms stagger; four direction tiles separate subtly; the history arrow and clock hands move independently; the bulb brightens as lavender rays appear. Transitions hold a steady active state and reverse smoothly on pointer/focus exit. No looping animation or glow filter is used.
- Secondary arrows move 3 px diagonally on mouse hover or keyboard focus, accompanied by subtle text color and underline transitions. Reduced motion freezes primary icon parts in their default state and disables card elevation, arrow movement, and entry/typewriter effects.
- After the hero scrolls out of view, a fixed «Наверх» link navigates smoothly to `hero` and focuses the first navigation card. It also works after manual scrolling, direct section links, and repeated activation of the hero hash, and disappears at the hero. An IntersectionObserver controls its visibility; no scroll listener runs on every frame.
- The description fades upward by 6 px over 280 ms and types at 22 ms per character, with a 2.2-second upper limit. Character updates use one requestAnimationFrame loop and a dedicated DOM text node. Switching or dismissing descriptions cancels the previous loop.
- Hidden, aria-hidden sizing copies reserve the tallest possible description at the current width, including the empty state. The full description is exposed to the polite live region once; character updates are hidden from assistive technology. Reduced motion displays the full copy immediately with no entry animation.
