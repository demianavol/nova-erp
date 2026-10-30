import {
  ArrowDown,
  ArrowRight,
  Check,
  Image,
  MessageCircle,
  Package,
  TrendingUp,
} from "lucide-react";
import { fashionProducts } from "../data/fashion-catalog";
import { useId, useLayoutEffect, useRef, useState } from "react";

const photo = (index: number) =>
  `${import.meta.env.BASE_URL}brand/${fashionProducts[index].image}`;
const labels = [
  "Сначала — продукт",
  "Затем — узнаваемый бренд",
  "Дальше — отклик покупателей",
];

export function BrandProcessDemo({ selected }: { selected: number }) {
  const arrowId = `process-arrow-${useId().replace(/:/g, "")}`;
  const figure = useRef<HTMLElement>(null);
  const topLabel = useRef<HTMLDivElement>(null);
  const bottomLabel = useRef<HTMLDivElement>(null);
  const [leaders, setLeaders] = useState({
    width: 600,
    height: 450,
    top: "",
    bottom: "",
  });
  useLayoutEffect(() => {
    const root = figure.current,
      top = topLabel.current,
      bottom = bottomLabel.current;
    const pane = root?.querySelector<HTMLElement>(".lp-demo-glass-front");
    if (!root || !top || !bottom || !pane) return;
    let frame = 0;
    const measure = () => {
      const box = root.getBoundingClientRect(),
        first = top.getBoundingClientRect(),
        last = bottom.getBoundingClientRect();
      const x1 = first.right - box.left + 6,
        y1 = first.top - box.top + first.height / 2;
      const tx = pane.offsetLeft + pane.offsetWidth * 0.12,
        ty = pane.offsetTop + 8;
      const x2 = last.left - box.left - 7,
        y2 = last.top - box.top + last.height / 2;
      const bx = pane.offsetLeft + pane.offsetWidth * 0.78,
        by = pane.offsetTop + pane.offsetHeight - 8;
      const next = {
        width: box.width,
        height: box.height,
        top: `M${x1} ${y1}Q${x1 + 28} ${ty - 35} ${tx} ${ty}`,
        bottom: `M${x2} ${y2}Q${x2 - 28} ${by + 35} ${bx} ${by}`,
      };
      setLeaders((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    [root, top, bottom, pane].forEach((element) => observer.observe(element));
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [selected]);
  return (
    <figure
      ref={figure}
      className={`lp-process-demo lp-process-demo-${selected}`}
      aria-label={labels[selected]}
    >
      <div className="lp-demo-backplate" aria-hidden="true" />
      <div key={selected} className="lp-demo-scene is-selected">
        <div className="lp-demo-glass lp-demo-glass-front">
          <div className="lp-demo-pane-heading">
            <span>Enmoone</span>
            <span>
              {selected === 0 ? (
                <Package size={18} />
              ) : selected === 1 ? (
                <Image size={18} />
              ) : (
                <TrendingUp size={18} />
              )}
            </span>
          </div>
          {selected === 0 ? (
            <div className="lp-demo-product">
              <img
                src={photo(0)}
                width="150"
                height="195"
                alt="Рубашка Enmoone из каталога бренда"
                loading="lazy"
              />
              <div>
                <span>Женская одежда</span>
                <strong>
                  От идеи
                  <br />к продукту
                </strong>
                <div className="lp-demo-product-note">
                  <Check size={15} /> Работа со спросом
                </div>
              </div>
            </div>
          ) : selected === 1 ? (
            <>
              <div className="lp-demo-photo-strip">
                {[1, 2, 4].map((item) => (
                  <img
                    key={item}
                    src={photo(item)}
                    width="100"
                    height="130"
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="lp-demo-tags">
                <span>Контент</span>
                <span>Продвижение</span>
                <span>Аудитория</span>
              </div>
            </>
          ) : (
            <div className="lp-demo-feedback">
              <div>
                <Package size={21} />
                <span>Продукт</span>
                <ArrowRight size={16} />
              </div>
              <div>
                <TrendingUp size={21} />
                <span>Продажи на Wildberries</span>
                <ArrowDown size={16} />
              </div>
              <div>
                <MessageCircle size={21} />
                <span>Обратная связь покупателей</span>
                <Check size={16} />
              </div>
            </div>
          )}
        </div>
      </div>
      <svg
        className="lp-demo-leaders"
        viewBox={`0 0 ${leaders.width} ${leaders.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={arrowId}
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="m1 1 5 2.5L1 6" />
          </marker>
        </defs>
        <path d={leaders.top} markerEnd={`url(#${arrowId})`} />
        <path d={leaders.bottom} markerEnd={`url(#${arrowId})`} />
      </svg>
      <div ref={topLabel} className="lp-demo-annotation lp-demo-annotation-top">
        <span key={selected}>
          {
            ["Проверяем идею", "Показываем продукт", "Собираем отклик"][
              selected
            ]
          }
        </span>
      </div>
      <div
        ref={bottomLabel}
        className="lp-demo-annotation lp-demo-annotation-bottom"
      >
        <span key={selected}>
          {
            [
              "Развиваем ассортимент",
              "Находим свою аудиторию",
              "Улучшаем следующий продукт",
            ][selected]
          }
        </span>
      </div>
      <figcaption>Схема работы с продуктом</figcaption>
    </figure>
  );
}
