import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  CalendarDays,
  ChevronRight,
  Sparkles,
  Target,
  CircleCheck,
  ShoppingBag,
  Users,
  Check,
  Circle,
  Layers3,
  X,
} from "lucide-react";
import { useERP, usePreferences } from "../data/store";
import { channels, departmentNames, type Task } from "../data/schema";
import {
  chartData,
  inPeriod,
  isRevenue,
  metrics,
  orderTotal,
  periodFor,
  type Period,
} from "../data/selectors";
import { dateLabel, money, today, cn } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Field,
  Input,
  PageHeading,
  SectionHeading,
  TextLink,
} from "../components/ui";
import { ChannelDonut, KPIGrid, RevenueChart } from "../components/charts";
import {
  FinancialChartPanel,
  FinancialSummary,
} from "../components/finance-panel";
import { DepartmentBadge, EmployeeChip } from "../components/people";

export function PeriodPicker({
  period,
  onChange,
}: {
  period: Period;
  onChange: (period: Period) => void;
}) {
  const [custom, setCustom] = useState(false),
    [draft, setDraft] = useState(period);
  return (
    <div className="period-control">
      <div className="period-tabs">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            className={cn(
              !custom &&
                period.from === periodFor(days).from &&
                period.to === today() &&
                "active",
            )}
            onClick={() => {
              setCustom(false);
              onChange(periodFor(days));
            }}
          >
            {days} дней
          </button>
        ))}
        <button
          className={cn(custom && "active")}
          aria-label="Выбрать произвольный период"
          title="Свой период"
          onClick={() => {
            setDraft(period);
            setCustom(!custom);
          }}
        >
          <CalendarDays size={15} />
        </button>
      </div>
      {custom && (
        <div className="custom-period">
          <Field label="С">
            <Input
              type="date"
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </Field>
          <Field label="По">
            <Input
              type="date"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </Field>
          <Button
            size="sm"
            disabled={!draft.from || !draft.to || draft.from > draft.to}
            onClick={() => onChange(draft)}
          >
            Применить
          </Button>
          {draft.from > draft.to && (
            <span className="field-error">Начало позже окончания</span>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskRow({ task }: { task: Task }) {
  const navigate = useNavigate();
  const { data, toggleTask } = useERP();
  const employee = data.employees.find((e) => e.id === task.employeeId)!;
  const overdue = !task.done && task.dueAt < today();
  return (
    <div className={cn("task-row", task.done && "task-completed")}>
      <button
        className="task-check"
        aria-label={
          task.done ? `Возобновить: ${task.title}` : `Завершить: ${task.title}`
        }
        onClick={() => toggleTask(task.id)}
      >
        {task.done ? (
          <span>
            <Check size={12} />
          </span>
        ) : (
          <Circle size={18} />
        )}
      </button>
      <button
        className="task-row-text"
        onClick={() => navigate(`/tasks?open=${task.id}`)}
      >
        <strong>{task.title}</strong>
        <span>
          <span className={cn("priority-dot", `priority-${task.priority}`)} />
          <DepartmentBadge department={task.department} />
          <i>·</i>
          <span className={cn(overdue && "danger-text")}>
            {task.dueAt === today() ? "Сегодня" : dateLabel(task.dueAt)}
          </span>
        </span>
        <EmployeeChip employee={employee} />
      </button>
    </div>
  );
}

export function Dashboard({ sales = false }: { sales?: boolean }) {
  const navigate = useNavigate();
  const data = useERP((s) => s.data),
    name = usePreferences((s) => s.name);
  const preferences = usePreferences();
  const [period, setPeriod] = useState<Period>(periodFor(30));
  const current = metrics(data.orders, data.deals, period);
  const selectedOrders = data.orders.filter((o) =>
    inPeriod(o.createdAt, period.from, period.to),
  );
  const channelData = channels.map((name) => ({
    name,
    value: selectedOrders
      .filter((o) => o.channel === name && isRevenue(o))
      .reduce((sum, o) => sum + orderTotal(o), 0),
  }));
  const goal = 150000000,
    completion = Math.round((current.revenue / goal) * 100);
  const topProducts = data.products
    .map((p) => ({
      ...p,
      sales: selectedOrders
        .filter(isRevenue)
        .flatMap((o) => o.items)
        .filter((i) => i.productId === p.id)
        .reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      units: selectedOrders
        .filter(isRevenue)
        .flatMap((o) => o.items)
        .filter((i) => i.productId === p.id)
        .reduce((s, i) => s + i.quantity, 0),
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
  const taskList = data.tasks
    .filter((t) => !t.done && (!sales || t.department === "sales"))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 4);
  const mainRevenue =
    chartData(data.orders, period).reduce((s, d) => s + d.revenue, 0) * 100;
  return (
    <>
      <PageHeading
        eyebrow={sales ? "ОТДЕЛ ПРОДАЖ" : "РАБОЧЕЕ ПРОСТРАНСТВО"}
        title={
          sales ? "Продажи в деталях" : `Добрый день, ${name.split(" ")[0]}`
        }
        description={
          sales
            ? "Вся картина продаж. От первого контакта до повторной покупки."
            : "Главное о вашем бизнесе — в одном пространстве."
        }
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/tasks")}>
              <CalendarDays size={16} />
              Задачи команды
            </Button>
            <Button onClick={() => navigate("/sales/orders?create=1")}>
              <Plus size={17} />
              Новый заказ
            </Button>
          </>
        }
      />
      {!sales && !preferences.welcomeHidden && (
        <div className="welcome-banner">
          <button
            className="dismiss-banner"
            aria-label="Скрыть приветственный баннер"
            title="Скрыть баннер"
            onClick={() => preferences.update({ welcomeHidden: true })}
          >
            <X size={16} />
          </button>
          <div>
            <span className="banner-label">
              <span />
              NOVA ДЛЯ FORM & HOME
            </span>
            <h2>
              Всё под контролем.
              <br />
              Бизнес — в движении.
            </h2>
            <p>
              Объединяйте команду, замечайте возможности
              <br className="desktop-break" /> и превращайте данные в решения.
            </p>
            <Button
              className="banner-button"
              onClick={() => navigate("/sales")}
            >
              Перейти к продажам
              <ArrowUpRight size={16} />
            </Button>
          </div>
          <div className="banner-art" aria-hidden="true">
            <div className="orbital orbital-1" />
            <div className="orbital orbital-2" />
            <div className="orbital orbital-3" />
            <div className="banner-symbol">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="floating-chip chip-1">
              <span className="chip-icon">
                <ShoppingBag size={16} />
              </span>
              <div>
                <small>Новые возможности</small>
                <strong>
                  {
                    data.deals.filter(
                      (d) => d.stage !== "won" && d.stage !== "lost",
                    ).length
                  }{" "}
                  активных сделок
                </strong>
              </div>
              <ArrowUpRight size={15} />
            </div>
            <div className="floating-chip chip-2">
              <span className="chip-icon green">
                <CircleCheck size={16} />
              </span>
              <div>
                <small>Команда на связи</small>
                <strong>7 специалистов</strong>
              </div>
              <div className="tiny-avatars">
                <i>АВ</i>
                <i>АС</i>
                <i>+5</i>
              </div>
            </div>
            <span className="art-star star-1">✦</span>
            <span className="art-star star-2">✦</span>
          </div>
        </div>
      )}
      <div className="overview-heading">
        <div>
          <h2>
            {sales ? "Ключевые показатели" : "Обзор бизнеса"}
            <Badge tone="green">
              <span className="live-dot" />
              Обновлено
            </Badge>
          </h2>
          <p>
            {dateLabel(period.from)} — {dateLabel(period.to, true)}
          </p>
        </div>
        <PeriodPicker period={period} onChange={setPeriod} />
      </div>
      <KPIGrid period={period} />
      <FinancialSummary period={period} />
      <div className="dashboard-middle">
        <FinancialChartPanel period={period} />
        {sales ? (
          <section className="card">
            <SectionHeading
              title="Каналы продаж"
              description="Доля в общей выручке"
            />
            <ChannelDonut data={channelData} />
            <div className="card-footnote">
              Выручка с учётом скидок и доставки
            </div>
          </section>
        ) : (
          <section className="card goal-card">
            <div className="goal-head">
              <span className="soft-violet icon-box">
                <Target size={20} />
              </span>
              <Badge>Демо-план</Badge>
            </div>
            <h2>Двигаемся к цели</h2>
            <p>План выручки на выбранный период</p>
            <div className="goal-number">
              <strong>
                {Math.min(completion, 999)}
                <span>%</span>
              </strong>
              <span>выполнено</span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(completion, 100)}%` }} />
            </div>
            <div className="goal-values">
              <span>{money(current.revenue, true)}</span>
              <span>из {money(goal, true)}</span>
            </div>
            <div className="goal-note">
              <Sparkles size={17} />
              <p>
                {completion >= 100
                  ? "Отличная работа! План уже выполнен."
                  : `До цели осталось ${money(Math.max(0, goal - current.revenue), true)}. Каждая сделка приближает результат.`}
              </p>
            </div>
            <TextLink onClick={() => navigate("/sales/pipeline")}>
              Открыть воронку
            </TextLink>
          </section>
        )}
      </div>
      {sales && (
        <div className="dashboard-middle sales-bottom">
          <section className="card">
            <SectionHeading
              title="Товары, которые выбирают"
              description="Продажи товаров без скидок и доставки"
              action={<Badge>Топ-5</Badge>}
            />
            <div className="top-products">
              {topProducts.some((p) => p.sales > 0) ? (
                topProducts
                  .filter((p) => p.sales > 0)
                  .map((p, i) => (
                    <div className="product-row" key={p.id}>
                      <span className="product-rank">0{i + 1}</span>
                      <span
                        className="product-thumb"
                        style={
                          { "--product-color": p.color } as React.CSSProperties
                        }
                      >
                        <Layers3 size={22} />
                      </span>
                      <div>
                        <strong>{p.name}</strong>
                        <span>
                          {p.category} · {p.units} шт.
                        </span>
                      </div>
                      <strong>{money(p.sales)}</strong>
                    </div>
                  ))
              ) : (
                <Empty
                  title="Нет продаж за период"
                  description="Выберите другой диапазон дат."
                />
              )}
            </div>
          </section>
          <section className="card funnel-summary">
            <SectionHeading
              title="Воронка в цифрах"
              description="Текущие активные сделки"
              action={
                <TextLink onClick={() => navigate("/sales/pipeline")}>
                  Kanban
                </TextLink>
              }
            />
            {(["new", "qualified", "proposal", "negotiation"] as const).map(
              (stage, i) => {
                const count = data.deals.filter(
                  (d) => d.stage === stage,
                ).length;
                return (
                  <button
                    className="funnel-row"
                    key={stage}
                    onClick={() => navigate(`/sales/pipeline?stage=${stage}`)}
                  >
                    <span>
                      <i
                        style={{
                          background: [
                            "#a7a2b7",
                            "#a195ed",
                            "#85aec6",
                            "#e2b881",
                          ][i],
                        }}
                      />
                      {
                        [
                          "Новые лиды",
                          "Квалификация",
                          "Предложение",
                          "Переговоры",
                        ][i]
                      }
                    </span>
                    <div className="funnel-bar">
                      <span
                        style={{
                          width: `${Math.max(8, (count / Math.max(data.deals.length, 1)) * 220)}%`,
                          background: [
                            "#d1cedc",
                            "#c2b7f4",
                            "#b6d5e6",
                            "#eed4b2",
                          ][i],
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                    <ChevronRight size={14} />
                  </button>
                );
              },
            )}
            <div className="funnel-callout">
              <span>Выигранные сделки</span>
              <strong>
                {data.deals.filter((d) => d.stage === "won").length}
                <Badge tone="green">Успешно</Badge>
              </strong>
            </div>
          </section>
        </div>
      )}
      <div className="dashboard-bottom">
        <section className="card recent-orders">
          <SectionHeading
            title="Последние заказы"
            description="Новые покупки и их статус"
            action={
              <TextLink onClick={() => navigate("/sales/orders")}>
                Все заказы
              </TextLink>
            }
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Заказ / клиент</th>
                  <th>Канал</th>
                  <th>Сумма</th>
                  <th>Оплата</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {selectedOrders.slice(0, 5).map((o) => {
                  const customer = data.customers.find(
                    (c) => c.id === o.customerId,
                  )!;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/sales/orders?open=${o.id}`)}
                    >
                      <td>
                        <button
                          className="table-entity"
                          onClick={() => navigate(`/sales/orders?open=${o.id}`)}
                        >
                          <span className="order-mini-icon">
                            <ShoppingBag size={15} />
                          </span>
                          <span>
                            <strong>{o.number}</strong>
                            <small>
                              {customer.name.split(" ").slice(0, 2).join(" ")}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="channel-text">
                          <i
                            className={cn(
                              "channel-dot",
                              o.channel.toLowerCase(),
                            )}
                          />
                          {o.channel}
                        </span>
                      </td>
                      <td className="nowrap font-medium">
                        {money(orderTotal(o))}
                      </td>
                      <td>
                        <Badge
                          tone={
                            o.shipping === "cancelled"
                              ? "neutral"
                              : o.payment === "paid"
                                ? "green"
                                : "orange"
                          }
                        >
                          {o.shipping === "cancelled"
                            ? "Отменён"
                            : o.payment === "paid"
                              ? "Оплачен"
                              : "Ожидание"}
                        </Badge>
                      </td>
                      <td>
                        <ArrowUpRight size={15} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!selectedOrders.length && (
              <Empty
                title="Заказов пока нет"
                description="За выбранный период нет заказов."
              />
            )}
          </div>
        </section>
        <section className="card tasks-card">
          <SectionHeading
            title="В фокусе команды"
            description="Ближайшие задачи и приоритеты"
            action={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Создать задачу"
                onClick={() => navigate("/tasks?create=1")}
              >
                <Plus size={18} />
              </Button>
            }
          />
          <div>
            {taskList.length ? (
              taskList.map((t) => <TaskRow task={t} key={t.id} />)
            ) : (
              <Empty
                title="Всё выполнено"
                description="Создайте новую задачу для команды."
              />
            )}
          </div>
          <button className="all-tasks" onClick={() => navigate("/tasks")}>
            Все задачи
            <ArrowRight size={15} />
          </button>
        </section>
      </div>
      {!sales && (
        <section className="activity-section">
          <SectionHeading
            title="Лента событий"
            action={
              <Badge>
                <span className="live-dot" />В реальном времени
              </Badge>
            }
          />
          <div className="activity-grid">
            {data.activities.slice(0, 3).map((a) => (
              <button key={a.id} onClick={() => navigate(a.route)}>
                <span
                  className={cn(
                    "activity-icon",
                    a.type === "order"
                      ? "soft-violet"
                      : a.type === "deal"
                        ? "soft-blue"
                        : "soft-green",
                  )}
                >
                  {a.type === "order" ? (
                    <ShoppingBag size={17} />
                  ) : a.type === "deal" ? (
                    <Target size={17} />
                  ) : (
                    <Users size={17} />
                  )}
                </span>
                <div>
                  <p>{a.title}</p>
                  <span>{dateLabel(a.createdAt)}</span>
                </div>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="page-footer">
        <span>
          <span className="footer-mark">✦</span>NOVA ERP · Ваш бизнес в одном
          ритме
        </span>
        <span>Демонстрационные данные · FORM & HOME</span>
      </div>
    </>
  );
}
