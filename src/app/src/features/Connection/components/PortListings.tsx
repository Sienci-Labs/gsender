import { BsEthernet, BsUsbPlug } from 'react-icons/bs';
import { ConnectionType, FirmwareFlavour } from '../index';
import { Port } from '../definitions';
import Tooltip from 'app/components/Tooltip';
import { useEffect, useState } from 'react';
import store from 'app/store';
import { FaArrowAltCircleRight } from 'react-icons/fa';
import cn from 'classnames';
import { JSX } from 'react';

export interface PortListingsProps {
    ports: Port[];
    connectHandler: (p: string, c: ConnectionType) => void;
    unrecognizedPorts?: Port[];
}

function truncatePortName(port: string = ''): string {
    const portName = port.split('/').pop();
    return portName.substring(portName.length - 10, portName.length);
}

export function PortListingButton({ port, connectionHandler, baud }: { port: Port, connectionHandler: (port: string, type: ConnectionType) => void, baud: number }): JSX.Element {
    return (
        <button
            type="button"
            className="w-full m-0 p-3 max-sm:p-2 shadow-inner  flex flex-row items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={() => connectionHandler(port.port, ConnectionType.USB)}
            key={`port-${port.port}`}
        >
            <span className="text-4xl">
                <BsUsbPlug />
            </span>
            <div className="flex flex-col gap-1 text-right">
                <span className="font-bold">{truncatePortName(port.port)}</span>
                <span className="text-sm text-gray-600 font-normal">
                    USB ({baud})
                </span>
            </div>
        </button>
    );
}

export function PortListings(props: PortListingsProps): JSX.Element {
    const [ip, setIP] = useState<string>('255.255.255.255');
    const [port, setPort] = useState<number>(23);
    const [baud, setBaud] = useState(115200);
    const [openUnrecognized, setOpenUnrecognized] = useState<boolean>(false);

    useEffect(() => {
        const ip = store.get('widgets.connection.ip', []);
        const ipString = ip.join('.');
        setIP(ipString);

        setPort(store.get('widgets.connection.ethernetPort', 23));
    }, []);

    store.on('change', () => {
        const ip = store.get('widgets.connection.ip', []);
        const baudrate = store.get('widgets.connection.baudrate', 115200);
        const ipString = ip.join('.');
        setIP(ipString);
        setBaud(baudrate);
        setPort(store.get('widgets.connection.ethernetPort', 23));
    });

    function toggleUnrecognizedPorts() {
        setOpenUnrecognized(!openUnrecognized);
    }

    return (
        <div className="w-full bg-white dark:bg-dark divide-y divide-dotted divide-blue-300">
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
                className="px-4 shadow-inner py-4 flex flex-row items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 mt-1 w-full"
                onClick={() => {
                    props.connectHandler(ip, ConnectionType.ETHERNET);
                }}
            >
                <span className="text-4xl">
                    <BsEthernet />
                </span>
                <div className="flex flex-col gap-1 text-right">
                    <span className="font-bold">{ip}</span>
                    <span className="text-sm text-gray-600 font-normal">
                        Ethernet (port {port})
                    </span>
                </div>
            </button>
            {props.unrecognizedPorts.length > 0 && (
                <div className="flex flex-col overflow-hidden">
                    <button
                        className="text-base text-gray-700 dark:text-gray-300 my-2 flex flex-row justify-between items-center px-2"
                        onClick={toggleUnrecognizedPorts}
                    >
                        <span>Unrecognized Ports</span>
                        <span
                            className={cn('transition-transform duration-300 ease-in-out', {
                                'rotate-90': openUnrecognized,
                            })}
                        >
                            <FaArrowAltCircleRight />
                        </span>
                    </button>
                    <div
                        className={cn('flex flex-col transition-all duration-300 ease-in-out origin-top', {
                            'max-h-0 opacity-0 scale-y-0': !openUnrecognized,
                            'max-h-[500px] opacity-100 scale-y-100': openUnrecognized,
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
