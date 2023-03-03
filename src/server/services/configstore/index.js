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
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
import logger from '../../lib/logger';

const log = logger('service:configstore');

const defaultState = { // default state
    checkForUpdates: false,
    controller: {
        exception: {
            ignoreErrors: false
        }
    }
};

class ConfigStore extends events.EventEmitter {
    file = '';

    config = {};

    watcher = null;

    // take old file events and populate them in new file as key-value pairs
    migrate(newFile, oldFile) {
        if (fs.existsSync(oldFile)) {
            const oldConfig = JSON.parse(fs.readFileSync(oldFile, 'utf8')); // get data
            const events = oldConfig.events;
            const macros = oldConfig.macros;
            let eventMap = new Map();
            // if it's in old format, convert
            if (events instanceof Array) {
                for (let i = 0; i < events.length; i++) {
                    eventMap.set(events[i].event, events[i]);
                }
            } else if (events) { // if not, dont need to convert
                eventMap = new Map(Object.entries(events));
            }

            // create the events and move over macros
            this.config = JSON.parse(fs.readFileSync(newFile, 'utf8'));
            this.config.events = eventMap;
            this.config.macros = macros;

            this.sync();

            // rename old file
            const name = oldFile.replace('sender_rc', 'old_sender_rc');
            fs.renameSync(oldFile, name);
        }
    }

    // @param {string} file The path to a filename.
    // @return {object} The config object.
    load(file, oldFile) {
        this.file = file;
        this.reload();
        this.emit('load', this.config); // emit load event

        if (this.watcher) {
            // Stop watching for changes
            this.watcher.close();
            this.watcher = null;
        }

        try {
            if (!fs.existsSync(this.file)) {
                const content = JSON.stringify({});
                fs.writeFileSync(this.file, content, 'utf8');
            }

            this.migrate(file, oldFile);

            this.watcher = fs.watch(this.file, (eventType, filename) => {
                log.debug(`fs.watch(eventType='${eventType}', filename='${filename}')`);

                if (eventType === 'change') {
                    log.debug(`"${filename}" has been changed`);
                    const ok = this.reload();
                    ok && this.emit('change', this.config); // it is ok to emit change event
                }
            });
        } catch (err) {
            log.error(err);
            this.emit('error', err); // emit error event
        }

        return this.config;
    }

    reload() {
        try {
            if (fs.existsSync(this.file)) {
                this.config = JSON.parse(fs.readFileSync(this.file, 'utf8'));
                // migration
                const events = this.config.events;
                if (events instanceof Array) {
                    const eventMap = new Map();
                    for (let i = 0; i < events.length; i++) {
                        eventMap.set(events[i].event, events[i]);
                    }
                    this.config.events = eventMap;
                    this.sync();
                } else {
                    // format events to map
                    this.config.events = new Map(Object.entries(this.get('events', {})));
                }
            }
        } catch (err) {
            err.fileName = this.file;
            log.error(`Unable to load data from ${chalk.yellow(JSON.stringify(this.file))}: err=${err}`);
            this.emit('error', err); // emit error event
            return false;
        }

        if (!_.isPlainObject(this.config)) {
            log.error(`"${this.file}" does not contain valid JSON`);
            this.config = {};
        }

        this.config.state = {
            ...defaultState,
            ...this.config.state
        };

        return true;
    }

    sync() {
        try {
            // format map to object
            const noEventsConfig = _.clone(this.config);
            noEventsConfig.events = Object.fromEntries(this.config.events);
            const content = JSON.stringify(noEventsConfig);
            fs.writeFileSync(this.file, content, 'utf8');
        } catch (err) {
            log.error(`Unable to write data to "${this.file}"`);
            this.emit('error', err); // emit error event
            return false;
        }

        return true;
    }

    has(key) {
        return _.has(this.config, key);
    }

    get(key, defaultValue) {
        if (!this.config) {
            this.reload();
        }

        return (key !== undefined)
            ? _.get(this.config, key, defaultValue)
            : this.config;
    }

    set(key, value, options) {
        const { silent = false } = { ...options };

        if (key === undefined) {
            return;
        }

        const ok = this.reload(); // reload before making changes
        _.set(this.config, key, value);
        ok && !silent && this.sync(); // it is ok to write
    }

    unset(key) {
        if (key === undefined) {
            return;
        }

        const ok = this.reload(); // reload before making changes
        _.unset(this.config, key);
        ok && this.sync(); // it is ok to write
    }
}

const configstore = new ConfigStore();

export default configstore;
