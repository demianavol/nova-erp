import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  autoUpdate,
  autoPlacement,
  FloatingFocusManager,
  FloatingPortal,
  hide,
  offset,
  safePolygon,
  shift,
  size,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";
import {
  ArrowUpRight,
  Check,
  Info,
  Layers3,
  Heart,
  ShoppingBag,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  metricDisplayUnit,
  metricDisplayValue,
  metricVerificationLabels,
  type CompanyMetricData,
} from "../data/company-metrics";

export const metricIcons = {
  customers: Users,
  orders: ShoppingBag,
  brands: Layers3,
  growth: ArrowUpRight,
  trophy: Trophy,
  star: Star,
  reviews: Heart,
};

type Selection = { id: string; pinned: boolean } | null;
type MetricDetailsState = {
  selection: Selection;
  open: (id: string, pinned: boolean, fromFocus?: boolean) => void;
  close: (id: string, suppressHover?: boolean) => void;
};
const MetricDetailsContext = createContext<MetricDetailsState | null>(null);

// One selection for both rows: a pinned panel survives hover over other metrics.
export function MetricDetailsProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(null);
  // Closing a panel can expose another card under a stationary pointer.
  // Resume hover only after the user actually moves the pointer.
  const hoverSuppressed = useRef(false);
  useEffect(() => {
    const resumeHover = (event: PointerEvent) => {
      if (event.movementX || event.movementY) hoverSuppressed.current = false;
    };
    window.addEventListener("pointermove", resumeHover, true);
    return () => window.removeEventListener("pointermove", resumeHover, true);
  }, []);
  const open = useCallback((id: string, pinned: boolean, fromFocus = false) => {
    if (hoverSuppressed.current && !pinned && !fromFocus) return;
    if (pinned) hoverSuppressed.current = false;
    setSelection((current) => {
      if (current?.pinned && !pinned && !fromFocus) return current;
      if (current?.id === id && current.pinned === pinned) return current;
      return { id, pinned };
    });
  }, []);
  const close = useCallback((id: string, suppressHover = false) => {
    if (suppressHover) hoverSuppressed.current = true;
    setSelection((current) => (current?.id === id ? null : current));
  }, []);
  const value = useMemo(
    () => ({ selection, open, close }),
    [selection, open, close],
  );
  return (
    <MetricDetailsContext.Provider value={value}>
      {children}
    </MetricDetailsContext.Provider>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function MetricDetails({
  metric,
  className,
  style,
  children,
}: {
  metric: CompanyMetricData;
  className: string;
  style?: CSSProperties;
  children: ReactNode | ((engaged: boolean) => ReactNode);
}) {
  const state = useContext(MetricDetailsContext);
  if (!state) throw new Error("MetricDetails requires MetricDetailsProvider");
  const { selection, open, close } = state;
  const active = selection?.id === metric.id;
  const pinned = active && selection.pinned;
  const titleId = useId();
  const descriptionId = useId();
  const reducedMotion = useReducedMotion();
  const returnFocus = useRef(false);
  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: active,
    onOpenChange: (next, _event, reason) => {
      const passive =
        reason === "hover" ||
        reason === "safe-polygon" ||
        reason === "focus" ||
        reason === "focus-out";
      if (next) {
        returnFocus.current = reason === "focus";
        open(metric.id, false, reason === "focus");
      } else if (!pinned || !passive) {
        close(metric.id, !passive);
      }
    },
    placement: "right-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      autoPlacement(({ elements, rects }) => {
        const card = elements.reference.getBoundingClientRect();
        const viewportWidth =
          elements.floating.ownerDocument.documentElement.clientWidth;
        const allowed: (
          "right-start" | "left-start" | "bottom-start" | "top-start"
        )[] = [];
        // Side placement is eligible only when the full panel fits beside the
        // card. On narrow screens use vertical space and scroll a short panel.
        if (card.right + rects.floating.width + 24 <= viewportWidth)
          allowed.push("right-start");
        if (card.left - rects.floating.width - 24 >= 0)
          allowed.push("left-start");
        allowed.push("bottom-start", "top-start");
        return { allowedPlacements: allowed, alignment: "start", padding: 12 };
      }),
      shift({ padding: 12 }),
      size({
        padding: 12,
        apply({ elements, availableHeight }) {
          elements.floating.style.maxHeight = `${Math.min(440, Math.max(0, availableHeight))}px`;
        },
      }),
      hide({ strategy: "referenceHidden" }),
    ],
  });
  const hover = useHover(context, {
    enabled: !selection?.pinned,
    mouseOnly: true,
    move: false,
    delay: { open: 180, close: 140 },
    handleClose: safePolygon({ blockPointerEvents: false }),
  });
  const focus = useFocus(context, { visibleOnly: false });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);
  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: reducedMotion ? 0 : 240,
    initial: ({ side }) => ({
      opacity: 0,
      transform: reducedMotion
        ? "none"
        : `translateY(${side === "top" ? "5px" : "-5px"}) scale(0.985)`,
    }),
  });
  const Icon = metricIcons[metric.icon];
  const verified = metric.verification === "verified" && metric.value !== null;
  const hasDisplayValue = verified || metric.verification === "demo";
  const [engaged, setEngaged] = useState(false);
  return (
    <article
      ref={refs.setPositionReference}
      className={`${className}${active ? " is-expanded" : ""}${engaged || active ? " is-engaged has-motion is-revealed" : ""}`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setEngaged(true);
      }}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setEngaged(false);
      }}
      style={style}
      data-company-metric={metric.id}
    >
      {typeof children === "function" ? children(engaged || active) : children}
      <button
        ref={refs.setReference}
        type="button"
        className="lp-metric-trigger"
        {...getReferenceProps({
          "aria-label": `Подробнее: ${metric.label}`,
          "aria-expanded": active,
          onClick: () => {
            if (pinned) {
              close(metric.id, true);
            } else {
              returnFocus.current = true;
              open(metric.id, true);
            }
          },
        })}
      >
        <Info className="lp-metric-info-symbol" size={15} aria-hidden="true" />
      </button>
      {isMounted && (!selection || active) && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
            returnFocus={returnFocus.current}
            closeOnFocusOut={!pinned}
          >
            <div
              ref={refs.setFloating}
              className="company-metric-positioner"
              data-metric-panel={metric.id}
              style={{
                ...floatingStyles,
                visibility: middlewareData.hide?.referenceHidden
                  ? "hidden"
                  : "visible",
                pointerEvents: active ? "auto" : "none",
              }}
              {...getFloatingProps({
                "aria-labelledby": titleId,
                "aria-describedby": descriptionId,
              })}
            >
              <div className="company-metric-panel" style={transitionStyles}>
                <div className="cmp-heading">
                  <span className="cmp-icon">
                    <Icon size={21} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 id={titleId}>{metric.label}</h3>
                  <button
                    type="button"
                    className="cmp-close"
                    aria-label="Закрыть пояснение"
                    onClick={(event) =>
                      context.onOpenChange(
                        false,
                        event.nativeEvent,
                        "reference-press",
                      )
                    }
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="cmp-value">
                  {metricDisplayValue(metric)}
                  {metricDisplayUnit(metric) && (
                    <span>{metricDisplayUnit(metric)}</span>
                  )}
                </div>
                <dl className="cmp-metadata">
                  <div>
                    <dt>Охват</dt>
                    <dd>{metric.scope.label}</dd>
                  </div>
                  <div>
                    <dt>Период</dt>
                    <dd>{metric.period ?? "За всё время · с 2020 года"}</dd>
                  </div>
                  {metric.brandCounts && (
                    <div>
                      <dt>Сейчас</dt>
                      <dd>
                        {hasDisplayValue
                          ? (metric.brandCounts.active ?? "—")
                          : "—"}{" "}
                        активных бренда
                      </dd>
                    </div>
                  )}
                </dl>
                {hasDisplayValue && !!metric.marketplaceAchievements?.length ? (
                  <ul
                    className="cmp-achievements"
                    aria-label="Достижения по годам и брендам"
                  >
                    {metric.marketplaceAchievements.map(
                      (achievement, index) => (
                        <li key={`${achievement.scope.brand}-${index}`}>
                          <div>
                            <strong>
                              {metricDisplayValue(achievement)}
                              {metricDisplayUnit(achievement)}
                            </strong>
                            <span>{achievement.period}</span>
                          </div>
                          <p>
                            {achievement.scope.brand} ·{" "}
                            {achievement.marketplace}
                          </p>
                          <small>{achievement.category}</small>
                        </li>
                      ),
                    )}
                  </ul>
                ) : hasDisplayValue && !!metric.yearlyBreakdown?.length ? (
                  <div className="cmp-breakdown">
                    <h4>{metric.breakdownLabel ?? "По годам"}</h4>
                    <dl
                      aria-label={metric.breakdownLabel ?? "Годовая разбивка"}
                    >
                      {metric.yearlyBreakdown.map((row) => (
                        <div key={row.year}>
                          <dt>{row.year}</dt>
                          <dd>
                            <strong>{row.value}</strong>
                            {row.detail && <span>{row.detail}</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
                <p id={descriptionId} className="cmp-methodology">
                  {metric.methodology}
                </p>
                <div className="cmp-footer">
                  <span
                    className={`cmp-status${verified ? " is-verified" : ""}`}
                  >
                    {verified ? (
                      <Check size={11} aria-hidden="true" />
                    ) : (
                      <span className="cmp-status-dot" />
                    )}
                    {metric.verification === "demo"
                      ? "Демо-данные"
                      : metricVerificationLabels[metric.verification]}
                  </span>
                  <span className="cmp-source">
                    {metric.source?.label ?? "Источник ожидается"}
                  </span>
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </article>
  );
}
