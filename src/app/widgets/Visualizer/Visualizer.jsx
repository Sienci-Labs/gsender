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

import reduxStore from 'app/store/redux';
import { connect } from 'react-redux';
import * as fileActions from 'app/actions/fileInfoActions';
import _get from 'lodash/get';
import _each from 'lodash/each';
import _isEqual from 'lodash/isEqual';
//import _tail from 'lodash/tail';
import _throttle from 'lodash/throttle';
import colornames from 'colornames';
import pubsub from 'pubsub-js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
    RENDER_RENDERED,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY
} from 'app/constants';
import CombinedCamera from 'app/lib/three/CombinedCamera';
import TrackballControls from 'app/lib/three/TrackballControls';
import * as WebGL from 'app/lib/three/WebGL';
import log from 'app/lib/log';
import _ from 'lodash';
import store from 'app/store';
import api from 'app/api';
import { Toaster, TOASTER_DANGER, TOASTER_UNTIL_CLOSE } from '../../lib/toaster/ToasterLib';
import controller from '../../lib/controller';
import { getBoundingBox, loadSTL, loadTexture } from './helpers';
import Viewport from './Viewport';
import CoordinateAxes from './CoordinateAxes';
import Cuboid from './Cuboid';
import CuttingPointer from './CuttingPointer';
import GridLine from './GridLine';
import PivotPoint3 from './PivotPoint3';
import TextSprite from './TextSprite';
import GCodeVisualizer from './GCodeVisualizer';
import {
    CAMERA_MODE_PAN,
    CAMERA_MODE_ROTATE
} from './constants';
import styles from './index.styl';
import { GRBL_ACTIVE_STATE_CHECK } from '../../../server/controllers/Grbl/constants';
import WidgetConfig from '../WidgetConfig';

const IMPERIAL_GRID_SPACING = 25.4; // 1 in
const METRIC_GRID_SPACING = 10; // 10 mm
const CAMERA_VIEWPORT_WIDTH = 300; // 300 mm
const CAMERA_VIEWPORT_HEIGHT = 300; // 300 mm
const PERSPECTIVE_FOV = 70;
const PERSPECTIVE_NEAR = 0.001;
const PERSPECTIVE_FAR = 2000;
const ORTHOGRAPHIC_FOV = 35;
const ORTHOGRAPHIC_NEAR = 0.001;
const ORTHOGRAPHIC_FAR = 2000;
const CAMERA_DISTANCE = 400; // Move the camera out a bit from the origin (0, 0, 0)
const TRACKBALL_CONTROLS_MIN_DISTANCE = 1;
const TRACKBALL_CONTROLS_MAX_DISTANCE = 2000;

class Visualizer extends Component {
    static propTypes = {
        show: PropTypes.bool,
        cameraPosition: PropTypes.oneOf(['top', '3d', 'front', 'left', 'right']),
        state: PropTypes.object,
        isSecondary: PropTypes.bool,
    };

    visualizerConfig = new WidgetConfig('visualizer');

    pubsubTokens = [];

    isAgitated = false;

    machinePosition = {
        x: 0,
        y: 0,
        z: 0
    };

    workPosition = {
        x: 0,
        y: 0,
        z: 0
    };

    machineProfile = store.get('workspace.machineProfile');

    group = new THREE.Group();

    pivotPoint = new PivotPoint3({ x: 0, y: 0, z: 0 }, (x, y, z) => { // relative position
        _each(this.group.children, (o) => {
            o.translateX(x);
            o.translateY(y);
            o.translateZ(z);
        });
    });

    node = null;

    fileLoaded = false;
    machineConnected = false;
    showSoftLimitsWarning = this.visualizerConfig.get('showSoftLimitsWarning');

    setRef = (node) => {
        this.node = node;
    };

    throttledResize = _throttle(() => {
        this.resizeRenderer();
    }, 32); // 60hz

    changeMachineProfile = () => {
        const machineProfile = store.get('workspace.machineProfile');

        if (!machineProfile) {
            return;
        }

        if (_isEqual(machineProfile, this.machineProfile)) {
            return;
        }

        this.machineProfile = { ...machineProfile };

        if (this.limits) {
            this.group.remove(this.limits);
            this.limits = null;
        }

        const state = this.props.state;
        const limits = _get(this.machineProfile, 'limits');
        const { xmin = 0, xmax = 0, ymin = 0, ymax = 0, zmin = 0, zmax = 0 } = { ...limits };
        this.limits = this.createLimits(xmin, xmax, ymin, ymax, zmin, zmax);
        this.limits.name = 'Limits';
        this.limits.visible = state.objects.limits.visible;

        this.unload();

        this.updateCuttingToolPosition();
        this.updateCuttingPointerPosition();
        this.updateLimitsPosition();

        this.updateScene();
        this.redrawGrids();
        this.rerenderGCode();
    };

    hasVisualization() {
        return this.group.getObjectByName('Visualizer');
    }

    renderAnimationLoop = () => {
        const showAnimation = this.showAnimation();

        if (showAnimation) {
            if (this.isAgitated) {
                // Call the render() function up to 60 times per second (i.e. 60fps)
                requestAnimationFrame(this.renderAnimationLoop);

                const rpm = 300;
                this.rotateCuttingTool(rpm);
            } else {
                const rpm = 0;
                this.rotateCuttingTool(rpm);
            }

            // Update the scene
            this.updateScene();
        }
    };

    constructor(props) {
        super(props);

        // Three.js
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.viewport = null;
        this.cuttingTool = null;
        this.cuttingPointer = null;
        this.limits = null;
        this.visualizer = null;
    }

    componentDidMount() {
        this.subscribe();
        this.addControllerEvents();
        this.addResizeEventListener();
        //store.on('change', this.changeMachineProfile);
        if (this.node) {
            const el = ReactDOM.findDOMNode(this.node);
            this.createScene(el);
            this.resizeRenderer();
        }
        this.resizeRenderer();
    }

    componentDidUpdate(prevProps) {
        let forceUpdate = false;
        let needUpdateScene = false;
        const prevState = prevProps.state;
        const state = this.props.state;

        // Update the visualizer size whenever the machine is running,
        // to fill the empty area between it and the job status widget when necessary
        //this.resizeRenderer();

        // Enable or disable 3D view
        if ((prevProps.show !== this.props.show) && (this.props.show === true)) {
            this.viewport.update();

            // Set forceUpdate to true when enabling or disabling 3D view
            forceUpdate = true;
            needUpdateScene = true;
        }

        // Update visualizer's frame index
        if (this.visualizer) {
            const frameIndex = this.props.receivedLines;
            this.visualizer.setFrameIndex(frameIndex);
        }

        // Projection
        if (prevState.projection !== state.projection) {
            if (state.projection === 'orthographic') {
                this.camera.toOrthographic();
                this.camera.setZoom(1.3);
                this.camera.setFov(ORTHOGRAPHIC_FOV);
            } else {
                this.camera.toPerspective();
                this.camera.setZoom(1.3);
                this.camera.setFov(PERSPECTIVE_FOV);
            }
            if (this.viewport) {
                this.viewport.update();
            }
            needUpdateScene = true;
        }

        // Camera Mode
        if (prevState.cameraMode !== state.cameraMode) {
            this.setCameraMode(state.cameraMode);
            needUpdateScene = true;
        }

        // Whether to show coordinate system
        if ((prevState.units !== state.units) ||
            (prevState.objects.coordinateSystem.visible !== state.objects.coordinateSystem.visible)) {
            const visible = state.objects.coordinateSystem.visible;

            // Imperial
            const imperialCoordinateSystem = this.group.getObjectByName('ImperialCoordinateSystem');
            if (imperialCoordinateSystem) {
                imperialCoordinateSystem.visible = visible && (state.units === IMPERIAL_UNITS);
            }

            // Metric
            const metricCoordinateSystem = this.group.getObjectByName('MetricCoordinateSystem');
            if (metricCoordinateSystem) {
                metricCoordinateSystem.visible = visible && (state.units === METRIC_UNITS);
            }

            needUpdateScene = true;
        }

        // Whether to show grid line numbers
        if ((prevState.units !== state.units) ||
            (prevState.objects.gridLineNumbers.visible !== state.objects.gridLineNumbers.visible)) {
            const visible = state.objects.gridLineNumbers.visible;

            // Imperial
            const imperialGridLineNumbers = this.group.getObjectByName('ImperialGridLineNumbers');
            if (imperialGridLineNumbers) {
                imperialGridLineNumbers.visible = visible && (state.units === IMPERIAL_UNITS);
            }

            // Metric
            const metricGridLineNumbers = this.group.getObjectByName('MetricGridLineNumbers');
            if (metricGridLineNumbers) {
                metricGridLineNumbers.visible = visible && (state.units === METRIC_UNITS);
            }

            needUpdateScene = true;
        }

        // Whether to show limits
        if (this.limits && (this.limits.visible !== state.objects.limits.visible)) {
            this.limits.visible = state.objects.limits.visible;
            needUpdateScene = true;
        }

        // Whether to show cutting tool or cutting pointer
        if (this.cuttingTool && this.cuttingPointer) {
            const { liteMode } = state;
            this.cuttingTool.visible = liteMode ? state.objects.cuttingTool.visibleLite : state.objects.cuttingTool.visible;
            this.cuttingPointer.visible = liteMode ? !state.objects.cuttingTool.visibleLite : !state.objects.cuttingTool.visible;
            needUpdateScene = true;
        }

        { // Update position
            const { state } = this.props;
            const { activeState } = state;
            const { machinePosition, workPosition } = this.props;

            let newPos = workPosition;
            if (activeState === GRBL_ACTIVE_STATE_CHECK) {
                newPos = this.visualizer.getCurrentLocation();
            }
            let needUpdatePosition = false;

            // Machine position
            const { x: mpox0, y: mpoy0, z: mpoz0 } = this.machinePosition;
            const { x: mpox1, y: mpoy1, z: mpoz1 } = machinePosition;
            if (mpox0 !== mpox1 || mpoy0 !== mpoy1 || mpoz0 !== mpoz1) {
                this.machinePosition = machinePosition;
                needUpdatePosition = true;
                needUpdateScene = true;
            }

            // Work position
            const { x: wpox0, y: wpoy0, z: wpoz0 } = this.workPosition;
            const { x: wpox1, y: wpoy1, z: wpoz1 } = newPos;
            if (wpox0 !== wpox1 || wpoy0 !== wpoy1 || wpoz0 !== wpoz1) {
                this.workPosition = newPos;
                needUpdatePosition = true;
                needUpdateScene = true;
            }

            if (needUpdatePosition) {
                this.updateCuttingToolPosition();
                this.updateCuttingPointerPosition();
                this.updateLimitsPosition();
            }
        }

        if (needUpdateScene) {
            this.updateScene({ forceUpdate: forceUpdate });
        }

        if (this.isAgitated !== state.isAgitated) {
            this.isAgitated = state.isAgitated;

            if (this.isAgitated) {
                // Call renderAnimationLoop when the state changes and isAgitated is true
                requestAnimationFrame(this.renderAnimationLoop);
            }
        }

        if (prevProps.cameraPosition !== this.props.cameraPosition) {
            if (this.props.cameraPosition === 'top') {
                this.toTopView();
            }
            if (this.props.cameraPosition === '3d') {
                this.to3DView();
            }
            if (this.props.cameraPosition === 'front') {
                this.toFrontView();
            }
            if (this.props.cameraPosition === 'left') {
                this.toLeftSideView();
            }
            if (this.props.cameraPosition === 'right') {
                this.toRightSideView();
            }
        }
    }

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: (this.state.finishedMessage),
            type: 'TOASTER_DANGER',
        });
    }, 2000, { trailing: false });


    controllerEvents = {
        'gcode_error': (msg) => {
            Toaster.pop({
                msg,
                type: TOASTER_DANGER,
                duration: TOASTER_UNTIL_CLOSE
            });
            //this.setState({ finishedMessage: `Gcode Error: Line: ${line.length} Error:${code} - ${error.description}` });
            //this.showToast();
        },
    };

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

    componentWillUnmount() {
        this.removeControllerEvents();
        this.unsubscribe();
        this.removeResizeEventListener();
        store.removeListener('change', this.changeMachineProfile);
        this.clearScene();
    }

    updateGridChildColor(name, color) {
        const group = this.group.getObjectByName(name);
        const gridLines = group.getObjectByName('GridLine');
        gridLines.children.forEach((child) => {
            child.material.color = color;
        });
    }

    async uploadGCodeFile (gcode) {
        const serializedFile = new File([gcode], 'surfacing.gcode');
        await api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY);
    }

    rerenderGCode() {
        const { actions, state } = this.props;
        const { gcode } = state;

        const group = this.group.getObjectByName('Visualizer');
        if (group) {
            this.group.remove(group);
        }
        if (gcode.content) {
            actions.loadGCode('', gcode.content);
        } else {
            // reupload the file to update the colours
            this.uploadGCodeFile(reduxStore.getState().file.content);
        }
    }

    removeSceneGroup() {
        this.group.remove(...this.group.children);
    }

    showAnimation = () => {
        const state = { ...this.props.state };
        const { liteMode, objects, minimizeRenders } = state;
        // We don't animate if minimizeRenders is turned on
        if (minimizeRenders) {
            return false;
        }
        if (liteMode && objects.cuttingToolAnimation.visibleLite) {
            return true;
        } else if (!liteMode && objects.cuttingToolAnimation.visible) {
            return true;
        }
        return false;
    }

    redrawGrids() {
        const { objects, units } = this.props.state;
        const impGroup = this.group.getObjectByName('ImperialCoordinateSystem');
        const metGroup = this.group.getObjectByName('MetricCoordinateSystem');
        const impLineNumbers = this.group.getObjectByName('ImperialGridLineNumbers');
        const metLineNumbers = this.group.getObjectByName('MetricGridLineNumbers');

        this.group.remove(impGroup);
        this.group.remove(metGroup);
        this.group.remove(impLineNumbers);
        this.group.remove(metLineNumbers);

        { // Imperial Coordinate System
            const visible = objects.coordinateSystem.visible;
            const imperialCoordinateSystem = this.createCoordinateSystem(IMPERIAL_UNITS);
            imperialCoordinateSystem.name = 'ImperialCoordinateSystem';
            imperialCoordinateSystem.visible = visible && (units === IMPERIAL_UNITS);
            this.group.add(imperialCoordinateSystem);
        }

        { // Metric Coordinate System
            const visible = objects.coordinateSystem.visible;
            const metricCoordinateSystem = this.createCoordinateSystem(METRIC_UNITS);
            metricCoordinateSystem.name = 'MetricCoordinateSystem';
            metricCoordinateSystem.visible = visible && (units === METRIC_UNITS);
            this.group.add(metricCoordinateSystem);
        }

        { // Imperial Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const imperialGridLineNumbers = this.createGridLineNumbers(IMPERIAL_UNITS);
            imperialGridLineNumbers.name = 'ImperialGridLineNumbers';
            imperialGridLineNumbers.visible = visible && (units === IMPERIAL_UNITS);
            this.group.add(imperialGridLineNumbers);
        }

        { // Metric Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const metricGridLineNumbers = this.createGridLineNumbers(METRIC_UNITS);
            metricGridLineNumbers.name = 'MetricGridLineNumbers';
            metricGridLineNumbers.visible = visible && (units === METRIC_UNITS);
            this.group.add(metricGridLineNumbers);
        }
    }

    recolorGrids() {
        const { currentTheme } = this.props.state;
        const { gridColor } = currentTheme;
        const impGroup = this.group.getObjectByName('ImperialCoordinateSystem');
        const metGroup = this.group.getObjectByName('MetricCoordinateSystem');

        { // Imperial Coordinate System
            _each(impGroup.getObjectByName('GridLine').children, (o) => {
                o.material.color.set(gridColor);
            });
        }

        { // Metric Coordinate System
            _each(metGroup.getObjectByName('GridLine').children, (o) => {
                o.material.color.set(gridColor);
            });
        }

        this.recolorGridLabels(IMPERIAL_UNITS);
        this.recolorGridLabels(METRIC_UNITS);
        this.recolorGridNumbers(IMPERIAL_UNITS);
        this.recolorGridNumbers(METRIC_UNITS);
    }

    recolorGridLabels(units) {
        const { mm, in: inches } = this.machineProfile;
        const inchesMax = Math.max(inches.width, inches.depth) + (IMPERIAL_GRID_SPACING * 10);
        const mmMax = Math.max(mm.width, mm.depth) + (METRIC_GRID_SPACING * 10);

        const axisLength = (units === IMPERIAL_UNITS) ? inchesMax : mmMax;
        const height = (units === IMPERIAL_UNITS) ? inches.height : mm.height;

        const { currentTheme } = this.props.state;
        const { xAxisColor, yAxisColor, zAxisColor } = currentTheme;

        const unitGroup = units === IMPERIAL_UNITS ?
            this.group.getObjectByName('ImperialCoordinateSystem')
            : this.group.getObjectByName('MetricCoordinateSystem');

        unitGroup.remove(unitGroup.getObjectByName('xAxis'));
        unitGroup.remove(unitGroup.getObjectByName('yAxis'));
        unitGroup.remove(unitGroup.getObjectByName('zAxis'));

        { // Axis Labels
            const axisXLabel = new TextSprite({
                x: axisLength + 10,
                y: 0,
                z: 0,
                size: 20,
                text: 'X',
                color: xAxisColor
            });
            axisXLabel.name = 'xAxis';
            const axisYLabel = new TextSprite({
                x: 0,
                y: axisLength + 10,
                z: 0,
                size: 20,
                text: 'Y',
                color: yAxisColor
            });
            axisYLabel.name = 'yAxis';
            const axisZLabel = new TextSprite({
                x: 0,
                y: 0,
                z: height + 10,
                size: 20,
                text: 'Z',
                color: zAxisColor
            });
            axisZLabel.name = 'zAxis';

            unitGroup.add(axisXLabel);
            unitGroup.add(axisYLabel);
            unitGroup.add(axisZLabel);
        }
    }

    recolorGridNumbers(units) {
        const { mm, in: inches } = this.machineProfile;

        const inchesMax = Math.max(inches.width, inches.depth) + (IMPERIAL_GRID_SPACING * 10);
        const mmMax = Math.max(mm.width, mm.depth) + (METRIC_GRID_SPACING * 10);

        const imperialGridCount = Math.round(inchesMax / 3);
        const metricGridCount = Math.round(mmMax / 9);

        const gridCount = (units === IMPERIAL_UNITS) ? imperialGridCount : metricGridCount;
        const gridSpacing = (units === IMPERIAL_UNITS) ? IMPERIAL_GRID_SPACING : METRIC_GRID_SPACING;
        const textSize = (units === IMPERIAL_UNITS) ? (25.4 / 3) : (10 / 3);
        const textOffset = (units === IMPERIAL_UNITS) ? (25.4 / 5) : (10 / 5);

        const { currentTheme } = this.props.state;
        const { xAxisColor, yAxisColor } = currentTheme;

        const unitGroup = units === IMPERIAL_UNITS ?
            this.group.getObjectByName('ImperialGridLineNumbers')
            : this.group.getObjectByName('MetricGridLineNumbers');

        for (let i = -gridCount; i <= gridCount; ++i) {
            if (i !== 0) {
                unitGroup.remove(unitGroup.getObjectByName('xtextLabel' + i));
                const xtextLabel = new TextSprite({
                    x: i * gridSpacing,
                    y: textOffset,
                    z: 0,
                    size: textSize,
                    text: (units === IMPERIAL_UNITS) ? i : i * 10,
                    textAlign: 'center',
                    textBaseline: 'bottom',
                    color: xAxisColor,
                    opacity: 0.5
                });
                xtextLabel.name = 'xtextLabel' + i;
                unitGroup.add(xtextLabel);

                unitGroup.remove(unitGroup.getObjectByName('ytextLabel' + i));
                const ytextLabel = new TextSprite({
                    x: -textOffset,
                    y: i * gridSpacing,
                    z: 0,
                    size: textSize,
                    text: (units === IMPERIAL_UNITS) ? i : i * 10,
                    textAlign: 'right',
                    textBaseline: 'middle',
                    color: yAxisColor,
                    opacity: 0.5
                });
                ytextLabel.name = 'ytextLabel' + i;
                unitGroup.add(ytextLabel);
            }
        }
    }

    recolorScene() {
        const { currentTheme } = this.props.state;
        const { backgroundColor } = currentTheme;
        // Handle Background color
        this.renderer.setClearColor(new THREE.Color(backgroundColor), 1);
        this.recolorGrids();
        this.rerenderGCode();
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('resize', (msg) => {
                this.resizeRenderer();
            }),
            pubsub.subscribe('visualizer:redraw', () => {
                this.recolorScene();
                this.updateScene({ forceUpdate: true });
            }),
            pubsub.subscribe('file:load', (msg, data) => {
                const { isSecondary, activeVisualizer } = this.props;

                const isPrimaryVisualizer = !isSecondary && activeVisualizer === VISUALIZER_PRIMARY;
                const isSecondaryVisualizer = isSecondary && activeVisualizer === VISUALIZER_SECONDARY;

                if (isPrimaryVisualizer) {
                    this.load('', data);
                    return;
                }

                if (isSecondaryVisualizer) {
                    this.load('', data);
                    return;
                }
            }),
            pubsub.subscribe('softlimits:changevisibility', (msg, visibility) => {
                this.showSoftLimitsWarning = visibility;
                if (this.showSoftLimitsWarning) {
                    this.checkSoftLimits();
                } else {
                    pubsub.publish('softlimits:ok');
                }
            }),
            pubsub.subscribe('machine:connected', () => {
                this.machineConnected = true;
                this.checkSoftLimits();
            }),
            pubsub.subscribe('file:loaded', () => {
                this.fileLoaded = true;
                this.checkSoftLimits();
            }),
            pubsub.subscribe('softlimits:check', (msg, data) => {
                // because setting the workspace 0 is a call to run gcode,
                // there is no way for me to publish when it's
                // confirmed to be finished. since it uses the feeder,
                // it's slow, and the wpos is not changed to 0 when I run the check.
                // therefore, I'm sending data with the publish so the function knows
                // to manually set the wpos to 0.
                this.checkSoftLimits(data);
            }),
            pubsub.subscribe('machine:disconnected', () => {
                this.machineConnected = false;
                pubsub.publish('softlimits:ok');
            }),
            pubsub.subscribe('gcode:unload', () => {
                this.fileLoaded = false;
                pubsub.publish('softlimits:ok');
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

    checkSoftLimits(data) {
        if (this.machineConnected && this.fileLoaded && this.showSoftLimitsWarning) {
            this.calculateLimits(data);
        }
    }

    // https://tylercipriani.com/blog/2014/07/12/crossbrowser-javascript-scrollbar-detection/
    hasVerticalScrollbar() {
        return window.innerWidth > document.documentElement.clientWidth;
    }

    hasHorizontalScrollbar() {
        return window.innerHeight > document.documentElement.clientHeight;
    }

    getVisibleWidth() {
        const el = ReactDOM.findDOMNode(this.node);

        const visibleWidth = Math.max(
            Number(el && el.parentNode && el.parentNode.clientWidth) || 0,
            360
        );

        return visibleWidth;
    }

    getVisibleHeight() {
        const { containerID, isSecondary } = this.props;
        const container = document.getElementById(containerID);

        const clientHeight = isSecondary ? container.clientHeight - 2 : container.clientHeight - 30;

        return clientHeight;
    }

    addResizeEventListener() {
        window.addEventListener('resize', this.throttledResize);
    }

    removeResizeEventListener() {
        window.removeEventListener('resize', this.throttledResize);
    }

    resizeRenderer() {
        if (!(this.camera && this.renderer)) {
            return;
        }

        const width = this.getVisibleWidth();
        const height = this.getVisibleHeight();
        if (width === 0 || height === 0) {
            log.warn(`The width (${width}) and height (${height}) cannot be a zero value`);
        }

        // https://github.com/mrdoob/three.js/blob/dev/examples/js/cameras/CombinedCamera.js#L156
        // THREE.CombinedCamera.prototype.setSize = function(width, height) {
        //     this.cameraP.aspect = width / height;
        //     this.left = - width / 2;
        //     this.right = width / 2;
        //     this.top = height / 2;
        //     this.bottom = - height / 2;
        // }
        this.camera.setSize(width, height);
        this.camera.aspect = width / height; // Update camera aspect as well
        this.camera.updateProjectionMatrix();

        // Initialize viewport at the first time of resizing renderer
        if (!this.viewport) {
            // Defaults to 300x300mm
            this.viewport = new Viewport(this.camera, CAMERA_VIEWPORT_WIDTH, CAMERA_VIEWPORT_HEIGHT);
        }

        this.controls.handleResize();

        this.renderer.setSize(width, height);

        // Update the scene
        this.updateScene();
    }

    createLimits(xmin, xmax, ymin, ymax, zmin, zmax) {
        const { currentTheme } = this.props.state;
        const { limitColor } = currentTheme;

        const dx = Math.abs(xmax - xmin) || Number.MIN_VALUE;
        const dy = Math.abs(ymax - ymin) || Number.MIN_VALUE;
        const dz = Math.abs(zmax - zmin) || Number.MIN_VALUE;
        const color = limitColor;
        const opacity = 0.5;
        const transparent = true;
        const dashed = true;
        const dashSize = 3; // The size of the dash.
        const gapSize = 1; // The size of the gap.
        const linewidth = 1; // Controls line thickness.
        const scale = 1; // The scale of the dashed part of a line.
        const limits = new Cuboid({
            dx,
            dy,
            dz,
            color,
            opacity,
            transparent,
            linewidth,
            dashed,
            dashSize,
            gapSize,
            scale,
        });

        return limits;
    }

    createCoordinateSystem(units) {
        const { mm, in: inches } = this.machineProfile;
        const inchesMax = Math.max(inches.width, inches.depth) + (IMPERIAL_GRID_SPACING * 10);
        const mmMax = Math.max(mm.width, mm.depth) + (METRIC_GRID_SPACING * 10);

        const imperialGridCount = Math.ceil(inchesMax / 3);
        const metricGridCount = Math.ceil(mmMax / 9);

        const axisLength = (units === IMPERIAL_UNITS) ? inchesMax : mmMax;
        const height = (units === IMPERIAL_UNITS) ? inches.height : mm.height;
        const gridCount = (units === IMPERIAL_UNITS) ? imperialGridCount : metricGridCount;
        const gridSpacing = (units === IMPERIAL_UNITS) ? IMPERIAL_GRID_SPACING : METRIC_GRID_SPACING;
        const group = new THREE.Group();

        const { currentTheme } = this.props.state;
        const { gridColor, xAxisColor, yAxisColor, zAxisColor } = currentTheme;

        { // Coordinate Grid
            const gridLine = new GridLine(
                gridCount * gridSpacing,
                gridSpacing,
                gridCount * gridSpacing,
                gridSpacing,
                gridColor, // center line
                gridColor // grid
            );
            _each(gridLine.children, (o) => {
                o.material.opacity = 0.15;
                o.material.transparent = true;
                o.material.depthWrite = false;
            });
            gridLine.name = 'GridLine';
            group.add(gridLine);
        }

        { // Coordinate JogControl
            const coordinateAxes = new CoordinateAxes(axisLength, height);
            coordinateAxes.name = 'CoordinateAxes';
            group.add(coordinateAxes);
        }

        { // Axis Labels
            const axisXLabel = new TextSprite({
                x: axisLength + 10,
                y: 0,
                z: 0,
                size: 20,
                text: 'X',
                color: xAxisColor
            });
            axisXLabel.name = 'xAxis';
            const axisYLabel = new TextSprite({
                x: 0,
                y: axisLength + 10,
                z: 0,
                size: 20,
                text: 'Y',
                color: yAxisColor
            });
            axisYLabel.name = 'yAxis';
            const axisZLabel = new TextSprite({
                x: 0,
                y: 0,
                z: height + 10,
                size: 20,
                text: 'Z',
                color: zAxisColor
            });
            axisZLabel.name = 'zAxis';

            group.add(axisXLabel);
            group.add(axisYLabel);
            group.add(axisZLabel);
        }

        return group;
    }

    createGridLineNumbers(units) {
        const { mm, in: inches } = this.machineProfile;

        const inchesMax = Math.max(inches.width, inches.depth) + (IMPERIAL_GRID_SPACING * 10);
        const mmMax = Math.max(mm.width, mm.depth) + (METRIC_GRID_SPACING * 10);

        const imperialGridCount = Math.round(inchesMax / 3);
        const metricGridCount = Math.round(mmMax / 9);

        const gridCount = (units === IMPERIAL_UNITS) ? imperialGridCount : metricGridCount;

        const gridSpacing = (units === IMPERIAL_UNITS) ? IMPERIAL_GRID_SPACING : METRIC_GRID_SPACING;
        const textSize = (units === IMPERIAL_UNITS) ? (25.4 / 3) : (10 / 3);
        const textOffset = (units === IMPERIAL_UNITS) ? (25.4 / 5) : (10 / 5);
        const group = new THREE.Group();

        const { currentTheme } = this.props.state;
        const { xAxisColor, yAxisColor } = currentTheme;

        for (let i = -gridCount; i <= gridCount; ++i) {
            if (i !== 0) {
                const textLabel = new TextSprite({
                    x: i * gridSpacing,
                    y: textOffset,
                    z: 0,
                    size: textSize,
                    text: (units === IMPERIAL_UNITS) ? i : i * 10,
                    textAlign: 'center',
                    textBaseline: 'bottom',
                    color: xAxisColor,
                    opacity: 0.5
                });
                textLabel.name = 'xtextLabel' + i;
                group.add(textLabel);
            }
        }
        for (let i = -gridCount; i <= gridCount; ++i) {
            if (i !== 0) {
                const textLabel = new TextSprite({
                    x: -textOffset,
                    y: i * gridSpacing,
                    z: 0,
                    size: textSize,
                    text: (units === IMPERIAL_UNITS) ? i : i * 10,
                    textAlign: 'right',
                    textBaseline: 'middle',
                    color: yAxisColor,
                    opacity: 0.5
                });
                textLabel.name = 'ytextLabel' + i;
                group.add(textLabel);
            }
        }

        return group;
    }

    //
    // Creating a scene
    // http://threejs.org/docs/#Manual/Introduction/Creating_a_scene
    //
    createScene(el) {
        if (!el) {
            return;
        }

        const { state } = this.props;
        const { units, objects, currentTheme } = state;
        const width = this.getVisibleWidth();
        const height = this.getVisibleHeight();

        const { backgroundColor, cuttingCoordinateLines } = currentTheme;

        // WebGLRenderer
        this.renderer = new THREE.WebGLRenderer({
            autoClearColor: true,
            antialias: true,
            alpha: true
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(new THREE.Color(backgroundColor), 1);
        this.renderer.setSize(width, height);
        this.renderer.clear();

        el.appendChild(this.renderer.domElement);

        // To actually be able to display anything with Three.js, we need three things:
        // A scene, a camera, and a renderer so we can render the scene with the camera.
        this.scene = new THREE.Scene();

        this.camera = this.createCombinedCamera(width, height);

        //Set default camera position to 3D
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(CAMERA_DISTANCE, -CAMERA_DISTANCE, CAMERA_DISTANCE);

        this.controls = this.createTrackballControls(this.camera, this.renderer.domElement);

        this.setCameraMode(state.cameraMode);

        // Projection
        if (state.projection === 'orthographic') {
            this.camera.toOrthographic();
            this.camera.setZoom(1);
            this.camera.setFov(ORTHOGRAPHIC_FOV);
        } else {
            this.camera.toPerspective();
            this.camera.setZoom(1);
            this.camera.setFov(PERSPECTIVE_FOV);
        }

        { // Directional Light
            const color = 0xffffff;
            const intensity = 1;
            let light;

            light = new THREE.DirectionalLight(color, intensity);
            light.position.set(-1, -1, 1);
            this.scene.add(light);

            light = new THREE.DirectionalLight(color, intensity);
            light.position.set(1, -1, 1);
            this.scene.add(light);
        }

        { // Ambient Light
            const light = new THREE.AmbientLight(colornames('gray 25')); // soft white light
            this.scene.add(light);
        }

        { // Imperial Coordinate System
            const visible = objects.coordinateSystem.visible;
            const imperialCoordinateSystem = this.createCoordinateSystem(IMPERIAL_UNITS);
            imperialCoordinateSystem.name = 'ImperialCoordinateSystem';
            imperialCoordinateSystem.visible = visible && (units === IMPERIAL_UNITS);
            this.group.add(imperialCoordinateSystem);
        }

        { // Metric Coordinate System
            const visible = objects.coordinateSystem.visible;
            const metricCoordinateSystem = this.createCoordinateSystem(METRIC_UNITS);
            metricCoordinateSystem.name = 'MetricCoordinateSystem';
            metricCoordinateSystem.visible = visible && (units === METRIC_UNITS);
            this.group.add(metricCoordinateSystem);
        }

        { // Imperial Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const imperialGridLineNumbers = this.createGridLineNumbers(IMPERIAL_UNITS);
            imperialGridLineNumbers.name = 'ImperialGridLineNumbers';
            imperialGridLineNumbers.visible = visible && (units === IMPERIAL_UNITS);
            this.group.add(imperialGridLineNumbers);
        }

        { // Metric Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const metricGridLineNumbers = this.createGridLineNumbers(METRIC_UNITS);
            metricGridLineNumbers.name = 'MetricGridLineNumbers';
            metricGridLineNumbers.visible = visible && (units === METRIC_UNITS);
            this.group.add(metricGridLineNumbers);
        }

        { // Cutting Tool
            Promise.all([
                loadSTL('assets/models/stl/bit.stl').then(geometry => geometry),
                loadTexture('assets/textures/brushed-steel-texture.jpg').then(texture => texture),
            ]).then(result => {
                const [geometry, texture] = result;

                // Rotate the geometry 90 degrees about the X axis.
                geometry.rotateX(-Math.PI / 2);

                // Scale the geometry data.
                geometry.scale(0.5, 0.5, 0.5);

                // Compute the bounding box.
                geometry.computeBoundingBox();

                // Set the desired position from the origin rather than its center.
                const height = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
                geometry.translate(0, 0, (height / 2));

                let material;
                if (geometry.hasColors) {
                    material = new THREE.MeshLambertMaterial({
                        map: texture,
                        opacity: 0.6,
                        transparent: false,
                        color: '#caf0f8'
                    });
                }

                const object = new THREE.Object3D();
                object.add(new THREE.Mesh(geometry, material));

                this.cuttingTool = object;
                this.cuttingTool.name = 'CuttingTool';
                this.cuttingTool.visible = state.liteMode ? objects.cuttingTool.visibleLite : objects.cuttingTool.visible;

                this.group.add(this.cuttingTool);

                // Update the scene
                this.updateScene();
            });
        }

        { // Cutting Pointer
            this.cuttingPointer = new CuttingPointer({
                color: cuttingCoordinateLines,
                diameter: 2
            });
            this.cuttingPointer.name = 'CuttingPointer';
            this.cuttingPointer.visible = (state.liteMode) ? !objects.cuttingTool.visibleLite : !objects.cuttingTool.visible;
            this.group.add(this.cuttingPointer);
        }

        { // Limits
            const limits = _get(this.machineProfile, 'limits');
            const { xmin = 0, xmax = 0, ymin = 0, ymax = 0, zmin = 0, zmax = 0 } = { ...limits };
            this.limits = this.createLimits(xmin, xmax, ymin, ymax, zmin, zmax);
            this.limits.name = 'Limits';
            this.limits.visible = objects.limits.visible;
            this.updateLimitsPosition();
        }

        this.scene.add(this.group);
    }

    // @param [options] The options object.
    // @param [options.forceUpdate] Force rendering
    updateScene(options) {
        const { forceUpdate = false } = { ...options };
        const needUpdateScene = this.props.show || forceUpdate;

        if (this.renderer && needUpdateScene) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    clearScene() {
        // to iterate over all children (except the first) in a scene
        const objsToRemove = this.scene.children;
        _each(objsToRemove, (obj) => {
            this.scene.remove(obj);
        });

        if (this.controls) {
            this.controls.dispose();
        }

        // Update the scene
        this.updateScene();
    }

    createCombinedCamera(width, height) {
        const frustumWidth = width / 2;
        const frustumHeight = (height || width) / 2; // same to width if height is 0
        const fov = PERSPECTIVE_FOV;
        const near = PERSPECTIVE_NEAR;
        const far = PERSPECTIVE_FAR;
        const orthoNear = ORTHOGRAPHIC_NEAR;
        const orthoFar = ORTHOGRAPHIC_FAR;

        const camera = new CombinedCamera(
            frustumWidth,
            frustumHeight,
            fov,
            near,
            far,
            orthoNear,
            orthoFar
        );

        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = CAMERA_DISTANCE;

        return camera;
    }

    createPerspectiveCamera(width, height) {
        const fov = PERSPECTIVE_FOV;
        const aspect = (width > 0 && height > 0) ? Number(width) / Number(height) : 1;
        const near = PERSPECTIVE_NEAR;
        const far = PERSPECTIVE_FAR;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = CAMERA_DISTANCE;

        return camera;
    }

    createOrthographicCamera(width, height) {
        const left = -width / 2;
        const right = width / 2;
        const top = height / 2;
        const bottom = -height / 2;
        const near = ORTHOGRAPHIC_NEAR;
        const far = ORTHOGRAPHIC_FAR;
        const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

        return camera;
    }

    createTrackballControls(object, domElement) {
        const controls = new TrackballControls(object, domElement);

        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.4;
        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        controls.keys = [65, 83, 68];

        controls.minDistance = TRACKBALL_CONTROLS_MIN_DISTANCE;
        controls.maxDistance = TRACKBALL_CONTROLS_MAX_DISTANCE;

        let shouldAnimate = false;
        const animate = () => {
            controls.update();

            // Update the scene
            this.updateScene();

            if (shouldAnimate) {
                requestAnimationFrame(animate);
            }
        };

        controls.addEventListener('start', () => {
            shouldAnimate = true;
            animate();
        });
        controls.addEventListener('end', () => {
            shouldAnimate = false;
            this.updateScene();
        });
        controls.addEventListener('change', () => {
            // Update the scene
            this.updateScene();
        });

        return controls;
    }

    // Rotates the cutting tool around the z axis with a given rpm and an optional fps
    // @param {number} rpm The rounds per minutes
    // @param {number} [fps] The frame rate (Defaults to 60 frames per second)
    rotateCuttingTool(rpm = 0, fps = 60) {
        if (!this.cuttingTool) {
            return;
        }

        const delta = 1 / fps;
        const degrees = 360 * (delta * Math.PI / 180); // Rotates 360 degrees per second
        this.cuttingTool.rotateZ(-(rpm / 60 * degrees)); // rotate in clockwise direction
    }

    // Update cutting tool position
    updateCuttingToolPosition() {
        if (!this.cuttingTool) {
            return;
        }

        const pivotPoint = this.pivotPoint.get();
        const { x: wpox, y: wpoy, z: wpoz } = this.workPosition;
        const x0 = wpox - pivotPoint.x;
        const y0 = wpoy - pivotPoint.y;
        const z0 = wpoz - pivotPoint.z;

        this.cuttingTool.position.set(x0, y0, z0);
    }

    // Update cutting pointer position
    updateCuttingPointerPosition() {
        if (!this.cuttingPointer) {
            return;
        }

        const pivotPoint = this.pivotPoint.get();
        const { x: wpox, y: wpoy, z: wpoz } = this.workPosition;
        const x0 = wpox - pivotPoint.x;
        const y0 = wpoy - pivotPoint.y;
        const z0 = wpoz - pivotPoint.z;

        this.cuttingPointer.position.set(x0, y0, z0);
    }

    // Update limits position
    updateLimitsPosition() {
        if (!this.limits) {
            return;
        }

        const limits = _get(this.machineProfile, 'limits');
        const { xmin = 0, xmax = 0, ymin = 0, ymax = 0, zmin = 0, zmax = 0 } = { ...limits };
        const pivotPoint = this.pivotPoint.get();
        const { x: mpox, y: mpoy, z: mpoz } = this.machinePosition;
        const { x: wpox, y: wpoy, z: wpoz } = this.workPosition;
        const x0 = ((xmin + xmax) / 2) - (mpox - wpox) - pivotPoint.x;
        const y0 = ((ymin + ymax) / 2) - (mpoy - wpoy) - pivotPoint.y;
        const z0 = ((zmin + zmax) / 2) - (mpoz - wpoz) - pivotPoint.z;

        this.limits.position.set(x0, y0, z0);
    }

    // Make the controls look at the specified position
    lookAt(x, y, z) {
        this.controls.target.x = x;
        this.controls.target.y = y;
        this.controls.target.z = z;
        this.controls.update();
    }

    // Make the controls look at the center position
    lookAtCenter() {
        if (this.viewport) {
            this.viewport.update();
        }
        if (this.controls) {
            this.controls.reset();
        }
        this.updateScene();
    }

    handleSceneRender(vizualization, callback) {
        if (!this.visualizer) {
            return;
        }
        const obj = this.visualizer.render(vizualization);
        obj.name = '';
        this.group.add(obj);

        const bbox = getBoundingBox(obj);
        const dX = bbox.max.x - bbox.min.x;
        const dY = bbox.max.y - bbox.min.y;
        const dZ = bbox.max.z - bbox.min.z;
        const center = new THREE.Vector3(
            bbox.min.x + (dX / 2),
            bbox.min.y + (dY / 2),
            bbox.min.z + (dZ / 2)
        );

        // Set the pivot point to the center of the loaded object
        this.pivotPoint.set(center.x, center.y, center.z);

        // Update position
        this.updateCuttingToolPosition();
        this.updateCuttingPointerPosition();
        this.updateLimitsPosition();

        if (this.viewport && dX > 0 && dY > 0) {
            // The minimum viewport is 50x50mm
            const width = Math.max(dX + 50, 100);
            const height = Math.max(dY + 50, 100);
            const target = new THREE.Vector3(0, 0, bbox.max.z);
            this.viewport.set(width, height, target);
        }

        // Update the scene
        this.updateScene();

        switch (this.props.cameraPosition) {
        case 'top':
            this.toTopView();
            break;

        case '3d':
            this.to3DView();
            break;

        case 'front':
            this.toFrontView();
            break;

        case 'left':
            this.toLeftSideView();
            break;

        case 'right':
            this.toRightSideView();
            break;

        default:
            this.toFrontView();
        }

        reduxStore.dispatch({
            type: fileActions.UPDATE_FILE_RENDER_STATE,
            payload: {
                state: RENDER_RENDERED
            }
        });

        (typeof callback === 'function') && callback({ bbox: bbox });
    }

    load(name, vizualization, callback) {
        // Remove previous G-code object
        this.unload();
        const { currentTheme, disabled, disabledLite, liteMode } = this.props.state;
        const { setVisualizerReady } = this.props.actions;
        this.visualizer = new GCodeVisualizer(currentTheme);

        const shouldRenderVisualization = liteMode ? !disabledLite : !disabled;

        if (shouldRenderVisualization) {
            this.handleSceneRender(vizualization, callback);
        } else {
            setVisualizerReady();
        }

        this.fileLoaded = true;
    }

    calculateLimits(data) {
        const { workPosition, machinePosition, softXMax, softYMax, softZMax, homingFlag, machineCorner } = this.props;
        /* machineCorner:
            0 is top right
            1 is top left
            2 bottom right
            3 bottom left
        */
        let xMultiplier = -1;
        let yMultiplier = -1;
        if (homingFlag) {
            switch (machineCorner) {
            case 1:
                xMultiplier = 1;
                yMultiplier = -1;
                break;
            case 2:
                xMultiplier = -1;
                yMultiplier = 1;
                break;
            case 3:
                xMultiplier = 1;
                yMultiplier = 1;
                break;
            // case 0 and default are negative space, which is already assigned
            case 0:
            default:
                break;
            }
        }

        // get wpos
        let wpos;
        if (data !== 0) {
            wpos = workPosition;
        } else {
            wpos = {
                x: 0,
                y: 0,
                z: workPosition.z,
            };
        }

        // get mpos
        let mpos = machinePosition;

        let origin = {
            x: parseFloat(mpos.x) - parseFloat(wpos.x) * xMultiplier,
            y: parseFloat(mpos.y) - parseFloat(wpos.y) * yMultiplier,
            z: parseFloat(mpos.z) - parseFloat(wpos.z)
        };

        let limitsMax = {
            x: softXMax * xMultiplier - origin.x,
            y: softYMax * yMultiplier - origin.y,
            z: softZMax - origin.z,
        };

        let limitsMin = {
            x: origin.x * -1,
            y: origin.y * -1,
            z: origin.z,
        };

        // get bbox
        let bbox = reduxStore.getState().file.bbox;
        let bboxMin = bbox.min;
        let bboxMax = bbox.max;

        // check if machine will leave soft limits
        if (bboxMax.x > limitsMax.x || bboxMin.x < limitsMin.x ||
            bboxMax.y > limitsMax.y || bboxMin.y < limitsMin.y ||
            (bboxMax.z === null ? false : bboxMax.z > limitsMax.z) || (bboxMin.z === null ? false : bboxMin.z < limitsMin.z)) {
            pubsub.publish('softlimits:warning');
        } else {
            pubsub.publish('softlimits:ok');
        }
    }

    unload() {
        const visualizerObject = this.group.getObjectByName('Visualizer');
        if (visualizerObject) {
            this.group.remove(visualizerObject);
        }

        if (this.visualizer) {
            this.visualizer.unload();
            this.visualizer = null;
        }

        if (this.pivotPoint) {
            // Set the pivot point to the origin point (0, 0, 0)
            this.pivotPoint.set(0, 0, 0);
        }

        if (this.controls) {
            this.controls.reset();
        }

        if (this.viewport) {
            this.viewport.reset();
        }
        // Update the scene
        this.updateScene();
    }

    setCameraMode(mode) {
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        // A number representing a given button:
        // 0: main button pressed, usually the left button or the un-initialized state
        const MAIN_BUTTON = 0, ROTATE = 0;
        const SECOND_BUTTON = 2, PAN = 2;

        if (mode === CAMERA_MODE_ROTATE) {
            this.controls && this.controls.setMouseButtonState(MAIN_BUTTON, ROTATE);
        }
        if (mode === CAMERA_MODE_PAN) {
            this.controls && this.controls.setMouseButtonState(SECOND_BUTTON, PAN);
        }
    }

    toTopView() {
        if (this.controls) {
            this.controls.reset();
        }

        this.camera.up.set(0, 1, 0);
        this.camera.position.set(0, 0, CAMERA_DISTANCE);

        if (this.viewport) {
            this.viewport.update();
        }
        if (this.controls) {
            this.controls.update();
        }
        this.updateScene();
    }

    to3DView() {
        if (this.controls) {
            this.controls.reset();
        }

        this.camera.up.set(0, 0, 1);
        this.camera.position.set(CAMERA_DISTANCE, -CAMERA_DISTANCE, CAMERA_DISTANCE);

        if (this.viewport) {
            this.viewport.update();
        }
        if (this.controls) {
            this.controls.update();
        }
        this.updateScene();
    }

    toFrontView() {
        if (this.controls) {
            this.controls.reset();
        }

        this.camera.up.set(0, 0, 1);
        this.camera.position.set(0, -CAMERA_DISTANCE, 0);

        if (this.viewport) {
            this.viewport.update();
        }
        if (this.controls) {
            this.controls.update();
        }
        this.updateScene();
    }

    toLeftSideView() {
        if (this.controls) {
            this.controls.reset();
        }

        this.camera.up.set(0, 0, 1);
        this.camera.position.set(CAMERA_DISTANCE, 0, 0);

        if (this.viewport) {
            this.viewport.update();
        }
        if (this.controls) {
            this.controls.update();
        }
    }

    toRightSideView() {
        if (this.controls) {
            this.controls.reset();
        }

        this.camera.up.set(0, 0, 1);
        this.camera.position.set(-CAMERA_DISTANCE, 0, 0);

        if (this.viewport) {
            this.viewport.update();
        }
        if (this.controls) {
            this.controls.update();
        }
        this.updateScene();
    }

    zoomFit() {
        if (this.viewport) {
            this.viewport.update();
        }
        this.updateScene();
    }

    zoomIn(delta = 0.1) {
        const { noZoom } = this.controls;
        if (noZoom) {
            return;
        }

        this.controls.zoomIn(delta);
        this.controls.update();

        // Update the scene
        this.updateScene();
    }

    zoomOut(delta = 0.1) {
        const { noZoom } = this.controls;
        if (noZoom) {
            return;
        }

        this.controls.zoomOut(delta);
        this.controls.update();

        // Update the scene
        this.updateScene();
    }

    // deltaX and deltaY are in pixels; right and down are positive
    pan(deltaX, deltaY) {
        const eye = new THREE.Vector3();
        const pan = new THREE.Vector3();
        const objectUp = new THREE.Vector3();

        eye.subVectors(this.controls.object.position, this.controls.target);
        objectUp.copy(this.controls.object.up);

        pan.copy(eye).cross(objectUp.clone()).setLength(deltaX);
        pan.add(objectUp.clone().setLength(deltaY));

        this.controls.object.position.add(pan);
        this.controls.target.add(pan);
        this.controls.update();
    }

    // http://stackoverflow.com/questions/18581225/orbitcontrol-or-trackballcontrol
    panUp() {
        const { noPan, panSpeed } = this.controls;
        !noPan && this.pan(0, 1 * panSpeed);
    }

    panDown() {
        const { noPan, panSpeed } = this.controls;
        !noPan && this.pan(0, -1 * panSpeed);
    }

    panLeft() {
        const { noPan, panSpeed } = this.controls;
        !noPan && this.pan(1 * panSpeed, 0);
    }

    panRight() {
        const { noPan, panSpeed } = this.controls;
        !noPan && this.pan(-1 * panSpeed, 0);
    }

    render() {
        if (!WebGL.isWebGLAvailable()) {
            return null;
        }
        return (
            <div
                style={{
                    visibility: this.props.show ? 'visible' : 'hidden'
                }}
                ref={this.setRef}
                className={styles.visualizerContainer}
            />
        );
    }
}

Visualizer.defaultProps = {
    isSecondary: false,
};

export default connect((store) => {
    const machinePosition = _get(store, 'controller.mpos');
    const workPosition = _get(store, 'controller.wpos');
    const receivedLines = _get(store, 'controller.sender.status.received', 0);
    // soft limits
    const softXMax = _get(store, 'controller.settings.settings.$130');
    const softYMax = _get(store, 'controller.settings.settings.$131');
    const softZMax = _get(store, 'controller.settings.settings.$132');
    const homingFlag = _get(store, 'controller.homingFlag');
    const machineCorner = _get(store, 'controller.settings.settings.$23');
    const { activeVisualizer } = store.visualizer;
    return {
        machinePosition,
        workPosition,
        receivedLines,
        softXMax,
        softYMax,
        softZMax,
        homingFlag,
        machineCorner,
        activeVisualizer
    };
}, null, null, { forwardRef: true })(Visualizer);
