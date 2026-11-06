import { describe, expect, it } from "vitest";
import { careerScenes, careerSceneForBenefit } from "./career-media";

describe("Careers supplied footage", () => {
  it("maps all six benefits to distinct supplied videos", () => {
    expect(
      (
        ["growth", "impact", "team", "projects", "freedom", "learning"] as const
      ).map((id) => careerSceneForBenefit(id)?.video),
    ).toEqual([
      "creative-projects.mp4",
      "impact-supplied-restored.mp4",
      "team-supplied.mp4",
      "projects-supplied.mp4",
      "sunset-freedom.mp4",
      "learning-notes.mp4",
    ]);
    expect(new Set(careerScenes.map((scene) => scene.video)).size).toBe(6);
  });
  it("uses the supplied reading scene for the sixth benefit", () => {
    expect(careerSceneForBenefit("learning")?.video).toBe("learning-notes.mp4");
  });
  it("pairs the supplied team video with its own poster", () => {
    expect(careerSceneForBenefit("team")).toMatchObject({
      video: "team-supplied.mp4",
      poster: "team-supplied-poster.webp",
    });
  });
});
