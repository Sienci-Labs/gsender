import React from 'react';
import Button from 'app/components/FunctionButton/FunctionButton';

import styles from '../index.styl';

import { ProfileItem } from './Profile';

const ProfileList = ({ profiles, onClick, onDelete, onAdd }) => {
    return (
        <>
            <div className={profiles.length ? styles.profileList : styles.profileListEmpty}>
                {
                    !profiles.length ? <p style={{ fontSize: '1.5rem' }}>No Profiles, Click the Button Below to Add One</p> : profiles.map(({ id, profileName, icon = 'fas fa-gamepad' }) => (
                        <ProfileItem
                            key={id}
                            id={id}
                            title={profileName}
                            icon={icon}
                            onClick={onClick}
                            onDelete={onDelete}
                        />
                    ))
                }
            </div>

            <Button primary onClick={onAdd}>
                <i className="fas fa-plus" />
                <span>Add New Joystick Profile</span>
            </Button>
        </>
    );
};

export default ProfileList;
