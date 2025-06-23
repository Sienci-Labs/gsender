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
import events from 'events';
import { determineRoundedValue } from './rounding';

class ImmutableStore extends events.EventEmitter {
    state = {};

    constructor(state = {}) {
        super();

        this.state = state;
    }

    get(key: string, defaultValue?: any): any {
        return key === undefined
            ? this.state
            : _.get(this.state, key, defaultValue);
    }

    set(key: string, value: any): any {
        const prevValue = this.get(key);
        if (typeof value === 'object' && _.isEqual(value, prevValue)) {
            return this.state;
        }
        if (value === prevValue) {
            return this.state;
        }

        // round values that need to be rounded before storing
        value = determineRoundedValue(key, value);

        this.state = _.merge({}, this.state, _.set({}, key, value));
        this.emit('change', this.state);
        return this.state;
    }

    unset(key: string): object {
        let state = _.extend({}, this.state);
        _.unset(state, key);
        this.state = state;
        //this.emit('change', this.state);
        return this.state;
    }

    replace(key: string, value: any): object {
        const prevValue = this.get(key);
        if (typeof value === 'object' && _.isEqual(value, prevValue)) {
            return this.state;
        }
        if (value === prevValue) {
            return this.state;
        }

        this.unset(key);
        this.set(key, value);
        this.emit('replace', this.state);
        return this.state;
    }

    restoreState(state: object, cb: () => void = null): void {
        this.clear();
        this.state = state;

        if (cb) {
            cb();
        }
        this.emit('change');
    }

    clear(): object {
        this.state = {};
        this.emit('change', this.state);
        return this.state;
    }

    persist = _.noop;
    getConfig = _.noop;
}

export default ImmutableStore;
