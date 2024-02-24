import type Jimp from "jimp";
import jimp from "jimp/es";
import { GifCodec, GifFrame, GifUtil } from "gifwrap";
import { Edits, OUTPUT_SIZE, ResizeMode, Slice } from "../editor/editor";

// Proces the image, returns a list of frames[] which is a list of parts[]
export async function processImage(
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
export function applyEdits(image: Jimp, edits: Edits): Jimp {
  const { flipX, flipY, brightness, contrast } = edits;
  image.flip(flipX, flipY);
  image.contrast(contrast / 100);
  image.brightness(brightness / 100);
  return image;
}

export function resizeToSlice(
  image: Jimp,
  { x, y }: Slice,
  mode: ResizeMode,
): Jimp {
  const width = x * OUTPUT_SIZE;
  const height = y * OUTPUT_SIZE;
  return image[mode](width, height);
}

// Returns an array of emoji-sized, Jimp modifyable images from a given slice
export function splitFrame(image: Jimp, { x, y }: Slice): Jimp[] {
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
export async function mergeLayers(layers: Jimp[][]): Promise<Jimp[]> {
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

export async function getDataUrl(
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

export function composeImages(images: Jimp[]): Jimp {
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
