import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import store from 'app/store';
import gamepad from 'app/lib/gamepad';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import { Button } from 'app/components/Button';

import { GamepadContext } from './utils/context';
import {
    setCurrentGamepadProfile,
    setGamepadProfileList,
    setCurrentModal,
    setMacros,
} from './utils/actions';

import styles from '../index.module.styl';
import Fieldset from '../../components/Fieldset';
import ButtonActionsTable from './components/ButtonActionsTable';
import { arrayComparator } from './utils';
import JoystickOptions from './JoystickOptions';
import { GAMEPAD_MODAL } from './utils/constants';
import { toast } from 'app/lib/toaster';

const Profile = ({ data }) => {
    const { dispatch } = useContext(GamepadContext);
    const [isConnected, setIsConnected] = useState(false);
    const [name, setName] = useState(data.name);

    useEffect(() => {
        gamepad.on('gamepad:connected', checkGamepadConnection);
        gamepad.on('gamepad:disconnected', checkGamepadConnection);
        gamepad.on('gamepad:button', checkGamepadConnection);

        checkGamepadConnection();

        setMacros().then((state) => {
            dispatch(state);
        });

        return () => {
            gamepad.removeEventListener(
                'gamepad:connected',
                checkGamepadConnection,
            );
            gamepad.removeEventListener(
                'gamepad:disconnected',
                checkGamepadConnection,
            );
            gamepad.removeEventListener(
                'gamepad:button',
                checkGamepadConnection,
            );
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
                ? { ...profile, profileName: name }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));
        toast.info('Updated Profile Name');
    };

    return (
        <>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '8fr 4fr 2fr 6fr',
                    gap: '1.5rem',
                    alignItems: 'center',
                    margin: '0 0 0.5rem',
                }}
            >
                <input
                    type="text"
                    value={name}
                    className={styles.profileName}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleEditName}
                />
                <span
                    style={{
                        padding: '0.5rem',
                        borderRadius: '5px',
                        color: 'white',
                        backgroundColor: isConnected ? '#4bb543' : '#16b1c9',
                        textAlign: 'center',
                    }}
                >
                    {isConnected ? 'Connected' : 'Not Connected'}
                </span>
                <Button
                    onClick={() =>
                        dispatch(setCurrentModal(GAMEPAD_MODAL.HELP))
                    }
                    style={{ margin: 0 }}
                >
                    Help
                </Button>
                <Button
                    onClick={() => dispatch(setCurrentGamepadProfile(null))}
                    style={{ margin: 0 }}
                >
                    <i className="fas fa-arrow-left" />
                    <span>Back to Gamepad Profiles</span>
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Fieldset
                    legend="Button Actions"
                    style={{ width: '60%', padding: '0.75rem' }}
                >
                    <p style={{ textAlign: 'center' }}>
                        Assign a &quot;Lockout&quot; button for gamepad safety,
                        or a &quot;2nd Action&quot; button to use like a
                        Function key and give your gamepad double the functions!
                    </p>
                    <div
                        style={{
                            overflowY: 'auto',
                            height: '425px',
                            backgroundColor: 'white',
                        }}
                    >
                        <ButtonActionsTable />
                    </div>
                </Fieldset>

                <Fieldset legend="Joystick Options" style={{ width: '40%' }}>
                    <JoystickOptions />
                </Fieldset>
            </div>
        </>
    );
};

Profile.propTypes = {
    data: PropTypes.object,
};

export default Profile;
