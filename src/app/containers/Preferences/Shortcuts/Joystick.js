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
            msg: 'Removed Joystick Profile',
            type: TOASTER_SUCCESS,
            duration: TOASTER_SHORT
        });
    };

    const handleUpdateProfiles = (updatedProfiles) => {
        setProfiles(updatedProfiles);
        store.replace('workspace.gamepad.profiles', updatedProfiles);

        const updatedCurrentProfile = updatedProfiles.find(profile => profile.id === currentProfile.id);

        setCurrentProfile(updatedCurrentProfile);
    };

    const handleShortcutsToggle = (toggle) => {
        const updatedShortcuts = currentProfile.shortcuts.map((shortcut) => ({ ...shortcut, isActive: toggle }));

        const profiles = store.get('workspace.gamepad.profiles', []);

        const updatedProfiles =
            profiles.map(profile => (currentProfile.id === profile.id ? ({ ...profile, shortcuts: updatedShortcuts }) : currentProfile));

        handleUpdateProfiles(updatedProfiles);
    };

    const allShortcutsEnabled = currentProfile?.shortcuts?.every(shortcut => shortcut.isActive);
    const allShortcutsDisabled = currentProfile?.shortcuts?.every(shortcut => !shortcut.isActive);

    return (
        <div className={styles.container}>
            {
                currentProfile
                    ? (
                        <>
                            <Profile currentProfile={currentProfile} onUpdateProfiles={handleUpdateProfiles} />

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
                                <Button primary onClick={() => setCurrentProfile(null)}>
                                    <i className="fas fa-arrow-left" />
                                    <span>Back to Profiles List</span>
                                </Button>
                            </div>
                        </>
                    )
                    : (
                        <ProfileList
                            profiles={profiles}
                            onClick={handleClick}
                            onDelete={handleDelete}
                            onAdd={() => setShowAddProfile(true)}
                        />
                    )
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
