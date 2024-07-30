import {
    ARC,
    COOLANT,
    CUTTER,
    DISTANCE,
    FEEDRATE,
    MOTION,
    PLANE,
    PROGRAM,
    SPINDLE,
    TLO,
    TOOL,
    UNITS_GCODE,
    WCS
} from "../types"
import { BasicPosition } from "./general"

export interface LineData {
    v0?: BasicPosition,
    v1: BasicPosition,
    v2: BasicPosition,
    shouldUseAddCurve: boolean
};

export interface PDData {
    Scode: string,
    lineData: LineData
};

export interface FeedrateChanges {
    change: number,
    count: number
};

export interface Modal {
    motion?: MOTION,
    wcs?: WCS,
    plane?: PLANE,
    units?: UNITS_GCODE,
    distance?: DISTANCE,
    arc?: ARC,
    feedrate?: FEEDRATE,
    cutter?: CUTTER,
    tlo?: TLO,
    program?: PROGRAM,
    spindle?: SPINDLE,
    coolant?: COOLANT,
    tool?: TOOL
}

export interface ModalChanges {
    change: Modal,
    count: number
};
