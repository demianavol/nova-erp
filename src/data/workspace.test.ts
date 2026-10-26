import { describe, expect, it } from "vitest";
import { seedData } from "./seed";
import { enrichDemoWorkspace } from "./demo-activities";
import {
  initialWorkspace,
  projectTasks,
  sprintRange,
  useWorkspace,
} from "./workspace";

describe("Проекты и рабочее пространство", () => {
  it("добавляет демособытия в старый набор без дубликатов и сброса записей", () => {
    const data = seedData("2026-10-26");
    data.activities = data.activities.filter((a) => !a.demo);
    for (const deal of data.deals) delete deal.priority;
    data.orders[0].notes = "Сохранённый пользовательский комментарий";
    const orders = JSON.stringify(data.orders);
    enrichDemoWorkspace(data);
    const eventCount = data.activities.length;
    enrichDemoWorkspace(data);
    expect(data.activities.length).toBe(eventCount);
    expect(eventCount).toBeGreaterThan(12);
    expect(new Set(data.activities.map((a) => a.id)).size).toBe(eventCount);
    expect(JSON.stringify(data.orders)).toBe(orders);
    expect(data.deals.every((d) => !!d.priority)).toBe(true);
  });
  it("сохраняет выбранный пользователем приоритет сделки при обновлении демоленты", () => {
    const data = seedData("2026-10-26");
    data.deals[0].priority = "low";
    enrichDemoWorkspace(data);
    expect(data.deals[0].priority).toBe("low");
    expect(
      data.activities
        .filter((a) => a.demo)
        .every(
          (a) =>
            data.tasks.some((t) => t.id === a.entityId) ||
            data.deals.some((d) => d.id === a.entityId),
        ),
    ).toBe(true);
  });
  it("связывает исходные проекты с существующими задачами, сотрудниками и сделками", () => {
    const data = seedData("2026-10-26");
    const workspace = initialWorkspace(data);
    expect(workspace.projects.flatMap((p) => p.taskIds).sort()).toEqual(
      data.tasks.map((t) => t.id).sort(),
    );
    expect(workspace.projects.flatMap((p) => p.dealIds).sort()).toEqual(
      data.deals.map((d) => d.id).sort(),
    );
    expect(
      workspace.projects.every((p) =>
        p.employeeIds.every((id) => data.employees.some((e) => e.id === id)),
      ),
    ).toBe(true);
  });
  it("разделяет задачи выбранного проекта на спринт недели и бэклог", () => {
    const data = seedData("2026-10-26"),
      project = initialWorkspace(data).projects[0];
    expect(sprintRange("2026-10-28")).toEqual({
      from: "2026-10-26",
      to: "2026-11-01",
    });
    const sprint = projectTasks(data.tasks, project, "sprint", "2026-10-28");
    const backlog = projectTasks(data.tasks, project, "backlog", "2026-10-28");
    expect([...sprint, ...backlog].map((t) => t.id).sort()).toEqual(
      project.taskIds.slice().sort(),
    );
    expect(sprint.some((t) => backlog.some((b) => b.id === t.id))).toBe(false);
  });
  it("создаёт проект и сохраняет уникальные связи и просмотренные события", () => {
    const original = useWorkspace.getState();
    try {
      const id = original.addProject("Запуск коллекции", "e1");
      useWorkspace.getState().attach(id, "taskIds", "t1");
      useWorkspace.getState().attach(id, "taskIds", "t1");
      useWorkspace.getState().readActivities(["a1", "a1"]);
      expect(useWorkspace.getState().selectedProjectId).toBe(id);
      expect(
        useWorkspace.getState().projects.find((p) => p.id === id),
      ).toMatchObject({
        name: "Запуск коллекции",
        employeeIds: ["e1"],
        taskIds: ["t1"],
      });
      expect(
        useWorkspace.getState().readActivityIds.filter((id) => id === "a1"),
      ).toHaveLength(1);
      expect(() => original.addProject("X", "e1")).toThrow();
    } finally {
      useWorkspace.setState(original);
    }
  });
});
