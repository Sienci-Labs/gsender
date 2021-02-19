import React from 'react';
import styles from './index.styl';
import NumberInput from './NumberInput';
import { METRIC_UNITS } from '../../constants';

const SpeedControl = ({ state, actions }) => {
    const { units, jog } = state;
    const { xyStep, zStep, feedrate } = jog;

    const xyMin = (units === METRIC_UNITS) ? 0.01 : 0.001;
    const zMin = (units === METRIC_UNITS) ? 0.01 : 0.001;
    const xyMax = (units === METRIC_UNITS) ? 300 : 10;
    const zMax = (units === METRIC_UNITS) ? 30 : 1;
    const speedMin = (units === METRIC_UNITS) ? 50 : 2;
    const speedMax = (units === METRIC_UNITS) ? 50000 : 2000;
    const decimals = (units === METRIC_UNITS) ? 2 : 3;

    return (
        <div className={styles.speedControls}>
            <div className={styles.controlGroup}>
                <span>XY move ({units})</span>
                <NumberInput
                    value={xyStep}
                    min={xyMin}
                    max={xyMax}
                    changeHandler={actions.handleXYStepChange}
                    decimals={decimals}
                />
            </div>
            <div className={styles.controlGroup}>
                <span>Z move ({units})</span>
                <NumberInput
                    value={zStep}
                    min={zMin}
                    max={zMax}
                    changeHandler={actions.handleZStepChange}
                    decimals={decimals}
                />
            </div>
            <div className={styles.controlGroup}>
                <span>Speed ({units}/min)</span>
                <NumberInput
                    value={feedrate}
                    min={speedMin}
                    max={speedMax}
                    changeHandler={actions.handleFeedrateChange}
                    decimals={0}
                />
            </div>
        </div>
    );
};

export default SpeedControl;
