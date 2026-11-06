import type { CSSProperties } from "react";

/** Alternating reels always settle on the supplied value, including reduced motion. */
export function RollingNumber({
  value,
  previous = value,
}: {
  value: string;
  previous?: string;
}) {
  return (
    <span className="rolling-number" aria-hidden="true">
      {[...value].map((digit, index) => {
        if (!/\d/.test(digit))
          return (
            <span className="rolling-separator" key={index}>
              {digit}
            </span>
          );
        const before = /\d/.test(previous[index] || "")
          ? previous[index]
          : digit;
        const down = index % 2 === 1;
        return (
          <span
            className="rolling-cell"
            key={index}
            style={{ "--reel-delay": `${index * 65}ms` } as CSSProperties}
          >
            <span className={`rolling-track ${down ? "roll-down" : "roll-up"}`}>
              <span>{down ? digit : before}</span>
              <span>{down ? before : digit}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
