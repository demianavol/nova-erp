import type { Data, Deal, Order, OrderInput } from "./schema";
import { shiftDate, today } from "../lib/utils";

export const subtotal = (items: OrderInput["items"]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
export const orderTotal = (
  order: Pick<Order, "items" | "discount" | "shippingCost">,
) => subtotal(order.items) - order.discount + order.shippingCost;
export const dealValue = (deal: Deal) => subtotal(deal.items);
export const isRevenue = (order: Order) =>
  order.payment === "paid" && order.shipping !== "cancelled";
export const inPeriod = (date: string, from: string, to: string) =>
  date.slice(0, 10) >= from && date.slice(0, 10) <= to;
export type Period = { from: string; to: string };
export const periodFor = (days: number, anchor = today()): Period => ({
  from: shiftDate(anchor, -(days - 1)),
  to: anchor,
});
export function metrics(orders: Order[], deals: Deal[], period: Period) {
  const filtered = orders.filter((o) =>
    inPeriod(o.createdAt, period.from, period.to),
  );
  const paid = filtered.filter(isRevenue);
  const revenue = paid.reduce((sum, o) => sum + orderTotal(o), 0);
  const closed = deals.filter(
    (d) =>
      inPeriod(d.createdAt, period.from, period.to) &&
      (d.stage === "won" || d.stage === "lost"),
  );
  return {
    revenue,
    orders: filtered.length,
    paidOrders: paid.length,
    average: paid.length ? Math.round(revenue / paid.length) : 0,
    conversion: closed.length
      ? Math.round(
          (closed.filter((d) => d.stage === "won").length / closed.length) *
            100,
        )
      : 0,
  };
}
export function previousPeriod(period: Period): Period {
  const days =
    Math.round(
      (new Date(period.to).getTime() - new Date(period.from).getTime()) /
        86400000,
    ) + 1;
  return {
    from: shiftDate(period.from, -days),
    to: shiftDate(period.from, -1),
  };
}
export const growth = (current: number, previous: number) =>
  previous === 0
    ? null
    : Math.round(((current - previous) / previous) * 1000) / 10;
export interface OrderFilters {
  search: string;
  channel: string;
  manager: string;
  shipping: string;
  payment: string;
  from: string;
  to: string;
  sort: string;
}
export const emptyOrderFilters: OrderFilters = {
  search: "",
  channel: "all",
  manager: "all",
  shipping: "all",
  payment: "all",
  from: "",
  to: "",
  sort: "newest",
};
export function filterOrders(
  data: Pick<Data, "orders" | "customers">,
  filters: OrderFilters,
): Order[] {
  const q = filters.search.toLocaleLowerCase("ru").trim();
  return data.orders
    .filter((o) => {
      const customer = data.customers.find((c) => c.id === o.customerId);
      return (
        (!q ||
          `${o.number} ${customer?.name} ${customer?.email}`
            .toLocaleLowerCase("ru")
            .includes(q)) &&
        (filters.channel === "all" || o.channel === filters.channel) &&
        (filters.manager === "all" || o.managerId === filters.manager) &&
        (filters.shipping === "all" || o.shipping === filters.shipping) &&
        (filters.payment === "all" || o.payment === filters.payment) &&
        (!filters.from || o.createdAt >= filters.from) &&
        (!filters.to || o.createdAt <= filters.to)
      );
    })
    .sort((a, b) =>
      filters.sort === "amount-desc"
        ? orderTotal(b) - orderTotal(a)
        : filters.sort === "amount-asc"
          ? orderTotal(a) - orderTotal(b)
          : filters.sort === "oldest"
            ? a.createdAt.localeCompare(b.createdAt) ||
              a.number.localeCompare(b.number)
            : b.createdAt.localeCompare(a.createdAt) ||
              b.number.localeCompare(a.number),
    );
}
export function chartData(orders: Order[], period: Period) {
  const days =
    Math.round(
      (new Date(period.to).getTime() - new Date(period.from).getTime()) /
        86400000,
    ) + 1;
  const step = Math.max(1, Math.ceil(days / 14));
  const previous = previousPeriod(period);
  return Array.from({ length: Math.ceil(days / step) }, (_, i) => {
    const from = shiftDate(period.from, i * step),
      to = shiftDate(from, Math.min(step - 1, days - i * step - 1));
    const pFrom = shiftDate(previous.from, i * step),
      pTo = shiftDate(pFrom, Math.min(step - 1, days - i * step - 1));
    return {
      date: from,
      revenue:
        orders
          .filter((o) => isRevenue(o) && inPeriod(o.createdAt, from, to))
          .reduce((s, o) => s + orderTotal(o), 0) / 100,
      previous:
        orders
          .filter((o) => isRevenue(o) && inPeriod(o.createdAt, pFrom, pTo))
          .reduce((s, o) => s + orderTotal(o), 0) / 100,
    };
  });
}
