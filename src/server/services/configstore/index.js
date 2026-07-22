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

const defaultJobStats = {
    jobs: [],
    totalRuntime: 0,
    totalJobs: 0,
    jobsCompleted: 0,
    jobsCancelled: 0,
};

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
        description: 'Any buildup of dust or chips can block moving components and wear them out faster, making your machine less accurate and ' +
        'less reliable. We recommend a shop towel for surfaces and an old toothbrush for crevices. ' +
        'Be thorough since dust can settle on thin or in places you don’t expect.\n\n' +
        'Key areas to check: cutting tool collet, v-wheel groove, rail groove, belt teeth, lead/ball screw threads, lead/ball screw nut ends, ' +
        'entire linear rail and block ends, any rotating bearings. Check your manufacturer’s maintenance page for more details.',
        rangeStart: 15,
        rangeEnd: 20,
        currentTime: 0
    },
    {
        id: 1,
        name: 'Check for Loose Hardware',
        description: 'Vibrations and wear during cutting can cause components to loosen over time. ' +
        'Closely check over all areas of your machine and use your CNCs maintenance tools to re-tighten any loose hardware. ' +
        'Some worn parts might also need adjustment to keep your CNC running accurately.\n\n' +
        'Key areas to check: set screws on couplers and locking nuts, router/spindle attaching hardware, bolts attaching lead/ball ' +
        'screw nuts and linear rails and blocks, loose v-wheels or anti-backlash nuts, mounted electronics like motors and limit ' +
        'switches, loose electrical connectors, and structural machine frame hardware. ' +
        'Check your manufacturer’s maintenance page for more details.',
        rangeStart: 25,
        rangeEnd: 30,
        currentTime: 0
    },
    {
        id: 2,
        name: 'Lubricate Bearing Components',
        description: 'Any components with bearings need occasional cleaning and lubrication to keep them running smoothly and prevent seizing from ' +
        'dust buildup. This includes round bearings, ball screws, ball screw nuts, linear rails, and linear bearing blocks. ' +
        'You can often use a slide oil or 3-in-1 oil, or a lithium grease for ball screws, ' +
        'but please check your manufacturer’s specific recommendations.\n\n' +
        'Steps for each component:\n' +
        '1. Fully wipe down the component with a shop towel to remove old lubricant and debris, and use an old toothbrush to get into the crevices. ' +
        'Jog the machine around to access all surfaces and use a Scotch Brite if you spot rust.\n' +
        '2. Inject the oil/grease directly into the bearing, linear block, or ball nut, or use a shop towel to coat the rail or ball screw. ' +
        'It shouldn’t take too much.\n' +
        '3. Jog all axes to their extents several times to make sure the lubricant is fully distributed, then clean up any excess.',
        rangeStart: 250,
        rangeEnd: 300,
        currentTime: 0
    },
    {
        id: 3,
        name: 'Replace Worn Components',
        description: 'Some CNC parts wear out over time and eventually need replacing - like lead screw nuts and v-wheels. ' +
        'Unlike the smooth gliding of a bearing, these parts experience continuous rubbing so they’re considered consumables. ' +
        'Your manufacturer should stock replacements and tell you how to change them out. ',
        rangeStart: 1500,
        rangeEnd: 2000,
        currentTime: 0
    },
];

// Atomically write `content` to `file`: fully write + fsync a temp file, then
// rename it over the target. rename() on the same filesystem is atomic, so a
// crash/reader never observes a half-written or zero-filled file — only the
// complete old file or the complete new file. This prevents the "same byte
// count, all blank" corruption produced by an interrupted direct overwrite.
const writeFileAtomicSync = (file, content) => {
    const tmpFile = `${file}.${process.pid}.tmp`;
    const fd = fs.openSync(tmpFile, 'w');
    try {
        fs.writeFileSync(fd, content, 'utf8');
        fs.fsyncSync(fd);
    } finally {
        fs.closeSync(fd);
    }
    fs.renameSync(tmpFile, file);
};

// Startup safeguard: if the config file exists but can't be parsed as JSON
// (e.g. corrupted to all-spaces / all-NUL / any non-JSON garbage), back it up
// to a timestamped `.corrupt-<ts>.bak` beside it and reset it to defaults so
// the app can still start. Returns { restored, backupPath } for the caller to
// surface a warning to the user.
export function validateAndRepairConfigFile(file) {
    try {
        if (!fs.existsSync(file)) {
            return { restored: false };
        }
        const raw = fs.readFileSync(file, 'utf8');
        JSON.parse(raw); // throws on all-spaces / all-NUL / any non-JSON
        return { restored: false };
    } catch (err) {
        try {
            const backupPath = `${file}.corrupt-${Date.now()}.bak`;
            fs.copyFileSync(file, backupPath);
            // writeFileSync of a plain {} is sufficient — reload() backfills
            // state/maintenance/jobStats defaults on the next load.
            writeFileAtomicSync(file, JSON.stringify({}));
            log.error(`Corrupt config "${file}" backed up to "${backupPath}" and reset to defaults`);
            return { restored: true, backupPath };
        } catch (repairErr) {
            log.error(`Failed to repair corrupt config "${file}": ${repairErr}`);
            return { restored: false, repairFailed: true };
        }
    }
}

class ConfigStore extends events.EventEmitter {
    file = '';

    config = {};

    // @param {string} file The path to a filename.
    // @return {object} The config object.
    load(file) {
        this.file = file;
        this.reload();
        this.emit('load', this.config); // emit load event

        try {
            if (!fs.existsSync(this.file)) {
                writeFileAtomicSync(this.file, JSON.stringify({}));
            }
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

        if (!this.config.jobStats) {
            this.config.jobStats = defaultJobStats;
        }

        return true;
    }

    sync() {
        try {
            // format map to object
            const noEventsConfig = _.clone(this.config);
            noEventsConfig.events = Object.fromEntries(this.config.events);
            const content = JSON.stringify(noEventsConfig);

            // Never overwrite the live file with blank/unserializable content
            if (!content || content.trim().length === 0) {
                log.error(`Refusing to write empty config to "${this.file}"`);
                return false;
            }

            writeFileAtomicSync(this.file, content);
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
