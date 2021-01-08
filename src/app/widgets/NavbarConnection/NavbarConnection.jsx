import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';
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
        const { ports, connecting, loading, connected, baudrate, controllerType, alertMessage, port } = state;
        const canRefresh = !loading && !connected;

        const iconState = this.getIconState(connected, connecting, alertMessage);

        return (
            <div className={styles.NavbarConnection}>
                <div className={`${styles.NavbarConnectionIcon} ${styles[iconState]}`}>
                    <i className={`fa ${this.renderConnectionStatusIcon(connected, connecting, alertMessage)}`} />
                </div>
                <div>
                    <div className="dropdown-label" id="connection-selection-list">
                        { this.getConnectionStatusText(connected, connecting, alertMessage) }
                    </div>
                </div>
                {
                    connected &&
                        <div className={styles.ConnectionInfo}>
                            <div className={styles.portLabel}>{ port }</div>
                            <div>{ controllerType }</div>
                        </div>
                }
                <div className={styles.NavbarConnectionDropdownList}>
                    {
                        !connected && (ports.length === 0) &&
                        <div className={styles.noDevicesWarning}>
                            No Devices Found
                        </div>
                    }
                    {
                        !connected && !connecting && ports.map(
                            port => (
                                <PortListing
                                    {...port}
                                    baudrate={baudrate}
                                    controllerType={controllerType}
                                    onClick={() => actions.onClickPortListing(port.value)}
                                />)
                        )
                    }
                    {
                        !connected && canRefresh &&
                        <button type="button" className={styles.refreshButton} onClick={actions.handleRefreshPorts}>
                            <i className="fa fa-refresh" />
                            Refresh Ports
                        </button>
                    }
                    {
                        connected &&
                        <button type="button" className={styles.disconnectButton} onClick={actions.handleClosePort}>
                            <i className="fa fa-unlink" />
                            Disconnect
                        </button>
                    }
                </div>
            </div>
        );
    }
}

export default NavbarConnection;
