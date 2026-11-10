import { afterEach, describe, expect, it, vi } from "vitest";
import {
  invitationTransition,
  mountPartnershipInvitation,
} from "./partnership-invitation";
import { invitationReadingTransform } from "./partnership-invitation-geometry";

function harness(options: { reduced?: boolean; api?: boolean } = {}) {
  const pending: (() => void)[] = [];
  const durations: number[] = [];
  const recorded: { node: number; frames: Keyframe[] }[] = [];
  const nodes = Array.from({ length: 10 }, (_, index) => ({
    style: {} as Record<string, string>,
    dataset: {} as Record<string, string>,
    clientWidth: 640,
    offsetHeight: 520,
    inert: true,
    disabled: false,
    attributes: {} as Record<string, string>,
    setAttribute(key: string, value: string) {
      this.attributes[key] = value;
    },
    focus: vi.fn(),
    animate:
      options.api === false
        ? undefined
        : vi.fn((frames, timing) => {
            recorded.push({ node: index, frames });
            durations.push(timing.duration);
            return {
              finished: new Promise<void>((resolve) => pending.push(resolve)),
              cancel: vi.fn(),
            };
          }),
  }));
  let resized = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resized = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const media = Object.assign(new EventTarget(), {
    matches: options.reduced ?? false,
  });
  const [
    stage,
    rear,
    pocket,
    flap,
    hinge,
    letter,
    copy,
    trigger,
    heading,
    sleeve,
  ] = nodes;
  const states: string[] = [];
  const controller = mountPartnershipInvitation(
    {
      stage,
      layers: [rear, pocket, flap],
      flap,
      hinge,
      letter,
      copy,
      trigger,
      heading,
      sleeve,
    } as never,
    media as MediaQueryList,
    (state) => states.push(state),
  );
  return {
    ...controller,
    nodes,
    recorded,
    stage,
    letter,
    trigger,
    heading,
    states,
    durations,
    media,
    resized: () => resized(),
    finish: async () => {
      pending.splice(0).forEach((resolve) => resolve());
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}
afterEach(() => vi.unstubAllGlobals());

describe("Partnership invitation", () => {
  it("reveals the print after the paper reaches its final scale and position", () => {
    const h = harness();
    h.command("open");
    const paper = h.recorded.find((record) => record.node === 5)!.frames;
    const copy = h.recorded.find((record) => record.node === 6)!.frames;
    const settled = paper.find(
      (frame) => frame.transform === invitationReadingTransform,
    )!;
    const fadeStart = copy[copy.length - 2];
    expect(fadeStart.opacity).toBe(0);
    expect(Number(fadeStart.offset)).toBeGreaterThanOrEqual(
      Number(settled.offset),
    );
    h.dispose();
  });
  it("locks repeat and opposite commands until each transition finishes", () => {
    expect(invitationTransition("closed", "close")).toBe("closed");
    expect(invitationTransition("closed", "open")).toBe("opening");
    for (const state of ["opening", "closing"] as const)
      for (const command of ["open", "close"] as const)
        expect(invitationTransition(state, command)).toBe(state);
    expect(invitationTransition("open", "close")).toBe("closing");
  });
  it("keeps content inert during travel, transfers focus, closes and reopens", async () => {
    const h = harness();
    h.command("open");
    h.command("open");
    h.command("close");
    expect(h.states).toEqual(["closed", "opening"]);
    expect(h.letter.inert).toBe(true);
    expect(h.durations.every((duration) => duration === 1600)).toBe(true);
    await h.finish();
    expect(h.stage.dataset.state).toBe("open");
    expect(h.letter.inert).toBe(false);
    expect(h.heading.focus).toHaveBeenCalledOnce();
    const height = parseFloat(h.stage.style.height);
    h.command("close");
    expect(h.letter.inert).toBe(true);
    await h.finish();
    expect(h.stage.dataset.state).toBe("closed");
    expect(parseFloat(h.stage.style.height)).toBeLessThan(height);
    expect(h.trigger.focus).toHaveBeenCalledOnce();
    h.command("open");
    await h.finish();
    expect(h.stage.dataset.state).toBe("open");
    h.dispose();
  });
  it("finishes the intended state on resize and ignores cancelled animation callbacks", async () => {
    const h = harness();
    h.command("open");
    h.stage.clientWidth = 354;
    h.letter.offsetHeight = 680;
    h.resized();
    expect(h.stage.dataset.state).toBe("open");
    h.command("close");
    h.media.matches = true;
    h.media.dispatchEvent(new Event("change"));
    expect(h.stage.dataset.state).toBe("closed");
    await h.finish();
    expect(h.stage.dataset.state).toBe("closed");
    expect(h.letter.inert).toBe(true);
    h.dispose();
  });
  it("uses only a short opacity animation for reduced motion", async () => {
    const h = harness({ reduced: true });
    h.command("open");
    expect(h.durations).toEqual([160]);
    expect(h.letter.inert).toBe(true);
    await h.finish();
    expect(h.letter.inert).toBe(false);
    h.command("close");
    await h.finish();
    expect(h.stage.dataset.state).toBe("closed");
    h.dispose();
  });
  it("works without WAAPI and cancels focus changes on disposal", async () => {
    const instant = harness({ api: false });
    instant.command("open");
    expect(instant.stage.dataset.state).toBe("open");
    instant.dispose();
    const h = harness();
    h.command("open");
    h.dispose();
    await h.finish();
    expect(h.heading.focus).not.toHaveBeenCalled();
  });
  it("pulls an undistorted sheet behind the pocket and preserves the insertion depth", async () => {
    const h = harness();
    h.command("open");
    const paper = h.recorded.find((record) => record.node === 5)!.frames;
    expect(paper.every((frame) => frame.zIndex === undefined)).toBe(true);
    expect(paper.every((frame) => frame.opacity === undefined)).toBe(true);
    expect(
      paper.every((frame) => /scale\([.\d]+\)/.test(String(frame.transform))),
    ).toBe(true);
    const sleeve = h.recorded.find((record) => record.node === 9)!.frames;
    const pocket = h.recorded.find((record) => record.node === 2)!.frames;
    expect(
      sleeve.every((frame) => String(frame.clipPath).startsWith("polygon(")),
    ).toBe(true);
    const travelTiming = (frames: Keyframe[]) =>
      frames.map(({ offset, easing }) => ({ offset, easing }));
    expect(travelTiming(sleeve)).toEqual(travelTiming(pocket));
    await h.finish();
    const pocketOffset = parseFloat(
      h.nodes[2].style.transform.replace("translateY(", ""),
    );
    expect(pocketOffset).toBeLessThan(h.letter.offsetHeight);
    expect(h.letter.offsetHeight - pocketOffset).toBeCloseTo(372 * 0.16);
    h.dispose();
  });
});
