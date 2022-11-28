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
import { METRIC_UNITS } from '../constants';

const store = new ImmutableStore(defaultState);

let userData = null;

// Check whether the code is running in Electron renderer process
if (isElectron()) {
    const { app } = window.require('@electron/remote');
    const path = window.require('path'); // Require the path module within Electron

    userData = {
        path: path.join(app.getPath('userData'), 'preferences.json')
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
    migrateStore();
} catch (err) {
    log.error(err);
}

store.getConfig = getConfig;
store.persist = persist;

export default store;
