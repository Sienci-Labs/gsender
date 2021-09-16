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

import ensureArray from 'ensure-array';
import get from 'lodash/get';
import includes from 'lodash/includes';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import React, { PureComponent } from 'react';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
import { preventDefault } from 'app/lib/dom-events';
import { in2mm, mm2in, mapPositionToUnits } from 'app/lib/units';
import { limit } from 'app/lib/normalize-range';
import WidgetConfig from 'app/widgets/WidgetConfig';
import pubsub from 'pubsub-js';
import { connect } from 'react-redux';
import store from 'app/store';
import {
    // Units
    IMPERIAL_UNITS,
    IMPERIAL_STEPS,
    METRIC_UNITS,
    METRIC_STEPS,
    // Grbl
    GRBL,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    // TinyG
    TINYG,
    // Workflow
    GRBL_ACTIVE_STATE_JOG,
    GRBL_ACTIVE_STATE_IDLE, WORKFLOW_STATE_IDLE
} from 'app/constants';
import Axes from './Axes';
// import ShuttleControl from './ShuttleControl';
import JogHelper from './jogHelper';

import {
    MODAL_NONE,
    DEFAULT_AXES,
    SPEED_NORMAL,
    SPEED_PRECISE
} from './constants';


class AxesWidget extends PureComponent {
    pubsubTokens = [];

    joggingHelper = null;

    subscribe() {
        const tokens = [
            pubsub.subscribe('jogSpeeds', (msg, speeds) => {
                this.setState({ jog: {
                    ...this.state.jog,
                    ...speeds,
                } });
            }),
            pubsub.subscribe('addKeybindingsListener', () => {
                this.addShuttleControlEvents();
            }),
            pubsub.subscribe('removeKeybindingsListener', () => {
                this.removeShuttleControlEvents();
            }),
            pubsub.subscribe('units:change', (event, units) => {
                this.changeUnits(units);
            })
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

    config = new WidgetConfig('axes');

    state = this.getInitialState();

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
        openModal: (name = MODAL_NONE, params = {}) => {
            this.setState({
                modal: {
                    name: name,
                    params: params
                }
            });
        },
        closeModal: () => {
            this.setState({
                modal: {
                    name: MODAL_NONE,
                    params: {}
                }
            });
        },
        updateModalParams: (params = {}) => {
            this.setState({
                modal: {
                    ...this.state.modal,
                    params: {
                        ...this.state.modal.params,
                        ...params
                    }
                }
            });
        },
        getXYJogDistance: () => {
            const { jog } = this.state;
            const { xyStep } = jog;
            return xyStep;
        },
        getZJogDistance: () => {
            const { jog } = this.state;
            const { zStep } = jog;
            return zStep;
        },
        getFeedrate: () => {
            const { jog } = this.state;
            const { feedrate } = jog;
            return feedrate;
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
        getWorkCoordinateSystem: () => {
            const controllerState = this.props.state;
            const defaultWCS = 'G54';

            return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
        },
        setSelectedSpeed: (speed) => {
            this.setState({
                selectedSpeed: speed
            });
        },
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
        jog: (params = {}) => {
            const { units } = this.state;
            const modal = (units === 'mm') ? 'G21' : 'G20';
            const s = map(params, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
            const commands = [
                `$J=${modal}G91 ` + s,
            ];
            controller.command('gcode', commands, modal);
        },
        startContinuousJog: (params = {}, feedrate = 1000) => {
            const { units } = this.state;
            this.setState({
                isContinuousJogging: true
            }, controller.command('jog:start', params, feedrate, units));
        },
        stopContinuousJog: () => {
            this.setState({
                isContinuousJogging: false
            });
            controller.command('jog:stop');
        },
        cancelJog: () => {
            const state = get(this.props.state, 'status.activeState');
            if (state) {
                if (state === GRBL_ACTIVE_STATE_JOG) {
                    controller.command('jog:cancel');
                    return;
                }
                if (state === GRBL_ACTIVE_STATE_IDLE) {
                    return;
                }
                controller.command('reset');
            }
        },
        move: (params = {}) => {
            const s = map(params, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
            controller.command('gcode', 'G0 ' + s);
        },
        toggleMDIMode: () => {
            this.setState(state => ({
                mdi: {
                    ...state.mdi,
                    disabled: !state.mdi.disabled
                }
            }));
        },
        toggleKeypadJogging: () => {
            this.setState(state => ({
                jog: {
                    ...state.jog,
                    keypad: !state.jog.keypad
                }
            }));
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
        },
        handleXYStepChange: (value) => {
            const { jog } = this.state;
            if (Number.isNaN(value)) {
                value = this.props.value;
            }
            this.setState({
                jog: {
                    ...jog,
                    xyStep: value
                }
            });

            pubsub.publish('jogSpeeds', { xyStep: value, zStep: jog.zStep, feedrate: jog.feedrate });
        },
        handleZStepChange: (value) => {
            const { jog } = this.state;
            if (Number.isNaN(value)) {
                value = this.props.value;
            }
            this.setState({
                jog: {
                    ...jog,
                    zStep: value
                }
            });

            pubsub.publish('jogSpeeds', { xyStep: jog.xyStep, zStep: value, feedrate: jog.feedrate });
        },
        handleFeedrateChange: (value) => {
            const { jog } = this.state;
            if (Number.isNaN(value)) {
                value = this.props.value;
            }
            this.setState({
                jog: {
                    ...jog,
                    feedrate: value
                }
            });

            pubsub.publish('jogSpeeds', { xyStep: jog.xyStep, zStep: jog.zStep, feedrate: value });
        },
        changeMovementRates: (xyStep, zStep, feedrate) => {
            const { jog } = this.state;
            this.setState({
                jog: {
                    ...jog,
                    xyStep: xyStep,
                    zStep: zStep,
                    feedrate: feedrate
                }
            });

            pubsub.publish('jogSpeeds', { xyStep, zStep, feedrate });
        },
        setJogFromPreset: (presetKey) => {
            const { jog, units } = this.state;
            const jogObj = jog[presetKey][units];

            this.setState({
                jog: {
                    ...jog,
                    ...jogObj
                }
            });
        }
    };

    shuttleControlEvents = {
        SELECT_AXIS: (event, { axis }) => {
            const { canClick, jog } = this.state;

            if (!canClick) {
                return;
            }

            if (jog.axis === axis) {
                this.actions.selectAxis(); // deselect axis
            } else {
                this.actions.selectAxis(axis);
            }
        },
        JOG: (event, { axis = null, direction = 1, factor = 1 }) => {
            preventDefault(event);
            const { isContinuousJogging } = this.state;
            const { getXYJogDistance, getZJogDistance } = this.actions;
            const { canJog } = this.props;

            const xyStep = getXYJogDistance();
            const zStep = getZJogDistance();

            if (!axis || isContinuousJogging || !canJog) {
                return;
            }

            const givenAxis = axis.toUpperCase();
            const feedrate = Number(this.actions.getFeedrate());

            const axisValue = {
                X: xyStep,
                Y: xyStep,
                Z: zStep
            }[givenAxis] * direction;

            this.setState({ prevJog: { [givenAxis]: axisValue, F: feedrate } });

            const jogCB = (given) => this.actions.jog(given);

            const startContinuousJogCB = (coordinates, feedrate) => this.actions.startContinuousJog(coordinates, feedrate);

            const stopContinuousJogCB = () => this.actions.stopContinuousJog();

            if (!this.joggingHelper) {
                this.joggingHelper = new JogHelper({ jogCB, startContinuousJogCB, stopContinuousJogCB });
            }

            this.joggingHelper.onKeyDown({ [givenAxis]: direction }, feedrate);
        },
        STOP_JOG: (event, payload) => {
            preventDefault(event);

            const { prevJog } = this.state;

            if (!payload) {
                this.joggingHelper && this.joggingHelper.onKeyUp(prevJog);
                return;
            }

            const { axis, direction } = payload;

            const { getXYJogDistance, getZJogDistance } = this.actions;

            const xyStep = getXYJogDistance();
            const zStep = getZJogDistance();

            const givenAxis = axis.toUpperCase();
            const axisValue = {
                X: xyStep,
                Y: xyStep,
                Z: zStep
            }[givenAxis] * direction;
            const feedrate = Number(this.actions.getFeedrate());

            this.joggingHelper && this.joggingHelper.onKeyUp({ [givenAxis]: axisValue, F: feedrate });
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
    };

    shuttleControl = null;

    updateJogPresets = () => {
        const { jog } = this.state;
        const data = store.get('widgets.axes.jog');

        if (!data) {
            return;
        }
        const { rapid, normal, precise } = data;

        this.setState({
            jog: {
                ...jog,
                rapid,
                normal,
                precise
            }
        });
    }

    componentDidMount() {
        store.on('change', this.updateJogPresets);
        this.actions.setJogFromPreset(SPEED_PRECISE);
        this.addShuttleControlEvents();
        this.subscribe();
    }

    componentWillUnmount() {
        store.removeListener('change', this.updateJogPresets);
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            units,
            minimized,
            axes,
            jog,
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
        const { rapid, normal, precise } = store.get('widgets.axes.jog');

        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            port: controller.port,
            units: store.get('workspace.units', METRIC_UNITS),
            isContinuousJogging: false,
            selectedSpeed: SPEED_NORMAL,
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
                xyStep: this.getInitialXYStep(),
                zStep: this.getInitialZStep(),
                feedrate: this.config.get('jog.precise.mm.feedrate'),
                rapid,
                normal,
                precise,
                axis: '', // Defaults to empty
                keypad: this.config.get('jog.keypad'),
                imperial: {
                    step: this.config.get('jog.imperial.step'),
                    distances: ensureArray(this.config.get('jog.imperial.distances', []))
                },
                metric: {
                    step: this.config.get('jog.metric.step'),
                    distances: ensureArray(this.config.get('jog.metric.distances', []))
                }
            },
            prevJog: null,
        };
    }

    getInitialXYStep() {
        const units = store.get('workspace.units', METRIC_UNITS);

        if (units === IMPERIAL_UNITS) {
            return 0.2;
        }
        return 5;
    }

    getInitialZStep() {
        const units = store.get('workspace.units', METRIC_UNITS);

        if (units === IMPERIAL_UNITS) {
            return 0.04;
        }
        return 2;
    }

    changeUnits(units) {
        const oldUnits = this.state.units;
        const { jog } = this.state;
        let { zStep, xyStep } = jog;
        if (oldUnits === METRIC_UNITS && units === IMPERIAL_UNITS) {
            zStep = mm2in(zStep).toFixed(3);
            xyStep = mm2in(xyStep).toFixed(3);
        } else if (oldUnits === IMPERIAL_UNITS && units === METRIC_UNITS) {
            zStep = in2mm(zStep).toFixed(2);
            xyStep = in2mm(xyStep).toFixed(2);
        }

        this.setState({
            units: units,
            jog: {
                ...jog,
                zStep: zStep,
                xyStep: xyStep
            }
        });
    }

    addShuttleControlEvents() {
        // Object.keys(this.shuttleControlEvents).forEach(eventName => {
        //     const callback = this.shuttleControlEvents[eventName];
        //     combokeys.on(eventName, callback);
        // });

        // // Shuttle Zone
        // this.shuttleControl = new ShuttleControl();
        // this.shuttleControl.on('flush', ({ axis, feedrate, relativeDistance }) => {
        //     feedrate = feedrate.toFixed(3) * 1;
        //     relativeDistance = relativeDistance.toFixed(4) * 1;

        //     controller.command('gcode', 'G91'); // relative
        //     controller.command('gcode', 'G1 F' + feedrate + ' ' + axis + relativeDistance);
        //     controller.command('gcode', 'G90'); // absolute
        // });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName];
            combokeys.removeListener(eventName, callback);
        });

        this.shuttleControl.removeAllListeners('flush');
        this.shuttleControl = null;
    }

    canClick() {
        const { isContinuousJogging } = this.state;
        const { workflow, type, isConnected } = this.props;

        if (!isConnected) {
            return false;
        }
        if (workflow.state !== WORKFLOW_STATE_IDLE && !isContinuousJogging) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], type)) {
            return false;
        }

        return true;
    }

    isJogging() {
        const activeState = get(this.props.state, 'status.activeState');
        return (activeState === GRBL_ACTIVE_STATE_JOG);
    }

    render() {
        const { machinePosition, workPosition, canJog } = this.props;
        const { units } = this.state;
        const config = this.config;
        const activeState = get(this.props.state, 'status.activeState', GRBL_ACTIVE_STATE_IDLE);
        const state = {
            ...this.state,
            // Determine if the motion button is clickable
            canClick: this.canClick(),
            isJogging: this.isJogging(),
            activeState: activeState,
            // Output machine position with the display units
            machinePosition: mapValues(machinePosition, (pos, axis) => {
                return String(mapPositionToUnits(pos, units));
            }),
            // Output work position with the display units
            workPosition: mapValues(workPosition, (pos, axis) => {
                return String(mapPositionToUnits(pos, units));
            }),
            canJog
        };
        const actions = {
            ...this.actions
        };

        return (<Axes config={config} state={state} actions={actions} />);
    }
}

export default connect((store) => {
    const settings = get(store, 'controller.settings');
    const state = get(store, 'controller.state');
    const type = get(store, 'controller.type');
    const workPosition = get(store, 'controller.wpos');
    const machinePosition = get(store, 'controller.mpos');
    const workflow = get(store, 'controller.workflow');
    const canJog = workflow.state === WORKFLOW_STATE_IDLE;
    const isConnected = get(store, 'connection.isConnected');
    return {
        settings,
        state,
        type,
        workPosition,
        machinePosition,
        workflow,
        canJog,
        isConnected
    };
})(AxesWidget);

// export default AxesWidget;
