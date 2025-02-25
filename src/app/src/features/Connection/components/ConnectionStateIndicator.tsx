import { ConnectionState, ConnectionType } from '../index';
import { PiPlugLight } from 'react-icons/pi';
import { BsEthernet } from 'react-icons/bs';
import { BsUsbPlug } from 'react-icons/bs';
import { GrSatellite } from 'react-icons/gr';
import { ReactElement } from 'react';
import cn from 'classnames';

interface ConnectionStateIndicatorProps {
    state: ConnectionState;
    type: ConnectionType;
}

function getIcon(type: ConnectionType): ReactElement {
    switch (type) {
        case ConnectionType.DISCONNECTED:
            return <PiPlugLight />;
        case ConnectionType.ETHERNET:
            return <BsEthernet />;
        case ConnectionType.USB:
            return <BsUsbPlug />;
        case ConnectionType.REMOTE:
            return <GrSatellite />;
        default:
            return <PiPlugLight />;
    }
}

function getStateColour(state: ConnectionState) {
    switch (state) {
        case ConnectionState.DISCONNECTED:
            return 'text-blue-700';
        case ConnectionState.CONNECTED:
            return 'text-green-700';
        case ConnectionState.CONNECTING:
            return 'text-yellow-600';
        case ConnectionState.ERROR:
            return 'text-red-600';
        default:
            return 'text-yellow-700';
    }
}

export function ConnectionStateIndicator(
    props: ConnectionStateIndicatorProps,
): JSX.Element {
    const icon = getIcon(props.type);
    const colour = getStateColour(props.state);

    return (
        <div
            className={cn(
                'w-[45px] h-[45px] sm:w-12 sm:h-12 text-5xl flex items-center justify-center',
                colour,
            )}
        >
            {icon}
        </div>
    );
}
