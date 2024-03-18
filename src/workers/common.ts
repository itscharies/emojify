import type Jimp from "jimp";
import jimp from "jimp/es";
import { GifCodec, GifFrame, GifUtil } from "gifwrap";
import { BlendMode, Edits, OUTPUT_SIZE, Slice } from "../editor/editor";

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
      gifs.push(resizeToSlice(edited, slice, edits));
    });
    return gifs;
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const image = await jimp.read(Buffer.from(arrayBuffer));
    const edited = applyEdits(image, edits);
    const resized = resizeToSlice(edited, slice, edits);
    return [resized];
  }
}

// Applies any edits to an image
export function applyEdits(image: Jimp, edits: Edits): Jimp {
  const {
    flipX,
    flipY,
    rotate,
    brightness,
    contrast,
    invert,
    grayscale,
    opacity,
  } = edits;
  rotate !== 0 && image.rotate(rotate);
  (flipX || flipY) && image.flip(flipX, flipY);
  image.contrast(contrast / 100);
  image.brightness(brightness / 100);
  image.opacity(opacity / 100);
  invert && image.invert();
  grayscale && image.grayscale();
  return image;
}

export function resizeToSlice(
  image: Jimp,
  { x, y }: Slice,
  edits: Edits,
): Jimp {
  const { resize, scale, top, left, width: w, height: h } = edits;
  const width = x * OUTPUT_SIZE;
  const height = y * OUTPUT_SIZE;
  const base: Jimp = new jimp(width, height);
  if (resize === "none") {
    return base.composite(image.resize(w, h).scale(scale), left, top);
  }
  return base.composite(image[resize](width, height), 0, 0);
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
export async function mergeLayers(
  layers: Jimp[][],
  layerEdits: Edits[],
): Promise<Jimp[]> {
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
  return framesWithLayers.map((layers) => composeImages(layers, layerEdits));
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
      .encodeGif(gifFrames, { colorScope: 2, loops: 0 })
      .then((gif) => "data:image/gif;base64," + gif.buffer.toString("base64"));
  } else {
    return frames[0].getBase64Async(jimp.AUTO);
  }
}

export function composeImages(images: Jimp[], layerEdits: Edits[]): Jimp {
  const image: Jimp = images[0].clone();
  for (let i = 0; i < images.length; i++) {
    const edits = layerEdits[i];
    if (edits.blendMode === "mask") {
      image.mask(images[i], 0, 0);
    } else {
      image.composite(images[i], 0, 0, {
        mode: getBlendMode(edits.blendMode),
        opacitySource: 1,
        opacityDest: 1,
      });
    }
  }
  return image;
}

const getBlendMode = (blendMode: BlendMode) => {
  switch (blendMode) {
    case "normal":
      return jimp.BLEND_SOURCE_OVER;
    case "multiply":
      return jimp.BLEND_MULTIPLY;
    case "add":
      return jimp.BLEND_ADD;
    case "screen":
      return jimp.BLEND_SCREEN;
    case "overlay":
      return jimp.BLEND_OVERLAY;
    case "darken":
      return jimp.BLEND_DARKEN;
    case "lighten":
      return jimp.BLEND_LIGHTEN;
    case "hardlight":
      return jimp.BLEND_HARDLIGHT;
    case "difference":
      return jimp.BLEND_DIFFERENCE;
    case "exclusion":
      return jimp.BLEND_EXCLUSION;
    default:
      throw new Error("unreachable");
  }
};
