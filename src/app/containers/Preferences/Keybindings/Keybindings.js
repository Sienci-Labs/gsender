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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import _ from 'lodash';

import store from 'app/store';
import Modal from 'app/components/Modal';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';

import Table from './MainTable';
import EditArea from './EditArea';

import styles from './index.styl';

/**
 * Keybinding settings page
 * @prop {Boolean} active Check if this page is currently active or not
 */
export default class Keybindings extends Component {
    static propTypes = {
        active: PropTypes.bool,
    }

    showToast = _.throttle((msg = 'Shortcut Updated') => {
        Toaster.pop({
            msg,
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 5000, { trailing: false });

    state = {
        keybindingsList: store.get('commandKeys', []),
        currentShortcut: {},
        showEditModal: false,
    }

    handleEdit = (currentShortcut) => {
        this.setState({ showEditModal: true, currentShortcut });
    }

    handleDelete = (shortcut) => {
        const { keybindingsList } = this.state;

        shortcut.keys = '';

        const updatedKeybindingsList = keybindingsList.map(keybinding => (keybinding.id === shortcut.id ? shortcut : keybinding));

        this.updateKeybindings(updatedKeybindingsList, false);

        this.showToast('Shortcut Cleared');
    }

    /**
     * Function to edit the stores commandKeys array
     * @param {Object} shortcut The shortcut that was modifed
     */
    editKeybinding = (shortcut, showToast = true) => {
        const { keybindingsList } = this.state;

        //Replace old keybinding item with new one
        const editedKeybindingsList = keybindingsList.map(keybinding => (keybinding.id === shortcut.id ? shortcut : keybinding));

        this.updateKeybindings(editedKeybindingsList, showToast);
    }

    toggleKeybinding = (shortcut, showToast) => {
        const { keybindingsList } = this.state;

        const shortcutInUse = keybindingsList.filter(keybinding => keybinding.id !== shortcut.id).find(keybinding => keybinding.keys === shortcut.keys);

        if (shortcutInUse && shortcut.isActive) {
            shortcut.keys = '';
        }

        const updatedKeybindingsList = keybindingsList.map(keybinding => (keybinding.id === shortcut.id ? shortcut : keybinding));

        this.updateKeybindings(updatedKeybindingsList, showToast);
    }

    updateKeybindings = (keybindings, showToast) => {
        store.set('commandKeys', keybindings);
        pubsub.publish('keybindingsUpdated');

        this.setState({ showEditModal: false, keybindingsList: keybindings });

        if (showToast) {
            this.showToast();
        }
    }

    // Trigger pubsub for use in Location widget where keybindings are injected
    // When modifing keybindings, we remove the key listener in location widget to prevent
    // it from being fired during the edit
    componentDidMount() {
        pubsub.publish('removeKeybindingsListener');
    }

    // When we are not editing the keybindings anymore, make sure to re-inject the keybindings
    // within the location widget again
    componentWillUnmount() {
        pubsub.publish('addKeybindingsListener');
    }

    closeModal = () => {
        this.setState({ showEditModal: false });
    }

    enableAllKeybindings = () => {
        const enabledKeybindingsArr = this.state.keybindingsList.map(keybinding => ({ ...keybinding, isActive: true }));

        store.set('commandKeys', enabledKeybindingsArr);
        pubsub.publish('keybindingsUpdated');

        this.setState({ showEditModal: false, keybindingsList: enabledKeybindingsArr });

        this.showToast('Keybindings Enabled');
    }

    disableAllKeybindings = () => {
        const disabledKeybindingsArr = this.state.keybindingsList.map(keybinding => ({ ...keybinding, isActive: false }));

        store.set('commandKeys', disabledKeybindingsArr);
        pubsub.publish('keybindingsUpdated');

        this.setState({ showEditModal: false, keybindingsList: disabledKeybindingsArr });

        this.showToast('Keybindings Disabled');
    }

    render() {
        const { handleEdit, handleDelete, editKeybinding, closeModal, enableAllKeybindings, disableAllKeybindings, toggleKeybinding } = this;
        const { currentShortcut, keybindingsList, showEditModal } = this.state;

        const allShortcutsEnabled = keybindingsList.every(shortcut => shortcut.isActive);
        const allShortcutsDisabled = keybindingsList.every(shortcut => !shortcut.isActive);

        return (
            <div>
                <div className={styles['table-wrapper']}>
                    <Table
                        data={keybindingsList}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onShortcutToggle={toggleKeybinding}
                    />
                </div>

                <div style={{ display: 'grid', columnGap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                    <FunctionButton primary onClick={enableAllKeybindings} disabled={allShortcutsEnabled}>
                        <i className="fas fa-toggle-on" />
                        Enable All Keybindings
                    </FunctionButton>
                    <FunctionButton primary onClick={disableAllKeybindings} disabled={allShortcutsDisabled}>
                        <i className="fas fa-toggle-off" />
                        Disable All Keybindings
                    </FunctionButton>
                </div>

                { showEditModal && (
                    <Modal onClose={closeModal} size="md" style={{ padding: '1rem 1rem 2rem', backgroundColor: '#d1d5db' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Edit Shortcut</h3>

                        <EditArea
                            shortcut={currentShortcut}
                            shortcuts={keybindingsList}
                            edit={editKeybinding}
                            onClose={closeModal}
                        />
                    </Modal>
                ) }
            </div>
        );
    }
}
