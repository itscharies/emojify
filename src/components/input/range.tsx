import React from "react";
import { FieldContext } from "./field";

export function Range({
  onChange,
  value,
  min,
  max,
}: {
  onChange(value: number);
  value: number;
  min: number;
  max: number;
}) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <input
            id={id}
            value={value}
            type="range"
            min={min}
            max={max}
            onChange={(e) => onChange(parseInt(e.target.value))}
          />
        );
      }}
    </FieldContext.Consumer>
  );
}
