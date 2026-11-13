import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Headphones,
  Link2,
  Users,
} from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ErpDepartmentGrid } from "../components/erp-department-grid";
import { ErpSectionStatus } from "../components/erp-navigation";
import { OnboardingEmoji } from "../components/onboarding-emoji";
import { SpringCheck } from "../components/ui/spring-check";
import { erpSections } from "../data/erp-sections";
import "./erp-onboarding.css";

const learning = erpSections.learning.to;
const handbook = erpSections.handbook.to;

const tasks = [
  {
    id: "team",
    label: "Познакомиться с командой",
    short: "Команда",
    instruction:
      "Открой оргструктуру, найди свой отдел и посмотри, кто им руководит и с кем ты будешь работать.",
    action: "Открыть оргструктуру",
    to: erpSections.orgStructure.to,
  },
  {
    id: "access",
    label: "Получить рабочие доступы",
    short: "Доступы",
    instruction:
      "Открой список рабочих сервисов и проверь, в какие можешь войти. Если доступа нет, напиши HR.",
    action: "Посмотреть рабочие сервисы",
    to: `${handbook}#services`,
  },
  {
    id: "materials",
    label: "Изучить материалы",
    short: "Материалы",
    instruction: "Открой учебный маршрут и пройди первый вводный урок.",
    action: "Открыть учебный маршрут",
    to: learning,
  },
  {
    id: "first-task",
    label: "Обсудить первые задачи",
    short: "Первые задачи",
    instruction:
      "Уточни у руководителя, с какой задачи начать, какой результат он ждёт и к какому сроку. Запиши договорённость в задачах.",
    action: "Открыть задачи",
    to: erpSections.tasks.to,
  },
] as const;
type TaskId = (typeof tasks)[number]["id"];

function FirstDayStepHelp({
  task,
  next,
}: {
  task: (typeof tasks)[number];
  next: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom",
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 })],
  });
  const hover = useHover(context, {
    mouseOnly: true,
    delay: { open: 90, close: 100 },
    handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
  ]);

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        className="erp-start-step-link"
        aria-current={next ? "step" : undefined}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        {...getReferenceProps()}
      >
        {task.short}
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
          >
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              id={panelId}
              role="region"
              aria-labelledby={titleId}
              className="erp-start-step-help"
              {...getFloatingProps()}
            >
              <strong id={titleId}>{task.label}</strong>
              <p>{task.instruction}</p>
              <Link to={task.to} onClick={() => setOpen(false)}>
                {task.action} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

const checklistKey = "nova-erp-first-day";

function readChecklist(): TaskId[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(checklistKey) ?? "[]",
    );
    return Array.isArray(saved)
      ? tasks.map(({ id }) => id).filter((id) => saved.includes(id))
      : [];
  } catch {
    return [];
  }
}

const shortcuts = [
  {
    title: "Учебный маршрут",
    emoji: "learning",
    to: learning,
  },
  {
    title: "Оргструктура",
    emoji: "org-chart",
    to: erpSections.orgStructure.to,
  },
  {
    title: "Рабочие сервисы",
    emoji: "toolkit",
    to: `${handbook}#services`,
  },
  {
    title: "Документы",
    emoji: "documents",
    to: erpSections.documents.to,
  },
] as const;

const usefulLinks = [
  {
    title: "Рабочие чаты",
    topic: "communication",
    emoji: "chats",
  },
  {
    title: "Звонки и встречи",
    topic: "calls",
    emoji: "calls",
  },
  {
    title: "Правила общения",
    topic: "rules",
    emoji: "rules",
  },
  {
    title: "Доступы к сервисам",
    topic: "services",
    emoji: "access",
  },
] as const;

export function FirstSteps() {
  const [completed, setCompleted] = useState(readChecklist);
  const nextStep = tasks.find(({ id }) => !completed.includes(id));

  function setTaskChecked(id: TaskId, checked: boolean) {
    const remaining = completed.filter((item) => item !== id);
    const next = checked ? [...remaining, id] : remaining;
    setCompleted(next);
    try {
      localStorage.setItem(checklistKey, JSON.stringify(next));
    } catch {
      // The checklist still works during the current visit.
    }
  }

  return (
    <div className="erp-start-page">
      {!erpSections.firstSteps.ready && (
        <div className="erp-start-status">
          <ErpSectionStatus ready={erpSections.firstSteps.ready} />
        </div>
      )}
      <article
        className="erp-onboarding-guide erp-page-frame"
        aria-labelledby="erp-first-steps-title"
      >
        <div className="erp-start-layout">
          <header className="erp-start-hero">
            <h1 id="erp-first-steps-title">
              Добро пожаловать <span>в Young Unicorn</span>
            </h1>
          </header>

          <div className="erp-start-main">
            <nav className="erp-start-shortcuts" aria-label="Быстрые переходы">
              {shortcuts.map(({ title, emoji, to }) => (
                <Link key={to} className="erp-start-tile" to={to}>
                  <OnboardingEmoji asset={emoji} />
                  <strong>{title}</strong>
                </Link>
              ))}
            </nav>

            <section
              className="erp-start-panel erp-start-first-day"
              aria-labelledby="erp-first-day-title"
            >
              <div className="erp-start-heading">
                <h2 id="erp-first-day-title">
                  <CalendarDays aria-hidden="true" /> Твой первый день
                </h2>
                <span aria-live="polite">
                  {completed.length} из {tasks.length}
                </span>
              </div>
              <p className="erp-start-step-hint">
                Открой шаг, чтобы узнать, что сделать. Нажми «+», когда
                закончишь.
              </p>
              <ol className="erp-start-timeline">
                {tasks.map((task) => {
                  const { id, label } = task;
                  const checked = completed.includes(id);
                  const isNext = id === nextStep?.id;
                  return (
                    <li key={id} data-completed={checked} data-next={isNext}>
                      <SpringCheck
                        round
                        ariaLabel={`${label} — выполнено`}
                        checked={checked}
                        onChange={(value) => setTaskChecked(id, value)}
                      />
                      <FirstDayStepHelp task={task} next={isNext} />
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          <aside
            className="erp-start-panel erp-start-aside"
            aria-labelledby="erp-start-links-title"
          >
            <div className="erp-start-heading">
              <h2 id="erp-start-links-title">
                <Link2 aria-hidden="true" /> Полезные ссылки
              </h2>
            </div>
            <ul className="erp-start-links">
              {usefulLinks.map(({ title, topic, emoji }) => (
                <li key={topic}>
                  <Link to={`${handbook}#${topic}`}>
                    <OnboardingEmoji asset={emoji} />
                    <span>{title}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li className="erp-start-help-link">
                <Link to={`${handbook}#adaptation`}>
                  <span className="erp-start-help-icon" aria-hidden="true">
                    <Headphones size={16} />
                  </span>
                  <span>Нужна помощь?</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </aside>

          <section
            className="erp-start-panel erp-start-team-panel"
            aria-labelledby="erp-start-team-title"
          >
            <div className="erp-start-heading">
              <h2 id="erp-start-team-title">
                <Users aria-hidden="true" /> Команды и направления
              </h2>
              <Link
                className="erp-start-link"
                to={erpSections.departmentDirectory.to}
              >
                Все направления <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <ErpDepartmentGrid />
          </section>
        </div>
      </article>
    </div>
  );
}
