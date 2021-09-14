import React from 'react';
import styles from './Index.styl';

const UnrecognizedDevices = ({ ports = [] }) => {
    return (
        <button className={styles.otherDevices}>
            <span>Unrecognized devices ({ports.length})</span>
            <i className="fas fa-fixed fa-arrow-circle-right" />
        </button>
    );
};

export default UnrecognizedDevices;
