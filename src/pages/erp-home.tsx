import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Copy,
  GraduationCap,
  MessageSquare,
  Star,
  X,
} from "lucide-react";
import { erpPage } from "../components/erp-navigation";
import { DashboardWidgetActions } from "../components/dashboard-widgets";
import {
  Avatar,
  Button,
  Dialog,
  Field,
  Select,
  Textarea,
} from "../components/ui";
import { useErpActivity } from "../data/erp-activity";
import { company } from "../data/company";
import { useERP, usePreferences } from "../data/store";
import { HomeDashboard } from "./dashboard";
import { lessonIds, readLearningProgress } from "../data/learning-progress";

type Shortcut = NonNullable<ReturnType<typeof erpPage>>;
const starterLinks: Shortcut[] = [
  { to: "/erp/tasks", label: "Задачи" },
  { to: "/erp/sales/orders", label: "Заказы" },
  { to: "/erp/employees", label: "Справочник сотрудника" },
];

function ShortcutList({ links }: { links: Shortcut[] }) {
  return (
    <ul className="erp-home-links">
      {links.map(({ to, label }) => (
        <li key={to}>
          <Link to={to}>
            <span>{label}</span>
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QuickMessage() {
  const employees = useERP((state) => state.data.employees);
  const [open, setOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const message = useRef<HTMLTextAreaElement>(null);
  const recipient = employees.find(({ id }) => id === recipientId);
  const copy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipient || !draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft.trim());
      setFeedback("Текст скопирован. Вставьте его в рабочий чат коллеги.");
    } catch {
      message.current?.select();
      setFeedback("Скопируйте выделенный текст вручную.");
    }
  };
  return (
    <section
      className="card erp-home-panel"
      aria-labelledby="erp-home-message-title"
    >
      <div className="erp-home-panel-heading">
        <MessageSquare size={17} aria-hidden="true" />
        <h2 id="erp-home-message-title">Быстрое сообщение</h2>
        <DashboardWidgetActions />
      </div>
      <p>Подготовьте текст для коллеги и перенесите его в рабочий чат.</p>
      <div className="erp-home-panel-actions">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Подготовить сообщение
        </Button>
        <a
          className="erp-home-text-link"
          href={company.partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Написать HR в Telegram <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Сообщение коллеге"
        description="Выберите коллегу, напишите сообщение и скопируйте его для рабочего чата."
      >
        <form onSubmit={copy}>
          <div className="dialog-body">
            <Field label="Коллега">
              <Select
                value={recipientId}
                onChange={(event) => {
                  setRecipientId(event.target.value);
                  setFeedback("");
                }}
              >
                <option value="" disabled>
                  Выберите коллегу
                </option>
                {employees.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Текст сообщения">
              <Textarea
                ref={message}
                rows={4}
                maxLength={3000}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setFeedback("");
                }}
              />
            </Field>
            <p className="muted" role="status">
              {feedback}
            </p>
          </div>
          <div className="dialog-footer">
            <Button type="submit" disabled={!recipient || !draft.trim()}>
              <Copy size={16} aria-hidden="true" /> Скопировать текст
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}

function LearningWidget() {
  const completed = readLearningProgress();
  const next = lessonIds.find((id) => !completed.includes(id));
  return (
    <section
      className="card erp-home-panel"
      aria-labelledby="erp-home-learning-title"
    >
      <div className="erp-home-panel-heading">
        <GraduationCap size={18} aria-hidden="true" />
        <h2 id="erp-home-learning-title">Обучение</h2>
        <DashboardWidgetActions />
      </div>
      <div className="erp-learning-progress">
        <span>
          Пройдено {completed.length} из {lessonIds.length} уроков
        </span>
        <progress
          aria-label="Прогресс обучения"
          max={lessonIds.length}
          value={completed.length}
        />
      </div>
      <div className="erp-home-panel-actions">
        <Link
          className="erp-home-text-link"
          to={next ? `/erp/learning/lesson/${next}` : "/erp/learning"}
        >
          {next && completed.length
            ? "Продолжить обучение"
            : next
              ? "Начать обучение"
              : "Учебный маршрут"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function ErpHome() {
  const { name, role, welcomeHidden, update } = usePreferences();
  const activity = useErpActivity((state) => state.activity);
  const visited = activity.flatMap(({ path, visits }) => {
    const page = erpPage(path);
    return page?.to === path ? [{ ...page, visits }] : [];
  });
  const recent = visited.slice(0, 4);
  const frequent = [...visited].sort((a, b) => b.visits - a.visits).slice(0, 4);
  return (
    <>
      {!welcomeHidden && (
        <section
          className="card erp-onboarding"
          aria-labelledby="erp-onboarding-title"
        >
          <span className="erp-onboarding-icon">
            <GraduationCap size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 id="erp-onboarding-title">Впервые в ERP?</h2>
            <p>
              Посмотрите, что сделать в первые дни и где пройти вводное
              обучение.
            </p>
          </div>
          <div className="erp-onboarding-actions">
            <Link className="btn btn-primary" to="/erp/learning/start">
              С чего начать <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="btn btn-outline" to="/erp/learning">
              Перейти к обучению
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="erp-onboarding-dismiss"
            aria-label="Скрыть приветственный блок"
            title="Скрыть приветственный блок"
            onClick={() => {
              update({ welcomeHidden: true });
              document.getElementById("workspace-greeting")?.focus();
            }}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </section>
      )}
      <HomeDashboard
        extras={{
          shortcuts: (
            <section
              className="card erp-home-panel"
              aria-labelledby="erp-home-sections-title"
            >
              <div className="erp-home-panel-heading">
                <h2 id="erp-home-sections-title">Рабочие разделы</h2>
                <DashboardWidgetActions />
              </div>
              <div className="erp-home-shortcuts">
                <div>
                  <h3>
                    <Clock3 size={15} aria-hidden="true" /> Недавние
                  </h3>
                  {recent.length ? (
                    <ShortcutList links={recent} />
                  ) : (
                    <p>Здесь появятся разделы, которые вы откроете.</p>
                  )}
                </div>
                <div>
                  <h3>
                    <Star size={15} aria-hidden="true" />{" "}
                    {frequent.length ? "Часто открываемые" : "Быстрые ссылки"}
                  </h3>
                  <ShortcutList
                    links={frequent.length ? frequent : starterLinks}
                  />
                </div>
              </div>
            </section>
          ),
          profile: (
            <section
              className="card erp-home-panel"
              aria-labelledby="erp-home-profile-title"
            >
              <div className="erp-home-panel-heading">
                <h2 id="erp-home-profile-title">Мой профиль</h2>
                <DashboardWidgetActions />
              </div>
              <div className="erp-home-profile">
                <Avatar name={name} size="lg" />
                <div>
                  <strong>{name}</strong>
                  <p>{role}</p>
                </div>
              </div>
              <Link className="erp-home-text-link" to="/erp/profile">
                Открыть личный кабинет{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </section>
          ),
          message: <QuickMessage />,
          learning: <LearningWidget />,
        }}
      />
    </>
  );
}
