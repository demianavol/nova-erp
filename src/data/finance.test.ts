import { describe, expect, it } from "vitest";
import {
  allocateMonthly,
  financialChartData,
  financialMetrics,
} from "./finance";
import { defaultFinancialSettings, validateData } from "./schema";
import { seedData } from "./seed";
import {
  migratePreferences,
  persistData,
  loadData,
  useERP,
  usePreferences,
} from "./store";
import { orderTotal, periodFor } from "./selectors";

describe("Управленческая финансовая модель", () => {
  it("не теряет копейки при распределении месячного бюджета", () => {
    expect(
      allocateMonthly(10000, { from: "2026-10-01", to: "2026-10-31" }),
    ).toBe(10000);
    expect(
      allocateMonthly(10000, { from: "2026-10-01", to: "2026-10-15" }) +
        allocateMonthly(10000, { from: "2026-10-16", to: "2026-10-31" }),
    ).toBe(10000);
  });
  it("учитывает месяцы разной длины и високосный февраль", () => {
    expect(allocateMonthly(101, { from: "2024-02-01", to: "2024-03-31" })).toBe(
      202,
    );
    expect(
      allocateMonthly(31000, { from: "2026-10-16", to: "2026-10-31" }),
    ).toBe(16000);
  });
  it("себестоимость не уменьшается из-за скидки, комиссии считаются с товаров после скидки", () => {
    const data = seedData("2026-10-22"),
      base = data.orders[0];
    data.orders = [
      {
        ...base,
        payment: "paid",
        shipping: "delivered",
        channel: "Сайт",
        items: [{ productId: "p1", quantity: 1, unitPrice: 100000 }],
        discount: 10000,
        shippingCost: 5000,
      },
    ];
    data.finance = {
      ...defaultFinancialSettings,
      costRatio: 0.5,
      commissionRates: {
        ...defaultFinancialSettings.commissionRates,
        Сайт: 0.1,
      },
      fulfillmentPerOrder: 5000,
      monthlyExpenses: { payroll: 0, rent: 0, marketing: 0, services: 0 },
    };
    const result = financialMetrics(data, periodFor(1, "2026-10-22"));
    expect(result.revenue).toBe(95000);
    expect(result.costOfGoods).toBe(50000);
    expect(result.commissions).toBe(9000);
    expect(result.grossProfit).toBe(45000);
    expect(result.operatingProfit).toBe(31000);
  });
  it("оплаченные отменённые и неоплаченные заказы не добавляют себестоимость и комиссии", () => {
    const data = seedData("2026-10-22");
    data.orders = data.orders.map((o, i) => ({
      ...o,
      payment: i % 2 ? "paid" : "unpaid",
      shipping: i % 2 ? "cancelled" : "new",
    }));
    const f = financialMetrics(data, periodFor(30, "2026-10-22"));
    expect(f.revenue).toBe(0);
    expect(f.costOfGoods).toBe(0);
    expect(f.commissions).toBe(0);
    expect(f.fulfillment).toBe(0);
    expect(f.operatingProfit).toBe(-f.fixedExpenses);
  });
  it("прибыль плюс все расходы совпадают с выручкой", () => {
    const f = financialMetrics(
      seedData("2026-10-22"),
      periodFor(30, "2026-10-22"),
    );
    expect(f.operatingProfit + f.totalExpenses).toBe(f.revenue);
  });
  it("график сходится с итогами периода по каждому финансовому показателю", () => {
    const data = seedData("2026-10-22"),
      period = periodFor(90, "2026-10-22"),
      f = financialMetrics(data, period);
    for (const key of [
      "revenue",
      "grossProfit",
      "operatingProfit",
      "operatingExpenses",
    ] as const)
      expect(
        financialChartData(data, period, key).reduce(
          (s, p) => s + Math.round(p.revenue * 100),
          0,
        ),
      ).toBe(f[key]);
  });
  it("читает старые данные без финансовых настроек и сохраняет новый бюджет", () => {
    const data = seedData("2026-10-22");
    expect(validateData(data).orders).toHaveLength(240);
    useERP.setState({ data });
    useERP
      .getState()
      .saveFinance({ ...defaultFinancialSettings, costRatio: 0.6 });
    let saved = "";
    const storage = {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value;
      },
      removeItem: () => {
        saved = "";
      },
    };
    expect(persistData(useERP.getState().data, storage)).toBeNull();
    expect(loadData(storage).data.finance?.costRatio).toBe(0.6);
    expect(loadData(storage).data.orders).toHaveLength(240);
  });
  it("смена расходного бюджета не меняет заказы и выручку", () => {
    const data = seedData("2026-10-22"),
      period = periodFor(30, "2026-10-22"),
      before = financialMetrics(data, period),
      orders = JSON.stringify(data.orders);
    data.finance = {
      ...defaultFinancialSettings,
      monthlyExpenses: { ...defaultFinancialSettings.monthlyExpenses, rent: 0 },
    };
    const after = financialMetrics(data, period);
    expect(after.revenue).toBe(before.revenue);
    expect(after.operatingProfit).toBeGreaterThan(before.operatingProfit);
    expect(JSON.stringify(data.orders)).toBe(orders);
  });
});
describe("Совместимость настроек интерфейса", () => {
  it("меняет исходный демо-профиль на руководителя, сохраняя тему и навигацию", () => {
    const prefs = migratePreferences({
      theme: "dark",
      collapsed: true,
      name: "Александр Волков",
      email: "demo@nova.local",
      role: "Руководитель продаж",
    });
    expect(prefs).toMatchObject({
      name: "Али Бабаев",
      role: "Руководитель компании",
      theme: "dark",
      collapsed: true,
      welcomeHidden: false,
      promoHidden: false,
    });
  });
  it("сохраняет пользовательский профиль и настройки скрытия блоков", () => {
    expect(
      migratePreferences({
        theme: "light",
        collapsed: false,
        name: "Ирина Иванова",
        email: "test@example.com",
        role: "Директор",
        welcomeHidden: true,
        promoHidden: true,
      }),
    ).toMatchObject({
      theme: "dark",
      name: "Ирина Иванова",
      email: "test@example.com",
      role: "Директор",
      collapsed: false,
      welcomeHidden: true,
      promoHidden: true,
    });
  });
  it("не возвращает светлую тему при обновлении старых настроек", () => {
    const original = usePreferences.getState();
    try {
      original.update({ theme: "light", collapsed: true, promoHidden: true });
      expect(usePreferences.getState()).toMatchObject({
        theme: "dark",
        collapsed: true,
        promoHidden: true,
        name: original.name,
        email: original.email,
      });
    } finally {
      usePreferences.setState(original);
    }
  });
});
