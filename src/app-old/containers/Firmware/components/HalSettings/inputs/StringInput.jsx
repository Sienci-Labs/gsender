import React from 'react';
import styles from 'Containers/Firmware/components/HalSettings/inputs/index.styl';
import ControlledInput from 'Containers/Firmware/components/HalSettings/inputs/ControlledInput';

const StringInput = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;

    return (
        <div className={styles.inputRow}>
            <ControlledInput type="text" className={styles.textInput} value={value} externalOnChange={onChange} disabled={disabled} />
            {
                unit && <span className={styles.unit}>{unit}</span>
            }
        </div>
    );
};

export default StringInput;
