import React, { useState, useEffect } from 'react';

import ToggleSwitch from 'app/components/Switch';

import { convertValueToArray } from '../../../utils';
import styles from './index.module.styl';

const StatusReportSwitch = ({ value, onChange, disabled }) => {
    const [statusReportSettings, setStatusReportSettings] = useState([
        false,
        false,
    ]); //mpos/wpos, buffer

    useEffect(() => {
        initializeSettings();
    }, []);

    useEffect(() => {
        updateValues(statusReportSettings);
    }, [statusReportSettings]);

    const initializeSettings = () => {
        if (!value) {
            return;
        }

        const possibilities = [
            [false, false],
            [true, false],
            [false, true],
            [true, true],
        ];

        const arrayOfValue = convertValueToArray(value, possibilities);

        setStatusReportSettings(arrayOfValue);
    };

    const updateValues = (values) => {
        let sum = 0;
        let [mpos, buffer] = values;

        sum += mpos ? 1 : 0;
        sum += buffer ? 2 : 0;

        onChange(sum.toString());
    };

    const toggleStatusReport = (index) => (value) => {
        setStatusReportSettings((prev) => {
            const newSettings = [...prev];
            newSettings[index] = value;
            return newSettings;
        });
    };

    const [pos, buffer] = statusReportSettings;

    return (
        <div className={styles.controlWrapper}>
            <div className={styles.controlGrid}>
                <span className={styles.leftLabel}>WPos</span>
                <div className={styles.centeredControl}>
                    <ToggleSwitch
                        checked={pos}
                        onChange={toggleStatusReport(0)}
                        disabled={disabled}
                    />
                </div>
                <span>MPos</span>
            </div>
            <div className={styles.controlGrid}>
                <span className={styles.leftLabel}>Buffer</span>
                <div className={styles.centeredControl}>
                    <ToggleSwitch
                        checked={buffer}
                        onChange={toggleStatusReport(1)}
                        disabled={disabled}
                    />
                </div>
                <span />
            </div>
        </div>
    );
};

export default StatusReportSwitch;
