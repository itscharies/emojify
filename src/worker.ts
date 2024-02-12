import type Jimp from "jimp";
import jimp from "jimp/es";
import { GifFrame, GifUtil, GifCodec } from "gifwrap";
import { OUTPUT_SIZE, Edits, Slice, ResizeMode } from "./editor/editor";

export type WorkerRequestLayer = {
  id: string;
  file: File;
  edits: Edits;
  slice: Slice;
};
export type WorkerRequestPreview = {
  layers: { file: File; edits: Edits }[];
  slice: Slice;
};
export type WorkerRequest =
  | ({ type: "layer" } & WorkerRequestLayer)
  | ({ type: "preview" } & WorkerRequestPreview);

export type WorkerResponseLayer = { id: string; urls: string[] };
export type WorkerResponsePreview = { urls: string[] };
export type WorkerResponse =
  | ({ type: "layer" } & WorkerResponseLayer)
  | ({ type: "preview" } & WorkerResponsePreview);

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data) {
    switch (e.data.type) {
      case "layer": {
        const { id, file, edits, slice } = e.data;
        const images = await processImage(file, edits, slice);
        const urls: string[] = await mergeLayers([images]);
        const res: WorkerResponse = {
          type: "layer",
          id,
          urls,
        };
        self.postMessage(res);
        break;
      }
      case "preview": {
        const { layers, slice } = e.data;
        const layerImages: Jimp[][][] = await Promise.all(
          layers.map(({ file, edits }) => processImage(file, edits, slice)),
        );
        const urls: string[] = await mergeLayers(layerImages);
        const res: WorkerResponse = {
          type: "preview",
          urls,
        };
        self.postMessage(res);
        break;
      }
    }
  }
};

// Proces the image, returns a list of frames[] which is a list of parts[]
async function processImage(
  file: File,
  edits: Edits,
  slice: Slice,
): Promise<Jimp[][]> {
  const isGif = file.type === "image/gif";
  if (isGif) {
    const arrayBuffer = await file.arrayBuffer();
    const gif = await GifUtil.read(Buffer.from(arrayBuffer));
    const gifs: Jimp[][] = [];
    gif.frames.forEach((frame) => {
      const image: Jimp = GifUtil.copyAsJimp(jimp, frame);
      const edited = applyEdits(image, edits);
      const frameParts = splitFrame(edited, slice, edits.resize);
      gifs.push(frameParts);
    });
    return gifs;
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const image = await jimp.read(Buffer.from(arrayBuffer));
    const edited = applyEdits(image, edits);
    const parts = splitFrame(edited, slice, edits.resize);
    return [parts];
  }
}

// Applies any edits to an image
function applyEdits(image: Jimp, edits: Edits): Jimp {
  const { flipX, flipY } = edits;
  const cloned: Jimp = image.clone();
  cloned.flip(flipX, flipY);
  return cloned;
}

// Returns an array of emoji-sized, Jimp modifyable images from a given slice
function splitFrame(image: Jimp, { x, y }: Slice, mode: ResizeMode): Jimp[] {
  const images: Jimp[] = [];
  const width = x * OUTPUT_SIZE;
  const height = y * OUTPUT_SIZE;
  const cloned = image.clone();
  const resized = cloned[mode](width, height);
  for (let cy = 0; cy < y; cy++) {
    for (let cx = 0; cx < x; cx++) {
      // Create a copy to modify and crop
      const cloned: Jimp = resized.clone();
      cloned.crop(cx * OUTPUT_SIZE, cy * OUTPUT_SIZE, OUTPUT_SIZE, OUTPUT_SIZE);
      images.push(cloned);
    }
  }
  return images;
}

// Takes a list of layers[] which has a list of frames[] which has a list of parts[]
// All parts have same length
// Not all frames have same-length
// - These are normalised to the longest frame length
// Returns the dataUrl strings
async function mergeLayers(layers: Jimp[][][]): Promise<string[]> {
  const partsCount = layers[0][0].length;
  const layersCount = layers.length;
  const layerlengths = layers.map((frames) => frames.length);
  const longestFramesCount: number = Math.max(...layerlengths);
  // maps to Parts -> Frames(normalised) -> Layers(for frame)
  const newParts: Jimp[][][] = new Array(partsCount)
    .fill(undefined)
    .map(() =>
      new Array(longestFramesCount)
        .fill(undefined)
        .map(() => new Array(layersCount).fill(undefined)),
    );
  // Loop through the parts
  for (let partIndex = 0; partIndex < partsCount; partIndex++) {
    // Loop through the layers
    for (let layerIndex = 0; layerIndex < layersCount; layerIndex++) {
      for (let i = 0; i < longestFramesCount; i++) {
        const frames = layers[layerIndex];
        const frameIndex = i % frames.length;
        newParts[partIndex][i][layerIndex] =
          layers[layerIndex][frameIndex][partIndex].clone();
      }
    }
  }
  // Map parts to data-urls
  const parts: Promise<string>[] = newParts.map((frames) => {
    const newFrames: Jimp[] = frames.map((layers) => composeImages(layers));
    if (frames.length > 1) {
      const codec = new GifCodec();
      // TODO: preserve frame rate
      const gifFrames = newFrames.map(({ bitmap }) => new GifFrame(bitmap));
      // Ensure color isn't out of bounds
      GifUtil.quantizeDekker(gifFrames, 256);
      return codec
        .encodeGif(gifFrames, { colorScope: 2 })
        .then(
          (gif) => "data:image/gif;base64," + gif.buffer.toString("base64"),
        );
    } else {
      return newFrames[0].getBase64Async(jimp.AUTO);
    }
  });
  return Promise.all(parts);
}

function composeImages(images: Jimp[]): Jimp {
  let prevImage;
  for (const image of images) {
    if (!prevImage) {
      prevImage = image.clone();
      continue;
    }
    prevImage.composite(image, 0, 0);
  }
  return prevImage;
}

export {};
