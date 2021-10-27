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

import isElectron from 'is-electron';
import ensureArray from 'ensure-array';
import debounce from 'lodash/debounce';
import difference from 'lodash/difference';
import get from 'lodash/get';
import set from 'lodash/set';
import merge from 'lodash/merge';
import uniq from 'lodash/uniq';
import semver from 'semver';
import settings from '../config/settings';
import ImmutableStore from '../lib/immutable-store';
import log from '../lib/log';
import defaultState from './defaultState';
import { JOGGING_CATEGORY, LOCATION_CATEGORY, METRIC_UNITS } from '../constants';

const store = new ImmutableStore(defaultState);

let userData = null;

// Check whether the code is running in Electron renderer process
if (isElectron()) {
    const electron = window.require('electron');
    const path = window.require('path'); // Require the path module within Electron
    const app = electron.remote.app;
    userData = {
        path: path.join(app.getPath('userData'), 'gsender-0.5.6.json')
    };
}

const getConfig = () => {
    let content = '';

    // Check whether the code is running in Electron renderer process
    if (isElectron()) {
        const fs = window.require('fs'); // Require the fs module within Electron
        if (fs.existsSync(userData.path)) {
            content = fs.readFileSync(userData.path, 'utf8') || '{}';
        }
    } else {
        content = localStorage.getItem('sienci') || '{}';
    }

    if (content === '{}') {
        content = this.normalizeState().toString();
    }

    return content;
};

const persist = (data) => {
    const { version, state } = { ...data };

    data = {
        version: version || settings.version,
        state: {
            ...store.state,
            ...state
        }
    };

    try {
        const value = JSON.stringify(data, null, 2);

        // Check whether the code is running in Electron renderer process
        if (isElectron()) {
            const fs = window.require('fs'); // Use window.require to require fs module in Electron
            fs.writeFileSync(userData.path, value);
        } else {
            localStorage.setItem('sienci', value);
        }
    } catch (e) {
        log.error(e);
    }
};

const normalizeState = (state) => {
    //
    // Normalize workspace widgets
    // Update primary widgets
    let primaryList = get(cnc.state, 'workspace.container.primary.widgets');
    if (primaryList) {
        set(state, 'workspace.container.primary.widgets', primaryList);
    } else {
        primaryList = get(state, 'workspace.container.primary.widgets');
    }

    // Update secondary widgets
    let secondaryList = get(cnc.state, 'workspace.container.secondary.widgets');
    if (secondaryList) {
        set(state, 'workspace.container.secondary.widgets', secondaryList);
    } else {
        secondaryList = get(state, 'workspace.container.secondary.widgets');
    }

    primaryList = uniq(ensureArray(primaryList)); // Use the same order in primaryList

    secondaryList = uniq(ensureArray(secondaryList)); // Use the same order in secondaryList
    secondaryList = difference(secondaryList, primaryList); // Exclude primaryList

    set(state, 'workspace.container.primary.widgets', primaryList);
    set(state, 'workspace.container.secondary.widgets', secondaryList);

    //
    // Remember configured axes (#416)
    //
    const configuredAxes = ensureArray(get(cnc.state, 'widgets.axes.axes'));
    const defaultAxes = ensureArray(get(defaultState, 'widgets.axes.axes'));
    if (configuredAxes.length > 0) {
        set(state, 'widgets.axes.axes', configuredAxes);
    } else {
        set(state, 'widgets.axes.axes', defaultAxes);
    }

    //
    // Remember recent files
    //
    const storedRecentFiles = ensureArray(get(cnc.state, 'workspace.recentFiles'));
    const defaultRecentFiles = ensureArray(get(defaultState, 'workspace.recentFiles'));
    if (configuredAxes.length > 0) {
        set(state, 'workspace.recentFiles', storedRecentFiles);
    } else {
        set(state, 'workspace.recentFiles', defaultRecentFiles);
    }

    // Get user tool definitions
    const userTools = ensureArray(get(cnc.state, 'workspace.tools'));
    const defaultTools = ensureArray(get(defaultState, 'workspace.tools'));
    if (userTools.length > 0) {
        set(state, 'workspace.tools', userTools);
    } else {
        set(state, 'workspace.tools', defaultTools);
    }

    // Get probe definitions
    const userProbes = get(cnc.state, 'workspace.probeProfile');
    const defaultProbes = get(defaultState, 'workspace.probeProfile');
    if (userProbes) {
        set(state, 'workspace.probeProfile', userProbes);
    } else {
        set(state, 'workspace.probeProfile', defaultProbes);
    }

    const units = get(cnc.state, 'workspace.units');
    if (units) {
        set(state, 'workspace.units', units);
    } else {
        set(state, 'workspace.units', METRIC_UNITS);
    }

    const reverseWidgets = get(cnc.state, 'workspace.reverseWidgets');
    if (reverseWidgets) {
        set(state, 'workspace.reverseWidgets', reverseWidgets);
    } else {
        set(state, 'workspace.reverseWidgets', false);
    }


    return state;
};

const cnc = {
    version: settings.version,
    state: {}
};

try {
    const text = getConfig();
    const data = JSON.parse(text);
    cnc.version = get(data, 'version', settings.version);
    cnc.state = get(data, 'state', {});
} catch (e) {
    // set(settings, 'error.corruptedWorkspaceSettings', true);
    log.error(e);
}

store.state = normalizeState(merge({}, defaultState, cnc.state || {}));

// Debouncing enforces that a function not be called again until a certain amount of time (e.g. 100ms) has passed without it being called.
store.on('change', debounce((state) => {
    persist({ state: state });
}, 100));

//
// Migration
//
const migrateStore = () => {
    if (!cnc.version) {
        return;
    }

    //  0.7.6 - changes to go to axis zero naming and payload
    if (semver.lt(cnc.version, '0.7.6')) {
        const currentCommandKeys = store.get('commandKeys', []);
        const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
        const defaultCommandKeys = get(defaultState, 'commandKeys');

        const updateCommands = (commands) => {
            return commands.map(command => {
                if (command.category !== LOCATION_CATEGORY) {
                    return command;
                }

                const foundDefaultCommand = defaultCommandKeys.find(defaultCommand => defaultCommand.id === command.id);

                return foundDefaultCommand ? { ...command, title: foundDefaultCommand.title, payload: foundDefaultCommand.payload } : command;
            });
        };
        const updatedCommandKeys = updateCommands(currentCommandKeys);

        const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
            const updatedProfileShortcuts = updateCommands(profile.shortcuts);
            return { ...profile, shortcuts: updatedProfileShortcuts };
        });

        store.replace('commandKeys', updatedCommandKeys);
        store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);
    }

    //  0.7.4 - changes to keyboard and gamepad profile shortcut payload shape for machine jogging
    if (semver.lt(cnc.version, '0.7.4')) {
        const currentCommands = store.get('commandKeys', []);
        const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
        const defaultCommands = get(defaultState, 'commandKeys');

        const updateCommands = (commands) => {
            return commands.map(command => {
                if (command.category !== JOGGING_CATEGORY) {
                    return command;
                }

                const foundDefaultCommand = defaultCommands.find(defaultCommand => defaultCommand.id === command.id);

                return foundDefaultCommand ? { ...command, payload: foundDefaultCommand.payload } : command;
            });
        };

        const updatedCommands = updateCommands(currentCommands);

        const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
            const updatedProfileShortcuts = updateCommands(profile.shortcuts);
            return { ...profile, shortcuts: updatedProfileShortcuts };
        });

        store.replace('commandKeys', updatedCommands);
        store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);
    }

    // 0.6.8 -- duplicate keybinding fix
    if (semver.lt(cnc.version, '0.6.8')) {
        const setCommands = store.get('commandKeys');
        const defaultCommands = get(defaultState, 'commandKeys');

        /**
         * Return an array of keybindings matching the title
         * @param title - string title of the keybind
         * @returns {array}
         */
        const getCommandsWithName = (title) => {
            return setCommands.filter(command => command.title === title);
        };

        defaultCommands.forEach((command) => {
            const currentBinding = getCommandsWithName(command.title)[0]; // first element in array should be original bind
            if (currentBinding) {
                command.keys = currentBinding.keys;
            }
        });
        store.unset('commandKeys');
        store.set('commandKeys', defaultCommands);
    }
};

try {
    migrateStore();
} catch (err) {
    log.error(err);
}

store.getConfig = getConfig;
store.persist = persist;

export default store;
