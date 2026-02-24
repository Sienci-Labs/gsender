import { BasicPosition, BBox, UNITS_EN } from 'app/definitions/general';
import {
    CAMERA_MODES,
    CAMERA_POSITIONS,
    LIGHTWEIGHT_OPTIONS,
    THEMES,
    VISUALIZER_TYPES,
} from '../../constants';
import { ATCIMacroConfig } from 'app/features/ATC/assets/defaultATCIMacros.ts';
import { WORKFLOW_STATES_T } from 'app/store/definitions';
import { WORKSPACE_MODE_T } from 'app/workspace/definitions';
// Types

export type VISUALIZER_TYPES_T =
    (typeof VISUALIZER_TYPES)[keyof typeof VISUALIZER_TYPES];
export type CAMERA_MODES_T = (typeof CAMERA_MODES)[keyof typeof CAMERA_MODES];
export type CAMERA_POSITIONS_T =
    (typeof CAMERA_POSITIONS)[keyof typeof CAMERA_POSITIONS];
export type THEMES_T = (typeof THEMES)[keyof typeof THEMES];
export type LIGHTWEIGHT_OPTIONS_T =
    (typeof LIGHTWEIGHT_OPTIONS)[keyof typeof LIGHTWEIGHT_OPTIONS];

// Interfaces

export interface ATC {
    toolMap: object;
    templates: ATCIMacroConfig;
    warnOnHome: boolean;
}

export interface Visualizer {
    minimized: boolean;
    liteMode: boolean;
    liteOption: LIGHTWEIGHT_OPTIONS_T;
    disabled: boolean;
    disabledLite: boolean;
    minimizeRenders: boolean;
    projection: string;
    cameraMode: CAMERA_MODES_T;
    theme: THEMES_T;
    SVGEnabled: boolean;
    jobEndModal: boolean;
    maintenanceTaskNotifications: boolean;
    checkFile: boolean;
    gcode: {
        displayName: boolean;
    };
    objects: {
        limits: {
            visible: boolean;
        };
        coordinateSystem: {
            visible: boolean;
        };
        gridLineNumbers: {
            visible: boolean;
        };
        cuttingTool: {
            visible: boolean;
            visibleLite: boolean;
        };
        cuttingToolAnimation: {
            visible: boolean;
            visibleLite: boolean;
        };
        cutPath: {
            visible: boolean;
            visibleLite: boolean;
        };
    };
    showWarning: boolean;
    showLineWarnings: boolean;
    showSoftLimitWarning: boolean;
    hideProcessedLines: boolean;
    rotaryDiameterOffsetEnabled: boolean;
}

export interface State {
    port: string;
    units: UNITS_EN;
    theme: THEMES_T;
    showSoftLimitsWarning: boolean;
    workflow: {
        state: WORKFLOW_STATES_T;
    };
    notification: {
        type: string;
        data: string;
    };
    modal: {
        name: string;
        params: {};
    };
    machinePosition: BasicPosition;
    workPosition: BasicPosition;
    gcode: {
        displayName: boolean;
        loading: boolean;
        rendering: boolean;
        ready: boolean;
        content: string;
        bbox: BBox;
        name: string;
        size: number;
        total: number;
        sent: number;
        received: number;
        loadedBeforeConnection: boolean;
        visualization: {};
    };
    disabled: boolean;
    disabledLite: boolean;
    liteMode: boolean;
    minimizeRenders: boolean;
    projection: 'perspective' | 'orthographic';
    objects: {
        limits: {
            visible: boolean;
        };
        coordinateSystem: {
            visible: boolean;
        };
        gridLineNumbers: {
            visible: boolean;
        };
        cuttingTool: {
            visible: boolean;
            visibleLite: boolean;
        };
        cuttingToolAnimation: {
            visible: boolean;
            visibleLite: boolean;
        };
        cutPath: {
            visible: boolean;
            visibleLite: boolean;
        };
    };
    cameraMode: CAMERA_MODES_T;
    cameraPosition: CAMERA_POSITIONS_T; // 'Top', '3D', 'Front', 'Left', 'Right'
    isAgitated: boolean; // Defaults to false
    currentTheme: THEMES_T;
    currentTab: number;
    filename: string;
    fileSize: number; //in bytes
    total: number;
    invalidGcode: {
        shouldShow: boolean;
        showModal: boolean;
        list: Set<any>;
    };
    invalidLine: {
        shouldShow: boolean;
        show: boolean;
        line: string;
    };
    layoutIsReversed: boolean;
    workspaceMode: WORKSPACE_MODE_T;
    jobEndModal: boolean;
}

export interface Actions {
    dismissNotification: () => void;
    openModal: (name?: string, params?: {}) => void;
    closeModal: () => void;
    updateModalParams: (params?: {}) => void;
    loadFile: (file: any) => void;
    uploadFile: (gcode: any, meta: any) => void;
    loadGCode: (name: any, vizualization: any, size: any) => void;
    unloadGCode: () => void;
    onRunClick: () => void;
    handleRun: () => void;
    handlePause: () => void;
    handleStop: () => void;
    handleClose: () => void;
    setBoundingBox: (bbox: any) => void;
    toggle3DView: () => void;
    toPerspectiveProjection: (projection: any) => void;
    toOrthographicProjection: (projection: any) => void;
    toggleGCodeFilename: () => void;
    toggleLimitsVisibility: () => void;
    toggleCoordinateSystemVisibility: () => void;
    toggleGridLineNumbersVisibility: () => void;
    toggleCuttingToolVisibility: () => void;
    camera: {
        toRotateMode: () => void;
        toPanMode: () => void;
        zoomFit: () => void;
        zoomIn: () => void;
        zoomOut: () => void;
        panUp: () => void;
        panDown: () => void;
        panLeft: () => void;
        panRight: () => void;
        lookAtCenter: () => void;
        toTopView: () => void;
        to3DView: () => void;
        toFrontView: () => void;
        toLeftSideView: () => void;
        toRightSideView: () => void;
        toFreeView: () => void;
    };
    handleLiteModeToggle: () => void;
    lineWarning: {
        onContinue: () => void;
        onIgnoreWarning: () => void;
        onCancel: () => void;
    };
    setVisualizerReady: () => void;
    reset: () => void;
    getHull: () => any;
}
