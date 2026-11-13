import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import "./spring-check.css";

export function SpringCheck({
  checked,
  onChange,
  label,
  ariaLabel,
  round,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  ariaLabel?: string;
  round?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={cn("spring-check", round && "spring-check-round")}>
      <span className="spring-check-control">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="spring-check-box" aria-hidden="true">
          <span className="spring-check-fill" />
          <svg viewBox="0 0 18 18">
            <path d="m4.5 9 3 3 6-6" pathLength={1} />
            {round && <path className="spring-check-plus" d="M9 5v8M5 9h8" />}
          </svg>
        </span>
      </span>
      {label && <span className="spring-check-label">{label}</span>}
    </label>
  );
}
