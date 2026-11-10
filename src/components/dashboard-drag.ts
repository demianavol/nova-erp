import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type PointerEvent,
} from "react";
import {
  dashboardWidgets,
  type DashboardWidgetId,
} from "../data/dashboard-layout";

type Point = { x: number; y: number };
type DragPosition = { source: DashboardWidgetId; target: DashboardWidgetId };
type PointerDrag = {
  id: DashboardWidgetId;
  pointerId: number;
  grid: HTMLDivElement;
  slot: HTMLElement;
  card: HTMLElement;
  start: Point;
  point: Point;
  frame: number;
  active: {
    bounds: DOMRect;
    anchors: Map<HTMLElement, DOMRect>;
    origin: DOMRect;
    scroll: Point;
    target: DashboardWidgetId;
  } | null;
};

const arrowSteps: Record<string, number | undefined> = {
  ArrowUp: -1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowRight: 1,
};

function readSlots(grid: HTMLElement, floating?: PointerDrag) {
  return new Map(
    Array.from(grid.children, (child) => {
      const slot = child as HTMLElement;
      const rect = (
        floating?.slot === slot ? floating.card : slot
      ).getBoundingClientRect();
      return [slot, rect] as const;
    }),
  );
}

function targetAt(drag: PointerDrag) {
  if (!drag.active) return null;
  const { anchors, bounds, scroll } = drag.active;
  const x = drag.point.x + window.scrollX - scroll.x;
  const y = drag.point.y + window.scrollY - scroll.y;
  if (
    x < bounds.left - 12 ||
    x > bounds.right + 12 ||
    y < bounds.top - 12 ||
    y > bounds.bottom + 12
  )
    return null;

  // Use the original slots during the gesture so moving cards cannot push
  // their own hit areas back under the pointer and reverse a move.
  let nearest: DashboardWidgetId | null = null;
  let distance = Infinity;
  for (const [slot, rect] of anchors) {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    const nextDistance = dx * dx + dy * dy;
    if (nextDistance < distance) {
      distance = nextDistance;
      nearest = slot.dataset.widget as DashboardWidgetId;
    }
  }
  return nearest;
}

export function useDashboardDrag(
  ids: DashboardWidgetId[],
  reorder: (source: DashboardWidgetId, target: DashboardWidgetId) => void,
) {
  const gridRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerDrag | null>(null);
  const beforeMove = useRef<Map<HTMLElement, DOMRect> | null>(null);
  const animations = useRef<Animation[]>([]);
  const [keyboard, setKeyboard] = useState<DragPosition | null>(null);
  const [preview, setPreview] = useState<DragPosition | null>(null);
  const [announcement, announce] = useState("");

  function stopAnimations() {
    for (const animation of animations.current) animation.cancel();
    animations.current = [];
  }

  function captureMove(floating?: PointerDrag) {
    if (gridRef.current)
      beforeMove.current = readSlots(gridRef.current, floating);
  }

  useLayoutEffect(() => {
    const before = beforeMove.current;
    const grid = gridRef.current;
    if (!before || !grid) return;
    beforeMove.current = null;
    stopAnimations();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const [slot, rect] of readSlots(grid)) {
      if (slot.dataset.widget === preview?.source) continue;
      const previous = before.get(slot);
      if (!previous) continue;
      const x = previous.left - rect.left;
      const y = previous.top - rect.top;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
      animations.current.push(
        slot.animate(
          [
            { transform: `translate3d(${x}px, ${y}px, 0)` },
            { transform: "none" },
          ],
          { duration: 280, easing: "cubic-bezier(0.25, 0.55, 0.25, 1)" },
        ),
      );
    }
  });

  useEffect(
    () => () => {
      if (pointer.current) cancelAnimationFrame(pointer.current.frame);
      stopAnimations();
    },
    [],
  );

  function updatePointer(drag: PointerDrag) {
    if (!drag.active) return;
    const { origin } = drag.active;
    const left = origin.left + drag.point.x - drag.start.x;
    const top = origin.top + drag.point.y - drag.start.y;
    drag.card.style.setProperty(
      "--erp-drag-position",
      `translate3d(${left}px, ${top}px, 0)`,
    );
    const target = targetAt(drag);
    if (target && target !== drag.active.target) {
      captureMove();
      drag.active.target = target;
      setPreview({ source: drag.id, target });
    }
  }

  function scrollAtEdge(drag: PointerDrag) {
    if (pointer.current !== drag) return;
    const edge = 64;
    const y = drag.point.y;
    const speed =
      y < edge ? y - edge : Math.max(0, y - window.innerHeight + edge);
    if (speed) {
      const previous = window.scrollY;
      window.scrollBy({ top: speed / 4, behavior: "instant" });
      if (window.scrollY !== previous) updatePointer(drag);
    }
    drag.frame = requestAnimationFrame(() => scrollAtEdge(drag));
  }

  function finishPointer(
    drag: PointerDrag,
    target: DashboardWidgetId | null = null,
  ) {
    pointer.current = null;
    cancelAnimationFrame(drag.frame);
    if (drag.active) {
      captureMove(drag);
      setPreview(null);
      if (target) reorder(drag.id, target);
    }
    if (drag.grid.hasPointerCapture(drag.pointerId)) {
      drag.grid.releasePointerCapture(drag.pointerId);
    }
  }

  useEffect(() => {
    if (!preview) return;
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !pointer.current) return;
      event.preventDefault();
      finishPointer(pointer.current);
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, [preview]);

  function currentPointer(event: PointerEvent<HTMLDivElement>) {
    const drag = pointer.current;
    return drag?.pointerId === event.pointerId ? drag : null;
  }

  const pointerHandlers = {
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const drag = currentPointer(event);
      if (!drag) return;
      drag.point = { x: event.clientX, y: event.clientY };
      if (!drag.active) {
        if (
          Math.hypot(drag.point.x - drag.start.x, drag.point.y - drag.start.y) <
          6
        )
          return;
        const summary =
          drag.slot.hasAttribute("data-collapsed") &&
          drag.card.querySelector(".erp-widget-summary");
        const origin = (summary || drag.card).getBoundingClientRect();
        stopAnimations();
        drag.active = {
          bounds: drag.grid.getBoundingClientRect(),
          anchors: readSlots(drag.grid),
          origin,
          scroll: { x: window.scrollX, y: window.scrollY },
          target: drag.id,
        };
        drag.slot.style.setProperty(
          "--erp-drag-slot-height",
          `${drag.slot.offsetHeight}px`,
        );
        drag.card.style.setProperty(
          "--erp-drag-card-width",
          `${origin.width}px`,
        );
        drag.card.style.setProperty(
          "--erp-drag-card-height",
          `${origin.height}px`,
        );
        setPreview({ source: drag.id, target: drag.id });
        drag.frame = requestAnimationFrame(() => scrollAtEdge(drag));
      }
      updatePointer(drag);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      const drag = currentPointer(event);
      if (!drag) return;
      drag.point = { x: event.clientX, y: event.clientY };
      finishPointer(drag, targetAt(drag));
    },
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
      const drag = currentPointer(event);
      if (drag && event.target === drag.grid) finishPointer(drag);
    },
  };

  const grip = (
    id: DashboardWidgetId,
  ): ButtonHTMLAttributes<HTMLButtonElement> => ({
    onPointerDown: (event) => {
      if (!event.isPrimary || event.button !== 0 || pointer.current || keyboard)
        return;
      const button = event.currentTarget;
      const grid = gridRef.current;
      const slot = button.closest<HTMLElement>(".erp-dashboard-widget");
      const card = button.closest<HTMLElement>(".erp-widget-card");
      if (!grid || !slot || !card) return;
      const point = { x: event.clientX, y: event.clientY };
      button.focus({ preventScroll: true });
      grid.setPointerCapture(event.pointerId);
      pointer.current = {
        id,
        grid,
        slot,
        card,
        pointerId: event.pointerId,
        start: point,
        point,
        active: null,
        frame: 0,
      };
    },
    onClick: (event) => {
      if (event.detail !== 0 || pointer.current) return;
      if (keyboard?.source === id) {
        captureMove();
        reorder(id, keyboard.target);
        setKeyboard(null);
        announce(
          `«${dashboardWidgets[id].label}» на позиции ${ids.indexOf(keyboard.target) + 1} из ${ids.length}`,
        );
        const button = event.currentTarget;
        requestAnimationFrame(() => button.focus());
      } else {
        setKeyboard({ source: id, target: id });
        announce(`Взят блок «${dashboardWidgets[id].label}»`);
      }
    },
    onKeyDown: (event) => {
      if (event.key === "Escape" && keyboard?.source === id) {
        event.preventDefault();
        setKeyboard(null);
        announce("Перенос отменён");
      }
      const step = arrowSteps[event.key];
      if (keyboard?.source !== id || !step) return;
      event.preventDefault();
      const position = ids.indexOf(keyboard.target) + step;
      const target = ids[position];
      if (!target) return;
      setKeyboard({ source: id, target });
      announce(`Позиция ${position + 1} из ${ids.length}`);
      gridRef.current?.children[position]?.scrollIntoView({ block: "nearest" });
    },
    onBlur: () => {
      if (keyboard?.source !== id) return;
      setKeyboard(null);
      announce("Перенос отменён");
    },
  });

  return { gridRef, grip, pointerHandlers, preview, keyboard, announcement };
}
