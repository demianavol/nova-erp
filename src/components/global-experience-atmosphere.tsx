import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type CSSProperties,
} from "react";

const bubbles = [
  { x: 5, y: 17, size: 72, delay: -4, duration: 9.7, float: 24, sway: 10 },
  { x: 17, y: 80, size: 36, delay: -9, duration: 11.1, float: 29, sway: 14 },
  { x: 31, y: 6, size: 24, delay: -2, duration: 8.9, float: 21, sway: 12 },
  { x: 39, y: 66, size: 52, delay: -6, duration: 12.3, float: 25, sway: 16 },
  { x: 61, y: 9, size: 29, delay: -11, duration: 10.6, float: 27, sway: 11 },
  { x: 91, y: 18, size: 78, delay: -7, duration: 11.8, float: 23, sway: 13 },
  { x: 95, y: 77, size: 42, delay: -3, duration: 9.3, float: 28, sway: 15 },
  { x: 56, y: 91, size: 66, delay: -13, duration: 13.1, float: 26, sway: 12 },
];

/** Decorative glass bubbles: gentle cursor repulsion, never additional controls. */
export function GlobalExperienceAtmosphere({
  section,
}: {
  section: RefObject<HTMLElement | null>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = section.current,
      layer = root.current;
    if (!element || !layer) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const nodes = Array.from(
      layer.querySelectorAll<HTMLElement>(".ge-bubble-position"),
    );
    const positions = nodes.map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
    }));
    const animations = new Set<Animation>();
    const animate = (
      element: HTMLElement,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      const animation = element.animate(keyframes, options);
      animations.add(animation);
      animation.addEventListener("finish", () => animations.delete(animation), {
        once: true,
      });
      return animation;
    };
    let frame = 0,
      previous = 0,
      visible = false;
    let bounds: DOMRect | null = null;
    let measurePending = true;
    let pointer: { x: number; y: number } | null = null;
    const draw = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || preference.matches) return;
      if (measurePending) {
        bounds = layer.getBoundingClientRect();
        measurePending = false;
      }
      // Ambient movement is decorative; stable layout centres avoid reading
      // eight animated element rectangles for every mouse event.
      const pointerPosition = pointer;
      const measuredBounds = bounds;
      if (pointerPosition && measuredBounds) {
        positions.forEach((p, i) => {
          if (nodes[i].dataset.popping === "true") return;
          const bubble = bubbles[i];
          const dx =
            pointerPosition.x -
            measuredBounds.left -
            (measuredBounds.width * bubble.x) / 100 -
            bubble.size / 2;
          const dy =
            pointerPosition.y -
            measuredBounds.top -
            (measuredBounds.height * bubble.y) / 100 -
            bubble.size / 2;
          const radius = 145;
          const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
          p.tx = (-dx / radius) * 26 * influence;
          p.ty = (-dy / radius) * 26 * influence;
        });
      }
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 1 / 60;
      previous = time;
      // Critically damped, frame-rate-independent response. Position AND
      // velocity stay continuous when the cursor changes direction or leaves.
      const omega = 9;
      const decay = Math.exp(-omega * dt);
      let settling = false;
      positions.forEach((p, i) => {
        const dx = p.x - p.tx,
          dy = p.y - p.ty;
        const cx = p.vx + omega * dx,
          cy = p.vy + omega * dy;
        p.x = p.tx + (dx + cx * dt) * decay;
        p.y = p.ty + (dy + cy * dt) * decay;
        p.vx = (p.vx - omega * cx * dt) * decay;
        p.vy = (p.vy - omega * cy * dt) * decay;
        nodes[i].style.translate = `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`;
        if (
          Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) > 0.02 ||
          Math.abs(p.vx) + Math.abs(p.vy) > 0.05
        )
          settling = true;
      });
      if (settling) frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden && !preference.matches) {
        previous = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    const move = (event: PointerEvent) => {
      if (preference.matches || event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const leave = () => {
      pointer = null;
      positions.forEach((p, i) => {
        if (nodes[i].dataset.popping === "true") return;
        p.tx = 0;
        p.ty = 0;
      });
      schedule();
    };
    const touch = (event: PointerEvent) => {
      if (
        preference.matches ||
        (event.target as Element).closest("button,a,input")
      )
        return;
      for (let i = 0; i < nodes.length; i++) {
        const glass = nodes[i].querySelector<HTMLElement>(".ge-bubble-glass");
        if (!glass || nodes[i].dataset.popping === "true") continue;
        const rect = glass.getBoundingClientRect();
        const distance = Math.hypot(
          event.clientX - rect.left - rect.width / 2,
          event.clientY - rect.top - rect.height / 2,
        );
        if (distance > rect.width / 2 + 6) continue;
        const opacity = Number(getComputedStyle(glass).opacity);
        nodes[i].dataset.popping = "true";
        const p = positions[i];
        p.tx = p.x;
        p.ty = p.y;
        p.vx = p.vy = 0;
        animate(
          nodes[i].querySelector<HTMLElement>(".ge-bubble-ring")!,
          [
            { opacity: 0, scale: ".9" },
            { opacity: 0.85, scale: "1.08", offset: 0.12 },
            { opacity: 0, scale: "1.55" },
          ],
          { duration: 480, easing: "ease-out" },
        );
        nodes[i]
          .querySelectorAll<HTMLElement>(".ge-bubble-drop")
          .forEach((drop, j) => {
            const angle = (j * Math.PI) / 3;
            const travel = rect.width * 0.72;
            animate(
              drop,
              [
                { opacity: 0, transform: "translate(0,0) scale(.4)" },
                { opacity: 0.85, offset: 0.12 },
                {
                  opacity: 0,
                  transform: `translate(${Math.cos(angle) * travel}px,${Math.sin(angle) * travel}px) scale(.2)`,
                },
              ],
              { duration: 580, easing: "cubic-bezier(.1,.6,.4,1)" },
            );
          });
        const pop = animate(
          glass,
          [
            { opacity, scale: "1" },
            { opacity: opacity + 0.15, scale: "1.07", offset: 0.07 },
            { opacity: 0, scale: "1.2", offset: 0.16 },
            { opacity: 0, scale: ".25", offset: 0.67 },
            { opacity: opacity * 0.8, scale: ".93", offset: 0.9 },
            { opacity, scale: "1" },
          ],
          { duration: 1700, easing: "ease-in-out" },
        );
        pop.addEventListener(
          "finish",
          () => {
            delete nodes[i].dataset.popping;
            p.tx = p.ty = 0;
            schedule();
          },
          { once: true },
        );
        break;
      }
    };
    const visibility = () => {
      measurePending = true;
      setActive(visible && !document.hidden && !preference.matches);
      if (!visible || document.hidden || preference.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        positions.forEach((p, i) => {
          p.tx = p.ty = 0;
          if (preference.matches) {
            p.x = p.y = p.vx = p.vy = 0;
            nodes[i].style.translate = "0px 0px";
          }
        });
      } else schedule();
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      visibility();
    });
    observer.observe(element);
    const measure = () => {
      measurePending = true;
      schedule();
    };
    const sizing = new ResizeObserver(measure);
    sizing.observe(layer);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", leave);
    element.addEventListener("pointerdown", touch, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    preference.addEventListener("change", visibility);
    return () => {
      observer.disconnect();
      sizing.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("pointerdown", touch);
      document.removeEventListener("visibilitychange", visibility);
      preference.removeEventListener("change", visibility);
    };
  }, [section]);
  return (
    <div
      ref={root}
      className="ge-atmosphere"
      data-active={active}
      aria-hidden="true"
    >
      {bubbles.map((bubble, i) => (
        <span
          key={i}
          className="ge-bubble-position"
          style={
            {
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size,
              "--ge-bubble-delay": `${bubble.delay}s`,
              "--ge-bubble-duration": `${bubble.duration}s`,
              "--ge-bubble-sway-duration": `${bubble.duration * 1.27}s`,
              "--ge-bubble-float": `${bubble.float}px`,
              "--ge-bubble-sway": `${bubble.sway}px`,
            } as CSSProperties
          }
        >
          <span className="ge-bubble-drift">
            <span className="ge-bubble-sway">
              <span className="ge-bubble-glass" />
              <span className="ge-bubble-ring" />
              {Array.from({ length: 6 }, (_, j) => (
                <span key={j} className="ge-bubble-drop" />
              ))}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
