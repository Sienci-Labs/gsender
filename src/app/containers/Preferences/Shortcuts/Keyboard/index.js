/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import _ from 'lodash';
import { ALL_CATEGORY } from 'app/constants';

// import { useSelector, useDispatch } from 'react-redux';

import store from 'app/store';
import Modal from 'app/components/Modal';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
// import { updateShortcutsList, holdShortcutsListener, unholdShortcutsListener } from 'app/actions/preferencesActions';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';

import CategoryFilter from '../CategoryFilter';
import ShortcutsTable from '../ShortcutsTable';
import EditArea from './EditArea';

import styles from '../index.styl';

/**
 * Keybinding settings page
 * @prop {Boolean} active Check if this page is currently active or not
 */
const Keyboard = () => {
    // const { list: shortcutsList } = useSelector(state => state.preferences.shortcuts);
    const [shortcutsList, setShortcutsList] = useState(store.get('commandKeys', []));
    shortcutsList.sort((a, b) => {
        return a.category.localeCompare(b.category);
    });
    const [dataSet, setDataSet] = useState(shortcutsList);
    const [filterCategory, setFilterCategory] = useState(ALL_CATEGORY);

    const filter = (category, shortcuts) => {
        const allShortcuts = shortcuts || shortcutsList;
        const filteredData = category === ALL_CATEGORY ? allShortcuts : allShortcuts.filter(entry => entry.category === category);
        setDataSet(filteredData);
        setFilterCategory(category);
    };
    // const dispatch = useDispatch();

    const [currentShortcut, setCurrentShortcut] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        // Trigger pubsub for use in Location widget where keybindings are injected
        // When modifing keybindings, we remove the key listener in location widget to prevent
        // it from being fired during the edit
        // dispatch(holdShortcutsListener());
        // pubsub.publish('removeshortcutsListener');

        // When we are not editing the keybindings anymore, make sure to re-inject the keybindings
        // within the location widget again
        return () => {
            // pubsub.publish('addshortcutsListener');
            // dispatch(unholdShortcutsListener());
        };
    }, []);

    const showToast = _.throttle((msg = 'Shortcut Updated') => {
        Toaster.pop({
            msg,
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 5000, { trailing: false });

    const handleEdit = (currentShortcut) => {
        setShowEditModal(true);
        setCurrentShortcut(currentShortcut);
    };

    const handleDelete = (shortcut) => {
        shortcut.keys = '';

        const updatedshortcutsList = shortcutsList.map(keybinding => (keybinding.cmd === shortcut.cmd ? shortcut : keybinding));

        updateKeybindings(updatedshortcutsList, false);

        showToast('Shortcut Cleared');
    };

    /**
     * Function to edit the stores commandKeys array
     * @param {Object} shortcut The shortcut that was modifed
     */
    const editKeybinding = (shortcut, showToast = true) => {
        //Replace old keybinding item with new one
        const editedshortcutsList = shortcutsList.map(keybinding => (keybinding.id === shortcut.id ? shortcut : keybinding));

        updateKeybindings(editedshortcutsList, showToast);
    };

    const toggleKeybinding = (shortcut, showToast) => {
        const shortcutInUse = shortcutsList.filter(keybinding => keybinding.id !== shortcut.id).find(keybinding => keybinding.keys === shortcut.keys);

        if (shortcutInUse && shortcut.isActive) {
            shortcut.keys = '';
        }

        const updatedshortcutsList = shortcutsList.map(keybinding => (keybinding.id === shortcut.id ? shortcut : keybinding));

        updateKeybindings(updatedshortcutsList, showToast);
    };

    const updateKeybindings = (shortcuts, shouldShowToast) => {
        store.replace('commandKeys', shortcuts);
        setShortcutsList(shortcuts);
        filter(filterCategory, shortcuts);
        pubsub.publish('keybindingsUpdated');

        setShowEditModal(false);
        // dispatch(updateShortcutsList(shortcuts));

        if (shouldShowToast) {
            showToast();
        }
    };

    const closeModal = () => {
        setShowEditModal(false);
    };

    const enableAllShortcuts = () => {
        const enabledKeybindingsArr = shortcutsList.map(keybinding => ({ ...keybinding, isActive: true }));

        store.replace('commandKeys', enabledKeybindingsArr);

        setShortcutsList(enabledKeybindingsArr);
        filter(filterCategory, enabledKeybindingsArr);

        setShowEditModal(false);
        // dispatch(updateShortcutsList(enabledKeybindingsArr));

        showToast('Shortcuts Enabled');
    };

    const disableAllShortcuts = () => {
        const disabledShortcuts = shortcutsList.map(keybinding => ({ ...keybinding, isActive: false }));

        store.replace('commandKeys', disabledShortcuts);
        setShortcutsList(disabledShortcuts);
        filter(filterCategory, disabledShortcuts);
        // dispatch(updateShortcutsList(disabledShortcuts));

        showToast('Shortcuts Disabled');
    };

    const allShortcutsEnabled = useMemo(() => shortcutsList.every(shortcut => shortcut.isActive), [shortcutsList]);
    const allShortcutsDisabled = useMemo(() => shortcutsList.every(shortcut => !shortcut.isActive), [shortcutsList]);
    return (
        <div>
            <CategoryFilter onChange={filter} filterCategory={filterCategory} />
            <div className={styles['table-wrapper']}>
                <ShortcutsTable
                    dataSet={dataSet}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShortcutToggle={toggleKeybinding}
                />
            </div>

            <div style={{ display: 'grid', columnGap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <FunctionButton primary onClick={enableAllShortcuts} disabled={allShortcutsEnabled}>
                    <i className="fas fa-toggle-on" />
                    Enable All Shortcuts
                </FunctionButton>
                <FunctionButton primary onClick={disableAllShortcuts} disabled={allShortcutsDisabled}>
                    <i className="fas fa-toggle-off" />
                    Disable All Shortcuts
                </FunctionButton>
            </div>

            { showEditModal && (
                <Modal onClose={closeModal} size="md" style={{ padding: '1rem 1rem 2rem', backgroundColor: '#d1d5db' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Edit Shortcut</h3>

                    <EditArea
                        shortcut={currentShortcut}
                        shortcuts={shortcutsList}
                        edit={editKeybinding}
                        onClose={closeModal}
                    />
                </Modal>
            ) }
        </div>
    );
};

Keyboard.propTypes = {
    active: PropTypes.bool
};

export default Keyboard;
