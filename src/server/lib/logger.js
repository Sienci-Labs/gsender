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

import util from 'util';
import chalk from 'chalk';
import winston from 'winston';
import settings from '../config/settings';

// https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
const getStackTrace = () => {
    const obj = {};
    Error.captureStackTrace(obj, getStackTrace);
    return (obj.stack || '').split('\n');
};

const VERBOSITY_MAX = 3; // -vvv

const { combine, colorize, timestamp, printf } = winston.format;

// https://github.com/winstonjs/winston/blob/master/README.md#creating-your-own-logger
const logger = winston.createLogger({
    exitOnError: false,
    level: settings.winston.level,
    silent: false,
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp(),
                printf(log => `${log.timestamp} - ${log.level} ${log.message}`)
            ),
            handleExceptions: true
        }),
        new winston.transports.File({
            filename: 'gsender_server_log.txt',
            level: 'info'
        })
    ]
});

// https://github.com/winstonjs/winston/blob/master/README.md#logging-levels
// npm logging levels are prioritized from 0 to 5 (highest to lowest):
export const levels = [
    'error', // 0
    'warn', // 1
    'info', // 2
    'verbose', // 3
    'debug', // 4
    'silly', // 5
];

export const getLevel = () => logger.level;
export const setLevel = (level) => {
    logger.level = level;
};

export default (namespace = '') => {
    namespace = String(namespace);

    return levels.reduce((acc, level) => {
        acc[level] = function(...args) {
            if ((settings.verbosity >= VERBOSITY_MAX) && (level !== 'silly')) {
                args = args.concat(getStackTrace()[2]);
            }
            return (namespace.length > 0)
                ? logger[level](chalk.cyan(namespace) + ' ' + util.format(...args))
                : logger[level](util.format(...args));
        };
        return acc;
    }, {});
};
