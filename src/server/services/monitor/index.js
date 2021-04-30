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

import fs from 'fs';
import path from 'path';
import minimatch from 'minimatch';
import FSMonitor from './FSMonitor';

const monitor = new FSMonitor();

const start = ({ watchDirectory }) => {
    monitor.watch(watchDirectory);
};

const stop = () => {
    monitor.unwatch();
};

const getFiles = (searchPath) => {
    const root = monitor.root;
    const files = Object.keys(monitor.files);
    const pattern = path.join(root, searchPath, '*');

    if (!root || pattern.indexOf(root) !== 0) {
        return [];
    }

    return minimatch
        .match(files, pattern, { matchBase: true })
        .map(file => {
            const stat = monitor.files[file] || {};

            return {
                name: path.basename(file),
                type: (function() {
                    if (stat.isFile()) {
                        return 'f';
                    }
                    if (stat.isDirectory()) {
                        return 'd';
                    }
                    if (stat.isBlockDevice()) {
                        return 'b';
                    }
                    if (stat.isCharacterDevice()) {
                        return 'c';
                    }
                    if (stat.isSymbolicLink()) {
                        return 'l';
                    }
                    if (stat.isFIFO()) {
                        return 'p';
                    }
                    if (stat.isSocket()) {
                        return 's';
                    }
                    return '';
                }()),
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime
            };
        });
};

const readFile = (file, callback) => {
    const root = monitor.root;
    file = path.join(root, file);

    fs.readFile(file, 'utf8', callback);
};

export default {
    start,
    stop,
    getFiles,
    readFile
};
