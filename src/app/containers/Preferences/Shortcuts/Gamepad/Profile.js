import React, { useState, useMemo } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import _ from 'lodash';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import Button from 'app/components/FunctionButton/FunctionButton';
import { generateList } from '../utils';

import styles from '../index.styl';
import ShortcutsTable from '../ShortcutsTable';
import ProfileShortcutModal from './ProfileShortcutModal';
import CategoryFilter from '../CategoryFilter';
import { ALL_CATEGORY } from '../../../../constants';

const Profile = ({ data, onUpdateProfiles, setCurrentProfileID }) => {
    const { profileName, icon, shortcuts } = data;

    const [currentShortcutCMD, setCurrentShortcutCMD] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [name, setName] = useState(profileName);

    const [dataSet, setDataSet] = useState(shortcuts);
    const [filterCategory, setFilterCategory] = useState(ALL_CATEGORY);

    const filter = (category, shortcutsList) => {
        const allShortcuts = shortcutsList || shortcuts;
        const filteredData = category === ALL_CATEGORY ? allShortcuts : Object.fromEntries(Object.entries(allShortcuts).filter(([key, entry]) => entry.category === category));
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
        const updatedShortcuts = shortcuts;
        updatedShortcuts[currShortcut.cmd] = { ...currShortcut, keys: '', keysName: '', isActive: false };

        const profiles = store.get('workspace.gamepad.profiles', []);

        //CHecks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) => childArr.every(element => parentArr.includes(element));

        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, data.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        onUpdateProfiles(updatedProfiles);
        filter(filterCategory, updatedShortcuts);

        Toaster.pop({
            msg: 'Removed Gamepad Action Shortcut',
            type: TOASTER_SUCCESS,
            duration: 2000
        });
    };

    const handleShortcutToggle = (currShortcut) => {
        const updatedShortcuts = _.cloneDeep(shortcuts);
        updatedShortcuts[currShortcut.cmd] = currShortcut;

        const profiles = store.get('workspace.gamepad.profiles', []);

        //CHecks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) => childArr.every(element => parentArr.includes(element));

        const updatedProfiles =
            profiles.map(currentProfile => (arrayComparator(currentProfile.id, data.id) ? ({ ...data, shortcuts: updatedShortcuts }) : currentProfile));

        onUpdateProfiles(updatedProfiles);
        filter(filterCategory, updatedShortcuts);
    };

    const handleEdit = (shortcut) => {
        setShowModal(true);
        setCurrentShortcutCMD(shortcut.cmd);
    };

    const handleShortcutsToggle = (toggle) => {
        let updatedShortcuts = _.cloneDeep(shortcuts);
        let updatedArr = Object.entries(updatedShortcuts);
        updatedArr.forEach(([key, keybinding]) => {
            keybinding.isActive = toggle;
        });
        updatedShortcuts = Object.fromEntries(updatedArr);

        const profiles = store.get('workspace.gamepad.profiles', []);

        //CHecks if parent array has all the child array elements
        const arrayComparator = (parentArr, childArr) => childArr.every(element => parentArr.includes(element));

        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, data.id) ? ({ ...profile, shortcuts: updatedShortcuts }) : profile));

        onUpdateProfiles(updatedProfiles);
        filter(filterCategory, updatedShortcuts);
    };

    const currentShortcut = useMemo(() => shortcuts[currentShortcutCMD], [shortcuts, currentShortcutCMD]);
    const allShortcutsEnabled = shortcuts ? Object.entries(shortcuts).every(([key, shortcut]) => shortcut.isActive) : false;
    const allShortcutsDisabled = shortcuts ? Object.entries(shortcuts).every(([key, shortcut]) => !shortcut.isActive) : false;

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
                        dataSet={generateList(dataSet)}
                    />
                </div>
            </div>

            {showModal && (
                <ProfileShortcutModal
                    profile={data}
                    shortcut={currentShortcut}
                    onClose={() => setShowModal(false)}
                    onUpdateProfiles={onUpdateProfiles}
                    filterFunc={filter}
                    filterCategory={filterCategory}
                />
            )}

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
    );
};

Profile.propTypes = {
    data: PropTypes.object,
    onUpdateProfiles: PropTypes.func
};

export default Profile;
