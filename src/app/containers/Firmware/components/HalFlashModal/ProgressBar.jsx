import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import styles from './index.styl';

const ProgressBarWrapper = ({ sent, total }) => {
    const now = (sent / total).toFixed(1) * 100;
    return (
        <div className={styles.progressArea}>
            <ProgressBar striped variant="info" animated now={now} label={`${now}%`}/>
        </div>
    );
};

export default ProgressBarWrapper;
