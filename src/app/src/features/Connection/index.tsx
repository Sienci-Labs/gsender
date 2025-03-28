import { useEffect, useState } from 'react';
import { ConnectionStateIndicator } from './components/ConnectionStateIndicator';
import { ConnectionInfo } from './components/ConnectionInfo';
//import styles from './assets/animations.module.css';
import cn from 'classnames';
import { refreshPorts, refreshPortsOnParentEntry } from './utils/connection';
import { PortListings } from './components/PortListings';
import { connect } from 'react-redux';
import get from 'lodash/get';
import controller from 'app/lib/controller';
import { DisconnectButton } from './components/DisconnectButton';
import { Port } from './definitions';
import store from 'app/store';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import {GRBL} from "app/constants";

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
    }, []);

    function onConnectClick(port: string, type: ConnectionType) {
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
            <div className="relative border border-gray-400 bg-gray-100 font-bold px-4 py-2 max-sm:p-1 ring-1 ring-gray-900/5 gap-4 justify-between items-center rounded-lg leading-none flex flex-row items-top min-w-[250px] max-sm:min-w-0 dark:bg-dark text-black dark:text-white">
                <ConnectionStateIndicator
                    state={connectionState}
                    type={connectionType}
                />
                {connectionState === ConnectionState.DISCONNECTED && (
                    <span className="max-sm:hidden animate-pulse">
                        Connect to CNC
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
                        connectHandler={onConnectClick}
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
    const ports = get(connection, 'ports', []);
    const unrecognizedPorts = get(connection, 'unrecognizedPorts', []);
    const reportedFirmware = get(store, 'controller.type', 'Grbl');

    return {
        ports,
        unrecognizedPorts,
        reportedFirmware,
    };
})(Connection);
