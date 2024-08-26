import {Port} from "app/features/Connection/utils/connection.ts";
import { BsUsbPlug } from "react-icons/bs";
import { BsEthernet } from "react-icons/bs";

interface PortListingsProps {
    ports: Port[]
}

export function PortListings(props: PortListingsProps): JSX.Element {
    return (
        <div className="absolute left-0 top-full z-10 bg-white border border-gray w-full p4 rounded mt-1 divide-y divide-dotted hover:divide-solid divide-blue-300 shadow-lg">
            {
                props.ports.map(port =>
                    <div className="px-4 shadow-inner py-4 flex flex-row items-center justify-between hover:bg-gray-100">
                        <span className="text-4xl">
                            <BsUsbPlug />
                        </span>
                        <div className="flex flex-col gap-1 text-right">
                            <span>{port.port}</span>
                            <span className="text-sm text-gray-600 font-normal">USB at 115200 baud</span>
                        </div>

                    </div>
                )
            }
            <div className="px-4 shadow-inner py-4 flex flex-row items-center justify-between hover:bg-gray-50 mt-1">
                <span className="text-4xl">
                    <BsEthernet />
                </span>
                <div className="flex flex-col gap-1 text-right">
                    <span>
                        192.168.5.1
                    </span>
                    <span className="text-sm text-gray-600 font-normal">
                        Ethernet on port 23
                    </span>
                </div>
            </div>
        </div>
    )
}
