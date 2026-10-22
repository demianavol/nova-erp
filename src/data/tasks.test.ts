import { describe, expect, it } from "vitest";
import { seedData } from "./seed";
import { defaultTaskFilters, filterTasks, taskStatus } from "./tasks";

const date = "2026-10-22";
const seed = seedData(date);
const base = seed.tasks[0];
const data = {
  employees: seed.employees,
  tasks: [
    {
      ...base,
      id: "done",
      title: "Готовая задача",
      done: true,
      dueAt: "2026-10-20",
      priority: "low" as const,
    },
    {
      ...base,
      id: "today",
      title: "Сегодня",
      done: false,
      dueAt: date,
      priority: "high" as const,
    },
    {
      ...base,
      id: "late",
      title: "Поставка",
      done: false,
      dueAt: "2026-10-21",
      priority: "medium" as const,
    },
    {
      ...base,
      id: "other",
      title: "Реклама",
      employeeId: "e2",
      department: "marketing" as const,
      done: false,
      dueAt: "2026-10-23",
      priority: "low" as const,
    },
  ],
};

describe("Выборка задач", () => {
  it("считает сегодняшний срок активным, а завершённую задачу не считает просроченной", () => {
    expect(data.tasks.map((task) => taskStatus(task, date))).toEqual([
      "done",
      "active",
      "overdue",
      "active",
    ]);
    expect(
      filterTasks(data, { ...defaultTaskFilters, status: "overdue" }, date).map(
        (task) => task.id,
      ),
    ).toEqual(["late"]);
  });
  it("одновременно применяет статус, отдел, сотрудника и поиск", () => {
    expect(
      filterTasks(
        data,
        {
          ...defaultTaskFilters,
          department: base.department,
          employee: base.employeeId,
          search: "  ПОСТАВКА  ",
        },
        date,
      ).map((task) => task.id),
    ).toEqual(["late"]);
    expect(
      filterTasks(
        data,
        { ...defaultTaskFilters, department: "marketing", employee: "missing" },
        date,
      ),
    ).toEqual([]);
  });
  it("сортирует сначала просроченные, затем активные и завершённые, не меняя исходные данные", () => {
    const original = data.tasks.map((task) => task.id);
    expect(
      filterTasks(
        data,
        { ...defaultTaskFilters, status: "all", sort: "status" },
        date,
      ).map((task) => task.id),
    ).toEqual(["late", "today", "other", "done"]);
    expect(data.tasks.map((task) => task.id)).toEqual(original);
  });
  it("сортирует по приоритету и имени сотрудника", () => {
    expect(
      filterTasks(data, { ...defaultTaskFilters, sort: "priority" }, date).map(
        (task) => task.id,
      ),
    ).toEqual(["today", "late", "other"]);
    const names = new Map(
      seed.employees.map((employee) => [employee.id, employee.name]),
    );
    const sorted = filterTasks(
      data,
      { ...defaultTaskFilters, status: "all", sort: "employee" },
      date,
    ).map((task) => names.get(task.employeeId)!);
    expect(sorted).toEqual(
      [...sorted].sort((a, b) => a.localeCompare(b, "ru")),
    );
  });
});
