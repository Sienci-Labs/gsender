import { useEffect, useState, useRef } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import controller from 'app/lib/controller';
import store from 'app/store';
import { GRBL } from 'app/constants';
import { isIPv4 } from 'app/lib/utils';

import { ConnectionStateIndicator } from './components/ConnectionStateIndicator';
import { ConnectionInfo } from './components/ConnectionInfo';
import { refreshPorts, refreshPortsOnParentEntry } from './utils/connection';
import { PortListings } from './components/PortListings';
import { DisconnectButton } from './components/DisconnectButton';
import { Port } from './definitions';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import pubsub from 'pubsub-js';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from 'app/components/shadcn/Popover';

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

    // Add listener for reconnect request
    useEffect(() => {
        pubsub.subscribe('reconnect', () => {
            attemptAutoConnect(true);
        });

        return () => {
            pubsub.unsubscribe('reconnect');
        };
    }, []);

    const [connectionState, setConnectionState] = useState(
        ConnectionState.DISCONNECTED,
    );
    const [connectionType, setConnectionType] = useState(
        ConnectionType.DISCONNECTED,
    );

    const [firmware, setFirmware] = useState<FirmwareFlavour>('Grbl');

    const [activePort, setActivePort] = useState('');

    const [isOpen, setIsOpen] = useState(false);

    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isHoveringRef = useRef(false);

    useEffect(() => {
        controller.addListener('serialport:close', () => {
            onControllerDisconnect();
        });

        const preferredFirmware = store.get(
            'widgets.connection.controller.type',
            'grbl',
        );
        setFirmware(preferredFirmware);

        refreshPorts();

        setTimeout(() => attemptAutoConnect(), 500);

        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setFirmware(props.reportedFirmware);
    }, [props.reportedFirmware]);

    function handleConnect(port: string, type: ConnectionType) {
        if (!port) {
            console.error('Connect called with empty port');
        }

        const network = type === ConnectionType.ETHERNET;
        const baud = Number(store.get('widgets.connection.baudrate'));
        const defaultFirmware = store.get('workspace.defaultFirmware', GRBL);

        let ethernetPort = store.get('widgets.connection.ethernetPort', 23);

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
                ethernetPort,
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

    function onControllerDisconnect() {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(ConnectionType.DISCONNECTED);
        setActivePort('');
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

    function attemptAutoConnect(force = false) {
        const autoReconnect = connectionConfig.get('autoReconnect', false);
        const port = connectionConfig.get('port', null);

        if (
            connectionState !== ConnectionState.DISCONNECTED ||
            (!autoReconnect && !force)
        ) {
            return;
        }

        // TODO: Add autoconnect for ethernet
        if (isIPv4(port)) {
            handleConnect(port, ConnectionType.ETHERNET);
            return;
        }

        handleConnect(port, ConnectionType.USB);
    }

    const handleMouseEnter = () => {
        // Cancel any pending close timeout
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        isHoveringRef.current = true;
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        // Debounce popover close - only set flag to false after delay
        closeTimeoutRef.current = setTimeout(() => {
            isHoveringRef.current = false;
            setIsOpen(false);
        }, 250);
    };

    const handleClick = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
                className="relative group z-50"
                onMouseEnter={() => {
                    refreshPortsOnParentEntry();
                    handleMouseEnter();
                }}
                onMouseLeave={handleMouseLeave}
            >
                {connectionState !== ConnectionState.CONNECTED && (
                    <div
                        className={cn(
                            'absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-800 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200',
                        )}
                    />
                )}
                <PopoverTrigger asChild>
                    <button
                        className="h-12 max-xl:h-10 relative border border-gray-400 bg-gray-100 font-bold px-4 py-2 max-sm:p-1 ring-1 ring-gray-900/5 gap-4 justify-between items-center rounded-lg leading-none flex flex-row items-top portrait:min-w-[170px] portrait:max-sm:min-w-max min-w-[250px] max-xl:min-w-[180px] max-sm:min-w-0 dark:bg-dark text-black dark:text-white cursor-pointer"
                        onClick={handleClick}
                    >
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
                            <span className="max-sm:hidden">
                                Unable to connect.
                            </span>
                        )}
                        {connectionState == ConnectionState.CONNECTED && (
                            <ConnectionInfo
                                port={activePort}
                                firmwareType={firmware}
                            />
                        )}
                        {connectionState == ConnectionState.CONNECTED && (
                            <DisconnectButton
                                disconnectHandler={onDisconnectClick}
                            />
                        )}
                    </button>
                </PopoverTrigger>
                {(connectionState == ConnectionState.DISCONNECTED ||
                    connectionState === ConnectionState.ERROR) && (
                    <PopoverContent
                        align="start"
                        sideOffset={0}
                        className="w-auto p-0 min-w-[250px] mt-1"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <PortListings
                            connectHandler={(port, type) => {
                                handleConnect(port, type);
                                setIsOpen(false);
                            }}
                            unrecognizedPorts={props.unrecognizedPorts}
                            ports={props.ports}
                        />
                    </PopoverContent>
                )}
            </div>
        </Popover>
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
