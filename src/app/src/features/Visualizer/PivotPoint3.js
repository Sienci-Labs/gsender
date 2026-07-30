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

import _ from 'lodash';

const noop = () => {
    // do nothing
};

export default class PivotPoint3 {
    // @param {object} options The options object
    // @param {number} [options.x] The pivot point on the x-axis
    // @param {number} [options.y] The pivot point on the y-axis
    // @param {number} [options.z] The pivot point on the z-axis
    // @param callback {function} The callback function
    constructor(options, callback = noop) {
        options = _.defaults({}, options, { x: 0, y: 0, z: 0 });

        options.x = Number(options.x) || 0;
        options.y = Number(options.y) || 0;
        options.z = Number(options.z) || 0;

        this.pivotPoint = { x: 0, y: 0, z: 0 };
        this.callback = callback;

        this.set(options.x, options.y, options.z);
    }

    // Sets a new pivot point to rotate objects
    // @param {number} x The pivot point on the x-axis
    // @param {number} y The pivot point on the y-axis
    // @param {number} z The pivot point on the z-axis
    set(x, y, z) {
        let { pivotPoint } = this;

        x = Number(x) || 0;
        y = Number(y) || 0;
        z = Number(z) || 0;

        // Pass relative position to the callback
        this.callback(
            -(x - pivotPoint.x),
            -(y - pivotPoint.y),
            -(z - pivotPoint.z),
        );

        this.pivotPoint = { x: x, y: y, z: z };
    }

    // Gets the pivot point
    // @return {object} The { x, y, z } position of the pivot point
    get() {
        return this.pivotPoint;
    }

    // Sets the pivot point to the origin point (0, 0, 0)
    clear() {
        let { pivotPoint } = this;

        this.callback(pivotPoint.x, pivotPoint.y, pivotPoint.z);

        this.pivotPoint = { x: 0, y: 0, z: 0 };
    }
}
