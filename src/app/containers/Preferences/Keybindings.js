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

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import _ from 'lodash';

import store from 'app/store';
import { Toaster, TOASTER_SUCCESS } from '../../lib/toaster/ToasterLib';

import Table from './Keybindings/MainTable';
import EditArea from './Keybindings/EditArea';

import styles from './index.styl';

/**
 * Keybinding settings page
 * @prop {Boolean} active Check if this page is currently active or not
 */
export default class Keybindings extends Component {
    static propTypes = {
        active: PropTypes.bool,
    }

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: 'Shortcut Updated',
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 5000, { trailing: false });

    state = {
        keybindingsList: store.get('commandKeys', []),
        currentPage: 'Table',
        currentShortcut: {},
    }

    switchPages = (page) => {
        this.setState({ currentPage: page });
    }

    handleEdit = (currentShortcut) => {
        this.setState({ currentPage: 'Edit', currentShortcut });
    }

    /**
     * Function to edit the stores commandKeys array
     * @param {Object} shortcut The shortcut that was modifed
     */
    editKeybinding = (shortcut) => {
        const { keybindingsList } = this.state;

        //Replace old keybinding item with new one
        const editedKeybindingsList = keybindingsList.map(keybinding => (keybinding.id === shortcut.id ? shortcut : keybinding));

        store.set('commandKeys', editedKeybindingsList);
        pubsub.publish('keybindingsUpdated');

        this.setState({ currentPage: 'Table', keybindingsList: editedKeybindingsList });

        this.showToast();
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

    render() {
        const { handleEdit, switchPages, editKeybinding } = this;
        const { active } = this.props;
        const { currentPage, currentShortcut, keybindingsList } = this.state;

        return (
            <div
                className={classNames(
                    styles.hidden,
                    styles['settings-wrapper'],
                    { [styles.visible]: active }
                )}
            >
                <h3 className={styles['settings-title']}>Keybindings</h3>

                { currentPage === 'Table' && (
                    <div className={styles['table-wrapper']}>
                        <Table data={keybindingsList} onEdit={handleEdit} />
                    </div>
                )}

                { currentPage === 'Edit' && (
                    <EditArea
                        switchPages={switchPages}
                        shortcut={currentShortcut}
                        shortcuts={keybindingsList}
                        edit={editKeybinding}
                    />
                )}
            </div>
        );
    }
}
