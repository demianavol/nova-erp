import { useId, useState, type FocusEvent, type PointerEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  GrowingChartIcon,
  AnimatedHistoryIcon,
  DirectionsGridIcon,
  ExpandingLayersIcon,
} from "./hero-navigation-icons";
import { QuietTypewriter } from "./quiet-typewriter";

const navigation = [
  {
    name: "Результаты",
    Icon: GrowingChartIcon,
    text: "Цифры и достижения компании",
    destination: "results",
  },
  {
    name: "Направления",
    Icon: DirectionsGridIcon,
    text: "От одежды до новых категорий продуктов",
    destination: "directions",
  },
  {
    name: "Наш путь",
    Icon: AnimatedHistoryIcon,
    text: "История Young Unicorn с 2020 года",
    destination: "about",
  },
  {
    name: "Принципы",
    Icon: ExpandingLayersIcon,
    text: "Наши принципы и ценности",
    destination: "principles",
  },
  {
    name: "Опыт без границ",
    Icon: ArrowUpRight,
    text: "Международное сотрудничество и развитие брендов",
    destination: "global-experience",
  },
  {
    name: "Будущее",
    Icon: ArrowUpRight,
    text: "Цели, новые бренды и направления роста",
    destination: "future",
  },
  {
    name: "Команда",
    Icon: ArrowUpRight,
    text: "Возможности и карьера в Young Unicorn",
    destination: "careers",
  },
  {
    name: "Контакты",
    Icon: ArrowUpRight,
    text: "Сотрудничество с Young Unicorn",
    destination: "contacts",
  },
];

export function HeroExpertise() {
  const descriptionId = useId();
  const location = useLocation();
  const [fallback, setFallback] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const active = preview ?? focused ?? fallback;

  return (
    <div
      className="hero-expertise"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setFallback(null);
          setPreview(null);
          setFocused(null);
        }
      }}
    >
      <nav
        className="hero-expertise-icons"
        data-secondary-count={navigation.length - 4}
        aria-label="Разделы компании"
        onPointerLeave={() => setPreview(null)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(null);
        }}
      >
        {navigation.map((item, index) => {
          const { name, Icon, destination } = item;
          const secondary = index >= 4;
          const content = (
            <>
              <span className="hero-navigation-index" aria-hidden="true">
                0{index + 1}
              </span>
              <Icon
                className={
                  secondary ? "hero-secondary-arrow" : "hero-navigation-icon"
                }
                size={secondary ? 12 : 26}
                strokeWidth={secondary ? 1.25 : 1.4}
                aria-hidden="true"
              />
              <span>{name}</span>
            </>
          );
          const shared = {
            className: `hero-navigation-item ${secondary ? "hero-secondary-link" : "hero-expertise-card"}${active === index ? " is-active" : ""}`,
            "aria-controls": descriptionId,
            "data-destination": destination,
            onPointerEnter: (event: PointerEvent<HTMLElement>) => {
              if (
                event.pointerType === "mouse" &&
                matchMedia("(hover: hover) and (pointer: fine)").matches
              )
                setPreview(index);
            },
            onFocus: (event: FocusEvent<HTMLElement>) => {
              setFocused(
                event.currentTarget.matches(":focus-visible") ? index : null,
              );
            },
          };
          return (
            <Link
              key={name}
              to={`/#${destination}`}
              {...shared}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                const target = document.getElementById(destination);
                if (!target) {
                  event.preventDefault();
                  setFallback(index);
                  return;
                }
                setFallback(null);
                setPreview(null);
                setFocused(null);
                // Repeated activation still scrolls when the router hash is unchanged.
                if (location.hash === `#${destination}`) {
                  event.preventDefault();
                  target.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                  });
                }
                const heading =
                  target.querySelector<HTMLElement>("h2") ?? target;
                if (!heading.hasAttribute("tabindex")) {
                  heading.setAttribute("tabindex", "-1");
                  heading.addEventListener(
                    "blur",
                    () => heading.removeAttribute("tabindex"),
                    { once: true },
                  );
                }
                heading.focus({ preventScroll: true });
              }}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <div
        id={descriptionId}
        className="hero-expertise-description"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* All copy participates in sizing, including the initial empty state. */}
        {navigation.map(({ name, text }) => (
          <span
            className="hero-expertise-measure"
            aria-hidden="true"
            key={name}
          >
            {text}
          </span>
        ))}
        {active !== null && (
          <span className="hero-expertise-text" key={active}>
            <QuietTypewriter text={navigation[active].text} />
          </span>
        )}
      </div>
    </div>
  );
}
