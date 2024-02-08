import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Text } from '../components/typography/text';
import { Button } from "../components/input/button";
import { Range } from "../components/input/range";
import { FileInput } from "../components/input/file";
import { Checkbox } from "../components/input/checkbox";
import { Image } from "../components/image";
import { observer, useLocalStore } from "mobx-react-lite";
import { action, autorun, makeAutoObservable, observable, reaction, runInAction } from "mobx";
import Jimp from "jimp/es";
import { Divider } from "../components/divider";
import { IdGenerator } from "../id_generator";
import { WorkerRequest, WorkerRequestLayer, WorkerRequestPreview, WorkerResponse, WorkerResponseLayer, WorkerResponsePreview } from "../worker";

export const EDIT_SIZE = 512;
export const OUTPUT_SIZE = 64;

export class EditorState {
    layers: Map<string, LayerState> = observable.map([], { deep: true });
    name: string = '';
    previewUrl: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    get hasLayers() {
        return this.layers.size > 0;
    }

    get hash(): string {
        return Array.from(this.layers.values()).map(layer => JSON.stringify(layer.edits)).join(',');
    }
}

export class LayerState {
    id: string;
    name: string;
    edits: Edits;
    file: File;
    dataUrl?: string = undefined;

    constructor({ id, file, name }: { id: string, file: File, name: string }) {
        this.id = id;
        this.file = file;
        this.name = name;
        this.edits = new Edits();
        makeAutoObservable(this, undefined);
    }
}

export class Edits {
    resize: 'resize' | 'cover' | 'contain' = 'contain';
    flipX: boolean = false;
    flipY: boolean = false;
    constructor() {
        makeAutoObservable(this);
    }
}

const Editor = observer(() => {
    const idGenerator = useMemo(() => new IdGenerator(), []);
    const store = useLocalStore(() => new EditorState());

    const onRenderLayer = useCallback((data: WorkerResponseLayer) => {
        const { id, url } = data;
        const layer = store.layers.get(id);
        if (layer) {
            runInAction(() => {
                layer.dataUrl = url;
            })
        }
    }, [store]);

    const onRenderPreview = useCallback((data: WorkerResponsePreview) => {
        const { url } = data;
        runInAction(() => {
            store.previewUrl = url;
        })
    }, [store]);

    const layerWorker = useMemo(() => new ImageWorker(onRenderLayer, onRenderPreview), []);
    const previewWorker = useMemo(() => new ImageWorker(onRenderLayer, onRenderPreview), []);

    useEffect(() => {
        if (!store.hasLayers) {
            return;
        }
        previewWorker.renderPreview({ layers: Array.from(store.layers.values()) })
    }, [store.hash])

    const uploadFile = action((files: FileList | undefined) => {
        if (!files) {
            return;
        }

        Array.from(files).map(file => {
            const id = idGenerator.next();
            const name = file.name;
            const layer = new LayerState({ id: id, file, name });
            store.layers.set(id, layer);
            store.name === '' && (store.name = files[0].name);

            autorun(() => {
                const { flipX, flipY, resize } = layer.edits;
                layerWorker.renderLayer({ id, file, edits: { flipX, flipY, resize } });
            });
        });
    });

    const downloadImage = (url: string, name: string) => {
        const link = document.createElement("a");
        link.download = name;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const { hasLayers } = store;

    if (!hasLayers) {
        return <div className="grow">
            <FileInput onFileUpload={(files) => uploadFile(files)} label={hasLayers ? 'Upload another image' : 'Upload an image to get started'} />
        </div>
    }

    const { layers, name, previewUrl } = store;

    return <div className="flex flex-col h-full gap-6">
        <div className="grow flex flex-col gap-6">
            {Array.from(layers.entries()).map(([id, layer]) => {
                return <LayerEditor key={id} layer={layer} onDelete={action(() => void store.layers.delete(id))} />
            })}
            <div>
                <FileInput onFileUpload={(files) => uploadFile(files)} label={hasLayers ? 'Upload another image' : 'Upload an image to get started'} />
            </div>
        </div>
        <Divider />
        <div className="grid grid-flow-col justify-between items-center">
            <div className="h-20 grid grid-flow-col gap-6 items-center">
                <div style={{ width: `${OUTPUT_SIZE}px`, height: `${OUTPUT_SIZE}px` }}>
                    <Image src={previewUrl} />
                </div>
                <input className="h-10" type="text" value={name} onInput={action((e) => store.name = e.currentTarget.value)} />
            </div>
            <Button onClick={() => previewUrl && downloadImage(previewUrl, name)}>
                <Text weight="bold" align="center">Download</Text>
            </Button>
        </div>
    </div>
});

const LayerEditor = observer(({ layer, onDelete }: { layer: LayerState, onDelete(): void }) => {
    const { edits, name, dataUrl } = layer;
    const { flipX, flipY } = edits;

    return <div className="border border-slate-500 rounded p-6">
        <div className="flex w-full gap-6">
            <div className="w-40 flex flex-col gap-2 items-center">
                <Image src={dataUrl} />
                <span className="break-all"><Text size="xsmall">{name}</Text></span>
            </div>
            <div className="grow grid grid-flow-row gap-4">
                <Checkbox value={flipX} onChange={action((value) => edits.flipX = !value)} label="Flip X" />
                <Checkbox value={flipY} onChange={action((value) => edits.flipY = !value)} label="Flip Y" />
                <Button onClick={() => onDelete()}><Text weight="bold" align="center">Delete</Text></Button>
            </div>
        </div>
    </div>
});

class ImageWorker {
    private worker: Worker;
    constructor(layerHandler: (data: Omit<WorkerResponseLayer, 'type'>) => void, previewHandler: (data: Omit<WorkerResponsePreview, 'type'>) => void) {
        this.worker = new Worker(new URL("../worker.ts", import.meta.url), { type: "module" });
        this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            if (!e.data) {
                throw new Error('oops');
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
        }
    }

    renderLayer(data: WorkerRequestLayer) {
        this.send({ type: 'layer', ...data });
    }

    renderPreview(data: WorkerRequestPreview) {
        this.send({ type: 'preview', ...data });
    }

    private send(data: WorkerRequest) {
        this.worker.postMessage(data);
    }
}

export default Editor;