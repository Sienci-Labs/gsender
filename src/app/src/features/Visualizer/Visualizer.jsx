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

import { store as reduxStore } from 'app/store/redux';
import gsap from 'gsap';
import { connect } from 'react-redux';
import _get from 'lodash/get';
import _each from 'lodash/each';
import _isEqual from 'lodash/isEqual';
import _throttle from 'lodash/throttle';
import colornames from 'colornames';
import pubsub from 'pubsub-js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import { degToRad } from 'three/src/math/MathUtils';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
    RENDER_RENDERED,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
    FILE_TYPE,
    WORKSPACE_MODE,
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_CHECK,
    LASER_MODE,
} from 'app/constants';
import CombinedCamera from 'app/lib/three/oldCombinedCamera';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import TrackballControls from 'app/lib/three/oldTrackballControls';
import * as WebGL from 'app/lib/three/WebGL';
import log from 'app/lib/log';
import _ from 'lodash';
import store from 'app/store';
import api from 'app/api';
import { colorsResponse } from 'app/workers/colors.response';
import {
    Toaster,
    TOASTER_DANGER,
    TOASTER_UNTIL_CLOSE,
} from '../../lib/toaster/ToasterLib';
import controller from '../../lib/controller';
import { getBoundingBox, loadSTL, loadTexture } from './helpers';
import Viewport from './Viewport';
import CoordinateAxes from './CoordinateAxes';
import Cuboid from './Cuboid';
import CuttingPointer from './CuttingPointer';
import LaserPointer from './LaserPointer';
import GridLine from './GridLine';
import PivotPoint3 from './PivotPoint3';
import TextSprite from './TextSprite';
import GCodeVisualizer from './GCodeVisualizer';
import {
    BACKGROUND_PART,
    CAMERA_MODE_PAN,
    CAMERA_MODE_ROTATE,
    CUTTING_PART,
    GRID_PART,
    LIMIT_PART,
    XAXIS_PART,
    YAXIS_PART,
    ZAXIS_PART,
} from './constants';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import { isLaserMode } from '../../lib/laserMode';
import { updateFileRenderState } from 'app/store/redux/slices/fileInfo.slice';

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
import { outlineResponse } from '../../workers/Outline.response';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import { toast } from 'app/lib/toaster';

class Visualizer extends Component {
    static propTypes = {
        show: PropTypes.bool,
        cameraPosition: PropTypes.oneOf([
            'Top',
            '3D',
            'Front',
            'Left',
            'Right',
            'Free',
        ]),
        state: PropTypes.object,
        isSecondary: PropTypes.bool,
    };

    visualizerConfig = new WidgetConfig('visualizer');

    pubsubTokens = [];

    outlineRunning = false;

    isAgitated = false;

    machinePosition = {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        b: 0,
        c: 0,
    };

    workPosition = {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        b: 0,
        c: 0,
    };

    vizualization = null;

    colorsWorker = null;

    renderCallback = null;

    machineProfile = store.get('workspace.machineProfile');

    group = new THREE.Group();

    didZoom = false;

    pivotPoint = new PivotPoint3({ x: 0, y: 0, z: 0 }, (x, y, z) => {
        // relative position
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
        const {
            xmin = 0,
            xmax = 0,
            ymin = 0,
            ymax = 0,
            zmin = 0,
            zmax = 0,
        } = { ...limits };
        this.limits = this.createLimits(xmin, xmax, ymin, ymax, zmin, zmax);
        this.limits.name = 'Limits';
        this.limits.visible = state.objects.limits.visible;

        this.unload();

        this.updateCuttingToolPosition();
        this.updateLaserPointerPosition();
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
        this.bloomComposer = null;
        this.copyComposer = null;
        this.fxaaComposer = null;
        this.finalComposer = null;
        this.controls = null;
        this.viewport = null;
        this.cuttingTool = null;
        this.laserPointer = null;
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
            this.createScene(this.node);

            setTimeout(() => {
                this.resizeRenderer();
            }, 0);
        }

        this.resizeRenderer();
    }

    componentDidUpdate(prevProps) {
        let forceUpdate = false;
        let needUpdateScene = false;
        // this variable determines whether the camera should reset or not
        // it resets on the first render, and persists for the rest
        // it is used for the secondary visualizer in surfacing
        const shouldZoom = this.props.isSecondary ? !this.didZoom : true;
        const prevState = prevProps.state;
        const state = this.props.state;
        const isConnected = this.props.isConnected;

        // Update the visualizer size whenever the machine is running,
        // to fill the empty area between it and the job status widget when necessary
        //this.resizeRenderer();

        // Enable or disable 3D view
        // shouldZoom is called here because the zoom level is indicated by the viewport
        if (
            prevProps.show !== this.props.show &&
            this.props.show === true &&
            shouldZoom
        ) {
            this.viewport.update();

            // Set forceUpdate to true when enabling or disabling 3D view
            forceUpdate = true;
            needUpdateScene = true;
        }

        // Update visualizer's frame index
        if (this.visualizer) {
            const frameIndex = this.props.receivedLines;
            this.visualizer.setFrameIndex(frameIndex);
            // grey lines
            if (this.props.senderStatus) {
                this.visualizer.greyOutLines(
                    this.props.senderStatus.currentLineRunning,
                );
            }
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
            if (this.viewport && shouldZoom) {
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
        if (
            prevState.units !== state.units ||
            prevState.objects.coordinateSystem.visible !==
                state.objects.coordinateSystem.visible
        ) {
            const visible = state.objects.coordinateSystem.visible;

            // Imperial
            const imperialCoordinateSystem = this.group.getObjectByName(
                'ImperialCoordinateSystem',
            );
            if (imperialCoordinateSystem) {
                imperialCoordinateSystem.visible =
                    visible && state.units === IMPERIAL_UNITS;
            }

            // Metric
            const metricCoordinateSystem = this.group.getObjectByName(
                'MetricCoordinateSystem',
            );
            if (metricCoordinateSystem) {
                metricCoordinateSystem.visible =
                    visible && state.units === METRIC_UNITS;
            }

            needUpdateScene = true;
        }

        // Whether to show grid line numbers
        if (
            prevState.units !== state.units ||
            prevState.objects.gridLineNumbers.visible !==
                state.objects.gridLineNumbers.visible
        ) {
            const visible = state.objects.gridLineNumbers.visible;

            // Imperial
            const imperialGridLineNumbers = this.group.getObjectByName(
                'ImperialGridLineNumbers',
            );
            if (imperialGridLineNumbers) {
                imperialGridLineNumbers.visible =
                    visible && state.units === IMPERIAL_UNITS;
            }

            // Metric
            const metricGridLineNumbers = this.group.getObjectByName(
                'MetricGridLineNumbers',
            );
            if (metricGridLineNumbers) {
                metricGridLineNumbers.visible =
                    visible && state.units === METRIC_UNITS;
            }

            needUpdateScene = true;
        }

        // Whether to show limits
        if (
            this.limits &&
            this.limits.visible !== state.objects.limits.visible
        ) {
            this.limits.visible = state.objects.limits.visible;
            needUpdateScene = true;
        }

        // Whether to show cutting tool or cutting pointer
        if (this.cuttingTool && this.laserPointer && this.cuttingPointer) {
            // if connected, set visibility
            if (isConnected) {
                const { liteMode } = state;
                const isLaser = isLaserMode();
                this.cuttingTool.visible =
                    !isLaser &&
                    (liteMode
                        ? state.objects.cuttingTool.visibleLite
                        : state.objects.cuttingTool.visible);
                this.laserPointer.visible =
                    isLaser &&
                    (liteMode
                        ? state.objects.cuttingTool.visibleLite
                        : state.objects.cuttingTool.visible);
                this.cuttingPointer.visible = liteMode
                    ? !state.objects.cuttingTool.visibleLite
                    : !state.objects.cuttingTool.visible;
                needUpdateScene = true;
            } else {
                // if not, don't show
                this.cuttingTool.visible = false;
                this.laserPointer.visible = false;
                this.cuttingPointer.visible = false;
                needUpdateScene = true;
            }
        }

        {
            // Update position
            const { state } = this.props;
            const { activeState } = state;
            const { machinePosition, workPosition } = this.props;

            let newPos = workPosition;

            if (activeState === GRBL_ACTIVE_STATE_CHECK && this.fileLoaded) {
                newPos = this.visualizer.getCurrentLocation();
            }

            let needUpdatePosition = false;

            // Machine position
            const {
                x: mpox0,
                y: mpoy0,
                z: mpoz0,
                a: mpoa0,
            } = this.machinePosition;
            const { x: mpox1, y: mpoy1, z: mpoz1, a: mpoa1 } = machinePosition;
            if (
                mpox0 !== mpox1 ||
                mpoy0 !== mpoy1 ||
                mpoz0 !== mpoz1 ||
                mpoa0 !== mpoa1
            ) {
                this.machinePosition = machinePosition;
                needUpdatePosition = true;
                needUpdateScene = true;
            }

            // Work position
            const {
                x: wpox0,
                y: wpoy0,
                z: wpoz0,
                a: wpoa0,
            } = this.workPosition;
            const { x: wpox1, y: wpoy1, z: wpoz1, a: wpoa1 } = newPos;
            if (
                wpox0 !== wpox1 ||
                wpoy0 !== wpoy1 ||
                wpoz0 !== wpoz1 ||
                wpoa0 !== wpoa1
            ) {
                this.workPosition = newPos;
                needUpdatePosition = true;
                needUpdateScene = true;
            }

            if (needUpdatePosition) {
                this.updateCuttingToolPosition(newPos);
                this.updateLaserPointerPosition();
                this.updateCuttingPointerPosition();
                this.updateLimitsPosition();
                this.updateGcodeModal(
                    prevProps.workPosition,
                    this.props.workPosition,
                );
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
            if (this.props.cameraPosition === 'Top') {
                this.toTopView();
            }
            if (this.props.cameraPosition === '3D') {
                this.to3DView();
            }
            if (this.props.cameraPosition === 'Front') {
                this.toFrontView();
            }
            if (this.props.cameraPosition === 'Left') {
                this.toLeftSideView();
            }
            if (this.props.cameraPosition === 'Right') {
                this.toRightSideView();
            }
        }
    }

    showToast = _.throttle(
        () => {
            toast.info(this.state.finishedMessage);
        },
        2000,
        { trailing: false },
    );

    controllerEvents = {
        gcode_error: _throttle(
            (msg) => {
                toast.error(msg);
            },
            250,
            { trailing: false },
        ),
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

    async uploadGCodeFile(gcode) {
        const serializedFile = new File([gcode], 'surfacing.gcode');

        await uploadGcodeFileToServer(
            serializedFile,
            controller.port,
            VISUALIZER_PRIMARY,
        );
    }

    rerenderGCode() {
        const content = reduxStore.getState().file.content;

        if (!content) {
            return;
        }

        const group = this.group.getObjectByName('Visualizer');
        if (group) {
            this.group.remove(group);
        }
        // reupload the file to update the colours
        this.uploadGCodeFile(content);
    }

    reparseGCode() {
        const { state } = this.props;
        const { gcode } = state;
        // reparse file
        pubsub.publish('reparseGCode', {
            content: gcode.content,
            size: gcode.size,
            name: gcode.name,
            visualizer: this.props.isSecondary
                ? VISUALIZER_SECONDARY
                : VISUALIZER_PRIMARY,
        });
    }

    reloadGCode() {
        const { actions, state } = this.props;
        const { gcode } = state;
        actions.loadGCode('', gcode.visualization);
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
    };

    redrawGrids() {
        const { objects, units } = this.props.state;
        const impGroup = this.group.getObjectByName('ImperialCoordinateSystem');
        const metGroup = this.group.getObjectByName('MetricCoordinateSystem');
        const impLineNumbers = this.group.getObjectByName(
            'ImperialGridLineNumbers',
        );
        const metLineNumbers = this.group.getObjectByName(
            'MetricGridLineNumbers',
        );

        this.group.remove(impGroup);
        this.group.remove(metGroup);
        this.group.remove(impLineNumbers);
        this.group.remove(metLineNumbers);

        {
            // Imperial Coordinate System
            const visible = objects.coordinateSystem.visible;
            const imperialCoordinateSystem =
                this.createCoordinateSystem(IMPERIAL_UNITS);
            imperialCoordinateSystem.name = 'ImperialCoordinateSystem';
            imperialCoordinateSystem.visible =
                visible && units === IMPERIAL_UNITS;
            this.group.add(imperialCoordinateSystem);
        }

        {
            // Metric Coordinate System
            const visible = objects.coordinateSystem.visible;
            const metricCoordinateSystem =
                this.createCoordinateSystem(METRIC_UNITS);
            metricCoordinateSystem.name = 'MetricCoordinateSystem';
            metricCoordinateSystem.visible = visible && units === METRIC_UNITS;
            this.group.add(metricCoordinateSystem);
        }

        {
            // Imperial Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const imperialGridLineNumbers =
                this.createGridLineNumbers(IMPERIAL_UNITS);
            imperialGridLineNumbers.name = 'ImperialGridLineNumbers';
            imperialGridLineNumbers.visible =
                visible && units === IMPERIAL_UNITS;
            this.group.add(imperialGridLineNumbers);
        }

        {
            // Metric Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const metricGridLineNumbers =
                this.createGridLineNumbers(METRIC_UNITS);
            metricGridLineNumbers.name = 'MetricGridLineNumbers';
            metricGridLineNumbers.visible = visible && units === METRIC_UNITS;
            this.group.add(metricGridLineNumbers);
        }
    }

    recolorGrids() {
        const { currentTheme } = this.props.state;
        const impGroup = this.group.getObjectByName('ImperialCoordinateSystem');
        const metGroup = this.group.getObjectByName('MetricCoordinateSystem');

        {
            // Imperial Coordinate System
            _each(impGroup.getObjectByName('GridLine').children, (o) => {
                o.material.color.set(currentTheme.get(GRID_PART));
            });
        }

        {
            // Metric Coordinate System
            _each(metGroup.getObjectByName('GridLine').children, (o) => {
                o.material.color.set(currentTheme.get(GRID_PART));
            });
        }

        this.recolorGridLabels(IMPERIAL_UNITS);
        this.recolorGridLabels(METRIC_UNITS);
        this.recolorGridNumbers(IMPERIAL_UNITS);
        this.recolorGridNumbers(METRIC_UNITS);
    }

    recolorGridLabels(units) {
        const { mm, in: inches } = this.machineProfile;
        const inchesMax =
            Math.max(inches.width, inches.depth) + IMPERIAL_GRID_SPACING * 10;
        const mmMax = Math.max(mm.width, mm.depth) + METRIC_GRID_SPACING * 10;

        const axisLength = units === IMPERIAL_UNITS ? inchesMax : mmMax;
        const height = units === IMPERIAL_UNITS ? inches.height : mm.height;

        const { currentTheme } = this.props.state;

        const unitGroup =
            units === IMPERIAL_UNITS
                ? this.group.getObjectByName('ImperialCoordinateSystem')
                : this.group.getObjectByName('MetricCoordinateSystem');

        unitGroup.remove(unitGroup.getObjectByName('xAxis'));
        unitGroup.remove(unitGroup.getObjectByName('yAxis'));
        unitGroup.remove(unitGroup.getObjectByName('zAxis'));

        {
            // Axis Labels
            const axisXLabel = new TextSprite({
                x: axisLength + 10,
                y: 0,
                z: 0,
                size: 20,
                text: 'X',
                color: currentTheme.get(XAXIS_PART),
            });
            axisXLabel.name = 'xAxis';
            const axisYLabel = new TextSprite({
                x: 0,
                y: axisLength + 10,
                z: 0,
                size: 20,
                text: 'Y',
                color: currentTheme.get(YAXIS_PART),
            });
            axisYLabel.name = 'yAxis';
            const axisZLabel = new TextSprite({
                x: 0,
                y: 0,
                z: height + 10,
                size: 20,
                text: 'Z',
                color: currentTheme.get(ZAXIS_PART),
            });
            axisZLabel.name = 'zAxis';

            unitGroup.add(axisXLabel);
            unitGroup.add(axisYLabel);
            unitGroup.add(axisZLabel);
        }
    }

    recolorGridNumbers(units) {
        const { mm, in: inches } = this.machineProfile;

        const inchesMax =
            Math.max(inches.width, inches.depth) + IMPERIAL_GRID_SPACING * 10;
        const mmMax = Math.max(mm.width, mm.depth) + METRIC_GRID_SPACING * 10;

        const imperialGridCount = Math.round(inchesMax / 3);
        const metricGridCount = Math.round(mmMax / 9);

        const gridCount =
            units === IMPERIAL_UNITS ? imperialGridCount : metricGridCount;
        const gridSpacing =
            units === IMPERIAL_UNITS
                ? IMPERIAL_GRID_SPACING
                : METRIC_GRID_SPACING;
        const textSize = units === IMPERIAL_UNITS ? 25.4 / 3 : 10 / 3;
        const textOffset = units === IMPERIAL_UNITS ? 25.4 / 5 : 10 / 5;

        const { currentTheme } = this.props.state;

        const unitGroup =
            units === IMPERIAL_UNITS
                ? this.group.getObjectByName('ImperialGridLineNumbers')
                : this.group.getObjectByName('MetricGridLineNumbers');

        for (let i = -gridCount; i <= gridCount; ++i) {
            if (i !== 0) {
                unitGroup.remove(unitGroup.getObjectByName('xtextLabel' + i));
                const xtextLabel = new TextSprite({
                    x: i * gridSpacing,
                    y: textOffset,
                    z: 0,
                    size: textSize,
                    text: units === IMPERIAL_UNITS ? i : i * 10,
                    textAlign: 'center',
                    textBaseline: 'bottom',
                    color: currentTheme.get(XAXIS_PART),
                    opacity: 0.5,
                });
                xtextLabel.name = 'xtextLabel' + i;
                unitGroup.add(xtextLabel);

                unitGroup.remove(unitGroup.getObjectByName('ytextLabel' + i));
                const ytextLabel = new TextSprite({
                    x: -textOffset,
                    y: i * gridSpacing,
                    z: 0,
                    size: textSize,
                    text: units === IMPERIAL_UNITS ? i : i * 10,
                    textAlign: 'right',
                    textBaseline: 'middle',
                    color: currentTheme.get(YAXIS_PART),
                    opacity: 0.5,
                });
                ytextLabel.name = 'ytextLabel' + i;
                unitGroup.add(ytextLabel);
            }
        }
    }

    recolorCuttingPointer() {
        const pointerObject = this.group.getObjectByName('CuttingPointer');
        if (pointerObject) {
            this.group.remove(pointerObject);
            this.createCuttingPointer();
        }
    }

    createCuttingPointer() {
        const { state, isConnected } = this.props;
        const { currentTheme, liteMode } = state;
        this.cuttingPointer = new CuttingPointer({
            color: currentTheme.get(CUTTING_PART),
            diameter: 2,
        });
        this.cuttingPointer.name = 'CuttingPointer';
        this.cuttingPointer.visible =
            isConnected &&
            (liteMode
                ? !state.objects.cuttingTool.visibleLite
                : !state.objects.cuttingTool.visible);

        this.group.add(this.cuttingPointer);
    }

    recolorScene() {
        const { currentTheme } = this.props.state;
        // Handle Background color
        this.renderer.setClearColor(
            new THREE.Color(currentTheme.get(BACKGROUND_PART)),
            1,
        );
        this.recolorGrids();
        this.recolorCuttingPointer();
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

                const isPrimaryVisualizer =
                    !isSecondary && activeVisualizer === VISUALIZER_PRIMARY;
                const isSecondaryVisualizer =
                    isSecondary && activeVisualizer === VISUALIZER_SECONDARY;

                const callback = ({ bbox }) => {
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
                };

                if (isPrimaryVisualizer) {
                    this.load('', data, callback);
                    return;
                }

                if (isSecondaryVisualizer) {
                    this.load('', data);
                    return;
                }
            }),
            pubsub.subscribe(
                'softlimits:changevisibility',
                (msg, visibility) => {
                    this.showSoftLimitsWarning = visibility;
                    if (this.showSoftLimitsWarning) {
                        this.checkSoftLimits();
                    } else {
                        pubsub.publish('softlimits:ok');
                    }
                },
            ),
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
            pubsub.subscribe('visualizer:updateposition', (_, data) => {
                this.updateCuttingToolPosition(data, {
                    forceUpdateAllAxes: true,
                });
            }),
            pubsub.subscribe('colors:load', (_, data) => {
                const { colorArray, savedColors } = data;
                this.handleSceneRender(
                    this.vizualization,
                    colorArray,
                    savedColors,
                    this.renderCallback,
                );
                if (this.colorsWorker) {
                    this.colorsWorker.terminate();
                }
            }),
            pubsub.subscribe('outline:start', () => {
                if (this.outlineRunning) {
                    return;
                }

                this.outlineRunning = true;

                const vertices = this.props.actions.getHull();
                const outlineWorker = new Worker(
                    new URL('../../workers/Outline.worker.js', import.meta.url),
                    { type: 'module' },
                );

                const laserOnOutline = store.get(
                    'widgets.spindle.laser.laserOnOutline',
                    false,
                );
                const spindleMode = store.get('widgets.spindle.mode');
                // outline toggled on and currently in laser mode
                const isLaser = laserOnOutline && spindleMode === LASER_MODE;

                outlineWorker.onmessage = ({ data }) => {
                    outlineResponse({ data }, laserOnOutline);
                    // Enable the outline button again
                    this.outlineRunning = false;
                };

                outlineWorker.postMessage({
                    isLaser,
                    parsedData: vertices,
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

    checkSoftLimits(data) {
        if (
            this.machineConnected &&
            this.fileLoaded &&
            this.showSoftLimitsWarning
        ) {
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
        const el = this.node;

        const visibleWidth = Math.max(
            Number(el?.parentNode?.clientWidth) || 0,
            360,
        );

        return visibleWidth;
    }

    getVisibleHeight() {
        const { containerID, isSecondary } = this.props;

        // if (isSecondary) {
        //     const el = this.node;

        //     const visibleHeight = Math.max(
        //         Number(el?.parentNode?.clientHeight) || 0,
        //         360,
        //     );

        //     return visibleHeight;
        // }

        const container = document.getElementById(containerID);

        // when changing screen size to mobile,
        // this function runs as the visualizer is getting removed,
        // resulting in a null container
        if (!container) {
            return 0;
        }

        return container.clientHeight;

        // const clientHeight = isSecondary
        //     ? container.clientHeight - 2
        //     : container.clientHeight - 30;

        // return clientHeight;
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
            log.warn(
                `The width (${width}) and height (${height}) cannot be a zero value`,
            );
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
            this.viewport = new Viewport(
                this.camera,
                CAMERA_VIEWPORT_WIDTH,
                CAMERA_VIEWPORT_HEIGHT,
            );
        }

        this.controls.handleResize();

        this.renderer.setSize(width, height);
        this.copyComposer.setSize(width, height);
        this.fxaaComposer.setSize(width, height);
        this.bloomComposer.setSize(width, height);
        this.finalComposer.setSize(width, height);

        // Update the scene
        this.updateScene();
    }

    createLimits(xmin, xmax, ymin, ymax, zmin, zmax) {
        const { currentTheme } = this.props.state;

        const dx = Math.abs(xmax - xmin) || Number.MIN_VALUE;
        const dy = Math.abs(ymax - ymin) || Number.MIN_VALUE;
        const dz = Math.abs(zmax - zmin) || Number.MIN_VALUE;
        const color = currentTheme.get(LIMIT_PART);
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
        const inchesMax =
            Math.max(inches.width, inches.depth) + IMPERIAL_GRID_SPACING * 10;
        const mmMax = Math.max(mm.width, mm.depth) + METRIC_GRID_SPACING * 10;

        const imperialGridCount = Math.ceil(inchesMax / 3);
        const metricGridCount = Math.ceil(mmMax / 9);

        const axisLength = units === IMPERIAL_UNITS ? inchesMax : mmMax;
        const height = units === IMPERIAL_UNITS ? inches.height : mm.height;
        const gridCount =
            units === IMPERIAL_UNITS ? imperialGridCount : metricGridCount;
        const gridSpacing =
            units === IMPERIAL_UNITS
                ? IMPERIAL_GRID_SPACING
                : METRIC_GRID_SPACING;
        const group = new THREE.Group();
        const step = units === IMPERIAL_UNITS ? 25.4 : 10;

        const { currentTheme } = this.props.state;

        {
            // Coordinate Grid
            const gridLine = new GridLine(
                gridCount * gridSpacing * 2,
                gridCount * gridSpacing * 2,
                step,
                currentTheme.get(GRID_PART), // grid
            );
            gridLine.name = 'GridLine';
            group.add(gridLine);
        }

        {
            // Coordinate JogControl
            const coordinateAxes = new CoordinateAxes(axisLength, height);
            coordinateAxes.name = 'CoordinateAxes';
            group.add(coordinateAxes);
        }

        {
            // Axis Labels
            const axisXLabel = new TextSprite({
                x: axisLength + 10,
                y: 0,
                z: 0,
                size: 20,
                text: 'X',
                color: currentTheme.get(XAXIS_PART),
            });
            axisXLabel.name = 'xAxis';
            const axisYLabel = new TextSprite({
                x: 0,
                y: axisLength + 10,
                z: 0,
                size: 20,
                text: 'Y',
                color: currentTheme.get(YAXIS_PART),
            });
            axisYLabel.name = 'yAxis';
            const axisZLabel = new TextSprite({
                x: 0,
                y: 0,
                z: height + 10,
                size: 20,
                text: 'Z',
                color: currentTheme.get(ZAXIS_PART),
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

        const inchesMax =
            Math.max(inches.width, inches.depth) + IMPERIAL_GRID_SPACING * 10;
        const mmMax = Math.max(mm.width, mm.depth) + METRIC_GRID_SPACING * 10;

        const imperialGridCount = Math.round(inchesMax / 3);
        const metricGridCount = Math.round(mmMax / 9);

        const gridCount =
            units === IMPERIAL_UNITS ? imperialGridCount : metricGridCount;

        const gridSpacing =
            units === IMPERIAL_UNITS
                ? IMPERIAL_GRID_SPACING
                : METRIC_GRID_SPACING;
        const textSize = units === IMPERIAL_UNITS ? 25.4 / 3 : 10 / 3;
        const textOffset = units === IMPERIAL_UNITS ? 25.4 / 5 : 10 / 5;
        const group = new THREE.Group();

        const { currentTheme } = this.props.state;

        for (let i = -gridCount; i <= gridCount; ++i) {
            if (i !== 0) {
                const textLabel = new TextSprite({
                    x: i * gridSpacing,
                    y: textOffset,
                    z: 0,
                    size: textSize,
                    text: units === IMPERIAL_UNITS ? i : i * 10,
                    textAlign: 'center',
                    textBaseline: 'bottom',
                    color: currentTheme.get(XAXIS_PART),
                    opacity: 0.5,
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
                    text: units === IMPERIAL_UNITS ? i : i * 10,
                    textAlign: 'right',
                    textBaseline: 'middle',
                    color: currentTheme.get(YAXIS_PART),
                    opacity: 0.5,
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
        if (!el || el?.firstChild) {
            return;
        }

        const { state, isConnected } = this.props;
        const { units, objects, currentTheme, liteMode } = state;
        const width = this.getVisibleWidth();
        const height = this.getVisibleHeight();
        const isLaser = isLaserMode();

        // WebGLRenderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.setClearColor(
            new THREE.Color(currentTheme.get(BACKGROUND_PART)),
            1,
        );
        this.renderer.setSize(width, height);
        this.renderer.clear();

        // To actually be able to display anything with Three.js, we need three things:
        // A scene, a camera, and a renderer so we can render the scene with the camera.
        this.scene = new THREE.Scene();

        this.camera = this.createCombinedCamera(width, height);

        //Set default camera position to 3D
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(
            -CAMERA_DISTANCE,
            -CAMERA_DISTANCE,
            CAMERA_DISTANCE,
        );

        this.controls = this.createTrackballControls(
            this.camera,
            this.renderer.domElement,
        );

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

        {
            // Directional Light
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

        {
            // Ambient Light
            const light = new THREE.AmbientLight(colornames('gray 25')); // soft white light
            this.scene.add(light);
        }

        {
            // Imperial Coordinate System
            const visible = objects.coordinateSystem.visible;
            const imperialCoordinateSystem =
                this.createCoordinateSystem(IMPERIAL_UNITS);
            imperialCoordinateSystem.name = 'ImperialCoordinateSystem';
            imperialCoordinateSystem.visible =
                visible && units === IMPERIAL_UNITS;
            this.group.add(imperialCoordinateSystem);
        }

        {
            // Metric Coordinate System
            const visible = objects.coordinateSystem.visible;
            const metricCoordinateSystem =
                this.createCoordinateSystem(METRIC_UNITS);
            metricCoordinateSystem.name = 'MetricCoordinateSystem';
            metricCoordinateSystem.visible = visible && units === METRIC_UNITS;
            this.group.add(metricCoordinateSystem);
        }

        {
            // Imperial Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const imperialGridLineNumbers =
                this.createGridLineNumbers(IMPERIAL_UNITS);
            imperialGridLineNumbers.name = 'ImperialGridLineNumbers';
            imperialGridLineNumbers.visible =
                visible && units === IMPERIAL_UNITS;
            this.group.add(imperialGridLineNumbers);
        }

        {
            // Metric Grid Line Numbers
            const visible = objects.gridLineNumbers.visible;
            const metricGridLineNumbers =
                this.createGridLineNumbers(METRIC_UNITS);
            metricGridLineNumbers.name = 'MetricGridLineNumbers';
            metricGridLineNumbers.visible = visible && units === METRIC_UNITS;
            this.group.add(metricGridLineNumbers);
        }

        {
            // Cutting Tool
            Promise.all([
                loadSTL('assets/models/stl/bit.stl').then(
                    (geometry) => geometry,
                ),
                loadTexture('assets/textures/brushed-steel-texture.jpg').then(
                    (texture) => texture,
                ),
            ]).then((result) => {
                const [geometry, texture] = result;

                // Rotate the geometry 90 degrees about the X axis.
                geometry.rotateX(-Math.PI / 2);

                // Scale the geometry data.
                geometry.scale(0.5, 0.5, 0.5);

                // Compute the bounding box.
                geometry.computeBoundingBox();

                // Set the desired position from the origin rather than its center.
                const height =
                    geometry.boundingBox.max.z - geometry.boundingBox.min.z;
                geometry.translate(0, 0, height / 2);

                let material = new THREE.MeshLambertMaterial({
                    map: texture,
                    opacity: 0.6,
                    transparent: false,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.4,
                    color: '#caf0f8',
                });

                if (geometry.hasColors) {
                    material.vertexColors = true;
                }

                const mesh = new THREE.Mesh(geometry, material);
                const object = new THREE.Object3D();
                object.add(mesh);

                this.cuttingTool = object;
                this.cuttingTool.name = 'CuttingTool';
                this.cuttingTool.visible =
                    isConnected &&
                    !isLaser &&
                    (liteMode
                        ? state.objects.cuttingTool.visibleLite
                        : state.objects.cuttingTool.visible);

                this.group.add(this.cuttingTool);
                // Update the scene
                this.updateScene();
            });
        }

        {
            // Laser Tool
            this.setupScene();

            // add tool
            this.laserPointer = new LaserPointer({
                color: currentTheme.get(CUTTING_PART),
                diameter: 4,
            });
            this.laserPointer.name = 'LaserPointer';
            this.laserPointer.visible =
                isConnected &&
                isLaser &&
                (liteMode
                    ? state.objects.cuttingTool.visibleLite
                    : state.objects.cuttingTool.visible);

            this.group.add(this.laserPointer);

            // Update the scene
            this.updateScene();
        }

        {
            // Cutting Pointer
            this.createCuttingPointer();
        }

        {
            // Limits
            const limits = _get(this.machineProfile, 'limits');
            const {
                xmin = 0,
                xmax = 0,
                ymin = 0,
                ymax = 0,
                zmin = 0,
                zmax = 0,
            } = { ...limits };
            this.limits = this.createLimits(xmin, xmax, ymin, ymax, zmin, zmax);
            this.limits.name = 'Limits';
            this.limits.visible = objects.limits.visible;
            this.updateLimitsPosition();
        }

        this.scene.add(this.group);

        setTimeout(() => {
            el.appendChild(this.renderer.domElement);
        }, 0);
    }

    // from https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom_selective.html,
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_fxaa.html
    setupScene() {
        const renderScene = new RenderPass(this.scene, this.camera);
        const pixelRatio = this.renderer.getPixelRatio();
        const width = this.getVisibleWidth();
        const height = this.getVisibleHeight();

        // fxaa
        const fxaaPass = new ShaderPass(FXAAShader);
        const copyPass = new ShaderPass(CopyShader);
        this.copyComposer = new EffectComposer(this.renderer);
        this.copyComposer.addPass(renderScene);
        this.copyComposer.addPass(copyPass);

        fxaaPass.material.uniforms.resolution.value.x =
            1 / (width * pixelRatio);
        fxaaPass.material.uniforms.resolution.value.y =
            1 / (height * pixelRatio);

        this.fxaaComposer = new EffectComposer(this.renderer);
        this.fxaaComposer.addPass(renderScene);
        this.fxaaComposer.addPass(fxaaPass);

        // bloom
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1,
            0.1,
            0,
        );
        this.bloomComposer = new EffectComposer(this.renderer);
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass(renderScene);
        this.bloomComposer.addPass(bloomPass);

        const finalPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: {
                        value: this.bloomComposer.renderTarget2.texture,
                    },
                },
                vertexShader: `varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    }`,
                fragmentShader: `uniform sampler2D baseTexture;
                    uniform sampler2D bloomTexture;
                    varying vec2 vUv;
                    void main() {
                        gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
                    }`,
                defines: {},
            }),
            'baseTexture',
        );
        finalPass.needsSwap = true;

        this.finalComposer = new EffectComposer(this.renderer);
        this.finalComposer.addPass(renderScene);
        this.finalComposer.addPass(finalPass);
    }

    // from https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom_selective.html
    renderBloom() {
        const { state } = this.props;
        const { currentTheme } = state;
        let materials = {};
        const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
        const bloomLayer = new THREE.Layers();
        bloomLayer.set(1);

        this.renderer.setClearColor(0x000000);
        this.scene.traverse(darkenNonBloomed);
        this.bloomComposer.render();
        this.scene.traverse(restoreMaterial);
        this.renderer.setClearColor(
            new THREE.Color(currentTheme.get(BACKGROUND_PART)),
            1,
        );

        function darkenNonBloomed(obj) {
            if (bloomLayer.test(obj.layers) === false) {
                materials[obj.uuid] = obj.material;
                obj.material = darkMaterial;
            }
        }

        function restoreMaterial(obj) {
            if (materials[obj.uuid]) {
                obj.material = materials[obj.uuid];
                delete materials[obj.uuid];
            }
        }
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
            orthoFar,
        );

        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = CAMERA_DISTANCE;

        return camera;
    }

    createPerspectiveCamera(width, height) {
        const fov = PERSPECTIVE_FOV;
        const aspect =
            width > 0 && height > 0 ? Number(width) / Number(height) : 1;
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
        const camera = new THREE.OrthographicCamera(
            left,
            right,
            top,
            bottom,
            near,
            far,
        );

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
            this.props.actions.camera.toFreeView();
            this.updateScene();
        });

        controls.addEventListener('change', () => {
            this.updateScene();
        });

        return controls;
    }

    getRadiansFromDegrees(val) {
        return (val * Math.PI) / 180;
    }

    // Rotates the cutting tool around the z axis with a given rpm and an optional fps
    // @param {number} rpm The rounds per minutes
    // @param {number} [fps] The frame rate (Defaults to 60 frames per second)
    rotateCuttingTool(rpm = 0, fps = 60) {
        if (!this.cuttingTool) {
            return;
        }

        const delta = 1 / fps;
        const degrees = 360 * ((delta * Math.PI) / 180); // Rotates 360 degrees per second
        this.cuttingTool.rotateZ(-((rpm / 60) * degrees)); // rotate in clockwise direction
    }

    // Update cutting tool position
    updateCuttingToolPosition(position, { forceUpdateAllAxes = false } = {}) {
        if (!this.cuttingTool) {
            return;
        }

        const workspaceMode = store.get(
            'workspace.mode',
            WORKSPACE_MODE.DEFAULT,
        );
        let duration = 0.24;

        const pivotPoint = this.pivotPoint.get();
        const {
            x: wpox = 0,
            y: wpoy = 0,
            z: wpoz = 0,
        } = position ?? this.workPosition;

        const x0 = wpox - pivotPoint.x;
        const y0 = wpoy - pivotPoint.y;
        const z0 = wpoz - pivotPoint.z;

        if (x0 === 0 && y0 === 0 && z0 === 0) {
            duration = 0.15;
        }

        // The force parameter will skip here and update the positioning of all axes
        if (!forceUpdateAllAxes && workspaceMode === WORKSPACE_MODE.ROTARY) {
            const yFixed = 0 - pivotPoint.y;
            gsap.to(this.cuttingTool.position, {
                x: x0,
                z: z0,
                y: yFixed,
                duration: duration,
            });

            return;
        }

        gsap.to(this.cuttingTool.position, {
            x: x0,
            y: y0,
            z: z0,
            duration: duration,
            onComplete: () => this.updateScene({ forceUpdate: true }),
        });
    }

    rotateGcodeModal(degrees) {
        const radians = degToRad(degrees);

        if (!this.visualizer) {
            return;
        }

        this.visualizer.group.rotateX(radians);
    }

    updateGcodeModal(prevPos, currPos) {
        const workspaceMode = store.get(
            'workspace.mode',
            WORKSPACE_MODE.DEFAULT,
        );
        const { controllerType, fileType } = this.props;

        const isUsingGRBL = controllerType === GRBL;
        const isUsingGRBLHal = controllerType === GRBLHAL;
        const isRotaryFile = [FILE_TYPE.ROTARY, FILE_TYPE.FOUR_AXIS].includes(
            fileType,
        );
        const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;

        // Use y-axis in grbl, a-axis in grblHal
        const axis = isInRotaryMode && isRotaryFile ? 'y' : 'a';

        const prevValue = prevPos[axis];
        const currValue = currPos[axis];

        const valueHasChanged = prevValue === currValue;

        if (!isRotaryFile) {
            return;
        }

        const grblCondition = isUsingGRBL && valueHasChanged && isInRotaryMode;
        const grblHalCondition =
            (isUsingGRBLHal && valueHasChanged) ||
            (isUsingGRBLHal && isInRotaryMode);

        /**
         * GRBL Condition
         *  - Controller is GRBL
         *  - Y-axis value has changed since previous value
         *  - Workspace is in rotary mode
         *
         * GRBLHal Condition
         *  - Controller is GRBLHal
         *  - A-axis value has changed since previous value
         */
        if (grblCondition || grblHalCondition) {
            const axisDifference = currValue - prevValue;
            this.rotateGcodeModal(axisDifference);
        }
    }

    // Update cutting tool position
    updateLaserPointerPosition() {
        if (!this.laserPointer) {
            return;
        }

        const pivotPoint = this.pivotPoint.get();
        const { x: wpox, y: wpoy, z: wpoz } = this.workPosition;
        const x0 = wpox - pivotPoint.x;
        const y0 = wpoy - pivotPoint.y;
        const z0 = wpoz - pivotPoint.z;

        gsap.to(this.laserPointer.position, {
            x: x0,
            y: y0,
            z: z0,
            duration: 0.24,
        });
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

        gsap.to(this.cuttingPointer.position, {
            x: x0,
            y: y0,
            z: z0,
            duration: 0.25,
        });
    }

    // Update limits position
    updateLimitsPosition() {
        if (!this.limits) {
            return;
        }

        const limits = _get(this.machineProfile, 'limits');
        const {
            xmin = 0,
            xmax = 0,
            ymin = 0,
            ymax = 0,
            zmin = 0,
            zmax = 0,
        } = { ...limits };
        const pivotPoint = this.pivotPoint.get();
        const { x: mpox, y: mpoy, z: mpoz } = this.machinePosition;
        const { x: wpox, y: wpoy, z: wpoz } = this.workPosition;
        const x0 = (xmin + xmax) / 2 - (mpox - wpox) - pivotPoint.x;
        const y0 = (ymin + ymax) / 2 - (mpoy - wpoy) - pivotPoint.y;
        const z0 = (zmin + zmax) / 2 - (mpoz - wpoz) - pivotPoint.z;

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

    handleSceneRender(vizualization, colorArray, savedColors, callback) {
        const { controllerType, fileType, workPosition } = this.props;
        const workspaceMode = store.get(
            'workspace.mode',
            WORKSPACE_MODE.DEFAULT,
        );

        const shouldZoom = this.props.isSecondary ? !this.didZoom : true;

        if (!this.visualizer) {
            return;
        }

        const obj = this.visualizer.render(
            vizualization,
            colorArray,
            savedColors,
        );
        obj.name = '';
        this.group.add(obj);

        const bbox = getBoundingBox(obj);
        const dX = bbox.max.x - bbox.min.x;
        const dY = bbox.max.y - bbox.min.y;
        const dZ = bbox.max.z - bbox.min.z;
        const center = new THREE.Vector3(
            bbox.min.x + dX / 2,
            bbox.min.y + dY / 2,
            bbox.min.z + dZ / 2,
        );

        // Set the pivot point to the center of the loaded object
        this.pivotPoint.set(center.x, center.y, center.z);

        // Update position
        this.updateCuttingToolPosition(null, { forceUpdateAllAxes: true });
        this.updateLaserPointerPosition();
        this.updateCuttingPointerPosition();
        this.updateLimitsPosition();

        const isUsingGRBL = controllerType === GRBL;
        const isRotaryFile = [FILE_TYPE.ROTARY, FILE_TYPE.FOUR_AXIS].includes(
            fileType,
        );
        const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;
        const axis = isInRotaryMode && isUsingGRBL && isRotaryFile ? 'y' : 'a';

        // Rotate g-code model if to current a-axis position
        if (isRotaryFile) {
            const rotationVal = workPosition[axis];

            this.rotateGcodeModal(rotationVal);
        }

        if (this.viewport && dX > 0 && dY > 0 && shouldZoom) {
            // The minimum viewport is 50x50mm
            const width = Math.max(dX + 50, 100);
            const height = Math.max(dY + 50, 100);
            const target = new THREE.Vector3(0, 0, bbox.max.z);
            this.viewport.set(width, height, target);
        }

        // Update the scene
        this.updateScene({ forceUpdate: true });

        // only set the camera if it's the first render
        if (shouldZoom) {
            // if secondary, force top view
            if (this.props.isSecondary) {
                this.toTopView();
            } else {
                // if primary, force 3d view
                this.props.actions.camera.to3DView();
            }
            this.didZoom = true;
        }

        reduxStore.dispatch(
            updateFileRenderState({ renderState: RENDER_RENDERED }),
        );

        typeof callback === 'function' && callback({ bbox: bbox });
    }

    getToolpathHull() {
        return this.visualizer.getHull();
    }

    load(name, vizualization, callback) {
        // Remove previous G-code object
        this.unload();
        const { currentTheme, disabled, disabledLite, liteMode } =
            this.props.state;
        const { setVisualizerReady } = this.props.actions;
        this.visualizer = new GCodeVisualizer(currentTheme);

        const shouldRenderVisualization = liteMode ? !disabledLite : !disabled;

        if (shouldRenderVisualization) {
            this.vizualization = vizualization;
            this.renderCallback = callback;

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
                theme: currentTheme,
            });

            // this.handleSceneRender(vizualization, callback);
        } else {
            setVisualizerReady();
        }

        this.fileLoaded = true;
    }

    calculateLimits(data) {
        const {
            workPosition,
            machinePosition,
            softXMax,
            softYMax,
            softZMax,
            homingFlag,
            machineCorner,
        } = this.props;
        /* machineCorner:
            0 is top right
            1 is top left
            2 bottom right
            3 bottom left
        */
        let xMultiplier = 1;
        let yMultiplier = 1;
        if (homingFlag) {
            switch (machineCorner) {
                case 0:
                    xMultiplier = -1;
                    yMultiplier = -1;
                    break;
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
            z: parseFloat(mpos.z) - parseFloat(wpos.z) * -1,
        };
        let limitsMax = {
            x: softXMax * xMultiplier - origin.x,
            y: softYMax * yMultiplier - origin.y,
            z: softZMax - origin.z,
        };

        // let limitsMin = {
        //     x: origin.x === 0 ? origin.x : origin.x * -1,
        //     y: origin.y === 0 ? origin.y : origin.y * -1,
        //     z: origin.z,
        // };

        // get bbox
        let bbox = reduxStore.getState().file.bbox;
        // let bboxMin = bbox.min;
        let bboxMax = bbox.max;

        // check if machine will leave soft limits
        if (
            bboxMax.x > limitsMax.x ||
            bboxMax.y > limitsMax.y ||
            bboxMax.z > limitsMax.z
        ) {
            pubsub.publish('softlimits:warning');
        } else {
            pubsub.publish('softlimits:ok');
        }
    }

    unload() {
        this.fileLoaded = false;
        const visualizerObject = this.group.getObjectByName('Visualizer');
        const shouldZoom = this.props.isSecondary ? !this.didZoom : true;

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

        if (this.controls && shouldZoom) {
            this.controls.reset();
        }

        if (this.viewport && shouldZoom) {
            this.viewport.reset();
        }
        // Update the scene
        this.updateScene();
    }

    setCameraMode(mode) {
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        // A number representing a given button:
        // 0: main button pressed, usually the left button or the un-initialized state
        const MAIN_BUTTON = 0,
            ROTATE = 0;
        const SECOND_BUTTON = 2,
            PAN = 2;

        if (mode === CAMERA_MODE_ROTATE) {
            this.controls &&
                this.controls.setMouseButtonState(MAIN_BUTTON, ROTATE);
        }
        if (mode === CAMERA_MODE_PAN) {
            this.controls &&
                this.controls.setMouseButtonState(SECOND_BUTTON, PAN);
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
        this.camera.position.set(
            -CAMERA_DISTANCE,
            -CAMERA_DISTANCE,
            CAMERA_DISTANCE,
        );

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
        this.camera.position.set(-CAMERA_DISTANCE, 0, 0);

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
        this.camera.position.set(CAMERA_DISTANCE, 0, 0);

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
                className="overflow-hidden h-full w-full rounded-lg"
                ref={this.setRef}
            />
        );
    }
}

Visualizer.defaultProps = {
    isSecondary: false,
};

export default connect(
    (store) => {
        const machinePosition = _get(store, 'controller.mpos');
        const workPosition = _get(store, 'controller.wpos');
        const receivedLines = _get(
            store,
            'controller.sender.status.received',
            0,
        );
        // soft limits
        const softXMax = _get(store, 'controller.settings.settings.$130');
        const softYMax = _get(store, 'controller.settings.settings.$131');
        const softZMax = _get(store, 'controller.settings.settings.$132');
        const homingFlag = _get(store, 'controller.homingFlag');
        const machineCorner = _get(store, 'controller.settings.settings.$23');
        const { activeVisualizer } = store.visualizer;
        const isConnected = _get(store, 'connection.isConnected');
        const bbox = _get(store, 'file.bbox');
        const fileModal = _get(store, 'file.fileModal');
        const fileType = _get(store, 'file.fileType');
        const controllerType = _get(store, 'controller.type');
        const senderStatus = _get(store, 'controller.sender.status');

        return {
            machinePosition,
            workPosition,
            receivedLines,
            softXMax,
            softYMax,
            softZMax,
            homingFlag,
            machineCorner,
            activeVisualizer,
            isConnected,
            bbox,
            fileModal,
            fileType,
            controllerType,
            senderStatus,
        };
    },
    null,
    null,
    { forwardRef: true },
)(Visualizer);
