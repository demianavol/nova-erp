import type { Data } from "./schema";
import { shiftDate } from "../lib/utils";

/** Idempotent demo upgrade; existing records, edits and event IDs are preserved. */
export function enrichDemoWorkspace(data: Data): Data {
  for (const deal of data.deals) {
    if (!deal.priority) {
      const index = /^d\d+$/.test(deal.id) ? Number(deal.id.slice(1)) - 1 : 1;
      deal.priority = (["high", "medium", "low"] as const)[index % 3];
    }
  }
  const events: Data["activities"] = [];
  for (const [i, deal] of data.deals
    .filter((d) => /^d\d+$/.test(d.id))
    .slice(0, 8)
    .entries()) {
    const person = data.employees.find((e) => e.id === deal.managerId);
    events.push({
      id: `demo-board-deal-${deal.id}`,
      title: `${person?.name || "Команда"} · обновление сделки «${deal.title}»`,
      entityId: deal.id,
      route: `/sales/pipeline?open=${deal.id}`,
      type: "deal",
      createdAt: `${shiftDate(data.seededAt, -Math.floor(i / 4))}T${String(9 - (i % 4)).padStart(2, "0")}:20:00Z`,
      demo: true,
    });
  }
  for (const [i, task] of data.tasks
    .filter((t) => /^t\d+$/.test(t.id))
    .slice(0, 8)
    .entries()) {
    const person = data.employees.find((e) => e.id === task.employeeId);
    events.push({
      id: `demo-board-task-${task.id}`,
      title: `${person?.name || "Команда"} · ${task.done ? "задача завершена" : "назначена задача"} «${task.title}»`,
      entityId: task.id,
      route: `/tasks?open=${task.id}`,
      type: "task",
      createdAt: `${shiftDate(data.seededAt, -Math.floor(i / 4))}T${String(9 - (i % 4)).padStart(2, "0")}:05:00Z`,
      demo: true,
    });
  }
  const existing = new Set(data.activities.map((a) => a.id));
  data.activities = [
    ...data.activities,
    ...events.filter((a) => !existing.has(a.id)),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return data;
}
