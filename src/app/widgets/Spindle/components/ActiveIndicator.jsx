import React from 'react';
import cx from 'classnames';
import { GRBL_ACTIVE_STATE_RUN } from '../../../constants';
import styles from '../index.styl';

const ActiveIndicator = ({ machineState, active = true }) => {
    return (
        <div className={styles.activeIndicatorWrapper}>
            <small>
                {
                    (machineState !== GRBL_ACTIVE_STATE_RUN && active) ? 'Active' : 'Not Active'
                }
            </small>
            <div className={cx(styles.activeIndicator, { [styles.activeIndicatorOn]: active })}>
                {
                    active && <i className={cx('fas fa-exclamation', styles.activePulse)} />
                }
            </div>
        </div>

    );
};

export default ActiveIndicator;
