import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  assistantEndpoint,
  assistantHistoryLimit,
  assistantQuestion,
  assistantReply,
  assistantTaskStatus,
  type AssistantReply,
} from "../data/erp-assistant";
import type { Task } from "../data/schema";
import { erpAssistantAvailable } from "../data/erp-sections";
import { useERP, usePreferences } from "../data/store";
import { defaultTaskFilters, filterTasks, taskStatus } from "../data/tasks";
import { dateLabel, today } from "../lib/utils";
import { Button, Dialog, Field, Select, Textarea } from "./ui";
import { ThoughtLine } from "./ui/thought-line";
import "../erp-assistant.css";

const suggestions = [
  "Что у меня просрочено?",
  "Что ты умеешь?",
  "Где смотреть задачи спринта?",
];

type TaskSummary = Pick<Task, "id" | "title" | "dueAt"> & { overdue: boolean };
type Turn = { question: string } & (
  | ({ kind: "guide" } & AssistantReply)
  | { kind: "tasks"; answer: string; tasks: TaskSummary[] }
);

const assistantTrigger = (
  <Button
    variant="outline"
    className="erp-assistant-trigger"
    aria-label="Спросить ИИ"
    title="Спросить ИИ"
  >
    <Sparkles size={17} aria-hidden="true" />
    <span>Спросить ИИ</span>
  </Button>
);

export function ErpAssistant() {
  const [open, setOpen] = useState(false);
  return erpAssistantAvailable ? (
    <AssistantChat />
  ) : (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="ИИ-помощник"
      description="В разработке"
      trigger={assistantTrigger}
    >
      {null}
    </Dialog>
  );
}

function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState("");
  const [showTaskScope, setShowTaskScope] = useState(false);
  const employees = useERP((state) => state.data.employees);
  const employeeId = usePreferences((state) => state.assistantEmployeeId);
  const updatePreferences = usePreferences((state) => state.update);
  const transcript = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const log = transcript.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [open, turns, pendingQuestion]);

  async function ask(value: string, taskEmployeeId = employeeId) {
    const parsed = assistantQuestion.safeParse(value);
    if (!parsed.success || request.current) return;

    const question = parsed.data;
    const status = assistantTaskStatus(question);
    if (status) {
      setShowTaskScope(true);
      const data = useERP.getState().data;
      const employee = data.employees.find(({ id }) => id === taskEmployeeId);
      if (!employee) {
        setDraft(question);
        setError("Выберите себя в списке сотрудников.");
        return;
      }

      const date = today();
      const tasks = filterTasks(
        data,
        { ...defaultTaskFilters, status, employee: employee.id },
        date,
      ).map((task) => ({
        id: task.id,
        title: task.title,
        dueAt: task.dueAt,
        overdue: taskStatus(task, date) === "overdue",
      }));
      const label = status === "overdue" ? "Просрочено задач" : "Открыто задач";
      setTurns((previous) => [
        ...previous,
        {
          kind: "tasks",
          question,
          answer: `${employee.name} · ${label}: ${tasks.length}`,
          tasks,
        },
      ]);
      setDraft("");
      setError("");
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setPendingQuestion(question);
    setDraft("");
    setError("");

    try {
      const response = await fetch(assistantEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          history: turns
            .filter((turn) => turn.kind === "guide")
            .slice(-assistantHistoryLimit)
            .map(({ question, answer }) => ({ question, answer })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Не удалось отправить вопрос.",
        );
        setDraft(question);
        return;
      }
      const reply = assistantReply.parse(result);
      setTurns((previous) => [
        ...previous,
        { kind: "guide", question, ...reply },
      ]);
    } catch {
      if (!controller.signal.aborted) {
        setError("Помощник недоступен. Попробуйте отправить вопрос ещё раз.");
        setDraft(question);
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPendingQuestion("");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="ИИ-помощник"
      description="Ваши задачи и справочник сотрудника"
      className="erp-assistant-dialog"
      trigger={assistantTrigger}
    >
      {showTaskScope && (
        <Field className="erp-assistant-task-scope" label="Задачи сотрудника">
          <Select
            value={
              employees.some(({ id }) => id === employeeId) ? employeeId : ""
            }
            disabled={Boolean(pendingQuestion)}
            onChange={(event) => {
              const selected = event.target.value;
              updatePreferences({ assistantEmployeeId: selected || undefined });
              setError("");
              if (selected && assistantTaskStatus(draft))
                void ask(draft, selected);
            }}
          >
            <option value="">Выберите себя</option>
            {employees.map(({ id, name, role }) => (
              <option key={id} value={id}>
                {name} · {role}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div
        ref={transcript}
        className="erp-assistant-transcript"
        role="log"
        aria-label="Переписка"
      >
        {!turns.length && !pendingQuestion && !error && (
          <div className="erp-assistant-suggestions">
            <p>Что хотите узнать?</p>
            {suggestions.map((question) => (
              <Button
                key={question}
                variant="outline"
                onClick={() => void ask(question)}
              >
                {question}
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
            ))}
          </div>
        )}
        {turns.map((turn, index) => (
          <div className="erp-assistant-turn" key={index}>
            <p className="erp-assistant-question">
              <span className="sr-only">Вы. </span>
              {turn.question}
            </p>
            <div className="erp-assistant-answer">
              <p>
                <span className="sr-only">Помощник. </span>
                {turn.answer}
              </p>
              {turn.kind === "guide" && turn.sources.length > 0 && (
                <ul
                  className="erp-assistant-sources"
                  aria-label="Статьи справочника"
                >
                  {turn.sources.map(({ id, title }) => (
                    <li key={id}>
                      <Link
                        to={`/erp/employees#${id}`}
                        onClick={() => setOpen(false)}
                      >
                        {title}
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {turn.kind === "tasks" && turn.tasks.length > 0 && (
                <ul
                  className="erp-assistant-tasks"
                  aria-label="Задачи сотрудника"
                >
                  {turn.tasks.map(({ id, title, dueAt, overdue }) => (
                    <li key={id}>
                      <Link
                        to={`/erp/tasks?open=${encodeURIComponent(id)}`}
                        onClick={() => setOpen(false)}
                      >
                        <span>
                          <strong>{title}</strong>
                          <small>
                            Срок {dateLabel(dueAt, true)}
                            {overdue && " · Просрочена"}
                          </small>
                        </span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {pendingQuestion && (
          <div className="erp-assistant-turn">
            <p className="erp-assistant-question">
              <span className="sr-only">Вы. </span>
              {pendingQuestion}
            </p>
            <ThoughtLine label="Готовлю ответ…" />
          </div>
        )}
      </div>
      <form className="erp-assistant-form" onSubmit={submit}>
        {error && (
          <p className="erp-assistant-error" role="alert">
            {error}
          </p>
        )}
        <div className="erp-assistant-composer">
          <Textarea
            aria-label="Ваш вопрос"
            placeholder="Спросите о задачах, правилах или сервисах"
            rows={2}
            maxLength={assistantQuestion.maxLength ?? undefined}
            value={draft}
            readOnly={Boolean(pendingQuestion)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Отправить вопрос"
            title="Отправить вопрос"
            disabled={!draft.trim() || Boolean(pendingQuestion)}
          >
            <ArrowUp size={18} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
