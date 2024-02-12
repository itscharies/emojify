import React, { useId } from "react";
import { Text } from "../typography/text";

export function Checkbox({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange(value: boolean): void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="grid grid-flow-col gap-3 w-fit items-center">
      <label htmlFor={id}>
        <Text>{label}</Text>
      </label>
      <input
        className="h-4"
        id={id}
        type="checkbox"
        checked={value}
        onChange={() => {
          onChange(value);
        }}
      />
    </div>
  );
}
