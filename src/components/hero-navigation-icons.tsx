import type { CSSProperties, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconFrame({ size = 26, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GrowingChartIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      {["M4 20v-4", "M9 20v-7", "M14 20V9", "M19 20V4"].map((d, index) => (
        <path
          key={d}
          d={d}
          className="hero-chart-bar"
          style={{ "--part-delay": `${index * 30}ms` } as CSSProperties}
        />
      ))}
      <path d="m3 10 5-4 5 1 7-5" />
    </IconFrame>
  );
}

export function AnimatedHistoryIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <g className="hero-history-arc">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </g>
      <g className="hero-history-hands">
        <path d="M12 7v5l4 2" />
      </g>
    </IconFrame>
  );
}

export function DirectionsGridIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      {[
        [3, 3, -1, -1],
        [14, 3, 1, -1],
        [3, 14, -1, 1],
        [14, 14, 1, 1],
      ].map(([x, y, dx, dy], index) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={7}
          height={7}
          rx={1.5}
          className="hero-direction-tile"
          style={
            {
              "--tile-x": dx,
              "--tile-y": dy,
              "--part-delay": `${index * 25}ms`,
            } as CSSProperties
          }
        />
      ))}
    </IconFrame>
  );
}

export function IlluminatingIdeaIcon(props: IconProps) {
  const rays = [
    "M12 1v2",
    "m4 3 1.5 1.5",
    "m20 3-1.5 1.5",
    "M1 9h2",
    "M21 9h2",
  ];
  return (
    <IconFrame {...props}>
      <path
        className="hero-idea-bulb"
        d="M9 16c0-1.4-.6-2.1-1.4-3a5 5 0 1 1 8.8 0c-.8.9-1.4 1.6-1.4 3Z"
      />
      <path d="m10 11 2 2 2-2M12 13v3M9 19h6M10 22h4" />
      <g stroke="#d8bdff">
        {rays.map((d, index) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className="hero-idea-ray"
            style={{ "--part-delay": `${index * 30}ms` } as CSSProperties}
          />
        ))}
      </g>
    </IconFrame>
  );
}

export function ExpandingLayersIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path className="hero-layer-top" d="m12 3 10 5-10 5L2 8Z" />
      <path className="hero-layer-middle" d="m2 12 10 5 10-5" />
      <path className="hero-layer-bottom" d="m2 16 10 5 10-5" />
    </IconFrame>
  );
}
