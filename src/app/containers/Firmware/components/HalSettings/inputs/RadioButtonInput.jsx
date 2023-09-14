import React from 'react';
import ensureArray from 'ensure-array';
import styles from './index.styl';

const RadioButtonInput = ({ info, setting }) => {
    let { format } = info;
    const fieldKey = `${setting.setting}-key`;

    format = ensureArray(format);

    return (
        <div className={styles.column}>
            {
                format.map((opt, index) => {
                    return (
                        <div className={styles.row}>
                            <span>{opt}:</span>
                            <input type="radio" name={fieldKey} value={index} />
                        </div>
                    );
                })
            }
        </div>
    );
};

export default RadioButtonInput;
