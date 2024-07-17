import React from 'react';

import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import NumberInput from '../JogControl/NumberInput';

import styles from './index.styl';

const SpeedControls = ({ actions, jog }) => {
    const { aStep, feedrate } = jog;
    const decimals = 2;

    return (
        <div className={styles['speed-controls-wrapper']}>
            <div className={styles.controlGroup}>
                <span>A move (deg)</span>
                <TooltipCustom content="Specify A axis jog distance" location="default">
                    <NumberInput
                        value={aStep}
                        min={0}
                        max={360}
                        changeHandler={actions.handleAStepChange}
                        decimals={decimals}
                    />
                </TooltipCustom>
            </div>
            <div className={styles.controlGroup}>
                <span className={styles.speed}>Speed (deg/min)</span>
                <TooltipCustom content="Specify jog speed all axis" location="default">
                    <NumberInput
                        value={feedrate}
                        min={1}
                        max={10000}
                        changeHandler={actions.handleFeedrateChange}
                        decimals={0}
                    />
                </TooltipCustom>
            </div>
        </div>
    );
};

export default SpeedControls;
