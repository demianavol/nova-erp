import { afterEach, describe, expect, it, vi } from "vitest";
import { mountPartnershipEnvelope } from "./partnership-atmosphere";

function harness() {
  class Media extends EventTarget {
    matches = false;
    change(matches: boolean) {
      this.matches = matches;
      this.dispatchEvent(new Event("change"));
    }
  }
  const reduced = new Media(),
    fine = new Media();
  fine.matches = true;
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    documentElement: { dataset: { siteTheme: "dark" } },
  });
  const frames = new Map<number, FrameRequestCallback>();
  let serial = 0;
  let intersection: (entries: { isIntersecting: boolean }[]) => void = () => {};
  const disconnected = vi.fn();
  vi.stubGlobal("document", doc);
  vi.stubGlobal("matchMedia", (query: string) =>
    query.includes("reduced-motion") ? reduced : fine,
  );
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof intersection) {
        intersection = callback;
      }
      observe() {}
      disconnect = disconnected;
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = disconnected;
    },
  );
  vi.stubGlobal(
    "MutationObserver",
    class {
      observe() {}
      disconnect = disconnected;
    },
  );
  const values = new Map<string, string>();
  const section = Object.assign(new EventTarget(), {
    dataset: {} as Record<string, string>,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 1600,
      height: 600,
    }),
  });
  const envelope = {
    style: {
      setProperty: (key: string, value: string) => values.set(key, value),
      removeProperty: (key: string) => values.delete(key),
    },
  };
  const cleanup = mountPartnershipEnvelope(
    section as unknown as HTMLElement,
    envelope as unknown as HTMLElement,
  );
  const step = (now: number) => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(now));
  };
  const pointer = (pointerType: string) =>
    section.dispatchEvent(
      Object.assign(new Event("pointermove"), {
        pointerType,
        clientX: 1500,
        clientY: 500,
      }),
    );
  return {
    reduced,
    fine,
    doc,
    frames,
    section,
    values,
    cleanup,
    step,
    pointer,
    visible: (isIntersecting: boolean) => intersection([{ isIntersecting }]),
    disconnected,
  };
}
afterEach(() => vi.unstubAllGlobals());

describe("Partnership envelope lifecycle", () => {
  it("pauses outside the section and in a hidden tab, then resumes and cleans up", () => {
    const h = harness();
    expect(h.frames.size).toBe(0);
    h.visible(true);
    h.step(100);
    expect(h.values.size).toBe(4);
    h.visible(false);
    h.step(200);
    expect(h.frames.size).toBe(0);
    expect(h.values.size).toBe(0);
    h.visible(true);
    h.step(300);
    h.doc.hidden = true;
    h.doc.dispatchEvent(new Event("visibilitychange"));
    expect(h.frames.size).toBe(0);
    h.doc.hidden = false;
    h.doc.dispatchEvent(new Event("visibilitychange"));
    h.step(400);
    expect(h.values.size).toBe(4);
    h.cleanup();
    expect(h.frames.size).toBe(0);
    expect(h.values.size).toBe(0);
    expect(h.disconnected).toHaveBeenCalledTimes(1);
  });
  it("respects dynamic reduced motion", () => {
    const h = harness();
    h.reduced.change(true);
    h.visible(true);
    expect(h.frames.size).toBe(0);
    h.reduced.change(false);
    h.step(100);
    expect(h.values.size).toBe(4);
    h.reduced.change(true);
    expect(h.frames.size).toBe(0);
    expect(h.values.size).toBe(0);
    h.cleanup();
  });
  it("smooths mouse input, ignores touch and gently returns to rest", () => {
    const h = harness();
    h.visible(true);
    h.step(100);
    h.pointer("touch");
    h.step(150);
    expect(parseFloat(h.values.get("--pe-x")!)).toBe(0);
    h.pointer("mouse");
    h.step(200);
    const moved = parseFloat(h.values.get("--pe-x")!);
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThan(2.1875);
    h.section.dispatchEvent(new Event("pointerleave"));
    h.step(250);
    expect(parseFloat(h.values.get("--pe-x")!)).toBeLessThan(moved);
    h.cleanup();
  });
  it("disables pointer following when a coarse pointer is selected", () => {
    const h = harness();
    h.visible(true);
    h.step(100);
    h.fine.change(false);
    h.pointer("mouse");
    h.step(150);
    expect(parseFloat(h.values.get("--pe-x")!)).toBe(0);
    h.cleanup();
  });
});
