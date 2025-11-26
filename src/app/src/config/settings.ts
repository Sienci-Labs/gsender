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

import pkg from '../../package.json';
import { ConfigSettings } from './definitions';

const webroot = '/';

const settings: ConfigSettings = {
    error: {
        // The flag is set to true if the workspace settings have become corrupted or invalid.
        // @see store/index.js
        corruptedWorkspaceSettings: false,
    },
    name: pkg.name,
    productName: pkg.name,
    version: pkg.version,
    webroot: webroot,
    log: {
        level: 'warn', // trace, debug, info, warn, error
    },
};

export default settings;
