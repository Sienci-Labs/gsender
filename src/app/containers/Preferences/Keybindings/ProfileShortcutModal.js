import React, { useEffect, useState } from 'react';
// import store from 'app/store';
import gamepad from 'app/lib/gamepad';

import Modal from 'app/components/ToolModal/ToolModal';

const ProfileShortcutModal = ({ profile, shortcut, onClose }) => {
    const [gamepadShortcut, setGamepadShortcut] = useState(null);

    useEffect(() => {
        gamepad.start();
        gamepad.on('gamepad:button', ({ detail }) => {
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

            setGamepadShortcut(clickedButtons);

            // console.log({ profile, currentGamepad, gamepadShortcut, clickedButtons });
        });

        return () => {
            gamepad.stop();
        };
    }, []);

    const handleAddShortcut = () => {
        const newShortcutsArr =
            profile.shortcuts
                .map(currentShortcut => ({
                    ...currentShortcut,
                    keys: currentShortcut.id === shortcut.id ? gamepadShortcut : currentShortcut.keys
                }));
        // store.set();

        console.log(newShortcutsArr);
    };

    return (
        <Modal onClose={onClose} size="small" title="Joystick Profile Action">
            <h5 style={{ margin: 0, padding: '15px', textAlign: 'center' }}>Press Any Button on Your Gamepad/Joystick</h5>

            {
                gamepadShortcut && <div>Button press detected</div>
            }

            <button onClick={handleAddShortcut}>Set shortcut</button>
        </Modal>
    );
};

export default ProfileShortcutModal;
