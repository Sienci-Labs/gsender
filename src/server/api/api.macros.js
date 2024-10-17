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

import find from 'lodash/find';
import castArray from 'lodash/castArray';
import isPlainObject from 'lodash/isPlainObject';
import uuid from 'uuid';
import settings from '../config/settings';
import config from '../services/configstore';
import { getPagingRange } from './paging';
import {
    ERR_BAD_REQUEST,
    ERR_NOT_FOUND,
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const CONFIG_KEY = 'macros';

const getSanitizedRecords = () => {
    const records = castArray(config.get(CONFIG_KEY, []));

    let shouldUpdate = false;
    for (let i = 0; i < records.length; ++i) {
        if (!isPlainObject(records[i])) {
            records[i] = {};
        }

        const record = records[i];

        if (!record.id) {
            record.id = uuid.v4();
            shouldUpdate = true;
        }

        // Handle migration, should only run once
        if (!record.description) {
            record.description = ' ';
            shouldUpdate = true;
        }
        if (!record.column) {
            record.column = (i % 2 === 0) ? 'column1' : 'column2';
            shouldUpdate = true;
        }
    }

    if (shouldUpdate) {
        // Pass `{ silent changes }` will suppress the change event
        config.set(CONFIG_KEY, records, { silent: true });
    }

    return records;
};

export const fetch = (req, res) => {
    const records = getSanitizedRecords();
    const paging = !!req.query.paging;

    if (paging) {
        const { page = 1, pageLength = 10 } = req.query;
        const totalRecords = records.length;
        const [begin, end] = getPagingRange({ page, pageLength, totalRecords });
        const pagedRecords = records.slice(begin, end);

        res.send({
            pagination: {
                page: Number(page),
                pageLength: Number(pageLength),
                totalRecords: Number(totalRecords)
            },
            records: pagedRecords.map(record => {
                const { id, mtime, name, content, description, column, rowIndex } = { ...record };
                return { id, mtime, name, content, description, column, rowIndex };
            })
        });
    } else {
        res.send({
            records: records.map(record => {
                const { id, mtime, name, content, description, column, rowIndex } = { ...record };
                return { id, mtime, name, content, description, column, rowIndex };
            })
        });
    }
};

export const create = (req, res) => {
    const { name, content, description = '' } = { ...req.body };

    if (!name) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "name" parameter must not be empty'
        });
        return;
    }

    if (!content) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "content" parameter must not be empty'
        });
        return;
    }

    try {
        const records = getSanitizedRecords();
        let column, rowIndex;

        const column1Length = records
            .filter(macro => macro.column === 'column1')
            .sort((a, b) => a.rowIndex - b.rowIndex)
            .length;

        const column2Length = records
            .filter(macro => macro.column === 'column2')
            .sort((a, b) => a.rowIndex - b.rowIndex)
            .length;

        if (column2Length >= column1Length) {
            column = 'column1';
            rowIndex = column1Length;
        } else {
            column = 'column2';
            rowIndex = column2Length;
        }

        const record = {
            id: uuid.v4(),
            mtime: new Date().getTime(),
            name,
            content,
            description,
            column,
            rowIndex,
        };

        records.push(record);
        config.set(CONFIG_KEY, records);

        res.send({ err: null, macro: record });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};

export const read = (req, res) => {
    const id = req.params.id;
    const records = getSanitizedRecords();
    const record = find(records, { id: id });

    if (!record) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    const { mtime, name, content, description, column, rowIndex } = { ...record };
    res.send({ id, mtime, name, content, description, column, rowIndex });
};

export const update = (req, res) => {
    const id = req.params.id;
    const records = getSanitizedRecords();
    const record = find(records, { id: id });

    if (!record) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    const {
        name = record.name,
        content = record.content,
        description = record.description,
        column = record.column,
        rowIndex = record.rowIndex
    } = { ...req.body };

    /*
    if (!name) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "name" parameter must not be empty'
        });
        return;
    }

    if (!content) {
        res.status(ERR_BAD_REQUEST).send({
            msg: 'The "content" parameter must not be empty'
        });
        return;
    }
    */

    try {
        record.mtime = new Date().getTime();
        record.name = String(name || '');
        record.content = String(content || '');
        record.description = String(description || '');
        record.column = String(column || '');
        record.rowIndex = Number(rowIndex || 0);

        config.set(CONFIG_KEY, records);

        res.send({ err: null });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};

export const __delete = (req, res) => {
    const id = req.params.id;
    const records = getSanitizedRecords();
    const record = find(records, { id: id });

    if (!record) {
        res.status(ERR_NOT_FOUND).send({
            msg: 'Not found'
        });
        return;
    }

    try {
        const filteredRecords = records.filter(record => {
            return record.id !== id;
        });
        config.set(CONFIG_KEY, filteredRecords);

        res.send({ err: null });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
        });
    }
};
