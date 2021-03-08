import React from 'react';
import cx from 'classnames';
import styles from './index.styl';


const ProbeCircuitStatus = ({ probeActive, connected }) => {
    return (
        <div className={styles.probeStatus}>
            {
                connected &&
                <div className={styles.probeStatus}>
                    <div className={cx(styles.probeIndicator, { [styles.circuitOpen]: !probeActive }, { [styles.circuitClosed]: probeActive })} />
                    <span>
                        {
                            connected && probeActive ? 'Touch detected' : 'No Touch'
                        }
                    </span>
                </div>
            }
            {
                !connected && 'No device connected'
            }

        </div>

    );
};

export default ProbeCircuitStatus;
