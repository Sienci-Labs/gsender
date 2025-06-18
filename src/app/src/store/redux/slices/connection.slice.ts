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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConnectionState, PortInfo } from '../../definitions';

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

const connectionSlice = createSlice({
    name: 'connection',
    initialState,
    reducers: {
        openConnection: (
            state,
            action: PayloadAction<{
                port: string;
                baudrate: string;
                isConnected: boolean;
            }>,
        ) => {
            const { port, baudrate, isConnected } = action.payload;
            state.port = port;
            state.baudrate = baudrate;
            state.isConnected = isConnected;
        },
        setConnectionState: (state, action: PayloadAction<{ isConnected: boolean }>) => {
          state.isConnected = action.payload.isConnected;
        },
        closeConnection: (state, action: PayloadAction<{ port: string }>) => {
            state.port = action.payload.port;
            state.isConnected = false;
        },
        listPorts: (
            state,
            action: PayloadAction<{
                ports: Array<PortInfo>;
                unrecognizedPorts: Array<PortInfo>;
                networkPorts: Array<PortInfo>;
            }>,
        ) => {
            const { ports, unrecognizedPorts, networkPorts } = action.payload;
            state.ports = ports;
            state.unrecognizedPorts = unrecognizedPorts;
            state.networkPorts = networkPorts;
        },
        scanNetwork: (
            state,
            action: PayloadAction<{ isScanning: boolean }>,
        ) => {
            state.isScanning = action.payload.isScanning;
        },
    },
});

export const { openConnection, setConnectionState, closeConnection, listPorts, scanNetwork } =
    connectionSlice.actions;

export default connectionSlice.reducer;
