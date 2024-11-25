import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import throttle from 'lodash/throttle';

import store from 'app/store';
import gamepad from 'app/lib/gamepad';
import {
    Toaster,
    TOASTER_SUCCESS,
    TOASTER_SHORT,
} from 'app/lib/toaster/ToasterLib';
import ToolModal from 'app/components/ToolModal';
import { Button } from 'app/components/Button';

import Input from '../../components/Input';

import styles from '../index.module.styl';
import { AVAILABILITY_TYPES } from '../utils';
import { GamepadContext } from './utils/context';
import { setCurrentModal, setGamepadProfileList } from './utils/actions';
import { defaultOptions } from 'app/store/gamepad';
import { toast } from 'app/lib/toaster';

const { DEFAULT, AVAILABLE, UNAVAILABLE } = AVAILABILITY_TYPES;

const ProfileModal = () => {
    const [gamepadInfo, setGamepadInfo] = useState(null);
    const [availabilityType, setAvailabilityType] = useState(DEFAULT);
    const [customProfileName, setCustomProfileName] = useState('');
    const { dispatch } = useContext(GamepadContext);

    const closeModal = () => dispatch(setCurrentModal(null));

    useEffect(() => {
        gamepad.start();

        const gamepadListener = throttle(
            ({ detail }) => {
                const { gamepad } = detail;

                const isAvailable = checkIfIsAvailable(gamepad);

                setAvailabilityType(isAvailable);
                setGamepadInfo(gamepad);
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
                name: customProfileName || gamepadInfo.id,
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

        toast.success('Added New Gamepad Profile');

        closeModal();
    };

    const Availability = ({ type }) => {
        const output = {
            [DEFAULT]: (
                <div className={styles.availability}>
                    <i className="fas fa-info-circle" />
                    <p style={{ textAlign: 'center' }}>
                        Connect your device and press any button on it
                    </p>
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
            onClose={closeModal}
            size="small"
            title="Add Gamepad Profile"
        >
            <div
                style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    height: '100%',
                }}
            >
                <Availability type={availabilityType} info={gamepadInfo} />

                <Input
                    onChange={(e) => setCustomProfileName(e.target.value)}
                    additionalProps={{
                        placeholder: 'Enter a custom profile name here...',
                        disabled: availabilityType !== AVAILABLE,
                    }}
                    className={
                        availabilityType === AVAILABLE
                            ? styles.customProfileName
                            : styles.customProfileNameHidden
                    }
                    isNumber={false}
                    value={customProfileName}
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
    onClose: PropTypes.func,
};

export default ProfileModal;
