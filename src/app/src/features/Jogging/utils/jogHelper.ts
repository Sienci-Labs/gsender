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

type JogHelperProps = {
    jogCB: (coordinates: Record<string, number>, feedrate: number) => void;
    startContinuousJogCB: (
        coordinates: Record<string, number>,
        feedrate: number,
    ) => void;
    stopContinuousJogCB: () => void;
};

class JogHelper {
    timeoutFunction: NodeJS.Timeout | null = null;

    timeout = 600; // 600 ms to be consistent with jog controls

    startTime = 0;

    didPress = false;

    currentCoordinates: Record<string, number> | null = null;

    feedrate = 3000;

    jog: (coordinates: Record<string, number>, feedrate: number) => void = null;

    continuousJog: (
        coordinates: Record<string, number>,
        feedrate: number,
    ) => void = null;

    stopContinuousJog: () => void = null;

    constructor({
        jogCB,
        startContinuousJogCB,
        stopContinuousJogCB,
    }: JogHelperProps) {
        this.jog = _.throttle(jogCB, 150, { trailing: false });
        this.continuousJog = _.throttle(startContinuousJogCB, 150, {
            trailing: false,
        });
        this.stopContinuousJog = _.throttle(
            stopContinuousJogCB,
            this.timeout - 25,
            { leading: true, trailing: false },
        );
    }

    onKeyDown(coordinates: Record<string, number>, feedrate: number) {
        const startTime = new Date();

        if (this.timeoutFunction) {
            return;
        }

        this.startTime = startTime.getTime();
        this.currentCoordinates = coordinates;
        this.didPress = true;

        this.feedrate = feedrate;

        this.timeoutFunction = setTimeout(() => {
            this.continuousJog(coordinates, feedrate);
        }, this.timeout);
    }

    onKeyUp() {
        const timer = new Date().getTime() - this.startTime;

        if (!this.timeoutFunction) {
            return;
        }

        clearTimeout(this.timeoutFunction);
        this.timeoutFunction = null;

        if (timer < this.timeout && this.didPress) {
            this.jog({ ...this.currentCoordinates }, this.feedrate);
            this.startTime = new Date().getTime();
            this.didPress = false;
            this.currentCoordinates = null;
        } else {
            this.stopContinuousJog();
            this.startTime = new Date().getTime();
            this.didPress = false;
            this.currentCoordinates = null;
        }
    }
}

export default JogHelper;
