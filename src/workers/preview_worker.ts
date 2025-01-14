import type Jimp from "jimp";
import { LayerState } from "../editor/editor";
import {
  getDataUrl,
  mergeLayers,
  processImage,
  Settings,
  splitFrame,
} from "./common";

export type PreviewWorkerRequest = {
  layers: Pick<LayerState, "id" | "file" | "edits">[];
  settings: Settings;
};
export type PreviewWorkerResponse = { urls: string[] };

self.onmessage = async (e: MessageEvent<PreviewWorkerRequest>) => {
  if (e.data) {
    const {
      layers,
      settings: { slice, frameSpeed, quality },
    } = e.data;
    const layerData: { frames: Jimp[]; framerates?: number[] }[] =
      await Promise.all(
        layers.map(({ file, edits }) => processImage(file, edits, slice)),
      );
    const framerates =
      frameSpeed.type === "constant"
        ? [frameSpeed.speed]
        : layerData[layers.findIndex((layer) => layer.id === frameSpeed.id)]
            .framerates || [0];
    const layerImages = layerData.map((data) => data.frames);
    const frames: Jimp[] = await mergeLayers(
      layerImages,
      layers.map((layer) => layer.edits),
    );
    const parts = new Array(slice.x * slice.y)
      .fill(undefined)
      .map(() => new Array(frames.length).fill(undefined));
    frames.forEach((frame, frameIndex) => {
      const split = splitFrame(frame, slice);
      split.forEach((part, partIndex) => (parts[partIndex][frameIndex] = part));
    });
    const urls = await Promise.all(
      parts.map((frames) => getDataUrl(frames, framerates, quality)),
    );
    const res: PreviewWorkerResponse = {
      urls,
    };
    self.postMessage(res);
  }
};

export {};
