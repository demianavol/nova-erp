import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Calculator, ShoppingBag } from "lucide-react";
import { useERP } from "../data/store";
import { stageNames } from "../data/schema";
import {
  metrics,
  previousPeriod,
  inPeriod,
  isRevenue,
  orderTotal,
  type Period,
} from "../data/selectors";
import {
  financialLabels,
  financialMetrics,
  type FinancialMetric,
} from "../data/finance";
import { dateLabel, money } from "../lib/utils";
import { Badge, Button, Dialog, Empty } from "./ui";

export type MetricKey = FinancialMetric | "orders" | "average" | "conversion";
const labels: Record<MetricKey, string> = {
  ...financialLabels,
  orders: "Заказы",
  average: "Средний чек",
  conversion: "Конверсия сделок",
};
const formulas: Record<MetricKey, string> = {
  revenue:
    "Сумма оплаченных неотменённых заказов, включая доставку и скидки. Период определяется датой создания заказа.",
  orders:
    "Все созданные за период заказы, включая неоплаченные и отменённые. В выручку входят только оплаченные неотменённые.",
  average: "Выручка разделена на количество оплаченных неотменённых заказов.",
  conversion:
    "Количество выигранных сделок разделено на число закрытых сделок, созданных в выбранном периоде. Закрытыми считаются выигранные и проигранные.",
  grossProfit:
    "Выручка минус расчётная себестоимость товаров. Себестоимость берётся от цены товаров до скидок; скидка её не уменьшает.",
  operatingExpenses:
    "Комиссии каналов + обработка заказов и логистика + фонд оплаты труда, аренда, маркетинг и сервисы за выбранный период.",
  operatingProfit:
    "Валовая прибыль минус операционные расходы. Это управленческая демо-модель до налогов и финансовых расходов.",
};
export function FinancialBreakdown({ period }: { period: Period }) {
  const data = useERP((s) => s.data),
    f = financialMetrics(data, period);
  const rows = [
    ["Выручка", f.revenue],
    ["Себестоимость товаров", -f.costOfGoods],
    ["Валовая прибыль", f.grossProfit],
    ["Комиссии каналов", -f.commissions],
    ["Обработка и логистика", -f.fulfillment],
    ...f.expenses.map((e) => [e.label, -e.amount]),
    ["Операционная прибыль", f.operatingProfit],
  ] as [string, number][];
  return (
    <div className="financial-breakdown">
      {rows.map(([label, value], i) => (
        <div
          key={label}
          className={i === 2 || i === rows.length - 1 ? "breakdown-total" : ""}
        >
          <span>{label}</span>
          <strong
            className={i === rows.length - 1 && value < 0 ? "danger-text" : ""}
          >
            {money(value)}
          </strong>
        </div>
      ))}
      <div>
        <span>Операционная рентабельность</span>
        <strong>{f.margin}%</strong>
      </div>
    </div>
  );
}
export function MetricDetails({
  metric,
  period,
  onClose,
}: {
  metric: MetricKey | null;
  period: Period;
  onClose: () => void;
}) {
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  if (!metric) return null;
  const current = {
    ...metrics(data.orders, data.deals, period),
    ...financialMetrics(data, period),
  };
  const previous = {
    ...metrics(data.orders, data.deals, previousPeriod(period)),
    ...financialMetrics(data, previousPeriod(period)),
  };
  const financial = [
    "grossProfit",
    "operatingProfit",
    "operatingExpenses",
  ].includes(metric);
  const format = (value: number) =>
    metric === "orders"
      ? String(value)
      : metric === "conversion"
        ? `${value}%`
        : money(value);
  const periodOrders = data.orders.filter((o) =>
    inPeriod(o.createdAt, period.from, period.to),
  );
  const orders =
    metric === "orders" ? periodOrders : periodOrders.filter(isRevenue);
  const closed = data.deals.filter(
    (d) =>
      inPeriod(d.createdAt, period.from, period.to) &&
      ["won", "lost"].includes(d.stage),
  );
  const go = (route: string) => {
    onClose();
    navigate(route);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={labels[metric]}
      description={`${dateLabel(period.from)} — ${dateLabel(period.to, true)}`}
      wide
    >
      <div className="dialog-body metric-details">
        <div className="metric-comparison">
          <div>
            <span>Выбранный период</span>
            <strong>{format(current[metric])}</strong>
          </div>
          <div>
            <span>Предыдущий период</span>
            <strong>{format(previous[metric])}</strong>
          </div>
        </div>
        <div className="metric-formula">
          <Calculator size={18} />
          <p>{formulas[metric]}</p>
        </div>
        {financial ? (
          <>
            <Badge tone="orange">Расчётная демо-модель</Badge>
            <FinancialBreakdown period={period} />
            <p className="form-hint">
              Допущения едины для всех периодов. Месячные расходы распределяются
              по календарным дням. Настройте их в разделе финансов.
            </p>
          </>
        ) : metric === "conversion" ? (
          <>
            <div className="metric-counts">
              <Badge tone="green">
                Выиграно: {closed.filter((d) => d.stage === "won").length}
              </Badge>
              <Badge>
                Проиграно: {closed.filter((d) => d.stage === "lost").length}
              </Badge>
              <Badge>Закрыто: {closed.length}</Badge>
            </div>
            <div className="metric-records">
              {closed.length ? (
                closed.slice(0, 8).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => go(`/sales/pipeline?open=${d.id}`)}
                  >
                    <span>{d.title}</span>
                    <Badge tone={d.stage === "won" ? "green" : "neutral"}>
                      {stageNames[d.stage]}
                    </Badge>
                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <Empty
                  title="Закрытых сделок нет"
                  description="Выберите другой период."
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="metric-counts">
              <Badge tone="green">
                Оплачено: {periodOrders.filter(isRevenue).length}
              </Badge>
              <Badge tone="orange">
                Не оплачено:{" "}
                {
                  periodOrders.filter(
                    (o) => o.payment === "unpaid" && o.shipping !== "cancelled",
                  ).length
                }
              </Badge>
              <Badge>
                Отменено:{" "}
                {periodOrders.filter((o) => o.shipping === "cancelled").length}
              </Badge>
            </div>
            <div className="metric-records">
              {orders.length ? (
                orders.slice(0, 8).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => go(`/sales/orders?open=${o.id}`)}
                  >
                    <ShoppingBag size={15} />
                    <div>
                      <strong>{o.number}</strong>
                      <span>
                        {
                          data.customers.find((c) => c.id === o.customerId)
                            ?.name
                        }
                      </span>
                    </div>
                    <strong>{money(orderTotal(o))}</strong>
                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <Empty
                  title="Нет заказов для расчёта"
                  description="Выберите другой период."
                />
              )}
            </div>
          </>
        )}
      </div>
      <div className="dialog-footer">
        <Button variant="outline" onClick={onClose}>
          Закрыть
        </Button>
        <Button
          onClick={() =>
            go(
              financial
                ? "/departments/finance"
                : metric === "conversion"
                  ? "/sales/pipeline"
                  : `/sales/orders?from=${period.from}&to=${period.to}`,
            )
          }
        >
          {financial
            ? "Открыть финансы"
            : metric === "conversion"
              ? "Открыть воронку"
              : "Все заказы периода"}
          <ArrowUpRight size={15} />
        </Button>
      </div>
    </Dialog>
  );
}
