import { create } from "zustand";
import { z } from "zod";
import { seedData } from "./seed";
import { enrichDemoWorkspace } from "./demo-activities";
import {
  validateData,
  customerInputSchema,
  orderInputSchema,
  dealInputSchema,
  taskInputSchema,
  type Data,
  type CustomerInput,
  type OrderInput,
  type DealInput,
  type TaskInput,
  type Stage,
  financialSettingsSchema,
  type FinancialSettings,
} from "./schema";
import { today, uid } from "../lib/utils";

export const DATA_KEY = "nova-erp-data-v1";
export const SESSION_KEY = "nova-session";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function loadData(storage?: StorageLike): {
  data: Data;
  error: string | null;
} {
  if (!storage) return { data: seedData(), error: null };
  try {
    const raw = storage.getItem(DATA_KEY);
    return {
      data: raw
        ? enrichDemoWorkspace(validateData(JSON.parse(raw)))
        : seedData(),
      error: null,
    };
  } catch {
    return {
      data: seedData(),
      error:
        "Сохранённые данные недоступны или повреждены. Загружена демоверсия. Сбросьте данные в настройках, чтобы начать заново.",
    };
  }
}
export function persistData(data: Data, storage: StorageLike): string | null {
  try {
    storage.setItem(DATA_KEY, JSON.stringify(data));
    return null;
  } catch {
    return "Не удалось сохранить изменения в браузере. Данные доступны до закрытия вкладки. Проверьте свободное место и доступ к localStorage.";
  }
}
const browserStorage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
};
const initial = loadData(browserStorage());

export function createOrderFromDeal(data: Data, dealId: string): string {
  const deal = data.deals.find((d) => d.id === dealId);
  if (!deal || deal.stage !== "won")
    throw new Error("Создать заказ можно только из выигранной сделки");
  if (deal.orderId) return deal.orderId;
  const existing = data.orders.find((o) => o.dealId === dealId);
  if (existing) {
    deal.orderId = existing.id;
    return existing.id;
  }
  const orderId = uid("order");
  const nextNumber =
    Math.max(
      10480,
      ...data.orders.map((o) => Number(o.number.split("-")[1]) || 0),
    ) + 1;
  data.orders.unshift({
    id: orderId,
    number: `NV-${nextNumber}`,
    customerId: deal.customerId,
    managerId: deal.managerId,
    channel: deal.channel,
    items: structuredClone(deal.items),
    discount: 0,
    shippingCost: 0,
    payment: "unpaid",
    shipping: "new",
    notes: deal.notes,
    createdAt: today(),
    updatedAt: new Date().toISOString(),
    dealId,
  });
  deal.orderId = orderId;
  return orderId;
}

type Store = {
  data: Data;
  storageError: string | null;
  saveCustomer: (input: CustomerInput, id?: string) => string;
  saveOrder: (input: OrderInput, id?: string) => string;
  saveDeal: (input: DealInput, id?: string) => string;
  moveDeal: (id: string, stage: Stage) => void;
  convertDeal: (id: string) => string;
  saveTask: (input: TaskInput, id?: string) => string;
  toggleTask: (id: string) => void;
  readNotification: (id?: string) => void;
  resetData: () => void;
  saveFinance: (input: FinancialSettings) => void;
};
export const useERP = create<Store>((set, get) => {
  function mutate(
    recipe: (data: Data) => void,
    event?: {
      title: string;
      entityId: string;
      route: string;
      type: Data["activities"][number]["type"];
    },
    notify = false,
  ) {
    const data = structuredClone(get().data);
    recipe(data);
    if (event) {
      data.activities.unshift({
        ...event,
        id: uid("activity"),
        createdAt: new Date().toISOString(),
      });
      data.activities = data.activities.slice(0, 300);
      if (notify)
        data.notifications.unshift({
          id: uid("notification"),
          title: event.title,
          description: "Нажмите, чтобы открыть запись",
          route: event.route,
          read: false,
          createdAt: new Date().toISOString(),
          type:
            event.type === "order" ||
            event.type === "deal" ||
            event.type === "task"
              ? event.type
              : "system",
        });
    }
    validateData(data);
    const storage = browserStorage();
    set({
      data,
      storageError: storage
        ? persistData(data, storage)
        : "Хранилище браузера недоступно. Изменения сохраняются только до закрытия вкладки.",
    });
  }
  return {
    ...initial,
    storageError: initial.error,
    saveFinance(input) {
      const value = financialSettingsSchema.parse(input);
      mutate(
        (data) => {
          data.finance = value;
        },
        {
          title: "Обновлены допущения финансовой модели",
          entityId: "finance",
          route: "/departments/finance",
          type: "system",
        },
      );
    },
    saveCustomer(input, entityId) {
      const value = customerInputSchema.parse(input),
        id = entityId || uid("customer");
      mutate(
        (data) => {
          const index = data.customers.findIndex((c) => c.id === id);
          if (index >= 0)
            data.customers[index] = { ...data.customers[index], ...value };
          else data.customers.unshift({ ...value, id, createdAt: today() });
        },
        {
          title: `${entityId ? "Обновлён" : "Добавлен"} клиент ${value.name}`,
          entityId: id,
          route: `/sales/customers?open=${id}`,
          type: "customer",
        },
      );
      return id;
    },
    saveOrder(input, entityId) {
      const value = orderInputSchema.parse(input),
        id = entityId || uid("order");
      mutate(
        (data) => {
          const index = data.orders.findIndex((o) => o.id === id);
          if (index >= 0)
            data.orders[index] = {
              ...data.orders[index],
              ...value,
              updatedAt: new Date().toISOString(),
            };
          else {
            const next =
              Math.max(
                10480,
                ...data.orders.map((o) => Number(o.number.split("-")[1]) || 0),
              ) + 1;
            data.orders.unshift({
              ...value,
              id,
              number: `NV-${next}`,
              createdAt: today(),
              updatedAt: new Date().toISOString(),
            });
          }
        },
        {
          title: entityId ? "Изменён заказ" : "Создан новый заказ",
          entityId: id,
          route: `/sales/orders?open=${id}`,
          type: "order",
        },
        true,
      );
      return id;
    },
    saveDeal(input, entityId) {
      const value = dealInputSchema.parse(input),
        id = entityId || uid("deal");
      mutate(
        (data) => {
          const index = data.deals.findIndex((d) => d.id === id);
          if (index >= 0)
            data.deals[index] = { ...data.deals[index], ...value };
          else data.deals.unshift({ ...value, id, createdAt: today() });
        },
        {
          title: `${entityId ? "Обновлена" : "Создана"} сделка «${value.title}»`,
          entityId: id,
          route: `/sales/pipeline?open=${id}`,
          type: "deal",
        },
        value.stage === "won",
      );
      return id;
    },
    moveDeal(id, stage) {
      const deal = get().data.deals.find((d) => d.id === id);
      if (!deal || deal.stage === stage) return;
      get().saveDeal({ ...deal, stage }, id);
    },
    convertDeal(id) {
      const existing = get().data.deals.find((d) => d.id === id)?.orderId;
      if (existing) return existing;
      let result = "";
      mutate(
        (data) => {
          result = createOrderFromDeal(data, id);
          data.activities.unshift({
            id: uid("activity"),
            title: "Заказ создан из выигранной сделки",
            entityId: result,
            route: `/sales/orders?open=${result}`,
            type: "order",
            createdAt: new Date().toISOString(),
          });
        },
        {
          title: "Из выигранной сделки создан заказ",
          entityId: id,
          route: `/sales/pipeline?open=${id}`,
          type: "deal",
        },
        true,
      );
      return result;
    },
    saveTask(input, entityId) {
      const value = taskInputSchema.parse(input),
        id = entityId || uid("task");
      mutate(
        (data) => {
          const index = data.tasks.findIndex((t) => t.id === id);
          if (index >= 0)
            data.tasks[index] = { ...data.tasks[index], ...value };
          else data.tasks.unshift({ ...value, id, createdAt: today() });
        },
        {
          title: `${value.done ? "Завершена" : entityId ? "Обновлена" : "Создана"} задача «${value.title}»`,
          entityId: id,
          route: `/tasks?open=${id}`,
          type: "task",
        },
      );
      return id;
    },
    toggleTask(id) {
      const task = get().data.tasks.find((t) => t.id === id);
      if (task) get().saveTask({ ...task, done: !task.done }, id);
    },
    readNotification(id) {
      mutate((data) => {
        data.notifications = data.notifications.map((n) =>
          !id || n.id === id ? { ...n, read: true } : n,
        );
      });
    },
    resetData() {
      const data = seedData();
      const storage = browserStorage();
      set({
        data,
        storageError: storage
          ? persistData(data, storage)
          : "Хранилище браузера недоступно",
      });
    },
  };
});

const preferencesSchema = z.object({
  // Accept saved light preferences while keeping the interface dark-only.
  theme: z.enum(["light", "dark"]).transform(() => "dark" as const),
  collapsed: z.boolean(),
  name: z.string().trim().min(2).max(60),
  email: z.email(),
  role: z.string().min(2).max(80),
  welcomeHidden: z.boolean().default(false),
  promoHidden: z.boolean().default(false),
});
type Preferences = z.infer<typeof preferencesSchema>;
const defaults: Preferences = {
  theme: "dark",
  collapsed: false,
  name: "Али Бабаев",
  email: "demo@nova.local",
  role: "Руководитель компании",
  welcomeHidden: false,
  promoHidden: false,
};
export function migratePreferences(value: unknown): Preferences {
  const prefs = preferencesSchema.parse(value);
  if (
    prefs.name === "Александр Волков" &&
    prefs.role === "Руководитель продаж"
  ) {
    prefs.name = "Али Бабаев";
    prefs.role = "Руководитель компании";
  }
  return prefs;
}
function loadPreferences(): Preferences {
  try {
    const raw = browserStorage()?.getItem("nova-preferences");
    return raw ? migratePreferences(JSON.parse(raw)) : defaults;
  } catch {
    return defaults;
  }
}
export const usePreferences = create<
  Preferences & {
    update: (value: Partial<z.input<typeof preferencesSchema>>) => void;
  }
>((set, get) => ({
  ...loadPreferences(),
  update(value) {
    const next = preferencesSchema.parse({ ...get(), ...value });
    try {
      browserStorage()?.setItem("nova-preferences", JSON.stringify(next));
    } catch {
      useERP.setState({
        storageError:
          "Настройки не удалось сохранить. Хранилище браузера недоступно.",
      });
    }
    set(next);
  },
}));
function loadSession() {
  try {
    return (
      localStorage.getItem(SESSION_KEY) === "demo" ||
      sessionStorage.getItem(SESSION_KEY) === "demo"
    );
  } catch {
    return false;
  }
}
export const useAuth = create<{
  authenticated: boolean;
  login: (remember: boolean) => void;
  logout: () => void;
}>((set) => ({
  authenticated: loadSession(),
  login(remember) {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, "demo");
    } catch {
      useERP.setState({
        storageError:
          "Сессию не удалось сохранить. После перезагрузки потребуется войти снова.",
      });
    }
    set({ authenticated: true });
  },
  logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* Session remains cleared in memory. */
    }
    set({ authenticated: false });
  },
}));
