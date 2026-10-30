import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Plus, Star, Heart } from "lucide-react";
import { CompanyBrand } from "../components/company-brand";
import { useSiteTheme } from "../components/site-theme";
import { PublicHeader } from "../components/public-header";
import { FashionShowcaseModal } from "../components/fashion-showcase-modal";
import { HeroFilm } from "../components/hero-film";
import { CompanyMetric } from "../components/company-metric";
import { SupplierAdvantages } from "../components/supplier-advantages";
import { TeamNetwork } from "../components/team-network";
import { ContactRequestModal } from "../components/contact-request-modal";
import {
  getProductEvidence,
  marketplaceSnapshot,
  ratingLabel,
  ratingsLabel,
} from "../data/product-evidence";
import { company } from "../data/company";
import "../landing.css";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const questions = [
  [
    "Что прислать о производстве?",
    "Каталог, специализацию, минимальную партию и сроки\nАлина свяжет вас с командой продукта для обсуждения сотрудничества",
  ],
  [
    "Какие направления развивает компания?",
    "Развиваем собственный бренд одежды на маркетплейсах и запускаем self-care\nOral care — новое направление ухода за полостью рта",
  ],
  [
    "Как вы развиваете бренды?",
    "Объединяем продукт, контент, маркетинг и продажи в одной команде\nВ welcome-презентации указаны более 1000 часов экспертного контента и регулярные мероприятия",
  ],
] as const;

type Direction = (typeof company.directions)[number];
function DirectionVideo({
  direction,
  playing,
}: {
  direction: Direction;
  playing: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = false;
    const update = () => {
      if (visible && playing && !document.hidden) {
        element.muted = true;
        void element.play().catch(() => setReady(false));
      } else element.pause();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        update();
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      element.pause();
    };
  }, [playing]);
  return (
    <video
      ref={video}
      className={ready ? "is-ready" : ""}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setReady(true)}
      onError={() => setReady(false)}
    >
      <source src={asset(`${direction.id}-loop.mp4`)} type="video/mp4" />
    </video>
  );
}
function useRevealOnce<T extends HTMLElement>() {
  const root = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = () => {
      if (media.matches) setRevealed(true);
    };
    show();
    media.addEventListener("change", show);
    if (!("IntersectionObserver" in window)) {
      setRevealed(true);
      return () => media.removeEventListener("change", show);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", show);
    };
  }, []);
  return { root, revealed };
}
function DirectionPhoto({
  direction,
  index,
  playing,
  onOpenShowcase,
}: {
  direction: Direction;
  index: number;
  playing: boolean;
  onOpenShowcase?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const details = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const measure = () =>
      root.current?.style.setProperty(
        "--detail-height",
        `${details.current?.offsetHeight || 0}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    if (details.current) observer.observe(details.current);
    return () => observer.disconnect();
  }, []);
  const open = !dismissed && (hovered || keyboard || pinned);
  const toggle = () => {
    if (pinned) {
      setPinned(false);
      setKeyboard(false);
      setDismissed(true);
    } else {
      setPinned(true);
      setDismissed(false);
    }
  };
  useEffect(() => {
    if (!open) return;
    const close = (restoreFocus: boolean) => {
      if (restoreFocus && root.current?.contains(document.activeElement))
        trigger.current?.focus({ preventScroll: true });
      setHovered(false);
      setKeyboard(false);
      setPinned(false);
      setDismissed(true);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        close(false);
    };
    window.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <article
      ref={root}
      className={`lp-direction-photo lp-direction-photo-${direction.id}${open ? " is-open" : ""}`}
      aria-labelledby={`direction-title-${direction.id}`}
      onPointerEnter={(event) => {
        if (
          event.pointerType === "mouse" &&
          window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
          setHovered(true);
          setDismissed(false);
        }
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.matches(":focus-visible")
        ) {
          setKeyboard(true);
          setDismissed(false);
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setKeyboard(false);
          setPinned(false);
        }
      }}
    >
      <img
        src={asset(direction.image)}
        width="1536"
        height="1024"
        alt={direction.alt}
        fetchPriority="high"
      />
      {direction.id !== "oralcare" && (
        <DirectionVideo direction={direction} playing={playing} />
      )}
      <div className="lp-direction-shade" aria-hidden="true" />
      <span className="lp-photo-label">
        0{index + 1} / {direction.english.toUpperCase()}
      </span>
      <button
        ref={trigger}
        className="lp-direction-trigger"
        type="button"
        aria-expanded={open}
        aria-controls={`direction-details-${direction.id}`}
        aria-label={
          direction.id === "fashion"
            ? "Открыть подборку товаров Enmoone (Одежда)"
            : `Подробности направления: ${direction.title}`
        }
        onClick={(event) => {
          if (
            event.detail > 0 &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches
          ) {
            if (direction.id === "fashion" && onOpenShowcase) {
              onOpenShowcase();
              return;
            }
            return;
          }
          if (direction.id === "fashion" && onOpenShowcase) {
            onOpenShowcase();
            return;
          }
          toggle();
        }}
      />
      <div className="lp-direction-content">
        <div className="lp-direction-heading">
          <h3 id={`direction-title-${direction.id}`}>{direction.title}</h3>
        </div>
        <div
          ref={details}
          id={`direction-details-${direction.id}`}
          className="lp-direction-details"
          aria-hidden={!open}
          inert={!open}
        >
          <div>
            <span className="lp-direction-status">{direction.status}</span>
            <div className="lp-direction-actions">
              {direction.id === "fashion" && onOpenShowcase && (
                <button
                  type="button"
                  className="lp-showcase-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenShowcase();
                  }}
                >
                  Товары Enmoone <ArrowUpRight size={16} />
                </button>
              )}
              {direction.id !== "fashion" && (
                <a
                  href={company.partnerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Обсудить направление <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function FoundingYear() {
  const { root, revealed } = useRevealOnce<HTMLDivElement>();
  const [replay, setReplay] = useState(0);
  const replayYear = () => setReplay((current) => current + 1);
  return (
    <div
      ref={root}
      className={`lp-company-year${revealed ? " is-revealed" : ""}`}
    >
      <span className="lp-kicker">НА РЫНКЕ С</span>
      <div className="lp-year-control">
        <button
          type="button"
          className="lp-year-number lp-year-button"
          aria-label="Повторить анимацию года основания — 2020"
          onClick={replayYear}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") replayYear();
          }}
        >
          <span
            className="lp-year-reels"
            key={replay}
            data-replay={replay}
            aria-hidden="true"
          >
            {[...company.since].map((digit, index) => (
              <span
                key={index}
                className="lp-year-cell"
                aria-hidden="true"
                style={{ "--digit-delay": `${index * 60}ms` } as CSSProperties}
              >
                <span className="lp-year-reel">
                  <span>{digit}</span>
                  <span>{digit}</span>
                </span>
              </span>
            ))}
          </span>
          <ArrowUpRight className="lp-year-arrow" aria-hidden="true" />
        </button>
        <span className="lp-year-hint" aria-hidden="true">
          Наведите или нажмите на год
        </span>
      </div>
      <div className="lp-year-baseline">
        <span>YOUNG UNICORN</span>
        <span>ПРОДУКТ × МАРКЕТИНГ × ПРОДАЖИ</span>
      </div>
    </div>
  );
}

export function Landing() {
  useSiteTheme();
  const employeeRoute = "/employees";
  const [playing, setPlaying] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<number | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [departmentId, setDepartmentId] = useState<string>(
    company.departments[0].id,
  );
  const activeDepartment = company.departments.find(
    (item) => item.id === departmentId,
  )!;
  const { root: teamRef, revealed: teamRevealed } =
    useRevealOnce<HTMLElement>();
  const { root: partnerRef, revealed: partnerRevealed } =
    useRevealOnce<HTMLElement>();
  const { root: resultsRef, revealed: resultsRevealed } =
    useRevealOnce<HTMLElement>();
  const location = useLocation();
  useEffect(() => {
    document.title = "Young Unicorn — компания и наши бренды";
    return () => {
      document.title = "Young Unicorn · Рабочее пространство";
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const id = location.hash.slice(1);
      if (id)
        document.getElementById(id)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);
  const jump = (id: string) => {
    if (location.hash === `#${id}`)
      document.getElementById(id)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <div className="landing">
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="lp-hero lp-container" aria-labelledby="hero-title">
          <HeroFilm />
          <h1 id="hero-title">
            <span>Young Unicorn</span>
          </h1>
          <p className="lp-hero-introduction">
            Создаём и развиваем бренды в e-commerce
          </p>
          <div className="lp-hero-actions">
            <a
              href={company.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-button lp-button-primary"
            >
              Связаться с нами <ArrowUpRight size={17} />
            </a>
            <button
              type="button"
              className="lp-button lp-button-glass"
              onClick={() => setContactOpen(true)}
            >
              Оставить контакт <ArrowUpRight size={17} />
            </button>
          </div>
        </section>
        <section
          ref={resultsRef}
          className={`lp-results lp-container${resultsRevealed ? " is-revealed" : ""}`}
          id="results"
          aria-labelledby="results-title"
        >
          <div className="lp-results-caption">
            <h2 id="results-title" className="lp-block-title">
              Компания в цифрах
            </h2>
          </div>
          <div className="lp-metrics">
            {company.highlights.map((metric, index) => (
              <CompanyMetric
                key={metric.label}
                metric={metric}
                index={index}
                active={activeMetric === index}
                onOpen={() => setActiveMetric(index)}
                onClose={() =>
                  setActiveMetric((current) =>
                    current === index ? null : current,
                  )
                }
              />
            ))}
          </div>
          <div className="lp-results-foot">
            <p className="lp-market-fact">
              <strong>
                Топ-{company.marketplace.value}
                {company.marketplace.unit}
              </strong>
              <span>{company.marketplace.label}</span>
            </p>
          </div>
        </section>
        <section
          className="lp-directions lp-container"
          id="directions"
          aria-labelledby="directions-title"
        >
          <h2 className="lp-block-title" id="directions-title">
            Наши направления
          </h2>
          <div className="lp-direction-grid">
            {company.directions.map((direction, index) => (
              <DirectionPhoto
                key={direction.id}
                direction={direction}
                index={index}
                playing={playing}
                onOpenShowcase={
                  direction.id === "fashion"
                    ? () => setShowcaseOpen(true)
                    : undefined
                }
              />
            ))}
          </div>
          <div
            className="lp-product-evidence"
            role="group"
            aria-label={`Показатели Wildberries по снимку от ${marketplaceSnapshot.dateLabel}`}
            title={`Wildberries · снимок ${marketplaceSnapshot.dateLabel}`}
          >
            <div>
              <Star size={20} aria-hidden="true" />
              <p>
                <strong>
                  {ratingLabel(
                    getProductEvidence("shirt-burgundy-stripe").rating,
                  )}{" "}
                  из 5
                </strong>
                <span>
                  {ratingsLabel(
                    getProductEvidence("shirt-burgundy-stripe").ratings,
                  )}{" "}
                  у рубашки в полоску
                </span>
              </p>
            </div>
            <div>
              <Heart size={20} aria-hidden="true" />
              <p>
                <strong>
                  {marketplaceSnapshot.brandLikes.toLocaleString("ru-RU")}
                </strong>
                <span>отметок «Нравится» у Enmoone</span>
              </p>
            </div>
          </div>
        </section>
        <section
          className="lp-company lp-container lp-section"
          id="about"
          aria-labelledby="about-title"
        >
          <FoundingYear />
          <div className="lp-company-copy">
            <h2 id="about-title">
              Собственные бренды
              <br />
              <span>Российский e-commerce</span>
            </h2>
            <p>
              Young Unicorn — группа компаний на рынке с 2020 года, развиваем
              бренд женской одежды Enmoone на Wildberries и запускаем
              направление self-care
            </p>
            <p>
              Внутри команды объединяем продукт, маркетинг, контент и продажи,
              проверяем идеи на реальном спросе и развиваем направления, которые
              показывают результат
            </p>
            <Link
              to="/#directions"
              onClick={() => jump("directions")}
              className="lp-text-link"
            >
              Наши направления <ArrowDown size={16} />
            </Link>
          </div>
        </section>
        <SupplierAdvantages />
        <section
          ref={teamRef}
          className={`lp-team lp-container lp-section${teamRevealed ? " is-revealed" : ""}`}
          id="team"
          aria-labelledby="team-title"
        >
          <div className="lp-team-heading">
            <h2 id="team-title">
              Как устроена
              <br />
              <span>команда Young Unicorn</span>
            </h2>
            <p>
              Выберите отдел на схеме, <br />
              чтобы узнать его роль
            </p>
          </div>
          <div className="lp-team-layout">
            <TeamNetwork selectedId={departmentId} onSelect={setDepartmentId} />
            <div
              className="lp-department-info"
              id="department-info"
              role="region"
              aria-labelledby="department-title"
              aria-live="polite"
            >
              <div
                key={activeDepartment.id}
                className="lp-department-description"
              >
                <span className="lp-kicker">
                  {activeDepartment.group === "front"
                    ? "Фронт-офис"
                    : "Бэк-офис"}
                </span>
                <h3 id="department-title">{activeDepartment.title}</h3>
                <p>{activeDepartment.description}</p>
              </div>
              <a
                href={company.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lp-text-link"
              >
                Связаться с HR <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </section>
        <section
          ref={partnerRef}
          className={`lp-closing-contact lp-container lp-section${partnerRevealed ? " is-revealed" : ""}`}
          id="partners"
          aria-labelledby="partners-title"
        >
          <div className="lp-closing-intro">
            <h2 id="partners-title">На связи</h2>
            <a
              className="lp-closing-link"
              href={company.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Обсудить сотрудничество <ArrowUpRight size={22} />
            </a>
            <span className="lp-closing-person">Алина · Young Unicorn</span>
          </div>
          <div className="lp-faq lp-closing-faq" aria-labelledby="faq-title">
            <h3 id="faq-title">О сотрудничестве</h3>
            <div className="lp-faq-list">
              {questions.map(([question, answer]) => (
                <details key={question} name="company-faq">
                  <summary>
                    {question}
                    <Plus size={18} />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="lp-footer lp-partner-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <Link to="/" aria-label="Young Unicorn — главная">
                <CompanyBrand />
              </Link>
              <p>
                Группа компаний
                <br />в e-commerce с {company.since} года
              </p>
            </div>
            <nav aria-label="Навигация в подвале">
              <h2>Компания</h2>
              {[
                ["results", "В цифрах"],
                ["about", "О компании"],
                ["directions", "Направления"],
                ["partners", "Партнёрам"],
              ].map(([id, title]) => (
                <Link key={id} to={`/#${id}`} onClick={() => jump(id)}>
                  {title}
                </Link>
              ))}
            </nav>
            <nav aria-label="Команда и сотрудники">
              <h2>Команда</h2>
              <Link to="/#team" onClick={() => jump("team")}>
                Структура команды
              </Link>
              <a
                href={company.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Связаться с HR <ArrowUpRight size={14} />
              </a>
              <Link to={employeeRoute} className="lp-footer-staff">
                Сотрудникам <ArrowUpRight size={15} />
              </Link>
            </nav>
            <div className="lp-footer-contact">
              <h2>Контакты</h2>
              <a
                href={company.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram <ArrowUpRight size={16} />
              </a>
              <span>Алина</span>
              <a
                className="lp-footer-handle"
                href={company.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                @kiyamova_alina_yuc
              </a>
            </div>
          </div>
        </div>
      </footer>
      <FashionShowcaseModal
        isOpen={showcaseOpen}
        onClose={() => setShowcaseOpen(false)}
      />
      <ContactRequestModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
