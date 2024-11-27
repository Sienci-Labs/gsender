import { SPINDLE } from 'app/lib/definitions/gcode_virtualization';

export interface Surfacing {
    bitDiameter: number;
    stepover: number;
    feedrate: number;
    length: number;
    width: number;
    skimDepth: number;
    maxDepth: number;
    spindleRPM: number;
    type: string;
    startPosition: string;
    spindle: SPINDLE;
    cutDirectionFlipped: boolean;
    shouldDwell: boolean;
}
