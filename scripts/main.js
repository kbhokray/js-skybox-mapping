import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as cube from "./cube";

class Geometry {
  constructor(name, variants, meshHandler) {
    this.name = name;
    this.variants = variants;
    this.meshHandler = meshHandler;
  }
}

const GEOMETRIES = {
  Cube: new Geometry("Cube", cube.VARIANTS, cube),
};

const settings = {
  Geometry: GEOMETRIES.Cube,
  GeometryName: "",
  Variant: GEOMETRIES.Cube.variants.CubeMap2x3,
  VariantName: "",
  AutoRotate: false,
  CameraPositionZ: 5,
  ViewFromInside: false,
};

const sceneContainer = document.getElementById("scene-container");
const sceneRect = sceneContainer.getBoundingClientRect();

const textureImg = document.getElementById("texture-image");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  sceneRect.width / sceneRect.height,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(sceneRect.width, sceneRect.height);
renderer.setClearColor(0xa1887f);

window.addEventListener("resize", () => {
  const r = sceneContainer.getBoundingClientRect();
  renderer.setSize(r.width, r.height);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;

controls.update();

sceneContainer.appendChild(renderer.domElement);

let mesh;

export function animate() {
  requestAnimationFrame(animate);

  if (settings.AutoRotate && mesh) {
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.005;
    mesh.rotation.z += 0.005;
  }

  controls.update();
  renderer.render(scene, camera);
}

function setupScene() {
  scene.clear();
  camera.position.z = settings.CameraPositionZ;

  const geo = settings.Geometry;
  mesh = geo.meshHandler.getMesh(settings.Variant);

  if (!mesh) {
    return;
  }

  scene.add(mesh);

  const { textureFile } = settings.Variant;
  textureImg.src = textureFile;

  animate();
}

setupScene();

const gui = new GUI();
gui
  .add(
    settings,
    "GeometryName",
    Object.values(GEOMETRIES).map((G) => G.name),
  )
  .name("Skybox Shape")
  .setValue(settings.Geometry.name)
  .onChange((v) => {
    const geo = Object.values(GEOMETRIES).find((g) => g.name === v);
    settings.Geometry = geo;
    setupScene();
  });

gui
  .add(
    settings,
    "VariantName",
    Object.values(settings.Geometry.variants).map((V) => V.name),
  )
  .name("Variant")
  .setValue(settings.Variant.name)
  .onChange((v) => {
    const variant = Object.values(settings.Geometry.variants).find(
      (g) => g.name === v,
    );
    settings.Variant = variant;
    setupScene();
  });

gui
  .add(settings, "ViewFromInside")
  .name("View From Inside")
  .onChange((v) => {
    if (v) {
      settings.CameraPositionZ = 0.01;
    } else {
      settings.CameraPositionZ = 5;
    }
    setupScene();
  });

gui
  .add(settings, "AutoRotate")
  .name("Auto Rotate")
  .onChange(() => {
    setupScene();
  });

gui.open();
