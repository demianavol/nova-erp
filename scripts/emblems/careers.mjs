import * as THREE from "three";

const mix = (a, b, t) => a + (b - a) * t;
const ease = (start, end, progress) => {
  const t = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};
const envelope = (start, rise, fall, end, progress) =>
  ease(start, rise, progress) * (1 - ease(fall, end, progress));

function mesh(group, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  group.add(object);
  return object;
}

function extrude(shape, thickness, bevel) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -thickness / 2 + bevel);
  return geometry;
}

function block(width, height, thickness, bevel) {
  const x = width / 2 - bevel;
  const y = height / 2 - bevel;
  const radius = Math.min(x, y, bevel * 1.6);
  const shape = new THREE.Shape();
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  return extrude(shape, thickness, bevel);
}

function lightMaterial(color, opacity = 0) {
  return new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: true,
    depthWrite: false,
  });
}

function growth(material) {
  const model = new THREE.Group();
  const blue = material(0x3786cd);
  const cobalt = material(0x204075);
  const tread = material(0x86d8ff);
  const foot = -0.74;
  mesh(model, block(2.13, 0.15, 1.08, 0.04), cobalt, 0, foot - 0.075);
  const steps = [0.56, 1.02, 1.46].map((height, index) => {
    const stage = new THREE.Group();
    const edgeLight = lightMaterial(0xc3f2ff, 0.12);
    stage.position.set((index - 1) * 0.65, foot, 0);
    model.add(stage);
    mesh(stage, block(0.64, height, 0.86, 0.04), blue, 0, height / 2);
    mesh(stage, block(0.65, 0.11, 0.88, 0.028), tread, 0, height - 0.065);
    mesh(
      stage,
      block(0.46, 0.045, 0.015, 0.005),
      edgeLight,
      0,
      height - 0.068,
      0.449,
    );
    return { stage, edgeLight };
  });
  return {
    model,
    pose(progress) {
      steps.forEach(({ stage, edgeLight }, index) => {
        const offset = index * 0.115;
        const load = envelope(
          0.015,
          0.17,
          0.2 + offset,
          0.42 + offset,
          progress,
        );
        const settle = envelope(
          0.32 + offset,
          0.48 + offset,
          0.49 + offset,
          0.66 + offset,
          progress,
        );
        stage.scale.y = 1 - (0.18 + index * 0.065) * load + 0.035 * settle;
        edgeLight.opacity = 0.12 + 0.68 * settle;
      });
    },
  };
}

function knight(material) {
  const model = new THREE.Group();
  const boardFrame = material(0x47302f);
  const walnut = material(0x5c4554);
  const porcelain = material(0xe0bf8f);
  const brass = material(0xd38629);
  const gold = material(0xffca66);
  const origin = lightMaterial(0xfbd378);
  const destination = lightMaterial(0xffe3a4);
  const xStep = 0.67;
  const zStep = 0.53;
  mesh(model, block(2.17, 0.15, 1.77, 0.045), boardFrame, 0, -0.88);
  const tile = block(0.645, 0.075, 0.505, 0.018);
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      mesh(
        model,
        tile,
        (row + col) % 2 === 0 ? porcelain : walnut,
        col * xStep,
        -0.776,
        row * zStep,
      );
    }
  }
  const square = new THREE.PlaneGeometry(0.59, 0.45);
  mesh(model, square, origin, -xStep, -0.738, zStep).rotation.x = -Math.PI / 2;
  mesh(model, square, destination, xStep, -0.738, 0).rotation.x = -Math.PI / 2;

  const horse = new THREE.Shape();
  horse.moveTo(-0.42, 0.14);
  horse.bezierCurveTo(-0.43, 0.38, -0.28, 0.55, -0.13, 0.7);
  horse.lineTo(-0.36, 0.66);
  horse.quadraticCurveTo(-0.55, 0.68, -0.47, 0.81);
  horse.lineTo(-0.26, 1.08);
  horse.lineTo(-0.23, 1.32);
  horse.quadraticCurveTo(-0.2, 1.37, -0.15, 1.31);
  horse.lineTo(-0.05, 1.16);
  horse.bezierCurveTo(0.28, 1.19, 0.43, 0.9, 0.43, 0.6);
  horse.lineTo(0.43, 0.14);
  horse.closePath();

  const piece = new THREE.Group();
  model.add(piece);
  mesh(piece, extrude(horse, 0.35, 0.045), gold, 0, 0.03);
  mesh(piece, new THREE.CylinderGeometry(0.45, 0.51, 0.12, 48), brass, 0, 0.06);
  mesh(
    piece,
    new THREE.CylinderGeometry(0.39, 0.43, 0.105, 48),
    gold,
    0,
    0.165,
  );
  mesh(
    piece,
    new THREE.SphereGeometry(0.036, 18, 12),
    boardFrame,
    -0.195,
    1.018,
    0.178,
  ).scale.z = 0.47;
  const mane = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.02, 1.122, 0.176),
    new THREE.Vector3(0.27, 1.05, 0.189),
    new THREE.Vector3(0.34, 0.84, 0.179),
    new THREE.Vector3(0.34, 0.6, 0.174),
  );
  mesh(piece, new THREE.TubeGeometry(mane, 28, 0.018, 10), porcelain);
  return {
    model,
    pose(progress) {
      const takeOff = ease(0.17, 0.45, progress);
      const returnMove = ease(0.63, 0.91, progress);
      const travelled = takeOff - returnMove;
      const hop =
        Math.sin(Math.PI * takeOff) * 0.42 +
        Math.sin(Math.PI * returnMove) * 0.32;
      const anticipate = envelope(0.05, 0.15, 0.16, 0.25, progress);
      const land = envelope(0.41, 0.47, 0.56, 0.65, progress);
      const home = envelope(0.87, 0.93, 0.94, 1, progress);
      piece.position.set(
        mix(-0.57, 0.58, travelled),
        -0.735 + hop,
        mix(0.4, -0.03, travelled),
      );
      piece.rotation.y = mix(-0.15, 0.06, travelled);
      piece.rotation.z =
        0.075 * anticipate -
        0.1 * Math.sin(Math.PI * takeOff) +
        0.075 * Math.sin(Math.PI * returnMove) +
        0.065 * land -
        0.05 * home;
      origin.opacity = 0.15 + 0.54 * anticipate + 0.43 * home;
      destination.opacity = 0.05 + 0.63 * land;
    },
  };
}

const up = new THREE.Vector3(0, 1, 0);

function orientBone(object, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  object.position.copy(start).lerp(end, 0.5);
  object.quaternion.setFromUnitVectors(up, direction.normalize());
}

function team(material) {
  const model = new THREE.Group();
  const mint = material(0x52cfb7);
  const sea = material(0x228a7d);
  const pearl = material(0xa0eeda);
  const pedestal = material(0x205e60);
  mesh(model, block(1.98, 0.12, 0.8, 0.035), pedestal, 0, -0.77, 0);
  const torso = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.04, -0.6),
      new THREE.Vector2(0.19, -0.61),
      new THREE.Vector2(0.27, -0.52),
      new THREE.Vector2(0.3, -0.15),
      new THREE.Vector2(0.29, 0.04),
      new THREE.Vector2(0.24, 0.17),
      new THREE.Vector2(0.14, 0.23),
      new THREE.Vector2(0.02, 0.23),
    ],
    42,
  );
  const head = new THREE.SphereGeometry(0.24, 32, 20);
  const arm = new THREE.CapsuleGeometry(0.09, 0.32, 6, 14);
  const joint = new THREE.SphereGeometry(0.09, 24, 16);
  const fist = new THREE.SphereGeometry(0.102, 24, 16);
  const figures = [-1, 1].map((side) => {
    const person = new THREE.Group();
    person.position.x = side * 0.43;
    model.add(person);
    const body = mesh(person, torso, mint, 0, 0, 0);
    body.scale.z = 0.76;
    const skull = mesh(person, head, pearl, 0, 0.47, 0.012);
    skull.scale.set(0.96, 1.02, 0.92);
    const biceps = mesh(person, arm, mint);
    const forearm = mesh(person, arm, sea);
    forearm.scale.y = 0.8;
    const elbow = mesh(person, joint, mint);
    const hand = mesh(person, fist, pearl);
    mesh(person, joint, sea, -side * 0.224, -0.16, 0.1).scale.set(1, 2.65, 1);
    return { person, side, biceps, forearm, elbow, hand };
  });
  return {
    model,
    pose(progress) {
      figures.forEach(
        ({ person, side, biceps, forearm, elbow, hand }, index) => {
          const offset = index * 0.09;
          const flex = envelope(
            0.12 + offset,
            0.43 + offset,
            0.6 + offset,
            0.9 + offset,
            progress,
          );
          const ready = envelope(
            0.04 + offset,
            0.17 + offset,
            0.18 + offset,
            0.28 + offset,
            progress,
          );
          const start = new THREE.Vector3(side * 0.225, 0.04, 0.012);
          const upperAngle = mix(-1.16, 0.26, flex) - 0.08 * ready;
          const lowerAngle = mix(-1.5, 1.82, flex);
          const bend = start
            .clone()
            .add(
              new THREE.Vector3(
                side * Math.cos(upperAngle) * 0.32,
                Math.sin(upperAngle) * 0.32,
                0.025,
              ),
            );
          const end = bend
            .clone()
            .add(
              new THREE.Vector3(
                side * Math.cos(lowerAngle) * 0.28,
                Math.sin(lowerAngle) * 0.28,
                0.015 + 0.09 * flex,
              ),
            );
          orientBone(biceps, start, bend);
          orientBone(forearm, bend, end);
          elbow.position.copy(bend);
          hand.position.copy(end);
          person.rotation.z = side * (0.025 * ready - 0.055 * flex);
        },
      );
    },
  };
}

function projects(material) {
  const model = new THREE.Group();
  const amber = material(0xddbe3e);
  const bronze = material(0x64532c);
  const lemon = material(0xffffad);
  const arc = lightMaterial(0xfff1ac);
  mesh(
    model,
    new THREE.CylinderGeometry(0.74, 0.81, 0.15, 60),
    bronze,
    0,
    -0.84,
  );
  mesh(
    model,
    new THREE.CylinderGeometry(0.69, 0.73, 0.055, 60),
    amber,
    0,
    -0.74,
  );
  const ring = mesh(
    model,
    new THREE.RingGeometry(0.48, 0.55, 48),
    arc,
    0,
    -0.706,
  );
  ring.rotation.x = -Math.PI / 2;

  const shape = new THREE.Shape();
  shape.moveTo(0.12, 0.99);
  shape.lineTo(-0.64, -0.05);
  shape.lineTo(-0.08, -0.05);
  shape.lineTo(-0.37, -0.69);
  shape.lineTo(0.58, 0.31);
  shape.lineTo(0.075, 0.31);
  shape.lineTo(0.39, 0.99);
  shape.closePath();
  const bolt = new THREE.Group();
  model.add(bolt);
  mesh(bolt, extrude(shape, 0.31, 0.06), amber);
  const facet = new THREE.Shape();
  facet.moveTo(0.18, 0.9);
  facet.lineTo(-0.44, 0.01);
  facet.lineTo(0.03, 0.01);
  facet.lineTo(-0.18, -0.45);
  facet.lineTo(0.39, 0.245);
  facet.lineTo(-0.005, 0.245);
  facet.lineTo(0.32, 0.9);
  facet.closePath();
  mesh(bolt, new THREE.ShapeGeometry(facet), lemon, 0, 0, 0.157);
  const strike = mesh(
    model,
    new THREE.SphereGeometry(0.15, 24, 16),
    arc,
    0,
    -0.68,
    0.08,
  );
  strike.scale.y = 0.24;

  return {
    model,
    pose(progress) {
      const charge = envelope(0.06, 0.28, 0.29, 0.39, progress);
      const impact = envelope(0.3, 0.42, 0.45, 0.56, progress);
      const recoil = envelope(0.49, 0.57, 0.59, 0.69, progress);
      const wave = ease(0.41, 0.75, progress);
      bolt.position.y = 0.08 + 0.19 * charge - 0.14 * impact + 0.04 * recoil;
      bolt.rotation.y = -0.12 + 0.22 * charge - 0.07 * impact;
      bolt.rotation.z = -0.045 * charge + 0.03 * impact;
      arc.opacity = 0.82 * envelope(0.395, 0.45, 0.46, 0.76, progress);
      ring.scale.setScalar(mix(0.25, 1.62, wave));
      strike.scale.set(1 + wave * 2, 0.24, 1 + wave * 2);
    },
  };
}

function freedom(material) {
  const model = new THREE.Group();
  const plum = material(0x542d4b);
  const muted = material(0x956080);
  const rose = material(0xb86083);
  const highlight = material(0xe99db1);
  const ivory = material(0xffdae3);
  const recess = material(0x6a3557);
  mesh(model, block(2.24, 0.16, 1.01, 0.045), plum, 0, -0.74, 0.05);
  mesh(model, block(2.05, 0.055, 0.77, 0.016), muted, 0, -0.631, 0.05);
  const cards = [
    {
      x: -0.65,
      y: 0.02,
      z: -0.11,
      width: 0.57,
      height: 1.06,
      angle: -0.11,
      glass: muted,
    },
    {
      x: -0.02,
      y: 0.22,
      z: -0.25,
      width: 0.61,
      height: 1.33,
      angle: 0.06,
      glass: rose,
    },
    {
      x: 0.6,
      y: 0.07,
      z: 0.14,
      width: 0.65,
      height: 1.2,
      angle: -0.13,
      glass: highlight,
    },
  ].map((layout) => {
    const tile = new THREE.Group();
    model.add(tile);
    mesh(tile, block(layout.width, layout.height, 0.16, 0.04), layout.glass);
    mesh(
      tile,
      block(layout.width - 0.14, layout.height - 0.17, 0.035, 0.013),
      recess,
      0,
      0.006,
      0.075,
    );
    mesh(
      tile,
      block(layout.width - 0.24, 0.05, 0.028, 0.008),
      muted,
      0,
      -0.25,
      0.096,
    );
    return { tile, ...layout };
  });

  const bar = block(0.31, 0.052, 0.03, 0.009);
  for (const y of [0.17, 0.055]) mesh(cards[0].tile, bar, ivory, 0, y, 0.1);
  for (const [index, height] of [0.12, 0.21, 0.34].entries()) {
    mesh(
      cards[1].tile,
      block(0.065, height, 0.036, 0.012),
      highlight,
      (index - 1) * 0.12,
      -0.11 + height / 2,
      0.101,
    );
  }

  const check = new THREE.CurvePath();
  check.add(
    new THREE.LineCurve3(
      new THREE.Vector3(-0.13, 0.075, 0.122),
      new THREE.Vector3(-0.043, -0.018, 0.122),
    ),
  );
  check.add(
    new THREE.LineCurve3(
      new THREE.Vector3(-0.043, -0.018, 0.122),
      new THREE.Vector3(0.15, 0.2, 0.122),
    ),
  );
  const mark = mesh(
    cards[2].tile,
    new THREE.TubeGeometry(check, 22, 0.033, 10),
    ivory,
  );
  const lock = lightMaterial(0xffe7ed);
  mesh(cards[2].tile, block(0.38, 0.025, 0.015, 0.004), lock, 0, -0.382, 0.099);

  return {
    model,
    pose(progress) {
      const select = envelope(0.11, 0.49, 0.78, 1, progress);
      const catchSpring = envelope(0.43, 0.53, 0.55, 0.64, progress);
      const seat = envelope(0.51, 0.66, 0.69, 0.82, progress);
      cards.forEach(({ tile, x, y, z, angle }, index) => {
        const active = index === 2;
        tile.position.set(
          x + (active ? -0.045 : -0.055) * select,
          y + (active ? 0.105 : -0.052) * select,
          z + (active ? 0.42 : -0.075) * select - (active ? 0.044 * seat : 0),
        );
        tile.rotation.y = angle + (active ? 0.15 : -0.065) * select;
      });
      mark.scale.setScalar(1 + 0.09 * catchSpring);
      lock.opacity = 0.11 + 0.69 * seat;
    },
  };
}

function pageStack(width, depth, side) {
  const outline = new THREE.Shape();
  outline.moveTo(0, 0.065);
  outline.quadraticCurveTo(side * width * 0.56, 0.04, side * width, 0.055);
  outline.lineTo(side * width, 0.205);
  outline.quadraticCurveTo(side * width * 0.53, 0.33, 0, 0.145);
  outline.closePath();
  return extrude(outline, depth, 0.028);
}

function book(material) {
  const model = new THREE.Group();
  const spread = new THREE.Group();
  const forest = material(0x246959);
  const coverEdge = material(0x4aab83);
  const paper = material(0x9ed0b5, { roughness: 0.28 });
  const ink = material(0x5d9984, { roughness: 0.32 });
  const sheet = material(0xc9ead5, { roughness: 0.25, side: THREE.DoubleSide });
  const gold = material(0xddb76d);
  spread.rotation.x = 0.44;
  spread.rotation.y = -0.16;
  spread.position.y = -0.34;
  model.add(spread);
  mesh(
    spread,
    new THREE.CylinderGeometry(0.095, 0.095, 1.51, 28),
    forest,
    0,
    0.011,
  ).rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    mesh(spread, block(1.12, 0.118, 1.56, 0.041), forest, side * 0.57, 0.006);
    mesh(
      spread,
      block(1.065, 0.047, 1.5, 0.015),
      coverEdge,
      side * 0.565,
      0.056,
    );
    mesh(spread, pageStack(1.046, 1.43, side), paper);
    for (const y of [0.078, 0.125, 0.165]) {
      const edge = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(side * 0.1, y, 0.718),
        new THREE.Vector3(side * 0.56, y + 0.035, 0.725),
        new THREE.Vector3(side * 0.99, y + 0.015, 0.714),
      );
      mesh(spread, new THREE.TubeGeometry(edge, 18, 0.008, 7), ink);
    }
    for (const [index, z] of [-0.32, -0.17, -0.02, 0.13, 0.28].entries()) {
      const line = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(side * 0.25, 0.236, z),
        new THREE.Vector3(side * 0.57, 0.31, z),
        new THREE.Vector3(side * (index === 4 ? 0.74 : 0.89), 0.264, z),
      );
      mesh(spread, new THREE.TubeGeometry(line, 18, 0.013, 6), ink);
    }
  }
  mesh(
    spread,
    block(0.105, 0.035, 0.34, 0.01),
    gold,
    0.3,
    0.14,
    0.646,
  ).rotation.x = -0.25;

  const turner = new THREE.Group();
  turner.position.y = 0.168;
  spread.add(turner);
  const width = 1.01;
  const depth = 1.36;
  const leaf = new THREE.PlaneGeometry(width, depth, 22, 10);
  leaf.rotateX(-Math.PI / 2);
  leaf.translate(width / 2, 0, 0);
  mesh(turner, leaf, sheet);
  const edge = mesh(
    turner,
    new THREE.CylinderGeometry(0.012, 0.012, depth, 12),
    paper,
    width,
    0,
  );
  edge.rotation.x = Math.PI / 2;
  const positions = leaf.getAttribute("position");
  const glints = [];
  for (const z of [-0.28, -0.12, 0.04, 0.2]) {
    glints.push(
      mesh(turner, block(0.55, 0.012, 0.019, 0.004), ink, 0.57, 0.08, z),
    );
  }
  return {
    model,
    pose(progress) {
      const flip = ease(0.12, 0.79, progress);
      const tension = Math.sin(Math.PI * flip);
      turner.rotation.z = Math.PI * flip;
      turner.visible = progress > 0.12 && progress < 0.79;
      for (let index = 0; index < positions.count; index++) {
        const x = positions.getX(index);
        const z = positions.getZ(index);
        const fraction = x / width;
        const curvature =
          Math.sin(Math.PI * fraction) * (0.11 + tension * 0.15);
        positions.setY(
          index,
          curvature +
            fraction * 0.06 +
            fraction * fraction * z * tension * 0.16,
        );
      }
      positions.needsUpdate = true;
      leaf.computeVertexNormals();
      edge.position.y = 0.06;
      edge.rotation.x = Math.PI / 2 - 0.14 * tension;
      for (const detail of glints) {
        detail.position.y =
          0.13 + 0.13 * tension + detail.position.z * 0.08 * tension;
        detail.rotation.z = -0.08 * tension;
      }
    },
  };
}

const scenes = {
  "career-growth": growth,
  "career-impact": knight,
  "career-team": team,
  "career-projects": projects,
  "career-freedom": freedom,
  "career-learning": book,
};

export function careerScene(kind, material) {
  const scene = scenes[kind](material);
  scene.pose(0);
  return scene;
}
