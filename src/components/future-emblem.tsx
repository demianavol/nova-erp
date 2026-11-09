import { useEffect, useId, useState, type ReactNode } from "react";
import "../future-emblem.css";

type Paint = {
  glass: string;
  depth: string;
  rim: string;
  light: string;
};

const artwork = {
  brands: ({ glass, depth, rim, light }) => (
    <>
      <g className="future-emblem-ribbon" data-part="upper">
        <path
          d="M7 34v-5C7 17 17 8 29 8h16L34 19h-5a11 11 0 0 0-11 11v4l-8 8Z"
          fill={glass}
          stroke={rim}
        />
        <path d="M12 28c1-7 7-13 14-15h7" stroke={light} opacity=".8" />
        <path
          className="future-emblem-trace"
          d="M9 34v-5C9 18 18 10 29 10h11"
          pathLength="1"
          stroke={light}
          strokeWidth="1.5"
        />
      </g>
      <g className="future-emblem-ribbon" data-part="middle">
        <path d="m16 44 25-25h12L28 44Z" fill={depth} stroke={rim} />
        <path d="m24 41 19-19h4" stroke={light} opacity=".8" />
        <path
          className="future-emblem-trace"
          d="m17 43 24-23h10"
          pathLength="1"
          stroke={light}
          strokeWidth="1.5"
        />
      </g>
      <g className="future-emblem-ribbon" data-part="lower">
        <path
          d="M57 29v6c0 12-10 21-22 21H19l11-11h5a11 11 0 0 0 11-11v-3l8-8Z"
          fill={glass}
          stroke={rim}
        />
        <path d="M52 36c-1 8-7 14-14 15h-8" stroke={light} opacity=".8" />
        <path
          className="future-emblem-trace"
          d="M55 29v6c0 11-9 19-20 19H23"
          pathLength="1"
          stroke={light}
          strokeWidth="1.5"
        />
      </g>
    </>
  ),
  team: ({ glass, depth, rim, light }) => (
    <>
      <path
        d="M15 58v-9c0-4-6-8-6-19C9 18 18 9 30 9c12 0 21 9 21 20l6 8-6 3v7c0 3-2 5-5 5h-9v6Z"
        fill={depth}
        stroke={rim}
        strokeWidth="1.5"
      />
      <path
        className="future-emblem-brain"
        d="M19 29c-4-5 0-11 5-11 3-5 11-5 14 0 6 0 9 7 5 11 2 5-4 9-8 7-4 3-9 0-10-3-4 1-6-1-6-4Z"
        fill={glass}
        stroke={rim}
      />
      <path d="m21 26 8-5 7 6-5 6m5-6 6-4" stroke={light} strokeWidth="2" />
      <path
        className="future-emblem-trace"
        d="m21 26 8-5 7 6-5 6"
        pathLength="1"
        stroke={light}
        strokeWidth="2.6"
      />
      <circle
        className="future-emblem-neuron"
        cx="29"
        cy="21"
        r="2.6"
        fill={light}
      />
      <circle
        className="future-emblem-neuron"
        cx="36"
        cy="27"
        r="2.6"
        fill={light}
      />
      <circle
        className="future-emblem-neuron"
        cx="31"
        cy="33"
        r="2.6"
        fill={light}
      />
    </>
  ),
  technology: ({ light }) => (
    <>
      <image
        className="future-emblem-chip"
        href={`${import.meta.env.BASE_URL}media/future/ai-glass.png`}
        x="1"
        y="1"
        width="62"
        height="62"
      />
      <path
        className="future-emblem-trace"
        data-tier="bottom"
        d="M10 43 28 55q4 3 8 0l18-12"
        pathLength="1"
        stroke={light}
        strokeWidth="1.9"
      />
      <path
        className="future-emblem-trace"
        data-tier="middle"
        d="M10 34 28 46q4 3 8 0l18-12"
        pathLength="1"
        stroke={light}
        strokeWidth="1.9"
      />
      <path
        className="future-emblem-trace"
        data-tier="top"
        d="M10 24 28 35q4 3 8 0l18-11"
        pathLength="1"
        stroke={light}
        strokeWidth="1.9"
      />
    </>
  ),
  impact: ({ glass, depth, rim, light }) => (
    <>
      <ellipse
        cx="32"
        cy="36"
        rx="27"
        ry="16"
        fill={depth}
        fillOpacity=".32"
        stroke={rim}
        strokeWidth="1.7"
      />
      <ellipse cx="32" cy="35" rx="18" ry="10" stroke={rim} strokeWidth="2" />
      <ellipse
        className="future-emblem-wave"
        cx="32"
        cy="36"
        rx="26"
        ry="15"
        stroke={light}
        strokeWidth="1.55"
      />
      <ellipse
        className="future-emblem-wave"
        data-part="inner"
        cx="32"
        cy="35"
        rx="19"
        ry="11"
        stroke={light}
        strokeWidth="1.55"
      />
      <path
        d="M32 12v23m0 0 19 11m-19-11-20 8"
        stroke={rim}
        strokeWidth="1.5"
      />
      <circle
        className="future-emblem-core"
        cx="32"
        cy="33"
        r="8.5"
        fill={glass}
        stroke={rim}
      />
      <circle
        className="future-emblem-market-node"
        cx="32"
        cy="12"
        r="4"
        fill={glass}
        stroke={rim}
      />
      <circle
        className="future-emblem-market-node"
        cx="12"
        cy="43"
        r="3.6"
        fill={glass}
        stroke={rim}
      />
      <circle
        className="future-emblem-market-node"
        cx="51"
        cy="46"
        r="3.6"
        fill={glass}
        stroke={rim}
      />
    </>
  ),
} satisfies Record<string, (paint: Paint) => ReactNode>;

const palettes: Record<
  keyof typeof artwork,
  readonly [string, string, string]
> = {
  brands: ["#fff0ee", "#f99895", "#ad4c59"],
  team: ["#e4feff", "#60d9ed", "#266f9b"],
  technology: ["#e8f5ff", "#81a4ff", "#5153a8"],
  impact: ["#fff6d9", "#eeca68", "#9a632c"],
};

export function FutureEmblem({
  kind,
  active,
  className,
}: {
  kind: keyof typeof artwork;
  active: boolean;
  className?: string;
}) {
  const id = useId();
  const [playing, setPlaying] = useState(false);
  const [light, color, shade] = palettes[kind];
  const glass = `url(#${id}-glass)`;
  const depth = `url(#${id}-depth)`;
  const rim = `url(#${id}-rim)`;

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const stopForReducedMotion = () => {
      if (preference.matches) setPlaying(false);
    };
    if (active && !preference.matches) setPlaying(true);
    preference.addEventListener("change", stopForReducedMotion);
    return () => preference.removeEventListener("change", stopForReducedMotion);
  }, [active]);

  return (
    <svg
      className={className ? `future-emblem ${className}` : "future-emblem"}
      data-emblem={`future-${kind}`}
      data-emblem-playing={playing || undefined}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setPlaying(false);
      }}
      viewBox="0 0 64 64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-glass`} x1=".15" y1="0" x2=".8" y2="1">
          <stop stopColor={light} />
          <stop offset=".34" stopColor={color} />
          <stop offset=".68" stopColor={shade} />
          <stop offset=".91" stopColor={color} />
          <stop offset="1" stopColor={light} />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor={color} />
          <stop offset=".68" stopColor={shade} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1=".12" y1="0" x2="1" y2="1">
          <stop stopColor={light} />
          <stop offset=".56" stopColor={color} stopOpacity=".65" />
          <stop offset="1" stopColor={light} stopOpacity=".85" />
        </linearGradient>
      </defs>
      {artwork[kind]({ glass, depth, rim, light })}
    </svg>
  );
}
