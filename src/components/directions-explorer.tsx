import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { company } from "../data/company";
import { useExplorerRoute } from "./brand-explorer-route";
import { useNearViewport } from "./use-near-viewport";
import "../directions-explorer.css";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const BrandExplorerModal = lazy(() =>
  import("./brand-explorer-modal").then((m) => ({
    default: m.BrandExplorerModal,
  })),
);

const directionHints: Record<string, string> = {
  fashion: "Коллекция Enmoone · 18 моделей в каталоге",
  selfcare: "Ежедневный уход · Запуск новой категории",
  oralcare: "Продукты ухода · Открыты к сотрудничеству",
};

export function DirectionsExplorer() {
  const { position, go, close, open } = useExplorerRoute();
  const section = useRef<HTMLElement>(null);
  const near = useNearViewport(section);
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  return (
    <>
      <section
        ref={section}
        className="directions-explorer lp-directions lp-container"
        id="directions"
        aria-labelledby="directions-title"
      >
        <header className="explorer-heading">
          <h2 className="lp-block-title" id="directions-title">
            Наши направления
          </h2>
          <span>От направления — к продукту</span>
        </header>
        <div className="explorer-viewport">
          <div className="explorer-scene explorer-scene-directions">
            <div className="explorer-directions-grid">
              {company.directions.map((item, index) => (
                <button
                  key={item.id}
                  className={`explorer-direction${item.id !== "fashion" ? " is-development" : ""}`}
                  type="button"
                  aria-label={`Исследовать направление: ${item.title}`}
                  data-direction={item.id}
                  aria-haspopup="dialog"
                  onClick={() => go({ directionId: item.id })}
                >
                  <span className="explorer-direction-visual">
                    <img
                      src={near ? asset(item.image) : undefined}
                      alt={item.alt}
                      width="1536"
                      height="1024"
                      decoding="async"
                    />
                  </span>
                  <span className="explorer-direction-index">
                    0{index + 1} / НАПРАВЛЕНИЕ
                  </span>
                  {item.id !== "fashion" && (
                    <span className="explorer-development">
                      <FlaskConical size={13} aria-hidden="true" />В разработке
                    </span>
                  )}
                  <span className="explorer-direction-copy">
                    <strong>{item.title}</strong>
                    <span className="explorer-direction-hint">
                      {directionHints[item.id]}
                    </span>
                    <span className="explorer-direction-action">
                      <span>
                        {item.id === "fashion"
                          ? "Смотреть бренды"
                          : "О направлении"}
                      </span>
                      <span
                        className="explorer-direction-arrow"
                        aria-hidden="true"
                      >
                        <ArrowUpRight size={17} />
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {(open || hasOpened) && (
        <Suspense fallback={null}>
          <BrandExplorerModal
            position={position}
            open={open}
            go={go}
            close={close}
          />
        </Suspense>
      )}
    </>
  );
}
