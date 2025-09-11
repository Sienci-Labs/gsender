import {
    gSenderSetting,
    SettingsMenu,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import store from 'app/store';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

import {
    GRBL_HAL_SETTINGS,
    GRBL_SETTINGS,
} from 'app/features/Config/assets/SettingsDescriptions.ts';
import { GRBLHAL } from 'app/constants';
import { getFilteredEEPROMSettings } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import defaultStoreState from 'app/store/defaultState';
import isEqual from 'lodash/isEqual';
import machineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';
import {
    EEPROM,
    EEPROMSettings,
    FilteredEEPROM,
    FIRMWARE_TYPES_T,
    MachineProfile,
} from 'app/definitions/firmware';
import pubsub from 'pubsub-js';

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: object;
    settingsToUpdate?: object;
    EEPROMToUpdate?: object;
    machineProfile: object;
    rawEEPROM: object;
    firmwareType: FIRMWARE_TYPES_T;
    setMachineProfile?: React.Dispatch<React.SetStateAction<MachineProfile>>;
    setEEPROM?: React.Dispatch<React.SetStateAction<EEPROMSettings>>;
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
    eepromIsDefault: (v: object) => boolean;
    isSettingDefault: (v: object) => boolean;
    getEEPROMDefaultValue: (v: EEPROM) => string | number;
}

interface SettingsProviderProps {
    children: React.ReactNode;
}

const defaultState: iSettingsContext = {
    settings: SettingsMenu,
    settingsToUpdate: {},
    EEPROMToUpdate: {},
    EEPROM: {},
    getEEPROMDefaultValue(_v: EEPROM): string | number {
        return undefined;
    },
    isSettingDefault(v: object): boolean {
        return false;
    },
    rawEEPROM: {},
    machineProfile: {},
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
    const [rawEEPROM, setRawEEPROM] = useState<object>({});
    const [machineProfile, setMachineProfile] = useState<MachineProfile>(
        {} as MachineProfile,
    );
    const [connected, setConnected] = useState(false);
    const [settingsAreDirty, setSettingsAreDirty] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [settingsValues, setSettingsValues] = useState<gSenderSetting[]>([]);
    const [filterNonDefault, setFilterNonDefault] = useState(false);

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

    const BASE_SETTINGS =
        controllerType === GRBLHAL ? GRBL_HAL_SETTINGS : GRBL_SETTINGS;

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

    useEffect(() => {
        repopulateSettings();
        pubsub.subscribe('repopulate', () => {
            return repopulateSettings();
        });
    }, []);

    useEffect(() => {
        setRawEEPROM(detectedEEPROM);
    }, [detectedEEPROM]);

    useEffect(() => {
        setConnected(connectionState);
    }, [connectionState]);

    useEffect(() => {
        setEEPROM(
            getFilteredEEPROMSettings(
                BASE_SETTINGS,
                detectedEEPROM,
                detectedEEPROMDescriptions,
                detectedEEPROMGroups,
            ),
        );
    }, [detectedEEPROM, detectedEEPROMDescriptions, detectedEEPROMGroups]);

    /**
     * Filter for general settings.
     * Filter EEPROM if not connected
     * Filter EEPROM if no Value
     * Filter remaining by matching search term
     * @param v - The setting to filter
     */
    function settingsFilter(v: gSenderSetting) {
        if (filterNonDefault) {
            if (v.type === 'wizard' || v.type === 'event') {
                // we don't have defaults for these
                return false;
            }
        }

        // Hide hidden when filtering
        if ('hidden' in v && (!searchTerm || searchTerm.length === 0)) {
            if (v.hidden()) {
                // only return if it's supposed to be hidden, otherwise we have more to check
                return false;
            }
        }

        if (v.type === 'eeprom') {
            // Always exclude eeprom/hybrids when not connected
            if (!connectionState) {
                return false;
            }
            const EEPROMData = EEPROM.find((s) => s.setting === v.eID);

            // can't find a relevant value, we hide it, unless it's a hybrid, where we use the fallback
            if (!EEPROMData) {
                return false;
            }
            // If filterNonDefault is enabled, make sure the current value equals the default value
            if (filterNonDefault) {
                if (EEPROMData) {
                    return !eepromIsDefault(EEPROMData);
                }
                return false; // We don't know, default to hide
            }
        }

        if (v.type === 'hybrid') {
            // Always exclude eeprom/hybrids when not connected
            if (!connectionState) {
                return false;
            }
            // If filterNonDefault is enabled, make sure the current value equals the default value
            if (filterNonDefault) {
                return !eepromIsDefault(v);
            }
        }

        // Filter non-default gSender settings if they are store values (have a key)
        if (filterNonDefault && 'key' in v) {
            if ('defaultValue' in v) {
                return !isEqual(
                    settingsValues[v.globalIndex].value,
                    v.defaultValue,
                );
            }
            return false;
        }

        if (searchTerm.length === 0 || !searchTerm) {
            return true;
        }

        if (v)
            return JSON.stringify(v)
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
    }

    function eepromIsDefault(settingData: gSenderSetting | FilteredEEPROM) {
        const profileDefaults =
            controllerType === 'Grbl'
                ? machineProfile.eepromSettings
                : machineProfile.grblHALeepromSettings;

        const settingKey =
            (settingData as gSenderSetting).type === 'hybrid'
                ? (settingData as gSenderSetting).eID
                : (settingData as FilteredEEPROM).setting;

        const inputDefault = get(profileDefaults, settingKey, '-');

        if (inputDefault === '-') {
            return true; // default in cases where we don't know the default
        }

        // Lookup hybrid current value because stored value is actually the local state
        if ((settingData as gSenderSetting).type === 'hybrid') {
            return isEqual(
                Number(detectedEEPROM[settingKey]).toFixed(3),
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
                : machineProfile.grblHALeepromSettings;

        return get(profileDefaults, key, '-');
    }

    // Populate eeprom descriptions as needed
    useEffect(() => {
        if (!settings.length) {
            return;
        }
        settings.map((ss) => {
            if (!ss || !ss.settings) {
                return;
            }
            ss.settings.map((s) => {
                s.settings.map((o) => {
                    if (o.type == 'eeprom') {
                        const eID = get(o, 'eID', null);
                        if (eID) {
                            let oKey = Number(eID.replace('$', ''));
                            let oEEPROM = get(
                                detectedEEPROMDescriptions,
                                oKey,
                                '',
                            );
                            if (oEEPROM) {
                                o.description = get(oEEPROM, 'details', '');
                                o.label = get(oEEPROM, 'description', '');
                            }
                        }
                    }
                });
            });
        });
    }, [detectedEEPROM, detectedEEPROMDescriptions, detectedEEPROMGroups]);

    const payload = {
        settings,
        EEPROM,
        setEEPROM,
        machineProfile,
        firmwareType: controllerType,
        rawEEPROM,
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
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
