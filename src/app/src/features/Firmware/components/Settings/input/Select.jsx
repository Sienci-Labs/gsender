import React from 'react';
import uniqueId from 'lodash/uniqueId';
import { RadioGroup, RadioButton } from 'app/components/Radio';

import styles from './index.module.styl';

const Select = ({ value, values, onChange, disabled }) => {
    const correctedValue = parseInt(value, 10).toString();
    return (
        <div className={styles.select}>
            <RadioGroup value={correctedValue} onChange={onChange}>
                {Object.keys(values).map((key, index) => {
                    return (
                        <RadioButton
                            key={uniqueId()}
                            value={key}
                            checked={key === correctedValue}
                            disabled={disabled}
                            className="max-w-6 max-h-6"
                        >
                            {values[key]}
                        </RadioButton>
                    );
                })}
            </RadioGroup>
        </div>
    );
};

export default Select;
