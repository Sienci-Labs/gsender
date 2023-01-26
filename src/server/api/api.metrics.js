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

import uuid from 'uuid';
import os from 'os';
import axios from 'axios';
import isOnline from 'is-online';

import config from '../services/configstore';
import pkg from '../../package.json';
import { ERR_BAD_REQUEST } from '../constants';

const CONFIG_KEY = 'metrics';

const generateUniqueID = () => {
    const uniqueID = uuid.v4();

    config.set(`${CONFIG_KEY}.uniqueID`, uniqueID, { silent: true });

    return uniqueID;
};

export const getUniqueID = () => {
    const uniqueID = config.get(`${CONFIG_KEY}.uniqueID`);

    if (!uniqueID) {
        return generateUniqueID();
    }

    return uniqueID;
};

export const sendData = async (_, res) => {
    const payload = {
        userID: getUniqueID(),
        gSenderVersion: pkg.version,
        os: os.type(),
        osVersion: os.version(),
        release: os.release(),
        arch: os.arch(),
    };

    const ENDPOINT = process.env;

    //Don't need to ping the API
    if (process.env.NODE_ENV === 'development') {
        res.json({ message: 'Mock 200 status return' });
        return;
    }

    const internetConnectivity = await isOnline();

    if (!internetConnectivity) {
        res.status(ERR_BAD_REQUEST).send({ msg: 'Not Connected to the Internet' });
        return;
    }

    try {
        const metricsRes = await axios.post(ENDPOINT, payload);

        res.status(201).json(metricsRes.data);
    } catch (error) {
        // If Metrics app is not running locally during development
        // we can just send a mock 200 response so the client doesnt throw an error
        if (error.code === 'ECONNREFUSED' && process.env.NODE_ENV === 'development') {
            res.json({ message: 'Mock 200 OK status return' });
            return;
        }

        res.json({ error, env: process.env });
    }
};
