import React from 'react';

import ControlledNumberInput from 'app/components/ControlledNumberInput';

import styles from './index.module.styl';

const Number = (props) => {
    const { value, min, max, onChange, units, disabled } = props;

    return (
        <div className={styles.numberInputs}>
            <ControlledNumberInput
                className={styles.formControlModal}
                externalOnChange={(e) => {
                    onChange(e.target.value);
                }}
                value={value}
                min={min}
                max={max}
                hasRounding={false}
                disabled={disabled}
            />
            <span className={styles.inputGroupAddon}>{units}</span>
        </div>
    );
};

export default Number;
