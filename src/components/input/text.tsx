import React from "react";
import { FieldContext } from "./field";

export function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <input
            id={id}
            className="h-10 grid w-full content-center items-center px-2 py-1 border border-slate-800 rounded hover:cursor-pointer bg-slate-900 text-slate-100"
            type="text"
            value={value}
            onInput={(e) => onChange(e.currentTarget.value)}
          />
        );
      }}
    </FieldContext.Consumer>
  );
}
