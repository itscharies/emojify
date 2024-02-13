import React from "react";
import { FieldContext } from "./field";

export function Number({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const classes =
    "w-min min-w-10 h-4 grid content-center items-center px-2 py-3 border border-slate-100 rounded hover:cursor-pointer";
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <input
            className={classes}
            id={id}
            type="number"
            value={value}
            onChange={(e) => {
              onChange(parseInt(e.target.value));
            }}
          />
        );
      }}
    </FieldContext.Consumer>
  );
}
