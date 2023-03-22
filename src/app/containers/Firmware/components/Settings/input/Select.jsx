import React from 'react';
import { uniqueId } from 'lodash';
import { RadioGroup, RadioButton } from 'app/components/Radio';

import styles from './index.styl';

const Select = ({ value, values, onChange }) => {
    const correctedValue = parseInt(value, 10).toString();
    return (
        <div className={styles.select}>
            <RadioGroup
                value={correctedValue}
                onChange={onChange}
            >
                {
                    Object.keys(values).map((key, index) => {
                        return <RadioButton key={uniqueId()} className={styles.radioButton} value={key} checked={key === correctedValue}>{values[key]}</RadioButton>;
                    })
                }
            </RadioGroup>
        </div>
    );
};

export default Select;
