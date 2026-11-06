import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { RatingEvidence } from "./company-scene";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const steps = [
  {
    title: "Работаем над продуктом",
    text: "Изучаем спрос, выбираем модели и развиваем ассортимент вместе с производителями",
    result: "Ассортимент и план развития",
    caption: "Начинаем с того, что нужно покупателю",
  },
  {
    title: "Создаём бренд и контент",
    text: "Продумываем подачу коллекции, создаём визуальные материалы и продвигаем продукты",
    result: "Витрина и продвижение бренда",
    caption: "Делаем продукт узнаваемым",
  },
  {
    title: "Развиваем продажи",
    text: "Работаем на Wildberries, анализируем продажи и учитываем обратную связь покупателей",
    result: "Данные для следующей коллекции",
    caption: "Слушаем покупателей и развиваем продукт",
  },
];

export function SupplierAdvantages() {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = steps[selected];
  return (
    <section
      className="lp-partner-story lp-container lp-section"
      id="advantages"
      aria-labelledby="advantages-title"
    >
      <div className="partner-story-heading">
        <span className="lp-history-eyebrow">НАША РОЛЬ В ПАРТНЁРСТВЕ</span>
        <h2 id="advantages-title">
          От производства —<br />
          <span>к покупателю</span>
        </h2>
        <p>
          Объединяем продукт, контент и продажи
          <br />С производителями обсуждаем продукты для наших брендов
        </p>
      </div>
      <div className="partner-story-layout">
        <div className="partner-story-controls">
          <div
            className="partner-story-steps"
            role="tablist"
            aria-label="Работа команды с брендом"
            aria-orientation="vertical"
            onKeyDown={(event) => {
              if (event.ctrlKey || event.metaKey || event.altKey) return;
              const keys = [
                "ArrowDown",
                "ArrowRight",
                "ArrowUp",
                "ArrowLeft",
                "Home",
                "End",
              ];
              if (!keys.includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? steps.length - 1
                    : (selected +
                        (["ArrowDown", "ArrowRight"].includes(event.key)
                          ? 1
                          : steps.length - 1)) %
                      steps.length;
              setSelected(next);
              buttons.current[next]?.focus({ preventScroll: true });
            }}
          >
            {steps.map((step, index) => (
              <button
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                key={step.title}
                type="button"
                role="tab"
                id={`partner-step-${index}`}
                aria-selected={selected === index}
                aria-label={`0${index + 1} ${step.title}`}
                aria-describedby={
                  selected === index
                    ? `partner-step-description-${index}`
                    : undefined
                }
                aria-controls="partner-story-panel"
                tabIndex={selected === index ? 0 : -1}
                onClick={() => setSelected(index)}
              >
                <span className="partner-step-number">0{index + 1}</span>
                <span className="partner-step-copy">
                  <strong>{step.title}</strong>
                  {selected === index && (
                    <span id={`partner-step-description-${index}`}>
                      {step.text}
                    </span>
                  )}
                </span>
                <ArrowUpRight size={22} aria-hidden="true" />
              </button>
            ))}
          </div>
          <Link to="/#partners" className="partner-story-link">
            Обсудить сотрудничество <ArrowUpRight size={18} />
          </Link>
        </div>
        <div
          id="partner-story-panel"
          className={`partner-story-panel partner-story-panel-${selected}`}
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`partner-step-${selected}`}
        >
          <div className="partner-scene" key={selected}>
            <span className="partner-scene-index">
              ENMOONE / 0{selected + 1}
            </span>
            {selected === 0 ? (
              <div className="partner-assortment">
                <img
                  src={asset("products/shirt-burgundy-stripe.webp")}
                  width="300"
                  height="390"
                  alt="Рубашка Enmoone в полоску"
                  loading="lazy"
                />
                <img
                  src={asset("products/blouse-slim-sand.webp")}
                  width="300"
                  height="390"
                  alt="Белая блузка из каталога Enmoone"
                  loading="lazy"
                />
                <span>Продукт</span>
              </div>
            ) : selected === 1 ? (
              <div className="partner-content">
                <span>Enmoone</span>
                <img
                  src={asset("products/blouse-white-fitted.webp")}
                  width="300"
                  height="390"
                  alt="Образ с белой блузкой Enmoone"
                  loading="lazy"
                />
                <img
                  src={asset("products/shirt-burgundy-stripe.webp")}
                  width="300"
                  height="390"
                  alt="Деталь рубашки Enmoone"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="partner-feedback">
                <img
                  src={asset("products/shirt-burgundy-stripe.webp")}
                  width="300"
                  height="390"
                  alt="Рубашка Enmoone в полоску на Wildberries"
                  loading="lazy"
                />
                <RatingEvidence />
              </div>
            )}
            <div className="partner-scene-result">
              <span>{current.caption}</span>
              <strong>
                <ArrowRight size={16} aria-hidden="true" />
                {current.result}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
