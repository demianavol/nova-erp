import { useState } from "react";
import { MetricDetails, type MetricKey } from "./metric-details";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  ShoppingBag,
  MousePointer2,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn, dateLabel, money, number, shiftDate } from "../lib/utils";
import {
  chartData,
  growth,
  metrics,
  previousPeriod,
  type Period,
} from "../data/selectors";
import { useERP } from "../data/store";
import { Badge } from "./ui";

export const channelColors = ["#a66cf5", "#61cbd9", "#73cfa6", "#e5b77a"];
export function KPIGrid({ period }: { period: Period }) {
  const [selected, setSelected] = useState<MetricKey | null>(null);
  const keys = ["revenue", "orders", "average", "conversion"] as const;
  const { orders, deals } = useERP((s) => s.data);
  const current = metrics(orders, deals, period),
    previous = metrics(orders, deals, previousPeriod(period));
  const points = chartData(orders, period);
  const buckets = points.map((p, i) =>
    metrics(orders, deals, {
      from: p.date,
      to: points[i + 1] ? shiftDate(points[i + 1].date, -1) : period.to,
    }),
  );
  const cards: {
    label: string;
    value: string;
    growth: number | null;
    icon: LucideIcon;
    color: string;
    series: number[];
  }[] = [
    {
      label: "Выручка",
      value: money(current.revenue),
      growth: growth(current.revenue, previous.revenue),
      icon: Wallet,
      color: "violet",
      series: buckets.map((b) => b.revenue),
    },
    {
      label: "Заказы",
      value: number(current.orders),
      growth: growth(current.orders, previous.orders),
      icon: ShoppingBag,
      color: "blue",
      series: buckets.map((b) => b.orders),
    },
    {
      label: "Средний чек",
      value: money(current.average),
      growth: growth(current.average, previous.average),
      icon: Receipt,
      color: "orange",
      series: buckets.map((b) => b.average),
    },
    {
      label: "Конверсия сделок",
      value: `${current.conversion}%`,
      growth: growth(current.conversion, previous.conversion),
      icon: MousePointer2,
      color: "green",
      series: buckets.map((b) => b.conversion),
    },
  ];
  return (
    <>
      <div className="kpi-grid">
        {cards.map((card, index) => (
          <button
            type="button"
            className="kpi-card kpi-interactive"
            key={card.label}
            onClick={() => setSelected(keys[index])}
            aria-label={`${card.label} — подробнее`}
          >
            <div className="kpi-label">
              <span>{card.label}</span>
              <span className={cn("kpi-icon", `soft-${card.color}`)}>
                <card.icon size={17} />
              </span>
            </div>
            <strong className="kpi-value">{card.value}</strong>
            <div className="kpi-bottom">
              <div>
                {card.growth === null ? (
                  <Badge>Нет базы сравнения</Badge>
                ) : (
                  <Badge tone={card.growth >= 0 ? "green" : "orange"}>
                    {card.growth >= 0 ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}
                    {card.growth > 0 ? "+" : ""}
                    {card.growth}%
                  </Badge>
                )}
                <span className="kpi-caption">к пред. периоду</span>
              </div>
              <svg
                viewBox="0 0 88 32"
                className={cn("sparkline", `spark-${index}`)}
                aria-hidden="true"
              >
                <polyline
                  points={card.series
                    .map(
                      (value, i) =>
                        `${(i * 86) / Math.max(card.series.length - 1, 1)},${29 - (Math.max(...card.series) ? (value / Math.max(...card.series)) * 24 : 0)}`,
                    )
                    .join(" ")}
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
      <MetricDetails
        metric={selected}
        period={period}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
export function RevenueChart({
  period,
  seriesData,
  label = "Выручка",
}: {
  period: Period;
  seriesData?: { date: string; revenue: number; previous: number }[];
  label?: string;
}) {
  const orders = useERP((s) => s.data.orders);
  const points = seriesData || chartData(orders, period);
  return (
    <div
      className="revenue-chart"
      role="img"
      aria-label={`${label}: график за выбранный и предыдущий периоды`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 16, right: 9, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a66cf5" stopOpacity={0.21} />
              <stop offset="95%" stopColor="#a66cf5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="4 5"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => dateLabel(String(v))}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            minTickGap={28}
            dy={9}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)} т.`}
          />
          <Tooltip
            cursor={{ stroke: "#a66cf5", strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            labelFormatter={(v) => dateLabel(String(v), true)}
            formatter={(value, name) => [
              money(Number(value) * 100),
              name === "revenue" ? "Текущий период" : "Предыдущий период",
            ]}
          />
          <Area
            type="monotone"
            dataKey="previous"
            stroke="#747181"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#a66cf5"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            activeDot={{
              r: 5,
              fill: "#a66cf5",
              stroke: "var(--card)",
              strokeWidth: 3,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ChannelDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="channel-content">
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total ? data : [{ name: "Нет данных", value: 1 }]}
              dataKey="value"
              innerRadius="73%"
              outerRadius="95%"
              paddingAngle={total ? 5 : 0}
              cornerRadius={5}
              stroke="none"
              isAnimationActive={false}
            >
              {(total ? data : [{ name: "Нет данных", value: 1 }]).map(
                (d, i) => (
                  <Cell
                    key={d.name}
                    fill={total ? channelColors[i] : "var(--border)"}
                  />
                ),
              )}
            </Pie>
            <Tooltip
              formatter={(v) => money(Number(v))}
              contentStyle={{
                borderRadius: 10,
                background: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-label">
          <span>Всего</span>
          <strong>{money(total, true)}</strong>
          <span>выручка</span>
        </div>
      </div>
      <div className="channel-legend">
        {data.map((d, i) => (
          <div key={d.name}>
            <span
              className="legend-dot"
              style={{ background: channelColors[i] }}
            />
            <span>{d.name}</span>
            <strong>{total ? Math.round((d.value / total) * 100) : 0}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
