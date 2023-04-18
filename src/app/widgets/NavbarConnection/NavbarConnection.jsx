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
import controller from 'app/lib/controller';
import UnrecognizedDevices from 'app/widgets/NavbarConnection/UnrecognizedDevices';
import PortListing from './PortListing';
import styles from './Index.styl';
import StatusIndicator from './StatusIndicator';
import FirmwareSelector from './FirmwareSelector';


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
        isActive: false
    }

    componentDidMount() {
        this.addResizeEventListener();
        this.updateScreenSize();
    }

    componentWillUnmount() {
        this.removeResizeEventListener();
    }

    addResizeEventListener() {
        this.onResizeThrottled = _.throttle(this.updateScreenSize, 25);
        window.visualViewport.addEventListener('resize', this.onResizeThrottled);
    }

    removeResizeEventListener() {
        window.visualViewport.removeEventListener('resize', this.onResizeThrottled);
        this.onResizeThrottled = null;
    }

    updateScreenSize = () => {
        const isMobile = window.visualViewport.width <= 599;
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

    render() {
        const { state, actions } = this.props;
        const { connected, ports, connecting, scanning, baudrate, controllerType, alertMessage, port, unrecognizedPorts, showUnrecognized, networkPorts } = state;
        const { isActive } = this.state;
        const isMobile = window.visualViewport.width <= 599;


        return (
            <>
                <div
                    className={isMobile ? styles.NavbarConnectionMobile : styles.NavbarConnection}
                    role="button"
                    tabIndex={0}
                    onClick={this.displayDropdown}
                    onKeyDown={this.displayDropdown}
                    onMouseEnter={actions.handleRefreshPorts}
                    onMouseLeave={actions.hideUnrecognizedDevices}
                    onTouchEnd={actions.handleRefreshPorts}
                >
                    <div>
                        <StatusIndicator {...{ connected, connecting, scanning, alertMessage }} />
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
                            !connected && (
                            <>
                                <h5>Firmware</h5>
                                <FirmwareSelector options={['Grbl', 'grblHAL']} selectedFirmware={controllerType} handleSelect={actions.onClickFirmwareButton}/>
                            </>
                            )
                        }
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
                            !connected && <h5>Network Scan</h5>
                        }
                        {
                            !connected &&
                                <div className={styles.firmwareSelector}>
                                    <div className={styles.selectorWrapper}>
                                        <button
                                            type="button"
                                            onClick={() => controller.networkScan(23)}
                                            className={styles.scanButton}
                                        >
                                            SCAN for Devices
                                        </button>
                                    </div>
                                </div>
                        }
                        {
                            !connected && <h5>Network Devices</h5>
                        }
                        {
                            !connected && (networkPorts.length === 0) && (
                                <div className={styles.noDevicesWarning}>
                                    No Devices Found
                                </div>
                            )
                        }
                        {
                            !connected && !connecting && networkPorts.map(
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
                    </div>
                </div>
            </>
        );
    }
}

export default NavbarConnection;
