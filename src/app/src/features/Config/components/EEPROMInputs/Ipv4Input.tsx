import React from 'react';
import styles from './index.module.styl';
import ControlledInput from './ControlledInput';

const Ipv4Input = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;

    return (
        <div className={styles.inputRow}>
            <ControlledInput
                type="text"
                className={styles.textInput}
                externalOnChange={onChange}
                value={value}
                disabled={disabled}
            />
            {unit && <span className={styles.unit}>{unit}</span>}
        </div>
    );
};

export default Ipv4Input;
