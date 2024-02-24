import type Jimp from "jimp";
import { Edits, Slice } from "../editor/editor";
import { processImage, getDataUrl } from "./common";

type Settings = {
  slice: Slice;
  speed: number;
  quality?: number;
};
export type LayerWorkerRequest = {
  id: string;
  file: File;
  edits: Edits;
  settings: Settings;
};
export type LayerWorkerResponse = { id: string; url: string };

self.onmessage = async (e: MessageEvent<LayerWorkerRequest>) => {
  if (e.data) {
    const {
      id,
      file,
      edits,
      settings: { slice, speed, quality },
    } = e.data;
    const frames: Jimp[] = await processImage(file, edits, slice);
    const url = await getDataUrl(frames, speed, quality);
    const res: LayerWorkerResponse = {
      id,
      url,
    };
    self.postMessage(res);
  }
};

export {};
