import React, { useContext, useMemo } from 'react';

import { GamepadContext } from './utils/context';
import Profile from './Profile';
import ProfileList from './ProfileList';

const Gamepad = () => {
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
