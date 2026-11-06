import { describe, it, expect } from "vitest";
import { PerspectiveCamera, Vector3, Quaternion } from "three";
import {
  projectLanyardViewport,
  projectedBadgeBounds,
  constrainBadgeToViewport,
  viewportPixelRatio,
  shouldConstrainLanyard,
  lanyardTouchIntent,
} from "./lanyard-viewport";

function scene(
  rect = { left: 850, top: 150, width: 480, height: 510 },
  viewport = { left: 0, top: 0, width: 1440, height: 900 },
) {
  const camera = new PerspectiveCamera(24, rect.width / rect.height, 0.1, 200);
  const height = 2.25 / 0.64;
  camera.position.z = height / 2 / Math.tan((24 * Math.PI) / 360);
  camera.updateMatrixWorld();
  projectLanyardViewport(camera, rect, viewport);
  const body = {
    position: new Vector3(),
    quaternion: new Quaternion(),
    previous: new Vector3(),
    velocity: new Vector3(),
  };
  return { camera, body, viewport, layout: { width: 1.6, height: 2.25 } };
}
describe("Lanyard viewport projection", () => {
  it("lets an ungrabbed badge scroll out instead of pinning it over the next section", () => {
    const h = scene();
    const rect = { left: 850, top: -430, width: 480, height: 510 };
    const original = h.body.position.clone();
    projectLanyardViewport(h.camera, rect, h.viewport);
    if (shouldConstrainLanyard(rect, h.viewport))
      constrainBadgeToViewport(h.body, h.layout, h.camera, h.viewport);
    expect(h.body.position.distanceTo(original)).toBe(0);
    expect(
      projectedBadgeBounds(h.body, h.layout, h.camera, h.viewport).bottom,
    ).toBeLessThan(0);
    // A deliberate grab still has screen-wide bounds, even as the block scrolls.
    expect(shouldConstrainLanyard(rect, h.viewport, true)).toBe(true);
    constrainBadgeToViewport(h.body, h.layout, h.camera, h.viewport);
    expect(
      projectedBadgeBounds(h.body, h.layout, h.camera, h.viewport).top,
    ).toBeGreaterThanOrEqual(15.99);
  });
  it("keeps free swings bounded when the original block is fully on screen", () => {
    expect(
      shouldConstrainLanyard(
        { left: 850, top: 150, width: 480, height: 510 },
        { left: 0, top: 0, width: 1440, height: 900 },
      ),
    ).toBe(true);
  });
  it.each([
    [0, 6, "pending"],
    [0, 20, "scroll"],
    [5, 40, "scroll"],
    [18, 18, "scroll"],
    [20, 2, "drag"],
    [-24, 3, "drag"],
  ])("distinguishes touch movement %s,%s as %s", (dx, dy, expected) => {
    expect(
      lanyardTouchIntent(
        { x: 100, y: 100 },
        { clientX: 100 + dx, clientY: 100 + dy },
      ),
    ).toBe(expected);
  });
  it("preserves local size and anchor coordinates in a full screen frustum", () => {
    const h = scene();
    const center = h.body.position.clone().project(h.camera);
    expect((center.x + 1) * 720).toBeCloseTo(1090);
    expect((1 - center.y) * 450).toBeCloseTo(405);
    const original = projectedBadgeBounds(
      h.body,
      h.layout,
      h.camera,
      h.viewport,
    );
    projectLanyardViewport(
      h.camera,
      { left: 650, top: -50, width: 480, height: 510 },
      h.viewport,
    );
    const scrolled = projectedBadgeBounds(
      h.body,
      h.layout,
      h.camera,
      h.viewport,
    );
    expect(scrolled.left).toBeCloseTo(original.left - 200);
    expect(scrolled.top).toBeCloseTo(original.top - 200);
    expect(scrolled.right - scrolled.left).toBeCloseTo(
      original.right - original.left,
    );
  });
  it.each([
    [0, 0],
    [-10, 0],
    [10, 0],
    [0, 10],
    [0, -10],
    [10, -10],
  ])("contains the entire rotated card and clip at %s,%s", (x, y) => {
    const h = scene();
    h.body.position.set(x, y, 0.2);
    h.body.velocity.set(x * 5, y * 5, 0);
    h.body.quaternion.setFromAxisAngle(new Vector3(0, 0, 1), 0.65);
    constrainBadgeToViewport(h.body, h.layout, h.camera, h.viewport);
    const b = projectedBadgeBounds(h.body, h.layout, h.camera, h.viewport);
    expect(b.left).toBeGreaterThanOrEqual(15.5);
    expect(b.top).toBeGreaterThanOrEqual(15.5);
    expect(b.right).toBeLessThanOrEqual(1424.5);
    expect(b.bottom).toBeLessThanOrEqual(884.5);
  });
  it("adapts to the mobile viewport without upscaling the card", () => {
    const h = scene(
      { left: 18, top: 320, width: 354, height: 320 },
      { left: 0, top: 0, width: 390, height: 844 },
    );
    h.body.position.set(8, -9, 0);
    constrainBadgeToViewport(h.body, h.layout, h.camera, h.viewport);
    const b = projectedBadgeBounds(h.body, h.layout, h.camera, h.viewport);
    expect(b.left).toBeGreaterThanOrEqual(15.5);
    expect(b.bottom).toBeLessThanOrEqual(828.5);
  });
  it("limits screen rendering to DPR 1 and two million pixels", () => {
    expect(viewportPixelRatio(1440, 900, 3)).toBe(1);
    expect(3840 * 2160 * viewportPixelRatio(3840, 2160, 2) ** 2).toBeCloseTo(
      2_000_000,
    );
  });
  it("keeps a near-camera card in view after a compact viewport resize", () => {
    const h = scene(
      { left: 18, top: 20, width: 354, height: 320 },
      { left: 0, top: 0, width: 640, height: 240 },
    );
    h.body.position.z = h.camera.position.z - 0.05;
    constrainBadgeToViewport(h.body, h.layout, h.camera, h.viewport);
    const b = projectedBadgeBounds(h.body, h.layout, h.camera, h.viewport);
    expect(Object.values(b).every(Number.isFinite)).toBe(true);
    expect(b.top).toBeGreaterThanOrEqual(15.99);
    expect(b.bottom).toBeLessThanOrEqual(224.01);
  });
});
