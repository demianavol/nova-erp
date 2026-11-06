import { describe, expect, it } from "vitest";
import {
  invitationPaperMotion,
  invitationPocketClip,
} from "./partnership-invitation-geometry";

function clipContains(css: string, x: number, y: number, width: number) {
  const polygon = css
    .slice(8, -1)
    .split(",")
    .map((point) => {
      const [px, py] = point.trim().split(/\s+/);
      return [(parseFloat(px) * width) / 100, parseFloat(py)];
    });
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i],
      [bx, by] = polygon[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
}

describe("Invitation approach and pocket occlusion", () => {
  it.each([
    [640, 520, 0.03],
    [344, 680, 0],
  ])("hides both inserted corners at width %s", (width, height, inset) => {
    const envelopeHeight = (width * 372) / 640;
    const pocketTop = height - envelopeHeight * 0.16;
    const mask = invitationPocketClip(width, pocketTop);
    expect(clipContains(mask, width * inset + 2, height - 2, width)).toBe(
      false,
    );
    expect(clipContains(mask, width * (1 - inset) - 2, height - 2, width)).toBe(
      false,
    );
    expect(clipContains(mask, width / 2, height - 12, width)).toBe(true);
    // The lower text/actions sit above the lip and remain readable and clickable.
    expect(clipContains(mask, width * inset + 40, height - 32, width)).toBe(
      true,
    );
    expect(
      clipContains(mask, width * (1 - inset) - 40, height - 32, width),
    ).toBe(true);
  });
  it("moves the occlusion edge with the envelope throughout the travel", () => {
    for (const top of [0, 120, 400]) {
      const mask = invitationPocketClip(640, top);
      expect(clipContains(mask, 620, top + 30, 640)).toBe(true);
      expect(clipContains(mask, 620, top + 60, 640)).toBe(false);
    }
  });
  it("approaches by more than 30 percent and settles before printing appears", () => {
    const motion = invitationPaperMotion(372);
    const scale = (transform: string) =>
      Number(transform.match(/scale\(([.\d]+)\)/)![1]);
    const depth = (transform: string) =>
      Number(transform.match(/translate3d\(0, [\d.]+px, (-?[\d.]+)px\)/)![1]);
    const apparentScale = (transform: string) =>
      scale(transform) / (1 - depth(transform) / 1200);
    expect(
      apparentScale(motion.reading) / apparentScale(motion.tucked),
    ).toBeGreaterThan(1.3);
    expect(apparentScale(motion.approaching)).toBeGreaterThan(
      apparentScale(motion.tucked),
    );
    expect(depth(motion.reading)).toBe(0);
    expect(scale(motion.reading)).toBe(1);
    expect(motion.reading).toContain("rotateX(0deg)");
  });
});
