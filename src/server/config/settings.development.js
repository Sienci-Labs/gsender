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

const maxAge = 0;

// Resolve paths relative to where the binary is executed from
// In dev: output/server-cli.js, so __dirname = /path/to/workspace/output
const getAppPath = () => {
    // __dirname will be /path/to/workspace/output
    // app is at /path/to/workspace/output/app
    return path.resolve(__dirname, 'app');
};

export default {
    route: '/', // with trailing slash
    assets: {
        app: {
            routes: [
                '' // empty path
            ],
            // In development, app is in output/app
            path: getAppPath(),
            maxAge: maxAge
        }
    },
    backend: {
        enable: true,
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
        level: 'debug'
    }
};
