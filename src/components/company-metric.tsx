import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Info, X } from "lucide-react";
import { company } from "../data/company";
import { MetricMotion } from "./metric-motion";

const notes = [
  {
    title: "Покупатели наших продуктов",
    text: "Более 2 млн покупателей выбрали продукты Young Unicorn за период работы",
    detail:
      "Развиваем продукты, их подачу и продажи — от первой коллекции до повторной покупки",
  },
  {
    title: "Заказы на маркетплейсе",
    text: "Более 2,7 млн заказов за период работы компании",
    detail: "Работаем с ассортиментом, контентом и продажами на Wildberries",
  },
  {
    title: "История портфеля",
    text: "3 бренда за весь период работы компании",
    detail:
      "Сейчас развиваем женскую одежду Enmoone и запускаем направление self-care",
  },
  {
    title: "Рост оборота",
    text: "В презентации указан годовой прирост оборота 50–100%",
    detail: "Диапазон отражает темпы роста бизнеса год к году",
  },
];
type Metric = (typeof company.highlights)[number];
export function CompanyMetric({
  metric,
  index,
  active,
  onOpen,
  onClose,
}: {
  metric: Metric;
  index: number;
  active: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dismissed = useRef(false);
  const [pinned, setPinned] = useState(false);
  const [above, setAbove] = useState(false);
  const id = useId();
  const note = notes[index];
  const position = () => {
    const rect = root.current?.getBoundingClientRect();
    if (rect) setAbove(rect.bottom + 260 > innerHeight && rect.top > 260);
  };
  const close = (restore: boolean) => {
    dismissed.current = true;
    setPinned(false);
    onClose();
    if (restore && root.current?.contains(document.activeElement))
      trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!active) setPinned(false);
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        close(false);
    };
    window.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [active, onClose]);
  return (
    <article
      ref={root}
      style={{ "--metric-delay": `${index * 100}ms` } as CSSProperties}
      className={`lp-metric${"compact" in metric ? " lp-metric-compact" : ""}${active ? " is-expanded" : ""}`}
      onPointerEnter={(event) => {
        if (
          event.pointerType === "mouse" &&
          matchMedia("(hover:hover) and (pointer:fine)").matches
        ) {
          dismissed.current = false;
          position();
          onOpen();
        }
      }}
      onPointerLeave={() => {
        dismissed.current = false;
        if (!pinned && !root.current?.contains(document.activeElement))
          onClose();
      }}
      onFocusCapture={() => {
        if (!dismissed.current) {
          position();
          onOpen();
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          dismissed.current = false;
          if (!pinned) onClose();
        }
      }}
    >
      <MetricMotion index={index} />
      <div className="lp-metric-number">
        {metric.value}
        <span>{metric.unit}</span>
      </div>
      <h3>{metric.label}</h3>
      {index >= 2 && <p>{metric.detail}</p>}
      <button
        ref={trigger}
        className="lp-metric-trigger"
        type="button"
        aria-label={`Подробнее: ${metric.value} ${metric.unit} ${metric.label}`}
        aria-expanded={active}
        aria-controls={id}
        onClick={() => {
          if (active && pinned) close(true);
          else {
            dismissed.current = false;
            setPinned(true);
            position();
            onOpen();
          }
        }}
      >
        <Info className="lp-metric-info-symbol" size={15} aria-hidden="true" />
      </button>
      {active && (
        <div
          id={id}
          role="region"
          aria-label={note.title}
          className={`lp-metric-popover${above ? " is-above" : ""}`}
        >
          <button
            type="button"
            className="lp-metric-popover-close"
            aria-label="Закрыть пояснение"
            onClick={() => close(true)}
          >
            <X size={15} />
          </button>
          <h4>{note.title}</h4>
          <p>{note.text}</p>
          <p>{note.detail}</p>
          <span>По данным презентации компании</span>
        </div>
      )}
    </article>
  );
}
