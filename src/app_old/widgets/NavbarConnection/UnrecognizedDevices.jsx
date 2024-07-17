import React from 'react';
import styles from './Index.styl';

const UnrecognizedDevices = ({ ports = [], onClick }) => {
    return (
        <button type="button" className={styles.otherDevices} onClick={onClick}>
            <span>Unrecognized devices ({ports.length})</span>
            <i className="fas fa-fixed fa-arrow-circle-right" />
        </button>
    );
};

export default UnrecognizedDevices;
