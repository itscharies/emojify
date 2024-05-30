import React, { useRef, useState } from "react";
import { FieldContext } from "./field";
import { Text } from "../typography/text";
import { Plus } from "../../icons/plus";
import { Minus } from "../../icons/minus";
import classNames from "classnames";

export function NumberStepperInput({
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
    "h-10 grid content-center items-center px-2 py-1 border border-slate-800 bg-slate-900 text-slate-100";
  const buttonClasses =
    "flex justify-center hover:border-slate-600 hover:cursor-pointer disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500";
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <div className="grid grid-flow-col">
            <button
              disabled={!!min && value <= min}
              className={classNames(
                classes,
                buttonClasses,
                "rounded-tl rounded-bl",
              )}
              onClick={() => {
                onChange(value - 1);
              }}
            >
              <span className="w-4 h-4">
                <Minus />
              </span>
            </button>
            <div
              className={classNames(
                classes,
                "w-auto min-w-16 border-l-0 border-r-0 z-0 h-10 grid content-center items-center",
              )}
            >
              {editing ? (
                <input
                  ref={inputRef}
                  className={classNames(
                    " min-w-6 bg-slate-900 text-slate-100 text-center appearance-none z-10",
                  )}
                  id={id}
                  type="number"
                  value={value}
                  min={min}
                  max={max}
                  onChange={(e) => {
                    onChange(parseInt(e.target.value));
                  }}
                  onBlur={() => setEditing(false)}
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing(true);
                    setTimeout(() => inputRef.current?.focus());
                  }}
                >
                  <Text align="center">{value}</Text>
                </button>
              )}
            </div>

            <button
              disabled={!!max && value >= max}
              className={classNames(
                classes,
                buttonClasses,
                "rounded-tr rounded-br",
              )}
              onClick={() => {
                onChange(value + 1);
              }}
            >
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
