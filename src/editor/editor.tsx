import React, { useEffect, useState } from "react";
import styles from './editor.module.scss';
import { Text } from '../components/typography/text';
import Jimp from "jimp/es";
import { Button } from "../components/input/button";

type State = {
    state: 'loading'
} | LoadedState;
type LoadedState = {
    state: 'edit',
    image: Jimp,
    url: string,
    resize: ResizeMode,
    flip: Flip,
    // Some edits can only be done once, some should be stackable
    edits: Edit[],
};

type ResizeMode = 'resize' | 'cover';
type Flip = { x: boolean, y: boolean };
type Edit = undefined;

const OUTPUT_SIZE = 64;

export default function Editor({ image, exit }: { image: File, exit(): void }) {
    const [store, setStore] = useState<State>({ state: 'loading' });

    useEffect(() => {
        const url = URL.createObjectURL(image);
        Jimp.read(url).then(async (image) => {
            const initialStore: LoadedState = {
                state: 'edit',
                image,
                url,
                resize: 'resize',
                flip: { x: false, y: false },
                edits: []
            };
            const { image: newImage, url: newUrl } = await applyEdits(initialStore);
            setStore({ ...initialStore, image: newImage, url: newUrl })
        });
        return () => URL.revokeObjectURL(url);
    }, [image]);

    if (store.state === 'loading') {
        return <div className={styles.editor}>
            <Text>Loading image</Text>
        </div>
    }

    const download = (uri: string, name: string) => {
        const link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return <div className={styles.editor}>
        <Preview url={store.url} image={store.image} />
        <div>

        </div>
        <div className={styles.footer}>
            <Button onClick={() => exit()}><Text weight="bold">Exit</Text></Button>
            <Button onClick={() => store.image.getBase64Async('image/png').then(dataUrl => download(dataUrl, 'emoji.png'))}>
                <Text weight="bold">Download</Text>
            </Button>
        </div>
    </div>
}

export function Preview({ image, url }: { image: Jimp, url: string }) {
    return <div className={styles.previewContainer}>
        <img className={styles.preview} src={url} />
        <Text size="xsmall" align="center" style="italic">Output ({image.bitmap.width}x{image.bitmap.height})</Text>
    </div>
}

async function applyEdits(store: LoadedState): Promise<{ image: Jimp, url: string }> {
    const { image, resize, flip, edits } = store;
    const cloned: Jimp = image.clone();
    await cloned[resize](OUTPUT_SIZE, OUTPUT_SIZE);
    const { x, y } = flip;
    await cloned.flip(x, y);
    for (const edit of edits) {
        //TODO
    }
    return { image: cloned, url: await cloned.getBase64Async('image/png') };
}