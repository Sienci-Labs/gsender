import React from 'react';
import styles from './Index.styl';

const FirmwareSelector = ({ list, onClick }) => {
    return (
        <button type="button" className={styles.otherDevices} onClick={onClick}>
            <span>Firmware ({list.length})</span>
            <i className="fas fa-fixed fa-arrow-circle-right" />
        </button>
    );
};

export default FirmwareSelector;
