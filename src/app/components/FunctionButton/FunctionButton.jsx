import React from 'react';
import cx from 'classnames';
import styles from './index.styl';

const FunctionButton = ({ className, primary = false, children, ...props }) => {
    return (
        <button
            className={cx(className, styles.functionButton, { [styles.functionButtonPrimary]: primary })}
            {...props}
        >
            {children}
        </button>
    );
};

export default FunctionButton;
