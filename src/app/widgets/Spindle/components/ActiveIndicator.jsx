import React from 'react';
import cx from 'classnames';
import styles from '../index.styl';

const ActiveIndicator = ({ canClick, active = true }) => {
    const showIndicator = canClick && active;

    return (
        <div className={styles.activeIndicatorWrapper}>
            <small>
                {
                    showIndicator ? 'Active' : 'Not Active'
                }
            </small>
            <div className={cx(styles.activeIndicator, { [styles.activeIndicatorOn]: showIndicator })}>
                {
                    showIndicator && <i className={cx('fas fa-exclamation', styles.activePulse)} />
                }
            </div>
        </div>

    );
};

export default ActiveIndicator;
