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

class JogHelper {
    timeoutFunction = null;

    timeout = 600; // 600 ms to be consistent with jog controls

    startTime = 0;

    didPress = false;

    currentCoordinates = null;

    jog = null;

    continuousJog = null;

    stopContinuousJog = null;

    constructor({ jogCB, startContinuousJogCB, stopContinuousJogCB }) {
        this.jog = _.throttle(jogCB, 150, { trailing: false });
        this.continuousJog = _.throttle(startContinuousJogCB, 150, { trailing: false });
        this.stopContinuousJog = _.throttle(stopContinuousJogCB, this.timeout - 25, { leading: true, trailing: false });
    }

    onKeyDown(coordinates, feedrate) {
        const startTime = new Date();

        if (this.timeoutFunction) {
            return;
        }

        this.startTime = startTime;
        this.currentCoordinates = coordinates;
        this.didPress = true;

        this.timeoutFunction = setTimeout(() => {
            this.continuousJog(coordinates, feedrate);
        }, this.timeout);
    }

    onKeyUp(coordinates) {
        const timer = new Date() - this.startTime;

        if (!this.timeoutFunction) {
            return;
        }

        clearTimeout(this.timeoutFunction);
        this.timeoutFunction = null;

        if (timer < this.timeout && this.didPress) {
            this.jog(coordinates);
            this.startTime = new Date();
            this.didPress = false;
            this.currentCoordinates = null;
        } else {
            this.stopContinuousJog();
            this.startTime = new Date();
            this.didPress = false;
            this.currentCoordinates = null;
        }
    }
}

export default JogHelper;
