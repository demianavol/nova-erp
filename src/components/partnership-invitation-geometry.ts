/** Coordinates shared by the visible glass pocket and the paper's occlusion mask. */
export const invitationPocketPath =
  "M3 32 296 225Q320 242 344 225L637 32V344Q637 369 612 369H28Q3 369 3 344Z";

// Samples of the quadratic lip, from the right side to the left side.
const mouth = [
  [637, 32],
  [344, 225],
  [332, 231.375],
  [320, 233.5],
  [308, 231.375],
  [296, 225],
  [3, 32],
] as const;

/** Remove paper below the opening, even where the glass itself is translucent. */
export function invitationPocketClip(width: number, top: number) {
  const ratio = width / 640;
  const rim = top + 32 * ratio;
  const points = mouth.map(
    ([x, y]) => `${(x / 640) * 100}% ${top + y * ratio}px`,
  );
  return `polygon(-5% -80px, 105% -80px, 105% ${rim}px, ${points.join(", ")}, -5% ${rim}px)`;
}

export const invitationReadingTransform =
  "perspective(1200px) translate3d(0, 0px, 0px) rotateX(0deg) scale(1)";

/** About 34% apparent approach, without stretching the paper or its typography. */
export function invitationPaperMotion(envelopeHeight: number) {
  return {
    // With perspective, the tucked top edge projects below the lowest point of the lip.
    tucked: `perspective(1200px) translate3d(0, ${envelopeHeight * 0.74}px, -180px) rotateX(8deg) scale(.86)`,
    approaching: `perspective(1200px) translate3d(0, ${envelopeHeight * 0.11}px, -64px) rotateX(2deg) scale(.96)`,
    reading: invitationReadingTransform,
  };
}
