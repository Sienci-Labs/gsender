import cn from "classnames";
import type { ReactElement } from "react";
import { BsCheckCircleFill, BsEthernet, BsUsbPlug } from "react-icons/bs";
import { GrSatellite } from "react-icons/gr";
import { PiPlugLight } from "react-icons/pi";
import { ConnectionState, ConnectionType } from "../index";

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
			return "text-blue-700";
		case ConnectionState.CONNECTED:
			return "text-green-700";
		case ConnectionState.CONNECTING:
			return "text-yellow-600";
		case ConnectionState.ERROR:
			return "text-red-600";
		default:
			return "text-yellow-700";
	}
}

export function ConnectionStateIndicator({
	type,
	state,
}: ConnectionStateIndicatorProps) {
	const icon = getIcon(type);
	const colour = getStateColour(state);

	return (
		<div
			className={cn(
				"w-8 h-8 sm:w-8 sm:h-8  text-5xl flex items-center justify-center relative",
				state === ConnectionState.DISCONNECTED && "animate-pulse",
				colour,
			)}
		>
			{state === ConnectionState.CONNECTED && (
				<div className="absolute top-[-2px] right-[-2px] ">
					<BsCheckCircleFill className="text-green-500 w-4 h-4" />
				</div>
			)}
			{icon}
		</div>
	);
}
