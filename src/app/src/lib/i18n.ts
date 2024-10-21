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

import sha1 from 'sha1';
import i18next from 'i18next';

export interface i18n__Options {
    context?: object;
    count?: number;
    defaultValue?: string;
}

const t = (...args: Array<any>): string => {
    const key = args[0];
    const options = args[1];

    let text = i18next.t(key, options);
    if (typeof text === 'string' && text.length === 0) {
        text = i18next.t(key, { ...options, lng: 'en' });
    }

    return text;
};

const _ = (value: string, options: i18n__Options = {}): string => {
    const key = ((value, options) => {
        const { context, count } = { ...options };
        const containsContext = context !== undefined && context !== null;
        const containsPlural = typeof count === 'number';
        if (containsContext) {
            value = value + i18next.options.contextSeparator + options.context;
        }
        if (containsPlural) {
            value = value + i18next.options.pluralSeparator + 'plural';
        }
        return sha1(value);
    })(value, options);

    options.defaultValue = value;

    let text = i18next.t(key, options);
    if (typeof text !== 'string' || text.length === 0) {
        text = i18next.t(key, { ...options, lng: 'en' });
    }

    return text;
};

export default {
    t,
    _,
};
