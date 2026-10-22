import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  GripVertical,
  Kanban,
  Plus,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useERP } from "../data/store";
import { EmployeeChip } from "../components/people";
import { StageMenu } from "../components/stage-menu";
import { stageNames, stages, type Stage } from "../data/schema";
import { dealValue } from "../data/selectors";
import { cn, dateLabel, money, today } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  PageHeading,
  SearchInput,
  Select,
} from "../components/ui";

export function Pipeline() {
  const { data, moveDeal } = useERP(),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [manager, setManager] = useState("all"),
    [dragging, setDragging] = useState<string | null>(null),
    [over, setOver] = useState<Stage | null>(null);
  const stageFilter = params.get("stage");
  const deals = data.deals.filter(
    (d) =>
      (manager === "all" || d.managerId === manager) &&
      (!stageFilter || d.stage === stageFilter) &&
      `${d.title} ${data.customers.find((c) => c.id === d.customerId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const active = data.deals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost",
  );
  const move = (id: string, stage: Stage) => {
    moveDeal(id, stage);
    toast.success(`Сделка перемещена: ${stageNames[stage]}`);
    setDragging(null);
    setOver(null);
  };
  return (
    <>
      <PageHeading
        eyebrow="ОТДЕЛ ПРОДАЖ"
        title="Воронка продаж"
        description="Каждый контакт — возможность. Помогите ей стать результатом."
        actions={
          <Button onClick={() => navigate("/sales/pipeline?create=1")}>
            <Plus size={17} />
            Новая сделка
          </Button>
        }
      />
      <div className="pipeline-overview">
        <div>
          <span className="soft-violet icon-box">
            <Target size={21} />
          </span>
          <p>
            <span>В работе</span>
            <strong>
              {money(active.reduce((s, d) => s + dealValue(d), 0))}
            </strong>
          </p>
        </div>
        <div>
          <strong>{active.length}</strong>
          <span>активных сделок</span>
        </div>
        <div>
          <strong>{data.deals.filter((d) => d.stage === "won").length}</strong>
          <span>успешно закрыто</span>
        </div>
        <Badge tone="violet">
          <Kanban size={13} />
          Kanban-доска
        </Badge>
      </div>
      <div className="pipeline-toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Найти сделку или клиента…"
        />
        <div>
          <Select
            aria-label="Менеджер сделок"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
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
          {stageFilter && (
            <Button variant="outline" size="sm" onClick={() => setParams({})}>
              {stageNames[stageFilter as Stage] || "Этап"}
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
      <div className="kanban-scroll">
        <div className="kanban-board">
          {stages.map((stage) => {
            const column = deals.filter((d) => d.stage === stage);
            return (
              <section
                key={stage}
                className={cn(
                  "kanban-column",
                  `kanban-${stage}`,
                  over === stage && "kanban-over",
                )}
                onDragOver={(e) => {
                  if (dragging) {
                    e.preventDefault();
                    setOver(stage);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (data.deals.some((d) => d.id === id)) move(id, stage);
                }}
              >
                <div className="kanban-column-heading">
                  <h2>
                    <span />
                    {stageNames[stage]}
                    <small>{column.length}</small>
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Создать сделку: ${stageNames[stage]}`}
                    onClick={() =>
                      navigate(`/sales/pipeline?create=1&initialStage=${stage}`)
                    }
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <p className="column-total">
                  {money(column.reduce((s, d) => s + dealValue(d), 0))}
                </p>
                <div className="kanban-cards">
                  {column.map((deal) => {
                    const customer = data.customers.find(
                        (c) => c.id === deal.customerId,
                      )!,
                      employee = data.employees.find(
                        (e) => e.id === deal.managerId,
                      )!;
                    return (
                      <article
                        key={deal.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", deal.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragging(deal.id);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        className={cn(
                          "deal-card",
                          dragging === deal.id && "deal-dragging",
                        )}
                      >
                        <div className="deal-card-top">
                          <Badge>{deal.channel}</Badge>
                          <GripVertical size={15} />
                        </div>
                        <button
                          className="deal-title"
                          onClick={() =>
                            navigate(`/sales/pipeline?open=${deal.id}`)
                          }
                        >
                          {deal.title}
                        </button>
                        <span className="deal-customer">{customer.name}</span>
                        <strong className="deal-amount">
                          {money(dealValue(deal))}
                        </strong>
                        <div className="deal-meta">
                          <span
                            className={cn(
                              deal.expectedAt < today() &&
                                stage !== "won" &&
                                stage !== "lost" &&
                                "danger-text",
                            )}
                          >
                            <CalendarDays size={12} />
                            {dateLabel(deal.expectedAt)}
                          </span>
                          <EmployeeChip employee={employee} compact />
                        </div>
                        <StageMenu
                          compact
                          label={`Этап сделки ${deal.title}`}
                          value={deal.stage}
                          onChange={(stage) => move(deal.id, stage)}
                        />
                        {stage === "won" && (
                          <button
                            className="deal-order-link"
                            onClick={() =>
                              navigate(`/sales/pipeline?open=${deal.id}`)
                            }
                          >
                            {deal.orderId
                              ? "Открыть связанный заказ"
                              : "Создать заказ"}
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </article>
                    );
                  })}
                  {!column.length && (
                    <div className="kanban-empty">
                      {dragging ? "Перетащите сделку сюда" : "Пока нет сделок"}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {!deals.length && (
        <Empty
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setManager("all");
                setParams({});
              }}
            >
              Сбросить фильтры
            </Button>
          }
        />
      )}
      <p className="kanban-hint">
        <GripVertical size={14} />
        Перетаскивайте карточки между этапами или выберите этап внизу карточки.
      </p>
    </>
  );
}
