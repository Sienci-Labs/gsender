import { BasicPosition, UNITS_GCODE } from 'app/definitions/general';

// Types

// Motion Mode
export type MOTION = 'G0' | 'G1' | 'G2' | 'G3' | 'G80';
// Coordinate System Select
export type WCS = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';
// Plane Select
// G17: XY-plane, G18: ZX-plane, G19: YZ-plane
export type PLANE = 'G17' | 'G18' | 'G19';
// Distance Mode
// G90: Absolute, G91: Relative
export type DISTANCE = 'G90' | 'G91';
// Arc IJK distance mode
export type ARC = `G${string}`;
// Feed Rate Mode
// G93: Inverse time mode, G94: Units per minute mode, G95: Units per rev mode
export type FEEDRATE = 'G93' | 'G94' | 'G95';
// Cutter Radius Compensation
export type CUTTER = `G${string}`;
// Tool Length Offset
export type TLO = 'G43.1' | 'G49';
// Program Mode
export type PROGRAM = 'M0' | 'M1' | 'M2' | 'M30';
// Spingle State
export type SPINDLE = 'M3' | 'M4' | 'M5';
// Coolant State
export type COOLANT = 'M7' | 'M8' | 'M7' | 'M8' | 'M9';
// Tool Select
export type TOOL = number;

// Interfaces

export interface LineData {
    v0?: BasicPosition;
    v1: BasicPosition;
    v2: BasicPosition;
    shouldUseAddCurve: boolean;
}

export interface PDData {
    Scode: string;
    lineData: LineData;
}

export interface FeedrateChanges {
    change: number;
    count: number;
}

export interface Modal {
    motion?: MOTION;
    wcs?: WCS;
    plane?: PLANE;
    units?: UNITS_GCODE;
    distance?: DISTANCE;
    arc?: ARC;
    feedrate?: FEEDRATE;
    cutter?: CUTTER;
    tlo?: TLO;
    program?: PROGRAM;
    spindle?: SPINDLE;
    coolant?: COOLANT;
    tool?: TOOL;
}

export interface ModalChanges {
    change: Modal;
    count: number;
}
