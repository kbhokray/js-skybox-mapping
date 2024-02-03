/* eslint-disable max-classes-per-file */
import * as THREE from "three";
import cubemap3x4Txt from "../images/cubemap3x4.jpg";
import cubemap2x3Txt from "../images/cubemap2x3.jpg";
import cubemap2x3VidTxt from "../images/cubemapvideo2x3.webm";
import demoCubemap3x2Txt from "../images/demo_cubemap3x2.png";
import { MAPPING_METHOD, TEXTURETYPE } from "../constants";

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
  constructor(name, textureFile, atlasOrder, textureType = TEXTURETYPE.Image) {
    this.name = name;
    this.textureFile = textureFile;
    this.atlasOrder = atlasOrder;
    this.textureType = textureType;
  }
}

export const VARIANTS = {
  CubeMap2x3: new Variant(
    "CubeMap2x3",
    cubemap2x3Txt,
    [
      [FACES.RIGHT, FACES.LEFT, FACES.UP],
      [FACES.DOWN, FACES.FRONT, FACES.BACK],
    ],
    TEXTURETYPE.Image,
  ),
  CubeMap3x4: new Variant(
    "CubeMap3x4",
    cubemap3x4Txt,
    [
      [FACES.NONE, FACES.UP, FACES.NONE, FACES.NONE],
      [FACES.LEFT, FACES.FRONT, FACES.RIGHT, FACES.BACK],
      [FACES.NONE, FACES.DOWN, FACES.NONE, FACES.NONE],
    ],
    TEXTURETYPE.Image,
  ),
  CubeMap2x3Vid: new Variant(
    "CubeMap2x3 Video",
    cubemap2x3VidTxt,
    [
      [FACES.LEFT, FACES.BACK, FACES.RIGHT],
      [FACES.DOWN, FACES.FRONT, FACES.UP],
    ],
    TEXTURETYPE.Video,
  ),
  /* 
  // Uncomment to add the demo layout to the variants
  CubeMap3x2: new Variant(
    "DemoCubeMap3x2",
    demoCubemap3x2Txt,
    [
      [FACES.FRONT, FACES.BACK],
      [FACES.LEFT, FACES.UP],
      [FACES.RIGHT, FACES.DOWN],
    ],
    TEXTURETYPE.Image,
  ), */
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

const TEXTURESORDER = [
  FACES.FRONT,
  FACES.BACK,
  FACES.UP,
  FACES.DOWN,
  FACES.LEFT,
  FACES.RIGHT,
];

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

function* textureItrFn(atlasOrder) {
  for (let rowNum = 0; rowNum < atlasOrder.length; rowNum += 1) {
    const row = atlasOrder[rowNum];
    for (let colNum = 0; colNum < row.length; colNum += 1) {
      const face = row[colNum];
      const faceIdx = TEXTURESORDER.indexOf(face);
      yield { faceIdx, rowNum, colNum };
    }
  }
}

async function updateCanvasCtx(textures, elem, atlasOrder) {
  const numRows = atlasOrder.length;
  const numCols = atlasOrder[0].length;

  const tileHeight = elem.videoHeight / numRows;
  const tileWidth = elem.videoWidth / numCols;

  const textureIterator = textureItrFn(atlasOrder);
  let iter = textureIterator.next();
  while (!iter.done) {
    const { faceIdx, rowNum, colNum } = iter.value;
    if (faceIdx < 0) {
      iter = textureIterator.next();
      continue;
    }

    const ctx = textures[faceIdx].image.getContext("2d");
    ctx.drawImage(
      elem,
      tileWidth * colNum,
      tileHeight * rowNum,
      tileWidth,
      tileHeight,
      0,
      0,
      tileWidth,
      tileHeight,
    );

    textures[faceIdx].needsUpdate = true;

    iter = textureIterator.next();
  }

  elem.requestVideoFrameCallback(
    updateCanvasCtx.bind(this, textures, elem, atlasOrder),
  );
}

async function getTexturesFromAtlasFile(textureElem, atlasOrder) {
  const numTiles = 6;
  const textures = [];
  for (let i = 0; i < numTiles; i += 1) {
    textures[i] = new THREE.Texture();
  }

  const isVideo = textureElem instanceof HTMLVideoElement;

  const numRows = atlasOrder.length;
  const numCols = atlasOrder[0].length;

  let tileHeight = textureElem.height / numRows;
  let tileWidth = textureElem.width / numCols;
  if (isVideo) {
    textureElem.load();
    await new Promise((resolve, reject) => {
      textureElem.addEventListener(
        "canplaythrough",
        () => {
          resolve();
        },
        false,
      );
      textureElem.addEventListener(
        "error",
        () => {
          textureElem.removeEventListener("canplaythrough");
          reject(new Error("Error loading video"));
        },
        false,
      );
    });
    tileHeight = textureElem.videoHeight / numRows;
    tileWidth = textureElem.videoWidth / numCols;
  } else {
    tileHeight = textureElem.naturalHeight / numRows;
    tileWidth = textureElem.naturalWidth / numCols;
  }

  const textureIterator = textureItrFn(atlasOrder);
  let iter = textureIterator.next();
  while (!iter.done) {
    const { faceIdx, rowNum, colNum } = iter.value;
    if (faceIdx < 0) {
      iter = textureIterator.next();
      continue;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = tileHeight;
    canvas.width = tileWidth;

    context.drawImage(
      textureElem,
      tileWidth * colNum,
      tileHeight * rowNum,
      tileWidth,
      tileHeight,
      0,
      0,
      tileWidth,
      tileHeight,
    );

    textures[faceIdx].image = canvas;
    textures[faceIdx].needsUpdate = true;

    iter = textureIterator.next();
  }

  if (isVideo) {
    textureElem.requestVideoFrameCallback(
      updateCanvasCtx.bind(this, textures, textureElem, atlasOrder),
    );
  }

  return textures;
}

function validateAtlasOrder(atlasOrder) {
  if (!Array.isArray(atlasOrder) || !atlasOrder.length) {
    throw new Error("Atlas order not an array");
  }
  if (atlasOrder.some((a) => !Array.isArray(a))) {
    throw new Error("Atlas order should be array of arrays");
  }
}

export async function getMesh(
  variant,
  mappingMethod = MAPPING_METHOD.MaterialArray,
  textureElem = null,
) {
  if (!variant) {
    throw new Error("Empty variant");
  }
  validateAtlasOrder(variant.atlasOrder);

  if (
    !(textureElem instanceof HTMLImageElement) &&
    !(textureElem instanceof HTMLVideoElement)
  ) {
    throw new Error("TextureElement should be one of img or video tags");
  }

  const geometry = new THREE.BoxGeometry(2, 2, 2);
  if (mappingMethod === MAPPING_METHOD.UVMapping) {
    const texture = new THREE.TextureLoader().load(variant.textureFile);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const cube = new THREE.Mesh(geometry, material);

    loadUvMap(geometry, variant.atlasOrder);

    return cube;
  }

  const textures = await getTexturesFromAtlasFile(
    textureElem,
    variant.atlasOrder,
  );
  const materials = [];

  for (let i = 0; i < 6; i += 1) {
    materials.push(
      new THREE.MeshBasicMaterial({ map: textures[i], side: THREE.DoubleSide }),
    );
  }

  const cube = new THREE.Mesh(geometry, materials);

  return cube;
}
