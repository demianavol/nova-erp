import { ArrowUpRight, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useERP } from "../data/store";
import type { Task } from "../data/schema";
import type { WorkspaceProject } from "../data/workspace";
import { dateLabel, today } from "../lib/utils";
import { Avatar, Empty } from "./ui";

export function HomeTasks({
  tasks,
  project,
}: {
  tasks: Task[];
  project?: WorkspaceProject;
}) {
  const { data, toggleTask } = useERP(),
    navigate = useNavigate();
  const suffix = project ? "&project=" + encodeURIComponent(project.id) : "";
  return (
    <section className="card home-tasks">
      <header>
        <h2>Задачи команды</h2>
        <button
          aria-label="Создать задачу"
          onClick={() => navigate("/erp/tasks?create=1" + suffix)}
        >
          <Plus size={17} />
        </button>
      </header>
      <div className="home-task-list">
        {tasks.map((task) => {
          const person = data.employees.find((e) => e.id === task.employeeId)!;
          return (
            <article className="home-task" key={task.id}>
              <button
                className="home-task-check"
                aria-label={`Завершить: ${task.title}`}
                onClick={() => toggleTask(task.id)}
              >
                <Check size={11} />
              </button>
              <button
                className="home-task-content"
                onClick={() => navigate(`/erp/tasks?open=${task.id}${suffix}`)}
              >
                <strong>{task.title}</strong>
                <span className="home-task-meta">
                  <Avatar name={person.name} color={person.color} size="sm" />
                  <span>{person.name.split(" ")[0]}</span>
                  <time className={task.dueAt < today() ? "overdue" : ""}>
                    <i className={`priority-dot priority-${task.priority}`} />
                    {task.dueAt === today() ? "Сегодня" : dateLabel(task.dueAt)}
                  </time>
                </span>
              </button>
            </article>
          );
        })}
        {!tasks.length && (
          <Empty
            title="Нет открытых задач"
            description="Добавьте первую задачу в проект."
          />
        )}
      </div>
      <button
        className="home-tasks-all"
        onClick={() =>
          navigate(
            "/erp/tasks" +
              (project ? "?project=" + encodeURIComponent(project.id) : ""),
          )
        }
      >
        Все задачи
        <ArrowUpRight size={13} />
      </button>
    </section>
  );
}
