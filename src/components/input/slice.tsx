import React, { useId } from "react";
import { Text } from "../typography/text";

export function Slice({
  valueX,
  valueY,
  onChangeX,
  onChangeY,
}: {
  valueX: number;
  valueY: number;
  onChangeX: (value: number) => void;
  onChangeY: (value: number) => void;
}) {
  const id1 = useId();
  const id2 = useId();
  const classes =
    "w-min min-w-10 h-4 grid content-center items-center px-2 py-3 border border-slate-100 rounded hover:cursor-pointer";
  return (
    <div className="grid grid-flow-row gap-1 w-fit items-center">
      <Text weight="bold">Slices:</Text>
      <div className="grid grid-flow-col gap-2 w-fit items-center">
        <label htmlFor={id1}>
          <Text>X:</Text>
        </label>
        <input
          className={classes}
          id={id1}
          type="number"
          value={valueX}
          onChange={(e) => {
            onChangeX(parseInt(e.target.value));
          }}
        />
      </div>
      <div className="grid grid-flow-col gap-2 w-fit items-center">
        <label htmlFor={id2}>
          <Text>Y:</Text>
        </label>
        <input
          className={classes}
          id={id2}
          type="number"
          value={valueY}
          onChange={(e) => {
            onChangeY(parseInt(e.target.value));
          }}
        />
      </div>
    </div>
  );
}
