import { getUnitModal } from 'app/lib/toolChangeUtils';

const processValue = (value: number) => {
    const unitModal = getUnitModal();

    if (unitModal === 'G20') {
        return +(value / 25.4).toFixed(3);
    }

    return value;
};

export const getZAxisProbing = () => {
    const unitModal = getUnitModal();

    return `
        %PROBE_FAST_FEEDRATE = ${processValue(150)}
        %PROBE_SLOW_FEEDRATE = ${processValue(50)}
        %PROBE_RETRACTION = ${processValue(1)}

        %Z_AXIS_LARGE_MOVEMENT = ${processValue(39)}
        %Z_AXIS_LONG_MOVEMENT = ${processValue(30)}
        %Z_AXIS_SHORT_MOVEMENT = ${processValue(2)}

        G91 ; Relative positioning

        ${unitModal}

        G38.2 Z[-Z_AXIS_LONG_MOVEMENT] F[PROBE_FAST_FEEDRATE]

        G0 Z[PROBE_RETRACTION]

        G38.2 Z[-Z_AXIS_SHORT_MOVEMENT] F[PROBE_SLOW_FEEDRATE]

        G4 P0.15

        G10 L20 P0 Z[Z_AXIS_LARGE_MOVEMENT]

        G0 Z[Z_AXIS_SHORT_MOVEMENT]

        G90
    `;
};

export const getYAxisAlignmentProbing = () => {
    const unitModal = getUnitModal();

    return `
        %PROBE_FAST_FEEDRATE = ${processValue(150)}
        %PROBE_SLOW_FEEDRATE = ${processValue(50)}
        %PROBE_RETRACTION = ${processValue(1)}
        %CLEARANCE_HEIGHT = ${processValue(2)}
        %PROBE_HEIGHT = ${processValue(-3)}

        %Y_AXIS_LARGE_MOVEMENT = ${processValue(44)}
        %Y_AXIS_LONG_MOVEMENT = ${processValue(32)}
        %Y_AXIS_SHORT_MOVEMENT = ${processValue(2)}

        %Z_AXIS_LARGE_MOVEMENT = ${processValue(39)}
        %Z_AXIS_LONG_MOVEMENT = ${processValue(30)}
        %Z_AXIS_SHORT_MOVEMENT = ${processValue(2)}


        G91 ; Relative positioning

        ${unitModal}

        G38.2 Z[-Z_AXIS_LONG_MOVEMENT] F[PROBE_FAST_FEEDRATE]

        G4 P0.15

        G0 Z[CLEARANCE_HEIGHT]

        G0 Y[Y_AXIS_LONG_MOVEMENT]

        G0 Z[-CLEARANCE_HEIGHT+PROBE_HEIGHT]

        G38.2 Y[-Y_AXIS_LONG_MOVEMENT] F[PROBE_FAST_FEEDRATE]

        G0 Y[PROBE_RETRACTION]

        G38.2 Y[-Y_AXIS_SHORT_MOVEMENT] F[PROBE_SLOW_FEEDRATE]

        G4 P0.15

        %REAR_SEEK_POS = [posy]

        G0 Y[PROBE_RETRACTION]

        G0 Z[CLEARANCE_HEIGHT-PROBE_HEIGHT]

        G0 Y[-Y_AXIS_LARGE_MOVEMENT]

        G0 Z[-CLEARANCE_HEIGHT+PROBE_HEIGHT]

        G38.2 Y[Y_AXIS_LONG_MOVEMENT] F[PROBE_FAST_FEEDRATE]

        G0 Y[-PROBE_RETRACTION]

        G38.2 Y[Y_AXIS_SHORT_MOVEMENT] F[PROBE_SLOW_FEEDRATE]

        G4 P0.15

        %FRONT_SEEK_POS = [posy]

        G0 Y[-PROBE_RETRACTION]

        G0 Z[CLEARANCE_HEIGHT-PROBE_HEIGHT]

        %Y_SEEK_CENTERDIST = [REAR_SEEK_POS - FRONT_SEEK_POS]

        G0 Y[PROBE_RETRACTION+Y_SEEK_CENTERDIST/2]

        G10 L20 Y0

        G38.2 Z[-CLEARANCE_HEIGHT+PROBE_HEIGHT] F[PROBE_FAST_FEEDRATE]

        G0 Z[PROBE_RETRACTION]

        G38.2 Z[-Z_AXIS_SHORT_MOVEMENT] F[PROBE_SLOW_FEEDRATE]

        G4 P0.15

        G10 L20 Z[Z_AXIS_LARGE_MOVEMENT]

        G0 Z[CLEARANCE_HEIGHT]

        G90
    `;
};
