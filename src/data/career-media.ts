import type { CareerBenefit } from "./company-careers";

export const careerScenes = [
  {
    id: "growth",
    video: "creative-projects.mp4",
    poster: "creative-projects-poster.webp",
  },
  {
    id: "impact",
    video: "impact-supplied-restored.mp4",
    poster: "impact-supplied-restored-poster.webp",
  },
  { id: "team", video: "team-supplied.mp4", poster: "team-supplied-poster.webp" },
  {
    id: "projects",
    video: "projects-supplied.mp4",
    poster: "projects-supplied-poster.webp",
  },
  {
    id: "freedom",
    video: "sunset-freedom.mp4",
    poster: "sunset-freedom-poster.webp",
  },
  {
    id: "learning",
    video: "learning-notes.mp4",
    poster: "learning-notes-poster.webp",
  },
] as const;

export type CareerScene = (typeof careerScenes)[number];
export type CareerSceneId = CareerScene["id"];

// Every benefit has its own supplied scene.
export function careerSceneForBenefit(
  id: CareerBenefit["id"],
): CareerScene | null {
  return careerScenes.find((scene) => scene.id === id) ?? null;
}
