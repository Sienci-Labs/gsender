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
import { OTHER } from 'src/app/widgets/Location/RapidPosition';

export const FRONT_RIGHT = 'FR';
export const FRONT_LEFT = 'FL';
export const BACK_RIGHT = 'BR';
export const BACK_LEFT = 'BL';

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

export const determineMachineZeroLocation = (res, settings) => {

    const homingMask = get(settings, 'settings.$23');
    const mpos = get(res, 'mpos');
    const homingLocation = getHomingLocation(homingMask);
    const xPos = Number(mpos.x);
    const yPos = Number(mpos.y);
    const zPos = Number(mpos.z);

    if (homingLocation !== BACK_RIGHT) {
        if (xPos === 0 && yPos === 0 && zPos === 0) {
            return homingLocation;
        }
    }

    return BACK_RIGHT;
};
