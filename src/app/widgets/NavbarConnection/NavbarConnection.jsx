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
import _, { find } from 'lodash';
import UnrecognizedDevices from 'app/widgets/NavbarConnection/UnrecognizedDevices';
import PortListing from './PortListing';
import styles from './Index.styl';


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
        const isMobile = window.visualViewport.width / window.visualViewport.height <= 0.5625;
        this.setState({
            mobile: isMobile
        });
    };

    isPortInUse = (port) => {
        const { state } = this.props;
        port = port || state.port;
        const o = find(state.ports, { port }) || {};
        return !!(o.inuse);
    };

    getConnectionStatusText = (connected, connecting, alertMessage,) => {
        if (connected) {
            return 'Connected';
        } else if (alertMessage) {
            return alertMessage;
        } else if (connecting) {
            return 'Connecting...';
        }
        return 'Connect to Machine ▼';
    };

    renderConnectionStatusIcon = (connected, connecting, alertMessage) => {
        if (connected) {
            return 'fa-check';
        } else if (alertMessage) {
            return 'fa-times';
        } else if (connecting) {
            return 'fa-spinner';
        }
        return 'fa-plug';
    };

    getIconState(connected, connecting, alertMessage) {
        if (connected) {
            return 'icon-connected';
        } else if (alertMessage) {
            return 'icon-error';
        } else if (connecting) {
            return 'icon-connecting';
        }
        return 'icon-disconnected';
    }

    displayDropdown() {
        const { mobile, isActive } = this.state;
        if (mobile) {
            this.setState({ isActive: !isActive });
        }
    }

    render() {
        const { state, actions } = this.props;
        const { connected, ports, connecting, baudrate, controllerType, alertMessage, port, unrecognizedPorts, showUnrecognized } = state;
        const { isActive } = this.state;
        const iconState = this.getIconState(connected, connecting, alertMessage);
        const isMobile = window.visualViewport.width / window.visualViewport.height <= 0.5625;

        return (
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
                <div className={`${styles.NavbarConnectionIcon} ${styles[iconState]}`}>
                    <i className={`fa ${this.renderConnectionStatusIcon(connected, connecting, alertMessage)}`} />
                </div>
                <div>
                    <div className="dropdown-label" id="connection-selection-list">
                        {this.getConnectionStatusText(connected, connecting, alertMessage)}
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
        );
    }
}

export default NavbarConnection;
