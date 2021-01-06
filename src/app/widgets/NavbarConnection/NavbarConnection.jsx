import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import find from 'lodash/find';
import map from 'lodash/map';
import { Dropdown } from 'react-bootstrap';
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

    renderPortOption = (option) => {
        const { label, inuse } = option;

        return (
        //const { state, actions } = this.props;
            <Dropdown.Item>
                {label}
                {inuse}
            </Dropdown.Item>
        );
    };

    render() {
        const { state } = this.props;
        const { ports, connecting, connected } = state;

        return (
            <div className={styles.NavbarConnection}>
                <div className={styles.NavbarConnectionIcon}>
                    <i className={`fa ${this.renderConnectionStatusIcon(connected, connecting)}`} />
                </div>
                <Dropdown>
                    <Dropdown.Toggle>
                        { this.getConnectionStatusText(connected, connecting) }
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {
                            map(ports, o => this.renderPortOption({
                                label: o.port,
                                value: o.port,
                                manufacturer: o.port,
                                inuse: o.inuse
                            }))
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    }
}

export default NavbarConnection;
