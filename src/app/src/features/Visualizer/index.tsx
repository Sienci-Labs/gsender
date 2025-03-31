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

import { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import includes from 'lodash/includes';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import pubsub from 'pubsub-js';
import PropTypes from 'prop-types';

import combokeys from 'app/lib/combokeys';
import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import { colorsResponse } from 'app/workers/colors.response';
import controller from 'app/lib/controller';
import log from 'app/lib/log';
import * as WebGL from 'app/lib/three/WebGL';
import {
    Toaster,
    TOASTER_LONG,
    TOASTER_WARNING,
} from 'app/lib/toaster/ToasterLib';
import { toast } from 'app/lib/toaster';
import {
    updateFileInfo,
    updateFileProcessing,
} from 'app/store/redux/slices/fileInfo.slice';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';

import WidgetConfig from '../WidgetConfig/WidgetConfig';
import PrimaryVisualizer from './PrimaryVisualizer';
import {
    // Units
    METRIC_UNITS,
    // Grbl
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_RUN,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    // TinyG
    TINYG,
    // Workflow
    WORKFLOW_STATE_RUNNING,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_IDLE,
    RENDER_RENDERING,
    RENDER_LOADING,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_IDLE,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
    GRBL_ACTIVE_STATE_CHECK,
    CARVING_CATEGORY,
    GENERAL_CATEGORY,
    VISUALIZER_CATEGORY,
    OVERRIDES_CATEGORY,
} from '../../constants';
import {
    CAMERA_MODE_PAN,
    CAMERA_MODE_ROTATE,
    LIGHT_THEME,
    LIGHT_THEME_VALUES,
    DARK_THEME,
    DARK_THEME_VALUES,
    CUSTOMIZABLE_THEMES,
    PARTS_LIST,
} from './constants';
import SecondaryVisualizer from './SecondaryVisualizer';
import useKeybinding from '../../lib/useKeybinding';
import shuttleEvents from '../../lib/shuttleEvents';

class Visualizer extends Component {
    static propTypes = {
        widgetId: PropTypes.string,
        isSecondary: PropTypes.bool,
    };

    config = new WidgetConfig('visualizer');

    state = this.getInitialState();

    actions = {
        dismissNotification: () => {
            this.setState((state) => ({
                notification: {
                    ...state.notification,
                    type: '',
                    data: '',
                },
            }));
        },
        openModal: (name = '', params = {}) => {
            this.setState((state) => ({
                modal: {
                    name: name,
                    params: params,
                },
            }));
        },
        closeModal: () => {
            this.setState((state) => ({
                modal: {
                    name: '',
                    params: {},
                },
            }));
        },
        updateModalParams: (params = {}) => {
            this.setState((state) => ({
                modal: {
                    ...state.modal,
                    params: {
                        ...state.modal.params,
                        ...params,
                    },
                },
            }));
        },
        // Load file from watch directory
        loadFile: (file) => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: true,
                    rendering: false,
                    ready: false,
                },
            }));

            controller.command('watchdir:load', file, (err, data) => {
                if (err) {
                    this.setState((state) => ({
                        gcode: {
                            ...state.gcode,
                            loading: false,
                            rendering: false,
                            ready: false,
                        },
                    }));

                    log.error(err);
                    return;
                }

                log.debug(data); // TODO
            });
        },
        uploadFile: (gcode, meta) => {
            const { name, size } = { ...meta };
            // Send toolchange context on file load
            const hooks = store.get('workspace.toolChangeHooks', {});
            const context = {
                toolChangeOption: store.get(
                    'workspace.toolChangeOption',
                    'Ignore',
                ),
                ...hooks,
            };

            const { port, filename } = this.state;

            if (filename) {
                this.visualizer.unload();
            }

            reduxStore.dispatch(updateFileProcessing({ fileProcessing: true }));

            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: true,
                    rendering: false,
                    ready: false,
                },
            }));

            //If we aren't connected to a device, only load the gcode
            //to the visualizer and make no calls to the controller
            if (!port) {
                this.actions.loadGCode(name, gcode, size);

                return;
            }

            controller.command(
                'gcode:load',
                name,
                gcode,
                context,
                (err, data) => {
                    if (err) {
                        this.setState((state) => ({
                            gcode: {
                                ...state.gcode,
                                loading: false,
                                rendering: false,
                                ready: false,
                            },
                        }));

                        log.error(err);
                        return;
                    }

                    log.debug(data);
                },
            );
        },
        loadGCode: (name, vizualization, size) => {
            const capable = {
                view3D: !!this.visualizer,
            };

            const updater = (state) => {
                return {
                    gcode: {
                        ...state.gcode,
                        loading: false,
                        rendering: capable.view3D,
                        ready: !capable.view3D,
                        bbox: {
                            min: {
                                x: 0,
                                y: 0,
                                z: 0,
                            },
                            max: {
                                x: 0,
                                y: 0,
                                z: 0,
                            },
                        },
                        name: name,
                    },
                };
            };
            const callback = () => {
                // Clear gcode bounding box
                controller.context = {
                    ...controller.context,
                    xmin: 0,
                    xmax: 0,
                    ymin: 0,
                    ymax: 0,
                    zmin: 0,
                    zmax: 0,
                };

                if (!capable.view3D) {
                    return;
                }

                setTimeout(() => {
                    this.visualizer.load(name, vizualization, ({ bbox }) => {
                        // Set gcode bounding box
                        controller.context = {
                            ...controller.context,
                            xmin: bbox.min.x,
                            xmax: bbox.max.x,
                            ymin: bbox.min.y,
                            ymax: bbox.max.y,
                            zmin: bbox.min.z,
                            zmax: bbox.max.z,
                        };

                        const { port } = this.state;

                        this.setState((state) => ({
                            gcode: {
                                ...state.gcode,
                                loading: false,
                                rendering: false,
                                ready: true,
                                bbox: bbox,
                                loadedBeforeConnection: !port,
                            },
                            filename: name,
                            fileSize: size,
                        }));
                    });
                }, 0);
            };

            this.setState(updater, callback);
            if (this.visualizer) {
                const colorsWorker = new Worker(
                    new URL('../../workers/colors.worker.js', import.meta.url),
                    { type: 'module' },
                );
                this.colorsWorker = colorsWorker;
                this.colorsWorker.onmessage = colorsResponse;
                this.colorsWorker.postMessage({
                    colors: vizualization.colors,
                    frames: vizualization.frames,
                    spindleSpeeds: vizualization.spindleSpeeds,
                    isLaser: vizualization.isLaser,
                    spindleChanges: vizualization.spindleChanges,
                    theme: this.state.currentTheme,
                });
            }
        },
        unloadGCode: () => {
            const visualizer = this.visualizer;
            if (visualizer) {
                visualizer.unload();
            }

            // Clear gcode bounding box
            controller.context = {
                ...controller.context,
                xmin: 0,
                xmax: 0,
                ymin: 0,
                ymax: 0,
                zmin: 0,
                zmax: 0,
            };

            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: false,
                    rendering: false,
                    ready: false,
                    content: '',
                    bbox: {
                        min: {
                            x: 0,
                            y: 0,
                            z: 0,
                        },
                        max: {
                            x: 0,
                            y: 0,
                            z: 0,
                        },
                    },
                    visualization: {},
                },
            }));
        },
        onRunClick: () => {
            this.actions.handleRun();
        },
        handleRun: () => {
            const { workflow, activeState } = this.props;
            console.assert(
                includes(
                    [WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED],
                    workflow.state,
                ) || activeState === GRBL_ACTIVE_STATE_HOLD,
            );
            this.setState((prev) => ({
                invalidGcode: { ...prev.invalidGcode, showModal: false },
            }));

            if (workflow.state === WORKFLOW_STATE_IDLE) {
                controller.command('gcode:start');
                return;
            }

            if (
                workflow.state === WORKFLOW_STATE_PAUSED ||
                activeState === GRBL_ACTIVE_STATE_HOLD
            ) {
                controller.command('gcode:resume');
            }
        },
        handlePause: () => {
            controller.command('gcode:pause');
        },
        handleStop: () => {
            controller.command('gcode:stop', { force: true });
        },
        handleClose: () => {
            const { workflow } = this.props;
            console.assert(includes([WORKFLOW_STATE_IDLE], workflow.state));

            controller.command('gcode:unload');

            pubsub.publish('gcode:unload'); // Unload the G-code
        },
        setBoundingBox: (bbox) => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    bbox: bbox,
                },
            }));
        },
        toggle3DView: () => {
            if (!WebGL.isWebGLAvailable() && this.state.disabled) {
                displayWebGLErrorMessage();
                return;
            }

            this.setState((state) => ({
                disabled: !state.disabled,
            }));
        },
        toPerspectiveProjection: (projection) => {
            this.setState((state) => ({
                projection: 'perspective',
            }));
        },
        toOrthographicProjection: (projection) => {
            this.setState((state) => ({
                projection: 'orthographic',
            }));
        },
        toggleGCodeFilename: () => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    displayName: !state.gcode.displayName,
                },
            }));
        },
        toggleLimitsVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    limits: {
                        ...state.objects.limits,
                        visible: !state.objects.limits.visible,
                    },
                },
            }));
        },
        toggleCoordinateSystemVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    coordinateSystem: {
                        ...state.objects.coordinateSystem,
                        visible: !state.objects.coordinateSystem.visible,
                    },
                },
            }));
        },
        toggleGridLineNumbersVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    gridLineNumbers: {
                        ...state.objects.gridLineNumbers,
                        visible: !state.objects.gridLineNumbers.visible,
                    },
                },
            }));
        },
        toggleCuttingToolVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    cuttingTool: {
                        ...state.objects.cuttingTool,
                        visible: !state.objects.cuttingTool.visible,
                    },
                },
            }));
        },
        camera: {
            toRotateMode: () => {
                this.setState((state) => ({
                    cameraMode: CAMERA_MODE_ROTATE,
                }));
            },
            toPanMode: () => {
                this.setState((state) => ({
                    cameraMode: CAMERA_MODE_PAN,
                }));
            },
            zoomFit: () => {
                if (this.visualizer) {
                    this.visualizer.zoomFit();
                }
            },
            zoomIn: () => {
                if (this.visualizer) {
                    this.visualizer.zoomIn();
                }
            },
            zoomOut: () => {
                if (this.visualizer) {
                    this.visualizer.zoomOut();
                }
            },
            panUp: () => {
                if (this.visualizer) {
                    this.visualizer.panUp();
                }
            },
            panDown: () => {
                if (this.visualizer) {
                    this.visualizer.panDown();
                }
            },
            panLeft: () => {
                if (this.visualizer) {
                    this.visualizer.panLeft();
                }
            },
            panRight: () => {
                if (this.visualizer) {
                    this.visualizer.panRight();
                }
            },
            lookAtCenter: () => {
                if (this.visualizer) {
                    this.visualizer.lookAtCenter();
                }
            },
            toTopView: () => {
                this.setState({ cameraPosition: 'Top' });
            },
            to3DView: () => {
                this.setState({ cameraPosition: '3D' });
            },
            toFrontView: () => {
                this.setState({ cameraPosition: 'Front' });
            },
            toLeftSideView: () => {
                this.setState({ cameraPosition: 'Left' });
            },
            toRightSideView: () => {
                this.setState({ cameraPosition: 'Right' });
            },
            toFreeView: () => {
                this.setState({ cameraPosition: 'Free' });
            },
        },
        handleLiteModeToggle: () => {
            const { liteMode } = this.state;
            const { isFileLoaded } = this.props;
            const newLiteModeValue = !liteMode;

            this.setState({
                liteMode: newLiteModeValue,
                minimizeRenders: newLiteModeValue,
            });

            // instead of calling loadGCode right away,
            // use this pubsub to invoke a refresh of the visualizer wrapper.
            // this removes visual glitches that would otherwise appear.
            pubsub.publish('litemode:change', isFileLoaded);
        },
        lineWarning: {
            onContinue: () => {
                this.setState((prev) => ({
                    invalidLine: { ...prev.invalidLine, show: false, line: '' },
                }));
                this.actions.handleRun();
            },
            onIgnoreWarning: () => {
                this.setState((prev) => ({
                    invalidLine: {
                        ...prev.invalidLine,
                        show: false,
                        line: '',
                    },
                }));

                store.set('widgets.visualizer.showLineWarnings', false);
                controller.command('settings:updated', {
                    showLineWarnings: false,
                });
                this.actions.handleRun();
            },
            onCancel: () => this.actions.reset(),
        },
        setVisualizerReady: () => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: false,
                    rendering: false,
                    ready: true,
                },
            }));
        },
        reset: () => {
            this.actions.handleClose();
            this.setState(this.getInitialState());
            this.actions.unloadGCode();
            pubsub.publish('gcode:fileInfo');
            pubsub.publish('gcode:unload');
            toast('G-code File Closed');
        },
        getHull: () => {
            return this.visualizer.getToolpathHull();
        },
    };

    pubsubTokens = [];

    onProcessedGcode = ({ data }) => {
        const { total, invalidGcode } = data;

        if (invalidGcode.size > 0) {
            this.setState((prev) => ({
                invalidGcode: { ...prev.invalidGcode, list: invalidGcode },
            }));
            if (this.state.invalidGcode.shouldShow) {
                toast.info(
                    `Found ${invalidGcode.size} line(s) of non-GRBL-supported G-Code in this file.  Your job may not run properly.`,
                );
            }
        }

        this.setState({ total });

        const reduxPayload = {
            ...data,
            content: this.state.gcode.content,
        };

        // Emit events on response with relevant data from processor worker
        reduxStore.dispatch(updateFileInfo(reduxPayload));
    };

    processGCode = (gcode, name, size) => {};

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    // refs
    widgetContent = null;

    visualizer = null;

    workflowControl = null;

    componentDidMount() {
        this.subscribe();
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);
        this.subscribe();

        if (!WebGL.isWebGLAvailable() && !this.state.disabled) {
            displayWebGLErrorMessage();

            setTimeout(() => {
                this.setState((state) => ({
                    disabled: true,
                }));
            }, 0);
        }
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.removeShuttleControlEvents();
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.disabled !== prevState.disabled) {
            this.config.set('disabled', this.state.disabled);
        }
        if (this.state.projection !== prevState.projection) {
            this.config.set('projection', this.state.projection);
        }
        if (this.state.cameraMode !== prevState.cameraMode) {
            this.config.set('cameraMode', this.state.cameraMode);
        }
        if (this.state.gcode.displayName !== prevState.gcode.displayName) {
            this.config.set('gcode.displayName', this.state.gcode.displayName);
        }
        if (
            this.state.objects.limits.visible !==
            prevState.objects.limits.visible
        ) {
            this.config.set(
                'objects.limits.visible',
                this.state.objects.limits.visible,
            );
        }
        if (
            this.state.objects.coordinateSystem.visible !==
            prevState.objects.coordinateSystem.visible
        ) {
            this.config.set(
                'objects.coordinateSystem.visible',
                this.state.objects.coordinateSystem.visible,
            );
        }
        if (
            this.state.objects.gridLineNumbers.visible !==
            prevState.objects.gridLineNumbers.visible
        ) {
            this.config.set(
                'objects.gridLineNumbers.visible',
                this.state.objects.gridLineNumbers.visible,
            );
        }
        if (
            this.state.objects.cuttingTool.visible !==
            prevState.objects.cuttingTool.visible
        ) {
            this.config.set(
                'objects.cuttingTool.visible',
                this.state.objects.cuttingTool.visible,
            );
        }
        if (this.state.liteMode !== prevState.liteMode) {
            this.config.set('liteMode', this.state.liteMode);
        }
    }

    getInitialState() {
        return {
            port: controller.port,
            units: store.get('workspace.units', METRIC_UNITS),
            theme: this.config.get('theme'),
            showSoftLimitsWarning: this.config.get(
                'showSoftLimitsWarning',
                false,
            ),
            workflow: {
                state: controller.workflow.state,
            },
            notification: {
                type: '',
                data: '',
            },
            modal: {
                name: '',
                params: {},
            },
            machinePosition: {
                // Machine position
                x: '0.000',
                y: '0.000',
                z: '0.000',
            },
            workPosition: {
                // Work position
                x: '0.000',
                y: '0.000',
                z: '0.000',
            },
            gcode: {
                displayName: this.config.get('gcode.displayName', true),
                loading: false,
                rendering: false,
                ready: false,
                content: '',
                bbox: {
                    min: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    max: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                },
                // Updates by the "sender:status" event
                name: '',
                size: 0,
                total: 0,
                sent: 0,
                received: 0,
                loadedBeforeConnection: false,
                visualization: {},
            },
            disabled: this.config.get('disabled', false),
            disabledLite: this.config.get('disabledLite'),
            liteMode: this.config.get('liteMode'),
            minimizeRenders: this.config.get('minimizeRenders'),
            projection: this.config.get('projection', 'orthographic'),
            objects: {
                limits: {
                    visible: this.config.get('objects.limits.visible', true),
                },
                coordinateSystem: {
                    visible: this.config.get(
                        'objects.coordinateSystem.visible',
                        true,
                    ),
                },
                gridLineNumbers: {
                    visible: this.config.get(
                        'objects.gridLineNumbers.visible',
                        true,
                    ),
                },
                cuttingTool: {
                    visible: this.config.get(
                        'objects.cuttingTool.visible',
                        true,
                    ),
                    visibleLite: this.config.get(
                        'objects.cuttingTool.visibleLite',
                        true,
                    ),
                },
                cuttingToolAnimation: {
                    visible: this.config.get(
                        'objects.cuttingToolAnimation.visible',
                        true,
                    ),
                    visibleLite: this.config.get(
                        'objects.cuttingToolAnimation.visibleLite',
                        true,
                    ),
                },
                cutPath: {
                    visible: this.config.get('objects.cutPath.visible', true),
                    visibleLite: this.config.get(
                        'objects.cutPath.visibleLite',
                        true,
                    ),
                },
            },
            cameraMode: this.config.get('cameraMode', CAMERA_MODE_PAN),
            cameraPosition: '3D', // 'Top', '3D', 'Front', 'Left', 'Right'
            isAgitated: false, // Defaults to false
            currentTheme: this.getVisualizerTheme(),
            currentTab: 0,
            filename: '',
            fileSize: 0, //in bytes
            total: 0,
            invalidGcode: {
                shouldShow: this.config.get('showWarning'),
                showModal: false,
                list: new Set([]),
            },
            invalidLine: {
                shouldShow: this.config.get('showLineWarnings'),
                show: false,
                line: '',
            },
            layoutIsReversed: store.get('workspace.reverseWidgets'),
            workspaceMode: store.get('workspace.mode'),
            jobEndModal: this.config.get('jobEndModal'),
        };
    }

    showToast = _.throttle(
        () => {
            toast.info('Unable to activate GrblHAL ONLY shortcut');
        },
        3000,
        { trailing: false },
    );

    shuttleControlFunctions = {
        FEEDRATE_OVERRIDE: (_, { amount }) => {
            switch (Number(amount)) {
                case 1:
                    controller.write('\x93');
                    break;
                case -1:
                    controller.write('\x94');
                    break;
                case 10:
                    controller.write('\x91');
                    break;
                case -10:
                    controller.write('\x92');
                    break;
                case 0:
                    controller.write('\x90');
                    break;
                default:
                    return;
            }
        },
        SPINDLE_OVERRIDE: (_, { amount }) => {
            switch (Number(amount)) {
                case 1:
                    controller.write('\x9C');
                    break;
                case -1:
                    controller.write('\x9D');
                    break;
                case 10:
                    controller.write('\x9A');
                    break;
                case -10:
                    controller.write('\x9B');
                    break;
                case 0:
                    controller.write('\x99');
                    break;
                default:
                    return;
            }
        },
        START_JOB: (_, { type }) => {
            const { controllerType } = this.props;
            // if it's a grblHAL only shortcut, don't run it
            if (type === GRBLHAL && controllerType !== GRBLHAL) {
                this.showToast();
                return;
            }
            if (this.workflowControl) {
                this.workflowControl.startRun();
            }
        },
        PAUSE_JOB: (_, { type }) => {
            const { controllerType } = this.props;
            // if it's a grblHAL only shortcut, don't run it
            if (type === GRBLHAL && controllerType !== GRBLHAL) {
                this.showToast();
                return;
            }
            this.actions.handlePause();
        },
        VISUALIZER_VIEW: (_, { type }) => {
            const {
                to3DView,
                toTopView,
                toFrontView,
                toRightSideView,
                toLeftSideView,
            } = this.actions.camera;

            const changeCamera = {
                isometirc: to3DView,
                top: toTopView,
                front: toFrontView,
                right: toRightSideView,
                left: toLeftSideView,
                default: () => {
                    const { cameraPosition } = this.getInitialState();
                    this.setState({ cameraPosition });
                },
            }[type];

            changeCamera();
        },
        VISUALIZER_VIEW_CYCLE: () => {
            const {
                to3DView,
                toTopView,
                toFrontView,
                toRightSideView,
                toLeftSideView,
            } = this.actions.camera;

            const cameraViews = [
                '3D',
                'Top',
                'Front',
                'Right',
                'Left',
                'Default',
            ];

            let currIndex = cameraViews.findIndex(
                (view) => view === this.state.cameraPosition,
            );

            if (currIndex + 1 >= cameraViews.length) {
                currIndex = 0;
            } else {
                currIndex += 1;
            }

            const currView = cameraViews[currIndex];

            const changeCamera = {
                '3D': to3DView,
                Top: toTopView,
                Front: toFrontView,
                Right: toRightSideView,
                Left: toLeftSideView,
                Default: () => {
                    const { cameraPosition } = this.getInitialState();
                    this.setState({ cameraPosition });
                },
            }[currView];

            changeCamera();
        },
        VISUALIZER_ZOOM_IN: () => {
            this.actions.camera.zoomIn();
        },
        VISUALIZER_ZOOM_OUT: () => {
            this.actions.camera.zoomOut();
        },
        VISUALIZER_ZOOM_FIT: () => {
            this.actions.camera.zoomFit();
        },
    };

    shuttleControlEvents = {
        FEEDRATE_OVERRIDE_P: {
            title: 'Feed +',
            keys: '',
            gamepadKeys: '5',
            keysName: 'R1',
            cmd: 'FEEDRATE_OVERRIDE_P',
            payload: { amount: 1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_PP: {
            title: 'Feed ++',
            keys: '',
            gamepadKeys: '',
            keysName: 'Feed ++',
            cmd: 'FEEDRATE_OVERRIDE_PP',
            payload: { amount: 10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_M: {
            title: 'Feed -',
            keys: '',
            gamepadKeys: '7',
            keysName: 'R2',
            cmd: 'FEEDRATE_OVERRIDE_M',
            payload: { amount: -1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_MM: {
            title: 'Feed --',
            keys: '',
            gamepadKeys: '',
            keysName: 'Feed --',
            cmd: 'FEEDRATE_OVERRIDE_MM',
            payload: { amount: -10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_RESET: {
            title: 'Feed Reset',
            keys: '',
            gamepadKeys: '',
            keysName: 'Feed Reset',
            cmd: 'FEEDRATE_OVERRIDE_RESET',
            payload: { amount: 0 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        SPINDLE_OVERRIDE_P: {
            title: 'Spindle/Laser +',
            keys: '',
            gamepadKeys: '4',
            keysName: 'L1',
            cmd: 'SPINDLE_OVERRIDE_P',
            payload: { amount: 1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE,
        },
        SPINDLE_OVERRIDE_PP: {
            title: 'Spindle/Laser ++',
            keys: '',
            gamepadKeys: '',
            keysName: 'Spindle/Laser ++',
            cmd: 'SPINDLE_OVERRIDE_PP',
            payload: { amount: 10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE,
        },
        SPINDLE_OVERRIDE_M: {
            title: 'Spindle/Laser -',
            keys: '',
            gamepadKeys: '6',
            keysName: 'L2',
            cmd: 'SPINDLE_OVERRIDE_M',
            payload: { amount: -1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE,
        },
        SPINDLE_OVERRIDE_MM: {
            title: 'Spindle/Laser --',
            keys: '',
            gamepadKeys: '',
            keysName: 'Spindle/Laser --',
            cmd: 'SPINDLE_OVERRIDE_MM',
            payload: { amount: -10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE,
        },
        SPINDLE_OVERRIDE_RESET: {
            title: 'Spindle/Laser Reset',
            keys: '',
            gamepadKeys: '',
            keysName: 'Spindle/Laser Reset',
            cmd: 'SPINDLE_OVERRIDE_RESET',
            payload: { amount: 0 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE,
        },
        VISUALIZER_VIEW_3D: {
            title: '3D / Isometric',
            keys: '',
            cmd: 'VISUALIZER_VIEW_3D',
            payload: { type: 'isometirc' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW,
        },
        VISUALIZER_VIEW_TOP: {
            title: 'Top',
            keys: '',
            cmd: 'VISUALIZER_VIEW_TOP',
            payload: { type: 'top' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW,
        },
        VISUALIZER_VIEW_FRONT: {
            title: 'Front',
            keys: '',
            cmd: 'VISUALIZER_VIEW_FRONT',
            payload: { type: 'front' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW,
        },
        VISUALIZER_VIEW_RIGHT: {
            title: 'Right',
            keys: '',
            cmd: 'VISUALIZER_VIEW_RIGHT',
            payload: { type: 'right' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW,
        },
        VISUALIZER_VIEW_LEFT: {
            title: 'Left',
            keys: '',
            cmd: 'VISUALIZER_VIEW_LEFT',
            payload: { type: 'left' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW,
        },
        VISUALIZER_VIEW_RESET: {
            title: 'Reset View',
            keys: ['shift', 'n'].join('+'),
            cmd: 'VISUALIZER_VIEW_RESET',
            payload: { type: 'default' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW,
        },
        LIGHTWEIGHT_MODE: {
            title: 'Lightweight Mode',
            keys: ['shift', 'm'].join('+'),
            cmd: 'LIGHTWEIGHT_MODE',
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: () => this.actions.handleLiteModeToggle(),
        },
        TOGGLE_SHORTCUTS: {
            title: 'Toggle Shortcuts',
            keys: '^',
            cmd: 'TOGGLE_SHORTCUTS',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: () => {
                const shortcuts = store.get('commandKeys', {});
                const allShuttleControlEvents =
                    shuttleEvents.allShuttleControlEvents;

                // Ignore shortcut for toggling all other shortcuts to
                // allow them to be turned on and off
                const allDisabled = Object.entries(shortcuts)
                    .filter(
                        ([key, shortcut]) =>
                            (allShuttleControlEvents[key]
                                ? allShuttleControlEvents[key].title
                                : shortcut.title) !== 'Toggle Shortcuts',
                    )
                    .every(([key, shortcut]) => !shortcut.isActive);
                const keybindings = _.cloneDeep(shortcuts);
                Object.entries(keybindings).forEach(([key, keybinding]) => {
                    if (key !== 'TOGGLE_SHORTCUTS') {
                        keybinding.isActive = allDisabled;
                    }
                });

                store.replace('commandKeys', keybindings);
                pubsub.publish('keybindingsUpdated', keybindings);
            },
        },
        MACRO: (_, { macroID }) => {
            const { activeState } = this.props;
            if (activeState === GRBL_ACTIVE_STATE_IDLE) {
                controller.command('macro:run', macroID, controller.context);
            }
        },
        VISUALIZER_VIEW_CYCLE: {
            title: 'Cycle Through Visualizer Cameras',
            keys: ['shift', 'b'].join('+'),
            cmd: 'VISUALIZER_VIEW_CYCLE',
            payload: { type: 'default' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_VIEW_CYCLE,
        },
        VISUALIZER_ZOOM_IN: {
            title: 'Zoom In',
            keys: ['shift', 'p'].join('+'),
            cmd: 'VISUALIZER_ZOOM_IN',
            payload: { type: 'default' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_ZOOM_IN,
        },
        VISUALIZER_ZOOM_OUT: {
            title: 'Zoom Out',
            keys: ['shift', 'o'].join('+'),
            cmd: 'VISUALIZER_ZOOM_OUT',
            payload: { type: 'default' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_ZOOM_OUT,
        },
        VISUALIZER_ZOOM_FIT: {
            title: 'Zoom Fit',
            keys: ['shift', 'i'].join('+'),
            cmd: 'VISUALIZER_ZOOM_FIT',
            payload: { type: 'default' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
            callback: this.shuttleControlFunctions.VISUALIZER_ZOOM_FIT,
        },
    };

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach((eventName) => {
            const callback =
                eventName === 'MACRO'
                    ? this.shuttleControlEvents[eventName]
                    : this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    }

    updateShuttleControlEvents = () => {
        this.removeShuttleControlEvents();
        this.addShuttleControlEvents();
    };

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach((eventName) => {
            const callback =
                eventName === 'MACRO'
                    ? this.shuttleControlEvents[eventName]
                    : this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    getVisualizerTheme() {
        const { theme } = store.get('widgets.visualizer');
        if (theme === LIGHT_THEME) {
            return LIGHT_THEME_VALUES;
        } else if (theme === DARK_THEME) {
            return DARK_THEME_VALUES;
        } else if (CUSTOMIZABLE_THEMES.includes(theme)) {
            let colourMap = new Map();
            PARTS_LIST.map((part) =>
                colourMap.set(
                    part,
                    this.config.get(
                        theme + ' ' + part,
                        DARK_THEME_VALUES.get(part),
                    ),
                ),
            );
            return colourMap;
        }
        return DARK_THEME_VALUES;
    }

    isAgitated() {
        const { disabled, objects } = this.state;
        const { workflow, controllerType, activeState } = this.props;

        if (workflow.state !== WORKFLOW_STATE_RUNNING) {
            return false;
        }
        // Return false when 3D view is disabled
        if (disabled) {
            return false;
        }
        // Return false when the cutting tool is not visible
        if (!objects.cuttingTool.visible) {
            return false;
        }
        if (
            !includes([GRBL, MARLIN, SMOOTHIE, TINYG, GRBLHAL], controllerType)
        ) {
            return false;
        }
        if (controllerType === GRBL || controllerType === GRBLHAL) {
            if (
                activeState !== GRBL_ACTIVE_STATE_RUN &&
                activeState !== GRBL_ACTIVE_STATE_CHECK
            ) {
                return false;
            }
        }

        return true;
    }

    setCurrentTab = (id = 0) => this.setState({ currentTab: id });

    subscribe() {
        const tokens = [
            pubsub.subscribe('theme:change', (msg, theme) => {
                this.setState(
                    {
                        theme: theme,
                    },
                    this.setState({
                        currentTheme: this.getVisualizerTheme(),
                    }),
                    pubsub.publish('visualizer:redraw'),
                );
            }),
            pubsub.subscribe('visualizer:settings', () => {
                this.setState({
                    disabled: this.config.get('disabled'),
                    disabledLite: this.config.get('disabledLite'),
                    objects: this.config.get('objects'),
                    minimizeRenders: this.config.get('minimizeRenders'),
                    jobEndModal: this.config.get('jobEndModal'),
                });
            }),
            pubsub.subscribe('units:change', (msg, units) => {
                this.setState({
                    units: units,
                });
            }),
            pubsub.subscribe('gcode:showWarning', (_, shouldShow) => {
                this.setState({
                    invalidGcode: { shouldShow, showModal: false, list: [] },
                });
            }),
            pubsub.subscribe('gcode:showLineWarnings', (_, shouldShow) => {
                this.setState({
                    invalidLine: { shouldShow, show: false, line: '' },
                });
            }),
            pubsub.subscribe('keybindingsUpdated', () => {
                this.updateShuttleControlEvents();
            }),
            pubsub.subscribe('gcode:bbox', (msg, bbox) => {
                const { gcode } = this.state;
                this.setState({
                    gcode: {
                        ...gcode,
                        bbox: bbox,
                    },
                });
            }),
            pubsub.subscribe('widgets:reverse', (_, layoutIsReversed) => {
                this.setState({ layoutIsReversed });
            }),
            pubsub.subscribe('gcode:surfacing', async (_, { gcode, name }) => {
                const file = new File([gcode], name);
                await uploadGcodeFileToServer(
                    file,
                    controller.port,
                    VISUALIZER_PRIMARY,
                );
            }),
            pubsub.subscribe('file:content', (_, { content, size, name }) => {
                this.setState({
                    gcode: {
                        ...this.state.gcode,
                        content: content,
                        size: size,
                        name: name,
                    },
                });
            }),
            pubsub.subscribe('file:load', (_, data) => {
                this.setState({
                    gcode: {
                        ...this.state.gcode,
                        visualization: data,
                    },
                });
            }),
            pubsub.subscribe(
                'gcode:rotarySetup',
                async (_, { setupFile, name }) => {
                    const file = new File([setupFile], name);

                    await uploadGcodeFile(
                        file,
                        controller.port,
                        VISUALIZER_PRIMARY,
                    );
                },
            ),
            pubsub.subscribe('unload:file', () => {
                this.actions.closeModal();
                this.actions.unloadGCode();
                this.actions.reset();
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    renderIfNecessary(shouldRender) {
        const hasVisualization = this.visualizer.hasVisualization();
        if (shouldRender && !hasVisualization) {
            this.visualizer.rerenderGCode();
        }
    }

    render() {
        const {
            renderState,
            isSecondary,
            gcode,
            activeVisualizer,
            activeState,
            alarmCode,
            workflow,
            isConnected,
        } = this.props;
        const state = {
            ...this.state,
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state,
            },
            alarmCode,
            activeState,
            workflow,
            isConnected,
            isAgitated: this.isAgitated(),
        };
        const actions = {
            ...this.actions,
        };

        const showRendering = renderState === RENDER_RENDERING;
        const showLoading = renderState === RENDER_LOADING;
        // Handle visualizer render
        const isVisualizerDisabled = state.liteMode
            ? state.disabledLite
            : state.disabled;

        const capable = {
            view3D: WebGL.isWebGLAvailable() && !isVisualizerDisabled,
        };

        const showVisualizer =
            capable.view3D &&
            ((isSecondary && activeVisualizer === VISUALIZER_SECONDARY) ||
                (!isSecondary && activeVisualizer === VISUALIZER_PRIMARY));

        const MainComponent = isSecondary ? (
            <SecondaryVisualizer
                state={state}
                actions={actions}
                showLoading={showLoading}
                showRendering={showRendering}
                showVisualizer={showVisualizer}
                visualizerRef={(ref) => {
                    this.visualizer = ref?.visualizer;
                }}
                gcode={gcode}
                cameraPosition="Top"
            />
        ) : (
            <PrimaryVisualizer
                state={state}
                actions={actions}
                capable={capable}
                showLoading={showLoading}
                showRendering={showRendering}
                showVisualizer={showVisualizer}
                visualizerRef={(ref) => {
                    this.visualizer = ref?.visualizer;
                }}
                workflowRef={(ref) => {
                    this.workflowControl = ref;
                }}
                widgetContentRef={(ref) => {
                    this.widgetContent = ref;
                }}
            />
        );

        return MainComponent;
    }
}

export default connect(
    (store) => {
        const settings = get(store, 'controller.settings');
        const xMaxFeed = Number(get(settings.settings, '$110', 1500));
        const yMaxFeed = Number(get(settings.settings, '$111', 1500));
        const zMaxFeed = Number(get(settings.settings, '$112', 1500));
        const xMaxAccel = Number(get(settings.settings, '$120', 1800000));
        const yMaxAccel = Number(get(settings.settings, '$121', 1800000));
        const zMaxAccel = Number(get(settings.settings, '$122', 1800000));
        const workflow = get(store, 'controller.workflow');
        const renderState = get(store, 'file.renderState');
        const isConnected = get(store, 'connection.isConnected');
        const controllerType = get(store, 'controller.type');
        const activeState = get(store, 'controller.state.status.activeState');
        const alarmCode = get(store, 'controller.state.status.alarmCode');
        const overrides = get(store, 'controller.state.status.ov', [0, 0, 0]);
        const isFileLoaded = get(store, 'file.fileLoaded');
        const { activeVisualizer } = store.visualizer;

        const feedArray = [xMaxFeed, yMaxFeed, zMaxFeed];
        const accelArray = [
            xMaxAccel * 3600,
            yMaxAccel * 3600,
            zMaxAccel * 3600,
        ];

        const ovF = overrides[0];
        const ovS = overrides[2];

        return {
            feedArray,
            accelArray,
            workflow,
            renderState,
            isConnected,
            controllerType,
            activeState,
            activeVisualizer,
            alarmCode,
            isFileLoaded,
            ovF,
            ovS,
        };
    },
    null,
    null,
    { forwardRef: true },
)(Visualizer);
