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
                className={styles.btnLeft}
                disabled={disabled}
                jog={() => actions.jog({ A: -aStep, F: feedrate })}
                continuousJog={() => actions.startContinuousJog({ A: -1 }, feedrate)}
                stopContinuousJog={() => actions.stopContinuousJog()}
            >
                <KeypadText>A</KeypadText>
                <KeypadDirectionText>-</KeypadDirectionText>
            </JogControl>
            <JogControl
                className={styles.btnRight}
                disabled={disabled}
                jog={() => actions.jog({ A: aStep, F: feedrate })}
                continuousJog={() => actions.startContinuousJog({ A: 1 }, feedrate)}
                stopContinuousJog={() => actions.stopContinuousJog()}
            >
                <KeypadText>A</KeypadText>
                <KeypadDirectionText>+</KeypadDirectionText>
            </JogControl>
        </div>
    );
};

export default JogControlArea;
