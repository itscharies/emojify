import classNames from "classnames";
import React, { useState, useId } from "react";
import { Divider } from "./divider";
import { Chevron } from "../icons/chevron";

export function Accordion({
  children,
  title,
  open = true,
}: React.PropsWithChildren<{ title: React.ReactNode; open?: boolean }>) {
  const [openState, setOpen] = useState(open);
  const id = useId();
  return (
    <div>
      <div className="grid grid-flow-row gap-2">
        <Divider />
        <label
          htmlFor={id}
          className="grid grid-flow-col w-full justify-between items-center p-4 rounded hover:bg-slate-900 hover:cursor-pointer select-none transition-colors"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.code == "Space") {
              e.preventDefault();
              setOpen(!openState);
            }
          }}
        >
          <span>{title}</span>
          <div
            className={classNames("w-6 h-6 text-slate-100", {
              "-scale-y-100": !openState,
            })}
          >
            <Chevron />
          </div>
        </label>
        <input
          id={id}
          type="checkbox"
          className="hidden"
          checked={openState}
          onChange={() => setOpen(!openState)}
        />
        <div className={classNames({ hidden: openState }, "pl-4 pr-4 pb-4")}>
          {children}
        </div>
        <Divider />
      </div>
    </div>
  );
}
