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
    return Number(
        (
            originalStepsPerMM *
            (givenDistanceMoved / actualDistanceMoved)
        ).toFixed(2),
    );
};
