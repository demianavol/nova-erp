import { useLayoutEffect, useRef, type RefObject } from "react";
import {
  historyMilestoneVisuals,
  type HistoryMilestoneVisual as Visual,
} from "../data/history-milestone-visuals";

const visuals = Object.values(historyMilestoneVisuals);

// PNG artwork adapter. A future GLB renderer can replace this inner stack while
// retaining the pointer controller, accessible label and surrounding layout.
function HistoryMilestonePngStack({ visual }: { visual: Visual }) {
  const root = useRef<HTMLSpanElement>(null);
  const animations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const layers = [...root.current!.querySelectorAll("img")];
    const update = () => {
      // Snapshot before cancellation: quick reversals continue from the actual
      // painted state, even halfway through the previous entrance.
      const snapshots = layers.map((layer) => {
        const style = getComputedStyle(layer);
        return { opacity: style.opacity, transform: style.transform };
      });
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      layers.forEach((layer, index) => {
        const selected = layer.dataset.asset === visual.asset;
        const current = snapshots[index];
        const end = {
          opacity: selected ? "1" : "0",
          transform: selected ? "none" : "translateY(8px)",
        };
        Object.assign(layer.style, end);
        if (media.matches || (!selected && +current.opacity === 0)) return;
        const start =
          selected && +current.opacity === 0
            ? { opacity: "0", transform: "translateY(8px)" }
            : current;
        animations.current.push(
          layer.animate(
            selected
              ? [
                  start,
                  { offset: 0.85, opacity: "1", transform: "translateY(-1px)" },
                  end,
                ]
              : [start, end],
            {
              duration: 400,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            },
          ),
        );
      });
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [visual.asset]);

  useLayoutEffect(
    () => () => animations.current.forEach((animation) => animation.cancel()),
    [],
  );

  return (
    <span ref={root} className="journey-emblem-stack">
      {visuals.map((item) => (
        <img
          key={item.asset}
          data-asset={item.asset}
          src={`${import.meta.env.BASE_URL}${item.asset}`}
          alt=""
          width="1254"
          height="1254"
          decoding="sync"
          draggable="false"
        />
      ))}
    </span>
  );
}

export function HistoryMilestoneVisual({
  visual,
  interactionArea,
}: {
  visual: Visual;
  interactionArea?: RefObject<HTMLDivElement | null>;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const object = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const rotation = useRef({ x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 });
  const advance = () => {
    const state = rotation.current;
    state.vx = (state.vx + (state.targetX - state.x) * 0.12) * 0.68;
    state.vy = (state.vy + (state.targetY - state.y) * 0.12) * 0.68;
    state.x = Math.max(-12, Math.min(12, state.x + state.vx));
    state.y = Math.max(-12, Math.min(12, state.y + state.vy));
    const settled =
      Math.abs(state.targetX - state.x) +
        Math.abs(state.targetY - state.y) +
        Math.abs(state.vx) +
        Math.abs(state.vy) <
      0.005;
    if (settled) {
      state.x = state.targetX;
      state.y = state.targetY;
      state.vx = state.vy = 0;
    }
    if (object.current)
      object.current.style.transform =
        state.x || state.y
          ? `translate3d(${state.y * 0.55}px,${-state.x * 0.35}px,0) rotateX(${state.x}deg) rotateY(${state.y}deg)`
          : "none";
    frame.current = settled ? 0 : requestAnimationFrame(advance);
  };
  const start = () => {
    if (!frame.current) frame.current = requestAnimationFrame(advance);
  };
  useLayoutEffect(() => {
    const area = interactionArea?.current ?? root.current;
    if (!area) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reset = () => {
      if (!media.matches) return;
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      rotation.current = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 };
      if (object.current) object.current.style.transform = "none";
    };
    const move = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        !matchMedia(
          "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        ).matches
      )
        return;
      const bounds = area.getBoundingClientRect();
      const x = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
      );
      const y = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
      );
      rotation.current.targetX = -y * 12;
      rotation.current.targetY = x * 12;
      root.current?.style.setProperty("--reflection-x", `${(x + 1) * 50}%`);
      root.current?.style.setProperty("--reflection-y", `${(y + 1) * 50}%`);
      start();
    };
    const leave = () => {
      rotation.current.targetX = rotation.current.targetY = 0;
      start();
    };
    area.addEventListener("pointermove", move, { passive: true });
    area.addEventListener("pointerleave", leave);
    media.addEventListener("change", reset);
    return () => {
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
      media.removeEventListener("change", reset);
      cancelAnimationFrame(frame.current);
    };
  }, [interactionArea]);
  return (
    <span
      ref={root}
      className="journey-emblem"
      data-render="approved-asset"
      data-active-asset={visual.asset}
      role="img"
      aria-label={`Визуальная метафора: ${visual.label}`}
    >
      <span ref={object} className="journey-emblem-object">
        <HistoryMilestonePngStack visual={visual} />
        <span
          className="journey-emblem-reflection"
          aria-hidden="true"
          style={{
            maskImage: `url("${import.meta.env.BASE_URL}${visual.asset}")`,
          }}
        />
      </span>
    </span>
  );
}
