import React, { useState, useMemo } from 'react';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS, TOASTER_SHORT } from 'app/lib/toaster/ToasterLib';

import styles from '../index.styl';

import Profile from './Profile';
import ProfileList from './ProfileList';
import ProfileModal from './ProfileModal';

const Gamepad = () => {
    const [profiles, setProfiles] = useState(store.get('workspace.gamepad.profiles'));
    const [currentProfileID, setCurrentProfileID] = useState(null);
    const [showAddProfile, setShowAddProfile] = useState(false);

    const handleProfileClick = (ids) => {
        setCurrentProfileID(ids[0]); //Can just grab one of the ids in the array for computing the profile information below
    };

    const handleProfileDelete = (id) => {
        let filteredProfiles = profiles.filter((profile) => {
            return JSON.stringify(profile.id) !== JSON.stringify(id);
        });

        setProfiles(filteredProfiles);
        setCurrentProfileID(null);

        store.replace('workspace.gamepad.profiles', filteredProfiles);

        Toaster.pop({
            msg: 'Removed Gamepad Profile',
            type: TOASTER_SUCCESS,
            duration: TOASTER_SHORT
        });
    };

    const handleUpdateProfiles = (updatedProfiles) => {
        setProfiles(updatedProfiles);
        store.replace('workspace.gamepad.profiles', updatedProfiles);
    };

    const currentProfile = useMemo(() => profiles.find(profile => profile.id.includes(currentProfileID)), [currentProfileID, profiles]);

    return (
        <div className={styles.container}>
            {
                currentProfileID
                    ? (
                        <Profile
                            data={currentProfile}
                            onUpdateProfiles={handleUpdateProfiles}
                            setCurrentProfileID={setCurrentProfileID}
                        />
                    )
                    : (
                        <ProfileList
                            profiles={profiles}
                            onClick={handleProfileClick}
                            onDelete={handleProfileDelete}
                            onAdd={() => setShowAddProfile(true)}
                        />
                    )
            }

            {
                showAddProfile && <ProfileModal onClose={() => setShowAddProfile(false)} onAdd={(newProfiles) => setProfiles(newProfiles)} />
            }
        </div>
    );
};

export default Gamepad;
