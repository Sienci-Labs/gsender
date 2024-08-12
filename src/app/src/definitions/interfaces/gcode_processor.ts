import {
    AXES_T,
    BasicType,
    UNITS_EN
} from "../types"

export interface GcodeProcessorController {
    mpos: Array<number>,
    getPos: Function,
    pos: Array<number>,
    activeCoordSys: number,
    coordSysOffsets: Array<number>
    offset: Array<number>,
    offsetEnabled: boolean,
    storedPositions: Array<number>,
    units: UNITS_EN,
    feed: number,
    incremental: boolean,
    coolant: number,
    spindle: boolean,
    line: number,
    spindleDirection: number,
    spindleSpeed: number,
    inverseFeed: boolean,
    motionMode: `G${string}`,
    arcPlane: number,
    tool: string,
    axisLabels: Array<number>
};

export interface GcodeProcessorOptions {
    maxFeed: number,
    acceleration: number,
    noInit: boolean,
    controller: GcodeProcessorController,
    tightcnc: {
        controller: GcodeProcessorController,
    },
    axisLabels: Array<string>,
    minMoveTime: number,
};

export interface GCodeLine {
    line: string,
    words: Array<Array<string>>
};

export interface SeenWordSet {
    [key: string]: boolean
};

export interface VMStateInfo {
    state: VMState, // VM state after executing line
    isMotion: boolean, // whether the line represents motion
    motionCode: BasicType, // If motion, the G code associated with the motion
    changedCoordOffsets: boolean, // whether or not anything was changed with coordinate systems
    time: number // estimated duration of instruction execution, in seconds
};

export interface VMState {
    feedrates: Set<string>,
    tools: Set<string>,
    spindleRates: Set<string>,
    invalidGcode: Set<string>,

    coord: Function,
    totalTime: number; // seconds
    bounds: [Array<number>, Array<number>], // min and max points
    mbounds: [Array<number>, Array<number>], // bounds for machine coordinates
    lineCounter: number,
    hasMovedToAxes: Array<boolean>, // true for each axis that we've moved on, and have a definite position for
    seenWordSet: SeenWordSet, // a mapping from word letters to boolean true if that word has been seen at least once
    usedAxes: Set<AXES_T>,
    tool: string,
    countT: number;
    countM6: number;
    axisLabels: Array<AXES_T>,
    mpos: Array<number>,
    pos: Array<number>,
    activeCoordSys: number,
    coordSysOffsets: Array<Array<number>>,
    offset: Array<number>,
    offsetEnabled: boolean,
    storedPositions: [Array<number>, Array<number>],
    units: UNITS_EN,
    feed: number,
    incremental: boolean,
    coolant: number,
    spindle: boolean,
    line: number,
    spindleDirection: number,
    spindleSpeed: number,
    inverseFeed: boolean,
    motionMode: `G${string}`,
    arcPlane: number,
};

export interface SyncMachineOptions {
    include: string,
    exclude: string,
    controller: GcodeProcessorController,
    vmState: VMState,
}
