/* eslint-disable no-unreachable */
/* eslint-disable no-restricted-globals */
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

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import ensureArray from 'ensure-array';
import { throttle, includes, mapValues, map, get, inRange } from 'lodash';
import pubsub from 'pubsub-js';
import { connect } from 'react-redux';

import Widget from 'app/components/Widget';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
import { preventDefault } from 'app/lib/dom-events';
import i18n from 'app/lib/i18n';
import { mapPositionToUnits } from 'app/lib/units';
import { limit } from 'app/lib/normalize-range';
import gamepad, { runAction, checkButtonHold } from 'app/lib/gamepad';
import WidgetConfig from 'app/widgets/WidgetConfig';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

import store from '../../store';
import Axes from './Axes';
import ShuttleControl from './ShuttleControl';
import JogHelper from './jogHelper';
import {
    // Units
    IMPERIAL_UNITS,
    IMPERIAL_STEPS,
    METRIC_UNITS,
    METRIC_STEPS,
    // Workflow
    GRBL_ACTIVE_STATE_JOG,
    GRBL_ACTIVE_STATE_RUN,
    GRBL_ACTIVE_STATE_IDLE,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_RUNNING,
    WORKFLOW_STATE_PAUSED,

    JOGGING_CATEGORY,
    GENERAL_CATEGORY,

    AXIS_X,
    AXIS_Y,
    AXIS_Z,
    AXIS_A,
    WORKSPACE_MODE,
} from '../../constants';
import {
    MODAL_NONE,
    DEFAULT_AXES,
    SPEED_NORMAL,
    SPEED_RAPID,
    SPEED_PRECISE
} from './constants';
import styles from './index.styl';
import useKeybinding from '../../lib/useKeybinding';
import { JoystickLoop, checkThumbsticskAreIdle } from './JoystickLoop';
import { MPGHelper } from './MPGHelper';
import { convertAllPresetsUnits, convertToImperial, convertToMetric } from '../../containers/Preferences/calculate';

class AxesWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        sortable: PropTypes.object,
        isSecondary: PropTypes.bool
    };

    pubsubTokens = [];

    joggingHelper = null;

    axisDebounce = null;

    axisThrottle = null;

    joystickLoop = null

    mpgHelper = null;

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

    config = new WidgetConfig(this.props.widgetId);

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
        getXAJogDistance: () => {
            const { jog } = this.state;
            const { ayStep } = jog;
            return ayStep;
        },
        getZJogDistance: () => {
            const { jog } = this.state;
            const { zStep } = jog;
            return zStep;
        },
        getAJogDistance: () => {
            const { jog } = this.state;
            const { aStep } = jog;
            return aStep;
        },
        getFeedrate: () => {
            const { jog } = this.state;
            const { feedrate } = jog;
            return feedrate;
        },
        getJogDistance: () => {
            const { units } = this.state;

            const step = units === IMPERIAL_UNITS ? this.config.get('jog.step') : convertToImperial(this.config.get('jog.step'));
            let jogDistances = ensureArray(this.config.get('jog.distances', []));
            if (units === IMPERIAL_UNITS) {
                jogDistances.forEach((el, index) => {
                    jogDistances[index] = convertToImperial(el);
                });
            }
            const unitSteps = units === METRIC_UNITS ? METRIC_STEPS : IMPERIAL_STEPS;
            const jogSteps = [
                ...jogDistances,
                ...unitSteps
            ];
            const distance = Number(jogSteps[step]) || 0;
            return distance;
        },
        getWorkCoordinateSystem: () => {
            const controllerState = this.props.state;
            const defaultWCS = 'G54';

            return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
        },
        setSelectedSpeed: (speed) => {
            pubsub.publish('jog_preset_selected', speed);
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
            const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
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
                    step: (state.units === METRIC_UNITS) ? step : state.jog.step
                }
            }));
        },
        stepForward: () => {
            this.setState(state => {
                const unitSteps = state.units === METRIC_UNITS ? METRIC_STEPS : IMPERIAL_STEPS;
                const jogSteps = [
                    ...state.jog.distances,
                    ...unitSteps
                ];

                return {
                    jog: {
                        ...state.jog,
                        step: limit(state.jog.step + 1, 0, jogSteps.length - 1)
                    }
                };
            });
        },
        stepBackward: () => {
            this.setState(state => {
                const unitSteps = state.units === METRIC_UNITS ? METRIC_STEPS : IMPERIAL_STEPS;
                const jogSteps = [
                    ...state.jog.distances,
                    ...unitSteps
                ];

                return {
                    jog: {
                        ...state.jog,
                        step: limit(state.jog.step - 1, 0, jogSteps.length - 1)
                    }
                };
            });
        },
        stepNext: () => {
            this.setState(state => {
                const unitSteps = state.units === METRIC_UNITS ? METRIC_STEPS : IMPERIAL_STEPS;
                const jogSteps = [
                    ...state.jog.distances,
                    ...unitSteps
                ];

                return {
                    jog: {
                        ...state.jog,
                        step: (state.jog.step + 1) % jogSteps.length
                    }
                };
            });
        },
        handleXYStepChange: (value) => {
            const { jog } = this.state;
            // any input that gets to this point is valid, so set it
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
            // any input that gets to this point is valid, so set it
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
            // any input that gets to this point is valid, so set it
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
            const { jog } = this.state;
            const jogObj = jog[presetKey]; // since the state is already converted to the correct units, we don't need to do that here

            this.setState({
                jog: {
                    ...jog,
                    ...jogObj
                }
            });
        }
    };

    shuttleControlFunctions = {
        JOG: (event, { axis = null }) => {
            const isInRotaryMode = store.get('workspace.mode', '') === WORKSPACE_MODE.ROTARY;
            if (event) {
                preventDefault(event);
            }

            const controllerIsGrbl = this.props.type === 'Grbl';

            if (controllerIsGrbl && axis.a && !isInRotaryMode) {
                return;
            }

            this.handleShortcutJog({ axis });
        },
        UPDATE_WORKSPACE_MODE: () => {
            const currentWorkspaceMode = store.get('workspace.mode', WORKSPACE_MODE.DEFAULT);
            const workspaceModesList = Object.values(WORKSPACE_MODE);
            const currentWorkspaceModeIndex = workspaceModesList.findIndex(mode => mode === currentWorkspaceMode);
            const nextWorkspaceMode = workspaceModesList[currentWorkspaceModeIndex + 1] ?? workspaceModesList[0];
            const rotaryTabEnabled = store.get('widgets.rotary.tab.show');

            if (!rotaryTabEnabled) {
                return;
            }

            store.replace('workspace.mode', nextWorkspaceMode);

            Toaster.pop({
                type: TOASTER_INFO,
                msg: `Workspace Mode set to ${nextWorkspaceMode.charAt(0).toUpperCase() + nextWorkspaceMode.slice(1).toLowerCase()}`
            });
        },
        SET_JOG_PRESET: (event, { key }) => {
            if (!key) {
                return;
            }
            const { state } = this.props;
            const activeState = get(state, 'status.activeState');
            if (activeState === GRBL_ACTIVE_STATE_IDLE) {
                this.actions.setSelectedSpeed(key);
                this.actions.setJogFromPreset(key);
            }
        },
        JOG_SPEED: (_, { speed }) => {
            const getStep = ({ value, increment = false }) => {
                let step;

                if (value === 0) {
                    return 0.1;
                }
                if (value < 0.1) {
                    step = 0.01;
                } else if (value < 1) {
                    step = 0.1;
                } else if (value < 10) {
                    step = 1;
                } else if (value < 100) {
                    step = 10;
                } else if (value < 1000) {
                    step = 100;
                } else if (value < 10000) {
                    step = 1000;
                } else {
                    step = 10000;
                }

                if (!increment && step !== 0.001 && value - step === 0) {
                    step /= 10;
                }
                return step;
            };

            const { rapid, normal, precise } = this.state.jog;
            const presets = [rapid, normal, precise];
            const newJogSpeeds = [];
            const shouldIncrement = speed === 'increase';

            for (const preset of presets) {
                const keys = Object.keys(preset);

                const newJog = {};

                const fixedAmount = 3;

                for (const key of keys) {
                    const presetVal = preset[key];
                    const newVal = Number((presetVal - getStep({ value: presetVal, increment: shouldIncrement })).toFixed(fixedAmount));

                    newJog[key] = newVal;

                    if (newVal !== 0 || newVal > 0) {
                        newJog[key] = newVal;
                    }
                }

                newJogSpeeds.push(newJog);
            }

            this.setState((prev) => ({
                ...prev,
                jog: {
                    ...prev.jog,
                    rapid: newJogSpeeds[0],
                    normal: newJogSpeeds[1],
                    precise: newJogSpeeds[2],
                }
            }));
        }
    }

    shuttleControlEvents = {
        JOG_A_PLUS: { // Jog A+
            id: 100,
            title: 'Jog: A+',
            keys: ['ctrl', '6'].join('+'),
            cmd: 'JOG_A_PLUS',
            payload: {
                axis: { [AXIS_A]: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_A_MINUS: { // Jog A-
            id: 101,
            title: 'Jog: A-',
            keys: ['ctrl', '4'].join('+'),
            cmd: 'JOG_A_MINUS',
            payload: {
                axis: { [AXIS_A]: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        SWITCH_WORKSPACE_MODE: {
            id: 103,
            title: 'Switch Between Workspace Modes',
            keys: ['ctrl', '5'].join('+'),
            cmd: 'SWITCH_WORKSPACE_MODE',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.UPDATE_WORKSPACE_MODE
        },
        JOG_X_P: {
            title: 'Jog: X+',
            keys: 'shift+right',
            gamepadKeys: '15',
            keysName: 'Arrow Right',
            cmd: 'JOG_X_P',
            payload: {
                axis: { [AXIS_X]: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG
        },
        JOG_X_M: {
            title: 'Jog: X-',
            keys: 'shift+left',
            gamepadKeys: '14',
            keysName: 'Arrow Left',
            cmd: 'JOG_X_M',
            payload: {
                axis: { [AXIS_X]: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_Y_P: {
            title: 'Jog: Y+',
            keys: 'shift+up',
            gamepadKeys: '12',
            keysName: 'Arrow Up',
            cmd: 'JOG_Y_P',
            payload: {
                axis: { [AXIS_Y]: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_Y_M: {
            title: 'Jog: Y-',
            keys: 'shift+down',
            gamepadKeys: '13',
            keysName: 'Arrow Down',
            cmd: 'JOG_Y_M',
            payload: {
                axis: { [AXIS_Y]: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_Z_P: {
            title: 'Jog: Z+',
            keys: 'shift+pageup',
            gamepadKeys: '5',
            keysName: 'Left Button',
            cmd: 'JOG_Z_P',
            payload: {
                axis: { [AXIS_Z]: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_Z_M: {
            title: 'Jog: Z-',
            keys: 'shift+pagedown',
            gamepadKeys: '4',
            keysName: 'Right Button',
            cmd: 'JOG_Z_M',
            payload: {
                axis: { [AXIS_Z]: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_X_P_Y_M: {
            title: 'Jog: X+ Y-',
            keys: '',
            gamepadKeys: '13+15',
            keysName: 'Arrow Right and Arrow Down',
            cmd: 'JOG_X_P_Y_M',
            payload: {
                axis: { [AXIS_X]: 1, [AXIS_Y]: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_X_M_Y_P: {
            title: 'Jog: X- Y+',
            keys: '',
            gamepadKeys: '13+14',
            keysName: 'Arrow Left and Arrow Down',
            cmd: 'JOG_X_M_Y_P',
            payload: {
                axis: { [AXIS_X]: -1, [AXIS_Y]: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_X_Y_P: {
            title: 'Jog: X+ Y+',
            keys: '',
            gamepadKeys: '12+15',
            keysName: 'Arrow Right and Arrow Up',
            cmd: 'JOG_X_Y_P',
            payload: {
                axis: { [AXIS_X]: 1, [AXIS_Y]: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        JOG_X_Y_M: {
            title: 'Jog: X- Y-',
            keys: '',
            gamepadKeys: '13+14',
            keysName: 'Arrow Left and Arrow Down',
            cmd: 'JOG_X_Y_M',
            payload: {
                axis: { [AXIS_X]: -1, [AXIS_Y]: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG,
        },
        STOP_JOG: { // this one is for the shortcut. can be used at any time, even when not continuous jogging.
            title: 'Stop Jog',
            keys: '',
            cmd: 'STOP_JOG',
            payload: { force: true },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: (event, payload) => {
                if (event) {
                    preventDefault(event);
                }

                controller.command('jog:stop');
            },
        },
        STOP_CONT_JOG: { // this one is for other functions to call when continuous jogging
            cmd: 'STOP_CONT_JOG',
            payload: { force: true },
            preventDefault: false,
            callback: (event, payload) => {
                if (event) {
                    preventDefault(event);
                }

                this.handleShortcutStop(payload);
            },
        },
        SET_R_JOG_PRESET: {
            title: 'Select Rapid Jog Preset',
            keys: ['shift', 'v'].join('+'),
            cmd: 'SET_R_JOG_PRESET',
            payload: {
                key: SPEED_RAPID
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.SET_JOG_PRESET,
        },
        SET_N_JOG_PRESET: {
            title: 'Select Normal Jog Preset',
            keys: ['shift', 'c'].join('+'),
            cmd: 'SET_N_JOG_PRESET',
            payload: {
                key: SPEED_NORMAL
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.SET_JOG_PRESET,
        },
        SET_P_JOG_PRESET: {
            title: 'Select Precise Jog Preset',
            keys: ['shift', 'x'].join('+'),
            cmd: 'SET_P_JOG_PRESET',
            payload: {
                key: SPEED_PRECISE
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.SET_JOG_PRESET,
        },
        CYCLE_JOG_PRESETS: {
            title: 'Cycle Through Jog Presets',
            keys: ['shift', 'z'].join('+'),
            cmd: 'CYCLE_JOG_PRESETS',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => {
                const { selectedSpeed } = this.state;

                const presets = [SPEED_RAPID, SPEED_NORMAL, SPEED_PRECISE];
                const nextIndex = presets.findIndex(preset => preset === selectedSpeed) + 1;
                const key = presets[nextIndex] ? presets[nextIndex] : presets[0];

                this.actions.setSelectedSpeed(key);
                this.actions.setJogFromPreset(key);
            },
        },
        JOG_SPEED_I: {
            title: 'Increase Jog Speed',
            keys: '=',
            gamepadKeys: '7',
            keysName: 'Right Trigger',
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
            gamepadKeys: '6',
            keysName: 'Left Trigger',
            cmd: 'JOG_SPEED_D',
            payload: {
                speed: 'decrease'
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: this.shuttleControlFunctions.JOG_SPEED
        }
    };

    handleJoystickJog = (params, { doRegularJog } = {}) => {
        const isInRotaryMode = store.get('workspace.mode', '') === WORKSPACE_MODE.ROTARY;
        const { getXYJogDistance, getZJogDistance } = this.actions;

        const xyStep = getXYJogDistance();
        const zStep = getZJogDistance();

        const feedrate = Number(this.actions.getFeedrate());

        const axisValue = {
            x: xyStep,
            y: xyStep,
            z: zStep,
            a: xyStep
        };

        if (doRegularJog) {
            const axisList = {};

            if (params.x) {
                axisList.x = axisValue.x * params.x;
            }
            if (params.y) {
                axisList.y = axisValue.y * params.y;
            }
            if (params.z) {
                axisList.z = axisValue.z * params.z;
            }
            if (params.a) {
                if (isInRotaryMode) {
                    axisList.y = axisValue.a * params.a;
                } else {
                    axisList.A = axisValue.a * params.a;
                }
            }

            this.actions.jog({ ...axisList, F: feedrate });

            return;
        }

        this.actions.jog(params);
    };

    handleShortcutJog = ({ axis }) => {
        const { isContinuousJogging } = this.state;
        const { getXYJogDistance, getZJogDistance, getAJogDistance } = this.actions;
        const { canJog } = this.props;

        const xyStep = getXYJogDistance();
        const zStep = getZJogDistance();
        const aStep = getAJogDistance();

        if (!axis || isContinuousJogging || !canJog) {
            return;
        }

        const feedrate = Number(this.actions.getFeedrate());

        const axisValue = {
            x: xyStep,
            y: xyStep,
            z: zStep,
            a: aStep
        };

        const jogCB = (given) => this.actions.jog(given);

        const startContinuousJogCB = (coordinates, feedrate) => this.actions.startContinuousJog(coordinates, feedrate);

        const stopContinuousJogCB = () => this.actions.stopContinuousJog();

        if (!this.joggingHelper) {
            this.joggingHelper = new JogHelper({ jogCB, startContinuousJogCB, stopContinuousJogCB });
        }

        const axisList = {};

        if (axis.x) {
            axisList.x = axisValue.x * axis.x;
        }
        if (axis.y) {
            axisList.y = axisValue.y * axis.y;
        }
        if (axis.z) {
            axisList.z = axisValue.z * axis.z;
        }
        if (axis.a) {
            axisList.a = axisValue.a * axis.a; // convert to Y
        }

        this.joggingHelper.onKeyDown(axisList, feedrate);
    }

    handleShortcutStop = (payload) => {
        const feedrate = Number(this.actions.getFeedrate());

        if (!payload) {
            this.joggingHelper && this.joggingHelper.onKeyUp({ F: feedrate });
            return;
        }

        const { axis: axisList } = payload;

        const { getXYJogDistance, getZJogDistance, getAJogDistance } = this.actions;

        const xyStep = getXYJogDistance();
        const zStep = getZJogDistance();
        const aStep = getAJogDistance();

        const axisObj = {};

        for (const axis in axisList) {
            if (axis) {
                const givenAxis = axis.toUpperCase();
                const axisValue = {
                    X: xyStep,
                    Y: xyStep,
                    Z: zStep,
                    A: aStep
                }[givenAxis] * axisList[axis];

                axisObj[givenAxis] = axisValue;
            }
        }

        if (this.joggingHelper) {
            this.joggingHelper.onKeyUp({ F: feedrate });
        }
    }

    shuttleControl = null;

    updateJogPresets = () => {
        const { jog, units, selectedSpeed } = this.state;
        const data = store.get('widgets.axes.jog');

        if (!data) {
            return;
        }

        // convert store data if necessary
        const jogObj = units === IMPERIAL_UNITS ? convertAllPresetsUnits(units, store.get('widgets.axes.jog')) : data;

        // if the same as our current state, dont bother changing anything
        if (jog.rapid === jogObj.rapid && jog.normal === jogObj.normal && jog.precise === jogObj.precise) {
            return;
        }

        // change rapid, normal, precise and the currently displayed values
        this.setState({
            jog: {
                ...jog,
                ...jogObj,
                ...jogObj[selectedSpeed]
            }
        });
    }

    componentDidMount() {
        store.on('change', this.updateJogPresets);
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);
        this.subscribe();

        gamepad.on('gamepad:button', throttle((event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents })), 50, { leading: false, trailing: true });

        gamepad.on('gamepad:axis', ({ detail }) => {
            if (gamepad.shouldHold || !this.props.isConnected) {
                return;
            }

            const { degrees, axis, value } = detail;

            const gamepadProfiles = store.get('workspace.gamepad.profiles', []);

            const currentProfile = gamepadProfiles.find(profile => profile.id.includes(detail.gamepad.id));

            if (!currentProfile) {
                return;
            }

            const { joystickOptions } = currentProfile;
            const { leftStick, rightStick } = degrees;

            const activeAxisAngle = [leftStick, leftStick, rightStick, rightStick][axis];
            const activeStick = ['stick1', 'stick1', 'stick2', 'stick2'][axis];

            const isHoldingModifierButton = checkButtonHold('modifier', currentProfile);

            const actionType = !isHoldingModifierButton ? 'primaryAction' : 'secondaryAction';

            const activeAxis = get(joystickOptions, [activeStick, 'mpgMode', actionType], 0);

            const isReversed = get(joystickOptions, [activeStick, 'mpgMode', 'isReversed'], false);

            const isUsingMPGMode = !!activeAxis;

            if (!isUsingMPGMode) {
                return;
            }

            const { getXYJogDistance, getZJogDistance, getAJogDistance } = this.actions;

            const xyStep = getXYJogDistance();
            const zStep = getZJogDistance();
            const aStep = getAJogDistance();

            const feedrate = Number(this.actions.getFeedrate());

            const axisStep = {
                x: xyStep,
                y: xyStep,
                z: zStep,
                a: aStep
            }[activeAxis];

            if (!this.mpgHelper) {
                this.mpgHelper = new MPGHelper(this.handleJoystickJog);

                return;
            }

            if (value === 0) {
                this.mpgHelper.clearValue();
                return;
            }

            this.mpgHelper.update(activeAxisAngle, activeAxis, axisStep, feedrate, isReversed ? -1 : 1);
        });

        gamepad.on('gamepad:axis', throttle(({ detail }) => {
            if (gamepad.shouldHold || !this.props.isConnected) {
                return;
            }

            const { degrees, axis } = detail;

            // detail.axis
            // 0 - left stick x-axis
            // 1 - left stick y-axis
            // 2 - right stick x-axis
            // 3 - right stick y-axis

            const gamepadProfiles = store.get('workspace.gamepad.profiles', []);

            const currentProfile = gamepadProfiles.find(profile => profile.id.includes(detail.gamepad.id));

            if (!currentProfile) {
                return;
            }

            const { joystickOptions } = currentProfile;
            const { leftStick, rightStick } = degrees;

            const activeStickDegrees = [leftStick, leftStick, rightStick, rightStick][axis];
            const activeStick = ['stick1', 'stick1', 'stick2', 'stick2'][axis];

            const isHoldingModifierButton = checkButtonHold('modifier', currentProfile);

            const actionType = !isHoldingModifierButton ? 'primaryAction' : 'secondaryAction';

            const isUsingMPGMode = !!get(joystickOptions, `${activeStick}.mpgMode.${actionType}`, false);

            if (isUsingMPGMode) {
                return;
            }

            const computeAxesAndDirection = (degrees) => {
                const stick = get(joystickOptions, activeStick, null);

                if (!stick) {
                    return [];
                }

                const { horizontal, vertical } = stick;

                const getDirection = (isReversed) => (!isReversed ? 1 : -1);

                const MOVEMENT_DISTANCE = 1;

                const stickX = {
                    axis: horizontal[actionType],
                    positiveDirection: MOVEMENT_DISTANCE * getDirection(horizontal.isReversed),
                    negativeDirection: MOVEMENT_DISTANCE * getDirection(!horizontal.isReversed),
                };

                const stickY = {
                    axis: vertical[actionType],
                    positiveDirection: MOVEMENT_DISTANCE * getDirection(vertical.isReversed),
                    negativeDirection: MOVEMENT_DISTANCE * getDirection(!vertical.isReversed)
                };

                // X-axis Positive
                if (inRange(degrees, 0, 30) || inRange(degrees, 330, 360)) {
                    return [
                        stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null
                    ];
                }

                // Top Right
                if (inRange(degrees, 31, 59)) {
                    return [
                        stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null,
                        stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
                    ];
                }

                // Y-axis Positive
                if (inRange(degrees, 60, 120)) {
                    return [
                        null,
                        stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null
                    ];
                }

                // Top Left
                if (inRange(degrees, 121, 149)) {
                    return [
                        stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
                        stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
                    ];
                }

                // X-axis Negative
                if (inRange(degrees, 150, 210)) {
                    return [
                        stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
                    ];
                }

                // Bottom Left
                if (inRange(degrees, 211, 239)) {
                    return [
                        stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
                        stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
                    ];
                }

                // Y-axis Negative
                if (inRange(degrees, 240, 300)) {
                    return [
                        null,
                        stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null
                    ];
                }

                // Bottom Right
                if (inRange(degrees, 301, 329)) {
                    return [
                        stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null,
                        stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
                    ];
                }

                return [];
            };

            const data = computeAxesAndDirection(activeStickDegrees);

            if (!this.joystickLoop) {
                this.joystickLoop = new JoystickLoop({
                    gamepadProfile: currentProfile,
                    jog: (params, doRegularJog) => this.handleJoystickJog(params, { doRegularJog }),
                    feedrate: this.actions.getFeedrate(),
                    cancelJog: this.actions.cancelJog
                });
            }

            const thumbsticksAreIdle = checkThumbsticskAreIdle(detail.gamepad.axes, currentProfile);

            if (thumbsticksAreIdle) {
                this.joystickLoop.stop();
                return;
            }

            const { isRunning, activeAxis } = this.joystickLoop;

            const isUsingSameThumbstick =
                (activeAxis === axis) ||
                (activeAxis === 0 && axis === 1) ||
                (activeAxis === 1 && axis === 0) ||
                (activeAxis === 2 && axis === 3) ||
                (activeAxis === 3 && axis === 2);

            if (!isUsingSameThumbstick && isRunning) {
                return;
            }

            this.joystickLoop.setOptions({
                gamepadProfile: currentProfile,
                feedrate: this.actions.getFeedrate(),
                activeAxis: axis,
                axes: data,
                multiplier: detail.distance,
                degrees: activeStickDegrees,
            });
            this.joystickLoop.start(axis);
        }, 50, { leading: false, trailing: true }));
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
        if (units !== prevState.units) {
            if (units === METRIC_UNITS) {
                this.config.set('jog.step', Number(jog.step) || 0);
            } else {
                this.config.set('jog.step', convertToMetric(jog.step) || 0);
            }
        }
    }

    getInitialState() {
        const initialUnits = store.get('workspace.units', METRIC_UNITS);
        // convert to imperial if necessary.
        // we keep track of the current values converted to the correct units,
        // but the store will always be metric.
        const { rapid, normal, precise } = initialUnits === IMPERIAL_UNITS ? convertAllPresetsUnits(initialUnits, store.get('widgets.axes.jog')) : store.get('widgets.axes.jog');

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
                xyStep: normal.xyStep, // use normal as the default display
                ayStep: normal.ayStep,
                zStep: normal.zStep,
                aStep: normal.aStep,
                feedrate: normal.feedrate,
                rapid,
                normal,
                precise,
                axis: '', // Defaults to empty
                keypad: this.config.get('jog.keypad'),
                step: this.config.get('jog.step'),
                distances: ensureArray(this.config.get('jog.distances', []))
            },
            prevJog: null,
            prevDirection: null,
        };
    }


    changeUnits(units) {
        const oldUnits = this.state.units;
        const { jog } = this.state;
        let { zStep, xyStep, aStep, feedrate } = jog;

        if (oldUnits === METRIC_UNITS && units === IMPERIAL_UNITS) {
            zStep = convertToImperial(zStep);
            xyStep = convertToImperial(xyStep);
            aStep = convertToImperial(aStep);
            feedrate = Number(convertToImperial(feedrate).toFixed(0));
        } else if (oldUnits === IMPERIAL_UNITS && units === METRIC_UNITS) {
            zStep = convertToMetric(zStep);
            xyStep = convertToMetric(xyStep);
            aStep = convertToMetric(aStep);
            feedrate = Number(convertToMetric(feedrate).toFixed(0));
        }

        const { rapid, normal, precise } = convertAllPresetsUnits(units, jog);

        this.setState({
            units: units,
            jog: {
                ...jog,
                zStep: zStep,
                xyStep: xyStep,
                aStep: aStep,
                feedrate,
                rapid,
                normal,
                precise
            },
            needsConversion: units === IMPERIAL_UNITS ? { rapid: true, normal: true, precise: true, } : { rapid: false, normal: false, precise: false, }
        });
    }

    addShuttleControlEvents() {
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

        this.shuttleControl.removeAllListeners('flush');
        this.shuttleControl = null;
    }

    canClick() {
        //const { isContinuousJogging } = this.state;
        const { workflow, isConnected, activeState } = this.props;

        if (!isConnected) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        const states = [
            GRBL_ACTIVE_STATE_IDLE,
            //GRBL_ACTIVE_STATE_HOLD,
            GRBL_ACTIVE_STATE_JOG
        ];
        return includes(states, activeState);
    }

    isJogging() {
        const activeState = get(this.props.state, 'status.activeState');
        return (activeState === GRBL_ACTIVE_STATE_JOG);
    }

    canClickCancel() {
        //const { isContinuousJogging } = this.state;
        const { workflow, isConnected, activeState } = this.props;

        if (!isConnected) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        const states = [
            GRBL_ACTIVE_STATE_IDLE,
            GRBL_ACTIVE_STATE_RUN,
            GRBL_ACTIVE_STATE_JOG
        ];
        return includes(states, activeState);
    }

    render() {
        const { widgetId, machinePosition, workPosition, canJog, isSecondary, type } = this.props;
        const { minimized, units } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const config = this.config;
        const activeState = get(this.props.state, 'status.activeState', GRBL_ACTIVE_STATE_IDLE);
        const state = {
            ...this.state,
            // Determine if the motion button is clickable
            canClick: this.canClick(),
            type: type,
            canClickCancel: this.canClickCancel(),
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
            canJog,
            isSecondary
        };
        const actions = {
            ...this.actions
        };

        if (isSecondary) {
            return <Axes config={config} state={state} actions={actions} />;
        }

        return (
            <Widget /*style={{ minHeight: '250px' }}*/>
                <Widget.Header>
                    <Widget.Title>
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Jog Control')}
                    </Widget.Title>
                    <Widget.Controls />
                </Widget.Header>
                <Widget.Content
                    className={cx(
                        styles['widget-content'],
                        { [styles.hidden]: minimized }
                    )}
                >
                    <Axes config={config} state={state} actions={actions} />
                </Widget.Content>
            </Widget>
        );
    }
}

export default connect((store) => {
    const settings = get(store, 'controller.settings');
    const state = get(store, 'controller.state');
    const type = get(store, 'controller.type');
    const workPosition = get(store, 'controller.wpos');
    const machinePosition = get(store, 'controller.mpos');
    const workflow = get(store, 'controller.workflow');
    const canJog = [WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED].includes(workflow.state);
    const isConnected = get(store, 'connection.isConnected');
    const activeState = get(state, 'status.activeState');
    return {
        settings,
        state,
        type,
        workPosition,
        machinePosition,
        workflow,
        canJog,
        isConnected,
        activeState,
    };
})(AxesWidget);
