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

const SpindleSelector = ({ spindles }) => {
    spindles = formatSpindles(spindles);
    return (
        <div className={styles.spindleWrapper}>
            <label>Spindles</label>
            <Select
                options={spindles}
                placeholder="Default Spindle"
                value={0}
                onChange={() => {}}
            />
        </div>
    );
};

export default SpindleSelector;
