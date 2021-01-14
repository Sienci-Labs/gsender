import classNames from 'classnames';
import React from 'react';
import styles from './index.styl';


const Tab = ({ className, children, active, onClick, ...props }) => (
    <button
        type="button"
        onClick={onClick}
        {...props}
        className={classNames(
            className,
            styles.tab,
            { [styles.tabActive]: active }
        )}
    >
        {children}
    </button>
);

export default Tab;
