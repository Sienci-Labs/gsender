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

// import logger from '../lib/logger';
import log from 'electron-log';
import { ERR_BAD_REQUEST } from '../constants';

// const log = logger('api:print');
const levels = [
    'error', // 0
    'warn', // 1
    'info', // 2
    'verbose', // 3
    'debug', // 4
    'silly', // 5
];

export const printLog = (req, res) => {
    const { msg, file, lineNumber, level } = { ...req.body };

    let fileMsg = '';
    let lineMsg = '';
    if (file !== null && file !== undefined) {
        fileMsg = '   ---in file ' + file;
    }
    if (lineNumber !== null && lineNumber !== undefined) {
        lineMsg = '   ---on line ' + lineNumber;
    }
    switch (level) {
    case levels[0]:
        log.error(msg);
        log.error(fileMsg);
        log.error(lineMsg);
        break;
    case levels[1]:
        log.warn(msg);
        log.warn(fileMsg);
        log.warn(lineMsg);
        break;
    case levels[2]:
        log.info(msg);
        log.info(fileMsg);
        log.info(lineMsg);
        break;
    case levels[3]:
        log.verbose(msg);
        log.verbose(fileMsg);
        log.verbose(lineMsg);
        break;
    case levels[4]:
        log.debug(msg);
        log.debug(fileMsg);
        log.debug(lineMsg);
        break;
    case levels[5]:
        log.silly(msg);
        log.silly(fileMsg);
        log.silly(lineMsg);
        break;
    default:
        return res.status(ERR_BAD_REQUEST).send({
            msg: 'invalid level: ' + level
        });
    }

    return res.send({
        msg: 'Successfully logged message',
    });
};
