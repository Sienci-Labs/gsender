export const getEEPROMSettingKey = (axis: 'x' | 'y' | 'z') => {
    const settings = {
        x: '$100',
        y: '$101',
        z: '$102',
    };

    return settings[axis];
};

export const calculateNewStepsPerMM = ({
    originalStepsPerMM,
    givenDistanceMoved,
    actualDistanceMoved,
}: {
    originalStepsPerMM: number;
    givenDistanceMoved: number;
    actualDistanceMoved: number;
}) => {
    if (actualDistanceMoved === 0) return 0;
    // Only the size of the move matters: Z tunes downward (e.g. -50 mm), but a
    // measured distance is naturally entered as positive
    return Number(
        (
            originalStepsPerMM *
            (Math.abs(givenDistanceMoved) / Math.abs(actualDistanceMoved))
        ).toFixed(2),
    );
};
