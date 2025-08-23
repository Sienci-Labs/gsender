import { SPINDLE } from 'app/lib/definitions/gcode_virtualization';

export interface Jointer {
    bitDiameter: number;
    feedrate: number;
    length: number;
    orientation: 'X' | 'Y';
    depthOfCut: number;
    thickness: number;
    stepover: number;
    leadInOut: number;
    spindleRPM: number;
    spindle: SPINDLE;
    shouldDwell: boolean;
    mist?: boolean;
    flood?: boolean;
}