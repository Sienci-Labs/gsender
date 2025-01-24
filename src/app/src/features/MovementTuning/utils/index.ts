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
    console.log(originalStepsPerMM, givenDistanceMoved, actualDistanceMoved);

    return Number(
        (
            originalStepsPerMM *
            (givenDistanceMoved / actualDistanceMoved)
        ).toFixed(2),
    );
};
