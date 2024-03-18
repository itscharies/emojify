import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer, useLocalObservable } from "mobx-react-lite";
import {
  action,
  autorun,
  makeAutoObservable,
  observable,
  runInAction,
  toJS,
} from "mobx";
import { downloadZip } from "client-zip";
import str2ab from "string-to-arraybuffer";
import { Text } from "../components/typography/text";
import { Button } from "../components/input/button";
import { FileInput } from "../components/input/file";
import { Checkbox } from "../components/input/checkbox";
import { Number } from "../components/input/number";
import { Image } from "../components/image";
import { Divider } from "../components/divider";
import { TextInput } from "../components/input/text";
import { Field } from "../components/input/field";
import { Label } from "../components/input/label";
import { Select } from "../components/input/select";
import { RadioTabs } from "../components/input/radio_tabs";
import { Range } from "../components/input/range";
import { IdGenerator } from "../base/id_generator";
import {
  LayerWorkerRequest,
  LayerWorkerResponse,
} from "../workers/layer_worker";
import {
  PreviewWorkerRequest,
  PreviewWorkerResponse,
} from "../workers/preview_worker";
import classNames from "classnames";
import { debounce } from "../base/debounce";
import { Accordion } from "../components/accordion";
import { CornerUpLeft } from "../icons/corner_up_left";
import { CornerUpRight } from "../icons/corner_up_right";
import { ArrowUp } from "../icons/arrow_up";
import { ArrowDown } from "../icons/arrow_down";
import { FlipX } from "../icons/flip_x";
import { FlipY } from "../icons/flip_y";

export const OUTPUT_SIZE = 64;

export type Slice = { x: number; y: number };

export class EditorState {
  order: string[] = [];
  layers: Map<string, LayerState> = observable.map([], { deep: true });
  disposers: Map<string, () => void> = observable.map([], { deep: true });
  name: string = "";
  previewUrls: string[] = [];
  slice: Slice = { x: 1, y: 1 };
  // TODO: preserve original speed
  speed: number = 5;
  quality: number | undefined = undefined;
  get isGif() {
    return Array.from(this.layers.values()).some(
      (layer) => layer.file.type === "image/gif",
    );
  }
  get sortedLayers() {
    const layers = Array.from(this.layers.entries());
    if (this.order.length === 0) {
      return layers;
    }
    return layers.sort(([a], [b]) =>
      this.order.findIndex((id) => id === a) >
        this.order.findIndex((id) => id === b)
        ? 1
        : -1,
    );
  }
  get hasLayers() {
    return this.layers.size > 0;
  }
  get editsHash() {
    return `${this.slice.x}${this.slice.y}${this.speed}${this.quality}${this.order.join("")}`;
  }
  get previewHash(): string {
    return (
      Array.from(this.layers.values())
        .map((layer) => layer.editsHash)
        .join("") + this.editsHash
    );
  }
  constructor() {
    makeAutoObservable(this);
  }
}

export class LayerState {
  id: string;
  name: string;
  edits: Edits;
  file: File;
  dataUrl?: string;
  get editsHash() {
    const {
      flipX,
      flipY,
      resize,
      rotate,
      scale,
      top,
      left,
      width,
      height,
      brightness,
      contrast,
      alignX,
      alignY,
      blendMode,
      invert,
      grayscale,
    } = this.edits;
    return `${this.id}${this.name}${flipX}${flipY}${resize}${rotate}${scale}${top}${left}${width}${height}${brightness}${contrast}${alignX}${alignY}${blendMode}${invert}${grayscale}`;
  }
  constructor({ id, file, name }: { id: string; file: File; name: string }) {
    this.id = id;
    this.file = file;
    this.name = name;
    this.edits = new Edits();
    this.dataUrl = undefined;
    makeAutoObservable(this, undefined);
  }
}

export type ResizeMode = "resize" | "cover" | "contain" | "none";
export type BlendMode =
  | "normal"
  | "multiply"
  | "add"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "hardlight"
  | "difference"
  | "exclusion"
  | "mask";
export type AlignMode = "start" | "center" | "end";
export class Edits {
  resize: ResizeMode = "contain";
  rotate: number = 0;
  scale: number = 1;
  top: number = 0;
  left: number = 0;
  width: number = OUTPUT_SIZE;
  height: number = OUTPUT_SIZE;
  flipX: boolean = false;
  flipY: boolean = false;
  brightness: number = 0;
  contrast: number = 0;
  alignX: AlignMode = "center";
  alignY: AlignMode = "center";
  blendMode: BlendMode = "normal";
  invert: boolean = false;
  grayscale: boolean = false;
  constructor() {
    makeAutoObservable(this);
  }
}

const BLEND_OPTIONS: { label: string; value: BlendMode }[] = [
  {
    label: "Normal",
    value: "normal",
  },
  {
    label: "Mask",
    value: "mask",
  },
  {
    label: "Multiply",
    value: "multiply",
  },
  {
    label: "Add",
    value: "add",
  },
  {
    label: "Screen",
    value: "screen",
  },
  {
    label: "Overlay",
    value: "overlay",
  },
  {
    label: "Darken",
    value: "darken",
  },
  {
    label: "Lighten",
    value: "lighten",
  },
  {
    label: "Hardlight",
    value: "hardlight",
  },
  {
    label: "Difference",
    value: "difference",
  },
  {
    label: "Exclusion",
    value: "exclusion",
  },
];

const RESIZE_OPTIONS: { label: string; value: ResizeMode }[] = [
  {
    label: "Fit",
    value: "contain",
  },
  {
    label: "Cover",
    value: "cover",
  },
  {
    label: "Stretch",
    value: "resize",
  },
  {
    label: "Manual",
    value: "none",
  },
];

const QUALITY_OPTIONS: { label: string; value: string }[] = [
  {
    label: "Full",
    value: "full",
  },
  {
    label: "High",
    value: "high",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "Low",
    value: "low",
  },
  {
    label: "💀💀💀",
    value: "none",
  },
];

const Editor = observer(() => {
  const idGenerator = useMemo(() => new IdGenerator(), []);
  const store = useLocalObservable(() => new EditorState());

  const onRenderLayer = useCallback(
    (data: LayerWorkerResponse) => {
      const { id, url } = data;
      const layer = store.layers.get(id);
      if (layer) {
        runInAction(() => {
          layer.dataUrl = url;
        });
      }
    },
    [store],
  );

  const layerWorker = useMemo(() => new LayerWorker(onRenderLayer), []);
  const previewWorker = useMemo(() => new PreviewWorker(), []);

  const debouncedPreview = debounce(async () => {
    const { sortedLayers, slice, speed, quality } = store;
    const { urls } = await previewWorker.render({
      layers: sortedLayers.map(([_, layer]) => toJS(layer)),
      settings: {
        slice: toJS(slice),
        speed,
        quality,
      },
    });
    runInAction(() => {
      store.previewUrls = urls;
    });
  }, 500);
  useEffect(() => {
    const dispose = autorun(() => {
      // trigger autorun
      const { hasLayers, previewHash } = store;
      if (hasLayers && previewHash) {
        debouncedPreview();
      }
    });
    return () => dispose();
  }, [store.previewHash, store.hasLayers]);

  const uploadFile = action((files: FileList | undefined) => {
    if (!files) {
      return;
    }

    for (const file of Array.from(files)) {
      const id = idGenerator.next();
      const name = file.name;
      const parts = name.split(".");
      const ext = parts.pop();
      if (ext && !ext.match(/jpe?g|png|gif/i)) {
        // TODO: show toast or soemthing
        alert(`.${ext} not supported :(`);
        continue;
      }
      const layer = new LayerState({ id: id, file, name });
      store.layers.set(id, layer);
      store.order.push(id);
      store.name === "" && (store.name = parts.join(".") || "emoji");
      const debouncedLayerRender = debounce(() => {
        const {
          flipX,
          flipY,
          resize,
          rotate,
          scale,
          top,
          left,
          width,
          height,
          brightness,
          contrast,
          alignX,
          alignY,
          blendMode,
          invert,
          grayscale,
        } = layer.edits;
        const { slice, speed, quality } = store;
        layerWorker.render({
          id,
          file,
          edits: {
            flipX,
            flipY,
            resize,
            rotate,
            scale,
            top,
            left,
            width,
            height,
            brightness,
            contrast,
            alignX,
            alignY,
            blendMode,
            invert,
            grayscale,
          },
          settings: {
            slice: toJS(slice),
            speed,
            quality,
          },
        });
      }, 500);
      const dispose = autorun(() => {
        // trigger the autorun
        const run = store.editsHash && layer.editsHash;
        if (run) {
          debouncedLayerRender();
        }
      });
      store.disposers.set("id", dispose);
    }
  });

  const downloadBundle = async (urls: string[], name: string, ext: string) => {
    let url;
    let downloadExt = ext;
    let dispose;
    if (urls.length === 1) {
      url = urls[0];
    } else {
      const files = urls.map((url, i) => ({
        name: `${name}-${i + 1}${ext}`,
        input: str2ab(url),
      }));
      const blob = await downloadZip(files).blob();
      const dispose = URL.createObjectURL(blob);
      url = dispose;
      downloadExt = ".zip";
    }

    const link = document.createElement("a");
    link.download = `${name}${downloadExt}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (dispose) {
      URL.revokeObjectURL(dispose);
    }
  };

  const onDelete = action((id) => {
    store.layers.delete(id);
    store.disposers.get(id)?.();
    store.disposers.delete(id);
    const order = [...store.order];
    order.splice(
      store.order.findIndex((i) => i === id),
      1,
    );
    store.order = order;
  });

  const { hasLayers } = store;

  if (!hasLayers) {
    return (
      <div className="grow">
        <FileInput
          onFileUpload={(files) => uploadFile(files)}
          label={
            hasLayers
              ? "Upload another image"
              : "Upload an image to get started"
          }
        />
      </div>
    );
  }

  const {
    sortedLayers,
    order,
    name,
    previewUrls,
    slice,
    speed,
    quality,
    isGif,
  } = store;
  const { x, y } = slice;
  const ext = isGif ? ".gif" : ".png";

  const onChangeSpeed = action((speed) => {
    store.speed = speed;
  });

  const onChangeQuality = action((quality: string) => {
    switch (quality) {
      case "high":
        store.quality = 15;
        break;
      case "medium":
        store.quality = 10;
        break;
      case "low":
        store.quality = 8;
        break;
      case "none":
        store.quality = 4;
        break;
      default:
        store.quality = undefined;
    }
  });

  const onChangeSliceX = action((x) => {
    store.slice = {
      ...store.slice,
      x,
    };
  });

  const onChangeSliceY = action((y) => {
    store.slice = {
      ...store.slice,
      y,
    };
  });

  const onChangeName = action((name: string) => (store.name = name));

  const moveLayer = action((index: number, targetIndex: number) => {
    store.order = arrayMove(order, index, targetIndex);
  });

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="grow flex flex-col gap-6">
        {sortedLayers.map(([id, layer], index) => {
          return (
            <LayerEditor
              key={id}
              layer={layer}
              index={index}
              onDelete={onDelete}
              moveDown={
                index < sortedLayers.length - 1
                  ? () => moveLayer(index, index + 1)
                  : undefined
              }
              moveUp={index > 0 ? () => moveLayer(index, index - 1) : undefined}
            />
          );
        })}
        <div className="h-20">
          <FileInput
            onFileUpload={(files) => uploadFile(files)}
            label={
              hasLayers
                ? "Upload another image"
                : "Upload an image to get started"
            }
          />
        </div>
      </div>
      <div className="mt-6 sticky bottom-0 bg-slate-950 before:content[''] before:absolute before:pointer-events-none before:w-full before:h-12 before:-translate-y-full before:bg-gradient-to-t before:from-slate-950 before:to-transparent">
        <Divider />
        <div className="flex flex-row gap-6 items-center py-6">
          <div className="w-40 flex flex-col gap-2 items-center self-center">
            {previewUrls && <EmojiPreview images={previewUrls} slice={slice} />}
            <span className="break-all">
              <Text size="xsmall">
                (Largest image:{" "}
                {Math.max(...previewUrls.map((url) => getImageSizeInKB(url)))}
                KB)
              </Text>
            </span>
          </div>
          <div className="grow grid gap-6 grid-flow-row justify-self-stretch items-center">
            <div className="grid gap-10 grid-flow-col-dense justify-start">
              <div className="grid grid-flow-row gap-1 w-fit items-center">
                <Text weight="bold">Slices</Text>
                <div className="grid grid-flow-col gap-4 w-fit items-center">
                  <Field direction="col" align="center">
                    <Label>X:</Label>
                    <Number
                      value={x}
                      min={1}
                      max={10}
                      onChange={(value) => onChangeSliceX(value)}
                    />
                  </Field>
                  <Field direction="col" align="center">
                    <Label>Y:</Label>
                    <Number
                      value={y}
                      min={1}
                      max={10}
                      onChange={(value) => onChangeSliceY(value)}
                    />
                  </Field>
                </div>
              </div>
              {isGif && (
                <Field>
                  <Label>Speed</Label>
                  <Number
                    value={speed}
                    onChange={onChangeSpeed}
                    min={2}
                    max={30}
                  />
                </Field>
              )}
              {isGif && (
                <Field>
                  <Label>Quality</Label>
                  <Select
                    options={QUALITY_OPTIONS}
                    value={
                      !quality
                        ? "full"
                        : quality > 10
                          ? "high"
                          : quality > 8
                            ? "medium"
                            : quality > 4
                              ? "low"
                              : "none"
                    }
                    onChange={onChangeQuality}
                  />
                </Field>
              )}
            </div>
            <div className="flex gap-4 flex-row items-end">
              <div className="w-[200%]">
                <Field>
                  <Label>File name</Label>
                  <TextInput value={name} onChange={onChangeName} />
                </Field>
              </div>
              <Button
                stretch={true}
                onClick={() => downloadBundle(previewUrls, name, ext)}
              >
                <Text weight="bold" align="center">
                  Download
                </Text>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const LayerEditor = observer(
  ({
    layer,
    moveUp,
    moveDown,
    onDelete,
  }: {
    layer: LayerState;
    index: number;
    moveUp: (() => void) | undefined;
    moveDown: (() => void) | undefined;
    onDelete(id: string): void;
  }) => {
    const [rotateA, setRotateA] = useState(0);
    const [rotateB, setRotateB] = useState(0);
    const { id, edits, name, dataUrl } = layer;
    const {
      resize,
      flipX,
      flipY,
      scale,
      top,
      left,
      width,
      height,
      brightness,
      contrast,
      blendMode,
      invert,
      grayscale,
    } = edits;

    return (
      <div className="border border-slate-800 rounded-md p-6">
        <div className="flex w-full gap-6">
          <div className="w-40 min-w-40 flex flex-col gap-4">
            {dataUrl && (
              <div className="w-40 flex justify-center items">
                <Image src={dataUrl} />
              </div>
            )}
            <span className="break-all">
              <Text size="xsmall" align="center">
                {name}
              </Text>
            </span>
            <Divider />
            <div className="grid gap-1.5 grid-flow-col justify-stretch items-center">
              <Button
                stretch={true}
                disabled={!moveUp}
                onClick={moveUp ? moveUp : () => { }}
              >
                <span className="w-6 h-6 text-slate-100">
                  <ArrowUp />
                </span>
              </Button>
              <Button
                stretch={true}
                disabled={!moveDown}
                onClick={moveDown ? moveDown : () => { }}
              >
                <span className="w-6 h-6 text-slate-100">
                  <ArrowDown />
                </span>
              </Button>
            </div>
            <Button stretch={true} onClick={() => onDelete(id)}>
              <Text weight="bold" align="center">
                Delete layer
              </Text>
            </Button>
          </div>
          <div className="w-full flex flex-col gap-4">
            <Field>
              <Label>Resize mode</Label>
              <RadioTabs<ResizeMode>
                value={resize}
                options={RESIZE_OPTIONS}
                onChange={action((value) => (edits.resize = value))}
              />
            </Field>
            {resize === "none" && (
              <div className="grid gap-1.5 grid-cols-5">
                <Field>
                  <Label>Top</Label>
                  <Number
                    value={top}
                    onChange={action((value) => (edits.top = value))}
                  />
                </Field>
                <Field>
                  <Label>Left</Label>
                  <Number
                    value={left}
                    onChange={action((value) => (edits.left = value))}
                  />
                </Field>
                <Field>
                  <Label>Width</Label>
                  <Number
                    min={0}
                    value={width}
                    onChange={action((value) => (edits.width = value))}
                  />
                </Field>
                <Field>
                  <Label>Height</Label>
                  <Number
                    min={0}
                    value={height}
                    onChange={action((value) => (edits.height = value))}
                  />
                </Field>
                <Field>
                  <Label>Scale</Label>
                  <Number
                    min={0}
                    max={100}
                    value={scale}
                    onChange={action((value) => (edits.scale = value))}
                  />
                </Field>
              </div>
            )}
            <Accordion
              title={
                <Text size="large" weight="bold">
                  Layer adjustments
                </Text>
              }
            >
              <div className="grid grid-flow-dense grid-cols-2 gap-4">
                <Field>
                  <Label>Rotate</Label>
                  <div className="grid gap-1.5 grid-flow-col justify-stretch items-center">
                    <Button
                      stretch={true}
                      onClick={action(() => {
                        edits.rotate = (edits.rotate - 90) % 360;
                        setRotateB(rotateB + 360);
                      })}
                    >
                      <span
                        className="w-6 h-6 text-slate-100 transition-transform duration-500"
                        style={{ transform: `rotate(${rotateB}deg)` }}
                      >
                        <CornerUpRight />
                      </span>
                    </Button>
                    <Button
                      stretch={true}
                      onClick={action(() => {
                        edits.rotate = (edits.rotate + 90) % 360;
                        setRotateA(rotateA - 360);
                      })}
                    >
                      <span
                        className="w-6 h-6 text-slate-100 transition-transform duration-500"
                        style={{ transform: `rotate(${rotateA}deg)` }}
                      >
                        <CornerUpLeft />
                      </span>
                    </Button>
                  </div>
                </Field>
                <Field>
                  <Label>Flip</Label>
                  <div className="grid gap-1.5 grid-flow-col justify-stretch items-center">
                    <Button
                      stretch={true}
                      onClick={action(() => (edits.flipX = !flipX))}
                    >
                      <span
                        className={classNames(
                          "w-6 h-6 text-slate-100 transition-transform duration-300",
                          {
                            "-scale-x-100": !flipX,
                          },
                        )}
                      >
                        <FlipX />
                      </span>
                    </Button>
                    <Button
                      stretch={true}
                      onClick={action(() => (edits.flipY = !flipY))}
                    >
                      <span
                        className={classNames(
                          "w-6 h-6 text-slate-100 transition-transform duration-300",
                          {
                            "-scale-y-100": !flipY,
                          },
                        )}
                      >
                        <FlipY />
                      </span>
                    </Button>
                  </div>
                </Field>
                <Field>
                  <Label>Brightness</Label>
                  <Range
                    min={-100}
                    max={100}
                    value={brightness}
                    onChange={action((value) => (edits.brightness = value))}
                  />
                </Field>
                <Field>
                  <Label>Contrast</Label>
                  <Range
                    min={-100}
                    max={100}
                    value={contrast}
                    onChange={action((value) => (edits.contrast = value))}
                  />
                </Field>
                <div className="grid gap-2">
                  <Field direction="col" justify="between">
                    <Label>Invert</Label>
                    <Checkbox
                      value={invert}
                      onChange={action((value) => (edits.invert = !value))}
                    />
                  </Field>
                  <Field direction="col" justify="between">
                    <Label>Grayscale</Label>
                    <Checkbox
                      value={grayscale}
                      onChange={action((value) => (edits.grayscale = !value))}
                    />
                  </Field>
                </div>
                <Field>
                  <Label>Blend mode</Label>
                  <Select
                    options={BLEND_OPTIONS}
                    value={blendMode}
                    onChange={action((value) => (edits.blendMode = value))}
                  />
                </Field>
              </div>
            </Accordion>
          </div>
        </div>
      </div>
    );
  },
);

// TODO: Scale properly
// TODO: Loading state
const EmojiPreview = ({
  images,
  slice,
}: {
  images: string[];
  slice: Slice;
}) => {
  const gap = "gap-0.5";
  return (
    <div className="relative">
      <div className={classNames("grid grid-flow-row items-center", gap)}>
        {mapFromSlice(images, slice).map((row, rowIndex) => {
          return (
            <div
              className={classNames("grid grid-flow-col items-center", gap)}
              key={rowIndex}
            >
              {row.map((col, colIndex) => (
                <div key={colIndex} className="aspect-square relative">
                  <Image src={col} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function arrayMove(arr, oldIndex, newIndex) {
  while (oldIndex < 0) {
    oldIndex += arr.length;
  }
  while (newIndex < 0) {
    newIndex += arr.length;
  }
  if (newIndex >= arr.length) {
    let k = newIndex - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr; // for testing purposes
}

const getImageSizeInKB = (src: string) => {
  const base64Length = src.length - (src.indexOf(",") + 1);
  const padding =
    src.charAt(src.length - 2) === "="
      ? 2
      : src.charAt(src.length - 1) === "="
        ? 1
        : 0;
  return (base64Length * 0.75 - padding) / 1000;
};

const mapFromSlice = (images: string[], slice: Slice): string[][] => {
  if (images.length !== slice.x * slice.y) {
    return [];
  }
  const copy = [...images];
  const rows: string[][] = [];
  for (let i = 0; i < slice.y; i++) {
    const column: string[] = copy.splice(0, slice.x);
    rows.push(column);
  }
  return rows;
};

interface ImageWorker {
  render(data: unknown): void;
  destroy(): void;
}

class LayerWorker implements ImageWorker {
  private worker: Worker;
  constructor(handler: (data: LayerWorkerResponse) => void) {
    this.worker = new Worker(
      new URL("../workers/layer_worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    this.worker.onmessage = (e: MessageEvent<LayerWorkerResponse>) => {
      if (!e.data) {
        throw new Error("oops");
      }
      handler(e.data);
    };
  }

  render(data: LayerWorkerRequest) {
    this.worker.postMessage(toJS(data));
  }

  destroy() {
    this.worker.terminate();
  }
}

class PreviewWorker {
  private worker: Worker | undefined;

  async render(data: PreviewWorkerRequest): Promise<PreviewWorkerResponse> {
    if (this.worker) {
      this.destroy();
    }
    this.worker = new Worker(
      new URL("../workers/preview_worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    this.worker.postMessage(toJS(data));
    return new Promise((resolve) => {
      if (!this.worker) {
        return;
      }
      this.worker.onmessage = (e: MessageEvent<PreviewWorkerResponse>) => {
        if (!e.data) {
          throw new Error("oops");
        }
        this.destroy();
        resolve(e.data);
      };
    });
  }

  destroy() {
    this.worker?.terminate();
  }
}

export default Editor;
