
import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import store from 'app/store';
import gamepad, { shortcutComboBuilder } from 'app/lib/gamepad';
import Button from 'app/components/FunctionButton/FunctionButton';
import Modal from 'app/components/ToolModal/ToolModal';

import Input from '../../components/Input';

import styles from '../index.styl';

let queue = [];

const ProfileShortcutModal = ({ profile, shortcut, onClose, onUpdateProfiles }) => {
    const [gamepadShortcut, setGamepadShortcut] = useState(null);
    const [showIndicator, setShowIndicator] = useState(false);
    const [shortcutName, setShortcutName] = useState('');
    const [inUseError, setInUseError] = useState(false);

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
            .filter(currShortcut => currShortcut.id !== shortcut.id)
            .find(shortcut => shortcut.keys === comboKeys);

        setInUseError(!!comboInUse);
        setGamepadShortcut(clickedButtons);
        setShowIndicator(true);

        if (queue.length) {
            queue.forEach(item => clearTimeout(item));
        }

        const newTimeout = () => {
            setShowIndicator(false);
        };

        queue.push(setTimeout(newTimeout, 3000));
    };

    useEffect(() => {
        gamepad.start();

        gamepad.on('gamepad:button', gamepadListener);

        return () => {
            gamepad.removeEventListener('gamepad:button', gamepadListener);
            queue.forEach(item => clearTimeout(item));
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
            msg: 'Updated Joystick Action Shortcut',
            type: TOASTER_SUCCESS,
            duration: 2000
        });
    };

    const RenderButtonsPressed = () => {
        return gamepadShortcut
            ? (
                <>
                    {
                        gamepadShortcut.map((shortcut, i) => (
                            i === 0
                                ? <strong key={shortcut.buttonIndex}>{shortcut.buttonIndex}</strong>
                                : <React.Fragment key={shortcut.buttonIndex}> and <strong>{shortcut.buttonIndex}</strong></React.Fragment>
                        ))
                    }
                </>
            )
            : <>-</>;
    };

    return (
        <Modal onClose={onClose} size="small" title="Joystick Profile Action">
            <div className={styles.profileActionWrapper}>
                <h5 style={{ marginTop: 0, textAlign: 'center' }}>Press Any Button on Your Gamepad/Joystick</h5>

                <div>
                    <div style={{ display: 'grid', justifyItems: 'center', gap: '1rem', alignItems: 'center', gridTemplateRows: '1fr 1fr' }}>
                        <div className={classnames(styles.activeIndicator, { [styles.activeIndicatorOn]: showIndicator })}>
                            { showIndicator && <i className={classnames('fas fa-gamepad', styles.activePulse)} /> }
                        </div>
                        {showIndicator ? <strong>Button press detected</strong> : <span>Waiting for button press...</span>}
                    </div>

                    <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                        Last Button(s) Pressed: <RenderButtonsPressed />
                    </div>

                    <div style={{ margin: '1.5rem 0', textAlign: 'center', fontSize: '1.3rem' }}>
                        { (!gamepadShortcut && !inUseError) && <span>-</span> }
                        { inUseError && <span style={{ color: '#dc2626' }}>This Shortcut is Already in Use, Please Use a Different One</span> }
                        { (gamepadShortcut && !inUseError) && <span style={{ color: '#3e85c7' }}>Shortcut is Available</span>}
                    </div>

                    <Input
                        value={shortcutName}
                        onChange={(e) => setShortcutName(e.target.value)}
                        additionalProps={{ placeholder: 'Shortcut Name...', disabled: !gamepadShortcut }}
                    />
                </div>

                <Button primary onClick={handleAddShortcut} disabled={!gamepadShortcut || inUseError}>Set shortcut for {`"${shortcut.title}"`}</Button>
            </div>
        </Modal>
    );
};

export default ProfileShortcutModal;
