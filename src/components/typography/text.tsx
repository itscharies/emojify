import React from "react";
import styles from './text.module.scss';
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
    return <p className={classNames(styles.text, {
        [styles.textBold]: weight === 'bold',
        [styles.textItalic]: style === 'italic',
        [styles.textSmall]: size === 'small',
        [styles.textXSmall]: size === 'xsmall',
        [styles.textAlignStart]: align === 'start',
        [styles.textAlignCenter]: align === 'center',
        [styles.textAlignEnd]: align === 'end',
    })}>{children}</p>
}