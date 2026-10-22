import { useState } from "react";
import { Settings2, Wallet } from "lucide-react";
import { useERP } from "../data/store";
import { periodFor, type Period } from "../data/selectors";
import { financialMetrics } from "../data/finance";
import { dateLabel, money } from "../lib/utils";
import { Badge, Button, PageHeading, SectionHeading } from "../components/ui";
import {
  FinancialChartPanel,
  FinancialSummary,
  FinanceSettingsDialog,
} from "../components/finance-panel";
import { FinancialBreakdown } from "../components/metric-details";
import { PeriodPicker } from "./dashboard";

export function FinancePage() {
  const data = useERP((s) => s.data),
    [period, setPeriod] = useState<Period>(periodFor(30)),
    [editing, setEditing] = useState(false);
  const values = financialMetrics(data, period);
  return (
    <>
      <PageHeading
        eyebrow="УПРАВЛЕНИЕ КОМПАНИЕЙ"
        title="Финансы"
        description="От выручки к результату. Прибыль, затраты и операционная эффективность."
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Settings2 size={16} />
            Настроить модель
          </Button>
        }
      />
      <div className="overview-heading">
        <div>
          <h2>
            Финансовый результат<Badge tone="orange">Демо-модель</Badge>
          </h2>
          <p>
            {dateLabel(period.from)} — {dateLabel(period.to, true)}
          </p>
        </div>
        <PeriodPicker period={period} onChange={setPeriod} />
      </div>
      <div className="finance-revenue-total">
        <span className="icon-box soft-violet">
          <Wallet size={21} />
        </span>
        <div>
          <span>Выручка</span>
          <strong>{money(values.revenue)}</strong>
        </div>
        <div>
          <span>Оплаченных заказов</span>
          <strong>{values.paidOrders}</strong>
        </div>
        <div>
          <span>Рентабельность</span>
          <strong className={values.margin < 0 ? "danger-text" : ""}>
            {values.margin}%
          </strong>
        </div>
      </div>
      <FinancialSummary period={period} />
      <div className="finance-page-grid">
        <FinancialChartPanel period={period} />
        <section className="card finance-report">
          <SectionHeading
            title="Отчёт о прибыли и расходах"
            description="Управленческий результат за выбранный период"
          />
          <FinancialBreakdown period={period} />
        </section>
      </div>
      <div className="finance-model-disclaimer">
        <Settings2 size={18} />
        <div>
          <strong>Как устроен расчёт</strong>
          <p>
            Выручка берётся из оплаченных неотменённых заказов по дате создания.
            Себестоимость и расходы рассчитываются по редактируемым
            демо-допущениям. Постоянные расходы распределяются по дням месяца.
            Налоги, проценты и амортизация не включены.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Изменить допущения
        </Button>
      </div>
      {editing && (
        <FinanceSettingsDialog open onClose={() => setEditing(false)} />
      )}
    </>
  );
}
