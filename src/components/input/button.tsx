import classNames from "classnames";
import React from "react";

export function Button({
  onClick,
  disabled,
  children,
}: React.PropsWithChildren<{ onClick(): void; disabled?: boolean }>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={classNames(
        "min-w-fit h-10 grid content-center items-center px-2 py-1 border border-slate-100 rounded hover:cursor-pointer hover:opacity-75",
        {
          "pointer-events-none opacity-50": disabled,
        },
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
