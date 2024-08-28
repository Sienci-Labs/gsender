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
import { translateKey } from './utils';

class WidgetConfig {
    widgetId = '';

    constructor(widgetId: string) {
        this.widgetId = widgetId;
    }

    get(key: string, defaultValue: any): any {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = translateKey(key, this.widgetId);
        return store.get(key, defaultValue);
    }

    set(key: string, value: any): boolean {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = translateKey(key, this.widgetId);
        return store.set(key, value);
    }

    unset(key: string): object {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = translateKey(key, this.widgetId);
        return store.unset(key);
    }

    replace(key: string, value: any): object {
        if (!this.widgetId) {
            throw new Error('The widget id cannot be an empty string');
        }
        key = translateKey(key, this.widgetId);
        return store.replace(key, value);
    }
}

export default WidgetConfig;
