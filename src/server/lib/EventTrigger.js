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
import { PROGRAM_EVENTS } from '../../app/src/constants';

const noop = () => {};

class EventTrigger {
    constructor(callback = noop) {
        this.callback = callback || noop;
    }

    trigger(eventKey, callback = null) {
        if (!eventKey) {
            return;
        }

        const events = config.get('events', new Map());

        const element = events.get(eventKey);
        if (element) {
            const {
                enabled = false,
                event,
                trigger,
                commands
            } = { ...element };

            if (!enabled) {
                return;
            }

            if (typeof this.callback === 'function') {
                this.callback(event, trigger, commands);
            }
        }
    }

    hasEnabledEvent(eventType) {
        if (!PROGRAM_EVENTS.includes(eventType)) {
            return false;
        }

        let isEnabled = false;
        const events = config.get('events', new Map());
        const element = events.get(eventType);

        if (element) {
            const { enabled, commands } = { ...element };
            if (enabled && commands.length > 0) {
                isEnabled = true;
            }
        }
        return isEnabled;
    }

    getEventCode(eventType) {
        if (!PROGRAM_EVENTS.includes(eventType)) {
            return '';
        }

        let code = '';
        const events = config.get('events', new Map());
        const element = events.get(eventType);

        if (element) {
            const { enabled, commands } = { ...element };
            if (enabled && commands.length > 0) {
                code = commands;
            }
        }
        return code;
    }
}

export default EventTrigger;
