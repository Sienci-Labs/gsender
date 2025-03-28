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

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cn } from 'app/lib/utils';
import { Button } from 'app/components/Button';
import shuttleEvents from 'app/lib/shuttleEvents';
import { formatShortcut } from '../helpers';
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaInfoCircle,
} from 'react-icons/fa';

const triggerKeys = ['Meta', 'Alt', 'Shift', 'Control'];
const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

const EditArea = ({ shortcut, shortcuts, edit, onClose }) => {
    const [state, setState] = useState({
        pressed: false,
        singleKey: '',
        keyCombo: '',
        metaTriggered: false,
        altTriggered: false,
        shiftTriggered: false,
        ctrlTriggered: false,
        status: { available: false, error: false, message: '' },
    });

    const buildCombo = (e) => {
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
        };

        const key = keyMap[e.key] || e.key.toLowerCase();

        if (triggerKeys.includes(e.key)) {
            return [];
        }

        setState((prev) => ({
            ...prev,
            pressed: true,
            metaTriggered: false,
            altTriggered: false,
            shiftTriggered: false,
            ctrlTriggered: false,
        }));

        const keys = {
            metaKey: { label: 'command', triggered: e.metaKey },
            altKey: { label: 'alt', triggered: e.altKey },
            ctrlKey: { label: 'ctrl', triggered: e.ctrlKey },
            shiftKey: { label: 'shift', triggered: e.shiftKey },
        };

        let keyCombo = '';
        if (keys.metaKey.triggered) keyCombo += `${keys.metaKey.label}+`;
        if (keys.altKey.triggered) keyCombo += `${keys.altKey.label}+`;
        if (keys.ctrlKey.triggered) keyCombo += `${keys.ctrlKey.label}+`;
        if (keys.shiftKey.triggered && !e.code.includes('Digit')) {
            keyCombo += `${keys.shiftKey.label}+`;
        }
        keyCombo += key;

        return [key, keyCombo];
    };

    const outputKeys = (e) => {
        e.preventDefault();
        const [singleKey, keyCombo] = buildCombo(e);

        if (!keyCombo) return;

        const foundShortcut = Object.entries(shortcuts)
            .filter(([_, shortcut]) => shortcut.isActive)
            .find(([_, shortcut]) => shortcut.keys === keyCombo);

        const keyState = {
            singleKey,
            keyCombo,
            metaTriggered: e.metaKey,
            altTriggered: e.altKey,
            shiftTriggered: e.shiftKey,
            ctrlTriggered: e.ctrlKey,
        };

        if (foundShortcut) {
            if (foundShortcut[1].keys !== shortcut.keys) {
                const title = allShuttleControlEvents[foundShortcut[1].cmd]
                    ? allShuttleControlEvents[foundShortcut[1].cmd].title
                    : foundShortcut[1].title;
                setState((prev) => ({
                    ...prev,
                    ...keyState,
                    status: {
                        available: false,
                        error: true,
                        message: `This shortcut is already in use by action "${title}"`,
                    },
                }));
            } else {
                setState((prev) => ({
                    ...prev,
                    ...keyState,
                    status: { available: false, error: false, message: '' },
                }));
            }
            return;
        }

        setState((prev) => ({
            ...prev,
            ...keyState,
            status: {
                available: true,
                error: false,
                message: 'Shortcut is Available',
            },
        }));
    };

    useEffect(() => {
        document.addEventListener('keydown', outputKeys);
        return () => document.removeEventListener('keydown', outputKeys);
    }, []);

    const handleEdit = () => {
        edit({ ...shortcut, isActive: true, keys: state.keyCombo });
    };

    const displayShortcut = () => {
        const shortcutArray = shortcut.keys.split('+');
        let cleanedShortcut = null;

        if (shortcut.keys === '') {
            return <span className="text-gray-500">None</span>;
        }

        if (shortcutArray[shortcutArray.length - 1] === '') {
            cleanedShortcut = shortcutArray.filter((item) => item !== '');
            if (shortcutArray[0]) {
                cleanedShortcut.push('+');
            }
        }

        return cleanedShortcut
            ? formatShortcut(cleanedShortcut)
            : formatShortcut(shortcutArray);
    };

    const title = allShuttleControlEvents[shortcut.cmd]
        ? allShuttleControlEvents[shortcut.cmd].title
        : shortcut.title;

    const renderNewShortcut = () => {
        if (!state.pressed) {
            return (
                <div className="h-12 flex items-center justify-center">
                    <span className="text-blue-500 animate-pulse">
                        Press Some Keys...
                    </span>
                </div>
            );
        }

        const keys = [];
        if (state.metaTriggered) keys.push('command');
        if (state.ctrlTriggered) keys.push('ctrl');
        if (state.altTriggered) keys.push('alt');
        if (state.shiftTriggered) keys.push('shift');
        if (state.singleKey) keys.push(state.singleKey);

        return (
            <div className="h-12 flex items-center justify-center space-x-1">
                {keys.map((key, index) => (
                    <React.Fragment key={key}>
                        <span
                            className={cn(
                                'px-3 py-1 rounded-md font-medium min-w-[4rem] text-center bg-gray-700 text-gray-100',
                            )}
                        >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        {index < keys.length - 1 && (
                            <span className="text-gray-100 w-4 text-center">
                                +
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Action
                        </h4>
                        <h4 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h4>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Current Shortcut
                        </h4>
                        <h4 className="text-lg font-semibold text-gray-900">
                            {displayShortcut()}
                        </h4>
                    </div>
                </div>

                {/* New Shortcut Section */}
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">
                        New Shortcut:
                    </h4>
                    <div className="min-h-[4rem] flex items-center justify-center">
                        {renderNewShortcut()}
                    </div>
                </div>

                {/* Status Message */}
                <div className="min-h-[3.5rem]">
                    {state.status.message && (
                        <div
                            className={cn(
                                'p-4 rounded-lg flex items-center justify-center space-x-2',
                                state.status.available
                                    ? 'bg-green-50 text-green-700'
                                    : state.status.error
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-gray-50 text-gray-700',
                            )}
                        >
                            {state.status.available ? (
                                <FaCheckCircle className="text-green-500" />
                            ) : state.status.error ? (
                                <FaExclamationCircle className="text-red-500" />
                            ) : (
                                <FaInfoCircle className="text-gray-500" />
                            )}
                            <span>{state.status.message}</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-4">
                    <Button
                        onClick={handleEdit}
                        disabled={!state.status.available}
                        className={cn(
                            'px-6 py-2 rounded-md font-medium transition-colors duration-200',
                            state.status.available
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                        )}
                    >
                        Update Shortcut
                    </Button>
                    <Button
                        onClick={onClose}
                        className="px-6 py-2 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    );
};

EditArea.propTypes = {
    shortcut: PropTypes.shape({
        cmd: PropTypes.string.isRequired,
        keys: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        isActive: PropTypes.bool.isRequired,
    }).isRequired,
    shortcuts: PropTypes.object.isRequired,
    switchPages: PropTypes.func.isRequired,
    edit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default EditArea;
