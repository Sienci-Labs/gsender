import React from 'react';
import cx from 'classnames';
import styles from '../index.styl';

const ActiveIndicator = ({ active = true }) => {
    return (
        <div className={styles.activeIndicatorWrapper}>
            <small>
                {
                    active ? 'Active' : 'Not Active'
                }
            </small>
            <div className={cx(styles.activeIndicator, { [styles.activeIndicatorOn]: active })}>
                {
                    active && <div className={styles.activePing} />
                }
            </div>
        </div>

    );
};

export default ActiveIndicator;
