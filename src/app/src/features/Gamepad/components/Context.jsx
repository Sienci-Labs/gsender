import { defaultOptions } from "app/store/gamepad";
import React, { useReducer } from "react";
import { arrayComparator } from "../utils";
import { GamepadContext } from "../utils/context";
import { gamepadReducer } from "../utils/reducer";

export const GamepadContextProvider = ({ children }) => {
	const [state, dispatch] = useReducer(
		gamepadReducer.handler,
		gamepadReducer.initialState(),
	);

	const getGamepadProfile = (profileID) => {
		const profile = state.settings.profiles.find((profile) =>
			arrayComparator(profile.id, profileID),
		);

		return { ...defaultOptions, ...profile };
	};

	const getMacros = () => {
		return state.macros;
	};

	const actions = { getGamepadProfile, getMacros };

	return (
		<GamepadContext.Provider value={{ state, dispatch, actions }}>
			{children}
		</GamepadContext.Provider>
	);
};
