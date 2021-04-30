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

import sha1 from 'sha1';
import i18next from 'i18next';

const t = (...args) => {
    const key = args[0];
    const options = args[1];

    let text = i18next.t(key, options);
    if (typeof text === 'string' && text.length === 0) {
        text = i18next.t(key, { ...options, lng: 'en' });
    }

    return text;
};

const _ = (...args) => {
    if ((args.length === 0) || (typeof args[0] === 'undefined')) {
        return i18next.t.apply(i18next, args);
    }

    const [value = '', options = {}] = args;
    const key = ((value, options) => {
        const { context, count } = { ...options };
        const containsContext = (context !== undefined) && (context !== null);
        const containsPlural = (typeof count === 'number');
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
    _
};
