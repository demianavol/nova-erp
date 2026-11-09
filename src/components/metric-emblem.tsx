import { useEffect, useId, useRef, useState } from "react";
import type { CompanyMetricData } from "../data/company-metrics";

type MetricKind = CompanyMetricData["icon"];

const palettes: Record<MetricKind, readonly [string, string]> = {
  customers: ["#eaf9ff", "#225694"],
  orders: ["#fff0db", "#ab4c49"],
  brands: ["#f6edff", "#6140a5"],
  growth: ["#e9fff7", "#18785e"],
  trophy: ["#fff4d5", "#a6632d"],
  star: ["#f1f1ff", "#454c9c"],
  reviews: ["#fff0f8", "#a24779"],
};

const reducedMotion = "(prefers-reduced-motion: reduce)";
const visibleRatio = 0.65;
const rearCards = [
  { part: "card-left", x: 12, y: 17, angle: -15, cx: 29, cy: 37 },
  { part: "card-right", x: 35, y: 15, angle: 14, cx: 52, cy: 36 },
  { part: "card-top", x: 23, y: 10, angle: 3, cx: 40, cy: 31 },
] as const;

export function MetricEmblem({
  kind,
  active,
}: {
  kind: MetricKind;
  active: boolean;
}) {
  const root = useRef<SVGSVGElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const icon = root.current;
    if (!icon) return;
    const preference = matchMedia(reducedMotion);
    const cancelMotion = () => {
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener("change", cancelMotion);
    // Observe the icon itself so the lower row also plays when scrolled into view.
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry.intersectionRatio < visibleRatio) return;
              if (!preference.matches) setPlaying(true);
              observer?.disconnect();
            },
            { threshold: visibleRatio },
          )
        : null;
    observer?.observe(icon);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", cancelMotion);
    };
  }, []);
  useEffect(() => {
    if (active && !matchMedia(reducedMotion).matches) setPlaying(true);
  }, [active]);

  const id = useId();
  const [highlight, shade] = palettes[kind];
  const color = "var(--metric-color)";
  const glass = `url(#${id}-glass)`;
  const edge = `url(#${id}-edge)`;
  const depth = `url(#${id}-depth)`;

  return (
    <svg
      ref={root}
      className="metric-emblem"
      data-emblem={kind}
      data-emblem-playing={playing ? "" : undefined}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setPlaying(false);
      }}
      viewBox="0 0 80 72"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-glass`} x1=".16" y1="0" x2=".83" y2="1">
          <stop stopColor={highlight} stopOpacity=".98" />
          <stop offset=".34" stopColor={color} stopOpacity=".96" />
          <stop offset=".62" stopColor={shade} stopOpacity=".8" />
          <stop offset=".89" stopColor={color} />
          <stop offset="1" stopColor={highlight} stopOpacity=".96" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1=".2" y1="0" x2=".78" y2="1">
          <stop stopColor={highlight} />
          <stop offset=".42" stopColor={color} stopOpacity=".66" />
          <stop offset=".71" stopColor={shade} stopOpacity=".7" />
          <stop offset="1" stopColor={highlight} stopOpacity=".85" />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor={highlight} stopOpacity=".8" />
          <stop offset=".36" stopColor={color} stopOpacity=".91" />
          <stop offset=".8" stopColor={shade} stopOpacity=".83" />
          <stop offset="1" stopColor={color} stopOpacity=".76" />
        </linearGradient>
      </defs>
      {kind === "customers" && (
        <>
          <g data-part="person-left" fill={depth} stroke={edge}>
            <path d="M5 55v-3c0-8 6-14 14-14s14 6 14 14v7H9a4 4 0 0 1-4-4Z" />
            <circle cx="19" cy="28" r="9" />
          </g>
          <g data-part="person-right" fill={depth} stroke={edge}>
            <path d="M47 59v-7c0-8 6-14 14-14s14 6 14 14v3a4 4 0 0 1-4 4H47Z" />
            <circle cx="61" cy="28" r="9" />
          </g>
          <g data-part="person-center">
            <path
              d="M20 58v-5a20 20 0 0 1 40 0v5a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5Z"
              fill={glass}
              stroke={edge}
            />
            <circle cx="40" cy="21" r="13" fill={glass} stroke={edge} />
            <path
              d="M31 21a9 9 0 0 1 9-9M26 49a15 15 0 0 1 8-10m7 20h12a3 3 0 0 0 3-3"
              stroke={highlight}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity=".83"
            />
          </g>
        </>
      )}
      {kind === "orders" && (
        <g strokeLinejoin="round">
          <path d="m9 22 30-14 32 12-30 15Z" fill={shade} stroke={edge} />
          <path d="m9 22 32 13v32L9 53Z" fill={glass} stroke={edge} />
          <path
            d="M41 35v32l30-14V20L41 35Z"
            fill={depth}
            fillOpacity=".83"
            stroke={edge}
          />
          <path d="m54 29 7-4v13l-7 3Z" fill={highlight} fillOpacity=".62" />
          <path
            d="M17 40v7l14 6v-8l-14-5Z"
            fill={highlight}
            fillOpacity=".72"
          />
          <g data-part="lid-back">
            <path d="m24 15 15-7 32 12-15 7.5Z" fill={glass} stroke={edge} />
            <path d="m24 15 5-3 32 12-5 3.5Z" fill={highlight} opacity=".66" />
          </g>
          <g data-part="lid-front">
            <path d="m9 22 15-7 32 12.5-15 7.5Z" fill={depth} stroke={edge} />
            <path
              d="m12 22 29 11"
              stroke={highlight}
              strokeLinecap="round"
              opacity=".7"
            />
          </g>
          <path
            d="m18 28 14 6m9 3v24m6 0 17-8"
            stroke={highlight}
            strokeOpacity=".82"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
      )}
      {kind === "brands" && (
        <>
          {rearCards.map(({ part, x, y, angle, cx, cy }) => (
            <g key={part} data-part={part}>
              <rect
                x={x}
                y={y}
                width="34"
                height="43"
                rx="8"
                transform={`rotate(${angle} ${cx} ${cy})`}
                fill={depth}
                stroke={edge}
              />
            </g>
          ))}
          <g data-part="card-front">
            <rect
              x="22"
              y="19"
              width="38"
              height="44"
              rx="9"
              fill={glass}
              stroke={edge}
            />
            <path
              d="M28 31v-2a4 4 0 0 1 4-4h12m4 32h3a3 3 0 0 0 3-3v-6"
              stroke={highlight}
              strokeOpacity=".84"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M41 30c1.8 7 4 9.2 11 11-7 1.8-9.2 4-11 11-1.8-7-4-9.2-11-11 7-1.8 9.2-4 11-11Z"
              fill={highlight}
            />
          </g>
        </>
      )}
      {kind === "growth" && (
        <>
          {[
            { x: 9, top: 45, fill: depth },
            { x: 31, top: 37, fill: depth },
            { x: 53, top: 29, fill: glass },
          ].map(({ x, top, fill }) => (
            <g key={x} className="metric-growth-bar">
              <rect
                x={x}
                y={top}
                width="14"
                height={64 - top}
                rx="3"
                fill={fill}
                stroke={edge}
              />
              <path
                d={`M${x + 4} ${top + 5}v${(64 - top) * 0.38}`}
                stroke={highlight}
                strokeOpacity=".67"
                strokeLinecap="round"
              />
            </g>
          ))}
          <g strokeLinecap="round" strokeLinejoin="round">
            <path
              className="metric-growth-line"
              pathLength="1"
              d="m12 36 17-15 12 5L65 9"
              stroke={depth}
              strokeWidth="7"
            />
            <path
              className="metric-growth-line"
              pathLength="1"
              d="m12 35 17-15 12 5L65 8"
              stroke={highlight}
              strokeOpacity=".92"
              strokeWidth="2.5"
            />
            <g className="metric-growth-tip">
              <path d="M52 9h13v12" stroke={depth} strokeWidth="7" />
              <path
                d="M52 8h13v12"
                stroke={highlight}
                strokeOpacity=".92"
                strokeWidth="2.5"
              />
            </g>
          </g>
        </>
      )}
      {kind === "trophy" && (
        <>
          <g data-part="cup">
            <path
              d="M22 17H10v6c0 12 7 18 18 18m30-24h12v6c0 12-7 18-18 18"
              stroke={depth}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M23 12h34v19c0 9-6 16-14 18v8h10a3 3 0 0 1 3 3v4H24v-4a3 3 0 0 1 3-3h10v-8c-8-2-14-9-14-18V12Z"
              fill={glass}
              stroke={edge}
            />
            <path
              d="M29 18v11m2 7a10 10 0 0 0 6 6m5 17h8"
              stroke={highlight}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          <path
            className="metric-emblem-spark"
            d="M67 1c1 4 2 5 6 6-4 1-5 2-6 6-1-4-2-5-6-6 4-1 5-2 6-6Z"
            fill={highlight}
          />
        </>
      )}
      {kind === "star" && (
        <>
          <g data-part="rating-star">
            <path
              d="m40 8 9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3 9-19Z"
              fill={glass}
              stroke={edge}
              strokeLinejoin="round"
            />
            <path
              d="M40 9v31L11 30l20-3 9-18Zm0 31 19 26-19-10-19 10 19-26Z"
              fill={highlight}
              fillOpacity=".45"
            />
            <path
              d="m40 40 30-10-15 15 4 21-19-26Z"
              fill={shade}
              fillOpacity=".36"
            />
            <path
              d="m40 15 7 15 17 2m-47 1 22 7 15 20"
              stroke={highlight}
              strokeOpacity=".81"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <path
            className="metric-emblem-spark"
            d="m67 2 2.5 5.5 6 .8-4.4 4.2 1 6-5.1-2.9-5.2 2.9 1-6-4.3-4.2 6-.8Z"
            fill={highlight}
            stroke={color}
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "reviews" && (
        <>
          <path
            data-part="review-back"
            d="M14 21a9 9 0 0 1 9-9h43a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8h-6l-8 9v-9H23a9 9 0 0 1-9-9V21Z"
            fill={depth}
            stroke={edge}
          />
          <g data-part="review-front">
            <path
              d="M6 27a9 9 0 0 1 9-9h44a9 9 0 0 1 9 9v23a9 9 0 0 1-9 9H27L14 66v-8a9 9 0 0 1-8-8V27Z"
              fill={glass}
              stroke={edge}
            />
            <path
              d="M12 32v-4a4 4 0 0 1 4-4h16m20 28h6a4 4 0 0 0 4-4v-4"
              stroke={highlight}
              strokeOpacity=".83"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              data-part="review-heart"
              d="M20 37c0-7 8-10 14-3 6-7 14-4 14 3 0 5-6 10-14 15-8-5-14-10-14-15Z"
              fill={highlight}
            />
          </g>
        </>
      )}
    </svg>
  );
}
