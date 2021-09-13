import React from 'react';
import styles from './Index.styl';

const UnrecognizedDevices = () => {
    return (
        <button className={styles.otherDevices}>
            <span>Unrecognized devices (3)</span>
            <i className="fas fa-fixed fa-arrow-circle-right" />
        </button>
    );
};

export default UnrecognizedDevices;
