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
import reduxStore from 'app/store/redux';
import prefStore from 'app/store';

import get from 'lodash/get';
import { Toaster, TOASTER_DANGER } from 'app/lib/toaster/ToasterLib';

export const FRONT_RIGHT = 'FR';
export const FRONT_LEFT = 'FL';
export const BACK_RIGHT = 'BR';
export const BACK_LEFT = 'BL';
export const OTHER = 'OT';

const OFFSET_DISTANCE = 1;
const PULLOFF_DISTANCE = 5;

export const getHomingLocation = (setting) => {
    if (setting === '0') {
        return BACK_RIGHT;
    } else if (setting === '1') {
        return BACK_LEFT;
    } else if (setting === '2') {
        return FRONT_RIGHT;
    } else if (setting === '3') {
        return FRONT_LEFT;
    } else {
        return OTHER;
    }
};

const getMachineMovementLimits = () => {
    const store = reduxStore.getState();
    const settings = get(store, 'controller.settings.settings');
    const { $130: xMax, $131: yMax } = settings;

    // Limits are PULLOFF_DISTANCE away from reported limits
    const xLimit = (Number(xMax) - PULLOFF_DISTANCE).toFixed(3);
    const yLimit = (Number(yMax) - PULLOFF_DISTANCE).toFixed(3);

    return [xLimit, yLimit];
};


// Get a single bit from integer at position.  It does not use 0 indexing so pretend that arrays start at 1 :)
export function isBitSetInNumber(number, bitPosition) {
    number = Number(number);
    // eslint-disable-next-line no-bitwise
    return (number & (1 << bitPosition)) !== 0;
}

const getPositionMovements = (requestedPosition, homingPosition, homingFlag, pullOff) => {
    const [xLimit, yLimit] = getMachineMovementLimits();

    pullOff = PULLOFF_DISTANCE;
    // If homing flag not set, we treat all movements as negative space
    if (!homingFlag) {
        homingPosition = BACK_RIGHT;
    }

    if (!xLimit || !yLimit) {
        Toaster.pop({
            msg: 'Unable to find machine limits - make sure they\'re set in preferences',
            type: TOASTER_DANGER
        });
        return [null, null];
    }

    if (homingPosition === FRONT_RIGHT) {
        if (requestedPosition === FRONT_RIGHT) {
            return [pullOff * -1, pullOff];
        } else if (requestedPosition === FRONT_LEFT) {
            return [xLimit * -1, pullOff];
        } else if (requestedPosition === BACK_LEFT) {
            return [(xLimit * -1), yLimit];
        } else { // Back Right
            return [pullOff * -1, yLimit];
        }
    } else if (homingPosition === FRONT_LEFT) {
        if (requestedPosition === FRONT_RIGHT) {
            return [xLimit, pullOff];
        } else if (requestedPosition === FRONT_LEFT) {
            return [pullOff, pullOff];
        } else if (requestedPosition === BACK_RIGHT) {
            return [xLimit, yLimit];
        } else { // Back Right
            return [pullOff, yLimit];
        }
    } else if (homingPosition === BACK_LEFT) {
        if (requestedPosition === FRONT_RIGHT) {
            return [xLimit, yLimit * -1];
        } else if (requestedPosition === FRONT_LEFT) {
            return [pullOff, yLimit * -1];
        } else if (requestedPosition === BACK_LEFT) {
            return [pullOff, pullOff * -1];
        } else { // Back Right
            return [xLimit, pullOff * -1];
        }
    } else if (homingPosition === BACK_RIGHT) {
        if (requestedPosition === FRONT_RIGHT) {
            return [pullOff * -1, yLimit * -1];
        } else if (requestedPosition === FRONT_LEFT) {
            return [xLimit * -1, yLimit * -1];
        } else if (requestedPosition === BACK_LEFT) {
            return [xLimit * -1, pullOff * -1];
        } else { // Back Right
            return [pullOff * -1, pullOff * -1];
        }
    }

    return [null, null];
};

export const getMovementGCode = (requestedPosition, homingPositionSetting, homingFlag, pullOff) => {
    const gcode = [];

    gcode.push(`G53 G21 G0 Z-${OFFSET_DISTANCE}`); // Always move up to the limit of Z travel minus offset
    const homingPosition = getHomingLocation(homingPositionSetting);

    // Change homing flag for grblHal specifically
    const controllerType = prefStore.get('widgets.connection.controller.type', 'grbl');
    console.log(controllerType);
    if (controllerType === 'grblHAL') {
        const store = reduxStore.getState();
        const settings = get(store, 'controller.settings.settings');
        const { $22: homingValue } = settings;
        homingFlag = isBitSetInNumber(homingValue, 3);
    }

    const [xMovement, yMovement] = getPositionMovements(requestedPosition, homingPosition, homingFlag, pullOff);

    if (xMovement === null || yMovement === null) {
        Toaster.pop({
            msg: 'Unable to calculate position movements based on inputs - check arguments passed',
            type: TOASTER_DANGER
        });
        return [];
    }
    gcode.push(`G53 G21 G0 X${xMovement} Y${yMovement}`);

    return gcode;
};
