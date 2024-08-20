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
        <div className="relative group cursor-pointer">
            <div
                className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200">
            </div>
            <div
                className="relative border border-gray-400 bg-gray-100 font-bold  px-4 py-2 ring-1 ring-gray-900/5 gap-4 justify-between items-center rounded-lg leading-none flex flex-row items-top min-w-[250px]">
                    <ConnectionStateIndicator state={connectionState} type={connectionType}/>
                    Connect to CNC
            </div>
        </div>
    )
}


/*
<div
    className="border bg-gray-100 py-2 px-6 rounded-lg flex flex-row justify-between gap-4 items-center relative min-w-[275px]">
    <div
        className="bg-gradient-to-r from-red-600 to-violet-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
    <ConnectionStateIndicator state={connectionState} type={connectionType}/>
    Connect to CNC
</div>*/
