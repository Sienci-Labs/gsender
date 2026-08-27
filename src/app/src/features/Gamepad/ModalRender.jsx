import React, { useContext } from "react";
import HelpModal from "./HelpModal";
import ProfileModal from "./ProfileModal";
import SetShortcut from "./SetShortcut";
import { GAMEPAD_MODAL } from "./utils/constants";
import { GamepadContext } from "./utils/context";

const ModalRender = () => {
	const {
		state: { currentModal },
	} = useContext(GamepadContext);

	const ActiveModal = {
		[GAMEPAD_MODAL.ADD_NEW_PROFILE]: ProfileModal,
		[GAMEPAD_MODAL.HELP]: HelpModal,
		[GAMEPAD_MODAL.ADD_ACTION_TO_SHORTCUT]: SetShortcut,
	}[currentModal];

	if (!ActiveModal) {
		return false;
	}

	return <ActiveModal />;
};

export default ModalRender;
