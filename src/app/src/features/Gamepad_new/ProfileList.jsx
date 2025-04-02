import React, { useContext } from 'react';

import { Button } from 'app/components/Button';

import ProfileItem from './ProfileItem';
import { GamepadContext } from './utils/context';

import { GAMEPAD_MODAL } from './utils/constants';
import { setCurrentModal } from './utils/actions';

const ProfileList = () => {
    const {
        state: {
            settings: { profiles },
        },
        dispatch,
    } = useContext(GamepadContext);

    const ActionArea = () => (
        <div className="flex gap-4">
            <Button
                variant="primary"
                onClick={() =>
                    dispatch(setCurrentModal(GAMEPAD_MODAL.ADD_NEW_PROFILE))
                }
                className="flex items-center gap-2"
            >
                <i className="fas fa-plus" />
                <span>Add New Gamepad Profile</span>
            </Button>

            <Button
                onClick={() => dispatch(setCurrentModal(GAMEPAD_MODAL.HELP))}
            >
                <span>Help</span>
            </Button>
        </div>
    );

    if (profiles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-8 p-8 h-full">
                <p className="text-2xl">
                    No Profiles, Click the Button Below to Add One
                </p>

                <ActionArea />
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-4 mb-4">
                {profiles.map(({ id, name }) => (
                    <ProfileItem
                        key={id}
                        id={id}
                        title={name}
                        icon="fas fa-gamepad"
                    />
                ))}
            </div>

            <ActionArea />
        </>
    );
};

export default ProfileList;
