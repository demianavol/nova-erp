import { z } from "zod";

export const departments = [
  "sales",
  "marketing",
  "purchasing",
  "warehouse",
  "finance",
  "team",
] as const;
export const departmentNames: Record<string, string> = {
  sales: "Продажи",
  marketing: "Маркетинг",
  purchasing: "Закупки",
  warehouse: "Склад",
  finance: "Финансы",
  team: "Команда",
};
export const channels = ["Сайт", "Ozon", "Wildberries", "B2B"] as const;
export const stages = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export const stageNames: Record<Stage, string> = {
  new: "Новые лиды",
  qualified: "Квалификация",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Выиграно",
  lost: "Проиграно",
};
export const paymentNames = { unpaid: "Ожидает оплаты", paid: "Оплачен" };
export const shippingNames = {
  new: "Новый",
  processing: "В сборке",
  shipped: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
};
const id = z.string().min(1);
const day = z.iso.date();
const cents = z.number().int().min(0).max(1_000_000_000);
export const financialSettingsSchema = z.object({
  costRatio: z.number().min(0).max(1),
  commissionRates: z.object({
    Сайт: z.number().min(0).max(1),
    Ozon: z.number().min(0).max(1),
    Wildberries: z.number().min(0).max(1),
    B2B: z.number().min(0).max(1),
  }),
  fulfillmentPerOrder: cents,
  monthlyExpenses: z.object({
    payroll: cents,
    rent: cents,
    marketing: cents,
    services: cents,
  }),
});
export type FinancialSettings = z.infer<typeof financialSettingsSchema>;
export const defaultFinancialSettings: FinancialSettings = {
  costRatio: 0.55,
  commissionRates: { Сайт: 0.025, Ozon: 0.18, Wildberries: 0.2, B2B: 0.015 },
  fulfillmentPerOrder: 39000,
  monthlyExpenses: {
    payroll: 18000000,
    rent: 4500000,
    marketing: 3500000,
    services: 1500000,
  },
};
const employeeSchema = z.object({
  id,
  name: z.string().min(2),
  role: z.string(),
  department: z.enum(departments),
  color: z.string(),
});
const productSchema = z.object({
  id,
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  price: cents,
  stock: z.number().int().nonnegative(),
  color: z.string(),
});
export const customerInputSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа"),
  email: z.email("Проверьте email"),
  phone: z
    .string()
    .regex(/^\+?[\d\s()\-]{10,20}$/, "Укажите корректный телефон"),
  city: z.string().trim().min(2, "Укажите город"),
  segment: z.enum(["Новый", "Постоянный", "VIP", "B2B"]),
  managerId: id,
  notes: z.string().max(3000),
});
const customerSchema = customerInputSchema.extend({ id, createdAt: day });
export const lineSchema = z.object({
  productId: id,
  quantity: z.number().int().min(1).max(999),
  unitPrice: cents,
});
export const orderInputSchema = z
  .object({
    customerId: id,
    managerId: id,
    channel: z.enum(channels),
    items: z.array(lineSchema).min(1, "Добавьте хотя бы один товар"),
    discount: cents,
    shippingCost: cents,
    payment: z.enum(["unpaid", "paid"]),
    shipping: z.enum([
      "new",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    notes: z.string().max(3000),
  })
  .refine(
    (x) =>
      x.discount <= x.items.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    { message: "Скидка превышает стоимость товаров", path: ["discount"] },
  );
const orderSchema = orderInputSchema.safeExtend({
  id,
  number: z.string(),
  createdAt: day,
  updatedAt: z.string(),
  dealId: z.string().optional(),
});
export const dealInputSchema = z.object({
  title: z.string().trim().min(3, "Минимум 3 символа"),
  customerId: id,
  managerId: id,
  channel: z.enum(channels),
  stage: z.enum(stages),
  priority: z.enum(["low", "medium", "high"]).optional(),
  expectedAt: day,
  items: z.array(lineSchema).min(1, "Добавьте товары"),
  notes: z.string().max(3000),
});
const dealSchema = dealInputSchema.extend({
  id,
  createdAt: day,
  orderId: z.string().optional(),
});
export const taskInputSchema = z.object({
  title: z.string().trim().min(3, "Минимум 3 символа"),
  employeeId: id,
  department: z.enum(departments),
  dueAt: day,
  priority: z.enum(["low", "medium", "high"]),
  done: z.boolean(),
  notes: z.string().max(3000),
});
const taskSchema = taskInputSchema.extend({ id, createdAt: day });
const notificationSchema = z.object({
  id,
  title: z.string(),
  description: z.string(),
  read: z.boolean(),
  route: z.string(),
  createdAt: z.string(),
  type: z.enum(["order", "deal", "task", "system"]),
});
const activitySchema = z.object({
  id,
  title: z.string(),
  entityId: z.string(),
  route: z.string(),
  createdAt: z.string(),
  type: z.enum(["order", "deal", "customer", "task", "system"]),
  demo: z.boolean().optional(),
});
export const dataSchema = z.object({
  version: z.literal(1),
  finance: financialSettingsSchema.optional(),
  seededAt: day,
  employees: z.array(employeeSchema).min(1),
  products: z.array(productSchema).min(1),
  customers: z.array(customerSchema),
  orders: z.array(orderSchema),
  deals: z.array(dealSchema),
  tasks: z.array(taskSchema),
  notifications: z.array(notificationSchema),
  activities: z.array(activitySchema),
});
export type Data = z.infer<typeof dataSchema>;
export type Employee = Data["employees"][number];
export type Product = Data["products"][number];
export type Customer = Data["customers"][number];
export type Order = Data["orders"][number];
export type Deal = Data["deals"][number];
export type Task = Data["tasks"][number];
export type Stage = (typeof stages)[number];
export type OrderInput = z.infer<typeof orderInputSchema>;
export type CustomerInput = z.infer<typeof customerInputSchema>;
export type DealInput = z.infer<typeof dealInputSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;

export function validateData(value: unknown): Data {
  const data = dataSchema.parse(value);
  const has = (list: { id: string }[], key: string) =>
    list.some((x) => x.id === key);
  const unique = (list: { id: string }[]) =>
    new Set(list.map((x) => x.id)).size === list.length;
  if (
    ![
      data.employees,
      data.products,
      data.customers,
      data.orders,
      data.deals,
      data.tasks,
      data.notifications,
      data.activities,
    ].every(unique)
  )
    throw new Error("Повторяющиеся идентификаторы");
  for (const customer of data.customers)
    if (!has(data.employees, customer.managerId))
      throw new Error("Неизвестный менеджер");
  for (const entity of [...data.orders, ...data.deals]) {
    if (
      !has(data.customers, entity.customerId) ||
      !has(data.employees, entity.managerId) ||
      entity.items.some((x) => !has(data.products, x.productId))
    )
      throw new Error("Повреждены связи данных");
  }
  for (const task of data.tasks)
    if (!has(data.employees, task.employeeId))
      throw new Error("Неизвестный исполнитель");
  for (const deal of data.deals)
    if (
      deal.orderId &&
      !data.orders.some((o) => o.id === deal.orderId && o.dealId === deal.id)
    )
      throw new Error("Повреждена связь сделки");
  for (const order of data.orders)
    if (
      order.dealId &&
      !data.deals.some((d) => d.id === order.dealId && d.orderId === order.id)
    )
      throw new Error("Повреждена связь заказа");
  return data;
}
