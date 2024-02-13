import classNames from "classnames";
import React, { createContext, useId } from "react";

export const FieldContext = createContext<string | undefined>(undefined);

export function Field({
  children,
  direction = "row",
  align = "stretch",
  alignY = "center",
}: React.PropsWithChildren<{
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
  alignY?: "start" | "center" | "end" | "stretch";
}>) {
  return (
    <FieldContext.Provider value={useId()}>
      <div
        className={classNames("grid", {
          "gap-1 grid-flow-row": direction === "row",
          "gap-2 grid-flow-col": direction === "col",
          "justify-start": align === "start",
          "justify-center": align === "center",
          "justify-end": align === "end",
          "justify-stretch": align === "stretch",
          "items-start": alignY === "start",
          "items-center": alignY === "center",
          "items-end": alignY === "end",
          "items-stretch": alignY === "stretch",
        })}
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}
