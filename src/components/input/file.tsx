import React, { useId, useState } from "react";
import { Text } from "../typography/text";
import classNames from "classnames";

export function FileInput({
  onFileUpload,
  label,
}: {
  onFileUpload: (files: FileList | undefined) => void;
  label: string;
}) {
  const id = useId();
  const [hover, setHover] = useState(false);
  return (
    <div className="relative w-full h-full">
      <label
        className={classNames(
          "absolute border border-slate-800 rounded-md p-6 flex w-full h-full justify-center items-center",
          { "opacity-50": hover },
        )}
        htmlFor={id}
        tabIndex={0}
      >
        <Text>{label}</Text>
      </label>
      <input
        id={id}
        type="file"
        className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
        name="avatar"
        accept="image/*"
        multiple={true}
        onChange={(e) => {
          onFileUpload(e.target.files || undefined);
        }}
        onMouseEnter={() => setHover(true)}
        onDragEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragLeave={() => setHover(false)}
        tabIndex={-1}
      />
    </div>
  );
}
