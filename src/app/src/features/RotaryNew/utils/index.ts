// Default values in mm
const DEFAULT_VALUES_MM = {
    length: 100,
    startDiameter: 50,
    finalDiameter: 40,
    stepdown: 20,
    bitDiameter: 6.35,
    stepover: 15,
    spindleRPM: 17000,
    feedrate: 3000,
    enableRehoming: false,
};

// Conversion factor from mm to inches
const MM_TO_INCH = 0.0393701;

const getInitialRotarySurfacingState = (units: 'in' | 'mm') => {
    if (units === 'in') {
        return {
            length: Number((DEFAULT_VALUES_MM.length * MM_TO_INCH).toFixed(3)),
            startDiameter: Number(
                (DEFAULT_VALUES_MM.startDiameter * MM_TO_INCH).toFixed(3),
            ),
            finalDiameter: Number(
                (DEFAULT_VALUES_MM.finalDiameter * MM_TO_INCH).toFixed(3),
            ),
            stepdown: Number(
                (DEFAULT_VALUES_MM.stepdown * MM_TO_INCH).toFixed(3),
            ),
            bitDiameter: Number(
                (DEFAULT_VALUES_MM.bitDiameter * MM_TO_INCH).toFixed(3),
            ),
            feedrate: Number(
                (DEFAULT_VALUES_MM.feedrate * MM_TO_INCH).toFixed(3),
            ),
            stepover: DEFAULT_VALUES_MM.stepover,
            spindleRPM: DEFAULT_VALUES_MM.spindleRPM,
            enableRehoming: DEFAULT_VALUES_MM.enableRehoming,
        };
    }
    return { ...DEFAULT_VALUES_MM };
};
