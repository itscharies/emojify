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
            className="h-10 grid gap-2 grid-flow-col items-stretch"
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
                    { "bg-slate-800": value === val },
                    "grid content-center items-center px-2 py-1 border border-slate-100 rounded hover:cursor-pointer hover:opacity-75",
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
