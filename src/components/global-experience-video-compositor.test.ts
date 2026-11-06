import { afterEach, expect, it, vi } from "vitest";
import { createVideoCompositor } from "./global-experience-video-compositor";

afterEach(() => vi.unstubAllGlobals());

it("keeps rapid country changes within the decoded video's rendering budget", () => {
  const draw = vi.fn();
  const upload = vi.fn();
  const context = new Proxy({} as Record<string, unknown>, {
    get: (_, name) => {
      if (name === "drawArrays") return draw;
      if (name === "texSubImage2D") return upload;
      if (name === "getShaderParameter" || name === "getProgramParameter")
        return () => true;
      if (String(name).startsWith("create")) return () => ({});
      return () => undefined;
    },
  });
  let nextFrame: VideoFrameRequestCallback | undefined;
  const requestFrame = vi.fn((callback: VideoFrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  const cancelFrame = vi.fn();
  const video = Object.assign(new EventTarget(), {
    readyState: 4,
    paused: false,
    requestVideoFrameCallback: requestFrame,
    cancelVideoFrameCallback: cancelFrame,
  }) as unknown as HTMLVideoElement;
  const canvas = Object.assign(new EventTarget(), {
    width: 0,
    height: 0,
    dataset: {},
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 768, height: 617 }),
  }) as unknown as HTMLCanvasElement;
  const animationFrame = vi.fn();
  vi.stubGlobal("requestAnimationFrame", animationFrame);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("devicePixelRatio", 1);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private resized: () => void) {}
      observe() {
        this.resized();
      }
      disconnect() {}
    },
  );
  const ready = vi.fn();
  const failed = vi.fn();
  const renderer = createVideoCompositor(video, canvas, ready, failed, true)!;
  expect(renderer).toBeDefined();
  const decode = (index: number) =>
    nextFrame!((index * 1000) / 24, {
      mediaTime: index / 24,
      presentedFrames: index,
    } as VideoFrameCallbackMetadata);

  decode(1);
  expect(draw).toHaveBeenCalledTimes(1);
  expect(ready).toHaveBeenCalledTimes(1);
  Object.assign(video, { paused: true });
  renderer.select("uz");
  expect(draw).toHaveBeenCalledTimes(1);
  Object.assign(video, { paused: false });
  for (let frame = 2; frame <= 49; frame++) {
    renderer.select(frame % 2 ? "cn" : "kg");
    renderer.select("uz");
    renderer.select(frame % 2 ? "cn" : "kg");
    // UI selections must neither upload video nor submit another GPU pass.
    expect(draw).toHaveBeenCalledTimes(frame - 1);
    decode(frame);
  }
  expect(draw).toHaveBeenCalledTimes(49);
  expect(upload).toHaveBeenCalledTimes(48);
  expect(requestFrame).toHaveBeenCalledTimes(50);
  expect(animationFrame).not.toHaveBeenCalled();
  expect(failed).not.toHaveBeenCalled();

  renderer.dispose();
  const drawsBeforeLateFrame = draw.mock.calls.length;
  decode(50);
  expect(draw).toHaveBeenCalledTimes(drawsBeforeLateFrame);
  expect(cancelFrame).toHaveBeenCalledTimes(1);
});
