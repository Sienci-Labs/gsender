
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import store from 'app/store';
import gamepad, { shortcutComboBuilder } from 'app/lib/gamepad';
import Button from 'app/components/FunctionButton/FunctionButton';
import Modal from 'app/components/ToolModal/ToolModal';

import Input from '../../components/Input';

import styles from '../index.styl';
import { AVAILABILITY_TYPES } from '../utils';
import Availability from './Availability';

const { DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME } = AVAILABILITY_TYPES;

const ProfileShortcutModal = ({ profile, shortcut, onClose, onUpdateProfiles }) => {
    const [gamepadShortcut, setGamepadShortcut] = useState(null);
    const [availability, setAvailability] = useState(DEFAULT);
    const [shortcutName, setShortcutName] = useState('');
    const listenerRef = useRef();

    useEffect(() => {
        gamepad.start();

        gamepad.on('gamepad:button', gamepadListener);

        return () => {
            gamepad.removeEventListener('gamepad:button', gamepadListener);
        };
    }, []);

    const gamepadListener = ({ detail }) => {
        const { gamepad: currentGamepad } = detail;
        const { id, buttons } = currentGamepad;

        if (profile.id !== id) {
            return;
        }

        const clickedButtons =
            buttons
                .map((button, i) => ({ pressed: button.pressed || button.touched, buttonIndex: i }))
                .filter((button) => button.pressed);

        if (clickedButtons.length === 0) {
            return;
        }

        const profiles = store.get('workspace.gamepad.profiles', []);
        const currentProfile = profiles.find(profile => profile.id === id);

        const comboKeys = shortcutComboBuilder(clickedButtons.map(shortcut => shortcut.buttonIndex));

        const comboInUse = currentProfile.shortcuts
            .find(shortcut => shortcut.keys === comboKeys);

        if (!comboInUse) {
            setAvailability(AVAILABLE);
        } else if (comboInUse?.id === shortcut?.id) {
            setAvailability(IS_THE_SAME);
        } else {
            setAvailability(UNAVAILABLE);
        }

        setGamepadShortcut(clickedButtons);
        listenerRef.current.handleButtonPress();
    };

    const handleUpdateShortcut = () => {
        const newKeys = shortcutComboBuilder(gamepadShortcut.map(shortcut => shortcut.buttonIndex));
        const newKeysName = shortcutName || gamepadShortcut.map(shortcut => shortcut.buttonIndex).join(', ');

        const newShortcutsArr =
            profile.shortcuts
                .map(currentShortcut => ({
                    ...currentShortcut,
                    keys: currentShortcut.id === shortcut.id ? newKeys : currentShortcut.keys,
                    keysName: currentShortcut.id === shortcut.id ? newKeysName : currentShortcut.keysName,
                    isActive: currentShortcut.id === shortcut.id ? true : currentShortcut.isActive,
                }));

        const profiles = store.get('workspace.gamepad.profiles', []);

        const cleanedProfiles =
            profiles.map(currentProfile => (currentProfile.id === profile.id ? ({ ...profile, shortcuts: newShortcutsArr }) : currentProfile));

        onUpdateProfiles(cleanedProfiles);

        onClose();

        Toaster.pop({
            msg: 'Updated Gamepad Action Shortcut',
            type: TOASTER_SUCCESS,
            duration: 2000
        });
    };

    return (
        <Modal onClose={onClose} size="small" title="Set Gamepad Profile Action">
            <div className={styles.profileActionWrapper}>
                <Availability
                    type={availability}
                    shortcutTitle={shortcut.title}
                    shortcut={gamepadShortcut}
                    listenerRef={listenerRef}
                />

                <Input
                    value={shortcutName}
                    onChange={(e) => setShortcutName(e.target.value)}
                    additionalProps={{
                        placeholder: 'Enter a Custom Shortcut Name Here...',
                        disabled: !gamepadShortcut || availability !== AVAILABLE
                    }}
                    isNumber={false}
                    className={availability === AVAILABLE ? styles.customProfileName : styles.customProfileNameHidden}
                />

                <Button
                    primary
                    onClick={handleUpdateShortcut}
                    disabled={!gamepadShortcut || availability !== AVAILABLE}
                    style={{ margin: 0 }}
                >
                    Set Shortcut
                </Button>
            </div>
        </Modal>
    );
};

ProfileShortcutModal.propTypes = {
    profile: PropTypes.object,
    shortcut: PropTypes.object,
    onClose: PropTypes.func,
    onUpdateProfiles: PropTypes.func
};

export default ProfileShortcutModal;
