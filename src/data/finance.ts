import {
  defaultFinancialSettings,
  type Data,
  type FinancialSettings,
} from "./schema";
import {
  inPeriod,
  isRevenue,
  orderTotal,
  subtotal,
  type Period,
  previousPeriod,
} from "./selectors";
import { shiftDate } from "../lib/utils";

export const expenseNames = {
  payroll: "Фонд оплаты труда",
  rent: "Аренда и склад",
  marketing: "Маркетинг",
  services: "Сервисы и прочее",
};
// Allocate whole kopecks deterministically. Full months and adjacent periods reconcile exactly.
export function allocateMonthly(amount: number, period: Period): number {
  let cursor = period.from,
    result = 0;
  while (cursor <= period.to) {
    const [year, month, start] = cursor.split("-").map(Number);
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endOfMonth = `${cursor.slice(0, 7)}-${String(days).padStart(2, "0")}`;
    const end = period.to < endOfMonth ? Number(period.to.slice(8, 10)) : days;
    const daily = Math.floor(amount / days),
      remainder = amount % days;
    const prefix = (day: number) => daily * day + Math.min(day, remainder);
    result += prefix(end) - prefix(start - 1);
    cursor = shiftDate(endOfMonth, 1);
  }
  return result;
}
export function financialMetrics(
  data: Pick<Data, "orders" | "finance">,
  period: Period,
) {
  const settings = data.finance || defaultFinancialSettings;
  const paid = data.orders.filter(
    (o) => isRevenue(o) && inPeriod(o.createdAt, period.from, period.to),
  );
  const revenue = paid.reduce((s, o) => s + orderTotal(o), 0);
  const costOfGoods = paid.reduce(
    (s, o) => s + Math.round(subtotal(o.items) * settings.costRatio),
    0,
  );
  const commissions = paid.reduce(
    (s, o) =>
      s +
      Math.round(
        (subtotal(o.items) - o.discount) * settings.commissionRates[o.channel],
      ),
    0,
  );
  const fulfillment = paid.length * settings.fulfillmentPerOrder;
  const expenses = Object.entries(settings.monthlyExpenses).map(
    ([key, monthly]) => ({
      key,
      label: expenseNames[key as keyof typeof expenseNames],
      monthly,
      amount: allocateMonthly(monthly, period),
    }),
  );
  const fixedExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const operatingExpenses = commissions + fulfillment + fixedExpenses;
  const grossProfit = revenue - costOfGoods;
  const operatingProfit = grossProfit - operatingExpenses;
  return {
    revenue,
    costOfGoods,
    commissions,
    fulfillment,
    fixedExpenses,
    operatingExpenses,
    grossProfit,
    operatingProfit,
    totalExpenses: costOfGoods + operatingExpenses,
    margin: revenue ? Math.round((operatingProfit / revenue) * 1000) / 10 : 0,
    expenses,
    paidOrders: paid.length,
  };
}
export type FinancialMetric =
  "revenue" | "grossProfit" | "operatingProfit" | "operatingExpenses";
export const financialLabels: Record<FinancialMetric, string> = {
  revenue: "Выручка",
  grossProfit: "Валовая прибыль",
  operatingProfit: "Операционная прибыль",
  operatingExpenses: "Операционные расходы",
};
export function financialChartData(
  data: Pick<Data, "orders" | "finance">,
  period: Period,
  metric: FinancialMetric,
) {
  const days =
    Math.round(
      (new Date(period.to).getTime() - new Date(period.from).getTime()) /
        86400000,
    ) + 1;
  const step = Math.max(1, Math.ceil(days / 14)),
    previous = previousPeriod(period);
  return Array.from({ length: Math.ceil(days / step) }, (_, i) => {
    const length = Math.min(step - 1, days - i * step - 1);
    const from = shiftDate(period.from, i * step),
      prevFrom = shiftDate(previous.from, i * step);
    return {
      date: from,
      revenue:
        financialMetrics(data, { from, to: shiftDate(from, length) })[metric] /
        100,
      previous:
        financialMetrics(data, {
          from: prevFrom,
          to: shiftDate(prevFrom, length),
        })[metric] / 100,
    };
  });
}
