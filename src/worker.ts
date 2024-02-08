import Jimp from "jimp/es";
import { EDIT_SIZE, Edits } from "./editor/editor";

export type WorkerRequestLayer = { id: string, file: File, edits: Edits };
export type WorkerRequestPreview = { layers: { file: File, edits: Edits }[] };
export type WorkerRequest = { type: 'layer' } & WorkerRequestLayer | { type: 'preview' } & WorkerRequestPreview;

export type WorkerResponseLayer = { id: string, url: string };
export type WorkerResponsePreview = { url: string };
export type WorkerResponse = { type: 'layer' } & WorkerResponseLayer | { type: 'preview' } & WorkerResponsePreview;

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    if (e.data) {
        switch (e.data.type) {
            case "layer": {
                const { id, file, edits } = e.data;
                const image = await getImage(file, edits);
                image.getBase64Async(Jimp.AUTO).then(url => {
                    const res: WorkerResponse = {
                        type: 'layer',
                        id,
                        url,
                    }
                    self.postMessage(res)
                });
                break;
            }
            case "preview": {
                const { layers } = e.data;
                console.log(layers);
                const images = await Promise.all(layers.map(({ file, edits }) => getImage(file, edits)))
                const image = composeImages(images);
                image.getBase64Async(Jimp.AUTO).then(url => {
                    const res: WorkerResponse = {
                        type: 'preview',
                        url,
                    };
                    self.postMessage(res);
                });
                break;
            }
        }
    }
};

async function getImage(file: File, edits: Edits): Jimp {
    const fileUrl = URL.createObjectURL(file);
    const image = await Jimp.read(fileUrl);
    URL.revokeObjectURL(fileUrl);
    return applyEdits(image, edits);
}

function applyEdits(image: Jimp, edits: Edits): Jimp {
    const { resize, flipX, flipY } = edits;
    const cloned: Jimp = image.clone();
    cloned[resize](EDIT_SIZE, EDIT_SIZE);
    cloned.flip(flipX, flipY);
    return cloned;
}

function composeImages(images: Jimp[]) {
    let prevImage;
    for (const image of images) {
        if (!prevImage) {
            prevImage = image.clone();
            continue;
        }
        prevImage.composite(image, 0, 0)
    }
    return prevImage;
}

export { };