import React, { useState, useMemo } from 'react';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS, TOASTER_SHORT } from 'app/lib/toaster/ToasterLib';
import Button from 'app/components/FunctionButton/FunctionButton';

import styles from '../index.styl';

import Profile from './Profile';
import ProfileList from './ProfileList';
import ProfileModal from './ProfileModal';

const Gamepad = () => {
    const [profiles, setProfiles] = useState(store.get('workspace.gamepad.profiles'));
    const [currentProfileID, setCurrentProfileID] = useState(null);
    const [showAddProfile, setShowAddProfile] = useState(false);

    const handleProfileClick = (id) => {
        setCurrentProfileID(id[0]); //Can just grab one of the ids in the array for computing the profile information below
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

    const handleShortcutsToggle = (toggle) => {
        const updatedShortcuts = currentProfile.shortcuts.map((shortcut) => ({ ...shortcut, isActive: toggle }));

        const profiles = store.get('workspace.gamepad.profiles', []);

        //CHecks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) => childArr.every(element => parentArr.includes(element));

        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, currentProfile.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        handleUpdateProfiles(updatedProfiles);
    };

    const currentProfile = useMemo(() => profiles.find(profile => profile.id.includes(currentProfileID)), [currentProfileID, profiles]);

    const allShortcutsEnabled = currentProfile?.shortcuts?.every(shortcut => shortcut.isActive);
    const allShortcutsDisabled = currentProfile?.shortcuts?.every(shortcut => !shortcut.isActive);

    return (
        <div className={styles.container}>
            {
                currentProfileID
                    ? (
                        <>
                            <Profile data={currentProfile} onUpdateProfiles={handleUpdateProfiles} />

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button primary onClick={() => handleShortcutsToggle(true)} disabled={allShortcutsEnabled}>
                                        <i className="fas fa-toggle-on" />
                                        <span>Enable All Shortcuts</span>
                                    </Button>
                                    <Button primary onClick={() => handleShortcutsToggle(false)} disabled={allShortcutsDisabled}>
                                        <i className="fas fa-toggle-on" />
                                        <span>Disable All Shortcuts</span>
                                    </Button>
                                </div>
                                <Button primary onClick={() => setCurrentProfileID(null)}>
                                    <i className="fas fa-arrow-left" />
                                    <span>Back to Profiles List</span>
                                </Button>
                            </div>
                        </>
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
