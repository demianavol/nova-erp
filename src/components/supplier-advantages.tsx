import { useState, type CSSProperties } from "react";
import { MoveHorizontal } from "lucide-react";
import { BrandProcessDemo } from "./brand-process-demo";

const stages = [
  {
    title: "Продукт",
    description: "Проверяем спрос и развиваем ассортимент",
    detail:
      "Тестируем идеи на отклике рынка и масштабируем подтверждённые направления",
  },
  {
    title: "Бренд",
    description: "Создаём контент и продвигаем коллекции",
    detail:
      "Объединяем контент, инфлюенсеров и продвижение, чтобы находить аудиторию продукта",
  },
  {
    title: "Продажи",
    description:
      "Работаем на Wildberries и учитываем обратную связь покупателей",
    detail:
      "Анализируем продажи и обратную связь покупателей, чтобы улучшать продукт",
  },
];

export function SupplierAdvantages() {
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const selected = Math.round(position);
  const choose = (index: number) => {
    setPosition(index);
  };
  return (
    <section
      className="lp-brand-process lp-container lp-section"
      id="advantages"
      aria-labelledby="advantages-title"
    >
      <div className="lp-process-copy">
        <h2 id="advantages-title">
          Как развиваем
          <br />
          бренды
        </h2>
        <div className="lp-process-explanations">
          {stages.map((stage, index) => (
            <div
              key={stage.title}
              className={`lp-process-explanation${index === selected ? " is-selected" : ""}`}
              aria-hidden={index !== selected}
            >
              <h3>{stage.title}</h3>
              <p id={`brand-stage-explanation-${index}`}>{stage.detail}</p>
            </div>
          ))}
        </div>
        <div
          className="lp-brand-controls"
          role="group"
          aria-label="Путь бренда"
        >
          <div className="lp-brand-control-heading">
            <span>Выберите этап</span>
            <span>{String(selected + 1).padStart(2, "0")} / 03</span>
          </div>
          <div className={`lp-brand-scrubber${dragging ? " is-dragging" : ""}`}>
            <div
              className="lp-brand-rail"
              aria-hidden="true"
              style={
                { "--stage-progress": `${position * 50}%` } as CSSProperties
              }
            >
              <span className="lp-brand-progress" />
              <span className="lp-brand-thumb">
                <MoveHorizontal size={15} />
              </span>
            </div>
            <input
              className="lp-brand-range"
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={position}
              aria-label="Этап развития бренда"
              aria-valuetext={`${selected + 1} из 3 — ${stages[selected].title}`}
              aria-describedby={`brand-stage-explanation-${selected}`}
              onChange={(event) => {
                setPosition(Number(event.target.value));
              }}
              onPointerDown={() => {
                setDragging(true);
              }}
              onPointerUp={() => {
                setDragging(false);
                setPosition(Math.round(position));
              }}
              onPointerCancel={() => {
                setDragging(false);
                setPosition(Math.round(position));
              }}
              onBlur={() => {
                setDragging(false);
                setPosition(Math.round(position));
              }}
              onKeyDown={(event) => {
                if (
                  ["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(
                    event.key,
                  )
                ) {
                  event.preventDefault();
                  choose(
                    Math.min(
                      2,
                      Math.max(
                        0,
                        selected +
                          (["ArrowLeft", "ArrowDown"].includes(event.key)
                            ? -1
                            : 1),
                      ),
                    ),
                  );
                }
              }}
            />
          </div>
          <ol
            className="lp-brand-stages"
            aria-label="От продукта до покупателя"
          >
            {stages.map((stage, index) => (
              <li
                key={stage.title}
                className={index === selected ? "is-selected" : ""}
              >
                <h3>
                  <button
                    type="button"
                    aria-current={index === selected ? "step" : undefined}
                    onClick={() => choose(index)}
                  >
                    {stage.title}
                  </button>
                </h3>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <BrandProcessDemo selected={selected} />
    </section>
  );
}
