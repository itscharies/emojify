import React from "react";
import { Text } from '../typography/text';
import styles from './button.module.scss';

export function Button({ onClick, children }: React.PropsWithChildren<{ onClick(): void }>) {
    return <button type="button" className={styles.button} onClick={onClick}>
        {children}
    </button>
}