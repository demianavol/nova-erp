import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Play } from "lucide-react";
import { companyHistoryInfographic as steps } from "../data/company-journey";
import { historyMedia } from "../data/history-media";
import { historyPhotographs } from "../data/history-photographs";
import { HistoryMilestoneVisual } from "./history-milestone-visual";
import { HistoryPrintedPhoto } from "./history-printed-photo";
import { useNearViewport } from "./use-near-viewport";
import "../company-history.css";

const asset = (name: string) => `${import.meta.env.BASE_URL}media/${name}`;
const curve = "M 60 410 C 400 420 730 300 1140 65";

export function CompanyHistory() {
  const root = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const near = useNearViewport(pin);
  const path = useRef<SVGPathElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const moving = useRef<SVGCircleElement>(null);
  const displayed = useRef(0);
  const animation = useRef(0);
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.siteTheme === "dark",
  );
  const [videoBlocked, setVideoBlocked] = useState(false);
  const [videoMoving, setVideoMoving] = useState(false);
  useEffect(() => {
    if (!near) return;
    for (const photo of Object.values(historyPhotographs)) {
      if (!photo.asset || photo.verification === "pending") continue;
      const image = new Image();
      image.decoding = "async";
      image.src = `${import.meta.env.BASE_URL}${photo.asset}`;
      void image.decode().catch(() => {});
    }
  }, [near]);
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.dataset.siteTheme === "dark"),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-site-theme"],
    });
    return () => observer.disconnect();
  }, []);
  const progress = useRef(0);
  const manual = useRef<{ value: number; base: number } | null>(null);
  const [active, setActive] = useState(0);
  const selectedIndex = useRef(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const lastActive = useRef(0);
  useEffect(() => {
    if (lastActive.current === active) return;
    setPrevious(lastActive.current);
    lastActive.current = active;
    const timer = window.setTimeout(() => setPrevious(null), 450);
    return () => window.clearTimeout(timer);
  }, [active]);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, []);
  // Every visible element is drawn from this one arc-length fraction. No
  // independent CSS tween may lag behind the marker or selected year.
  const renderProgress = (value: number, synchronous = false) => {
    const bounded = Math.max(0, Math.min(6, value));
    displayed.current = bounded;
    const fraction = bounded / 6;
    if (path.current) {
      const length = path.current.getTotalLength();
      const point = path.current.getPointAtLength(length * fraction);
      // Dashes use LOCAL geometry units, just like getPointAtLength. A
      // non-scaling stroke measures dashes in screen space under our stretched
      // viewBox, which made the painted endpoint drift away from the marker.
      path.current.style.strokeDasharray = `${length} ${length}`;
      path.current.style.strokeDashoffset = String(length * (1 - fraction));
      moving.current?.setAttribute("cx", String(point.x));
      moving.current?.setAttribute("cy", String(point.y));
    }
    root.current?.setAttribute("data-curve-progress", String(fraction));
    const next = Math.floor(bounded + 1e-7);
    if (next !== selectedIndex.current) {
      selectedIndex.current = next;
      // Commit the year in the same paint as the SVG endpoint. Only milestone
      // crossings flush React; fractional scroll frames do not rerender content.
      if (synchronous) flushSync(() => setActive(next));
      else setActive(next);
    }
  };
  useEffect(() => {
    if (!near) return;
    const recalculate = () => {
      if (!path.current) return;
      const length = path.current.getTotalLength();
      setPoints(
        steps.map((_, i) => {
          const point = path.current!.getPointAtLength((length * i) / 6);
          return { x: point.x, y: point.y };
        }),
      );
      renderProgress(displayed.current);
    };
    const observer = new ResizeObserver(recalculate);
    const svg = path.current?.ownerSVGElement;
    if (svg) observer.observe(svg);
    recalculate();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animation.current);
    };
  }, [near]);
  const show = (value: number) => {
    cancelAnimationFrame(animation.current);
    animation.current = 0;
    renderProgress(value, true);
  };
  useEffect(() => {
    const element = root.current;
    if (!element || !near) return;
    if (reduced) {
      cancelAnimationFrame(animation.current);
      animation.current = 0;
      renderProgress(manual.current?.value ?? displayed.current);
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      if (
        !matchMedia("(min-width: 960px) and (min-height: 650px)").matches ||
        reduced
      )
        return;
      const pin = element.querySelector<HTMLElement>(".journey-pin")!;
      const distance = element.offsetHeight - pin.offsetHeight;
      const p = Math.max(
        0,
        Math.min(
          1,
          (100 - element.getBoundingClientRect().top) / Math.max(1, distance),
        ),
      );
      if (manual.current && animation.current) {
        manual.current = { value: displayed.current, base: progress.current };
      }
      progress.current = p;
      show(
        manual.current
          ? manual.current.value + (p - manual.current.base) * 6
          : p * 6,
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [near, reduced]);
  useEffect(() => {
    const element = video.current;
    const surface = pin.current;
    if (!element || !surface || reduced) return;
    setVideoBlocked(false);
    let visible = false;
    let active = true;
    const update = () => {
      if (!visible || document.hidden) {
        element.pause();
        return;
      }
      element.muted = true;
      void element
        .play()
        .then(() => {
          if (active && !element.paused) setVideoBlocked(false);
        })
        .catch((error: DOMException) => {
          if (active && error.name !== "AbortError") setVideoBlocked(true);
        });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    const retry = () => {
      if (element.paused) update();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") retry();
    };
    // The visible sticky spread, rather than its multi-screen scroll wrapper.
    observer.observe(surface);
    surface.addEventListener("pointerdown", retry, { passive: true });
    surface.addEventListener("keydown", key);
    element.addEventListener("canplay", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      active = false;
      observer.disconnect();
      element.pause();
      surface.removeEventListener("pointerdown", retry);
      surface.removeEventListener("keydown", key);
      element.removeEventListener("canplay", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [near, reduced, dark]);
  const select = (index: number) => {
    manual.current = { value: index, base: progress.current };
    cancelAnimationFrame(animation.current);
    animation.current = 0;
    if (reduced) {
      renderProgress(index, true);
      return;
    }
    const start = displayed.current;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 450);
      renderProgress(start + (index - start) * (1 - (1 - t) ** 3), true);
      if (t < 1) animation.current = requestAnimationFrame(tick);
      else animation.current = 0;
    };
    animation.current = requestAnimationFrame(tick);
  };
  const narrative = (index: number, leaving = false) => {
    const item = steps[index];
    return (
      <div
        className={`journey-narrative${leaving ? " is-leaving" : ""}`}
        key={leaving ? `${item.year}-leaving` : "current"}
        aria-hidden={leaving || undefined}
        id={leaving ? undefined : "journey-narrative"}
      >
        <span key={`stage-${item.year}`} className="journey-stage-label">
          {item.stageLabel}
        </span>
        <div className="journey-year-row">
          <span key={item.year} className="journey-year">
            {item.year}
          </span>
        </div>
        <h3 key={`headline-${item.year}`}>{item.headline}</h3>
        <p key={`description-${item.year}`}>{item.description}</p>
        <span className="journey-stage-progress" aria-hidden="true">
          {steps.map((step, stepIndex) => (
            <span
              key={step.year}
              className={stepIndex <= index ? "is-complete" : undefined}
            />
          ))}
        </span>
      </div>
    );
  };
  const current = steps[active];
  const media =
    dark && historyMedia.dark.video ? historyMedia.dark : historyMedia.light;
  const poster = media.poster ?? historyMedia.light.poster;
  return (
    <div
      ref={root}
      className="journey-infographic"
      data-active-year={current.year}
      data-reduced={reduced}
      data-video-motion={videoMoving && !reduced ? "running" : "still"}
      id="company-history-root"
    >
      <div ref={pin} className="journey-pin">
        <header className="journey-header">
          <h2 id="about-title">Наш путь</h2>
        </header>
        <div className="journey-film" aria-hidden="true">
          {near && !reduced ? (
            <video
              key={media.video}
              ref={video}
              src={asset(media.video!)}
              poster={asset(poster)}
              muted
              loop
              playsInline
              preload="metadata"
              onPlaying={() => {
                setVideoMoving(true);
                setVideoBlocked(false);
              }}
              onPause={() => setVideoMoving(false)}
              onError={() => {
                setVideoMoving(false);
                setVideoBlocked(true);
              }}
            />
          ) : (
            <img src={asset(poster)} alt="" loading="lazy" decoding="async" />
          )}
        </div>
        {videoBlocked && !reduced && (
          <button
            type="button"
            className="journey-video-retry"
            onClick={() => {
              const element = video.current;
              if (!element) return;
              if (element.error) element.load();
              element.muted = true;
              void element.play().catch(() => setVideoBlocked(true));
            }}
          >
            <Play size={14} aria-hidden="true" />
            Запустить видео
          </button>
        )}
        <div className="journey-glass-scene">
          <HistoryMilestoneVisual
            visual={current.milestoneVisual}
            interactionArea={pin}
            loadArtwork={near}
          />
        </div>
        <div className="journey-copy-shell">
          {previous !== null &&
            previous !== active &&
            !reduced &&
            narrative(previous, true)}
          {narrative(active)}
        </div>
        <div
          className="journey-photo-collage"
          role="group"
          aria-label={`Фотопримеры к этапу ${current.year}`}
        >
          {current.photographs.map((slot) => (
            <HistoryPrintedPhoto
              key={slot.variant}
              year={current.year}
              photograph={slot.photograph}
              variant={slot.variant}
              placement={slot.placement}
              visible={slot.visible}
              draft={current.verificationStatus === "draft"}
            />
          ))}
        </div>
        <div
          className="journey-trajectory"
          role="group"
          aria-label="Годы истории Young Unicorn"
        >
          <svg
            viewBox="0 0 1200 500"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={curve}
              className="journey-curve-base"
              vectorEffect="non-scaling-stroke"
            />
            <path ref={path} d={curve} className="journey-curve-progress" />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="5"
                className={`journey-fixed-dot${index === active ? " is-active" : ""}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {points[active] && (
              <circle
                key={`arrival-${active}`}
                cx={points[active].x}
                cy={points[active].y}
                r="5"
                className="journey-arrival-ripple"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              ref={moving}
              cx="60"
              cy="410"
              r="6"
              className="journey-moving-dot"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {steps.map((step, index) => (
            <button
              key={step.year}
              className={`journey-milestone${index === active ? " is-active" : ""}`}
              style={
                points[index]
                  ? {
                      left: `${points[index].x / 12}%`,
                      top: `${points[index].y / 5}%`,
                    }
                  : { visibility: "hidden" }
              }
              aria-label={`${step.year}: ${step.headline}`}
              aria-pressed={index === active}
              aria-controls="journey-narrative"
              onClick={() => select(index)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight" || event.key === "ArrowDown")
                  next = Math.min(6, index + 1);
                else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
                  next = Math.max(0, index - 1);
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = 6;
                else return;
                event.preventDefault();
                select(next);
                root.current
                  ?.querySelectorAll<HTMLButtonElement>(".journey-milestone")
                  [next]?.focus({ preventScroll: true });
              }}
            >
              <span className="journey-point-year">{step.year}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
