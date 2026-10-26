import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  CalendarDays,
  MoreHorizontal,
  Plus,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../data/workspace";
import { useERP } from "../data/store";
import { stageNames, type Stage } from "../data/schema";
import { dealValue } from "../data/selectors";
import { dateLabel, money } from "../lib/utils";
import { Avatar, Button, TextLink } from "./ui";

const previewStages: Stage[] = [
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "new",
  "lost",
];

/** A compact view of the existing pipeline; all actions open its existing forms. */
export function HomeDealBoard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = () => {
    const el = scrollRef.current;
    if (el)
      setEdges({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      });
  };
  const scroll = (direction: number) => {
    const el = scrollRef.current;
    if (el)
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  };
  const data = useERP((s) => s.data);
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const project = workspace.projects.find(
    (p) => p.id === workspace.selectedProjectId,
  );
  const scopedDeals = data.deals.filter(
    (d) => !project || project.dealIds.includes(d.id),
  );
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    updateEdges();
    return () => observer.disconnect();
  }, [project?.id, scopedDeals.length]);
  return (
    <section className="card home-board" aria-label="Обзор воронки продаж">
      <div className="home-board-header">
        <div>
          <Target size={16} />
          <h2>{project?.name || "Сделки в работе"}</h2>
          <span>
            {
              scopedDeals.filter((d) => d.stage !== "won" && d.stage !== "lost")
                .length
            }
          </span>
        </div>
        <div>
          <TextLink onClick={() => navigate("/sales/pipeline")}>
            Вся воронка
          </TextLink>
          <div className="board-paging">
            <button
              aria-label="Предыдущие этапы"
              disabled={edges.start}
              onClick={() => scroll(-1)}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              aria-label="Следующие этапы"
              disabled={edges.end}
              onClick={() => scroll(1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <Button
            size="sm"
            onClick={() =>
              navigate(
                "/sales/pipeline?create=1" +
                  (project ? "&project=" + encodeURIComponent(project.id) : ""),
              )
            }
          >
            <Plus size={14} />
            Новая сделка
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={updateEdges}
        className="home-board-scroll"
        tabIndex={0}
        aria-label="Этапы сделок, горизонтальная прокрутка"
      >
        {previewStages.map((stage) => {
          const deals = scopedDeals.filter((d) => d.stage === stage);
          return (
            <section
              className={`home-board-column kanban-${stage}`}
              key={stage}
            >
              <div className="home-stage-heading">
                <h3>
                  <i />
                  {stageNames[stage]}
                </h3>
                <span>{deals.length}</span>
                <button
                  aria-label={`Открыть этап: ${stageNames[stage]}`}
                  onClick={() => navigate(`/sales/pipeline?stage=${stage}`)}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
              {deals.slice(0, 2).map((deal) => {
                const customer = data.customers.find(
                  (c) => c.id === deal.customerId,
                );
                const employee = data.employees.find(
                  (e) => e.id === deal.managerId,
                );
                return (
                  <button
                    className="home-deal"
                    key={deal.id}
                    onClick={() => navigate(`/sales/pipeline?open=${deal.id}`)}
                  >
                    <span className="home-deal-title">{deal.title}</span>
                    <span className="home-deal-people-date">
                      <span className="home-deal-date">
                        <CalendarDays size={11} />
                        {dateLabel(deal.expectedAt)}
                      </span>
                      <span className="home-deal-avatars">
                        {customer && (
                          <Avatar name={customer.name} portrait size="sm" />
                        )}
                        {employee && (
                          <Avatar name={employee.name} portrait size="sm" />
                        )}
                      </span>
                    </span>
                    <span className="home-deal-footer">
                      <span
                        className={`deal-priority priority-${deal.priority || "medium"}`}
                      >
                        <Flag size={11} />
                        {
                          { high: "Высокий", medium: "Средний", low: "Низкий" }[
                            deal.priority || "medium"
                          ]
                        }
                      </span>
                      <span>{money(dealValue(deal))}</span>
                    </span>
                  </button>
                );
              })}
              {!deals.length && (
                <p className="home-board-empty">Пока нет сделок</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
