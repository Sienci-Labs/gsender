import ensureArray from 'ensure-array';
import frac from 'frac';
import _includes from 'lodash/includes';
import _uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { MenuItem } from 'app/components/Dropdown';
import { Button } from 'app/components/Buttons';
import Space from 'app/components/Space';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import Fraction from './components/Fraction';
import * as Constants from '../../constants';
import './styles.css';
// import Dropdown from 'app/components/Dropdown';
// import Repeatable from 'react-repeatable';
// import { useState } from 'react'

class Keypad extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            xyDistance: 0,
            zdistance: 0,
            setSpeed: 0,
            units: props.units
        };
    }


    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([Constants.IMPERIAL_UNITS, Constants.METRIC_UNITS]),
        axes: PropTypes.array,
        jog: PropTypes.object,
        actions: PropTypes.object
    };

    componentWillMount() {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[1],
                xyDistance: Constants.METRIC_DISTANCE_XY[1],
                zdistance: Constants.METRIC_DISTANCE_Z[1]
            });
        } else {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[1],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[1],
                zDistance: Constants.IMPERIAL_DISTANCE_Z[1]
            });
        }
    }

    handlePreciseSpeedButton = () => {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[2],
                xyDistance: Constants.METRIC_DISTANCE_XY[2],
                zDistance: Constants.METRIC_DISTANCE_Z[2]
            });
        } else {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[2],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[2],
                zDistance: Constants.IMPERIAL_DISTANCE_Z[2]
            });
        }
    }

    handleNormalSpeedButton = () => {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[1],
                xyDistance: Constants.METRIC_DISTANCE_XY[1],
                zDistance: Constants.METRIC_DISTANCE_Z[1]
            });
        } else {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[1],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[1],
                zDistance: Constants.IMPERIAL_DISTANCE_Z[1]
            });
        }
    }

    handleFastSpeedButton = () => {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[0],
                xyDistance: Constants.METRIC_DISTANCE_XY[0],
                zDistance: Constants.METRIC_DISTANCE_Z[0]
            });
        } else {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[0],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[0],
                zDistance: Constants.IMPERIAL_DISTANCE_Z[0]
            });
        }
    }

    handleXYMove = (event) => {
        const { actions } = this.props;
        let xyDistance = event.target.value;
        actions.selectStep(xyDistance);
        this.setState(prevState => {
            return {
                xyDistance: xyDistance
            };
        });
    }

    handleZMove = (event) => {
        const { actions } = this.props;
        let zDistance = event.target.value;
        actions.selectStep(zDistance);
        this.setState(prevState => {
            return {
                zdistance: zDistance
            };
        });
    }

    handleSpeed = (event) => {
        let headSpeed = event.target.value;
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState(prevState => {
                return {
                    setSpeed: headSpeed
                };
            });
        } return {
            setSpeed: headSpeed
        };
    }

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
            ...Constants.IMPERIAL_STEPS
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
            ...Constants.METRIC_STEPS
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
        const { canClick, axes, actions } = this.props;
        const canClickX = canClick && _includes(axes, 'x');
        const canClickY = canClick && _includes(axes, 'y');
        const canClickXY = canClickX && canClickY;
        let disable = true;

        if (canClick === true) {
            disable = !disable;
        }
        const { units } = this.state;

        return (
            <div className="controlsContainer">
                <div className="uppercontrols">
                    <div className="mainControls">
                        <div className="topThreeMainControls">
                            <div
                                className={disable ? 'upperLeftTrianglehide' : 'upperLeftTriangle'}
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    const toggledSpeed = this.state.setSpeed;
                                    actions.jog({ x: -distance, y: distance }, { F: toggledSpeed });
                                }}
                                role="button"
                                tabIndex={0}
                            >
                            </div>
                            <div
                                className={disable ? 'upArrowHide' : 'upArrow'}
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    const toggledSpeed = this.state.setSpeed;
                                    actions.jog({ Y: distance }, { F: toggledSpeed });
                                }}
                                role="button"
                                tabIndex={0}
                                title={i18n._('Move Y+')}
                            >
                                <span className="buttonText">Y+</span>
                            </div>
                            <div>
                                <div
                                    className={disable ? 'upperRightTriangleHide' : 'upperRightTriangle'}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: distance, Y: distance }, { F: toggledSpeed });
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    title={i18n._('Move X+ Y+')}
                                >
                                </div>
                            </div>
                        </div>
                        <div className="middleControls">
                            <div>
                                <div
                                    className={disable ? 'leftArrowHide' : 'leftArrow'}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: -distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    title={i18n._('Move X-')}
                                    role="button"
                                ><span className="buttonText">X-</span>
                                </div>
                            </div>
                            <div>
                                <div
                                    className={disable ? 'rightArrowHide' : 'rightArrow'}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    title={i18n._('Move X+')}
                                    role="button"
                                >
                                    <span className="buttonText">X+</span>
                                </div>
                            </div>
                        </div>
                        <div className="bottomControls">
                            <div>
                                <div
                                    className={disable ? 'lowerLeftTriangleHide' : 'lowerLeftTriangle'}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: -distance, Y: -distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    s title={i18n._('Move X- Y-')}
                                    role="button"
                                >
                                </div>
                            </div>
                            <div>
                                <div
                                    className={disable ? 'downArrowHide' : 'downArrow'}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ Y: -distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    title={i18n._('Move Y-')}
                                    role="button"
                                ><span className="buttonText">Y-</span>
                                </div>
                            </div>
                            <div>
                                <div
                                    className={disable ? 'lowerRightTriangleHide' : 'lowerRightTriangle'}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: distance, Y: -distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    title={i18n._('Move X+ Y-')}
                                    role="button"
                                >
                                </div>
                            </div>
                        </div>
                        <div className="zControls">
                            <div
                                className={disable ? 'upArrowZHide' : 'upArrowZ'}
                                onClick={() => {
                                    const distance = this.state.zdistance;
                                    const toggledSpeed = this.state.setSpeed;
                                    actions.jog({ Z: distance }, { F: toggledSpeed });
                                }}
                                tabIndex={0}
                                title={i18n._('Move Z+')}
                                role="button"
                            ><span className="buttonTextZ">Z+</span>
                            </div>
                            <div
                                className={disable ? 'downArrowZHide' : 'downArrowZ'}
                                onClick={() => {
                                    const distance = this.state.zdistance;
                                    const toggledSpeed = this.state.setSpeed;
                                    actions.jog({ Z: distance }, { F: toggledSpeed });
                                }}
                                title={i18n._('Move Z-')}
                                role="button"
                                tabIndex={0}
                            ><span className="buttonTextZ">Z-</span>
                            </div>
                        </div>
                        <div className="speedButtonGroup">
                            <Button
                                disabled={!canClickXY}
                                onClick={() => {
                                    this.handlePreciseSpeedButton(units);
                                }}
                                className="preciseSpeedButton"
                            >
                                Precise
                            </Button>
                            <Button
                                disabled={!canClickXY}
                                onClick={() => {
                                    this.handleNormalSpeedButton(units);
                                }}
                                className="normalSpeedButton"
                            >
                                Normal
                            </Button>
                            <Button
                                disabled={!canClickXY}
                                onClick={() => {
                                    this.handleFastSpeedButton(units);
                                }}
                                className="fastSpeedButton"
                            >
                                Fast
                            </Button>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="rollingNumbers">
                        <div className="rollingXYMove">
                            <label
                                className="htmlLabels"
                                htmlFor="firstToggleNumber"
                            >XY Move
                            </label>
                            <input
                                disabled={!canClickXY}
                                onChange={this.handleXYMove}
                                type="number"
                                className="rollingXYInput"
                                name="xyMove"
                                min="1"
                                max="10"
                                step="1"
                                defaultValue={this.state.xyDistance}
                                value={this.state.xyDistance}
                            />
                        </div>
                        <div className="rollingZMove">
                            <label
                                className="htmlLabels"
                                htmlFor="secondToggleNumber"
                            >
                                Z Move
                            </label>
                            <input
                                disabled={!canClickXY}
                                onChange={this.handleZMove}
                                className="rollingZInput"
                                type="number"
                                name="zMove"
                                min="1"
                                max="10"
                                step="1"
                                defaultValue={this.state.zdistance}
                                value={this.state.zDistance}
                            />
                        </div>
                        <div className="rollingSpeed">
                            <label
                                className="htmlLabels"
                                htmlFor="thirdToggleNumber"
                            >
                                Speed
                            </label>
                            <input
                                disabled={!canClickXY}
                                onChange={this.handleSpeed}
                                className="rollingSpeedInput"
                                name="speedMove"
                                min="0"
                                max="10"
                                step="1"
                                defaultValue={this.state.setSpeed}
                                value={this.state.setSpeed}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Keypad;
