import React, { useState, useId } from 'react';
import * as styles from './file.module.scss';
import classNames from 'classnames';

export function FileInput({ onFileUpload, label }: { onFileUpload: (files: FileList | undefined) => void, label: string }) {
    const id = useId();
    const [active, setActive] = useState<boolean>(false);
    return <div className={styles.container}>
        <input
            id={id}
            type='file'
            className={classNames(styles.input, { [styles.active]: active })}
            name="avatar"
            accept="image/*"
            multiple={true}
            onDragEnter={() => setActive(true)}
            onDragLeave={() => setActive(false)}
            onChange={(e) => {
                onFileUpload(e.target.files);
                setActive(false);
            }} />
        <label className={styles.label} htmlFor={id}>{label}</label>
    </div>
}