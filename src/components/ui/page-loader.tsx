import { cn } from "../../lib/utils";
import "./nova-controls.css";

const rings = [
  [
    "#0000 35%, #000 37% 39%, #0000 41%",
    "#0000, currentColor 90deg, #0000 180deg",
    "3s",
  ],
  [
    "#0000 42%, #000 44% 48%, #0000 50%",
    "#0000, currentColor 120deg, #0000 360deg",
    "1.2s",
  ],
  [
    "#0000 52%, #000 54% 56%, #0000 58%",
    "#0000, currentColor 45deg, #0000 90deg",
    "4s",
  ],
  [
    "#0000 61%, #000 62% 63%, #0000 64%",
    "#0000, currentColor 20deg, #0000 40deg",
    "3.5s",
  ],
] as const;

export function PageLoader({
  title,
  className,
  compact = false,
}: {
  title: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn("nova-loader", compact && "nova-loader-compact", className)}
      role="status"
    >
      <span className="nova-loader-art" aria-hidden="true">
        {rings.map(([mask, colors, duration], index) => (
          <span
            key={duration}
            style={{
              background: `conic-gradient(from ${index * 90}deg, ${colors})`,
              mask: `radial-gradient(circle, ${mask})`,
              animationDuration: duration,
            }}
          />
        ))}
      </span>
      <p>{title}</p>
    </div>
  );
}
