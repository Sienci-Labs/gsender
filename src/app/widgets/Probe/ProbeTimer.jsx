import React from 'react';
import styles from './index.styl';

const ProbeTimer = ({ timer, testRunning }) => {
    const timeRemaining = (15 - timer).toFixed(1);
    return (
        <div className={styles.probeTimer}>
            {
                testRunning && `${timeRemaining} seconds left`
            }

        </div>
    );
};

export default ProbeTimer;
