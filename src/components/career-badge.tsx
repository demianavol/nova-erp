import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "../career-badge-physics.css";

function UnavailableLanyard({ onError }: { onError?: () => void }) {
  useEffect(() => {
    onError?.();
  }, [onError]);
  return null;
}
const frontImage = `${import.meta.env.BASE_URL}media/careers/badge-front.svg`;
const backImage = `${import.meta.env.BASE_URL}media/careers/badge-back.svg`;
let lanyardModule: Promise<typeof import("./react-bits/Lanyard")> | undefined;
let facesPreloaded = false;
const loadLanyard = () => (lanyardModule ??= import("./react-bits/Lanyard"));
const Lanyard = lazy(() =>
  loadLanyard().catch(() => ({ default: UnavailableLanyard })),
);

export function preloadCareerBadge() {
  if (facesPreloaded) return;
  facesPreloaded = true;
  void loadLanyard().catch(() => {});
  for (const url of [frontImage, backImage]) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
  }
}

const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

/** Drag rotates the badge; a deliberate click reveals its reverse. */
function StaticCareerBadge({
  image,
  reduced,
  embedded = false,
}: {
  image: string;
  reduced: boolean;
  embedded?: boolean;
}) {
  const surfaceRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const hint = useId();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    const card = cardRef.current;
    if (!surface || !card) return;
    const current = { x: 0, y: 0, z: 0 };
    const target = { ...current };
    let frame = 0;
    let previous = 0;
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
      card.style.setProperty("--badge-rx", `${current.x}deg`);
      card.style.setProperty("--badge-ry", `${current.y}deg`);
      card.style.setProperty("--badge-rz", `${current.z}deg`);
      card.style.setProperty("--badge-shadow-x", `${-current.y}px`);
      card.style.setProperty("--badge-shadow-y", `${16 + current.x * 0.5}px`);
      card.style.setProperty("--badge-glare-x", `${50 + current.y * 2}%`);
      card.style.setProperty("--badge-glare-y", `${45 - current.x * 2}%`);
    };
    const render = (now: number) => {
      const delta = previous ? Math.min(48, now - previous) : 16;
      previous = now;
      const ease = 1 - Math.exp(-delta / (drag ? 55 : 150));
      for (const axis of ["x", "y", "z"] as const)
        current[axis] += (target[axis] - current[axis]) * ease;
      paint();
      if (
        Math.abs(current.x - target.x) +
          Math.abs(current.y - target.y) +
          Math.abs(current.z - target.z) >
        0.02
      ) {
        frame = requestAnimationFrame(render);
      } else {
        Object.assign(current, target);
        paint();
        frame = previous = 0;
        delete surface.dataset.interacting;
      }
    };
    const schedule = () => {
      if (reduced) {
        Object.assign(current, target);
        paint();
        delete surface.dataset.interacting;
      } else if (!frame && visible && !document.hidden) {
        surface.dataset.interacting = "true";
        frame = requestAnimationFrame(render);
      }
    };
    const resetTilt = () => {
      target.x = target.y = 0;
      schedule();
    };
    const move = (event: PointerEvent) => {
      if (drag) {
        if (drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        drag.moved ||= Math.hypot(dx, dy) > 5;
        target.z = drag.z + dx * 0.65;
        target.x = clamp(-dy * 0.1, 18);
        target.y = clamp(dx * 0.06, 18);
      } else return;
      schedule();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
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
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail !== 0) {
        suppressClick = false;
        return;
      }
      setFlipped((value) => !value);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") target.z -= 15;
      else if (event.key === "ArrowRight") target.z += 15;
      else if (event.key === "ArrowUp") target.x = clamp(target.x + 8, 24);
      else if (event.key === "ArrowDown") target.x = clamp(target.x - 8, 24);
      else if (event.key === "Home" || event.key === "Escape") {
        target.x = target.y = 0;
        target.z = Math.round(current.z / 360) * 360;
        setFlipped(false);
      } else return;
      event.preventDefault();
      schedule();
    };
    const listeners = {
      pointermove: move,
      pointerdown: down,
      pointerup: finish,
      pointercancel: finish,
      lostpointercapture: finish,
      click,
      keydown: key,
      blur: resetTilt,
    };
    for (const [name, handler] of Object.entries(listeners))
      surface.addEventListener(name, handler as EventListener);
    const activity = () => {
      surface.dataset.ambientAnimate = String(
        visible && !document.hidden && !reduced,
      );
      if (!visible || document.hidden) {
        cancelAnimationFrame(frame);
        frame = previous = 0;
      } else if (
        ["x", "y", "z"].some(
          (axis) =>
            Math.abs(
              current[axis as keyof typeof current] -
                target[axis as keyof typeof target],
            ) > 0.02,
        )
      ) {
        schedule();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        activity();
      },
      { threshold: 0.08 },
    );
    observer.observe(surface);
    document.addEventListener("visibilitychange", activity);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", activity);
      for (const [name, handler] of Object.entries(listeners))
        surface.removeEventListener(name, handler as EventListener);
    };
  }, [reduced]);

  return (
    <div
      className={embedded ? "career-badge-static" : "career-badge-container"}
    >
      <button
        ref={surfaceRef}
        type="button"
        className="career-badge-control"
        aria-label={
          flipped
            ? "Вернуть лицевую сторону бейджа Young Unicorn"
            : "Перевернуть бейдж Young Unicorn"
        }
        aria-pressed={flipped}
        aria-describedby={hint}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home Escape"
      >
        <span className="career-badge-float">
          <span ref={cardRef} className="career-badge-card">
            <span className="career-badge-rotor" data-flipped={flipped}>
              {[false, true].map((back) => (
                <span
                  key={String(back)}
                  className={`career-badge-face${back ? " career-badge-back" : ""}`}
                  aria-hidden="true"
                >
                  <img
                    src={image}
                    className="career-badge-bloom"
                    alt=""
                    width="1024"
                    height="1536"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <img
                    src={image}
                    className="career-badge-base-img"
                    alt=""
                    width="1024"
                    height="1536"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  {back ? (
                    <span className="career-badge-back-message">
                      Мы ждём
                      <br />
                      <strong>именно тебя!</strong>
                    </span>
                  ) : (
                    <span className="career-badge-brand">
                      <img
                        src={`${import.meta.env.BASE_URL}yuc-mark.svg`}
                        alt=""
                        className="career-badge-mark"
                        draggable={false}
                      />
                      <span className="career-badge-wordmark">
                        YOUNG
                        <br />
                        UNICORN
                        <br />
                        COMPANY
                      </span>
                    </span>
                  )}
                  <span
                    className="career-badge-specular"
                    style={{ maskImage: `url("${image}")` } as CSSProperties}
                  />
                </span>
              ))}
            </span>
          </span>
        </span>
      </button>
      <span id={hint} className="sr-only">
        Нажатие или Enter переворачивает бейдж. На обороте — «Мы ждём именно
        тебя!». Перетаскивание вращает бейдж. Стрелки — поворот и наклон, Home
        или Escape — лицевая сторона.
      </span>
    </div>
  );
}

/** Keep the legacy fallback only for reduced motion or a real renderer failure. */
export function CareerBadge({
  image,
  reduced,
  renderSpace = "viewport",
}: {
  image: string;
  reduced: boolean;
  renderSpace?: "viewport" | "local";
}) {
  const root = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const hint = useId();
  const reveal = useCallback(() => setReady(true), []);
  const fail = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  useEffect(() => {
    if (renderSpace === "local") {
      // Give the dialog and its poster a paint before compiling the 3D scene.
      let afterPaint = 0;
      const beforePaint = requestAnimationFrame(() => {
        afterPaint = requestAnimationFrame(() => setNear(true));
      });
      return () => {
        cancelAnimationFrame(beforePaint);
        cancelAnimationFrame(afterPaint);
      };
    }
    const view = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          view.disconnect();
        }
      },
      { rootMargin: "900px" },
    );
    if (root.current) view.observe(root.current);
    return () => view.disconnect();
  }, [renderSpace]);
  useEffect(() => setReady(false), [reduced]);
  const physics = near && !reduced && !failed;
  const visible = physics && ready;
  const fallback = reduced || failed;
  return (
    <div
      ref={root}
      className={`career-badge-container career-badge-physics${renderSpace === "local" ? " career-badge-in-dialog" : ""}`}
      data-ready={visible}
      aria-busy={!visible && !fallback}
    >
      {physics && (
        <div
          className="career-badge-live"
          aria-hidden={!visible}
          aria-describedby={hint}
        >
          <Suspense fallback={null}>
            <Lanyard
              className="yuc-lanyard"
              renderSpace={renderSpace}
              constrainToCanvas={renderSpace === "local"}
              ariaDescribedBy={hint}
              frontImage={frontImage}
              backImage={backImage}
              cardColor="#c09ade"
              strapColor="#7851ac"
              finish="glass"
              metal="silver"
              cornerRadius={0.55}
              size={0.64}
              strapLength={0.32}
              strapWidth={0.7}
              gravity={1}
              damping={0.65}
              elasticity={0.35}
              breeze={0.18}
              intro={false}
              onReady={reveal}
              onError={fail}
            />
          </Suspense>
        </div>
      )}
      {fallback && (
        <StaticCareerBadge image={image} reduced={reduced} embedded />
      )}
      {!visible && !fallback && (
        <div className="career-badge-poster" aria-hidden="true">
          <span className="career-badge-poster-strap" />
          <img src={frontImage} alt="" width={1024} height={1440} draggable={false} />
        </div>
      )}
      {visible && (
        <span className="career-badge-drag-hint" aria-hidden="true">
          Потяни за бейдж · Нажми, чтобы перевернуть
        </span>
      )}
      <span id={hint} className="sr-only">
        {!visible && !fallback ? "Бейдж загружается. " : ""}
        Бейдж на гибком подвесе. Потяните и отпустите его мышью или в сторону на
        сенсорном экране. Нажатие, Enter или пробел переворачивают бейдж.
        Стрелки раскачивают его, Home или Escape возвращают в исходное
        положение. На обороте — «Мы ждём именно тебя!».
      </span>
    </div>
  );
}
