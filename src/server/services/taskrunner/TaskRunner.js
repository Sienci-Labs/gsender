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

import events from 'events';
import defaultShell from 'spawn-default-shell';
import without from 'lodash/without';
import shortid from 'shortid';
import logger from '../../lib/logger';

const log = logger('service:taskrunner');

class TaskRunner extends events.EventEmitter {
    tasks = [];

    run(command, title, options) {
        if (options === undefined && typeof title === 'object') {
            options = title;
            title = '';
        }

        const taskId = shortid.generate(); // task id
        const child = defaultShell.spawn(command, {
            detached: true,
            ...options
        });
        child.unref();

        this.tasks.push(taskId);
        this.emit('start', taskId);

        child.stdout.on('data', (data) => {
            process.stdout.write(`PID:${child.pid}> ${data}`);
        });
        child.stderr.on('data', (data) => {
            process.stderr.write(`PID:${child.pid}> ${data}`);
        });
        child.on('error', (err) => {
            // Listen for error event can prevent from throwing an unhandled exception
            log.error(`Failed to start a child process: err=${JSON.stringify(err)}`);

            this.tasks = without(this.tasks, taskId);
            this.emit('error', taskId, err);
        });
        // The 'exit' event is emitted after the child process ends.
        // Note that the 'exit' event may or may not fire after an error has occurred.
        // It is important to guard against accidentally invoking handler functions multiple times.
        child.on('exit', (code) => {
            if (this.contains(taskId)) {
                this.tasks = without(this.tasks, taskId);
                this.emit('finish', taskId, code);
            }
        });

        return taskId;
    }

    contains(taskId) {
        return this.tasks.indexOf(taskId) >= 0;
    }
}

export default TaskRunner;
