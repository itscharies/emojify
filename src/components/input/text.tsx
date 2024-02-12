import React, { useId } from "react";
import { Text } from "../typography/text";

export function TextInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="grid grid-flow-row gap-1 w-fit items-center">
      <label htmlFor={id}>
        <Text weight="bold">{label}</Text>
      </label>
      <input
        id={id}
        className="w-min min-w-40 h-10 grid content-center items-center px-2 py-3 border border-slate-100 rounded hover:cursor-pointer"
        type="text"
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
      />
    </div>
  );
}
