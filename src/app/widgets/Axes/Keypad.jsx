import cx from 'classnames';
import ensureArray from 'ensure-array';
import frac from 'frac';
import _includes from 'lodash/includes';
import _uniqueId from 'lodash/uniqueId';
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
        const { canClick, axes, jog, actions } = this.props;
        const canClickX = canClick && _includes(axes, 'x');
        const canClickY = canClick && _includes(axes, 'y');
        const canClickXY = canClickX && canClickY;
        const canClickZ = canClick && _includes(axes, 'z');
        const highlightX = canClickX && (jog.keypad || jog.axis === 'x');
        const highlightY = canClickY && (jog.keypad || jog.axis === 'y');
        const highlightZ = canClickZ && (jog.keypad || jog.axis === 'z');

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
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: -distance, Y: distance, F: feedrate });
                                            }}
                                            disabled={!canClickXY}
                                            title={i18n._('Move X- Y+')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-up', styles['rotate--45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(
                                                styles.btnKeypad,
                                                styles.btnUp,
                                                { [styles.highlight]: highlightY }
                                            )}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ Y: distance, F: feedrate });
                                            }}
                                            disabled={!canClickY}
                                            title={i18n._('Move Y+')}
                                        >
                                            <KeypadText>Y</KeypadText>
                                            <KeypadDirectionText>+</KeypadDirectionText>
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: distance, Y: distance, F: feedrate });
                                            }}
                                            disabled={!canClickXY}
                                            title={i18n._('Move X+ Y+')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-up', styles['rotate-45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(
                                                styles.btnKeypad,
                                                styles.btnUp,
                                                { [styles.highlight]: highlightZ }
                                            )}
                                            onClick={() => {
                                                const distance = actions.getZJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ Z: distance, F: feedrate });
                                            }}
                                            disabled={!canClickZ}
                                            title={i18n._('Move Z+')}
                                        >
                                            <KeypadText>Z</KeypadText>
                                            <KeypadDirectionText>+</KeypadDirectionText>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.rowSpace}>
                            <div className="row no-gutters">
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(
                                                styles.btnKeypad,
                                                styles.btnLeft,
                                                { [styles.highlight]: highlightX }
                                            )}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: -distance, F: feedrate });
                                            }}
                                            disabled={!canClickX}
                                            title={i18n._('Move X-')}
                                        >
                                            <KeypadText>X</KeypadText>
                                            <KeypadDirectionText>-</KeypadDirectionText>
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(
                                                styles.btnKeypad,
                                                styles.btnRight
                                            )}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: distance, F: feedrate });
                                            }}
                                            disabled={!canClickX}
                                            title={i18n._('Move X+')}
                                        >
                                            <KeypadText>X</KeypadText>
                                            <KeypadDirectionText>+</KeypadDirectionText>
                                        </button>
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
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ X: -distance, Y: -distance, F: feedrate });
                                            }}
                                            disabled={!canClickXY}
                                            title={i18n._('Move X- Y-')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-down', styles['rotate-45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(
                                                styles.btnKeypad,
                                                styles.btnDown,
                                                { [styles.highlight]: highlightY }
                                            )}
                                            onClick={() => {
                                                const distance = actions.getXYJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ Y: -distance, F: feedrate });
                                            }}
                                            disabled={!canClickY}
                                            title={i18n._('Move Y-')}
                                        >
                                            <KeypadText>Y</KeypadText>
                                            <KeypadDirectionText>-</KeypadDirectionText>
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(styles.btnKeypad, styles.hidden)}
                                            onClick={() => {
                                                const distance = actions.getJogDistance();
                                                actions.jog({ X: distance, Y: -distance });
                                            }}
                                            disabled={!canClickXY}
                                            title={i18n._('Move X+ Y-')}
                                        >
                                            <i className={cx('fa', 'fa-arrow-circle-down', styles['rotate--45deg'])} style={{ fontSize: 16 }} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-xs-3">
                                    <div className={styles.colSpace}>
                                        <button
                                            className={cx(
                                                styles.btnKeypad,
                                                styles.btnDown,
                                                { [styles.highlight]: highlightZ }
                                            )}
                                            onClick={() => {
                                                const distance = actions.getZJogDistance();
                                                const feedrate = actions.getFeedrate();
                                                actions.jog({ Z: -distance, F: feedrate });
                                            }}
                                            disabled={!canClickZ}
                                            title={i18n._('Move Z-')}
                                        >
                                            <KeypadText>Z</KeypadText>
                                            <KeypadDirectionText>-</KeypadDirectionText>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cx('col-xs-4', styles.flexCol)}>
                        <button className={styles.movementRateButton} onClick={() => actions.changeMovementRates(20, 10, 5000)}>
                            Rapid
                        </button>
                        <button className={styles.movementRateButton} onClick={() => actions.changeMovementRates(5, 2, 3000)}>
                            Normal
                        </button>
                        <button className={styles.movementRateButton} onClick={() => actions.changeMovementRates(0.5, 0.1, 1000)}>
                            Precise
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default Keypad;
