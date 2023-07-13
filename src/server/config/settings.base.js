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

import path from 'path';
import pkg from '../../package.json';
import { languages } from '../../../build.config';

const RC_FILE = pkg.version.includes('EDGE') ? '.edge_rc' : '.sender_rc';
const SESSION_PATH = '.sienci-sessions';

// Secret
const secret = pkg.version;

const getUserHome = () => (process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']);

export default {
    rcfile: path.resolve(getUserHome(), RC_FILE),
    verbosity: 0,
    version: pkg.version,

    // The secret key is loaded from the config file (defaults to "~/.cncrc")
    // @see "src/app/index.js"
    secret: secret,

    // Access Token Lifetime
    accessTokenLifetime: '30d', // https://github.com/zeit/ms

    // Allow Remote Access
    allowRemoteAccess: false,

    // Express view engine
    view: {
        // Set html (w/o dot) as the default extension
        defaultExtension: 'html',

        // Format: <extension>: <template>
        engines: [
            { // Hogan template with .html extension
                extension: 'html',
                template: 'hogan'
            },
            { // Hogan template with .hbs extension
                extension: 'hbs',
                template: 'hogan'
            },
            { // Hogan template with .hogan extension
                extension: 'hogan',
                template: 'hogan'
            }
        ]
    },
    // Middleware (https://github.com/senchalabs/connect)
    middleware: {
        // https://github.com/expressjs/body-parser
        'body-parser': {
            'json': {
                // maximum request body size. (default: <100kb>)
                limit: '256mb'
            },
            'urlencoded': {
                extended: true,
                // maximum request body size. (default: <100kb>)
                limit: '256mb'
            }
        },
        // https://github.com/mscdex/connect-busboy
        'busboy': {
            limits: {
                fileSize: 256 * 1024 * 1024 // 256MB
            },
            // immediate
            //   false: no immediate parsing
            //   true: immediately start reading from the request stream and parsing
            immediate: false
        },
        // https://github.com/andrewrk/node-multiparty/
        'multiparty': {
            // Limits the amount of memory a field (not a file) can allocate in bytes. If this value is exceeded, an error event is emitted. The default size is 2MB.
            maxFieldsSize: 50 * 1024 * 1024, // 20MB

            // Limits the number of fields that will be parsed before emitting an error event. A file counts as a field in this case. Defaults to 1000.
            maxFields: 1000
        },
        // https://github.com/expressjs/morgan
        'morgan': {
            // The ':id' token is defined at app.js
            format: ':id \x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m \x1b[34m:status\x1b[0m :response-time ms'
        },
        // https://github.com/expressjs/compression
        'compression': {
            // response is only compressed if the byte size is at or above this threshold.
            threshold: 512
        },
        // https://github.com/expressjs/session
        'session': {
            path: path.resolve(getUserHome(), SESSION_PATH)
        }
    },
    siofu: { // SocketIOFileUploader
        dir: './tmp/siofu'
    },
    i18next: {
        lowerCaseLng: true,

        // logs out more info (console)
        debug: false,

        // language to lookup key if not found on set language
        fallbackLng: 'en',

        // string or array of namespaces
        ns: [
            'config',
            'resource' // default
        ],

        // default namespace used if not passed to translation function
        defaultNS: 'resource',

        whitelist: languages,

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

        detection: {
            // order and from where user language should be detected
            order: ['session', 'querystring', 'cookie', 'header'],

            // keys or params to lookup language from
            lookupQuerystring: 'lang',
            lookupCookie: 'lang',
            lookupSession: 'lang',

            // cache user language
            caches: ['cookie']
        },

        backend: {
            // path where resources get loaded from
            loadPath: path.resolve(__dirname, '..', 'i18n', '{{lng}}', '{{ns}}.json'),

            // path to post missing resources
            addPath: path.resolve(__dirname, '..', 'i18n', '{{lng}}', '{{ns}}.savedMissing.json'),

            // jsonIndent to use when storing json files
            jsonIndent: 4
        }
    }
};
