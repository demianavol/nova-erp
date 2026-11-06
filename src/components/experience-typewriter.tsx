import { useEffect, useRef, useState } from "react";

/** Reserve the complete copy's footprint; character updates never shift layout. */
export function ExperienceTypewriter({
  text,
  delay = 0,
  pace = 25,
}: {
  text: string;
  delay?: number;
  pace?: number;
}) {
  const [count, setCount] = useState(0);
  const completed = useRef(false);
  const characters = Array.from(text);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      completed.current = true;
      setCount(Array.from(text).length);
    };
    const changed = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", changed);
    if (motion.matches || completed.current) finish();
    else {
      const start = performance.now() + delay;
      const length = Array.from(text).length;
      const render = (now: number) => {
        const next = Math.min(
          length,
          Math.max(0, Math.floor((now - start) / pace) + 1),
        );
        setCount(next);
        if (next < length) frame = requestAnimationFrame(render);
        else completed.current = true;
      };
      frame = requestAnimationFrame(render);
    }
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", changed);
    };
  }, [text, delay, pace]);
  const typing = count > 0 && count < characters.length;
  return (
    <span
      className="ge-typewriter"
      data-typing={typing}
      data-complete={count === characters.length}
    >
      <span className="ge-typewriter-reserve" aria-hidden="true">
        {text}
      </span>
      <span className="ge-typewriter-ink" aria-hidden="true">
        {characters.slice(0, count).join("")}
        {typing && <span className="ge-typewriter-caret" />}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
