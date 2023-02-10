import React from 'react';

import styles from './index.styl';

const String = (props) => {
    const { value, maxChars, onChange } = props;
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
