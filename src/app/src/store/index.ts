import api from 'app/api';
import defaultMachineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';
import {
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_STANDARD,
} from 'app/lib/constants.ts';
import ImmutableStore from 'app/lib/immutable-store';
import controller from 'app/lib/controller';
import log from 'app/lib/log';
import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import difference from 'lodash/difference';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import set from 'lodash/set';
import uniq from 'lodash/uniq';
import pubsub from 'pubsub-js';
import semver from 'semver';
import settings from '../config/settings';
import { MACRO_CATEGORY, METRIC_UNITS } from '../constants';
import { defaultATCIMacros } from '../features/ATC/assets/defaultATCIMacros';
import defaultState from './defaultState';

interface CncData {
    version: string;
    state: any;
}

interface StoreData {
    version: string;
    state: any;
}

const store = new ImmutableStore(defaultState);

// id so we can ignore the 'preferences:changed' events we emitted
const CLIENT_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// persisting stays off until the server's copy has been loaded
// that way we can't accidentally overwrite the settings with defaults
let persistEnabled = false;
let applyingRemote = false;
// true from a socket disconnect until the server's copy has been re-fetched,
// so a client that may be out of date can't overwrite newer settings
let syncing = false;

const persist = (data: StoreData): void => {
    if (!persistEnabled || applyingRemote || syncing) {
        return;
    }

    const { version, state } = { ...data };

    const persistData: StoreData = {
        version: version || settings.version,
        state: {
            ...store.state,
            ...state,
        },
    };

    api.preferences
        .replace({ ...persistData, originId: CLIENT_ID })
        .catch((e: any) =>
            log.error('Failed to save preferences', e?.response?.status, e),
        );
};

const normalizeState = (state: any): any => {
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

    primaryList = uniq(Array.isArray(primaryList) ? primaryList : []); // Use the same order in primaryList

    secondaryList = uniq(Array.isArray(secondaryList) ? secondaryList : []); // Use the same order in secondaryList
    secondaryList = difference(secondaryList, primaryList); // Exclude primaryList

    set(state, 'workspace.container.primary.widgets', primaryList);
    set(state, 'workspace.container.secondary.widgets', secondaryList);

    //
    // Remember configured axes (#416)
    //
    const configuredAxes = Array.isArray(get(cnc.state, 'widgets.axes.axes'))
        ? get(cnc.state, 'widgets.axes.axes')
        : [];
    const defaultAxes = Array.isArray(get(defaultState, 'widgets.axes.axes'))
        ? get(defaultState, 'widgets.axes.axes')
        : [];
    if (configuredAxes.length > 0) {
        set(state, 'widgets.axes.axes', configuredAxes);
    } else {
        set(state, 'widgets.axes.axes', defaultAxes);
    }

    //
    // Remember recent files
    //
    const storedRecentFiles = Array.isArray(
        get(cnc.state, 'workspace.recentFiles'),
    )
        ? get(cnc.state, 'workspace.recentFiles')
        : [];
    const defaultRecentFiles = Array.isArray(
        get(defaultState, 'workspace.recentFiles'),
    )
        ? get(defaultState, 'workspace.recentFiles')
        : [];
    if (configuredAxes.length > 0) {
        set(state, 'workspace.recentFiles', storedRecentFiles);
    } else {
        set(state, 'workspace.recentFiles', defaultRecentFiles);
    }

    // Get user tool definitions
    const userTools = Array.isArray(get(cnc.state, 'workspace.tools'))
        ? get(cnc.state, 'workspace.tools')
        : [];
    const defaultTools = Array.isArray(get(defaultState, 'workspace.tools'))
        ? get(defaultState, 'workspace.tools')
        : [];
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

export const merge = (base: any, saved: any): any => {
    const baseIsObject = base instanceof Object;
    const baseIsArray = Array.isArray(base);

    const savedIsObject = saved instanceof Object;
    const savedIsArray = Array.isArray(saved);

    // if they are both not objects, use saved. migration will be made later if needed
    if ((!baseIsObject || baseIsArray) && (!savedIsObject || savedIsArray)) {
        if (saved === undefined) {
            // but if the saved version doesnt exist, use base
            return base;
        }
        return saved;
        // if one is an object and the other isn't, then default structure changed, so use base
    } else if (!baseIsObject || baseIsArray || !savedIsObject || savedIsArray) {
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

const cnc: CncData = {
    version: settings.version,
    state: {},
};

const preserveSavedCommandKeys = (state: any, savedState: any): any => {
    const savedCommandKeys = get(savedState, 'commandKeys', {});
    const mergedCommandKeys = get(state, 'commandKeys', {});

    if (
        !(savedCommandKeys instanceof Object) ||
        Array.isArray(savedCommandKeys)
    ) {
        return state;
    }

    // Keep dynamic command keys (for example, macro IDs) that are not in defaults.
    set(state, 'commandKeys', {
        ...mergedCommandKeys,
        ...savedCommandKeys,
    });

    return state;
};

//
// Migration
//
const migrateStore = (): void => {
    if (!cnc.version) {
        return;
    }

    if (semver.lt(cnc.version, '1.6.4')) {
        store.set(
            'widgets.probe.direction',
            defaultState.widgets.probe.direction,
        );
    }

    if (semver.lt(cnc.version, '1.6.2')) {
        store.set('widgets.atc.templates', defaultATCIMacros);
    }

    if (semver.lt(cnc.version, '1.6.0')) {
        const machineProfileID = Number(
            store.get('workspace.machineProfile.id', 4),
        );

        if (machineProfileID === 3) {
            // Set 2x4 (2)
            const defaultMachineProfile = defaultMachineProfiles.find(
                (profile) => profile.id === 2,
            );
            if (defaultMachineProfile) {
                store.set('workspace.machineProfile', defaultMachineProfile);
            }
        } else if (machineProfileID === 1) {
            // set 0 (4x4)
            const defaultMachineProfile = defaultMachineProfiles.find(
                (profile) => profile.id === 0,
            );
            if (defaultMachineProfile) {
                store.set('workspace.machineProfile', defaultMachineProfile);
            }
        }
    }

    if (semver.lt(cnc.version, '1.5.5')) {
        // if user has default retraction distance (4), change it to the new default (2)
        const currentRetractDistance = store.get(
            'widgets.probe.retractionDistance',
        );
        if (currentRetractDistance === 4) {
            store.set('widgets.probe.retractionDistance', 2);
        }
    }

    // zThickness setting now has 3 options - port previous value to them
    if (
        semver.lt(cnc.version, '1.5.5') ||
        semver.lt(cnc.version, '1.6.0-EDGE1')
    ) {
        const currentZThickness = store.get(
            'workspace.probeProfile.zThickness',
        );
        if (
            typeof currentZThickness === 'number' ||
            typeof currentZThickness === 'string'
        ) {
            store.set(
                'workspace.probeProfile.zThickness.standardBlock',
                currentZThickness,
            );
            store.set('workspace.probeProfile.zThickness.autoZero', 5);
            store.set(
                'workspace.probeProfile.zThickness.zProbe',
                currentZThickness,
            );
            store.set('workspace.probeProfile.zThickness.probe3D', 0);
        }
    }

    // Set probe type to AutoZero if it was formerly "AutoZero Touchplate"
    if (semver.lt(cnc.version, '1.5.3')) {
        const currentProbeSettings = store.get(
            'workspace.probeProfile.touchplateType',
            TOUCHPLATE_TYPE_STANDARD,
        );
        if (currentProbeSettings === 'AutoZero Touchplate') {
            store.set(
                'workspace.probeProfile.touchplateType',
                TOUCHPLATE_TYPE_AUTOZERO,
            );
        }
    }

    if (semver.lt(cnc.version, '1.5.1')) {
        const currentSpindleSetting = store.get(
            'workspace.spindleFunctions',
            false,
        );
        const machineProfileSpindleSetting = store.get(
            'workspace.machineProfile.spindle',
            false,
        );
        if (currentSpindleSetting) {
            return;
        }
        if (machineProfileSpindleSetting) {
            store.set('workspace.spindleFunctions', true);
        }
    }

    if (semver.lt(cnc.version, '1.4.8')) {
        const delay = store.get('widgets.spindle.delay');
        if (delay) {
            store.set('widgets.spindle.delay', 1);
        } else {
            store.set('widgets.spindle.delay', 0);
        }
    }

    if (semver.lt(cnc.version, '1.4.4')) {
        store.replace('widgets.connection.controller.type', 'Grbl');
    }

    if (semver.lt(cnc.version, '1.4.3')) {
        const storeProbe = store.get('workspace.probeProfile');
        const defaultProbe = get(defaultState, 'workspace.probeProfile');

        if (
            typeof storeProbe.xyThickness === 'object' &&
            storeProbe.xyThickness.mm
        ) {
            store.replace('workspace.probeProfile', {
                ...defaultProbe,
                xyThickness: storeProbe.xyThickness.mm,
                zThickness: storeProbe.zThickness.mm,
            });
        }
    }

    if (
        semver.lt(cnc.version, '1.3.10') ||
        semver.lt(cnc.version, '1.3.10-EDGE')
    ) {
        const settings = store.get('');

        if (settings.widgets.axes.jog.rapid.mm) {
            store.replace('widgets.axes.jog', {
                ...settings.widgets.axes.jog,
                rapid: {
                    xyStep: settings.widgets.axes.jog.rapid.mm.xyStep,
                    zStep: settings.widgets.axes.jog.rapid.mm.zStep,
                    feedrate: settings.widgets.axes.jog.rapid.mm.feedrate,
                },
                normal: {
                    xyStep: settings.widgets.axes.jog.normal.mm.xyStep,
                    zStep: settings.widgets.axes.jog.normal.mm.zStep,
                    feedrate: settings.widgets.axes.jog.normal.mm.feedrate,
                },
                precise: {
                    xyStep: settings.widgets.axes.jog.precise.mm.xyStep,
                    zStep: settings.widgets.axes.jog.precise.mm.zStep,
                    feedrate: settings.widgets.axes.jog.precise.mm.feedrate,
                },
                step: settings.widgets.axes.jog.metric.step,
                distances: settings.widgets.axes.jog.metric.distances,
            });
        }

        if (settings.widgets.location.jog.metric) {
            store.replace('widgets.axes.location', {
                ...settings.widgets.axes.location,
                step: settings.widgets.location.jog.metric.step,
                distances: settings.widgets.location.jog.metric.distances,
            });
        }

        if (settings.widgets.probe.probeFeedrate.mm) {
            store.replace('widgets.probe', {
                ...settings.widgets.probe,
                probeFeedrate: settings.widgets.probe.probeFeedrate.mm,
                probeFastFeedrate: settings.widgets.probe.probeFastFeedrate.mm,
                retractionDistance:
                    settings.widgets.probe.retractionDistance.mm,
                zProbeDistance: settings.widgets.probe.zProbeDistance.mm,
            });
        }
    }

    // Reset machine profile to default selection for 1.4.1 to prevent ID overlaps
    if (semver.lt(cnc.version, '1.4.1')) {
        const defaultMachineProfile = get(
            defaultState,
            'workspace.machineProfiles',
        );
        store.set('workspace.machineProfile', defaultMachineProfile);
    }

    if (
        semver.lt(cnc.version, '1.2.4') ||
        semver.lt(cnc.version, '1.2.4-EDGE')
    ) {
        const currentCommandKeys = store.get('commandKeys');
        let newCommandKeysList: { [key: string]: any } = {};

        const oldKeysToNewKeysMap: { [key: string]: string } = {
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
            Top: 'VISUALIZER_VIEW_TOP',
            Front: 'VISUALIZER_VIEW_FRONT',
            Right: 'VISUALIZER_VIEW_RIGHT',
            Left: 'VISUALIZER_VIEW_LEFT',
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
            Unlock: 'CONTROLLER_COMMAND_UNLOCK',
            'Soft Reset': 'CONTROLLER_COMMAND_RESET',

            // Toolbar Commands
            Connect: 'OPEN_TOOLBAR_CONN',
            Surfacing: 'OPEN_TOOLBAR_SURF',
            Heightmap: 'OPEN_TOOLBAR_MAP',
            Calibrate: 'OPEN_TOOLBAR_CALI',
            Firmware: 'OPEN_TOOLBAR_FIRM',
            Help: 'OPEN_TOOLBAR_HELP',
            Settings: 'OPEN_TOOLBAR_SETT',
        };

        if (Array.isArray(currentCommandKeys)) {
            currentCommandKeys.forEach((element) => {
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
        const currentGamepadProfiles = store.get(
            'workspace.gamepad.profiles',
            [],
        );
        const updatedGamepadProfiles = currentGamepadProfiles.map(
            (profile: any) => {
                const shortcuts = profile.shortcuts;
                let updatedProfileShortcuts: { [key: string]: any } = {};

                if (Array.isArray(shortcuts)) {
                    shortcuts.forEach((element) => {
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

                Object.entries(updatedProfileShortcuts).forEach(
                    ([key, shortcut]) => {
                        delete shortcut.title;
                        delete shortcut.payload;
                        delete shortcut.preventDefault;
                        delete shortcut.category;
                        delete shortcut.callback;
                        updatedProfileShortcuts[key] = shortcut;
                    },
                );

                if (!Array.isArray(profile.id)) {
                    profile.id = [profile.id];
                }
                return {
                    ...profile,
                    shortcuts: isEmpty(updatedProfileShortcuts)
                        ? shortcuts
                        : updatedProfileShortcuts,
                };
            },
        );
        store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

        // Set toolchange option to pause if it wasn't ignore across the board
        const currentToolOption = store.get('workspace.ToolChangeOption');
        if (currentToolOption !== 'Ignore') {
            store.set('workspace.toolChangeOption', 'Pause');
        }

        // Fix Auto Zero String
        const touchplateType = store.get(
            'workspace.probeProfile.touchplateType',
            '',
        );
        if (touchplateType === 'Auto Zero Touchplate') {
            store.set(
                'workspace.probeProfile.touchplateType',
                'AutoZero Touchplate',
            );
        }
    }

    if (semver.lt(cnc.version, '1.1.5')) {
        const currSurfacingState = store.get('widgets.surfacing');
        const defaultSurfacingState = get(
            defaultState,
            'widgets.surfacing',
            currSurfacingState,
        );

        store.replace('widgets.surfacing', defaultSurfacingState);
    }

    // 1.0.4 - need to add
    if (semver.lt(cnc.version, '1.0.4')) {
        const currSpindleVal = store.get('widgets.spindle', {});

        store.replace('widgets.spindle', {
            currSpindleVal,
            laser: { ...currSpindleVal.laser, minPower: 1, maxPower: 100 },
        });
    }
};

const defaultsMergedWith = (saved: any): any =>
    preserveSavedCommandKeys(
        merge(JSON.parse(JSON.stringify(defaultState)), saved || {}),
        saved || {},
    );

const fetchPreferences = async (): Promise<StoreData> => {
    const response = await api.preferences.fetch();
    return (response?.data || {}) as StoreData;
};

// apply a state received from the server that another client wrote
const applyRemoteState = (state: any): void => {
    applyingRemote = true;
    try {
        // same pipeline as initStore; normalizeState reads cnc.state
        cnc.state = state || {};
        store.restoreState(normalizeState(defaultsMergedWith(state)), () => {
            setTimeout(() => {
                pubsub.publish('repopulate');
            }, 50);
        });
        pubsub.publish('config:saved', store.state);
    } finally {
        applyingRemote = false;
    }
};

const FETCH_RETRY_DELAYS_MS = [500, 1000, 2000];

const fetchWithRetry = async (): Promise<StoreData> => {
    for (let attempt = 0; ; attempt++) {
        try {
            return await fetchPreferences();
        } catch (err) {
            const wait = FETCH_RETRY_DELAYS_MS[attempt];
            if (wait === undefined) {
                throw err;
            }
            await new Promise((resolve) => setTimeout(resolve, wait));
        }
    }
};

const reportLoadFailure = (err: unknown): void => {
    log.error('Unable to load preferences from the server', err);
    // using the sonner toaster directly because our wrapper saves to the store
    setTimeout(() => {
        import('sonner')
            .then(({ toast }) =>
                toast.error(
                    'Could not load your settings from the gSender server. Defaults are shown and changes will not be saved until you reload.',
                ),
            )
            .catch((e) => log.error(e));
    }, 2000);
};

const doInit = async (): Promise<void> => {
    let saved: StoreData;
    try {
        saved = await fetchWithRetry();
    } catch (err) {
        reportLoadFailure(err);
        return;
    }

    cnc.version = get(saved, 'version', settings.version);
    cnc.state = get(saved, 'state', {}) || {};

    try {
        store.state = normalizeState(
            preserveSavedCommandKeys(
                merge(JSON.parse(JSON.stringify(defaultState)), cnc.state),
                cnc.state,
            ),
        );
    } catch (e) {
        log.error(e);
    }

    const debouncedPersist = debounce((state: any) => {
        persist({ version: settings.version, state: state });
    }, 100);
    const onStoreChange = (state: any) => {
        if (applyingRemote || syncing) {
            // applying a remote state emits change events; don't echo it back.
            debouncedPersist.cancel();
            return;
        }
        debouncedPersist(state);
    };

    try {
        migrateStore();

        if (isElectron()) {
            window.ipcRenderer.send(
                'assignPromptExit',
                store.get('workspace.promptExit'),
            );

            window.ipcRenderer.send(
                'change-power-saving',
                store.get('workspace.powerSaving'),
            );

            window.ipcRenderer.send(
                'gcam-handoff:set-enabled',
                store.get('workspace.allowGcamHandoff', true),
            );
        }
    } catch (err) {
        log.error(err);
    }

    persistEnabled = true;
    store.on('change', onStoreChange);
    store.on('replace', onStoreChange);

    // save the migrated state
    persist({ version: settings.version, state: store.state });

    // save changes from another client
    controller.addListener(
        'preferences:changed',
        (payload: StoreData & { originId?: string }) => {
            if (!payload || payload.originId === CLIENT_ID) {
                return;
            }
            applyRemoteState(payload.state);
        },
    );

    // after a disconnect (e.g. server restart) stop persisting until the
    // server's copy has been re-fetched and applied
    let resyncing = false;
    const resync = async (): Promise<void> => {
        if (resyncing) {
            return;
        }
        resyncing = true;
        try {
            const latest = await fetchWithRetry();
            applyRemoteState(latest.state);
            syncing = false;

            // merging defaults into the server's copy may have added new keys
            // save them (once) so they aren't only in memory
            if (
                latest.version !== settings.version ||
                !isEqual(
                    JSON.parse(JSON.stringify(store.state)),
                    latest.state ?? {},
                )
            ) {
                persist({ version: settings.version, state: store.state });
            }
        } catch (err) {
            log.error(err);
        } finally {
            resyncing = false;
        }
    };

    controller.addListener('disconnect', () => {
        syncing = true;
        debouncedPersist.cancel();
    });
    controller.addListener('connect', () => {
        if (syncing) {
            resync();
        }
    });
};

let initPromise: Promise<void> | null = null;

// loads preferences from the server
// this must be finished before anything else reads the store
export const initStore = (): Promise<void> => {
    if (!initPromise) {
        initPromise = doInit();
    }
    return initPromise;
};

store.persist = persist;

export default store;
