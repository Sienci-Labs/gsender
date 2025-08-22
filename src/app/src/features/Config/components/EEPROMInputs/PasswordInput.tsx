import React from 'react';
import styles from './index.module.styl';
import ControlledInput from './ControlledInput';

const PasswordInput = ({ setting, info, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;

    return (
        <div className="flex flex-row flex-1 relative items-center">
            <ControlledInput
                type="password"
                className={styles.textInput}
                value={value}
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

export default PasswordInput;
