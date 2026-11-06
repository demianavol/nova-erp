import { useLayoutEffect, useRef, type RefObject } from "react";

type Sequence = {
  selector: string;
  frames: Keyframe[];
  duration: number;
  delay?: number;
  rest?: string;
  easing?: string;
};

// Original multi-part SVG choreography and timings, recovered from landing.css.
const sequences: Sequence[][] = [
  [0, 90, 180].map((delay, i) => ({
    selector: [".mm-person-left", ".mm-person-right", ".mm-person-center"][i],
    frames: [
      { transform: "translateY(9px)", opacity: 0.25 },
      { offset: 0.65, transform: "translateY(-2px)", opacity: 1 },
      { transform: "none", opacity: 1 },
    ],
    duration: 700,
    delay,
  })),
  [
    {
      selector: ".mm-shopping-bag",
      frames: [
        { transform: "none" },
        { offset: 0.45, transform: "translateY(-4px)" },
        { transform: "none" },
      ],
      duration: 700,
    },
    {
      selector: ".mm-order-confirm",
      frames: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      duration: 600,
      delay: 120,
      easing: "ease",
    },
  ],
  [
    {
      selector: ".mm-brand-one",
      rest: "translate(-11px, 3px) rotate(-15deg)",
      frames: [
        { transform: "translate(-11px, 3px) rotate(-15deg)" },
        { offset: 0.45, transform: "translate(-17px, 0) rotate(-24deg)" },
        { transform: "translate(-11px, 3px) rotate(-15deg)" },
      ],
      duration: 800,
    },
    {
      selector: ".mm-brand-two",
      frames: [
        { transform: "none" },
        { offset: 0.45, transform: "translateY(-4px)" },
        { transform: "none" },
      ],
      duration: 800,
    },
    {
      selector: ".mm-brand-three",
      rest: "translate(10px, 1px) rotate(12deg)",
      frames: [
        { transform: "translate(10px, 1px) rotate(12deg)" },
        { offset: 0.45, transform: "translate(16px, 0) rotate(23deg)" },
        { transform: "translate(10px, 1px) rotate(12deg)" },
      ],
      duration: 800,
    },
  ],
  [
    {
      selector: ".mm-growth",
      frames: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      duration: 850,
    },
    ...[".mm-growth-tip", ".mm-growth-point"].map((selector) => ({
      selector,
      frames: [
        { opacity: 0, transform: "translate(-4px, 4px)" },
        { opacity: 1, transform: "none" },
      ],
      duration: 350,
      delay: 500,
      easing: "ease",
    })),
  ],
];

export function useMetricSvgAnimation(
  root: RefObject<SVGSVGElement | null>,
  index: number,
  active: boolean,
) {
  const animations = useRef(new Map<Element, Animation>());
  const generation = useRef(0);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const currentGeneration = ++generation.current;
      const animate = !media.matches && (active || initialized.current);
      initialized.current = true;
      svg.dataset.motionState = animate
        ? active
          ? "playing"
          : "returning"
        : "idle";
      for (const sequence of sequences[index] ?? []) {
        const element = svg.querySelector<SVGElement>(sequence.selector);
        if (!element) continue;
        const style = getComputedStyle(element);
        const snapshot = {
          transform: style.transform,
          opacity: style.opacity,
          strokeDashoffset: style.strokeDashoffset,
        };
        const old = animations.current.get(element);
        const interrupted = old?.playState === "running";
        old?.cancel();
        const rest = {
          transform: sequence.rest ?? "none",
          opacity: "1",
          strokeDashoffset: "0",
        };
        Object.assign(element.style, rest);
        if (!animate) continue;
        const frames = active
          ? sequence.frames.map((frame, i) =>
              i === 0 && interrupted ? { ...frame, ...snapshot } : frame,
            )
          : [snapshot, rest];
        animations.current.set(
          element,
          element.animate(frames, {
            duration: active ? sequence.duration : 220,
            delay: active ? (sequence.delay ?? 0) : 0,
            easing: active
              ? (sequence.easing ?? "cubic-bezier(0.22, 1, 0.36, 1)")
              : "ease-out",
            fill: "both",
          }),
        );
      }
      void Promise.allSettled(
        [...animations.current.values()].map((a) => a.finished),
      ).then(() => {
        if (generation.current === currentGeneration)
          svg.dataset.motionState = active && animate ? "complete" : "idle";
      });
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [active, index, root]);

  useLayoutEffect(
    () => () => {
      generation.current++;
      animations.current.forEach((animation) => animation.cancel());
    },
    [],
  );
}
