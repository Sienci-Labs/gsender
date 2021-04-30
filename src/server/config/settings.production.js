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

import os from 'os';
import path from 'path';
import urljoin from '../lib/urljoin';

const publicPath = global.PUBLIC_PATH || ''; // see gulp/task/app.js
const maxAge = (365 * 24 * 60 * 60 * 1000); // one year

export default {
    route: '/', // with trailing slash
    assets: {
        app: {
            routes: [ // with trailing slash
                urljoin(publicPath, '/'),
                '/' // fallback
            ],
            path: path.resolve(__dirname, '..', '..', 'app'),
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
