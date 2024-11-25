import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { toast } from 'app/lib/toaster';
import store from 'app/store';
import gamepad, { shortcutComboBuilder } from 'app/lib/gamepad';
import { Button } from 'app/components/Button';
import Modal from 'app/components/ToolModal/ToolModal';
import shuttleEvents from 'app/lib/shuttleEvents';

import Input from '../../components/Input';

import styles from '../index.module.styl';
import { AVAILABILITY_TYPES } from '../utils';
import Availability from './Availability';

const { DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME } = AVAILABILITY_TYPES;
const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

const ProfileShortcutModal = ({
    profile,
    shortcut,
    onClose,
    onUpdateProfiles,
    filterFunc,
    filterCategory,
}) => {
    const [gamepadShortcut, setGamepadShortcut] = useState([]);
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

    const gamepadListener = _.throttle(
        ({ detail }) => {
            const { gamepad: currentGamepad } = detail;
            const { id, buttons } = currentGamepad;

            if (!profile.id.includes(id)) {
                return;
            }

            const clickedButtons = buttons
                .map((button, i) => ({
                    pressed: button.pressed || button.touched,
                    buttonIndex: i,
                }))
                .filter((button) => button.pressed);

            if (clickedButtons.length === 0) {
                return;
            }

            const profiles = store.get('workspace.gamepad.profiles', []);
            const currentProfile = profiles.find((profile) =>
                profile.id.includes(id),
            );

            const comboKeys = shortcutComboBuilder(
                clickedButtons.map((shortcut) => shortcut.buttonIndex),
            );

            const comboInUse = Object.entries(currentProfile.shortcuts).find(
                ([key, shortcut]) => shortcut.keys === comboKeys,
            );

            if (!comboInUse) {
                setAvailability(AVAILABLE);
            } else if (comboInUse[1].cmd === shortcut?.cmd) {
                setAvailability(IS_THE_SAME);
            } else {
                setAvailability(UNAVAILABLE);
            }

            setGamepadShortcut(clickedButtons);
            listenerRef.current.handleButtonPress();
        },
        250,
        { trailing: false },
    );

    const handleUpdateShortcut = () => {
        const newKeys = shortcutComboBuilder(
            gamepadShortcut.map((shortcut) => shortcut.buttonIndex),
        );
        const newKeysName =
            shortcutName ||
            gamepadShortcut.map((shortcut) => shortcut.buttonIndex).join(', ');

        let newShortcuts = _.cloneDeep(profile.shortcuts);
        newShortcuts[shortcut.cmd].keys = newKeys;
        newShortcuts[shortcut.cmd].keysName = newKeysName;
        newShortcuts[shortcut.cmd].isActive = true;

        filterFunc(filterCategory, newShortcuts);

        const profiles = store.get('workspace.gamepad.profiles', []);

        //Checks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) =>
            childArr.every((element) => parentArr.includes(element));

        const cleanedProfiles = profiles.map((currentProfile) =>
            arrayComparator(currentProfile.id, profile.id)
                ? { ...profile, shortcuts: newShortcuts }
                : currentProfile,
        );

        onUpdateProfiles(cleanedProfiles);

        onClose();

        toast.success('Updated Gamepad Action Shortcut');
    };

    return (
        <Modal
            onClose={onClose}
            size="small"
            title="Set Gamepad Profile Action"
        >
            <div className={styles.profileActionWrapper}>
                <Availability
                    type={availability}
                    shortcutTitle={
                        allShuttleControlEvents[shortcut.cmd]
                            ? allShuttleControlEvents[shortcut.cmd].title
                            : shortcut.title
                    }
                    shortcut={gamepadShortcut}
                    listenerRef={listenerRef}
                />

                <Input
                    value={shortcutName}
                    onChange={(e) => setShortcutName(e.target.value)}
                    additionalProps={{
                        placeholder: 'Enter a Custom Shortcut Name Here...',
                        disabled:
                            !gamepadShortcut || availability !== AVAILABLE,
                    }}
                    isNumber={false}
                    className={
                        availability === AVAILABLE
                            ? styles.customProfileName
                            : styles.customProfileNameHidden
                    }
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
    onUpdateProfiles: PropTypes.func,
};

export default ProfileShortcutModal;
