import React from "react";

export function Button({ onClick, children }: React.PropsWithChildren<{ onClick(): void }>) {
    return <button type="button" className="w-min min-w-40 h-6 grid content-center items-center px-6 py-6 border border-slate-100 rounded hover:cursor-pointer hover:opacity-75" onClick={onClick}>
        {children}
    </button>
}