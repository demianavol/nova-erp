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
import { company } from "../data/company";
import { EmployeeTeam } from "../components/employee-team";
import { guideTopics, type GuideTopic } from "../data/employee-guide";
import { erpSections } from "../data/erp-sections";
import {
  GuideVisual,
  GuideTopicIcon,
  guideCardNotes,
} from "../components/guide-visual";
import "../landing.css";
import "../employees.css";

const groups = ["Компания", "Работа", "В команде"];
export function Employees() {
  const location = useLocation();
  const menu = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const [topicGroup, setTopicGroup] = useState("Все");
  const article = useRef<HTMLElement>(null);
  const topic = guideTopics.find((item) => `#${item.id}` === location.hash);
  const topicIndex = guideTopics.findIndex((item) => item.id === topic?.id);
  const previousTopic = guideTopics[topicIndex - 1];
  const nextTopic = guideTopics[topicIndex + 1];

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
    document.title = `${topic ? topic.title : "Справочник сотрудника"} — Young Unicorn`;
    setQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (location.hash) article.current?.focus({ preventScroll: true });
    return () => {
      document.title = "Young Unicorn · Рабочее пространство";
    };
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
    <div className="landing employee-guide employee-guide-erp">
      <div className="eg-content">
        {!topic && (
          <div className="erp-guide-heading">
            <h1 id="eg-directory-title">Справочник сотрудника</h1>
            <p>Найдите нужный материал о работе в Young Unicorn.</p>
          </div>
        )}
        <div className="eg-toolbar">
          {topic && (
            <details className="eg-topics-menu" ref={menu}>
              <summary>
                Темы справочника <ChevronDown size={16} />
              </summary>
              <nav aria-label="Темы справочника">
                <Link
                  className="eg-all-topics"
                  to="/erp/employees"
                  onClick={open}
                >
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
                            to={`/erp/employees#${item.id}`}
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
          )}
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
            {topic ? (
              <h1 id="eg-search-title">Результаты поиска</h1>
            ) : (
              <h2 id="eg-search-title" className="erp-guide-search-title">Результаты поиска</h2>
            )}
            <p className="eg-intro" role="status">
              {matches.length
                ? `Найдено тем: ${matches.length}`
                : "Ничего не найдено\nПопробуй другое слово или напиши HR"}
            </p>
            <div className="eg-topic-list">
              {matches.map((item) => (
                <Link
                  to={`/erp/employees#${item.id}`}
                  key={item.id}
                  onClick={open}
                >
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
            <div className="eg-article-navigation">
              <Link className="eg-breadcrumb" to="/erp/employees">
                <ArrowLeft size={14} /> Все темы
              </Link>
              {nextTopic && (
                <Link
                  className="eg-next-topic"
                  to={`/erp/employees#${nextTopic.id}`}
                  onClick={open}
                >
                  Следующая тема <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <GuideArticleContent topic={topic} />
            {topic.id === "services" && (
              <div className="erp-onboarding-actions">
                <Link
                  className="btn btn-outline"
                  to={`${erpSections.handbook.to}#communication`}
                >
                  Каналы коммуникации
                </Link>
                <Link
                  className="btn btn-outline"
                  to={`${erpSections.learning.to}/lesson/services`}
                >
                  Урок о сервисах
                </Link>
              </div>
            )}
            <nav
              className="eg-topic-pagination"
              aria-label="Переход между темами"
            >
              {previousTopic ? (
                <Link
                  to={`/erp/employees#${previousTopic.id}`}
                  onClick={open}
                  rel="prev"
                >
                  <ArrowLeft size={19} />
                  <span>
                    <small>Предыдущая тема</small>
                    {previousTopic.title}
                  </span>
                </Link>
              ) : (
                <Link to="/erp/employees">
                  <ArrowLeft size={19} />
                  <span>
                    <small>Справочник</small>Все темы
                  </span>
                </Link>
              )}
              {nextTopic ? (
                <Link
                  to={`/erp/employees#${nextTopic.id}`}
                  onClick={open}
                  rel="next"
                >
                  <span>
                    <small>
                      Следующая тема · {topicIndex + 2} из {guideTopics.length}
                    </small>
                    {nextTopic.title}
                  </span>
                  <ArrowRight size={19} />
                </Link>
              ) : (
                <Link to="/erp/employees">
                  <span>
                    <small>Конец справочника</small>Вернуться к справочнику
                  </span>
                  <ArrowRight size={19} />
                </Link>
              )}
            </nav>
          </article>
        ) : (
          <section
            className="eg-directory"
            aria-labelledby="eg-directory-title"
          >
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
                  <Link to={`/erp/employees#${item.id}`} key={item.id}>
                    <span className="eg-topic-symbol" aria-hidden="true">
                      <GuideTopicIcon id={item.id} size={19} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{guideCardNotes[item.id]}</p>
                    </div>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ))}
            </div>
          </section>
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
      </div>
    </div>
  );
}

export function GuideArticleContent({ topic }: { topic: GuideTopic }) {
  return (
    <>
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
              {section.text && (
                <div className="eg-prose">
                  {section.text.split("\n").map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              )}
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
    </>
  );
}

export function OrgMap() {
  return (
    <div className="landing employee-guide employee-guide-erp">
      <EmployeeTeam />
    </div>
  );
}
