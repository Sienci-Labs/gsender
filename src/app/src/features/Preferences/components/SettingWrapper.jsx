import React from 'react';
import classNames from 'classnames';
import styles from '../index.module.styl';

const SettingWrapper = ({ children, show, title }) => {
    return (
        <div
            className={classNames(styles.hidden, styles['settings-wrapper'], {
                [styles.visible]: show,
            })}
            style={{ height: '100%' }}
        >
            {title && <h3 className={styles['settings-title']}>{title}</h3>}
            {children}
        </div>
    );
};

export default SettingWrapper;
