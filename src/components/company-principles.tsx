import { useSiteLanguage } from "../lib/site-language";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  companyPrinciplesData,
  type CompanyPrinciple,
} from "../data/company-principles";
import "../company-principles.css";

const asset = (name: string) => `${import.meta.env.BASE_URL}media/${name}`;

function PrincipleIcon({ principle }: { principle: CompanyPrinciple }) {
  return (
    <picture className="cp-card-icon-frame">
      <source
        srcSet={asset(`principles-icons/${principle.iconWebp}`)}
        type="image/webp"
      />
      <source
        srcSet={asset(`principles-icons/${principle.icon600}`)}
        type="image/png"
      />
      <img
        src={asset(`principles-icons/${principle.icon}`)}
        alt=""
        className="cp-card-icon-img"
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

function PrincipleAction({ principle }: { principle: CompanyPrinciple }) {
  return (
    <>
      {principle.id === "experiment" && (
        <span className="cp-card-filament cp-card-mask" />
      )}
      {principle.id === "data-driven" && (
        <>
          <span className="cp-card-dart">
            <PrincipleIcon principle={principle} />
          </span>
          <span className="cp-card-impact" />
        </>
      )}
      {principle.id === "growth" && (
        <span className="cp-card-exhaust">
          <PrincipleIcon principle={principle} />
        </span>
      )}
      {principle.id === "teamwork" && (
        <>
          <span className="cp-card-hand cp-card-hand-left">
            <PrincipleIcon principle={principle} />
          </span>
          <span className="cp-card-hand cp-card-hand-right">
            <PrincipleIcon principle={principle} />
          </span>
        </>
      )}
      {principle.id === "value" && (
        <span className="cp-card-heart-light cp-card-mask" />
      )}
      {principle.id === "responsibility" && (
        <span className="cp-card-check-inlay">
          <PrincipleIcon principle={principle} />
        </span>
      )}
      <span className="cp-card-optics cp-card-mask" />
    </>
  );
}

function PrincipleCard({
  principle,
  expanded,
  onToggle,
}: {
  principle: CompanyPrinciple;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useSiteLanguage();
  const cardId = useId();
  const titleId = `${cardId}-title`;
  const detailId = `${cardId}-details`;
  const iconMask = new URL(
    asset(`principles-icons/${principle.iconWebp}`),
    document.baseURI,
  ).href;

  return (
    <article
      id={`cp-card-${principle.id}`}
      data-principle={principle.id}
      className={`cp-card${expanded ? " is-expanded" : ""}`}
    >
      <button
        className="cp-card-button"
        type="button"
        aria-labelledby={titleId}
        aria-controls={detailId}
        aria-expanded={expanded}
        onClick={onToggle}
      />
      <div className="cp-card-sheen" aria-hidden="true" />
      <svg
        className="cp-card-toggle"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m4 6 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="cp-card-icon-area" aria-hidden="true">
        <div className="cp-card-icon-glow" />
        <div
          className="cp-card-icon-object"
          style={
            {
              "--cp-icon-mask": `url("${iconMask}")`,
            } as CSSProperties
          }
        >
          <PrincipleIcon principle={principle} />
          <PrincipleAction principle={principle} />
        </div>
      </div>

      <div className="cp-card-copy">
        <div className="cp-card-heading">
          <span className="cp-card-number">{principle.number}</span>
          <h3 className="cp-card-title" id={titleId}>
            {t(principle.title)}
          </h3>
        </div>
        <div id={detailId} className="cp-card-drawer" aria-hidden={!expanded}>
          <div className="cp-card-drawer-copy">
            <p className="cp-card-description">{t(principle.description)}</p>
            <span className="cp-card-slide">{t(principle.welcomeSlide)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CompanyPrinciples() {
  const { t } = useSiteLanguage();
  const { eyebrow, headline, description, principles } = companyPrinciplesData;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expandedId) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedId(null);
      }
    };

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node)
      ) {
        setExpandedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [expandedId]);

  return (
    <section
      ref={sectionRef}
      className="company-principles lp-container lp-section"
      id="principles"
      aria-labelledby="principles-title"
    >
      <div className="cp-layout">
        <div className="cp-editorial-header">
          <span className="cp-eyebrow">
            <span className="cp-eyebrow-dash" aria-hidden="true">
              —
            </span>{" "}
            {t(eyebrow)}
          </span>
          <h2 id="principles-title" className="cp-headline">
            {t(headline)}
          </h2>
          <p className="cp-lead">{t(description)}</p>
        </div>

        {/* Right Column: 3 Columns x 2 Rows Glassmorphism Cards Grid */}
        <div
          className="cp-grid"
          role="region"
          aria-label={t("Карточки принципов и ценностей")}
        >
          {principles.map((principle) => (
            <PrincipleCard
              key={principle.id}
              principle={principle}
              expanded={expandedId === principle.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === principle.id ? null : principle.id,
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
