import React, { useState, useEffect } from 'react';
// import PropTypes from 'prop-types';

import ToggleSwitch from 'app/components/ToggleSwitch';

import { convertValueToArray } from '../../../utils';
import styles from './index.styl';

const BitShiftInput = ({ value, onChange }) => {
    const [bitShiftSettings, setBitShiftSettings] = useState([false, false, false]); //X, Y, Z

    /*useEffect(() => {
        updateValues(bitShiftSettings);
    }, [bitShiftSettings]);*/

    useEffect(() => {
        initializeSettings();
    }, [value]);

    const handleSwitch = (value, index) => {
        setBitShiftSettings(prev => {
            const newBitShiftSettings = [...prev];
            newBitShiftSettings[index] = value;
            updateValues(newBitShiftSettings);
            return newBitShiftSettings;
        });
    };

    const initializeSettings = () => {
        if (!value) {
            return;
        }

        const possibilities = [
            [false, false, false],
            [true, false, false],
            [false, true, false],
            [true, true, false],
            [false, false, true],
            [true, false, true],
            [false, true, true],
            [true, true, true],
        ];

        const arrayOfValue = convertValueToArray(value, possibilities);

        setBitShiftSettings(arrayOfValue);
    };

    const updateValues = (values) => {
        let sum = 0;

        const [x, y, z] = values;
        sum += x ? 1 : 0;
        sum += y ? 2 : 0;
        sum += z ? 4 : 0;

        onChange(sum.toString());
        return bitShiftSettings;
    };

    const [X, Y, Z] = bitShiftSettings;

    return (
        <div className={styles.controlWrapper}>
            <div className={styles.controlRow}>
                <div className={styles.maskTwoTitles}>X: </div>
                <ToggleSwitch checked={X} onChange={(value) => handleSwitch(value, 0)} />
            </div>
            <div className={styles.controlRow}>
                <div className={styles.maskTwoTitles}>Y: </div>
                <ToggleSwitch checked={Y} onChange={(value) => handleSwitch(value, 1)} />
            </div>
            <div className={styles.controlRow}>
                <div className={styles.maskTwoTitles}>Z: </div>
                <ToggleSwitch checked={Z} onChange={(value) => handleSwitch(value, 2)} />
            </div>
        </div>
    );
};

export default BitShiftInput;
