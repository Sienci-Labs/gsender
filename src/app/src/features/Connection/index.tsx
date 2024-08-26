import {useState} from "react";
import {ConnectionStateIndicator} from "./components/ConnectionStateIndicator.tsx";
import {ConnectionInfo} from "./components/ConnectionInfo.tsx";
import styles from './assets/animations.module.css';
import cn from 'classnames';

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
            {
                connectionState !== ConnectionState.CONNECTED &&
                <div className={
                    cn(styles.steam,
                        "absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-800 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"
                    )
                }
                />
            }
            <div
                className="relative border border-gray-400 bg-gray-100 font-bold  px-4 py-2 ring-1 ring-gray-900/5 gap-4 justify-between items-center rounded-lg leading-none flex flex-row items-top min-w-[250px]">
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
                {
                    connectionState == ConnectionState.CONNECTED && <ConnectionInfo port="COM7" firmwareType="grblHAL" />
                }
            </div>
        </div>
    )
}
