import React, { useId } from "react";

export function Checkbox({ value, onChange, label }: { value: boolean, onChange: (value: boolean) => void, label: string }) {
    const id = useId();
    return <div className="grid grid-rows-2 gap-3">
        <label htmlFor={id}>{label}</label>
        <input id={id} type="checkbox" checked={value} onChange={e => onChange(!e.target.checked)} />
    </div>
}