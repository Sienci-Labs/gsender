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

import logger from '../lib/logger';
import config from '../services/configstore';
import pkg from '../../package.json';
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER_ERROR } from '../constants';
import { USER_DATA_COLLECTION } from '../../app/src/constants';

const CONFIG_KEY = 'metrics';

const log = logger('api:metrics');

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

export const toggleCollectData = (req, res) => {
    const { collectUserDataStatus } = req.body;

    config.set(`${CONFIG_KEY}.collectUserData`, collectUserDataStatus);

    res.json({ collectUserDataStatus });
};

export const getCollectDataStatus = (_, res) => {
    const collectUserDataStatus = config.get(`${CONFIG_KEY}.collectUserData`, USER_DATA_COLLECTION.INITIAL);

    res.json({ collectUserDataStatus });
};

export const sendData = async (req, res) => {
    const payload = {
        userID: getUniqueID(),
        gSenderVersion: pkg.version,
        os: os.type(),
        osVersion: os.version(),
        release: os.release(),
        arch: os.arch(),
        machineProfile: JSON.stringify(req.body),
    };

    const ENDPOINT = global.METRICS_ENDPOINT;
    const NODE_ENV = global.NODE_ENV;

    //Don't need to ping the API
    if (NODE_ENV === 'development') {
        res.json({ message: 'Mock 200 status return' });
        return;
    }

    const internetConnectivity = await isOnline();

    if (!internetConnectivity) {
        res.status(ERR_BAD_REQUEST).send({ msg: 'Not Connected to the Internet' });
        return;
    }

    try {
        const metricsRes = await axios.post(`${ENDPOINT}/metrics`, payload);

        res.status(201).json(metricsRes.data);
    } catch (error) {
        log.debug(`Error Sending Usage Data for ${payload.userID}. API Might Be Offline.`);
        res.status(ERR_INTERNAL_SERVER_ERROR).json({ error });
    }
};

export const sendUsageData = async (req, res) => {
    const payload = {
        toolName: req.body?.data,
        user: {
            gSenderVersion: pkg.version,
            os: os.type(),
            osVersion: os.version(),
            release: os.release(),
            arch: os.arch(),
            userID: getUniqueID(),
        },
    };

    const ENDPOINT = global.METRICS_ENDPOINT;

    const NODE_ENV = global.NODE_ENV;

    //Don't need to ping the API
    if (NODE_ENV === 'development') {
        res.json({ message: 'Mock 200 status return' });
        return;
    }

    const internetConnectivity = await isOnline();

    if (!internetConnectivity) {
        res.status(ERR_BAD_REQUEST).send({ msg: 'Not Connected to the Internet' });
        return;
    }

    try {
        const usageRes = await axios.post(`${ENDPOINT}/usage`, payload);

        res.status(201).json(usageRes.data);
    } catch (error) {
        log.debug(`Error Sending Usage Data for ${payload.userID}. API Might Be Offline.`);
        res.status(ERR_INTERNAL_SERVER_ERROR).json({ error });
    }
};
