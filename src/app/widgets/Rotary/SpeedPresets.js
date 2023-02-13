import React from 'react';
import cx from 'classnames';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';
import { SPEED_NORMAL, SPEED_PRECISE, SPEED_RAPID } from '../JogControl/constants';

const SpeedPresets = ({ canClick = true, selectedSpeed, actions }) => {
    const rapidActive = (selectedSpeed === SPEED_RAPID);
    const normalActive = (selectedSpeed === SPEED_NORMAL);
    const preciseActive = (selectedSpeed === SPEED_PRECISE);

    return (
        <div className={styles.presetControls}>
            <FunctionButton
                className={cx({ [styles.activeButton]: rapidActive })}
                disabled={!canClick} type="button"
                onClick={() => {
                    actions.setSelectedSpeed(SPEED_RAPID);
                    actions.setJogFromPreset(SPEED_RAPID);
                }}
            >
                { rapidActive && <div className={styles.activeIndicator} /> }
                Rapid
            </FunctionButton>
            <FunctionButton
                className={cx({ [styles.activeButton]: normalActive })}
                disabled={!canClick}
                onClick={() => {
                    actions.setSelectedSpeed(SPEED_NORMAL);
                    actions.setJogFromPreset(SPEED_NORMAL);
                }}
            >
                { normalActive && <div className={styles.activeIndicator} /> }
                Normal
            </FunctionButton>
            <FunctionButton
                className={cx({ [styles.activeButton]: preciseActive })}
                disabled={!canClick}
                onClick={() => {
                    actions.setSelectedSpeed(SPEED_PRECISE);
                    actions.setJogFromPreset(SPEED_PRECISE);
                }}
            >
                { preciseActive && <div className={styles.activeIndicator} /> }
                Precise
            </FunctionButton>
        </div>
    );
};

export default SpeedPresets;
