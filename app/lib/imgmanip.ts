import { ISize } from "../types/store.types";

export function findStartingImgPixel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const { x: sx, y: sy } = { x: 0, y: 0 };
  for (let y = sy; y < height; y++) {
    for (let x = sx; x < width; x++) {
      const alpha_index1 = (y * width + x) * 4 + 3;
      if (data[alpha_index1] !== 0) return [y, x] as const;
    }
  }
  return undefined;
}

export function getBoundingBox(
  grid: Uint8ClampedArray,
  width: number,
  height: number,
  start: readonly [number, number],
) {
  let debug = 0;
  const startIndex = (start[0] * width + start[1]) * 4 + 3;
  if (grid[startIndex] === 0) return undefined;

  const queue: (readonly [number, number])[] = [];
  queue.push(start || [0, 0]);

  const visited = new Set<string>();
  visited.add((start || [0, 0]).join(","));

  let [minc, maxc] = [width - 1, -1];
  let [minr, maxr] = [height - 1, -1];

  const dir = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [-1, -1],
  ];
  while (queue.length > 0) {
    if (debug++ > grid.length)
      throw Error(
        "sary sary ahahahha, bad algorithm. please give pull request",
      );

    const [r, c] = queue.shift() as unknown as [number, number];
    [minc, maxc] = [Math.min(minc, c), Math.max(c, maxc)] as [number, number];
    [minr, maxr] = [Math.min(minr, r), Math.max(r, maxr)] as [number, number];
    for (const [dy, dx] of dir) {
      const [ny, nx] = [dy + r, dx + c];
      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        grid[(ny * width + nx) * 4 + 3] &&
        !visited.has([ny, nx].join(","))
      ) {
        queue.push([ny, nx]);
        visited.add([ny, nx].join(","));
      }
    }
  }
  return { minc, minr, maxc, maxr };
}

// this may be deprecated in future since im not using this
export function sliceRGBARegion(
  rgba: Uint8ClampedArray,
  width: number,
  rect: { minc: number; minr: number; maxc: number; maxr: number },
) {
  const { minc, minr, maxc, maxr } = rect;
  const regionWidth = maxc - minc;
  const regionHeight = maxr - minr;
  const totalLen = regionWidth * regionHeight * 4;
  const slicedRegion = new Uint8ClampedArray(totalLen);

  for (let r = minr; r < maxr; r++) {
    for (let c = minc; c < maxc; c++) {
      const originalIndex = (r * width + c) * 4;
      const newIdx = ((r - minr) * regionWidth + (c - minc)) * 4;
      for (let i = 0; i <= 3; i++) {
        slicedRegion[newIdx + i] = rgba[originalIndex + i];
      }
    }
  }

  return { region: slicedRegion, w: maxc - minc, h: maxr - minr };
}

export function cropCanvas(origCanvas: HTMLCanvasElement, offset = 0) {
  const ctx = origCanvas.getContext("2d")!;
  const imdata = ctx.getImageData(0, 0, origCanvas.width, origCanvas.height);
  const startPix = findStartingImgPixel(
    imdata.data,
    origCanvas.width,
    origCanvas.height,
  );

  if (!startPix) return origCanvas;

  const bbox = getBoundingBox(
    imdata.data,
    origCanvas.width,
    origCanvas.height,
    startPix,
  );

  if (!bbox) return origCanvas;

  const rawWidth = bbox.maxc - bbox.minc;
  const rawHeight = bbox.maxr - bbox.minr;

  const newWidth =
    offset > 0 ? Math.ceil(rawWidth / offset) * offset : rawWidth;
  const newHeight =
    offset > 0 ? Math.ceil(rawHeight / offset) * offset : rawHeight;

  const newCanvas = document.createElement("canvas");
  newCanvas.width = newWidth;
  newCanvas.height = newHeight;
  const newCtx = newCanvas.getContext("2d")!;

  const drawX = offset > 0 ? ~~((newWidth - rawWidth) / 2) : 0;
  const drawY = offset > 0 ? ~~((newHeight - rawHeight) / 2) : 0;

  newCtx.drawImage(
    origCanvas,
    bbox.minc,
    bbox.minr,
    rawWidth,
    rawHeight,
    drawX,
    drawY,
    rawWidth,
    rawHeight,
  );

  return newCanvas;
}

export function resizeImage(origCanvas: HTMLCanvasElement, targetSize: ISize) {
  const origImdata = origCanvas
    .getContext("2d")!
    .getImageData(0, 0, origCanvas.width, origCanvas.height);
  const [targetW, targetH] = targetSize;
  const scaleRatioX = origCanvas.width / targetW;
  const scaleRatioY = origCanvas.height / targetH;

  const newCanvas = document.createElement("canvas");
  newCanvas.width = targetW;
  newCanvas.height = targetH;
  const newCtx = newCanvas.getContext("2d")!;
  const newImdata = newCtx.getImageData(
    0,
    0,
    newCanvas.width,
    newCanvas.height,
  );

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcY = Math.floor(y * scaleRatioY);
      const srcX = Math.floor(x * scaleRatioX);

      const dstIndex = (y * targetW + x) * 4;
      const srcIndex = (srcY * origCanvas.width + srcX) * 4;

      for (let k = 0; k < 4; k++) {
        newImdata.data[dstIndex + k] = origImdata.data[srcIndex + k];
      }
    }
  }

  newCtx.putImageData(newImdata, 0, 0);
  return newCanvas;
}
