import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Plus,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useERP } from "../data/store";
import { channels, paymentNames, shippingNames } from "../data/schema";
import {
  emptyOrderFilters,
  filterOrders,
  orderTotal,
  type OrderFilters,
} from "../data/selectors";
import { cn, dateLabel, downloadCsv, money } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Field,
  Input,
  PageHeading,
  SearchInput,
  Select,
} from "../components/ui";

export function Orders() {
  const navigate = useNavigate();
  const data = useERP((s) => s.data);
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<OrderFilters>(() => ({
    ...emptyOrderFilters,
    from: /^\d{4}-\d{2}-\d{2}$/.test(params.get("from") || "")
      ? params.get("from")!
      : "",
    to: /^\d{4}-\d{2}-\d{2}$/.test(params.get("to") || "")
      ? params.get("to")!
      : "",
  }));
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const update = (patch: Partial<OrderFilters>) => {
    setFilters((v) => ({ ...v, ...patch }));
    setPage(1);
  };
  const filtered = useMemo(() => filterOrders(data, filters), [data, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10)),
    actualPage = Math.min(page, pageCount),
    rows = filtered.slice((actualPage - 1) * 10, actualPage * 10);
  const filterCount = [
    filters.channel !== "all",
    filters.manager !== "all",
    filters.payment !== "all",
    !!filters.from,
    !!filters.to,
  ].filter(Boolean).length;
  const exportOrders = () => {
    downloadCsv("nova-orders.csv", [
      [
        "Номер",
        "Дата",
        "Клиент",
        "Канал",
        "Менеджер",
        "Сумма, ₽",
        "Оплата",
        "Доставка",
      ],
      ...filtered.map((o) => [
        o.number,
        o.createdAt,
        data.customers.find((c) => c.id === o.customerId)?.name || "",
        o.channel,
        data.employees.find((e) => e.id === o.managerId)?.name || "",
        (orderTotal(o) / 100).toFixed(2),
        paymentNames[o.payment],
        shippingNames[o.shipping],
      ]),
    ]);
    toast.success(`Экспортировано заказов: ${filtered.length}`);
  };
  return (
    <>
      <PageHeading
        eyebrow="ОТДЕЛ ПРОДАЖ"
        title="Заказы"
        description="От первого клика до доставки. Каждая покупка на своём месте."
        actions={
          <>
            <Button variant="outline" onClick={exportOrders}>
              <Download size={16} />
              Экспорт CSV
            </Button>
            <Button onClick={() => navigate("/sales/orders?create=1")}>
              <Plus size={17} />
              Новый заказ
            </Button>
          </>
        }
      />
      <div className="list-summary">
        <div>
          <span className="soft-violet icon-box">
            <ShoppingBag size={20} />
          </span>
          <p>
            <span>Всего заказов</span>
            <strong>{data.orders.length}</strong>
          </p>
        </div>
        <div>
          <span className="summary-dot green" />
          <p>
            <span>Оплачено</span>
            <strong>
              {
                data.orders.filter(
                  (o) => o.payment === "paid" && o.shipping !== "cancelled",
                ).length
              }
            </strong>
          </p>
        </div>
        <div>
          <span className="summary-dot orange" />
          <p>
            <span>Ожидают оплаты</span>
            <strong>
              {
                data.orders.filter(
                  (o) => o.payment === "unpaid" && o.shipping !== "cancelled",
                ).length
              }
            </strong>
          </p>
        </div>
        <div>
          <span className="summary-dot violet" />
          <p>
            <span>В работе</span>
            <strong>
              {
                data.orders.filter((o) =>
                  ["new", "processing", "shipped"].includes(o.shipping),
                ).length
              }
            </strong>
          </p>
        </div>
      </div>
      <section className="card list-card">
        <div className="list-tabs">
          {[
            ["all", "Все заказы"],
            ["new", "Новые"],
            ["processing", "В сборке"],
            ["shipped", "В доставке"],
            ["delivered", "Доставлены"],
            ["cancelled", "Отменены"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={cn(filters.shipping === value && "active")}
              onClick={() => update({ shipping: value })}
            >
              {label}
              {value === "all" && <span>{data.orders.length}</span>}
            </button>
          ))}
        </div>
        <div className="list-toolbar">
          <SearchInput
            value={filters.search}
            onChange={(search) => update({ search })}
            placeholder="Номер заказа, клиент или email…"
          />
          <div className="toolbar-actions">
            <Button
              variant={expanded ? "secondary" : "outline"}
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              <SlidersHorizontal size={15} />
              Фильтры
              {filterCount > 0 && (
                <span className="count-pill">{filterCount}</span>
              )}
            </Button>
            <Select
              aria-label="Сортировка заказов"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="amount-desc">Сумма: по убыванию</option>
              <option value="amount-asc">Сумма: по возрастанию</option>
            </Select>
          </div>
        </div>
        {expanded && (
          <div className="filter-panel">
            <Field label="Канал">
              <Select
                value={filters.channel}
                onChange={(e) => update({ channel: e.target.value })}
              >
                <option value="all">Все каналы</option>
                {channels.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Менеджер">
              <Select
                value={filters.manager}
                onChange={(e) => update({ manager: e.target.value })}
              >
                <option value="all">Все менеджеры</option>
                {data.employees
                  .filter((e) => e.department === "sales")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Оплата">
              <Select
                value={filters.payment}
                onChange={(e) => update({ payment: e.target.value })}
              >
                <option value="all">Любая оплата</option>
                {Object.entries(paymentNames).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Дата с">
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => update({ from: e.target.value })}
              />
            </Field>
            <Field label="Дата по">
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => update({ to: e.target.value })}
              />
            </Field>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters(emptyOrderFilters);
                setPage(1);
              }}
            >
              <RotateCcw size={14} />
              Сбросить
            </Button>
            {filters.from && filters.to && filters.from > filters.to && (
              <p className="field-error">
                Начальная дата позже конечной. Измените диапазон.
              </p>
            )}
          </div>
        )}
        <div className="table-scroll">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Номер заказа</th>
                <th>Клиент</th>
                <th>Канал</th>
                <th>
                  Сумма <ArrowDownUp size={11} />
                </th>
                <th>Оплата</th>
                <th>Доставка</th>
                <th>Менеджер</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const customer = data.customers.find(
                    (c) => c.id === o.customerId,
                  )!,
                  employee = data.employees.find((e) => e.id === o.managerId)!;
                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/sales/orders?open=${o.id}`)}
                  >
                    <td>
                      <button
                        className="table-order-button"
                        onClick={() => navigate(`/sales/orders?open=${o.id}`)}
                      >
                        <strong>{o.number}</strong>
                        <span>{dateLabel(o.createdAt, true)}</span>
                      </button>
                    </td>
                    <td>
                      <div className="table-customer">
                        <Avatar
                          name={customer.name}
                          color={o.channel === "B2B" ? "blue" : "neutral"}
                          size="sm"
                        />
                        <div>
                          <strong>{customer.name}</strong>
                          <span>{customer.city}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="channel-label">{o.channel}</span>
                    </td>
                    <td className="nowrap font-semibold">
                      {money(orderTotal(o))}
                    </td>
                    <td>
                      <Badge tone={o.payment === "paid" ? "green" : "orange"}>
                        <span className="status-dot" />
                        {o.payment === "paid" ? "Оплачен" : "Ожидание"}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        tone={
                          o.shipping === "delivered"
                            ? "green"
                            : o.shipping === "shipped"
                              ? "blue"
                              : o.shipping === "cancelled"
                                ? "neutral"
                                : o.shipping === "processing"
                                  ? "violet"
                                  : "orange"
                        }
                      >
                        {shippingNames[o.shipping]}
                      </Badge>
                    </td>
                    <td>
                      <Avatar
                        name={employee.name}
                        color={employee.color}
                        size="sm"
                      />
                    </td>
                    <td>
                      <ArrowUpRight size={15} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(emptyOrderFilters);
                  setPage(1);
                }}
              >
                <X size={14} />
                Сбросить фильтры
              </Button>
            }
          />
        )}
        <div className="pagination">
          <span>
            {filtered.length
              ? `${(actualPage - 1) * 10 + 1}–${Math.min(actualPage * 10, filtered.length)} из ${filtered.length} заказов`
              : "0 заказов"}
          </span>
          <div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Предыдущая страница"
              disabled={actualPage <= 1}
              onClick={() => setPage(actualPage - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span>
              Страница <strong>{actualPage}</strong> из {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Следующая страница"
              disabled={actualPage >= pageCount}
              onClick={() => setPage(actualPage + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>
      <div className="list-bottom-note">
        <Filter size={13} />
        Показана выборка на{" "}
        {money(filtered.reduce((s, o) => s + orderTotal(o), 0))}. Отменённые и
        неоплаченные заказы не входят в выручку.
      </div>
    </>
  );
}
