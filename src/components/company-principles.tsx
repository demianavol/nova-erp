import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  companyPrinciplesData,
  type CompanyPrinciple,
} from "../data/company-principles";
import "../company-principles.css";
import { PrinciplesSculpture } from "./principles-sculpture";

const asset = (name: string) => `${import.meta.env.BASE_URL}media/${name}`;

function PrincipleCard({
  principle,
  isPinned,
  onTogglePin,
  onDismissPin,
}: {
  principle: CompanyPrinciple;
  isPinned: boolean;
  onTogglePin: () => void;
  onDismissPin: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardId = useId();

  const isExpanded = isPinned || isHovered || isFocused;

  const handlePointerEnter = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") {
        setIsHovered(true);
      }
    },
    [],
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onTogglePin();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsHovered(false);
        setIsFocused(false);
        onDismissPin();
      }
    },
    [onTogglePin, onDismissPin],
  );

  return (
    <div
      id={`cp-card-${principle.id}`}
      className={`cp-card${isExpanded ? " is-expanded" : ""}${isPinned ? " is-pinned" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-controls={`cp-desc-${cardId}`}
      aria-label={`${principle.number} ${principle.title}: ${principle.description}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onTogglePin}
      onKeyDown={handleKeyDown}
      onFocus={(event) =>
        setIsFocused(event.currentTarget.matches(":focus-visible"))
      }
      onBlur={() => setIsFocused(false)}
    >
      {/* A steady highlight keeps the hover target and text still. */}
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
      {isPinned && <span className="cp-card-pin-tag">Закреплено</span>}

      {/* Icon and ambient glow container */}
      <div className="cp-card-icon-area">
        <div className="cp-card-icon-glow" aria-hidden="true" />
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
            aria-hidden="true"
            className="cp-card-icon-img"
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>

      {/* Title & Index */}
      <div className="cp-card-heading">
        <span className="cp-card-number">{principle.number}</span>
        <h3 className="cp-card-title">{principle.title}</h3>
      </div>

      {/* Composited reveal keeps the grid stable throughout the transition. */}
      <div
        id={`cp-desc-${cardId}`}
        className="cp-card-drawer"
        aria-hidden={!isExpanded}
      >
        <div className="cp-card-drawer-inner">
          <div className="cp-card-details">
            <p className="cp-card-description">{principle.description}</p>
            <div className="cp-card-meta">
              <span className="cp-card-slide">{principle.welcomeSlide}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyPrinciples() {
  const { eyebrow, headline, description, sculptureAlt, principles } =
    companyPrinciplesData;

  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);

  // Dismiss pinned card on Escape or outside pointerdown
  useEffect(() => {
    if (!pinnedId) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinnedId(null);
      }
    };

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node)
      ) {
        setPinnedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [pinnedId]);

  return (
    <section
      ref={sectionRef}
      className="company-principles lp-container lp-section"
      id="principles"
      aria-labelledby="principles-title"
    >
      <div className="cp-layout">
        {/* Left Column: Editorial Introduction & Branded Glass Sculpture */}
        <div className="cp-editorial">
          <div className="cp-editorial-header">
            <span className="cp-eyebrow">
              <span className="cp-eyebrow-dash" aria-hidden="true">
                —
              </span>{" "}
              {eyebrow}
            </span>
            <h2 id="principles-title" className="cp-headline">
              {headline}
            </h2>
            <p className="cp-lead">{description}</p>
          </div>

          <PrinciplesSculpture alt={sculptureAlt} />
        </div>

        {/* Right Column: 3 Columns x 2 Rows Glassmorphism Cards Grid */}
        <div
          className="cp-grid"
          role="region"
          aria-label="Карточки принципов и ценностей"
        >
          {principles.map((principle) => (
            <PrincipleCard
              key={principle.id}
              principle={principle}
              isPinned={pinnedId === principle.id}
              onTogglePin={() =>
                setPinnedId((current) =>
                  current === principle.id ? null : principle.id,
                )
              }
              onDismissPin={() => setPinnedId(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
