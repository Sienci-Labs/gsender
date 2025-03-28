import React, { useState, useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';

import store from 'app/store';
import GamepadManager from 'app/lib/gamepad';
import { toast } from 'app/lib/toaster';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { Button } from 'app/components/Button';
import { Input } from 'app/components/Input';
import { defaultOptions } from 'app/store/gamepad';

import { AVAILABILITY_TYPES } from './utils';
import { GamepadContext } from './utils/context';
import { setCurrentModal, setGamepadProfileList } from './utils/actions';

const { DEFAULT, AVAILABLE, UNAVAILABLE } = AVAILABILITY_TYPES;

const ProfileModal = () => {
    const [gamepadInfo, setGamepadInfo] = useState(null);
    const [availabilityType, setAvailabilityType] = useState(DEFAULT);
    const [customProfileName, setCustomProfileName] = useState('');
    const inputRef = useRef(null);
    const { dispatch } = useContext(GamepadContext);

    const closeModal = () => dispatch(setCurrentModal(null));

    useEffect(() => {
        const gamepad = GamepadManager.getInstance();

        gamepad.start();

        const gamepadListener = throttle(
            ({ detail }) => {
                const { gamepad } = detail;

                const isAvailable = checkIfIsAvailable(gamepad);

                setAvailabilityType(isAvailable);
                setGamepadInfo(gamepad);

                if (isAvailable === AVAILABLE) {
                    inputRef.current.value = gamepad.id;
                    inputRef.current.focus();
                }
            },
            500,
            { trailing: false },
        );

        gamepad.on('gamepad:button', gamepadListener);

        return () => {
            gamepad.removeEventListener('gamepad:button', gamepadListener);
        };
    }, []);

    const checkIfIsAvailable = (gamepad) => {
        const { profiles = [] } = store.get('workspace.gamepad');

        const profileAlreadyExists = profiles.find((profile) =>
            profile.id.includes(gamepad.id),
        );

        return profileAlreadyExists ? UNAVAILABLE : AVAILABLE;
    };

    const handleAddProfile = () => {
        const { profiles = [] } = store.get('workspace.gamepad');

        const updatedProfiles = [
            ...profiles,
            {
                id: [gamepadInfo.id],
                name: inputRef.current.value || gamepadInfo.id,
                mapping: gamepadInfo.mapping,
                buttons: gamepadInfo.buttons.map((_, index) => ({
                    label: index,
                    value: index,
                    primaryAction: null,
                    secondaryAction: null,
                })),
                axes: gamepadInfo.axes,
                joystickOptions: defaultOptions.joystickOptions,
                lockout: {
                    button: null,
                    active: false,
                },
                modifier: {
                    button: null,
                },
            },
        ];

        dispatch(setGamepadProfileList(updatedProfiles));

        toast.info('Created New Gamepad Profile');

        closeModal();
    };

    const Availability = ({ type }) => {
        const output = {
            [DEFAULT]: (
                <div className="flex flex-col items-center gap-2 text-center p-4">
                    <i className="fas fa-info-circle text-blue-500 text-xl" />
                    <p>Connect your device and press any button on it</p>
                </div>
            ),
            [AVAILABLE]: (
                <div className="flex flex-col items-center gap-2 text-center p-4 text-green-600">
                    <i className="fas fa-check-circle text-xl" />
                    <p className="m-0">Profile Is Available</p>
                    <small className="text-gray-500">
                        Device ID: {gamepadInfo?.id}
                    </small>
                </div>
            ),
            [UNAVAILABLE]: (
                <div className="flex flex-col items-center gap-2 text-center p-4 text-red-600">
                    <i className="fas fa-times-circle text-xl" />
                    <p className="m-0">Profile Already Exists</p>
                    <small className="text-gray-500">
                        Device ID: {gamepadInfo?.id}
                    </small>
                </div>
            ),
        }[type];

        return output;
    };

    return (
        <Dialog open={true} onOpenChange={() => closeModal()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Gamepad Profile</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 p-4">
                    <Availability type={availabilityType} info={gamepadInfo} />

                    <Input
                        ref={inputRef}
                        placeholder="Enter a profile name here..."
                    />

                    <Button
                        variant="primary"
                        disabled={availabilityType !== AVAILABLE}
                        onClick={handleAddProfile}
                        className="w-full"
                    >
                        Add New Profile
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

ProfileModal.propTypes = {
    onAdd: PropTypes.func,
    onClose: PropTypes.func,
};

export default ProfileModal;
