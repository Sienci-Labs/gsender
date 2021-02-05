import React from 'react';
import cx from 'classnames';
import styles from './index.styl';

const MiniCircuitStatus = ({ probeActive }) => {
    return (
        <span className={cx(styles.miniCircuitStatus, { [styles.circuitClosed]: probeActive })} />
    );
};

export default MiniCircuitStatus;
