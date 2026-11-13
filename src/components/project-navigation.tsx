import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  FolderOpen,
  Layers3,
  ListTodo,
  MoreHorizontal,
  Plus,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useERP } from "../data/store";
import {
  projectTasks,
  useWorkspace,
  type WorkspaceProject,
} from "../data/workspace";
import { Avatar, Button, Dialog, Field, Input, Menu, Select } from "./ui";
import { HoldButton, SaveButton, useSaveAction } from "./ui/action-buttons";

export function ProjectNavigation({
  showEmpty = false,
}: {
  showEmpty?: boolean;
}) {
  const { data } = useERP();
  const workspace = useWorkspace();
  const project = workspace.projects.find(
    (p) => p.id === workspace.selectedProjectId,
  );
  const [creating, setCreating] = useState(false),
    [members, setMembers] = useState(false);
  const [action, setAction] = useState<"rename" | "archive" | "delete" | null>(
    null,
  );
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedTarget, setArchivedTarget] = useState<WorkspaceProject | null>(
    null,
  );
  const [name, setName] = useState(""),
    [employee, setEmployee] = useState(data.employees[0]?.id || ""),
    [error, setError] = useState("");
  const suffix = project ? `&project=${encodeURIComponent(project.id)}` : "";
  const tasks = projectTasks(data.tasks, project);
  const activeProjects = workspace.projects.filter((item) => !item.archived);
  const archivedProjects = workspace.projects.filter((item) => item.archived);
  const save = useSaveAction();
  const people = data.employees.filter((e) =>
    project ? project.employeeIds.includes(e.id) : true,
  );
  function openCreate() {
    setName("");
    setError("");
    setCreating(true);
  }

  function closeAction() {
    setAction(null);
    setArchivedTarget(null);
  }

  const target = archivedTarget ?? project;
  return (
    <>
      <div className="card project-navigation erp-project-controls">
        <div className="project-picker">
          <button
            className={!project ? "project-all selected" : "project-all"}
            aria-pressed={!project}
            onClick={() => workspace.selectProject(null)}
          >
            <Layers3 size={14} />
            Все проекты
          </button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Добавить проект"
            onClick={openCreate}
          >
            <Plus size={17} />
          </Button>
          {!!archivedProjects.length && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Архив проектов"
              onClick={() => setArchivedOpen(true)}
            >
              <Archive size={17} />
            </Button>
          )}
        </div>
        <div className="project-list" aria-label="Проекты">
          {activeProjects.map((p, i) => (
            <button
              key={p.id}
              className={`project-choice project-color-${i % 4}${p.id === project?.id ? " selected" : ""}`}
              title={p.name}
              aria-pressed={p.id === project?.id}
              onClick={() => workspace.selectProject(p.id)}
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
          <button onClick={() => setMembers(true)}>
            <Users size={16} />
            Ответственные<span>{people.length}</span>
          </button>
          <Link to={`/erp/tasks?view=backlog${suffix}`}>
            <ListTodo size={16} />
            Бэклог
            <span>
              {
                projectTasks(tasks, undefined, "backlog").filter((t) => !t.done)
                  .length
              }
            </span>
          </Link>
          <Link to={`/erp/tasks?view=sprint${suffix}`}>
            <Zap size={16} />
            Спринт недели
            <span>
              {
                projectTasks(tasks, undefined, "sprint").filter((t) => !t.done)
                  .length
              }
            </span>
          </Link>
          {project && (
            <Menu
              label="Управление проектом"
              trigger={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Управление проектом"
                >
                  <MoreHorizontal size={17} />
                </Button>
              }
              items={[
                {
                  label: "Редактировать проект",
                  onClick: () => {
                    setName(project.name);
                    setError("");
                    setAction("rename");
                  },
                },
                {
                  label: "Архивировать проект",
                  onClick: () => setAction("archive"),
                },
                { label: "Удалить проект", onClick: () => setAction("delete") },
              ]}
            />
          )}
        </nav>
      </div>
      {showEmpty && (
        <section
          className="card nova-project-empty"
          aria-label={project ? "Пустой проект" : "Пустой список проектов"}
        >
          <div className="nova-project-empty-art" aria-hidden="true">
            <FolderOpen size={40} strokeWidth={1.4} />
          </div>
          <h2>{project ? "Проект пока пуст" : "Проектов пока нет"}</h2>
          <p>
            {project
              ? "Добавьте первую задачу, чтобы начать работу."
              : "Создайте проект, чтобы собрать задачи и ответственных в одном месте."}
          </p>
          {project ? (
            <Button asChild>
              <Link to={`/erp/tasks?create=1${suffix}`}>
                <Plus size={16} /> Добавить задачу
              </Link>
            </Button>
          ) : (
            <Button onClick={openCreate}>
              <Plus size={16} /> Создать проект
            </Button>
          )}
        </section>
      )}
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="Новый проект"
        description="Название и ответственный — всё, что нужно для начала."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save.run(
              () => {
                try {
                  workspace.addProject(name, employee);
                  setError("");
                } catch (err) {
                  setError(
                    (err as Error).message.includes("Выберите")
                      ? "Выберите ответственного"
                      : "Название проекта: от 2 до 60 символов",
                  );
                  return false;
                }
              },
              () => setCreating(false),
            );
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
            <SaveButton status={save.status}>Создать проект</SaveButton>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={archivedOpen}
        onOpenChange={setArchivedOpen}
        title="Архив проектов"
      >
        <ul className="dialog-body nova-archive-list">
          {archivedProjects.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  workspace.archiveProject(item.id, false);
                  workspace.selectProject(item.id);
                  setArchivedOpen(false);
                  toast.success("Проект восстановлен");
                }}
              >
                Восстановить
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setArchivedOpen(false);
                  setArchivedTarget(item);
                  setAction("delete");
                }}
              >
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      </Dialog>
      {target && (
        <Dialog
          open={action !== null}
          onOpenChange={(open) => {
            if (!open) closeAction();
          }}
          title={
            action === "rename"
              ? "Редактировать проект"
              : action === "archive"
                ? "Архивировать проект?"
                : "Удалить проект?"
          }
          description={
            action === "archive"
              ? `«${target.name}» можно вернуть из архива. Удерживайте кнопку для подтверждения.`
              : action === "delete"
                ? `«${target.name}» исчезнет из проектов. Задачи и сделки останутся в ERP. Удерживайте кнопку для подтверждения.`
                : "Удерживайте кнопку, чтобы подтвердить новое название."
          }
        >
          {action === "rename" && (
            <div className="dialog-body">
              <Field label="Название проекта" error={error}>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                />
              </Field>
            </div>
          )}
          <div className="dialog-footer">
            <Button type="button" variant="outline" onClick={closeAction}>
              Отмена
            </Button>
            <HoldButton
              danger={action === "delete"}
              onConfirm={() => {
                if (action === "rename") {
                  try {
                    workspace.renameProject(target.id, name);
                  } catch {
                    setError("Название проекта: от 2 до 60 символов");
                    return;
                  }
                } else if (action === "archive") {
                  workspace.archiveProject(target.id, true);
                } else if (action === "delete") {
                  workspace.deleteProject(target.id);
                }
                closeAction();
                toast.success(
                  action === "rename"
                    ? "Название обновлено"
                    : action === "archive"
                      ? "Проект в архиве"
                      : "Проект удалён",
                );
              }}
            >
              {action === "rename"
                ? "Сохранить название"
                : action === "archive"
                  ? "Архивировать проект"
                  : "Удалить проект"}
            </HoldButton>
          </div>
        </Dialog>
      )}
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
