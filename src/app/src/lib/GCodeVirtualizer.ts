import { EventEmitter } from 'events';

import { FILE_TYPE } from '../constants';
import { parseLine } from './GCodeParser';
import { BasicPosition, BBox } from 'app/definitions/general';

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
    y: number;
    z: number;
    a: number;
}

type SpindleToolEventCode = 'S' | 'T' | 'M' | 'TC';

interface SpindleToolEvent {
    S?: Number;
    T?: Number;
    M?: Number;
    TC?: boolean;
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
    axis: 'y' | 'z',
    { y, z, a }: { y: number; z: number; a: number },
): RotationResult | null => {
    if (!axis) {
        throw new Error('Axis is required');
    }

    const angle = toRadians(a);

    // Calculate the sine and cosine of the angle
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Rotate the vertex around the y-axis
    if (axis === 'y') {
        const rotatedZ = z * cosA - y * sinA;
        const rotatedY = z * sinA + y * cosA;
        return { y: rotatedY, z: rotatedZ, a };
    }

    // Rotate the vertex around the z-axis
    //This logic is just for testing
    if (axis === 'z') {
        const rotatedY = y * cosA - z * sinA;
        const rotatedZ = y * sinA + z * cosA;
        return { y: rotatedY, z: rotatedZ, a };
    }

    return null;
};

// from in to mm
const in2mm = (val: number = 0): number => val * 25.4;

// noop
const noop = (): void => {};

class GCodeVirtualizer extends EventEmitter {
    motionMode: string = 'G0';

    totalLines: number = 0;

    totalTime: number = 0;

    feed: number = 0;

    lastF: number = 0; // Last feed in mm/m

    currentLine: string | null = null;

    collate: boolean = false;

    xAccel: number = 750;

    yAccel: number = 750;

    zAccel: number = 500;

    xMaxFeed: number = 0;

    yMaxFeed: number = 0;

    zMaxFeed: number = 0;

    re1: RegExp = new RegExp(/\s*\([^\)]*\)/g); // Remove anything inside the parentheses

    re2: RegExp = new RegExp(/\s*;.*/g); // Remove anything after a semi-colon to the end of the line, including preceding spaces

    re3: RegExp = new RegExp(/\s+/g);

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

    estimates: number[] = [];

    setEstimate: boolean = false;

    modalChanges: ModalChanges = [
        {
            change: null,
            count: 0,
        },
    ];
    modalCounter: number = 0;

    feedrateChanges: FeedrateChanges = [
        {
            change: null,
            count: 0,
        },
    ];
    feedrateCounter: number = 0;

    //INVALID_GCODE_REGEX = /([^NGMXYZITPAJKFRS%\-?\.?\d+\.?\s])|((G28)|(G29)|(\$H))/gi;
    //INVALID_GCODE_REGEX = /^(?!.*\b([NGMXYZILTPAJKFRS][0-9+\-\.]+|\$\$|\$[NGMXYZILTPAJKFRS0-9#]*|\*[0-9]+|%.*|{.*})\b).+$/gi;
    VALID_GCODE_REGEX =
        /((%.*)|{.*)|((?:\$\$)|(?:\$[NGMXYZILTPAJKFHRS0-9#]*))|([NGMXYZHILTPAJKFRS][0-9\+\-\.]+)|(\*[0-9]+)/gi;

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
                this.saveModal({ motion: 'G0' });
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
            this.calculateMachiningTime(targetPosition);
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
                this.saveModal({ motion: 'G1' });
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
            this.calculateMachiningTime(targetPosition);
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
                this.saveModal({ motion: 'G2' });
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

            // Update position
            this.calculateMachiningTime(targetPosition);
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
                this.saveModal({ motion: 'G3' });
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

            // Update position
            this.calculateMachiningTime(targetPosition);
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
                this.saveModal({ motion: 'G4' });
            }
            let dwellTime: number = 0;
            if (params.P) {
                dwellTime = params.P / 1000;
            }
            if (params.S) {
                dwellTime = params.S;
            }
            this.totalTime += dwellTime;
        },
        // G10: Coordinate System Data Tool and Work Offset Tables
        G10: (_params: Record<string, any>): void => {},
        // G17..19: Plane Selection
        // G17: XY (default)
        G17: (_params: Record<string, any>): void => {
            if (this.modal.plane !== 'G17') {
                this.setModal({ plane: 'G17' });
                this.saveModal({ plane: 'G17' });
            }
        },
        // G18: XZ
        G18: (_params: Record<string, any>): void => {
            if (this.modal.plane !== 'G18') {
                this.setModal({ plane: 'G18' });
                this.saveModal({ plane: 'G18' });
            }
        },
        // G19: YZ
        G19: (_params: Record<string, any>): void => {
            if (this.modal.plane !== 'G19') {
                this.setModal({ plane: 'G19' });
                this.saveModal({ plane: 'G19' });
            }
        },
        // G20: Use inches for length units
        G20: (_params: Record<string, any>): void => {
            if (this.modal.units !== 'G20') {
                this.setModal({ units: 'G20' });
                this.saveModal({ units: 'G20' });
            }
        },
        // G21: Use millimeters for length units
        G21: (_params: Record<string, any>): void => {
            if (this.modal.units !== 'G21') {
                this.setModal({ units: 'G21' });
                this.saveModal({ units: 'G21' });
            }
        },
        // G38.x: Straight Probe
        // G38.2: Probe toward workpiece, stop on contact, signal error if failure
        'G38.2': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.2') {
                this.setModal({ motion: 'G38.2' });
                this.saveModal({ motion: 'G38.2' });
            }
        },
        // G38.3: Probe toward workpiece, stop on contact
        'G38.3': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.3') {
                this.setModal({ motion: 'G38.3' });
                this.saveModal({ motion: 'G38.3' });
            }
        },
        // G38.4: Probe away from workpiece, stop on loss of contact, signal error if failure
        'G38.4': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.4') {
                this.setModal({ motion: 'G38.4' });
                this.saveModal({ motion: 'G38.4' });
            }
        },
        // G38.5: Probe away from workpiece, stop on loss of contact
        'G38.5': (_params: Record<string, any>): void => {
            if (this.modal.motion !== 'G38.5') {
                this.setModal({ motion: 'G38.5' });
                this.saveModal({ motion: 'G38.5' });
            }
        },
        // G43.1: Tool Length Offset
        'G43.1': (_params: Record<string, any>): void => {
            if (this.modal.tlo !== 'G43.1') {
                this.setModal({ tlo: 'G43.1' });
                this.saveModal({ tlo: 'G43.1' });
            }
        },
        // G49: No Tool Length Offset
        G49: (): void => {
            if (this.modal.tlo !== 'G49') {
                this.setModal({ tlo: 'G49' });
                this.saveModal({ tlo: 'G49' });
            }
        },
        // G54..59: Coordinate System Select
        G54: (): void => {
            if (this.modal.wcs !== 'G54') {
                this.setModal({ wcs: 'G54' });
                this.saveModal({ wcs: 'G54' });
            }
        },
        G55: (): void => {
            if (this.modal.wcs !== 'G55') {
                this.setModal({ wcs: 'G55' });
                this.saveModal({ wcs: 'G55' });
            }
        },
        G56: (): void => {
            if (this.modal.wcs !== 'G56') {
                this.setModal({ wcs: 'G56' });
                this.saveModal({ wcs: 'G56' });
            }
        },
        G57: (): void => {
            if (this.modal.wcs !== 'G57') {
                this.setModal({ wcs: 'G57' });
                this.saveModal({ wcs: 'G57' });
            }
        },
        G58: (): void => {
            if (this.modal.wcs !== 'G58') {
                this.setModal({ wcs: 'G58' });
                this.saveModal({ wcs: 'G58' });
            }
        },
        G59: (): void => {
            if (this.modal.wcs !== 'G59') {
                this.setModal({ wcs: 'G59' });
                this.saveModal({ wcs: 'G59' });
            }
        },
        // G80: Cancel Canned Cycle
        G80: (): void => {
            if (this.modal.motion !== 'G80') {
                this.setModal({ motion: 'G80' });
                this.saveModal({ motion: 'G80' });
            }
        },
        // G90: Set to Absolute Positioning
        // Example
        //   G90
        // All coordinates from now on are absolute relative to the origin of the machine.
        G90: (): void => {
            if (this.modal.distance !== 'G90') {
                this.setModal({ distance: 'G90' });
                this.saveModal({ distance: 'G90' });
            }
        },
        // G91: Set to Relative Positioning
        // Example
        //   G91
        // All coordinates from now on are relative to the last position.
        G91: (): void => {
            if (this.modal.distance !== 'G91') {
                this.setModal({ distance: 'G91' });
                this.saveModal({ distance: 'G91' });
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
                this.saveModal({ feedrate: 'G93' });
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
                this.saveModal({ feedrate: 'G94' });
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
                this.saveModal({ feedrate: 'G95' });
            }
        },
        // M0: Program Pause
        M0: (): void => {
            if (this.modal.program !== 'M0') {
                this.setModal({ program: 'M0' });
                this.saveModal({ program: 'M0' });
            }
        },
        // M1: Program Pause
        M1: (): void => {
            if (this.modal.program !== 'M1') {
                this.setModal({ program: 'M1' });
                this.saveModal({ program: 'M1' });
            }
        },
        // M2: Program End
        M2: (): void => {
            if (this.modal.program !== 'M2') {
                this.setModal({ program: 'M2' });
                this.saveModal({ program: 'M2' });
            }
        },
        // M30: Program End
        M30: (): void => {
            if (this.modal.program !== 'M30') {
                this.setModal({ program: 'M30' });
                this.saveModal({ program: 'M30' });
            }
        },
        // Spindle Control
        // M3: Start the spindle turning clockwise at the currently programmed speed
        M3: (_params: Record<string, any>): void => {
            if (this.modal.spindle !== 'M3') {
                this.setModal({ spindle: 'M3' });
                this.saveModal({ spindle: 'M3' });
            }
        },
        // M4: Start the spindle turning counterclockwise at the currently programmed speed
        M4: (_params: Record<string, any>): void => {
            if (this.modal.spindle !== 'M4') {
                this.setModal({ spindle: 'M4' });
                this.saveModal({ spindle: 'M4' });
            }
        },
        // M5: Stop the spindle from turning
        M5: (): void => {
            if (this.modal.spindle !== 'M5') {
                this.setModal({ spindle: 'M5' });
                this.saveModal({ spindle: 'M5' });
            }
        },
        // M6: Tool Change
        M6: (params: Record<string, any>): void => {
            this.vmState.toolchange.push(this.totalLines);
            if (params && params.T !== undefined) {
                this.setModal({ tool: params.T });
                this.saveModal({ tool: params.T });
            }
        },
        // Coolant Control
        // M7: Turn mist coolant on
        M7: (): void => {
            const coolants = this.modal.coolant.split(',');
            if (coolants.indexOf('M7') >= 0) {
                return;
            }

            this.setModal({
                coolant: coolants.indexOf('M8') >= 0 ? 'M7,M8' : 'M7',
            });
            this.saveModal({
                coolant: coolants.indexOf('M8') >= 0 ? 'M7,M8' : 'M7',
            });
        },
        // M8: Turn flood coolant on
        M8: (): void => {
            const coolants = this.modal.coolant.split(',');
            if (coolants.indexOf('M8') >= 0) {
                return;
            }

            this.setModal({
                coolant: coolants.indexOf('M7') >= 0 ? 'M7,M8' : 'M8',
            });
            this.saveModal({
                coolant: coolants.indexOf('M7') >= 0 ? 'M7,M8' : 'M8',
            });
        },
        // M9: Turn all coolant off
        M9: (): void => {
            if (this.modal.coolant !== 'M9') {
                this.setModal({ coolant: 'M9' });
                this.saveModal({ coolant: 'M9' });
            }
        },
        T: (tool: number): void => {
            if (tool !== undefined) {
                this.setModal({ tool: tool });
                this.saveModal({ tool: tool });
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
        ) => void;
        callback?: () => void;
        collate?: boolean;
        accelerations?: {
            xAccel?: number;
            yAccel?: number;
            zAccel?: number;
        };
        maxFeedrates?: {
            xMaxFeed?: number;
            yMaxFeed?: number;
            zMaxFeed?: number;
        };
    }) {
        super();
        const {
            addLine = noop,
            addArcCurve = noop,
            addCurve = noop,
            callback = noop,
            collate = false,
            accelerations,
            maxFeedrates,
        } = options;

        this.fn = { addLine, addArcCurve, addCurve, callback };
        this.collate = collate;

        if (accelerations) {
            const { xAccel, yAccel, zAccel } = accelerations;
            this.xAccel = xAccel;
            this.yAccel = yAccel;
            this.zAccel = zAccel;
        }

        if (maxFeedrates) {
            const { xMaxFeed, yMaxFeed, zMaxFeed } = maxFeedrates;
            this.xMaxFeed = xMaxFeed;
            this.yMaxFeed = yMaxFeed;
            this.zMaxFeed = zMaxFeed;
        }

        if (this.collate) {
            this.vmState.feedrates = new Set<string>();
            this.vmState.tools = new Set<string>();
            this.vmState.spindle = new Set<string>();
            this.vmState.invalidLines = [];
        }
    }

    partitionWordsByGroup(words: [string, any][] = []): [string, any][][] {
        const groups: [string, any][][] = [];

        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const letter = word[0];

            if (letter === 'G' || letter === 'M' || letter === 'T') {
                groups.push([word]);
                continue;
            }

            if (groups.length > 0) {
                groups[groups.length - 1].push(word);
            } else {
                groups.push([word]);
            }
        }

        return groups;
    }

    /**
     * Returns an object composed from arrays of property names and values.
     * @example
     *   fromPairs([['a', 1], ['b', 2]]);
     *   // => { 'a': 1, 'b': 2 }
     */
    fromPairs(pairs: [string, any][]): Record<string, string> {
        let index = -1;
        const length = !pairs ? 0 : pairs.length;
        const result: Record<string, string> = {};

        while (++index < length) {
            const pair = pairs[index];
            result[pair[0]] = pair[1];
        }

        return result;
    }

    virtualize(line = ''): void {
        this.setEstimate = false; // Reset on each line
        if (!line) {
            this.totalLines += 1;
            this.fn.callback();
            return;
        }

        line = line
            .replace(this.re1, '')
            .replace(this.re2, '')
            .replace(this.re3, '');

        if (line === '') {
            this.totalLines += 1;
            return;
        }

        if (line.replace(this.VALID_GCODE_REGEX, '').length > 0) {
            this.vmState.invalidLines.push(line);
        }

        const parsedLine = parseLine(line);
        this.totalLines += 1; // Moved here so M6 and T commands are correctly stored
        // collect spindle and feed rates
        for (let word of parsedLine.words) {
            const letter = word[0];
            const code = word[1];
            if (letter === 'F') {
                this.feed = Number(code);
                this.vmState.feedrates.add(`F${code}`);
                this.saveFeedrate(code);
            }
            if (letter === 'S') {
                this.vmState.spindle.add(`S${code}`);
                this.updateSpindleToolEvents('S', Number(code));
            }
        }

        const groups = this.partitionWordsByGroup(parsedLine.words);
        for (let i = 0; i < groups.length; ++i) {
            const words = groups[i];
            const word = words[0] || [];
            const letter = word[0];
            const code = word[1];
            let cmd = '';
            let args: Record<string, any> = {};

            if (letter === 'G') {
                cmd = letter + code;
                args = this.fromPairs(words.slice(1));

                if (args.X !== undefined) {
                    this.vmState.usedAxes.add('X');
                }

                if (args.Y !== undefined) {
                    this.vmState.usedAxes.add('Y');
                }

                if (args.Z !== undefined) {
                    this.vmState.usedAxes.add('Z');
                }

                if (args.A !== undefined) {
                    this.vmState.usedAxes.add('A');
                }

                // Motion Mode

                if (
                    [
                        '0',
                        '1',
                        '2',
                        '3',
                        '38.2',
                        '38.3',
                        '38.4',
                        '38.5',
                    ].includes(code)
                ) {
                    this.motionMode = cmd;
                } else if (code === '80') {
                    this.motionMode = '';
                }
            } else if (letter === 'M') {
                cmd = letter + code;
                args = this.fromPairs(words.slice(1));
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
            } else if (
                letter === 'X' ||
                letter === 'Y' ||
                letter === 'Z' ||
                letter === 'A' ||
                letter === 'B' ||
                letter === 'C' ||
                letter === 'I' ||
                letter === 'J' ||
                letter === 'K'
            ) {
                // Use previous motion command if the line does not start with G-code or M-code.
                cmd = this.motionMode;
                args = this.fromPairs(words);
            }

            if (!cmd) {
                continue;
            }

            if (typeof this.handlers[cmd] === 'function') {
                const func = this.handlers[cmd];
                func(args);
            }
        }

        /*
        // if the line didnt have time calcs involved, push 0 time
        if (this.estimates.length < this.data.length) {
            this.estimates.push(0);
        }
        */
        if (!this.setEstimate) {
            this.estimates.push(0); // Same as above but use flag instead of array length
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
        this.emit('data', parsedLine);
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
            estimatedTime: this.totalTime,
            bbox: this.getBBox(),
            fileType,
            usedAxes: Array.from(this.vmState.usedAxes),
            invalidLines: this.vmState.invalidLines,
            toolchanges: this.vmState.toolchange,
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

    calculateMachiningTime(endPos: BasicPosition, v1?: BasicPosition): void {
        let moveDuration = 0;
        let currentPos = v1 || this.position;

        const dx = endPos.x - currentPos.x;
        const dy = endPos.y - currentPos.y;
        const dz = endPos.z - currentPos.z;

        let travelXY = Math.hypot(dx, dy);
        if (Number.isNaN(travelXY)) {
            console.error(
                'Invalid travel while calculating distance between V1 and V2',
            );
            return;
        }
        let travel = 0;
        travel = Math.hypot(travelXY, dz);

        let feed;
        const maxFeedArray = [];
        const accelArray = [];
        // if d[var] is 0, we aren't moving in that direction, so we don't need to use that feed/accel.
        if (dx !== 0) {
            maxFeedArray.push(this.xMaxFeed);
            accelArray.push(this.xAccel);
        }
        if (dy !== 0) {
            maxFeedArray.push(this.yMaxFeed);
            accelArray.push(this.yAccel);
        }
        if (dz !== 0) {
            maxFeedArray.push(this.zMaxFeed);
            accelArray.push(this.zAccel);
        }
        // find the lowest max feed/accel
        const minMaxFeed = Math.min(...maxFeedArray);
        const minAccel = Math.min(...accelArray);
        // if motion is G0, use the max feed
        feed = this.modal.motion === 'G0' ? minMaxFeed : this.feed;
        // if the feed is above the lowest max, use the lowest max instead
        if (feed > minMaxFeed) {
            feed = minMaxFeed;
        }

        // Convert to metric
        feed = this.modal.units === 'G20' ? feed * 25.4 : feed;

        // mm/s to mm/m
        const f = feed / 60;

        if (f === this.lastF) {
            moveDuration = f !== 0 ? travel / f : 0;
        } else {
            moveDuration = this.getAcceleratedMove(
                travel,
                f,
                /*this.lastF,*/ minAccel,
            );
        }

        this.lastF = f;
        this.totalTime += moveDuration;
        this.estimates.push(Number(moveDuration.toFixed(4))); // round to avoid bad js math
        this.setEstimate = true;
    }

    // TODO: if we find something we need to account for that will make the times longer,
    // we can include the initial accelerations in these calculations to make it more accurate and shorter
    getAcceleratedMove(
        length: number,
        velocity: number,
        /*lastVelocity,*/ acceleration: number,
    ): number {
        // taken from https://github.com/slic3r/Slic3r
        // for half of the move, there are 2 zones, where the speed is increasing/decreasing and
        // where the speed is constant.
        // Since the slowdown is assumed to be uniform, calculate the average velocity for half of the
        // expected displacement.
        // const lastF = lastVelocity * 0.1;
        const accel = acceleration === 0 ? 750 : acceleration; // Set a default accel to use for print time in case it's 0 somehow.
        let halfLen = length / 2;
        const initTime = velocity / accel; // time to final velocity
        const initDxTime = 0.5 * velocity /*+ lastF*/ * initTime; // Initial displacement for the time to get to final velocity
        let time = 0;
        if (halfLen >= initDxTime) {
            halfLen -= 0.5 * velocity /*+ lastF*/ * initTime;
            time += initTime;
        }
        time += halfLen / velocity /*+ lastF*/; // constant speed for rest of the time and too short displacements

        return 2 * time; // cut in half before, so double to get full time spent.
    }

    getData(): { estimates: number[] } {
        //this.data.pop(); // get rid of the last entry, as it is a temp one with null values
        return {
            estimates: this.estimates,
        };
    }

    getModalChanges(): ModalChanges {
        this.modalChanges[this.modalChanges.length - 1].count =
            this.modalCounter;
        this.modalCounter = 0;
        return this.modalChanges;
    }

    getFeedrateChanges(): FeedrateChanges {
        this.feedrateChanges[this.feedrateChanges.length - 1].count =
            this.feedrateCounter;
        this.feedrateCounter = 0;
        return this.feedrateChanges;
    }

    getCurrentModal(): Modal {
        return this.modal;
    }

    saveModal(change: Partial<Modal>): void {
        this.modalChanges[this.modalChanges.length - 1].count =
            this.modalCounter;
        this.modalCounter = 0;
        this.modalChanges.push({ change: change, count: 0 });
    }

    saveFeedrate(change: string): void {
        this.feedrateChanges[this.feedrateChanges.length - 1].count =
            this.feedrateCounter;
        this.feedrateCounter = 0;
        this.feedrateChanges.push({ change: change, count: 0 });
    }

    addToTotalTime(time: number): void {
        if (!Number(time)) {
            return;
        }
        this.totalTime += time;
    }

    updateSpindleToolEvents(
        code: SpindleToolEventCode,
        value: number | boolean,
    ) {
        if (!this.vmState.spindleToolEvents[this.totalLines]) {
            this.vmState.spindleToolEvents[this.totalLines] = { [code]: value };
        } else {
            // @ts-ignore
            this.vmState.spindleToolEvents[this.totalLines][code] = value;
        }
    }
}

export default GCodeVirtualizer;
