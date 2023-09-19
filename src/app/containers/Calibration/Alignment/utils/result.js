export const calculateAlpha = ({ a, b, c }) => (Math.acos((((a ** 2) + (b ** 2) - (c ** 2)) / (2 * a * b))) * (180 / Math.PI));

export const calculateBeta = ({ trueHypotenuse, userHypotenuse, alpha }) => (userHypotenuse <= trueHypotenuse ? 90 - alpha : alpha - 90);

export const calculateFM = ({ b, beta }) => Number((b * Math.sin(beta * (Math.PI / 180))).toFixed(2));

export const calculateMovement = ({ currentStep, movedDistance, actualDistance }) => (currentStep * (movedDistance / actualDistance));

export const calculateHypotenuse = ({ a, b }) => {
    if (!a || !b) {
        return null;
    }

    return Math.sqrt((a ** 2) + (b ** 2));
};

export const FM_LOWER_OFFSET_THRESHOLD = 2;
export const RESULT_OFFSET_THRESHOLD = 20;
