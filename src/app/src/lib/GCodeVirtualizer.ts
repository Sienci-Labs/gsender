import type { BasicPosition, BBox } from 'app/definitions/general';
import { EventEmitter } from 'events';
import { FILE_TYPE } from '../constants';
import {
    createFastLineScanScratch,
    type FastLineScanScratch,
    scanLineFast,
} from './GCodeParser';
import {
    MOTION_FEED,
    MOTION_RAPID,
    type MotionPlanner,
} from './timeEstimator/MotionPlanner';

interface Modal {
    motion: string;
    wcs: string;
    plane: string;
    units: string;
    distance: string;
    arc: string;
    feedrate: string;
    cutter: string;
    tlo: string;
    program: string;
    spindle: string;
    coolant: string;
    tool: number;
}

interface RotationResult {
    x: number;
    y: number;
    z: number;
    a: number;
}

type SpindleToolEventCode = 'S' | 'T' | 'M' | 'TC';

interface SpindleToolEvent {
    S?: number;
    T?: number;
    M?: number;
    TC?: boolean;
    comment?: string;
}

interface VMState {
    tools: Set<string>;
    spindle: Set<string>;
    feedrates: Set<string>;
    bbox: BBox;
    usedAxes: Set<string>;
    invalidLines: string[];
    toolchange: number[];
    spindleToolEvents: { [key: number]: SpindleToolEvent };
}

interface VMProfileStats {
    linesSeen: number;
    tokensSeen: number;
    groupsSeen: number;
    handlerInvocations: number;
    emitDataCount: number;
    invalidLineCount: number;
}

type Data = Array<{
    Scode: any;
    lineData: any;
}>;

type ModalChanges = Array<{
    change: Partial<Modal>;
    count: number;
}>;

type FeedrateChanges = Array<{
    change: string;
    count: number;
}>;

const translatePosition = (
    position: number,
    newPosition: number,
    relative: boolean,
): number => {
    relative = !!relative;
    newPosition = Number(newPosition);
    if (Number.isNaN(newPosition)) {
        return position;
    }
    return relative ? position + newPosition : newPosition;
};

export const toRadians = (degrees: number): number => {
    return (degrees * Math.PI) / 180;
};

// We just need to check the difference between the a axis values,
// this should work fine since they are both 0 initially
export const shouldRotate = (
    start: BasicPosition,
    end: BasicPosition,
): boolean => {
    return start.a !== end.a;
};

export const rotateAxis = (
    axis: 'x' | 'y' | 'z',
    { x, y, z, a }: { x: number; y: number; z: number; a: number },
): RotationResult | null => {
    if (!axis) {
        throw new Error('Axis is required');
    }

    // Invert the A-axis angle to match the expected rotation direction convention
    // This fixes the issue where G-code uses negative A values for clockwise rotation
    // but the visualization expects the opposite convention
    const angle = toRadians(-a);
    // const angle = toRadians(a);

    // Calculate the sine and cosine of the angle
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Rotate the vertex around the x-axis
    if (axis === 'x') {
        const rotatedY = y * cosA - z * sinA;
        const rotatedZ = y * sinA + z * cosA;
        return { x: x, y: rotatedY, z: rotatedZ, a };
    }

    // Rotate the vertex around the y-axis
    if (axis === 'y') {
        const rotatedZ = z * cosA - x * sinA;
        const rotatedX = z * sinA + x * cosA;
        return { x: rotatedX, y: y, z: rotatedZ, a };
    }

    // Rotate the vertex around the z-axis
    if (axis === 'z') {
        const rotatedX = x * cosA - y * sinA;
        const rotatedY = x * sinA + y * cosA;
        return { x: rotatedX, y: rotatedY, z: z, a };
    }

    return null;
};

// from in to mm
const in2mm = (val: number = 0): number => val * 25.4;

// noop
const noop = (): void => {};

const hasNonWhitespace = (line: string): boolean => {
    for (let i = 0; i < line.length; i++) {
        const c = line.charCodeAt(i);
        if (
            c !== 32 &&
            c !== 9 &&
            c !== 13 &&
            c !== 10 &&
            c !== 11 &&
            c !== 12
        ) {
            return true;
        }
    }
    return false;
};
const MOTION_MODAL_CODES = new Set<string>([
    '0',
    '1',
    '2',
    '3',
    '38.2',
    '38.3',
    '38.4',
    '38.5',
]);
// G-codes that make grbl drain the planner buffer before executing
const PLANNER_SYNC_G_CODES = new Set<string>([
    '10',
    '28',
    '30',
    '38.2',
    '38.3',
    '38.4',
    '38.5',
]);
const AXIS_CONSUMING_G_CODES = new Set<string>(['10', '43.1', '92']);
const AXIS_ARGUMENT_LETTERS = new Set<string>([
    'X',
    'Y',
    'Z',
    'A',
    'B',
    'C',
    'I',
    'J',
    'K',
]);
const normalizeCommandCode = (code: string): string => {
    const numericCode = Number(code);
    if (Number.isFinite(numericCode)) {
        return String(numericCode);
    }
    return code;
};

class GCodeVirtualizer extends EventEmitter {
    motionMode: string = 'G0';

    totalLines: number = 0;

    feed: number = 0;

    spindleSpeed: number = 0;

    currentLine: string | null = null;

    collate: boolean = false;

    // optional time estimator; fed every move, dwell and planner sync
    estimator: MotionPlanner | null = null;

    rotaryDiameter: number = 50; // Default diameter in mm for rotary visualization

    autoDetectRotaryDiameter: boolean = true; // Automatically detect diameter from file bounds

    minBounds: [number, number, number, number] = [0, 0, 0, 0];

    maxBounds: [number, number, number, number] = [0, 0, 0, 0];

    modal: Modal = {
        // Motion Mode
        // G0, G1, G2, G3, G80
        motion: 'G0',

        // Coordinate System Select
        // G54, G55, G56, G57, G58, G59
        wcs: 'G54',

        // Plane Select
        // G17: XY-plane, G18: ZX-plane, G19: YZ-plane
        plane: 'G17',

        // Units Mode
        // G20: Inches, G21: Millimeters
        units: 'G21',

        // Distance Mode
        // G90: Absolute, G91: Relative
        distance: 'G90',

        // Arc IJK distance mode
        arc: 'G91.1',

        // Feed Rate Mode
        // G93: Inverse time mode, G94: Units per minute mode, G95: Units per rev mode
        feedrate: 'G94',

        // Cutter Radius Compensation
        cutter: 'G40',

        // Tool Length Offset
        // G43.1, G49
        tlo: 'G49',

        // Program Mode
        // M0, M1, M2, M30
        program: 'M0',

        // Spindle State
        // M3, M4, M5
        spindle: 'M5',

        // Coolant State
        // M7, M8, M9
        coolant: 'M9', // 'M7', 'M8', 'M7,M8', or 'M9'

        // Tool Select
        tool: 0,
    };

    position: BasicPosition = {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
    };

    offsets: BasicPosition = {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
    };

    vmState: VMState = {
        tools: null,
        spindle: null,
        feedrates: null,
        bbox: {
            min: {
                x: 0,
                y: 0,
                z: 0,
            },
            max: {
                x: 0,
                y: 0,
                z: 0,
            },
        },
        usedAxes: new Set(),
        invalidLines: [],
        toolchange: [],
        spindleToolEvents: {},
    };

    // data to save so we don't have to reparse
    data: Data = [
        {
            Scode: null, // spindle value for the line
            lineData: null, // modal changes, v1, v2, v0
        },
    ];

    profileStats: VMProfileStats = {
        linesSeen: 0,
        tokensSeen: 0,
        groupsSeen: 0,
        handlerInvocations: 0,
        emitDataCount: 0,
        invalidLineCount: 0,
    };

    fastScanScratch: FastLineScanScratch = createFastLineScanScratch();

    argsScratch: Record<string, any> = Object.create(null);

    argsScratchKeys: string[] = [];

    fn: {
        addLine: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => void;
        addCurve: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => void;
        addArcCurve: (
            modal: Modal,
            v1: BasicPosition,
            v2: BasicPosition,
            v0: BasicPosition,
        ) => void;
        callback: () => void;
    } = {
        addLine: noop,
        addCurve: noop,
        addArcCurve: noop,
        callback: noop,
    };

    handlers: { [key: string]: (param: any) => void } = {
        // G0: Rapid Linear Move
        G0: (params: Record<string, any>): void => {
            if (this.modal.motion !== 'G0') {
                this.setModal({ motion: 'G0' });
                // this.saveModal({ motion: 'G0' });
            }

            const v1: BasicPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                a: this.position.a,
            };
            const v2: BasicPosition = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z),
                a: this.translateA(params.A),
            };
            const targetPosition: BasicPosition = {
                x: v2.x,
                y: v2.y,
                z: v2.z,
                a: v2.a,
            };

            const isCurvedLine: boolean = shouldRotate(v1, v2);
            const ANGLE_THRESHOLD: number = 30;
            const angleDiff: number = Math.abs(v2.a - v1.a);

            if (isCurvedLine && angleDiff > ANGLE_THRESHOLD) {
                this.fn.addCurve(
                    this.modal,
                    this.offsetG92(v1),
                    this.offsetG92(v2),
                );
            } else {
                this.fn.addLine(
                    this.modal,
                    this.offsetG92(v1),
                    this.offsetG92(v2),
                );
            }

            // Update position
            this.estimateLinear(targetPosition, MOTION_RAPID);
            this.updateBounds(targetPosition);
            this.setPosition(
                targetPosition.x,
                targetPosition.y,
                targetPosition.z,
                targetPosition.a,
            );
        },
        // G1: Linear Move
        // Usage
        //   G1 Xnnn Ynnn Znnn Ennn Fnnn Snnn
        // Parameters
        //   Xnnn The position to move to on the X axis
        //   Ynnn The position to move to on the Y axis
        //   Znnn The position to move to on the Z axis
        //   Fnnn The feedrate per minute of the move between the starting point and ending point (if supplied)
        //   Snnn Flag to check if an endstop was hit (S1 to check, S0 to ignore, S2 see note, default is S0)
        // Examples
        //   G1 X12 (move to 12mm on the X axis)
        //   G1 F1500 (Set the feedrate to 1500mm/minute)
        //   G1 X90.6 Y13.8 E22.4 (Move to 90.6mm on the X axis and 13.8mm on the Y axis while extruding 22.4mm of material)
        //
        G1: (params: Record<string, any>): void => {
            if (this.modal.motion !== 'G1') {
                this.setModal({ motion: 'G1' });
                // this.saveModal({ motion: 'G1' });
            }

            const v1: BasicPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                a: this.position.a,
            };
            const v2: BasicPosition = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z),
                a: this.translateA(params.A),
            };
            const targetPosition: BasicPosition = {
                x: v2.x,
                y: v2.y,
                z: v2.z,
                a: v2.a,
            };

            const isCurvedLine: boolean = shouldRotate(v1, v2);
            const ANGLE_THRESHOLD: number = 30;
            const angleDiff: number = Math.abs(v2.a - v1.a);

            if (isCurvedLine && angleDiff > ANGLE_THRESHOLD) {
                this.fn.addCurve(
                    this.modal,
                    this.offsetG92(v1),
                    this.offsetG92(v2),
                );
            } else {
                this.fn.addLine(
                    this.modal,
                    this.offsetG92(v1),
                    this.offsetG92(v2),
                );
            }

            // Update position + increment machining time
            this.estimateLinear(targetPosition, MOTION_FEED);
            this.updateBounds(targetPosition);
            this.setPosition(
                targetPosition.x,
                targetPosition.y,
                targetPosition.z,
                targetPosition.a,
            );
        },
        // G2 & G3: Controlled Arc Move
        // Usage
        //   G2 Xnnn Ynnn Innn Jnnn Ennn Fnnn (Clockwise Arc)
        //   G3 Xnnn Ynnn Innn Jnnn Ennn Fnnn (Counter-Clockwise Arc)
        // Parameters
        //   Xnnn The position to move to on the X axis
        //   Ynnn The position to move to on the Y axis
        //   Innn The point in X space from the current X position to maintain a constant distance from
        //   Jnnn The point in Y space from the current Y position to maintain a constant distance from
        //   Fnnn The feedrate per minute of the move between the starting point and ending point (if supplied)
        // Examples
        //   G2 X90.6 Y13.8 I5 J10 E22.4 (Move in a Clockwise arc from the current point to point (X=90.6,Y=13.8),
        //   with a center point at (X=current_X+5, Y=current_Y+10), extruding 22.4mm of material between starting and stopping)
        //   G3 X90.6 Y13.8 I5 J10 E22.4 (Move in a Counter-Clockwise arc from the current point to point (X=90.6,Y=13.8),
        //   with a center point at (X=current_X+5, Y=current_Y+10), extruding 22.4mm of material between starting and stopping)
        // Referring
        //   http://linuxcnc.org/docs/2.5/html/gcode/gcode.html#sec:G2-G3-Arc
        //   https://github.com/grbl/grbl/issues/236
        G2: (params: Record<string, any>): void => {
            if (this.modal.motion !== 'G2') {
                this.setModal({ motion: 'G2' });
                // this.saveModal({ motion: 'G2' });
            }

            const v1: BasicPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
            };
            const v2: BasicPosition = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z),
                a: this.translateA(params.A),
            };
            const v0: BasicPosition = {
                // fixed point
                x: this.translateI(params.I),
                y: this.translateJ(params.J),
                z: this.translateK(params.K),
            };
            const isClockwise: boolean = true;
            const targetPosition: BasicPosition = { x: v2.x, y: v2.y, z: v2.z };

            if (this.isXYPlane()) {
                // XY-plane
                [v1.x, v1.y, v1.z] = [v1.x, v1.y, v1.z];
                [v2.x, v2.y, v2.z] = [v2.x, v2.y, v2.z];
                [v0.x, v0.y, v0.z] = [v0.x, v0.y, v0.z];
            } else if (this.isZXPlane()) {
                // ZX-plane
                [v1.x, v1.y, v1.z] = [v1.z, v1.x, v1.y];
                [v2.x, v2.y, v2.z] = [v2.z, v2.x, v2.y];
                [v0.x, v0.y, v0.z] = [v0.z, v0.x, v0.y];
            } else if (this.isYZPlane()) {
                // YZ-plane
                [v1.x, v1.y, v1.z] = [v1.y, v1.z, v1.x];
                [v2.x, v2.y, v2.z] = [v2.y, v2.z, v2.x];
                [v0.x, v0.y, v0.z] = [v0.y, v0.z, v0.x];
            } else {
                console.error('The plane mode is invalid', this.modal.plane);
                return;
            }

            if (params.R) {
                const radius: number = this.translateR(Number(params.R) || 0);
                const x: number = v2.x - v1.x;
                const y: number = v2.y - v1.y;
                const distance: number = Math.sqrt(x * x + y * y);
                let height: number =
                    Math.sqrt(4 * radius * radius - x * x - y * y) / 2;

                if (isClockwise) {
                    height = -height;
                }
                if (radius < 0) {
                    height = -height;
                }

                const offsetX: number = x / 2 - (y / distance) * height;
                const offsetY: number = y / 2 + (x / distance) * height;

                v0.x = v1.x + offsetX;
                v0.y = v1.y + offsetY;
            }

            //this.offsetAddArcCurve(v1, v2, v0);
            this.fn.addArcCurve(
                this.modal,
                this.offsetG92(v1),
                this.offsetG92(v2),
                this.offsetG92(v0),
            );

            this.estimateArc(v1, v2, v0, isClockwise);

            // Update position
            this.updateBounds(targetPosition);
            this.setPosition(
                targetPosition.x,
                targetPosition.y,
                targetPosition.z,
            );
        },
        G3: (params: Record<string, any>): void => {
            if (this.modal.motion !== 'G3') {
                this.setModal({ motion: 'G3' });
                // this.saveModal({ motion: 'G3' });
            }

            const v1: BasicPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
            };
            const v2: BasicPosition = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z),
                a: this.translateA(params.A),
            };
            const v0: BasicPosition = {
                // fixed point
                x: this.translateI(params.I),
                y: this.translateJ(params.J),
                z: this.translateK(params.K),
            };
            const isClockwise: boolean = false;
            const targetPosition: BasicPosition = { x: v2.x, y: v2.y, z: v2.z };

            if (this.isXYPlane()) {
                // XY-plane
                [v1.x, v1.y, v1.z] = [v1.x, v1.y, v1.z];
                [v2.x, v2.y, v2.z] = [v2.x, v2.y, v2.z];
                [v0.x, v0.y, v0.z] = [v0.x, v0.y, v0.z];
            } else if (this.isZXPlane()) {
                // ZX-plane
                [v1.x, v1.y, v1.z] = [v1.z, v1.x, v1.y];
                [v2.x, v2.y, v2.z] = [v2.z, v2.x, v2.y];
                [v0.x, v0.y, v0.z] = [v0.z, v0.x, v0.y];
            } else if (this.isYZPlane()) {
                // YZ-plane
                [v1.x, v1.y, v1.z] = [v1.y, v1.z, v1.x];
                [v2.x, v2.y, v2.z] = [v2.y, v2.z, v2.x];
                [v0.x, v0.y, v0.z] = [v0.y, v0.z, v0.x];
            } else {
                console.error('The plane mode is invalid', this.modal.plane);
                return;
            }

            if (params.R) {
                const radius: number = this.translateR(Number(params.R) || 0);
                const x: number = v2.x - v1.x;
                const y: number = v2.y - v1.y;
                const distance: number = Math.sqrt(x * x + y * y);
                let height: number =
                    Math.sqrt(4 * radius * radius - x * x - y * y) / 2;

                if (isClockwise) {
                    height = -height;
                }
                if (radius < 0) {
                    height = -height;
                }

                const offsetX: number = x / 2 - (y / distance) * height;
                const offsetY: number = y / 2 + (x / distance) * height;

                v0.x = v1.x + offsetX;
                v0.y = v1.y + offsetY;
            }

            this.fn.addArcCurve(
                this.modal,
                this.offsetG92(v1),
                this.offsetG92(v2),
                this.offsetG92(v0),
            );

            this.estimateArc(v1, v2, v0, isClockwise);

            // Update position
            this.updateBounds(targetPosition);
            this.setPosition(
                targetPosition.x,
                targetPosition.y,
                targetPosition.z,
            );
        },
        // G4: Dwell
        // Parameters
        //   Pnnn Time to wait, in milliseconds
        //   Snnn Time to wait, in seconds (Only on Marlin and Smoothie)
        // Example
        //   G4 P200
        G4: (params: Record<string, any>): void => {
            if (this.modal.motion !== 'G4') {
                this.setModal({ motion: 'G4' });
                // this.saveModal({ motion: 'G4' });
            }
            // grbl and grblHAL take P in seconds
            let dwellTime: number = 0;
            if (params.P !== undefined) {
                dwellTime = Number(params.P) || 0;
            } else if (params.S !== undefined) {
                dwellTime = Number(params.S) || 0;
            }
            this.estimator?.addDwell(dwellTime);
        },
        // G10: Coordinate System Data Tool and Work Offset Tables
        G10: (_params: Record<string, any>): void => {},
        // G17..19: Plane Selection
        // G17: XY (default)
        G17: (_params: Record<string, any>): void => {
            if (this.modal.plane !== 'G17') {
                this.setModal({ plane: 'G17' });
                // this.saveModal({ plane: 'G17' });
            }
        },
        // G18: XZ
        G18: (_params: Record<string, any>): void => {
            if (this.modal.plane !== 'G18') {
                this.setModal({ plane: 'G18' });
                // this.saveModal({ plane: 'G18' });
            }
        },
        // G19: YZ
        G19: (_params: Record<string, any>): void => {
            if (this.modal.plane !== 'G19') {
                this.setModal({ plane: 'G19' });
                // this.saveModal({ plane: 'G19' });
            }
        },
        // G20: Use inches for length units
        G20: (_params: Record<string, any>): void => {
            if (this.modal.units !== 'G20') {
                this.setModal({ units: 'G20' });
                // this.saveModal({ units: 'G20' });
            }
        },
        // G21: Use millimeters for length units
        G21: (_params: Record<string, any>): void => {
            if (this.modal.units !== 'G21') {
                this.setModal({ units: 'G21' });
                // this.saveModal({ units: 'G21' });
            }
        },
        // G38.x: Straight Probe
        // G38.2: Probe toward workpiece, stop on contact, signal error if failure
        'G38.2': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.2') {
                this.setModal({ motion: 'G38.2' });
                // this.saveModal({ motion: 'G38.2' });
            }
        },
        // G38.3: Probe toward workpiece, stop on contact
        'G38.3': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.3') {
                this.setModal({ motion: 'G38.3' });
                // this.saveModal({ motion: 'G38.3' });
            }
        },
        // G38.4: Probe away from workpiece, stop on loss of contact, signal error if failure
        'G38.4': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.4') {
                this.setModal({ motion: 'G38.4' });
                // this.saveModal({ motion: 'G38.4' });
            }
        },
        // G38.5: Probe away from workpiece, stop on loss of contact
        'G38.5': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.5') {
                this.setModal({ motion: 'G38.5' });
                // this.saveModal({ motion: 'G38.5' });
            }
        },
        // G43.1: Tool Length Offset
        'G43.1': (_params: Record<string, any>): void => {
            if (this.modal.tlo !== 'G43.1') {
                this.setModal({ tlo: 'G43.1' });
                // this.saveModal({ tlo: 'G43.1' });
            }
        },
        // G49: No Tool Length Offset
        G49: (): void => {
            if (this.modal.tlo !== 'G49') {
                this.setModal({ tlo: 'G49' });
                // this.saveModal({ tlo: 'G49' });
            }
        },
        // G54..59: Coordinate System Select
        G54: (): void => {
            if (this.modal.wcs !== 'G54') {
                this.setModal({ wcs: 'G54' });
                // this.saveModal({ wcs: 'G54' });
            }
        },
        G55: (): void => {
            if (this.modal.wcs !== 'G55') {
                this.setModal({ wcs: 'G55' });
                // this.saveModal({ wcs: 'G55' });
            }
        },
        G56: (): void => {
            if (this.modal.wcs !== 'G56') {
                this.setModal({ wcs: 'G56' });
                // this.saveModal({ wcs: 'G56' });
            }
        },
        G57: (): void => {
            if (this.modal.wcs !== 'G57') {
                this.setModal({ wcs: 'G57' });
                // this.saveModal({ wcs: 'G57' });
            }
        },
        G58: (): void => {
            if (this.modal.wcs !== 'G58') {
                this.setModal({ wcs: 'G58' });
                // this.saveModal({ wcs: 'G58' });
            }
        },
        G59: (): void => {
            if (this.modal.wcs !== 'G59') {
                this.setModal({ wcs: 'G59' });
                // this.saveModal({ wcs: 'G59' });
            }
        },
        // G80: Cancel Canned Cycle
        G80: (): void => {
            if (this.modal.motion !== 'G80') {
                this.setModal({ motion: 'G80' });
                // this.saveModal({ motion: 'G80' });
            }
        },
        // G90: Set to Absolute Positioning
        // Example
        //   G90
        // All coordinates from now on are absolute relative to the origin of the machine.
        G90: (): void => {
            if (this.modal.distance !== 'G90') {
                this.setModal({ distance: 'G90' });
                // this.saveModal({ distance: 'G90' });
            }
        },
        // G91: Set to Relative Positioning
        // Example
        //   G91
        // All coordinates from now on are relative to the last position.
        G91: (): void => {
            if (this.modal.distance !== 'G91') {
                this.setModal({ distance: 'G91' });
                // this.saveModal({ distance: 'G91' });
            }
        },
        // G92: Set Position
        // Parameters
        //   This command can be used without any additional parameters.
        //   Xnnn new X axis position
        //   Ynnn new Y axis position
        //   Znnn new Z axis position
        // Example
        //   G92 X10
        // Allows programming of absolute zero point, by reseting the current position to the params specified.
        // This would set the machine's X coordinate to 10. No physical motion will occur.
        // A G92 without coordinates will reset all axes to zero.
        G92: (params: Record<string, number | undefined>): void => {
            // A G92 without coordinates will reset all axes to zero.
            if (
                params.X === undefined &&
                params.Y === undefined &&
                params.Z === undefined
            ) {
                this.position.x += this.offsets.x;
                this.offsets.x = 0;
                this.position.y += this.offsets.y;
                this.offsets.y = 0;
                this.position.z += this.offsets.z;
                this.offsets.z = 0;
            } else {
                // The calls to translateX/Y/Z() below are necessary for inch/mm conversion
                // params.X/Y/Z must be interpreted as absolute positions, hence the "false"
                if (params.X !== undefined) {
                    const xmm = this.translateX(params.X, false);
                    this.offsets.x += this.position.x - xmm;
                    this.position.x = xmm;
                }
                if (params.Y !== undefined) {
                    const ymm = this.translateY(params.Y, false);
                    this.offsets.y += this.position.y - ymm;
                    this.position.y = ymm;
                }
                if (params.Z !== undefined) {
                    const zmm = this.translateZ(params.Z, false);
                    this.offsets.z += this.position.z - zmm;
                    this.position.z = zmm;
                }
            }
        },
        // G92.1: Cancel G92 offsets
        // Parameters
        //   none
        'G92.1': (): void => {
            this.position.x += this.offsets.x;
            this.offsets.x = 0;
            this.position.y += this.offsets.y;
            this.offsets.y = 0;
            this.position.z += this.offsets.z;
            this.offsets.z = 0;
        },
        // G93: Inverse Time Mode
        // In inverse time feed rate mode, an F word means the move should be completed in
        // [one divided by the F number] minutes.
        // For example, if the F number is 2.0, the move should be completed in half a minute.
        G93: (): void => {
            if (this.modal.feedrate !== 'G93') {
                this.setModal({ feedrate: 'G93' });
                // this.saveModal({ feedrate: 'G93' });
            }
        },
        // G94: Units per Minute Mode
        // In units per minute feed rate mode, an F word on the line is interpreted to mean the
        // controlled point should move at a certain number of inches per minute,
        // millimeters per minute or degrees per minute, depending upon what length units
        // are being used and which axis or axes are moving.
        G94: (): void => {
            if (this.modal.feedrate !== 'G94') {
                this.setModal({ feedrate: 'G94' });
                // this.saveModal({ feedrate: 'G94' });
            }
        },
        // G95: Units per Revolution Mode
        // In units per rev feed rate mode, an F word on the line is interpreted to mean the
        // controlled point should move at a certain number of inches per spindle revolution,
        // millimeters per spindle revolution or degrees per spindle revolution, depending upon
        // what length units are being used and which axis or axes are moving.
        G95: (): void => {
            if (this.modal.feedrate !== 'G95') {
                this.setModal({ feedrate: 'G95' });
                // this.saveModal({ feedrate: 'G95' });
            }
        },
        // M0: Program Pause
        M0: (): void => {
            this.estimator?.addSync();
            if (this.modal.program !== 'M0') {
                this.setModal({ program: 'M0' });
                // this.saveModal({ program: 'M0' });
            }
        },
        // M1: Program Pause
        M1: (): void => {
            this.estimator?.addSync();
            if (this.modal.program !== 'M1') {
                this.setModal({ program: 'M1' });
                // this.saveModal({ program: 'M1' });
            }
        },
        // M2: Program End
        M2: (): void => {
            this.estimator?.addSync();
            if (this.modal.program !== 'M2') {
                this.setModal({ program: 'M2' });
                // this.saveModal({ program: 'M2' });
            }
        },
        // M30: Program End
        M30: (): void => {
            this.estimator?.addSync();
            if (this.modal.program !== 'M30') {
                this.setModal({ program: 'M30' });
                // this.saveModal({ program: 'M30' });
            }
        },
        // Spindle Control
        // M3: Start the spindle turning clockwise at the currently programmed speed
        M3: (_params: Record<string, any>): void => {
            if (this.modal.spindle !== 'M3') {
                this.syncForSpindle(this.modal.spindle === 'M5');
                this.setModal({ spindle: 'M3' });
                // this.saveModal({ spindle: 'M3' });
            }
        },
        // M4: Start the spindle turning counterclockwise at the currently programmed speed
        M4: (_params: Record<string, any>): void => {
            if (this.modal.spindle !== 'M4') {
                this.syncForSpindle(this.modal.spindle === 'M5');
                this.setModal({ spindle: 'M4' });
                // this.saveModal({ spindle: 'M4' });
            }
        },
        // M5: Stop the spindle from turning
        M5: (): void => {
            if (this.modal.spindle !== 'M5') {
                this.syncForSpindle(false);
                this.setModal({ spindle: 'M5' });
                // this.saveModal({ spindle: 'M5' });
            }
        },
        // M6: Tool Change
        M6: (params: Record<string, any>): void => {
            this.vmState.toolchange.push(this.totalLines);
            if (params && params.T !== undefined) {
                this.setModal({ tool: params.T });
                // this.saveModal({ tool: params.T });
            }
            this.estimator?.addToolChange();
        },
        // Coolant Control
        // M7: Turn mist coolant on
        M7: (): void => {
            const coolants = this.modal.coolant.split(',');
            if (coolants.indexOf('M7') >= 0) {
                return;
            }

            this.estimator?.addSync();
            this.setModal({
                coolant: coolants.indexOf('M8') >= 0 ? 'M7,M8' : 'M7',
            });
            // this.saveModal({
            //     coolant: coolants.indexOf('M8') >= 0 ? 'M7,M8' : 'M7',
            // });
        },
        // M8: Turn flood coolant on
        M8: (): void => {
            const coolants = this.modal.coolant.split(',');
            if (coolants.indexOf('M8') >= 0) {
                return;
            }

            this.estimator?.addSync();
            this.setModal({
                coolant: coolants.indexOf('M7') >= 0 ? 'M7,M8' : 'M8',
            });
            // this.saveModal({
            //     coolant: coolants.indexOf('M7') >= 0 ? 'M7,M8' : 'M8',
            // });
        },
        // M9: Turn all coolant off
        M9: (): void => {
            if (this.modal.coolant !== 'M9') {
                this.estimator?.addSync();
                this.setModal({ coolant: 'M9' });
                // this.saveModal({ coolant: 'M9' });
            }
        },
        T: (tool: number): void => {
            if (tool !== undefined) {
                this.setModal({ tool: tool });
                // this.saveModal({ tool: tool });
                if (this.collate) {
                    this.vmState.tools.add(`T${tool}`);
                }
            }
        },
    };

    constructor(options: {
        addLine: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => void;
        addCurve: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => void;
        addArcCurve: (
            modal: Modal,
            v1: BasicPosition,
            v2: BasicPosition,
            v0: BasicPosition,
        ) => void;
        callback?: () => void;
        collate?: boolean;
        estimator?: MotionPlanner | null;
        rotaryDiameter?: number;
        autoDetectRotaryDiameter?: boolean;
    }) {
        super();
        const {
            addLine = noop,
            addArcCurve = noop,
            addCurve = noop,
            callback = noop,
            collate = false,
            estimator = null,
            rotaryDiameter,
            autoDetectRotaryDiameter = true,
        } = options;

        this.fn = { addLine, addArcCurve, addCurve, callback };
        this.collate = collate;
        this.estimator = estimator;

        if (rotaryDiameter !== undefined) {
            this.rotaryDiameter = rotaryDiameter;
            // If a specific diameter is provided, disable auto-detection
            this.autoDetectRotaryDiameter = false;
        } else {
            this.autoDetectRotaryDiameter = autoDetectRotaryDiameter;
        }

        if (this.collate) {
            this.vmState.feedrates = new Set<string>();
            this.vmState.tools = new Set<string>();
            this.vmState.spindle = new Set<string>();
            this.vmState.invalidLines = [];
        }
    }

    clearArgsScratch(): void {
        for (let i = 0; i < this.argsScratchKeys.length; i++) {
            delete this.argsScratch[this.argsScratchKeys[i]];
        }
        this.argsScratchKeys.length = 0;
    }

    setArgScratch(letter: string, value: any): void {
        if (this.argsScratch[letter] === undefined) {
            this.argsScratchKeys.push(letter);
        }
        this.argsScratch[letter] = value;
    }

    buildArgsScratch(
        letters: string[],
        values: string[],
        start: number,
        end: number,
    ): Record<string, any> {
        this.clearArgsScratch();
        for (let i = start; i < end; i++) {
            this.setArgScratch(letters[i], values[i]);
        }
        return this.argsScratch;
    }

    dispatchTokenGroup(
        letters: string[],
        values: string[],
        start: number,
        end: number,
    ): void {
        if (end <= start) {
            return;
        }

        const letter = letters[start];
        const rawCode = values[start];
        const code = normalizeCommandCode(rawCode);
        let cmd = '';
        let args: Record<string, any> | string = this.argsScratch;

        if (letter === 'G') {
            cmd = letter + code;
            if (this.estimator && PLANNER_SYNC_G_CODES.has(code)) {
                this.estimator.addSync();
            }
            args = this.buildArgsScratch(letters, values, start + 1, end);
            const hasAxisArgs = this.argsScratchKeys.some((key) =>
                AXIS_ARGUMENT_LETTERS.has(key),
            );

            if (this.argsScratch.X !== undefined) {
                this.vmState.usedAxes.add('X');
            }

            if (this.argsScratch.Y !== undefined) {
                this.vmState.usedAxes.add('Y');
            }

            if (this.argsScratch.Z !== undefined) {
                this.vmState.usedAxes.add('Z');
            }

            if (this.argsScratch.A !== undefined) {
                this.vmState.usedAxes.add('A');
            }

            if (MOTION_MODAL_CODES.has(code)) {
                this.motionMode = cmd;
            } else if (code === '80') {
                this.motionMode = '';
            }

            // Axis words on non-motion modal lines should still execute against the
            // currently active motion mode (e.g. "G00 G90 X...").
            if (
                hasAxisArgs &&
                !MOTION_MODAL_CODES.has(code) &&
                !AXIS_CONSUMING_G_CODES.has(code)
            ) {
                const modalArgs: Record<string, any> = {};
                const motionArgs: Record<string, any> = {};
                for (let i = 0; i < this.argsScratchKeys.length; i++) {
                    const key = this.argsScratchKeys[i];
                    const value = this.argsScratch[key];
                    if (AXIS_ARGUMENT_LETTERS.has(key)) {
                        motionArgs[key] = value;
                    } else {
                        modalArgs[key] = value;
                    }
                }

                if (typeof this.handlers[cmd] === 'function') {
                    const modalFunc = this.handlers[cmd];
                    this.profileStats.handlerInvocations += 1;
                    modalFunc(modalArgs);
                }

                if (
                    Object.keys(motionArgs).length > 0 &&
                    this.motionMode &&
                    typeof this.handlers[this.motionMode] === 'function'
                ) {
                    const motionFunc = this.handlers[this.motionMode];
                    this.profileStats.handlerInvocations += 1;
                    motionFunc(motionArgs);
                }
                return;
            }
        } else if (letter === 'M') {
            cmd = letter + code;
            args = this.buildArgsScratch(letters, values, start + 1, end);
            this.updateSpindleToolEvents('M', Number(code));
        } else if (letter === 'T') {
            // T1 ; w/o M6
            cmd = letter;
            args = code;
            this.updateSpindleToolEvents('T', Number(code));
        } else if (letter === 'S') {
            cmd = letter;
            args = code;
            this.updateSpindleToolEvents('S', Number(code));
        } else if (AXIS_ARGUMENT_LETTERS.has(letter)) {
            // Use previous motion command if the line does not start with G-code or M-code.
            cmd = this.motionMode;
            args = this.buildArgsScratch(letters, values, start, end);
        }

        if (!cmd) {
            return;
        }

        if (typeof this.handlers[cmd] === 'function') {
            const func = this.handlers[cmd];
            this.profileStats.handlerInvocations += 1;
            func(args);
        }
    }

    virtualize(line = ''): void {
        this.profileStats.linesSeen += 1;
        if (!line) {
            this.totalLines += 1;
            this.fn.callback();
            return;
        }

        const scan = scanLineFast(line, this.fastScanScratch);
        if (scan.count === 0) {
            // Comment-only lines are still streamed (and acked) by the sender,
            // so they need a time slot; whitespace-only lines are dropped.
            if (this.estimator && hasNonWhitespace(line)) {
                this.estimator.beginLine(0);
            }
            this.totalLines += 1;
            return;
        }

        if (this.estimator) {
            this.estimator.beginLine(line.length);
        }

        if (scan.hasInvalidTokens) {
            this.vmState.invalidLines.push(line);
            this.profileStats.invalidLineCount += 1;
        }

        this.profileStats.tokensSeen += scan.count;
        this.totalLines += 1; // Moved here so M6 and T commands are correctly stored

        const letters = scan.letters;
        const values = scan.values;
        let spindleSpeedUpdate: number | null = null;

        // collect spindle and feed rates
        for (let i = 0; i < scan.count; i++) {
            const letter = letters[i];
            const code = values[i];
            if (letter === 'F') {
                this.feed = Number(code);
                if (this.collate) this.vmState.feedrates.add(`F${code}`);
                // this.saveFeedrate(code);
            }
            if (letter === 'S') {
                if (this.collate) this.vmState.spindle.add(`S${code}`);
                const spindleSpeed = Number(code);
                this.updateSpindleToolEvents('S', spindleSpeed);
                if (!Number.isNaN(spindleSpeed)) {
                    spindleSpeedUpdate = spindleSpeed;
                    // grbl syncs the planner on a speed change while the spindle runs
                    if (
                        this.estimator &&
                        spindleSpeed !== this.spindleSpeed &&
                        this.modal.spindle !== 'M5' &&
                        !this.estimator.config.laserMode
                    ) {
                        this.estimator.addSync();
                    }
                    this.spindleSpeed = spindleSpeed;
                }
            }
        }

        let groupStart = 0;
        let groupCount = 0;
        for (let i = 0; i < scan.count; ++i) {
            const letter = letters[i];
            if (
                (letter === 'G' || letter === 'M' || letter === 'T') &&
                i > groupStart
            ) {
                groupCount += 1;
                this.dispatchTokenGroup(letters, values, groupStart, i);
                groupStart = i;
            }
        }
        if (scan.count > 0) {
            groupCount += 1;
            this.dispatchTokenGroup(letters, values, groupStart, scan.count);
        }
        this.profileStats.groupsSeen += groupCount;

        const currentEvent = this.vmState.spindleToolEvents[this.totalLines];
        if (
            currentEvent &&
            (currentEvent.T !== undefined || currentEvent.M !== undefined)
        ) {
            const commentRegex = /\(([^)]*)\)|;(.*)/g;
            const parts: string[] = [];
            let cm: RegExpExecArray | null;
            while ((cm = commentRegex.exec(line)) !== null) {
                const text = (cm[1] !== undefined ? cm[1] : cm[2]).trim();
                if (text) parts.push(text);
            }
            const extracted = parts.join(' ');
            if (extracted) currentEvent.comment = extracted;
        }

        /*
        // add new data structure
        this.data.push({
            Scode: null,
            lineData: null,
        });
        this.modalCounter++;
        this.feedrateCounter++;
        */

        this.fn.callback();
        this.profileStats.emitDataCount += 1;
        this.emit('data', spindleSpeedUpdate);
    }

    generateFileStats() {
        const fileTypes = {
            [FILE_TYPE.DEFAULT]: FILE_TYPE.DEFAULT,
            [FILE_TYPE.ROTARY]: FILE_TYPE.ROTARY,
            [FILE_TYPE.FOUR_AXIS]: FILE_TYPE.FOUR_AXIS,
        };

        let fileType = FILE_TYPE.DEFAULT;

        if (this.vmState.usedAxes.has('Y') && this.vmState.usedAxes.has('A')) {
            fileType = fileTypes[FILE_TYPE.FOUR_AXIS];
        } else if (this.vmState.usedAxes.has('A')) {
            fileType = fileTypes[FILE_TYPE.ROTARY];
        }

        return {
            fileModal: this.modal.units,
            total: this.totalLines,
            toolSet: Array.from(this.vmState.tools),
            spindleSet: Array.from(this.vmState.spindle),
            movementSet: Array.from(this.vmState.feedrates),
            estimatedTime: this.estimator
                ? this.estimator.finish().totalTime
                : 0,
            bbox: this.getBBox(),
            fileType,
            usedAxes: Array.from(this.vmState.usedAxes),
            invalidLines: this.vmState.invalidLines,
            toolchanges: this.vmState.toolchange,
            spindleToolEvents: this.vmState.spindleToolEvents,
        };
    }

    offsetG92 = (pos: BasicPosition): BasicPosition => {
        return {
            x: pos.x + this.offsets.x,
            y: pos.y + this.offsets.y,
            z: pos.z + this.offsets.z,
            a: pos.a + this.offsets.a,
        };
    };

    setModal(modal: Partial<Modal>): Modal {
        this.modal = {
            ...this.modal,
            ...modal,
        };
        return this.modal;
    }

    setFeedrate(feed: number): number {
        this.feed = feed;
        return this.feed;
    }

    isMetricUnits(): boolean {
        // mm
        return this.modal.units === 'G21';
    }

    isImperialUnits(): boolean {
        // inches
        return this.modal.units === 'G20';
    }

    isAbsoluteDistance(): boolean {
        return this.modal.distance === 'G90';
    }

    isRelativeDistance(): boolean {
        return this.modal.distance === 'G91';
    }

    isXYPlane(): boolean {
        return this.modal.plane === 'G17';
    }

    isZXPlane(): boolean {
        return this.modal.plane === 'G18';
    }

    isYZPlane(): boolean {
        return this.modal.plane === 'G19';
    }

    setPosition(x: number, y: number, z: number, a?: number): void {
        this.position.x = typeof x === 'number' ? x : this.position.x;
        this.position.y = typeof y === 'number' ? y : this.position.y;
        this.position.z = typeof z === 'number' ? z : this.position.z;
        this.position.a = typeof a === 'number' ? a : this.position.a;
    }

    translateX(x: number, relative?: boolean): number {
        if (x !== undefined) {
            x = this.isImperialUnits() ? in2mm(x) : x;
        }
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.x, x, !!relative);
    }

    translateY(y: number, relative?: boolean): number {
        if (y !== undefined) {
            y = this.isImperialUnits() ? in2mm(y) : y;
        }
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.y, y, !!relative);
    }

    translateZ(z: number, relative?: boolean): number {
        if (z !== undefined) {
            z = this.isImperialUnits() ? in2mm(z) : z;
        }
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.z, z, !!relative);
    }

    translateA(a: number, relative?: boolean): number {
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.a, a, !!relative);
    }

    translateI(i: number): number {
        return this.translateX(i, true);
    }

    translateJ(j: number): number {
        return this.translateY(j, true);
    }

    translateK(k: number): number {
        return this.translateZ(k, true);
    }

    translateR(r: number): number {
        r = Number(r);
        if (Number.isNaN(r)) {
            return 0;
        }
        return this.isImperialUnits() ? in2mm(r) : r;
    }

    updateBounds(position: BasicPosition): void {
        const { x, y, z, a } = position;

        if (x > this.maxBounds[0]) {
            this.maxBounds[0] = x;
        }
        if (x < this.minBounds[0]) {
            this.minBounds[0] = x;
        }

        if (y > this.maxBounds[1]) {
            this.maxBounds[1] = y;
        }
        if (y < this.minBounds[1]) {
            this.minBounds[1] = y;
        }

        if (z > this.maxBounds[2]) {
            this.maxBounds[2] = z;
        }
        if (z < this.minBounds[2]) {
            this.minBounds[2] = z;
        }

        if (a !== undefined) {
            if (a > this.maxBounds[3]) {
                this.maxBounds[3] = a;
            }
            if (a < this.minBounds[3]) {
                this.minBounds[3] = a;
            }

            // Auto-detect rotary diameter from Y/Z range when A-axis is used
            // This works regardless of where zero is set (center, surface, or arbitrary point)
            if (this.autoDetectRotaryDiameter && a !== 0) {
                // Calculate diameter from the full range of Y and Z movement
                // The range represents the full diameter of the workpiece
                const yRange = this.maxBounds[1] - this.minBounds[1];
                const zRange = this.maxBounds[2] - this.minBounds[2];

                // Use the larger range (Y or Z depending on machine configuration)
                const detectedDiameter = Math.max(yRange, zRange);

                // Update if we found a larger diameter, with minimum of 10mm
                if (detectedDiameter > this.rotaryDiameter) {
                    this.rotaryDiameter = Math.max(detectedDiameter, 10);
                }
            }
        }
    }

    getBBox() {
        const [minX, minY, minZ, minA] = this.minBounds;
        const [maxX, maxY, maxZ, maxA] = this.maxBounds;

        return {
            min: {
                x: minX,
                y: minY,
                z: minZ,
                a: minA,
            },
            max: {
                x: maxX,
                y: maxY,
                z: maxZ,
                a: maxA,
            },
            delta: {
                x: maxX - minX,
                y: maxY - minY,
                z: maxZ - minZ,
                a: maxA - minA,
            },
        };
    }

    estimateLinear(endPos: BasicPosition, motion: number): void {
        if (!this.estimator) {
            return;
        }
        const pos = this.position;
        this.estimator.addLinear(
            endPos.x - pos.x,
            endPos.y - pos.y,
            endPos.z - pos.z,
            (endPos.a ?? pos.a ?? 0) - (pos.a ?? 0),
            motion,
            this.feed,
            this.isImperialUnits(),
            this.modal.feedrate === 'G93',
        );
    }

    // v1/v2/v0 are already in plane order (axis0, axis1, linear) as x/y/z
    estimateArc(
        v1: BasicPosition,
        v2: BasicPosition,
        v0: BasicPosition,
        clockwise: boolean,
    ): void {
        if (!this.estimator) {
            return;
        }
        let axes: [number, number, number] = [0, 1, 2];
        if (this.isZXPlane()) {
            axes = [2, 0, 1];
        } else if (this.isYZPlane()) {
            axes = [1, 2, 0];
        }
        this.estimator.addArc(
            [v1.x, v1.y, v1.z],
            [v2.x, v2.y, v2.z],
            [v0.x, v0.y],
            clockwise,
            axes,
            this.feed,
            this.isImperialUnits(),
            this.modal.feedrate === 'G93',
        );
    }

    // Spindle state changes sync the planner unless in laser mode
    syncForSpindle(startingFromOff: boolean): void {
        if (!this.estimator || this.estimator.config.laserMode) {
            return;
        }
        if (startingFromOff) {
            this.estimator.addSpindleStart();
        } else {
            this.estimator.addSync();
        }
    }

    getData(): { lineTime: Float32Array; lineKind: Uint8Array } {
        if (!this.estimator) {
            return {
                lineTime: new Float32Array(0),
                lineKind: new Uint8Array(0),
            };
        }
        const { lineTime, lineKind } = this.estimator.finish();
        return { lineTime, lineKind };
    }

    getProfileStats(): VMProfileStats {
        return { ...this.profileStats };
    }

    updateSpindleToolEvents(
        word: SpindleToolEventCode,
        code: number | boolean,
    ) {
        if (!this.vmState.spindleToolEvents[this.totalLines]) {
            this.vmState.spindleToolEvents[this.totalLines] = { [word]: code };
        } else {
            // @ts-expect-error
            this.vmState.spindleToolEvents[this.totalLines][word] = code;
        }
    }
}

export default GCodeVirtualizer;
