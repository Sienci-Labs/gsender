import React, { useContext } from 'react';

import { Button } from 'app/components/Button';

import ProfileItem from './ProfileItem';
import { GamepadContext } from './utils/context';

import styles from '../index.module.styl';
import { GAMEPAD_MODAL } from './utils/constants';
import { setCurrentModal } from './utils/actions';

const ProfileList = () => {
    const {
        state: {
            settings: { profiles },
        },
        dispatch,
    } = useContext(GamepadContext);

    const ActionArea = () => (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
                primary
                onClick={() =>
                    dispatch(setCurrentModal(GAMEPAD_MODAL.ADD_NEW_PROFILE))
                }
            >
                <i className="fas fa-plus" />
                <span>Add New Gamepad Profile</span>
            </Button>

            <Button
                onClick={() => dispatch(setCurrentModal(GAMEPAD_MODAL.HELP))}
            >
                <span>Help</span>
            </Button>
        </div>
    );

    if (profiles.length === 0) {
        return (
            <div className={styles.profileListEmpty}>
                <p style={{ fontSize: '1.5rem' }}>
                    No Profiles, Click the Button Below to Add One
                </p>

                <ActionArea />
            </div>
        );
    }

    return (
        <>
            <div className={styles.profileList}>
                {profiles.map(({ id, name }) => (
                    <ProfileItem
                        key={id}
                        id={id}
                        title={name}
                        icon="fas fa-gamepad"
                    />
                ))}
            </div>

            <ActionArea />
        </>
    );
};

export default ProfileList;
