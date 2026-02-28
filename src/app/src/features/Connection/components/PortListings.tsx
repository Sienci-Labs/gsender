import { BsEthernet, BsUsbPlug } from 'react-icons/bs';
import { ConnectionType, FirmwareFlavour } from '../index';
import { Port } from '../definitions';
import Tooltip from 'app/components/Tooltip';
import { useEffect, useState } from 'react';
import store from 'app/store';
import { FaArrowAltCircleRight } from 'react-icons/fa';
import cn from 'classnames';

export interface PortListingsProps {
    ports: Port[];
    connectHandler: (p: string, c: ConnectionType) => void;
    unrecognizedPorts?: Port[];
    isOpen?: boolean;
}

function truncatePortName(port: string = ''): string {
    const portName = port.split('/').pop();
    return portName.substring(portName.length - 10, portName.length);
}

export function PortListingButton({ port, connectionHandler, baud }) {
    return (
        <button
            type="button"
            className="w-full m-0 p-3 max-sm:p-2 shadow-inner  flex flex-row items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 outline-none"
            onClick={(e) => {
                e.stopPropagation();
                connectionHandler(port.port, ConnectionType.USB);
            }}
            key={`port-${port.port}`}
        >
            <span className="text-4xl">
                <BsUsbPlug />
            </span>
            <div className="flex flex-col gap-1 text-right">
                <span>{truncatePortName(port.port)}</span>
                <span className="text-sm text-gray-600 font-normal">
                    USB ({baud})
                </span>
            </div>
        </button>
    );
}

export function PortListings(props: PortListingsProps): JSX.Element {
    const [ip, setIP] = useState<string>('255.255.255.255');
    const [baud, setBaud] = useState(115200);
    const [openUnrecognized, setOpenUnrecognized] = useState<boolean>(false);

    useEffect(() => {
        const ip = store.get('widgets.connection.ip', []);
        const ipString = ip.join('.');
        setIP(ipString);
    }, []);

    store.on('change', () => {
        const ip = store.get('widgets.connection.ip', []);
        const baudrate = store.get('widgets.connection.baudrate', 115200);
        const ipString = ip.join('.');
        setIP(ipString);
        setBaud(baudrate);
    });

    function toggleUnrecognizedPorts(e: React.MouseEvent) {
        e.stopPropagation();
        setOpenUnrecognized(!openUnrecognized);
    }

    return (
        <div
            className={cn(
                'absolute left-0 top-full z-50 bg-white dark:bg-dark border border-gray-300 dark:border-gray-700 w-full min-w[250px] rounded mt-1 divide-y divide-dotted divide-blue-300 shadow-lg group-hover:visible min-w-[250px] sm:min-w-0',
                {
                    visible: props.isOpen,
                    invisible: !props.isOpen,
                },
            )}
        >
            {props.ports.length === 0 && (
                <p className="font-normal flex items-center justify-center p-2 mt-2">
                    No USB devices found
                </p>
            )}
            {props.ports.map((port) => (
                <PortListingButton
                    key={`port-${port.port}`}
                    port={port}
                    connectionHandler={props.connectHandler}
                    baud={baud}
                />
            ))}
            <button
                className="px-4 shadow-inner py-4 flex flex-row items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 outline-none mt-1 w-full"
                onClick={(e) => {
                    e.stopPropagation();
                    props.connectHandler(ip, ConnectionType.ETHERNET);
                }}
            >
                <span className="text-4xl">
                    <BsEthernet />
                </span>
                <div className="flex flex-col gap-1 text-right">
                    <span>{ip}</span>
                    <span className="text-sm text-gray-600 font-normal">
                        Ethernet (port 23)
                    </span>
                </div>
            </button>
            {props.unrecognizedPorts.length > 0 && (
                <div className="flex flex-col">
                    <button
                        className="text-base text-gray-700 dark:text-gray-300 my-2 flex flex-row justify-between items-center px-2 outline-none"
                        onClick={toggleUnrecognizedPorts}
                    >
                        <span>Unrecognized Ports</span>
                        <span>
                            <FaArrowAltCircleRight />
                        </span>
                    </button>
                    <div
                        className={cn('flex flex-col', {
                            hidden: !openUnrecognized,
                        })}
                    >
                        {props.unrecognizedPorts.map((port) => {
                            return (
                                <PortListingButton
                                    key={`port-${port.port}`}
                                    port={port}
                                    connectionHandler={props.connectHandler}
                                    baud={baud}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
