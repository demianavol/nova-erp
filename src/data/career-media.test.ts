import { describe, expect, it } from "vitest";
import { careerScenes, careerSceneForBenefit } from "./career-media";

describe("Careers supplied footage", () => {
  it("maps all six benefits to distinct prepared video loops", () => {
    expect(
      (
        ["growth", "impact", "team", "projects", "freedom", "learning"] as const
      ).map((id) => careerSceneForBenefit(id)?.video),
    ).toEqual([
      "creative-projects.mp4",
      "impact-supplied-loop.mp4",
      "team-supplied-loop.mp4",
      "projects-supplied-loop.mp4",
      "sunset-freedom.mp4",
      "learning-notes.mp4",
    ]);
    expect(new Set(careerScenes.map((scene) => scene.video)).size).toBe(6);
  });
  it("uses the supplied reading scene for the sixth benefit", () => {
    expect(careerSceneForBenefit("learning")?.video).toBe("learning-notes.mp4");
  });
  it("pairs each prepared loop with its own first-frame poster", () => {
    for (const { video, poster } of careerScenes) {
      expect(poster).toBe(video.replace(/\.mp4$/, "-poster.webp"));
    }
  });
});
