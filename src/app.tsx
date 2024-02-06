import React, { Suspense, useCallback, useState } from "react";
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
            <Suspense fallback={<Text weight="bold">Loading...</Text>}>
                <Editor />
            </Suspense>
        </main>
        <hr />
        <footer>
            <Text>Made with 💖 by @itscharies</Text>
        </footer>
    </div>;
}