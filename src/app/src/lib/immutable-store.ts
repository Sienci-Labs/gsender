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
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import set from 'lodash/set';
import extend from 'lodash/extend';
import unset from 'lodash/unset';
import noop from 'lodash/noop';
import events from 'events';

import { determineRoundedValue } from './rounding';

class ImmutableStore<T extends object = object> extends events.EventEmitter {
    state: T;

    constructor(state = {} as T) {
        super();

        this.state = state;
    }

    get(): T;
    get<V = any>(key: string): V | undefined;
    get<V = any>(key: string, defaultValue: V): any;
    get<V = any>(key?: string, defaultValue?: V): T | V | undefined {
        if (key === undefined) return this.state;

        return get(this.state, key, defaultValue) as V | undefined;
    }

    set(key: string, value: any): T {
        const prevValue = this.get(key);
        if (typeof value === 'object' && isEqual(value, prevValue)) {
            return this.state;
        }
        if (value === prevValue) {
            return this.state;
        }

        // round values that need to be rounded before storing
        value = determineRoundedValue(key, value);

        this.state = merge({}, this.state, set({}, key, value));
        this.emit('change', this.state);
        return this.state;
    }

    unset(key: string): T {
        let state = extend({}, this.state);
        unset(state, key);
        this.state = state;
        //this.emit('change', this.state);
        return this.state;
    }

    replace(key: string, value: any): T {
        const prevValue = this.get(key);
        if (typeof value === 'object' && isEqual(value, prevValue)) {
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

    restoreState(state: T, cb: () => void = null): void {
        this.clear();
        this.state = state;

        if (cb) {
            cb();
        }
        this.emit('change');
    }

    clear(): T {
        this.state = {} as T;
        this.emit('change', this.state);
        return this.state;
    }

    persist = noop;
    getConfig = noop;
    syncPrefs = noop;
}

export default ImmutableStore;
