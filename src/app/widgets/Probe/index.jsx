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
import get from 'lodash/get';
import includes from 'lodash/includes';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import map from 'lodash/map';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import pubsub from 'pubsub-js';
import { TOUCHPLATE_TYPE_AUTOZERO, PROBE_TYPE_AUTO, TOUCHPLATE_TYPE_ZERO, PROBE_TYPE_TIP } from 'app/lib/constants';
import store from 'app/store';
import { mm2in } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig';
import Probe from './Probe';
import RunProbe from './RunProbe';
import {
    // Units
    METRIC_UNITS,
    // Grbl
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_IDLE,
    WORKFLOW_STATE_IDLE
} from '../../constants';
import {
    MODAL_NONE,
    MODAL_PREVIEW
} from './constants';
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

    PROBE_DISTANCE_METRIC = {
        X: 50,
        Y: 50,
        Z: this.state.zProbeDistance ? this.state.zProbeDistance.mm : 30
    };

    PROBE_DISTANCE_IMPERIAL = {
        X: 2,
        Y: 2,
        Z: this.state.zProbeDistance ? this.state.zProbeDistance.in : 1.2
    };


    DWELL_TIME = 0.3;

    testInterval = null;

    actions = {
        startConnectivityTest: () => {
            const { connectivityTest } = this.state;
            const { returnProbeConnectivity } = this.actions;

            if (this.testInterval) {
                clearInterval(this.testInterval);
                this.testInterval = null;
            }
            if (!connectivityTest) {
                this.setState({
                    connectionMade: true
                });
                return;
            }
            this.testInterval = setInterval(() => {
                if (returnProbeConnectivity()) {
                    this.setState({
                        connectionMade: true,
                    });
                    clearInterval(this.testInterval);
                    this.testInterval = null;
                }
            }, 250);
        },
        setProbeConnectivity: (connectionMade) => {
            this.setState({ connectionMade });
        },
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
            if (name === MODAL_PREVIEW) {
                this.actions.startConnectivityTest();
            }
            this.setState({
                modal: {
                    name: name,
                    params: params
                }
            });
        },
        closeModal: () => {
            if (this.testInterval) {
                clearInterval(this.testInterval);
            }
            this.testInterval = false;

            this.setState({
                modal: {
                    name: MODAL_NONE,
                    params: {}
                },
                connectionMade: false
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
        handleProbeCommandChange: (index) => {
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
            const functions = {};

            if (selectedProfile.touchplateType === TOUCHPLATE_TYPE_ZERO) {
                functions.z = true;
            } else {
                functions.z = true;
                functions.y = true;
                functions.x = true;
            }

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
            const { probePinStatus } = this.props;
            return probePinStatus;
        },
        setToolDiameter: (selection) => {
            let diameter;
            const { value } = selection || 0.00;
            if (value === 'Tip' || value === 'Auto') {
                diameter = value;
            } else {
                diameter = Number(value) || 0.00;
            }
            this.setState({
                toolDiameter: diameter
            });
        },
        setProbeType: (type) => {
            this.setState({ probeType: type });
        }
    };

    unitsDidChange = false;

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
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

        const { probeCommand, useTLO, touchPlateHeight, probeDepth } = this.state;
        this.config.set('probeCommand', probeCommand);
        this.config.set('useTLO', useTLO);
        this.config.set('probeDepth', probeDepth);
        this.config.set('touchPlateHeight', touchPlateHeight);

        // get updated settings
        this.getUpdatedSettings();
    }

    getUpdatedSettings() {
        this.setState({
            probeFeedrate: this.config.get('probeFeedrate') || this.state.probeFeedrate,
            probeFastFeedrate: this.config.get('probeFastFeedrate') || this.state.probeFastFeedrate,
            retractionDistance: this.config.get('retractionDistance') || this.state.retractionDistance,
        });
    }

    getInitialState() {
        const units = store.get('workspace.units');
        const availableTools = store.get('workspace.tools', []);

        const touchplateType = store.get('workspace.probeProfile.touchplateType');
        let toolDiameter;

        if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
            toolDiameter = PROBE_TYPE_AUTO;
        } else {
            toolDiameter = availableTools[0][units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter'];
        }

        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            toolChangeActive: false,
            port: controller.port,
            units,
            modal: {
                name: MODAL_NONE,
                params: {}
            },
            probeAxis: this.config.get('probeAxis', 'Z'),
            probeCommand: this.config.get('probeCommand', 'G38.2'),
            useTLO: this.config.get('useTLO'),
            probeDepth: this.config.get('probeDepth') || {},
            probeFeedrate: this.config.get('probeFeedrate') || {},
            probeFastFeedrate: this.config.get('probeFastFeedrate') || {},
            touchPlateHeight: this.config.get('touchPlateHeight') || {},
            retractionDistance: this.config.get('retractionDistance') || {},
            zProbeDistance: this.config.get('zProbeDistance') || {},
            touchplate: store.get('workspace[probeProfile]', {}),
            availableTools,
            toolDiameter,
            useSafeProbeOption: false,
            availableProbeCommands: [],
            selectedProbeCommand: 0,
            connectivityTest: this.config.get('connectivityTest'),
            probeType: PROBE_TYPE_AUTO,
            connectionMade: false
        };
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

    generateInitialProbeSettings(axes, wcs, modal) {
        const axesToZero = {};
        Object.keys(axes).forEach((axis) => {
            if (axes[axis]) {
                axesToZero[axis.toUpperCase()] = 0;
            }
        });
        return [
            this.gcode('; Initial Probe setup'),
            this.gcode('; Set initial zero for specified axes'),
            this.gcode('%UNITS=modal.units'),
            this.gcode('G10', {
                L: 20,
                P: this.mapWCSToPValue(wcs),
                ...axesToZero
            }),
            this.gcode('G91', {
                G: modal
            }),
        ];
    }

    generateSingleAxisCommands(axis, thickness, params) {
        let { wcs, isSafe, probeCommand, retractDistance, normalFeedrate, quickFeedrate, units, modal } = params;
        const workspace = this.mapWCSToPValue(wcs);
        let probeDistance = (units === METRIC_UNITS) ? this.PROBE_DISTANCE_METRIC[axis] : this.PROBE_DISTANCE_IMPERIAL[axis];
        probeDistance = (isSafe) ? -probeDistance : probeDistance;
        probeDistance = (axis === 'Z') ? (-1 * Math.abs(probeDistance)) : probeDistance;
        retractDistance = (axis === 'Z') ? retractDistance : retractDistance * -1;

        const unitModal = `G${modal}`;

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
            const toolDiameter = this.state.toolDiameter;
            const toolRadius = (toolDiameter / 2);
            const toolCompensatedThickness = ((-1 * toolRadius) - thickness).toFixed(3);
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
            this.gcode(`G91 ${unitModal}`),
            this.gcode('G0', {
                [axis]: (retractDistance)
            })
        ]);

        // Go up on Z if X or Y
        if (axis !== 'Z') {
            const { touchPlateHeight, units } = this.state;
            const touchplateThickness = (units === METRIC_UNITS) ? touchPlateHeight : mm2in(touchPlateHeight);
            code = code.concat([
                this.gcode('G0', {
                    Z: -1 * ((retractDistance * 4) - touchplateThickness)
                })
            ]);
        }

        code = code.concat([
            this.gcode(`${unitModal} G90`)
        ]);
        return code;
    }

    generateMultiAxisCommands(axes, xyThickness, zThickness, params) {
        let code = [];
        let { wcs, isSafe, probeCommand, retractDistance, normalFeedrate, quickFeedrate, units } = params;
        const workspace = this.mapWCSToPValue(wcs);
        const XYRetract = -retractDistance;
        let XYProbeDistance = (units === METRIC_UNITS) ? this.PROBE_DISTANCE_METRIC.X : this.PROBE_DISTANCE_IMPERIAL.X;
        let ZProbeDistance = (units === METRIC_UNITS) ? this.PROBE_DISTANCE_METRIC.Z : this.PROBE_DISTANCE_IMPERIAL.Z;
        ZProbeDistance *= -1;
        XYProbeDistance = (isSafe) ? -XYProbeDistance : XYProbeDistance;
        const gcode = this.gcode;

        // Calculate tool offset using radius and block thickness to origin
        const toolDiameter = this.state.toolDiameter;
        const toolRadius = (toolDiameter / 2);
        const toolCompensatedThickness = ((-1 * toolRadius) - xyThickness).toFixed(3);
        const zPositionAdjust = (units === METRIC_UNITS) ? 15 : mm2in(15).toFixed(3);
        let xyMovement = toolDiameter + 20; // 20mm + width of the tool
        const xyPositionAdjust = (units === METRIC_UNITS) ? xyMovement : mm2in(xyMovement).toFixed(3);
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
                // X First - move to left of plate
                gcode('G0', {
                    X: -xyPositionAdjust
                }),
                // Move down to impact plate from side
                gcode('G0', {
                    Z: -zPositionAdjust
                }),
            ]);
        }

        // Different movement based on either XYZ or XY probe
        if (!axes.z) {
            code = code.concat([
                gcode('G0', {
                    X: XYRetract,
                    Y: XYRetract
                }),
                gcode('G0', {
                    Y: xyPositionAdjust
                })
            ]);
        }


        // We always probe X and Y based if we're running this function
        code = code.concat([
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
                Y: -xyPositionAdjust
            }),
            gcode('G0', {
                X: xyPositionAdjust
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

        // Go up on Z if X or Y
        code = code.concat([
            this.gcode('G0', {
                Z: ((retractDistance * 3) + zThickness)
            }),
            this.gcode('G0', {
                Y: -1 * ((XYRetract * 3) - xyThickness)
            })
        ]);

        // Make sure we're in the correct mode at end of probe
        code = code.concat([
            this.gcode('G90')
        ]);
        return code;
    }

    generateAutoProbe(axes) {
        const code = [];
        const wcs = this.getWorkCoordinateSystem();
        const p = `P${this.mapWCSToPValue(wcs)}`;

        let prependUnits = '';
        if (this.props.$13 === '1') {
            prependUnits = 'G20';
        }

        if (axes.x && axes.y && axes.z) {
            code.push(
                '; Probe XYZ Auto Endmill',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Z5`,
                'G21 G91 G0 Z2',
                'G21 G91 G0 X-13',
                'G38.2 X-30 F150',
                'G21 G91 G0 X2',
                'G38.2 X-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X0`,
                'G21 G91 G0 X26',
                'G38.2 X30 F150',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} X[posx/2]`,
                'G21 G90 G0 X0',
                'G21 G91 G0 Y-13',
                'G38.2 Y-30 F250',
                'G21 G91 G0 Y2',
                'G38.2 Y-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Y0`,
                'G21 G91 G0 Y26',
                'G38.2 Y30 F250',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} Y[posy/2]`,
                'G21 G90 G0 X0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5 Y22.5`,
                'G21 G90 G0 X0 Y0',
                'G21 G90 Z1'
            );
        } else if (axes.x && axes.y) {
            code.push(
                '; Probe XY Auto Endmill',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G21 G91 G0 X-13',
                'G38.2 X-30 F150',
                'G21 G91 G0 X2',
                'G38.2 X-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X0`,
                'G21 G91 G0 X26',
                'G38.2 X30 F150',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} X[posx/2]`,
                'G21 G90 G0 X0',
                'G21 G91 G0 Y-13',
                'G38.2 Y-30 F150',
                'G21 G91 G0 Y2',
                'G38.2 Y-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Y0`,
                'G21 G91 G0 Y26',
                'G38.2 Y30 F150',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} Y[posy/2]`,
                'G21 G90 G0 X0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5 Y22.5`,
                'G21 G90 G0 X0 Y0',
            );
        } else if (axes.z) {
            code.push(
                '; Probe Z Auto Endmill',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Z5`,
                'G21 G91 G0 Z2',
            );
        } else if (axes.x) {
            code.push(
                '; Probe X Auto Endmill',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G21 G91 G0 X-13',
                'G38.2 X-30 F150',
                'G21 G91 G0 X2',
                'G38.2 X-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X0`,
                'G21 G91 G0 X26',
                'G38.2 X30 F150',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} X[posx/2]`,
                'G21 G90 G0 X0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5`,
            );
        } else if (axes.y) {
            code.push(
                '; Probe Y Auto Endmill',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G21 G91 G0 Y-13',
                'G38.2 Y-30 F150',
                'G21 G91 G0 Y2',
                'G38.2 Y-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Y0`,
                'G21 G91 G0 Y26',
                'G38.2 Y30 F150',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} Y[posy/2]`,
                'G21 G90 G0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} Y22.5`,
            );
        }

        return code;
    }

    generateAutoZeroAxesProbe(axes, diameter) {
        const code = [];

        const wcs = this.getWorkCoordinateSystem();
        const p = `P${this.mapWCSToPValue(wcs)}`;

        // const toolRadius = (diameter / 2);
        // const toolCompensatedThickness = ((-1 * toolRadius));
        // console.log(toolCompensatedThickness);

        if (axes.z && axes.y && axes.z) {
            code.push(
                '; Probe XYZ AutoZero Specific Diameter',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Z5`,
                'G21 G91 G0 Z2',
                'G21 G91 G0 X13',
                'G38.2 X20 F250',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X19.325`,
                'G21 G90 G0 X0',
                'G21 G91 G0 Y13',
                'G38.2 Y20 F250',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Y19.325`,
                'G21 G90 G0 X0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5 Y22.5`,
                'G21 G90 G0 X0 Y0',
                'G21 G90 G0 Z1',
            );
        } else if (axes.x && axes.y) {
            code.push(
                '; Probe XY AutoZero Specific Diameter',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G21 G91 G0 X13',
                'G38.2 X20 F250',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X19.325`,
                'G21 G90 G0 X0',
                'G21 G91 G0 Y13',
                'G38.2 Y20 F250',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Y19.325`,
                'G21 G90 G0 X0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5 Y22.5`,
                'G4 P0.15',
                'G21 G90 G0 X0 Y0',
            );
        } else if (axes.z) {
            code.push(
                '; Probe Z AutoZero Specific Diameter',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Z5`,
                'G4 P0.15',
                'G21 G91 G0 Z2',
            );
        } else if (axes.y) {
            code.push(
                '; Probe Y',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G21 G91 G0 Y13',
                'G38.2 Y20 F250',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Y19.325`,
                'G21 G90 G0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} Y22.5`,
            );
        } else if (axes.x) {
            code.push(
                '; Probe X',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G21 G91 G0 X13',
                'G38.2 X20 F250',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X19.325`,
                'G21 G90 G0 X0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5`,
            );
        }

        return code;
    }

    generateTipProbe(axes) {
        const code = [];

        const wcs = this.getWorkCoordinateSystem();
        const p = `P${this.mapWCSToPValue(wcs)}`;

        let prependUnits = '';
        if (this.props.$13 === '1') {
            prependUnits = 'G20';
        }

        if (axes.x && axes.y && axes.z) {
            code.push(
                '; Probe XYZ Auto Tip',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Z5`,
                'G21 G91 G0 Z0.5',
                'G21 G91 G0 X-3',
                'G38.2 X-30 F150',
                'G21 G91 G0 X2',
                'G38.2 X-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X0`,
                'G21 G91 G0 X14',
                'G38.2 X15 F150',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} X[posx/2]`,
                'G21 G90 G0 X0',
                'G21 G91 G0 Y-3',
                'G38.2 Y-15 F150',
                'G21 G91 G0 Y2',
                'G38.2 Y-5 F75',
                'G4 P0.1',
                `G10 L20 ${p} Y0`,
                'G21 G91 G0 Y14',
                'G38.2 Y15 F150',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} Y[posy/2]`,
                'G21 G90 G0 X0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5 Y22.5`,
                'G21 G90 G0 X0 Y0',
                'G21 G90 G0 Z1',
            );
        } else if (axes.x && axes.y) {
            code.push(
                '; Probe XY Auto Tip',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z0.5',
                'G21 G91 G0 X-3',
                'G38.2 X-30 F150',
                'G21 G91 G0 X2',
                'G38.2 X-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X0`,
                'G21 G91 G0 X14',
                'G38.2 X15 F150',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} X[posx/2]`,
                'G21 G90 G0 X0',
                'G21 G91 G0 Y-3',
                'G38.2 Y-15 F150',
                'G21 G91 G0 Y2',
                'G38.2 Y-5 F75',
                'G4 P0.1',
                `G10 L20 ${p} Y0`,
                'G21 G91 G0 Y14',
                'G38.2 Y15 F150',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} Y[posy/2]`,
                'G21 G90 G0 X0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5 Y22.5`,
                'G21 G90 G0 X0 Y0',
            );
        } else if (axes.z) {
            code.push(
                '; Probe Z Auto Tip',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} Z5`,
                'G4 P0.15',
                'G21 G91 G0 Z1',
            );
        } else if (axes.x) {
            code.push(
                '; Probe X Auto Tip',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z0.5',
                'G21 G91 G0 X-3',
                'G38.2 X-30 F150',
                'G21 G91 G0 X2',
                'G38.2 X-5 F75',
                'G4 P0.15',
                `G10 L20 ${p} X0`,
                'G21 G91 G0 X14',
                'G38.2 X15 F150',
                'G21 G91 G0 X-2',
                'G38.2 X5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} X[posx/2]`,
                'G21 G90 G0 X0',
                'G4 P0.15',
                `G10 L20 ${p} X22.5`,
            );
        } else if (axes.y) {
            code.push(
                '; Probe Y Auto Tip',
                'G21 G91',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z0.5',
                'G21 G91 G0 Y-3',
                'G38.2 Y-15 F150',
                'G21 G91 G0 Y2',
                'G38.2 Y-5 F75',
                'G4 P0.1',
                `G10 L20 ${p} Y0`,
                'G21 G91 G0 Y14',
                'G38.2 Y15 F150',
                'G21 G91 G0 Y-2',
                'G38.2 Y5 F75',
                'G4 P0.15',
                `${prependUnits} G10 L20 ${p} Y[posy/2]`,
                'G21 G90 G0 Y0',
                'G4 P0.15',
                `G10 L20 ${p} Y22.5`,
            );
        }

        return code;
    }

    generateAvailableTools() {}

    generateProbeCommands() {
        const state = { ...this.state,
            controller: {
                type: controller.type,
                state: controller.state
            }, };
        const {
            useSafeProbeOption,
            retractionDistance,
            probeCommand,
            probeFeedrate,
            probeFastFeedrate,
            touchplate,
            units,
            toolDiameter
        } = state;
        const { axes } = this.determineProbeOptions(state.availableProbeCommands[state.selectedProbeCommand]);
        const wcs = this.getWorkCoordinateSystem();
        const code = [];

        // Handle auto and tip selection to avoid code generation
        if (toolDiameter === 'Auto') {
            return this.generateAutoProbe(axes);
        }
        if (toolDiameter === 'Tip') {
            return this.generateTipProbe(axes);
        }
        if (this.state.touchplate.touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
            return this.generateAutoZeroAxesProbe(axes, toolDiameter);
        }

        // Grab units for correct modal
        let zThickness, xyThickness, feedrate, fastFeedrate, retractDistance;
        const modal = (units === METRIC_UNITS) ? '21' : '20';
        if (units === METRIC_UNITS) {
            zThickness = touchplate.zThickness.mm;
            xyThickness = touchplate.xyThickness.mm;
            feedrate = probeFeedrate.mm;
            fastFeedrate = probeFastFeedrate.mm;
            retractDistance = retractionDistance.mm;
        } else {
            zThickness = touchplate.zThickness.in;
            xyThickness = touchplate.xyThickness.in;
            feedrate = probeFeedrate.in;
            fastFeedrate = probeFastFeedrate.in;
            retractDistance = retractionDistance.in;
        }

        const gCodeParams = {
            wcs: wcs,
            isSafe: useSafeProbeOption,
            probeCommand: probeCommand,
            retractDistance: retractDistance,
            normalFeedrate: feedrate,
            quickFeedrate: fastFeedrate,
            modal: modal,
            units
        };

        const axesCount = Object.keys(axes).filter(axis => axes[axis]).length;
        // Probe setup code
        this.generateInitialProbeSettings(axes, wcs, modal).map(line => code.push(line));

        if (axesCount === 1) {
            if (axes.z) {
                (this.generateSingleAxisCommands('Z', zThickness, gCodeParams)).map(line => code.push(line));
            }
            if (axes.y) {
                (this.generateSingleAxisCommands('Y', xyThickness, gCodeParams)).map(line => code.push(line));
            }
            if (axes.x) {
                (this.generateSingleAxisCommands('X', xyThickness, gCodeParams)).map(line => code.push(line));
            }
        }

        if (axesCount > 1) {
            (this.generateMultiAxisCommands(axes, xyThickness, zThickness, gCodeParams)).map(line => code.push(line));
        }

        return code;
    }

    getWorkCoordinateSystem() {
        const controllerState = this.props.state;

        return get(controllerState, 'parserstate.modal.wcs');
    }

    canClick() {
        const { workflow, isConnected, type, state } = this.props;
        const { toolChangeActive } = this.state;

        if (!isConnected) {
            return false;
        }
        if (workflow.state !== WORKFLOW_STATE_IDLE && !toolChangeActive) {
            return false;
        }
        if (!includes([GRBL, GRBLHAL], type)) {
            return false;
        }

        const activeState = get(state, 'status.activeState');
        const states = [
            GRBL_ACTIVE_STATE_IDLE
        ];

        return includes(states, activeState);
    }

    changeUnits(units) {
        this.setState({
            units: units
        });
    }

    onStoreChange = ({ workspace }) => {
        const probeProfile = get(workspace, 'probeProfile', null);

        if (probeProfile) {
            if (probeProfile.touchplateType === TOUCHPLATE_TYPE_ZERO) {
                this.actions.handleProbeCommandChange(0);
            }
        }

        this.setState({
            probeAxis: this.config.get('probeAxis', 'Z'),
            probeCommand: this.config.get('probeCommand', 'G38.2'),
            useTLO: this.config.get('useTLO'),
            probeDepth: this.config.get('probeDepth') || {},
            probeFeedrate: this.config.get('probeFeedrate') || {},
            probeFastFeedrate: this.config.get('probeFastFeedrate') || {},
            touchPlateHeight: this.config.get('touchPlateHeight') || {},
            retractionDistance: this.config.get('retractionDistance') || {},
            zProbeDistance: this.config.get('zProbeDistance') || {},
            connectivityTest: this.config.get('connectivityTest'),
        }, () => {
            const { zProbeDistance } = this.state;
            if (zProbeDistance) {
                this.PROBE_DISTANCE_METRIC.Z = zProbeDistance.mm;
                this.PROBE_DISTANCE_IMPERIAL.Z = zProbeDistance.in;
            }
        });
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('units:change', (msg, units) => {
                this.changeUnits(units);
            }),
            pubsub.subscribe('tools:updated', (msg) => {
                this.setState({
                    availableTools: store.get('workspace[tools]', [])
                });
            }),
            pubsub.subscribe('probe:updated', (msg) => {
                const touchplate = store.get('workspace[probeProfile]', {});
                let { toolDiameter } = this.state;
                if (touchplate.touchplateType !== TOUCHPLATE_TYPE_AUTOZERO && (toolDiameter === PROBE_TYPE_AUTO || toolDiameter === PROBE_TYPE_TIP)) {
                    toolDiameter = 0;
                }
                this.setState({
                    touchplate: touchplate,
                    toolDiameter: toolDiameter
                }, () => {
                    this.actions.generatePossibleProbeCommands();
                });
            }),
            pubsub.subscribe('probe:test', (msg, value) => {
                this.setState({
                    connectivityTest: value
                });
            }),
            pubsub.subscribe('gcode:ManualToolChange', (msg, context) => {
                this.setState({
                    toolChangeActive: true
                });
            }),
            pubsub.subscribe('gcode:resume', (msg) => {
                this.setState({
                    toolChangeActive: false
                });
            }),
            pubsub.subscribe('gcode:stop', (msg) => {
                this.setState({
                    toolChangeActive: false
                });
            })

        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);

        store.on('change', this.onStoreChange);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];

        store.removeListener('change', this.onStoreChange);
    }

    render() {
        const { widgetId, active, embedded } = this.props;
        const { minimized, isFullscreen } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state,
            canClick: this.canClick(),
            connected: controller.port,
            controller: {
                type: controller.type,
                state: controller.state
            },
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
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Probe')}
                    </Widget.Title>
                    <Widget.Controls>
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
                        styles.heightOverride,
                        { [styles.hidden]: minimized }
                    )}
                    active={active}
                >
                    <RunProbe state={state} actions={actions} show={state.modal.name === MODAL_PREVIEW} />
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

export default connect((store) => {
    const state = get(store, 'controller.state');
    const probePinStatus = get(store, 'controller.state.status.pinState.P', false);
    const type = get(store, 'controller.type');
    const workflow = get(store, 'controller.workflow');
    const isConnected = get(store, 'connection.isConnected');
    const $13 = get(store, 'controller.settings.settings.$13', '0');
    return {
        probePinStatus,
        state,
        type,
        workflow,
        isConnected,
        $13
    };
})(ProbeWidget);
