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

import constants from 'namespace-constants';
import { createAction } from 'redux-action';

export const {
    OPEN_CONNECTION,
    CLOSE_CONNECTION,
    LIST_PORTS,
    SAVE_LAST_WCS,
} = constants('connection', [
    'OPEN_CONNECTION',
    'CLOSE_CONNECTION',
    'LIST_PORTS',
    'SAVE_LAST_WCS',
]);

export const openConnection = createAction(OPEN_CONNECTION);
export const closeConnection = createAction(CLOSE_CONNECTION);
export const listPorts = createAction(LIST_PORTS);
export const saveLastWcs = createAction(SAVE_LAST_WCS);
