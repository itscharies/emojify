import React, { useId } from "react";
import { Text } from '../typography/text';
import styles from './range.module.scss';

export function Range({ onChange, value, min, max, label }: { onChange(value: number), value: number, min: number, max: number, label: string }) {
    const id = useId();
    return <div className={styles.range}>
        <label htmlFor={id}><Text weight="bold">{label}</Text></label>
        <input id={id} value={value} type="range" min={min} max={max} onChange={e => onChange(parseInt(e.target.value))} />
    </div>;
}