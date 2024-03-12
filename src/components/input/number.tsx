import React from "react";
import { FieldContext } from "./field";

export function Number({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const classes =
    "h-10 grid w-full content-center items-center px-2 py-1 border border-slate-100 rounded hover:cursor-pointer";
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <input
            className={classes}
            id={id}
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => {
              onChange(parseInt(e.target.value));
            }}
          />
        );
      }}
    </FieldContext.Consumer>
  );
}
