import * as THREE from "three";

const columns = 12;
const rows = 7;
const frameSize = 128;

function material(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.2,
    metalness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    ior: 1.5,
    envMapIntensity: 1.25,
    ...options,
  });
}

function reflectionStudio(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.11, 0.13, 0.18);
  const plane = new THREE.PlaneGeometry(1, 1);
  const panels = [
    [
      [-3.7, 4.2, 4.8],
      [5.5, 2.8],
      [3.8, 3.65, 3.45],
    ],
    [
      [4.1, 1.9, 4.2],
      [1.05, 5],
      [2.25, 2.55, 3.1],
    ],
    [
      [-4.7, 0.4, 2.8],
      [0.6, 5],
      [1.5, 1.75, 2.2],
    ],
    [
      [1.8, 3.6, -4.8],
      [5.7, 1.9],
      [3.25, 3.45, 4.4],
    ],
    [
      [0, -4, 0],
      [7, 6],
      [0.21, 0.23, 0.29],
    ],
  ];
  for (const [position, size, color] of panels) {
    const surface = new THREE.MeshBasicMaterial({
      color: new THREE.Color(...color),
      side: THREE.DoubleSide,
    });
    const panel = new THREE.Mesh(plane, surface);
    panel.position.set(...position);
    panel.scale.set(...size, 1);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(scene, 0.035);
  generator.dispose();
  plane.dispose();
  for (const panel of scene.children) panel.material.dispose();
  return environment;
}

export function createStudio() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(frameSize * 2, frameSize * 2, false);
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const environment = reflectionStudio(renderer);
  const scene = new THREE.Scene();
  scene.environment = environment.texture;
  const camera = new THREE.OrthographicCamera(
    -1.62,
    1.62,
    1.62,
    -1.62,
    0.1,
    40,
  );
  camera.position.set(3.5, 2.8, 6);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xfff3e8, 2.1);
  key.position.set(-3, 4.5, 4);
  const fill = new THREE.DirectionalLight(0xc6dcff, 0.85);
  fill.position.set(4.2, 1, -3.2);
  scene.add(key, fill);

  function bake(kind, factory, onlyPoster = false) {
    const { model, pose } = factory(kind, material);
    scene.add(model);

    const canvas = document.createElement("canvas");
    const frameCount = onlyPoster ? 1 : columns * rows;
    canvas.width = frameSize * (onlyPoster ? 1 : columns);
    canvas.height = frameSize * (onlyPoster ? 1 : rows);
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    for (let index = 0; index < frameCount; index++) {
      const progress = index / frameCount;
      const angle = progress * Math.PI * 2;
      pose(progress);
      camera.position.set(
        3.5 + 0.12 * Math.sin(angle),
        2.8 + 0.065 * (1 - Math.cos(angle)),
        6 - 0.07 * Math.sin(angle),
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      context.drawImage(
        renderer.domElement,
        (index % columns) * frameSize,
        Math.floor(index / columns) * frameSize,
        frameSize,
        frameSize,
      );
    }

    const poster = document.createElement("canvas");
    poster.width = poster.height = frameSize;
    poster
      .getContext("2d")
      .drawImage(
        canvas,
        0,
        0,
        frameSize,
        frameSize,
        0,
        0,
        frameSize,
        frameSize,
      );

    scene.remove(model);
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      for (const surface of [object.material].flat()) surface.dispose();
    });
    return {
      poster: poster.toDataURL("image/webp", 0.94),
      sheet: onlyPoster ? null : canvas.toDataURL("image/webp", 0.89),
    };
  }

  return {
    bake,
    dispose() {
      environment.dispose();
      renderer.dispose();
    },
  };
}
