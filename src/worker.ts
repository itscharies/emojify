import type Jimp from "jimp";
import jimp from "jimp/es";
import { GifCodec, GifFrame, GifUtil } from "gifwrap";
import { Edits, OUTPUT_SIZE, ResizeMode, Slice } from "./editor/editor";

type Settings = {
  slice: Slice;
  speed: number;
  quality?: number;
};
export type WorkerRequestLayer = {
  id: string;
  file: File;
  edits: Edits;
  settings: Settings;
};
export type WorkerRequestPreview = {
  layers: { file: File; edits: Edits }[];
  settings: Settings;
};
export type WorkerRequest =
  | ({ type: "layer" } & WorkerRequestLayer)
  | ({ type: "preview" } & WorkerRequestPreview);

export type WorkerResponseLayer = { id: string; url: string };
export type WorkerResponsePreview = { urls: string[] };
export type WorkerResponse =
  | ({ type: "layer" } & WorkerResponseLayer)
  | ({ type: "preview" } & WorkerResponsePreview);

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data) {
    switch (e.data.type) {
      case "layer": {
        const {
          id,
          file,
          edits,
          settings: { slice, speed, quality },
        } = e.data;
        const frames: Jimp[] = await processImage(file, edits, slice);
        const url = await getDataUrl(frames, speed, quality);
        const res: WorkerResponse = {
          type: "layer",
          id,
          url,
        };
        self.postMessage(res);
        break;
      }
      case "preview": {
        const {
          layers,
          settings: { slice, speed, quality },
        } = e.data;
        const layerImages: Jimp[][] = await Promise.all(
          layers.map(({ file, edits }) => processImage(file, edits, slice)),
        );
        const frames: Jimp[] = await mergeLayers(layerImages);
        // const splitFrames = frames.map((frame) => splitFrame(frame, slice));
        // console.log(splitFrames);
        const parts = new Array(slice.x * slice.y)
          .fill(undefined)
          .map(() => new Array(frames.length).fill(undefined));
        frames.forEach((frame, frameIndex) => {
          const split = splitFrame(frame, slice);
          split.forEach(
            (part, partIndex) => (parts[partIndex][frameIndex] = part),
          );
        });
        const urls = await Promise.all(
          parts.map((frames) => getDataUrl(frames, speed, quality)),
        );
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
): Promise<Jimp[]> {
  const isGif = file.type === "image/gif";
  if (isGif) {
    const arrayBuffer = await file.arrayBuffer();
    const gif = await GifUtil.read(Buffer.from(arrayBuffer));
    const gifs: Jimp[] = [];
    gif.frames.forEach((frame) => {
      const image: Jimp = GifUtil.copyAsJimp(jimp, frame);
      const edited = applyEdits(image, edits);
      gifs.push(resizeToSlice(edited, slice, edits.resize));
    });
    return gifs;
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const image = await jimp.read(Buffer.from(arrayBuffer));
    const edited = applyEdits(image, edits);
    const resized = resizeToSlice(edited, slice, edits.resize);
    return [resized];
  }
}

// Applies any edits to an image
function applyEdits(image: Jimp, edits: Edits): Jimp {
  const { flipX, flipY } = edits;
  image.flip(flipX, flipY);
  return image;
}

function resizeToSlice(image: Jimp, { x, y }: Slice, mode: ResizeMode): Jimp {
  const width = x * OUTPUT_SIZE;
  const height = y * OUTPUT_SIZE;
  return image[mode](width, height);
}

// Returns an array of emoji-sized, Jimp modifyable images from a given slice
function splitFrame(image: Jimp, { x, y }: Slice): Jimp[] {
  const images: Jimp[] = [];
  for (let cy = 0; cy < y; cy++) {
    for (let cx = 0; cx < x; cx++) {
      const cropped = image
        .clone()
        .crop(cx * OUTPUT_SIZE, cy * OUTPUT_SIZE, OUTPUT_SIZE, OUTPUT_SIZE);
      images.push(cropped);
    }
  }
  return images;
}

// Takes a list of layers[] which has a list of frames[] which has a list of parts[]
// All parts have same length
// Not all frames have same-length
// - These are normalised to the longest frame length
// Returns the layers
async function mergeLayers(layers: Jimp[][]): Promise<Jimp[]> {
  const layersCount = layers.length;
  const layerlengths = layers.map((frames) => frames.length);
  const longestFramesCount: number = Math.max(...layerlengths);
  // maps to Frames(normalised) -> Layers(for frame)
  const framesWithLayers: Jimp[][] = new Array(longestFramesCount)
    .fill(undefined)
    .map(() => new Array(layersCount).fill(undefined));
  // Loop through the layers
  for (let layerIndex = 0; layerIndex < layersCount; layerIndex++) {
    for (let i = 0; i < longestFramesCount; i++) {
      const frames = layers[layerIndex];
      const frameIndex = i % frames.length;
      framesWithLayers[i][layerIndex] = layers[layerIndex][frameIndex];
    }
  }
  // Map parts to data-urls
  return framesWithLayers.map((layers) => composeImages(layers));
}

async function getDataUrl(
  frames: Jimp[],
  speed: number,
  quality?: number,
): Promise<string> {
  if (frames.length > 1) {
    const codec = new GifCodec();
    // TODO: preserve frame rate
    const gifFrames = frames.map((jimpFrame) => {
      if (quality) {
        jimpFrame.posterize(quality);
      }
      const frame = new GifFrame(jimpFrame.bitmap);
      frame.delayCentisecs = speed;
      return frame;
    });
    // Ensure color isn't out of bounds
    GifUtil.quantizeSorokin(gifFrames, 256);
    return codec
      .encodeGif(gifFrames, { colorScope: 2 })
      .then((gif) => "data:image/gif;base64," + gif.buffer.toString("base64"));
  } else {
    return frames[0].getBase64Async(jimp.AUTO);
  }
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
