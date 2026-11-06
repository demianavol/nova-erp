import { describe, expect, it } from "vitest";
import {
  careerMilestones,
  careerIndexAtProgress,
  careerScrollProgress,
} from "./career-orbit";

describe("careers closed orbit", () => {
  it("never places the last benefit over the first on the closed path", () => {
    expect(new Set(careerMilestones.map((fraction) => fraction % 1)).size).toBe(
      6,
    );
    expect(careerMilestones.at(-1)).toBeLessThan(1);
  });

  it("activates each milestone when reached, in either scroll direction", () => {
    for (let index = 1; index < careerMilestones.length; index++) {
      const fraction = careerMilestones[index];
      expect(careerIndexAtProgress(fraction - 0.001)).toBe(index - 1);
      expect(careerIndexAtProgress(fraction)).toBe(index);
      expect(careerIndexAtProgress(fraction + 0.001)).toBe(index);
    }
    expect(careerIndexAtProgress(1)).toBe(5);
    expect(careerIndexAtProgress(-1)).toBe(0);
  });

  it("holds every chapter for reading before travelling to the next", () => {
    const at = (fraction: number) =>
      careerScrollProgress(100 - fraction * 2400, 3000, 600);
    for (let index = 0; index < careerMilestones.length; index++) {
      expect(at(index / careerMilestones.length + 0.02)).toBeCloseTo(
        careerMilestones[index],
      );
      expect(at(index / careerMilestones.length + 0.1)).toBeCloseTo(
        careerMilestones[index],
      );
    }
    expect(at(0.14)).toBeGreaterThan(0);
    expect(at(0.14)).toBeLessThan(careerMilestones[1]);
    expect(at(-1)).toBe(0);
    expect(at(2)).toBe(careerMilestones[5]);
  });

  it("travels continuously and reverses without skipping a milestone", () => {
    const samples = Array.from({ length: 1001 }, (_, i) =>
      careerScrollProgress(100 - i * 2.4, 3000, 600),
    );
    for (let index = 1; index < samples.length; index++) {
      expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1]);
      expect(samples[index] - samples[index - 1]).toBeLessThan(0.005);
    }
    const chapters = samples.map(careerIndexAtProgress);
    expect([...new Set(chapters)]).toEqual([0, 1, 2, 3, 4, 5]);
    expect([...new Set(chapters.reverse())]).toEqual([5, 4, 3, 2, 1, 0]);
  });
});
