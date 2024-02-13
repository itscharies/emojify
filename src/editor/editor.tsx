import React, { useEffect, useMemo, useCallback } from "react";
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
import { IdGenerator } from "../id_generator";
import {
  WorkerRequest,
  WorkerRequestLayer,
  WorkerRequestPreview,
  WorkerResponse,
  WorkerResponseLayer,
  WorkerResponsePreview,
} from "../worker";
import { Slice } from "../components/input/slice";
import { TextInput } from "../components/input/text";
import classNames from "classnames";

export const OUTPUT_SIZE = 64;

export type Slice = { x: number; y: number };

export class EditorState {
  layers: Map<string, LayerState> = observable.map([], { deep: true });
  disposers: Map<string, () => void> = observable.map([], { deep: true });
  name: string = "";
  previewUrls: string[] = [];
  slice: Slice = { x: 1, y: 1 };
  speed: number = 2;
  get isGif() {
    return Array.from(this.layers.values()).some(
      (layer) => layer.file.type === "image/gif",
    );
  }
  get hasLayers() {
    return this.layers.size > 0;
  }
  get editHash(): string {
    return Array.from(this.layers.values())
      .map((layer) => JSON.stringify(layer.edits))
      .join(",");
  }
  get previewHash() {
    return this.previewUrls.join("-");
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

  constructor({ id, file, name }: { id: string; file: File; name: string }) {
    this.id = id;
    this.file = file;
    this.name = name;
    this.edits = new Edits();
    this.dataUrl = undefined;
    makeAutoObservable(this, undefined);
  }
}

export type ResizeMode = "resize" | "cover" | "contain";
export class Edits {
  resize: ResizeMode = "contain";
  flipX: boolean = false;
  flipY: boolean = false;
  constructor() {
    makeAutoObservable(this);
  }
}

const Editor = observer(() => {
  const idGenerator = useMemo(() => new IdGenerator(), []);
  const store = useLocalObservable(() => new EditorState());

  const onRenderLayer = useCallback(
    (data: WorkerResponseLayer) => {
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

  const onRenderPreview = useCallback(
    (data: WorkerResponsePreview) => {
      const { urls } = data;
      runInAction(() => {
        store.previewUrls = urls;
      });
    },
    [store],
  );

  const layerWorker = useMemo(
    () => new ImageWorker(onRenderLayer, onRenderPreview),
    [],
  );
  const previewWorker = useMemo(
    () => new ImageWorker(onRenderLayer, onRenderPreview),
    [],
  );

  useEffect(() => {
    const dispose = autorun(() => {
      const { slice, speed, layers, hasLayers } = store;
      if (hasLayers) {
        previewWorker.renderPreview({
          layers: Array.from(layers.values()).map((layer) => toJS(layer)),
          settings: {
            slice: toJS(slice),
            speed,
          },
        });
      }
    });
    return () => dispose();
  }, [store.previewHash]);

  const uploadFile = action((files: FileList | undefined) => {
    if (!files) {
      return;
    }

    Array.from(files).map((file) => {
      const id = idGenerator.next();
      const name = file.name;
      const layer = new LayerState({ id: id, file, name });
      store.layers.set(id, layer);
      store.name === "" &&
        (store.name = files[0].name.split(".").shift() || "emoji");
      const dispose = autorun(() => {
        const { flipX, flipY, resize } = layer.edits;
        const { slice, speed } = store;
        layerWorker.renderLayer({
          id,
          file,
          edits: { flipX, flipY, resize },
          settings: {
            slice: toJS(slice),
            speed,
          },
        });
      });
      store.disposers.set("id", dispose);
    });
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

  const { layers, name, previewUrls, slice, speed, isGif } = store;
  const { x, y } = slice;
  const ext = isGif ? ".gif" : ".png";

  const onChangeSpeed = action((speed) => {
    store.speed = speed;
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

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="grow flex flex-col gap-6">
        {Array.from(layers.entries()).map(([id, layer]) => {
          return <LayerEditor key={id} layer={layer} onDelete={onDelete} />;
        })}
        <div>
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
      <Divider />
      <div className="grid gap-6 grid-flow-col justify-between items-center">
        <div className="min-w-10">
          {previewUrls && <EmojiPreview images={previewUrls} slice={slice} />}
        </div>
        {isGif && (
          <Number value={speed} onChange={onChangeSpeed} label="Speed" />
        )}
        <Slice
          valueX={x}
          valueY={y}
          onChangeX={onChangeSliceX}
          onChangeY={onChangeSliceY}
        />
        <TextInput value={name} onChange={onChangeName} label="Name:" />
        <Button onClick={() => downloadBundle(previewUrls, name, ext)}>
          <Text weight="bold" align="center">
            Download
          </Text>
        </Button>
      </div>
    </div>
  );
});

const LayerEditor = observer(
  ({ layer, onDelete }: { layer: LayerState; onDelete(id: string): void }) => {
    const { id, edits, name, dataUrl } = layer;
    const { flipX, flipY } = edits;

    return (
      <div className="border border-slate-500 rounded p-6">
        <div className="flex w-full gap-6">
          <div className="w-40 flex flex-col gap-2 items-center">
            {dataUrl && <Image src={dataUrl} />}
            <span className="break-all">
              <Text size="xsmall">{name}</Text>
            </span>
          </div>
          <div className="grow grid grid-flow-row gap-4">
            <Checkbox
              value={flipX}
              onChange={action((value) => (edits.flipX = !value))}
              label="Flip X"
            />
            <Checkbox
              value={flipY}
              onChange={action((value) => (edits.flipY = !value))}
              label="Flip Y"
            />
            <Button onClick={() => onDelete(id)}>
              <Text weight="bold" align="center">
                Delete
              </Text>
            </Button>
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
  const longest = Math.max(slice.x, slice.y);
  const gap = longest > 8 ? "gap-0.5" : "gap-1";
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

class ImageWorker {
  private worker: Worker;
  constructor(
    layerHandler: (data: Omit<WorkerResponseLayer, "type">) => void,
    previewHandler: (data: Omit<WorkerResponsePreview, "type">) => void,
  ) {
    this.worker = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (!e.data) {
        throw new Error("oops");
      }
      switch (e.data.type) {
        case "layer": {
          layerHandler(e.data);
          break;
        }
        case "preview": {
          previewHandler(e.data);
          break;
        }
      }
    };
  }

  renderLayer(data: WorkerRequestLayer) {
    this.send(toJS({ type: "layer", ...data }));
  }

  renderPreview(data: WorkerRequestPreview) {
    this.send(toJS({ type: "preview", ...data }));
  }

  private send(data: WorkerRequest) {
    this.worker.postMessage(data);
  }
}

export default Editor;
