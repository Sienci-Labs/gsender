import {useEffect, useState} from "react";
import {ConnectionStateIndicator} from "./components/ConnectionStateIndicator.tsx";
import {ConnectionInfo} from "./components/ConnectionInfo.tsx";
//import styles from './assets/animations.module.css';
import cn from 'classnames';
import controller from '../../lib/controller.ts';
import {Port, refreshPorts} from './utils/connection.ts';
import {PortListings} from "app/features/Connection/components/PortListings.tsx";
import {connect} from 'react-redux'
import get from 'lodash/get';

export enum ConnectionState {
    DISCONNECTED,
    CONNECTED,
    CONNECTING,
    ERROR
}

export enum ConnectionType {
    DISCONNECTED= "DISCONNECTED",
    ETHERNET="ETHERNET",
    USB =  "USB",
    REMOTE=  "REMOTE",
}

interface ConnectionProps {
    ports: Port[]
}


function Connection(props: ConnectionProps) {
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const [connectionType, setConnectionType] = useState(ConnectionType.DISCONNECTED)

    useEffect(() => {
        refreshPorts();
    }, []);

    return (
        <div className="relative group cursor-pointer">
            {
                connectionState !== ConnectionState.CONNECTED &&
                <div className={
                    cn(
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
                {
                    connectionState == ConnectionState.DISCONNECTED && <PortListings ports={props.ports} />
                }
            </div>
        </div>
    )
}


export default connect((store) => {
    const connection = get(store, 'connection', {});
    const ports = get(connection, 'ports', []);
    console.log(connection);

    return {
        ports
    };
})(Connection);
