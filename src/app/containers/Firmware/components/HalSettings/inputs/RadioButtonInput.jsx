import React, { useState, useEffect } from 'react';
import ensureArray from 'ensure-array';
import styles from './index.styl';

const RadioButtonInput = ({ info, setting }) => {
    const [localValue, setLocalValue] = useState(0);

    useEffect(() => {
        let { value } = setting;
        value = Number(value);
        setLocalValue(value);
    }, []);

    const rbOnClick = (e) => {
        const value = e.target.value;
        setLocalValue(Number(value));
    };

    let { format } = info;
    const fieldKey = `${setting.setting}-key`;

    format = ensureArray(format);

    return (
        <div className={styles.column}>
            {
                format.map((opt, index) => {
                    let checked = index === localValue;
                    return (
                        <div className={styles.row}>
                            <span>{opt}:</span>
                            <input type="radio" key={`${fieldKey}-${index}`} name={fieldKey} value={index} checked={checked} onChange={rbOnClick} />
                        </div>
                    );
                })
            }
        </div>
    );
};

export default RadioButtonInput;
