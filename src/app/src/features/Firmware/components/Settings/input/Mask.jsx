import React, { useState, useEffect } from 'react';
import uniqueId from 'lodash/uniqueId';

import ToggleSwitch from 'app/components/Switch';

import styles from './index.module.styl';

const Mask = ({ value, bits, numBits, requiredBit, onChange, disabled }) => {
    const getInitialSettings = () => {
        let settings = [];
        for (let i = 0; i < numBits; i++) {
            settings.push(false);
        }
        return settings;
    };
    const [bitShiftSettings, setBitShiftSettings] =
        useState(getInitialSettings());

    useEffect(() => {
        initializeSettings();
    }, [value]);

    const handleSwitch = (value, index) => {
        const newBitShiftSettings = [...bitShiftSettings];
        newBitShiftSettings[index] = value;
        updateValues(newBitShiftSettings);
    };

    const initializeSettings = () => {
        if (!value) {
            return;
        }

        // eslint-disable-next-line no-bitwise
        const binary = (Number(value) >>> 0).toString(2).padStart(numBits, 0);
        let settings = [];
        for (let i = 0; i < numBits; i++) {
            settings[i] = binary.charAt(numBits - 1 - i) === '1';
        }

        setBitShiftSettings(settings);
    };

    const updateValues = (values) => {
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i] ? Math.pow(2, i) : 0;
        }
        onChange(sum.toString());
    };

    return (
        <div className={styles.maskWrapperOutside}>
            <div className={styles.maskWrapper}>
                {bitShiftSettings.map((setting, index) => {
                    return (
                        <div key={uniqueId()} className={styles.controlRow}>
                            <div className={styles.maskTwoTitles}>
                                {bits[index]}
                            </div>
                            <ToggleSwitch
                                disabled={
                                    disabled ||
                                    (requiredBit !== undefined &&
                                        index !== requiredBit &&
                                        !bitShiftSettings[requiredBit])
                                }
                                checked={setting}
                                onChange={(value) => handleSwitch(value, index)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Mask;
