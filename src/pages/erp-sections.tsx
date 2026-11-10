import { ArrowRight } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { company } from "../data/company";

const firstSteps = [
  {
    title: "Пройдите вводное обучение",
    description:
      "Узнайте, чем занимается компания, как проходит адаптация и где обсуждают рабочие вопросы.",
    to: "/erp/learning",
  },
  {
    title: "Познакомьтесь с командой",
    description:
      "Посмотрите, за что отвечают отделы, и уточните у руководителя, к кому обращаться по вашей роли.",
    to: "/erp/org-structure",
  },
  {
    title: "Откройте рабочие задачи",
    description:
      "Проверьте список задач и уточните с руководителем, с какой начать и какие доступы понадобятся.",
    to: "/erp/tasks",
  },
];

export function FirstSteps() {
  return (
    <section
      className="erp-learning-page"
      aria-labelledby="erp-first-steps-title"
    >
      <h1 id="erp-first-steps-title" className="erp-page-title">
        С чего начать
      </h1>
      <p className="erp-learning-intro">
        Три шага, чтобы освоиться в рабочем пространстве.
      </p>
      <ol className="erp-learning-list">
        {firstSteps.map(({ title, description, to }, index) => (
          <li key={to}>
            <Link className="card erp-learning-row" to={to}>
              <span className="erp-learning-number" aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Documents() {
  return (
    <>
      <h1 className="erp-page-title">Документы</h1>
      <p className="card erp-empty-documents">Документов пока нет</p>
    </>
  );
}

const offices = [
  { group: "front", label: "Фронт-офис" },
  { group: "back", label: "Бэк-офис" },
] as const;
const OrgMap = lazy(() =>
  import("./employees").then((module) => ({ default: module.OrgMap })),
);

export function OrgStructure() {
  const [mapOpened, setMapOpened] = useState(false);
  return (
    <>
      <h1 className="erp-page-title">Оргструктура</h1>
      <div className="erp-org-structure">
        {offices.map(({ group, label }) => (
          <section
            className="card erp-org-office"
            key={group}
            aria-labelledby={`erp-office-${group}`}
          >
            <h2 id={`erp-office-${group}`}>{label}</h2>
            <ul>
              {company.departments
                .filter((department) => department.group === group)
                .map((department) => (
                  <li key={department.id}>
                    <h3>{department.title}</h3>
                    <p>{department.description}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <details
        className="erp-org-map"
        onToggle={(event) => {
          if (event.currentTarget.open) setMapOpened(true);
        }}
      >
        <summary>Схема взаимодействия отделов</summary>
        {mapOpened && (
          <Suspense fallback={<p role="status">Загрузка схемы…</p>}>
            <OrgMap />
          </Suspense>
        )}
      </details>
    </>
  );
}
