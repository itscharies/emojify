import React, { useState, useId } from 'react';
import * as styles from './file.module.scss';
import classNames from 'classnames';

export function FileInput({ onFileUpload }: { onFileUpload: (file: File | undefined) => void }) {
    const id = useId();
    const [active, setActive] = useState<boolean>(false);
    return <div className={styles.container}>
        <input
            id={id}
            type='file'
            className={classNames(styles.input, { [styles.active]: active })}
            name="avatar"
            accept="image/*"
            onDragEnter={() => setActive(true)}
            onDragLeave={() => setActive(false)}
            onChange={(e) => {
                onFileUpload(e.target.files?.[0]);
                setActive(false);
            }} />
        <label className={styles.label} htmlFor={id}>Choose an image</label>
    </div>
}