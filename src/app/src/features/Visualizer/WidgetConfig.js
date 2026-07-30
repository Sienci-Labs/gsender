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

import store from '../store';

class WidgetConfig {
    widgetId = '';

    translateKey = (key) => {
        const widgetId = this.widgetId;
        if (typeof key !== 'undefined') {
            key = `widgets["${widgetId}"].${key}`;
        } else {
            key = `widgets["${widgetId}"]`;
        }
        return key;
    };

    constructor(widgetId) {
        this.widgetId = widgetId;
    }

    get(key, defaultValue) {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = this.translateKey(key);
        return store.get(key, defaultValue);
    }

    set(key, value) {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = this.translateKey(key);
        return store.set(key, value);
    }

    unset(key) {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = this.translateKey(key);
        return store.unset(key);
    }

    replace(key, value) {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = this.translateKey(key);
        return store.replace(key, value);
    }
}

export default WidgetConfig;
