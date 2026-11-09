import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  FloatingArrow,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from "@floating-ui/react";
import { X, ArrowUpRight } from "lucide-react";
import { companyFuture } from "../data/company-future";
import { FutureAtmosphere } from "./future-atmosphere";
import "../company-future.css";

type FuturePriority = (typeof companyFuture.priorities)[number];
const pointPositions = [
  { left: "36%", top: "79%" },
  { left: "65%", top: "64%" },
  { left: "43%", top: "53%" },
  { left: "51%", top: "36%" },
];

function FuturePoint({
  priority,
  position,
  selected,
  onSelect,
}: {
  priority: FuturePriority;
  position: CSSProperties;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useSiteLanguage();
  const open = selected === priority.id;
  const arrowRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { refs, floatingStyles, context, placement, isPositioned } =
    useFloating({
      open,
      onOpenChange: (next) => {
        if (!next && open) onSelect(null);
      },
      placement:
        priority.id === "brands" || priority.id === "technology"
          ? "left"
          : "right",
      whileElementsMounted: (reference, floating, update) =>
        autoUpdate(reference, floating, update, { animationFrame: true }),
      middleware: [
        offset(20),
        flip({
          fallbackPlacements: ["left", "top", "bottom"],
          padding: { top: 100, right: 20, bottom: 20, left: 20 },
        }),
        shift({ padding: { top: 100, right: 20, bottom: 20, left: 20 } }),
        arrow({ element: arrowRef, padding: 20 }),
      ],
    });
  const dismiss = useDismiss(context, {
    outsidePress: (event) =>
      !(event.target as Element).closest(".future-priority-surface"),
  });
  const { getFloatingProps } = useInteractions([dismiss]);
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: { open: 380, close: 180 },
    initial: ({ side }) => ({
      opacity: 0,
      transform: `translate3d(${side === "right" ? "-12px" : side === "left" ? "12px" : "0"}, ${side === "top" ? "10px" : side === "bottom" ? "-10px" : "0"}, 0) scale(.94)`,
    }),
    common: ({ side }) => ({
      transformOrigin: {
        right: "left center",
        left: "right center",
        top: "center bottom",
        bottom: "center top",
      }[side],
    }),
  });
  const close = () => {
    onSelect(null);
    buttonRef.current?.focus();
  };
  return (
    <div className="future-point-anchor" style={position} data-open={open}>
      <button
        ref={(element) => {
          buttonRef.current = element;
          refs.setReference(element);
        }}
        type="button"
        className="future-point"
        data-priority={priority.id}
        aria-label={`${priority.number}. ${t(priority.title)}`}
        aria-expanded={open}
        aria-controls={`future-detail-${priority.id}`}
        onClick={() => onSelect(open ? null : priority.id)}
      >
        <span className="future-point-ring" aria-hidden="true" />
        <span>{priority.number}</span>
        <span className="future-point-label" aria-hidden="true">
          {t(priority.title)}
        </span>
      </button>
      {isMounted && (selected === null || open) && (
        <div
          ref={refs.setFloating}
          id={`future-detail-${priority.id}`}
          className="future-detail"
          style={{
            ...floatingStyles,
            visibility: isPositioned ? "visible" : "hidden",
            pointerEvents: open ? "auto" : "none",
          }}
          data-side={placement.split("-")[0]}
          role="region"
          aria-labelledby={`future-detail-${priority.id}-title`}
          aria-live="polite"
          {...getFloatingProps()}
        >
          <div className="future-detail-content" style={styles}>
            <FloatingArrow
              ref={arrowRef}
              context={context}
              width={16}
              height={8}
              tipRadius={1}
              fill="var(--future-popover)"
              stroke="var(--future-border)"
              strokeWidth={1}
            />
            <div className="future-detail-heading">
              <img
                className="future-detail-icon"
                data-icon-priority={priority.id}
                src={`${import.meta.env.BASE_URL}${priority.icon}`}
                width={44}
                height={44}
                alt=""
              />
              <div>
                <span className="future-detail-kicker">
                  {t("Приоритет") + " "}{priority.number}
                </span>
                <h3 id={`future-detail-${priority.id}-title`}>
                  {t(priority.title)}
                </h3>
              </div>
            </div>
            <p>{t(priority.description)}</p>
            <button
              type="button"
              className="future-detail-close"
              aria-label={t("Закрыть приоритет")}
              onClick={close}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CompanyFuture() {
  const { language, t } = useSiteLanguage();
  const section = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let bounds: DOMRect | null = null;
    let visible = false;
    let frame = 0;
    let previous = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    const paint = () => {
      root.style.setProperty("--future-x", `${x.toFixed(3)}px`);
      root.style.setProperty("--future-y", `${y.toFixed(3)}px`);
    };
    const render = (time: number) => {
      const delta = previous ? Math.min(time - previous, 40) : 16;
      previous = time;
      const ease = 1 - Math.exp(-delta / 170);
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      paint();
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.02)
        frame = requestAnimationFrame(render);
      else frame = previous = 0;
    };
    const active = () => visible && !document.hidden && !reduced.matches;
    const schedule = () => {
      if (!frame && active()) frame = requestAnimationFrame(render);
    };
    const activity = () => {
      root.dataset.motion = active() ? "running" : "paused";
      if (!active()) {
        cancelAnimationFrame(frame);
        frame = previous = 0;
        x = y = targetX = targetY = 0;
        paint();
      }
    };
    const enter = () => {
      bounds = root.getBoundingClientRect();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !active() || !bounds) return;
      targetX = Math.max(
        -10,
        Math.min(10, ((event.clientX - bounds.left) / bounds.width - 0.5) * 20),
      );
      targetY = Math.max(
        -6,
        Math.min(6, ((event.clientY - bounds.top) / bounds.height - 0.5) * 12),
      );
      schedule();
    };
    const leave = () => {
      targetX = targetY = 0;
      schedule();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) root.dataset.revealed = "true";
        activity();
      },
      { rootMargin: "80px 0px", threshold: 0.05 },
    );
    root.dataset.enhanced = "true";
    observer.observe(root);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", leave);
    window.addEventListener("resize", enter);
    reduced.addEventListener("change", activity);
    document.addEventListener("visibilitychange", activity);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", enter);
      reduced.removeEventListener("change", activity);
      document.removeEventListener("visibilitychange", activity);
    };
  }, []);

  return (
    <section
      ref={section}
      className="company-future lp-container lp-section"
      id="future"
      aria-labelledby="future-title"
    >
      <FutureAtmosphere paused={false} />
      <header className="future-heading">
        <span className="future-eyebrow">
          <span aria-hidden="true">—</span> {t(companyFuture.eyebrow)}
        </span>
        <h2 id="future-title">
          {t(companyFuture.headline.lead)}
          {language === "zh-CN" ? "" : " "}
          <span>{t(companyFuture.headline.accent)}</span>
        </h2>
        <p>{t(companyFuture.description)}</p>
      </header>

      <div
        className="future-scene"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setSelected(null);
            section.current
              ?.querySelector<HTMLButtonElement>(
                `[data-priority="${selected}"]`,
              )
              ?.focus();
          }
        }}
      >
        <div className="future-mountain">
          <img
            src={`${import.meta.env.BASE_URL}media/future/mountain-bicolor.webp`}
            alt=""
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
          />
          <div
            className="future-points"
            role="group"
            aria-label={t("Выбрать приоритет развития")}
          >
            {companyFuture.priorities.map((priority, index) => (
              <FuturePoint
                key={priority.id}
                priority={priority}
                position={pointPositions[index]}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>
        <ol
          className="future-priorities"
          aria-label={t("Приоритеты развития Young Unicorn")}
        >
          {companyFuture.priorities.map((priority) => (
            <li
              className={`future-priority future-priority-${priority.id}${selected === priority.id ? " is-active" : ""}`}
              key={priority.id}
            >
              <button
                type="button"
                className="future-priority-surface"
                aria-labelledby={`future-${priority.id}-title`}
                aria-expanded={selected === priority.id}
                aria-controls={`future-detail-${priority.id}`}
                onClick={() =>
                  setSelected((current) =>
                    current === priority.id ? null : priority.id,
                  )
                }
              >
                <span className="future-priority-icon" aria-hidden="true">
                  <img
                    data-icon-priority={priority.id}
                    src={`${import.meta.env.BASE_URL}${priority.icon}`}
                    alt=""
                    width={120}
                    height={120}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="future-priority-copy">
                  <span className="future-priority-number" aria-hidden="true">
                    {priority.number}
                  </span>
                  <span
                    className="future-priority-title"
                    id={`future-${priority.id}-title`}
                  >
                    {t(priority.title)}
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="future-priority-arrow"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
