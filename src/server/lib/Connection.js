import { EventEmitter } from 'events';
import SerialConnection from './SerialConnection';
import {
    GRBLHAL,
    GRBLHAL_REALTIME_COMMANDS,
} from '../controllers/Grblhal/constants';
import { GRBL, GRBL_REALTIME_COMMANDS } from '../controllers/Grbl/constants';
import logger from './logger';
import { noop, includes } from 'lodash';
import { WRITE_SOURCE_CLIENT } from '../controllers/constants';

const log = logger('connection');

class Connection extends EventEmitter {
    sockets = {};
    // runner = null;
    controller = null;
    controllerType = null;
    options = {};
    connection = null;
    engine = null;
    timeout = null;

    connectionEventListener = {
        data: (data) => {
            this.emit('data', data);
            log.silly(`< ${data}`);
            if (this.controllerType === null) {
                console.log('controller type: ' + this.controllerType);
            }
            if (this.controllerType === null) {
                data = ('' + data).replace(/\s+$/, '');
                if (!data) {
                    log.warn(
                        'Empty result parsed from Connection Class Parser',
                    );
                    return;
                }

                const grblR = data.match(/.*Grbl.*/);
                const grblHalR = data.match(/.*\[FIRMWARE:grblHAL\].*/);

                if (grblHalR) {
                    this.controllerType = GRBLHAL;
                    this.emit(
                        'firmwareFound',
                        GRBLHAL,
                        this.options,
                        this.callback,
                    );
                    clearInterval(this.timeout);
                } else if (grblR) {
                    this.controllerType = GRBL;
                    this.emit(
                        'firmwareFound',
                        GRBL,
                        this.options,
                        this.callback,
                    );
                    clearInterval(this.timeout);
                }
            } // we dont handle the runner
        },
        close: (err) => {
            this.emit('close', err);
            if (this.controllerType === null) {
                // const received = this.sender?.state?.received;
                if (err) {
                    log.warn(
                        `Disconnected from serial port "${this.options.port}":`,
                        err,
                    );
                }

                // this.close((err) => {
                //     // Remove controller from store
                //     const port = this.options.port;
                //     store.unset(`controllers[${JSON.stringify(port)}]`);

                //     // Destroy controller
                //     this.controller.destroy();
                // }, received);
            }
        },
        error: (err) => {
            this.emit('error', err);
            if (this.controllerType === null) {
                if (err) {
                    log.error(
                        `Unexpected error while reading/writing serial port "${this.options.port}":`,
                        err,
                    );
                }
            }
        },
    };

    // controllerEvents = {
    //     'serialport:write': (data, context) => {
    //         this.write(data, context);
    //     },
    //     'serialport:read': (data, context) => {
    //         this.write(data, context);
    //     },
    // };

    constructor(engine, port, options, callback) {
        super();
        const { baudrate, rtscts, network } = { ...options };
        this.options = {
            ...this.options,
            port: port,
            baudrate: baudrate,
            rtscts: !!rtscts,
            network,
        };
        this.callback = callback;
        this.engine = engine;

        this.connection = new SerialConnection({
            path: port,
            baudRate: baudrate,
            rtscts: !!rtscts,
            network,
            writeFilter: (data) => {
                const line = data.trim();

                if (!line) {
                    return data;
                }
                return data;
            },
        });
    }

    isOpen = () => {
        return this.connection && this.connection.isOpen;
    };

    isClose() {
        return !this.isOpen();
    }

    addConnection = (socket) => {
        if (!socket) {
            log.error('The socket parameter is not specified');
            return;
        }

        log.debug(`Add socket connection: id=${socket.id}`);
        this.sockets[socket.id] = socket;

        socket.emit('serialport:open', {
            port: this.options.port,
            baudrate: this.options.baudrate,
            controllerType: this.type,
            inuse: true,
        });
    };

    removeConnection(socket) {
        if (!socket) {
            log.error('The socket parameter is not specified');
            return;
        }

        log.debug(`Remove socket connection: id=${socket.id}`);
        this.sockets[socket.id] = undefined;
        delete this.sockets[socket.id];
    }

    open = (callback = noop) => {
        const { port, baudrate } = this.options;

        // Assertion check
        if (this.isOpen()) {
            log.error(`Cannot open serial port "${port}"`);
            return;
        }

        this.connection.on('data', this.connectionEventListener.data);
        this.connection.on('close', this.connectionEventListener.close);
        this.connection.on('error', this.connectionEventListener.error);

        this.connection.open((err) => {
            if (err) {
                log.error(`Error opening serial port "${port}":`, err);
                this.emit('serialport:error', { err: err, port: port });
                callback(err); // notify error
                return;
            }

            this.emit('serialport:open', {
                port: port,
                baudrate: baudrate,
                inuse: true,
            });

            // Emit a change event to all connected sockets
            if (this.engine.io) {
                this.engine.io.emit('serialport:change', {
                    port: port,
                    inuse: true,
                });
            }

            log.debug(`Connected to serial port "${port}"`);

            if (!this.controllerType) {
                this.timeout = setInterval(() => {
                    this.connection.writeImmediate('$I\n');
                }, 500);
            }

            // this.workflow.stop();

            // Clear action values
            // this.clearActionValues();
        });
    };

    close(callback) {
        console.log('close');
        console.log(this.options);
        const { port } = this.options;

        // Assertion check
        if (!this.connection) {
            const err = `Serial port "${port}" is not available`;
            callback(new Error(err));
            return;
        }

        // this.emit(
        //     'serialport:close',
        //     {
        //         port: port,
        //         inuse: false,
        //     },
        //     received,
        // );

        // Emit a change event to all connected sockets
        if (this.engine.io) {
            this.engine.io.emit('serialport:change', {
                port: port,
                inuse: false,
            });
        }

        if (this.isClose()) {
            callback(null);
            return;
        }

        this.connection.close(callback);
    }

    addController = (controller) => {
        this.controller = controller;

        // use correct runner
        // if (this.controllerType === GRBLHAL) {
        //     this.runner = new GrblHalRunner();
        // } else {
        //     this.runner = new GrblRunner();
        // }
        // this.connection.on('data', this.connectionEventListener.data);
        // this.connection.on('close', this.connectionEventListener.close);
        // this.connection.on('error', this.connectionEventListener.error);
    };

    write(data, context = { source: WRITE_SOURCE_CLIENT }) {
        // Assertion check
        if (this.isClose()) {
            log.error(`Serial port "${this.options.port}" is not accessible`);
            return;
        }
        if (!context) {
            context = { source: WRITE_SOURCE_CLIENT };
        }
        this.emitToSockets('serialport:write', data, context);
        this.connection.write(data, context);
        log.silly(`> ${data}`);
    }

    writeln(data, context = {}) {
        if (
            includes(GRBLHAL_REALTIME_COMMANDS, data) ||
            includes(GRBL_REALTIME_COMMANDS, data)
        ) {
            this.write(data, context);
        } else {
            this.write(data + '\n', context);
        }
    }

    writeImmediate(data) {
        this.connection.writeImmediate(data);
    }

    getSockets() {
        return this.sockets;
    }

    setWriteFilter(writeFilter) {
        this.connection.setWriteFilter(writeFilter);
    }

    emitToSockets(eventName, ...args) {
        Object.keys(this.sockets).forEach((id) => {
            const socket = this.sockets[id];
            socket.emit(eventName, ...args);
        });
    }

    destroy() {
        if (this.controller) {
            this.controller = null;
        }

        this.sockets = {};

        if (this.connection) {
            this.connection = null;
        }

        if (this.controllerType) {
            this.controllerType = null;
        }

        if (this.timeout) {
            this.timeout = null;
        }
    }
}

export default Connection;
