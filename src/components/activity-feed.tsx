import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ExternalLink,
  ShoppingBag,
  Target,
  Users,
  ListTodo,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useERP } from "../data/store";
import { useWorkspace, type WorkspaceProject } from "../data/workspace";
import { dateLabel, money, shiftDate, today } from "../lib/utils";
import { dealValue, orderTotal } from "../data/selectors";
import { paymentNames, stageNames } from "../data/schema";
import { Avatar, Dialog, Empty, Select } from "./ui";

type FeedFilter = "all" | "unread" | "today" | "week";
const filters: [FeedFilter, string][] = [
  ["all", "Все"],
  ["unread", "Новые"],
  ["today", "Сегодня"],
  ["week", "За неделю"],
];
const eventDay = (value: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

export function ActivityFeed({ project }: { project?: WorkspaceProject }) {
  const data = useERP((s) => s.data),
    workspace = useWorkspace(),
    navigate = useNavigate();
  const [filter, setFilter] = useState<FeedFilter>("all"),
    [expanded, setExpanded] = useState(false);
  const activities = data.activities.filter(
    (a) =>
      !project ||
      project.taskIds.includes(a.entityId) ||
      project.dealIds.includes(a.entityId) ||
      data.orders.some(
        (o) =>
          o.id === a.entityId && o.dealId && project.dealIds.includes(o.dealId),
      ),
  );
  const unread = activities.filter(
    (a) => !workspace.readActivityIds.includes(a.id),
  ).length;
  const shown = activities.filter((a) =>
    filter === "unread"
      ? !workspace.readActivityIds.includes(a.id)
      : filter === "today"
        ? eventDay(a.createdAt) === today()
        : filter === "week"
          ? eventDay(a.createdAt) >= shiftDate(today(), -6) &&
            eventDay(a.createdAt) <= today()
          : true,
  );
  const filterControl = (label: string) => (
    <Select
      aria-label={label}
      value={filter}
      onChange={(e) => setFilter(e.target.value as FeedFilter)}
    >
      {filters.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
  const eventList = () => (
    <div className="activity-feed-list">
      {shown.slice(0, 100).map((a, index) => {
        const viewed = workspace.readActivityIds.includes(a.id);
        const order = data.orders.find((o) => o.id === a.entityId),
          deal = data.deals.find((d) => d.id === a.entityId),
          customer = data.customers.find((c) => c.id === a.entityId),
          task = data.tasks.find((t) => t.id === a.entityId);
        const actor =
          data.employees.find((e) => a.title.includes(e.name)) ||
          data.employees.find(
            (e) =>
              e.id ===
              (order?.managerId || deal?.managerId || task?.employeeId),
          );
        const Icon =
          a.type === "order"
            ? ShoppingBag
            : a.type === "deal"
              ? Target
              : a.type === "task"
                ? ListTodo
                : Users;
        const subject = order
          ? `Заказ ${order.number}`
          : deal?.title ||
            task?.title ||
            customer?.name ||
            "Рабочее пространство";
        const detail = order
          ? `${paymentNames[order.payment]} · ${money(orderTotal(order))}`
          : deal
            ? `${stageNames[deal.stage]} · ${money(dealValue(deal))}`
            : task
              ? task.done
                ? "Завершено"
                : "Задача команды"
              : customer?.segment || "Обновление";
        let action =
          actor && a.title.startsWith(actor.name)
            ? a.title.slice(actor.name.length).replace(/^[\s·:]+/, "")
            : a.title;
        if (a.demo && deal) action = "обновление сделки";
        if (a.demo && task)
          action = task.done ? "задача завершена" : "назначена задача";
        const fullDate = new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Moscow",
        }).format(new Date(a.createdAt));
        const time =
          eventDay(a.createdAt) === today()
            ? new Intl.DateTimeFormat("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Moscow",
              }).format(new Date(a.createdAt))
            : dateLabel(eventDay(a.createdAt));
        return (
          <button
            className={`feed-event ${viewed ? "viewed" : "unread"}`}
            key={a.id}
            aria-label={`${a.title}. ${viewed ? "Просмотрено" : "Новое событие"}`}
            onClick={() => {
              workspace.readActivities([a.id]);
              setExpanded(false);
              navigate(a.route);
            }}
          >
            <span className="feed-marker" aria-hidden="true">
              {viewed ? <Check size={8} /> : <span />}
            </span>
            <span className="feed-body">
              <span className="feed-event-heading">
                {actor ? (
                  <Avatar name={actor.name} portrait size="sm" />
                ) : (
                  <span className={`feed-kind feed-kind-${a.type}`}>
                    <Icon size={12} />
                  </span>
                )}
                <span className="feed-message">
                  {actor && <strong>{actor.name} </strong>}
                  {action}
                </span>
                <time title={fullDate}>{time}</time>
              </span>
              {index === 0 || a.type === "order" ? (
                <span className={`feed-record feed-record-${a.type}`}>
                  <span className="feed-record-icon">
                    <Icon size={20} />
                  </span>
                  <span>
                    <strong>{subject}</strong>
                    <small>{detail}</small>
                  </span>
                  <ArrowUpRight size={12} />
                </span>
              ) : (
                <span className="feed-subject">
                  <Icon size={11} />
                  <span>{subject}</span>
                  <ArrowUpRight size={11} />
                </span>
              )}
              <span className="feed-event-foot">
                <span className="feed-state">
                  {viewed ? "Просмотрено" : "Новое"}
                </span>
                {a.demo && <span className="feed-demo">Демо</span>}
              </span>
            </span>
          </button>
        );
      })}
      {!shown.length && (
        <Empty
          title={
            filter === "unread" ? "Всё просмотрено" : "Нет событий за период"
          }
          description="Выберите другой фильтр или продолжите работу с проектом."
        />
      )}
    </div>
  );
  return (
    <>
      <section className="card activity-feed" aria-label="Лента событий">
        <header>
          <h2>
            События{" "}
            {unread > 0 && <span className="feed-unread-count">{unread}</span>}
          </h2>
          <div className="feed-header-actions">
            {filterControl("Фильтр событий")}
            <button
              title="Отметить всё просмотренным"
              aria-label="Отметить все события просмотренными"
              disabled={!unread}
              onClick={() =>
                workspace.readActivities(activities.map((a) => a.id))
              }
            >
              <CheckCheck size={15} />
            </button>
            <button
              title="Открыть весь журнал"
              aria-label="Открыть журнал событий"
              onClick={() => setExpanded(true)}
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </header>
        {eventList()}
      </section>
      <Dialog
        open={expanded}
        onOpenChange={setExpanded}
        title="Журнал событий"
        description={project?.name || "Все изменения рабочего пространства"}
      >
        <div className="activity-journal">
          <div className="activity-journal-toolbar">
            <span>{shown.length} событий</span>
            {filterControl("Фильтр журнала событий")}
          </div>
          {expanded && eventList()}
        </div>
      </Dialog>
    </>
  );
}
