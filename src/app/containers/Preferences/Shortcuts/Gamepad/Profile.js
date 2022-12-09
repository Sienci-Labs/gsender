import React, { useState, useMemo } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';

import styles from '../index.styl';
import ShortcutsTable from '../ShortcutsTable';
import ProfileShortcutModal from './ProfileShortcutModal';

const Profile = ({ data, onUpdateProfiles }) => {
    const { profileName, icon, shortcuts } = data;

    const [currentShortcutID, setCurrentShortcutID] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [name, setName] = useState(profileName);

    const handleEditName = () => {
        if (name === profileName) {
            return;
        }

        const profiles = store.get('workspace.gamepad.profiles', []);

        const updatedProfiles =
            profiles.map(profile => (profile.id.includes(data.id) ? ({ ...profile, profileName: name }) : profile));

        onUpdateProfiles(updatedProfiles);

        Toaster.pop({
            msg: 'Updated Shortcut Profile Name',
            type: TOASTER_SUCCESS,
            duration: 2000
        });
    };

    const handleDelete = (currShortcut) => {
        const updatedShortcuts = shortcuts.map((shortcut) => (shortcut.id === currShortcut.id
            ? { ...shortcut, keys: '', keysName: '', isActive: false }
            : shortcut
        ));

        const profiles = store.get('workspace.gamepad.profiles', []);

        const updatedProfiles =
            profiles.map(profile => (profile.id.includes(data.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        onUpdateProfiles(updatedProfiles);

        Toaster.pop({
            msg: 'Removed Gamepad Action Shortcut',
            type: TOASTER_SUCCESS,
            duration: 2000
        });
    };

    const handleShortcutToggle = (currShortcut) => {
        const updatedShortcuts = shortcuts.map((shortcut) => (shortcut.id === currShortcut.id ? currShortcut : shortcut));

        const profiles = store.get('workspace.gamepad.profiles', []);

        const updatedProfiles =
            profiles.map(profile => (profile.id.includes(data.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        onUpdateProfiles(updatedProfiles);
    };

    const handleEdit = (shortcut) => {
        setShowModal(true);
        setCurrentShortcutID(shortcut.id);
    };

    const currentShortcut = useMemo(() => shortcuts.find(shortcut => shortcut.id === currentShortcutID), [shortcuts, currentShortcutID]);

    return (
        <>
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 13fr', alignItems: 'center', margin: '0 0 0.5rem' }}>
                    <i className={classnames(icon, styles.profileItemIcon)} />
                    <input
                        type="text"
                        value={name}
                        className={styles.profileName}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleEditName}
                    />
                </div>
                <div style={{ overflowY: 'auto', height: '435px', backgroundColor: 'white' }}>
                    <ShortcutsTable
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onShortcutToggle={handleShortcutToggle}
                        data={shortcuts}
                    />
                </div>
            </div>

            {showModal && (
                <ProfileShortcutModal
                    profile={data}
                    shortcut={currentShortcut}
                    onClose={() => setShowModal(false)}
                    onUpdateProfiles={onUpdateProfiles}
                />
            )}
        </>
    );
};

Profile.propTypes = {
    data: PropTypes.object,
    onUpdateProfiles: PropTypes.func
};

export default Profile;
