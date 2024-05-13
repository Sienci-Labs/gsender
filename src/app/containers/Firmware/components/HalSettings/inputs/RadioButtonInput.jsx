import React, { useState, useEffect } from 'react';
import ensureArray from 'ensure-array';
import styles from './index.styl';

const RadioButtonInput = ({ info, setting, onChange, disabled }) => {
    const [localValue, setLocalValue] = useState(0);

    useEffect(() => {
        let { value } = setting;
        value = Number(value);
        setLocalValue(value);
    }, [setting]);

    const rbOnClick = (e) => {
        const value = e.target.value;
        setLocalValue(Number(value));
        onChange(Number(value));
    };

    let { format } = info;
    const fieldKey = `${setting.setting}-key`;

    format = ensureArray(format);

    return (
        <div className={styles.column}>
            {
                format.map((opt, index) => {
                    let checked = index === localValue;
                    let key = `${setting.setting}-${index}-key`;
                    return (
                        <div className={styles.row} key={key}>
                            <span>{opt}:</span>
                            <input type="radio" name={fieldKey} value={index} checked={checked} onChange={rbOnClick} disabled={disabled} />
                        </div>
                    );
                })
            }
        </div>
    );
};

export default RadioButtonInput;
