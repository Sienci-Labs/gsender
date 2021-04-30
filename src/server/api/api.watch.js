/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
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
