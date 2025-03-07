/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */
import _get from 'lodash/get';

import store from 'app/store';

import { METRIC_UNITS } from '../../constants';
import defaultState from '../../store/defaultState';

const CALC_UNIT = 25.4;

export const convertToImperial = (val) => {
    return Number((val / CALC_UNIT).toFixed(3));
};

export const convertToMetric = (val) => {
    return Number((val * CALC_UNIT).toFixed(2));
};

export const convertPresetUnits = (units, preset) => {
    const conversionFunc = units === METRIC_UNITS ? convertToMetric : convertToImperial;
    let convertedPreset = JSON.parse(JSON.stringify(preset));
    for (const key of Object.keys(preset)) {
        convertedPreset[key] = conversionFunc(preset[key]);
        if (key === 'feedrate') {
            convertedPreset[key] = Number(convertedPreset[key]).toFixed(0);
        }
    }
    return convertedPreset;
};

export const convertAllPresetsUnits = (units, jog) => {
    const { rapid, normal, precise } = jog;
    const convertedRapid = convertPresetUnits(units, rapid);
    const convertedNormal = convertPresetUnits(units, normal);
    const convertedPrecise = convertPresetUnits(units, precise);

    return { rapid: convertedRapid, normal: convertedNormal, precise: convertedPrecise };
};


export const getSafeJogState = () => {
    const defaultJogState = _get(defaultState, 'widgets.axes.jog');
    const jogState = store.get('widgets.axes.jog');

    // Ensure all required properties exist by falling back to defaultJogState
    const safeJogState = {
        rapid: {
            feedrate: jogState?.rapid?.feedrate ?? defaultJogState.rapid.feedrate,
            xyStep: jogState?.rapid?.xyStep ?? defaultJogState.rapid.xyStep,
            xaStep: jogState?.rapid?.xaStep ?? defaultJogState.rapid.xaStep,
            zStep: jogState?.rapid?.zStep ?? defaultJogState.rapid.zStep,
            aStep: jogState?.rapid?.aStep ?? defaultJogState.rapid.aStep
        },
        normal: {
            feedrate: jogState?.normal?.feedrate ?? defaultJogState.normal.feedrate,
            xyStep: jogState?.normal?.xyStep ?? defaultJogState.normal.xyStep,
            xaStep: jogState?.normal?.xaStep ?? defaultJogState.normal.xaStep,
            zStep: jogState?.normal?.zStep ?? defaultJogState.normal.zStep,
            aStep: jogState?.normal?.aStep ?? defaultJogState.normal.aStep
        },
        precise: {
            feedrate: jogState?.precise?.feedrate ?? defaultJogState.precise.feedrate,
            xyStep: jogState?.precise?.xyStep ?? defaultJogState.precise.xyStep,
            xaStep: jogState?.precise?.xaStep ?? defaultJogState.precise.xaStep,
            zStep: jogState?.precise?.zStep ?? defaultJogState.precise.zStep,
            aStep: jogState?.precise?.aStep ?? defaultJogState.precise.aStep
        }
    };

    return safeJogState;
};
