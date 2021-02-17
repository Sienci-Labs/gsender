import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';

import store from 'app/store';

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

    state = {
        keybindingsList: store.get('commandKeys', []),
        currentPage: 'Table',
        currentShortcut: {},
        message: ''
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

        this.setState({ currentPage: 'Table', message: 'Shortcut Edited Successfully', keybindingsList: editedKeybindingsList });
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
        const { currentPage, currentShortcut, keybindingsList, message } = this.state;

        return (
            <div
                className={classNames(
                    styles.hidden,
                    styles.settingsContainer,
                    { [styles.visible]: active }
                )}
            >
                <h3 style={{ marginBottom: '3rem' }}>Keybindings</h3>

                { currentPage === 'Table' && <div className={styles['table-wrapper']}><Table data={keybindingsList} onEdit={handleEdit} /></div> }
                { currentPage === 'Edit' && <EditArea switchPages={switchPages} shortcut={currentShortcut} shortcuts={keybindingsList} edit={editKeybinding} /> }

                {message && <div className={styles['keybindings-message']}>{message}</div>}
            </div>
        );
    }
}
