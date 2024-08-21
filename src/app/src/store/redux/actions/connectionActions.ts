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

import { createAction } from 'redux-action';

export const OPEN_CONNECTION = 'OPEN_CONNECTION' as const;
export const CLOSE_CONNECTION = 'CLOSE_CONNECTION' as const;
export const LIST_PORTS = 'LIST_PORTS' as const;
export const SCAN_NETWORK = 'SCAN_NETWORK' as const;

export const openConnection = createAction<void>(OPEN_CONNECTION);
export const closeConnection = createAction<void>(CLOSE_CONNECTION);
export const listPorts = createAction<void>(LIST_PORTS);
export const scanNetwork = createAction<void>(SCAN_NETWORK);
