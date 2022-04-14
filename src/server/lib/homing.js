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
import get from 'lodash/get';

export const FRONT_RIGHT = 'FR';
export const FRONT_LEFT = 'FL';
export const BACK_RIGHT = 'BR';
export const BACK_LEFT = 'BL';
export const POSITIVE_DIRECTION = 1;
export const NEGATIVE_DIRECTION = -1;

export const getHomingLocation = (setting) => {
    setting = Number(setting);
    console.log(setting);
    if (setting === 0) {
        return BACK_RIGHT;
    } else if (setting === 1) {
        return BACK_LEFT;
    } else if (setting === 2) {
        return FRONT_RIGHT;
    } else if (setting === 3) {
        return FRONT_LEFT;
    }
    return BACK_RIGHT;
};

export const determineMaxMovement = (position, movementDirection, limitLocation, limit) => {
    limit -= 2; // We add a slight offset to make sure calculations don't fail due to rounding, 2mm is not noticeable in most cases

    if (position === 0) {
        console.log('zero branch');
        return ((limit) * movementDirection).toFixed(2);
    }

    if (movementDirection === POSITIVE_DIRECTION) {
        if (limitLocation === POSITIVE_DIRECTION) {
            console.log('+ +');
            return (limit - position).toFixed(2);
        } else {
            console.log('+ -');
            return (position).toFixed(2);
        }
    } else if (movementDirection === NEGATIVE_DIRECTION) {
        if (limitLocation === POSITIVE_DIRECTION) {
            console.log('- +');
            return (-1 * (position)).toFixed(2);
        } else {
            console.log('- -');
            return (-1 * (limit - position)).toFixed(2);
        }
    }
    return 0;
};

export const getAxisMaximumLocation = (homingMask) => {
    const homingLocation = getHomingLocation(homingMask);
    if (homingLocation === BACK_RIGHT) {
        return [NEGATIVE_DIRECTION, NEGATIVE_DIRECTION];
    } else if (homingLocation === BACK_LEFT) {
        return [POSITIVE_DIRECTION, NEGATIVE_DIRECTION];
    } else if (homingLocation === FRONT_RIGHT) {
        return [NEGATIVE_DIRECTION, POSITIVE_DIRECTION];
    }
    return [POSITIVE_DIRECTION, POSITIVE_DIRECTION];
};

export const determineMachineZeroFlagSet = (res, settings) => {
    const homingMask = get(settings, 'settings.$23');
    const mpos = get(res, 'mpos');
    const homingLocation = getHomingLocation(homingMask);
    const xPos = parseInt(mpos.x, 10);
    const yPos = parseInt(mpos.y, 10);
    const zPos = parseInt(mpos.z, 10);

    if (homingLocation !== BACK_RIGHT) {
        if (xPos === 0 && yPos === 0 && zPos === 0) {
            return true;
        }
    }

    return false;
};
