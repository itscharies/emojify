import Jimp from "jimp/es";
import { EDIT_SIZE, Edits } from "./editor/editor";

self.onmessage = async (e: MessageEvent<{ id: number, file: File, edits: Edits }>) => {
    console.log(e.data)
    if (e.data) {
        const { id, file, edits } = e.data;
        const fileUrl = URL.createObjectURL(file);
        const image = await Jimp.read(fileUrl);
        URL.revokeObjectURL(fileUrl);
        const clone = applyEdits(image, edits);
        clone.getBase64Async(Jimp.AUTO).then(url => self.postMessage({ id, url }));
    }
};


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