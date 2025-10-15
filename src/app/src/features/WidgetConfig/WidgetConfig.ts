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

import store from 'app/store';
import { translateKey } from './utils';
import { State } from 'app/store/definitions';

export interface WidgetConfigInterface {
    get<T = any>(key: string, defaultValue: T): T;
    set<T = any>(key: string, value: T): State;
    unset(key: string): Record<string, any>;
    replace<T = any>(key: string, value: T): Record<string, any>;
}

class WidgetConfig implements WidgetConfigInterface {
    widgetId: string = '';

    constructor(widgetId: string) {
        this.widgetId = widgetId;
    }

    get<T = any>(key: string, defaultValue: T): T {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        const translatedKey = translateKey(key, this.widgetId);
        return store.get<T>(translatedKey, defaultValue);
    }

    set<T = any>(key: string, value: T): State {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        const translatedKey = translateKey(key, this.widgetId);
        return store.set(translatedKey, value);
    }

    unset(key: string): Record<string, any> {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        const translatedKey = translateKey(key, this.widgetId);
        return store.unset(translatedKey);
    }

    replace<T = any>(key: string, value: T): Record<string, any> {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        const translatedKey = translateKey(key, this.widgetId);
        return store.replace(translatedKey, value);
    }
}

export default WidgetConfig;
