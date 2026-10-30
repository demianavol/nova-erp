import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, ChartNoAxesCombined, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useERP } from "../data/store";
import {
  channels,
  defaultFinancialSettings,
  financialSettingsSchema,
  type FinancialSettings,
} from "../data/schema";
import {
  financialMetrics,
  financialLabels,
  financialChartData,
  expenseNames,
  type FinancialMetric,
} from "../data/finance";
import { type Period } from "../data/selectors";
import { money } from "../lib/utils";
import { Badge, Button, Dialog, Field, Input, SectionHeading } from "./ui";
import { RevenueChart } from "./charts";
import { MetricDetails, type MetricKey } from "./metric-details";

export function FinancialSummary({ period }: { period: Period }) {
  const data = useERP((s) => s.data),
    values = financialMetrics(data, period);
  const [selected, setSelected] = useState<MetricKey | null>(null);
  return (
    <>
      <div className="finance-strip">
        {(["grossProfit", "operatingExpenses", "operatingProfit"] as const).map(
          (key, i) => (
            <button
              key={key}
              className="finance-mini-card"
              onClick={() => setSelected(key)}
              aria-label={`${financialLabels[key]} — подробнее`}
            >
              <span>
                <i className={`finance-dot-${i}`} />
                {financialLabels[key]}
                <ArrowUpRight size={14} />
              </span>
              <strong
                className={
                  key === "operatingProfit" && values[key] < 0
                    ? "danger-text"
                    : ""
                }
              >
                {money(values[key])}
              </strong>
              <small>
                {key === "grossProfit"
                  ? "После себестоимости"
                  : key === "operatingExpenses"
                    ? "Комиссии, логистика и операционка"
                    : `Рентабельность ${values.margin}%`}
              </small>
            </button>
          ),
        )}
      </div>
      <MetricDetails
        metric={selected}
        period={period}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
export function FinancialChartPanel({ period }: { period: Period }) {
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  const [metric, setMetric] = useState<FinancialMetric>("revenue");
  const values = financialMetrics(data, period);
  const labels: Record<FinancialMetric, string> = {
    revenue: "Выручка",
    grossProfit: "Валовая прибыль",
    operatingProfit: "Опер. прибыль",
    operatingExpenses: "Опер. расходы",
  };
  return (
    <section className="card revenue-card">
      <SectionHeading
        title="Финансовая динамика"
        description="Показатели за выбранный и предыдущий периоды"
        action={
          <Badge tone="violet">
            <ChartNoAxesCombined size={12} />
            Финансы
          </Badge>
        }
      />
      <div className="financial-chart-tabs" aria-label="Показатель графика">
        {(Object.keys(labels) as FinancialMetric[]).map((key) => (
          <button
            key={key}
            aria-pressed={metric === key}
            onClick={() => setMetric(key)}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      <div className="chart-summary">
        <strong className={values[metric] < 0 ? "danger-text" : ""}>
          {money(values[metric])}
        </strong>
        <span className="chart-legend">
          <i />
          Текущий период
          <span className="previous-line" />
          Предыдущий
        </span>
      </div>
      <RevenueChart
        period={period}
        seriesData={financialChartData(data, period, metric)}
        label={financialLabels[metric]}
      />
      <div className="finance-chart-note">
        <span>
          {metric === "revenue"
            ? "Оплаченные неотменённые заказы"
            : "Расчётная демо-модель · до налогов"}
        </span>
        <button onClick={() => navigate("/erp/departments/finance")}>
          Расшифровка
          <ArrowUpRight size={12} />
        </button>
      </div>
    </section>
  );
}

export function FinanceSettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, saveFinance } = useERP();
  const form = useForm<FinancialSettings>({
    resolver: zodResolver(financialSettingsSchema),
    defaultValues: data.finance || defaultFinancialSettings,
  });
  const values = form.watch();
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      title="Финансовая модель"
      description="Управленческие допущения для демонстрации. Применяются ко всем периодам."
      wide
    >
      <form
        onSubmit={form.handleSubmit((input) => {
          saveFinance(input);
          toast.success("Финансовая модель обновлена");
          onClose();
        })}
      >
        <div className="dialog-body">
          <div className="metric-formula">
            <Settings2 size={18} />
            <p>
              Себестоимость и расходы пока расчётные. Измените параметры под ваш
              бизнес: прибыль и графики пересчитаются автоматически. Это модель
              до налогов, а не бухгалтерская отчётность.
            </p>
          </div>
          <div className="form-grid">
            <Field label="Себестоимость от цены товаров, %">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                value={Number((values.costRatio * 100).toFixed(4))}
                onChange={(e) =>
                  form.setValue("costRatio", Number(e.target.value) / 100)
                }
              />
            </Field>
            <Field label="Обработка и логистика на заказ, ₽">
              <Input
                type="number"
                min="0"
                max="10000000"
                step="0.01"
                required
                value={values.fulfillmentPerOrder / 100}
                onChange={(e) =>
                  form.setValue(
                    "fulfillmentPerOrder",
                    Math.round(Number(e.target.value) * 100),
                  )
                }
              />
            </Field>
          </div>
          <h3 className="finance-section-title">
            Комиссии с товаров после скидок
          </h3>
          <div className="form-grid">
            {channels.map((channel) => (
              <Field key={channel} label={`${channel}, %`}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={Number(
                    (values.commissionRates[channel] * 100).toFixed(4),
                  )}
                  onChange={(e) =>
                    form.setValue(
                      `commissionRates.${channel}`,
                      Number(e.target.value) / 100,
                    )
                  }
                />
              </Field>
            ))}
          </div>
          <h3 className="finance-section-title">Постоянные расходы в месяц</h3>
          <p className="form-hint">
            Для выбранного периода бюджет распределяется по календарным дням
            каждого месяца.
          </p>
          <div className="form-grid">
            {Object.entries(expenseNames).map(([key, label]) => (
              <Field key={key} label={`${label}, ₽/мес.`}>
                <Input
                  type="number"
                  min="0"
                  max="10000000"
                  step="0.01"
                  required
                  value={
                    values.monthlyExpenses[key as keyof typeof expenseNames] /
                    100
                  }
                  onChange={(e) =>
                    form.setValue(
                      `monthlyExpenses.${key as keyof typeof expenseNames}`,
                      Math.round(Number(e.target.value) * 100),
                    )
                  }
                />
              </Field>
            ))}
          </div>
          {Object.keys(form.formState.errors).length > 0 && (
            <p role="alert" className="field-error">
              Проверьте суммы и проценты. Проценты: от 0 до 100; суммы: от 0 до
              10 000 000 ₽.
            </p>
          )}
        </div>
        <div className="dialog-footer">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Сохранить модель</Button>
        </div>
      </form>
    </Dialog>
  );
}
