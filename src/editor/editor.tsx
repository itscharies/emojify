import React, { useCallback, useEffect, useState } from "react";
import Jimp from "jimp/es";
import { Text } from '../components/typography/text';
import { Button } from "../components/input/button";
import { Range } from "../components/input/range";
import { FileInput } from "../components/input/file";
import { Card } from "../components/card";
import { Image } from "../components/image";
import { Grid } from "../components/grid";
import { Checkbox } from "../components/input/checkbox";
import styles from './editor.module.scss';
import classNames from "classnames";

let id = 0;

type Layer = {
    id: number,
    original: Jimp,
    image: Jimp,
    edits: Edits,
};

type Edits = {
    resize: ResizeMode
    flipX: boolean,
    flipY: boolean,
    scale: number,
}

type ResizeMode = 'resize' | 'cover' | 'contain';

const EDIT_SIZE = 512;
const OUTPUT_SIZE = 64;
const DEFAULT_EDITS: Edits = {
    resize: 'contain',
    flipX: false,
    flipY: false,
    scale: 1,
};

export default function Editor() {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [name, setName] = useState<string>(undefined);

    const uploadFile = async (files: FileList | undefined) => {
        if (!files) {
            return;
        }
        const newLayers: Layer[] = [];
        for (const file of Array.from(files)) {
            const url = URL.createObjectURL(file);
            const image = await Jimp.read(url);
            const layer = await createLayer(id++, image, DEFAULT_EDITS);
            newLayers.push(layer);
        }
        !name && setName(files[0].name);
        setLayers([...layers, ...newLayers]);
    }

    const downloadImage = async (image: Jimp, name: string) => {
        const clone = image.clone();
        const url = await clone.resize(OUTPUT_SIZE, OUTPUT_SIZE).getBase64Async(getMimeType(image.getExtension()));
        const link = document.createElement("a");
        link.download = name;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const onClickDownload = useCallback((image: Jimp, name: string) => void downloadImage(image, name), [name]);

    const editLayer = useCallback((layer: Layer, edits: Partial<Edits>) => {
        const i = layers.findIndex(l => l.id === layer.id);
        const newLayer = createLayer(layer.id, layer.original, { ...layer.edits, ...edits })
        const newLayers = [...layers];
        newLayers.splice(i, 1, newLayer);
        setLayers(newLayers);
    }, [layers])

    const deleteLayer = useCallback((layer: Layer) => {
        const i = layers.findIndex(l => l.id === layer.id);
        const newLayers = [...layers];
        newLayers.splice(i, 1);
        setLayers(newLayers);
    }, [layers])

    function onNameChange(e) {
        setName(e.target.value);
    }

    const downloadPreview = composeLayers(layers);
    const hasLayers = layers.length > 0;

    return <Grid rows="1fr auto auto auto">
        <Grid rows="repeat(auto-fill, minmax(auto, 100%))">
            {layers.map((layer, i) => {
                const { image, edits: { flipX, flipY, scale, resize } } = layer;
                const { bitmap: { width, height } } = image;
                return <Card key={i}>
                    <Grid columns="128px 1fr">
                        <Grid gap="small">
                            <LayerPreview image={image} />
                            <Text size="xsmall">{width}x{height}</Text>
                        </Grid>
                        <Grid gap="small">
                            <Checkbox value={flipX} onChange={(value) => editLayer(layer, { flipX: value })} label="Flip X" />
                            <Checkbox value={flipY} onChange={(value) => editLayer(layer, { flipY: value })} label="Flip Y" />
                            <Range value={scale * 100} min={0} max={100} onChange={(value) => editLayer(layer, { scale: value / 100 })} label="scale" />
                            <Button onClick={() => deleteLayer(layer)}><Text weight="bold">Delete</Text></Button>
                        </Grid>
                    </Grid>
                </Card>
            })}
        </Grid>
        <div className={classNames({ [styles.nextUpload]: hasLayers })}>
            <FileInput onFileUpload={uploadFile} label={hasLayers ? 'Upload another image' : 'Upload an image to get started'} />
        </div>
        {hasLayers && <>
            <hr />
            <div className={styles.footer}>
                <Grid columns={`${OUTPUT_SIZE}px 1fr`}>
                    <div style={{ width: `${OUTPUT_SIZE}px`, height: `${OUTPUT_SIZE}px` }}>
                        <LayerPreview image={downloadPreview} />
                    </div>
                    <input type="text" value={name} onInput={onNameChange} />
                </Grid>
                <Button onClick={() => onClickDownload(downloadPreview, name)}>
                    <Text weight="bold">Download</Text>
                </Button>
            </div>
        </>}
    </Grid>
}

function LayerPreview({ image }: { image: Jimp }) {
    const [src, setSrc] = useState<string>(undefined);
    useEffect(() => {
        image.getBase64Async(getMimeType(image.getExtension())).then(url => setSrc(url));
    }, [image]);
    return <Image src={src} />
}

const createLayer = (id: number, image: Jimp, edits: Edits) => {
    const clone = applyEdits(image, edits);
    return {
        id,
        original: image,
        image: clone,
        removeBg: false,
        edits
    }
}

const getMimeType = (imgExt: string) => {
    return imgExt === 'gif' ? 'image/gif' : 'image/png';
}

function applyEdits(image: Jimp, edits: Edits): Jimp {
    const { resize, flipX, flipY, scale } = edits;
    const cloned: Jimp = image.clone();
    cloned[resize](EDIT_SIZE, EDIT_SIZE);
    cloned.scale(scale);
    cloned.flip(flipX, flipY);
    return cloned;
}

function composeLayers(layers: Layer[]) {
    let prevImage;
    for (const layer of layers) {
        if (!prevImage) {
            prevImage = layer.image.clone();
            continue;
        }

        prevImage.composite(layer.image, 0, 0)
    }
    return prevImage;
}