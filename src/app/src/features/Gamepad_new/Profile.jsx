import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import store from 'app/store';
import GamepadManager from 'app/lib/gamepad';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import { Button } from 'app/components/Button';

import { GamepadContext } from './utils/context';
import {
    setCurrentGamepadProfile,
    setGamepadProfileList,
    setCurrentModal,
    setMacros,
} from './utils/actions';

import ButtonActionsTable from './components/ButtonActionsTable';
import { arrayComparator } from './utils';
import JoystickOptions from './JoystickOptions';
import { GAMEPAD_MODAL } from './utils/constants';

const Profile = ({ data }) => {
    const { dispatch } = useContext(GamepadContext);
    const [isConnected, setIsConnected] = useState(false);
    const [name, setName] = useState(data.name);

    useEffect(() => {
        const gamepadInstance = GamepadManager.getInstance();

        gamepadInstance.on('gamepad:connected', checkGamepadConnection);
        gamepadInstance.on('gamepad:disconnected', checkGamepadConnection);
        gamepadInstance.on('gamepad:button', checkGamepadConnection);

        checkGamepadConnection();

        setMacros().then((state) => {
            dispatch(state);
        });

        return () => {
            gamepadInstance.removeEventListener(
                'gamepad:connected',
                checkGamepadConnection,
            );
            gamepadInstance.removeEventListener(
                'gamepad:disconnected',
                checkGamepadConnection,
            );
            gamepadInstance.removeEventListener(
                'gamepad:button',
                checkGamepadConnection,
            );
        };
    }, []);

    const checkGamepadConnection = () => {
        const gamepads = navigator.getGamepads();

        const foundGamepad = gamepads?.find((gamepad) =>
            data?.id?.includes(gamepad?.id),
        );

        setIsConnected(!!foundGamepad);
    };

    const handleEditName = () => {
        if (name === data.name) {
            return;
        }

        const profiles = store.get('workspace.gamepad.profiles', []);

        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, data.id)
                ? { ...profile, profileName: name }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));

        Toaster.pop({
            msg: 'Updated Profile Name',
            type: TOASTER_INFO,
            duration: 2000,
        });
    };

    return (
        <>
            <div className="grid grid-cols-[5fr_1fr_1fr_1fr] gap-2 items-center mb-2">
                <input
                    type="text"
                    value={name}
                    className="rounded text-3xl font-bold hover:border-gray-400 focus:border-gray-400 dark:bg-dark dark:text-white"
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleEditName}
                />
                <span
                    className={`p-2 rounded text-white ${isConnected ? 'bg-green-500' : 'bg-blue-400'} text-center`}
                >
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <Button
                    onClick={() =>
                        dispatch(setCurrentModal(GAMEPAD_MODAL.HELP))
                    }
                    className="w-full"
                >
                    Help
                </Button>
                <Button
                    onClick={() => dispatch(setCurrentGamepadProfile(null))}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <i className="fas fa-arrow-left" />
                    <span>Back to Profiles</span>
                </Button>
            </div>

            <div className="flex gap-4 mt-4 ">
                <div className="w-3/5 flex flex-col gap-2">
                    <h3 className="text-2xl font-bold dark:text-white">
                        Button Actions
                    </h3>
                    <p className="dark:text-white">
                        Assign a &quot;Lockout&quot; button for gamepad safety,
                        or a &quot;2nd Action&quot; button to use like a
                        Function key and give your gamepad double the functions!
                    </p>
                    <div className="overflow-y-auto h-[400px] bg-white rounded border border-gray-300 dark:bg-dark dark:border-gray-700">
                        <ButtonActionsTable />
                    </div>
                </div>

                <div className="w-2/5">
                    <h3 className="text-2xl font-bold dark:text-white">
                        Joystick Options
                    </h3>
                    <JoystickOptions />
                </div>
            </div>
        </>
    );
};

Profile.propTypes = {
    data: PropTypes.object,
};

export default Profile;
