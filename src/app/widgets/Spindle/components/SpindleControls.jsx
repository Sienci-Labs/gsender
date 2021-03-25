import React from 'react';
import FunctionButton from '../../../components/FunctionButton/FunctionButton';
import Slider from './Slider';
import styles from '../index.styl';

const SpindleControls = ({ actions, state }) => {
    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlRow}>
                <FunctionButton onClick={actions.sendM3}>
                    <i className="fas fa-redo-alt" />
                    CW (M3)
                </FunctionButton>
                <FunctionButton onClick={actions.sendM4}>
                    <i className="fas fa-redo-alt fa-flip-horizontal" />
                    CCW (M4)
                </FunctionButton>
                <FunctionButton onClick={actions.sendM5}>
                    <i className="fas fa-ban" />
                    Stop (M5)
                </FunctionButton>
            </div>
            <Slider
                label="Speed"
                unitString="RPM"
                value={state.spindleSpeed}
                min={state.spindleMin}
                max={state.spindleMax}
                step={10}
                onChange={actions.handleSpindleSpeedChange}
            />
        </div>
    );
};

export default SpindleControls;
