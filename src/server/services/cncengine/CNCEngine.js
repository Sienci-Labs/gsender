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

import ensureArray from 'ensure-array';
import noop from 'lodash/noop';
import partition from 'lodash/partition';
import { SerialPort } from 'serialport';
import Evilscan from 'evilscan';
import socketIO from 'socket.io';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
//import socketioJwt from 'socketio-jwt';
import EventTrigger from '../../lib/EventTrigger';
import logger from '../../lib/logger';
//import settings from '../../config/settings';
import store from '../../store';
import config from '../configstore';
import taskRunner from '../taskrunner';
import FlashingFirmware from '../../lib/Firmware/Flashing/firmwareflashing';
import {
    GrblController,
    GrblHalController
} from '../../controllers';
import { GRBL } from '../../controllers/Grbl/constants';
import { GRBLHAL } from '../../controllers/Grblhal/constants';
import {
    authorizeIPAddress,
    //validateUser
} from '../../access-control';
import DFUFlasher from '../../lib/Firmware/Flashing/DFUFlasher';
import delay from '../../lib/delay';
import SerialConnection from 'server/lib/SerialConnection';
import Connection from '../../lib/Connection';

const log = logger('service:cncengine');

// Case-insensitive equality checker.
// @param {string} str1 First string to check.
// @param {string} str2 Second string to check.
// @return {boolean} True if str1 and str2 are the same string, ignoring case.
const caseInsensitiveEquals = (str1, str2) => {
    str1 = str1 ? (str1 + '').toUpperCase() : '';
    str2 = str2 ? (str2 + '').toUpperCase() : '';
    return str1 === str2;
};

// Case insensitive includes.
// @param {array} arr Array to check.
// @param {string} val Value to check for in the array.
// @return {boolean} True if val is in arr, ignoring case.
const caseInsensitiveIncludes = (arr, val) => {
    return arr.some((arrVal) => caseInsensitiveEquals(arrVal, val));
};

const isValidController = (controller) => (
    // Standard GRBL
    caseInsensitiveEquals(GRBL, controller) ||
    // GrblHal
    caseInsensitiveEquals(GRBLHAL, controller)
);

class CNCEngine {
    controllerClass = {};

    connection = null;

    listener = {
        taskStart: (...args) => {
            if (this.io) {
                this.io.emit('task:start', ...args);
            }
        },
        taskFinish: (...args) => {
            if (this.io) {
                this.io.emit('task:finish', ...args);
            }
        },
        taskError: (...args) => {
            if (this.io) {
                this.io.emit('task:error', ...args);
            }
        },
        configChange: (...args) => {
            if (this.io) {
                this.io.emit('config:change', ...args);
            }
        }
    };

    server = null;

    io = null;

    sockets = [];

    // File content and metadata
    gcode = null;

    meta = null;

    networkDevices = [];

    // Event Trigger
    event = new EventTrigger((event, trigger, commands) => {
        log.debug(`EventTrigger: event="${event}", trigger="${trigger}", commands="${commands}"`);
        if (trigger === 'system') {
            taskRunner.run(commands);
        }
    });

    // @param {object} server The HTTP server instance.
    // @param {string} controller Specify CNC controller.
    start(server, controller = '') {
        // Fallback to an empty string if the controller is not valid
        log.debug(controller);
        if (!isValidController(controller)) {
            controller = '';
        }

        // Grbl
        if (!controller || caseInsensitiveEquals(GRBL, controller)) {
            this.controllerClass[GRBL] = GrblController;
        }
        if (!controller || caseInsensitiveEquals(GRBLHAL, controller)) {
            this.controllerClass[GRBLHAL] = GrblHalController;
        }

        if (Object.keys(this.controllerClass).length === 0) {
            throw new Error(`No valid CNC controller specified (${controller})`);
        }

        const loadedControllers = Object.keys(this.controllerClass);
        log.debug(`Loaded controllers: ${loadedControllers}`);

        this.stop();

        taskRunner.on('start', this.listener.taskStart);
        taskRunner.on('finish', this.listener.taskFinish);
        taskRunner.on('error', this.listener.taskError);
        config.on('change', this.listener.configChange);

        // System Trigger: Startup
        this.event.trigger('startup');

        this.server = server;
        this.io = socketIO(this.server, {
            serveClient: true,
            path: '/socket.io',
            pingTimeout: 60000,
            pingInterval: 25000,
            maxHttpBufferSize: 40e6
        });

        this.io.use(async (socket, next) => {
            try {
                // IP Address Access Control
                const ipaddr = socket.handshake.address;
                await authorizeIPAddress(ipaddr);

                // User Validation
                //const user = socket.decoded_token || {};
                //await validateUser(user);
            } catch (err) {
                log.warn(err);
                next(err);
                return;
            }

            next();
        });

        this.io.on('connection', (socket) => {
            this.networkDevices = [];
            const address = socket.handshake.address;
            const user = socket.decoded_token || {};
            log.debug(`New connection from ${address}: id=${socket.id}, user.id=${user.id}, user.name=${user.name}`);

            const connectionListeners = {
                'serialport:open': (port, baudrate, controllerType, inuse) => {
                    this.emit('serialport:open', port, baudrate, controllerType, inuse);
                },
                'serialport:close': (options, received) => {
                    this.connection = null;
                    this.emit('serialport:close', options, received);
                },
                'firmwareFound': (controllerType = GRBL, options, callback = noop, refresh = false) => {
                    let { port, baudrate, rtscts, network } = { ...options };
                    console.log(`Final controller type: ${controllerType}`);

                    if (typeof callback !== 'function') {
                        callback = noop;
                    }

                    let controller = store.get(`controllers["${port}"]`);
                    if (!controller) {
                        log.debug('making new controller');
                        const Controller = this.controllerClass[controllerType];
                        if (!Controller) {
                            const err = `Not supported controller: ${controllerType}`;
                            log.error(err);
                            callback(new Error(err));
                            return;
                        }

                        controller = new Controller(this, this.connection, {
                            port: port,
                            baudrate: baudrate,
                            rtscts: !!rtscts,
                            network
                        });
                    }

                    controller.addConnection(socket);
                    // Load file to controller if it exists
                    if (this.hasFileLoaded()) {
                        controller.loadFile(this.gcode, this.meta);
                        socket.emit('file:load', this.gcode, this.meta.size, this.meta.name);
                    } else {
                        log.debug('No file in CNCEngine to load to sender');
                    }

                    this.connection.addController(controller);

                    controller.open(port, baudrate, refresh, (err = null) => {
                        if (err) {
                            callback(err);
                            return;
                        }

                        // System Trigger: Open a serial port
                        // this.event.trigger('port:open');

                        if (store.get(`controllers["${port}"]`)) {
                            log.error(`Serial port "${port}" was not properly closed`);
                        }
                        store.set(`controllers[${JSON.stringify(port)}]`, controller);

                        callback(null);
                    });

                    socket.emit('serialport:openController', controllerType);
                }
            };

            const addConnectionListeners = () => {
                Object.keys(connectionListeners).forEach((eventName) => {
                    const callback = connectionListeners[eventName];
                    this.connection.on(eventName, callback);
                });
            };

            const removeConnectionListeners = () => {
                Object.keys(connectionListeners).forEach((eventName) => {
                    this.connection.removeAllListeners(eventName);
                });
            };

            // Add to the socket pool
            this.sockets.push(socket);

            socket.emit('startup', {
                loadedControllers: Object.keys(this.controllerClass),

                // User-defined baud rates and ports
                baudrates: ensureArray(config.get('baudrates', [])),
                ports: ensureArray(config.get('ports', [])),
                socketsLength: this.sockets.length
            });

            socket.on('newConnection', () => {
                // if the sockets include more than the original desktop client
                // check if electron app is defined
                if (this.sockets.length > 1 && app) {
                    const userDataPath = path.join(app.getPath('userData'), 'preferences.json');

                    if (fs.existsSync(userDataPath)) {
                        const content = fs.readFileSync(userDataPath, 'utf8') || '{}';
                        socket.emit('connection:new', content);
                    }
                }
            });

            socket.on('disconnect', () => {
                log.debug(`Disconnected from ${address}: id=${socket.id}, user.id=${user.id}, user.name=${user.name}`);

                if (!this.connection) {
                    return;
                }
                this.connection.removeConnection(socket);

                // Remove from socket pool
                this.sockets.splice(this.sockets.indexOf(socket), 1);
            });

            socket.on('reconnect', (port) => {
                if (!this.connection) {
                    const message = 'No connection object found to reconnect to';
                    log.info(message);
                    this.io.emit('task:error', message);
                    return;
                }
                log.info(`Reconnecting to open controller on port ${port} with socket ID ${socket.id}`);
                this.connection.addConnection(socket);
                if (this.connection.isOpen()) {
                    log.info('Joining port room on socket');
                    socket.join(port);
                } else {
                    log.info('connection no longer open');
                }

                let controller = store.get(`controllers["${port}"]`);
                if (!controller) {
                    const message = `No controller found on port ${port} to reconnect to`;
                    log.info(message);
                    this.io.emit('task:error', message);
                    return;
                }
                log.info(`Reconnecting to open controller on port ${port} with socket ID ${socket.id}`);
                controller.addConnection(socket);
                log.info(`Controller state: ${controller.isOpen()}`);
                if (this.connection.isOpen()) {
                    log.info('Joining port room on socket');
                    socket.join(port);
                } else {
                    log.info('Connection no longer open');
                }
            });

            socket.on('addclient', (port) => {
                if (!this.connection) {
                    log.info('No connection object found to reconnect to');
                    return;
                }
                log.info(`Adding new client to connection on port ${port} with socket ID ${socket.id}`);
                this.connection.addConnection(socket);
                log.info(`connection state: ${this.connection.isOpen()}`);

                let controller = store.get(`controllers["${port}"]`);
                if (!controller) {
                    log.info(`No controller found on port ${port} to reconnect to`);
                    return;
                }
                log.info(`Adding new client to controller on port ${port} with socket ID ${socket.id}`);
                controller.addConnection(socket);
                log.info(`Connection state: ${this.connection.isOpen()}`);
            });

            // List the available serial ports
            socket.on('list', () => {
                log.debug(`socket.list(): id=${socket.id}`);

                SerialPort.list()
                    .then(ports => {
                        ports = ports.concat(ensureArray(config.get('ports', [])));

                        const controllers = store.get('controllers', {});
                        const portsInUse =
                            Object.keys(controllers).filter(port => {
                                const controller = controllers[port];
                                return controller && controller.isOpen();
                            });

                        // Filter ports by productId to avoid non-arduino devices from appearing
                        const validProductIDs = ['6015', '6001', '606D', '003D', '0042', '0043', '2341', '7523', 'EA60', '2303', '2145', '0AD8', '08D8', '5740', '0FA7'];
                        const validVendorIDs = ['1D50', '0403', '2341', '0042', '1A86', '10C4', '067B', '03EB', '16D0', '0483'];
                        let [recognizedPorts, unrecognizedPorts] = partition(ports, (port) => {
                            if (!port.vendorId || !port.productId) {
                                return false;
                            }
                            return (
                                caseInsensitiveIncludes(validProductIDs, port.productId) &&
                                caseInsensitiveIncludes(validVendorIDs, port.vendorId)
                            );
                        });

                        const portInfoMapFn = (port) => {
                            return {
                                port: port.path,
                                manufacturer: port.manufacturer,
                                inuse: portsInUse.indexOf(port.path) >= 0
                            };
                        };

                        recognizedPorts = recognizedPorts.map(portInfoMapFn);
                        unrecognizedPorts = unrecognizedPorts.map(portInfoMapFn);
                        //unrecognizedPorts = recognizedPorts;

                        const networkPorts = this.networkDevices.map((port) => {
                            return {
                                port: port.ip,
                                manufacturer: undefined,
                                inuse: controllers[port],
                            };
                        });
                        /*unrecognizedPorts = [{
                            port: 'COM3',
                            manufacturer: 'Microsoft',
                            inuse: false
                        }, {
                            port: 'COM7',
                            manufacturer: 'Broadcom',
                            inuse: false
                        }];*/

                        socket.emit('serialport:list', recognizedPorts, unrecognizedPorts, networkPorts);
                    })
                    .catch(err => {
                        log.error(err);
                    });
            });

            //Sends back a list of available IPs in the computer
            socket.on('listAllIps', () => {
                const { networkInterfaces } = require('os');
                const _networkInterfaces = networkInterfaces();
                const ipList = [];

                //Create a list of network list name: [{IP1},{IP2}...]
                for (const networkName of Object.keys(_networkInterfaces)) {
                    for (const ips of _networkInterfaces[networkName]) {
                        //Consider only IPV4 addresses
                        if (ips.family === 'IPv4') {
                            if (ipList.indexOf(ips.address) < 0) {
                                ipList.push(ips.address);
                            }
                        }
                    }
                }
                socket.emit('ip:list', ipList);
            });

            // Open serial port
            socket.on('open', (port, options, callback) => {
                const engine = this;
                console.log(options);

                log.debug(`socket.open("${port}", ${JSON.stringify(options)}): id=${socket.id}`);

                // create new connection
                if (!this.connection) {
                    this.connection = new Connection(engine, port, options, callback);
                    removeConnectionListeners(); // remove all listeners if they exist
                    addConnectionListeners(); // add listeners back
                } else {
                    removeConnectionListeners(); // remove all listeners if they exist
                    addConnectionListeners(); // add listeners back

                    this.connection.updateOptions(options);

                    this.connection.refresh();
                }

                this.connection.addConnection(socket);

                if (this.connection.isOpen()) {
                    // Join the room
                    socket.join(port);

                    callback(null);
                    return;
                }

                this.connection.open((err = null) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    // System Trigger: Open a serial port
                    this.event.trigger('port:open');

                    callback(null);
                });
            });

            // Close serial port
            socket.on('close', (port, callback = noop) => {
                const numClients = socket.adapter.rooms?.get(port)?.size;
                if (typeof callback !== 'function') {
                    callback = noop;
                }

                log.debug(`socket.close("${port}"): id=${socket.id}`);

                const controller = store.get(`controllers["${port}"]`);
                if (!controller) {
                    const err = `Controller on "${port}" not accessible`;
                    log.error(err);
                    callback(new Error(err));
                    return;
                }

                if (!this.connection) {
                    const err = `Serial port "${port}" not accessible`;
                    log.error(err);
                    callback(new Error(err));
                    return;
                }

                // System Trigger: Close a serial port
                this.event.trigger('port:close');

                // Leave the room
                socket.leave(port);

                if (!numClients || numClients <= 1) { // if only this one was connected
                    this.connection.close();
                    this.connection = null;
                    controller.close(err => {
                        // Remove controller from store
                        store.unset(`controllers[${JSON.stringify(port)}]`);

                        // Destroy controller
                        controller.destroy();

                        callback(null);
                    });
                }

                socket.emit('serialport:close', {
                    port: port,
                });
            });

            socket.on('command', (port, cmd, ...args) => {
                log.debug(`socket.command("${port}", "${cmd}"): id=${socket.id}`);

                if (!this.connection || this.connection.isClose()) {
                    log.error(`Serial port "${port}" not accessible`);
                    return;
                }

                const controller = store.get(`controllers["${port}"]`);
                if (!controller) {
                    log.error(`controller on "${port}" not accessible`);
                    return;
                }

                controller.command.apply(controller, [cmd].concat(args));
            });

            socket.on('flash:start', (flashPort, imageType, isHal = false, data = null) => {
                log.debug(`Flashing ${flashPort}, isHal: ${isHal}, imageType: ${imageType}`);
                if (!flashPort) {
                    log.error('task:error', 'No port specified - make sure you connect to you device at least once before attempting flashing');
                    return;
                }
                let halFlasher;
                if (isHal) {
                    halFlasher = new DFUFlasher({
                        image: imageType,
                        isHal,
                        hex: data
                    });

                    halFlasher.on('error', (err) => {
                        this.emit('flash:message', { type: 'Error', content: err });
                    });

                    halFlasher.on('info', (msg) => {
                        this.emit('flash:message', { type: 'Info', content: msg });
                    });

                    halFlasher.on('end', () => {
                        this.emit('flash:end');
                    });
                    halFlasher.on('progress', (amount, total) => {
                        this.emit('flash:progress', amount, total);
                    });
                }

                const isInDFUmode = flashPort === 'SLB_DFU';

                //Close the controller for flasher utility to take over the port
                const controller = store.get('controllers["' + flashPort + '"]');
                if (controller) {
                    // handle HAL behaviour - send DFU command
                    if (isHal) {
                        // Do hal flash
                        log.debug('writing to close using DFU');
                        controller.writeln('$DFU');

                        store.unset(`controllers[${JSON.stringify(flashPort)}]`);
                        delay(1500).then(() => {
                            console.log('Flash started for HAL');
                            try {
                                halFlasher.flash(data);
                            } catch (err) {
                                this.emit('flash:message', { type: 'Error', content: err });
                            }
                        });
                        return;
                    }

                    // Normal flash - close port then flash using AVRgirl
                    this.connection.close();
                    controller.close(
                        () => {
                            FlashingFirmware(flashPort, imageType, socket);
                        }
                    );

                    store.unset(`controllers[${JSON.stringify(flashPort)}]`);

                    return;
                } else if (isHal) {
                    // This branch is if the controller is NOT connected but is HAL -  we need to connect and put into DFU with a manual serial connection
                    // We don't need to instantiate an entire controller but we can definitely use our serialport shim
                    if (!isInDFUmode) {
                        // Connect and send $DFU
                        const connect = new SerialConnection({
                            path: flashPort
                        });
                        connect.open((err) => {
                            if (err) {
                                this.emit('flash:message', { type: 'Error', content: err });
                            }
                            connect.write('$DFU\n');
                        });
                    }

                    // For both DFU and non DFU we flash
                    delay(1250).then(() => {
                        halFlasher.flash(data);
                    });

                    return;
                }

                FlashingFirmware(flashPort, imageType, socket);
            });

            socket.on('write', (port, data, context = {}) => {
                log.debug(`socket.write("${port}", "${data}", ${JSON.stringify(context)}): id=${socket.id}`);

                const controller = store.get(`controllers["${port}"]`);
                if (!this.connection || this.connection.isClose() || !controller || controller.isClose()) {
                    log.error(`Serial port "${port}" not accessible`);
                    return;
                }

                controller.write(data, context);
            });

            socket.on('writeln', (port, data, context = {}) => {
                log.debug(`socket.writeln("${port}", "${data}", ${JSON.stringify(context)}): id=${socket.id}`);
                store.set('inAppConsoleInput', data);
                const controller = store.get(`controllers["${port}"]`);
                if (!this.connection || this.connection.isClose() || !controller || controller.isClose()) {
                    log.error(`Serial port "${port}" not accessible`);
                    return;
                }

                controller.writeln(data, context);
            });

            socket.on('hPing', () => {
                log.debug(`Health check received at ${new Date().toLocaleTimeString()}`);
                socket.emit('hPong');
            });

            socket.on('file:fetch', () => {
                socket.emit('file:fetch', this.gcode, this.meta);
            });

            socket.on('file:unload', () => {
                log.debug('Socket unload called');
                this.unload();
            });

            socket.on('networkScan', (port, target) => {
                this.networkDevices = [];
                const options = {
                    target: target,
                    port: port,
                    banner: true
                };

                const scan = new Evilscan(options);

                scan.on('result', (device) => {
                    // fired when item is matching options
                    // only take open devices
                    //log.debug(device);
                    if (device.banner.includes(GRBL) || device.banner.includes(GRBLHAL)) {
                        this.networkDevices.push({
                            ...device,
                            controllerType: device.banner.includes(GRBL) ? GRBL : GRBLHAL,
                        });
                    }
                });

                scan.on('error', (err) => {
                    log.error(err);
                });

                scan.on('done', () => {
                    // finished !
                    // this.networkDevices.push({
                    //     ip: '192.168.1.1',
                    //     port: 23,
                    //     banner: GRBL,
                    //     controllerType: GRBL
                    // });
                    log.info('done scan');
                    socket.emit('networkScan:status', false);
                });

                log.info('starting network scan');
                socket.emit('networkScan:status', true);
                scan.run();
            });
        });
    }

    stop() {
        if (this.io) {
            this.io.close();
            this.io = null;
        }
        this.sockets = [];
        this.server = null;

        taskRunner.removeListener('start', this.listener.taskStart);
        taskRunner.removeListener('finish', this.listener.taskFinish);
        taskRunner.removeListener('error', this.listener.taskError);
        config.removeListener('change', this.listener.configChange);
    }

    // Emit message across all sockets
    emit(msg, ...args) {
        this.sockets.forEach((socket) => {
            socket.emit(msg, ...args);
        });
    }

    /* Functions related to loading file through server */
    // If gcode is going to live in CNCengine, we need functions to access or unload it.
    load({ port, gcode, ...meta }) {
        this.gcode = gcode;
        this.meta = meta;

        // Load the file to the sender if controller connection exists
        if (port) {
            const controller = store.get(`controllers["${port}"]`);
            if (controller) {
                controller.loadFile(this.gcode, this.meta);
            }
        }

        log.info(`Loaded file '${meta.name}' to CNCEngine`);
        this.emit('file:load', gcode, meta.size, meta.name, meta.visualizer);
    }

    unload() {
        log.info('Unloading file from CNCEngine');
        this.gcode = null;
        this.meta = null;
        this.emit('file:unload');
    }

    fetchGcode() {
        return [this.gcode, this.meta];
    }

    hasFileLoaded() {
        return this.gcode !== null;
    }
}

export default CNCEngine;
