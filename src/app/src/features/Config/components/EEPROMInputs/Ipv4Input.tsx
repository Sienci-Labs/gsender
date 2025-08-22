import React from 'react';
import styles from './index.module.styl';
import ControlledInput from './ControlledInput';

const Ipv4Input = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;

    return (
        <div className="flex flex-row flex-1 relative items-center">
            <ControlledInput
                type="text"
                className={styles.textInput}
                externalOnChange={onChange}
                value={value}
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

export default Ipv4Input;
