import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import store from 'app/store';
import gamepad from 'app/lib/gamepad';
import { Toaster, TOASTER_SUCCESS, TOASTER_SHORT } from 'app/lib/toaster/ToasterLib';
import ToolModal from 'app/components/ToolModal/ToolModal';
import Button from 'app/components/FunctionButton/FunctionButton';

// import ProfileItem from './ProfileItem';
import Input from '../Input';

import styles from './index.styl';

const AddProfileModal = ({ onClose, onAdd }) => {
    const [gamepadInfo, setGamepadInfo] = useState(null);
    const [isAvailable, setIsAvailable] = useState(0);
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        gamepad.start();

        const gamepadListener = ({ detail }) => {
            const { gamepad: currentGamepad } = detail;

            setGamepadInfo(currentGamepad);
        };

        gamepad.on('gamepad:button', gamepadListener);

        return () => {
            gamepad.removeEventListener('gamepad:button', gamepadListener);
        };
    }, []);

    useEffect(() => {
        const { profiles = [] } = store.get('workspace.gamepad');

        if (!gamepadInfo) {
            return;
        }

        const profileAlreadyExists = profiles.find(profile => profile.id === gamepadInfo.id);

        setIsAvailable(profileAlreadyExists ? 1 : 2);
    }, [gamepadInfo]);

    const handleAddProfile = () => {
        const { profiles = [] } = store.get('workspace.gamepad');
        const commandKeys = store.get('commandKeys', []);

        const newProfiles = [
            {
                id: gamepadInfo.id,
                active: true,
                profileName: profileName || gamepadInfo.id,
                shortcuts: commandKeys.map((keyData) => ({ ...keyData, keys: '', command: keyData.cmd })),
                icon: 'fas fa-gamepad'
            },
            ...profiles
        ];

        store.replace('workspace.gamepad.profiles', newProfiles);

        Toaster.pop({
            msg: 'Added New Joystick Profile',
            type: TOASTER_SUCCESS,
            duration: TOASTER_SHORT
        });

        onAdd(newProfiles);
        onClose();
    };

    const Availability = ({ isAvailable }) => {
        Availability.propTypes = { isAvailable: PropTypes.bool };

        const availability = () => {
            switch (isAvailable) {
            case 1: {
                return (
                    <>
                        <i className={classnames('fas fa-times-circle', styles.isNotAvailable)} />
                        <p>Profile Already Exists</p>
                    </>
                );
            }

            case 2: {
                return (
                    <>
                        <i className={classnames('fas fa-check-circle', styles.isAvailable)} />
                        <p>Profile Is Available</p>
                    </>
                );
            }

            default: {
                return (
                    <>
                        <i className="fas fa-clock is-available" />
                        <p />
                    </>
                );
            }
            }
        };

        return (
            <div className={styles.profileAvailable}>
                {availability()}
            </div>
        );
    };

    return (
        <ToolModal
            onClose={onClose}
            size="medium"
            title="Add Gamepad/Joystick Profile"
        >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>

                <h5 style={{ textAlign: 'center' }}>Connect your device and press any button on it</h5>

                {
                    gamepadInfo && (
                        <>
                            <div className={styles.newProfileInfo}>
                                <Availability isAvailable={isAvailable} />

                                <div className={styles.profileAvailable}>
                                    <i className="fas fa-gamepad" />
                                    <p>{gamepadInfo.id}</p>
                                </div>

                            </div>

                            <div>
                                <Input
                                    // label="Profile Name"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    additionalProps={{ placeholder: 'New Profile Name...', disabled: isAvailable !== 2 }}
                                />
                            </div>
                        </>
                    )
                }

                <Button primary disabled={!gamepadInfo} onClick={handleAddProfile}>Add New Profile</Button>
            </div>
        </ToolModal>
    );
};

export default AddProfileModal;
