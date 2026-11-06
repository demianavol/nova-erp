import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  experienceCountries,
  type ExperienceCountryId,
} from "../data/global-experience";
import { GlobalExperienceFilm } from "./global-experience-film";
import { GlobalExperienceAtmosphere } from "./global-experience-atmosphere";
import { ExperienceTypewriter } from "./experience-typewriter";
import "../global-experience.css";

export function GlobalExperience() {
  const root = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState<ExperienceCountryId | null>(null);
  const [revealed, setRevealed] = useState(false);
  const panelId = useId();
  const country = experienceCountries.find((item) => item.id === selected);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }
    const entrance = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          entrance.disconnect();
        }
      },
      { threshold: 0.16 },
    );
    entrance.observe(element);
    return () => {
      entrance.disconnect();
    };
  }, []);

  function navigateCountries(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % 3;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index + 2) % 3;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 2;
    if (event.key === "Escape") {
      setSelected(null);
      return;
    }
    if (next === undefined) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    setSelected(experienceCountries[next].id);
  }

  return (
    <section
      ref={root}
      id="global-experience"
      className={`global-experience${revealed ? " is-revealed" : ""}`}
      aria-labelledby="global-experience-title"
      data-country={selected ?? "all"}
    >
      <GlobalExperienceAtmosphere section={root} />
      <div className="ge-layout lp-container">
        <div className="ge-copy">
          <p className="ge-eyebrow">
            <span aria-hidden="true" />
            YUC / GLOBAL EXPERIENCE
          </p>
          <h2 id="global-experience-title">
            Опыт без <span className="ge-title-accent">границ</span>
          </h2>
          <p className="ge-lead">
            Международное сотрудничество
            <br />и развитие брендов вместе.
          </p>
        </div>

        <div className="ge-stage">
          <GlobalExperienceFilm selected={selected} />
        </div>

        <div className="ge-interaction">
          <div
            className="ge-selectors"
            role="group"
            aria-label="Выбрать страну"
          >
            {experienceCountries.map((item, index) => (
              <button
                key={item.id}
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                type="button"
                aria-pressed={selected === item.id}
                aria-controls={panelId}
                className="ge-country"
                onPointerMove={(event) => {
                  if (event.pointerType !== "mouse") return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.setProperty(
                    "--pointer-x",
                    `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
                  );
                }}
                onClick={() =>
                  setSelected((current) =>
                    current === item.id ? null : item.id,
                  )
                }
                onKeyDown={(event) => navigateCountries(event, index)}
              >
                <span className="ge-country-dot" aria-hidden="true" />
                {item.name}
              </button>
            ))}
          </div>
          <div
            id={panelId}
            className={`ge-panel${country ? " is-open" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {country && (
              <div key={country.id} className="ge-panel-content">
                <div className="ge-panel-heading">
                  <h3>{country.name}</h3>
                  <span>{country.status}</span>
                </div>
                <p>
                  <ExperienceTypewriter
                    text={country.description}
                    pace={14}
                    delay={80}
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
