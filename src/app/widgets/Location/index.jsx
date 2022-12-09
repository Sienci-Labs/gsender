/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import cx from 'classnames';
import ensureArray from 'ensure-array';
import get from 'lodash/get';
import includes from 'lodash/includes';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import store from 'app/store';
import { connect } from 'react-redux';
import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import gamepad, { runAction } from 'app/lib/gamepad';
import Widget from 'app/components/Widget';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import { mapPositionToUnits } from 'app/lib/units';
import Select from 'react-select';
import { limit } from 'app/lib/normalize-range';
import WidgetConfig from 'app/widgets/WidgetConfig';
import Location from './Location';
import Settings from './Settings';
import ShuttleControl from './ShuttleControl';
import {
    // Units
    IMPERIAL_UNITS,
    IMPERIAL_STEPS,
    METRIC_UNITS,
    METRIC_STEPS,
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_RUN,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    // TinyG
    TINYG,
    // Workflow
    WORKFLOW_STATE_RUNNING,
    WORKFLOW_STATE_IDLE,
    LOCATION_CATEGORY,
    JOGGING_CATEGORY,
    AXIS_X,
    AXIS_Y,
    AXIS_Z,
} from '../../constants';
import {
    MODAL_NONE,
    MODAL_SETTINGS,
    DEFAULT_AXES,
    XY_MAX,
    XY_MIN,
    Z_MAX,
    Z_MIN,
    FEEDRATE_MAX,
    FEEDRATE_MIN
} from './constants';
import styles from './index.styl';
import useKeybinding from '../../lib/useKeybinding';

class LocationWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    pubsubTokens = [];

    workspaceSelectRef = React.createRef();

    subscribe() {
        const tokens = [
            pubsub.subscribe('jogSpeeds', (msg, speeds) => {
                this.setState({ jog: {
                    ...this.state.jog,
                    speeds: {
                        ...speeds
                    },
                } });
            }),
            pubsub.subscribe('keybindingsUpdated', () => {
                this.updateShuttleControlEvents();
            }),
            pubsub.subscribe('addKeybindingsListener', () => {
                this.addShuttleControlEvents();
            }),
            pubsub.subscribe('removeKeybindingsListener', () => {
                this.removeShuttleControlEvents();
            }),
            pubsub.subscribe('units:change', (event, units) => {
                this.changeUnits(units);
            }),
            pubsub.subscribe('safeHeight:update', (event, value) => {
                this.setState({
                    safeRetractHeight: value
                });
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    getWorkCoordinateSystem = () => {
        const controllerState = this.props.state;

        const defaultWCS = 'G54';

        return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
    }

    actions = {
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState({ minimized: !minimized });
        },
        handleManualMovement: (value, axis) => {
            const { units } = this.state;
            const wcs = this.actions.getWorkCoordinateSystem();
            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;
            //const command = `G90 G0 ${axis.toUpperCase()}${value}`;
            const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
            const command = `G10 P${p} L20 ${axis.toUpperCase()}${value}`;
            controller.command('gcode:safe', command, modal);
        },
        getJogDistance: () => {
            const { units } = this.state;

            if (units === IMPERIAL_UNITS) {
                const step = this.config.get('jog.imperial.step');
                const imperialJogDistances = ensureArray(this.config.get('jog.imperial.distances', []));
                const imperialJogSteps = [
                    ...imperialJogDistances,
                    ...IMPERIAL_STEPS
                ];
                const distance = Number(imperialJogSteps[step]) || 0;
                return distance;
            }

            if (units === METRIC_UNITS) {
                const step = this.config.get('jog.metric.step');
                const metricJogDistances = ensureArray(this.config.get('jog.metric.distances', []));
                const metricJogSteps = [
                    ...metricJogDistances,
                    ...METRIC_STEPS
                ];
                const distance = Number(metricJogSteps[step]) || 0;
                return distance;
            }

            return 0;
        },
        getWorkCoordinateSystem: this.getWorkCoordinateSystem,
        setWorkOffsets: (axis, value) => {
            const wcs = this.actions.getWorkCoordinateSystem();
            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;
            axis = (axis || '').toUpperCase();
            value = Number(value) || 0;

            const gcode = `G10 L20 P${p} ${axis}${value}`;

            controller.command('gcode', gcode);
        },
        selectAxis: (axis = '') => {
            this.setState(state => ({
                jog: {
                    ...state.jog,
                    axis: axis
                }
            }));
        },
        selectStep: (value = '') => {
            const step = Number(value);
            this.setState(state => ({
                jog: {
                    ...state.jog,
                    imperial: {
                        ...state.jog.imperial,
                        step: (state.units === IMPERIAL_UNITS) ? step : state.jog.imperial.step,
                    },
                    metric: {
                        ...state.jog.metric,
                        step: (state.units === METRIC_UNITS) ? step : state.jog.metric.step
                    }
                }
            }));
        },
        stepForward: () => {
            this.setState(state => {
                const imperialJogSteps = [
                    ...state.jog.imperial.distances,
                    ...IMPERIAL_STEPS
                ];
                const metricJogSteps = [
                    ...state.jog.metric.distances,
                    ...METRIC_STEPS
                ];

                return {
                    jog: {
                        ...state.jog,
                        imperial: {
                            ...state.jog.imperial,
                            step: (state.units === IMPERIAL_UNITS)
                                ? limit(state.jog.imperial.step + 1, 0, imperialJogSteps.length - 1)
                                : state.jog.imperial.step
                        },
                        metric: {
                            ...state.jog.metric,
                            step: (state.units === METRIC_UNITS)
                                ? limit(state.jog.metric.step + 1, 0, metricJogSteps.length - 1)
                                : state.jog.metric.step
                        }
                    }
                };
            });
        },
        stepBackward: () => {
            this.setState(state => {
                const imperialJogSteps = [
                    ...state.jog.imperial.distances,
                    ...IMPERIAL_STEPS
                ];
                const metricJogSteps = [
                    ...state.jog.metric.distances,
                    ...METRIC_STEPS
                ];

                return {
                    jog: {
                        ...state.jog,
                        imperial: {
                            ...state.jog.imperial,
                            step: (state.units === IMPERIAL_UNITS)
                                ? limit(state.jog.imperial.step - 1, 0, imperialJogSteps.length - 1)
                                : state.jog.imperial.step,
                        },
                        metric: {
                            ...state.jog.metric,
                            step: (state.units === METRIC_UNITS)
                                ? limit(state.jog.metric.step - 1, 0, metricJogSteps.length - 1)
                                : state.jog.metric.step
                        }
                    }
                };
            });
        },
        stepNext: () => {
            this.setState(state => {
                const imperialJogSteps = [
                    ...state.jog.imperial.distances,
                    ...IMPERIAL_STEPS
                ];
                const metricJogSteps = [
                    ...state.jog.metric.distances,
                    ...METRIC_STEPS
                ];

                return {
                    jog: {
                        ...state.jog,
                        imperial: {
                            ...state.jog.imperial,
                            step: (state.units === IMPERIAL_UNITS)
                                ? (state.jog.imperial.step + 1) % imperialJogSteps.length
                                : state.jog.imperial.step,
                        },
                        metric: {
                            ...state.jog.metric,
                            step: (state.units === METRIC_UNITS)
                                ? (state.jog.metric.step + 1) % metricJogSteps.length
                                : state.jog.metric.step
                        }
                    }
                };
            });
        }
    };

    canSendCommand() {
        const { type, state, workflow, port } = this.props;

        if (!port) {
            return false;
        }
        if (!type || !state) {
            return false;
        }
        return workflow.state === WORKFLOW_STATE_IDLE;
    }

    shuttleControlFunctions = {
        JOG_SPEED: (event, { speed }) => {
            const { speeds } = this.state.jog;
            const newSpeeds = speeds;

            const xyStep = Number(newSpeeds.xyStep);
            const zStep = Number(newSpeeds.zStep);
            const feedrate = Number(newSpeeds.feedrate);

            let xyFactor;
            let zFactor;
            let feedrateFactor;

            const toFixed = (val) => val.toFixed(1);

            if (xyStep < 1) {
                xyFactor = 0.1;
            } else if (xyStep < 10) {
                xyFactor = 1;
            } else if (xyStep < 100) {
                xyFactor = 10;
            } else {
                xyFactor = 50;
            }

            if (zStep < 1) {
                zFactor = 0.1;
            } else if (zStep >= 1 && zStep < 10) {
                zFactor = 1;
            } else {
                zFactor = 5;
            }

            if (feedrate < 100) {
                feedrateFactor = 10;
            } else if (feedrate >= 100 && feedrate < 1000) {
                feedrateFactor = 100;
            } else if (feedrate >= 1000 && feedrate < 10000) {
                feedrateFactor = 1000;
            } else {
                feedrateFactor = 10000;
            }

            if (speed === 'increase') {
                newSpeeds.xyStep = xyStep + xyFactor < XY_MAX ? toFixed(xyStep + xyFactor) : XY_MAX;
                newSpeeds.zStep = zStep + zFactor < Z_MAX ? toFixed(zStep + zFactor) : Z_MAX;
                newSpeeds.feedrate = feedrate + feedrateFactor < FEEDRATE_MAX ? toFixed(feedrate + feedrateFactor) : FEEDRATE_MAX;
            } else {
                newSpeeds.xyStep = xyStep - xyFactor > XY_MIN ? toFixed(xyStep - xyFactor) : XY_MIN;
                newSpeeds.zStep = zStep - zFactor > Z_MIN ? toFixed(zStep - zFactor) : Z_MIN;
                newSpeeds.feedrate = feedrate - feedrateFactor > FEEDRATE_MIN ? toFixed(feedrate - feedrateFactor) : FEEDRATE_MIN;
            }

            pubsub.publish('jogSpeeds', newSpeeds);
        },
        ZERO_AXIS: (event, { axis }) => {
            const { state } = this.props;
            const activeState = get(state, 'status.activeState');
            if (!axis || activeState !== GRBL_ACTIVE_STATE_IDLE) {
                return;
            }

            const wcs = this.actions.getWorkCoordinateSystem();

            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;

            if (axis === 'all') {
                controller.command('gcode', `G10 L20 P${p} X0 Y0 Z0`);
                return;
            }

            axis = axis.toUpperCase();
            controller.command('gcode', `G10 L20 P${p} ${axis}0`);
        },
        GO_TO_AXIS_ZERO: (_, { axisList }) => {
            const { state } = this.props;
            const { machinePosition, safeRetractHeight, homingEnabled } = this.state;
            const activeState = get(state, 'status.activeState');
            if (!axisList || axisList.length === 0 || activeState !== GRBL_ACTIVE_STATE_IDLE) {
                return;
            }
            let safeHeightCommand = '';
            let moveCommand = '';

            if (safeRetractHeight !== 0 && !axisList.includes('Z') && !axisList.includes('z')) {
                if (homingEnabled) {
                    // get current Z
                    // eslint-disable-next-line dot-notation
                    const currentZ = Number(machinePosition['z']);
                    const retractHeight = (Math.abs(safeRetractHeight) * -1);
                    // only move Z if it is less than Z0-SafeHeight
                    if (currentZ < retractHeight) {
                        safeHeightCommand += `G53 G0 Z${retractHeight}\n`;
                    }
                } else {
                    safeHeightCommand += 'G91\n';
                    safeHeightCommand += `G0 Z${safeRetractHeight}\n`; // Retract Z when moving across workspace
                }
            }
            for (const axis of axisList) {
                moveCommand += `${axis.toUpperCase()}0 `;
            }

            controller.command('gcode', safeHeightCommand);
            controller.command('gcode', 'G90');
            controller.command('gcode', `G0 ${moveCommand}`);
        },
        JOG_LEVER_SWITCH: (event, { key = '' }) => {
            if (key === '-') {
                this.actions.stepBackward();
            } else if (key === '+') {
                this.actions.stepForward();
            } else {
                this.actions.stepNext();
            }
        },
    }

    shuttleControlEvents = {
        JOG_SPEED_I: {
            title: 'Increase Jog Speed',
            keys: '=',
            cmd: 'JOG_SPEED_I',
            payload: {
                speed: 'increase'
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG_SPEED
        },
        JOG_SPEED_D: {
            title: 'Decrease Jog Speed',
            keys: '-',
            cmd: 'JOG_SPEED_D',
            payload: {
                speed: 'decrease'
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG_SPEED
        },
        ZERO_X_AXIS: {
            title: 'Zero X Axis',
            keys: ['shift', 'w'].join('+'),
            cmd: 'ZERO_X_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_X },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.ZERO_AXIS
        },
        ZERO_Y_AXIS: {
            title: 'Zero Y Axis',
            keys: ['shift', 'e'].join('+'),
            cmd: 'ZERO_Y_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_Y },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.ZERO_AXIS
        },
        ZERO_Z_AXIS: {
            title: 'Zero Z Axis',
            keys: ['shift', 'r'].join('+'),
            cmd: 'ZERO_Z_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_Z },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.ZERO_AXIS
        },
        ZERO_ALL_AXIS: {
            title: 'Zero All',
            keys: ['shift', 'q'].join('+'),
            cmd: 'ZERO_ALL_AXIS',
            payload: { axis: 'all' },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.ZERO_AXIS
        },
        GO_TO_X_AXIS_ZERO: {
            title: 'Go to X Zero',
            keys: ['shift', 's'].join('+'),
            cmd: 'GO_TO_X_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_X] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.GO_TO_AXIS_ZERO
        },
        GO_TO_Y_AXIS_ZERO: {
            title: 'Go to Y Zero',
            keys: ['shift', 'd'].join('+'),
            cmd: 'GO_TO_Y_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_Y] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.GO_TO_AXIS_ZERO
        },
        GO_TO_Z_AXIS_ZERO: {
            title: 'Go to Z Zero',
            keys: ['shift', 'f'].join('+'),
            cmd: 'GO_TO_Z_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_Z] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.GO_TO_AXIS_ZERO
        },
        GO_TO_XY_AXIS_ZERO: {
            title: 'Go to XY Zero',
            keys: ['shift', 'a'].join('+'),
            cmd: 'GO_TO_XY_AXIS_ZERO',
            payload: { axisList: [AXIS_X, AXIS_Y] },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.GO_TO_AXIS_ZERO
        },
    };


    shuttleControl = null;


    componentDidMount() {
        this.subscribe();
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);

        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));
    }

    componentWillUnmount() {
        this.removeShuttleControlEvents();
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            units,
            minimized,
            axes,
            jog
        } = this.state;

        this.config.set('minimized', minimized);
        this.config.set('axes', axes);
        this.config.set('jog.keypad', jog.keypad);
        if (units === IMPERIAL_UNITS) {
            this.config.set('jog.imperial.step', Number(jog.imperial.step) || 0);
        }
        if (units === METRIC_UNITS) {
            this.config.set('jog.metric.step', Number(jog.metric.step) || 0);
        }
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            units: store.get('workspace.units', METRIC_UNITS),
            safeRetractHeight: store.get('workspace.safeRetractHeight'),
            workflow: {
                state: controller.workflow.state
            },
            modal: {
                name: MODAL_NONE,
                params: {}
            },
            axes: this.config.get('axes', DEFAULT_AXES),
            machinePosition: { // Machine position
                x: '0.000',
                y: '0.000',
                z: '0.000',
                a: '0.000',
                b: '0.000',
                c: '0.000'
            },
            workPosition: { // Work position
                x: '0.000',
                y: '0.000',
                z: '0.000',
                a: '0.000',
                b: '0.000',
                c: '0.000'
            },
            jog: {
                axis: '', // Defaults to empty
                keypad: this.config.get('jog.keypad'),
                imperial: {
                    step: this.config.get('jog.imperial.step'),
                },
                metric: {
                    step: this.config.get('jog.metric.step'),
                },
                speeds: {
                    xyStep: this.config.get('jog.speeds.xyStep'),
                    zStep: this.config.get('jog.speeds.zStep'),
                    feedrate: this.config.get('jog.speeds.feedrate'),
                }
            },
        };
    }

    updateShuttleControlEvents = () => {
        this.removeShuttleControlEvents();
        this.addShuttleControlEvents();
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });

        // Shuttle Zone
        this.shuttleControl = new ShuttleControl();
        this.shuttleControl.on('flush', ({ axis, feedrate, relativeDistance }) => {
            feedrate = feedrate.toFixed(3) * 1;
            relativeDistance = relativeDistance.toFixed(4) * 1;

            controller.command('gcode', 'G91'); // relative
            controller.command('gcode', 'G1 F' + feedrate + ' ' + axis + relativeDistance);
            controller.command('gcode', 'G90'); // absolute
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });

        if (this.shuttleControl) {
            this.shuttleControl.removeAllListeners('flush');
            this.shuttleControl = null;
        }
    }

    canClick() {
        const { isConnected, workflow, type, state } = this.props;

        if (!isConnected) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], type)) {
            return false;
        }

        const activeState = get(state, 'status.activeState');
        const states = [
            GRBL_ACTIVE_STATE_IDLE,
            GRBL_ACTIVE_STATE_RUN
        ];
        return includes(states, activeState);
    }

    changeUnits(units) {
        this.setState({
            units: units,
            safeRetractHeight: store.get('workspace.safeRetractHeight')
        });
    }

    render() {
        const { widgetId, machinePosition, workPosition, wcs } = this.props;
        const { minimized, isFullscreen } = this.state;
        const { units } = this.state;
        const canSendCommand = this.canSendCommand();
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const config = this.config;
        //const wcs = this.getWorkCoordinateSystem();
        const state = {
            ...this.state,
            // Determine if the motion button is clickable
            canClick: this.canClick(),
            // Output machine position with the display units
            machinePosition: mapValues(machinePosition, (pos, axis) => {
                return String(mapPositionToUnits(pos, units));
            }),
            // Output work position with the display units
            workPosition: mapValues(workPosition, (pos, axis) => {
                return String(mapPositionToUnits(pos, units));
            })
        };
        const actions = {
            ...this.actions
        };

        const gcodes = [
            {
                label: 'G54 (P1)',
                value: 'G54',
            },
            {
                label: 'G55 (P2)',
                value: 'G55',
            },
            {
                label: 'G56 (P3)',
                value: 'G56',
            },
            {
                label: 'G57 (P4)',
                value: 'G57',
            },
            {
                label: 'G58 (P5)',
                value: 'G58',
            },
            {
                label: 'G59 (P6)',
                value: 'G59',
            },
        ];

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header>
                    <Widget.Title>
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Location')}
                    </Widget.Title>
                    <Widget.Controls className={styles.controlRow}>
                        <label>Workspace:</label>
                        <Select
                            styles={{
                                // Fixes the overlapping problem of the component
                                menu: provided => ({ ...provided, zIndex: 9999, marginTop: 0 }),
                                valueContainer: provided => ({ ...provided, padding: 0, margin: 0, textAlign: 'center' }),
                                option: provided => ({ ...provided, padding: 0 }),
                                control: provided => ({ ...provided, minHeight: 'initial', lineHeight: 1, boxShadow: 'none' }),
                                dropdownIndicator: provided => ({ ...provided, padding: 0 }),
                                container: provided => ({ ...provided, padding: 0 })
                            }}
                            value={gcodes.filter(obj => obj.value === wcs)}
                            isDisabled={!canSendCommand}
                            isClearable={false}
                            className={styles.workspaceInput}
                            onChange={(selection) => {
                                controller.command('gcode', selection.value);
                                this.workspaceSelectRef.current.blur();
                            }}
                            name="workspace"
                            options={gcodes}
                            ref={this.workspaceSelectRef}
                        />
                    </Widget.Controls>
                </Widget.Header>
                <Widget.Content
                    className={cx(
                        styles['widget-content'],
                        { [styles.hidden]: minimized }
                    )}
                >
                    {state.modal.name === MODAL_SETTINGS && (
                        <Settings
                            config={config}
                            onSave={() => {
                                const axes = config.get('axes', DEFAULT_AXES);
                                const imperialJogDistances = ensureArray(config.get('jog.imperial.distances', []));
                                const metricJogDistances = ensureArray(config.get('jog.metric.distances', []));

                                this.setState(state => ({
                                    axes: axes,
                                    jog: {
                                        ...state.jog,
                                        imperial: {
                                            ...state.jog.imperial,
                                            distances: imperialJogDistances
                                        },
                                        metric: {
                                            ...state.jog.metric,
                                            distances: metricJogDistances
                                        }
                                    }
                                }));

                                actions.closeModal();
                            }}
                            onCancel={actions.closeModal}
                        />
                    )}
                    <Location config={config} state={state} actions={actions} />
                </Widget.Content>
            </Widget>
        );
    }
}


export default connect((store) => {
    const state = get(store, 'controller.state');
    const settings = get(store, 'controller.settings');
    const type = get(store, 'controller.type');
    const machinePosition = get(store, 'controller.mpos');
    const workPosition = get(store, 'controller.wpos');
    const workflow = get(store, 'controller.workflow');
    const canJog = (workflow.state === WORKFLOW_STATE_IDLE);
    const isConnected = get(store, 'connection.isConnected');
    const port = get(store, 'connection.port');
    const wcs = get(store, 'controller.modal.wcs', 'G54');
    return {
        isConnected,
        state,
        settings,
        type,
        machinePosition,
        workPosition,
        workflow,
        canJog,
        port,
        wcs
    };
})(LocationWidget);
