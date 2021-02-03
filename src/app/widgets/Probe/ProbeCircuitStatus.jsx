import React from 'react';
import cx from 'classnames';
import styles from './index.styl';


const ProbeCircuitStatus = ({ probeActive, connected }) => {
    return (
        <div className={styles.probeStatus}>
            <h5>Probe Status</h5>
            {
                connected &&
                <div className={styles.probeStatus}>
                    <div className={cx(styles.probeIndicator, { [styles.circuitOpen]: !probeActive }, { [styles.circuitClosed]: probeActive })} />
                    <span>
                        {
                            connected && probeActive ? 'Circuit closed' : 'Circuit open'
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
