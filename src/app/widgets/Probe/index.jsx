import get from 'lodash/get';
import includes from 'lodash/includes';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import map from 'lodash/map';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import pubsub from 'pubsub-js';
import WidgetConfig from '../WidgetConfig';
import Probe from './Probe';
import RunProbe from './RunProbe';
import {
    // Units
    IMPERIAL_UNITS,
    METRIC_UNITS,
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    SMOOTHIE_ACTIVE_STATE_IDLE,
    // TinyG
    TINYG,
    TINYG_MACHINE_STATE_READY,
    TINYG_MACHINE_STATE_STOP,
    TINYG_MACHINE_STATE_END,
    // Workflow
    WORKFLOW_STATE_IDLE
} from '../../constants';
import {
    MODAL_NONE,
    MODAL_PREVIEW
} from './constants';
import store from '../../store';
import styles from './index.styl';


class ProbeWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object,
        embedded: PropTypes.bool
    };

    pubsubTokens = []

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    PROBE_DISTANCE = {
        X: 25,
        Y: 25,
        Z: 15
    };

    DWELL_TIME = 0.3;

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
        changeProbeAxis: (value) => {
            this.setState({ probeAxis: value });
        },
        changeProbeCommand: (value) => {
            this.setState({ probeCommand: value });
        },
        toggleUseTLO: () => {
            const { useTLO } = this.state;
            this.setState({ useTLO: !useTLO });
        },
        handleProbeDepthChange: (event) => {
            const probeDepth = event.target.value;
            this.setState({ probeDepth });
        },
        handleProbeFeedrateChange: (event) => {
            const probeFeedrate = event.target.value;
            this.setState({ probeFeedrate });
        },
        handleRetractionDistanceChange: (event) => {
            const retractionDistance = event.target.value;
            this.setState({ retractionDistance });
        },
        handleTouchplateSelection: (e) => {
            const index = Number(e.target.value);
            this.setState({
                selectedTouchplate: index
            }, () => {
                this.actions.generatePossibleProbeCommands();
            });
        },
        handleProbeCommandChange: (e) => {
            const index = Number(e.target.value);
            this.setState({
                useSafeProbeOption: false,
                selectedProbeCommand: index
            });
        },
        handleSafeProbeToggle: () => {
            const value = !this.state.useSafeProbeOption;
            this.setState({
                useSafeProbeOption: value
            });
        },
        generatePossibleProbeCommands: () => {
            const commands = [];
            let command;
            const selectedProfile = this.state.touchplate;
            const { functions } = selectedProfile;

            //Z
            if (functions.z) {
                command = {
                    id: 'Z Touch',
                    safe: false,
                    tool: false,
                    axes: {
                        x: false,
                        y: false,
                        z: true,
                    }
                };
                commands.push(command);
            }
            if (functions.x && functions.y) {
                command = {
                    id: 'X Touch',
                    safe: true,
                    tool: true,
                    axes: {
                        x: true,
                        y: false,
                        z: false
                    }
                };
                commands.push(command);
                command = {
                    id: 'Y Touch',
                    safe: true,
                    tool: true,
                    axes: {
                        x: false,
                        y: true,
                        z: false
                    }
                };
                commands.push(command);
                command = {
                    id: 'XY Touch',
                    safe: true,
                    tool: true,
                    axes: {
                        x: true,
                        y: true,
                        z: false
                    }
                };
                commands.push(command);
                if (functions.z) {
                    command = {
                        id: 'XYZ Touch',
                        safe: true,
                        tool: true,
                        axes: {
                            x: true,
                            y: true,
                            z: true
                        }
                    };
                    commands.push(command);
                }
            }
            this.setState({
                availableProbeCommands: commands
            });
        },
        generateProbeCommands: () => {
            return this.generateProbeCommands();
        },
        runProbeCommands: (commands) => {
            controller.command('gcode:safe', commands, 'G21');
        },
        returnProbeConnectivity: () => {
            const { status } = controller.state || {};
            const { probeActive } = status || false;
            return probeActive;
        }
    };

    controllerEvents = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
            this.actions.generatePossibleProbeCommands();
        },
        'workflow:state': (workflowState) => {
            this.setState(state => ({
                workflow: {
                    state: workflowState
                }
            }));
        },
        'controller:state': (type, state) => {
            let units = this.state.units;

            // Grbl
            if (type === GRBL) {
                const { parserstate } = { ...state };
                const { modal = {} } = { ...parserstate };
                units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || units;
            }

            // Marlin
            if (type === MARLIN) {
                const { modal = {} } = { ...state };
                units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || units;
            }

            // Smoothie
            if (type === SMOOTHIE) {
                const { parserstate } = { ...state };
                const { modal = {} } = { ...parserstate };
                units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || units;
            }

            // TinyG
            if (type === TINYG) {
                const { sr } = { ...state };
                const { modal = {} } = { ...sr };
                units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || units;
            }

            if (this.state.units !== units) {
                // Set `this.unitsDidChange` to true if the unit has changed
                this.unitsDidChange = true;
            }

            this.setState({
                controller: {
                    type: type,
                    state: state
                },
            });
        },
    };

    unitsDidChange = false;

    componentDidMount() {
        this.addControllerEvents();
        this.subscribe();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.unsubscribe();
    }

    componentWillMount() {
        this.actions.generatePossibleProbeCommands();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized
        } = this.state;

        this.config.set('minimized', minimized);

        // Do not save config settings if the units did change between in and mm
        if (this.unitsDidChange) {
            this.unitsDidChange = false;
            return;
        }

        const { probeCommand, useTLO } = this.state;
        this.config.set('probeCommand', probeCommand);
        this.config.set('useTLO', useTLO);

        let {
            probeDepth,
            probeFeedrate,
            touchPlateHeight,
            retractionDistance
        } = this.state;

        this.config.set('probeDepth', Number(probeDepth));
        this.config.set('probeFeedrate', Number(probeFeedrate));
        this.config.set('touchPlateHeight', Number(touchPlateHeight));
        this.config.set('retractionDistance', Number(retractionDistance));
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            port: controller.port,
            units: store.get('workspace.units'),
            controller: {
                type: controller.type,
                state: controller.state
            },
            workflow: {
                state: controller.workflow.state
            },
            modal: {
                name: MODAL_NONE,
                params: {}
            },
            probeAxis: this.config.get('probeAxis', 'Z'),
            probeCommand: this.config.get('probeCommand', 'G38.2'),
            useTLO: this.config.get('useTLO'),
            probeDepth: Number(this.config.get('probeDepth') || 0).toFixed(3) * 1,
            probeFeedrate: Number(this.config.get('probeFeedrate') || 0).toFixed(3) * 1,
            touchPlateHeight: Number(this.config.get('touchPlateHeight') || 0).toFixed(3) * 1,
            retractionDistance: Number(this.config.get('retractionDistance') || 0).toFixed(3) * 1,
            touchplate: store.get('workspace[probeProfile]', {}),
            availableTools: store.get('workspace[tools]', []),
            selectedtool: 0,
            useSafeProbeOption: false,
            availableProbeCommands: [],
            selectedProbeCommand: 0,
        };
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    gcode(cmd, params) {
        const s = map(params, (value, letter) => String(letter + value)).join(' ');
        return (s.length > 0) ? (cmd + ' ' + s) : cmd;
    }

    mapWCSToPValue(wcs) {
        return ({
            'G54': 1,
            'G55': 2,
            'G56': 3,
            'G57': 4,
            'G58': 5,
            'G59': 6
        }[wcs] || 0);
    }

    determineProbeOptions(probeCommand) {
        const { axes, tool } = probeCommand;
        return {
            axes: axes,
            calcToolDiameter: !tool
        };
    }

    generateInitialProbeSettings(axes, wcs) {
        const axesToZero = {};
        Object.keys(axes).forEach((axis) => {
            if (axes[axis]) {
                axesToZero[axis.toUpperCase()] = 0;
            }
        });
        return [
            this.gcode('; Initial Probe setup'),
            this.gcode('; Set initial zero for specified axes'),
            this.gcode('G10', {
                L: 20,
                P: this.mapWCSToPValue(wcs),
                ...axesToZero
            }),
            this.gcode('G91', {
                G: 21
            }),
            this.gcode('G49')
        ];
    }

    generateSingleAxisCommands(axis, thickness, params) {
        let { wcs, isSafe, probeCommand, retractDistance, normalFeedrate, quickFeedrate } = params;
        const workspace = this.mapWCSToPValue(wcs);
        let probeDistance = this.PROBE_DISTANCE[axis];
        probeDistance = (isSafe) ? -probeDistance : probeDistance;
        probeDistance = (axis === 'Z') ? (-1 * Math.abs(probeDistance)) : probeDistance;
        retractDistance = (axis === 'Z') ? retractDistance : retractDistance * -1;
        let code;
        code = [
            this.gcode(`; ${axis}-Probe`),
            // Fast probe for initial touch
            this.gcode(probeCommand, {
                [axis]: probeDistance,
                F: quickFeedrate
            }),
            // Retract after initial touch
            this.gcode('G91'),
            this.gcode('G0', {
                [axis]: retractDistance
            }),
            // Slow probe for second more accurate touch
            this.gcode(probeCommand, {
                [axis]: probeDistance,
                F: normalFeedrate
            }),
            // Wait a tick
            this.gcode('G4', {
                P: this.DWELL_TIME
            }),
        ];

        // We handle X and Y differently than Z for calculating offset
        if (axis === 'Z') {
            code = code.concat([
                // Absolute, set Zero for this axis
                this.gcode('G10', {
                    L: 20,
                    P: workspace,
                    [axis]: thickness
                }),
            ]);
        } else {
            const tool = this.state.availableTools[this.state.selectedtool];
            const toolRadius = (tool.metricDiameter / 2);
            const toolCompensatedThickness = ((-1 * toolRadius) - thickness);
            code = code.concat([
                this.gcode('G91'),
                // Absolute, set Zero for this axis
                this.gcode('G10', {
                    L: 20,
                    P: workspace,
                    [axis]: toolCompensatedThickness
                }),
            ]);
        }

        // Final retraction
        code = code.concat([
            this.gcode('G91'),
            this.gcode('G0', {
                [axis]: retractDistance
            }),
            this.gcode('G90')
        ]);
        return code;
    }

    generateMultiAxisCommands(axes, xyThickness, zThickness, params) {
        let code = [];
        let { wcs, isSafe, probeCommand, retractDistance, normalFeedrate, quickFeedrate } = params;
        const workspace = this.mapWCSToPValue(wcs);
        const XYRetract = -retractDistance;
        let XYProbeDistance = this.PROBE_DISTANCE.X;
        let ZProbeDistance = this.PROBE_DISTANCE.Z * -1;
        XYProbeDistance = (isSafe) ? -XYProbeDistance : XYProbeDistance;
        const gcode = this.gcode;

        // Calculate tool offset using radius and block thickness to origin
        const tool = this.state.availableTools[this.state.selectedtool];
        const toolRadius = (tool.metricDiameter / 2);
        const toolCompensatedThickness = ((-1 * toolRadius) - xyThickness);

        // Add Z Probe code if we're doing 3 axis probing
        if (axes.z) {
            code = code.concat([
                gcode('; Z-Probe no-safe'),
                gcode(probeCommand, {
                    Z: ZProbeDistance,
                    F: quickFeedrate
                }),
                gcode('G91'),
                gcode('G0', {
                    Z: retractDistance
                }),
                gcode(probeCommand, {
                    Z: ZProbeDistance,
                    F: normalFeedrate
                }),
                gcode('G10', {
                    L: 20,
                    P: workspace,
                    Z: zThickness
                }),
                gcode('G91'),
                gcode('G0', {
                    Z: retractDistance
                }),
            ]);
        }

        // We always probe X and Y based if we're running this function
        code = code.concat([
            // X First - move to left of plate
            gcode('G0', {
                X: -20
            }),
            // Move down to impact plate from side
            gcode('G0', {
                Z: -15
            }),
            gcode(probeCommand, {
                X: XYProbeDistance,
                F: quickFeedrate
            }),
            gcode('G91'),
            gcode('G0', {
                X: XYRetract
            }),
            gcode(probeCommand, {
                X: XYProbeDistance,
                F: normalFeedrate
            }),
            gcode('G4', {
                P: this.DWELL_TIME
            }),
            gcode('G91'),
            gcode('G10', {
                L: 20,
                P: workspace,
                X: toolCompensatedThickness
            }),
            // Move for Y Touch - toward front + to right
            gcode('G0', {
                X: -(2 * retractDistance)
            }),
            gcode('G0', {
                Y: -20
            }),
            gcode('G0', {
                X: 20
            }),
            gcode(probeCommand, {
                Y: XYProbeDistance,
                F: quickFeedrate
            }),
            gcode('G91'),
            gcode('G0', {
                Y: XYRetract
            }),
            gcode(probeCommand, {
                Y: XYProbeDistance,
                F: normalFeedrate
            }),
            gcode('G4', {
                P: this.DWELL_TIME
            }),
            gcode('G91'),
            gcode('G10', {
                L: 20,
                P: workspace,
                Y: toolCompensatedThickness
            }),
            gcode('G0', {
                Y: XYRetract
            }),
        ]);
        // Make sure we're in the correct mode at end of probe
        code = code.concat([
            this.gcode('G90')
        ]);
        return code;
    }

    generateProbeCommands() {
        const state = { ...this.state };
        const {
            useSafeProbeOption,
            retractionDistance,
            probeCommand,
            probeFeedrate,
            touchplate
        } = state;
        const { axes } = this.determineProbeOptions(state.availableProbeCommands[state.selectedProbeCommand]);
        const wcs = this.getWorkCoordinateSystem();
        const code = [];

        const gCodeParams = {
            wcs: wcs,
            isSafe: useSafeProbeOption,
            probeCommand: probeCommand,
            retractDistance: retractionDistance,
            normalFeedrate: probeFeedrate,
            quickFeedrate: probeFeedrate + 25,
        };

        const axesCount = Object.keys(axes).filter(axis => axes[axis]).length;
        // Probe setup code
        this.generateInitialProbeSettings(axes, wcs).map(line => code.push(line));

        if (axesCount === 1) {
            if (axes.z) {
                (this.generateSingleAxisCommands('Z', touchplate.zThickness, gCodeParams)).map(line => code.push(line));
            }
            if (axes.y) {
                (this.generateSingleAxisCommands('Y', touchplate.xyThickness, gCodeParams)).map(line => code.push(line));
            }
            if (axes.x) {
                (this.generateSingleAxisCommands('X', touchplate.xyThickness, gCodeParams)).map(line => code.push(line));
            }
        }

        if (axesCount > 1) {
            (this.generateMultiAxisCommands(axes, touchplate.xyThickness, touchplate.zThickness, gCodeParams)).map(line => code.push(line));
        }

        return code;
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    getWorkCoordinateSystem() {
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

    canClick() {
        const { port, workflow } = this.state;
        const controllerType = this.state.controller.type;
        const controllerState = this.state.controller.state;

        if (!port) {
            return false;
        }
        if (workflow.state !== WORKFLOW_STATE_IDLE) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], controllerType)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                GRBL_ACTIVE_STATE_IDLE
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === MARLIN) {
            // Marlin does not have machine state
        }
        if (controllerType === SMOOTHIE) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                SMOOTHIE_ACTIVE_STATE_IDLE
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
                TINYG_MACHINE_STATE_END
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

    subscribe() {
        const tokens = [
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

    render() {
        const { widgetId, active, embedded } = this.props;
        const { minimized, isFullscreen } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state,
            canClick: this.canClick(),
            connected: controller.port
        };
        const actions = {
            ...this.actions
        };
        const { status } = controller.state || {};
        const { probeActive } = status || false;

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header embedded={embedded}>
                    <Widget.Title>
                        <Widget.Sortable className={this.props.sortable.handleClassName}>
                            <i className="fa fa-bars" />
                            <Space width="8" />
                        </Widget.Sortable>
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Probe')}
                    </Widget.Title>
                    <Widget.Controls className={this.props.sortable.filterClassName}>
                        <Widget.Button
                            disabled={isFullscreen}
                            title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                            onClick={actions.toggleMinimized}
                        >
                            <i
                                className={classNames(
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
                                    className={classNames(
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
                    className={classNames(
                        styles['widget-content'],
                        { [styles.hidden]: minimized }
                    )}
                    active={active}
                >
                    {state.modal.name === MODAL_PREVIEW &&
                    <RunProbe state={state} actions={actions} />
                    }
                    <Probe
                        state={state}
                        actions={actions}
                        probeActive={probeActive}
                    />
                </Widget.Content>
            </Widget>
        );
    }
}

export default ProbeWidget;
