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

import deepKeys from 'deep-keys';
import _ from 'lodash';
import config from '../services/configstore';
import {
    ERR_NOT_FOUND
} from '../constants';

export const get = (req, res) => {
    const query = req.query || {};

    if (!query.key) {
        res.send(config.get('state'));
        return;
    }

    const key = `state.${query.key}`;
    if (!config.has(key)) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    const value = config.get(key);
    res.send(value);
};

export const unset = (req, res) => {
    const query = req.query || {};

    if (!query.key) {
        res.send(config.get('state'));
        return;
    }

    const key = `state.${query.key}`;
    if (!config.has(key)) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    config.unset(key);
    res.send({ err: false });
};

export const set = (req, res) => {
    const query = req.query || {};
    const data = { ...req.body };

    if (query.key) {
        config.set(`state.${query.key}`, data);
        res.send({ err: false });
        return;
    }

    deepKeys(data).forEach((key) => {
        const oldValue = config.get(`state.${key}`);
        const newValue = _.get(data, key);

        if (typeof oldValue === 'object' && typeof newValue === 'object') {
            config.set(`state.${key}`, {
                ...oldValue,
                ...newValue
            });
        } else {
            config.set(`state.${key}`, newValue);
        }
    });

    res.send({ err: false });
};
