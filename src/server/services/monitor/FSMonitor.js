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

import watch from 'watch';

class FSMonitor {
    root = '';

    monitor = null;

    files = {};

    watch(root) {
        watch.createMonitor(root, (monitor) => {
            this.unwatch();
            this.root = root;
            this.monitor = monitor;
            this.files = { ...monitor.files };

            monitor.on('created', (f, stat) => {
                this.files[f] = stat;
            });
            monitor.on('changed', (f, curr, prev) => {
                this.files[f] = curr;
            });
            monitor.on('removed', (f, stat) => {
                delete this.files[f];
            });
        });
    }

    unwatch() {
        if (this.monitor) {
            this.monitor.stop(); // Stop watching
            this.monitor = null;
        }
        this.files = {};
    }
}

export default FSMonitor;
