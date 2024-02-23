import React from 'react';
import Select from 'react-select';
import styles from '../index.styl';


const formatSpindles = (spindles = []) => {
    const formattedSpindles = [];

    spindles.forEach((spindle) => {
        const localSpindle = {
            label: `${spindle.id}: ${spindle.label} (${spindle.capabilities})`,
            value: spindle.id
        };
        formattedSpindles.push(localSpindle);
    });
    return formattedSpindles;
};

const SpindleSelector = ({ spindles, onChange, spindle }) => {
    spindles = formatSpindles(spindles);
    return (
        <div className={styles.spindleWrapper}>
            <label>Spindles</label>
            <Select
                options={spindles}
                placeholder="Default Spindle"
                value={spindle}
                onChange={onChange}
            />
        </div>
    );
};

export default SpindleSelector;
