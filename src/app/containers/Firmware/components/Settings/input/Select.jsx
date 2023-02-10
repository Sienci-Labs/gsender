import React from 'react';
import { uniqueId } from 'lodash';
import { RadioGroup, RadioButton } from 'app/components/Radio';

import styles from './index.styl';

const Select = ({ value, values, onChange }) => {
    return (
        <div className={styles.select}>
            <RadioGroup
                value={value}
                onChange={(value) => {
                    onChange(Number(value).toString());
                }}
            >
                {
                    Object.keys(values).map((key, index) => {
                        return <RadioButton key={uniqueId()} className={styles.radioButton} value={key} checked={key === Number(value)}>{values[key]}</RadioButton>;
                    })
                }
            </RadioGroup>
        </div>
    );
};

export default Select;
