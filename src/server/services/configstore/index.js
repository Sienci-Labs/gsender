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
        name: 'Cleaning Rails & Wheels',
        description: 'Over time on the rails you’ll notice black splotches and on the wheels a faint grey buildup.' +
        'This happens when ambient dust settles on the rail edges and the wheels repeatedly roll over it.' +
        'The gunk on both the wheels and rails is easy to get off with a small brush, plastic scraper, wood scrap, or even your fingernails.' +
        'Remember to clean the rails on both the top and bottom edges and try your best to get into the crevices of all the wheels.' +
        'A trick for the wheels is to put a thin material into the top of the wheel groove while you rotate the wheel;' +
        'this works well to push out the gunk along the entire circumference.' +
        'If you have good dust collection this is something that you won’t have to do as often.',
        rangeStart: 10,
        rangeEnd: 20,
        currentTime: 0
    },
    {
        id: 1,
        name: 'Tightening Eccentric Nuts / V-Wheels',
        description: 'One simple way to tell if your wheels have the right spacing to clamp onto the rails is to check them by hand. The ‘sweet spot’ is where you’re able to barely turn each wheel with your fingers, if they spin easily or not at all then the wheel spacing is either too far apart or too close together.' +
        'If you’ve noticed any wheels have worn out, you’ll need to ‘tighten’ them back down. Get your LongMill wrench and an M5 Allen key and start by loosening the wheel bolt far enough that you can rotate the eccentric nut with the wrench.' +
        'Turn the nut so the eccentric hole gets closer to the rail which will bring the wheel closer to the rail as well (in this case turning the nut clockwise brings the wheel closer to the rail). This adjustment should be very small since it can have a big impact on the wheel placement, plus overtightening the wheels can put added stress on your machine and also cause premature wear.' +
        'Once you’re satisfied with the nut placement, re-tighten the M5 bolt with the Allen key to confirm the new location. At this point you’ll want to check both the wheel you just tightened as well as its static ‘partner’ wheel on the opposite side of the rail for the right ‘sweet spot’. Whichever wheel is on top will always be harder to spin.',
        rangeStart: 10,
        rangeEnd: 20,
        currentTime: 0
    },
    {
        id: 2,
        name: 'Tension Delrin Nuts',
        description: 'If you have the dust shield add-on for your machine, remove it so you can access the mechanics underneath.' +
        'Check X, Z, and both Y plates by moving each of them back and forth. If you can feel them wiggle a little bit even though the lead screws are stationary you may need to tension your anti-backlash nut.' +
        'Every anti-backlash nut has a tensioning screw that you can reach with an M5 Allen key.' +
        'Adjusting each screw should only happen a very very tiny rotation at a time before checking again for looseness in the plate. These screws normally require very little rotation and if you overtighten them it can put added stress on your machine and also cause premature wear.',
        rangeStart: 10,
        rangeEnd: 20,
        currentTime: 0
    },
    {
        id: 3,
        name: 'Lubricate Linear Rails',
        description: 'Wipe your linear guides with a clean cloth, paper towel, rag, or shop towel to remove any dust that may have accumulated on your linear guides. Move your Z-axis up and down if needed.' +
        'Most general-purpose lubrication options such as the 3-in-1 oil should suffice. It is not recommended to use dry lubricants or anything with particulates such as graphite in the lubricant.' +
        'Apply a liberal of machine oil or grease to your linear guides. Move your Z-axis up and down to ensure that the bearings inside have a chance to get coated.',
        rangeStart: 20,
        rangeEnd: 30,
        currentTime: 0
    },
    {
        id: 4,
        name: 'Check For Loose Hardware',
        description: 'Some key areas to check:\n' +
        'Set screws on all couplers and ACME locking nuts\n' +
        'M5 screws holding the feet onto the Y-rails and Y-axis plates onto the X-rail\n' +
        'M5 screws mounting the stepper motors to their steel plates\n' +
        'M5 screws on the router mount from in front and where it’s held in from behind\n' +
        'M3 screws holding the Z-axis steel plate on and the linear rails to the X-axis plate\n' +
        'Any assorted fasteners on any add-ons you may have received with your MK2',
        rangeStart: 20,
        rangeEnd: 30,
        currentTime: 0
    },
    {
        id: 5,
        name: 'Replace Delrin Nuts',
        description: 'These wear out over time. They need replacing every 1500-2000 hours.',
        rangeStart: 1500,
        rangeEnd: 2000,
        currentTime: 0
    },
    {
        id: 6,
        name: 'Replace V-Wheels',
        description: 'These wear out over time. They need replacing every 1500-2000 hours.',
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
