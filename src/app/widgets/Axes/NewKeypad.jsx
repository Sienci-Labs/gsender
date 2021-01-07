import cx from 'classnames';
import ensureArray from 'ensure-array';
import frac from 'frac';
import _includes from 'lodash/includes';
import _uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from 'app/components/Buttons';
import { MenuItem } from 'app/components/Dropdown';
import Space from 'app/components/Space';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import Fraction from './components/Fraction';
import * as Constants from '../../constants';
import styles from './index.styl';
import './styles.css';
// import PRECISE_MOVEMENT from './constants';
// import Dropdown from 'app/components/Dropdown';
// import Repeatable from 'react-repeatable';
// import { useState } from 'react'

class NewKeypad extends PureComponent {
    constructor() {
        super(0, 0);
        this.state = {
            xyDistance: 0,
            incomingSpeed: 0,
            Distance: 0

        };
        this.handleButtons = this.handleButtons.bind(this);
    }


    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([Constants.IMPERIAL_UNITS, Constants.METRIC_UNITS]),
        axes: PropTypes.array,
        jog: PropTypes.object,
        actions: PropTypes.object
    };

    handleButtons = (incomingSpeed) => {
        console.log('speed is set to ' + incomingSpeed);
        this.setState(prevState => {
            return {
                speed: incomingSpeed
            };
        });
    }

    handleXYMove = (event) => {
        let xyDistance = event.target.value;
        console.log('XYdistance is set to ' + xyDistance);
        this.setState(prevState => {
            return {
                xyDistance: xyDistance
            };
        });
    }

    handleZMove = (event) => {
        let zDistance = event.target.value;
        console.log('Zdistance is set to ' + zDistance);
        this.setState(prevState => {
            return {
                distance: zDistance
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
        const { canClick, axes, jog, actions } = this.props;
        const canClickX = canClick && _includes(axes, 'x');
        const canClickY = canClick && _includes(axes, 'y');
        const canClickXY = canClickX && canClickY;
        const canClickZ = canClick && _includes(axes, 'z');
        const highlightX = canClickX && (jog.keypad || jog.axis === 'x');
        // const highlightY = canClickY && (jog.keypad || jog.axis === 'y');
        // const highlightZ = canClickZ && (jog.keypad || jog.axis === 'z');

        const buttonStyles = {
            fontSize: 14,
            color: '#4a54f1',
            textAlign: 'center',
            backgroundcolor: 'Blue'
        };
        return (
            <div>
                <div>
                    <div>
                        <div>
                            <div>
                                <div className="flexParent">
                                    <div className="upperLeftTriangle">
                                        <Button
                                            onClick={() => {
                                                const distance = actions.getJogDistance();
                                                actions.jog({ X: -distance, Y: distance });
                                            }}
                                            disabled={!canClickXY}
                                            title={i18n._('Move X- Y+')}
                                        >
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <div className="upArrow">
                                        <Button
                                            onClick={() => {
                                                const distance = actions.getJogDistance();
                                                actions.jog({ Y: distance });
                                            }}
                                            disabled={!canClickY}
                                            title={i18n._('Move Y+')}
                                        >Y+
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <div className="upperRightTriangle">
                                        <Button
                                            onClick={() => {
                                                const distance = actions.getJogDistance();
                                                console.log('NEWDISTANCE ' + distance);
                                                actions.jog({ X: distance, Y: distance });
                                            }}
                                            disabled={!canClickXY}
                                            title={i18n._('Move X+ Y+')}
                                        >
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <Button
                                        className="upArrow"
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ Z: distance });
                                        }}
                                        disabled={!canClickZ}
                                        title={i18n._('Move Z+')}
                                    >Z+
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>
                            <div>
                                <div className="leftArrow">
                                    <Button
                                        btnStyle="flat"
                                        compact
                                        className={cx(
                                            styles.btnKeypad,
                                            { [styles.highlight]: highlightX }
                                        )}
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ X: -distance });
                                        }}
                                        disabled={!canClickX}
                                        title={i18n._('Move X-')}
                                    >X-
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <div className="lowerRightTriangle">
                                </div>
                            </div>
                            <div>
                                <div className="rightArrow">
                                    <Button
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ X: distance });
                                        }}
                                        disabled={!canClickX}
                                        title={i18n._('Move X+')}
                                    >
                                    X+
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <div className={styles.colSpace}>
                                    <Button
                                        className="downArrow"
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ Z: -distance });
                                        }}
                                        disabled={!canClickZ}
                                        title={i18n._('Move Z-')}
                                    >Z-
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>
                            <div>
                                <div className="lowerLeftTriangle">
                                    <Button
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ X: -distance, Y: -distance });
                                        }}
                                        disabled={!canClickXY}
                                        title={i18n._('Move X- Y-')}
                                    >
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <div className="downArrow">
                                    <Button
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ Y: -distance });
                                        }}
                                        disabled={!canClickY}
                                        title={i18n._('Move Y-')}
                                    >Y-
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <div className="lowerRightTriangle">
                                    <Button
                                        className="leftArrow"
                                        onClick={() => {
                                            const distance = actions.getJogDistance();
                                            actions.jog({ X: distance, Y: -distance });
                                        }}
                                        disabled={!canClickXY}
                                        title={i18n._('Move X+ Y-')}
                                    >
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="speedButtonGroup">
                    <div>
                        <Button
                            style={ buttonStyles }
                            disabled={!canClickXY}
                            onClick={ () => {
                                console.log(Constants.XY_PRECISE_TOGGLE_SPEED_METRIC);
                                this.handleButtons(Constants.XY_PRECISE_TOGGLE_SPEED_METRIC);
                            }}
                            className="speedButtons"
                        >
                                Precise
                        </Button>
                        <Button
                            style={ buttonStyles }
                            disabled={!canClickXY}
                            onClick={() => {
                                console.log(Constants.XY_NORMAL_TOGGLE_SPEED_METRIC);
                                this.handleButtons(Constants.XY_NORMAL_TOGGLE_SPEED_METRIC);
                            }}
                            className="speedButtons"
                        >
                                Normal
                        </Button>
                        <Button
                            style={ buttonStyles }
                            disabled={!canClickXY}
                            onClick={() => {
                                console.log(Constants.Z_FAST_TOGGLE_SPEED_METRIC);
                                this.handleButtons(Constants.Z_FAST_TOGGLE_SPEED_METRIC);
                            }}
                            className="speedButtons"
                        >
                                Fast
                        </Button>
                    </div>
                </div>
                <div className="rollingNumbers">
                    <label className={styles.toggleText} htmlFor="firstToggleNumber">XY Move</label>
                    <input
                        disabled={!canClickXY}
                        onChange={this.handleXYMove}
                        type="number" name="xyMove" id="firstToggleNumber" min="0" max="1" step="0.01"
                    />
                    <label htmlFor="secondToggleNumber">Z Move</label>
                    <input
                        disabled={!canClickXY}
                        onChange={this.handleZMove}
                        className="" type="number" name="change" id="secondToggleNumber" min="0" max="1" step="0.01"
                    />
                    <label htmlFor="thirdToggleNumber">Speed</label>
                    <input
                        disabled={!canClickXY}
                        onChange={this.handleSpeed}
                        className="" type="number" name="change" id="thirdToggleNumber" min="0" max="1" step="0.01"
                    />
                </div>
            </div>
        );
    }
}

export default NewKeypad;
