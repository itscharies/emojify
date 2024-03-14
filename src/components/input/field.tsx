import classNames from "classnames";
import React, { createContext, useId } from "react";

export const FieldContext = createContext<string | undefined>(undefined);

export function Field({
  children,
  direction = "row",
  justify = "stretch",
  align = "center",
}: React.PropsWithChildren<{
  direction?: "row" | "col";
  justify?: "start" | "center" | "end" | "stretch" | "between";
  align?: "start" | "center" | "end" | "stretch";
}>) {
  return (
    <FieldContext.Provider value={useId()}>
      <div
        className={classNames("grid", {
          "gap-1 grid-flow-row": direction === "row",
          "gap-2 grid-flow-col": direction === "col",
          "justify-start": justify === "start",
          "justify-center": justify === "center",
          "justify-end": justify === "end",
          "justify-stretch": justify === "stretch",
          "justify-between": justify === "between",
          "items-start": align === "start",
          "items-center": align === "center",
          "items-end": align === "end",
          "items-stretch": align === "stretch",
        })}
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}
