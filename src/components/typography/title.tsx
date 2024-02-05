import React from "react";
import styles from './text.module.scss';

type Level = 1 | 2 | 3 | 4;

export function Title({ level, children }: React.PropsWithChildren<{ level: Level }>) {
    switch (level) {
        case 1:
            return <h1 className={styles.title1}>{children}</h1>
        case 2:
            return <h2 className={styles.title2}>{children}</h2>
        case 3:
            return <h3 className={styles.title3}>{children}</h3>
        case 4:
            return <h4 className={styles.title4}>{children}</h4>
    }
}