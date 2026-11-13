import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { erpSections } from "../data/erp-sections";
import { ErpDepartmentGrid } from "../components/erp-department-grid";
import "./erp-directory.css";

const documentGroups = [
  {
    title: "Регламенты",
    description: "Правила общения, звонков и рабочих процессов",
    topics: [
      ["Правила коммуникации", "rules"],
      ["Тон общения и звонки", "calls"],
      ["Как проходит спринт", "process"],
    ],
  },
  {
    title: "Брендбук",
    description: "Логотипы, цвета, шрифты и принципы визуальной подачи",
    topics: [],
  },
  {
    title: "Шаблоны",
    description:
      "Готовые формы для повторяющихся задач, от чек-листов до договоров",
    topics: [],
  },
] as const;

function BackToStart() {
  return (
    <Link className="erp-directory-back" to={erpSections.firstSteps.to}>
      <ArrowLeft size={15} aria-hidden="true" /> С чего начать
    </Link>
  );
}

export function Documents() {
  return (
    <section className="erp-directory" aria-labelledby="erp-documents-title">
      <BackToStart />
      <header>
        <h1 id="erp-documents-title">Документы</h1>
        <p>Внутренние регламенты, брендбук и шаблоны.</p>
      </header>
      <div className="erp-directory-documents">
        {documentGroups.map(({ title, description, topics }) => (
          <section key={title} className="erp-directory-document">
            <h2>
              <FileText size={17} aria-hidden="true" /> {title}
            </h2>
            <p>{description}</p>
            {topics.length ? (
              <ul>
                {topics.map(([label, topic]) => (
                  <li key={topic}>
                    <Link to={`${erpSections.handbook.to}#${topic}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="erp-directory-document-empty">
                Файлы пока не добавлены
              </p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

export function DepartmentDirectory() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash.startsWith("#department-")) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1));
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <section className="erp-directory" aria-labelledby="erp-departments-title">
      <BackToStart />
      <header>
        <h1 id="erp-departments-title">Направления и отделы</h1>
        <p>Чем занимаются команды Young Unicorn.</p>
      </header>
      <ErpDepartmentGrid detailed />
      <Link className="erp-directory-back" to={erpSections.orgStructure.to}>
        <BookOpen size={15} aria-hidden="true" /> Открыть оргструктуру
      </Link>
    </section>
  );
}
