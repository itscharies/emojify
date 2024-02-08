import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Text } from '../components/typography/text';
import { Button } from "../components/input/button";
import { Range } from "../components/input/range";
import { FileInput } from "../components/input/file";
import { Checkbox } from "../components/input/checkbox";
import { Image } from "../components/image";
import { observer, useLocalStore } from "mobx-react-lite";
import { action, autorun, makeAutoObservable, observable, runInAction } from "mobx";
import Jimp from "jimp/es";
import { Divider } from "../components/divider";
import { IdGenerator } from "../id_generator";

type ResizeMode = 'resize' | 'cover' | 'contain';

export const EDIT_SIZE = 512;
export const OUTPUT_SIZE = 64;

export class EditorState {
    layers: Map<string, LayerState> = observable.map([], { deep: true });
    name: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    get hasLayers() {
        return this.layers.size > 0;
    }

    get preview() {
        if (!this.hasLayers) {
            return undefined;
        }
        return undefined;
        // return composeImages(Array.from(this.layers.values()).map(layer => layer.image));
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
    resize: ResizeMode = 'contain';
    flipX: boolean = false;
    flipY: boolean = false;
    constructor() {
        makeAutoObservable(this);
    }
}

const Editor = observer(() => {
    const store = useLocalStore(() => new EditorState());

    const idGenerator = useMemo(() => new IdGenerator(), []);
    const imageWorker = useMemo(() => new Worker(new URL("../worker.ts", import.meta.url), { type: "module" }), []);

    useEffect(() => {
        imageWorker.onmessage = (e: MessageEvent<{ id: string, url: string }>) => {
            if (e.data) {
                const { id, url } = e.data;
                const layer = store.layers.get(id);
                if (layer) {
                    runInAction(() => {
                        layer.dataUrl = url;
                    })
                }
            }
        }
    }, [imageWorker]);

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
                imageWorker.postMessage({ id, file, edits: { flipX, flipY, resize } });
            });
        });
    });

    const onClickDownload = (image: Jimp, name: string) => void downloadImage(image, name);
    const downloadImage = async (image: Jimp, name: string) => {
        const clone = image.clone();
        const url = await clone.resize(OUTPUT_SIZE, OUTPUT_SIZE).getBase64Async(Jimp.AUTO);
        const link = document.createElement("a");
        link.download = name;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const { layers, hasLayers, name, preview } = store;

    if (!hasLayers) {
        return <div className="grow">
            <FileInput onFileUpload={(files) => uploadFile(files)} label={hasLayers ? 'Upload another image' : 'Upload an image to get started'} />
        </div>
    }


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
                    {/* <Preview image={preview} /> */}
                </div>
                <input className="h-10" type="text" value={name} onInput={action((e) => store.name = e.currentTarget.value)} />
            </div>
            <Button onClick={() => preview && onClickDownload(preview, name)}>
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
                <div className="flex flex-row gap-1 items-center">
                    <span className="break-all"><Text size="xsmall">{name}</Text></span>
                    {/* <Text size="xsmall">()</Text> */}
                </div>
            </div>
            <div className="grow grid grid-flow-row gap-4">
                <Checkbox value={flipX} onChange={action((value) => edits.flipX = !value)} label="Flip X" />
                <Checkbox value={flipY} onChange={action((value) => edits.flipY = !value)} label="Flip Y" />
                <Button onClick={() => onDelete()}><Text weight="bold" align="center">Delete</Text></Button>
            </div>
        </div>
    </div>
});

function Preview({ image }: { image: Jimp }) {
    const [src, setSrc] = useState<string | undefined>(undefined);
    useEffect(() => {
        image.getBase64Async(Jimp.AUTO).then(url => setSrc(url));
    }, [image]);
    return <Image src={src} />
}

export default Editor;