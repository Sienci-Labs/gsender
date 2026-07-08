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

interface Log {
    error: Function, // 0
    warn: Function, // 1
    info: Function, // 2
    verbose: Function, // 3
    debug: Function, // 4
    silly: Function, // 5
}

const log: Log = logger('service:jobStatsStore') as Log;

const defaultJobStats = {
    jobs: [],
    totalRuntime: 0,
    totalJobs: 0,
    jobsCompleted: 0,
    jobsCancelled: 0,
};

class JobStatsStore extends events.EventEmitter {
    file = '';
    configFile = '';

    config = {};

    watcher: fs.FSWatcher | null = null;

    // @param {string} file The path to a filename.
    // @return {object} The config object.
    load(rcfile: string, jobFile: string) {
        this.file = jobFile;
        this.configFile = rcfile;

        this.reload();

        this.emit('load', this.config); // emit load event

        if (this.watcher) {
            // Stop watching for changes
            this.watcher.close();
            this.watcher = null;
        }

        try {
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
            } else {
                this.config = { jobStats: defaultJobStats };
                const content = JSON.stringify({ jobStats: defaultJobStats });
                fs.writeFileSync(this.file, content, 'utf8');
                // migration
                try {
                    if (fs.existsSync(this.configFile)) {
                        const fileConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));

                        // migrate jobs into diff file
                        if (fileConfig.jobStats) {
                            try {
                                // write jobs to new file
                                this.config = { jobStats: fileConfig.jobStats };
                                const content = JSON.stringify({ jobStats: fileConfig.jobStats });
                                fs.writeFileSync(this.file, content, 'utf8');

                                // delete jobs from config file
                                delete fileConfig.jobStats;
                                const configContent = JSON.stringify(fileConfig);
                                fs.writeFileSync(this.configFile, configContent, 'utf8');
                            } catch (err) {
                                log.error(err);
                                this.emit('error', err); // emit error event
                            }
                        }
                    }
                } catch (err) {
                    log.error(err);
                    this.emit('error', err); // emit error event
                }
            }
        } catch (err: any) {
            err.fileName = this.file;
            log.error(`Unable to load data from ${chalk.yellow(JSON.stringify(this.file))}: err=${err}`);
            this.emit('error', err); // emit error event
            return false;
        }

        if (!_.isPlainObject(this.config)) {
            log.error(`"${this.file}" does not contain valid JSON`);
            this.config = {};
        }

        return true;
    }

    sync() {
        try {
            const content = JSON.stringify(_.clone(this.config));
            fs.writeFileSync(this.file, content, 'utf8');
        } catch (err) {
            log.error(`Unable to write data to "${this.file}"`);
            this.emit('error', err); // emit error event
            return false;
        }

        return true;
    }

    has(key: string) {
        return _.has(this.config, key);
    }

    get(key: string, defaultValue: any) {
        if (!this.config) {
            this.reload();
        }

        return (key !== undefined)
            ? _.get(this.config, key, defaultValue)
            : this.config;
    }

    set(key: string, value: any, options: any) {
        const { silent = false } = { ...options };

        if (key === undefined) {
            return;
        }

        const ok = this.reload(); // reload before making changes
        _.set(this.config, key, value);
        ok && !silent && this.sync(); // it is ok to write
    }

    unset(key: string) {
        if (key === undefined) {
            return;
        }

        const ok = this.reload(); // reload before making changes
        _.unset(this.config, key);
        ok && this.sync(); // it is ok to write
    }
}

const jobstore = new JobStatsStore();

export default jobstore;
