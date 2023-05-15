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
import Mousetrap from 'mousetrap';
import { ALL_CATEGORY } from 'app/constants';

// import { useSelector, useDispatch } from 'react-redux';

import store from 'app/store';
import Modal from 'app/components/Modal';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
// import { updateShortcutsList, holdShortcutsListener, unholdShortcutsListener } from 'app/actions/preferencesActions';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import shuttleEvents from 'app/lib/shuttleEvents';

import CategoryFilter from '../CategoryFilter';
import ShortcutsTable from '../ShortcutsTable';
import EditArea from './EditArea';
import { generateList } from '../utils';

import styles from '../index.styl';

/**
 * Keybinding settings page
 * @prop {Boolean} active Check if this page is currently active or not
 */
const Keyboard = () => {
    const [shortcutsList, setShortcutsList] = useState(store.get('commandKeys', {}));
    const [dataSet, setDataSet] = useState(shortcutsList);
    const [filterCategory, setFilterCategory] = useState(ALL_CATEGORY);
    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

    const filter = (category, shortcuts) => {
        const allShortcuts = shortcuts || shortcutsList;
        const filteredData = category === ALL_CATEGORY ? allShortcuts : Object.fromEntries(Object.entries(allShortcuts).filter(([key, entry]) => {
            if (allShuttleControlEvents[key]) {
                return allShuttleControlEvents[key].category === category;
            }
            return entry.category === category;
        }));
        setDataSet(filteredData);
        setFilterCategory(category);
    };
    // const dispatch = useDispatch();

    const [currentShortcut, setCurrentShortcut] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const stopCallbackFunc = Mousetrap.prototype.stopCallback;

    useEffect(() => {
        // Trigger pubsub for use in Location widget where keybindings are injected
        // When modifing keybindings, we remove the key listener in location widget to prevent
        // it from being fired during the edit
        // dispatch(holdShortcutsListener());
        // pubsub.publish('removeshortcutsListener');

        const token = pubsub.subscribe('keybindingsUpdated', (msg, shortcuts) => {
            if (shortcuts) { // if shortcuts not sent, updateKeybindings published it
                updateKeybindings(shortcuts);
            }
        });

        // When we are not editing the keybindings anymore, make sure to re-inject the keybindings
        // within the location widget again
        return () => {
            pubsub.unsubscribe(token);
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
        setCurrentShortcut(currentShortcut.cmd || currentShortcut.id);
    };

    const handleDelete = (shortcut) => {
        const updatedShortcuts = _.cloneDeep(shortcutsList);
        updatedShortcuts[shortcut.cmd].keys = '';
        updateKeybindings(updatedShortcuts, false);

        showToast('Shortcut Cleared');
    };

    /**
     * Function to edit the stores commandKeys array
     * @param {Object} shortcut The shortcut that was modifed
     */
    const editKeybinding = (shortcut, showToast = true) => {
        //Replace old keybinding item with new one
        const updatedShortcuts = _.cloneDeep(shortcutsList);
        updatedShortcuts[shortcut.cmd] = shortcut;
        updateKeybindings(updatedShortcuts, showToast);
    };

    const toggleKeybinding = (shortcut, showToast) => {
        const updatedShortcutsList = _.cloneDeep(shortcutsList);
        const shortcutInUse = Object.entries(updatedShortcutsList).filter(([key, keybinding]) => keybinding.cmd !== shortcut.cmd).find(([key, keybinding]) => keybinding.keys === shortcut.keys);
        if (shortcutInUse && shortcut.isActive) {
            shortcut.keys = '';
        }

        updatedShortcutsList[shortcut.cmd] = shortcut;
        updateKeybindings(updatedShortcutsList, showToast);
    };

    const updateKeybindings = (shortcuts, shouldShowToast) => {
        store.replace('commandKeys', shortcuts);
        setShortcutsList(shortcuts);
        filter(filterCategory, shortcuts);
        pubsub.publish('keybindingsUpdated');

        setShowEditModal(false);
        resumeCallback();
        // dispatch(updateShortcutsList(shortcuts));

        if (shouldShowToast) {
            showToast();
        }
    };

    const closeModal = () => {
        setShowEditModal(false);
        resumeCallback();
    };

    const enableAllShortcuts = () => {
        let enabledKeybindings = _.cloneDeep(shortcutsList);
        let enabledArr = Object.entries(enabledKeybindings);
        enabledArr.forEach(([key, keybinding]) => {
            keybinding.isActive = true;
        });
        enabledKeybindings = Object.fromEntries(enabledArr);

        updateKeybindings(enabledKeybindings, false);

        // dispatch(updateShortcutsList(enabledKeybindingsArr));

        showToast('Shortcuts Enabled');
    };

    const disableAllShortcuts = () => {
        let disabledShortcuts = _.cloneDeep(shortcutsList);
        let disabledArr = Object.entries(disabledShortcuts);
        disabledArr.forEach(([key, keybinding]) => {
            keybinding.isActive = false;
        });
        disabledShortcuts = Object.fromEntries(disabledArr);

        updateKeybindings(disabledShortcuts, false);
        // dispatch(updateShortcutsList(disabledShortcuts));

        showToast('Shortcuts Disabled');
    };

    const stopCallback = () => {
        Mousetrap.prototype.stopCallback = function () {
            return true;
        };
        return true;
    };

    const resumeCallback = () => {
        Mousetrap.prototype.stopCallback = stopCallbackFunc;
        return true;
    };

    const allShortcutsEnabled = useMemo(() => Object.entries(shortcutsList).every(([key, shortcut]) => shortcut.isActive), [shortcutsList]);
    const allShortcutsDisabled = useMemo(() => Object.entries(shortcutsList).every(([key, shortcut]) => !shortcut.isActive), [shortcutsList]);
    return (
        <div>
            <CategoryFilter onChange={filter} filterCategory={filterCategory} />
            <div className={styles['table-wrapper']}>
                <ShortcutsTable
                    dataSet={generateList(dataSet)}
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

            { showEditModal && stopCallback() && (
                <Modal onClose={closeModal} size="md" style={{ padding: '1rem 1rem 2rem', backgroundColor: '#d1d5db' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Edit Shortcut</h3>

                    <EditArea
                        shortcut={shortcutsList[currentShortcut]}
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
