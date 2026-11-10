import { z } from "zod";

export const dashboardWidgets = {
  deals: { label: "Доска сделок", columns: 12, compactColumns: 12 },
  tasks: { label: "Задачи команды", columns: 4, compactColumns: 6 },
  progress: { label: "Прогресс команды", columns: 4, compactColumns: 6 },
  events: { label: "События", columns: 4, compactColumns: 6 },
  calendar: { label: "Календарь", columns: 4, compactColumns: 6 },
  finance: { label: "Финансовая динамика", columns: 8, compactColumns: 12 },
  overview: { label: "Обзор бизнеса", columns: 12, compactColumns: 12 },
  orders: { label: "Последние заказы", columns: 12, compactColumns: 12 },
  shortcuts: { label: "Рабочие разделы", columns: 6, compactColumns: 12 },
  profile: { label: "Мой профиль", columns: 3, compactColumns: 6 },
  message: { label: "Быстрое сообщение", columns: 3, compactColumns: 6 },
  learning: { label: "Обучение", columns: 4, compactColumns: 6 },
} as const;

export type DashboardWidgetId = keyof typeof dashboardWidgets;
const ids = Object.keys(dashboardWidgets) as DashboardWidgetId[];
const widgetSchema = z.object({
  id: z.enum(ids),
  mode: z.enum(["open", "collapsed", "hidden"]),
});
export type DashboardWidget = z.infer<typeof widgetSchema>;
export const defaultDashboardLayout: DashboardWidget[] = ids.map((id) => ({
  id,
  mode: id === "learning" ? "hidden" : "open",
}));

export const dashboardLayoutSchema = z
  .array(z.unknown())
  .catch([])
  .default([])
  .transform((entries) => {
    const widgets = new Map<DashboardWidgetId, DashboardWidget>();
    for (const entry of [...entries, ...defaultDashboardLayout]) {
      const parsed = widgetSchema.safeParse(entry);
      if (parsed.success && !widgets.has(parsed.data.id))
        widgets.set(parsed.data.id, parsed.data);
    }
    return [...widgets.values()];
  });
