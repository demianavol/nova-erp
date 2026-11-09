import { useSiteLanguage } from "../lib/site-language";
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
  selfcare: "Уход за собой и полостью рта",
};

export function DirectionsExplorer() {
  const { t } = useSiteLanguage();
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
            {t("Наши направления")}
          </h2>
          <span>{t("От направления — к продукту")}</span>
        </header>
        <div className="explorer-viewport">
          <div className="explorer-scene explorer-scene-directions">
            <div className="explorer-directions-grid">
              {company.directions.map((item, index) => (
                <button
                  key={item.id}
                  className={`explorer-direction${item.id !== "fashion" ? " is-development" : ""}`}
                  type="button"
                  aria-label={t("Исследовать направление: {0}", t(item.title))}
                  data-direction={item.id}
                  aria-haspopup="dialog"
                  onClick={() => go({ directionId: item.id })}
                >
                  <span className="explorer-direction-visual">
                    <img
                      src={near ? asset(item.image) : undefined}
                      alt={t(item.alt)}
                      width="1536"
                      height="1024"
                      decoding="async"
                    />
                  </span>
                  <span className="explorer-direction-index">
                    0{index + 1} {t("/ НАПРАВЛЕНИЕ")}
                  </span>
                  {item.id !== "fashion" && (
                    <span className="explorer-development">
                      <FlaskConical size={13} aria-hidden="true" />
                      {t(item.status)}
                    </span>
                  )}
                  <span className="explorer-direction-copy">
                    <strong>{t(item.title)}</strong>
                    <span className="explorer-direction-hint">
                      {t(directionHints[item.id])}
                    </span>
                    <span className="explorer-direction-action">
                      <span>
                        {item.id === "fashion"
                          ? t("Смотреть бренды")
                          : t("О направлении")}
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
