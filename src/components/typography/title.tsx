import React from "react";

type Level = 1 | 2 | 3 | 4;

export function Title({ level, children }: React.PropsWithChildren<{ level: Level }>) {
    switch (level) {
        case 1:
            return <h1 className="font-title text-4xl text-slate-100">{children}</h1>
        case 2:
            return <h2 className="font-title text-2xl text-slate-100">{children}</h2>
        case 3:
            return <h3 className="font-title text-xl text-slate-100">{children}</h3>
        case 4:
            return <h4 className="font-title text-l text-slate-100">{children}</h4>
    }
}