import type { CareerBenefit } from "./company-careers";

export const careerScenes = [
  {
    id: "growth",
    video: "creative-projects.mp4",
    poster: "creative-projects-poster.webp",
  },
  {
    id: "impact",
    video: "impact-supplied-loop.mp4",
    poster: "impact-supplied-loop-poster.webp",
  },
  {
    id: "team",
    video: "team-supplied-loop.mp4",
    poster: "team-supplied-loop-poster.webp",
  },
  {
    id: "projects",
    video: "projects-supplied-loop.mp4",
    poster: "projects-supplied-loop-poster.webp",
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

// Every benefit has its own scene, using a moving dissolve at the loop join.
export function careerSceneForBenefit(
  id: CareerBenefit["id"],
): CareerScene | null {
  return careerScenes.find((scene) => scene.id === id) ?? null;
}
