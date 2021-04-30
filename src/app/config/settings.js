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

import endsWith from 'lodash/endsWith';
import mapKeys from 'lodash/mapKeys';
import sha1 from 'sha1';
import log from 'app/lib/log';
import pkg from '../../package.json';

const webroot = '/';

const settings = {
    error: {
        // The flag is set to true if the workspace settings have become corrupted or invalid.
        // @see store/index.js
        corruptedWorkspaceSettings: false
    },
    name: pkg.name,
    productName: pkg.productName,
    version: pkg.version,
    webroot: webroot,
    log: {
        level: 'warn' // trace, debug, info, warn, error
    },
    analytics: {
        trackingId: process.env.TRACKING_ID
    },
    i18next: {
        lowerCaseLng: true,

        // logs out more info (console)
        debug: false,

        // language to lookup key if not found on set language
        fallbackLng: 'en',

        // string or array of namespaces
        ns: [
            'controller', // Grbl|Smoothie|TinyG
            'gcode', // G-code
            'resource' // default
        ],
        // default namespace used if not passed to translation function
        defaultNS: 'resource',

        // @see webpack.webconfig.xxx.js
        whitelist: process.env.LANGUAGES,

        // array of languages to preload
        preload: [],

        // language codes to lookup, given set language is 'en-US':
        // 'all' --> ['en-US', 'en', 'dev']
        // 'currentOnly' --> 'en-US'
        // 'languageOnly' --> 'en'
        load: 'currentOnly',

        // char to separate keys
        keySeparator: '.',

        // char to split namespace from key
        nsSeparator: ':',

        interpolation: {
            prefix: '{{',
            suffix: '}}'
        },

        // options for language detection
        // https://github.com/i18next/i18next-browser-languageDetector
        detection: {
            // order and from where user language should be detected
            order: ['querystring', 'cookie', 'localStorage'],

            // keys or params to lookup language from
            lookupQuerystring: 'lang',
            lookupCookie: 'lang',
            lookupLocalStorage: 'lang',

            // cache user language on
            caches: ['localStorage', 'cookie']
        },
        // options for backend
        // https://github.com/i18next/i18next-xhr-backend
        backend: {
            // path where resources get loaded from
            loadPath: webroot + 'i18n/{{lng}}/{{ns}}.json',

            // path to post missing resources
            addPath: 'api/i18n/sendMissing/{{lng}}/{{ns}}',

            // your backend server supports multiloading
            // /locales/resources.json?lng=de+en&ns=ns1+ns2
            allowMultiLoading: false,

            // parse data after it has been fetched
            parse: function(data, url) {
                log.debug(`Loading resource: url="${url}"`);

                // gcode.json
                // resource.json
                if (endsWith(url, '/gcode.json') || endsWith(url, '/resource.json')) {
                    return mapKeys(JSON.parse(data), (value, key) => sha1(key));
                }

                return JSON.parse(data);
            },

            // allow cross domain requests
            crossDomain: false
        }
    }
};

export default settings;
