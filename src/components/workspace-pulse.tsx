import { ArrowUpRight, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useERP } from "../data/store";
import { projectTasks, type WorkspaceProject } from "../data/workspace";
import { today, money } from "../lib/utils";
import { dealValue } from "../data/selectors";

export function WorkspacePulse({ project }: { project?: WorkspaceProject }) {
  const data = useERP((s) => s.data),
    navigate = useNavigate();
  const allTasks = projectTasks(data.tasks, project);
  const tasks = allTasks.filter((t) => !t.done);
  const done = allTasks.filter((t) => t.done).length;
  const completion = allTasks.length
    ? Math.round((done / allTasks.length) * 100)
    : 0;
  const angle = Math.PI + (completion / 100) * Math.PI;
  const deals = data.deals.filter(
    (d) =>
      (!project || project.dealIds.includes(d.id)) &&
      d.stage !== "won" &&
      d.stage !== "lost",
  );
  return (
    <section className="card workspace-pulse">
      <header>
        <Clock3 size={15} />
        <h2>Прогресс команды</h2>
      </header>
      <div
        className="pulse-gauge"
        role="img"
        aria-label={`Выполнено ${done} из ${allTasks.length} задач, ${completion}%`}
      >
        <svg viewBox="0 0 240 144" aria-hidden="true">
          <defs>
            <linearGradient
              id="pulse-spectrum"
              x1="26"
              y1="0"
              x2="214"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#a36af4" />
              <stop offset="0.38" stopColor="#7b9bff" />
              <stop offset="0.67" stopColor="#66d8ca" />
              <stop offset="1" stopColor="#efb47e" />
            </linearGradient>
            <filter
              id="pulse-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {Array.from({ length: 21 }, (_, i) => {
            const a = Math.PI + (i * Math.PI) / 20;
            return (
              <line
                key={i}
                x1={120 + 108 * Math.cos(a)}
                y1={118 + 108 * Math.sin(a)}
                x2={120 + 113 * Math.cos(a)}
                y2={118 + 113 * Math.sin(a)}
                stroke="var(--border)"
                strokeWidth="1"
              />
            );
          })}
          <path
            d="M26 118 A94 94 0 0 1 214 118"
            fill="none"
            stroke="url(#pulse-spectrum)"
            strokeWidth="8"
            opacity=".13"
            strokeLinecap="round"
          />
          <path
            d="M26 118 A94 94 0 0 1 214 118"
            fill="none"
            stroke="url(#pulse-spectrum)"
            strokeWidth="9"
            opacity=".5"
            filter="url(#pulse-glow)"
            pathLength="100"
            strokeDasharray={`${completion} 100`}
            strokeLinecap="round"
          />
          {completion > 0 && (
            <>
              <path
                d="M26 118 A94 94 0 0 1 214 118"
                fill="none"
                stroke="url(#pulse-spectrum)"
                strokeWidth="5"
                pathLength="100"
                strokeDasharray={`${completion} 100`}
                strokeLinecap="round"
              />
              <circle
                cx={120 + 94 * Math.cos(angle)}
                cy={118 + 94 * Math.sin(angle)}
                r="4"
                fill="var(--primary)"
              />
            </>
          )}
        </svg>
        <div className="pulse-gauge-value">
          <strong>
            {completion}
            <small>%</small>
          </strong>
          <span>
            {done} из {allTasks.length} задач выполнено
          </span>
        </div>
      </div>
      <div className="pulse-counts">
        <div>
          <strong>{tasks.filter((t) => t.dueAt < today()).length}</strong>
          <span>Просрочено</span>
        </div>
        <div>
          <strong>{tasks.filter((t) => t.dueAt === today()).length}</strong>
          <span>На сегодня</span>
        </div>
        <div>
          <strong>{deals.length}</strong>
          <span>Сделок в работе</span>
        </div>
      </div>
      <div className="pulse-total">
        <span>В активных сделках</span>
        <strong>
          {money(deals.reduce((sum, d) => sum + dealValue(d), 0))}
        </strong>
      </div>
      <button
        onClick={() =>
          navigate(
            "/erp/tasks" +
              (project ? "?project=" + encodeURIComponent(project.id) : ""),
          )
        }
      >
        Открыть задачи
        <ArrowUpRight size={13} />
      </button>
    </section>
  );
}
