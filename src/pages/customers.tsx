import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  Plus,
  Users,
  UserRoundCheck,
  Gem,
  Building2,
} from "lucide-react";
import { useERP } from "../data/store";
import { isRevenue, orderTotal } from "../data/selectors";
import { money, cn } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  PageHeading,
  SearchInput,
  Select,
} from "../components/ui";

export function Customers() {
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  const [search, setSearch] = useState(""),
    [segment, setSegment] = useState("Все"),
    [manager, setManager] = useState("all"),
    [page, setPage] = useState(1);
  const customers = data.customers.filter(
    (c) =>
      (segment === "Все" || c.segment === segment) &&
      (manager === "all" || c.managerId === manager) &&
      `${c.name} ${c.email} ${c.phone} ${c.city}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const pages = Math.max(1, Math.ceil(customers.length / 12)),
    actual = Math.min(page, pages);
  return (
    <>
      <PageHeading
        eyebrow="ОТДЕЛ ПРОДАЖ"
        title="Клиенты"
        description="Люди и компании, с которыми растёт ваш бизнес."
        actions={
          <Button onClick={() => navigate("/erp/sales/customers?create=1")}>
            <Plus size={17} />
            Добавить клиента
          </Button>
        }
      />
      <div className="customer-stat-grid">
        {[
          {
            label: "Клиентов в базе",
            value: data.customers.length,
            icon: Users,
            color: "violet",
          },
          {
            label: "Постоянные",
            value: data.customers.filter((c) => c.segment === "Постоянный")
              .length,
            icon: UserRoundCheck,
            color: "green",
          },
          {
            label: "VIP-клиенты",
            value: data.customers.filter((c) => c.segment === "VIP").length,
            icon: Gem,
            color: "orange",
          },
          {
            label: "B2B-партнёры",
            value: data.customers.filter((c) => c.segment === "B2B").length,
            icon: Building2,
            color: "blue",
          },
        ].map((s) => (
          <div key={s.label} className="card customer-stat">
            <span className={cn("icon-box", `soft-${s.color}`)}>
              <s.icon size={21} />
            </span>
            <div>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <section className="card list-card">
        <div className="list-tabs">
          {["Все", "Новый", "Постоянный", "VIP", "B2B"].map((s) => (
            <button
              key={s}
              className={cn(s === segment && "active")}
              onClick={() => {
                setSegment(s);
                setPage(1);
              }}
            >
              {s === "Все" ? "Все клиенты" : s}
            </button>
          ))}
        </div>
        <div className="list-toolbar">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Имя, email, телефон или город…"
          />
          <Select
            aria-label="Менеджер клиентов"
            value={manager}
            onChange={(e) => {
              setManager(e.target.value);
              setPage(1);
            }}
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
        </div>
        <div className="table-scroll">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Контакты</th>
                <th>Сегмент</th>
                <th>Заказы</th>
                <th>Покупки</th>
                <th>Ответственный</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.slice((actual - 1) * 12, actual * 12).map((c) => {
                const orders = data.orders.filter((o) => o.customerId === c.id),
                  employee = data.employees.find((e) => e.id === c.managerId)!;
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/erp/sales/customers?open=${c.id}`)}
                  >
                    <td>
                      <button
                        className="table-customer"
                        onClick={() =>
                          navigate(`/erp/sales/customers?open=${c.id}`)
                        }
                      >
                        <Avatar
                          name={c.name}
                          color={
                            c.segment === "VIP"
                              ? "orange"
                              : c.segment === "B2B"
                                ? "blue"
                                : "violet"
                          }
                        />
                        <div>
                          <strong>{c.name}</strong>
                          <span>{c.city}</span>
                        </div>
                      </button>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span>
                          <Mail size={12} />
                          {c.email}
                        </span>
                        <small>{c.phone}</small>
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          c.segment === "VIP"
                            ? "orange"
                            : c.segment === "B2B"
                              ? "blue"
                              : c.segment === "Новый"
                                ? "green"
                                : "violet"
                        }
                      >
                        {c.segment}
                      </Badge>
                    </td>
                    <td>{orders.length}</td>
                    <td className="nowrap font-semibold">
                      {money(
                        orders
                          .filter(isRevenue)
                          .reduce((s, o) => s + orderTotal(o), 0),
                      )}
                    </td>
                    <td>
                      <Avatar
                        name={employee.name}
                        color={employee.color}
                        size="sm"
                      />
                    </td>
                    <td>
                      <ArrowUpRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!customers.length && (
          <Empty
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSegment("Все");
                  setManager("all");
                }}
              >
                Сбросить фильтры
              </Button>
            }
          />
        )}
        <div className="pagination">
          <span>Найдено клиентов: {customers.length}</span>
          <div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Предыдущая страница клиентов"
              disabled={actual === 1}
              onClick={() => setPage(actual - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span>
              {actual} из {pages}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Следующая страница клиентов"
              disabled={actual === pages}
              onClick={() => setPage(actual + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
