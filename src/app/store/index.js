import isElectron from 'is-electron';
import ensureArray from 'ensure-array';
import debounce from 'lodash/debounce';
import difference from 'lodash/difference';
import get from 'lodash/get';
import set from 'lodash/set';
// import merge from 'lodash/merge';
import uniq from 'lodash/uniq';
import { isEmpty } from 'lodash';
import semver from 'semver';
import settings from '../config/settings';
import ImmutableStore from '../lib/immutable-store';
import log from '../lib/log';
import defaultState from './defaultState';
import { MACRO_CATEGORY, METRIC_UNITS } from '../constants';

const store = new ImmutableStore(defaultState);

let userData = null;

// Check whether the code is running in Electron renderer process
if (isElectron()) {
    const { app } = window.require('@electron/remote');
    const path = window.require('path'); // Require the path module within Electron

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

    if (content === '{}' && this) {
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

const merge = (base, saved) => {
    const baseIsObject = base instanceof Object;
    const baseIsArray = Array.isArray(base);

    const savedIsObject = saved instanceof Object;
    const savedIsArray = Array.isArray(saved);

    if (
        (!(baseIsObject) || baseIsArray) &&
        (!(savedIsObject) || savedIsArray)
    ) {
        // if they are the same type, use saved
        if (typeof base === typeof saved) {
            return saved;
        }
        // if they are not, default structure changed, so use base
        return base;
    } else if ((!(baseIsObject) || baseIsArray) || (!(savedIsObject) || savedIsArray)) {
        // if one is an object and the other isn't, then default structure changed, so use base
        return base;
    }

    const baseIsEmpty = Object.keys(base).length === 0;
    const savedIsEmpty = Object.keys(saved).length === 0;

    // In cases where the base obj is empty and the saved obj is not, we can just return saved
    if (baseIsEmpty && !savedIsEmpty) {
        return saved;
    }

    const result = base;

    // merge
    Object.entries(result).forEach(([key, value]) => {
        result[key] = merge(value, saved[key]);
    });

    return result;
};

// Save backup
const backupPreviousState = (data) => {
    const value = JSON.stringify({ state: data, version: settings.version }, null, 2);

    if (isElectron()) {
        const { app } = window.require('@electron/remote');
        const path = window.require('path'); // Require the path module within Electron

        const backupPath = path.join(app.getPath('userData'), 'preferences-backup.json');

        const fs = window.require('fs'); // Use window.require to require fs module in Electron
        fs.writeFileSync(backupPath, value);
    } else {
        localStorage.setItem('sienci-backup', value);
    }
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

    backupPreviousState(cnc.state);
} catch (e) {
    // set(settings, 'error.corruptedWorkspaceSettings', true);
    log.error(e);
}

store.state = normalizeState(merge(defaultState, cnc.state || {}));

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

    if (semver.lt(cnc.version, '1.2.4') || semver.lt(cnc.version, '1.2.4-EDGE')) {
        const currentCommandKeys = store.get('commandKeys');
        let newCommandKeysList = {};

        const oldKeysToNewKeysMap = {

            // Jog Commands
            'Jog: X+': 'JOG_X_P',
            'Jog: X-': 'JOG_X_M',
            'Jog: Y+': 'JOG_Y_P',
            'Jog: Y-': 'JOG_Y_M',
            'Jog: Z+': 'JOG_Z_P',
            'Jog: Z-': 'JOG_Z_M',
            'Jog: X+ Y-': 'JOG_X_P_Y_M',
            'Jog: X- Y+': 'JOG_X_M_Y_P',
            'Jog: X+ Y+': 'JOG_X_Y_P',
            'Jog: X- Y-': 'JOG_X_Y_M',

            // Feedrate Commands
            'Feed +': 'FEEDRATE_OVERRIDE_P',
            'Feed ++': 'FEEDRATE_OVERRIDE_PP',
            'Feed -': 'FEEDRATE_OVERRIDE_M',
            'Feed --': 'FEEDRATE_OVERRIDE_MM',
            'Feed Reset': 'FEEDRATE_OVERRIDE_RESET',

            // Spindle Commands
            'Spindle/Laser +': 'SPINDLE_OVERRIDE_P',
            'Spindle/Laser ++': 'SPINDLE_OVERRIDE_PP',
            'Spindle/Laser -': 'SPINDLE_OVERRIDE_M',
            'Spindle/Laser --': 'SPINDLE_OVERRIDE_MM',
            'Spindle/Laser Reset': 'SPINDLE_OVERRIDE_RESET',

            // Visualizer View Commands
            '3D / Isometric': 'VISUALIZER_VIEW_3D',
            'Top': 'VISUALIZER_VIEW_TOP',
            'Front': 'VISUALIZER_VIEW_FRONT',
            'Right': 'VISUALIZER_VIEW_RIGHT',
            'Left': 'VISUALIZER_VIEW_LEFT',
            'Reset View': 'VISUALIZER_VIEW_RESET',

            // Zeroing Commands
            'Zero X Axis': 'ZERO_X_AXIS',
            'Zero Y Axis': 'ZERO_Y_AXIS',
            'Zero Z Axis': 'ZERO_Z_AXIS',
            'Zero All': 'ZERO_ALL_AXIS',

            // Go To Commands
            'Go to X Zero': 'GO_TO_X_AXIS_ZERO',
            'Go to Y Zero': 'GO_TO_Y_AXIS_ZERO',
            'Go to Z Zero': 'GO_TO_Z_AXIS_ZERO',
            'Go to XY Zero': 'GO_TO_XY_AXIS_ZERO',

            // Jog Speed Commands
            'Increase Jog Speed': 'JOG_SPEED_I',
            'Decrease Jog Speed': 'JOG_SPEED_D',

            // Jog Preset Select Commands
            'Select Rapid Jog Preset': 'SET_R_JOG_PRESET',
            'Select Normal Jog Preset': 'SET_N_JOG_PRESET',
            'Select Precise Jog Preset': 'SET_P_JOG_PRESET',

            // Controller Commands
            'Unlock': 'CONTROLLER_COMMAND_UNLOCK',
            'Soft Reset': 'CONTROLLER_COMMAND_RESET',

            // Toolbar Commands
            'Connect': 'OPEN_TOOLBAR_CONN',
            'Surfacing': 'OPEN_TOOLBAR_SURF',
            'Heightmap': 'OPEN_TOOLBAR_MAP',
            'Calibrate': 'OPEN_TOOLBAR_CALI',
            'Firmware': 'OPEN_TOOLBAR_FIRM',
            'Help': 'OPEN_TOOLBAR_HELP',
            'Settings': 'OPEN_TOOLBAR_SETT',
        };

        if (Array.isArray(currentCommandKeys)) {
            currentCommandKeys.forEach(element => {
                if (element.category === MACRO_CATEGORY) {
                    element.cmd = element.id;
                }

                const updatedKey = oldKeysToNewKeysMap[element.title];

                if (updatedKey) {
                    element.cmd = updatedKey;
                }

                delete element.id;
                newCommandKeysList[element.cmd] = element;
            });
        } else {
            newCommandKeysList = currentCommandKeys;
        }

        Object.entries(newCommandKeysList).forEach(([key, shortcut]) => {
            if (shortcut.category !== 'Macros') {
                delete shortcut.title;
                delete shortcut.callback;
                delete shortcut.preventDefault;
                delete shortcut.payload;
                delete shortcut.category;
            }

            newCommandKeysList[key] = shortcut;
        });

        store.replace('commandKeys', newCommandKeysList);

        // Gamepad changes
        const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
        const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
            const shortcuts = profile.shortcuts;
            let updatedProfileShortcuts = {};

            if (Array.isArray(shortcuts)) {
                shortcuts.forEach(element => {
                    if (element.category === MACRO_CATEGORY) {
                        element.cmd = element.id;
                    }

                    const updatedKey = oldKeysToNewKeysMap[element.title];

                    if (updatedKey) {
                        element.cmd = updatedKey;
                    }

                    delete element.id;
                    updatedProfileShortcuts[element.cmd] = element;
                });
            } else {
                updatedProfileShortcuts = shortcuts;
            }

            Object.entries(updatedProfileShortcuts).forEach(([key, shortcut]) => {
                delete shortcut.title;
                delete shortcut.payload;
                delete shortcut.preventDefault;
                delete shortcut.category;
                delete shortcut.callback;
                updatedProfileShortcuts[key] = shortcut;
            });

            if (!Array.isArray(profile.id)) {
                profile.id = [profile.id];
            }
            return { ...profile, shortcuts: isEmpty(updatedProfileShortcuts) ? shortcuts : updatedProfileShortcuts };
        });
        store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

        // Set toolchange option to pause if it wasn't ignore across the board
        const currentToolOption = store.get('workspace.ToolChangeOption');
        if (currentToolOption !== 'Ignore') {
            store.set('workspace.toolChangeOption', 'Pause');
        }


        // Fix Auto Zero String
        const probeType = store.get('workspace.probeProfile.touchplateType', '');
        if (probeType === 'Auto Zero Touchplate') {
            store.set('workspace.probeProfile.touchplateType', 'AutoZero Touchplate');
        }
    }

    if (semver.lt(cnc.version, '1.1.5')) {
        const currSurfacingState = store.get('widgets.surfacing');
        const defaultSurfacingState = get(defaultState, 'widgets.surfacing', currSurfacingState);

        store.replace('widgets.surfacing', defaultSurfacingState);
    }

    // 1.0.4 - need to add
    if (semver.lt(cnc.version, '1.0.4')) {
        const currSpindleVal = store.get('widgets.spindle', {});

        store.replace('widgets.spindle', { currSpindleVal, laser: { ...currSpindleVal.laser, minPower: 1, maxPower: 100 } });
    }
};

try {
    // saveBackup();
    migrateStore();
} catch (err) {
    log.error(err);
}

store.getConfig = getConfig;
store.persist = persist;

export default store;
