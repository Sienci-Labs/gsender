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

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cx from 'classnames';
import pubsub from 'pubsub-js';
import store from 'app/store';
import UnrecognizedDevices from 'app/widgets/NavbarConnection/UnrecognizedDevices';
import PortListing from './PortListing';
import styles from './Index.styl';
import StatusIndicator from './StatusIndicator';
import FirmwareSelector from './FirmwareSelector';
import { GRBLHAL } from 'Constants';
import FirmwareListing from './FirmwareListing';


class NavbarConnection extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        connected: PropTypes.bool
    };

    constructor() {
        super();
        this.displayDropdown = this.displayDropdown.bind(this);
    }

    state = {
        mobile: false,
        isActive: false,
        ip: store.get('widgets.connection.ip', [192, 168, 1]),
        startedScan: false,
        hasScanned: false
    }

    tokens = [];

    componentDidMount() {
        this.addResizeEventListener();
        this.updateScreenSize();
        this.subscribe();
    }

    componentWillUnmount() {
        this.removeResizeEventListener();
    }

    componentDidUpdate() {
        const { scanning } = this.props.state;
        const { startedScan, hasScanned } = this.state;
        if (scanning) {
            this.setState({ startedScan: true });
        } else if (startedScan && !hasScanned) {
            this.setState({ hasScanned: true });
        }
    }

    subscribe() {
        this.tokens = [
            pubsub.subscribe('networkScan:finished', () => {
                this.props.actions.handleRefreshPorts();
            }),
            pubsub.subscribe('networkScan:ipRange', (msg, ipRange) => {
                this.setState({ ip: ipRange });
            })
        ];
    }

    unsubscribe() {
        this.tokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.tokens = [];
    }

    addResizeEventListener() {
        this.onResizeThrottled = _.throttle(this.updateScreenSize, 25);

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', this.onResizeThrottled);
        }
    }

    removeResizeEventListener() {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', this.onResizeThrottled);
        }

        this.onResizeThrottled = null;
    }

    updateScreenSize = () => {
        const isMobile = window?.visualViewport?.width <= 599;

        this.setState({
            mobile: isMobile
        });
    };

    getConnectionStatusText = (connected, connecting, scanning, alertMessage,) => {
        if (connected) {
            return 'Connected';
        } else if (alertMessage) {
            return alertMessage;
        } else if (connecting) {
            return 'Connecting...';
        } else if (scanning) {
            return 'Scanning...';
        }
        return 'Connect to Machine ▼';
    };

    displayDropdown() {
        const { mobile, isActive } = this.state;
        if (mobile) {
            this.setState({ isActive: !isActive });
        }
    }

    onIPChange(value, index) {
        const { ip } = this.state;
        let newIp = ip;
        newIp[index] = value;
        this.setState({
            ip: newIp
        });
    }

    getIPString() {
        const ip = store.get('widgets.connection.ip', [192, 168, 5, 1]);
        return `${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}`;
    }

    render() {
        const { state, actions } = this.props;
        const {
            connected,
            ports,
            connecting,
            scanning,
            baudrate,
            controllerType,
            alertMessage,
            port,
            unrecognizedPorts,
            showUnrecognized,
            showControllers
        } = state;
        const { isActive } = this.state;
        const isMobile = window?.visualViewport?.width <= 599;
        const ip = this.getIPString();

        const firmwareList = ['Grbl', 'grblHAL'];

        return (
            <div
                id="parent"
                className={isMobile ? styles.NavbarConnectionMobile : styles.NavbarConnection}
                role="button"
                tabIndex={0}
                onClick={this.displayDropdown}
                onKeyDown={this.displayDropdown}
                onMouseEnter={(event) => {
                    // if mouse is entering any child, don't refresh
                    if (event.target.id === 'parent') {
                        actions.handleRefreshPorts();
                    }
                }}
                onMouseLeave={actions.hideUnrecognizedDevicesAndFirmwareList}
                onTouchEnd={actions.handleRefreshPorts}
            >
                <div>
                    <StatusIndicator {...{ connected, connecting, alertMessage }} />
                </div>
                <div>
                    <div className="dropdown-label" id="connection-selection-list">
                        {this.getConnectionStatusText(connected, connecting, scanning, alertMessage)}
                    </div>
                </div>
                {
                    connected && (
                        <div className={styles.ConnectionInfo}>
                            <div className={styles.portLabel}>{port}</div>
                            <div>{controllerType}</div>
                        </div>
                    )
                }
                {
                    connected && (
                        <button type="button" className={styles.disconnectButton} onClick={actions.handleClosePort}>
                            <i className="fa fa-unlink" />
                            Disconnect
                        </button>
                    )
                }
                <div style={isMobile ? { display: isActive ? 'block' : 'none' } : null} className={styles.NavbarConnectionDropdownList}>
                    {
                        !connected && <h5>Recognized Devices</h5>
                    }
                    {
                        !connected && (ports.length === 0) && (
                            <div className={styles.noDevicesWarning}>
                                No Devices Found
                            </div>
                        )
                    }
                    {
                        !connected && !connecting && ports.map(
                            port => (
                                <PortListing
                                    {...port}
                                    key={port.port}
                                    baudrate={baudrate}
                                    controllerType={controllerType}
                                    onClick={() => actions.onClickPortListing(port)}
                                />
                            )
                        )
                    }
                    {
                        !connected && controllerType === GRBLHAL && <h5>Network Devices</h5>
                    }
                    {
                        !connected && controllerType === GRBLHAL && (
                            <div className={cx(styles.firmwareSelector, styles.bottomSpace)}>
                                <PortListing
                                    port={ip}
                                    key="network_port"
                                    network={true}
                                    onClick={() => actions.onClickPortListing({ port: ip }, true)}
                                    className={styles.scanButton}
                                >
                                    {ip}
                                </PortListing>
                            </div>
                        )
                    }
                    {
                        !connected && !connecting && (unrecognizedPorts.length > 0) &&
                        <UnrecognizedDevices ports={unrecognizedPorts} onClick={actions.toggleShowUnrecognized} />
                    }
                    {
                        !connected && !connecting && showUnrecognized && unrecognizedPorts.map(
                            port => (
                                <PortListing
                                    {...port}
                                    key={port.port}
                                    baudrate={baudrate}
                                    controllerType={controllerType}
                                    onClick={() => actions.onClickPortListing(port)}
                                />
                            )
                        )
                    }

                    { !connected && <FirmwareSelector list={firmwareList} onClick={actions.toggleShowControllers} /> }

                    {
                        !connected && !connecting && showControllers && firmwareList.map(
                            firmware => (
                                <FirmwareListing
                                    key={firmware}
                                    firmware={firmware}
                                    isActive={controllerType === firmware}
                                    onClick={() => actions.onClickFirmwareButton(firmware)}
                                />
                            )
                        )
                    }
                </div>
            </div>
        );
    }
}

export default NavbarConnection;
