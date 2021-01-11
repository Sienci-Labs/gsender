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

class NewKeypad extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            xyDistance: 1,
            zdistance: 1,
            setSpeed: 0,
            units: ''
        };
    }


    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([Constants.IMPERIAL_UNITS, Constants.METRIC_UNITS]),
        axes: PropTypes.array,
        jog: PropTypes.object,
        actions: PropTypes.object
    };

    handlePreciseSpeedButton = (cncUnits) => {
        console.log('speed is set to ' + cncUnits);
        if (this.state.units === Constants.IMPERIAL_UNITS) {
            this.setState({
                setSpeed: Constants.PRECISE_TOGGLE_SPEED_IMPERIAL
            });
        } return {
            setSpeed: Constants.PRECISE_TOGGLE_SPEED_METRIC
        };
    }
    handleNormalSpeedButton = (cncUnits) => {
        console.log('speed is set to ' + cncUnits);
        if (this.state.units === Constants.IMPERIAL_UNITS) {
            this.setState(prevState => {
                return {
                    setSpeed: Constants.NORMAL_TOGGLE_SPEED_IMPERIAL
                };
            });
        } return {
            setSpeed: Constants.NORMAL_TOGGLE_SPEED_METRIC
        };
    }

    handleFastSpeedButton = (cncUnits) => {
        console.log('speed is set to ' + cncUnits);
        if (this.state.units === Constants.IMPERIAL_UNITS) {
            this.setState(prevState => {
                return {
                    setSpeed: Constants.FAST_TOGGLE_SPEED_IMPERIAL
                };
            });
        } return {
            setSpeed: Constants.FAST_TOGGLE_SPEED_METRIC
        };
    }

    handleXYMove = (event) => {
        const { actions } = this.props;
        let xyDistance = event.target.value;
        actions.selectStep(xyDistance);
        console.log('XYdistance is set to ' + xyDistance);
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
        console.log('Zdistance is set to ' + zDistance);
        this.setState(prevState => {
            return {
                zdistance: zDistance
            };
        });
    }

    handleSpeed = (event) => {
        let headSpeed = event.target.value;
        console.log('CNCHEADSPEED  is set to ' + headSpeed);
        this.setState(prevState => {
            return {
                speed: headSpeed
            };
        });
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
        const canClickZ = canClick && _includes(axes, 'z');
        const { units } = this.state;
        return (
            <div className="controlsContainer">
                <div className="mainControls">
                    <div className="topThreeMainControls">
                        <div className="upperLeftTriangle">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ x: -distance, y: distance });
                                }}
                                role="button"
                                disabled={!canClickZ}
                                title={i18n._('Move X- Y+')}
                            >
                            </div>
                        </div>
                        <div className="upArrow">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ Y: distance });
                                }}
                                role="button"
                                disabled={!canClickY}
                                title={i18n._('Move Y+')}
                            ><span className="buttonText">Y+</span>
                            </div>
                        </div>
                        <div className="upperRightTriangle">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ X: distance, Y: distance });
                                }}
                                role="button"
                                disabled={!canClickXY}
                                title={i18n._('Move X+ Y+')}
                            >
                            </div>
                        </div>
                    </div>
                    <div className="middleControls">
                        <div className="leftArrow">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ X: -distance });
                                }}
                                disabled={!canClickX}
                                title={i18n._('Move X-')}
                                role="button"
                            ><span className="buttonText">X-</span>
                            </div>
                        </div>
                        <div className="rightArrow">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ X: distance });
                                }}
                                disabled={!canClickX}
                                title={i18n._('Move X+')}
                                role="button"
                            >
                                <span className="buttonText">X+</span>
                            </div>
                        </div>
                    </div>
                    <div className="bottomControls">
                        <div className="lowerLeftTriangle">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ X: -distance, Y: -distance });
                                }}
                                disabled={!canClickXY}
                                s title={i18n._('Move X- Y-')}
                                role="button"
                            >
                            </div>
                        </div>
                        <div className="downArrow">
                            <div
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ Y: -distance });
                                }}
                                disabled={!canClickY}
                                title={i18n._('Move Y-')}
                                role="button"
                            ><span className="buttonText">Y-</span>
                            </div>
                        </div>
                        <div className="lowerRightTriangle">
                            <div
                                className="leftArrow"
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    actions.jog({ X: distance, Y: -distance });
                                }}
                                disabled={!canClickXY}
                                title={i18n._('Move X+ Y-')}
                                role="button"
                            >
                            </div>
                        </div>
                    </div>
                    <div className="zControls">
                        <div
                            className="upArrowZ"
                            onClick={() => {
                                const distance = this.state.zdistance;
                                actions.jog({ Z: distance });
                            }}
                            disabled={!canClickZ}
                            title={i18n._('Move Z+')}
                            role="button"
                        ><span className="buttonText">Z+</span>
                        </div>
                        <div
                            disabled={!canClickZ}
                            className="downArrowZ"
                            onClick={() => {
                                const distance = this.state.zdistance;
                                actions.jog({ Z: distance });
                            }}
                            title={i18n._('Move Z-')}
                            role="button"
                        ><span className="buttonText">Z-</span>
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
                <div>
                    <div className="rollingNumbers">
                        <div className="rollingXYMove">
                            <label className="htmlLabels" htmlFor="firstToggleNumber">XY Move</label>
                            <input
                                disabled={!canClickXY}
                                onChange={this.handleXYMove}
                                type="number"
                                className="rollingXYInput"
                                name="xyMove"
                                min="0"
                                max="10"
                                step="1"
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
                                min="0"
                                max="10"
                                step="1"
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
                                type="number"
                                name="speedMove"
                                min="0"
                                max="10"
                                step="1"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default NewKeypad;
