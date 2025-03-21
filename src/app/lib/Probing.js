import { TOUCHPLATE_TYPE_AUTOZERO } from 'app/lib/constants';
import { GRBLHAL, IMPERIAL_UNITS, METRIC_UNITS } from '../constants';
import { mm2in } from 'app/lib/units';

export const BL = 0;
export const TL = 1;
export const TR = 2;
export const BR = 3;


// 0 is default (bottom left), moves clockwise
export const probeDirections = [BL, TL, TR, BR];

// Returns which direction to probe in for X and Y - positive or negative
export const getProbeDirections = (corner) => {
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
export const getPreamble = (options) => {
    if (typeof options !== 'object') {
        return [];
    }
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
        zPositionAdjust
    } = options;
    let initialOffsets = 'G10 L20 P0 ';

    const probeDelay = firmware === GRBLHAL ? 0.05 : 0.15;

    // Add axes to initial zeroing
    Object.keys(axes).forEach(axis => {
        if (axes[axis]) {
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
        `G91 G${modal}`
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
const updateOptionsForDirection = (options, direction) => {
    const { units, toolDiameter } = options;
    options.direction = direction;
    const [xProbeDir, yProbeDir] = getProbeDirections(direction);
    const xRetractModifier = xProbeDir * -1;
    const yRetractModifier = yProbeDir * -1;
    options.xRetractModifier = xRetractModifier;
    options.yRetractModifier = yRetractModifier;

    // Setup probe directions and distances
    options.xProbeDistance = options.probeDistances.X * xProbeDir;
    options.zProbeDistance = options.probeDistances.Z * -1;
    options.yProbeDistance = options.probeDistances.Y * yProbeDir;

    // Setup retractions to be opposite of probe direction
    options.xRetract = options.retract * xRetractModifier;
    options.yRetract = options.retract * yRetractModifier;
    options.zRetract = options.retract;

    // Alter thickness for X and Y by tool diameter
    const toolRadius = toolDiameter / 2;
    const toolCompensatedXY = ((-1 * toolRadius) - options.xyThickness).toFixed(3);
    options.yThickness = toolCompensatedXY * yProbeDir;
    options.xThickness = toolCompensatedXY * xProbeDir;

    // Figure out movement distances for getting bit into position
    let xyMovement = toolDiameter + 20;
    options.xyPositionAdjust = (units === METRIC_UNITS) ? xyMovement : mm2in(xyMovement).toFixed(3);
    options.zPositionAdjust = (units === METRIC_UNITS) ? 15 : mm2in(15).toFixed(3);

    return options;
};

export const getSingleAxisStandardRoutine = (axis) => {
    axis = axis.toUpperCase();
    let axisRetract = `${axis}_RETRACT_DISTANCE`;
    const code = [
        `; ${axis}-probe`,
        `G38.2 ${axis}[${axis}_PROBE_DISTANCE] F[PROBE_FAST_FEED]`,
        `G91 G0 ${axis}[${axisRetract}]`,
        `G38.2 ${axis}[${axis}_PROBE_DISTANCE] F[PROBE_SLOW_FEED]`,
        'G4 P[DWELL]',
        `G10 L20 P0 ${axis}[${axis}_THICKNESS]`,
        `G0 ${axis}[${axis}_RETRACT_DISTANCE]`
    ];

    return code;
};

export const get3AxisStandardRoutine = (options) => {
    const code = [];

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
            'G0 Z-[Z_ADJUST]'
        );
    }
    if (axes.x) {
        // Move into position for X
        // We start at different location for
        if (!axes.z) {
            code.push(
                'G0 X[X_RETRACT_DISTANCE] Y[Y_RETRACT_DISTANCE]',
                'G0 Y[Y_ADJUST * -1 * Y_RETRACT_DIRECTION]'
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
            'G0 X[X_ADJUST * -1 * X_RETRACT_DIRECTION]'
        );

        // Probe Y
        code.push(...getSingleAxisStandardRoutine('Y'));
    }
    // Move back to original position
    code.push(
        'G0 Z[Z_ADJUST + Z_RETRACT_DISTANCE]',
        'G90 G0 X0Y0',
    );
    return code;
};


const determineAutoPlateOffsetValues = (direction, diameter = null) => {
    let xOff = 22.5;
    let yOff = 22.5;

    if (diameter && diameter !== 'Tip' && diameter !== 'Auto') {
        // math to compensate for tool
        const toolRadius = 0;
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

export const get3AxisAutoRoutine = ({ axes, $13, direction, firmware }) => {
    const code = [];
    const p = 'P0';

    const probeDelay = firmware === GRBLHAL ? 0.05 : 0.15;

    const [xOff, yOff] = determineAutoPlateOffsetValues(direction);

    let prependUnits = '';
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
            'G21 G91 G0 Z2.5',
            'G38.2 Z-5 F75',
            'G4 P[PROBE_DELAY]',
            'G10 L20 P0 Z5',
            'G21 G91 G0 Z2.5',
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
            'G21 G0 G90 Z1'
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY Auto Endmill',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            `%PROBE_DELAY=${probeDelay}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2.5',
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
            'G21 G91 G0 Z2.5',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G21 G91 G0 Z2.5',
        );
    } else if (axes.x) {
        code.push(
            '; Probe X Auto Endmill',
            `%X_OFF = ${xOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2.5',
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
            'G21 G91 G0 Z2.5',
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

export const get3AxisAutoTipRoutine = ({ axes, $13, direction, firmware }) => {
    const code = [];
    const p = 'P0';

    const probeDelay = firmware === GRBLHAL ? 0.05 : 0.15;

    const [xOff, yOff] = determineAutoPlateOffsetValues(direction);

    let prependUnits = '';
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
            'G21 G0 G90 Z1'
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

export const get3AxisAutoDiameterRoutine = ({ axes, direction, toolDiameter, units }) => {
    const code = [];
    const p = 'P0';

    const [xOff, yOff] = determineAutoPlateOffsetValues(direction, toolDiameter);

    // We need to reconvert diameter to mm since auto probe is entirely in mm
    if (units === IMPERIAL_UNITS) {
        toolDiameter *= 25.4;
    }

    const toolRadius = (toolDiameter / 2);
    const toolCompensatedThickness = ((-1 * toolRadius));
    // Addition because it's already negative
    const compensatedValue = 22.5 + toolCompensatedThickness;

    if (axes.z && axes.y && axes.z) {
        code.push(
            '; Probe XYZ AutoZero Specific Diameter',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2.5',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G21 G91 G0 Z2.5',
            'G21 G91 G0 X13',
            'G38.2 X20 F250',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X${compensatedValue}`,
            'G21 G90 G0 X0',
            'G21 G91 G0 Y13',
            'G38.2 Y20 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y${compensatedValue}`,
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
            'G21 G91 G0 Z2.5',
            'G21 G91 G0 X13',
            'G38.2 X20 F250',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X${compensatedValue}`,
            'G21 G90 G0 X0',
            'G21 G91 G0 Y13',
            'G38.2 Y20 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y${compensatedValue}`,
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
            'G21 G91 G0 Z2.5',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
            'G4 P0.15',
            'G21 G91 G0 Z2.5',
        );
    } else if (axes.y) {
        code.push(
            '; Probe Y',
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2.5',
            'G21 G91 G0 Y13',
            'G38.2 Y20 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Y${compensatedValue}`,
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
            'G21 G91 G0 Z2.5',
            'G21 G91 G0 X13',
            'G38.2 X20 F250',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            `G10 L20 ${p} X${compensatedValue}`,
            'G21 G90 G0 X0',
            'G4 P0.15',
            `G10 L20 ${p} X[X_OFF]`,
        );
    }

    return code;
};

export const getNextDirection = (direction) => {
    if (direction === 3) {
        return 0;
    }
    return direction + 1;
};


// Master function - given selected routine, determine which probe code to return for a specific direction
export const getProbeCode = (options, direction = 0) => {
    const {
        plateType,
        axes
    } = options;

    //let axesCount = Object.values(axes).reduce((a, item) => a + item, 0);

    if (plateType === TOUCHPLATE_TYPE_AUTOZERO) {
        if (options.toolDiameter === 'Auto') {
            return get3AxisAutoRoutine({
                ...options,
                direction
            });
        } else if (options.toolDiameter === 'Tip') {
            return get3AxisAutoTipRoutine({
                ...options,
                direction
            });
        } else {
            return get3AxisAutoDiameterRoutine({ ...options, direction });
        }
    }

    // Standard plate, we modify some values for specific directions
    options = updateOptionsForDirection(options, direction);

    // Handle regular touchplate
    if (axes.x && axes.y && axes.z) {
        return get3AxisStandardRoutine(options);
    } else if (axes.x && axes.y) {
        return get3AxisStandardRoutine(options);
    } else if (axes.z) {
        return [
            ...getPreamble(options),
            ...getSingleAxisStandardRoutine('Z')
        ];
    } else if (axes.y) {
        return [
            ...getPreamble(options),
            ...getSingleAxisStandardRoutine('Y')
        ];
    } else if (axes.x) {
        return [
            ...getPreamble(options),
            ...getSingleAxisStandardRoutine('X')
        ];
    }

    // Default do nothing bc we don't recognize the options
    return [];
};
