import {
    PROBE_TYPE_AUTO,
    PROBE_TYPE_TIP,
    PROBE_TYPES,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_3D_TOUCH,
} from './constants';
import { GRBLHAL, METRIC_UNITS } from '../constants';
import { mm2in } from './units';
import { UNITS_GCODE } from 'app/definitions/general';
import { AXES_T } from 'app/features/Axes/definitions';
import {
    PROBE_DIRECTIONS,
    ProbingOptions,
    PROBE_TYPES_T,
} from 'app/features/Probe/definitions';

export const BL = 0;
export const TL = 1;
export const TR = 2;
export const BR = 3;

// 0 is default (bottom left), moves clockwise
export const probeDirections = [BL, TL, TR, BR];

// Returns which direction to probe in for X and Y - positive or negative
export const getProbeDirections = (
    corner: PROBE_DIRECTIONS,
): [number, number] => {
    if (corner === BL) {
        return [1, 1];
    } else if (corner === TL) {
        return [1, -1];
    } else if (corner === TR) {
        return [-1, -1];
    } else if (corner === BR) {
        return [-1, 1];
    }
    return [0, 0];
};

// Setup variables for probing and
export const getPreamble = (options: ProbingOptions): Array<string> => {
    const {
        modal,
        xRetractModifier,
        yRetractModifier,
        axes,
        xProbeDistance,
        yProbeDistance,
        zProbeDistance,
        probeFast,
        probeSlow,
        zThickness,
        xThickness,
        yThickness,
        xRetract,
        yRetract,
        zRetract,
        firmware,
        xyPositionAdjust,
        zPositionAdjust,
    } = options;
    let initialOffsets = 'G10 L20 P0 ';

    const probeDelay = firmware === GRBLHAL ? 0.05 : 0.15;

    // Add axes to initial zeroing
    Object.keys(axes).forEach((axis) => {
        if (axes[axis as keyof typeof axes]) {
            initialOffsets += `${axis.toUpperCase()}0`;
        }
    });

    return [
        '; Initial Probe setup',
        '%UNITS=modal.units',
        '%DWELL=0.3',
        `%Z_ADJUST=${zPositionAdjust}`,
        `%X_ADJUST=${xyPositionAdjust}`,
        `%Y_ADJUST=${xyPositionAdjust}`,
        `%X_PROBE_DISTANCE=${xProbeDistance}`,
        `%Y_PROBE_DISTANCE=${yProbeDistance}`,
        `%Z_PROBE_DISTANCE=${zProbeDistance}`,
        `%PROBE_FAST_FEED=${probeFast}`,
        `%PROBE_SLOW_FEED=${probeSlow}`,
        `%X_RETRACT_DISTANCE=${xRetract}`,
        `%Y_RETRACT_DISTANCE=${yRetract}`,
        `%Z_RETRACT_DISTANCE=${zRetract}`,
        `%Z_THICKNESS=${zThickness}`,
        `%X_THICKNESS=${xThickness}`,
        `%Y_THICKNESS=${yThickness}`,
        `%PROBE_DELAY=${probeDelay}`,
        `%Y_RETRACT_DIRECTION=${yRetractModifier}`,
        `%X_RETRACT_DIRECTION=${xRetractModifier}`,
        `${initialOffsets}`,
        `G91 G${modal}`,
    ];
};

/*
    Variables:
    PROBE_DISTANCE: Distance to probe in a direction
    PROBE_FAST_SPEED: Fast Speed
    PROBE_SLOW_SPEED: Slow speed
    PROBE_RETRACT - Distance to retract after touch
    Z_THICKNESS - Probe plate Z thickness
    XY_THICKNESS - Probe plate XY thickness - PRE COMPENSATE FOR TOOL THICKNESS
    TOOL_DIAMETER - Tool diameter
    UNITS - prior units
 */
const updateOptionsForDirection = (
    options: ProbingOptions,
    direction: PROBE_DIRECTIONS,
): ProbingOptions => {
    const { units, toolDiameter } = options;
    options.direction = direction;
    const [xProbeDir, yProbeDir] = getProbeDirections(direction);
    const xRetractModifier = xProbeDir * -1;
    const yRetractModifier = yProbeDir * -1;
    options.xRetractModifier = xRetractModifier;
    options.yRetractModifier = yRetractModifier;

    // Setup probe directions and distances
    options.xProbeDistance = options.probeDistances.x * xProbeDir;
    options.zProbeDistance = options.probeDistances.z * -1;
    options.yProbeDistance = options.probeDistances.y * yProbeDir;

    // Setup retractions to be opposite of probe direction
    options.xRetract = options.retract * xRetractModifier;
    options.yRetract = options.retract * yRetractModifier;
    options.zRetract = options.retract;

    // Alter thickness for X and Y by tool diameter
    const toolRadius = (toolDiameter as number) / 2;
    const toolCompensatedXY = Number(
        (-1 * toolRadius - options.xyThickness).toFixed(3),
    );
    options.yThickness = toolCompensatedXY * yProbeDir;
    options.xThickness = toolCompensatedXY * xProbeDir;

    // Figure out movement distances for getting bit into position
    let xyMovement = (toolDiameter as number) + 20;
    options.xyPositionAdjust =
        units === METRIC_UNITS
            ? xyMovement
            : Number(mm2in(xyMovement).toFixed(3));
    options.zPositionAdjust =
        units === METRIC_UNITS ? 15 : Number(mm2in(15).toFixed(3));

    return options;
};

export const getSingleAxisStandardRoutine = (axis: AXES_T): Array<string> => {
    axis = axis.toUpperCase();
    let axisRetract = `${axis}_RETRACT_DISTANCE`;
    const code = [
        `; ${axis}-probe`,
        `G38.2 ${axis}[${axis}_PROBE_DISTANCE] F[PROBE_FAST_FEED]`,
        `G91 G0 ${axis}[${axisRetract}]`,
        `G38.2 ${axis}[${axis}_PROBE_DISTANCE] F[PROBE_SLOW_FEED]`,
        'G4 P[DWELL]',
        `G10 L20 P0 ${axis}[${axis}_THICKNESS]`,
        `G0 ${axis}[${axis}_RETRACT_DISTANCE]`,
    ];

    return code;
};

export const get3AxisStandardRoutine = (
    options: ProbingOptions,
): Array<string> => {
    const code: Array<string> = [];

    code.push(...getPreamble(options));
    const { axes } = options;

    // invalid axes, we go next
    if (typeof axes !== 'object') {
        return [];
    }

    if (axes.z) {
        code.push(...getSingleAxisStandardRoutine('Z'));
        // Z also handles positioning for next probe on X
        code.push(
            'G91 G0 X[X_ADJUST * X_RETRACT_DIRECTION]',
            'G0 Z-[Z_ADJUST]',
        );
    }
    if (axes.x) {
        // Move into position for X
        // We start at different location for
        if (!axes.z) {
            code.push(
                'G0 X[X_RETRACT_DISTANCE] Y[Y_RETRACT_DISTANCE]',
                'G0 Y[Y_ADJUST * -1 * Y_RETRACT_DIRECTION]',
            );
        }

        // Probe X
        code.push(...getSingleAxisStandardRoutine('X'));
    }
    if (axes.y) {
        // Move into position for Y
        code.push(
            'G0 X[X_RETRACT_DISTANCE * 2]',
            'G0 Y[Y_ADJUST * Y_RETRACT_DIRECTION]',
            'G0 X[X_ADJUST * -1 * X_RETRACT_DIRECTION]',
        );

        // Probe Y
        code.push(...getSingleAxisStandardRoutine('Y'));
    }
    // Move back to original position
    code.push('G0 Z[Z_ADJUST + Z_RETRACT_DISTANCE]', 'G90 G0 X0Y0');
    return code;
};

const determineAutoPlateOffsetValues = (
    direction: PROBE_DIRECTIONS,
    diameter: PROBE_TYPES_T | number = null,
): [number, number] => {
    let xOff = 22.5;
    let yOff = 22.5;

    if (diameter && !(diameter in PROBE_TYPES)) {
        // math to compensate for tool
        const toolRadius = (diameter as number) / 2;
        xOff -= toolRadius;
        yOff -= toolRadius;
    }

    if (direction === BR) {
        return [xOff * -1, yOff];
    } else if (direction === TR) {
        return [xOff * -1, yOff * -1];
    } else if (direction === TL) {
        return [xOff, yOff * -1];
    }

    return [xOff, yOff];
};

export const get3AxisAutoRoutine = ({
    axes,
    $13,
    direction,
    firmware,
}: ProbingOptions): Array<string> => {
    const code: Array<string> = [];
    const p = 'P0';

    const probeDelay = firmware === GRBLHAL ? 0.05 : 0.15;

    const [xOff, yOff] = determineAutoPlateOffsetValues(direction);

    let prependUnits: UNITS_GCODE | '' = '';
    if ($13 === '1') {
        prependUnits = 'G20';
    }

    if (axes.x && axes.y && axes.z) {
        code.push(
            `; Probe XYZ Auto Endmill - direction: ${direction}`,
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            `%PROBE_DELAY=${probeDelay}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P[PROBE_DELAY]',
            'G10 L20 P0 Z5',
            'G21 G91 G0 Z3',
            'G21 G91 G0 X-13',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P[PROBE_DELAY]',
            '%X_LEFT=posx',
            //'G10 L20 P0 X0',
            'G21 G91 G0 X26',
            'G38.2 X30 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P[PROBE_DELAY]',
            '%X_RIGHT=posx',
            '%X_CENTER=((X_RIGHT - X_LEFT)/2)*-1',
            `${prependUnits} G91 G0 X[X_CENTER]`,
            'G21 G91 G0 Y-13',
            'G38.2 Y-30 F250',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P[PROBE_DELAY]',
            '%Y_BOTTOM = posy',
            'G21 G91 G0 Y26',
            'G38.2 Y30 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P[PROBE_DELAY]',
            '%Y_TOP = posy',
            '%Y_CENTER = ((Y_TOP - Y_BOTTOM)/2) * -1',
            `${prependUnits} G0 Y[Y_CENTER]`,
            'G21 G10 L20 P0 X[X_OFF] Y[Y_OFF]',
            'G21 G90 G0 X0 Y0',
            'G21 G0 G90 Z1',
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY Auto Endmill',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            `%PROBE_DELAY=${probeDelay}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G21 G91 G0 X-13',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X0`,
            'G21 G91 G0 X26',
            'G38.2 X30 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} X[posx/2]`,
            `${prependUnits} G90 G0 X0`,
            'G21 G91 G0 Y-13',
            'G38.2 Y-30 F150',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y0`,
            'G21 G91 G0 Y26',
            'G38.2 Y30 F150',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} Y[posy/2]`,
            'G21 G90 G0 X0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF] Y[Y_OFF]`,
            'G21 G90 G0 X0 Y0',
        );
    } else if (axes.z) {
        code.push(
            '; Probe Z Auto Endmill',
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G21 G91 G0 Z5',
        );
    } else if (axes.x) {
        code.push(
            '; Probe X Auto Endmill',
            `%X_OFF = ${xOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G21 G91 G0 X-13',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X0`,
            'G21 G91 G0 X26',
            'G38.2 X30 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} X[posx/2]`,
            'G21 G90 G0 X0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF]`,
        );
    } else if (axes.y) {
        code.push(
            '; Probe Y Auto Endmill',
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G21 G91 G0 Y-13',
            'G38.2 Y-30 F150',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y0`,
            'G21 G91 G0 Y26',
            'G38.2 Y30 F150',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} Y[posy/2]`,
            'G21 G90 G0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} Y[Y_OFF]`,
        );
    }

    return code;
};

export const get3AxisAutoTipRoutine = ({
    axes,
    $13,
    direction,
    firmware,
}: ProbingOptions): Array<string> => {
    const code: Array<string> = [];
    const p = 'P0';

    const probeDelay = firmware === GRBLHAL ? 0.05 : 0.15;

    const [xOff, yOff] = determineAutoPlateOffsetValues(direction);

    let prependUnits: UNITS_GCODE | '' = '';
    if ($13 === '1') {
        prependUnits = 'G20';
    }

    if (axes.x && axes.y && axes.z) {
        code.push(
            '; Probe XYZ Auto Tip',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            `%PROBE_DELAY=${probeDelay}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P[PROBE_DELAY]',
            `G10 L20 ${p} Z5`,
            'G21 G91 G0 Z0.5',
            'G21 G91 G0 X-3',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P[PROBE_DELAY]',
            '%X_LEFT=posx',
            'G21 G91 G0 X14',
            'G38.2 X15 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P[PROBE_DELAY]',
            '%X_RIGHT=posx',
            '%X_CENTER=((X_RIGHT - X_LEFT)/2)*-1',
            `${prependUnits} G91 G0 X[X_CENTER]`,
            'G21 G91 G0 Y-3',
            'G38.2 Y-15 F150',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P[PROBE_DELAY]',
            '%Y_BOTTOM = posy',
            //`G10 L20 ${p} Y0`,
            'G21 G91 G0 Y14',
            'G38.2 Y15 F150',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P[PROBE_DELAY]',
            '%Y_TOP = posy',
            '%Y_CENTER = ((Y_TOP - Y_BOTTOM)/2) * -1',
            `${prependUnits} G0 Y[Y_CENTER]`,
            'G21 G10 L20 P0 X[X_OFF] Y[Y_OFF]',
            'G21 G90 G0 X0 Y0',
            'G21 G0 G90 Z1',
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY Auto Tip',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z0.5',
            'G21 G91 G0 X-3',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X0`,
            'G21 G91 G0 X14',
            'G38.2 X15 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} X[posx/2]`,
            `${prependUnits} G90 G0 X0`,
            'G21 G91 G0 Y-3',
            'G38.2 Y-15 F150',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P0.1',
            `G10 L20 ${p} Y0`,
            'G21 G91 G0 Y14',
            'G38.2 Y15 F150',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} Y[posy/2]`,
            `${prependUnits} G90 G0 X0 Y0`,
            'G4 P0.15',
            `G21 G10 L20 ${p} X[X_OFF] Y[Y_OFF]`,
            'G21 G90 G0 X0 Y0',
        );
    } else if (axes.z) {
        code.push(
            '; Probe Z Auto Tip',
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G4 P0.15',
            'G21 G91 G0 Z1',
        );
    } else if (axes.x) {
        code.push(
            '; Probe X Auto Tip',
            `%X_OFF = ${xOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z0.5',
            'G21 G91 G0 X-3',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X0`,
            'G21 G91 G0 X14',
            'G38.2 X15 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} X[posx/2]`,
            'G21 G90 G0 X0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF]`,
        );
    } else if (axes.y) {
        code.push(
            '; Probe Y Auto Tip',
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z0.5',
            'G21 G91 G0 Y-3',
            'G38.2 Y-15 F150',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P0.1',
            `G10 L20 ${p} Y0`,
            'G21 G91 G0 Y14',
            'G38.2 Y15 F150',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `${prependUnits} G10 L20 ${p} Y[posy/2]`,
            'G21 G90 G0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} Y[Y_OFF]`,
        );
    }

    return code;
};

export const get3AxisAutoDiameterRoutine = ({
    axes,
    direction,
    toolDiameter,
}: ProbingOptions): Array<string> => {
    const code: Array<string> = [];
    const p = 'P0';

    const [xOff, yOff] = determineAutoPlateOffsetValues(
        direction,
        toolDiameter,
    );

    // const toolRadius = (diameter / 2);
    // const toolCompensatedThickness = ((-1 * toolRadius));
    // console.log(toolCompensatedThickness);

    if (axes.z && axes.y && axes.z) {
        code.push(
            '; Probe XYZ AutoZero Specific Diameter',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G21 G91 G0 Z2',
            'G21 G91 G0 X13',
            'G38.2 X20 F250',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X19.325`,
            'G21 G90 G0 X0',
            'G21 G91 G0 Y13',
            'G38.2 Y20 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y19.325`,
            'G21 G90 G0 X0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF] Y[Y_OFF]`,
            'G21 G90 G0 X0 Y0',
            'G21 G90 G0 Z1',
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY AutoZero Specific Diameter',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G21 G91 G0 X13',
            'G38.2 X20 F250',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X19.325`,
            'G21 G90 G0 X0',
            'G21 G91 G0 Y13',
            'G38.2 Y20 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y19.325`,
            'G21 G90 G0 X0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF] Y[Y_OFF]`,
            'G4 P0.15',
            'G21 G90 G0 X0 Y0',
        );
    } else if (axes.z) {
        code.push(
            '; Probe Z AutoZero Specific Diameter',
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G4 P0.15',
            'G21 G91 G0 Z2',
        );
    } else if (axes.y) {
        code.push(
            '; Probe Y',
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G21 G91 G0 Y13',
            'G38.2 Y20 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y19.325`,
            'G21 G90 G0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} Y[Y_OFF]`,
        );
    } else if (axes.x) {
        code.push(
            '; Probe X',
            `%X_OFF = ${xOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G21 G91 G0 X13',
            'G38.2 X20 F250',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X19.325`,
            'G21 G90 G0 X0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF]`,
        );
    }

    return code;
};

export const get3DTouchProbeRoutine = (
    options: ProbingOptions,
    probeCommand?: string,
    centerProbeParams?: any,
): Array<string> => {
    const { axes, ballDiameter = 2, zPlungeDistance = 2, zProbeDistance } = options;
    const code: Array<string> = [];
    const ballRadius = ballDiameter / 2;
    
    const processedOptions = {
        ...options,
        toolDiameter: ballDiameter,
        direction: options.direction || 0,
        retract: 4,
        xyThickness: 0,
        zThickness: 0,
    };
    
    const standardProcessedOptions = updateOptionsForDirection(processedOptions, processedOptions.direction);

    if (probeCommand === 'Center') {
        const materialX = centerProbeParams?.workpieceDimensions?.x || 50;
        const materialY = centerProbeParams?.workpieceDimensions?.y || 50;
        
        const probeZ = centerProbeParams?.probeZ || false;
        const debugCode = [
            `; DEBUG: centerProbeParams = ${JSON.stringify(centerProbeParams)}`,
            `; DEBUG: materialX = ${materialX}, materialY = ${materialY}`,
            `; DEBUG: probeZ = ${probeZ}`,
        ];
        code.push(...debugCode);
        
        const halfX = materialX / 2;
        const halfY = materialY / 2;
        const clearance = 10;
        
        const rapidFeed = 2000;
        const searchFeed = 150;
        const latchFeed = 75;
        const latchDistance = 3;
        
        const leftPos = halfX + clearance;
        const rightPos = halfX + clearance;
        const backPos = halfY + clearance;
        const frontPos = halfY + clearance;
        const zDown = -(zPlungeDistance + 5);
        
        const safeZHeight = probeZ ? '5' : '[START_Z + 5]';
        
        const centerCode = [
            '%START_X=posx',
            '%START_Y=posy',
            '%START_Z=posz',
            `%BALL_RADIUS=${ballRadius}`,
            `%SEARCH_FEED=${searchFeed}`,
            `%LATCH_FEED=${latchFeed}`,
            'G90',
        ];
        
        if (probeZ) {
            centerCode.push(
                'G90 G0 Z[START_Z + 5]',
                'G38.2 Z-25 F200',
                'G21 G91 G0 Z2',
                'G38.2 Z-3 F75',
                'G4 P0.3',
                'G10 L20 P0 Z0',
                'G0 Z5'
            );
        } else {
            centerCode.push('G90 G0 Z[START_Z + 5]');
        }
        
        centerCode.push(
            `G90 G0 X[START_X - ${leftPos}]`,
            `G91 G0 Z${zDown}`,
            `G38.2 X${leftPos + 10} F[SEARCH_FEED]`,
            'G0 X-2',
            `G38.2 X3 F[LATCH_FEED]`,
            'G4 P0.3',
            '%X_LEFT=[posx - BALL_RADIUS]',
            'G91 G0 X-3',
            `G90 G0 Z${safeZHeight}`,
            'G90 G0 X[START_X] Y[START_Y]',
            
            `G90 G0 X[START_X + ${rightPos}]`,
            `G91 G0 Z${zDown}`,
            `G38.2 X-${rightPos + 10} F[SEARCH_FEED]`,
            'G0 X2',
            `G38.2 X-3 F[LATCH_FEED]`,
            'G4 P0.3',
            '%X_RIGHT=[posx + BALL_RADIUS]',
            'G91 G0 X3',
            `G90 G0 Z${safeZHeight}`,
            'G90 G0 X[START_X] Y[START_Y]',
            
            `G90 G0 Y[START_Y - ${backPos}]`,
            `G91 G0 Z${zDown}`,
            `G38.2 Y${backPos + 10} F[SEARCH_FEED]`,
            'G0 Y-2',
            `G38.2 Y3 F[LATCH_FEED]`,
            'G4 P0.3',
            '%Y_BACK=[posy - BALL_RADIUS]',
            'G91 G0 Y-3',
            `G90 G0 Z${safeZHeight}`,
            'G90 G0 X[START_X] Y[START_Y]',
            
            `G90 G0 Y[START_Y + ${frontPos}]`,
            `G91 G0 Z${zDown}`,
            `G38.2 Y-${frontPos + 10} F[SEARCH_FEED]`,
            'G0 Y2',
            `G38.2 Y-3 F[LATCH_FEED]`,
            'G4 P0.3',
            '%Y_FRONT=[posy + BALL_RADIUS]',
            'G91 G0 Y3',
            `G90 G0 Z${safeZHeight}`,
            'G90 G0 X[START_X] Y[START_Y]',
            
            '%CENTER_X=[(X_LEFT + X_RIGHT) / 2]',
            '%CENTER_Y=[(Y_BACK + Y_FRONT) / 2]',
            'G0 X[CENTER_X] Y[CENTER_Y]',
            'G10 L20 P0 X0 Y0'
        );
        
        code.push(...centerCode);
        return code;
    } else if (axes.x && axes.y && axes.z) {
        code.push(
            `%BALL_RADIUS=${ballRadius}`,
            `%Z_PLUNGE_DISTANCE=${zPlungeDistance}`,
        );
        
        const customOptions = {
            ...standardProcessedOptions,
            zPositionAdjust: standardProcessedOptions.zRetract + Math.abs(zPlungeDistance)
        };
        
        code.push(...get3AxisStandardRoutine(customOptions));
    } else if (axes.x && axes.y) {
        code.push(
            `%BALL_RADIUS=${ballRadius}`,
            `%Z_PLUNGE_DISTANCE=${zPlungeDistance}`,
        );
        code.push(...get3AxisStandardRoutine(standardProcessedOptions));
    } else if (axes.z) {
        code.push(...getPreamble(standardProcessedOptions));
        code.push(...getSingleAxisStandardRoutine('Z'));
    } else if (axes.x) {
        code.push(
            `%BALL_RADIUS=${ballRadius}`,
            `%Z_PLUNGE_DISTANCE=${zPlungeDistance}`,
        );
        code.push(...getPreamble(standardProcessedOptions));
        code.push(...getSingleAxisStandardRoutine('X'));
    } else if (axes.y) {
        code.push(
            `%BALL_RADIUS=${ballRadius}`,
            `%Z_PLUNGE_DISTANCE=${zPlungeDistance}`,
        );
        code.push(...getPreamble(standardProcessedOptions));
        code.push(...getSingleAxisStandardRoutine('Y'));
    }

    return code;
};

export const getNextDirection = (
    direction: PROBE_DIRECTIONS,
): PROBE_DIRECTIONS => {
    if (direction === 3) {
        return 0;
    }
    return Number(direction) + 1;
};

// Master function - given selected routine, determine which probe code to return for a specific direction
export const getProbeCode = (
    options: ProbingOptions,
    direction: PROBE_DIRECTIONS = 0,
    probeCommandId?: string,
    centerProbeParams?: any,
): Array<string> => {
    const { plateType, axes, probeType } = options;

    //let axesCount = Object.values(axes).reduce((a, item) => a + item, 0);

    if (plateType === TOUCHPLATE_TYPE_AUTOZERO) {
        if (probeType === PROBE_TYPE_AUTO) {
            return get3AxisAutoRoutine({
                ...options,
                direction,
            });
        } else if (probeType === PROBE_TYPE_TIP) {
            return get3AxisAutoTipRoutine({
                ...options,
                direction,
            });
        } else {
            return get3AxisAutoDiameterRoutine({ ...options, direction });
        }
    }

    if (plateType === TOUCHPLATE_TYPE_3D_TOUCH) {
        return get3DTouchProbeRoutine({ ...options, direction }, probeCommandId, centerProbeParams);
    }

    // Standard plate, we modify some values for specific directions
    options = updateOptionsForDirection(options, direction);

    // Handle regular touchplate
    if (axes.x && axes.y && axes.z) {
        return get3AxisStandardRoutine(options);
    } else if (axes.x && axes.y) {
        return get3AxisStandardRoutine(options);
    } else if (axes.z) {
        return [...getPreamble(options), ...getSingleAxisStandardRoutine('Z')];
    } else if (axes.y) {
        return [...getPreamble(options), ...getSingleAxisStandardRoutine('Y')];
    } else if (axes.x) {
        return [...getPreamble(options), ...getSingleAxisStandardRoutine('X')];
    }

    // Default do nothing bc we don't recognize the options
    return [];
};
