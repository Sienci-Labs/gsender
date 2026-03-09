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

import os from 'os';
import path from 'path';
import urljoin from '../lib/urljoin';

const publicPath = global.PUBLIC_PATH || ''; // see gulp/task/app.js
const maxAge = (365 * 24 * 60 * 60 * 1000); // one year

// Resolve paths relative to where the binary is located
// In prod: dist/gsender/server-cli.js needs to find dist/gsender/app
const getAppPath = () => {
    // __dirname will be the bundled output location (dist/gsender)
    // We need to go from dist/gsender/server-cli.js to dist/gsender/app
    return path.resolve(__dirname, 'app');
};

export default {
    route: '/', // with trailing slash
    assets: {
        app: {
            routes: [ // with trailing slash
                urljoin(publicPath, '/'),
                '/' // fallback
            ],
            // In production, app is in dist/gsender/app
            path: getAppPath(),
            maxAge: maxAge
        }
    },
    backend: {
        enable: false, // disable backend service in production
        host: 'localhost',
        port: 80,
        route: 'api/'
    },
    cluster: {
        // note. node-inspector cannot debug child (forked) process
        enable: false,
        maxWorkers: os.cpus().length || 1
    },
    winston: {
        // https://github.com/winstonjs/winston#logging-levels
        level: 'info'
    }
};
