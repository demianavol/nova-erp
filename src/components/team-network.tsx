import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { company } from "../data/company";
import { CompanyBrand } from "./company-brand";

const nodes = company.departments.map((item) => {
  const peers = company.departments.filter((peer) => peer.group === item.group);
  const y =
    item.group === "front"
      ? 65 + peers.indexOf(item) * 85
      : 105 + peers.indexOf(item) * 95;
  const x = item.group === "front" ? 154 : 546;
  return {
    ...item,
    y,
    path: `M ${x} ${y} C ${item.group === "front" ? 240 : 460} ${y}, ${item.group === "front" ? 260 : 440} 200, 350 200`,
  };
});

export function TeamNetwork({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [activated, setActivated] = useState<string[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  const started = useRef(new Set<string>());
  const timers = useRef(new Set<number>());
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );
  const select = (id: string) => {
    onSelect(id);
    if (started.current.has(id)) return;
    started.current.add(id);
    setActivated((current) => [...current, id]);
    const arrive = () =>
      setConnected((current) =>
        current.includes(id) ? current : [...current, id],
      );
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) arrive();
    else {
      const timer = window.setTimeout(() => {
        arrive();
        timers.current.delete(timer);
      }, 900);
      timers.current.add(timer);
    }
  };
  const complete = connected.length === nodes.length;
  return (
    <div
      className={`lp-team-network${complete ? " is-complete" : ""}`}
      data-connected={connected.length}
    >
      <svg
        className="lp-network-lines"
        viewBox="0 0 700 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {nodes.map((node) => (
          <path key={node.id} d={node.path} className="lp-network-line" />
        ))}
        {activated.map((id) => (
          <path
            key={id}
            d={nodes.find((node) => node.id === id)!.path}
            className="lp-network-active lp-network-connected"
            pathLength="1"
          />
        ))}
        {activated
          .filter((id) => !connected.includes(id))
          .map((id) => (
            <circle key={id} r="3" className="lp-network-signal">
              <animateMotion
                path={nodes.find((node) => node.id === id)!.path}
                dur="0.9s"
                fill="freeze"
              />
            </circle>
          ))}
      </svg>
      <div
        className={`lp-network-hub${complete ? " is-complete" : ""}`}
        role="progressbar"
        aria-label="Знакомство с командой"
        aria-valuemin={0}
        aria-valuemax={nodes.length}
        aria-valuenow={connected.length}
        aria-valuetext={`${connected.length} из ${nodes.length} отделов`}
        style={
          {
            "--hub-fill": `${(connected.length / nodes.length) * 100}%`,
          } as CSSProperties
        }
      >
        <div className="lp-hub-reservoir" aria-hidden="true">
          <div className="lp-hub-fill" />
        </div>
        <div className="lp-hub-logo" aria-hidden="true">
          <CompanyBrand compact />
        </div>
        <svg
          className="lp-hub-progress"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="57"
            pathLength="1"
            style={{ strokeDasharray: `${connected.length / nodes.length} 1` }}
          />
        </svg>
        {complete && (
          <svg
            className="lp-hub-burst"
            viewBox="0 0 160 160"
            aria-hidden="true"
          >
            <path d="M80 3v12M80 145v12M3 80h12M145 80h12M24 24l8 8M128 128l8 8M24 136l8-8M128 32l8-8" />
          </svg>
        )}
      </div>
      <p className="lp-network-status" role="status" aria-live="polite">
        {complete
          ? "Вся команда — один результат"
          : `${connected.length} из ${nodes.length} отделов`}
      </p>
      <div className="lp-network-groups">
        {(
          [
            ["front", "Фронт-офис"],
            ["back", "Бэк-офис"],
          ] as const
        ).map(([group, title]) => (
          <div className={`lp-network-group lp-network-${group}`} key={group}>
            <h3>{title}</h3>
            <div className="lp-department-buttons">
              {nodes
                .filter((node) => node.group === group)
                .map((node, index) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`${node.id === selectedId ? "is-active" : ""}${connected.includes(node.id) ? " is-connected" : ""}`}
                    aria-pressed={node.id === selectedId}
                    aria-controls="department-info"
                    style={
                      {
                        "--node-y": `${node.y / 4}%`,
                        "--node-delay": `${index * 80 + 100}ms`,
                      } as CSSProperties
                    }
                    onClick={() => select(node.id)}
                  >
                    <span>{node.title}</span>
                    {connected.includes(node.id) ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      <ArrowUpRight size={15} aria-hidden="true" />
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
