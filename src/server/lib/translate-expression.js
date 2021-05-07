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

import evaluateExpression from './evaluate-expression';
import logger from './logger';

const log = logger('translate-expression');
const re = new RegExp(/\[[^\]]+\]/g);

const translateExpression = (data, vars = {}) => {
    if (!data) {
        return '';
    }

    try {
        data = String(data).replace(re, (match) => {
            const src = match.slice(1, -1);
            const value = evaluateExpression(src, vars);
            return value !== undefined ? value : match;
        });
    } catch (e) {
        log.error(`data="${data}", vars=${JSON.stringify(vars)}`);
        log.error(e);
    }

    return data;
};

export default translateExpression;
