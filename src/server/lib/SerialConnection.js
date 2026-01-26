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

import { EventEmitter } from 'events';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import net from 'net';

// Validation

const DATABITS = Object.freeze([5, 6, 7, 8]);
const STOPBITS = Object.freeze([1, 2]);
const PARITY = Object.freeze(['none', 'even', 'mark', 'odd', 'space']);
const FLOWCONTROLS = Object.freeze(['rtscts', 'xon', 'xoff', 'xany']);

const defaultSettings = Object.freeze({
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
});

const toIdent = (options) => {
    // Only the path option is required for generating the ident property
    const { path } = { ...options };
    return JSON.stringify({ type: 'serial', path: path });
};

class SerialConnection extends EventEmitter {
    type = 'serial';

    parser = null;

    // Readline parser
    port = null;

    // callback on state
    callback = null;

    // SerialPort
    writeFilter = (data) => data;

    eventListener = {
        data: (data) => {
            this.emit('data', data);
        },
        open: () => {
            this.emit('open');
        },
        close: (err) => {
            this.emit('close', err);
        },
        error: (err) => {
            if (err.code === 'ECONNRESET') {
                this.port.destroy();
                this.port = null;
                if (this.callback) {
                    this.callback(err);
                }
            }
            this.emit('error', err);
        },
    };

    constructor(options) {
        super();

        const { writeFilter, ...rest } = { ...options };

        if (writeFilter) {
            if (typeof writeFilter !== 'function') {
                throw new TypeError(
                    `"writeFilter" must be a function: ${writeFilter}`,
                );
            }

            this.writeFilter = writeFilter;
        }

        const settings = Object.assign({}, defaultSettings, rest);
        settings.ethernetPort = rest.ethernetPort;


        if (settings.port) {
            throw new TypeError(
                '"port" is an unknown option, did you mean "path"?',
            );
        }

        if (!settings.path) {
            throw new TypeError(`"path" is not defined: ${settings.path}`);
        }

        if (settings.baudrate) {
            throw new TypeError(
                '"baudrate" is an unknown option, did you mean "baudRate"?',
            );
        }

        if (typeof settings.baudRate !== 'number') {
            throw new TypeError(
                `"baudRate" must be a number: ${settings.baudRate}`,
            );
        }

        if (DATABITS.indexOf(settings.dataBits) < 0) {
            throw new TypeError(`"databits" is invalid: ${settings.dataBits}`);
        }

        if (STOPBITS.indexOf(settings.stopBits) < 0) {
            throw new TypeError(`"stopbits" is invalid: ${settings.stopbits}`);
        }

        if (PARITY.indexOf(settings.parity) < 0) {
            throw new TypeError(`"parity" is invalid: ${settings.parity}`);
        }

        FLOWCONTROLS.forEach((control) => {
            if (typeof settings[control] !== 'boolean') {
                throw new TypeError(
                    `"${control}" is not boolean: ${settings[control]}`,
                );
            }
        });

        Object.defineProperties(this, {
            settings: {
                enumerable: true,
                value: settings,
                writable: false,
            },
        });
    }

    get ident() {
        return toIdent(this.settings);
    }

    get isOpen() {
        if (this.settings.network) {
            return this.port && this.port.writable;
        }
        return this.port && this.port.isOpen;
    }

    get isClose() {
        return !this.isOpen;
    }

    // @param {function} callback The error-first callback.
    open(callback) {
        this.callback = callback;
        const { path, baudRate, network, ethernetPort, ...rest } = this.settings;

        const ip = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
        const expr = new RegExp(`^${ip}\.${ip}\.${ip}\.${ip}$`, 'g');
        const looksLikeIP = path.match(expr);

        if (this.port && !looksLikeIP) {
            const err = new Error(
                `Cannot open serial port "${this.settings.path}"`,
            );
            callback(err);
            return;
        }

        // Single telnet - don't return early, just close it and reopen it
        if (this.port && (network || looksLikeIP)) {
            this.port.destroy();
            this.port = null;
            const err = new Error('Serial port connection reset');
            callback(err);
            return;
        }

        console.log(`Conection to port ${ethernetPort}`);

        if (network || looksLikeIP) {
            this.port = new net.Socket();
            this.port.setTimeout(4000, () => {
                this.port.destroy();
                callback('Connection timeout');
            });

            this.port.once('connect', () => {
                this.port.setTimeout(0);
                callback();
            });
            this.port.on('error', (err) => {
                this.port.setTimeout(0);
                this.port.destroy();
                callback(err);
            });

            this.addPortListeners();
            this.port.connect(ethernetPort, path);
        } else {
            this.port = new SerialPort({
                path,
                baudRate,
                ...rest,
                autoOpen: false,
            });
            this.addPortListeners();
            this.port.open(callback);
        }
    }

    addPortListeners() {
        this.port.removeAllListeners();
        this.port.on('open', this.eventListener.open);
        this.port.on('close', this.eventListener.close);
        this.port.on('error', this.eventListener.error);

        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.parser.on('data', this.eventListener.data);
    }

    // @param {function} callback The error-first callback.
    close(callback) {
        if (!this.port) {
            const err = new Error(
                `Cannot close serial port "${this.settings.path}"`,
            );
            callback && callback(err);
            return;
        }

        this.port.removeListener('open', this.eventListener.open);
        this.port.removeListener('close', this.eventListener.close);
        this.port.removeListener('error', this.eventListener.error);
        this.parser.removeListener('data', this.eventListener.data);

        if (this.settings.network) {
            this.port.on('close', () => {
                callback();
            });
            this.port.destroy();
        } else {
            this.port.close(callback);
        }

        this.port = null;
        this.parser = null;
    }

    write(data, context) {
        if (!this.port) {
            return;
        }

        data = this.writeFilter(data, context);
        this.port.write(Buffer.from(data));
    }

    writeImmediate(data) {
        this.port.write(data);
    }

    setWriteFilter(writeFilter) {
        this.writeFilter = writeFilter;
    }
}

export { toIdent };
export default SerialConnection;
