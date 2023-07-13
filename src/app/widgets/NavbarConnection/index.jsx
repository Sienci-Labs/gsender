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

import get from 'lodash/get';
import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import { connect } from 'react-redux';
import includes from 'lodash/includes';
//import map from 'lodash/map';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import React, { PureComponent } from 'react';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import log from 'app/lib/log';
import WidgetConfig from '../WidgetConfig';
import NavbarConnection from './NavbarConnection';

class NavbarConnectionWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        disableWizardFunction: PropTypes.func,
        enableWizardFunction: PropTypes.func
    };


    pubsubTokens = [];

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState(state => ({
                minimized: !minimized
            }));
        },
        onClickFirmwareButton: (selectedFirmware) => {
            this.setState(state => ({
                alertMessage: '',
                controllerType: selectedFirmware
            }));
            this.config.set('controller.type', selectedFirmware);
        },
        onClickPortListing: (selectedPort) => {
            this.setState(state => ({
                alertMessage: '',
                port: selectedPort.port
            }), () => {
                const { port, baudrate, controllerType } = this.state;
                this.openPort(port, controllerType, { baudrate: baudrate });
            });
        },
        toggleShowUnrecognized: () => {
            const { showUnrecognized } = this.state;
            this.setState({
                showUnrecognized: !showUnrecognized
            });
        },
        handleRefreshPorts: (event) => {
            this.refreshPorts();
        },
        handleClosePort: (event) => {
            const { port } = this.state;
            this.closePort(port);
        },
        hideUnrecognizedDevices: () => {
            this.setState({
                showUnrecognized: false
            });
        }
    };

    setConnectedState() {
        const { port, connectedBaudrate } = this.props;
        this.setState(state => ({
            alertMessage: '',
            connecting: false,
            connected: true,
            controllerType: state.controllerType,
            port: port,
            baudrate: connectedBaudrate
        }));

        log.debug(`Established a connection to the serial port "${port}"`);
    }

    setDisconnectedState() {
        this.setState(state => ({
            alertMessage: '',
            connecting: false,
            connected: false
        }));

        this.refreshPorts();
    }

    componentDidMount() {
        this.refreshPorts();
        this.attemptAutoConnect();
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            controllerType,
            port,
            baudrate,
            autoReconnect,
            connection,
        } = this.state;
        const { isConnected, type } = this.props;
        const wasConnected = prevProps.isConnected;
        if (!wasConnected && isConnected) {
            this.setConnectedState();
        }
        if (!isConnected && wasConnected) {
            this.setDisconnectedState();
        }

        this.config.set('minimized', minimized);
        if (controllerType !== type) {
            this.config.set('controller.type', controllerType);
        }
        if (port) {
            this.config.set('port', port);
        }
        if (baudrate) {
            this.config.set('baudrate', baudrate);
        }
        if (connection) {
            this.config.set('connection.serial.rtscts', get(connection, 'serial.rtscts', false));
        }
        this.config.set('autoReconnect', autoReconnect);
    }

    getInitialState() {
        let controllerType = this.config.get('controller.type');
        if (!includes(controller.loadedControllers, controllerType)) {
            controllerType = controller.loadedControllers[0];
        }

        // Common baud rates
        const defaultBaudrates = [
            250000,
            115200,
            57600,
            38400,
            19200,
            9600,
            2400
        ];

        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            loading: false,
            connecting: false,
            connected: false,
            baudrates: reverse(sortBy(uniq(controller.baudrates.concat(defaultBaudrates)))),
            controllerType: controllerType,
            port: this.config.get('port'),
            baudrate: this.config.get('baudrate'),
            connection: {
                serial: {
                    rtscts: this.config.get('connection.serial.rtscts')
                }
            },
            autoReconnect: this.config.get('autoReconnect'),
            hasReconnected: false,
            alertMessage: '',
            showUnrecognized: false,
            grblExists: true,
        };
    }

    startLoading() {
        const delay = 5 * 1000; // wait for 5 seconds

        this.setState(state => ({
            loading: true
        }));
        this._loadingTimer = setTimeout(() => {
            this.setState(state => ({
                loading: false
            }));
        }, delay);
    }

    attemptAutoConnect() {
        const { autoReconnect, hasReconnected, port, baudrate, controllerType } = this.state;
        const { ports } = this.props;

        if (autoReconnect && !hasReconnected) {
            this.setState(state => ({
                hasReconnected: true
            }));
            this.openPort(port, controllerType, {
                baudrate: baudrate
            });
        } else {
            this.setState(state => ({
                alertMessage: '',
                ports: ports
            }));
        }
    }

    stopLoading() {
        if (this._loadingTimer) {
            clearTimeout(this._loadingTimer);
            this._loadingTimer = null;
        }
        this.setState(state => ({
            loading: false
        }));
    }

    refreshPorts() {
        if (!controller.connected) {
            controller.reconnect();
        }
        this.startLoading();
        controller.listPorts();
    }

    openPort(port, controllerType, options) {
        const { baudrate } = { ...options };

        this.setState(state => ({
            connecting: true
        }));

        controller.openPort(port, controllerType, {
            baudrate: baudrate,
            rtscts: this.state.connection.serial.rtscts
        }, (err) => {
            if (err) {
                this.setState(state => ({
                    alertMessage: i18n._('Error opening port \'{{- port}}\'', { port: port }),
                    connecting: false,
                    connected: false
                }));

                log.error(err);
                return;
            }
        });
    }

    closePort(port = this.state.port) {
        this.setState(state => ({
            connecting: false,
            connected: false
        }));
        controller.closePort(port, (err) => {
            if (err) {
                log.error(err);
                return;
            }

            // Refresh ports
            controller.listPorts();
        });
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('autoReconnect:update', (msg, value) => {
                this.setState({
                    autoReconnect: value
                });
            }),
            pubsub.subscribe('baudrate:update', (msg, value) => {
                this.setState({
                    baudrate: value
                });
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    render() {
        const { ports, unrecognizedPorts } = this.props;
        const state = {
            ...this.state,
            ports,
            unrecognizedPorts
        };
        const actions = {
            ...this.actions
        };

        return (
            <NavbarConnection actions={actions} state={state} />
        );
    }
}

export default connect((store) => {
    const ports = get(store, 'connection.ports');
    const unrecognizedPorts = get(store, 'connection.unrecognizedPorts', []);
    const isConnected = get(store, 'connection.isConnected');
    const type = get(store, 'controller.type');
    const port = get(store, 'connection.port');
    const connectedBaudrate = get(store, 'connection.baudrate');
    const state = get(store, 'controller.state');
    return {
        ports,
        isConnected,
        type,
        port,
        connectedBaudrate,
        unrecognizedPorts,
        state
    };
})(NavbarConnectionWidget);
