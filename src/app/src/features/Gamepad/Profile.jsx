import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import store from 'app/store';
import GamepadManager from 'app/lib/gamepad';
import { toast } from 'app/lib/toaster';
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
import { ArrowLeft, DownloadIcon, UploadIcon } from 'lucide-react';

const Profile = ({ data }) => {
    const { dispatch } = useContext(GamepadContext);
    const [isConnected, setIsConnected] = useState(false);
    const [name, setName] = useState(data.name);

    useEffect(() => {
        const gamepadInstance = GamepadManager.getInstance();

        gamepadInstance.on('gamepad:connected', checkGamepadConnection);
        gamepadInstance.on('gamepad:disconnected', checkGamepadConnection);
        gamepadInstance.on('gamepad:button', checkGamepadConnection);
        gamepadInstance.holdListener();

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
            gamepadInstance.unholdListener();
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
                ? { ...profile, name }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));

        toast.info('Updated Profile Name', { position: 'bottom-right' });
    };

    const handleExportProfile = () => {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                profile: data,
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gsender-gamepad-${name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Gamepad profile exported successfully!', {
                duration: 3000,
                position: 'bottom-right',
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export gamepad profile.', {
                position: 'bottom-right',
            });
        }
    };

    const handleImportProfile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importData = JSON.parse(event.target.result);

                    // Validate the imported data
                    if (!importData.profile) {
                        throw new Error('Invalid gamepad profile file format');
                    }

                    const profiles = store.get(
                        'workspace.gamepad.profiles',
                        [],
                    );

                    // Merge imported profile data with current profile
                    const updatedProfiles = profiles.map((profile) =>
                        arrayComparator(profile.id, data.id)
                            ? {
                                  ...profile,
                                  buttons:
                                      importData.profile.buttons ||
                                      profile.buttons,
                                  joystickOptions:
                                      importData.profile.joystickOptions ||
                                      profile.joystickOptions,
                                  lockout:
                                      importData.profile.lockout ||
                                      profile.lockout,
                                  modifier:
                                      importData.profile.modifier ||
                                      profile.modifier,
                              }
                            : profile,
                    );

                    dispatch(setGamepadProfileList(updatedProfiles));

                    toast.success('Gamepad profile imported successfully!', {
                        duration: 3000,
                        position: 'bottom-right',
                    });
                } catch (error) {
                    console.error('Import error:', error);
                    toast.error(
                        'Failed to import gamepad profile. Please check the file format.',
                        {
                            position: 'bottom-right',
                        },
                    );
                }
            };

            reader.readAsText(file);
        };

        input.click();
    };

    return (
        <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between gap-2">
                <Button
                    onClick={() => dispatch(setCurrentGamepadProfile(null))}
                    icon={<ArrowLeft className="w-6 h-6" />}
                    text="Back to Profiles"
                />
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        className="rounded text-2xl font-bold border p-1 text-center border-gray-200 focus:border-gray-400 dark:bg-dark dark:text-white transition-all duration-200 ease-in-out"
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleEditName}
                    />
                    <span
                        className={`p-2 px-4 rounded-full w-full text-white ${isConnected ? 'bg-green-500 text-green-800' : 'bg-gray-500'} text-center`}
                    >
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleImportProfile}
                        icon={<DownloadIcon size={16} />}
                        text="Import"
                        tooltip={{
                            content: 'Import profile settings from a file',
                        }}
                    />
                    <Button
                        onClick={handleExportProfile}
                        icon={<UploadIcon size={16} />}
                        text="Export"
                        tooltip={{
                            content: 'Export profile settings to a file',
                        }}
                    />
                    <Button
                        onClick={() =>
                            dispatch(setCurrentModal(GAMEPAD_MODAL.HELP))
                        }
                        className="bg-orange-400 dark:bg-orange-700 border-orange-700 dark:border-orange-400 text-white hover:bg-orange-50"
                    >
                        Help
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 mt-4">
                <div className="w-3/5 flex flex-col gap-2">
                    <h3 className="text-xl font-bold dark:text-white">
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
                    <h3 className="text-xl font-bold dark:text-white">
                        Joystick Options
                    </h3>
                    <JoystickOptions />
                </div>
            </div>
        </div>
    );
};

Profile.propTypes = {
    data: PropTypes.object,
};

export default Profile;
