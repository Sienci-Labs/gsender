import { FIRMWARE_TYPES_T } from "definitions/firmware";
import { UNITS_EN, BasicPosition } from "definitions/general";
import { PROBE_TYPES, TOUCHPLATE_TYPES } from "lib/constants";
import { probeDirections } from "lib/Probing";


// Types

export type PROBE_DIRECTIONS =
(typeof probeDirections)[keyof typeof probeDirections];

export type PROBE_TYPES_T = (typeof PROBE_TYPES)[keyof typeof PROBE_TYPES];

export type TOUCHPLATE_TYPES_T =
(typeof TOUCHPLATE_TYPES)[keyof typeof TOUCHPLATE_TYPES];


// Interfaces

export interface ProbeProfile {
    xyThickness: number,
    zThickness: number,
    plateWidth: number,
    plateLength: number,
    functions: {
        x: boolean,
        y: boolean,
        z: boolean
    },
    touchplateType: string,
}

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

export interface Probe {
    minimized: boolean,
    probeCommand: string,
    connectivityTest: boolean,
    useTLO: boolean,
    probeDepth: number,
    probeFeedrate: number,
    probeFastFeedrate: number,
    retractionDistance: number,
    zProbeDistance: number,
    touchPlateHeight: number,
    probeType: string,
    probeAxis: string,
    direction: number,
};