import React, { Suspense, useCallback, useState } from "react";
import { FileInput } from "./components/input/file";
import styles from './app.module.scss'
import { Title } from './components/typography/title';
import { Text } from './components/typography/text';

const Editor = React.lazy(() => import('./editor/editor'));

export function App() {
    const [image, setImage] = useState<File | undefined>(undefined);

    return <div className={styles.container}>
        <header>
            <Title level={1}>Emojify</Title>
        </header>
        <main>
            {!image
                ? <div className={styles.fileInputContainer}>
                    <FileInput onFileUpload={(file) => setImage(file)} />
                </div>
                : <Suspense fallback={<Text weight="bold">Loading...</Text>}>
                    <Editor image={image} exit={() => setImage(undefined)} />
                </Suspense>
            }
        </main>
        <hr/>
        <footer>
            <Text>Made with 💖 by @itscharies</Text>
        </footer>
    </div>;
}