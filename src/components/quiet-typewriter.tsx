import { useEffect, useRef } from "react";

/** Keep character updates out of React and announce the complete text just once. */
export function QuietTypewriter({ text }: { text: string }) {
  const ink = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ink.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const characters = Array.from(text);
    const started = performance.now();
    let frame = 0;
    let count = 0;
    element.textContent = "";

    const finish = () => {
      cancelAnimationFrame(frame);
      count = characters.length;
      element.textContent = text;
    };
    const render = (time: number) => {
      const elapsed = time - started;
      // Normal copy types at 22 ms/character; long copy finishes within 2.2 s.
      const next =
        elapsed >= 2200
          ? characters.length
          : Math.min(characters.length, Math.floor(elapsed / 22) + 1);
      if (next !== count) {
        count = next;
        element.textContent = characters.slice(0, count).join("");
      }
      if (count < characters.length) frame = requestAnimationFrame(render);
    };
    const updateMotion = () => {
      if (motion.matches) finish();
    };
    if (motion.matches) finish();
    else frame = requestAnimationFrame(render);
    motion.addEventListener("change", updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", updateMotion);
    };
  }, [text]);

  return (
    <>
      <span ref={ink} aria-hidden="true" data-typewriter="" />
      <span className="sr-only">{text}</span>
    </>
  );
}
