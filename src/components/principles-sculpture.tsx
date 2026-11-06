import { useEffect, useId, useRef } from "react";

const sculptureUrl = `${import.meta.env.BASE_URL}media/history-icons/lavender_glass_unicorn_token.png`;
const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));
const axes = ["x", "y", "z"] as const;

export function PrinciplesSculpture({ alt }: { alt: string }) {
  const surfaceRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hintId = useId();

  useEffect(() => {
    const surface = surfaceRef.current;
    const stage = stageRef.current;
    if (!surface || !stage) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const current = { x: 0, y: 0, z: 0 };
    const target = { ...current };
    let frame = 0;
    let previous = 0;
    let bounds: DOMRect | null = null;
    let visible = false;
    let suppressClick = false;
    let drag: {
      id: number;
      x: number;
      y: number;
      z: number;
      moved: boolean;
    } | null = null;

    const paint = () => {
      surface.style.setProperty("--cp-object-x", `${current.x.toFixed(3)}deg`);
      surface.style.setProperty("--cp-object-y", `${current.y.toFixed(3)}deg`);
      surface.style.setProperty("--cp-object-z", `${current.z.toFixed(3)}deg`);
      surface.style.setProperty("--cp-light-x", `${50 + current.y * 1.6}%`);
      surface.style.setProperty("--cp-light-y", `${45 - current.x * 1.6}%`);
    };
    const render = (time: number) => {
      const delta = previous ? Math.min(time - previous, 40) : 16;
      previous = time;
      const ease = 1 - Math.exp(-delta / (drag ? 65 : 170));
      for (const axis of axes)
        current[axis] += (target[axis] - current[axis]) * ease;
      paint();
      if (axes.some((axis) => Math.abs(target[axis] - current[axis]) > 0.02)) {
        frame = requestAnimationFrame(render);
      } else {
        Object.assign(current, target);
        paint();
        frame = previous = 0;
      }
    };
    const schedule = () => {
      if (reduced.matches) {
        Object.assign(current, target);
        paint();
      } else if (!frame && visible && !document.hidden) {
        frame = requestAnimationFrame(render);
      }
    };
    const resetTilt = () => {
      target.x = target.y = 0;
      schedule();
    };
    const enter = () => {
      bounds = surface.getBoundingClientRect();
    };
    const move = (event: PointerEvent) => {
      if (drag) {
        if (event.pointerId !== drag.id) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        drag.moved ||= Math.hypot(dx, dy) > 5;
        target.x = clamp(-dy * 0.16, 24);
        target.y = clamp(dx * 0.12, 24);
        target.z = drag.z + dx * 0.6;
      } else {
        if (event.pointerType !== "mouse" || reduced.matches) return;
        bounds ??= surface.getBoundingClientRect();
        target.x = clamp(
          -((event.clientY - bounds.top) / bounds.height - 0.5) * 24,
          12,
        );
        target.y = clamp(
          ((event.clientX - bounds.left) / bounds.width - 0.5) * 28,
          14,
        );
      }
      schedule();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      enter();
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        z: target.z,
        moved: false,
      };
      suppressClick = false;
      surface.dataset.dragging = "true";
      surface.setPointerCapture(event.pointerId);
    };
    const finish = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      suppressClick = drag.moved || event.type !== "pointerup";
      drag = null;
      delete surface.dataset.dragging;
      if (surface.hasPointerCapture(event.pointerId))
        surface.releasePointerCapture(event.pointerId);
      resetTilt();
    };
    const leave = () => {
      if (!drag) resetTilt();
    };
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail !== 0) {
        suppressClick = false;
        return;
      }
      target.z += reduced.matches ? 15 : 360;
      schedule();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") target.y = clamp(target.y - 8, 32);
      else if (event.key === "ArrowRight") target.y = clamp(target.y + 8, 32);
      else if (event.key === "ArrowUp") target.x = clamp(target.x + 8, 32);
      else if (event.key === "ArrowDown") target.x = clamp(target.x - 8, 32);
      else if (event.key === "Home" || event.key === "Escape") {
        target.x = target.y = 0;
        target.z = Math.round(current.z / 360) * 360;
      } else return;
      event.preventDefault();
      schedule();
    };
    const activity = () => {
      stage.dataset.animate = String(
        visible && !document.hidden && !reduced.matches,
      );
      if (!visible || document.hidden || reduced.matches) {
        cancelAnimationFrame(frame);
        frame = previous = 0;
      }
      if (visible && !document.hidden) schedule();
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      activity();
    });
    observer.observe(stage);

    surface.addEventListener("pointerenter", enter);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerdown", down);
    surface.addEventListener("pointerup", finish);
    surface.addEventListener("pointercancel", finish);
    surface.addEventListener("lostpointercapture", finish);
    surface.addEventListener("pointerleave", leave);
    surface.addEventListener("click", click);
    surface.addEventListener("keydown", key);
    surface.addEventListener("blur", resetTilt);
    reduced.addEventListener("change", activity);
    document.addEventListener("visibilitychange", activity);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      surface.removeEventListener("pointerenter", enter);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointerup", finish);
      surface.removeEventListener("pointercancel", finish);
      surface.removeEventListener("lostpointercapture", finish);
      surface.removeEventListener("pointerleave", leave);
      surface.removeEventListener("click", click);
      surface.removeEventListener("keydown", key);
      surface.removeEventListener("blur", resetTilt);
      reduced.removeEventListener("change", activity);
      document.removeEventListener("visibilitychange", activity);
    };
  }, []);

  return (
    <div ref={stageRef} className="cp-sculpture-wrapper">
      <div className="cp-sculpture-glow" aria-hidden="true" />
      <button
        ref={surfaceRef}
        className="cp-sculpture-control"
        type="button"
        aria-label="Вращать стеклянный знак Young Unicorn"
        aria-describedby={hintId}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home Escape"
      >
        <span className="cp-sculpture-float">
          <span className="cp-sculpture-object">
            <img
              src={sculptureUrl}
              alt={alt}
              className="cp-sculpture-img"
              width={260}
              height={260}
              draggable={false}
              decoding="async"
            />
            <span
              className="cp-sculpture-sheen"
              aria-hidden="true"
              style={{ maskImage: `url("${sculptureUrl}")` }}
            />
          </span>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Перетаскивание поворачивает знак, нажатие запускает вращение. Стрелки
        меняют наклон. Home или Escape — сброс.
      </span>
    </div>
  );
}
