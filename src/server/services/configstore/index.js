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
    },
};

const defaultMaintenance = [
    {
        id: 0,
        name: 'Clean around your CNC',
        description: 'A clean CNC is a working CNC. ' +
        'Any buildup of dust or chips can block moving components and wear them out faster, making your machine less accurate and less reliable. ' +
        'Generally a shop towel for surfaces and an old toothbrush for crevices should be able to take care of most CNCs. ' +
        'Be thorough since it’s easy to miss areas you don’t normally think about or ones covered in thin layers of dust.\n\n' +
        'Key areas to check: cutting tool collet, v-wheel inner V, v-wheel rail V, belt teeth, lead/ball screw threads, lead/ball screw nut ends, ' +
        'entire linear rail and block ends, any rotating bearings. Check your manufacturer’s maintenance page for more details.',
        rangeStart: 15,
        rangeEnd: 20,
        currentTime: 0
    },
    {
        id: 1,
        name: 'Check for Loose Hardware',
        description: 'Cutting causes vibrations which means things can come loose over time. ' +
        'Some CNCs also use components that wear out and so should be tightened to keep the machine running as accurately as possible. ' +
        'Collect all the tools you used for assembly and maintenance of your CNC then, similar to cleaning, ' +
        'closely check over all areas of your machine down to the smallest screw and re-tighten anything you find to be loose.\n\n' +
        'Key areas to check: set screws on couplers and locking nuts, attaching hardware for router/spindle, bolts attaching lead/ball ' +
        'screw nuts and linear rails and blocks, loose v-wheels, loose anti-backlash nuts, mounted electronics like motors and limit ' +
        'switches, loose electrical connectors, and structural hardware holding your machine frame together. ' +
        'Check your manufacturer’s maintenance page for more details.',
        rangeStart: 25,
        rangeEnd: 30,
        currentTime: 0
    },
    {
        id: 2,
        name: 'Lubricate Bearing Components',
        description: 'Any components that use bearings need occasional upkeep and lubrication to keep them running smoothly and to help prevent dust ' +
        'buildup which can cause them to seize. This applies to round bearings, ball screws, ball screw nuts, linear rails, and linear bearing blocks. ' +
        'Most times a slide oil or 3-in-1 oil can be used, or for ball screws a lithium grease, ' +
        'but please check your manufacturer’s maintenance page for their specific recommendations.\n\n' +
        'General steps for each component:\n' +
        '1. Fully wipe down the component with a shop towel to remove old lubricant and debris, and use an old toothbrush to get into the crevices. ' +
        'Jog the machine around to access all surfaces and use a Scotch Brite if you spot rust.\n' +
        '2. Either inject the oil/grease directly into the bearing, linear block, or ball nut, or use a shop towel to coat the rail or ball screw, ' +
        'ensuring you don’t overdo it since these components usually just need a modest top-up.\n' +
        '3. Jog all axes to their extents several times to make sure the lubricant gets fully distributed and clean up any excess if you see an accumulation.',
        rangeStart: 250,
        rangeEnd: 300,
        currentTime: 0
    },
    {
        id: 3,
        name: 'Replace Wear Components',
        description: 'Some CNC parts wear out over time and eventually need replacing. ' +
        'These are typically parts that experience a rubbing action as opposed to using bearings, such as lead screw nuts and v-wheels. ' +
        'Since these parts are considered consumable, you should be able to find them for sale from your manufacturer as well as find ' +
        'guides on how to go through the process of replacing them.',
        rangeStart: 1500,
        rangeEnd: 2000,
        currentTime: 0
    },
];

class ConfigStore extends events.EventEmitter {
    file = '';

    config = {};

    watcher = null;

    // @param {string} file The path to a filename.
    // @return {object} The config object.
    load(file) {
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

        if (!this.config.maintenance) {
            this.config.maintenance = defaultMaintenance;
        } else if (this.config.maintenance.find((task) => task.id === undefined)) {
            // migration to fix id problem
            let currID = 0;
            this.config.maintenance.forEach((task) => {
                task.id = currID;
                currID++;
            });
        }

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
