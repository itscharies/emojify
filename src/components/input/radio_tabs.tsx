import React from "react";
import { FieldContext } from "./field";
import { Text } from "../typography/text";
import classNames from "classnames";

export function RadioTabs<T extends string>({
  onChange,
  value,
  options,
}: {
  onChange(value: T): void;
  value: T;
  options: { label: string; value: T; icon?: React.ReactNode }[];
}) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <div
            role="radiogroup"
            id={id}
            className="grid gap-1.5 grid-flow-col items-stretch p-2 rounded-md border border-slate-800"
            aria-activedescendant={id + value}
          >
            {options.map((option) => {
              const { label, value: val, icon } = option;
              return (
                <button
                  id={id + val}
                  key={val}
                  value={val}
                  className={classNames(
                    "min-w-fit h-10 grid content-center items-center px-2 py-1 rounded transition-all",
                    {
                      "bg-slate-900 hover:bg-slate-800": value !== val,
                      "bg-slate-700": value === val,
                    },
                  )}
                  onClick={() => onChange(val)}
                >
                  <Text weight="bold" align="center">
                    {label}
                  </Text>
                  {icon}
                </button>
              );
            })}
          </div>
        );
      }}
    </FieldContext.Consumer>
  );
}
