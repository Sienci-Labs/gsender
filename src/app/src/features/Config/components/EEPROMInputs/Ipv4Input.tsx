import React from 'react';
import styles from './index.module.styl';
import ControlledInput from './ControlledInput';

const Ipv4Input = ({ info, setting, onChange, disabled }) => {
    const { unit = null } = info;
    let { value } = setting;

    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 rounded">
            <ControlledInput
                type="text"
                className={styles.textInput}
                externalOnChange={onChange}
                value={value}
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

export default Ipv4Input;
