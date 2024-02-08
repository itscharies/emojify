import React, { useState, useId } from 'react';
import { Text } from "../typography/text";
import classNames from 'classnames';

export function FileInput({ onFileUpload, label }: { onFileUpload: (files: FileList | undefined) => void, label: string }) {
    const id = useId();
    const [active, setActive] = useState<boolean>(false);
    return <div className="relative w-full h-full">
        <input
            id={id}
            type='file'
            className="opacity-0 absolute inset-0 w-full h-full hover:pointer"
            name="avatar"
            accept="image/*"
            multiple={true}
            onDragEnter={() => setActive(true)}
            onDragLeave={() => setActive(false)}
            onChange={(e) => {
                onFileUpload(e.target.files);
                setActive(false);
            }} />
        <label className={classNames("border rounded border-slate-400 p-6 flex w-full h-full justify-center items-center pointer-events-none", { "opacity-50 cursor-pointer": active })} htmlFor={id}>
            <Text>{label}</Text>
        </label>
    </div>
}