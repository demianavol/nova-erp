import {
  useLayoutEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";
import "./rubber-segment.css";

export function RubberSegment<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const active = items.findIndex((item) => item.value === value);
  const thumb = useRef<HTMLSpanElement>(null);
  const previous = useRef(active);
  const drag = useRef<{ pointerId: number; start: number; moved: boolean }>(
    null,
  );
  const dragOffset = useRef<number | null>(null);
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const element = thumb.current;
    const from = dragOffset.current ?? previous.current;
    dragOffset.current = null;
    previous.current = active;
    if (
      !element ||
      from === active ||
      from < 0 ||
      active < 0 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const direction = Math.sign(active - from);
    const animation = element.animate(
      [
        { transform: `translateX(${from * 100}%) scaleX(1)` },
        {
          transform: `translateX(${(from + direction * 0.42) * 100}%) scaleX(1.32)`,
          offset: 0.34,
        },
        {
          transform: `translateX(${(active + direction * 0.05) * 100}%) scaleX(0.94)`,
          offset: 0.78,
        },
        { transform: `translateX(${active * 100}%) scaleX(1)` },
      ],
      { duration: 340, easing: "cubic-bezier(.22,.78,.3,1)" },
    );
    return () => animation.cancel();
  }, [active]);

  function start(event: PointerEvent<HTMLButtonElement>) {
    suppressClick.current = false;
    if (event.isPrimary && event.button === 0) {
      drag.current = {
        pointerId: event.pointerId,
        start: event.clientX,
        moved: false,
      };
    }
  }

  function restoreThumb() {
    drag.current = null;
    if (thumb.current)
      thumb.current.style.transform = `translateX(${active * 100}%)`;
  }

  return (
    <div
      className="rubber-segment"
      role="radiogroup"
      aria-label={label}
      onPointerMove={(event) => {
        const gesture = drag.current;
        const element = thumb.current;
        if (!gesture || !element || gesture.pointerId !== event.pointerId)
          return;
        const delta = event.clientX - gesture.start;
        if (!gesture.moved) {
          if (Math.abs(delta) < 8) return;
          gesture.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          element.getAnimations().forEach((animation) => animation.cancel());
        }
        const offset = Math.min(
          items.length - 1,
          Math.max(0, active + delta / element.offsetWidth),
        );
        dragOffset.current = offset;
        element.style.transform = `translateX(${offset * 100}%)`;
      }}
      onPointerUp={(event) => {
        const gesture = drag.current;
        if (gesture?.pointerId !== event.pointerId) return;
        restoreThumb();
        if (!gesture.moved) return;
        suppressClick.current = true;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll("button"),
        );
        const index = buttons.findIndex((button) => {
          const { left, right } = button.getBoundingClientRect();
          return event.clientX >= left && event.clientX <= right;
        });
        if (index >= 0 && index !== active) onChange(items[index].value);
        else dragOffset.current = null;
      }}
      onPointerCancel={() => {
        restoreThumb();
        dragOffset.current = null;
      }}
      onLostPointerCapture={() => {
        if (drag.current) {
          restoreThumb();
          dragOffset.current = null;
        }
      }}
      onPointerLeave={() => {
        if (!drag.current?.moved) drag.current = null;
      }}
      onKeyDown={(event) => {
        const directions: Record<string, number> = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
        };
        const direction = directions[event.key];
        if (!direction && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (active + direction + items.length) % items.length;
        event.currentTarget.querySelectorAll("button")[index]?.focus();
        if (index !== active) onChange(items[index].value);
      }}
    >
      <div className="rubber-segment-track">
        {active >= 0 && (
          <span
            ref={thumb}
            className="rubber-segment-thumb"
            aria-hidden="true"
            style={{
              width: `${100 / items.length}%`,
              transform: `translateX(${active * 100}%)`,
            }}
          />
        )}
        {items.map((item, index) => (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-label={item.label}
            aria-checked={index === active}
            tabIndex={index === Math.max(active, 0) ? 0 : -1}
            onPointerDown={start}
            onClick={(event) => {
              if (suppressClick.current && event.detail > 0) return;
              onChange(item.value);
            }}
          >
            {item.icon ?? item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
