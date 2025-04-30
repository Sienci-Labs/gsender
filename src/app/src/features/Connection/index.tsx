import { useEffect, useState } from 'react';
import ip from 'ip';
import cn from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import controller from 'app/lib/controller';
import store from 'app/store';
import { GRBL } from 'app/constants';

import { ConnectionStateIndicator } from './components/ConnectionStateIndicator';
import { ConnectionInfo } from './components/ConnectionInfo';
import { refreshPorts, refreshPortsOnParentEntry } from './utils/connection';
import { PortListings } from './components/PortListings';
import { DisconnectButton } from './components/DisconnectButton';
import { Port } from './definitions';
import WidgetConfig from '../WidgetConfig/WidgetConfig';

export enum ConnectionState {
    DISCONNECTED,
    CONNECTED,
    CONNECTING,
    ERROR,
}

export enum ConnectionType {
    DISCONNECTED = 'DISCONNECTED',
    ETHERNET = 'ETHERNET',
    USB = 'USB',
    REMOTE = 'REMOTE',
}

export interface ConnectionProps {
    ports: Port[];
    unrecognizedPorts: Port[];
    reportedFirmware: FirmwareFlavour;
}

export type FirmwareFlavour = 'Grbl' | 'grblHAL' | '';

function Connection(props: ConnectionProps) {
    const connectionConfig = new WidgetConfig('connection');

    const [connectionState, setConnectionState] = useState(
        ConnectionState.DISCONNECTED,
    );
    const [connectionType, setConnectionType] = useState(
        ConnectionType.DISCONNECTED,
    );

    const [firmware, setFirmware] = useState<FirmwareFlavour>('Grbl');

    const [activePort, setActivePort] = useState('');

    useEffect(() => {
        const preferredFirmware = store.get(
            'widgets.connection.controller.type',
            'grbl',
        );
        setFirmware(preferredFirmware);

        refreshPorts();

        setTimeout(() => attemptAutoConnect(), 500);
    }, []);

    function handleConnect(port: string, type: ConnectionType) {
        if (!port) {
            console.assert('Connect called with empty port');
        }

        const network = type === ConnectionType.ETHERNET;
        const baud = Number(store.get('widgets.connection.baudrate'));
        const defaultFirmware = store.get('workspace.defaultFirmware', GRBL);

        // workflow - set element to connecting state, attempt to connect, and use callback to update state on end
        setConnectionState(ConnectionState.CONNECTING);
        setConnectionType(type);

        // Attempt connect with callback
        controller.openPort(
            port,
            // firmware,
            {
                baudrate: baud,
                network,
                defaultFirmware,
            },
            (err: string) => {
                if (err) {
                    setConnectionState(ConnectionState.ERROR);
                    return;
                }

                setConnectionState(ConnectionState.CONNECTED);
                setActivePort(port);
            },
        );

        connectionConfig.set('port', port);
        connectionConfig.set('baudrate', baud);
    }

    function onDisconnectClick() {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(ConnectionType.DISCONNECTED);

        controller.closePort(activePort, (err: string) => {
            if (err) {
                console.error(err);
            }
            refreshPorts();
        });
    }

    function attemptAutoConnect() {
        const autoReconnect = connectionConfig.get('autoReconnect', false);
        const port = connectionConfig.get('port', null);

        if (connectionState !== ConnectionState.DISCONNECTED || !autoReconnect)
            return;

        // TODO: Add autoconnect for ethernet
        if (ip.isV4Format(port)) return;

        handleConnect(port, ConnectionType.USB);
    }

    useEffect(() => {
        setFirmware(props.reportedFirmware);
    }, [props.reportedFirmware]);

    return (
        <div
            className="relative group cursor-pointer dropdown z-50"
            onMouseEnter={refreshPortsOnParentEntry}
        >
            {connectionState !== ConnectionState.CONNECTED && (
                <div
                    className={cn(
                        'absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-800 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200',
                    )}
                />
            )}
            <div className="h-12 relative border border-gray-400 bg-gray-100 font-bold px-4 py-2 max-sm:p-1 ring-1 ring-gray-900/5 gap-4 justify-between items-center rounded-lg leading-none flex flex-row items-top portrait:min-w-[170px] portrait:max-sm:min-w-max min-w-[250px] max-sm:min-w-0 dark:bg-dark text-black dark:text-white">
                <ConnectionStateIndicator
                    state={connectionState}
                    type={connectionType}
                />
                {connectionState === ConnectionState.DISCONNECTED && (
                    <span className="max-sm:hidden portrait:hidden animate-pulse">
                        Connect to CNC
                    </span>
                )}
                {connectionState === ConnectionState.DISCONNECTED && (
                    <span className="max-sm:hidden landscape:hidden animate-pulse">
                        Connect
                    </span>
                )}
                {connectionState === ConnectionState.CONNECTING && (
                    <span className="max-sm:hidden">Connecting...</span>
                )}
                {connectionState === ConnectionState.ERROR && (
                    <span className="max-sm:hidden">Unable to connect.</span>
                )}
                {connectionState == ConnectionState.CONNECTED && (
                    <ConnectionInfo port={activePort} firmwareType={firmware} />
                )}
                {(connectionState == ConnectionState.DISCONNECTED ||
                    connectionState === ConnectionState.ERROR) && (
                    <PortListings
                        connectHandler={handleConnect}
                        unrecognizedPorts={props.unrecognizedPorts}
                        ports={props.ports}
                    />
                )}
                {connectionState == ConnectionState.CONNECTED && (
                    <DisconnectButton disconnectHandler={onDisconnectClick} />
                )}
            </div>
        </div>
    );
}

export default connect((store) => {
    const connection = get(store, 'connection', {});
    const ports: Port[] = get(connection, 'ports', []);
    const unrecognizedPorts: Port[] = get(connection, 'unrecognizedPorts', []);
    const reportedFirmware: FirmwareFlavour = get(
        store,
        'controller.type',
        'Grbl',
    );

    return {
        ports,
        unrecognizedPorts,
        reportedFirmware,
    };
})(Connection);
