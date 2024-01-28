/* eslint-disable max-classes-per-file */
import * as THREE from "three";
import cubemap3x4Txt from "../images/cubemap3x4.jpg";
import cubemap2x3Txt from "../images/cubemap2x3.jpg";
import demoCubemap3x2Txt from "../images/demo_cubemap3x2.png";

const FACES = {
  NONE: "NONE",
  FRONT: "FRONT",
  BACK: "BACK",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP: "UP",
  DOWN: "DOWN",
};

class Variant {
  constructor(name, textureFile, atlasOrder) {
    this.name = name;
    this.textureFile = textureFile;
    this.atlasOrder = atlasOrder;
  }
}

export const VARIANTS = {
  CubeMap2x3: new Variant("CubeMap2x3", cubemap2x3Txt, [
    [FACES.RIGHT, FACES.LEFT, FACES.UP],
    [FACES.DOWN, FACES.FRONT, FACES.BACK],
  ]),
  CubeMap3x4: new Variant("CubeMap3x4", cubemap3x4Txt, [
    [FACES.NONE, FACES.UP, FACES.NONE, FACES.NONE],
    [FACES.LEFT, FACES.FRONT, FACES.RIGHT, FACES.BACK],
    [FACES.NONE, FACES.DOWN, FACES.NONE, FACES.NONE],
  ]),
  /*
  // Uncomment to add the demo layout to the variants
  CubeMap3x2: new Variant("DemoCubeMap3x2", demoCubemap3x2Txt, [
    [FACES.FRONT, FACES.BACK],
    [FACES.LEFT, FACES.UP],
    [FACES.RIGHT, FACES.DOWN],
  ]), 
  */
};

class Face {
  constructor(coords = []) {
    this.TopLeft = {
      X: coords[0],
      Y: coords[1],
    };
    this.TopRight = {
      X: coords[2],
      Y: coords[3],
    };
    this.BottomLeft = {
      X: coords[4],
      Y: coords[5],
    };
    this.BottomRight = {
      X: coords[6],
      Y: coords[7],
    };
  }
}

const UVMAPPING = {
  [FACES.BACK]: new Face([40, 41, 42, 43, 44, 45, 46, 47]),
  [FACES.LEFT]: new Face([8, 9, 10, 11, 12, 13, 14, 15]),
  [FACES.RIGHT]: new Face([0, 1, 2, 3, 4, 5, 6, 7]),
  [FACES.FRONT]: new Face([32, 33, 34, 35, 36, 37, 38, 39]),
  [FACES.UP]: new Face([16, 17, 18, 19, 20, 21, 22, 23]),
  [FACES.DOWN]: new Face([24, 25, 26, 27, 28, 29, 30, 31]),
};

function loadUvMap(geo, atlasOrder) {
  const uv = geo.getAttribute("uv");

  const numRows = atlasOrder.length;
  for (let r = 0; r < numRows; r += 1) {
    const row = atlasOrder[r];
    const numCols = row.length;
    for (let c = 0; c < numCols; c += 1) {
      const face = row[c];
      const faceUv = UVMAPPING[face];
      if (!faceUv) {
        continue;
      }
      const txtLX = (1 / numCols) * c;
      const txtRX = (1 / numCols) * (c + 1);
      const txtTY = 1 - (1 / numRows) * r;
      const txtBY = 1 - (1 / numRows) * (r + 1);

      uv.array[faceUv.TopLeft.X] = txtLX;
      uv.array[faceUv.TopLeft.Y] = txtTY;
      uv.array[faceUv.TopRight.X] = txtRX;
      uv.array[faceUv.TopRight.Y] = txtTY;
      uv.array[faceUv.BottomLeft.X] = txtLX;
      uv.array[faceUv.BottomLeft.Y] = txtBY;
      uv.array[faceUv.BottomRight.X] = txtRX;
      uv.array[faceUv.BottomRight.Y] = txtBY;
    }
  }
}

export function getMesh(variant) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const texture = new THREE.TextureLoader().load(variant.textureFile);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  const cube = new THREE.Mesh(geometry, material);

  loadUvMap(geometry, variant.atlasOrder);

  return cube;
}
