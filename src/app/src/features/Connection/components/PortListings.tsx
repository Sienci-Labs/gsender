import { BsEthernet, BsUsbPlug } from 'react-icons/bs';
import { ConnectionType, FirmwareFlavour } from '../index';
import { Port } from '../definitions';
import Tooltip from 'app/components/Tooltip';

export interface PortListingsProps {
    ports: Port[];
    connectHandler: (p: string, c: ConnectionType) => void;
}

function truncatePortName(port: string): string {
    const portName = port.split('/').pop();
    return portName.substring(portName.length - 8, portName.length);
}

export function PortListings(props: PortListingsProps): JSX.Element {
    return (
        <div className="absolute left-0 top-full z-10 bg-white border border-gray w-full p4 rounded mt-1 divide-y divide-dotted invisible hover:divide-solid divide-blue-300 shadow-lg group-hover:visible">
            {props.ports.length === 0 && (
                <p className="font-normal flex items-center justify-center p-2 mt-2">
                    No USB devices found
                </p>
            )}
            {props.ports.map((port) => (
                <button
                    type="button"
                    className="w-full m-0 px-4 shadow-inner py-4 flex flex-row items-center justify-between hover:bg-gray-100"
                    onClick={() =>
                        props.connectHandler(port.port, ConnectionType.USB)
                    }
                    key={`port-${port.port}`}
                >
                    <span className="text-4xl">
                        <BsUsbPlug />
                    </span>
                    <div className="flex flex-col gap-1 text-right">
                        <span>
                            <Tooltip content={port.port}>
                                {truncatePortName(port.port)}
                            </Tooltip>
                        </span>
                        <span className="text-sm text-gray-600 font-normal">
                            USB at 115200 baud
                        </span>
                    </div>
                </button>
            ))}
            <button
                className="px-4 shadow-inner py-4 flex flex-row items-center justify-between hover:bg-gray-50 mt-1 w-full"
                onClick={() => {
                    props.connectHandler(
                        '192.168.5.1',
                        ConnectionType.ETHERNET,
                    );
                }}
            >
                <span className="text-4xl">
                    <BsEthernet />
                </span>
                <div className="flex flex-col gap-1 text-right">
                    <span>192.168.5.1</span>
                    <span className="text-sm text-gray-600 font-normal">
                        Ethernet on port 23
                    </span>
                </div>
            </button>
        </div>
    );
}
