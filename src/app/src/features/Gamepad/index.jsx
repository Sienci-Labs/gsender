import React, { useEffect } from "react";
import { GamepadContextProvider } from "./components/Context";
import Gamepad from "./Gamepad";
import ModalRender from "./ModalRender";

const GamepadWrapper = () => {
	return (
		<GamepadContextProvider>
			<div>
				<Gamepad />
				<ModalRender />
			</div>
		</GamepadContextProvider>
	);
};

export default GamepadWrapper;
