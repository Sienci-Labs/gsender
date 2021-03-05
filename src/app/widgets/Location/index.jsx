import cx from 'classnames';
import ensureArray from 'ensure-array';
import get from 'lodash/get';
import includes from 'lodash/includes';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import store from 'app/store';
import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import api from 'app/api';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import { in2mm, mapPositionToUnits } from 'app/lib/units';
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
    SMOOTHIE_ACTIVE_STATE_IDLE,
    SMOOTHIE_ACTIVE_STATE_RUN,
    // TinyG
    TINYG,
    TINYG_MACHINE_STATE_READY,
    TINYG_MACHINE_STATE_STOP,
    TINYG_MACHINE_STATE_END,
    TINYG_MACHINE_STATE_RUN,
    // Workflow
    WORKFLOW_STATE_RUNNING,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';
import {
    MODAL_NONE,
    MODAL_SETTINGS,
    DEFAULT_AXES
} from './constants';
import styles from './index.styl';

class LocationWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    pubsubTokens = [];

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

    getWorkCoordinateSystem = () => {
        const controllerType = this.state.controller.type;
        const controllerState = this.state.controller.state;
        const defaultWCS = 'G54';

        if (controllerType === GRBL) {
            return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
        }

        if (controllerType === MARLIN) {
            return get(controllerState, 'modal.wcs') || defaultWCS;
        }

        if (controllerType === SMOOTHIE) {
            return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
        }

        if (controllerType === TINYG) {
            return get(controllerState, 'sr.modal.wcs') || defaultWCS;
        }

        return defaultWCS;
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
        jog: (params = {}) => {
            const s = map(params, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
            controller.command('gcode', 'G91'); // relative
            controller.command('gcode', 'G0 ' + s);
            controller.command('gcode', 'G90'); // absolute
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
        }
    };

    canSendCommand() {
        const { port, controller, workflow } = this.state;

        if (!port) {
            return false;
        }
        if (!controller.type || !controller.state) {
            return false;
        }
        if (workflow.state !== WORKFLOW_STATE_IDLE) {
            return false;
        }

        return true;
    }

    shuttleControlEvents = {
        START_JOB: () => {
            const { port, workflow } = this.state;
            if (!port) {
                return;
            }

            const canStart = (workflow.state !== WORKFLOW_STATE_RUNNING);

            if (canStart) {
                if (workflow.state === WORKFLOW_STATE_IDLE) {
                    controller.command('gcode:start');
                    return;
                }

                if (workflow.state === WORKFLOW_STATE_PAUSED) {
                    controller.command('gcode:resume');
                    return;
                }
            }
        },
        PAUSE_JOB: () => {
            const { port, workflow } = this.state;
            if (!port) {
                return;
            }

            if (workflow.state === WORKFLOW_STATE_RUNNING) {
                controller.command('gcode:pause');
            }
        },
        STOP_JOB: () => {
            const { port } = this.state;
            if (!port) {
                return;
            }

            controller.command('gcode:stop', { force: true });
        },
        ZERO_ALL: () => {
            const wcs = this.getWorkCoordinateSystem;

            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;

            controller.command('gcode', `G10 L20 P${p} X0 Y0 Z0`);
        },
        GO_TO_ZERO: () => {
            controller.command('gcode', 'G0 X0 Y0 Z0'); //Move to Work Position Zero
        },
        JOG_SPEED: (event, { speed }) => {
            const RAPID = { xyStep: 20, zStep: 10, feedrate: 5000 };
            const NORMAL = { xyStep: 5, zStep: 2, feedrate: 3000 };
            const PRECISE = { xyStep: 0.5, zStep: 0.1, feedrate: 1000 };

            const { jog } = this.state;
            const { feedrate } = jog.speeds;
            if (speed === 'increase' && feedrate !== 5000) {
                feedrate === 1000
                    ? pubsub.publish('jogSpeeds', NORMAL)
                    : pubsub.publish('jogSpeeds', RAPID);
            }

            if (speed === 'decrease' && feedrate !== 1000) {
                feedrate === 5000
                    ? pubsub.publish('jogSpeeds', NORMAL)
                    : pubsub.publish('jogSpeeds', PRECISE);
            }
        },
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
        JOG_LEVER_SWITCH: (event, { key = '' }) => {
            if (key === '-') {
                this.actions.stepBackward();
            } else if (key === '+') {
                this.actions.stepForward();
            } else {
                this.actions.stepNext();
            }
        },
        SHUTTLE: (event, { zone = 0 }) => {
            const { canClick, jog } = this.state;

            if (!canClick) {
                return;
            }

            if (zone === 0) {
                // Clear accumulated result
                this.shuttleControl.clear();

                if (jog.axis) {
                    controller.command('gcode', 'G90');
                }
                return;
            }

            if (!jog.axis) {
                return;
            }

            const distance = Math.min(this.actions.getJogDistance(), 1);
            const feedrateMin = this.config.get('shuttle.feedrateMin');
            const feedrateMax = this.config.get('shuttle.feedrateMax');
            const hertz = this.config.get('shuttle.hertz');
            const overshoot = this.config.get('shuttle.overshoot');

            this.shuttleControl.accumulate(zone, {
                axis: jog.axis,
                distance: distance,
                feedrateMin: feedrateMin,
                feedrateMax: feedrateMax,
                hertz: hertz,
                overshoot: overshoot
            });
        }
    };

    controllerEvents = {
        'config:change': () => {
            this.fetchMDICommands();
        },
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState(state => ({
                ...initialState,
                mdi: {
                    ...initialState.mdi,
                    commands: [...state.mdi.commands]
                }
            }));
        },
        'workflow:state': (workflowState) => {
            const canJog = (workflowState === WORKFLOW_STATE_IDLE);

            // Disable keypad jogging and shuttle wheel when the workflow state is 'running'.
            // This prevents accidental movement while sending G-code commands.
            this.setState(state => ({
                jog: {
                    ...state.jog,
                    axis: canJog ? state.jog.axis : '',
                    keypad: canJog
                },
                workflow: {
                    ...state.workflow,
                    state: workflowState
                }
            }));
        },
        'controller:settings': (type, controllerSettings) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    settings: controllerSettings
                }
            }));
        },
        'controller:state': (type, controllerState) => {
            // Grbl
            if (type === GRBL) {
                const { status } = { ...controllerState };
                const { mpos, wpos } = status;

                const $13 = Number(get(controller.settings, 'settings.$13', 0)) || 0;

                this.setState(state => ({
                    controller: {
                        ...state.controller,
                        type: type,
                        state: controllerState
                    },
                    // Machine position are reported in mm ($13=0) or inches ($13=1)
                    machinePosition: mapValues({
                        ...state.machinePosition,
                        ...mpos
                    }, (val) => {
                        return ($13 > 0) ? in2mm(val) : val;
                    }),
                    // Work position are reported in mm ($13=0) or inches ($13=1)
                    workPosition: mapValues({
                        ...state.workPosition,
                        ...wpos
                    }, val => {
                        return ($13 > 0) ? in2mm(val) : val;
                    })
                }));
            }
        }
    };

    shuttleControl = null;

    fetchMDICommands = async () => {
        try {
            let res;
            res = await api.mdi.fetch();
            const { records: commands } = res.body;
            this.setState(state => ({
                mdi: {
                    ...state.mdi,
                    commands: commands
                }
            }));
        } catch (err) {
            // Ignore error
        }
    };

    componentDidMount() {
        this.subscribe();
        this.fetchMDICommands();
        this.addControllerEvents();
        this.addShuttleControlEvents();

        this.actions.toggleKeypadJogging();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.removeShuttleControlEvents();
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            units,
            minimized,
            axes,
            jog,
            mdi
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
        this.config.set('mdi.disabled', mdi.disabled);
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            port: controller.port,
            units: store.get('workspace.units', METRIC_UNITS),
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            },
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
                    distances: ensureArray(this.config.get('jog.imperial.distances', []))
                },
                metric: {
                    step: this.config.get('jog.metric.step'),
                    distances: ensureArray(this.config.get('jog.metric.distances', []))
                },
                speeds: {
                    xyStep: this.config.get('jog.speeds.xyStep'),
                    zStep: this.config.get('jog.speeds.zStep'),
                    feedrate: this.config.get('jog.speeds.feedrate'),
                }
            },
            mdi: {
                disabled: this.config.get('mdi.disabled'),
                commands: []
            }
        };
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    updateShuttleControlEvents = () => {
        this.removeShuttleControlEvents();
        this.addShuttleControlEvents();
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName];
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
            const callback = this.shuttleControlEvents[eventName];
            combokeys.removeListener(eventName, callback);
        });

        if (this.shuttleControl) {
            this.shuttleControl.removeAllListeners('flush');
            this.shuttleControl = null;
        }
    }

    canClick() {
        const { port, workflow } = this.state;
        const controllerType = this.state.controller.type;
        const controllerState = this.state.controller.state;

        if (!port) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], controllerType)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                GRBL_ACTIVE_STATE_IDLE,
                GRBL_ACTIVE_STATE_RUN
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === MARLIN) {
            // Ignore
        }
        if (controllerType === SMOOTHIE) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                SMOOTHIE_ACTIVE_STATE_IDLE,
                SMOOTHIE_ACTIVE_STATE_RUN
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === TINYG) {
            const machineState = get(controllerState, 'sr.machineState');
            const states = [
                TINYG_MACHINE_STATE_READY,
                TINYG_MACHINE_STATE_STOP,
                TINYG_MACHINE_STATE_END,
                TINYG_MACHINE_STATE_RUN
            ];
            if (!includes(states, machineState)) {
                return false;
            }
        }

        return true;
    }

    changeUnits(units) {
        this.setState({
            units: units
        });
    }

    render() {
        const { widgetId } = this.props;
        const { minimized, isFullscreen } = this.state;
        const { units, machinePosition, workPosition } = this.state;
        const canSendCommand = this.canSendCommand();
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const config = this.config;
        const wcs = this.getWorkCoordinateSystem();
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
                id: 0,
                name: 'G54',
                wcs: 'P1',
            },
            {
                id: 1,
                name: 'G55',
                wcs: 'P2',
            },
            {
                id: 2,
                name: 'G56',
                wcs: 'P3',
            },
            {
                id: 3,
                name: 'G57',
                wcs: 'P4',
            },
            {
                id: 4,
                name: 'G58',
                wcs: 'P5',
            },
            {
                id: 5,
                name: 'G59',
                wcs: 'P6',
            },
        ];

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header>
                    <Widget.Title>
                        <Widget.Sortable className={this.props.sortable.handleClassName}>
                            <i className="fa fa-bars" />
                            <Space width="8" />
                        </Widget.Sortable>
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Location')}
                    </Widget.Title>
                    <Widget.Controls className={this.props.sortable.filterClassName}>

                        <Widget.DropdownButton
                            title={i18n._('Work Coordinate System')}
                            className={styles.workspaceDropdown}
                            disabled={!canSendCommand}
                            toggle={(
                                <div style={{ fontSize: '1.1rem', lineHeight: '1.5rem', margin: '0 5px', color: 'black' }}>
                                    <label>Workspace: </label>

                                    <div className={styles['position-label']}>
                                        {wcs}{' '}
                                        <i className="fas fa-chevron-down fa-xs" />
                                    </div>
                                </div>
                            )}
                            onSelect={(positionName) => {
                                controller.command('gcode', positionName);
                            }}
                        >
                            {
                                gcodes.map(({ id, name, wcs }) => (
                                    <Widget.DropdownMenuItem key={id} eventKey={name}>
                                        {`${name} (${wcs})`}
                                    </Widget.DropdownMenuItem>
                                ))
                            }
                        </Widget.DropdownButton>

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

export default LocationWidget;
