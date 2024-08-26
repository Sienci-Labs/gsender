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

import {
    CLOSE_CONNECTION,
    LIST_PORTS,
    OPEN_CONNECTION,
    SCAN_NETWORK,
} from '../actions/connectionActions';

interface ConnectionState {
    isConnected: boolean;
    isScanning: boolean;
    port: string | null;
    baudrate: string;
    ports: string[];
    unrecognizedPorts: string[];
    networkPorts: string[];
    err: string;
}

const initialState: ConnectionState = {
    isConnected: false,
    isScanning: false,
    port: null,
    baudrate: '',
    ports: [],
    unrecognizedPorts: [],
    networkPorts: [],
    err: '',
};

const reducer = createReducer<ConnectionState>(initialState, {
    [OPEN_CONNECTION]: (state, { port, baudrate, isConnected }) => {
        return {
            ...state,
            port,
            baudrate,
            isConnected,
        };
    },
    [CLOSE_CONNECTION]: (state, { port }) => {
        return {
            ...state,
            port,
            isConnected: false,
        };
    },
    [LIST_PORTS]: (
        state,
        { ports, unrecognizedPorts, networkPorts },
    ): ConnectionState => {
        return {
            ...state,
            ports,
            unrecognizedPorts,
            networkPorts,
        };
    },
    [SCAN_NETWORK]: (
        state: ConnectionState,
        { isScanning },
    ): ConnectionState => {
        return {
            ...state,
            isScanning,
        };
    },
});

export default reducer;
