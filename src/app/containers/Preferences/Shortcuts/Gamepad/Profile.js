import React, { useState, useMemo } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import { ALL_CATEGORY } from 'app/constants';

import styles from '../index.styl';
import ShortcutsTable from '../ShortcutsTable';
import ProfileShortcutModal from './ProfileShortcutModal';
import CategoryFilter from '../CategoryFilter';

const Profile = ({ data, onUpdateProfiles }) => {
    const { profileName, icon, shortcuts } = data;

    const [currentShortcutCMD, setCurrentShortcutCMD] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [name, setName] = useState(profileName);

    const [dataSet, setDataSet] = useState(shortcuts);
    const [filterCategory, setFilterCategory] = useState(ALL_CATEGORY);

    const filter = (category, shortcutsList) => {
        const allShortcuts = shortcutsList || shortcuts;
        const filteredData = category === ALL_CATEGORY ? allShortcuts : allShortcuts.filter(entry => entry.category === category);
        setDataSet(filteredData);
        setFilterCategory(category);
    };

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
        const updatedShortcuts = shortcuts.map((shortcut) => (shortcut.cmd === currShortcut.cmd
            ? { ...shortcut, keys: '', keysName: '', isActive: false }
            : shortcut
        ));

        const profiles = store.get('workspace.gamepad.profiles', []);

        //CHecks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) => childArr.every(element => parentArr.includes(element));

        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, data.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        onUpdateProfiles(updatedProfiles);

        Toaster.pop({
            msg: 'Removed Gamepad Action Shortcut',
            type: TOASTER_SUCCESS,
            duration: 2000
        });
    };

    const handleShortcutToggle = (currShortcut) => {
        const updatedShortcuts = shortcuts.map((shortcut) => (shortcut.cmd === currShortcut.cmd ? currShortcut : shortcut));

        const profiles = store.get('workspace.gamepad.profiles', []);

        //CHecks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) => childArr.every(element => parentArr.includes(element));

        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, data.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        onUpdateProfiles(updatedProfiles);
    };

    const handleEdit = (shortcut) => {
        setShowModal(true);
        setCurrentShortcutCMD(shortcut.cmd);
    };

    const currentShortcut = useMemo(() => shortcuts.find(shortcut => shortcut.cmd === currentShortcutCMD), [shortcuts, currentShortcutCMD]);

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
                <CategoryFilter onChange={filter} filterCategory={filterCategory} />
                <div style={{ overflowY: 'auto', height: '380px', backgroundColor: 'white' }}>
                    <ShortcutsTable
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onShortcutToggle={handleShortcutToggle}
                        dataSet={dataSet}
                    />
                </div>
            </div>

            {showModal && (
                <ProfileShortcutModal
                    profile={data}
                    shortcut={currentShortcut}
                    onClose={() => setShowModal(false)}
                    onUpdateProfiles={onUpdateProfiles}
                    filter={filter}
                    filterCategory={filterCategory}
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
