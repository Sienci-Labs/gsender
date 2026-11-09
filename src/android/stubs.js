/*
 * Copyright (C) 2026 Sienci Labs Inc.
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

// Modules that can't load on Android, swapped in at bundle time by
// scripts/android/build-payload.js (each key below is aliased by module name).
// The server already guards most Electron use with `&& app`. Serial, USB and
// flashing fail cleanly until the Android USB bridge exists, in the same
// spirit as the serialport stub in sidecar-main.js.
const unavailable = (what) =>
    new Error(`${what} is not available in the Android app yet`);

class SerialPortStub {
    // The real Android port listing goes through
    // src/server/lib/ports/AndroidPortProvider.js (CNCEngine.js's "list"
    // handler calls getPortProvider(), which never reaches this stub on
    // Android). This only exists as a defensive fallback for any other,
    // unexpected `require('serialport')` call site.
    static list() {
        try {
            // eslint-disable-next-line global-require
            return require('../server/lib/ports/UsbBridgeClient').getUsbBridgeClient().list();
        } catch (e) {
            return Promise.resolve([]);
        }
    }

    constructor() {
        throw unavailable('USB serial');
    }
}

const noop = () => {};
const consoleLevel = { silly: 'debug', verbose: 'debug', log: 'log' };
const electronLog = Object.fromEntries(
    ['error', 'warn', 'info', 'verbose', 'debug', 'silly', 'log'].map((k) => [
        k,
        (...args) => console[consoleLevel[k] || k](...args),
    ]),
);
electronLog.transports = {
    file: { level: false, getFile: () => ({ path: '' }), resolvePath: noop },
    console: { level: false },
};
electronLog.catchErrors = noop;
electronLog.initialize = noop;
electronLog.scope = () => electronLog;

module.exports = {
    electron: { app: undefined, ipcMain: undefined },
    serialport: { SerialPort: SerialPortStub },
    usb: {
        findByIds: () => undefined,
        WebUSBDevice: {
            createInstance: () => Promise.reject(unavailable('USB flashing')),
        },
    },
    avrgirl: function AvrgirlStub() {
        throw unavailable('AVR flashing');
    },
    electronLog,
    // Only imported by src/server/vite-server.js when NODE_ENV !== 'production'.
    vite: {
        createServer: () => Promise.reject(unavailable('the Vite dev server')),
    },
};
