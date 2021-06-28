import React, { useState } from 'react';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS, TOASTER_SHORT } from 'app/lib/toaster/ToasterLib';
import Button from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';

import { Profile } from './Profile';
import ProfileList from './ProfileList';
import AddActionModal from './AddActionModal';
import AddProfileModal from './AddProfileModal';

const Joystick = () => {
    const [profiles, setProfiles] = useState(store.get('workspace.gamepad.profiles'));
    const [currentProfile, setCurrentProfile] = useState(null);
    const [showAddAction, setShowAddAction] = useState(false);
    const [showAddProfile, setShowAddProfile] = useState(false);

    const handleClick = (id) => {
        const profile = profiles.find((profile) => profile.id === id);

        if (profile) {
            setCurrentProfile(profile);
        }
    };

    const handleDelete = (id) => {
        const filteredProfiles = profiles.filter(profile => profile.id !== id);

        setProfiles(filteredProfiles);
        setCurrentProfile(null);

        store.replace('workspace.gamepad.profiles', filteredProfiles);

        Toaster.pop({
            msg: 'Removed Profile',
            type: TOASTER_SUCCESS,
            duration: TOASTER_SHORT
        });
    };

    return (
        <div className={styles.container}>
            {
                currentProfile
                    ? (
                        <>
                            <Profile currentProfile={currentProfile} />

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button primary onClick={() => setShowAddAction(true)}>
                                    <i className="fas fa-plus" />
                                    <span>Add Action to Profile</span>
                                </Button>
                                <Button primary onClick={() => setCurrentProfile(null)}>
                                    <i className="fas fa-arrow-left" />
                                    <span>Back to Profiles List</span>
                                </Button>
                            </div>
                        </>
                    )
                    : <ProfileList profiles={profiles} onClick={handleClick} onDelete={handleDelete} onAdd={() => setShowAddProfile(true)} />
            }

            {
                showAddAction && <AddActionModal onClose={() => setShowAddAction(false)} />
            }
            {
                showAddProfile && <AddProfileModal onClose={() => setShowAddProfile(false)} onAdd={(newProfiles) => setProfiles(newProfiles)} />
            }
        </div>
    );
};

export default Joystick;
