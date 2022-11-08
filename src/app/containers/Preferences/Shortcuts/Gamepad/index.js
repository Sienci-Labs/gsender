import React, { useState, useMemo } from 'react';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS, TOASTER_SHORT } from 'app/lib/toaster/ToasterLib';
import Button from 'app/components/FunctionButton/FunctionButton';

import styles from '../index.styl';

import { Profile } from './Profile';
import ProfileList from './ProfileList';
import AddProfileModal from './AddProfileModal';

const Gamepad = () => {
    const [profiles, setProfiles] = useState(store.get('workspace.gamepad.profiles'));
    const [currentProfileID, setCurrentProfileID] = useState(null);
    const [showAddProfile, setShowAddProfile] = useState(false);

    const handleProfileClick = (id) => {
        setCurrentProfileID(id);
    };

    const handleProfileDelete = (id) => {
        const filteredProfiles = profiles.filter(profile => profile.id !== id);

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
        const updatedShortcuts = currentProfileID.shortcuts.map((shortcut) => ({ ...shortcut, isActive: toggle }));

        const profiles = store.get('workspace.gamepad.profiles', []);

        const updatedProfiles =
            profiles.map(profile => (currentProfileID.id === profile.id ? ({ ...profile, shortcuts: updatedShortcuts }) : currentProfileID));

        handleUpdateProfiles(updatedProfiles);
    };

    const currentProfile = useMemo(() => profiles.find(profile => profile.id === currentProfileID), [currentProfileID]);

    const allShortcutsEnabled = currentProfile?.shortcuts?.every(shortcut => shortcut.isActive);

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
                                    <Button primary onClick={() => handleShortcutsToggle(false)} disabled={!allShortcutsEnabled}>
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
                showAddProfile && <AddProfileModal onClose={() => setShowAddProfile(false)} onAdd={(newProfiles) => setProfiles(newProfiles)} />
            }
        </div>
    );
};

export default Gamepad;
