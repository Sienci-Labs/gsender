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

import config from '../services/configstore';

const noop = () => {};

class EventTrigger {
    constructor(callback = noop) {
        this.callback = callback || noop;
    }

    trigger(eventKey, callback = null) {
        if (!eventKey) {
            return;
        }

        const events = config.get('events', []);

        events
            .filter(event => event && event.event === eventKey)
            .forEach(options => {
                const {
                    enabled = false,
                    event,
                    trigger,
                    commands
                } = { ...options };

                if (!enabled) {
                    return;
                }

                if (typeof this.callback === 'function') {
                    this.callback(event, trigger, commands);
                }
            });
    }

    hasEnabledStartEvent() {
        let isEnabled = false;
        const events = config.get('events', []);
        events
            .filter(event => event && event.event === 'gcode:start')
            .forEach(options => {
                const { enabled } = { ...options };
                if (enabled) {
                    isEnabled = true;
                }
            });
        return isEnabled;
    }
}

export default EventTrigger;
