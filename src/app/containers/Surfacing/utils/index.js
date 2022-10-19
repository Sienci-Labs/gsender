import get from 'lodash/get';

import defaultState from 'app/store/defaultState';
import { METRIC_UNITS, IMPERIAL_UNITS } from 'app/constants';

export const convertTo = (type, val) => (type === METRIC_UNITS ? Math.round(val * 25.4) : Number((val / 25.4).toFixed(2)));

export function convertValuesToImperial(surfacing) {
    return {
        ...surfacing,
        length: convertTo(IMPERIAL_UNITS, surfacing.length),
        width: convertTo(IMPERIAL_UNITS, surfacing.width),
        bitDiameter: convertTo(IMPERIAL_UNITS, surfacing.bitDiameter),
        spindleRPM: convertTo(IMPERIAL_UNITS, surfacing.spindleRPM),
        skimDepth: convertTo(IMPERIAL_UNITS, surfacing.skimDepth),
        maxDepth: convertTo(IMPERIAL_UNITS, surfacing.maxDepth),
        feedrate: convertTo(IMPERIAL_UNITS, surfacing.feedrate)
    };
}

export function convertValuesToMetric(surfacing) {
    return {
        ...surfacing,
        length: convertTo(METRIC_UNITS, surfacing.length),
        width: convertTo(METRIC_UNITS, surfacing.width),
        bitDiameter: convertTo(METRIC_UNITS, surfacing.bitDiameter),
        spindleRPM: convertTo(METRIC_UNITS, surfacing.spindleRPM),
        skimDepth: convertTo(METRIC_UNITS, surfacing.skimDepth),
        maxDepth: convertTo(METRIC_UNITS, surfacing.maxDepth),
        feedrate: convertTo(METRIC_UNITS, surfacing.feedrate)
    };
}

export function getDefaultImperialState(units) {
    const defaultSurfacingValues = get(defaultState, 'widgets.surfacing', defaultState?.widgets?.surfacing);

    if (units === IMPERIAL_UNITS) {
        return convertValuesToImperial(defaultSurfacingValues);
    }

    return defaultSurfacingValues;
}
