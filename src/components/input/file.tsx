import React, { useId } from "react";
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
  return (
    <div className="relative w-full h-full">
      <input
        id={id}
        type="file"
        className="absolute opacity-0 inset-0 w-full h-full"
        name="avatar"
        accept="image/*"
        multiple={true}
        onChange={(e) => {
          onFileUpload(e.target.files || undefined);
        }}
      />
      <label
        className={classNames(
          "absolute border rounded border-slate-500 p-6 flex w-full h-full justify-center items-center cursor-pointer hover:opacity-50",
        )}
        htmlFor={id}
      >
        <Text>{label}</Text>
      </label>
    </div>
  );
}
