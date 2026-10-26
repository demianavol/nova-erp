import { create } from "zustand";
import { z } from "zod";
import { useERP } from "./store";
import { today, shiftDate, uid } from "../lib/utils";
import type { Data, Task } from "./schema";

const projectSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(60),
  employeeIds: z.array(z.string()),
  taskIds: z.array(z.string()),
  dealIds: z.array(z.string()),
});
const workspaceSchema = z.object({
  projects: z.array(projectSchema),
  selectedProjectId: z.string().nullable(),
  readActivityIds: z.array(z.string()),
});
export type WorkspaceProject = z.infer<typeof projectSchema>;
type WorkspaceData = z.infer<typeof workspaceSchema>;
export const WORKSPACE_KEY = "nova-workspace-v1";

export function initialWorkspace(data: Data): WorkspaceData {
  return {
    selectedProjectId: null,
    readActivityIds: [],
    projects: [
      { id: "project-sales", name: "Развитие продаж", departments: ["sales"] },
      {
        id: "project-operations",
        name: "Каталог и поставки",
        departments: ["purchasing", "warehouse"],
      },
      {
        id: "project-growth",
        name: "Команда и продвижение",
        departments: ["marketing", "finance", "team"],
      },
    ].map((p, i) => ({
      id: p.id,
      name: p.name,
      employeeIds: data.employees
        .filter((e) => p.departments.includes(e.department))
        .map((e) => e.id),
      taskIds: data.tasks
        .filter((t) => p.departments.includes(t.department))
        .map((t) => t.id),
      dealIds: i === 0 ? data.deals.map((d) => d.id) : [],
    })),
  };
}

export function sprintRange(anchor = today()) {
  const weekday = new Date(`${anchor}T12:00:00Z`).getUTCDay();
  const from = shiftDate(anchor, -((weekday + 6) % 7));
  return { from, to: shiftDate(from, 6) };
}
export function projectTasks(
  tasks: Task[],
  project?: WorkspaceProject,
  view?: string,
  anchor = today(),
) {
  const range = sprintRange(anchor);
  return tasks.filter(
    (t) =>
      (!project || project.taskIds.includes(t.id)) &&
      (view === "sprint"
        ? t.dueAt >= range.from && t.dueAt <= range.to
        : view === "backlog"
          ? t.dueAt < range.from || t.dueAt > range.to
          : true),
  );
}

function loadWorkspace(): WorkspaceData {
  try {
    const raw =
      typeof localStorage !== "undefined" &&
      localStorage.getItem(WORKSPACE_KEY);
    if (raw) return workspaceSchema.parse(JSON.parse(raw));
  } catch {
    /* Existing ERP records remain independent of workspace preferences. */
  }
  return initialWorkspace(useERP.getState().data);
}
function persist(value: WorkspaceData) {
  try {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify(workspaceSchema.parse(value)),
      );
  } catch {
    useERP.setState({
      storageError:
        "Не удалось сохранить проекты и просмотренные события. Изменения доступны до закрытия вкладки.",
    });
  }
}

export const useWorkspace = create<
  WorkspaceData & {
    selectProject: (id: string | null) => void;
    addProject: (name: string, employeeId: string) => string;
    attach: (
      projectId: string,
      kind: "taskIds" | "dealIds",
      id: string,
    ) => void;
    readActivities: (ids: string[]) => void;
  }
>((set, get) => {
  const update = (patch: Partial<WorkspaceData>) => {
    const next = { ...get(), ...patch };
    persist(next);
    set(patch);
  };
  return {
    ...loadWorkspace(),
    selectProject: (id) =>
      update({
        selectedProjectId: get().projects.some((p) => p.id === id) ? id : null,
      }),
    addProject(name, employeeId) {
      if (!useERP.getState().data.employees.some((e) => e.id === employeeId))
        throw new Error("Выберите ответственного");
      const project = projectSchema.parse({
        id: uid("project"),
        name,
        employeeIds: [employeeId],
        taskIds: [],
        dealIds: [],
      });
      update({
        projects: [...get().projects, project],
        selectedProjectId: project.id,
      });
      return project.id;
    },
    attach(projectId, kind, id) {
      const data = useERP.getState().data;
      const member =
        kind === "taskIds"
          ? data.tasks.find((t) => t.id === id)?.employeeId
          : data.deals.find((d) => d.id === id)?.managerId;
      update({
        projects: get().projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                [kind]: [...new Set([...p[kind], id])],
                employeeIds: member
                  ? [...new Set([...p.employeeIds, member])]
                  : p.employeeIds,
              }
            : p,
        ),
      });
    },
    readActivities: (ids) =>
      update({
        readActivityIds: [...new Set([...get().readActivityIds, ...ids])].slice(
          -1000,
        ),
      }),
  };
});
