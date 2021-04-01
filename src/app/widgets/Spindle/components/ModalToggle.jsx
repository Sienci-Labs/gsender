import React from 'react';
import ToggleSwitch from 'app/components/ToggleSwitch';
import styles from '../index.styl';
import { LASER_MODE } from '../../../constants';

const ModalToggle = ({ mode, onChange }) => {
    const isToggled = (mode === LASER_MODE);

    return (
        <div className={styles.modalSelect}>
            <span>Spindle Mode</span>
            <ToggleSwitch checked={isToggled} onChange={onChange}/>
            <span>Laser Mode</span>
        </div>
    );
};

export default ModalToggle;
