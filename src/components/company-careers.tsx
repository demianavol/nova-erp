import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ArrowRight, Briefcase, Users, X } from "lucide-react";
import {
  companyCareers as content,
  type CareerBenefit,
} from "../data/company-careers";
import {
  careerMilestones,
  careerOrbitPath,
  careerIndexAtProgress,
  careerScrollProgress,
} from "../data/career-orbit";
import { CareersAtmosphere } from "./careers-atmosphere";
import { CareerBadge, preloadCareerBadge } from "./career-badge";
import { useNearViewport } from "./use-near-viewport";
import "../company-careers.css";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function BenefitIcon({ benefit }: { benefit: CareerBenefit }) {
  return (
    <span
      className={`career-benefit-icon-wrap career-icon-fx-${benefit.id}`}
      aria-hidden="true"
    >
      <img
        src={asset(benefit.icon)}
        width="64"
        height="64"
        alt=""
        loading="lazy"
        decoding="async"
        className="career-benefit-icon-img"
      />
      {[0, 1, 2].map((part) => (
        <span
          className={`career-icon-piece career-icon-piece-${part}`}
          key={part}
        >
          <img
            src={asset(benefit.icon)}
            width="64"
            height="64"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </span>
      ))}
    </span>
  );
}

export function CompanyCareers() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(pinRef);
  const orbitRef = useRef<HTMLDivElement>(null);
  const badgeTrigger = useRef<HTMLButtonElement>(null);
  const alignedScrollY = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [milestones, setMilestones] = useState<
    { x: number; y: number; left: number; top: number }[]
  >([]);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const motionReduced = useRef(reduced);
  useEffect(() => {
    if (reduced || !badgeTrigger.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      preloadCareerBadge();
      observer.disconnect();
    }, { rootMargin: "420px" });
    observer.observe(badgeTrigger.current);
    return () => observer.disconnect();
  }, [reduced]);
  const animation = useRef(0);
  const selectedIndex = useRef(0);
  const orbit = useRef({
    displayed: 0,
    target: 0,
    scroll: 0,
    selection: null as number | null,
  });

  // The trail endpoint and moving dot share one arc length on every frame.
  // No CSS transition on the dash: it would put the painted endpoint behind the dot.
  const drawProgress = useCallback(
    (progress: number, synchronous = true, commitActive = true) => {
      orbit.current.displayed = progress;
      const path = pathRef.current;
      if (!path) return;
      const length = path.getTotalLength();
      const point = path.getPointAtLength(length * progress);
      path.style.strokeDasharray = `${length} ${length}`;
      path.style.strokeDashoffset = String(length * (1 - progress));
      for (const marker of [dotRef.current, ringRef.current]) {
        marker?.setAttribute("cx", String(point.x));
        marker?.setAttribute("cy", String(point.y));
      }
      sectionRef.current?.setAttribute("data-orbit-progress", String(progress));
      if (!commitActive) return;
      const next = careerIndexAtProgress(progress);
      if (next !== selectedIndex.current) {
        selectedIndex.current = next;
        if (synchronous) flushSync(() => setActiveIndex(next));
        else setActiveIndex(next);
      }
    },
    [],
  );

  const updateTarget = useCallback(() => {
    const state = orbit.current;
    const manual = state.selection !== null;
    const target =
      state.selection === null
        ? state.scroll
        : careerMilestones[state.selection];
    // Preserve the tween when measurement repeats the same target.
    if (
      !motionReduced.current &&
      target === state.target &&
      (animation.current || state.displayed === target)
    )
      return;
    state.target = target;
    if (animation.current) cancelAnimationFrame(animation.current);
    animation.current = 0;
    if (motionReduced.current) {
      drawProgress(state.target);
      return;
    }
    const started = performance.now();
    const start = state.displayed;
    const tick = (now: number) => {
      const time = Math.min(1, (now - started) / (manual ? 650 : 460));
      const ease = manual
        ? time * time * time * (time * (time * 6 - 15) + 10)
        : 1 - (1 - time) ** 3;
      const next =
        time === 1 ? state.target : start + (state.target - start) * ease;
      // A direct choice has one destination; don't flash intervening scenes.
      drawProgress(next, true, !manual || time === 1);
      animation.current =
        next === state.target ? 0 : requestAnimationFrame(tick);
    };
    animation.current = requestAnimationFrame(tick);
  }, [drawProgress]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      motionReduced.current = preference.matches;
      setReduced(preference.matches);
      updateTarget();
    };
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, [updateTarget]);

  useLayoutEffect(() => {
    if (!near) return;
    const path = pathRef.current;
    const root = orbitRef.current;
    const svg = path?.ownerSVGElement;
    if (!path || !root || !svg) return;
    const measure = () => {
      const matrix = svg.getScreenCTM();
      if (!matrix || !svg.getClientRects().length) return;
      const bounds = root.getBoundingClientRect();
      const length = path.getTotalLength();
      setMilestones(
        careerMilestones.map((fraction) => {
          const point = path.getPointAtLength(length * fraction);
          const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
          return {
            x: point.x,
            y: point.y,
            left: screen.x - bounds.left,
            top: screen.y - bounds.top,
          };
        }),
      );
    };
    // Cards use the same transformed SVG coordinates as their milestone dots.
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(svg);
    return () => resize.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
    drawProgress(orbit.current.displayed, false);
    let measureFrame = 0;
    let lastScrollY = window.scrollY;
    const measure = () => {
      measureFrame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const scrolled = Math.abs(window.scrollY - lastScrollY) > 1;
      lastScrollY = window.scrollY;
      if (
        !matchMedia(
          "(min-width: 961px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
        ).matches
      )
        return;
      const rect = section.getBoundingClientRect();
      const state = orbit.current;
      state.scroll = careerScrollProgress(
        rect.top,
        rect.height,
        pinRef.current?.offsetHeight ?? window.innerHeight,
      );
      const aligned =
        alignedScrollY.current !== null &&
        Math.abs(window.scrollY - alignedScrollY.current) < 2;
      if (scrolled) {
        if (!aligned) state.selection = null;
        alignedScrollY.current = null;
      }
      updateTarget();
    };
    const queueMeasure = () => {
      if (!measureFrame) measureFrame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", queueMeasure, { passive: true });
    window.addEventListener("resize", queueMeasure, { passive: true });
    const resize = new ResizeObserver(queueMeasure);
    if (sectionRef.current) resize.observe(sectionRef.current);
    queueMeasure();
    return () => {
      window.removeEventListener("scroll", queueMeasure);
      window.removeEventListener("resize", queueMeasure);
      resize.disconnect();
      cancelAnimationFrame(measureFrame);
      cancelAnimationFrame(animation.current);
      animation.current = 0;
    };
  }, [near, drawProgress, updateTarget]);

  const select = (index: number) => {
    orbit.current.selection = index;
    updateTarget();
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (section && pin && getComputedStyle(pin).position === "sticky") {
      const rect = section.getBoundingClientRect();
      const distance = section.offsetHeight - pin.offsetHeight;
      // A deliberate chapter click aligns the scroll position with that hold.
      // Further wheel movement then continues from the chosen chapter.
      alignedScrollY.current =
        window.scrollY +
        rect.top -
        100 +
        distance * ((index + 0.2) / content.benefits.length);
      window.scrollTo({
        top: alignedScrollY.current,
        behavior: "instant",
      });
    }
  };

  const reflectButton = (event: PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
  };

  return (
    <section
      ref={sectionRef}
      className="company-careers lp-container lp-section"
      id="careers"
      aria-labelledby="careers-title"
    >
      <div ref={pinRef} className="career-pin">
        <div className="career-stage">
          <header className="career-heading">
            <span className="career-eyebrow">— {content.eyebrow}</span>
            <h2 id="careers-title">
              {content.title}
              <br />
              <span>{content.accent}</span>
            </h2>
            <p className="career-subtitle">{content.subtitle}</p>
          </header>
          <CareersAtmosphere benefit={content.benefits[activeIndex].id} />

          <div
            ref={orbitRef}
            className="career-orbit"
            aria-label="Возможности в команде"
          >
            <svg
              className="career-orbit-svg"
              viewBox="0 0 760 380"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="career-orbit-spectrum"
                  x1="100"
                  y1="320"
                  x2="650"
                  y2="60"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--career-accent)" />
                  <stop
                    offset=".48"
                    stopColor="var(--career-orbit-highlight)"
                  />
                  <stop offset="1" stopColor="var(--career-accent)" />
                </linearGradient>
              </defs>
              <path d={careerOrbitPath} className="career-orbit-base-track" />
              <path
                ref={pathRef}
                d={careerOrbitPath}
                className="career-orbit-trail"
              />
              {milestones.map((point, index) => (
                <g
                  key={index}
                  className={`career-milestone-marker${activeIndex === index ? " is-active" : ""}`}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    className="career-milestone-dot"
                  />
                </g>
              ))}
              <circle
                ref={ringRef}
                className="career-moving-ring"
                cx="250"
                cy="60"
                r="11"
              />
              <circle
                ref={dotRef}
                className="career-moving-dot"
                cx="250"
                cy="60"
                r="4.5"
              />
            </svg>

            <div className="career-orbit-center" aria-hidden="true">
              <span className="career-orbit-center-label">Твоя траектория</span>
              <span className="career-orbit-center-count">
                {String(activeIndex + 1).padStart(2, "0")}
                <small>
                  {" "}
                  / {String(content.benefits.length).padStart(2, "0")}
                </small>
              </span>
              <span className="career-orbit-center-rule" />
            </div>
            {content.benefits.map((benefit, index) => {
              const active = activeIndex === index;
              return (
                <button
                  key={benefit.id}
                  type="button"
                  className={`career-benefit-pill career-benefit-${benefit.id}${active ? " is-active" : ""}`}
                  data-side={
                    index === 0 || index === 1 || index === 5
                      ? "above"
                      : "below"
                  }
                  style={
                    milestones[index]
                      ? ({
                          "--milestone-x": `${milestones[index].left}px`,
                          "--milestone-y": `${milestones[index].top}px`,
                        } as CSSProperties)
                      : undefined
                  }
                  aria-expanded={active}
                  aria-describedby={
                    active ? `career-description-${benefit.id}` : undefined
                  }
                  aria-controls={`career-description-${benefit.id}`}
                  onClick={() => select(index)}
                  onKeyDown={(event) => {
                    const direction =
                      event.key === "ArrowRight" || event.key === "ArrowDown"
                        ? 1
                        : event.key === "ArrowLeft" || event.key === "ArrowUp"
                          ? -1
                          : 0;
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? content.benefits.length - 1
                          : direction
                            ? (index + direction + content.benefits.length) %
                              content.benefits.length
                            : null;
                    if (next !== null) {
                      event.preventDefault();
                      sectionRef.current
                        ?.querySelectorAll<HTMLButtonElement>(
                          ".career-benefit-pill",
                        )
                        [next]?.focus();
                    }
                  }}
                >
                  <BenefitIcon benefit={benefit} />
                  <span className="career-benefit-text">
                    <span className="career-benefit-title">
                      {benefit.title}
                    </span>
                    <span
                      className="career-benefit-reveal"
                      aria-hidden={!active}
                    >
                      <span
                        className="career-benefit-desc"
                        id={`career-description-${benefit.id}`}
                      >
                        {benefit.description}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <footer className="career-actions">
            <a
              className="career-btn career-btn-primary"
              href={content.hrUrl}
              target="_blank"
              rel="noopener noreferrer"
              onPointerMove={reflectButton}
            >
              <Briefcase size={16} aria-hidden="true" />
              <span>Открытые вакансии</span>
              <ArrowUpRight
                size={16}
                className="career-btn-arrow"
                aria-hidden="true"
              />
            </a>
            <Dialog.Root>
              <Dialog.Trigger
                ref={badgeTrigger}
                className="career-btn career-btn-secondary"
                onFocus={() => {
                  if (!reduced) preloadCareerBadge();
                }}
                onPointerEnter={() => {
                  if (!reduced) preloadCareerBadge();
                }}
                onPointerMove={reflectButton}
              >
                <Users size={16} aria-hidden="true" />
                <span>Твой пропуск в команду</span>
                <ArrowRight
                  size={16}
                  className="career-btn-arrow"
                  aria-hidden="true"
                />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="career-dialog-overlay" />
                <Dialog.Content className="career-dialog career-badge-dialog">
                  <div className="career-dialog-copy">
                    <span className="career-eyebrow">Давай знакомиться</span>
                    <Dialog.Title>
                      Твой пропуск
                      <br />в Young Unicorn
                    </Dialog.Title>
                    <Dialog.Description>
                      Отправь HR пару строк о себе и ссылку на резюме или
                      портфолио. Начнём со знакомства.
                    </Dialog.Description>
                    <div className="career-dialog-actions">
                      <a
                        href={content.hrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Написать HR{" "}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                  <CareerBadge
                    image={asset(content.badge)}
                    reduced={reduced}
                    renderSpace="local"
                  />
                  <Dialog.Close
                    className="career-dialog-close"
                    aria-label="Закрыть пропуск в команду"
                  >
                    <X size={20} />
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </footer>
        </div>
      </div>
    </section>
  );
}
