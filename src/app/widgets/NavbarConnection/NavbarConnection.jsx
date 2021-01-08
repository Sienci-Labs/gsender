import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import { Dropdown } from 'react-bootstrap';
import PortListing from './PortListing';
import styles from './Index.styl';

class NavbarConnection extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    isPortInUse = (port) => {
        const { state } = this.props;
        port = port || state.port;
        const o = find(state.ports, { port }) || {};
        return !!(o.inuse);
    };

    getConnectionStatusText = (connected, connecting, alertMessage) => {
        if (connected) {
            return 'Connected';
        } else if (alertMessage) {
            return alertMessage;
        } else if (connecting) {
            return 'Connecting...';
        }
        return 'Connect to Machine';
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

    getIconState (connected, connecting, alertMessage) {
        if (connected) {
            return 'icon-connected';
        }
        if (alertMessage) {
            return 'icon-error';
        }
        if (connecting) {
            return 'icon-connecting';
        }
        return 'icon-disconnected';
    }

    render() {
        const { state, actions } = this.props;
        const { ports, connecting, connected, baudrate, controllerType, alertMessage } = state;

        const iconState = this.getIconState(connected, connecting, alertMessage);

        return (
            <div className={styles.NavbarConnection}>
                <div className={`${styles.NavbarConnectionIcon} ${styles[iconState]}`}>
                    <i className={`fa ${this.renderConnectionStatusIcon(connected, connecting, alertMessage)}`} />
                </div>
                <Dropdown id="connection-selection-menu" className={styles.NavbarConnectionDropdownToggle}>
                    <Dropdown.Toggle id="connection-selection-list">
                        { this.getConnectionStatusText(connected, connecting, alertMessage) }
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {
                            !connected && (ports.length === 0) &&
                                <div>
                                    No Devices Found
                                </div>
                        }
                        {
                            !connected && ports.map(
                                port => (<PortListing
                                    {...port}
                                    baudrate={baudrate}
                                    controllerType={controllerType}
                                    onClick={() => actions.onClickPortListing(port.value)}
                                />)
                            )
                        }
                        {
                            !connected &&
                            <button type="button" className={styles.refreshButton} onClick={actions.handleRefreshPorts}>
                                <i className="fa fa-refresh" />
                                Refresh Ports
                            </button>
                        }
                        {
                            connected &&
                            <button type="button" className={styles.disconnectButton} onClick={actions.handleClosePort}>
                                Disconnect
                            </button>
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    }
}

export default NavbarConnection;
