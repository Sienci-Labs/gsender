import {ConnectionState, ConnectionType} from "../index.tsx";
import { PiPlugFill } from "react-icons/pi";
import { BsEthernet } from "react-icons/bs";
import { BsUsbPlug } from "react-icons/bs";
import { GrSatellite } from "react-icons/gr";
import {ReactElement} from "react";


interface ConnectionStateIndicatorProps {
    state: ConnectionState
    type: ConnectionType
}

function getIcon(type: ConnectionType): ReactElement {
    switch(type) {
        case ConnectionType.DISCONNECTED:
            return <PiPlugFill />;
        case ConnectionType.ETHERNET:
            return <BsEthernet />;
        case ConnectionType.USB:
            return <BsUsbPlug />;
        case ConnectionType.REMOTE:
            return <GrSatellite />;
        default:
            return <PiPlugFill />;
    }
}

export function ConnectionStateIndicator(props: ConnectionStateIndicatorProps): JSX.Element {
    const icon = getIcon(props.type);

    return (
        <div className="w-[45px] h-[45px] text-5xl flex items-center justify-center">
            {icon}
        </div>
    )
}
