import React from "react";
import { FieldContext } from "./field";

export function Checkbox({
  value,
  onChange,
}: {
  value: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <input
            className="w-5 h-5"
            id={id}
            type="checkbox"
            checked={value}
            onChange={() => {
              onChange(value);
            }}
          />
        );
      }}
    </FieldContext.Consumer>
  );
}
