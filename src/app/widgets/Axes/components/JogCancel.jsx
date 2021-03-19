import React from 'react';
import cx from 'classnames';
import { GRBL_ACTIVE_STATE_JOG, GRBL_ACTIVE_STATE_RUN } from 'app/constants';
import styles from '../index.styl';

const JogCancel = ({ activeState, ...props }) => {
    return (
        <button
            {...props}
            className={cx(styles.jogCancelButton, { [styles.jogActive]: (activeState === GRBL_ACTIVE_STATE_RUN || activeState === GRBL_ACTIVE_STATE_JOG) })}
            title="Cancel movement"
        >
            <i className="fas fa-ban" />
        </button>
    );
};

export default JogCancel;
