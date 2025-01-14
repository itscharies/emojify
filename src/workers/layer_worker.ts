import { Edits } from "../editor/editor";
import { processImage, getDataUrl, Settings } from "./common";

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
      settings: { slice, frameSpeed, quality },
    } = e.data;
    const { frames, framerates } = await processImage(file, edits, slice);
    const url = await getDataUrl(
      frames,
      frameSpeed.type === "constant" ? [frameSpeed.speed] : framerates || [0], // This should never happen but...
      quality,
    );
    const res: LayerWorkerResponse = {
      id,
      url,
    };
    self.postMessage(res);
  }
};
