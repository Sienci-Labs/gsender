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


import { ERR_BAD_REQUEST } from '../constants';

export const uploadFile = (req, res) => {
    const { port, file } = req.body;

    if (!port) {
        return res.status(ERR_BAD_REQUEST).send({
            msg: 'No port specified'
        });
    }
    if (!file) {
        return res.status(ERR_BAD_REQUEST).send({
            msg: 'No file attached'
        });
    }
    return {
        msg: 'test'
    };
};
