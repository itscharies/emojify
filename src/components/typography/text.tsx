import React from "react";
import classNames from "classnames";

type Weight = 'regular' | 'bold';
type Style = 'regular' | 'italic';
type Size = 'regular' | 'small' | 'xsmall';
type Align = 'start' | 'center' | 'end';

export function Text({
    weight = 'regular',
    style = 'regular',
    size = 'regular',
    align = 'start',
    children
}: React.PropsWithChildren<{
    weight?: Weight,
    style?: Style,
    size?: Size,
    align?: Align
}>) {
    return <p className={classNames("font-body text-base text-slate-100", {
        ['font-bold']: weight === 'bold',
        ['font-italic']: style === 'italic',
        ['text-sm']: size === 'small',
        ['text-xs']: size === 'xsmall',
        ['text-start']: align === 'start',
        ['text-center']: align === 'center',
        ['text-end']: align === 'end',
    })}>{children}</p>
}