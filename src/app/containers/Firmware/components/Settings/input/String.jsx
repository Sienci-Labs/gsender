import React from 'react';

import styles from './index.styl';

const String = ({ value, maxChars = 64, onChange }) => {
    return (
        <div className={styles.numberInputs}>
            <input
                type="text"
                className={styles.formControlModal}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
                value={value}
                maxLength={maxChars}
            />
        </div>
    );
};

export default String;
