import React from 'react';
import styles from './index.module.styl';
import ControlledInput from './ControlledInput';

const IntegerInput = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;
    value = Number(value);

    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 relative items-center rounded-md">
            <ControlledInput
                type="decimal"
                className={styles.textInput}
                value={value}
                step={1}
                externalOnChange={onChange}
                disabled={disabled}
            />
            {unit && (
                <span className="absolute right-2 text-xs flex items-center pointer-events-none text-gray-500">
                    {unit}
                </span>
            )}
        </div>
    );
};

export default IntegerInput;
