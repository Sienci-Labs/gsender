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

    getConnectionStatusText = (connected, connecting) => {
        if (connected) {
            return '';
        } else if (connecting) {
            return 'Connecting...';
        }
        return 'Connect to Machine';
    };

    renderConnectionStatusIcon = (connected, connecting) => {
        if (connected) {
            return 'fa-check';
        } else if (connecting) {
            return 'fa-spinner';
        }
        return 'fa-plug';
    };

    render() {
        const { state, actions } = this.props;
        const { ports, connecting, connected, baudrate, controllerType } = state;

        return (
            <div className={styles.NavbarConnection}>
                <div className={styles.NavbarConnectionIcon}>
                    <i className={`fa ${this.renderConnectionStatusIcon(connected, connecting)}`} />
                </div>
                <Dropdown id="connection-selection-menu" className={styles.NavbarConnectionDropdownToggle}>
                    <Dropdown.Toggle id="connection-selection-list">
                        { this.getConnectionStatusText(connected, connecting) }
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {
                            ports.map(
                                port => (<PortListing
                                    {...port}
                                    baudrate={baudrate}
                                    controllerType={controllerType}
                                    onClick={() => actions.onClickPortListing(port.value)}
                                />)
                            )
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    }
}

export default NavbarConnection;
