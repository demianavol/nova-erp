import { useSiteLanguage } from "../lib/site-language";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { X } from "lucide-react";

const figures = [
  {
    id: "marketing",
    label: "Маркетинг",
    description: "Изучаем спрос, создаём контент и продвигаем бренды",
    shape:
      "44.7% 41.2%, 34.4% 8.3%, 35.9% 5.3%, 38.7% 4.2%, 56.8% 31%, 58.2% 35%, 55.7% 38.2%, 47.5% 44.4%",
    x: "46%",
    y: "24%",
    zoom: 1.42,
  },
  {
    id: "product",
    label: "Продукт",
    description: "Разрабатываем продукты и развиваем ассортимент брендов",
    shape:
      "19.9% 69.9%, 24.6% 64.1%, 46.9% 47.9%, 49% 47.7%, 51.6% 49.3%, 64.5% 66.4%, 65% 74.5%, 63.7% 80.3%, 60.7% 82.4%, 26% 83.8%, 22.5% 82.4%, 20.7% 80.1%",
    x: "43%",
    y: "66%",
    zoom: 1.18,
  },
  {
    id: "it",
    label: "IT",
    description: "Развиваем цифровые инструменты для работы команды",
    shape:
      "54.7% 48.6%, 54.1% 44.2%, 56.8% 39.6%, 75.2% 25%, 77.9% 23.8%, 81.4% 24.8%, 84.4% 30.8%, 92% 66.4%, 92.8% 72.9%, 91.2% 80.3%, 87.9% 83.1%, 83.4% 81.7%, 60.4% 56.2%",
    x: "74%",
    y: "54%",
    zoom: 1.16,
  },
] as const;

type Figure = (typeof figures)[number];
const returnDuration = 680;

export function HeroFigureLabels({
  poster,
  spotlightCanvas,
}: {
  poster: string;
  spotlightCanvas: RefObject<HTMLCanvasElement | null>;
}) {
  const { t } = useSiteLanguage();
  const detailId = useId();
  const buttons = useRef<Partial<Record<Figure["id"], HTMLButtonElement>>>({});
  const [hovered, setHovered] = useState<Figure>();
  const [focused, setFocused] = useState<Figure>();
  const [selected, setSelected] = useState<Figure>();
  const [retained, setRetained] = useState<Figure>();
  const visible = hovered ?? focused ?? selected;
  const shown = visible ?? retained;

  useEffect(() => {
    if (visible) {
      if (retained !== visible) setRetained(visible);
      return;
    }
    if (!retained) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRetained(undefined);
      return;
    }
    // Keep rendering the last figure while its live canvas travels back.
    const timer = window.setTimeout(
      () => setRetained(undefined),
      returnDuration + 50,
    );
    return () => window.clearTimeout(timer);
  }, [visible, retained]);

  const dismiss = (returnFocus: boolean) => {
    if (returnFocus && visible) {
      buttons.current[visible.id]?.focus({ preventScroll: true });
    }
    setHovered(undefined);
    setFocused(undefined);
    setSelected(undefined);
  };

  const select = (figure: Figure) => {
    setHovered(undefined);
    setFocused(undefined);
    setSelected(figure);
  };

  const toggle = (figure: Figure) => {
    if (selected === figure) dismiss(false);
    else select(figure);
  };

  return (
    <div
      className="hero-figure-labels"
      data-active={visible?.id}
      style={{ "--figure-return": `${returnDuration}ms` } as CSSProperties}
      role="group"
      aria-label={t("Маркетинг, продукт и IT")}
      onPointerLeave={() => setHovered(undefined)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(undefined);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && visible) {
          event.preventDefault();
          dismiss(true);
        }
      }}
    >
      {figures.map((figure) => (
        <button
          key={figure.id}
          ref={(button) => {
            if (button) buttons.current[figure.id] = button;
            else delete buttons.current[figure.id];
          }}
          className="hero-figure-hit"
          data-figure={figure.id}
          data-current={visible === figure}
          type="button"
          aria-label={t(figure.label)}
          aria-pressed={selected === figure}
          aria-controls={visible === figure ? detailId : undefined}
          style={{ clipPath: `polygon(${figure.shape})` }}
          onPointerMove={(event) => {
            if (event.pointerType === "mouse" && !visible) setHovered(figure);
          }}
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible"))
              setFocused(figure);
          }}
          onClick={() => toggle(figure)}
        />
      ))}
      {shown && (
        <>
          <div
            className="hero-figure-spotlight"
            key={shown.id}
            inert={!visible}
            style={
              {
                "--figure-x": shown.x,
                "--figure-y": shown.y,
                "--figure-zoom": shown.zoom,
                clipPath: `polygon(${shown.shape})`,
              } as CSSProperties
            }
          >
            <img src={poster} alt="" width={640} height={540} />
            <canvas ref={spotlightCanvas} aria-hidden="true" />
            <button
              type="button"
              className="hero-figure-hit hero-figure-spotlight-hit"
              tabIndex={-1}
              aria-label={
                selected === shown
                  ? t("Снять выбор")
                  : t("Выбрать: {0}", t(shown.label))
              }
              onClick={() => toggle(shown)}
            />
          </div>
          <aside
            id={detailId}
            className="hero-figure-panel"
            aria-label={t("О направлении")}
            inert={!visible}
            onClick={(event) => {
              if (
                visible &&
                hovered &&
                !(event.target as HTMLElement).closest("button")
              ) {
                select(visible);
              }
            }}
            onFocus={(event) => {
              if (event.target.matches(":focus-visible")) setFocused(visible);
            }}
          >
            <button
              type="button"
              className="hero-figure-close"
              aria-label={t("Закрыть описание")}
              onClick={(event) => dismiss(event.detail === 0)}
            >
              <X size={17} aria-hidden="true" />
            </button>
            <div className="hero-figure-copy" key={shown.id} aria-live="polite">
              <span>
                {t("Экспертиза / 0")}
                {figures.indexOf(shown) + 1}
              </span>
              <h2>{t(shown.label)}</h2>
              <p>{t(shown.description)}</p>
            </div>
            <div
              className="hero-figure-options"
              role="group"
              aria-label={t("Выбрать направление")}
            >
              {figures.map((figure) => (
                <button
                  key={figure.id}
                  type="button"
                  aria-pressed={shown === figure}
                  onClick={() => select(figure)}
                >
                  {t(figure.label)}
                </button>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
