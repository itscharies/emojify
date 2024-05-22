import React from "react";
import { FieldContext } from "./field";
import { Text } from "../typography/text";
import { Plus } from "../../icons/plus";
import { Minus } from "../../icons/minus";
import classNames from "classnames";

export function NumberInput({
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
  const classes = "h-10 grid w-full content-center items-center px-2 py-1 border border-slate-800 bg-slate-900 text-slate-100";
  const buttonClasses = "flex justify-center hover:border-slate-600 hover:cursor-pointer z-20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500";
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <div className="flex">
            <button
              disabled={!!min && value <= min}
              className={classNames(classes, buttonClasses, 'rounded-tl rounded-bl')}
              onClick={() => {
                onChange(value - 1)
              }}>
              <span className="w-4 h-4">
                <Minus />
              </span>
            </button>
            <div className={classNames(classes, 'min-w-10 border-l-0 border-r-0 z-10 cursor-default')}>
              <Text align="center">
                {value}
              </Text>
            </div>
            <input
              className={classNames(classes, "text-center hidden")}
              id={id}
              type="number"
              value={value}
              min={min}
              max={max}
              onChange={(e) => {
                onChange(parseInt(e.target.value));
              }}
            />
            <button
              disabled={!!max && value >= max}
              className={classNames(classes, buttonClasses, 'rounded-tr rounded-br')}
              onClick={() => {
                onChange(value + 1)
              }}>
              <span className="w-4 h-4">
                <Plus />
              </span>
            </button>
          </div>
        );
      }}
    </FieldContext.Consumer>
  );
}
