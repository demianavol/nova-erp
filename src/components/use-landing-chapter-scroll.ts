import { useEffect, type RefObject } from "react";

const portraitChapters =
  "(max-width: 640px) and (min-height: 540px) and (orientation: portrait) and (prefers-reduced-motion: no-preference)";
const wheelQuietMs = 400;

type Swipe = {
  x: number;
  y: number;
  scrollY: number;
  axis?: "vertical" | "horizontal";
};

function chapterDestination(root: HTMLElement, y: number, distance: number) {
  const scroller = document.scrollingElement;
  if (!scroller) return y;
  const viewport = scroller.clientHeight;
  const limit = scroller.scrollHeight - viewport;
  const clamp = (value: number) => Math.min(limit, Math.max(0, value));
  const chapters = Array.from(
    root.querySelectorAll(":scope > main > section, :scope > .company-footer"),
    (section) => {
      const bounds = section.getBoundingClientRect();
      const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      const start = clamp(bounds.top + window.scrollY - margin);
      const end = Math.max(
        start,
        clamp(bounds.bottom + window.scrollY - viewport),
      );
      return { start, end };
    },
  );
  let index = chapters.length - 1;
  while (index >= 0 && chapters[index].start > y + 2) index--;
  const current = chapters[index];
  if (!current) return chapters[0]?.start ?? y;
  const step = Math.min(
    Math.max(Math.abs(distance), viewport / 2),
    viewport * 0.8,
  );
  if (distance > 0) {
    // A chapter taller than the screen stays readable before advancing.
    if (y + 2 < current.end) return Math.min(y + step, current.end);
    return chapters[index + 1]?.start ?? y;
  }
  if (y > current.end + 2) return current.end;
  if (y > current.start + 2) return Math.max(y - step, current.start);
  return chapters[index - 1]?.end ?? y;
}

export function useLandingChapterScroll(
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mobile = matchMedia(portraitChapters);
    let swipe: Swipe | undefined;
    let wheelAt = -Infinity;
    let wheelDistance = 0;
    let wheelCommitted = false;
    let destination: number | undefined;
    let navigationAt = -Infinity;
    const cancel = () => {
      swipe = undefined;
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
    const turn = (scrollY: number, distance: number) => {
      const top = chapterDestination(root, scrollY, distance);
      if (Math.abs(top - window.scrollY) <= 2) return;
      destination = top;
      navigationAt = performance.now();
      window.scrollTo({ top, behavior: "smooth" });
    };
    const start = (event: TouchEvent) => {
      cancel();
      if (event.touches.length !== 1 || !canTurn(event.target)) return;
      const touch = event.touches[0];
      swipe = { x: touch.clientX, y: touch.clientY, scrollY: window.scrollY };
    };
    const move = (event: TouchEvent) => {
      if (!swipe) return;
      if (event.touches.length !== 1) {
        cancel();
        return;
      }
      const touch = event.touches[0];
      const x = Math.abs(touch.clientX - swipe.x);
      const y = Math.abs(touch.clientY - swipe.y);
      if (!swipe.axis && Math.max(x, y) >= 8)
        swipe.axis = y > x ? "vertical" : "horizontal";
      if (swipe.axis === "vertical" && event.cancelable) event.preventDefault();
    };
    const end = (event: TouchEvent) => {
      const gesture = swipe;
      cancel();
      if (!mobile.matches || gesture?.axis !== "vertical") return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const distance = gesture.y - touch.clientY;
      if (Math.abs(distance) < 36) return;
      wheelAt = event.timeStamp;
      wheelCommitted = true;
      turn(gesture.scrollY, distance);
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
      turn(window.scrollY, wheelDistance);
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
