import type Jimp from "jimp";
import { Edits, Slice } from "../editor/editor";
import { getDataUrl, mergeLayers, processImage, splitFrame } from "./common";

type Settings = {
  slice: Slice;
  speed: number;
  quality?: number;
};
export type PreviewWorkerRequest = {
  layers: { file: File; edits: Edits }[];
  settings: Settings;
};
export type PreviewWorkerResponse = { urls: string[] };

self.onmessage = async (e: MessageEvent<PreviewWorkerRequest>) => {
  if (e.data) {
    const {
      layers,
      settings: { slice, speed, quality },
    } = e.data;
    const layerImages: Jimp[][] = await Promise.all(
      layers.map(({ file, edits }) => processImage(file, edits, slice)),
    );
    const frames: Jimp[] = await mergeLayers(
      layerImages,
      layers.map((layer) => layer.edits.blendMode),
    );
    // const splitFrames = frames.map((frame) => splitFrame(frame, slice));
    // console.log(splitFrames);
    const parts = new Array(slice.x * slice.y)
      .fill(undefined)
      .map(() => new Array(frames.length).fill(undefined));
    frames.forEach((frame, frameIndex) => {
      const split = splitFrame(frame, slice);
      split.forEach((part, partIndex) => (parts[partIndex][frameIndex] = part));
    });
    const urls = await Promise.all(
      parts.map((frames) => getDataUrl(frames, speed, quality)),
    );
    const res: PreviewWorkerResponse = {
      urls,
    };
    self.postMessage(res);
  }
};

export {};
