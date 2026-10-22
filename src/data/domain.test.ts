import { describe, expect, it } from "vitest";
import { seedData } from "./seed";
import { orderInputSchema, validateData } from "./schema";
import {
  chartData,
  emptyOrderFilters,
  filterOrders,
  inPeriod,
  isRevenue,
  metrics,
  orderTotal,
  periodFor,
  previousPeriod,
} from "./selectors";
import {
  createOrderFromDeal,
  DATA_KEY,
  loadData,
  persistData,
  useERP,
} from "./store";

const anchor = "2026-10-22";
const memoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
};

describe("Данные и финансовые правила", () => {
  it("создаёт полный согласованный набор демоданных", () => {
    const data = validateData(seedData(anchor));
    expect([
      data.products.length,
      data.customers.length,
      data.orders.length,
      data.deals.length,
      data.employees.length,
      data.tasks.length,
    ]).toEqual([24, 60, 240, 28, 7, 18]);
    expect(
      data.orders.every(
        (o) => o.createdAt <= anchor && o.createdAt >= "2026-04-25",
      ),
    ).toBe(true);
  });
  it("считает сумму в копейках с доставкой и скидкой", () => {
    expect(
      orderTotal({
        items: [{ productId: "p1", quantity: 3, unitPrice: 19999 }],
        discount: 999,
        shippingCost: 49000,
      }),
    ).toBe(107998);
  });
  it("исключает отменённые и неоплаченные заказы из выручки и среднего чека", () => {
    const data = seedData(anchor),
      base = data.orders[0];
    const orders = [
      {
        ...base,
        id: "1",
        payment: "paid" as const,
        shipping: "delivered" as const,
      },
      {
        ...base,
        id: "2",
        payment: "paid" as const,
        shipping: "cancelled" as const,
      },
      {
        ...base,
        id: "3",
        payment: "unpaid" as const,
        shipping: "new" as const,
      },
    ];
    const result = metrics(orders, [], periodFor(30, anchor));
    expect(result.revenue).toBe(orderTotal(base));
    expect(result.orders).toBe(3);
    expect(result.paidOrders).toBe(1);
    expect(result.average).toBe(orderTotal(base));
  });
  it("возвращает нули для пустого периода без NaN", () => {
    expect(metrics([], [], periodFor(30, anchor))).toEqual({
      revenue: 0,
      orders: 0,
      paidOrders: 0,
      average: 0,
      conversion: 0,
    });
  });
  it("учитывает обе границы диапазона и предыдущий период той же длины", () => {
    const period = { from: "2024-02-28", to: "2024-03-01" };
    expect(inPeriod("2024-02-28", period.from, period.to)).toBe(true);
    expect(inPeriod("2024-03-01", period.from, period.to)).toBe(true);
    expect(inPeriod("2024-03-02", period.from, period.to)).toBe(false);
    expect(previousPeriod(period)).toEqual({
      from: "2024-02-25",
      to: "2024-02-27",
    });
  });
  it("сумма графика совпадает с выручкой KPI для 7, 30 и 90 дней", () => {
    const data = seedData(anchor);
    for (const days of [7, 30, 90]) {
      const period = periodFor(days, anchor);
      const plotted = chartData(data.orders, period).reduce(
        (sum, bucket) => sum + bucket.revenue * 100,
        0,
      );
      expect(plotted).toBeCloseTo(
        metrics(data.orders, data.deals, period).revenue,
        4,
      );
    }
  });
  it("не допускает скидку больше суммы товаров и дробное количество", () => {
    const order = seedData(anchor).orders[0];
    expect(
      orderInputSchema.safeParse({ ...order, discount: 999999999 }).success,
    ).toBe(false);
    expect(
      orderInputSchema.safeParse({
        ...order,
        items: [{ ...order.items[0], quantity: 1.5 }],
      }).success,
    ).toBe(false);
    expect(orderInputSchema.safeParse({ ...order, items: [] }).success).toBe(
      false,
    );
  });
});

describe("Фильтрация", () => {
  it("комбинирует поиск, канал, менеджера, оплату, доставку и даты", () => {
    const data = seedData(anchor),
      sample = data.orders.find(
        (o) => o.shipping === "delivered" && o.payment === "paid",
      )!;
    const result = filterOrders(data, {
      ...emptyOrderFilters,
      search: sample.number.toLowerCase(),
      channel: sample.channel,
      manager: sample.managerId,
      shipping: sample.shipping,
      payment: sample.payment,
      from: sample.createdAt,
      to: sample.createdAt,
    });
    expect(result.map((o) => o.id)).toEqual([sample.id]);
  });
  it("находит заказы по email клиента и сортирует без изменения исходных данных", () => {
    const data = seedData(anchor),
      before = data.orders.map((o) => o.id);
    const result = filterOrders(data, {
      ...emptyOrderFilters,
      search: data.customers[0].email,
      sort: "amount-desc",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((o) => o.customerId === data.customers[0].id)).toBe(
      true,
    );
    expect(result.map(orderTotal)).toEqual(
      result.map(orderTotal).sort((a, b) => b - a),
    );
    expect(data.orders.map((o) => o.id)).toEqual(before);
  });
  it("даёт пустую выборку при несовпадающих условиях", () => {
    expect(
      filterOrders(seedData(anchor), {
        ...emptyOrderFilters,
        from: "2027-01-01",
        to: "2027-02-01",
      }),
    ).toEqual([]);
  });
});

describe("Сохранение и восстановление", () => {
  it("восстанавливает данные и связи после записи в хранилище", () => {
    const data = seedData(anchor),
      storage = memoryStorage();
    expect(persistData(data, storage)).toBeNull();
    expect(loadData(storage)).toEqual({ data, error: null });
  });
  it("восстанавливает демоверсию при повреждённом JSON или неизвестной версии", () => {
    for (const raw of [
      "{broken",
      JSON.stringify({ ...seedData(anchor), version: 99 }),
    ]) {
      const storage = memoryStorage();
      storage.setItem(DATA_KEY, raw);
      const loaded = loadData(storage);
      expect(loaded.error).toBeTruthy();
      expect(loaded.data.orders).toHaveLength(240);
    }
  });
  it("обнаруживает повреждённые ссылки и повторяющиеся идентификаторы", () => {
    const data = seedData(anchor);
    data.orders[0].customerId = "missing";
    expect(() => validateData(data)).toThrow();
    const duplicate = seedData(anchor);
    duplicate.customers.push(duplicate.customers[0]);
    expect(() => validateData(duplicate)).toThrow();
  });
  it("возвращает понятную ошибку при переполнении localStorage", () => {
    const storage = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(persistData(seedData(anchor), storage)).toContain(
      "Не удалось сохранить",
    );
  });
});

describe("Сделка → заказ и связанные изменения", () => {
  it("повторное преобразование создаёт ровно один связанный заказ", () => {
    const data = seedData(anchor),
      deal = data.deals.find((d) => d.stage === "won")!,
      before = data.orders.length;
    const first = createOrderFromDeal(data, deal.id),
      second = createOrderFromDeal(data, deal.id);
    expect(first).toBe(second);
    expect(data.orders).toHaveLength(before + 1);
    const order = data.orders.find((o) => o.id === first)!;
    expect(order.dealId).toBe(deal.id);
    expect(deal.orderId).toBe(order.id);
    expect(order.customerId).toBe(deal.customerId);
    expect(order.items).toEqual(deal.items);
    expect(order.payment).toBe("unpaid");
    expect(() => validateData(data)).not.toThrow();
  });
  it("запрещает преобразование невыигранной сделки", () => {
    const data = seedData(anchor);
    expect(() =>
      createOrderFromDeal(data, data.deals.find((d) => d.stage === "new")!.id),
    ).toThrow("выигранной");
    expect(data.orders).toHaveLength(240);
  });
  it("после оплаты нового заказа аналитика отражает точную прибавку", () => {
    useERP.setState({ data: seedData(anchor) });
    const store = useERP.getState(),
      data = store.data;
    const before = data.orders
      .filter(isRevenue)
      .reduce((s, o) => s + orderTotal(o), 0);
    const id = store.saveOrder({
      ...data.orders[0],
      payment: "unpaid",
      shipping: "new",
    });
    const unpaid = useERP.getState().data.orders.find((o) => o.id === id)!;
    expect(
      useERP
        .getState()
        .data.orders.filter(isRevenue)
        .reduce((s, o) => s + orderTotal(o), 0),
    ).toBe(before);
    store.saveOrder({ ...unpaid, payment: "paid" }, id);
    expect(
      useERP
        .getState()
        .data.orders.filter(isRevenue)
        .reduce((s, o) => s + orderTotal(o), 0),
    ).toBe(before + orderTotal(unpaid));
    expect(
      useERP.getState().data.activities.some((a) => a.entityId === id),
    ).toBe(true);
  });
  it("задачи и уведомления сохраняют своё состояние после операций", () => {
    useERP.setState({ data: seedData(anchor) });
    const task = useERP.getState().data.tasks[0];
    useERP.getState().toggleTask(task.id);
    expect(useERP.getState().data.tasks[0].done).toBe(!task.done);
    useERP.getState().readNotification();
    expect(useERP.getState().data.notifications.every((n) => n.read)).toBe(
      true,
    );
  });
});
