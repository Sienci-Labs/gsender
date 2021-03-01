import React from 'react';
import cx from 'classnames';
import styles from './index.styl';

const FunctionButton = ({ className, children, ...props }) => {
    return (
        <button
            className={cx(styles.functionButton, { [styles.functionButtonPrimary]: props.primary })}
            {...props}
        >
            {children}
        </button>
    );
};

export default FunctionButton;
