import React from 'react';
import styles from 'Containers/Firmware/components/HalSettings/inputs/index.styl';
import ControlledInput from 'Containers/Firmware/components/HalSettings/inputs/ControlledInput';

const IntegerInput = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;
    value = Number(value);

    return (
        <div className={styles.inputRow}>
            <ControlledInput
                type="decimal"
                className={styles.textInput}
                value={value}
                step={1}
                externalOnChange={onChange}
                disabled={disabled}
            />
            {
                unit && <span className={styles.unit}>{unit}</span>
            }
        </div>
    );
};

export default IntegerInput;
