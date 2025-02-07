import React from 'react';
import cx from 'classnames';
import styles from './index.module.styl';

export function ToolModalButton({ className, icon, children, ...props }) {
    return (
        <button
            type="button"
            className={cx(styles.toolModalButton, className)}
            {...props}
        >
            <div
                className={cx(
                    styles.toolModalButtonIcon,
                    'text-white text-4xl items-center ',
                )}
            >
                {icon}
            </div>
            <div className={styles.toolModalButtonContent}>{children}</div>
        </button>
    );
}

export default ToolModalButton;
