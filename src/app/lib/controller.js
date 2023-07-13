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
import isElectron from 'is-electron';
import io from 'socket.io-client';

const ensureArray = (...args) => {
    if (args.length === 0 || args[0] === undefined || args[0] === null) {
        return [];
    }
    if (args.length === 1) {
        return [].concat(args[0]);
    }
    return [].concat(args);
};

const noop = () => {};

class Controller {
    io = null;

    socket = null;

    listeners = {
        // Socket.IO Events
        // Fired upon a connection including a successful reconnection.
        'connect': [],
        // Fired upon a connection error.
        'connect_error': [],
        // Fired upon a connection timeout.
        'connect_timeout': [],
        // Fired when an error occurs.
        'error': [],
        // Fired upon a disconnection.
        'disconnect': [],
        // Fired upon a successful reconnection.
        'reconnect': [],
        // Fired upon an attempt to reconnect.
        'reconnect_attempt': [],
        // Fired upon an attempt to reconnect.
        'reconnecting': [],
        // Fired upon a reconnection attempt error.
        'reconnect_error': [],
        // Fired when couldn't reconnect within reconnectionAttempts.
        'reconnect_failed': [],
        // Fired when gcode errors are found in files...
        'gcode_error': [],
        'gcode_error_checking_file': [],

        // System ToolChange
        'startup': [],
        'config:change': [],
        'task:start': [],
        'task:finish': [],
        'task:error': [],
        'serialport:list': [],
        'serialport:change': [],
        'serialport:open': [],
        'serialport:close': [],
        'serialport:error': [],
        'serialport:read': [],
        'serialport:write': [],
        'gcode:loaded': [], // TO BE DEPRECATED
        'gcode:toolChange': [],
        'feeder:status': [],
        'workflow:pause': [],
        'sender:status': [],
        'workflow:state': [],
        'controller:settings': [],
        'controller:state': [],
        'message': [],
        'toolchange:start': [],
        'hPong': [],
        'outline:start': [],
        'file:load': [],
        'file:unload': [],
        'homing:flag': [],
        'electronErrors:errorList': [],
        'firmware:ready': [],
        'sender:M0M1': [],
        'ip:list': [],
        'wizard:next': [],
        'realtime_report': [],
        'error_clear': [],
        'toolchange:acknowledge': [],
        'cyclestart_alt': [],
        'feedhold_alt': [],
        'virtual_stop_toggle': [],
        'filetype': [],

        //A-Axis A.K.A Rotary-Axis events
        'rotaryAxis:updateState': [],
        'connection:new': [],
    };

    context = {
        xmin: 0,
        xmax: 0,
        ymin: 0,
        ymax: 0,
        zmin: 0,
        zmax: 0
    };

    // User-defined baud rates and ports
    baudrates = [];

    ports = [];

    loadedControllers = [];

    port = '';

    type = '';

    settings = {};

    state = {};

    workflow = {
        state: 'idle' // running|paused|idle
    };

    // Connection options
    host = null;

    next = null;

    options = null;

    // @param {object} io The socket.io-client module.
    constructor(io) {
        if (!io) {
            throw new Error(`Expected the socket.io-client module, but got: ${io}`);
        }

        this.io = io;
    }

    // Whether or not the client is connected.
    // @return {boolean} Returns true if the client is connected, false otherwise.
    get connected() {
        return !!(this.socket && this.socket.connected);
    }

    // Establish a connection to the server.
    // @param {string} host
    // @param {object} options
    // @param {function} next
    connect(host = '', options = {}, next = noop) {
        if (typeof next !== 'function') {
            next = noop;
        }

        options = {
            ...options,
            'reconnection': true,
            'reconnectionDelay': 500,
            'reconnectionAttempts': 10
        };

        this.host = host;
        this.next = next;
        this.options = options;

        this.socket && this.socket.destroy();
        this.socket = this.io.connect(host, options);

        this.socket.on('disconnect', () => {
            this.reconnect();
        });


        Object.keys(this.listeners).forEach((eventName) => {
            if (!this.socket) {
                return;
            }

            this.socket.on(eventName, (...args) => {
                if (eventName === 'serialport:open') {
                    const { controllerType, port } = { ...args[0] };
                    this.port = port;
                    this.type = controllerType;
                }
                if (eventName === 'serialport:close') {
                    this.port = '';
                    this.type = '';
                    this.state = {};
                    this.settings = {};
                    this.workflow.state = 'idle';
                }
                if (eventName === 'workflow:state') {
                    this.workflow.state = args[0];
                }
                if (eventName === 'controller:settings') {
                    this.type = args[0];
                    this.settings = { ...args[1] };
                }
                if (eventName === 'controller:state') {
                    this.type = args[0];
                    this.state = { ...args[1] };
                }

                const listeners = ensureArray(this.listeners[eventName]);
                listeners.forEach(listener => {
                    listener(...args);
                });
            });
        });

        this.socket.on('startup', (data) => {
            const { loadedControllers, baudrates, ports } = { ...data };

            this.loadedControllers = ensureArray(loadedControllers);

            // User-defined baud rates and ports
            this.baudrates = ensureArray(baudrates);
            this.ports = ensureArray(ports);

            if (next) {
                next(null);

                // The callback can only be called once
                next = null;
            }

            // don't want to update store if it is electron
            if (!isElectron()) {
                this.socket && this.socket.emit('newConnection');
            }
        });
    }

    // Disconnect from the server.
    disconnect() {
        this.socket && this.socket.disconnect();
        this.socket && this.socket.destroy();
        this.socket = null;
    }

    // Reconnect handler
    reconnect() {
        this.connect(this.host, this.options, this.next);
        this.socket.emit('reconnect', this.port);
    }

    // Adds the `listener` function to the end of the listeners array for the event named `eventName`.
    // @param {string} eventName The name of the event.
    // @param {function} listener The listener function.
    addListener(eventName, listener) {
        const listeners = this.listeners[eventName];
        if (!listeners || typeof listener !== 'function') {
            return false;
        }
        listeners.push(listener);
        return true;
    }

    // Removes the specified `listener` from the listener array for the event named `eventName`.
    // @param {string} eventName The name of the event.
    // @param {function} listener The listener function.
    removeListener(eventName, listener) {
        const listeners = this.listeners[eventName];
        if (!listeners || typeof listener !== 'function') {
            return false;
        }
        listeners.splice(listeners.indexOf(listener), 1);
        return true;
    }

    // Opens a connection to the given serial port.
    // @param {string} port The path of the serial port you want to open. For example, `dev/tty.XXX` on Mac and Linux, or `COM1` on Windows.
    // @param {object} [options] The options object.
    // @param {string} [options.controllerType] One of: 'Grbl', 'Smoothe', 'TinyG'. Defaults to 'Grbl'.
    // @param {number} [options.baudrate] Defaults to 115200.
    // @param {function} [callback] Called after a connection is opened.
    openPort(port, controllerType, options, callback) {
        if (typeof options !== 'object') {
            options = {};
            callback = options;
        }
        if (typeof callback !== 'function') {
            callback = noop;
        }
        this.socket && this.socket.emit('open', port, controllerType, options, callback);
    }

    // Closes an open connection.
    // @param {string} port The path of the serial port you want to close. For example, `dev/tty.XXX` on Mac and Linux, or `COM1` on Windows.
    // @param {function} [callback] Called once a connection is closed.
    closePort(port, callback) {
        if (typeof callback !== 'function') {
            callback = noop;
        }
        this.socket && this.socket.emit('close', port, callback);
    }

    //Sends an event to start flashing
    //@param {string} flashPort The port to be flashed
    //@param {string} imageType The type of image to be flashed to the port
    flashFirmware(flashPort, imageType) {
        this.socket && this.socket.emit('flash:start', flashPort, imageType);
    }

    // Retrieves a list of available serial ports with metadata.
    // @param {function} [callback] Called once completed.
    listPorts(callback) {
        this.socket && this.socket.emit('list', callback);
    }

    // Adds client to the connection
    // @param {string} port The path of the serial port you want to close. For example, `dev/tty.XXX` on Mac and Linux, or `COM1` on Windows.
    addClient(port) {
        this.socket && this.socket.emit('addclient', port);
    }

    //Send an event to get list of available IP addresses in the computer
    // @param {function} [callback] Called once completed.
    listAllIps(callback = null) {
        this.socket && this.socket.emit('listAllIps', callback);
    }

    // Executes a command on the server.
    // @param {string} cmd The command string
    // @example Example Usage
    // - Load G-code
    //   controller.command('gcode:load', name, gcode, context /* optional */, callback)
    // - Unload G-code
    //   controller.command('gcode:unload')
    // - Start sending G-code
    //   controller.command('gcode:start')
    // - Stop sending G-code
    //   controller.command('gcode:stop', { force: true })
    // - Pause
    //   controller.command('gcode:pause')
    // - Resume
    //   controller.command('gcode:resume')
    // - Feeder
    //   controller.command('feeder:feed')
    //   controller.command('feeder:start')
    //   controller.command('feeder:stop')
    //   controller.command('feeder:clear')
    // - Feed Hold
    //   controller.command('feedhold')
    // - Cycle Start
    //   controller.command('cyclestart')
    // - Status Report
    //   controller.command('statusreport')
    // - Homing
    //   controller.command('homing')
    // - Sleep
    //   controller.command('sleep')
    // - Unlock
    //   controller.command('unlock')
    // - Reset
    //   controller.command('reset')
    // - Check for State Update
    //   controller.command('checkStateUpdate')
    // - Feed Override
    //   controller.command('feedOverride')
    // - Spindle Override
    //   controller.command('spindleOverride')
    // - Rapid Override
    //   controller.command('rapidOverride')
    // - Energize Motors
    //   controller.command('energizeMotors:on')
    //   controller.command('energizeMotors:off')
    // - G-code
    //   controller.command('gcode', 'G0X0Y0', context /* optional */)
    // - Load a macro
    //   controller.command('macro:load', '<macro-id>', context /* optional */, callback)
    // - Run a macro
    //   controller.command('macro:run', '<macro-id>', context /* optional */, callback)
    // - Load file from a watch directory
    //   controller.command('watchdir:load', '/path/to/file', callback)
    command(cmd, ...args) {
        const { port } = this;
        if (!port) {
            return;
        }
        this.socket && this.socket.emit.apply(this.socket, ['command', port, cmd].concat(args));
    }

    // Writes data to the serial port.
    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    write(data, context) {
        const { port } = this;
        if (!port) {
            return;
        }
        this.socket && this.socket.emit('write', port, data, context);
    }

    // Writes data and a newline character to the serial port.
    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    writeln(data, context) {
        const { port } = this;
        if (!port) {
            return;
        }
        this.socket && this.socket.emit('writeln', port, data, context);
    }

    /**
     * Health check function run every 3 minutes
     */
    healthCheck() {
        this.socket && this.socket.emit('hPing');
    }

    unloadFile() {
        this.socket && this.socket.emit('file:unload');
    }
}

const controllerInstance = new Controller(io);

export default controllerInstance;
