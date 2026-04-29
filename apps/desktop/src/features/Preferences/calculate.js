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
import { METRIC_UNITS } from '../../constants';

const CALC_UNIT = 25.4;

export const convertToImperial = (val) => {
    return Number((val / CALC_UNIT).toFixed(3));
};

export const convertToMetric = (val) => {
    return Number((val * CALC_UNIT).toFixed(2));
};

export const convertPresetUnits = (units, preset) => {
    const conversionFunc =
        units === METRIC_UNITS ? convertToMetric : convertToImperial;
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

    return {
        rapid: convertedRapid,
        normal: convertedNormal,
        precise: convertedPrecise,
    };
};
