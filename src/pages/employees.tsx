import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Search,
  X,
} from "lucide-react";
import { CompanyBrand } from "../components/company-brand";
import { company } from "../data/company";
import { guideTopics } from "../data/employee-guide";
import {
  GuideVisual,
  GuideTopicIcon,
  guideCardNotes,
} from "../components/guide-visual";
import { useAuth } from "../data/store";
import "../landing.css";
import "../employees.css";

const groups = ["Компания", "Работа", "В команде"];
export function Employees() {
  const authenticated = useAuth((s) => s.authenticated);
  const erpRoute = authenticated ? "/erp" : "/login";
  const location = useLocation();
  const menu = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const [topicGroup, setTopicGroup] = useState("Все");
  const article = useRef<HTMLElement>(null);
  const topic = guideTopics.find((item) => `#${item.id}` === location.hash);

  const normalized = query.trim().toLocaleLowerCase("ru");
  const matches = guideTopics.filter((item) =>
    [
      item.title,
      item.summary,
      ...item.sections.flatMap((s) => [
        s.title,
        s.text || "",
        ...(s.items || []),
      ]),
    ]
      .join(" ")
      .toLocaleLowerCase("ru")
      .includes(normalized),
  );
  useEffect(() => {
    document.title = `${topic ? topic.title : "Сотрудникам"} — Young Unicorn`;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (location.hash) article.current?.focus({ preventScroll: true });
  }, [location.hash, topic]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const open = () => {
    setQuery("");
    if (menu.current) menu.current.open = false;
  };
  return (
    <div className="landing employee-guide">
      <header className="lp-header">
        <div className="lp-header-inner">
          <Link to="/" className="lp-home" aria-label="Young Unicorn — главная">
            <CompanyBrand />
          </Link>
          <nav className="yu-audience-nav" aria-label="Раздел сайта">
            <Link to="/">Партнёрам</Link>
            <Link to="/employees" aria-current="page" onClick={open}>
              Сотрудникам
            </Link>
          </nav>
          <Link to={erpRoute} className="eg-erp-link">
            Войти в ERP <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main-content" className="eg-content" tabIndex={-1}>
        <div className="eg-toolbar">
          <details className="eg-topics-menu" ref={menu}>
            <summary>
              Темы справочника <ChevronDown size={16} />
            </summary>
            <nav aria-label="Темы справочника">
              <Link className="eg-all-topics" to="/employees" onClick={open}>
                Все темы <ArrowRight size={15} />
              </Link>
              <div className="eg-menu-groups">
                {groups.map((group) => (
                  <div key={group}>
                    <h2>{group}</h2>
                    {guideTopics
                      .filter((item) => item.group === group)
                      .map((item) => (
                        <Link
                          key={item.id}
                          to={`/employees#${item.id}`}
                          aria-current={
                            topic?.id === item.id ? "page" : undefined
                          }
                          onClick={open}
                        >
                          {item.title}
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            </nav>
          </details>
          <div className="eg-search">
            <Search size={16} />
            <input
              type="search"
              aria-label="Поиск по справочнику"
              placeholder="Найти ответ"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => setQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
        {normalized ? (
          <section
            className="eg-search-results"
            aria-labelledby="eg-search-title"
          >
            <span className="eg-breadcrumb">Справочник</span>
            <h1 id="eg-search-title">Результаты поиска</h1>
            <p className="eg-intro" role="status">
              {matches.length
                ? `Найдено тем: ${matches.length}`
                : "Ничего не найдено\nПопробуй другое слово или напиши HR"}
            </p>
            <div className="eg-topic-list">
              {matches.map((item) => (
                <Link to={`/employees#${item.id}`} key={item.id} onClick={open}>
                  <span>
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                  </span>
                  <ArrowRight size={20} />
                </Link>
              ))}
            </div>
          </section>
        ) : topic ? (
          <article
            className="eg-article"
            ref={article}
            tabIndex={-1}
            aria-labelledby="eg-article-title"
          >
            <Link className="eg-breadcrumb" to="/employees">
              <ArrowLeft size={14} /> Все темы
            </Link>
            <h1 id="eg-article-title">{topic.title}</h1>
            <p className="eg-intro">{topic.summary}</p>
            <GuideVisual key={`visual-${topic.id}`} id={topic.id} />
            <div
              className={`eg-sections eg-sections-${topic.id}`}
              key={`details-${topic.id}`}
            >
              {topic.sections.map((section, index) => (
                <details key={section.title} open={index === 0}>
                  <summary>
                    <h2>{section.title}</h2>
                    <Plus size={18} />
                  </summary>
                  <div className="eg-answer">
                    {section.text && <p>{section.text}</p>}
                    {section.items && (
                      <ul>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </article>
        ) : (
          <>
            <section className="eg-welcome" aria-labelledby="eg-welcome-title">
              <span className="eg-breadcrumb">Сотрудникам</span>
              <h1 id="eg-welcome-title">Как мы работаем</h1>
              <p className="eg-intro">
                Всё о работе в Young Unicorn Выбери нужную тему — остальное не
                будет отвлекать
              </p>
              <div className="eg-quick-links">
                <Link to="/employees#adaptation">
                  <GuideTopicIcon id="adaptation" size={28} />
                  <span>
                    Адаптация
                    <strong className="eg-quick-value">3 месяца</strong>
                  </span>
                  <strong>
                    С чего начать <ArrowRight size={18} />
                  </strong>
                </Link>
                <Link to="/employees#process">
                  <GuideTopicIcon id="process" size={28} />
                  <span>
                    Рабочий цикл
                    <strong className="eg-quick-value">2–4 недели</strong>
                  </span>
                  <strong>
                    Как устроен спринт <ArrowRight size={18} />
                  </strong>
                </Link>
                <Link to={erpRoute}>
                  <GuideTopicIcon id="services" size={28} />
                  <span>
                    Задачи и проекты
                    <strong className="eg-quick-value">ERP</strong>
                  </span>
                  <strong>
                    Открыть ERP <ArrowUpRight size={18} />
                  </strong>
                </Link>
              </div>
            </section>
            <section
              className="eg-directory"
              aria-labelledby="eg-directory-title"
            >
              <h2 id="eg-directory-title">Справочник сотрудника</h2>
              <div
                className="eg-topic-filters"
                role="group"
                aria-label="Группа тем"
              >
                {["Все", ...groups].map((group) => (
                  <button
                    key={group}
                    type="button"
                    aria-pressed={topicGroup === group}
                    onClick={() => setTopicGroup(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
              <div className="eg-topic-cards">
                {guideTopics
                  .filter(
                    (item) => topicGroup === "Все" || item.group === topicGroup,
                  )
                  .map((item) => (
                    <Link to={`/employees#${item.id}`} key={item.id}>
                      <div className="eg-card-heading">
                        <span
                          className={`eg-topic-symbol eg-symbol-${item.id}`}
                        >
                          <GuideTopicIcon id={item.id} size={26} />
                        </span>
                        <ArrowUpRight size={17} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{guideCardNotes[item.id]}</p>
                    </Link>
                  ))}
              </div>
            </section>
          </>
        )}
        <div className="eg-contact">
          <span>
            Не нашёл ответ?
            <a
              href={company.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Алина поможет разобраться <ArrowUpRight size={17} />
            </a>
          </span>
        </div>
        <p className="eg-source">Материалы welcome-презентации Young Unicorn</p>
      </main>
      <footer className="eg-footer lp-container">
        <Link to="/">
          На сайт компании <ArrowUpRight size={14} />
        </Link>
        <span>© {new Date().getFullYear()} Young Unicorn</span>
      </footer>
    </div>
  );
}
