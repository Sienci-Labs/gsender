import React from 'react';
import styles from './index.styl';
import NumberInput from './NumberInput';

const SpeedControl = ({ state, actions }) => {
    const { units, jog } = state;
    const { xyStep, zStep, feedrate } = jog;

    return (
        <div className={styles.speedControls}>
            <div className={styles.controlGroup}>
                <span>XY move ({units})</span>
                <NumberInput
                    value={xyStep}
                    min={0}
                    max={100}
                    changeHandler={actions.handleXYStepChange}
                />
            </div>
            <div className={styles.controlGroup}>
                <span>Z move ({units})</span>
                <NumberInput
                    value={zStep}
                    min={0}
                    max={10}
                    changeHandler={actions.handleZStepChange}
                />
            </div>
            <div className={styles.controlGroup}>
                <span>Speed ({units}/min)</span>
                <NumberInput
                    value={feedrate}
                    min={100}
                    max={10000}
                    changeHandler={actions.handleFeedrateChange}
                />
            </div>
        </div>
    );
};

export default SpeedControl;
