
import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';

import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import store from 'app/store';
import gamepad, { shortcutComboBuilder } from 'app/lib/gamepad';
import Button from 'app/components/FunctionButton/FunctionButton';
import Modal from 'app/components/ToolModal/ToolModal';

import Input from '../../components/Input';

import styles from '../index.styl';
import { AVAILABILITY_TYPES } from '../utils';
import Listener from './Listener';

const { DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME } = AVAILABILITY_TYPES;

const ProfileShortcutModal = ({ profile, shortcut, onClose, onUpdateProfiles }) => {
    const [gamepadShortcut, setGamepadShortcut] = useState(null);
    const [availability, setAvailability] = useState(DEFAULT);
    const [shortcutName, setShortcutName] = useState('');
    const listenerRef = useRef();

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
        }

        console.log({ comboInUse, shortcut });

        if (comboInUse?.id === profile?.id) {
            setAvailability(IS_THE_SAME);
        } else {
            setAvailability(UNAVAILABLE);
        }

        setGamepadShortcut(clickedButtons);
        listenerRef.current.handleButtonPress();
    };

    useEffect(() => {
        gamepad.start();

        gamepad.on('gamepad:button', gamepadListener);

        return () => {
            gamepad.removeEventListener('gamepad:button', gamepadListener);
        };
    }, []);

    const handleAddShortcut = () => {
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

    const ButtonsPressed = () => {
        if (!gamepadShortcut) {
            return null;
        }
        return (
            <div>
                {
                    gamepadShortcut.map((shortcut, i) => (
                        i === 0
                            ? <strong key={shortcut.buttonIndex}>{shortcut.buttonIndex}</strong>
                            : <React.Fragment key={shortcut.buttonIndex}> and <strong>{shortcut.buttonIndex}</strong></React.Fragment>
                    ))
                }
            </div>
        );
    };

    const Availability = ({ type }) => {
        const output = {
            [DEFAULT]: (
                <div className={styles.availability}>
                    <i className="fas fa-info-circle" />
                    <p style={{ textAlign: 'center' }}>Press any button or button combination on your gamepad</p>
                </div>
            ),
            [AVAILABLE]: (
                <div className={styles.available}>
                    <i className={classnames('fas fa-check-circle')} />
                    <p style={{ margin: 0 }}>Shortcut is Availabile</p>
                    <ButtonsPressed />
                </div>
            ),
            [UNAVAILABLE]: (
                <div className={styles.unavailable}>
                    <i className={classnames('fas fa-times-circle')} />
                    <p style={{ margin: 0 }}>Shortcut Already Exists on an Action</p>
                </div>
            ),
            [IS_THE_SAME]: (
                <div className={styles.availability}>
                    <i className={classnames('fas fa-info-circle')} />
                    <p style={{ margin: 0 }}>This is the Current Shortcut for This Action</p>
                </div>
            ),
        }[type];

        return (
            <div style={{ position: 'relative', height: '100%' }}>
                <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: 10 }}>
                    {shortcut.title}
                </span>
                <Listener ref={listenerRef} />
                {output}
            </div>
        );
    };

    return (
        <Modal onClose={onClose} size="small" title="Set Gamepad Profile Action">
            <div className={styles.profileActionWrapper}>
                <Availability type={availability} />

                <Input
                    value={shortcutName}
                    onChange={(e) => setShortcutName(e.target.value)}
                    additionalProps={{ placeholder: 'Shortcut Name...', disabled: !gamepadShortcut }}
                    isNumber={false}
                    style={{ margin: 0 }}
                />

                <Button primary onClick={handleAddShortcut} disabled={!gamepadShortcut || availability !== AVAILABLE}>Set Shortcut</Button>
            </div>
        </Modal>
    );
};

export default ProfileShortcutModal;
