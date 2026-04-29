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

import { IMPERIAL_UNITS, METRIC_UNITS } from '../constants';
import { UNITS_EN } from 'app/definitions/general';
import store from '../store';

const CALC_UNIT = 25.4;

//Function to set custom decimal places for VALUES
const setDecimalPlacesValue = (
    defaultPlace: number,
    val: string | number,
    conversionType: Function,
): string => {
    val = Number(val);
    // This value is set by the user
    let customDecimalPlace = Number(store.get('workspace.customDecimalPlaces'));
    if (customDecimalPlace === 0) {
        return conversionType(val).toFixed(defaultPlace);
    } else {
        return conversionType(val).toFixed(customDecimalPlace);
    }
};

const determineCorrectedValue = (val: number, decimalPlaces: number) => {
    const roundedVal = val.toFixed(decimalPlaces);
    let num = Number(roundedVal);
    if (num === 0) {
        return (0).toFixed(decimalPlaces);
    }
    return roundedVal;
};

//Function to set custom decimal places for POSITIONS
const setDecimalPlacesPosition = (
    defaultPlace: number,
    val: string | number,
): string => {
    val = Number(val);
    // This value is set by the user
    let customDecimalPlace = Number(store.get('workspace.customDecimalPlaces'));
    if (customDecimalPlace === 0) {
        return determineCorrectedValue(val, defaultPlace);
    } else {
        return determineCorrectedValue(val, customDecimalPlace);
    }
};

// Converts value from millimeters to inches
export const mm2in = (val = 0): number => val / 25.4;

// Converts values from inches to millimeters
export const in2mm = (val = 0): number => val * 25.4;

// Maps value to imperial units
export const mapValueToImperialUnits = (val: string | number): string => {
    val = Number(val) || 0;
    let defaultDecimalPlace = 3;
    return setDecimalPlacesValue(defaultDecimalPlace, val, mm2in);
};

// Maps value to metric units
export const mapValueToMetricUnits = (val: string | number): string => {
    val = Number(val) || 0;
    let defaultPlace = 2;
    return setDecimalPlacesPosition(defaultPlace, val);
};

// Maps value to the specified units
// in: 0.10203 -> "0.102"
// mm: 0.10002 -> "0.1"
export const mapValueToUnits = (
    val: string | number,
    units: UNITS_EN = METRIC_UNITS,
): string => {
    if (units === IMPERIAL_UNITS) {
        return mapValueToImperialUnits(val);
    }
    if (units === METRIC_UNITS) {
        return mapValueToMetricUnits(val);
    }
    return (val as string) || '0';
};

// Maps position to imperial units
export const mapPositionToImperialUnits = (pos: string | number): string => {
    pos = Number(pos) || 0;
    let defaultDecimalPlace = 3;
    return setDecimalPlacesValue(defaultDecimalPlace, pos, mm2in);
};

// Maps position to metric units
export const mapPositionToMetricUnits = (pos: string | number): string => {
    pos = Number(pos) || 0;
    let defaultPlace = 2;
    return setDecimalPlacesPosition(defaultPlace, pos);
};

// Maps position to the specified units
// in: 0.12345 > "0.1235"
// mm: 0.1234  > "0.123"
export const mapPositionToUnits = (
    pos: string | number,
    units: UNITS_EN = METRIC_UNITS,
): string => {
    if (units === IMPERIAL_UNITS) {
        return mapPositionToImperialUnits(pos);
    }
    if (units === METRIC_UNITS) {
        return mapPositionToMetricUnits(pos);
    }
    let defaultPlace = 2;
    return setDecimalPlacesPosition(defaultPlace, pos);
};

export const convertValueToImperialUnits = (pos: string | number): string => {
    pos = Number(pos) || 0;
    let defaultDecimalPlace = 3;
    return setDecimalPlacesValue(defaultDecimalPlace, pos, mm2in);
};

export const convertValueToMetricUnits = (pos: string | number): string => {
    pos = Number(pos) || 0;
    let defaultDecimalPlace = 3;
    return setDecimalPlacesValue(defaultDecimalPlace, pos, in2mm);
};

export const mapPositionToPreferredUnits = (
    pos: string | number,
    currentUnits: UNITS_EN,
    preferredUnits: UNITS_EN,
): string => {
    // Assumption: original value is always mm
    if (currentUnits !== preferredUnits) {
        if (preferredUnits === IMPERIAL_UNITS) {
            return convertValueToImperialUnits(pos);
        } else {
            return convertValueToMetricUnits(pos);
        }
    }
    let defaultPlace = 3;
    return setDecimalPlacesPosition(defaultPlace, pos);
};

export const convertToImperial = (val: number): number => {
    return Number((val / CALC_UNIT).toFixed(3));
};

export const convertToMetric = (val: number): number => {
    return Number((val * CALC_UNIT).toFixed(2));
};

// assume starting imperial,
export function convertIfImperial(num: string | number, units = METRIC_UNITS) {
    if (units === IMPERIAL_UNITS) {
        return convertValueToImperialUnits(num);
    }
    return Number(num);
}
