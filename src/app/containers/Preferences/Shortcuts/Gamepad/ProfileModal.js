import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import throttle from 'lodash/throttle';
import _ from 'lodash';

import store from 'app/store';
import gamepad from 'app/lib/gamepad';
import { Toaster, TOASTER_SUCCESS, TOASTER_SHORT } from 'app/lib/toaster/ToasterLib';
import ToolModal from 'app/components/ToolModal/ToolModal';
import Button from 'app/components/FunctionButton/FunctionButton';

import Input from '../../components/Input';

import styles from '../index.styl';
import { AVAILABILITY_TYPES } from '../utils';

const { DEFAULT, AVAILABLE, UNAVAILABLE } = AVAILABILITY_TYPES;

const ProfileModal = ({ onClose, onAdd }) => {
    const [gamepadInfo, setGamepadInfo] = useState(null);
    const [availabilityType, setAvailabilityType] = useState(DEFAULT);
    const [customProfileName, setCustomProfileName] = useState('');

    useEffect(() => {
        gamepad.start();

        const gamepadListener = throttle(({ detail }) => {
            const { gamepad } = detail;

            const isAvailable = checkIfIsAvailable(gamepad);

            setAvailabilityType(isAvailable);
            setGamepadInfo(gamepad);
        }, 500, { trailing: false });

        gamepad.on('gamepad:button', gamepadListener);

        return () => {
            gamepad.removeEventListener('gamepad:button', gamepadListener);
        };
    }, []);

    const checkIfIsAvailable = (gamepad) => {
        const { profiles = [] } = store.get('workspace.gamepad');

        const profileAlreadyExists = profiles.find(profile => profile.id.includes(gamepad.id));

        return profileAlreadyExists ? UNAVAILABLE : AVAILABLE;
    };

    const handleAddProfile = () => {
        const { profiles = [] } = store.get('workspace.gamepad');
        const commandKeys = store.get('commandKeys', {});
        const newShortcuts = _.cloneDeep(commandKeys);
        Object.entries(newShortcuts).forEach(([key, shortcut]) => {
            shortcut.keys = '';
        });

        const newProfiles = [
            {
                id: [gamepadInfo.id],
                active: true,
                profileName: customProfileName || gamepadInfo.id,
                shortcuts: newShortcuts,
                icon: 'fas fa-gamepad'
            },
            ...profiles
        ];

        store.replace('workspace.gamepad.profiles', newProfiles);

        Toaster.pop({
            msg: 'Added New Gamepad Profile',
            type: TOASTER_SUCCESS,
            duration: TOASTER_SHORT
        });

        onAdd(newProfiles);
        onClose();
    };

    const Availability = ({ type }) => {
        const output = {
            [DEFAULT]: (
                <div className={styles.availability}>
                    <i className="fas fa-info-circle" />
                    <p style={{ textAlign: 'center' }}>Connect your device and press any button on it</p>
                </div>
            ),
            [AVAILABLE]: (
                <div className={styles.available}>
                    <i className={classnames('fas fa-check-circle')} />
                    <p style={{ margin: 0 }}>Profile Is Available</p>
                    <small>Device ID: {gamepadInfo?.id}</small>
                </div>
            ),
            [UNAVAILABLE]: (
                <div className={styles.unavailable}>
                    <i className={classnames('fas fa-times-circle')} />
                    <p style={{ margin: 0 }}>Profile Already Exists</p>
                    <small>Device ID: {gamepadInfo?.id}</small>
                </div>
            ),
        }[type];

        return output;
    };

    return (
        <ToolModal
            onClose={onClose}
            size="small"
            title="Add Gamepad Profile"
        >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <Availability type={availabilityType} info={gamepadInfo} />

                <Input
                    onChange={(e) => setCustomProfileName(e.target.value)}
                    additionalProps={{ placeholder: 'Enter a Custom Profile Name Here...', disabled: availabilityType !== AVAILABLE }}
                    className={availabilityType === AVAILABLE ? styles.customProfileName : styles.customProfileNameHidden}
                    isNumber={false}
                />

                <Button
                    primary
                    disabled={availabilityType !== AVAILABLE}
                    onClick={handleAddProfile}
                    style={{ margin: 0 }}
                >
                    Add New Profile
                </Button>
            </div>
        </ToolModal>
    );
};

ProfileModal.propTypes = {
    onAdd: PropTypes.func,
    onClose: PropTypes.func
};

export default ProfileModal;
