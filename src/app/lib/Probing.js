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


// Setup variables for probing and
export const getPreamble = (options) => {
    const { modal, axes, probeDistance, probeFast, probeSlow, probeRetract, zThickness, xyThickness } = options;
    let initialOffsets = 'G10 L20 P0 ';
    // Add axes to initial zeroing
    Object.keys(axes).forEach(axis => {
        if (axes[axis]) {
            initialOffsets += `${axis.toUpperCase()}0`;
        }
    });

    return [
        '; Initial Probe setup',
        '%UNITS=modal.units',
        '%WAIT=0.3',
        `%PROBE_DISTANCE=${probeDistance}`,
        `%PROBE_FAST_FEED=${probeFast}`,
        `%PROBE_SLOW_FEED=${probeSlow}`,
        `%PROBE_RETRACT=${probeRetract}`,
        `%Z_THICKNESS=${zThickness}`,
        `%X_THICKNESS=${xyThickness}`,
        `%Y_THICKNESS=${xyThickness}`,
        `${initialOffsets}`,
        `G91 G${modal}`
    ];
};

export const getSingleAxisStandardRoutine = (axis) => {
    axis = axis.toUpperCase();
    let axisRetract = `%[${axis}_RETRACT_DISTANCE`;
    const code = [
        `; ${axis}-probe`,
        `G38.2 ${axis}[%PROBE_DISTANCE] F[%PROBE_FAST_FEED]`,
        'G91',
        `G0 [${axisRetract}]`,
        `G38.2 ${axis}[%PROBE_DISTANCE] F[$PROBE_SLOW_FEED]`,
        'G4 P[%WAIT]',
        `G10 L2 P0 ${axis}[%${axis}_THICKNESS]}`,
        `G0 ${axis}[%${axis}_RETRACT]`
    ];

    return code;
};

export const get3AxisStandardRoutine = (options) => {
    const { axes } = options;
    const code = [];

    code.push(...getPreamble(options));
    if (axes.z) {
        code.push(getSingleAxisStandardRoutine('Z'));
    }
    // Move into position for X

    // Probe X

    // Move into position for Y

    // Probe Y

    console.log(code);
    return code;
};

export const get3AxisAutoRoutine = ({ axes, is13 }) => {

};

export const get3AxisAutoTipRoutine = () => {};

export const get3AxisAutoDiameterRoutine = () => {};
