import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Toastify from "toastify-js";
import * as cube from "./cube";
import { MAPPING_METHOD, TEXTURETYPE } from "../constants";
import "toastify-js/src/toastify.css";

const toast = Toastify({
  text: "Some error occured",
  duration: 3000,
  close: true,
  gravity: "top", // `top` or `bottom`
  position: "center", // `left`, `center` or `right`
  stopOnFocus: true, // Prevents dismissing of toast on hover
  style: {
    background: "linear-gradient(to right, #00b09b, #96c93d)",
  },
});

const TOAST_LEVELS = {
  SUCCESS: {
    defaultMessage: "Success!",
    color: "green",
  },
  ERROR: {
    defaultMessage: "Something went wrong!",
    color: "red",
  },
};

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
  CameraPositionX: 5,
  ViewFromInside: false,
  MappingMethod: MAPPING_METHOD.MaterialArray,
};

const sceneContainer = document.getElementById("scene-container");
const sceneRect = sceneContainer.getBoundingClientRect();

const textureImg = document.getElementById("texture-image");
const textureVid = document.getElementById("texture-video");

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

function showToast(message, toastLevel = TOAST_LEVELS.ERROR) {
  toast.options.text = message || toastLevel.defaultMessage;
  toast.showToast();
}
async function setupScene() {
  scene.clear();
  if (!(textureImg instanceof HTMLImageElement)) {
    console.error("Texture img element not found");
    showToast("Texture img element not found");
  }
  if (!(textureVid instanceof HTMLVideoElement)) {
    console.error("Texture video element not found");
    showToast("Texture video element not found");
  }

  camera.position.z = 0;
  camera.position.y = 0;
  camera.position.x = settings.CameraPositionX;

  const { textureFile, textureType } = settings.Variant;
  let textureElem = null;
  if (textureType === TEXTURETYPE.Image) {
    textureVid.style.display = "none";
    textureImg.style.display = "initial";
    textureImg.src = textureFile;
    try {
      await new Promise((resolve, reject) => {
        textureImg.onload = resolve;
        textureImg.onerror = reject;
      });
    } catch (err) {
      console.error("Cannot load image", err);
      showToast("Cannot load image");
      return;
    }
    textureElem = textureImg;
  } else {
    textureImg.style.display = "none";
    textureVid.src = textureFile;
    textureVid.style.display = "initial";
    try {
      await new Promise((resolve, reject) => {
        textureVid.onloadedmetadata = resolve;
        textureVid.onerror = reject;
      });
    } catch (err) {
      console.error("Cannot load video", err);
      showToast("Cannot load video");
      return;
    }
    textureElem = textureVid;
  }

  const geo = settings.Geometry;
  try {
    mesh = await geo.meshHandler.getMesh(
      settings.Variant,
      settings.MappingMethod,
      textureElem,
    );
  } catch (err) {
    console.error("Error constructing mesh", err);
    showToast(err.message);
    return;
  }

  if (!mesh) {
    return;
  }

  scene.add(mesh);

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
      settings.CameraPositionX = 0.1;
    } else {
      settings.CameraPositionX = 5;
    }
    setupScene();
  });
gui
  .add(settings, "MappingMethod", MAPPING_METHOD)
  .name("Mapping Method")
  .onChange(() => {
    setupScene();
  });
gui
  .add(settings, "AutoRotate")
  .name("Auto Rotate")
  .onChange(() => {
    setupScene();
  });

gui.open();
