import React from "react";
import { FieldContext } from "./field";

export function Select<T extends string | number>({
  onChange,
  value,
  options,
  disabled,
}: {
  onChange(value: T): void;
  value: T;
  options: { label: string; value: T }[];
  disabled?: boolean;
}) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <select
            id={id}
            className="h-10 grid content-center items-center px-2 py-1 border-r-transparent border-r-8 rounded hover:cursor-pointer bg-slate-800 text-slate-100"
            value={value}
            onChange={(e) => void onChange(e.target.value as T)}
            disabled={disabled}
          >
            {options.map((option) => {
              const { label, value } = option;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        );
      }}
    </FieldContext.Consumer>
  );
}
