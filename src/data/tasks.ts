import type { Data, Task } from "./schema";

export type TaskStatus = "active" | "overdue" | "done" | "all";
export type TaskSort = "due" | "status" | "priority" | "employee";
export interface TaskFilters {
  search: string;
  status: TaskStatus;
  department: string;
  employee: string;
  sort: TaskSort;
}
export const defaultTaskFilters: TaskFilters = {
  search: "",
  status: "active",
  department: "all",
  employee: "all",
  sort: "due",
};
export function taskStatus(
  task: Task,
  date: string,
): Exclude<TaskStatus, "all"> {
  return task.done ? "done" : task.dueAt < date ? "overdue" : "active";
}
export function filterTasks(
  data: Pick<Data, "tasks" | "employees">,
  filters: TaskFilters,
  date: string,
) {
  const query = filters.search.trim().toLocaleLowerCase("ru");
  const employeeNames = new Map(
    data.employees.map((employee) => [employee.id, employee.name]),
  );
  const statusRank = { overdue: 0, active: 1, done: 2 };
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return data.tasks
    .filter(
      (task) =>
        (filters.status === "all" ||
          (filters.status === "active"
            ? !task.done
            : taskStatus(task, date) === filters.status)) &&
        (filters.department === "all" ||
          task.department === filters.department) &&
        (filters.employee === "all" || task.employeeId === filters.employee) &&
        task.title.toLocaleLowerCase("ru").includes(query),
    )
    .sort((a, b) => {
      const primary =
        filters.sort === "status"
          ? statusRank[taskStatus(a, date)] - statusRank[taskStatus(b, date)]
          : filters.sort === "priority"
            ? priorityRank[a.priority] - priorityRank[b.priority]
            : filters.sort === "employee"
              ? (employeeNames.get(a.employeeId) ?? "").localeCompare(
                  employeeNames.get(b.employeeId) ?? "",
                  "ru",
                )
              : Number(a.done) - Number(b.done);
      return (
        primary ||
        a.dueAt.localeCompare(b.dueAt) ||
        a.title.localeCompare(b.title, "ru")
      );
    });
}
