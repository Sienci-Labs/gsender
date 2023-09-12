import React from 'react';
import ToggleSwitch from 'Components/ToggleSwitch';
import styles from './index.styl';

const BooleanInput = ({ info, setting }) => {
    return (
        <div className={styles.row}><ToggleSwitch /></div>
    );
};

export default BooleanInput;
