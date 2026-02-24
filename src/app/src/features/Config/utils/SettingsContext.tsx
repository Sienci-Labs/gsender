import {
    gSenderSetting,
    SettingsMenu,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import store from 'app/store';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, store as reduxStore } from 'app/store/redux';

import {
    GRBL_HAL_SETTINGS_MAP,
    GRBL_SETTINGS_MAP,
} from 'app/features/Config/assets/SettingsDescriptions.ts';
import { GRBLHAL } from 'app/constants';
import { getFilteredEEPROMSettings } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import defaultStoreState from 'app/store/defaultState';
import isEqual from 'lodash/isEqual';
import machineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';
import {
    EEPROM,
    EEPROMDescriptions,
    EEPROMSettings,
    FilteredEEPROM,
    FIRMWARE_TYPES_T,
    MachineProfile,
} from 'app/definitions/firmware';
import pubsub from 'pubsub-js';
import { firmwarePastVersion } from 'app/lib/firmwareSemver.ts';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { debounce } from 'lodash';
import { BasicObject } from 'app/definitions/general';
import {
    resolveGrblCoreDefaults,
    translateGrblCoreKey,
} from 'app/features/Config/utils/grblCoreMigration.ts';

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: FilteredEEPROM[];
    eepromMap: Map<EEPROM, FilteredEEPROM>;
    settingsToUpdate?: object;
    EEPROMToUpdate?: object;
    machineProfile: MachineProfile;
    firmwareType: FIRMWARE_TYPES_T;
    setMachineProfile?: React.Dispatch<React.SetStateAction<MachineProfile>>;
    setEEPROM?: React.Dispatch<React.SetStateAction<FilteredEEPROM[]>>;
    connected: boolean;
    settingsAreDirty: boolean;
    setSettingsAreDirty?: React.Dispatch<React.SetStateAction<boolean>>;
    searchTerm: string;
    setSearchTerm?: (v: string) => void;
    settingsValues: gSenderSetting[];
    setSettingsValues?: React.Dispatch<React.SetStateAction<gSenderSetting[]>>;
    settingsFilter: (v: gSenderSetting) => boolean;
    toggleFilterNonDefault: () => void;
    filterNonDefault: boolean;
    setFilterNonDefault?: React.Dispatch<React.SetStateAction<boolean>>;
    eepromIsDefault: (settingData: FilteredEEPROM | gSenderSetting) => boolean;
    isSettingDefault: (v: gSenderSetting) => boolean;
    getEEPROMDefaultValue: (v: EEPROM) => string | number;
    isFirmwareCurrent: boolean;
}

interface SettingsProviderProps {
    children: React.ReactNode;
}

const defaultState: iSettingsContext = {
    settings: SettingsMenu,
    settingsToUpdate: {},
    EEPROMToUpdate: {},
    EEPROM: [
        {
            unit: '',
            setting: '$',
            globalIndex: 0,
            value: '',
            group: '',
            groupID: 0,
        },
    ],
    eepromMap: new Map(),
    getEEPROMDefaultValue(_v: EEPROM): string | number {
        return undefined;
    },
    isSettingDefault(_v: object): boolean {
        return false;
    },
    machineProfile: {} as MachineProfile,
    firmwareType: 'Grbl',
    connected: false,
    settingsAreDirty: false,
    searchTerm: '',
    settingsValues: [
        {
            type: 'number',
        },
    ],
    settingsFilter: () => true,
    toggleFilterNonDefault: () => {},
    filterNonDefault: false,
    eepromIsDefault: (_v) => false,
    isFirmwareCurrent: false,
};

export const SettingsContext =
    React.createContext<iSettingsContext>(defaultState);

export function useSettings() {
    const context = React.useContext(SettingsContext);
    if (!context) {
        console.error('useSettings must be used within SettingsContext');
    }
    return context;
}

function fetchStoreValue(key: string) {
    return store.get(key);
}

function fetchDefaultValue(key: string) {
    return get(defaultStoreState, key, null);
}

export function hasSettingsToApply(settings: object, eeprom: object) {
    return Object.keys(settings).length > 0 || Object.keys(eeprom).length > 0;
}

function populateSettingsValues(
    settingsSections: SettingsMenuSection[] = [],
): [SettingsMenuSection[], gSenderSetting[]] {
    const globalValueReference: gSenderSetting[] = [];
    let index = 0;
    if (!settingsSections.length) {
        return;
    }
    settingsSections.map((ss) => {
        if (!ss || !ss.settings) {
            return;
        }
        ss.settings.map((s) => {
            s.settings.map((o) => {
                if (o.key && o.key.length > 0) {
                    o.value = fetchStoreValue(o.key);
                    o.globalIndex = index;
                    o.defaultValue = fetchDefaultValue(o.key);
                    globalValueReference.push({ ...o });
                    index++;
                }
            });
        });
    });

    return [settingsSections, globalValueReference];
}

function applyEEPROMDescriptions(
    settings: SettingsMenuSection[],
    descriptions: EEPROMDescriptions,
    ctrlType: string,
    fwVersion: string,
    firmwareCurrent: boolean,
): SettingsMenuSection[] {
    return settings.map((ss) => {
        if (!ss || !ss.settings) {
            return ss;
        }
        return {
            ...ss,
            settings: ss.settings.map((s) => ({
                ...s,
                settings: s.settings.map((o) => {
                    if (o.type !== 'eeprom') {
                        return o;
                    }
                    let eID = get(o, 'eID', null);
                    let remapped = false;
                    if (Object.hasOwn(o, 'remap') && firmwareCurrent) {
                        eID = get(o, 'remap', null);
                        remapped = true;
                    }
                    if (ctrlType === GRBLHAL && eID) {
                        eID = translateGrblCoreKey(
                            eID as EEPROM,
                            fwVersion,
                        );
                    }
                    if (!eID) {
                        return remapped ? { ...o, remapped: true } : o;
                    }
                    const oKey = Number(eID.replace('$', ''));
                    const oEEPROM = get(descriptions, oKey, '');
                    if (!oEEPROM) {
                        return remapped ? { ...o, remapped: true } : o;
                    }
                    return {
                        ...o,
                        ...(remapped ? { remapped: true } : {}),
                        description: get(oEEPROM, 'details', ''),
                        label: get(oEEPROM, 'description', ''),
                    };
                }),
            })),
        };
    });
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] =
        useState<SettingsMenuSection[]>(SettingsMenu);
    const [EEPROM, setEEPROM] = useState<FilteredEEPROM[]>([
        {
            unit: '',
            setting: '$',
            globalIndex: 0,
            value: '',
            group: '',
            groupID: 0,
        },
    ]);
    const [machineProfile, setMachineProfile] = useState<MachineProfile>(
        {} as MachineProfile,
    );
    const [connected, setConnected] = useState(false);
    const [settingsAreDirty, setSettingsAreDirty] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [settingsValues, setSettingsValues] = useState<gSenderSetting[]>([]);
    const [filterNonDefault, setFilterNonDefault] = useState(false);
    const [isFirmwareCurrent, setIsFirmwareCurrent] = useState(false);

    const firmwareVersion = useTypedSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );

    useEffect(() => {
        setIsFirmwareCurrent(firmwarePastVersion(ATCI_SUPPORTED_VERSION));
    }, [firmwareVersion]);

    const detectedEEPROM = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );

    const detectedEEPROMDescriptions = useSelector(
        (state: RootState) => state.controller.settings.descriptions,
    );

    const detectedEEPROMGroups = useSelector(
        (state: RootState) => state.controller.settings.groups,
    );

    const controllerType = useSelector(
        (state: RootState) => state.controller.type,
    );

    const connectionState = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const BASE_SETTINGS_MAP =
        controllerType === GRBLHAL ? GRBL_HAL_SETTINGS_MAP : GRBL_SETTINGS_MAP;

    const eepromMap = useMemo(
        () => new Map(EEPROM.map((e) => [e.setting, e])),
        [EEPROM],
    );

    useEffect(() => {
        const storeMachineProfile: MachineProfile = store.get(
            'workspace.machineProfile',
            {},
        );
        // lookup latest values as set for this machine ID
        const latest: MachineProfile = machineProfiles.find(
            (o) => o.id === storeMachineProfile.id,
        );

        if (!latest) {
            console.error(
                'No machine profile with this ID found, using previous value.',
            );
            return setMachineProfile(storeMachineProfile);
        }
        setMachineProfile(latest);
    }, []);

    function repopulateSettings() {
        const [populatedSettings, globalValues] =
            populateSettingsValues(settings);
        setSettings([...populatedSettings]);
        setSettingsValues([...globalValues]);
    }

    function repopulateEEPROM() {
        const detectedE = get(
            reduxStore.getState(),
            'controller.settings.settings',
        );
        const detectedDesc = get(
            reduxStore.getState(),
            'controller.settings.descriptions',
        );
        const detectedGroups = get(
            reduxStore.getState(),
            'controller.settings.groups',
        );
        setEEPROM(
            getFilteredEEPROMSettings(
                BASE_SETTINGS_MAP,
                detectedE,
                detectedDesc,
                detectedGroups,
            ),
        );
    }

    // Fires on EEPROM value/group changes — fast path, does NOT re-run applyEEPROMDescriptions
    const updateEEPROM = useCallback(
        debounce(
            (
                baseSettingsMap: Map<EEPROM, any>,
                detectedEEPROM: EEPROMSettings,
                detectedEEPROMDescriptions: EEPROMDescriptions,
                detectedEEPROMGroups: BasicObject,
                currentEEPROM: FilteredEEPROM[],
            ) => {
                const filteredEEPROMSettings = getFilteredEEPROMSettings(
                    baseSettingsMap,
                    detectedEEPROM,
                    detectedEEPROMDescriptions,
                    detectedEEPROMGroups,
                );
                const dirtyMap = new Map(
                    currentEEPROM
                        .filter((e) => e.dirty)
                        .map((e) => [e.setting, e]),
                );
                setEEPROM(
                    filteredEEPROMSettings.map(
                        (eeprom) => dirtyMap.get(eeprom.setting) ?? eeprom,
                    ),
                );
            },
            100,
        ),
        [],
    );

    // Fires only when descriptions change — runs once on connect
    const updateDescriptions = useCallback(
        debounce(
            (
                currentSettings: SettingsMenuSection[],
                detectedEEPROMDescriptions: EEPROMDescriptions,
                ctrlType: string,
                fwVersion: string,
            ) => {
                if (!currentSettings.length || !detectedEEPROMDescriptions) {
                    return;
                }
                const firmwareCurrent = firmwarePastVersion(
                    ATCI_SUPPORTED_VERSION,
                );
                setSettings(
                    applyEEPROMDescriptions(
                        currentSettings,
                        detectedEEPROMDescriptions,
                        ctrlType,
                        fwVersion,
                        firmwareCurrent,
                    ),
                );
            },
            200,
        ),
        [],
    );

    useEffect(() => {
        repopulateSettings();
        pubsub.subscribe('repopulate', () => {
            repopulateSettings();
        });
        pubsub.subscribe('eeprom:repopulate', () => {
            repopulateEEPROM();
        });
    }, []);

    useEffect(() => {
        setConnected(connectionState);
    }, [connectionState]);

    useEffect(() => {
        updateEEPROM(
            BASE_SETTINGS_MAP,
            detectedEEPROM,
            detectedEEPROMDescriptions,
            detectedEEPROMGroups,
            EEPROM,
        );
    }, [detectedEEPROM, detectedEEPROMGroups]);

    useEffect(() => {
        updateDescriptions(
            settings,
            detectedEEPROMDescriptions,
            controllerType,
            firmwareVersion,
        );
    }, [detectedEEPROMDescriptions]);

    function checkIfModified(v: gSenderSetting) {
        if (v.type === 'wizard' || v.type === 'event') {
            // we don't have defaults for these
            return false;
        }

        if (v.type === 'eeprom') {
            const EEPROMData = eepromMap.get(v.eID as EEPROM);
            // If filterNonDefault is enabled, make sure the current value equals the default value
            if (EEPROMData) {
                return !eepromIsDefault(EEPROMData);
            }
        }

        if (v.type === 'hybrid' && connected && controllerType === GRBLHAL) {
            return !eepromIsDefault(v);
        }

        if ('key' in v) {
            if ('defaultValue' in v) {
                return !isEqual(
                    settingsValues[v.globalIndex]?.value,
                    v.defaultValue,
                );
            }
            return false;
        }
    }

    function checkSearchTerm(v: gSenderSetting) {
        let searchChecker: any = v;
        if (v.type === 'eeprom') {
            let idToUse = v.eID;
            if (Object.hasOwn(v, 'remap') && isFirmwareCurrent) {
                idToUse = v.remap;
            }
            if (controllerType === GRBLHAL) {
                idToUse = translateGrblCoreKey(
                    idToUse as EEPROM,
                    firmwareVersion,
                );
            }
            searchChecker = eepromMap.get(idToUse as EEPROM);
        }

        return JSON.stringify(searchChecker)
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
    }

    /**
     * Filter for general settings.
     * Filter EEPROM if not connected
     * Filter EEPROM if no Value
     * Filter remaining by matching search term
     * @param v - The setting to filter
     */
    const settingsFilter = useCallback((v: gSenderSetting) => {
        // ***first, check conditions that are always applicable

        // Hide hidden when filtering
        if ('hidden' in v && (!searchTerm || searchTerm.length === 0)) {
            if (v.hidden()) {
                // only return if it's supposed to be hidden, otherwise we have more to check
                return false;
            }
        }
        // Always exclude eeprom/hybrids when not connected
        if (v.type === 'eeprom' || v.type === 'hybrid') {
            if (!connectionState) {
                return false;
            }

            let idToUse = v.eID;
            if (Object.hasOwn(v, 'remap') && isFirmwareCurrent) {
                idToUse = v.remap;
            }
            if (controllerType === GRBLHAL) {
                idToUse = translateGrblCoreKey(
                    idToUse as EEPROM,
                    firmwareVersion,
                );
            }
            if (v.type === 'eeprom') {
                if (!eepromMap.has(idToUse as EEPROM)) {
                    return false;
                }
            }
        }

        // ***then, consider defaults and searching
        const modified = checkIfModified(v);
        const searched = checkSearchTerm(v);

        if (searchTerm.length === 0 || !searchTerm) {
            // if no search, check modified
            if (filterNonDefault) {
                return modified;
            }
            return true;
        } else {
            // if search, consider both
            if (filterNonDefault) {
                return modified && searched;
            }
            return searched;
        }
    }, [connectionState, eepromMap, isFirmwareCurrent, controllerType, firmwareVersion, searchTerm, filterNonDefault, settingsValues]);

    function eepromIsDefault(settingData: gSenderSetting | FilteredEEPROM) {
        const profileDefaults =
            controllerType === 'Grbl'
                ? machineProfile.eepromSettings
                : resolveGrblCoreDefaults({
                      firmwareSemver: firmwareVersion,
                      baseDefaults: machineProfile.grblHALeepromSettings || {},
                  }).defaults;

        const settingKey =
            (settingData as gSenderSetting).type === 'hybrid'
                ? (settingData as gSenderSetting).eID
                : (settingData as FilteredEEPROM).setting;
        const lookupKey =
            controllerType === GRBLHAL
                ? translateGrblCoreKey(settingKey as EEPROM, firmwareVersion)
                : settingKey;

        const inputDefault = get(profileDefaults, lookupKey, '-');

        if (inputDefault === '-') {
            return true; // default in cases where we don't know the default
        }

        // if we are checking default for numbers, we need to include decimals
        if (
            (settingData as gSenderSetting).type === 'hybrid' ||
            Number((settingData as FilteredEEPROM).dataType) === 5 || // integer
            Number((settingData as FilteredEEPROM).dataType) === 6 // decimal
        ) {
            return isEqual(
                Number(settingData.value).toFixed(3),
                Number(inputDefault).toFixed(3),
            );
        }

        return isEqual(settingData.value, inputDefault);
    }

    function isSettingDefault(v: gSenderSetting) {
        if (v.type === 'hybrid' && connected && controllerType === GRBLHAL) {
            return eepromIsDefault(v);
        }
        if ('key' in v) {
            return isEqual(v.value, v.defaultValue);
        }
        return true; // Default to true, so non-key settings aren't always highlighted.
    }

    function toggleFilterNonDefault() {
        setFilterNonDefault(!filterNonDefault);
    }

    function getEEPROMDefaultValue(key: EEPROM): number | string {
        const profileDefaults =
            controllerType === 'Grbl'
                ? machineProfile.eepromSettings
                : resolveGrblCoreDefaults({
                      firmwareSemver: firmwareVersion,
                      baseDefaults: machineProfile.grblHALeepromSettings || {},
                  }).defaults;
        const lookupKey =
            controllerType === GRBLHAL
                ? translateGrblCoreKey(key, firmwareVersion)
                : key;

        return get(profileDefaults, lookupKey, '-');
    }

    const payload = {
        settings,
        EEPROM,
        eepromMap,
        setEEPROM,
        machineProfile,
        firmwareType: controllerType,
        setMachineProfile,
        connected,
        settingsAreDirty,
        setSettingsAreDirty,
        searchTerm,
        setSearchTerm,
        settingsValues,
        setSettingsValues,
        settingsFilter,
        toggleFilterNonDefault,
        filterNonDefault,
        eepromIsDefault,
        isSettingDefault,
        getEEPROMDefaultValue,
        isFirmwareCurrent,
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
