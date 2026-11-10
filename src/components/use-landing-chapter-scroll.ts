import { useEffect, type RefObject } from "react";

const portraitChapters =
  "(max-width: 640px) and (min-height: 540px) and (orientation: portrait) and (prefers-reduced-motion: no-preference)";
const wheelQuietMs = 400;

type Swipe = {
  x: number;
  y: number;
  startedAt: number;
  axis?: "vertical" | "horizontal";
  drag?: {
    origin: number;
    top: number;
    up: ChapterEdge;
    down: ChapterEdge;
  };
};

type Chapter = { start: number; end: number };
type ChapterEdge = { top: number; free: boolean };

function measureChapters(root: HTMLElement) {
  const scroller = document.scrollingElement;
  if (!scroller) return null;
  const viewport = scroller.clientHeight;
  const limit = scroller.scrollHeight - viewport;
  const y = window.scrollY;
  const clamp = (value: number) => Math.min(limit, Math.max(0, value));
  const chapters = Array.from(
    root.querySelectorAll(":scope > main > section, :scope > .company-footer"),
    (section) => {
      const bounds = section.getBoundingClientRect();
      const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      const start = clamp(bounds.top + y - margin);
      const end = Math.max(start, clamp(bounds.bottom + y - viewport));
      return { start, end };
    },
  );
  return { chapters, viewport, y };
}

function chapterEdge(
  chapters: Chapter[],
  y: number,
  down: boolean,
): ChapterEdge {
  let index = chapters.length - 1;
  while (index >= 0 && chapters[index].start > y + 2) index--;
  const current = chapters[index];
  if (!current) return { top: chapters[0]?.start ?? y, free: false };
  if (down) {
    // A chapter taller than the screen stays readable before advancing.
    if (y + 2 < current.end) return { top: current.end, free: true };
    return { top: chapters[index + 1]?.start ?? y, free: false };
  }
  if (y > current.end + 2) return { top: current.end, free: false };
  if (y > current.start + 2) return { top: current.start, free: true };
  return { top: chapters[index - 1]?.end ?? y, free: false };
}

function dragTop(drag: NonNullable<Swipe["drag"]>, distance: number) {
  return Math.min(
    Math.max(drag.origin, drag.down.top),
    Math.max(Math.min(drag.origin, drag.up.top), drag.origin + distance),
  );
}

export function useLandingChapterScroll(
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mobile = matchMedia(portraitChapters);
    let swipe: Swipe | undefined;
    let dragFrame = 0;
    let wheelAt = -Infinity;
    let wheelDistance = 0;
    let wheelCommitted = false;
    let destination: number | undefined;
    let navigationAt = -Infinity;
    const cancel = () => {
      swipe = undefined;
      cancelAnimationFrame(dragFrame);
      dragFrame = 0;
    };
    const canTurn = (target: EventTarget | null) => {
      if (
        !mobile.matches ||
        root.hasAttribute("data-export") ||
        (window.visualViewport?.scale ?? 1) > 1
      )
        return false;
      if (
        document.querySelector(
          '[role="dialog"][data-state="open"], dialog[open]',
        )
      )
        return false;
      if (
        !(target instanceof Element) ||
        !target.closest("main, .company-footer")
      )
        return false;
      if (
        target.closest(
          '[role="dialog"], input, textarea, select, [contenteditable="true"]',
        )
      )
        return false;
      for (
        let node: Element | null = target;
        node && node !== root;
        node = node.parentElement
      ) {
        if (
          node.scrollHeight > node.clientHeight + 1 &&
          /^(auto|scroll)$/.test(getComputedStyle(node).overflowY)
        )
          return false;
      }
      return true;
    };
    const settle = (top: number) => {
      if (Math.abs(top - window.scrollY) <= 2) return;
      destination = top;
      navigationAt = performance.now();
      window.scrollTo({ top, behavior: "smooth" });
    };
    const start = (event: TouchEvent) => {
      cancel();
      if (event.touches.length !== 1 || !canTurn(event.target)) return;
      const touch = event.touches[0];
      swipe = {
        x: touch.clientX,
        y: touch.clientY,
        startedAt: event.timeStamp,
      };
    };
    const move = (event: TouchEvent) => {
      if (!swipe) return;
      if (event.touches.length !== 1) {
        cancel();
        return;
      }
      const touch = event.touches[0];
      const distance = swipe.y - touch.clientY;
      const x = Math.abs(touch.clientX - swipe.x);
      const y = Math.abs(distance);
      if (!swipe.axis && Math.max(x, y) >= 8) {
        swipe.axis = y > x ? "vertical" : "horizontal";
        if (swipe.axis === "vertical") {
          const layout = measureChapters(root);
          if (!layout) return;
          const { chapters, y: origin } = layout;
          swipe.drag = {
            origin,
            top: origin,
            up: chapterEdge(chapters, origin, false),
            down: chapterEdge(chapters, origin, true),
          };
          // A new drag takes over at the currently visible position.
          if (destination !== undefined)
            window.scrollTo({ top: origin, behavior: "instant" });
          destination = undefined;
        }
      }
      const drag = swipe.drag;
      if (!drag) return;
      if (event.cancelable) event.preventDefault();
      drag.top = dragTop(drag, distance);
      if (!dragFrame) {
        dragFrame = requestAnimationFrame(() => {
          dragFrame = 0;
          window.scrollTo({ top: drag.top, behavior: "instant" });
        });
      }
    };
    const end = (event: TouchEvent) => {
      const gesture = swipe;
      cancel();
      const drag = gesture?.drag;
      if (!mobile.matches || !gesture || !drag) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const distance = gesture.y - touch.clientY;
      const edge = distance > 0 ? drag.down : drag.up;
      const travelled = Math.abs(distance);
      const flick =
        travelled >= 24 && event.timeStamp - gesture.startedAt < 180;
      const top = edge.free
        ? dragTop(drag, distance)
        : travelled >= 56 || flick
          ? edge.top
          : drag.origin;
      wheelAt = event.timeStamp;
      wheelCommitted = true;
      settle(top);
    };
    const wheel = (event: WheelEvent) => {
      if (
        !event.cancelable ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.shiftKey ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX) ||
        !canTurn(event.target)
      )
        return;
      event.preventDefault();
      const now = performance.now();
      const moving =
        destination !== undefined &&
        Math.abs(window.scrollY - destination) > 2 &&
        now - navigationAt < 700;
      if (!moving && event.timeStamp - wheelAt > wheelQuietMs) {
        wheelDistance = 0;
        wheelCommitted = false;
      }
      wheelAt = event.timeStamp;
      // A trackpad gesture emits a burst of wheel events, including inertia.
      if (moving || wheelCommitted || swipe) return;
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      wheelDistance += event.deltaY * unit;
      if (Math.abs(wheelDistance) < 24) return;
      wheelCommitted = true;
      const layout = measureChapters(root);
      if (!layout) return;
      const { chapters, viewport, y } = layout;
      const down = wheelDistance > 0;
      const edge = chapterEdge(chapters, y, down);
      const step = Math.min(
        Math.max(Math.abs(wheelDistance), viewport / 2),
        viewport * 0.8,
      );
      const top = edge.free
        ? down
          ? Math.min(y + step, edge.top)
          : Math.max(y - step, edge.top)
        : edge.top;
      settle(top);
    };
    const detach = () => {
      cancel();
      wheelAt = -Infinity;
      destination = undefined;
      delete root.dataset.chapterScroll;
      root.removeEventListener("touchstart", start);
      root.removeEventListener("touchmove", move);
      root.removeEventListener("touchend", end);
      root.removeEventListener("touchcancel", cancel);
      root.removeEventListener("wheel", wheel);
    };
    const syncListeners = () => {
      if (!mobile.matches || root.hasAttribute("data-export")) return detach();
      root.dataset.chapterScroll = "true";
      root.addEventListener("touchstart", start, { passive: true });
      root.addEventListener("touchmove", move, { passive: false });
      root.addEventListener("touchend", end, { passive: true });
      root.addEventListener("touchcancel", cancel, { passive: true });
      root.addEventListener("wheel", wheel, { passive: false });
    };
    syncListeners();
    mobile.addEventListener("change", syncListeners);
    return () => {
      mobile.removeEventListener("change", syncListeners);
      detach();
    };
  }, [rootRef]);
}
