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
import settings from '../config/settings';
import logger from '../lib/logger';
import config from '../services/configstore';
import {
    ERR_BAD_REQUEST,
    ERR_NOT_FOUND,
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const log = logger('api:events');
const CONFIG_KEY = 'events';

const getSanitizedRecords = () => {
    const records = config.get(CONFIG_KEY, {});

    let shouldUpdate = false;
    Object.keys(records).forEach((key) => {
        const record = records.get(key);
        if (!record.id) {
            record.id = uuid.v4();
            shouldUpdate = true;
        }

        // Defaults to true
        if (record.enabled === undefined) {
            record.enabled = true;
        }

        // Alias command
        if (!record.commands) {
            record.commands = record.command || '';
            delete record.command;
        }
    });

    if (shouldUpdate) {
        log.debug(`update sanitized records: ${JSON.stringify(records)}`);

        // Pass `{ silent changes }` will suppress the change event
        config.set(CONFIG_KEY, records, { silent: true });
    }

    return records;
};

export const fetch = (req, res) => {
    const records = getSanitizedRecords();
    res.send({ records: Object.fromEntries(records) });
};

export const create = (req, res) => {
    const {
        enabled = true,
        event = '',
        trigger = '',
        commands = ''
    } = { ...req.body };

    if (!event) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "event" parameter must not be empty'
        });
        return;
    }

    if (!trigger) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "trigger" parameter must not be empty'
        });
        return;
    }

    if (!commands) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "commands" parameter must not be empty'
        });
        return;
    }

    try {
        const records = getSanitizedRecords();
        const record = {
            id: uuid.v4(),
            mtime: new Date().getTime(),
            enabled: !!enabled,
            event: event,
            trigger: trigger,
            commands: commands
        };

        records.set(event, record);
        config.set(CONFIG_KEY, records);

        res.send({ record: record });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};

export const read = (req, res) => {
    const id = req.params.id;
    const records = getSanitizedRecords();
    const record = records.get(id);

    if (!record) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    res.send({ record: record });
};

export const update = (req, res) => {
    const id = req.params.id;
    const records = getSanitizedRecords();
    const record = records.get(id);

    if (!record) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    const {
        enabled = record.enabled,
        event = record.event,
        trigger = record.trigger,
        commands = record.commands
    } = { ...req.body };

    // Skip validation for "enabled", "event", "trigger", and "commands"

    try {
        record.mtime = new Date().getTime();
        record.enabled = Boolean(enabled);
        record.event = String(event || '');
        record.trigger = String(trigger || '');
        record.commands = String(commands || '');

        // Remove deprecated parameter
        if (record.command !== undefined) {
            delete record.command;
        }
        if (record.commands.length === 0) {
            record.enabled = false;
        }

        config.set(CONFIG_KEY, records);

        res.send({ records: Object.fromEntries(records) });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};

export const __delete = (req, res) => {
    const id = req.params.id;
    const records = getSanitizedRecords();
    const record = records.get(id);

    if (!record) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    try {
        records.delete(id);
        config.set(CONFIG_KEY, records);

        res.send({ id: record.id, event: record.event });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};

export const clearAll = (req, res) => {
    const records = getSanitizedRecords();

    try {
        records.clear();
        config.set(CONFIG_KEY, records);

        res.send({ msg: 'Successfully deleted events' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};
