import React, { useId } from "react";
import { Text } from '../typography/text';
import styles from './range.module.scss';

export function Range({ onChange, value, label }: { onChange(value: number), value: number, label: string }) {
    const id = useId();
    return <div className={styles.range}>
        <label htmlFor={id}><Text weight="bold">{label}</Text></label>
        <input id={id} value={value} type="range" min={-1} max={1} onChange={e => onChange(parseInt(e.target.value))} />
    </div>;
}