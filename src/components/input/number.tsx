import React, { useId } from "react";
import { Text } from "../typography/text";

export function Number({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const id = useId();
  const classes =
    "w-min min-w-10 h-4 grid content-center items-center px-2 py-3 border border-slate-100 rounded hover:cursor-pointer";
  return (
    <div className="grid grid-flow-row gap-1 w-fit items-center">
      <label htmlFor={id}>
        <Text weight="bold">{label}</Text>
      </label>
      <div className="grid grid-flow-col gap-2 w-fit items-center">
        <input
          className={classes}
          id={id}
          type="number"
          value={value}
          onChange={(e) => {
            onChange(parseInt(e.target.value));
          }}
        />
      </div>
    </div>
  );
}
