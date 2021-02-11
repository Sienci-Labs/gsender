/* eslint-disable react/self-closing-comp */
import cx from 'classnames';
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
        const { canClick, actions, axes, units } = this.props;
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
                <div className="row no-gutters">
                    <div className="col-xs-8">
                        <div className={styles.rowSpace}>
                            <div className="row no-gutters">
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            type="button"
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: -distance, Y: distance, F: feedrate });
                                            }}
                                            disabled={xyControlsDisabled}
                                            title={i18n._('Move X- Y+')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-up', styles['rotate--45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
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
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            type="button"
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: distance, Y: distance, F: feedrate });
                                            }}
                                            disabled={xyControlsDisabled}
                                            title={i18n._('Move X+ Y+')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-up', styles['rotate-45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
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
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.rowSpace}>
                            <div className="row no-gutters">
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
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
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
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
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                </div>
                            </div>
                        </div>
                        <div className={styles.rowSpace}>
                            <div className="row no-gutters">
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            type="button"
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: -distance, Y: -distance, F: feedrate });
                                            }}
                                            disabled={xyControlsDisabled}
                                            title={i18n._('Move X- Y-')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-down', styles['rotate-45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
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
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            type="button"
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            onClick={() => {
                                                const distance = actions.getJogDistance();
                                                actions.jog({ X: distance, Y: -distance });
                                            }}
                                            disabled={xyControlsDisabled}
                                            title={i18n._('Move X+ Y-')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-down', styles['rotate--45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
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
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cx('col-xs-4', styles.flexCol)}>
                        <button
                            disabled={!canClick} type="button"
                            className={styles.movementRateButton}
                            onClick={() => {
                                const xyStep = (units === 'mm') ? 20 : 1;
                                const zStep = (units === 'mm') ? 10 : 0.5;
                                actions.changeMovementRates(xyStep, zStep, 5000);
                            }}
                        >
                            Rapid
                        </button>
                        <button
                            disabled={!canClick}
                            type="button"
                            className={styles.movementRateButton}
                            onClick={() => {
                                const xyStep = (units === 'mm') ? 5 : 0.2;
                                const zStep = (units === 'mm') ? 2 : 0.04;
                                actions.changeMovementRates(xyStep, zStep, 3000);
                            }}
                        >
                            Normal
                        </button>
                        <button
                            disabled={!canClick}
                            type="button"
                            className={styles.movementRateButton}
                            onClick={() => {
                                const xyStep = (units === 'mm') ? 0.5 : 0.02;
                                const zStep = (units === 'mm') ? 0.1 : 0.004;
                                actions.changeMovementRates(xyStep, zStep, 3000);
                            }}
                        >
                            Precise
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default Keypad;
