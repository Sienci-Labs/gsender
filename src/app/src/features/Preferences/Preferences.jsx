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
import { connect } from 'react-redux';
import pubsub from 'pubsub-js';
import _ from 'lodash';
import get from 'lodash/get';
import controller from 'app/lib/controller';
import Events from './ToolChange';
import ProgramEvents from './/Events';
import gamepad from 'app/lib/gamepad';
import { Toaster, TOASTER_SUCCESS } from '../../lib/toaster/ToasterLib';
import General from './General';
import Shortcuts from './Shortcuts';
import ProbeSettings from './Probe';
import SpindleLaser from './SpindleLaser';
import WidgetConfig from 'app/features/WidgetConfig/WidgetConfig';
import VisualizerSettings from './Visualizer';
import About from './About';
import Rotary from './Rotary';
import store from '../../store';
import styles from './index.module.styl';
import {
    METRIC_UNITS,
    IMPERIAL_UNITS,
    ROTARY_MODE_FIRMWARE_SETTINGS,
    WORKFLOW_STATE_RUNNING,
    DEFAULT_FIRMWARE_SETTINGS,
} from '../../constants';
import { convertToImperial, convertToMetric } from './calculate';
import {
    DARK_THEME_VALUES,
    PARTS_LIST,
    G1_PART,
} from 'app/features/Visualizer/constants';
import StatsPage from './Stats';
import SafetySettings from './Safety';
//from '../../widgets/Visualizer/constants';
import { roundMetric } from '../../lib/rounding';
import { toast } from 'app/lib/toaster';

class PreferencesPage extends PureComponent {
    probeConfig = new WidgetConfig('probe');

    visualizerConfig = new WidgetConfig('visualizer');

    spindleConfig = new WidgetConfig('spindle');

    state = this.getInitialState();

    // this makes sure a toast won't pop up upon opening preferences while there's a job/test run/outline
    shouldShowToast =
        this.props.workflow?.state !== WORKFLOW_STATE_RUNNING &&
        this.props.feederStatus?.queue === 0;

    showToast = _.throttle(
        () => {
            toast.success('Settings Updated');
        },
        3000,
        { trailing: false },
    );

    getInitialState() {
        return {
            selectedMenu: 0,
            units: store.get('workspace.units', METRIC_UNITS),
            reverseWidgets: store.get('workspace.reverseWidgets', false),
            autoReconnect: store.get('widgets.connection.autoReconnect', false),
            baudrate: store.get('widgets.connection.baudrate', 115200),
            safeRetractHeight: store.get('workspace.safeRetractHeight', 10),
            customDecimalPlaces: store.get('workspace.customDecimalPlaces', 0),
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state,
            },
            menu: [
                {
                    id: 0,
                    label: 'General',
                    component: General,
                },
                {
                    id: 1,
                    label: 'Safety',
                    component: SafetySettings,
                },
                {
                    id: 2,
                    label: 'Probe',
                    component: ProbeSettings,
                },
                {
                    id: 3,
                    label: 'Spindle/Laser',
                    component: SpindleLaser,
                },
                {
                    id: 4,
                    label: 'Visualizer',
                    component: VisualizerSettings,
                },
                {
                    id: 5,
                    label: 'Shortcuts',
                    component: Shortcuts,
                },
                {
                    id: 6,
                    label: 'Job History & Stats',
                    component: StatsPage,
                },
                {
                    id: 7,
                    label: 'Program Events',
                    component: ProgramEvents,
                },
                {
                    id: 8,
                    label: 'Tool Change',
                    component: Events,
                },
                {
                    id: 9,
                    label: 'Rotary',
                    component: Rotary,
                },
                {
                    id: 10,
                    label: 'About',
                    component: About,
                },
            ],
            tools: store.get('workspace[tools]', []),
            tool: {
                metricDiameter: 0,
                imperialDiameter: 0,
                type: 'End Mill',
            },
            probe: store.get('workspace[probeProfile]'),
            probeSettings: {
                retractionDistance: this.probeConfig.get(
                    'retractionDistance',
                    {},
                ),
                normalFeedrate: this.probeConfig.get('probeFeedrate', {}),
                fastFeedrate: this.probeConfig.get('probeFastFeedrate', {}),
                probeCommand: this.probeConfig.get('probeCommand', 'G38.2'),
                connectivityTest: this.probeConfig.get(
                    'connectivityTest',
                    true,
                ),
                zProbeDistance: this.probeConfig.get('zProbeDistance', {}),
            },
            laser: {
                ...this.spindleConfig.get('laser'),
            },
            spindle: {
                ...this.spindleConfig.get(),
                delay: this.spindleConfig.get('delay'),
            },
            visualizer: {
                minimizeRenders: this.visualizerConfig.get('minimizeRenders'),
                theme: this.visualizerConfig.get('theme'),
                objects: this.visualizerConfig.get('objects'),
                disabled: this.visualizerConfig.get('disabled'),
                disabledLite: this.visualizerConfig.get('disabledLite'),
                showSoftLimitsWarning: this.visualizerConfig.get(
                    'showSoftLimitsWarning',
                    false,
                ),
                SVGEnabled: this.visualizerConfig.get('SVGEnabled', false),
                jobEndModal: this.visualizerConfig.get('jobEndModal', true),
            },
            showWarning: store.get('widgets.visualizer.showWarning'),
            showLineWarnings: store.get('widgets.visualizer.showLineWarnings'),
            spindleDelay: store.get('widgets.spindle.delay'),
            shouldWarnZero: store.get('workspace.shouldWarnZero', false),
            ipRange: store.get('widgets.connection.ip', [192, 168, 5, 1]),
            toolChange: {
                passthrough: store.get(
                    'workspace.toolChange.passthrough',
                    false,
                ),
            },
            rotary: {
                firmwareSettings: store.get(
                    'workspace.rotaryAxis.firmwareSettings',
                    ROTARY_MODE_FIRMWARE_SETTINGS,
                ),
                defaultFirmwareSettings: store.get(
                    'workspace.rotaryAxis.defaultFirmwareSettings',
                    DEFAULT_FIRMWARE_SETTINGS,
                ),
            },
        };
    }

    actions = {
        setSelectedMenu: (index) => {
            this.setState({
                selectedMenu: index,
            });
        },
        general: {
            setSafeRetractHeight: (e) => {
                const value = Math.abs(Number(e.target.value));
                this.setState({
                    safeRetractHeight: value,
                });
                pubsub.publish('safeHeight:update', value);
            },
            setCustomDecimalPlaces: (e) => {
                let value = Math.abs(Number(e.target.value));
                if (value < 0) {
                    value = 0;
                } else if (value > 5) {
                    value = 5;
                }
                e.target.value = value;
                this.setState({
                    customDecimalPlaces: value,
                });
                controller.command('checkStateUpdate');
            },
            setUnits: (units) => {
                this.setState(
                    {
                        units: units,
                    },
                    this.convertUnits(),
                );
                pubsub.publish('units:change', units);
            },
            setReverseWidgets: () => {
                const reverseWidgetState = !this.state.reverseWidgets;
                this.setState({
                    reverseWidgets: reverseWidgetState,
                });
                pubsub.publish('widgets:reverse', reverseWidgetState);
            },
            setAutoReconnect: () => {
                const autoReconnect = !this.state.autoReconnect;
                this.setState({
                    autoReconnect: autoReconnect,
                });
                pubsub.publish('autoReconnect:update', autoReconnect);
            },
            setBaudrate: (option) => {
                this.setState({
                    baudrate: option.value,
                });
                pubsub.publish('baudrate:update', option.value);
            },
            setShowWarning: (shouldShow) => {
                store.set('widgets.visualizer.showWarning', shouldShow);
                this.setState({ showWarning: shouldShow });
                pubsub.publish('gcode:showWarning', shouldShow);
            },
            setShowLineWarnings: (shouldShow) => {
                store.set('widgets.visualizer.showLineWarnings', shouldShow);
                this.setState({ showLineWarnings: shouldShow });
                pubsub.publish('gcode:showLineWarnings', shouldShow);
            },
            setShouldWarnZero: (shouldShow) => {
                store.set('workspace.shouldWarnZero', shouldShow);
                this.setState({ shouldWarnZero: shouldShow });
                pubsub.publish('gcode:shouldWarnZero', shouldShow);
            },
            setIPRange: (value, index) => {
                const { ipRange } = this.state;
                const newIPRange = [...ipRange];
                newIPRange[index] = value;
                store.replace('widgets.connection.ip', newIPRange);
                this.setState({ ipRange: newIPRange });
            },
        },
        tool: {
            setImperialDiameter: (e) => {
                const diameter = Number(e.target.value);
                const metricDiameter = convertToMetric(diameter);
                const tool = this.state.tool;
                this.setState({
                    tool: {
                        ...tool,
                        metricDiameter: metricDiameter,
                        imperialDiameter: diameter,
                    },
                });
            },
            setMetricDiameter: (e) => {
                const diameter = Number(e.target.value);
                const imperialDiameter = convertToImperial(diameter);
                const tool = this.state.tool;
                this.setState({
                    tool: {
                        ...tool,
                        metricDiameter: diameter,
                        imperialDiameter: imperialDiameter,
                    },
                });
            },
            setToolType: (e) => {
                const type = e.value;
                const tool = this.state.tool;
                this.setState({
                    tool: {
                        ...tool,
                        type: type,
                    },
                });
            },
            addTool: () => {
                const tools = [...this.state.tools];
                const tool = this.state.tool;
                tools.push(tool);
                tools.sort(this.toolSortCompare);
                this.setState({
                    tools: tools,
                });
                pubsub.publish('tools:updated');
            },
            deleteTool: (index) => {
                const tools = [...this.state.tools];
                tools.splice(index, 1);
                this.setState({
                    tools: [...tools],
                });
                pubsub.publish('tools:updated');
            },
        },
        probe: {
            handleToggleChange: (...keys) => {
                const probe = { ...this.state.probe };
                const functions = { ...probe.functions };

                keys.forEach((key) => {
                    functions[key] = !functions[key];
                });
                this.setState({
                    probe: {
                        ...probe,
                        functions: {
                            ...functions,
                        },
                    },
                });
                pubsub.publish('probe:updated');
            },
            changeRetractionDistance: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Math.abs(Number(e.target.value).toFixed(3) * 1);

                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS
                        ? value
                        : Math.abs(convertToMetric(value));

                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        retractionDistance: metricValue,
                    },
                });
            },
            changeNormalFeedrate: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Math.abs(Number(e.target.value).toFixed(3) * 1);
                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS
                        ? value
                        : Math.abs(convertToMetric(value));

                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        normalFeedrate: metricValue,
                    },
                });
            },
            changeFastFeedrate: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Math.abs(Number(e.target.value).toFixed(3) * 1);
                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS
                        ? value
                        : Math.abs(convertToMetric(value));

                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        fastFeedrate: metricValue,
                    },
                });
            },
            changeXYThickness: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };
                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS
                        ? value
                        : convertToMetric(value);

                this.setState({
                    probe: {
                        ...probe,
                        xyThickness: metricValue,
                    },
                });
                pubsub.publish('probe:updated');
            },
            changeZThickness: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };
                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS ? value : convertToMetric(value);

                this.setState({
                    probe: {
                        ...probe,
                        zThickness: metricValue,
                    },
                });
                pubsub.publish('probe:updated');
            },
            changePlateWidth: (e) => {
                const value = Math.abs(Number(e.target.value));
                const probe = { ...this.state.probe };

                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS ? value : convertToMetric(value);

                this.setState({
                    probe: {
                        ...probe,
                        plateWidth: metricValue,
                    },
                });
            },
            changePlateLength: (e) => {
                const value = Math.abs(Number(e.target.value));
                const probe = { ...this.state.probe };

                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS ? value : convertToMetric(value);

                this.setState({
                    probe: {
                        ...probe,
                        plateLength: metricValue,
                    },
                });
            },
            changeConnectivityTest: (value) => {
                const probeSettings = { ...this.state.probeSettings };
                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        connectivityTest: value,
                    },
                });
                pubsub.publish('probe:test', value);
            },
            changeZProbeDistance: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Math.abs(Number(e.target.value).toFixed(3) * 1);

                const { units } = this.state;

                const metricValue =
                    units === METRIC_UNITS
                        ? value
                        : Math.abs(convertToMetric(value));

                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        zProbeDistance: metricValue,
                    },
                });
            },
        },
        laser: {
            handleOffsetChange: (e, axis) => {
                const { units } = this.state;
                const laser = this.spindleConfig.get('laser');
                let value = Number(e.target.value) || 0;
                if (units === IMPERIAL_UNITS) {
                    value = convertToMetric(value);
                } else {
                    value = roundMetric(value, units);
                }
                if (axis === 'X') {
                    this.spindleConfig.set('laser.xOffset', value);
                    this.setState({
                        laser: {
                            ...laser,
                            xOffset: value,
                        },
                    });
                } else if (axis === 'Y') {
                    this.spindleConfig.set('laser.yOffset', value);
                    this.setState({
                        laser: {
                            ...laser,
                            yOffset: value,
                        },
                    });
                }
            },
            setPower: (val, type) => {
                const amount = Math.abs(Number(val));
                const { laser } = this.state;

                if (!val || !type || amount < 0) {
                    return;
                }

                const newLaserValue = { ...laser, [type]: amount };

                this.spindleConfig.set(`laser.${type}`, amount);
                this.setState({
                    laser: newLaserValue,
                });

                pubsub.publish('laser:updated', newLaserValue);
            },
        },
        spindle: {
            setSpeed: (val, type) => {
                const amount = Math.abs(Number(val));
                const { spindle } = this.state;

                if (!val || !type) {
                    return;
                }

                const newSpindleValue = { ...spindle, [type]: amount };

                this.setState({ spindle: newSpindleValue });

                pubsub.publish('spindle:updated', newSpindleValue);
            },
            handleDelayChange: (delay) => {
                this.setState({
                    spindleDelay: delay,
                });
            },
        },
        visualizer: {
            handleMinimizeRenderToggle: () => {
                const { visualizer } = this.state;
                const { minimizeRenders } = visualizer;
                this.setState({
                    visualizer: {
                        ...visualizer,
                        minimizeRenders: !minimizeRenders,
                    },
                });
                pubsub.publish('visualizer:settings');
            },
            handleThemeChange: (theme) => {
                const { visualizer } = this.state;
                this.setState({
                    visualizer: {
                        ...visualizer,
                        theme: theme.value,
                    },
                });
                pubsub.publish('theme:change', theme.value);
            },
            handleCustThemeChange: (themeColours, theme) => {
                const { visualizer } = this.state;
                PARTS_LIST.map((value) => {
                    let label = value;
                    if (value === G1_PART) {
                        label = 'G1-3';
                    }
                    return this.visualizerConfig.set(
                        theme + ' ' + label,
                        themeColours.get(value),
                    );
                });
                this.setState({
                    visualizer: {
                        ...visualizer,
                        theme: theme,
                    },
                });
                pubsub.publish('theme:change', theme);
            },
            handleChangeComplete: (color, part) => {
                const { visualizer } = this.state;
                this.visualizerConfig.set(
                    'temp ' + visualizer.theme + ' ' + part,
                    color.hex,
                );
            },
            handlePartChange: () => {
                pubsub.publish('part:change');
            },
            getDefaultColour: (part) => {
                return DARK_THEME_VALUES.get(part) || '#000000';
            },
            getCurrentColor: (theme, part, defaultColour) => {
                return this.visualizerConfig.get(
                    theme + ' ' + part,
                    defaultColour,
                );
            },
            handleVisEnabledToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                if (liteMode) {
                    const value = visualizer.disabledLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            disabledLite: !value,
                        },
                    });
                } else {
                    const value = visualizer.disabled;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            disabled: !value,
                        },
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleSVGEnabledToggle: () => {
                const { visualizer } = this.state;
                const value = visualizer.SVGEnabled;
                this.setState({
                    visualizer: {
                        ...visualizer,
                        SVGEnabled: !value,
                    },
                });
                pubsub.publish('visualizer:settings');
            },
            handleCutPathToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                const { objects } = visualizer;
                const { cutPath } = objects;
                if (liteMode) {
                    const value = cutPath.visibleLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cutPath: {
                                    ...cutPath,
                                    visibleLite: !value,
                                },
                            },
                        },
                    });
                } else {
                    const value = cutPath.visible;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cutPath: {
                                    ...cutPath,
                                    visible: !value,
                                },
                            },
                        },
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleAnimationToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                const { objects } = visualizer;
                const { cuttingToolAnimation } = objects;
                if (liteMode) {
                    const value = cuttingToolAnimation.visibleLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingToolAnimation: {
                                    ...cuttingToolAnimation,
                                    visibleLite: !value,
                                },
                            },
                        },
                    });
                } else {
                    const value = cuttingToolAnimation.visible;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingToolAnimation: {
                                    ...cuttingToolAnimation,
                                    visible: !value,
                                },
                            },
                        },
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleBitToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                const { objects } = visualizer;
                const { cuttingTool } = objects;
                if (liteMode) {
                    const value = cuttingTool.visibleLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingTool: {
                                    ...cuttingTool,
                                    visibleLite: !value,
                                },
                            },
                        },
                    });
                } else {
                    const value = cuttingTool.visible;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingTool: {
                                    ...cuttingTool,
                                    visible: !value,
                                },
                            },
                        },
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleLimitsWarningToggle: () => {
                const { visualizer } = this.state;
                this.visualizerConfig.set(
                    'showSoftLimitsWarning',
                    !this.state.visualizer.showSoftLimitsWarning,
                );
                pubsub.publish(
                    'softlimits:changevisibility',
                    !this.state.visualizer.showSoftLimitsWarning,
                );
                this.setState({
                    visualizer: {
                        ...visualizer,
                        showSoftLimitsWarning:
                            !this.state.visualizer.showSoftLimitsWarning,
                    },
                });
                pubsub.publish('visualizer:settings');
            },
            setJobEndModal: () => {
                const { visualizer } = this.state;
                const value = visualizer.jobEndModal;
                this.setState({
                    visualizer: {
                        ...visualizer,
                        jobEndModal: !value,
                    },
                });
                pubsub.publish('visualizer:settings');
            },
        },
        toolChange: {
            handlePassthroughToggle: () => {
                const { toolChange } = this.state;
                this.setState({
                    toolChange: {
                        ...toolChange,
                        passthrough: !toolChange.passthrough,
                    },
                });
            },
        },
        rotary: {
            updateFirmwareSetting: (setting, value) => {
                store.replace(
                    `workspace.rotaryAxis.firmwareSettings[${setting}]`,
                    value,
                );

                this.setState((prev) => ({
                    rotary: {
                        ...prev.rotary,
                        firmwareSettings: {
                            ...prev.rotary.firmwareSettings,
                            [setting]: value,
                        },
                    },
                }));
            },
            updateDefaultFirmwareSetting: (setting, value) => {
                store.replace(
                    `workspace.rotaryAxis.defaultFirmwareSettings[${setting}]`,
                    value,
                );

                this.setState((prev) => ({
                    rotary: {
                        ...prev.rotary,
                        defaultFirmwareSettings: {
                            ...prev.rotary.defaultFirmwareSettings,
                            [setting]: value,
                        },
                    },
                }));
            },
            resetFirmwareToDefault: () => {
                store.replace(
                    'workspace.rotaryAxis.firmwareSettings',
                    ROTARY_MODE_FIRMWARE_SETTINGS,
                );

                this.setState((prev) => ({
                    rotary: {
                        ...prev.rotary,
                        firmwareSettings: ROTARY_MODE_FIRMWARE_SETTINGS,
                    },
                }));
            },
            resetDefaultFirmwareSettings: () => {
                store.replace(
                    'workspace.rotaryAxis.defaultFirmwareSettings',
                    DEFAULT_FIRMWARE_SETTINGS,
                );

                this.setState((prev) => ({
                    rotary: {
                        ...prev.rotary,
                        defaultFirmwareSettings: DEFAULT_FIRMWARE_SETTINGS,
                    },
                }));
            },
        },
    };

    // make sure the toast doesn't show when the state/feeder status/sender status is updating
    controllerEvents = {
        'controller:state': (type, state) => {
            this.shouldShowToast = false;
        },
        'feeder:status': (status) => {
            this.shouldShowToast = false;
        },
        'sender:status': (status) => {
            this.shouldShowToast = false;
        },
    };

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach((eventName) => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach((eventName) => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    componentDidMount() {
        controller.command('settings:updated', this.state);
        this.addControllerEvents();

        if (gamepad.holdListener) {
            gamepad.holdListener();
        }
    }

    componentWillUnmount() {
        this.removeControllerEvents();

        if (gamepad.unholdListener) {
            gamepad.unholdListener();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            tools,
            tool,
            probe,
            probeSettings,
            units,
            reverseWidgets,
            autoReconnect,
            visualizer,
            safeRetractHeight,
            customDecimalPlaces,
            spindle,
            toolChange,
            spindleDelay,
        } = this.state;

        store.set('workspace.reverseWidgets', reverseWidgets);
        store.set('workspace.safeRetractHeight', safeRetractHeight);
        store.set('workspace.customDecimalPlaces', customDecimalPlaces);
        store.set('widgets.connection.autoReconnect', autoReconnect);
        store.set('widgets.visualizer.theme', visualizer.theme);
        store.set('widgets.visualizer.disabled', visualizer.disabled);
        store.set('widgets.visualizer.disabledLite', visualizer.disabledLite);
        store.set('widgets.visualizer.SVGEnabled', visualizer.SVGEnabled);
        store.set(
            'widgets.visualizer.minimizeRenders',
            visualizer.minimizeRenders,
        );
        store.set('widgets.visualizer.jobEndModal', visualizer.jobEndModal);
        store.set('workspace.units', units);
        store.replace('workspace[tools]', tools);
        store.replace('widgets.visualizer.objects', visualizer.objects);
        store.set('workspace[tool]', tool);
        store.replace('workspace[probeProfile]', probe);
        store.set('widgets.spindle.spindleMax', spindle.spindleMax);
        store.set('widgets.spindle.spindleMin', spindle.spindleMin);
        store.set('widgets.spindle.delay', spindleDelay);
        this.probeConfig.set(
            'retractionDistance',
            probeSettings.retractionDistance,
        );
        this.probeConfig.set('probeFeedrate', probeSettings.normalFeedrate);
        this.probeConfig.set('probeFastFeedrate', probeSettings.fastFeedrate);
        this.probeConfig.set(
            'connectivityTest',
            probeSettings.connectivityTest,
        );
        this.probeConfig.set('zProbeDistance', probeSettings.zProbeDistance);
        store.set('workspace.toolChange.passthrough', toolChange.passthrough);

        controller.command('settings:updated', this.state);

        if (prevState.selectedMenu !== this.state.selectedMenu) {
            return;
        }

        if (this.shouldShowToast) {
            this.showToast();
        } else {
            this.shouldShowToast = true;
        }
    }

    toolSortCompare(a, b) {
        if (a.metricDiameter < b.metricDiameter) {
            return -1;
        }
        if (a.metricDiameter > b.metricDiameter) {
            return 1;
        }
        return 0;
    }

    convertUnits() {
        let { units, safeRetractHeight } = this.state;
        if (units === METRIC_UNITS) {
            safeRetractHeight = convertToImperial(safeRetractHeight);
        } else {
            safeRetractHeight = convertToMetric(safeRetractHeight);
        }
        this.setState({
            safeRetractHeight: safeRetractHeight,
        });
        pubsub.publish('safeHeight:update', safeRetractHeight);
    }

    render() {
        const { modalClose } = this.props;
        const state = { ...this.state };
        const actions = { ...this.actions };
        const { menu, selectedMenu } = state;

        return (
            <>
                <div className={styles.preferencesContainer}>
                    <div className={styles.preferencesContent}>
                        <div className={styles.preferencesMenu}>
                            <h3>Settings</h3>
                            {menu.map((menuItem, index) => (
                                <button
                                    type="button"
                                    key={`section-${menuItem.label}`}
                                    className={
                                        index === selectedMenu
                                            ? styles.activeMenu
                                            : ''
                                    }
                                    onClick={() =>
                                        actions.setSelectedMenu(index)
                                    }
                                >
                                    {menuItem.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.preferencesOptions}>
                            {menu.map((menuItem, index) =>
                                index === selectedMenu ? (
                                    <div key={menuItem.id}>
                                        <menuItem.component
                                            actions={actions}
                                            state={state}
                                            active={index === selectedMenu}
                                        />
                                    </div>
                                ) : null,
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    const feederStatus = get(store, 'controller.feeder.status');
    return { workflow, feederStatus };
})(PreferencesPage);
