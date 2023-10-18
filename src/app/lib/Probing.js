import { TOUCHPLATE_TYPE_AUTOZERO } from 'app/lib/constants';

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
    const { modal, axes, probeDistance, probeFast, probeSlow, retract, zThickness, xyThickness } = options;
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
        `%PROBE_RETRACT=${retract}`,
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
        `G38.2 ${axis}[PROBE_DISTANCE] F[PROBE_FAST_FEED]`,
        'G91',
        `G0 [${axisRetract}]`,
        `G38.2 ${axis}[PROBE_DISTANCE] F[PROBE_SLOW_FEED]`,
        'G4 P[%WAIT]',
        `G10 L2 P0 ${axis}[${axis}_THICKNESS]}`,
        `G0 ${axis}[${axis}_RETRACT]`
    ];

    return code;
};

export const get3AxisStandardRoutine = (options) => {
    const { axes } = options;
    const code = [];

    code.push(...getPreamble(options));
    if (axes.z) {
        code.push(...getSingleAxisStandardRoutine('Z'));
    }
    if (axes.x) {
        // Move into position for X

        // Probe X
        code.push(...getSingleAxisStandardRoutine('X'));
    }
    if (axes.y) {
        // Move into position for Y

        // Probe Y
        code.push(...get3AxisStandardRoutine('Y'));
    }
    // Move back to origin

    console.log(code);
    return code;
};


const determineAutoPlateOffsetValues = (direction, diameter = null) => {
    let xOff = 22.5;
    let yOff = 22.5;

    if (diameter && diameter !== 'TIP' && diameter !== 'AUTO') {
        // math to compensate for tool
        const toolRadius = (diameter / 2);
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

export const get3AxisAutoRoutine = ({ axes, $13, direction }) => {
    const code = [];
    const p = 'P0';

    const [xOff, yOff] = determineAutoPlateOffsetValues(direction);

    let prependUnits = '';
    if ($13 === '1') {
        prependUnits = 'G20';
    }

    if (axes.x && axes.y && axes.z) {
        code.push(
            '; Probe XYZ Auto Endmill',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            'G10 L20 P0 Z5',
            'G21 G91 G0 Z2',
            'G21 G91 G0 X-13',
            'G38.2 X-30 F150',
            'G21 G91 G0 X2',
            'G38.2 X-5 F75',
            'G4 P0.15',
            '%X_LEFT=posx',
            //'G10 L20 P0 X0',
            'G21 G91 G0 X26',
            'G38.2 X30 F150',
            'G21 G91 G0 X-2',
            'G38.2 X5 F75',
            'G4 P0.15',
            '%X_RIGHT=posx',
            '%X_CHORD=X_RIGHT - XLEFT',
            'G21 G90 G0 X[X_CHORD/2]',
            '%X_CENTER=posx',
            `${prependUnits} G10 L20 P0 X0`,
            //`${prependUnits} G10 L20 P0 X[posx/2]`,
            //'G21 G90 G0 X0',
            'G21 G91 G0 Y-13',
            'G38.2 Y-30 F250',
            'G21 G91 G0 Y2',
            'G38.2 Y-5 F75',
            'G4 P0.15',
            '%Y_BOTTOM = posy',
            'G21 G91 G0 Y26',
            'G38.2 Y30 F250',
            'G21 G91 G0 Y-2',
            'G38.2 Y5 F75',
            'G4 P0.15',
            '%Y_TOP = posy',
            '%Y_CHORD = Y_TOP - Y_BOTTOM',
            'G0 Y[Y_CHORD / 2] X0',
            //`${prependUnits} G10 L20 P0 Y[posy/2]`,
            //'G21 G90 G0 X0 Y0',
            'G4 P0.15',
            //`${prependUnits} G10 L20 P0 Y0`,
            'G10 L20 P0 X[X_OFF] Y[Y_OFF]',
            'G21 G90 G0 X0 Y0',
            'G21 G90 Z1'
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY Auto Endmill',
            `%X_OFF = ${xOff}`,
            `%Y_OFF = ${yOff}`,
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
            'G21 G91 G0 Z2',
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

export const get3AxisAutoTipRoutine = ({ axes, $13 }) => {
    const code = [];
    const p = 'P0';

    let prependUnits = '';
    if ($13 === '1') {
        prependUnits = 'G20';
    }

    if (axes.x && axes.y && axes.z) {
        code.push(
            '; Probe XYZ Auto Tip',
            'G21 G91',
            'G38.2 Z-25 F200',
            'G21 G91 G0 Z2',
            'G38.2 Z-5 F75',
            'G4 P0.15',
            `G10 L20 ${p} Z5`,
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
            'G21 G90 G0 X0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} X22.5 Y22.5`,
            'G21 G90 G0 X0 Y0',
            'G21 G90 G0 Z1',
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY Auto Tip',
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
            'G21 G90 G0 X0 Y0',
            'G4 P0.15',
            `G10 L20 ${p} X22.5 Y22.5`,
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
            `G10 L20 ${p} X22.5`,
        );
    } else if (axes.y) {
        code.push(
            '; Probe Y Auto Tip',
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
            `G10 L20 ${p} Y22.5`,
        );
    }

    return code;
};

export const get3AxisAutoDiameterRoutine = ({ axes, diameter }) => {
    const code = [];

    const wcs = this.getWorkCoordinateSystem();
    const p = `P${this.mapWCSToPValue(wcs)}`;

    // const toolRadius = (diameter / 2);
    // const toolCompensatedThickness = ((-1 * toolRadius));
    // console.log(toolCompensatedThickness);

    if (axes.z && axes.y && axes.z) {
        code.push(
            '; Probe XYZ AutoZero Specific Diameter',
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
            `G10 L20 ${p} X22.5 Y22.5`,
            'G21 G90 G0 X0 Y0',
            'G21 G90 G0 Z1',
        );
    } else if (axes.x && axes.y) {
        code.push(
            '; Probe XY AutoZero Specific Diameter',
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
            `G10 L20 ${p} X22.5 Y22.5`,
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
            `G10 L20 ${p} Y22.5`,
        );
    } else if (axes.x) {
        code.push(
            '; Probe X',
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
            `G10 L20 ${p} X22.5`,
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

const updateOptionsForDirection = (options, direction) => {
    return options;
};

// Master function - given selected routine, determine which probe code to return for a specific direction
export const getProbeCode = (options, direction = 0) => {
    const { plateType, axes } = options;
    console.log(axes);
    if (plateType === TOUCHPLATE_TYPE_AUTOZERO) {
        if (options.toolDiameter === 'AUTO') {
            return [];
        } else if (options.toolDiameter === 'TIP') {
            return [];
        } else {
            return [];
        }
    }

    // Standard plate, we modify some values for specific directions
    options = updateOptionsForDirection(options, direction);

    return [];
};
