import React, { useContext, useMemo, useEffect } from 'react';

import { GamepadContext } from './utils/context';
import Profile from './Profile';
import ProfileList from './ProfileList';
import GamepadManager from 'app/lib/gamepad';

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
