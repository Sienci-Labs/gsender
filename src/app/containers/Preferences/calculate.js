const CALC_UNIT = 25.4;

export const convertToImperial = (val) => {
    return Number((val / CALC_UNIT).toFixed(3));
};

export const convertToMetric = (val) => {
    return Number((val * CALC_UNIT).toFixed(2));
};
