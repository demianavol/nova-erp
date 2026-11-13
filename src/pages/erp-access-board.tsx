import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Building2, Eye, Plus, Shield, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Dialog, Input, Select } from "../components/ui";
import { HoldButton } from "../components/ui/action-buttons";
import {
  accessDepartments,
  canManageAccess,
  departmentPermissions,
  employeeDepartments,
  employeeNode,
  useAccessBoard,
  type AccessLink,
  type DepartmentPermission,
} from "../data/access-board";
import { erpSections } from "../data/erp-sections";
import { useERP } from "../data/store";
import "./erp-access-board.css";

type Point = { x: number; y: number };
type Gesture = { port: string; pointerId: number };
const input = (id: string) => `in:${id}`;
const output = (id: string) => `out:${id}`;

function linkBetween(first: string, second: string): AccessLink | null {
  const [source, target] = first.startsWith("out:")
    ? [first, second]
    : [second, first];
  if (!source.startsWith("out:") || !target.startsWith("in:")) return null;
  return { from: source.slice(4), to: target.slice(3) };
}

function curve(from: Point, to: Point) {
  const bend = Math.max(24, (to.x - from.x) * 0.52);
  return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
}

export function ErpAccessBoard() {
  const navigate = useNavigate();
  const employees = useERP((state) => state.data.employees);
  const {
    graph,
    preview,
    previewEmployeeId,
    addRole,
    connect,
    disconnect,
    setPermission,
  } = useAccessBoard();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [roleName, setRoleName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<AccessLink | null>(null);
  const [linkToRemove, setLinkToRemove] = useState<AccessLink | null>(null);
  const [points, setPoints] = useState<Record<string, Point>>({});
  const [drag, setDrag] = useState<{ port: string; end: Point } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const employee = employees.find(({ id }) => id === employeeId);
  const departments = employee ? employeeDepartments(graph, employee.id) : [];
  const names = new Map([
    ...employees.map(({ id, name }) => [employeeNode(id), name] as const),
    ...graph.roles.map(({ id, name }) => [id, name] as const),
    ...accessDepartments.map(({ to, label }) => [to, label] as const),
  ]);
  const links = graph.links.filter(
    ({ from, to }) => names.has(from) && names.has(to),
  );

  useLayoutEffect(() => {
    const canvas = board.current;
    if (!canvas) return;
    function measure() {
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const next: Record<string, Point> = {};
      for (const port of canvas.querySelectorAll<HTMLButtonElement>(
        "button[data-port]",
      )) {
        const rect = port.getBoundingClientRect();
        next[port.dataset.port!] = {
          x: rect.left + rect.width / 2 - bounds.left,
          y: rect.top + rect.height / 2 - bounds.top,
        };
      }
      setPoints(next);
    }
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(canvas);
    for (const node of canvas.querySelectorAll(".access-node"))
      resize.observe(node);
    return () => resize.disconnect();
  }, [graph.roles, employees]);

  function addLink(first: string, second: string) {
    const link = linkBetween(first, second);
    setMessage(
      link ? connect(link) : "Соедините сотрудника с ролью или роль с отделом.",
    );
    setSelectedPort(null);
  }

  function pickPort(port: string) {
    if (selectedPort && selectedPort !== port) {
      addLink(selectedPort, port);
      return;
    }
    setSelectedLink(null);
    setSelectedPort(selectedPort === port ? null : port);
    setMessage(
      selectedPort === port ? "" : "Выберите точку на второй карточке.",
    );
  }

  function movePointer(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    const bounds = board.current?.getBoundingClientRect();
    if (!bounds || active?.pointerId !== event.pointerId) return;
    setDrag({
      port: active.port,
      end: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
    });
  }

  function finishPointer(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (active?.pointerId !== event.pointerId) return;
    gesture.current = null;
    setDrag(null);
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const card = target?.closest(".access-node");
    if (!card || !board.current?.contains(card)) return;

    if (card === event.currentTarget.closest(".access-node")) {
      if (target?.closest("button[data-port]") === event.currentTarget) {
        pickPort(active.port);
      }
      return;
    }

    const side = active.port.startsWith("out:") ? "in" : "out";
    const port = card.querySelector<HTMLButtonElement>(
      `button[data-side="${side}"]`,
    )?.dataset.port;
    if (port) addLink(active.port, port);
  }

  function port(id: string, label: string) {
    return (
      <button
        className="access-port"
        type="button"
        data-port={id}
        data-side={id.startsWith("in:") ? "in" : "out"}
        aria-label={label}
        aria-pressed={selectedPort === id}
        title={label}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          gesture.current = { port: id, pointerId: event.pointerId };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={movePointer}
        onPointerUp={finishPointer}
        onLostPointerCapture={() => {
          if (gesture.current?.port !== id) return;
          gesture.current = null;
          setDrag(null);
        }}
        onClick={(event) => {
          if (event.detail === 0) pickPort(id);
        }}
      />
    );
  }

  function removeLink(link: AccessLink) {
    setMessage(disconnect(link));
    setSelectedLink(null);
  }

  return (
    <section className="access-workspace" aria-labelledby="access-title">
      <header className="access-header">
        <div>
          <h1 className="erp-page-title" id="access-title">
            Доступы
          </h1>
          <p>
            Протяните линию от точки к нужной карточке или нажмите две точки по
            очереди. Роль открывает связанные с ней отделы.
          </p>
          <p>
            Выберите право в списке связей. Роль «Администратор» также открывает
            управление доступами.
          </p>
        </div>
        <form
          className="access-role-form"
          onSubmit={(event) => {
            event.preventDefault();
            const feedback = addRole(roleName);
            setMessage(feedback);
            if (feedback === "Роль создана.") setRoleName("");
          }}
        >
          <Input
            aria-label="Название новой роли"
            placeholder="Название роли"
            value={roleName}
            maxLength={60}
            onChange={(event) => setRoleName(event.target.value)}
            required
          />
          <Button type="submit" variant="outline">
            <Plus size={16} aria-hidden="true" /> Добавить роль
          </Button>
        </form>
      </header>
      <div
        className="access-board-scroll card"
        tabIndex={0}
        role="region"
        aria-label="Доска доступов"
      >
        <div
          className="access-board"
          ref={board}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setSelectedPort(null);
              setSelectedLink(null);
              setMessage("");
            }
          }}
        >
          <svg className="access-wires" aria-hidden="true">
            {links.map((link) => {
              const from = points[output(link.from)];
              const to = points[input(link.to)];
              if (!from || !to) return null;
              const active =
                selectedLink?.from === link.from && selectedLink.to === link.to;
              return (
                <g
                  key={JSON.stringify([link.from, link.to])}
                  data-active={active}
                  className="access-wire"
                >
                  <path d={curve(from, to)} />
                  <path
                    className="access-wire-hit"
                    d={curve(from, to)}
                    onClick={() => {
                      setSelectedLink(link);
                      setSelectedPort(null);
                    }}
                  />
                </g>
              );
            })}
            {drag && points[drag.port] && (
              <path
                className="access-wire-drag"
                d={
                  drag.port.startsWith("out:")
                    ? curve(points[drag.port], drag.end)
                    : curve(drag.end, points[drag.port])
                }
              />
            )}
          </svg>
          <section className="access-column" aria-label="Сотрудники">
            <h2>
              <Users size={16} aria-hidden="true" /> Сотрудники
            </h2>
            {employees.map(({ id, name, role }) => (
              <div
                className="access-node"
                key={id}
                data-selected={employeeId === id}
              >
                <button
                  className="access-person"
                  type="button"
                  aria-pressed={employeeId === id}
                  onClick={() => setEmployeeId(id)}
                >
                  <Avatar name={name} size="sm" />
                  <span>
                    <strong>{name}</strong>
                    <small>{role}</small>
                  </span>
                </button>
                {port(output(employeeNode(id)), `${name}: назначить роль`)}
              </div>
            ))}
          </section>
          <section className="access-column" aria-label="Роли">
            <h2>
              <Shield size={16} aria-hidden="true" /> Роли
            </h2>
            {graph.roles.map(({ id, name }) => (
              <div className="access-node access-node-label" key={id}>
                {port(input(id), `${name}: связать с сотрудником`)}
                <strong>{name}</strong>
                {port(output(id), `${name}: открыть отдел`)}
              </div>
            ))}
          </section>
          <section className="access-column" aria-label="Отделы">
            <h2>
              <Building2 size={16} aria-hidden="true" /> Отделы
            </h2>
            {accessDepartments.map(({ to, label }) => (
              <div className="access-node access-node-label" key={to}>
                {port(input(to), `${label}: связать с ролью`)}
                <strong>{label}</strong>
              </div>
            ))}
          </section>
        </div>
      </div>
      <div className="access-feedback">
        <span role="status">{message}</span>
        {selectedLink && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLinkToRemove(selectedLink)}
          >
            <Trash2 size={15} aria-hidden="true" /> Удалить выбранную связь
          </Button>
        )}
      </div>
      <div className="access-details">
        {employee && (
          <section className="card access-detail">
            <h2>Доступы сотрудника</h2>
            <Select
              aria-label="Сотрудник для проверки"
              className="access-employee-picker"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              {employees.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            {departments.length ? (
              <ul className="access-grants">
                {departments.map(({ to, label, edit, approve }) => (
                  <li key={to}>
                    <strong>{label}</strong> ·{" "}
                    {[
                      edit && departmentPermissions.edit,
                      approve && departmentPermissions.approve,
                    ]
                      .filter(Boolean)
                      .join(", ") || departmentPermissions.view}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Доступ к отделам пока не выдан.</p>
            )}
            {canManageAccess(graph, employee.id) && (
              <p>Может управлять доступами.</p>
            )}
            {!previewEmployeeId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  preview(employee.id);
                  navigate(erpSections.home.to);
                }}
              >
                <Eye size={16} aria-hidden="true" /> Проверить доступ
              </Button>
            )}
          </section>
        )}
        <section className="card access-detail">
          <h2>Связи</h2>
          {links.length === 0 && <p>Добавленные связи появятся здесь.</p>}
          <ul className="access-link-list">
            {links.map((link) => (
              <li
                key={JSON.stringify([link.from, link.to])}
                data-active={
                  selectedLink?.from === link.from &&
                  selectedLink.to === link.to
                }
              >
                <span>
                  {names.get(link.from)} → {names.get(link.to)}
                </span>
                {accessDepartments.some(({ to }) => to === link.to) && (
                  <Select
                    className="access-permission-picker"
                    aria-label={`Права: ${names.get(link.from)} → ${names.get(link.to)}`}
                    value={link.permission ?? "view"}
                    onChange={(event) =>
                      setMessage(
                        setPermission(
                          link,
                          event.target.value as DepartmentPermission,
                        ),
                      )
                    }
                  >
                    {Object.entries(departmentPermissions).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </Select>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Удалить связь"
                  aria-label={`Удалить связь: ${names.get(link.from)} → ${names.get(link.to)}`}
                  onClick={() => setLinkToRemove(link)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Dialog
        open={linkToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setLinkToRemove(null);
        }}
        title="Удалить связь доступа?"
        description={
          linkToRemove
            ? `${names.get(linkToRemove.from)} → ${names.get(linkToRemove.to)}. Удерживайте кнопку для подтверждения.`
            : undefined
        }
      >
        <div className="dialog-footer">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLinkToRemove(null)}
          >
            Отмена
          </Button>
          <HoldButton
            danger
            onConfirm={() => {
              if (linkToRemove) removeLink(linkToRemove);
              setLinkToRemove(null);
            }}
          >
            Удалить связь
          </HoldButton>
        </div>
      </Dialog>
    </section>
  );
}
