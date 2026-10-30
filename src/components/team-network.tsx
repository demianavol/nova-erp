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
  const step = 360 / company.departments.length;
  const angle = (value: number) => (value * Math.PI) / 180;
  const start = angle(-90 + company.departments.indexOf(item) * step + 5);
  const end = angle(-90 + (company.departments.indexOf(item) + 1) * step - 5);
  return {
    ...item,
    y,
    arc: `M ${60 + 49 * Math.cos(start)} ${60 + 49 * Math.sin(start)} A 49 49 0 0 1 ${60 + 49 * Math.cos(end)} ${60 + 49 * Math.sin(end)}`,
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
  const [connected, setConnected] = useState<string[]>([selectedId]);
  const [travelling, setTravelling] = useState<string[]>([]);
  const started = useRef(new Set<string>([selectedId]));
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
    setConnected((current) => [...current, id]);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTravelling((current) => [...current, id]);
      const timer = window.setTimeout(() => {
        setTravelling((current) => current.filter((item) => item !== id));
        timers.current.delete(timer);
      }, 360);
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
        {connected.map((id) => (
          <path
            key={id}
            d={nodes.find((node) => node.id === id)!.path}
            className={`lp-network-active lp-network-connected${!travelling.includes(id) ? " is-settled" : ""}`}
            pathLength="1"
          />
        ))}
        {travelling.map((id) => (
          <circle key={id} r="3" className="lp-network-signal">
            <animateMotion
              path={nodes.find((node) => node.id === id)!.path}
              dur="0.36s"
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
      >
        <div className="lp-hub-logo" aria-hidden="true">
          <CompanyBrand compact />
        </div>
        <svg
          className="lp-hub-segments"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          {nodes.map((node) => (
            <path
              key={node.id}
              d={node.arc}
              className={connected.includes(node.id) ? "is-lit" : undefined}
            />
          ))}
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
