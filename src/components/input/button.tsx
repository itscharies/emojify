import classNames from "classnames";
import React from "react";

export function Button({
  onClick,
  disabled,
  children,
  stretch,
}: React.PropsWithChildren<{
  onClick(): void;
  disabled?: boolean;
  stretch?: boolean;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={classNames(
        "h-10 grid content-center items-center justify-center px-2 py-1 rounded transition-all",
        {
          "bg-slate-800 hover:cursor-pointer hover:opacity-75": !disabled,
          "bg-slate-900 hover:cursor-not-allowed opacity-50": disabled,
          "w-fit": !stretch,
          "w-full": stretch,
        },
      )}
      onClick={() => !disabled && onClick()}
    >
      {children}
    </button>
  );
}
