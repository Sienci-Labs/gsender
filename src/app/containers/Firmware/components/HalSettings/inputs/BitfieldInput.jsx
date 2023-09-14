import React from 'react';
import ToggleSwitch from 'Components/ToggleSwitch';
import ensureArray from 'ensure-array';
import styles from './index.styl';

const BitfieldInput = ({ info, setting }) => {
    let { format } = info;
    format = ensureArray(format);

    return (
        <div className={styles.column}>
            {
                format.map((opt, index) => {
                    return (
                        <div className={styles.row}>
                            <div>{opt}: </div>
                            <div><ToggleSwitch /></div>
                        </div>
                    );
                })
            }
        </div>
    );
};

export default BitfieldInput;
