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

import { Button } from 'app/components/Button';
import shuttleEvents from 'app/lib/shuttleEvents';

import { formatShortcut } from '../helpers';

const triggerKeys = ['Meta', 'Alt', 'Shift', 'Control'];
const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

/**
 * Keybinding Edit Area Component
 * @param {Object} shortcut Currently selected shortcut to edit
 * @param {Array} shortcuts List of keybind (shortcut) objects
 * @param {Function} switchPages Function to switch pages within parent Keybindings component
 * @param {Function} edit Function to edit currently selected shortcut
 */

export default class EditArea extends Component {
    static propTypes = {
        shortcut: PropTypes.object,
        shortcuts: PropTypes.object,
        switchPages: PropTypes.func,
        edit: PropTypes.func,
        onClose: PropTypes.func,
    };

    initialState = {
        pressed: false,
        singleKey: '',
        keyCombo: '',
        metaTriggered: false,
        altTriggered: false,
        shiftTriggered: false,
        ctrlTriggered: false,
        state: { available: false, error: false, message: '' },
    };

    state = this.initialState;

    /**
     * Function to build shortcut key combination
     * @param {KeyboardEvent} e The keyboard object containing all keyboard related attributes and methods
     */
    buildCombo = (e) => {
        //Key map for mousetrap package
        const keyMap = {
            Backspace: 'backspace',
            Tab: 'tab',
            Enter: 'enter',
            CapsLock: 'capslock',
            Escape: 'escape',
            ' ': 'space',
            PageUp: 'pageup',
            PageDown: 'pagedown',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            ArrowUp: 'up',
            ArrowDown: 'down',
            Delete: 'del',
            Insert: 'ins',
            End: 'end',
            Home: 'home',
        }[e.key];

        const key = keyMap || e.key.toLowerCase();

        //Ignore trigger keys
        if (triggerKeys.includes(e.key)) {
            return [];
        }

        this.setState({
            pressed: true,
            metaTriggered: false,
            altTriggered: false,
            shiftTriggered: false,
            ctrlTriggered: false,
        });

        const keys = {
            metaKey: { label: 'command', triggered: e.metaKey },
            altKey: { label: 'alt', triggered: e.altKey },
            ctrlKey: { label: 'ctrl', triggered: e.ctrlKey },
            shiftKey: { label: 'shift', triggered: e.shiftKey },
        };

        let keyCombo = '';
        if (keys.metaKey.triggered) {
            keyCombo += `${keys.metaKey.label}+`;
        }

        if (keys.altKey.triggered) {
            keyCombo += `${keys.altKey.label}+`;
        }

        if (keys.ctrlKey.triggered) {
            keyCombo += `${keys.ctrlKey.label}+`;
        }

        // Do not add shift to the combo if one of the numbers on the main area of the keyboard are clicked
        // This will prevent the keycombo from being set as shift + ! for example, which mousetrap won't understand
        // (ex. shift + 1 = !)
        if (keys.shiftKey.triggered && !e.code.includes('Digit')) {
            keyCombo += `${keys.shiftKey.label}+`;
        }

        keyCombo += key;

        return [key, keyCombo];
    };

    /**
     * Function to listen to keydowns and generate new keybinding command combo
     * @param {KeyboardEvent} e The keyboard object containing all keyboard related attributes and methods
     */
    outputKeys = (e) => {
        e.preventDefault();

        const [singleKey, keyCombo] = this.buildCombo(e);

        if (!keyCombo) {
            return;
        }

        const foundShortcut = Object.entries(this.props.shortcuts)
            .filter(([key, shortcut]) => shortcut.isActive)
            .find(([key, shortcut]) => shortcut.keys === keyCombo);
        const keyState = {
            singleKey,
            keyCombo,
            metaTriggered: e.metaKey,
            altTriggered: e.altKey,
            shiftTriggered: e.shiftKey,
            ctrlTriggered: e.ctrlKey,
        };

        if (foundShortcut) {
            if (foundShortcut[1].keys !== this.props.shortcut.keys) {
                const title = allShuttleControlEvents[foundShortcut[1].cmd]
                    ? allShuttleControlEvents[foundShortcut[1].cmd].title
                    : foundShortcut[1].title;
                this.setState({
                    ...keyState,
                    state: {
                        available: false,
                        error: true,
                        message: `This shortcut is already in use by action "${title}"`,
                    },
                });
            } else {
                //If it found itself, return to original state
                this.setState({
                    ...keyState,
                    state: { available: false, error: false, message: '' },
                });
            }
            return;
        }

        this.setState({
            ...keyState,
            state: {
                available: true,
                error: false,
                message: 'Shortcut is Available',
            },
        });
    };

    /**
     * Function to edit shortcut with new key combo, function invokes parent function received in props
     */
    handleEdit = () => {
        const { shortcut, edit } = this.props;
        const { keyCombo } = this.state;

        edit({ ...shortcut, keys: keyCombo });
    };

    componentDidMount() {
        document.addEventListener('keydown', this.outputKeys);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.outputKeys);
    }

    /**
     * Function to output information window with dynamic message and styling
     */
    infoWindowOutput = () => {
        const { state } = this.state;

        if (state.available) {
            return (
                <div className="bg-green-100 text-green-800 p-2 rounded flex items-center">
                    <i className="fas fa-check-circle mr-2" />{' '}
                    <p>{state.message}</p>
                </div>
            );
        }

        if (state.error) {
            return (
                <div className="bg-red-100 text-red-800 p-2 rounded flex items-center">
                    <i className="fas fa-exclamation-circle mr-2" />{' '}
                    <p>{state.message}</p>
                </div>
            );
        }

        return (
            <div className="bg-gray-100 text-gray-800 p-2 rounded flex items-center">
                <i className="fas fa-info-circle mr-2" /> <p>&nbsp;</p>
            </div>
        );
    };

    displayShortcut = () => {
        const { shortcut } = this.props;

        const shortcutArray = shortcut.keys.split('+');

        let cleanedShortcut = null;

        //If there is an empty value as the last element in the shorcut array,
        //that means a plus key is supposed to be there, but it was filtered out
        //due to keys.split
        if (shortcutArray[shortcutArray.length - 1] === '') {
            cleanedShortcut = shortcutArray.filter((item) => item !== '');

            if (shortcutArray[0]) {
                cleanedShortcut.push('+');
            }
        }

        const output = cleanedShortcut
            ? formatShortcut(cleanedShortcut)
            : formatShortcut(shortcutArray);

        return output;
    };

    render() {
        const {
            pressed,
            singleKey,
            shiftTriggered,
            altTriggered,
            metaTriggered,
            ctrlTriggered,
            state,
        } = this.state;
        const { onClose, shortcut } = this.props;

        const infoWindowOutput = this.infoWindowOutput();

        const output = pressed ? (
            formatShortcut([singleKey])
        ) : (
            <span className="text-blue-500 animate-pulse">
                Press Some Keys...
            </span>
        );

        const shortcutkeys = this.displayShortcut();

        const title = allShuttleControlEvents[shortcut.cmd]
            ? allShuttleControlEvents[shortcut.cmd].title
            : shortcut.title;

        return (
            <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <h4 className="text-center font-medium">Action</h4>
                    <h4 className="text-center font-medium">
                        Current Shortcut
                    </h4>

                    <h4 className="text-center">{title}</h4>
                    <h4 className="text-center">{shortcutkeys}</h4>
                </div>

                <div className="mb-4">
                    <div className="text-center">
                        <h4 className="mb-2">New Shorcut:</h4>
                        <h4>{output}</h4>
                    </div>
                </div>

                <div className="flex justify-center space-x-2 mb-4">
                    <label
                        className={
                            ctrlTriggered
                                ? 'bg-blue-500 text-white px-2 py-1 rounded'
                                : 'bg-gray-200 text-gray-600 px-2 py-1 rounded'
                        }
                    >
                        Ctrl
                    </label>
                    <label
                        className={
                            shiftTriggered
                                ? 'bg-blue-500 text-white px-2 py-1 rounded'
                                : 'bg-gray-200 text-gray-600 px-2 py-1 rounded'
                        }
                    >
                        Shift
                    </label>
                    <label
                        className={
                            altTriggered
                                ? 'bg-blue-500 text-white px-2 py-1 rounded'
                                : 'bg-gray-200 text-gray-600 px-2 py-1 rounded'
                        }
                    >
                        Alt
                    </label>
                    <label
                        className={
                            metaTriggered
                                ? 'bg-blue-500 text-white px-2 py-1 rounded'
                                : 'bg-gray-200 text-gray-600 px-2 py-1 rounded'
                        }
                    >
                        Command
                    </label>
                </div>

                {infoWindowOutput}

                <div className="flex justify-center mt-8">
                    <Button btnSize="lg" btnStyle="default" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        btnSize="lg"
                        btnStyle="primary"
                        disabled={!state.available}
                        onClick={this.handleEdit}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        );
    }
}
