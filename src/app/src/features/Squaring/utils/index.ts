import reduxStore from 'app/store/redux';

import { SquaringContextType } from '../context/SquaringContext';

export const calculateAngle = (triangle: SquaringContextType['triangle']) => {
    const { a, b, c } = triangle;
    const cosC =
        (Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b);
    const angleInRadians = Math.acos(cosC);
    const angleInDegrees = (angleInRadians * 180) / Math.PI;
    return 90 - angleInDegrees;
};

// Calculate the hypotenuse using the Pythagorean theorem
export const calculateHypotenuse = (
    triangle: SquaringContextType['triangle'],
) => {
    const { a, b } = triangle;
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
};

export const determineEEPROMAdjustment = (
    triangle: SquaringContextType['triangle'],
    jogValues: SquaringContextType['jogValues'],
) => {
    const calculateMovement = ({
        currentStep,
        movedDistance,
        actualDistance,
    }: {
        currentStep: number;
        movedDistance: number;
        actualDistance: number;
    }) => currentStep * (movedDistance / actualDistance);

    const { settings } = reduxStore.getState().controller.settings;
    const { $100, $101 } = settings;

    const currentXStep = Number($100);
    const currentYStep = Number($101);

    const calculatedXStep = calculateMovement({
        currentStep: currentXStep,
        movedDistance: jogValues.x,
        actualDistance: triangle.a,
    });

    const calculatedYStep = calculateMovement({
        currentStep: currentYStep,
        movedDistance: jogValues.y,
        actualDistance: triangle.b,
    });

    return {
        x: {
            needsAdjustment: calculatedXStep !== currentXStep,
            amount: calculatedXStep,
        },
        y: {
            needsAdjustment: calculatedYStep !== currentYStep,
            amount: calculatedYStep,
        },
    };
};
