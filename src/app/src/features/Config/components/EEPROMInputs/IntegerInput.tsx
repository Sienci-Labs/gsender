import React from 'react';
import styles from './index.module.styl';
import ControlledInput from './ControlledInput';

const IntegerInput = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;
    value = Number(value);

    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 rounded">
            <ControlledInput
                type="decimal"
                className={styles.textInput}
                value={value}
                step={1}
                externalOnChange={onChange}
                disabled={disabled}
            />
            {unit && (
                <span className="flex items-center justify-center min-w-16 px-2 text-base bg-gray-300 text-gray-700">
                    {unit}
                </span>
            )}
        </div>
    );
};

export default IntegerInput;
