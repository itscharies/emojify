import React from "react";
import { FieldContext } from "./field";

export function RangeInput({
  onChange,
  value,
  min,
  max,
  step = 1,
}: {
  onChange(value: number);
  value: number;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <input
            id={id}
            value={value / step}
            type="range"
            min={min / step}
            max={max / step}
            onChange={(e) => {
              const value = parseInt(e.target.value) * step;
              onChange(Math.round(value * (1 / step)) / (1 / step))
            }}
          />
        );
      }}
    </FieldContext.Consumer>
  );
}
