/* eslint-disable jsx-a11y/click-events-have-key-events */
import ensureArray from 'ensure-array';
import frac from 'frac';
import Widget from 'app/components/Widget';
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

class Keypad extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            units: props.units,
            lastXYSteps: [],
            setSpeed: 10000
        };
    }

    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([Constants.IMPERIAL_UNITS, Constants.METRIC_UNITS]),
        axes: PropTypes.array,
        jog: PropTypes.object,
        actions: PropTypes.object,
        xyDistance: PropTypes.number,
        zdistance: PropTypes.number,
        setSpeed: PropTypes.number,
        userHasNStops: PropTypes.bool,
        jogDistance: PropTypes.number,
        metricMaxDistance: PropTypes.number,
        imperialMaxDistance: PropTypes.number,
        zMaxMovementMetric: PropTypes.number,
        zMaxMovementImperial: PropTypes.number,
        MaximumheadSpeed: PropTypes.number,
        clicked: PropTypes.bool
    };

    //Used to populate forms with default values
    componentWillMount() {
        console.log(this.props.units + 'PROPSUNITS');
        if (this.props.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[1],
                xyDistance: Constants.METRIC_DISTANCE_XY[1],
                zdistance: Constants.METRIC_DISTANCE_Z[1],
                maxDistanceHeadCanTravel: this.props.metricMaxDistance,
                zMaxMovement: this.props.zMaxMovementMetric,
                MaximumheadSpeed: this.props.MaximumheadSpeed
            });
        } else if (this.props.units === Constants.IMPERIAL_UNITS) {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[1],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[1],
                zdistance: Constants.IMPERIAL_DISTANCE_Z[1],
                maxDistanceHeadCanTravel: this.props.imperialMaxDistance,
                zMaxMovement: this.props.zMaxMovementImperial,
                MaximumheadSpeed: this.props.MaximumheadSpeed
            });
        }
    }

    handlePreciseSpeedButton = () => {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[2],
                xyDistance: Constants.METRIC_DISTANCE_XY[2],
                zdistance: Constants.METRIC_DISTANCE_Z[2]
            });
        } else if (this.state.units === Constants.IMPERIAL_UNITS) {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[2],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[2],
                zdistance: Constants.IMPERIAL_DISTANCE_Z[2]
            });
        }
    }

    handleNormalSpeedButton = () => {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[1],
                xyDistance: Constants.METRIC_DISTANCE_XY[1],
                zdistance: Constants.METRIC_DISTANCE_Z[1]
            });
        } else if (this.state.units === Constants.IMPERIAL_UNITS) {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[1],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[1],
                zdistance: Constants.IMPERIAL_DISTANCE_Z[1]
            });
        }
    }

    handleRapidSpeedButton = () => {
        if (this.state.units === Constants.METRIC_UNITS) {
            this.setState({
                setSpeed: Constants.METRIC_SPEEDS[0],
                xyDistance: Constants.METRIC_DISTANCE_XY[0],
                zdistance: Constants.METRIC_DISTANCE_Z[0]
            });
        } else if (this.state.units === Constants.IMPERIAL_UNITS) {
            this.setState({
                setSpeed: Constants.IMPERIAL_SPEEDS[0],
                xyDistance: Constants.IMPERIAL_DISTANCE_XY[0],
                zdistance: Constants.IMPERIAL_DISTANCE_Z[0]
            });
        }
    }

    handleXYMove = (event) => {
        const { actions } = this.props;
        let xyDistance = event.target.value;
        let max = this.state.maxDistanceHeadCanTravel;
        if (xyDistance <= max) {
            this.setState({ xyDistance: xyDistance });
        } else {
            this.setState({ xyDistance: max });
        }
        if (xyDistance < 0) {
            this.setState({ xyDistance: 1 });
        }
        actions.setXYParentState(xyDistance, this.state.xyDistance);
    }

    handleZToggle = (event) => {
        const { actions } = this.props;
        let distanceZ = event.target.value;
        let max = this.state.zMaxMovement;
        if (distanceZ <= max) {
            this.setState({ zdistance: distanceZ });
        } else {
            this.setState({ zdistance: max });
        }
        if (distanceZ < 0) {
            this.setState({ zdistance: 1 });
        }
        actions.setZParentState(distanceZ, this.state.zdistance);
    }

    handleSpeed = (event) => {
        const { actions } = this.props;
        let headSpeed = event.target.value;
        let max = this.state.maxSpeedSpindle;
        if (headSpeed <= max) {
            this.setState({ setSpeed: headSpeed });
        } else {
            this.setState({ setSpeed: max });
        }
        actions.setSpeedState(headSpeed, this.state.MaximumheadSpeed);
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

    handleToggleClicks() {
        console.log('CLICKED');
        this.props.clicked = !this.props.clicked;
    }

    getStepDistanceXY(step) {
        this.state.lastXYSteps.push(step);
        let lastTwo = this.state.lastXYSteps.slice(-2);
        let hundreds = ['200', '100'];
        let tens = ['20', '10'];
        let ones = ['2', '1'];
        if (this.state.lastXYSteps.length > 3) {
            this.state.lastXYSteps.splice(0, 1);
        }

        function arrayEquals(a, b) {
            return Array.isArray(a) &&
                Array.isArray(b) &&
                a.length === b.length &&
                a.every((val, index) => val === b[index]);
        }

        if (this.state.units === Constants.METRIC_UNITS) {
            if (step >= 100) {
                let answer = arrayEquals(lastTwo, hundreds);
                if (answer === true) {
                    return 10;
                } else {
                    return 100;
                }
            } else if (step >= 10) {
                let answer = arrayEquals(lastTwo, tens);
                if (answer === true) {
                    return 1;
                } else {
                    return 10;
                }
            } else if (step >= 0) {
                let answer = arrayEquals(lastTwo, ones);
                if (answer === true) {
                    return 1;
                }
            }
        } return 1;
    }


    render() {
        const { canClick, axes, actions, units } = this.props;
        console.log(this.props.units + 'PROPSUNITSRENDER');
        const canClickX = canClick && _includes(axes, 'x');
        const canClickY = canClick && _includes(axes, 'y');
        const canClickXY = canClickX && canClickY;
        let disable = true;
        if (canClick === true) {
            disable = !disable;
        }
        let upperLeftClass;
        let upperRightClass;
        let lowerRightClass;
        let lowerLeftClass;

        if (!this.props.userHasNStops) {
            upperLeftClass = 'upperLeftTriangleHide';
            upperRightClass = 'upperRightTriangleHide';
            lowerRightClass = 'lowerRightTriangleHide';
            lowerLeftClass = 'lowerLeftTriangleHide';
        } else if (disable === true) {
            upperLeftClass = 'upperLeftTriangleDisabled';
            upperRightClass = 'upperRightTriangleDisabled';
            lowerRightClass = 'lowerRightTriangleDisabled';
            lowerLeftClass = 'lowerLeftTriangleDisabled';
        } else {
            upperLeftClass = 'upperLeftTriangle';
            upperRightClass = 'upperRightTriangle';
            lowerRightClass = 'lowerRightTriangle';
            lowerLeftClass = 'lowerLeftTriangle';
        }

        const { xyDistance } = this.state;
        console.log(this.state.zdistance);
        return (
            <div className="controlsContainer">
                <div className="uppercontrols">
                    <div className="mainControls">
                        <div className="topThreeMainControls">
                            <div
                                className={upperLeftClass}
                                onClick={() => {
                                    const distance = this.state.xyDistance;
                                    const toggledSpeed = this.state.setSpeed;
                                    actions.jog({ x: -distance, y: distance }, { F: toggledSpeed });
                                }}
                                role="button"
                                tabIndex={0}
                            />
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
                                    className={upperRightClass}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: distance, Y: distance }, { F: toggledSpeed });
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    title={i18n._('Move X+ Y+')}
                                />
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
                                ><span className="buttonTextX-">X-</span>
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
                                    <span className="buttonTextXPlus">X+</span>
                                </div>
                            </div>
                        </div>
                        <div className="bottomControls">
                            <div>
                                <div
                                    className={lowerLeftClass}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: -distance, Y: -distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    title={i18n._('Move X- Y-')}
                                    role="button"
                                />
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
                                ><span className="buttonTextY">Y-</span>
                                </div>
                            </div>
                            <div>
                                <div
                                    className={lowerRightClass}
                                    onClick={() => {
                                        const distance = this.state.xyDistance;
                                        const toggledSpeed = this.state.setSpeed;
                                        actions.jog({ X: distance, Y: -distance }, { F: toggledSpeed });
                                    }}
                                    tabIndex={0}
                                    title={i18n._('Move X+ Y-')}
                                    role="button"
                                />
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
                                actions.jog({ Z: -distance }, { F: toggledSpeed });
                            }}
                            title={i18n._('Move Z-')}
                            role="button"
                            tabIndex={0}
                        ><span className="buttonTextZ-">Z-</span>
                        </div>
                    </div>
                    <div className="speedButtonGroup">
                        <Widget.Button
                            title={i18n._('Keypad jogging')}
                            className="buttonWidget"
                        >
                            <i
                                onClick={actions.toggleKeypadJogging}
                                className={!this.props.clicked ? 'fa fa-keyboard-o' : 'fa fa-keyboard-o fa-enabled'}
                                id={disable ? 'keyboardDisabled' : 'keyboard'
                                }
                                role="button"
                                tabIndex={0}
                            />
                        </Widget.Button>
                        <Button
                            disabled={!canClickXY}
                            onClick={() => {
                                this.handleRapidSpeedButton(units);
                            }}
                            className="rapidSpeedButton"
                        >
                            Rapid
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
                                this.handlePreciseSpeedButton(units);
                            }}
                            className="preciseSpeedButton"
                        >
                            Precise
                        </Button>
                    </div>
                </div>
                <div className="rollingNumbers">
                    <div className="rollingXYMove">
                        <label
                            className="htmlLabels"
                            htmlFor="firstToggleNumber"
                        >XY Move {`(${this.state.units})`}
                        </label>
                        <input
                            id="inputSteps"
                            disabled={!canClickXY}
                            onChange={this.handleXYMove}
                            type="number"
                            className="rollingXYInput"
                            name="xyMove"
                            max={this.props.metricMaxDistance}
                            min="0"
                            step={this.getStepDistanceXY(xyDistance)}
                            value={this.state.xyDistance}
                        />
                    </div>
                    <div className="rollingZMove">
                        <label
                            className="htmlLabels"
                            htmlFor="secondToggleNumber"
                        >
                            Z Move {`(${this.state.units})`}
                        </label>
                        <input
                            disabled={!canClickXY}
                            onChange={this.handleZToggle}
                            className="rollingZInput"
                            type="number"
                            name="zMove"
                            min="1"
                            max={this.state.zMaxMovement}
                            step="1"
                            value={this.state.zdistance}
                        />
                    </div>
                    <div className="rollingSpeed">
                        <label
                            className="htmlLabels"
                            htmlFor="thirdToggleNumber"
                        >
                            Speed {`(${this.state.units}/min)`}
                        </label>
                        <input
                            disabled={!canClickXY}
                            onChange={this.handleSpeed}
                            className="rollingSpeedInput"
                            type="number"
                            name="speedMove"
                            min="0"
                            max="10000"
                            step="500"
                            value={this.state.setSpeed}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default Keypad;
