import React from 'react';
import styled from 'styled-components';

import store from '../../store';
import { WORKSPACE_MODE } from '../../constants';
import JogControl from '../JogControl/components/JogControl';

import styles from './index.styl';

const KeypadText = styled.span`
    position: relative;
    display: inline-block;
    vertical-align: baseline;
`;

const KeypadDirectionText = styled(KeypadText)`
    min-width: 10px;
`;

const JogControlArea = ({ actions, jog, disabled = false }) => {
    const { aStep, feedrate } = jog;

    // convert to Y if necessary
    const isInRotaryMode = store.get('workspace.mode', '') === WORKSPACE_MODE.ROTARY;
    const jogPlus = isInRotaryMode ? { Y: aStep, F: feedrate } : { A: aStep, F: feedrate };
    const continuousPlus = isInRotaryMode ? { Y: 1 } : { A: 1 };
    const jogMinus = isInRotaryMode ? { Y: -aStep, F: feedrate } : { A: -aStep, F: feedrate };
    const continousMinus = isInRotaryMode ? { Y: -1 } : { A: -1 };


    return (
        <div className={styles['jog-control-wrapper']}>
            <JogControl
                className={styles.btnUp}
                disabled={disabled}
                jog={() => actions.jog(jogPlus)}
                continuousJog={() => actions.startContinuousJog(continuousPlus, feedrate)}
                stopContinuousJog={() => actions.stopContinuousJog()}
            >
                <KeypadText>A</KeypadText>
                <KeypadDirectionText>+</KeypadDirectionText>
            </JogControl>
            <JogControl
                className={styles.btnDown}
                disabled={disabled}
                jog={() => actions.jog(jogMinus)}
                continuousJog={() => actions.startContinuousJog(continousMinus, feedrate)}
                stopContinuousJog={() => actions.stopContinuousJog()}
            >
                <KeypadText>A</KeypadText>
                <KeypadDirectionText>-</KeypadDirectionText>
            </JogControl>
        </div>
    );
};

export default JogControlArea;
