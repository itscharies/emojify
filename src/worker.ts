import Jimp from "jimp/es";
import { OUTPUT_SIZE, Edits, Slice, ResizeMode } from "./editor/editor";
import { log } from "console";

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
        const urls: string[] = await Promise.all(
          images.map((image) => image.getBase64Async(Jimp.AUTO))
        );
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
        const layerImages: Jimp[][] = await Promise.all(
          layers.map(({ file, edits }) => processImage(file, edits, slice))
        );
        const images: Jimp[] = [];
        const length = slice.x * slice.y;
        for (let i = 0; i < length; i++) {
          const cellImages: Jimp[] = [];
          layerImages.forEach((layer) => cellImages.push(layer[i]));
          images.push(composeImages(cellImages));
        }
        const urls: string[] = await Promise.all(
          images.map((image) => image.getBase64Async(Jimp.AUTO))
        );
        const res: WorkerResponse = {
          type: "preview",
          urls: urls,
        };
        self.postMessage(res);
        break;
      }
    }
  }
};

async function processImage(
  file: File,
  edits: Edits,
  slice: Slice
): Promise<Jimp[]> {
  const fileUrl = URL.createObjectURL(file);
  const image = await Jimp.read(fileUrl);
  URL.revokeObjectURL(fileUrl);
  const edited = applyEdits(image, edits);
  return splitFrame(edited, slice, edits.resize, image.getExtension());
}

function applyEdits(image: Jimp, edits: Edits): Jimp {
  const { flipX, flipY } = edits;
  const cloned: Jimp = image.clone();
  cloned.flip(flipX, flipY);
  return cloned;
}

// Returns an array of emoji-sized, Jimp modifyable images
function splitFrame(
  image: Jimp,
  { x, y }: Slice,
  mode: ResizeMode,
  ext: string
): Jimp[] {
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
      if (ext === "gif") {
        // Was getting some weird 'colorspace limit' errors 🤷‍♂️
        cloned.posterize(15);
      }
      images.push(cloned);
    }
  }

  return images;
}

function composeImages(images: Jimp[]) {
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
