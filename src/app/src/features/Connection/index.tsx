import {useState} from "react";
import {ConnectionStateIndicator} from "./components/ConnectionStateIndicator.tsx";

export enum ConnectionState {
    DISCONNECTED,
    CONNECTED,
    CONNECTING,
    ERROR
}

export enum ConnectionType {
    DISCONNECTED,
    ETHERNET,
    USB,
    REMOTE
}

export function Connection() {
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const [connectionType, setConnectionType] = useState(ConnectionType.DISCONNECTED)

    return (
        <div className="relative group cursor-pointer animate-rotato">
            <div
                className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-35 group-hover:opacity-100 transition duration-1000 group-hover:duration-200">
            </div>
            <div
                className="relative border border-gray-400 bg-gray-100 font-bold  px-4 py-2 ring-1 ring-gray-900/5 gap-4 justify-between items-center rounded-lg leading-none flex flex-row items-top min-w-[250px] animate-rotato">
                    <ConnectionStateIndicator state={connectionState} type={connectionType}/>
                {
                    connectionState === ConnectionState.DISCONNECTED && <span>Connect to CNC</span>
                }
                {
                    connectionState === ConnectionState.CONNECTING && <span>Connecting...</span>
                }
                {
                    connectionState === ConnectionState.ERROR && <span>Unable to connect.</span>
                }
            </div>
        </div>
    )
}
