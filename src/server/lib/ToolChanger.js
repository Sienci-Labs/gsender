/*
 * Copyright (C) 2023 Sienci Labs Inc.
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

const noop = () => {};

class ToolChanger {
    intervalTimer = 200;

    onIdleInterval = null;

    isSenderIdle = noop;

    strategy = null;

    constructor(options) {
        if (typeof options.isIdle === 'function') {
            this.isSenderIdle = options.isIdle;
        }
        if (options.intervalTimer) {
            this.intervalTimer = options.intervalTimer;
        }
    }

    addInterval(cb) {
        if (this.onIdleInterval === null) {
            clearInterval(this.onIdleInterval);
        }

        if (typeof cb !== 'function') {
            return;
        }

        this.onIdleInterval = setInterval(() => {
            if (this.isSenderIdle()) {
                cb();
                this.clearInterval();
            }
        }, this.intervalTimer);
    }

    clearInterval() {
        clearInterval(this.onIdleInterval);
        this.onIdleInterval = null;
    }
}


export default ToolChanger;
