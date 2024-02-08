import React from 'react';
import styled from 'styled-components';

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

    return (
        <div className={styles['jog-control-wrapper']}>
            <JogControl
                className={styles.btnUp}
                disabled={disabled}
                jog={() => actions.jog({ Y: aStep, F: feedrate })}
                continuousJog={() => actions.startContinuousJog({ Y: 1 }, feedrate)}
                stopContinuousJog={() => actions.stopContinuousJog()}
            >
                <KeypadText>A</KeypadText>
                <KeypadDirectionText>+</KeypadDirectionText>
            </JogControl>
            <JogControl
                className={styles.btnDown}
                disabled={disabled}
                jog={() => actions.jog({ Y: -aStep, F: feedrate })}
                continuousJog={() => actions.startContinuousJog({ Y: -1 }, feedrate)}
                stopContinuousJog={() => actions.stopContinuousJog()}
            >
                <KeypadText>A</KeypadText>
                <KeypadDirectionText>-</KeypadDirectionText>
            </JogControl>
        </div>
    );
};

export default JogControlArea;
