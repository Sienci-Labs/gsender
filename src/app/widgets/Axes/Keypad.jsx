/* eslint-disable react/self-closing-comp */
import ensureArray from 'ensure-array';
import frac from 'frac';
import _uniqueId from 'lodash/uniqueId';
import _includes from 'lodash/includes';
import PropTypes from 'prop-types';
import cx from 'classnames';
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { MenuItem } from 'app/components/Dropdown';
import Space from 'app/components/Space';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import Fraction from './components/Fraction';
import {
    IMPERIAL_UNITS,
    IMPERIAL_STEPS,
    METRIC_UNITS,
    METRIC_STEPS
} from '../../constants';
import styles from './index.styl';
import JogControl from './components/JogControl';
import JogCancel from './components/JogCancel';
import FunctionButton from '../../components/FunctionButton/FunctionButton';

const KeypadText = styled.span`
    position: relative;
    display: inline-block;
    vertical-align: baseline;
`;

const KeypadDirectionText = styled(KeypadText)`
    min-width: 10px;
`;


class Keypad extends PureComponent {
    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([IMPERIAL_UNITS, METRIC_UNITS]),
        axes: PropTypes.array,
        jog: PropTypes.object,
        actions: PropTypes.object
    };

    handleSelect = (eventKey) => {
        const commands = ensureArray(eventKey);
        commands.forEach(command => controller.command('gcode', command));
    };

    renderRationalNumberWithBoundedDenominator(value) {
        // https://github.com/SheetJS/frac
        const denominatorDigits = 4;
        const maximumDenominator = Math.pow(10, Number(denominatorDigits) || 0) - 1; // 10^4 - 1 = 9999
        const [quot, numerator, denominator] = frac(value, maximumDenominator, true);

        if (numerator > 0) {
            return (
                <span>
                    {quot > 0 ? quot : ''}
                    <Space width="2" />
                    <Fraction
                        numerator={numerator}
                        denominator={denominator}
                    />
                </span>
            );
        }

        return (
            <span>{quot > 0 ? quot : ''}</span>
        );
    }

    renderImperialMenuItems() {
        const { jog } = this.props;
        const imperialJogDistances = ensureArray(jog.imperial.distances);
        const imperialJogSteps = [
            ...imperialJogDistances,
            ...IMPERIAL_STEPS
        ];
        const step = jog.imperial.step;

        return imperialJogSteps.map((value, key) => {
            const active = (key === step);

            return (
                <MenuItem
                    key={_uniqueId()}
                    eventKey={key}
                    active={active}
                >
                    {value}
                    <Space width="4" />
                    <sub>{i18n._('in')}</sub>
                </MenuItem>
            );
        });
    }

    renderMetricMenuItems() {
        const { jog } = this.props;
        const metricJogDistances = ensureArray(jog.metric.distances);
        const metricJogSteps = [
            ...metricJogDistances,
            ...METRIC_STEPS
        ];
        const step = jog.metric.step;

        return metricJogSteps.map((value, key) => {
            const active = (key === step);

            return (
                <MenuItem
                    key={_uniqueId()}
                    eventKey={key}
                    active={active}
                >
                    {value}
                    <Space width="4" />
                    <sub>{i18n._('mm')}</sub>
                </MenuItem>
            );
        });
    }

    render() {
        const { canClick, actions, axes, isJogging } = this.props;
        const canClickX = canClick && _includes(axes, 'x');
        const canClickY = canClick && _includes(axes, 'y');
        const canClickXY = canClickX && canClickY;
        const canClickZ = canClick && _includes(axes, 'z');

        const xyControlsDisabled = !canClickXY;
        const zControlsDisabled = !canClickZ;

        // Feedrates and distances
        const xyDistance = actions.getXYJogDistance();
        const zDistance = actions.getZJogDistance();
        const feedrate = actions.getFeedrate();

        return (
            <div className={styles.keypad}>
                <svg className={styles.hideSVG}>
                    <clipPath id="bl" clipPathUnits="objectBoundingBox"><path d="M0.565,0.565 C0.565,0.565,0.565,0.9,0.565,0.9 C0.564,0.957,0.535,0.998,0.475,1 C0.45,1,0.432,1,0.41,0.984 C0.379,0.962,0.335,0.854,0.318,0.815 C0.318,0.815,0.207,0.575,0.207,0.575 C0.207,0.575,0.099,0.34,0.099,0.34 C0.099,0.34,0.039,0.21,0.039,0.21 C0.019,0.168,-0.001,0.137,0,0.09 C0.002,0.029,0.048,-0.001,0.105,0 C0.139,0.001,0.179,0.024,0.21,0.039 C0.21,0.039,0.34,0.099,0.34,0.099 C0.34,0.099,0.575,0.207,0.575,0.207 C0.575,0.207,0.815,0.318,0.815,0.318 C0.815,0.318,0.925,0.369,0.925,0.369 C0.945,0.379,0.967,0.387,0.981,0.405 C0.999,0.428,1,0.447,1,0.475 C0.998,0.543,0.95,0.565,0.89,0.565 C0.89,0.565,0.565,0.565,0.565,0.565"></path></clipPath>
                    <clipPath id="br" clipPathUnits="objectBoundingBox"><path d="M0.435,0.565 C0.435,0.565,0.1,0.565,0.1,0.565 C0.043,0.564,0.002,0.535,0,0.475 C-0.001,0.447,0.001,0.428,0.019,0.405 C0.033,0.387,0.055,0.379,0.075,0.369 C0.075,0.369,0.185,0.318,0.185,0.318 C0.185,0.318,0.425,0.207,0.425,0.207 C0.425,0.207,0.66,0.099,0.66,0.099 C0.66,0.099,0.79,0.039,0.79,0.039 C0.831,0.019,0.863,-0.001,0.91,0 C0.971,0.002,1,0.048,1,0.105 C0.999,0.139,0.976,0.179,0.961,0.21 C0.961,0.21,0.901,0.34,0.901,0.34 C0.901,0.34,0.793,0.575,0.793,0.575 C0.793,0.575,0.682,0.815,0.682,0.815 C0.665,0.854,0.621,0.962,0.59,0.984 C0.568,1,0.55,1,0.525,1 C0.457,0.998,0.435,0.95,0.435,0.89 C0.435,0.89,0.435,0.565,0.435,0.565"></path></clipPath>
                    <clipPath id="fl" clipPathUnits="objectBoundingBox"><path d="M0.565,0.435 C0.565,0.435,0.565,0.1,0.565,0.1 C0.564,0.043,0.535,0.002,0.475,0 C0.45,-0.001,0.432,0,0.41,0.016 C0.379,0.038,0.335,0.146,0.318,0.185 C0.318,0.185,0.207,0.425,0.207,0.425 C0.207,0.425,0.099,0.66,0.099,0.66 C0.099,0.66,0.039,0.79,0.039,0.79 C0.019,0.831,-0.001,0.863,0,0.91 C0.002,0.971,0.048,1,0.105,1 C0.139,0.999,0.179,0.976,0.21,0.961 C0.21,0.961,0.34,0.901,0.34,0.901 C0.34,0.901,0.575,0.793,0.575,0.793 C0.575,0.793,0.815,0.682,0.815,0.682 C0.815,0.682,0.925,0.631,0.925,0.631 C0.945,0.621,0.967,0.613,0.981,0.594 C0.999,0.572,1,0.553,1,0.525 C0.998,0.457,0.95,0.435,0.89,0.435 C0.89,0.435,0.565,0.435,0.565,0.435"></path></clipPath>
                    <clipPath id="fr" clipPathUnits="objectBoundingBox"><path d="M0.435,0.435 C0.435,0.435,0.435,0.1,0.435,0.1 C0.436,0.043,0.465,0.002,0.525,0 C0.55,-0.001,0.568,0,0.59,0.016 C0.621,0.038,0.665,0.146,0.682,0.185 C0.682,0.185,0.793,0.425,0.793,0.425 C0.793,0.425,0.901,0.66,0.901,0.66 C0.901,0.66,0.961,0.79,0.961,0.79 C0.981,0.831,1,0.863,1,0.91 C0.998,0.971,0.952,1,0.895,1 C0.861,0.999,0.821,0.976,0.79,0.961 C0.79,0.961,0.66,0.901,0.66,0.901 C0.66,0.901,0.425,0.793,0.425,0.793 C0.425,0.793,0.185,0.682,0.185,0.682 C0.185,0.682,0.075,0.631,0.075,0.631 C0.055,0.621,0.033,0.613,0.019,0.594 C0.001,0.572,-0.001,0.553,0,0.525 C0.002,0.457,0.05,0.435,0.11,0.435 C0.11,0.435,0.435,0.435,0.435,0.435"></path></clipPath>
                </svg>
                <div className={styles.keysBody}>
                    <div className={styles.xyKeys}>
                        <JogControl
                            className={styles.btnUpLeft}
                            jog={() => actions.jog({ X: -xyDistance, Y: xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ X: -1, Y: 1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                        </JogControl>
                        <JogControl
                            className={styles.btnUp}
                            jog={() => actions.jog({ Y: xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ Y: 1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                            <KeypadText>Y</KeypadText>
                            <KeypadDirectionText>+</KeypadDirectionText>
                        </JogControl>
                        <JogControl
                            className={styles.btnUpRight}
                            jog={() => actions.jog({ X: xyDistance, Y: xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ X: 1, Y: 1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                        </JogControl>
                        <JogControl
                            className={cx(styles.btnUp, styles.zTopTransform)}
                            jog={() => actions.jog({ Z: zDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ Z: 1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={zControlsDisabled}
                        >
                            <KeypadText>Z</KeypadText>
                            <KeypadDirectionText>+</KeypadDirectionText>
                        </JogControl>
                        <JogControl
                            className={styles.btnLeft}
                            jog={() => actions.jog({ X: -xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ X: -1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                            <KeypadText>X</KeypadText>
                            <KeypadDirectionText>-</KeypadDirectionText>
                        </JogControl>
                        <JogCancel disabled={!isJogging} onClick={() => actions.cancelJog()} />
                        <JogControl
                            className={styles.btnRight}
                            jog={() => actions.jog({ X: xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ X: 1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                            <KeypadText>X</KeypadText>
                            <KeypadDirectionText>+</KeypadDirectionText>
                        </JogControl>
                        <div />
                        <JogControl
                            className={styles.btnDownLeft}
                            jog={() => actions.jog({ X: -xyDistance, Y: -xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ X: -1, Y: -1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                        </JogControl>
                        <JogControl
                            className={styles.btnDown}
                            jog={() => actions.jog({ Y: -xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ Y: -1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                            <KeypadText>Y</KeypadText>
                            <KeypadDirectionText>-</KeypadDirectionText>
                        </JogControl>
                        <JogControl
                            className={styles.btnDownRight}
                            jog={() => actions.jog({ X: xyDistance, Y: -xyDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ X: 1, Y: -1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={xyControlsDisabled}
                        >
                        </JogControl>
                        <JogControl
                            className={cx(styles.btnDown, styles.zBottomTransform)}
                            jog={() => actions.jog({ Z: -zDistance, F: feedrate })}
                            continuousJog={() => actions.startContinuousJog({ Z: -1 }, feedrate)}
                            stopContinuousJog={() => actions.stopContinuousJog()}
                            disabled={zControlsDisabled}
                        >
                            <KeypadText>Z</KeypadText>
                            <KeypadDirectionText>-</KeypadDirectionText>
                        </JogControl>
                    </div>
                    <div className={styles.presetControls}>
                        <FunctionButton
                            disabled={!canClick} type="button"
                            onClick={() => {
                                actions.setJogFromPreset('rapid');
                            }}
                        >
                            Rapid
                        </FunctionButton>
                        <FunctionButton
                            disabled={!canClick}
                            onClick={() => {
                                actions.setJogFromPreset('normal');
                            }}
                        >
                            Normal
                        </FunctionButton>
                        <FunctionButton
                            disabled={!canClick}
                            onClick={() => {
                                actions.setJogFromPreset('precise');
                            }}
                        >
                            Precise
                        </FunctionButton>
                    </div>
                </div>
            </div>
        );
    }
}

export default Keypad;
