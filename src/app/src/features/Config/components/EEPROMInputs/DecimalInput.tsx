import React from 'react';
import styles from './index.module.styl';
import ControlledNumberInput from './ControlledNumberInput';

const DecimalInput = ({ info, setting, onChange, disabled, min, max }) => {
    const { unit = null } = info;
    let { value } = setting;
    value = Number(value);

    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 relative items-center rounded-md">
            <ControlledNumberInput
                type="decimal"
                className={styles.textInput}
                value={value}
                externalOnChange={onChange}
                disabled={disabled}
                min={min}
                max={max}
            />
            {unit && (
                <span className="absolute right-2 text-xs flex items-center pointer-events-none text-gray-500">
                    {unit}
                </span>
            )}
        </div>
    );
};

export default DecimalInput;
