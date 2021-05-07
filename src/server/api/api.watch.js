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

import monitor from '../services/monitor';
import {
    ERR_NOT_FOUND,
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

export const getFiles = (req, res) => {
    const path = req.body.path || req.query.path || '';
    const files = monitor.getFiles(path);

    res.send({ path: path, files: files });
};

export const readFile = (req, res) => {
    const file = req.body.file || req.query.file || '';

    monitor.readFile(file, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(ERR_NOT_FOUND).send({
                    msg: 'File not found'
                });
            } else {
                res.status(ERR_INTERNAL_SERVER_ERROR).send({
                    msg: 'Failed reading file'
                });
            }
            return;
        }

        res.send({ file: file, data: data });
    });
};
