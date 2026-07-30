import GamepadManager from "app/lib/gamepad";
import React, { useContext, useEffect, useMemo } from "react";
import Profile from "./Profile";
import ProfileList from "./ProfileList";
import { GamepadContext } from "./utils/context";

const Gamepad = () => {
	useEffect(() => {
		const gamepadInstance = GamepadManager.getInstance();

		gamepadInstance.holdListener();

		return () => {
			gamepadInstance.unholdListener();
		};
	}, []);

	const {
		state: {
			currentProfile,
			settings: { profiles },
		},
	} = useContext(GamepadContext);

	const profile = useMemo(
		() =>
			profiles.find((profile) =>
				profile.id.some((item) => currentProfile?.includes(item)),
			),
		[currentProfile, profiles],
	);

	if (profile) {
		return <Profile data={profile} />;
	}

	return <ProfileList />;
};

export default Gamepad;
