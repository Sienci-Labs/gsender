import { CAMERA_MODES_T, THEMES_T } from "app/definitions/types";

export interface Visualizer {
    minimized: boolean;
    liteMode: boolean;
    disabled: boolean;
    disabledLite: boolean;
    minimizeRenders: boolean;
    projection: string;
    cameraMode: CAMERA_MODES_T;
    theme: THEMES_T;
    SVGEnabled: boolean;
    jobEndModal: boolean;
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
}