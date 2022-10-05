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

import { createReducer } from 'redux-action';
import { CLOSE_CONNECTION, LIST_PORTS, OPEN_CONNECTION, SAVE_LAST_WCS } from 'app/actions/connectionActions';

const initialState = {
    isConnected: false,
    port: null,
    baudrate: '',
    ports: [],
    unrecognizedPorts: [],
    err: '',
    lastWcs: 'P1',
};

const reducer = createReducer(initialState, {
    [OPEN_CONNECTION]: (payload, reducerState) => {
        const { options } = payload;
        const { port, baudrate, inuse } = options;
        const isConnected = inuse;
        return {
            port,
            baudrate,
            isConnected
        };
    },
    [CLOSE_CONNECTION]: (payload, reducerState) => {
        const { options } = payload;
        const { port } = options;
        return {
            port,
            isConnected: false
        };
    },
    [LIST_PORTS]: (payload, reducerState) => {
        const { recognizedPorts, unrecognizedPorts } = payload;
        return {
            ports: recognizedPorts,
            unrecognizedPorts
        };
    },
    [SAVE_LAST_WCS]: (payload, reducerState) => {
        const { lastWCS } = payload;
        return {
            lastWcs: lastWCS
        };
    }
});

export default reducer;
