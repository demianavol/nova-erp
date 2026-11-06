import { useRef, useState, type CSSProperties } from "react";
import type { CompanySceneKind } from "../data/company-history";
import { CompanyBrand } from "./company-brand";
import { CompanyScene, SceneTransition } from "./company-scene";

const expertise: { name: string; text: string; scene: CompanySceneKind }[] = [
  {
    name: "Продукт",
    text: "Проверяем идеи на реальном спросе и развиваем то, что нужно покупателям",
    scene: "assortment",
  },
  {
    name: "Контент",
    text: "Находим визуальную подачу, которая помогает увидеть и понять продукт",
    scene: "content",
  },
  {
    name: "Маркетинг",
    text: "Соединяем продукт с его аудиторией и работаем над узнаваемостью бренда",
    scene: "marketing",
  },
  {
    name: "Продажи",
    text: "Работаем с ассортиментом и обратной связью, чтобы развивать собственные направления",
    scene: "feedback",
  },
];

export function TeamStory() {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = expertise[selected];
  return (
    <section
      className="lp-team-editorial lp-container lp-section"
      id="team"
      aria-labelledby="team-title"
    >
      <div className="team-editorial-heading">
        <div>
          <span className="lp-history-eyebrow">ЛЮДИ ЗА БРЕНДАМИ</span>
          <h2 id="team-title">
            Одна команда
            <br />
            <span>на весь путь бренда</span>
          </h2>
        </div>
        <p>
          Соединяем разные экспертизы внутри Young Unicorn — от первой идеи до
          выбора покупателя
        </p>
      </div>
      <div
        className="team-scene-tabs"
        role="tablist"
        aria-label="Экспертиза команды"
        style={{ "--active-index": selected } as CSSProperties}
        onKeyDown={(event) => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? expertise.length - 1
                : (selected +
                    (event.key === "ArrowRight" ? 1 : expertise.length - 1)) %
                  expertise.length;
          setSelected(next);
          buttons.current[next]?.focus({ preventScroll: true });
        }}
      >
        <span className="team-active-indicator" aria-hidden="true" />
        {expertise.map((item, index) => (
          <button
            ref={(element) => {
              buttons.current[index] = element;
            }}
            key={item.name}
            type="button"
            role="tab"
            id={`team-tab-${index}`}
            aria-selected={selected === index}
            aria-controls="team-scene"
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="team-scene-layout">
        <div className="team-editorial-copy">
          <div
            className="team-editorial-note"
            id="team-expertise-note"
            aria-live="polite"
            aria-atomic="true"
          >
            <h3>{current.name}</h3>
            <p>{current.text}</p>
          </div>
          <CompanyBrand />
        </div>
        <div
          className="team-visual-panel"
          id="team-scene"
          role="tabpanel"
          aria-labelledby={`team-tab-${selected}`}
          tabIndex={0}
        >
          <SceneTransition sceneKey={selected}>
            <CompanyScene kind={current.scene} />
          </SceneTransition>
        </div>
      </div>
    </section>
  );
}
