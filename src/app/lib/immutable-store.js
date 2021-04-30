/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import _ from 'lodash';
import events from 'events';

class ImmutableStore extends events.EventEmitter {
    state = {};

    constructor(state = {}) {
        super();

        this.state = state;
    }

    get(key, defaultValue) {
        return (key === undefined) ? this.state : _.get(this.state, key, defaultValue);
    }

    set(key, value) {
        const prevValue = this.get(key);
        if (typeof value === 'object' && _.isEqual(value, prevValue)) {
            return this.state;
        }
        if (value === prevValue) {
            return this.state;
        }

        this.state = _.merge({}, this.state, _.set({}, key, value));
        this.emit('change', this.state);
        return this.state;
    }

    unset(key) {
        let state = _.extend({}, this.state);
        _.unset(state, key);
        this.state = state;
        this.emit('change', this.state);
        return this.state;
    }

    replace(key, value) {
        const prevValue = this.get(key);
        if (typeof value === 'object' && _.isEqual(value, prevValue)) {
            return this.state;
        }
        if (value === prevValue) {
            return this.state;
        }

        this.unset(key);
        this.set(key, value);
        return this.state;
    }

    clear() {
        this.state = {};
        this.emit('change', this.state);
        return this.state;
    }
}

export default ImmutableStore;
