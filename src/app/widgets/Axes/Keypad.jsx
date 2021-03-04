/* eslint-disable react/self-closing-comp */
import ensureArray from 'ensure-array';
import frac from 'frac';
import _uniqueId from 'lodash/uniqueId';
import _includes from 'lodash/includes';
import PropTypes from 'prop-types';
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
                    <clipPath id="br" clipPathUnits="objectBoundingBox"><path d="M0.434,0.566 C0.434,0.566,0.103,0.566,0.103,0.566 C0.093,0.566,0.068,0.563,0.058,0.56 C0.027,0.549,0,0.514,0,0.482 C0,0.458,-0.002,0.44,0.011,0.418 C0.029,0.387,0.059,0.377,0.091,0.363 C0.091,0.363,0.182,0.321,0.182,0.321 C0.182,0.321,0.27,0.279,0.27,0.279 C0.27,0.279,0.363,0.237,0.363,0.237 C0.363,0.237,0.676,0.093,0.676,0.093 C0.676,0.093,0.795,0.038,0.795,0.038 C0.811,0.03,0.865,0.004,0.878,0.001 C0.885,0,0.906,0,0.914,0.001 C0.954,0.001,0.989,0.037,0.998,0.072 C1,0.08,1,0.101,1,0.11 C0.999,0.132,0.982,0.161,0.973,0.182 C0.973,0.182,0.907,0.325,0.907,0.325 C0.907,0.325,0.679,0.819,0.679,0.819 C0.679,0.819,0.633,0.919,0.633,0.919 C0.621,0.944,0.611,0.971,0.586,0.987 C0.561,1,0.547,1,0.52,1 C0.482,1,0.447,0.97,0.438,0.936 C0.438,0.936,0.434,0.893,0.434,0.893 C0.434,0.893,0.434,0.566,0.434,0.566"></path></clipPath>
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
                            className={styles.btnUp}
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
                            className={styles.btnDown}
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
