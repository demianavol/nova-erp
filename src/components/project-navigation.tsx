import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Layers3,
  ListTodo,
  Plus,
  Users,
  Zap,
} from "lucide-react";
import { useERP } from "../data/store";
import { projectTasks, useWorkspace } from "../data/workspace";
import { Avatar, Button, Dialog, Field, Input, Select } from "./ui";

export function ProjectNavigation() {
  const { data } = useERP();
  const workspace = useWorkspace();
  const project = workspace.projects.find(
    (p) => p.id === workspace.selectedProjectId,
  );
  const navigate = useNavigate(),
    location = useLocation();
  const [creating, setCreating] = useState(false),
    [members, setMembers] = useState(false);
  const [name, setName] = useState(""),
    [employee, setEmployee] = useState(data.employees[0]?.id || ""),
    [error, setError] = useState("");
  const suffix = project ? `&project=${encodeURIComponent(project.id)}` : "";
  const tasks = projectTasks(data.tasks, project);
  const people = data.employees.filter((e) =>
    project ? project.employeeIds.includes(e.id) : true,
  );
  return (
    <>
      <div className="sidebar-nav-area project-navigation">
        <div className="project-picker">
          <button
            className={!project ? "project-all selected" : "project-all"}
            onClick={() => {
              workspace.selectProject(null);
              navigate("/");
            }}
          >
            <Layers3 size={14} />
            Все проекты
          </button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Добавить проект"
            onClick={() => {
              setName("");
              setError("");
              setCreating(true);
            }}
          >
            <Plus size={17} />
          </Button>
        </div>
        <div className="project-list" aria-label="Проекты">
          {workspace.projects.map((p, i) => (
            <button
              key={p.id}
              className={`project-choice project-color-${i % 4}${p.id === project?.id ? " selected" : ""}`}
              title={p.name}
              aria-pressed={p.id === project?.id}
              onClick={() => {
                workspace.selectProject(p.id);
                navigate("/");
              }}
            >
              <span>{p.name.slice(0, 1)}</span>
              <strong>{p.name}</strong>
              <small>
                {
                  p.taskIds.filter((id) =>
                    data.tasks.some((t) => t.id === id && !t.done),
                  ).length
                }
              </small>
            </button>
          ))}
        </div>
        <div className="project-section-label">
          {project ? "Работа по проекту" : "Работа команды"}
        </div>
        <nav className="project-context" aria-label="Работа по проекту">
          <button onClick={() => navigate("/")}>
            <FolderKanban size={16} />
            Доска проекта
          </button>
          <button onClick={() => setMembers(true)}>
            <Users size={16} />
            Ответственные<span>{people.length}</span>
          </button>
          <NavLink
            to={`/tasks?view=backlog${suffix}`}
            className={() =>
              location.search.includes("view=backlog") ? "selected" : ""
            }
          >
            <ListTodo size={16} />
            Бэклог
            <span>
              {
                projectTasks(tasks, undefined, "backlog").filter((t) => !t.done)
                  .length
              }
            </span>
          </NavLink>
          <NavLink
            to={`/tasks?view=sprint${suffix}`}
            className={() =>
              location.search.includes("view=sprint") ? "selected" : ""
            }
          >
            <Zap size={16} />
            Спринт недели
            <span>
              {
                projectTasks(tasks, undefined, "sprint").filter((t) => !t.done)
                  .length
              }
            </span>
          </NavLink>
        </nav>
        {location.pathname.startsWith("/sales") && (
          <>
            <div className="project-section-label">Продажи</div>
            <nav
              className="project-context sales-context"
              aria-label="Разделы продаж"
            >
              {[
                ["/sales", "Аналитика"],
                ["/sales/orders", "Заказы"],
                ["/sales/customers", "Клиенты"],
                ["/sales/pipeline", "Воронка"],
              ].map(([to, label]) => (
                <NavLink to={to} end key={to}>
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="Новый проект"
        description="Название и ответственный — всё, что нужно для начала."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              workspace.addProject(name, employee);
              setCreating(false);
              navigate("/");
            } catch (err) {
              setError(
                (err as Error).message.includes("Выберите")
                  ? "Выберите ответственного"
                  : "Название проекта: от 2 до 60 символов",
              );
            }
          }}
        >
          <div className="dialog-body">
            <Field label="Название проекта" error={error}>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Например, запуск новой коллекции"
              />
            </Field>
            <Field label="Ответственный за проект">
              <Select
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              >
                {data.employees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="dialog-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreating(false)}
            >
              Отмена
            </Button>
            <Button type="submit">Создать проект</Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={members}
        onOpenChange={setMembers}
        title="Ответственные"
        description={project?.name || "Команда рабочего пространства"}
      >
        <div className="dialog-body project-members">
          {people.map((person) => (
            <div key={person.id}>
              <Avatar name={person.name} color={person.color} />
              <span>
                <strong>{person.name}</strong>
                <small>{person.role}</small>
              </span>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
