import { describe, expect, it } from "vitest";
import { Vector3, PerspectiveCamera } from "three";
import {
  constrainBadgeToViewport,
  projectedBadgeBounds,
  projectLanyardViewport,
} from "./lanyard-viewport";
import {
  cardLayout,
  createSimulation,
  configureSimulation,
  placeHanging,
  stepSimulation,
} from "./Lanyard.jsx";

const physical = {
  gravity: 40,
  hold: 135,
  stiffness: 1600,
  spring: 25,
  bandDamping: 30,
  linearDrag: 1.6,
  angularDrag: 3,
  air: 0.15,
  broadside: 0.5,
  spinAir: 0.03,
  nodeDrag: 2,
  nodeAir: 0.2,
  twist: 30,
  twistDamping: 3,
  grip: 40,
  gripDamping: 6,
  breeze: 0,
};
function badge() {
  const layout = cardLayout("portrait", 0.55);
  const sim = createSimulation();
  sim.anchor.set(0, 3, 0);
  configureSimulation(sim, layout, 1.4);
  placeHanging(sim, layout, false);
  return sim;
}
function advance(sim, seconds) {
  for (let frame = 0; frame < seconds * 60; frame++) {
    stepSimulation(sim, 1 / 60, physical, frame / 60);
    expect(
      [...sim.body.position, ...sim.body.quaternion].every(Number.isFinite),
    ).toBe(true);
  }
}
describe("Lanyard physics", () => {
  it("keeps the strap anchored while a card settles under gravity", () => {
    const sim = badge();
    advance(sim, 3);
    expect(sim.nodes[0].distanceTo(sim.anchor)).toBeLessThan(1e-8);
    expect(sim.body.velocity.length()).toBeLessThan(0.1);
    expect(sim.body.quaternion.length()).toBeCloseTo(1, 5);
  });
  it("recovers after stretching and releasing a grabbed card", () => {
    const sim = badge();
    sim.grab = {
      local: new Vector3(),
      rotation: sim.body.quaternion.clone(),
      from: sim.body.position.clone(),
      target: sim.body.position.clone().add(new Vector3(0.8, 0.7, 0.2)),
    };
    advance(sim, 0.5);
    expect(sim.body.position.x).toBeGreaterThan(0.2);
    sim.grab = null;
    advance(sim, 6);
    expect(Math.abs(sim.body.position.x)).toBeLessThan(0.15);
    expect(sim.body.velocity.length()).toBeLessThan(0.2);
  });
  it("settles on the reverse side after the flip impulse", () => {
    const sim = badge();
    sim.turn = Math.PI;
    sim.body.angular.y = 9;
    advance(sim, 5);
    const front = new Vector3(0, 0, 1).applyQuaternion(sim.body.quaternion);
    expect(front.z).toBeLessThan(-0.9);
    expect(sim.body.angular.length()).toBeLessThan(0.2);
  });
  it("survives a screen-wide stretch, reprojection during grab and release", () => {
    const sim = badge();
    const layout = cardLayout("portrait", 0.55);
    const camera = new PerspectiveCamera(24, 480 / 510, 0.1, 200);
    camera.position.z = 12;
    const viewport = { left: 0, top: 0, width: 1440, height: 900 };
    projectLanyardViewport(
      camera,
      { left: 800, top: 100, width: 480, height: 510 },
      viewport,
    );
    sim.grab = {
      local: new Vector3(),
      rotation: sim.body.quaternion.clone(),
      from: sim.body.position.clone(),
      target: new Vector3(-12, 8, 0.2),
    };
    for (let i = 0; i < 90; i++) {
      if (i === 30) {
        viewport.width = 390;
        viewport.height = 844;
        projectLanyardViewport(
          camera,
          { left: 18, top: 120, width: 354, height: 320 },
          viewport,
        );
      }
      if (i === 60) sim.grab = null;
      stepSimulation(sim, 1 / 60, physical, i / 60);
      constrainBadgeToViewport(sim.body, layout, camera, viewport);
      const b = projectedBadgeBounds(sim.body, layout, camera, viewport);
      expect(b.left).toBeGreaterThanOrEqual(15.99);
      expect(b.bottom).toBeLessThanOrEqual(viewport.height - 15.99);
      expect(
        [...sim.body.position, ...sim.body.quaternion].every(Number.isFinite),
      ).toBe(true);
      expect(sim.nodes[0].distanceTo(sim.anchor)).toBeLessThan(1e-8);
    }
    advance(sim, 10);
    expect(sim.body.velocity.length()).toBeLessThan(0.2);
    expect(sim.body.quaternion.length()).toBeCloseTo(1, 5);
  });
});
