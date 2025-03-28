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
import io, { Socket } from 'socket.io-client';

export interface ControllerListeners {
    // Socket.IO Events
    // Fired upon a connection including a successful reconnection.
    connect: Array<Function>;
    // Fired upon a connection error.
    connect_error: Array<Function>;
    // Fired upon a connection timeout.
    connect_timeout: Array<Function>;
    // Fired when an error occurs.
    error: Array<Function>;
    // Fired upon a disconnection.
    disconnect: Array<Function>;
    // Fired upon a successful reconnection.
    reconnect: Array<Function>;
    // Fired upon an attempt to reconnect.
    reconnect_attempt: Array<Function>;
    // Fired upon an attempt to reconnect.
    reconnecting: Array<Function>;
    // Fired upon a reconnection attempt error.
    reconnect_error: Array<Function>;
    // Fired when couldn't reconnect within reconnectionAttempts.
    reconnect_failed: Array<Function>;
    // Fired when gcode errors are found in files...
    gcode_error: Array<Function>;
    gcode_error_checking_file: Array<Function>;

    // System ToolChange
    startup: Array<Function>;
    'config:change': Array<Function>;
    'task:start': Array<Function>;
    'task:finish': Array<Function>;
    'task:error': Array<Function>;
    'serialport:list': Array<Function>;
    'serialport:change': Array<Function>;
    'serialport:open': Array<Function>;
    'serialport:close': Array<Function>;
    'serialport:closeController': Array<Function>;
    'serialport:error': Array<Function>;
    'serialport:read': Array<Function>;
    'serialport:write': Array<Function>;
    'gcode:loaded': Array<Function>; // TO BE DEPRECATED
    'gcode:toolChange': Array<Function>;
    'feeder:status': Array<Function>;
    'workflow:pause': Array<Function>;
    'sender:status': Array<Function>;
    'workflow:state': Array<Function>;
    'controller:settings': Array<Function>;
    'controller:state': Array<Function>;
    'settings:description': Array<Function>;
    'settings:alarm': Array<Function>;
    message: Array<Function>;
    'toolchange:start': Array<Function>;
    hPong: Array<Function>;
    'outline:start': Array<Function>;
    'file:load': Array<Function>;
    'file:unload': Array<Function>;
    'homing:flag': Array<Function>;
    'electronErrors:errorList': Array<Function>;
    'firmware:ready': Array<Function>;
    'sender:M0M1': Array<Function>;
    'ip:list': Array<Function>;
    'wizard:next': Array<Function>;
    realtime_report: Array<Function>;
    error_clear: Array<Function>;
    'toolchange:acknowledge': Array<Function>;
    cyclestart_alt: Array<Function>;
    feedhold_alt: Array<Function>;
    virtual_stop_toggle: Array<Function>;
    filetype: Array<Function>;
    'toolchange:preHookComplete': Array<Function>;
    'flash:end': Array<Function>;
    'flash:message': Array<Function>;
    'flash:progress': Array<Function>;
    'spindle:add': Array<Function>;

    //A-Axis A.K.A Rotary-Axis events
    'rotaryAxis:updateState': Array<Function>;
    updateRotaryMode: Array<Function>;
    'connection:new': Array<Function>;

    requestEstimateData: Array<Function>;
    'job:start': Array<Function>;
}

const ensureArray = (...args: Array<any>) => {
    if (args.length === 0 || args[0] === undefined || args[0] === null) {
        return [];
    }
    if (args.length === 1) {
        return [].concat(args[0]);
    }
    return ([] as any).concat(args);
};

const noop = () => {};

class Controller {
    io: Function = noop;

    socket: Socket = null;

    listeners: ControllerListeners = {
        // Socket.IO Events
        // Fired upon a connection including a successful reconnection.
        connect: [],
        // Fired upon a connection error.
        connect_error: [],
        // Fired upon a connection timeout.
        connect_timeout: [],
        // Fired when an error occurs.
        error: [],
        // Fired upon a disconnection.
        disconnect: [],
        // Fired upon a successful reconnection.
        reconnect: [],
        // Fired upon an attempt to reconnect.
        reconnect_attempt: [],
        // Fired upon an attempt to reconnect.
        reconnecting: [],
        // Fired upon a reconnection attempt error.
        reconnect_error: [],
        // Fired when couldn't reconnect within reconnectionAttempts.
        reconnect_failed: [],
        // Fired when gcode errors are found in files...
        gcode_error: [],
        gcode_error_checking_file: [],

        // System ToolChange
        startup: [],
        'config:change': [],
        'task:start': [],
        'task:finish': [],
        'task:error': [],
        'serialport:list': [],
        'serialport:change': [],
        'serialport:open': [],
        'serialport:close': [],
        'serialport:closeController': [],
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
        'settings:description': [],
        'settings:alarm': [],
        message: [],
        'toolchange:start': [],
        hPong: [],
        'outline:start': [],
        'file:load': [],
        'file:unload': [],
        'homing:flag': [],
        'electronErrors:errorList': [],
        'firmware:ready': [],
        'sender:M0M1': [],
        'ip:list': [],
        'wizard:next': [],
        realtime_report: [],
        error_clear: [],
        'toolchange:acknowledge': [],
        cyclestart_alt: [],
        feedhold_alt: [],
        virtual_stop_toggle: [],
        filetype: [],
        'toolchange:preHookComplete': [],
        'flash:end': [],
        'flash:message': [],
        'flash:progress': [],
        'spindle:add': [],

        //A-Axis A.K.A Rotary-Axis events
        'rotaryAxis:updateState': [],
        updateRotaryMode: [],
        'connection:new': [],

        requestEstimateData: [],
        'job:start': [],
    };

    context = {
        xmin: 0,
        xmax: 0,
        ymin: 0,
        ymax: 0,
        zmin: 0,
        zmax: 0,
    };

    // User-defined baud rates and ports
    baudrates: Array<number> = [];

    ports: Array<string> = [];

    loadedControllers: Array<string> = [];

    port = '';

    type = '';

    settings = {};

    state = {};

    workflow = {
        state: 'idle', // running|paused|idle
    };

    // Connection options
    host: string = '';

    next = noop;

    options: object = {};

    // @param {object} io The socket.io-client module.
    constructor(io: Function) {
        if (!io) {
            throw new Error(
                `Expected the socket.io-client module, but got: ${io}`,
            );
        }

        this.io = io;
    }

    // Whether or not the client is connected.
    // @return {boolean} Returns true if the client is connected, false otherwise.
    get connected(): boolean {
        return !!(this.socket && this.socket.connected);
    }

    get portOpen(): boolean {
        return this.connected && this.port.length > 0;
    }

    // Establish a connection to the server.
    // @param {string} host
    // @param {object} options
    // @param {function} next
    connect(host = '', options = {}, next = noop): void {
        if (typeof next !== 'function') {
            next = noop;
        }

        options = {
            ...options,
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionAttempts: 10,
        };

        this.host = host;
        this.next = next;
        this.options = options;

        this.socket && this.socket.disconnect();
        this.socket = this.io(host, options).connect();

        this.socket.on('disconnect', (reason) => {
            if (reason !== 'io client disconnect') {
                this.reconnect();
            }
        });

        Object.keys(this.listeners).forEach((eventName) => {
            if (!this.socket) {
                return;
            }

            this.socket.on(eventName, (...args) => {
                if (eventName === 'serialport:open') {
                    const { controllerType = '', port = '' } = { ...args[0] };
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

                const listeners: Array<Function> = ensureArray(
                    this.listeners[eventName as keyof typeof this.listeners],
                );
                listeners.forEach((listener) => {
                    listener(...args);
                });
            });
        });

        this.socket.on('startup', (data) => {
            const {
                loadedControllers = [],
                baudrates = [],
                ports = [],
            } = { ...data };

            this.loadedControllers = ensureArray(loadedControllers);

            // User-defined baud rates and ports
            this.baudrates = ensureArray(baudrates);
            this.ports = ensureArray(ports);

            if (next) {
                next();

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
    disconnect(): void {
        this.socket && this.socket.disconnect();
        // this.socket && this.socket.destroy();
        this.socket = null;
    }

    // Reconnect handler
    reconnect(): void {
        this.connect(this.host, this.options, this.next);
        this.socket.emit('reconnect', this.port);
    }

    // Adds the `listener` function to the end of the listeners array for the event named `eventName`.
    // @param {string} eventName The name of the event.
    // @param {function} listener The listener function.
    addListener(eventName: string, listener: Function): boolean {
        const listeners =
            this.listeners[eventName as keyof typeof this.listeners];
        if (!listeners || typeof listener !== 'function') {
            return false;
        }
        listeners.push(listener);
        return true;
    }

    // Removes the specified `listener` from the listener array for the event named `eventName`.
    // @param {string} eventName The name of the event.
    // @param {function} listener The listener function.
    removeListener(eventName: string, listener?: Function): boolean {
        const listeners =
            this.listeners[eventName as keyof typeof this.listeners];
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
    openPort(port: string, options: object, callback: Function): void {
        // if (typeof options !== 'object') {
        //     options = {};
        //     callback = options;
        // }
        console.log(options);
        if (typeof callback !== 'function') {
            callback = noop;
        }
        this.socket && this.socket.emit('open', port, options, callback);
    }

    // Closes an open connection.
    // @param {string} port The path of the serial port you want to close. For example, `dev/tty.XXX` on Mac and Linux, or `COM1` on Windows.
    // @param {function} [callback] Called once a connection is closed.
    closePort(port: string, callback: Function): void {
        if (typeof callback !== 'function') {
            callback = noop;
        }
        this.socket && this.socket.emit('close', port, callback);
    }

    //Sends an event to start flashing
    //@param {string} flashPort The port to be flashed
    //@param {string} imageType The type of image to be flashed to the port
    flashFirmware(
        flashPort: string,
        imageType: string,
        isHal: boolean,
        hex: string,
    ): void {
        //TODO: not sure what type imageType is
        this.socket &&
            this.socket.emit('flash:start', flashPort, imageType, isHal, hex);
    }

    // Retrieves a list of available serial ports with metadata.
    // @param {function} [callback] Called once completed.
    listPorts(callback?: Function): void {
        this.socket && this.socket.emit('list', callback);
    }

    // Adds client to the connection
    // @param {string} port The path of the serial port you want to close. For example, `dev/tty.XXX` on Mac and Linux, or `COM1` on Windows.
    addClient(port: string): void {
        this.socket && this.socket.emit('addclient', port);
    }

    //Send an event to get list of available IP addresses in the computer
    // @param {function} [callback] Called once completed.
    listAllIps(callback: Function = null): void {
        this.socket && this.socket.emit('listAllIps', callback);
    }

    networkScan(port: string, target: string): void {
        this.socket && this.socket.emit('networkScan', port, target);
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
    command(cmd: string, ...args: Array<any>): void {
        const { port } = this;
        if (!port) {
            return;
        }

        const socketArgs = [port, cmd, ...args];
        this.socket &&
            this.socket.emit.apply(this.socket, ['command', ...socketArgs]);
    }

    // Writes data to the serial port.
    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    write(data: string, context?: object): void {
        const { port } = this;
        if (!port) {
            return;
        }
        this.socket && this.socket.emit('write', port, data, context);
    }

    // Writes data and a newline character to the serial port.
    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    writeln(data: string, context?: object): void {
        const { port } = this;
        if (!port) {
            return;
        }
        this.socket && this.socket.emit('writeln', port, data, context);
    }

    /**
     * Health check function run every 3 minutes
     */
    healthCheck(): void {
        this.socket && this.socket.emit('hPing');
    }

    unloadFile(): void {
        this.socket && this.socket.emit('file:unload');
    }
}

const controllerInstance = new Controller(io);

export const addControllerEvents = (controllerEvents: {
    [key: string]: Function;
}) => {
    Object.keys(controllerEvents).forEach((eventName) => {
        const callback = controllerEvents[eventName];
        controllerInstance.addListener(eventName, callback);
    });
};

export const removeControllerEvents = (controllerEvents: {
    [key: string]: Function;
}) => {
    Object.keys(controllerEvents).forEach((eventName) => {
        const callback = controllerEvents[eventName];
        controllerInstance.removeListener(eventName, callback);
    });
};

export default controllerInstance;
