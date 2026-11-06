// The original tilted ellipse, with six distinct stops around its circumference.
export const careerOrbitPath =
  "M 181.126 135.61273 A 290 115 -10 0 1 458.91376 66.35365 A 290 115 -10 0 1 657.78776 120.74092 A 290 115 -10 0 1 578.874 244.38727 A 290 115 -10 0 1 301.08624 313.64635 A 290 115 -10 0 1 102.21224 259.25908 A 290 115 -10 0 1 181.126 135.61273 Z";
// Arc lengths at six evenly spaced ellipse angles.
export const careerMilestones = [
  0, 0.21660391670604046, 0.37645954637263696, 0.4999999541943228,
  0.7166040083173949, 0.8764595692754755,
] as const;

export const clampCareerProgress = (value: number) =>
  Math.max(0, Math.min(1, value));

export function careerIndexAtProgress(value: number) {
  const progress = clampCareerProgress(value);
  return careerMilestones.reduce<number>(
    (active, milestone, index) =>
      progress + 0.000001 >= milestone ? index : active,
    0,
  );
}

export function careerScrollProgress(
  top: number,
  height: number,
  pinHeight: number,
) {
  const raw = clampCareerProgress(
    (100 - top) / Math.max(1, height - pinHeight),
  );
  const chapter = Math.min(
    careerMilestones.length - 1,
    raw * careerMilestones.length,
  );
  const index = Math.floor(chapter);
  if (index === careerMilestones.length - 1) return careerMilestones[index];
  // Spend 60% of each chapter at its milestone, then travel to the next one.
  const travel = clampCareerProgress((chapter - index - 0.6) / 0.4);
  const ease = travel * travel * (3 - 2 * travel);
  return (
    careerMilestones[index] +
    ease * (careerMilestones[index + 1] - careerMilestones[index])
  );
}
