import { IMPERIAL_UNITS, METRIC_UNITS } from 'app/constants';
import { UNITS_EN } from 'app/definitions/general';

const MM_TO_INCH = 1 / 25.4;
const INCH_TO_MM = 25.4;

export const convertValue = (
    value: number,
    fromUnit: UNITS_EN,
    toUnit: UNITS_EN,
    precision: number = 3,
): number => {
    if (fromUnit === toUnit) {
        return Number(value.toFixed(precision));
    }

    if (fromUnit === IMPERIAL_UNITS) {
        return Number((value * INCH_TO_MM).toFixed(precision));
    }

    if (fromUnit === METRIC_UNITS) {
        return Number((value * MM_TO_INCH).toFixed(precision));
    }

    return Number(value.toFixed(precision));
};
