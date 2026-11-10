import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  GripVertical,
  LayoutGrid,
  Plus,
  X,
} from "lucide-react";
import {
  dashboardWidgets,
  type DashboardWidget,
  type DashboardWidgetId,
} from "../data/dashboard-layout";
import { usePreferences } from "../data/store";
import { useDashboardDrag } from "./dashboard-drag";
import { Button, Menu } from "./ui";

export type WidgetContent = Record<DashboardWidgetId, ReactNode>;

function fitRows(
  widgets: DashboardWidget[],
  size: "columns" | "compactColumns",
) {
  const spans: number[] = [];
  let remaining = 12;
  for (const { id } of widgets) {
    const span = dashboardWidgets[id][size];
    if (span > remaining) {
      // Complete the current row without moving later blocks ahead of it.
      spans[spans.length - 1] += remaining;
      remaining = 12;
    }
    spans.push(span);
    remaining -= span;
  }
  if (spans.length) spans[spans.length - 1] += remaining;
  return spans;
}

type DashboardDrag = ReturnType<typeof useDashboardDrag>;
const WidgetContext = createContext<{
  id: DashboardWidgetId;
  collapsed: boolean;
  toggle: () => void;
  toggleRef: React.RefObject<HTMLButtonElement | null>;
  drag: DashboardDrag;
} | null>(null);

export function DashboardWidgetActions({
  compact = false,
}: {
  compact?: boolean;
}) {
  const widget = useContext(WidgetContext);
  if (!widget || widget.collapsed !== compact) return null;
  const { id, collapsed, toggle, toggleRef, drag } = widget;
  const { label } = dashboardWidgets[id];
  const toggleLabel = `${collapsed ? "Развернуть" : "Свернуть"} «${label}»`;
  return (
    <span className="erp-widget-actions">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="erp-widget-grip"
        aria-label={`Переместить «${label}»`}
        aria-describedby="erp-widget-drag-instructions"
        title="Зажмите и перетащите"
        {...drag.grip(id)}
      >
        <GripVertical size={15} aria-hidden="true" />
      </Button>
      <Button
        ref={toggleRef}
        type="button"
        variant="ghost"
        size="icon"
        className="erp-widget-toggle"
        aria-label={toggleLabel}
        title={toggleLabel}
        aria-expanded={!collapsed}
        aria-controls={`erp-widget-${id}`}
        onClick={toggle}
      >
        {collapsed ? (
          <ChevronDown size={16} aria-hidden="true" />
        ) : (
          <ChevronUp size={16} aria-hidden="true" />
        )}
      </Button>
    </span>
  );
}

function Widget({
  widget: { id, mode },
  columns,
  compact,
  drag,
  children,
}: {
  widget: DashboardWidget;
  columns: number;
  compact: number;
  drag: DashboardDrag;
  children: ReactNode;
}) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const collapsed = mode === "collapsed";
  const { label } = dashboardWidgets[id];
  useLayoutEffect(() => {
    if (restoreFocus.current) {
      toggleRef.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [collapsed]);

  return (
    <div
      className="erp-dashboard-widget"
      data-widget={id}
      data-collapsed={collapsed || undefined}
      data-dragging={drag.preview?.source === id || undefined}
      data-keyboard-source={drag.keyboard?.source === id || undefined}
      data-drop-target={
        (drag.keyboard?.target === id && drag.keyboard.source !== id) ||
        undefined
      }
      role="group"
      aria-label={label}
      style={
        {
          "--erp-widget-span": columns,
          "--erp-widget-compact-span": compact,
        } as CSSProperties
      }
    >
      <WidgetContext.Provider
        value={{
          id,
          collapsed,
          toggleRef,
          drag,
          toggle: () => {
            restoreFocus.current = true;
            setMode(id, collapsed ? "open" : "collapsed");
          },
        }}
      >
        <div className="erp-widget-card">
          <div
            className="erp-widget-summary-track erp-widget-track"
            data-open={collapsed}
            inert={!collapsed}
          >
            <div className="erp-widget-clip">
              <div className="card erp-widget-summary">
                <h2>{label}</h2>
                <DashboardWidgetActions compact />
              </div>
            </div>
          </div>
          <div
            className="erp-widget-body-track erp-widget-track"
            id={`erp-widget-${id}`}
            data-open={!collapsed}
            inert={collapsed}
          >
            <div className="erp-dashboard-widget-body erp-widget-clip">
              {children}
            </div>
          </div>
        </div>
      </WidgetContext.Provider>
    </div>
  );
}

function setMode(id: DashboardWidgetId, mode: DashboardWidget["mode"]) {
  const { dashboardLayout, update } = usePreferences.getState();
  update({
    dashboardLayout: dashboardLayout.map((widget) =>
      widget.id === id ? { id, mode } : widget,
    ),
  });
}

function moveWidget(
  layout: DashboardWidget[],
  source: DashboardWidgetId,
  target: DashboardWidgetId,
) {
  if (source === target) return layout;
  const from = layout.findIndex(
    ({ id, mode }) => id === source && mode !== "hidden",
  );
  const to = layout.findIndex(
    ({ id, mode }) => id === target && mode !== "hidden",
  );
  if (from < 0 || to < 0) return layout;
  const next = [...layout];
  const [widget] = next.splice(from, 1);
  next.splice(to, 0, widget);
  return next;
}

function reorder(source: DashboardWidgetId, target: DashboardWidgetId) {
  const { dashboardLayout, update } = usePreferences.getState();
  const next = moveWidget(dashboardLayout, source, target);
  if (next !== dashboardLayout) update({ dashboardLayout: next });
}

export function DashboardWidgets({ content }: { content: WidgetContent }) {
  const layout = usePreferences((state) => state.dashboardLayout);
  const visible = layout.filter(({ mode }) => mode !== "hidden");
  const drag = useDashboardDrag(
    visible.map(({ id }) => id),
    reorder,
  );
  const arranged = drag.preview
    ? moveWidget(visible, drag.preview.source, drag.preview.target)
    : visible;
  const columns = fitRows(arranged, "columns");
  const compact = fitRows(arranged, "compactColumns");
  const hasCollapsed = visible.some(({ mode }) => mode === "collapsed");
  const setAll = () => {
    const { dashboardLayout, update } = usePreferences.getState();
    update({
      dashboardLayout: dashboardLayout.map((widget) =>
        widget.mode === "hidden"
          ? widget
          : { ...widget, mode: hasCollapsed ? "open" : "collapsed" },
      ),
    });
  };
  return (
    <>
      <div className="erp-dashboard-controls">
        {visible.length > 0 && (
          <Button variant="ghost" size="sm" onClick={setAll}>
            {hasCollapsed ? (
              <ChevronsDown size={15} aria-hidden="true" />
            ) : (
              <ChevronsUp size={15} aria-hidden="true" />
            )}
            {hasCollapsed ? "Развернуть все" : "Свернуть все"}
          </Button>
        )}
        <Menu
          label="Видимость блоков"
          trigger={
            <Button variant="outline" size="sm">
              <LayoutGrid size={15} aria-hidden="true" /> Блоки
            </Button>
          }
          items={layout.map(({ id, mode }) => ({
            label: `${mode === "hidden" ? "Добавить" : "Убрать"} «${dashboardWidgets[id].label}»`,
            icon: mode === "hidden" ? <Plus size={14} /> : <X size={14} />,
            onClick: () => setMode(id, mode === "hidden" ? "open" : "hidden"),
          }))}
        />
      </div>
      <p className="sr-only" id="erp-widget-drag-instructions">
        Нажмите пробел или Enter, чтобы взять блок. Выберите место клавишами со
        стрелками и подтвердите пробелом или Enter. Escape отменяет перенос.
      </p>
      <p className="sr-only" role="status">
        {drag.announcement}
      </p>
      {!visible.length && (
        <p className="card erp-empty-documents">
          Выберите нужные блоки, чтобы собрать главную под себя.
        </p>
      )}
      <div
        className="home-dashboard erp-dashboard-widgets"
        data-pointer-drag={!!drag.preview || undefined}
        ref={drag.gridRef}
        {...drag.pointerHandlers}
      >
        {arranged.map((widget, index) => (
          <Widget
            key={widget.id}
            widget={widget}
            columns={columns[index]}
            compact={compact[index]}
            drag={drag}
          >
            {content[widget.id]}
          </Widget>
        ))}
      </div>
    </>
  );
}
