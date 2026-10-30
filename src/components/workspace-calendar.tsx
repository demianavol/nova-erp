import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useERP } from "../data/store";
import {
  projectTasks,
  sprintRange,
  type WorkspaceProject,
} from "../data/workspace";
import { shiftDate, today, dateLabel } from "../lib/utils";
import { Avatar, Empty } from "./ui";

export function WorkspaceCalendar({ project }: { project?: WorkspaceProject }) {
  const [selected, setSelected] = useState(today()),
    [week, setWeek] = useState(sprintRange().from);
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  const tasks = projectTasks(data.tasks, project);
  const selectedTasks = tasks
    .filter((t) => t.dueAt === selected)
    .sort((a, b) => Number(a.done) - Number(b.done));
  const suffix = project ? "&project=" + encodeURIComponent(project.id) : "";
  return (
    <section className="card workspace-calendar" aria-label="Календарь задач">
      <header>
        <h2>
          <CalendarDays size={14} />
          Календарь
        </h2>
        <span>
          {new Intl.DateTimeFormat("ru-RU", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(week + "T12:00:00Z"))}
        </span>
      </header>
      <div className="calendar-week">
        <button
          aria-label="Предыдущая неделя"
          onClick={() => {
            setWeek(shiftDate(week, -7));
            setSelected(shiftDate(selected, -7));
          }}
        >
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: 7 }, (_, i) => {
          const day = shiftDate(week, i);
          const count = tasks.filter((t) => t.dueAt === day && !t.done).length;
          return (
            <button
              key={day}
              aria-label={dateLabel(day, true)}
              aria-pressed={selected === day}
              className={selected === day ? "selected" : ""}
              onClick={() => setSelected(day)}
            >
              <strong>{Number(day.slice(-2))}</strong>
              <span>{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i]}</span>
              <i className={count ? "has-tasks" : ""} />
            </button>
          );
        })}
        <button
          aria-label="Следующая неделя"
          onClick={() => {
            setWeek(shiftDate(week, 7));
            setSelected(shiftDate(selected, 7));
          }}
        >
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="calendar-day-title">
        <span>
          {selected === today() ? "Сегодня" : dateLabel(selected, true)}
        </span>
        <button
          aria-label="Добавить задачу на выбранную дату"
          onClick={() => navigate(`/erp/tasks?create=1&date=${selected}${suffix}`)}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="calendar-agenda">
        {selectedTasks.map((task) => {
          const person = data.employees.find((e) => e.id === task.employeeId)!;
          return (
            <button
              className={task.done ? "done" : ""}
              key={task.id}
              onClick={() => navigate(`/erp/tasks?open=${task.id}${suffix}`)}
            >
              <span className={`agenda-priority priority-${task.priority}`} />
              <span>
                <strong>{task.title}</strong>
                <small>{task.done ? "Завершено" : person.name}</small>
              </span>
              <Avatar name={person.name} portrait size="sm" />
            </button>
          );
        })}
        {!selectedTasks.length && (
          <Empty
            title="День свободен"
            description="Добавьте задачу на эту дату."
          />
        )}
      </div>
    </section>
  );
}
