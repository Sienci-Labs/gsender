import { EventEmitter } from 'events';
import { parseLine } from 'gcode-parser';
import { FILE_TYPE } from '../constants';

const translatePosition = (position, newPosition, relative) => {
    relative = !!relative;
    newPosition = Number(newPosition);
    if (Number.isNaN(newPosition)) {
        return position;
    }
    return relative ? (position + newPosition) : newPosition;
};

export const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
};

// We just need to check the difference between the a axis values,
// this should work fine since they are both 0 initially
export const shouldRotate = (start, end) => {
    return start.a !== end.a;
};

export const rotateAxis = (axis, { y, z, a }) => {
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
const in2mm = (val = 0) => val * 25.4;

// noop
const noop = () => {};

class GCodeVirtualizer extends EventEmitter {
    motionMode = 'G0';

    totalLines = 0;

    totalTime = 0;

    feed = 0;

    lastF = 0; // Last feed in mm/m

    currentLine = null;

    collate = false;

    re1 = new RegExp(/\s*\([^\)]*\)/g); // Remove anything inside the parentheses

    re2 = new RegExp(/\s*;.*/g); // Remove anything after a semi-colon to the end of the line, including preceding spaces

    re3 = new RegExp(/\s+/g);

    minBounds = [0, 0, 0]

    maxBounds = [0, 0, 0]

    modal = {
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

        // Spingle State
        // M3, M4, M5
        spindle: 'M5',

        // Coolant State
        // M7, M8, M9
        coolant: 'M9', // 'M7', 'M8', 'M7,M8', or 'M9'

        // Tool Select
        tool: 0
    }

    position = {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
    }

    offsets = {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
    }

    vmState = {
        tools: null,
        spindle: null,
        feedrates: null,
        bbox: {
            min: {
                x: 0,
                y: 0,
                z: 0
            },
            max: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        usedAxes: new Set()

    }

    handlers = {
        // G0: Rapid Linear Move
        'G0': (params) => {
            if (this.modal.motion !== 'G0') {
                this.setModal({ motion: 'G0' });
            }

            const v1 = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                a: this.position.a,
            };
            const v2 = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z),
                a: this.translateA(params.A),
            };
            const targetPosition = { x: v2.x, y: v2.y, z: v2.z, a: v2.a };

            const isCurvedLine = shouldRotate(v1, v2);
            const ANGLE_THRESHOLD = 30;
            const angleDiff = Math.abs(v2.a - v1.a);

            if (isCurvedLine && angleDiff > ANGLE_THRESHOLD) {
                this.fn.addCurve(this.modal, this.offsetG92(v1), this.offsetG92(v2));
            } else {
                this.fn.addLine(this.modal, this.offsetG92(v1), this.offsetG92(v2));
            }

            // Update position
            this.calculateMachiningTime(targetPosition);
            this.updateBounds(targetPosition);
            this.setPosition(targetPosition.x, targetPosition.y, targetPosition.z, targetPosition.a);
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
        'G1': (params) => {
            if (this.modal.motion !== 'G1') {
                this.setModal({ motion: 'G1' });
            }

            const v1 = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                a: this.position.a,
            };
            const v2 = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z),
                a: this.translateA(params.A),
            };
            const targetPosition = { x: v2.x, y: v2.y, z: v2.z, a: v2.a };

            const isCurvedLine = shouldRotate(v1, v2);
            const ANGLE_THRESHOLD = 30;
            const angleDiff = Math.abs(v2.a - v1.a);

            if (isCurvedLine && angleDiff > ANGLE_THRESHOLD) {
                this.fn.addCurve(this.modal, this.offsetG92(v1), this.offsetG92(v2));
            } else {
                this.fn.addLine(this.modal, this.offsetG92(v1), this.offsetG92(v2));
            }

            // Update position + increment machining time
            this.calculateMachiningTime(targetPosition);
            this.updateBounds(targetPosition);
            this.setPosition(targetPosition.x, targetPosition.y, targetPosition.z, targetPosition.a);
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
        'G2': (params) => {
            if (this.modal.motion !== 'G2') {
                this.setModal({ motion: 'G2' });
            }

            const v1 = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };
            const v2 = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z)
            };
            const v0 = { // fixed point
                x: this.translateI(params.I),
                y: this.translateJ(params.J),
                z: this.translateK(params.K)
            };
            const isClockwise = true;
            const targetPosition = { x: v2.x, y: v2.y, z: v2.z };

            if (this.isXYPlane()) { // XY-plane
                [v1.x, v1.y, v1.z] = [v1.x, v1.y, v1.z];
                [v2.x, v2.y, v2.z] = [v2.x, v2.y, v2.z];
                [v0.x, v0.y, v0.z] = [v0.x, v0.y, v0.z];
            } else if (this.isZXPlane()) { // ZX-plane
                [v1.x, v1.y, v1.z] = [v1.z, v1.x, v1.y];
                [v2.x, v2.y, v2.z] = [v2.z, v2.x, v2.y];
                [v0.x, v0.y, v0.z] = [v0.z, v0.x, v0.y];
            } else if (this.isYZPlane()) { // YZ-plane
                [v1.x, v1.y, v1.z] = [v1.y, v1.z, v1.x];
                [v2.x, v2.y, v2.z] = [v2.y, v2.z, v2.x];
                [v0.x, v0.y, v0.z] = [v0.y, v0.z, v0.x];
            } else {
                console.error('The plane mode is invalid', this.modal.plane);
                return;
            }

            if (params.R) {
                const radius = this.translateR(Number(params.R) || 0);
                const x = v2.x - v1.x;
                const y = v2.y - v1.y;
                const distance = Math.sqrt(x * x + y * y);
                let height = Math.sqrt(4 * radius * radius - x * x - y * y) / 2;

                if (isClockwise) {
                    height = -height;
                }
                if (radius < 0) {
                    height = -height;
                }

                const offsetX = x / 2 - y / distance * height;
                const offsetY = y / 2 + x / distance * height;

                v0.x = v1.x + offsetX;
                v0.y = v1.y + offsetY;
            }

            //this.offsetAddArcCurve(v1, v2, v0);
            this.fn.addArcCurve(this.modal, this.offsetG92(v1), this.offsetG92(v2), this.offsetG92(v0));

            // Update position
            this.calculateMachiningTime(targetPosition);
            this.updateBounds(targetPosition);
            this.setPosition(targetPosition.x, targetPosition.y, targetPosition.z);
        },
        'G3': (params) => {
            if (this.modal.motion !== 'G3') {
                this.setModal({ motion: 'G3' });
            }

            const v1 = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };
            const v2 = {
                x: this.translateX(params.X),
                y: this.translateY(params.Y),
                z: this.translateZ(params.Z)
            };
            const v0 = { // fixed point
                x: this.translateI(params.I),
                y: this.translateJ(params.J),
                z: this.translateK(params.K)
            };
            const isClockwise = false;
            const targetPosition = { x: v2.x, y: v2.y, z: v2.z };

            if (this.isXYPlane()) { // XY-plane
                [v1.x, v1.y, v1.z] = [v1.x, v1.y, v1.z];
                [v2.x, v2.y, v2.z] = [v2.x, v2.y, v2.z];
                [v0.x, v0.y, v0.z] = [v0.x, v0.y, v0.z];
            } else if (this.isZXPlane()) { // ZX-plane
                [v1.x, v1.y, v1.z] = [v1.z, v1.x, v1.y];
                [v2.x, v2.y, v2.z] = [v2.z, v2.x, v2.y];
                [v0.x, v0.y, v0.z] = [v0.z, v0.x, v0.y];
            } else if (this.isYZPlane()) { // YZ-plane
                [v1.x, v1.y, v1.z] = [v1.y, v1.z, v1.x];
                [v2.x, v2.y, v2.z] = [v2.y, v2.z, v2.x];
                [v0.x, v0.y, v0.z] = [v0.y, v0.z, v0.x];
            } else {
                console.error('The plane mode is invalid', this.modal.plane);
                return;
            }

            if (params.R) {
                const radius = this.translateR(Number(params.R) || 0);
                const x = v2.x - v1.x;
                const y = v2.y - v1.y;
                const distance = Math.sqrt(x * x + y * y);
                let height = Math.sqrt(4 * radius * radius - x * x - y * y) / 2;

                if (isClockwise) {
                    height = -height;
                }
                if (radius < 0) {
                    height = -height;
                }

                const offsetX = x / 2 - y / distance * height;
                const offsetY = y / 2 + x / distance * height;

                v0.x = v1.x + offsetX;
                v0.y = v1.y + offsetY;
            }

            this.fn.addArcCurve(this.modal, this.offsetG92(v1), this.offsetG92(v2), this.offsetG92(v0));

            // Update position
            this.calculateMachiningTime(targetPosition);
            this.updateBounds(targetPosition);
            this.setPosition(targetPosition.x, targetPosition.y, targetPosition.z);
        },
        // G4: Dwell
        // Parameters
        //   Pnnn Time to wait, in milliseconds
        //   Snnn Time to wait, in seconds (Only on Marlin and Smoothie)
        // Example
        //   G4 P200
        'G4': (params) => {
        },
        // G10: Coordinate System Data Tool and Work Offset Tables
        'G10': (params) => {
        },
        // G17..19: Plane Selection
        // G17: XY (default)
        'G17': (params) => {
            if (this.modal.plane !== 'G17') {
                this.setModal({ plane: 'G17' });
            }
        },
        // G18: XZ
        'G18': (params) => {
            if (this.modal.plane !== 'G18') {
                this.setModal({ plane: 'G18' });
            }
        },
        // G19: YZ
        'G19': (params) => {
            if (this.modal.plane !== 'G19') {
                this.setModal({ plane: 'G19' });
            }
        },
        // G20: Use inches for length units
        'G20': (params) => {
            if (this.modal.units !== 'G20') {
                this.setModal({ units: 'G20' });
            }
        },
        // G21: Use millimeters for length units
        'G21': (params) => {
            if (this.modal.units !== 'G21') {
                this.setModal({ units: 'G21' });
            }
        },
        // G38.x: Straight Probe
        // G38.2: Probe toward workpiece, stop on contact, signal error if failure
        'G38.2': (params) => {
            if (this.modal.motion !== 'G38.2') {
                this.setModal({ motion: 'G38.2' });
            }
        },
        // G38.3: Probe toward workpiece, stop on contact
        'G38.3': (params) => {
            if (this.modal.motion !== 'G38.3') {
                this.setModal({ motion: 'G38.3' });
            }
        },
        // G38.4: Probe away from workpiece, stop on loss of contact, signal error if failure
        'G38.4': (params) => {
            if (this.modal.motion !== 'G38.4') {
                this.setModal({ motion: 'G38.4' });
            }
        },
        // G38.5: Probe away from workpiece, stop on loss of contact
        'G38.5': (params) => {
            if (this.modal.motion !== 'G38.5') {
                this.setModal({ motion: 'G38.5' });
            }
        },
        // G43.1: Tool Length Offset
        'G43.1': (params) => {
            if (this.modal.tlo !== 'G43.1') {
                this.setModal({ tlo: 'G43.1' });
            }
        },
        // G49: No Tool Length Offset
        'G49': () => {
            if (this.modal.tlo !== 'G49') {
                this.setModal({ tlo: 'G49' });
            }
        },
        // G54..59: Coordinate System Select
        'G54': () => {
            if (this.modal.wcs !== 'G54') {
                this.setModal({ wcs: 'G54' });
            }
        },
        'G55': () => {
            if (this.modal.wcs !== 'G55') {
                this.setModal({ wcs: 'G55' });
            }
        },
        'G56': () => {
            if (this.modal.wcs !== 'G56') {
                this.setModal({ wcs: 'G56' });
            }
        },
        'G57': () => {
            if (this.modal.wcs !== 'G57') {
                this.setModal({ wcs: 'G57' });
            }
        },
        'G58': () => {
            if (this.modal.wcs !== 'G58') {
                this.setModal({ wcs: 'G58' });
            }
        },
        'G59': () => {
            if (this.modal.wcs !== 'G59') {
                this.setModal({ wcs: 'G59' });
            }
        },
        // G80: Cancel Canned Cycle
        'G80': () => {
            if (this.modal.motion !== 'G80') {
                this.setModal({ motion: 'G80' });
            }
        },
        // G90: Set to Absolute Positioning
        // Example
        //   G90
        // All coordinates from now on are absolute relative to the origin of the machine.
        'G90': () => {
            if (this.modal.distance !== 'G90') {
                this.setModal({ distance: 'G90' });
            }
        },
        // G91: Set to Relative Positioning
        // Example
        //   G91
        // All coordinates from now on are relative to the last position.
        'G91': () => {
            if (this.modal.distance !== 'G91') {
                this.setModal({ distance: 'G91' });
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
        'G92': (params) => {
            // A G92 without coordinates will reset all axes to zero.
            if ((params.X === undefined) && (params.Y === undefined) && (params.Z === undefined)) {
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
                    const zmm = this.translateX(params.Z, false);
                    this.offsets.z += this.position.z - zmm;
                    this.position.z = zmm;
                }
            }
        },
        // G92.1: Cancel G92 offsets
        // Parameters
        //   none
        'G92.1': (params) => {
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
        'G93': () => {
            if (this.modal.feedmode !== 'G93') {
                this.setModal({ feedmode: 'G93' });
            }
        },
        // G94: Units per Minute Mode
        // In units per minute feed rate mode, an F word on the line is interpreted to mean the
        // controlled point should move at a certain number of inches per minute,
        // millimeters per minute or degrees per minute, depending upon what length units
        // are being used and which axis or axes are moving.
        'G94': () => {
            if (this.modal.feedmode !== 'G94') {
                this.setModal({ feedmode: 'G94' });
            }
        },
        // G94: Units per Revolution Mode
        // In units per rev feed rate mode, an F word on the line is interpreted to mean the
        // controlled point should move at a certain number of inches per spindle revolution,
        // millimeters per spindle revolution or degrees per spindle revolution, depending upon
        // what length units are being used and which axis or axes are moving.
        'G95': () => {
            if (this.modal.feedmode !== 'G95') {
                this.setModal({ feedmode: 'G95' });
            }
        },
        // M0: Program Pause
        'M0': () => {
            if (this.modal.program !== 'M0') {
                this.setModal({ program: 'M0' });
            }
        },
        // M1: Program Pause
        'M1': () => {
            if (this.modal.program !== 'M1') {
                this.setModal({ program: 'M1' });
            }
        },
        // M2: Program End
        'M2': () => {
            if (this.modal.program !== 'M2') {
                this.setModal({ program: 'M2' });
            }
        },
        // M30: Program End
        'M30': () => {
            if (this.modal.program !== 'M30') {
                this.setModal({ program: 'M30' });
            }
        },
        // Spindle Control
        // M3: Start the spindle turning clockwise at the currently programmed speed
        'M3': (params) => {
            if (this.modal.spindle !== 'M3') {
                this.setModal({ spindle: 'M3' });
            }
        },
        // M4: Start the spindle turning counterclockwise at the currently programmed speed
        'M4': (params) => {
            if (this.modal.spindle !== 'M4') {
                this.setModal({ spindle: 'M4' });
            }
        },
        // M5: Stop the spindle from turning
        'M5': () => {
            if (this.modal.spindle !== 'M5') {
                this.setModal({ spindle: 'M5' });
            }
        },
        // M6: Tool Change
        'M6': (params) => {
            if (params && params.T !== undefined) {
                this.setModal({ tool: params.T });
            }
        },
        // Coolant Control
        // M7: Turn mist coolant on
        'M7': () => {
            const coolants = this.modal.coolant.split(',');
            if (coolants.indexOf('M7') >= 0) {
                return;
            }

            this.setModal({
                coolant: coolants.indexOf('M8') >= 0 ? 'M7,M8' : 'M7'
            });
        },
        // M8: Turn flood coolant on
        'M8': () => {
            const coolants = this.modal.coolant.split(',');
            if (coolants.indexOf('M8') >= 0) {
                return;
            }

            this.setModal({
                coolant: coolants.indexOf('M7') >= 0 ? 'M7,M8' : 'M8'
            });
        },
        // M9: Turn all coolant off
        'M9': () => {
            if (this.modal.coolant !== 'M9') {
                this.setModal({ coolant: 'M9' });
            }
        },
        'T': (tool) => {
            if (tool !== undefined) {
                this.setModal({ tool: tool });
                if (this.collate) {
                    this.vmState.tools.add(`T${tool}`);
                }
            }
        }
    };

    constructor(options) {
        super();
        const { addLine = noop, addArcCurve = noop, addCurve = noop, callback = noop, collate = false } = options;
        this.fn = { addLine, addArcCurve, addCurve, callback };
        this.collate = collate;

        if (this.collate) {
            this.vmState.feedrates = new Set();
            this.vmState.tools = new Set();
            this.vmState.spindle = new Set();
        }
    }

    partitionWordsByGroup(words = []) {
        const groups = [];

        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const letter = word[0];

            if ((letter === 'G') || (letter === 'M') || (letter === 'T')) {
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
    fromPairs(pairs) {
        let index = -1;
        const length = (!pairs) ? 0 : pairs.length;
        const result = {};

        while (++index < length) {
            const pair = pairs[index];
            result[pair[0]] = pair[1];
        }

        return result;
    }


    virtualize(line = '') {
        if (!line) {
            this.fn.callback();
            return;
        }

        line = line
            .replace(this.re1, '')
            .replace(this.re2, '')
            .replace(this.re3, '');

        if (line === '') {
            return;
        }

        const parsedLine = parseLine(line);
        // collect spindle and feed rates
        for (let word of parsedLine.words) {
            const letter = word[0];
            const code = word[1];
            if (letter === 'F') {
                this.feed = code;
                this.vmState.feedrates.add(`F${code}`);
            }
            if (letter === 'S') {
                this.vmState.spindle.add(`S${code}`);
            }
        }

        const groups = this.partitionWordsByGroup(parsedLine.words);
        for (let i = 0; i < groups.length; ++i) {
            const words = groups[i];
            const word = words[0] || [];
            const letter = word[0];
            const code = word[1];
            let cmd = '';
            let args = {};

            if (letter === 'G') {
                cmd = (letter + code);
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
                if (code === 0 || code === 1 || code === 2 || code === 3 || code === 38.2 || code === 38.3 || code === 38.4 || code === 38.5) {
                    this.motionMode = cmd;
                } else if (code === 80) {
                    this.motionMode = '';
                }
            } else if (letter === 'M') {
                cmd = (letter + code);
                args = this.fromPairs(words.slice(1));
            } else if (letter === 'T') { // T1 ; w/o M6
                cmd = letter;
                args = code;
            } else if (letter === 'S') {
                cmd = letter;
                args = code;
            } else if (letter === 'X' || letter === 'Y' || letter === 'Z' || letter === 'A' || letter === 'B' || letter === 'C' || letter === 'I' || letter === 'J' || letter === 'K') {
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
        this.totalLines += 1;
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
        };
    }

    offsetG92 = (pos) => {
        return {
            x: pos.x + this.offsets.x,
            y: pos.y + this.offsets.y,
            z: pos.z + this.offsets.z,
            a: pos.a + this.offsets.a,
        };
    }

    setModal(modal) {
        this.modal = {
            ...this.modal,
            ...modal
        };
        return this.modal;
    }

    isMetricUnits() { // mm
        return this.modal.units === 'G21';
    }

    isImperialUnits() { // inches
        return this.modal.units === 'G20';
    }

    isAbsoluteDistance() {
        return this.modal.distance === 'G90';
    }

    isRelativeDistance() {
        return this.modal.distance === 'G91';
    }

    isXYPlane() {
        return this.modal.plane === 'G17';
    }

    isZXPlane() {
        return this.modal.plane === 'G18';
    }

    isYZPlane() {
        return this.modal.plane === 'G19';
    }

    setPosition(...pos) {
        if (typeof pos[0] === 'object') {
            const { x, y, z, a } = { ...pos[0] };
            this.position.x = (typeof x === 'number') ? x : this.position.x;
            this.position.y = (typeof y === 'number') ? y : this.position.y;
            this.position.z = (typeof z === 'number') ? z : this.position.z;
            this.position.a = (typeof a === 'number') ? a : this.position.a;
        } else {
            const [x, y, z, a] = pos;
            this.position.x = (typeof x === 'number') ? x : this.position.x;
            this.position.y = (typeof y === 'number') ? y : this.position.y;
            this.position.z = (typeof z === 'number') ? z : this.position.z;
            this.position.a = (typeof a === 'number') ? a : this.position.a;
        }
    }

    translateX(x, relative) {
        if (x !== undefined) {
            x = this.isImperialUnits() ? in2mm(x) : x;
        }
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.x, x, !!relative);
    }

    translateY(y, relative) {
        if (y !== undefined) {
            y = this.isImperialUnits() ? in2mm(y) : y;
        }
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.y, y, !!relative);
    }

    translateZ(z, relative) {
        if (z !== undefined) {
            z = this.isImperialUnits() ? in2mm(z) : z;
        }
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.z, z, !!relative);
    }

    translateA(a, relative) {
        if (relative === undefined) {
            relative = this.isRelativeDistance();
        }
        return translatePosition(this.position.a, a, !!relative);
    }

    translateI(i) {
        return this.translateX(i, true);
    }

    translateJ(j) {
        return this.translateY(j, true);
    }

    translateK(k) {
        return this.translateZ(k, true);
    }

    translateR(r) {
        r = Number(r);
        if (Number.isNaN(r)) {
            return 0;
        }
        return this.isImperialUnits() ? in2mm(r) : r;
    }

    updateBounds(position) {
        const { x, y, z } = position;

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
        if (z < this.minBounds[0]) {
            this.minBounds[2] = z;
        }
    }

    getBBox() {
        const [minX, minY, minZ] = this.minBounds;
        const [maxX, maxY, maxZ] = this.maxBounds;

        return {
            min: {
                x: minX,
                y: minY,
                z: minZ
            },
            max: {
                x: maxX,
                y: maxY,
                z: maxZ
            },
            delta: {
                x: maxX - minX,
                y: maxY - minY,
                z: maxZ - minZ
            }
        };
    }

    calculateMachiningTime(endPos) {
        // assumption:  750/s^2 acceleration, TODO: Look at eeprom/configure
        const ACCELERATION = 750;

        let moveDuration = 0;
        // Convert to metric
        const feed = this.modal.units === 'G20' ? this.feed * 25.4 : this.feed;

        // mm/s to mm/m
        const f = feed / 60;

        const dx = endPos.x - this.position.x;
        const dy = endPos.y - this.position.y;

        let travel = Math.hypot(dx, dy);
        if (Number.isNaN(travel)) {
            console.error('Invalid travel while calculating distance between V1 and V2');
            return;
        }

        // Look for Z movement if no X/Y movement
        if (travel === 0) {
            if (endPos.z !== this.position.z) {
                travel = Math.abs(endPos.z - this.position.z);
            }
        }

        if (f === this.lastF) {
            moveDuration = f !== 0 ? (travel / f) : 0;
        } else {
            const distance = 2 * Math.abs(((this.lastF + f) * (f - this.lastF) * 0.5) / ACCELERATION);
            if (distance < travel && (this.lastF + f !== 0) && f !== 0) {
                moveDuration = 2 * distance / (this.lastF + f);
                moveDuration += (travel - distance) / f;
            } else {
                moveDuration = 2 * (travel / (this.lastF + f));
            }
        }

        this.lastF = f;
        this.totalTime += moveDuration;
    }
}


export default GCodeVirtualizer;
