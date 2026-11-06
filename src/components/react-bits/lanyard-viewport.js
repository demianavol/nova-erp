import { Vector3 } from "three";

/** Expand the original local frustum, rather than rescaling the badge to the screen. */
export function projectLanyardViewport(camera, rect, viewport) {
  camera.setViewOffset(
    rect.width,
    rect.height,
    viewport.left - rect.left,
    viewport.top - rect.top,
    viewport.width,
    viewport.height,
  );
  camera.updateMatrixWorld();
}

export function viewportPixelRatio(width, height, deviceRatio = 1) {
  return Math.min(
    1,
    deviceRatio,
    Math.sqrt(2_000_000 / Math.max(1, width * height)),
  );
}

/** Ordinary scrolling must be able to carry an idle badge out of the viewport. */
export function shouldConstrainLanyard(
  rect,
  viewport,
  deliberateInteraction = false,
) {
  if (deliberateInteraction) return true;
  return (
    rect.left >= viewport.left &&
    rect.top >= viewport.top &&
    rect.left + rect.width <= viewport.left + viewport.width &&
    rect.top + rect.height <= viewport.top + viewport.height
  );
}

/** Let vertical and diagonal touch swipes remain native page scrolling. */
export function lanyardTouchIntent(start, point) {
  const dx = Math.abs(point.clientX - start.x);
  const dy = Math.abs(point.clientY - start.y);
  if (Math.max(dx, dy) < 8) return "pending";
  return dx > dy * 1.25 ? "drag" : "scroll";
}

const corner = new Vector3();
const center = new Vector3();
const moved = new Vector3();
const delta = new Vector3();

export function projectedBadgeBounds(body, layout, camera, viewport) {
  let left = Infinity,
    right = -Infinity,
    top = Infinity,
    bottom = -Infinity;
  for (const x of [-layout.width / 2 - 0.03, layout.width / 2 + 0.03])
    for (const y of [-layout.height / 2 - 0.03, layout.height / 2 + 0.4])
      for (const z of [-0.09, 0.09]) {
        corner
          .set(x, y, z)
          .applyQuaternion(body.quaternion)
          .add(body.position)
          .project(camera);
        const px = ((corner.x + 1) * viewport.width) / 2;
        const py = ((1 - corner.y) * viewport.height) / 2;
        left = Math.min(left, px);
        right = Math.max(right, px);
        top = Math.min(top, py);
        bottom = Math.max(bottom, py);
      }
  return { left, right, top, bottom };
}

/** Correct the complete rotated card and its clip, including free swings. */
export function constrainBadgeToViewport(
  body,
  layout,
  camera,
  viewport,
  margin = 16,
) {
  let corrected = false;
  const nearest =
    camera.position.z - Math.hypot(layout.width, layout.height) / 2 - 0.4;
  if (body.position.z > nearest) {
    const dz = nearest - body.position.z;
    body.position.z += dz;
    if (body.previous) body.previous.z += dz;
    if (body.velocity?.z > 0) body.velocity.z *= 0.18;
    corrected = true;
  }
  // Reprojection resolves the small difference between front and rear corner depths.
  for (let pass = 0; pass < 4; pass++) {
    const bounds = projectedBadgeBounds(body, layout, camera, viewport);
    const fit = Math.max(
      (bounds.right - bounds.left) / Math.max(1, viewport.width - margin * 2),
      (bounds.bottom - bounds.top) / Math.max(1, viewport.height - margin * 2),
    );
    if (fit > 1.001) {
      const distance = camera.position.z - body.position.z;
      const dz = -distance * (fit - 1) * 1.02;
      body.position.z += dz;
      if (body.previous) body.previous.z += dz;
      if (body.velocity?.z > 0) body.velocity.z *= 0.18;
      corrected = true;
      continue;
    }
    const shift = (low, high, size) => {
      if (high - low > size - 2 * margin) return size / 2 - (low + high) / 2;
      return low < margin
        ? margin - low
        : high > size - margin
          ? size - margin - high
          : 0;
    };
    const dx = shift(bounds.left, bounds.right, viewport.width);
    const dy = shift(bounds.top, bounds.bottom, viewport.height);
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) break;
    center.copy(body.position).project(camera);
    moved.copy(center);
    moved.x += (dx * 2) / viewport.width;
    moved.y -= (dy * 2) / viewport.height;
    moved.unproject(camera);
    delta.subVectors(moved, body.position);
    body.position.add(delta);
    // Cancel outward speed softly without injecting correction distance as energy.
    body.previous?.add(delta);
    if (body.velocity) {
      if (dx * body.velocity.x < 0) body.velocity.x *= 0.18;
      if (-dy * body.velocity.y < 0) body.velocity.y *= 0.18;
    }
    corrected = true;
  }
  return corrected;
}
