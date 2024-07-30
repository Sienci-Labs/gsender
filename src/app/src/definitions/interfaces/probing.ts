import {
    FIRMWARE_TYPES_T,
    PROBE_DIRECTIONS,
    PROBE_TYPES_T,
    TOUCHPLATE_TYPES_T,
    UNITS_EN
} from "../types";
import { BasicPosition } from "./general";

export interface ProbingOptions {
    modal: string,
    units: UNITS_EN,
    toolDiameter: PROBE_TYPES_T | number,
    xRetractModifier: number,
    yRetractModifier: number,
    xRetract: number,
    yRetract: number,
    zRetract: number,
    retract: number,
    axes: BasicPosition,
    xProbeDistance: number,
    yProbeDistance: number,
    zProbeDistance: number,
    probeDistances: BasicPosition,
    probeFast: number,
    probeSlow: number,
    zThickness: number,
    xThickness: number,
    yThickness: number,
    xyThickness: number,
    firmware: FIRMWARE_TYPES_T,
    xyPositionAdjust: number,
    zPositionAdjust: number,
    direction: PROBE_DIRECTIONS,
    $13: '0' | '1',
    plateType: TOUCHPLATE_TYPES_T,
};

export interface ProbeWidgetSettings {
    slowSpeed: number,
    fastSpeed: number,
    retract: number,
    zProbeDistance: number,
    zProbeThickness: number,
};