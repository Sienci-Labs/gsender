import React, { useState, useEffect } from 'react';
import ToggleSwitch from 'Components/ToggleSwitch';
import styles from './index.styl';

const BooleanInput = ({ info, setting, onChange, disabled }) => {
    let [bool, setBool] = useState(false);

    useEffect(() => {
        let { value } = setting;
        value = (Number(setting.value) === 1);
        setBool(value);
    }, []);

    const booleanOnChange = (checked) => {
        const value = checked ? 1 : 0;
        setBool(checked);
        onChange(value);
        // Handle value change
    };

    return (
        <div className={styles.row}><ToggleSwitch checked={bool} onChange={booleanOnChange} disabled={disabled} /></div>
    );
};

export default BooleanInput;
