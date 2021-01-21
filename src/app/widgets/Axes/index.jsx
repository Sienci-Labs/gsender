import cx from 'classnames';
import ensureArray from 'ensure-array';
import get from 'lodash/get';
import includes from 'lodash/includes';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import api from 'app/api';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
// import { preventDefault } from 'app/lib/dom-events';
import i18n from 'app/lib/i18n';
import { in2mm, mapPositionToUnits } from 'app/lib/units';
import { limit } from 'app/lib/normalize-range';
import WidgetConfig from 'app/widgets/WidgetConfig';
import Axes from './Axes';
import Settings from './Settings';
import ShuttleControl from './ShuttleControl';
import defaultState from '../../store/defaultState';
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
} from '../../constants';
import {
    MODAL_NONE,
    MODAL_SETTINGS,
    DEFAULT_AXES
} from './constants';
import styles from './index.styl';

class AxesWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

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
        setZParentState: (prevState, parameter) => {
            this.setState({ zKeyDistance: parameter });
            this.setState({ zKeyDistance: prevState });
        },
        setXYParentState: (prevState, parameter) => {
            this.setState({ zKeyDistance: parameter });
            this.setState({ xyKeyDistance: prevState });
        },
        setSpeedState: (previous, parameter) => {
            let integer = parseInt(parameter, 10);
            this.setState({ setSpeed: integer });
        },
        setXYState: (previous, parameter) => {
            this.setState({ xyKeyDistance: parameter });
        },
        jog: (params = {}, params2 = {}) => {
            const units = defaultState.widgets.axes.jog.defaultUnits;
            const SValue = map(params, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
            const FValue = map(params2, (value2, letter2) => (' ' + letter2.toUpperCase() + value2)).join(' ');
            if (units === IMPERIAL_UNITS) {
                controller.command('gcode', 'G20  G91 G1 ' + SValue + FValue);
            } else if (units === METRIC_UNITS) {
                controller.command('gcode', 'G21  G91 G1 ' + SValue + FValue);
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
        handleToggleClicks: () => {
            this.setState({ clicked: !this.state.clicked });
        },
        toggleKeypadJogging: (e) => {
            console.log('Clicked');
            this.setState(state => ({
                clicked: !this.state.clicked,
                jog: {
                    ...state.jog,
                    keypad: !state.jog.keypad
                }
            }));
        },
        setToggleAmounts: (amount) => {
            this.setState({ jogDistance: amount });
            return this.state.jogDistance;
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
        getStepDistanceXY: (step) => {
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

            if (this.state.units === METRIC_UNITS) {
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
            event.preventDefault();
            const { canClick, jog } = this.state;
            if (!canClick) {
                return;
            }

            if (axis !== null && !jog.keypad) {
                // keypad jogging is disabled
                return;
            }

            // The keyboard events of arrow keys for X-axis/Y-axis and pageup/pagedown for Z-axis
            // are not prevented by default. If a jog command will be executed, it needs to
            // stop the default behavior of a keyboard combination in a browser.
            // preventDefault(event);

            let toggleSpeed = this.state.setSpeed;
            let xyKeyDistance = this.state.xyKeyDistance;
            axis = axis || jog.axis;
            const distance = this.actions.getJogDistance();
            let { zKeyDistance } = this.state;

            if (this.state.units === METRIC_UNITS) {
                const jogAxis = {
                    x: () => this.actions.jog({ X: direction * xyKeyDistance * factor, F: toggleSpeed }),
                    y: () => this.actions.jog({ Y: direction * xyKeyDistance * factor, F: toggleSpeed }),
                    z: () => this.actions.jog({ Z: direction * zKeyDistance * factor, F: toggleSpeed }),
                    a: () => this.actions.jog({ A: direction * distance * factor }),
                    b: () => this.actions.jog({ B: direction * distance * factor }),
                    c: () => this.actions.jog({ C: direction * distance * factor })
                }[axis];


                jogAxis && jogAxis();
            } else if (this.state.units === IMPERIAL_UNITS) {
                const jogAxis = {
                    x: () => this.actions.jog({ X: direction * xyKeyDistance * factor, F: toggleSpeed }),
                    y: () => this.actions.jog({ Y: direction * xyKeyDistance * factor, F: toggleSpeed }),
                    z: () => this.actions.jog({ Z: direction * xyKeyDistance * factor, F: toggleSpeed }),
                    a: () => this.actions.jog({ A: direction * distance * factor }),
                    b: () => this.actions.jog({ B: direction * distance * factor }),
                    c: () => this.actions.jog({ C: direction * distance * factor })
                }[axis];


                jogAxis && jogAxis();
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
            const canJog = (workflowState !== WORKFLOW_STATE_RUNNING);

            // Disable keypad jogging and shuttle wheel when the workflow state is 'running'.
            // This prevents accidental movement while sending G-code commands.
            this.setState(state => ({
                jog: {
                    ...state.jog,
                    axis: canJog ? state.jog.axis : '',
                    keypad: canJog ? state.jog.keypad : false
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
                const { status, parserstate } = { ...controllerState };
                const { mpos, wpos } = status;
                const { modal = {} } = { ...parserstate };
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;
                const $13 = Number(get(controller.settings, 'settings.$13', 0)) || 0;

                this.setState(state => ({
                    units: units,
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

            // Marlin
            if (type === MARLIN) {
                const { pos, modal = {} } = { ...controllerState };
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                this.setState(state => ({
                    units: units,
                    controller: {
                        ...state.controller,
                        type: type,
                        state: controllerState
                    },
                    // Machine position is always reported in mm
                    machinePosition: {
                        ...state.machinePosition,
                        ...pos
                    },
                    // Work position is always reported in mm
                    workPosition: {
                        ...state.workPosition,
                        ...pos
                    }
                }));
            }

            // Smoothie
            if (type === SMOOTHIE) {
                const { status, parserstate } = { ...controllerState };
                const { mpos, wpos } = status;
                const { modal = {} } = { ...parserstate };
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                this.setState(state => ({
                    units: units,
                    controller: {
                        ...state.controller,
                        type: type,
                        state: controllerState
                    },
                    // Machine position are reported in current units
                    machinePosition: mapValues({
                        ...state.machinePosition,
                        ...mpos
                    }, (val) => {
                        return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
                    }),
                    // Work position are reported in current units
                    workPosition: mapValues({
                        ...state.workPosition,
                        ...wpos
                    }, (val) => {
                        return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
                    })
                }));
            }

            // TinyG
            if (type === TINYG) {
                const { sr } = { ...controllerState };
                const { mpos, wpos, modal = {} } = { ...sr };
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                this.setState(state => ({
                    units: units,
                    controller: {
                        ...state.controller,
                        type: type,
                        state: controllerState
                    },
                    // https://github.com/synthetos/g2/wiki/Status-Reports
                    // Canonical machine position are always reported in millimeters with no offsets.
                    machinePosition: {
                        ...state.machinePosition,
                        ...mpos
                    },
                    // Work position are reported in current units, and also apply any offsets.
                    workPosition: mapValues({
                        ...state.workPosition,
                        ...wpos
                    }, (val) => {
                        return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
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
        this.fetchMDICommands();
        this.addControllerEvents();
        this.addShuttleControlEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.removeShuttleControlEvents();
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
            lastXYSteps: [],
            clicked: false,
            maxheadSpeed: defaultState.widgets.axes.jog.maxheadSpeed,
            xyKeyDistance: 5,
            zKeyDistance: 2,
            xyKeyDistanceImperial: 0.2,
            zKeyDistanceImperial: 0.04,
            maxSpindleSpeed: defaultState.widgets.axes.jog.maxSpindleSpeed,
            maxZMovementMM: defaultState.widgets.axes.jog.zMaxMovementMetric,
            maxZMovementINCH: defaultState.widgets.axes.jog.zMaxMovementImperial,
            metricMaxDistance: defaultState.widgets.axes.jog.metricMaxMm,
            imperialMaxDistance: defaultState.widgets.axes.jog.imperialMaxInches,
            xyDistance: defaultState.widgets.axes.jog.xyStep,
            zdistance: defaultState.widgets.axes.jog.zStep,
            setSpeed: defaultState.widgets.axes.jog.speed,
            jogDistance: 5,
            userHasNStops: defaultState.widgets.axes.hasNStop,
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true,
            port: controller.port,
            units: defaultState.widgets.axes.jog.defaultUnits,
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

    addShuttleControlEvents() {
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

        this.shuttleControl.removeAllListeners('flush');
        this.shuttleControl = null;
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

    render() {
        const { widgetId } = this.props;
        const { minimized, isFullscreen } = this.state;
        const { units, machinePosition, workPosition } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const config = this.config;

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
                        {i18n._('Axes')}
                    </Widget.Title>
                    <Widget.Controls className={this.props.sortable.filterClassName}>
                        <Widget.Button
                            title={i18n._('Manual Data Input')}
                            onClick={actions.toggleMDIMode}
                            inverted={!state.mdi.disabled}
                        >
                            <Space width="4" />
                            {i18n._('MDI')}
                            <Space width="4" />
                        </Widget.Button>
                        <Widget.Button
                            title={i18n._('Edit')}
                            onClick={(event) => {
                                actions.openModal(MODAL_SETTINGS);
                            }}
                        >
                            <i className="fa fa-cog" />
                        </Widget.Button>
                        <Widget.Button
                            disabled={isFullscreen}
                            title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                            onClick={actions.toggleMinimized}
                        >
                            <i
                                className={cx(
                                    'fa',
                                    { 'fa-chevron-up': !minimized },
                                    { 'fa-chevron-down': minimized }
                                )}
                            />
                        </Widget.Button>
                        <Widget.DropdownButton
                            title={i18n._('More')}
                            toggle={<i className="fa fa-ellipsis-v" />}
                            onSelect={(eventKey) => {
                                if (eventKey === 'fullscreen') {
                                    actions.toggleFullscreen();
                                } else if (eventKey === 'fork') {
                                    this.props.onFork();
                                } else if (eventKey === 'remove') {
                                    this.props.onRemove();
                                }
                            }}
                        >
                            <Widget.DropdownMenuItem eventKey="fullscreen">
                                <i
                                    className={cx(
                                        'fa',
                                        'fa-fw',
                                        { 'fa-expand': !isFullscreen },
                                        { 'fa-compress': isFullscreen }
                                    )}
                                />
                                <Space width="4" />
                                {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="fork">
                                <i className="fa fa-fw fa-code-fork" />
                                <Space width="4" />
                                {i18n._('Fork Widget')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="remove">
                                <i className="fa fa-fw fa-times" />
                                <Space width="4" />
                                {i18n._('Remove Widget')}
                            </Widget.DropdownMenuItem>
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
                    <Axes
                        config={config}
                        state={state}
                        actions={actions}
                        xyDistance={this.state.xyDistance}
                        zdistance={this.state.zdistance}
                        setSpeed={this.state.setSpeed}
                        userHasNStops={this.state.userHasNStops}
                        jogDistance={this.state.jogDistance}
                        metricXYMaxDistance={this.state.metricMaxDistance}
                        imperialXYMaxDistance={this.state.imperialMaxDistance}
                        zMaxMovementMetric={this.state.maxZMovementMM}
                        zMaxMovementImperial={this.state.maxZMovementINCH}
                        maxSpindleSpeed={this.state.maxSpindleSpeed}
                        maxheadSpeed={this.state.maxheadSpeed}
                        clicked={this.state.clicked}
                        units={this.state.units}
                    />
                </Widget.Content>
            </Widget>
        );
    }
}

export default AxesWidget;
